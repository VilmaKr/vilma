// Exercise renderers. Each one draws itself into `el` and reports through ctx:
//   ctx.answer(correct, { answer, why })  -> scored step finished
//   ctx.next()                            -> unscored step (learn card, tip, story)
//   ctx.story(id)                         -> { title, mk, en } for questions about a text
import { elena } from "./art.js";

export const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
export const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((v) => v[1]);
const norm = (s) => String(s).toLowerCase().replace(/[.,!?;:„“”"'«»…()\-–—]/g, " ").replace(/\s+/g, " ").trim();
const LETTERS = "а б в г д ѓ е ж з ѕ и ј к л љ м н њ о п р с т ќ у ф х ц ч џ ш".split(" ");

const KIND = {
  learn: "New word", tip: "Elena explains", story: "Read", mc: "Choose", match: "Match", order: "Build the sentence",
  type: "Write", sort: "Sort", tf: "True or false", underline: "Find the words", dialogue: "Conversation", listen: "Choose",
};

function head(item) {
  const q = item.q ? `<p class="q-mk">${esc(item.q)}</p>` : "";
  const en = item.en ? `<p class="q-en">${esc(item.en)}</p>` : "";
  const pic = item.pic ? `<div class="pic" aria-hidden="true">${item.pic}</div>` : "";
  return `<span class="kind">${KIND[item.t] || "Practice"}</span>${pic}<div>${q}${en}</div>`;
}
function storyBlock(st, open = true) {
  if (!st) return "";
  return `<div class="story"><span class="title">${esc(st.title)}</span><p class="mk-text">${esc(st.mk)}</p>
  <p class="en" ${open ? "hidden" : ""} data-en>${esc(st.en)}</p><button type="button" class="btn ghost small toggle-en" data-toggle>Show English</button></div>`;
}
function wireToggle(el) {
  el.querySelectorAll("[data-toggle]").forEach((b) => b.addEventListener("click", () => {
    const en = b.parentElement.querySelector("[data-en]");
    en.hidden = !en.hidden;
    b.textContent = en.hidden ? "Show English" : "Hide English";
  }));
}

/* ---------- unscored ---------- */
function learn(item, el, ctx) {
  el.innerHTML = `<div class="qcard"><span class="kind">${KIND.learn}</span><div class="learn">
    ${item.pic ? `<div class="pic" aria-hidden="true">${item.pic}</div>` : ""}
    <span class="word">${esc(item.mk)}</span><span class="tr">${esc(item.en)}</span>
    ${item.ex ? `<div class="ex"><b>${esc(item.ex[0])}</b><span>${esc(item.ex[1])}</span></div>` : ""}
    ${item.note ? `<p class="fine">${esc(item.note)}</p>` : ""}
  </div><button type="button" class="btn primary wide" data-go>Got it</button></div>`;
  el.querySelector("[data-go]").addEventListener("click", () => ctx.next());
  el.querySelector("[data-go]").focus();
}
function tip(item, el, ctx) {
  el.innerHTML = `<div class="qcard tip"><span class="kind">${KIND.tip}</span>
    <div class="talk"><div class="elena">${elena(item.pose || "think")}</div><div class="bubble">${item.mk ? `<p class="mk">${esc(item.mk)}</p>` : ""}<p>${esc(item.en)}</p></div></div>
    ${item.table ? `<div class="tipwrap"><table>${item.table.map((r, i) => `<tr>${r.map((c) => i === 0 ? `<th>${esc(c)}</th>` : `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</table></div>` : ""}
    <button type="button" class="btn primary wide" data-go>Continue</button></div>`;
  el.querySelector("[data-go]").addEventListener("click", () => ctx.next());
}
function story(item, el, ctx) {
  const st = ctx.story(item.id);
  el.innerHTML = `<div class="qcard"><span class="kind">${KIND.story}</span>${item.pic ? `<div class="pic" aria-hidden="true">${item.pic}</div>` : ""}${storyBlock(st)}
  <p class="fine">Read it first. Questions about this text come next, and you can open it again.</p>
  <button type="button" class="btn primary wide" data-go>I've read it</button></div>`;
  wireToggle(el);
  el.querySelector("[data-go]").addEventListener("click", () => ctx.next());
}

/* ---------- multiple choice ---------- */
function mc(item, el, ctx) {
  const st = item.s ? ctx.story(item.s) : null;
  const opts = shuffle(item.o.map((t, i) => ({ t, ok: i === 0 })));
  const long = item.o.some((o) => o.length > 22);
  el.innerHTML = `<div class="qcard">${head(item)}${st ? storyBlock(st, true) : ""}
    <div class="opts ${long ? "long" : ""}">${opts.map((o, i) => `<button type="button" class="opt" data-i="${i}">${esc(o.t)}</button>`).join("")}</div></div>`;
  wireToggle(el);
  el.querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => {
    const o = opts[+b.dataset.i];
    el.querySelectorAll(".opt").forEach((x) => { x.disabled = true; if (opts[+x.dataset.i].ok) x.classList.add("is-right"); });
    if (!o.ok) b.classList.add("is-wrong");
    ctx.answer(o.ok, { answer: item.o[0], why: item.why });
  }));
}
function tf(item, el, ctx) {
  const st = item.s ? ctx.story(item.s) : null;
  el.innerHTML = `<div class="qcard">${head(item)}${st ? storyBlock(st, true) : ""}
    <div class="opts"><button type="button" class="opt" data-v="true">Точно · True</button><button type="button" class="opt" data-v="false">Неточно · False</button></div></div>`;
  wireToggle(el);
  el.querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => {
    const v = b.dataset.v === "true";
    el.querySelectorAll(".opt").forEach((x) => { x.disabled = true; if ((x.dataset.v === "true") === item.a) x.classList.add("is-right"); });
    if (v !== item.a) b.classList.add("is-wrong");
    ctx.answer(v === item.a, { answer: item.a ? "Точно · True" : "Неточно · False", why: item.why });
  }));
}

/* ---------- match pairs ---------- */
function match(item, el, ctx) {
  const pairs = item.p.map((p, i) => ({ a: p[0], b: p[1], i }));
  const left = shuffle(pairs), right = shuffle(pairs);
  const big = (s) => [...s].length <= 3 && /\p{Extended_Pictographic}/u.test(s);
  el.innerHTML = `<div class="qcard">${head(item)}<div class="match">
    <div class="mcol">${left.map((p) => `<button type="button" class="mbtn" data-side="a" data-i="${p.i}">${esc(p.a)}</button>`).join("")}</div>
    <div class="mcol">${right.map((p) => `<button type="button" class="mbtn ${big(p.b) ? "big" : ""}" data-side="b" data-i="${p.i}">${esc(p.b)}</button>`).join("")}</div>
  </div><p class="fine" data-n>0 of ${pairs.length} pairs</p></div>`;
  let sel = null, done = 0, miss = 0;
  el.querySelectorAll(".mbtn").forEach((b) => b.addEventListener("click", () => {
    if (b.classList.contains("ok")) return;
    if (!sel || sel.dataset.side === b.dataset.side) {
      el.querySelectorAll(`.mbtn[data-side="${b.dataset.side}"]`).forEach((x) => x.classList.remove("sel"));
      b.classList.add("sel"); sel = b; return;
    }
    if (sel.dataset.i === b.dataset.i) {
      [sel, b].forEach((x) => { x.classList.remove("sel"); x.classList.add("ok"); x.disabled = true; });
      done++;
      el.querySelector("[data-n]").textContent = `${done} of ${pairs.length} pairs`;
      if (done === pairs.length) ctx.answer(miss <= 1, { answer: miss <= 1 ? "" : "Pairs: " + item.p.map((p) => `${p[0]} = ${p[1]}`).join(" · "), why: item.why || (miss ? `${miss} wrong tries.` : "") });
    } else {
      miss++;
      const s = sel;
      [s, b].forEach((x) => { x.classList.remove("sel"); x.classList.remove("no"); void x.offsetWidth; x.classList.add("no"); });
      setTimeout(() => [s, b].forEach((x) => x.classList.remove("no")), 400);
    }
    sel = null;
  }));
}

/* ---------- build the sentence ---------- */
function order(item, el, ctx) {
  const words = item.w.map((t, i) => ({ t, i }));
  let pool = shuffle(words);
  if (pool.every((w, i) => w.i === i) && pool.length > 1) pool = pool.slice(1).concat(pool[0]);
  const extra = (item.x || []).map((t, i) => ({ t, i: 100 + i }));
  pool = shuffle(pool.concat(extra));
  const line = [];
  el.innerHTML = `<div class="qcard">${head({ ...item, q: item.q || "" , en: item.en })}
    <div class="line" data-line><span class="ph">Tap the words in the right order</span></div>
    <div class="pool" data-pool>${pool.map((w, k) => `<button type="button" class="tile" data-k="${k}">${esc(w.t)}</button>`).join("")}</div>
    <button type="button" class="btn primary" data-check disabled>Check</button></div>`;
  const lineEl = el.querySelector("[data-line]"), check = el.querySelector("[data-check]");
  const draw = () => {
    lineEl.innerHTML = line.length ? line.map((k, j) => `<button type="button" class="tile" data-j="${j}">${esc(pool[k].t)}</button>`).join("") : `<span class="ph">Tap the words in the right order</span>`;
    lineEl.querySelectorAll(".tile").forEach((t) => t.addEventListener("click", () => {
      const k = line.splice(+t.dataset.j, 1)[0];
      el.querySelector(`[data-pool] [data-k="${k}"]`).classList.remove("used");
      draw();
    }));
    check.disabled = !line.length;
  };
  el.querySelectorAll("[data-pool] .tile").forEach((t) => t.addEventListener("click", () => {
    if (t.classList.contains("used")) return;
    t.classList.add("used"); line.push(+t.dataset.k); draw();
  }));
  check.addEventListener("click", () => {
    const said = line.map((k) => pool[k].t).join(" ");
    const target = item.w.join(" ");
    const ok = norm(said) === norm(target) || (item.alt || []).some((a) => norm(a) === norm(said));
    check.disabled = true;
    el.querySelectorAll(".tile").forEach((t) => (t.disabled = true));
    ctx.answer(ok, { answer: target, why: item.why });
  });
}

/* ---------- write the answer ---------- */
function type(item, el, ctx) {
  const st = item.s ? ctx.story(item.s) : null;
  el.innerHTML = `<div class="qcard">${head(item)}${st ? storyBlock(st, true) : ""}
    <div class="typebox"><input type="text" id="type-${Math.random().toString(36).slice(2, 7)}" autocomplete="off" autocapitalize="off" spellcheck="false" lang="mk" placeholder="${esc(item.ph || "Type in Macedonian")}" aria-label="Your answer">
    <details><summary class="fine">Macedonian letters</summary><div class="keys">${LETTERS.map((l) => `<button type="button" class="key" data-l="${l}">${l}</button>`).join("")}</div></details>
    ${item.hint ? `<p class="fine">Hint: ${esc(item.hint)}</p>` : ""}</div>
    <button type="button" class="btn primary" data-check>Check</button></div>`;
  wireToggle(el);
  const inp = el.querySelector("input"), check = el.querySelector("[data-check]");
  el.querySelectorAll(".key").forEach((k) => k.addEventListener("click", () => {
    const p = inp.selectionStart ?? inp.value.length;
    inp.value = inp.value.slice(0, p) + k.dataset.l + inp.value.slice(inp.selectionEnd ?? p);
    inp.focus(); inp.setSelectionRange(p + 1, p + 1);
  }));
  const go = () => {
    if (!inp.value.trim()) { inp.placeholder = "Write an answer first"; inp.focus(); return; }
    const ok = item.a.some((a) => norm(a) === norm(inp.value));
    inp.classList.add(ok ? "ok" : "bad"); inp.disabled = true; check.disabled = true;
    ctx.answer(ok, { answer: item.a[0], why: item.why });
  };
  check.addEventListener("click", go);
  inp.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
  setTimeout(() => inp.focus(), 50);
}

/* ---------- sort into groups ---------- */
function sort(item, el, ctx) {
  const queue = shuffle(item.i.map(([w, b]) => ({ w, b })));
  let k = 0, miss = 0;
  const st = item.s ? ctx.story(item.s) : null;
  el.innerHTML = `<div class="qcard">${head(item)}${st ? storyBlock(st, true) : ""}<div class="now-word"><span data-now></span></div>
    <div class="buckets">${item.b.map((b, i) => `<button type="button" class="bucket" data-b="${i}"><span class="bh">${esc(b)}</span><div class="drops"></div></button>`).join("")}</div>
    <p class="fine" data-n></p></div>`;
  wireToggle(el);
  const now = el.querySelector("[data-now]"), n = el.querySelector("[data-n]");
  const show = () => { now.textContent = queue[k].w; n.textContent = `${k + 1} of ${queue.length}`; };
  show();
  el.querySelectorAll(".bucket").forEach((bk) => bk.addEventListener("click", () => {
    if (k >= queue.length) return;
    const cur = queue[k], ok = +bk.dataset.b === cur.b;
    const right = el.querySelector(`.bucket[data-b="${cur.b}"]`);
    right.querySelector(".drops").insertAdjacentHTML("beforeend", `<span class="drop">${esc(cur.w)}</span>`);
    bk.classList.remove("flash-ok", "flash-no"); void bk.offsetWidth; bk.classList.add(ok ? "flash-ok" : "flash-no");
    if (!ok) miss++;
    k++;
    if (k < queue.length) show();
    else { now.textContent = "✓"; el.querySelectorAll(".bucket").forEach((b) => (b.disabled = true)); ctx.answer(miss <= 1, { answer: miss ? `${miss} in the wrong group.` : "", why: item.why }); }
  }));
}

/* ---------- underline words in a text ---------- */
function underline(item, el, ctx) {
  el.innerHTML = `<div class="qcard">${head(item)}<div class="story"><p class="reading" data-r>${item.text.map(([w], i) => `<span class="w" role="button" tabindex="0" data-i="${i}">${esc(w)}</span>`).join(" ")}</p>
    ${item.tr ? `<p class="en" hidden data-en>${esc(item.tr)}</p><button type="button" class="btn ghost small toggle-en" data-toggle>Show English</button>` : ""}</div>
    <button type="button" class="btn primary" data-check>Check</button></div>`;
  wireToggle(el);
  const spans = [...el.querySelectorAll(".w")];
  spans.forEach((s) => {
    const t = () => s.classList.toggle("sel");
    s.addEventListener("click", t);
    s.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); t(); } });
  });
  el.querySelector("[data-check]").addEventListener("click", (e) => {
    const chosen = spans.filter((s) => s.classList.contains("sel"));
    if (!chosen.length) { e.target.textContent = "Tap some words first"; return; }
    let good = 0, wrong = 0, total = 0;
    spans.forEach((s) => {
      const target = item.text[+s.dataset.i][1] === item.target; if (target) total++;
      const on = s.classList.contains("sel"); s.classList.remove("sel");
      if (on && target) { s.classList.add("ok"); good++; } else if (on) { s.classList.add("bad"); wrong++; } else if (target) s.classList.add("miss");
      s.style.pointerEvents = "none";
    });
    e.target.disabled = true;
    const words = item.text.filter(([, t]) => t === item.target).map(([w]) => w.replace(/[.,!?]/g, "")).join(", ");
    ctx.answer(good === total && wrong === 0, { answer: `${good} of ${total} found. They were: ${words}.`, why: item.why });
  });
}

/* ---------- conversation ---------- */
function dialogue(item, el, ctx) {
  let i = 0, miss = 0;
  el.innerHTML = `<div class="qcard">${head(item)}<div class="chat" data-chat></div><div class="opts long" data-replies></div></div>`;
  const chat = el.querySelector("[data-chat]"), rep = el.querySelector("[data-replies]");
  const bubble = (cls, who, [mk, en]) => `<div class="msg ${cls} pop">${who ? `<span class="who">${esc(who)}</span>` : ""}<span class="mk">${esc(mk)}</span><small>${esc(en)}</small></div>`;
  const step = () => {
    while (i < item.lines.length && item.lines[i].them) { chat.insertAdjacentHTML("beforeend", bubble("them", item.who, item.lines[i].them)); i++; }
    if (i >= item.lines.length) { rep.innerHTML = ""; ctx.answer(miss <= 1, { answer: "", why: miss ? `${miss} wrong replies on the way.` : item.why }); return; }
    const L = item.lines[i];
    const options = shuffle([{ v: L.me, ok: true }, ...L.no.map((v) => ({ v, ok: false }))]);
    rep.innerHTML = options.map((o, k) => `<button type="button" class="opt" data-k="${k}"><span class="mk">${esc(o.v[0])}</span> <span class="fine">${esc(o.v[1])}</span></button>`).join("");
    rep.querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => {
      const o = options[+b.dataset.k];
      if (o.ok) { chat.insertAdjacentHTML("beforeend", bubble("me", "Elena", o.v)); i++; step(); }
      else { miss++; b.classList.remove("is-wrong"); void b.offsetWidth; b.classList.add("is-wrong"); b.disabled = true; }
    }));
  };
  step();
}

export const RENDER = { learn, tip, story, mc, tf, match, order, type, sort, underline, dialogue };
export const SCORED = new Set(["mc", "tf", "match", "order", "type", "sort", "underline", "dialogue"]);
