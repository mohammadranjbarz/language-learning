import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase.js';

const provider = new GoogleAuthProvider();

let currentUser = null;
const listeners = new Set();

function notify() {
  for (const fn of listeners) fn(currentUser);
}

export function getUser() {
  return currentUser;
}

export function onUserChange(callback) {
  listeners.add(callback);
  callback(currentUser);
  return () => listeners.delete(callback);
}

export function initAuth() {
  if (!isFirebaseConfigured() || !auth) return;

  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    notify();
  });
}

export async function signInWithGoogle() {
  if (!auth) throw new Error('Firebase تنظیم نشده است');
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function logout() {
  if (!auth) return;
  await signOut(auth);
}
