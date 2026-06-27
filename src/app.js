import './styles.css';
import {
  loadProgress,
  saveProgress,
  addLessonWordsToReview,
  markLessonStudied,
  recordReviewAnswer,
  resetProgress,
  initWordForReview,
  emptyProgress,
  MAX_BOX,
} from './storage.js';
import {
  pickNextReviewWord,
  getRandomQuiz,
  getBoxLabel,
  getReviewStats,
  formatNextReview,
} from './leitner.js';
import { isFirebaseConfigured } from './firebase.js';
import {
  initAuth,
  getUser,
  onUserChange,
  signInWithGoogle,
  logout,
} from './auth.js';
import {
  initSync,
  syncOnLogin,
  getSyncStatus,
  onSyncStatusChange,
  saveCloudProgress,
} from './sync.js';

let data = null;
let progress = loadProgress();
let currentView = 'home';
let viewState = {};
let currentUser = getUser();
let syncStatus = getSyncStatus();
let authError = null;

const app = document.getElementById('app');

async function loadData() {
  const res = await fetch(`${import.meta.env.BASE_URL}data/vocabulary.json`);
  if (!res.ok) throw new Error('خطا در بارگذاری فایل لغات');
  data = await res.json();
}

function getAllWords() {
  return data.lessons.flatMap((l) => l.words);
}

function findWord(id) {
  return getAllWords().find((w) => w.id === id);
}

function findLesson(id) {
  return data.lessons.find((l) => l.id === id);
}

function navigate(view, state = {}) {
  currentView = view;
  viewState = state;
  render();
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'className') node.className = v;
    else if (k === 'textContent') node.textContent = v;
    else if (k === 'innerHTML') node.innerHTML = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v);
    else node.setAttribute(k, v);
  }
  for (const child of [].concat(children)) {
    if (child == null) continue;
    node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

function renderAuthBar() {
  const bar = el('div', { className: 'auth-bar' });

  if (!isFirebaseConfigured()) {
    return null;
  }

  if (currentUser) {
    const userInfo = el('div', { className: 'auth-user' });
    if (currentUser.photoURL) {
      userInfo.append(el('img', {
        className: 'auth-avatar',
        src: currentUser.photoURL,
        alt: currentUser.displayName ?? 'کاربر',
      }));
    }
    userInfo.append(
      el('span', { className: 'auth-name', textContent: currentUser.displayName ?? currentUser.email })
    );
    bar.append(userInfo);

    const syncLabel = {
      idle: '',
      syncing: 'در حال همگام‌سازی…',
      synced: 'همگام شد',
      error: 'خطا در همگام‌سازی',
    }[syncStatus];
    if (syncLabel) {
      bar.append(el('span', { className: `sync-badge sync-${syncStatus}`, textContent: syncLabel }));
    }

    bar.append(
      el('button', {
        className: 'btn btn-secondary btn-sm auth-logout',
        onClick: async () => {
          await logout();
        },
        textContent: 'خروج',
      })
    );
  } else {
    bar.append(
      el('p', { className: 'auth-hint', textContent: 'با گوگل وارد شوید تا پیشرفتتان بین دستگاه‌ها ذخیره شود' })
    );
    if (authError) {
      bar.append(el('p', { className: 'auth-error', textContent: authError }));
    }
    bar.append(
      el('button', {
        className: 'btn-google',
        onClick: async () => {
          authError = null;
          try {
            await signInWithGoogle();
          } catch (err) {
            authError = err.code === 'auth/popup-closed-by-user'
              ? 'پنجره ورود بسته شد'
              : 'خطا در ورود با گوگل';
            render();
          }
        },
      }, [
        el('span', { className: 'google-icon', innerHTML: googleIconSvg }),
        el('span', { textContent: 'ورود با گوگل' }),
      ])
    );
  }

  return bar;
}

const googleIconSvg = `<svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>`;

function renderHeader(title, backAction) {
  const header = el('header', { className: 'header' });
  if (backAction) {
    header.append(
      el('button', { className: 'btn-icon back-btn', onClick: backAction, 'aria-label': 'بازگشت' }, '→')
    );
  }
  header.append(el('h1', { className: 'header-title', textContent: title }));
  return header;
}

function renderHome() {
  const stats = getReviewStats(getAllWords(), progress);
  const studied = progress.studiedLessons.length;
  const totalLessons = data.lessons.length;

  const container = el('div', { className: 'page home-page' });
  container.append(renderAuthBar());
  container.append(
    el('div', { className: 'hero' }, [
      el('h1', { className: 'hero-title', textContent: data.meta.title }),
      el('p', { className: 'hero-desc', textContent: data.meta.description ?? '' }),
    ])
  );

  const cards = el('div', { className: 'mode-cards' });

  cards.append(
    el('button', { className: 'mode-card lessons-card', onClick: () => navigate('lessons') }, [
      el('span', { className: 'mode-icon', textContent: '📖' }),
      el('span', { className: 'mode-label', textContent: 'درس‌ها' }),
      el('span', { className: 'mode-desc', textContent: `${studied} از ${totalLessons} درس مطالعه شده` }),
    ])
  );

  cards.append(
    el('button', { className: 'mode-card review-card', onClick: () => navigate('review') }, [
      el('span', { className: 'mode-icon', textContent: '🔄' }),
      el('span', { className: 'mode-label', textContent: 'مرور (لایتنر)' }),
      el('span', { className: 'mode-desc', textContent: `${stats.dueCount} لغت آماده مرور` }),
    ])
  );

  container.append(cards);

  const statsBar = el('div', { className: 'stats-bar' });
  statsBar.append(
    el('div', { className: 'stat' }, [
      el('span', { className: 'stat-value', textContent: String(stats.totalWords) }),
      el('span', { className: 'stat-label', textContent: 'کل لغات' }),
    ]),
    el('div', { className: 'stat' }, [
      el('span', { className: 'stat-value', textContent: String(stats.inReview) }),
      el('span', { className: 'stat-label', textContent: 'در صف مرور' }),
    ]),
    el('div', { className: 'stat' }, [
      el('span', { className: 'stat-value', textContent: String(progress.stats.correctReviews) }),
      el('span', { className: 'stat-label', textContent: 'پاسخ درست' }),
    ])
  );
  container.append(statsBar);

  container.append(
    el('button', {
      className: 'btn-text reset-btn',
      onClick: async () => {
        if (confirm('پیشرفت ذخیره‌شده پاک شود؟')) {
          resetProgress();
          progress = loadProgress();
          if (currentUser) {
            await saveCloudProgress(currentUser.uid, emptyProgress());
          }
          render();
        }
      },
      textContent: 'پاک کردن پیشرفت',
    })
  );

  return container;
}

function renderLessons() {
  const container = el('div', { className: 'page' });
  container.append(renderHeader('درس‌ها', () => navigate('home')));

  const list = el('div', { className: 'lesson-list' });
  for (const lesson of data.lessons) {
    const studied = progress.studiedLessons.includes(lesson.id);
    const card = el('button', {
      className: `lesson-card${studied ? ' studied' : ''}`,
      onClick: () => navigate('lesson', { lessonId: lesson.id, wordIndex: 0 }),
    }, [
      el('div', { className: 'lesson-card-top' }, [
        el('h2', { className: 'lesson-title', textContent: lesson.title }),
        studied ? el('span', { className: 'badge studied-badge', textContent: '✓ مطالعه شده' }) : null,
      ]),
      el('p', { className: 'lesson-desc', textContent: lesson.description ?? '' }),
      el('span', { className: 'lesson-count', textContent: `${lesson.words.length} لغت` }),
    ]);
    list.append(card);
  }
  container.append(list);
  return container;
}

function renderLesson() {
  const lesson = findLesson(viewState.lessonId);
  if (!lesson) return el('div', { textContent: 'درس یافت نشد' });

  const wordIndex = viewState.wordIndex ?? 0;
  const word = lesson.words[wordIndex];
  if (!word) return el('div', { textContent: 'لغت یافت نشد' });

  const container = el('div', { className: 'page lesson-page' });
  container.append(
    renderHeader(lesson.title, () => navigate('lessons'))
  );

  const progressBar = el('div', { className: 'word-progress' });
  progressBar.append(
    el('span', { className: 'word-progress-text', textContent: `لغت ${wordIndex + 1} از ${lesson.words.length}` }),
    el('div', { className: 'progress-track' }, [
      el('div', {
        className: 'progress-fill',
        style: `width: ${((wordIndex + 1) / lesson.words.length) * 100}%`,
      }),
    ])
  );
  container.append(progressBar);

  const card = el('div', { className: 'word-card' });
  card.append(el('div', { className: 'word-main', textContent: word.word }));
  card.append(el('div', { className: 'word-fa', textContent: word.translationFa }));
  card.append(el('div', { className: 'word-en-def', textContent: word.translationEn }));

  const sentences = el('div', { className: 'sentences' });
  sentences.append(el('h3', { className: 'section-title', textContent: 'جملات نمونه' }));
  for (const s of word.sentences ?? []) {
    sentences.append(
      el('div', { className: 'sentence-item' }, [
        el('p', { className: 'sentence-en', textContent: s.en }),
        el('p', { className: 'sentence-fa', textContent: s.fa }),
      ])
    );
  }
  card.append(sentences);
  container.append(card);

  const nav = el('div', { className: 'lesson-nav' });
  const isLast = wordIndex >= lesson.words.length - 1;
  const isFirst = wordIndex === 0;

  if (!isFirst) {
    nav.append(
      el('button', {
        className: 'btn btn-secondary',
        onClick: () => navigate('lesson', { lessonId: lesson.id, wordIndex: wordIndex - 1 }),
        textContent: 'لغت قبل',
      })
    );
  }

  if (!isLast) {
    nav.append(
      el('button', {
        className: 'btn btn-primary',
        onClick: () => {
          initWordForReview(progress, word.id);
          navigate('lesson', { lessonId: lesson.id, wordIndex: wordIndex + 1 });
        },
        textContent: 'لغت بعد',
      })
    );
  } else {
    nav.append(
      el('button', {
        className: 'btn btn-primary',
        onClick: () => {
          const wordIds = lesson.words.map((w) => w.id);
          addLessonWordsToReview(progress, wordIds);
          markLessonStudied(progress, lesson.id);
          navigate('lesson-quiz', { lessonId: lesson.id, quizIndex: 0 });
        },
        textContent: 'شروع آزمون درس',
      })
    );
  }

  container.append(nav);
  return container;
}

function renderLessonQuiz() {
  const lesson = findLesson(viewState.lessonId);
  if (!lesson) return el('div', { textContent: 'درس یافت نشد' });

  const allQuizzes = lesson.words.flatMap((w) =>
    (w.quiz ?? []).map((q) => ({ word: w, quiz: q }))
  );

  const quizIndex = viewState.quizIndex ?? 0;
  const current = allQuizzes[quizIndex];

  if (!current) {
    const container = el('div', { className: 'page' });
    container.append(renderHeader('پایان آزمون', () => navigate('lessons')));
    container.append(
      el('div', { className: 'quiz-done' }, [
        el('div', { className: 'quiz-done-icon', textContent: '🎉' }),
        el('h2', { textContent: 'آزمون درس تمام شد!' }),
        el('p', { textContent: 'لغات این درس به صف مرور لایتنر اضافه شدند.' }),
        el('button', {
          className: 'btn btn-primary',
          onClick: () => navigate('review'),
          textContent: 'برو به مرور',
        }),
      ])
    );
    return container;
  }

  const { word, quiz } = current;
  const container = el('div', { className: 'page quiz-page' });
  container.append(renderHeader(`آزمون — ${lesson.title}`, () => navigate('lessons')));

  container.append(
    el('div', { className: 'quiz-progress' }, [
      el('span', { textContent: `سوال ${quizIndex + 1} از ${allQuizzes.length}` }),
      el('span', { className: 'quiz-word-tag', textContent: word.word }),
    ])
  );

  const quizCard = el('div', { className: 'quiz-card' });
  quizCard.append(el('p', { className: 'quiz-question-fa', textContent: quiz.questionFa ?? quiz.question }));
  if (quiz.questionFa && quiz.question) {
    quizCard.append(el('p', { className: 'quiz-question-en', textContent: quiz.question }));
  }

  const options = el('div', { className: 'quiz-options' });
  let answered = false;

  quiz.options.forEach((opt, i) => {
    const btn = el('button', {
      className: 'quiz-option',
      textContent: opt,
      onClick: () => {
        if (answered) return;
        answered = true;
        const correct = i === quiz.correctIndex;
        btn.classList.add(correct ? 'correct' : 'wrong');
        if (!correct) {
          options.children[quiz.correctIndex]?.classList.add('correct');
        }
        recordReviewAnswer(progress, word.id, correct);

        setTimeout(() => {
          navigate('lesson-quiz', { lessonId: lesson.id, quizIndex: quizIndex + 1 });
        }, 1200);
      },
    });
    options.append(btn);
  });

  quizCard.append(options);
  container.append(quizCard);
  return container;
}

function renderReview() {
  const stats = getReviewStats(getAllWords(), progress);
  const container = el('div', { className: 'page review-page' });
  container.append(renderHeader('مرور لایتنر', () => navigate('home')));

  const boxViz = el('div', { className: 'leitner-boxes' });
  boxViz.append(el('h3', { className: 'section-title', textContent: 'جعبه‌های لایتنر' }));
  const boxes = el('div', { className: 'boxes-row' });
  for (let i = 0; i < MAX_BOX; i++) {
    boxes.append(
      el('div', { className: 'leitner-box' }, [
        el('span', { className: 'box-num', textContent: String(i + 1) }),
        el('span', { className: 'box-count', textContent: String(stats.boxCounts[i] ?? 0) }),
        el('span', { className: 'box-interval', textContent: getBoxLabel(i + 1) }),
      ])
    );
  }
  boxViz.append(boxes);
  container.append(boxViz);

  if (stats.inReview === 0) {
    container.append(
      el('div', { className: 'empty-state' }, [
        el('p', { textContent: 'هنوز لغتی در صف مرور نیست.' }),
        el('p', { textContent: 'اول یک درس را بخوانید و آزمونش را بدهید.' }),
        el('button', {
          className: 'btn btn-primary',
          onClick: () => navigate('lessons'),
          textContent: 'رفتن به درس‌ها',
        }),
      ])
    );
    return container;
  }

  const next = pickNextReviewWord(getAllWords(), progress);
  if (!next) {
    container.append(el('p', { textContent: 'لغتی برای مرور نیست.' }));
    return container;
  }

  const { word, state } = next;
  const quiz = getRandomQuiz(word);

  if (!quiz) {
    container.append(el('p', { textContent: 'سوالی برای این لغت تعریف نشده.' }));
    return container;
  }

  const info = el('div', { className: 'review-info' });
  if (state) {
    info.append(
      el('span', { className: 'review-box-badge', textContent: `جعبه ${state.box}` }),
      el('span', { className: 'review-next', textContent: formatNextReview(state.nextReview) })
    );
  } else {
    info.append(el('span', { className: 'review-box-badge new', textContent: 'لغت جدید' }));
  }
  info.append(el('span', { className: 'review-word-hint', textContent: word.word }));
  container.append(info);

  container.append(
    el('p', { className: 'due-count', textContent: `${stats.dueCount} لغت آماده مرور` })
  );

  const quizCard = el('div', { className: 'quiz-card' });
  quizCard.append(el('p', { className: 'quiz-question-fa', textContent: quiz.questionFa ?? quiz.question }));
  if (quiz.questionFa && quiz.question) {
    quizCard.append(el('p', { className: 'quiz-question-en', textContent: quiz.question }));
  }

  const options = el('div', { className: 'quiz-options' });
  let answered = false;

  const feedback = el('div', { className: 'review-feedback hidden' });

  quiz.options.forEach((opt, i) => {
    const btn = el('button', {
      className: 'quiz-option',
      textContent: opt,
      onClick: () => {
        if (answered) return;
        answered = true;
        const correct = i === quiz.correctIndex;
        btn.classList.add(correct ? 'correct' : 'wrong');
        if (!correct) {
          options.children[quiz.correctIndex]?.classList.add('correct');
        }

        const newState = recordReviewAnswer(progress, word.id, correct);
        feedback.classList.remove('hidden');
        feedback.innerHTML = correct
          ? `✓ درست! → جعبه ${newState.box} (${getBoxLabel(newState.box)})`
          : `✗ غلط! برگشت به جعبه ۱`;

        setTimeout(() => render(), 1500);
      },
    });
    options.append(btn);
  });

  quizCard.append(options);
  quizCard.append(feedback);

  const hint = el('details', { className: 'word-hint-details' }, [
    el('summary', { textContent: 'راهنمای لغت' }),
    el('p', { textContent: `${word.translationFa} — ${word.translationEn}` }),
  ]);
  quizCard.append(hint);

  container.append(quizCard);
  return container;
}

function render() {
  if (!data) return;

  app.innerHTML = '';

  let content;
  switch (currentView) {
    case 'home':
      content = renderHome();
      break;
    case 'lessons':
      content = renderLessons();
      break;
    case 'lesson':
      content = renderLesson();
      break;
    case 'lesson-quiz':
      content = renderLessonQuiz();
      break;
    case 'review':
      content = renderReview();
      break;
    default:
      content = renderHome();
  }

  app.append(content);
}

async function init() {
  app.innerHTML = '<div class="loading">در حال بارگذاری...</div>';

  if (isFirebaseConfigured()) {
    initAuth();
    initSync();

    onUserChange(async (user) => {
      currentUser = user;
      authError = null;
      if (user) {
        progress = await syncOnLogin(user);
      }
      render();
    });

    onSyncStatusChange((status) => {
      syncStatus = status;
      if (currentView === 'home') render();
    });
  }

  try {
    await loadData();
    render();
  } catch (err) {
    app.innerHTML = `<div class="error">${err.message}</div>`;
  }
}

init();
