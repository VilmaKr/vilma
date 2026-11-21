import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('https://macedonianwithvilma.com/en/', { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
const url = p.url();
for (let y = 0; y < 20000; y += 400) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(80); }
await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(800);
const info = await p.evaluate(() => {
  const r = e => { const b = e.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y + scrollY), Math.round(b.width), Math.round(b.height)]; };
  const out = { H: document.documentElement.scrollHeight, url: location.href, sections: [], imgs: [], cards: [], btns: [] };
  document.querySelectorAll('body > *, main > *, section, footer, header').forEach(e => out.sections.push([e.tagName, e.id, (e.className + '').slice(0, 60), r(e), (e.innerText || '').slice(0, 60).replace(/\n/g, ' | ')]));
  document.querySelectorAll('img, svg, video, picture').forEach(e => { const b = r(e); if (b[2] > 40 && b[3] > 40) out.imgs.push([e.tagName, (e.getAttribute('src') || e.getAttribute('alt') || '').slice(-50), b]); });
  document.querySelectorAll('a, button').forEach(e => { const b = r(e); if (b[2] > 80) out.btns.push([(e.innerText || '').slice(0, 40), (e.className + '').slice(0, 80), b]); });
  document.querySelectorAll('[class*=rounded]').forEach(e => { const b = r(e); if (b[2] > 60 && b[3] > 30) out.cards.push([e.tagName, (e.className + '').slice(0, 90), b, (e.innerText || '').slice(0, 40).replace(/\n/g, ' ')]); });
  return out;
});
console.log(JSON.stringify(info, null, 0).replace(/\],\[/g, '],\n['));
await p.screenshot({ path: 'probe.png', fullPage: true });
await b.close();
