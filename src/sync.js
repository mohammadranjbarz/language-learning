import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase.js';
import { getUser } from './auth.js';
import { loadProgress, saveProgress, emptyProgress, setProgressChangeHandler } from './storage.js';

let syncStatus = 'idle'; // idle | syncing | synced | error
const statusListeners = new Set();
let saveTimer = null;

function setStatus(status) {
  syncStatus = status;
  for (const fn of statusListeners) fn(status);
}

export function getSyncStatus() {
  return syncStatus;
}

export function onSyncStatusChange(callback) {
  statusListeners.add(callback);
  callback(syncStatus);
  return () => statusListeners.delete(callback);
}

function pickBetterWordState(a, b) {
  if (!a) return { ...b };
  if (!b) return { ...a };
  if (a.box !== b.box) return a.box > b.box ? { ...a } : { ...b };
  if (a.timesSeen !== b.timesSeen) return a.timesSeen > b.timesSeen ? { ...a } : { ...b };
  return (a.lastReviewed || 0) >= (b.lastReviewed || 0) ? { ...a } : { ...b };
}

export function mergeProgress(local, cloud) {
  const base = emptyProgress();
  const merged = {
    ...base,
    studiedLessons: [
      ...new Set([...(local.studiedLessons ?? []), ...(cloud.studiedLessons ?? [])]),
    ],
    wordStates: {},
    stats: { totalReviews: 0, correctReviews: 0 },
    updatedAt: Date.now(),
  };

  const ids = new Set([
    ...Object.keys(local.wordStates ?? {}),
    ...Object.keys(cloud.wordStates ?? {}),
  ]);

  for (const id of ids) {
    merged.wordStates[id] = pickBetterWordState(local.wordStates?.[id], cloud.wordStates?.[id]);
  }

  for (const state of Object.values(merged.wordStates)) {
    merged.stats.totalReviews += state.timesSeen ?? 0;
    merged.stats.correctReviews += state.timesCorrect ?? 0;
  }

  return merged;
}

function progressDocRef(uid) {
  return doc(db, 'users', uid, 'data', 'progress');
}

export async function loadCloudProgress(uid) {
  if (!db) return null;
  const snap = await getDoc(progressDocRef(uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    wordStates: data.wordStates ?? {},
    studiedLessons: data.studiedLessons ?? [],
    stats: data.stats ?? { totalReviews: 0, correctReviews: 0 },
    updatedAt: data.updatedAt ?? 0,
  };
}

export async function saveCloudProgress(uid, progress) {
  if (!db) return;
  const payload = {
    wordStates: progress.wordStates,
    studiedLessons: progress.studiedLessons,
    stats: progress.stats,
    updatedAt: progress.updatedAt ?? Date.now(),
  };
  await setDoc(progressDocRef(uid), payload);
}

export async function syncOnLogin(user) {
  if (!isFirebaseConfigured() || !user) return loadProgress();

  setStatus('syncing');
  try {
    const local = loadProgress();
    const cloud = await loadCloudProgress(user.uid);

    let merged;
    if (!cloud) {
      merged = { ...local, updatedAt: Date.now() };
      if (Object.keys(local.wordStates).length > 0 || local.studiedLessons.length > 0) {
        await saveCloudProgress(user.uid, merged);
      }
    } else if (
      (local.updatedAt ?? 0) === 0 &&
      Object.keys(local.wordStates).length === 0 &&
      local.studiedLessons.length === 0
    ) {
      merged = cloud;
    } else {
      merged = mergeProgress(local, cloud);
      await saveCloudProgress(user.uid, merged);
    }

    saveProgress(merged);
    setStatus('synced');
    return merged;
  } catch (err) {
    console.error('Sync failed:', err);
    setStatus('error');
    return loadProgress();
  }
}

export function scheduleCloudSave(progress) {
  const user = getUser();
  if (!user || !isFirebaseConfigured()) return;

  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    setStatus('syncing');
    try {
      await saveCloudProgress(user.uid, progress);
      setStatus('synced');
    } catch (err) {
      console.error('Cloud save failed:', err);
      setStatus('error');
    }
  }, 800);
}

export function initSync(onProgressSynced) {
  if (!isFirebaseConfigured()) return;

  setProgressChangeHandler((p) => {
    scheduleCloudSave(p);
    onProgressSynced?.(p);
  });
}
