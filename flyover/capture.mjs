import { chromium } from 'playwright';
import fs from 'fs';
fs.mkdirSync('assets', { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await p.goto('https://macedonianwithvilma.com/en/', { waitUntil: 'networkidle' });
for (let y = 0; y < 4000; y += 300) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(120); }
await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(1000);
await p.addStyleTag({ content: '*{transition:none!important;animation:none!important}' });
const layers = await p.evaluate(() => {
  const L = [];
  const mark = (el, id, kind) => { if (!el) return; el.setAttribute('data-layer', id); L.push({ id, kind }); };
  mark(document.querySelector('img[src*="vilma-profile"]').closest('div.rounded-xl'), 'heroPhoto', 'mockup');
  mark([...document.querySelectorAll('a')].find(a => /free lesson/i.test(a.innerText)), 'heroButton', 'button');
  const hdr = document.querySelector('header');
  const flags = [...hdr.querySelectorAll('a, button, img')].filter(e => { const r = e.getBoundingClientRect(); return r.x > 1000 && r.width < 60 && r.width > 10; });
  const seen = new Set(); let fi = 0;
  for (const f of flags) { const t = f.closest('a,button') || f; if (seen.has(t)) continue; seen.add(t); mark(t, 'flag' + fi++, 'chip'); }
  const cards = [...document.querySelectorAll('div.bg-white.p-6.rounded-xl')];
  cards.forEach((c, i) => {
    mark(c, 'card' + i, 'photo');
    const icon = [...c.querySelectorAll('div')].find(d => { const r = d.getBoundingClientRect(); return r.width > 30 && r.width < 80 && Math.abs(r.width - r.height) < 4; });
    if (i !== 1) mark(icon, 'icon' + i, 'flychip');
  });
  mark(document.querySelector('div.bg-white.rounded-2xl.shadow-xl'), 'cta', 'testimonial');
  [...document.querySelectorAll('footer svg')].forEach((s, i) => mark(s.closest('a') || s, 'social' + i, 'chip'));
  for (const l of L) {
    const r = document.querySelector(`[data-layer="${l.id}"]`).getBoundingClientRect();
    l.x = r.x; l.y = r.y + scrollY; l.w = r.width; l.h = r.height;
    l.radius = parseFloat(getComputedStyle(document.querySelector(`[data-layer="${l.id}"]`)).borderTopLeftRadius) || 0;
  }
  return { H: document.documentElement.scrollHeight, layers: L };
});
console.log(layers.layers.map(l => `${l.id} ${l.kind} ${[l.x, l.y, l.w, l.h].map(Math.round)}`).join('\n'));
await p.addStyleTag({ content: '[data-layer]{visibility:hidden!important}' });
await p.screenshot({ path: 'assets/page.png', fullPage: true });
await p.addStyleTag({ content: 'html,body{background:transparent!important} body{visibility:hidden!important} [data-layer].cap{visibility:visible!important;box-shadow:none!important}' });
const PAD = 28;
for (const l of layers.layers) {
  await p.evaluate(id => { document.querySelectorAll('.cap').forEach(e => e.classList.remove('cap')); document.querySelector(`[data-layer="${id}"]`).classList.add('cap'); }, l.id);
  l.px = l.x - PAD; l.py = l.y - PAD; l.pw = l.w + 2 * PAD; l.ph = l.h + 2 * PAD;
  await p.screenshot({ path: `assets/${l.id}.png`, fullPage: true, omitBackground: true, clip: { x: l.px, y: l.py, width: l.pw, height: l.ph } });
}
fs.writeFileSync('assets/layers.json', JSON.stringify({ W: 1440, H: layers.H, pad: PAD, layers: layers.layers }, null, 1));
await b.close();
