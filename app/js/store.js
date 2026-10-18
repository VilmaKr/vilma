// Progress, spaced repetition and streak. Saved on this device for now;
// the same shape will later be synced to the student's account.
const KEY = "elena-progress-v1";
// Days before an item comes back, by box. A right answer moves it up a box,
// a wrong answer sends it back to box 0 (tomorrow).
export const INTERVALS = [1, 2, 4, 7, 15, 30];

const empty = () => ({
  lessons: {},      // id -> { suns, best, done }
  cards: {},        // id -> { box, due, seen, wrong, kind, ref }
  streak: { count: 0, last: null, rest: null },
  level: null,      // set by the level test
  startTown: 0,
});

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...empty(), ...JSON.parse(raw) };
  } catch (e) { /* storage blocked: keep progress in memory only */ }
  return empty();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
}

export const today = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);

export function get() { return state; }
export function reset() { state = empty(); save(); }

/* ----- lessons ----- */
export function lessonResult(id, score) {
  const suns = score >= 0.9 ? 3 : score >= 0.7 ? 2 : 1;
  const prev = state.lessons[id] || { suns: 0, best: 0 };
  state.lessons[id] = { suns: Math.max(prev.suns, suns), best: Math.max(prev.best, score), done: true };
  touchStreak();
  save();
  return suns;
}
export const totalSuns = () => Object.values(state.lessons).reduce((n, l) => n + (l.suns || 0), 0);

/* ----- spaced repetition ----- */
// kind: "word" (ref = {mk,en}) or "item" (ref = {lesson, index})
export function addWord(id, ref) {
  if (state.cards[id]) return;
  state.cards[id] = { box: 0, due: today() + INTERVALS[0], seen: 0, wrong: 0, kind: "word", ref };
  save();
}
export function seeCard(id, kind, ref, correct) {
  const t = today();
  const isNew = !state.cards[id];
  const c = state.cards[id] || { box: 0, due: t + 1, seen: 0, wrong: 0, kind, ref };
  c.seen++;
  if (correct) {
    // A first right answer on a new question waits 2 days; after that each right answer moves it up a box.
    c.box = isNew ? 1 : Math.min(c.box + 1, INTERVALS.length - 1);
  } else {
    c.wrong++;
    c.box = 0;
  }
  c.due = t + INTERVALS[c.box];
  c.kind = kind; c.ref = ref;
  state.cards[id] = c;
  save();
}
export function dueCards() {
  const t = today();
  return Object.entries(state.cards).filter(([, c]) => c.due <= t).map(([id, c]) => ({ id, ...c }));
}
export function nextDueIn() {
  const t = today();
  const dues = Object.values(state.cards).map((c) => c.due - t).filter((d) => d > 0);
  return dues.length ? Math.min(...dues) : null;
}
export function words() {
  return Object.entries(state.cards).filter(([, c]) => c.kind === "word").map(([id, c]) => ({ id, ...c }));
}

/* ----- streak (forgives one missed day per week) ----- */
export function touchStreak() {
  const t = today();
  const s = state.streak;
  if (s.last === t) return;
  const gap = s.last == null ? null : t - s.last;
  if (gap === 1) s.count++;
  else if (gap === 2 && (s.rest == null || t - s.rest >= 7)) { s.count++; s.rest = t; }
  else s.count = 1;
  s.last = t;
  save();
}
export function streakNow() {
  const s = state.streak;
  if (s.last == null) return 0;
  const gap = today() - s.last;
  if (gap <= 1) return s.count;
  if (gap === 2 && (s.rest == null || today() - s.rest >= 7)) return s.count;
  return 0;
}

export function setLevel(level, startTown) {
  state.level = level;
  state.startTown = startTown;
  save();
}
