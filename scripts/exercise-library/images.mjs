// Télécharge les photos des exercices de source.json et les convertit en WebP 480 px
// (≈ 20 Ko au lieu de 80 Ko) dans public/exercises/<id>/<n>.webp, pour le mode hors ligne.
// La conversion passe par Chrome sans interface (canvas → WebP) : aucune dépendance à installer.
//
// Usage : node scripts/exercise-library/images.mjs [cheminChrome]
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outRoot = join(here, '../../public/exercises');
const IMAGE_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
const WIDTH = 480;
const QUALITY = 0.72;
const chrome = process.argv[2] ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const source = JSON.parse(readFileSync(join(here, 'source.json'), 'utf8'));
const jobs = source.flatMap((e) =>
  e.images.map((img, n) => ({ url: IMAGE_BASE + img, out: join(outRoot, e.id, `${n}.webp`) })),
).filter((j) => !existsSync(j.out));
console.log(`${jobs.length} photos à convertir`);
if (jobs.length === 0) process.exit(0);

const port = 9336;
const proc = spawn(chrome, [
  '--headless=new', `--remote-debugging-port=${port}`, '--disable-gpu',
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cdp-img-'))}`, 'about:blank',
]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) {
  try {
    target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page');
  } catch { await sleep(200); }
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

// Fonction de conversion exécutée dans la page
const convert = `async (url) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  await img.decode();
  const scale = Math.min(1, ${WIDTH} / img.naturalWidth);
  const c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth * scale);
  c.height = Math.round(img.naturalHeight * scale);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/webp', ${QUALITY}).split(',')[1];
}`;

let done = 0;
let failed = 0;
let bytes = 0;
const BATCH = 8;
for (let i = 0; i < jobs.length; i += BATCH) {
  const batch = jobs.slice(i, i + BATCH);
  await Promise.all(
    batch.map(async (job) => {
      const res = await send('Runtime.evaluate', {
        expression: `(${convert})(${JSON.stringify(job.url)})`,
        awaitPromise: true,
        returnByValue: true,
      });
      const data = res.result?.result?.value;
      if (!data) {
        failed++;
        console.log('échec', job.url, res.result?.exceptionDetails?.exception?.description ?? '');
        return;
      }
      const buf = Buffer.from(data, 'base64');
      mkdirSync(dirname(job.out), { recursive: true });
      writeFileSync(job.out, buf);
      bytes += buf.length;
      done++;
    }),
  );
  if ((i / BATCH) % 10 === 0) console.log(`${done}/${jobs.length}`);
}
console.log(`terminé : ${done} converties, ${failed} échecs, ${(bytes / 1024 / 1024).toFixed(1)} Mo`);
ws.close();
proc.kill();
