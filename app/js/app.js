// Screens and navigation (hash routes): #/ · #/lesson/<id> · #/review · #/notebook · #/test
import { elena, sun, SCENES } from "./art.js";
import { RENDER, SCORED, esc, shuffle } from "./exercises.js";
import * as store from "./store.js";
import { TOWNS, COMING, LESSONS, lessonById, PLACEMENT } from "../content/course.js";

const view = document.getElementById("view");
const PRAISE = [["Браво!", "Well done!"], ["Одлично!", "Excellent!"], ["Точно!", "Correct!"], ["Супер!", "Great!"], ["Многу добро!", "Very good!"]];
const COMFORT = [["Речиси!", "Almost!"], ["Не баш…", "Not quite…"], ["Ништо страшно!", "No problem!"]];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const sunsHTML = (n, of = 3) => `<span class="suns" aria-label="${n} of ${of} suns">${Array.from({ length: of }, (_, i) => sun(i < n)).join("")}</span>`;

// Every word taught in a "learn" step, for review questions and distractors.
const VOCAB = LESSONS.flatMap((l) => l.steps.filter((s) => s.t === "learn").map((s) => ({ id: "w:" + s.mk, mk: s.mk, en: s.en, pic: s.pic, ex: s.ex })));

/* ---------- helpers ---------- */
function unlocked(lesson) {
  const st = store.get();
  if (lesson.townIndex < st.startTown) return true;
  if (lesson.townIndex === st.startTown && lesson.index === 0) return true;
  const i = LESSONS.indexOf(lesson);
  return i === 0 || !!st.lessons[LESSONS[i - 1].id]?.done;
}
function nextLesson() {
  const st = store.get();
  const open = (l) => unlocked(l) && !st.lessons[l.id]?.done;
  // After the level test, continue from the starting town; earlier towns stay open for review.
  return LESSONS.find((l) => l.townIndex >= st.startTown && open(l)) || LESSONS.find(open) || null;
}
function setNav(route) {
  document.querySelectorAll(".nav a").forEach((a) => a.classList.toggle("on", a.dataset.r === route));
  const due = store.dueCards().length;
  const badge = document.getElementById("due-badge");
  badge.textContent = due;
  badge.hidden = !due;
  document.getElementById("sun-count").textContent = store.totalSuns();
}
function talk(pose, mk, en) {
  return `<div class="talk"><div class="elena">${elena(pose)}</div><div class="bubble">${mk ? `<p class="mk">${esc(mk)}</p>` : ""}<p class="en">${esc(en)}</p></div></div>`;
}

/* ---------- home: the journey ---------- */
function home() {
  setNav("home");
  const st = store.get();
  const nl = nextLesson();
  const town = nl ? nl.town : TOWNS[TOWNS.length - 1];
  const due = store.dueCards().length;
  const nextIn = store.nextDueIn();
  const words = store.words().length;
  const fresh = !Object.keys(st.lessons).length && st.level == null;
  view.innerHTML = `
  <div class="hero"><div class="scene-wrap">${SCENES[town.id]()}<div class="elena">${elena(nl ? "joy" : "cheer", { stage: false })}</div></div>
    <div class="tag"><span class="eyebrow">${nl ? `Town ${nl.townIndex + 1} · now` : "Journey complete"}</span><b>${esc(town.mk)} · ${esc(town.en)}</b><span class="fine">${esc(town.line.en)}</span></div></div>
  <div class="stack" style="margin-top:16px">
    <div class="stats">
      <div class="stat"><b>${st.level || "A1"}</b><span>level</span></div>
      <div class="stat"><b>${store.totalSuns()}</b><span>suns</span></div>
      <div class="stat"><b>${store.streakNow()}</b><span>day streak</span></div>
      <div class="stat"><b>${words}</b><span>words</span></div>
    </div>
    ${fresh ? `<div class="card">${talk("wave", "Здраво! Јас сум Елена.", "Hi! I'm Elena, and I'm spending the summer travelling around Macedonia. Come with me! New to Macedonian? Start in Skopje. Already know some? Take the 2-minute level test.")}
      <div class="row"><a class="btn primary" href="#/lesson/${LESSONS[0].id}">Start in Skopje</a><a class="btn" href="#/test">Take the level test</a></div></div>` : ""}
    ${nl && !fresh ? `<div class="card"><div class="row between"><div><p class="eyebrow">Next lesson · about ${nl.minutes} min</p><h2>${esc(nl.mk)} · ${esc(nl.en)}</h2><p class="muted">${esc(nl.goal)}</p></div><a class="btn primary" href="#/lesson/${nl.id}">Continue</a></div></div>` : ""}
    ${!fresh ? `<div class="card review-card"><div class="elena">${elena(due ? "think" : "joy")}</div><div><h3>${due ? `${due} thing${due > 1 ? "s" : ""} to review today` : "Nothing to review today"}</h3>
      <p class="fine">${due ? "Words and questions come back just before you'd forget them: after 1 day, then 2, 4, 7, 15 and 30." : nextIn ? `Next review in ${nextIn} day${nextIn > 1 ? "s" : ""}.` : "Finish a lesson and its words will come back here tomorrow."}</p></div>
      ${due ? `<a class="btn primary" href="#/review">Review</a>` : ""}</div>` : ""}
    ${TOWNS.map((t, ti) => townBlock(t, ti)).join("")}
    ${COMING.map((c) => `<div class="card town locked"><div class="town-head"><div class="thumb">${SCENES[c.id] ? SCENES[c.id]() : ""}</div><div><p class="eyebrow">Coming soon</p><h2>${esc(c.mk)} · ${esc(c.en)}</h2><p class="muted">${esc(c.line.en)}</p></div></div></div>`).join("")}
    <p class="fine">Your progress is saved in this browser. Accounts that keep it on every device are on the way.</p>
  </div>`;
}
function townBlock(t, ti) {
  const st = store.get();
  const anyOpen = t.lessons.some((l) => unlocked(LESSONS.find((x) => x.id === l.id)));
  return `<section class="card town ${anyOpen ? "" : "locked"}" aria-label="${esc(t.en)}">
    <div class="town-head"><div class="thumb">${SCENES[t.id]()}</div><div><p class="eyebrow">Town ${ti + 1} · ${t.level}</p><h2>${esc(t.mk)} · ${esc(t.en)}</h2><p class="muted">${esc(t.line.mk)} ${esc(t.line.en)}</p></div></div>
    <div class="stops">${t.lessons.map((l0, li) => {
      const l = lessonById(l0.id);
      const open = unlocked(l), res = st.lessons[l.id], isNext = nextLesson()?.id === l.id;
      return open
        ? `<a class="stop ${isNext ? "next" : ""}" href="#/lesson/${l.id}"><span class="top"><span class="num">Stop ${ti * 3 + li + 1}</span>${res ? sunsHTML(res.suns) : isNext ? `<span class="chip lake">Next</span>` : ""}</span><b>${esc(l.mk)}</b><small>${esc(l.en)}</small></a>`
        : `<div class="stop locked" aria-disabled="true"><span class="top"><span class="num">Stop ${ti * 3 + li + 1}</span><span class="chip lake">Locked</span></span><b>${esc(l.mk)}</b><small>${esc(l.en)}</small></div>`;
    }).join("")}</div></section>`;
}

/* ---------- a lesson ---------- */
function lesson(id) {
  const L = lessonById(id);
  if (!L) return (location.hash = "#/");
  if (!unlocked(L)) return (location.hash = "#/");
  setNav("");
  view.innerHTML = `<div class="stack" style="margin-top:16px"><div class="hero"><div class="scene-wrap">${SCENES[L.town.id]()}<div class="elena">${elena(L.intro.pose, { stage: false })}</div></div>
    <div class="tag"><span class="eyebrow">${esc(L.town.en)} · about ${L.minutes} min</span><b>${esc(L.mk)}</b><span class="fine">${esc(L.en)}</span></div></div>
    <div class="card">${talk(L.intro.pose, L.intro.mk, L.intro.en)}<p><b>Goal:</b> ${esc(L.goal)}</p>
    <div class="row"><button type="button" class="btn primary" id="go">Start</button><a class="btn ghost" href="#/">Back to the journey</a></div></div></div>`;
  document.getElementById("go").addEventListener("click", () => run(L));
}

function run(L, opts = {}) {
  const queue = opts.queue || L.steps.map((s, i) => ({ step: s, i, lesson: L }));
  const scoredTotal = queue.filter((q) => SCORED.has(q.step.t)).length;
  let pos = 0, firstRight = 0, retries = [];
  const firstTry = new Set();
  const newWords = [];

  const frame = () => {
    const total = queue.length + retries.length;
    view.innerHTML = `<div class="lessonbar"><a class="btn ghost small" href="#/" aria-label="Leave the lesson">✕</a><div class="track" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${pos}"><div class="fill" style="width:${Math.round((pos / total) * 100)}%"></div></div><span class="pill">${sun(true)} ${firstRight}</span></div>
      <div id="step"></div><div id="sheet"></div>`;
  };

  const show = () => {
    if (pos >= queue.length) {
      if (retries.length) { queue.push(...retries); retries = []; }
      else return finish();
    }
    frame();
    const cur = queue[pos];
    const host = document.getElementById("step");
    const ctx = {
      story: (sid) => cur.lesson.stories[sid],
      next: () => {
        if (cur.step.t === "learn") { store.addWord("w:" + cur.step.mk, { mk: cur.step.mk, en: cur.step.en, pic: cur.step.pic }); newWords.push(cur.step); }
        pos++; show();
      },
      answer: (ok, info) => {
        const key = cur.lesson.id + ":" + cur.i;
        const first = !firstTry.has(key);
        firstTry.add(key);
        if (first && ok) {
          firstRight++;
          const pill = document.querySelector(".lessonbar .pill");
          if (pill) pill.innerHTML = `${sun(true)} ${firstRight}`;
        }
        if (opts.onAnswer) opts.onAnswer(cur, ok);
        else store.seeCard("i:" + key, "item", { lesson: cur.lesson.id, index: cur.i }, ok);
        if (!ok && first && !opts.noRetry) retries.push(cur);
        feedback(ok, info);
      },
    };
    RENDER[cur.step.t](cur.step, host, ctx);
  };

  const feedback = (ok, info) => {
    const [mk, en] = ok ? pick(PRAISE) : pick(COMFORT);
    const sheet = document.getElementById("sheet");
    sheet.innerHTML = `<div class="sheet ${ok ? "good" : "bad"}" role="status"><div class="fb"><div>${elena(ok ? "cheer" : "oops")}</div><div>
      <p class="fb-head">${mk} <span class="fine">${en}</span></p>
      ${!ok && info.answer ? `<p>Answer: <span class="ans">${esc(info.answer)}</span></p>` : ""}
      ${info.why ? `<p class="fine">${esc(info.why)}</p>` : ""}
      ${!ok && !opts.noRetry ? `<p class="fine">This one comes back at the end of the lesson, and again in your reviews.</p>` : ""}
    </div></div><button type="button" class="btn ${ok ? "primary" : ""} wide" id="cont">Continue</button></div>`;
    const c = document.getElementById("cont");
    c.focus();
    c.addEventListener("click", () => { pos++; show(); });
  };

  const finish = () => {
    const score = scoredTotal ? firstRight / scoredTotal : 1;
    if (opts.onFinish) return opts.onFinish(score, firstRight, scoredTotal);
    const suns = store.lessonResult(L.id, score);
    const nl = nextLesson();
    view.innerHTML = `<div class="result"><div class="elena">${elena("cheer")}</div><p class="eyebrow">${esc(L.town.en)} · lesson complete</p><h1>${suns === 3 ? "Браво! Одлично!" : suns === 2 ? "Многу добро!" : "Добро е!"}</h1>
      <div class="bigsuns">${sunsHTML(suns)}</div><p class="muted">${firstRight} of ${scoredTotal} right on the first try.</p></div>
      <div class="stack">
        ${newWords.length ? `<div class="card"><h3>New words in your notebook</h3><div class="wordgrid">${newWords.map((w) => `<div class="item"><span><b>${esc(w.mk)}</b><br><small>${esc(w.en)}</small></span><span aria-hidden="true">${w.pic || ""}</span></div>`).join("")}</div>
        <p class="fine">They'll come back tomorrow in your review, then less and less often as you remember them.</p></div>` : ""}
        <div class="row">${nl ? `<a class="btn primary" href="#/lesson/${nl.id}">Next: ${esc(nl.mk)}</a>` : ""}<a class="btn" href="#/">Back to the journey</a>${suns < 3 ? `<a class="btn ghost" href="#/lesson/${L.id}">Try again for 3 suns</a>` : ""}</div>
      </div>`;
  };

  show();
}

/* ---------- review (spaced repetition) ---------- */
function wordQuestion(card) {
  const w = card.ref;
  const others = shuffle(VOCAB.filter((v) => v.mk !== w.mk));
  if (card.box >= 2) return { t: "type", en: `Write in Macedonian: ${w.en}`, a: w.mk.split(" · ").map((x) => x.replace(/[!?.]/g, "")), why: `${w.mk} = ${w.en}` };
  if (Math.random() < 0.5) return { t: "mc", pic: w.pic, q: w.mk, en: "What does it mean?", o: [w.en, ...others.slice(0, 3).map((v) => v.en)], why: `${w.mk} = ${w.en}` };
  return { t: "mc", pic: w.pic, q: w.en, en: "How do you say it in Macedonian?", o: [w.mk, ...others.slice(0, 3).map((v) => v.mk)], why: `${w.en} = ${w.mk}` };
}
function review() {
  setNav("review");
  const due = store.dueCards().sort((a, b) => a.box - b.box || b.wrong - a.wrong).slice(0, 15);
  if (!due.length) {
    const n = store.nextDueIn();
    view.innerHTML = `<div class="result"><div class="elena">${elena("joy")}</div><h1>Нема ништо денес!</h1><p class="muted">Nothing to review today. ${n ? `Next review in ${n} day${n > 1 ? "s" : ""}.` : "Finish a lesson first: its words come back here tomorrow."}</p><a class="btn primary" href="#/">Back to the journey</a></div>`;
    return;
  }
  const queue = due.map((c) => {
    if (c.kind === "word") return { card: c, step: wordQuestion(c), i: c.id, lesson: { id: "review", stories: {} } };
    const L = lessonById(c.ref.lesson);
    return L && L.steps[c.ref.index] ? { card: c, step: L.steps[c.ref.index], i: c.ref.index, lesson: L } : null;
  }).filter(Boolean);
  view.innerHTML = `<div class="stack" style="margin-top:16px"><div class="card">${talk("think", "Ајде да повториме!", `Let's review! ${queue.length} thing${queue.length > 1 ? "s" : ""} you learned before. Each right answer pushes it further into the future; a wrong one brings it back tomorrow.`)}
    <button type="button" class="btn primary" id="go">Start the review</button></div></div>`;
  document.getElementById("go").addEventListener("click", () => run({ id: "review", town: TOWNS[0] }, {
    queue, noRetry: true,
    onAnswer: (cur, ok) => store.seeCard(cur.card.id, cur.card.kind, cur.card.ref, ok),
    onFinish: (score, right, total) => {
      store.touchStreak();
      const n = store.nextDueIn();
      view.innerHTML = `<div class="result"><div class="elena">${elena(score >= 0.7 ? "cheer" : "joy")}</div><h1>${score >= 0.7 ? "Одлично!" : "Добра работа!"}</h1><p class="muted">${right} of ${total} remembered.${n ? ` Next review in ${n} day${n > 1 ? "s" : ""}.` : ""}</p><a class="btn primary" href="#/">Back to the journey</a></div>`;
      setNav("review");
    },
  }));
}

/* ---------- notebook ---------- */
function notebook() {
  setNav("notebook");
  const mine = store.words();
  const draw = (f = "") => {
    const list = mine.filter((w) => !f || w.ref.mk.toLowerCase().includes(f) || w.ref.en.toLowerCase().includes(f)).sort((a, b) => a.ref.mk.localeCompare(b.ref.mk, "mk"));
    document.getElementById("words").innerHTML = list.length
      ? list.map((w) => `<div class="item"><span><b>${esc(w.ref.mk)}</b> <span aria-hidden="true">${w.ref.pic || ""}</span><br><small>${esc(w.ref.en)}</small></span><span class="strength" aria-label="Memory ${w.box} of 5">${[1, 2, 3, 4, 5].map((n) => `<i class="${w.box >= n ? "on" : ""}"></i>`).join("")}</span></div>`).join("")
      : `<p class="muted">${mine.length ? "No word matches." : "Your notebook is empty. Every new word from a lesson lands here."}</p>`;
  };
  view.innerHTML = `<div class="stack" style="margin-top:16px"><div class="row between"><div><p class="eyebrow">Мојата тетратка</p><h1>My notebook</h1></div><span class="pill">${mine.length} words</span></div>
    <input class="search" id="nb-search" type="search" placeholder="Search in Macedonian or English" aria-label="Search words">
    <p class="fine">The dots show how well you know each word. They fill up as you get it right in your reviews.</p>
    <div class="wordgrid" id="words"></div></div>`;
  draw();
  document.getElementById("nb-search").addEventListener("input", (e) => draw(e.target.value.trim().toLowerCase()));
}

/* ---------- level test ---------- */
function test() {
  setNav("test");
  let i = 0, miss = 0;
  const right = TOWNS.map(() => 0);
  const ask = () => {
    if (i >= PLACEMENT.length || miss >= 2) return done();
    const q = PLACEMENT[i];
    const opts = shuffle(q.o.map((t, k) => ({ t, ok: k === 0 })));
    view.innerHTML = `<div class="stack" style="margin-top:16px"><div class="lessonbar"><a class="btn ghost small" href="#/" aria-label="Leave the test">✕</a><div class="track"><div class="fill" style="width:${Math.round((i / PLACEMENT.length) * 100)}%"></div></div><span class="pill">${i + 1} / ${PLACEMENT.length}</span></div>
      <div class="qcard">${talk(i === 0 ? "wave" : "think", q.q, q.en)}<div class="opts ${q.o.some((o) => o.length > 22) ? "long" : ""}">${opts.map((o, k) => `<button type="button" class="opt" data-k="${k}">${esc(o.t)}</button>`).join("")}</div>
      <p class="fine">No pressure: if you don't know, pick any answer. Two mistakes end the test.</p></div></div>`;
    view.querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => {
      if (opts[+b.dataset.k].ok) right[q.town]++; else miss++;
      i++; ask();
    }));
  };
  const done = () => {
    let start = 0;
    while (start < TOWNS.length && right[start] === PLACEMENT.filter((q) => q.town === start).length) start++;
    start = Math.min(start, TOWNS.length - 1);
    store.setLevel("A1", start);
    const t = TOWNS[start];
    view.innerHTML = `<div class="result"><div class="elena">${elena("cheer")}</div><p class="eyebrow">Твоето ниво · your level</p><h1>A1 · ${esc(t.mk)}</h1>
      <p class="muted" style="max-width:52ch">${start === 0 ? "Let's start at the very beginning, in Skopje. You'll be reading signs by the end of the first lesson!" : `You already know the basics, so your journey starts in ${esc(t.en)}. The earlier towns stay open if you want to review them.`}</p>
      <div class="row" style="justify-content:center"><a class="btn primary" href="#/lesson/${t.lessons[0].id}">Start in ${esc(t.en)}</a><a class="btn" href="#/">See the journey</a></div></div>`;
  };
  view.innerHTML = `<div class="stack" style="margin-top:16px"><div class="card">${talk("wave", "Колку знаеш?", "How much do you already know? Ten quick questions, getting harder. Two mistakes and we stop: that's your starting point.")}
    <div class="row"><button type="button" class="btn primary" id="go">Start the test</button><a class="btn ghost" href="#/">Not now</a></div></div></div>`;
  document.getElementById("go").addEventListener("click", ask);
}

/* ---------- router ---------- */
function route() {
  const h = location.hash.replace(/^#\/?/, "");
  const [name, arg] = h.split("/");
  window.scrollTo(0, 0);
  if (name === "lesson" && arg) lesson(arg);
  else if (name === "review") review();
  else if (name === "notebook") notebook();
  else if (name === "test") test();
  else home();
}
window.addEventListener("hashchange", route);
document.getElementById("brand-elena").innerHTML = elena("joy");
route();
