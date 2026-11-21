// node render.mjs stills 0,1.6,2.5     -> stills/t_X.png
// node render.mjs video [fps] [sub]    -> out/flyover.mp4
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(0);
const port = server.address().port;

const [mode = 'stills', a1, a2] = process.argv.slice(2);
const browser = await chromium.launch({
  channel: 'chromium',
  args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1152 }, deviceScaleFactor: 1 });
page.on('console', m => console.log('[page]', m.text()));
page.on('pageerror', e => console.log('[err]', e.message));
await page.goto(`http://localhost:${port}/film.html`);
const info = await page.evaluate(() => window.ready);
console.log('renderer:', info);
const stage = await page.$('#stage');

if (mode === 'eval') {
  console.log(JSON.stringify(await page.evaluate(a1)));
} else if (mode === 'stills') {
  fs.mkdirSync(path.join(ROOT, 'stills'), { recursive: true });
  const times = (a1 || '0,1.6,2.5,5,6.5,9.3,11').split(',').map(Number);
  for (const t of times) {
    const t0 = Date.now();
    await page.evaluate(t => window.seek(t), t);
    await stage.screenshot({ path: path.join(ROOT, 'stills', `t_${t.toFixed(2)}.png`) });
    console.log('still', t, Date.now() - t0, 'ms');
  }
} else {
  const fps = +(a1 || 60), sub = +(a2 || 16);
  const N = Math.round(14.5 * fps);
  fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true });
  const out = path.join(ROOT, 'out', fps === 60 ? 'flyover.mp4' : `preview_${fps}fps.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = 0; i < N; i++) {
    const t = i / fps;
    await page.evaluate(([t, s]) => window.seek(t, s), [t, sub]);
    const buf = await stage.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 60 === 0) console.log(`frame ${i}/${N} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  console.log('wrote', out);
}
await browser.close();
server.close();
