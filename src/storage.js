const STORAGE_KEY = 'language-learning-progress';

/** فاصله مرور هر جعبه لایتنر (به ساعت) */
export const BOX_INTERVALS_HOURS = [
  0,      // جعبه ۱: فوری — همین جلسه
  4,      // جعبه ۲: چند ساعت بعد
  24,     // جعبه ۳: یک روز
  72,     // جعبه ۴: سه روز
  168,    // جعبه ۵: یک هفته
  336,    // جعبه ۶: دو هفته
];

export const MAX_BOX = BOX_INTERVALS_HOURS.length;

let onProgressChange = null;

export function setProgressChangeHandler(fn) {
  onProgressChange = fn;
}

export function emptyProgress() {
  return {
    wordStates: {},
    studiedLessons: [],
    stats: { totalReviews: 0, correctReviews: 0 },
    updatedAt: 0,
  };
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...emptyProgress(), ...parsed };
    }
  } catch {
    /* ignore */
  }
  return emptyProgress();
}

export function saveProgress(progress) {
  progress.updatedAt = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  onProgressChange?.(progress);
}

export function getWordState(progress, wordId) {
  return progress.wordStates[wordId] ?? null;
}

export function initWordForReview(progress, wordId) {
  if (!progress.wordStates[wordId]) {
    progress.wordStates[wordId] = {
      box: 1,
      nextReview: Date.now(),
      lastReviewed: null,
      timesSeen: 0,
      timesCorrect: 0,
      timesWrong: 0,
    };
    saveProgress(progress);
  }
  return progress.wordStates[wordId];
}

/** همه لغات یک درس را به صف مرور اضافه می‌کند */
export function addLessonWordsToReview(progress, wordIds) {
  for (const id of wordIds) {
    initWordForReview(progress, id);
  }
}

export function markLessonStudied(progress, lessonId) {
  if (!progress.studiedLessons.includes(lessonId)) {
    progress.studiedLessons.push(lessonId);
    saveProgress(progress);
  }
}

/**
 * پس از پاسخ در مرور:
 * - درست: جعبه بعدی (حداکثر MAX_BOX) — ولی همچنان در صف مرور می‌ماند
 * - غلط: برگشت به جعبه ۱
 */
export function recordReviewAnswer(progress, wordId, isCorrect) {
  const state = initWordForReview(progress, wordId);
  const now = Date.now();

  state.lastReviewed = now;
  state.timesSeen += 1;

  if (isCorrect) {
    state.timesCorrect += 1;
    state.box = Math.min(state.box + 1, MAX_BOX);
  } else {
    state.timesWrong += 1;
    state.box = 1;
  }

  const hours = BOX_INTERVALS_HOURS[state.box - 1] ?? 0;
  state.nextReview = now + hours * 60 * 60 * 1000;

  progress.stats.totalReviews += 1;
  if (isCorrect) progress.stats.correctReviews += 1;

  saveProgress(progress);
  return state;
}

export function resetProgress() {
  localStorage.removeItem(STORAGE_KEY);
}
