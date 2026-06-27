import { BOX_INTERVALS_HOURS, MAX_BOX } from './storage.js';

/**
 * لغاتی که زمان مرورشان رسیده یا هرگز دیده نشده‌اند
 */
export function getDueWords(allWords, progress) {
  const now = Date.now();
  const due = [];
  const notStarted = [];

  for (const word of allWords) {
    const state = progress.wordStates[word.id];
    if (!state) {
      notStarted.push(word);
      continue;
    }
    if (state.nextReview <= now) {
      due.push({ word, state, priority: state.box });
    }
  }

  due.sort((a, b) => a.priority - b.priority);

  return { due, notStarted };
}

/**
 * انتخاب لغت بعدی برای مرور
 * اولویت: لغات سررسید (جعبه پایین‌تر اول) → لغات جدید
 */
export function pickNextReviewWord(allWords, progress, excludeId = null) {
  const { due, notStarted } = getDueWords(allWords, progress);

  const candidates = [
    ...due.filter((d) => d.word.id !== excludeId),
    ...notStarted.filter((w) => w.id !== excludeId).map((w) => ({ word: w, state: null })),
  ];

  if (candidates.length === 0) {
    const withState = allWords
      .filter((w) => w.id !== excludeId && progress.wordStates[w.id])
      .map((w) => ({ word: w, state: progress.wordStates[w.id] }))
      .sort((a, b) => a.state.nextReview - b.state.nextReview);

    return withState[0] ?? null;
  }

  return candidates[0];
}

export function getRandomQuiz(word) {
  const quizzes = word.quiz ?? [];
  if (quizzes.length === 0) return null;
  return quizzes[Math.floor(Math.random() * quizzes.length)];
}

export function getBoxLabel(box) {
  const hours = BOX_INTERVALS_HOURS[box - 1] ?? 0;
  if (hours === 0) return 'فوری';
  if (hours < 24) return `${hours} ساعت`;
  const days = hours / 24;
  if (days === 1) return '۱ روز';
  if (days < 7) return `${days} روز`;
  const weeks = days / 7;
  if (weeks === 1) return '۱ هفته';
  return `${weeks} هفته`;
}

export function getReviewStats(allWords, progress) {
  const now = Date.now();
  let dueCount = 0;
  let inReview = 0;
  const boxCounts = Array(MAX_BOX).fill(0);

  for (const word of allWords) {
    const state = progress.wordStates[word.id];
    if (!state) continue;
    inReview += 1;
    boxCounts[state.box - 1] += 1;
    if (state.nextReview <= now) dueCount += 1;
  }

  return { dueCount, inReview, boxCounts, totalWords: allWords.length };
}

export function formatNextReview(nextReview) {
  const diff = nextReview - Date.now();
  if (diff <= 0) return 'الان';
  const hours = Math.ceil(diff / (1000 * 60 * 60));
  if (hours < 24) return `${hours} ساعت دیگر`;
  const days = Math.ceil(hours / 24);
  return `${days} روز دیگر`;
}
