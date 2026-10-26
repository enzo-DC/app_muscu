// Génère les écrans de lancement iOS (apple-touch-startup-image) en clair et en sombre,
// à partir de scripts/splash/splash.html, avec Chrome sans interface (aucune dépendance).
//
// Usage : node scripts/splash/render.mjs [cheminChrome]
// Écrit public/splash/*.png et affiche les balises <link> à mettre dans index.html.
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '../../public/splash');
const chrome = process.argv[2] ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';

// Écrans d'iPhone : largeur et hauteur en points CSS, densité de pixels
export const DEVICES = [
  { w: 440, h: 956, dpr: 3 }, // 16 Pro Max
  { w: 430, h: 932, dpr: 3 }, // 15 Pro Max, 15 Plus, 14 Pro Max
  { w: 428, h: 926, dpr: 3 }, // 14 Plus, 13 Pro Max, 12 Pro Max
  { w: 402, h: 874, dpr: 3 }, // 16 Pro
  { w: 393, h: 852, dpr: 3 }, // 16, 15, 15 Pro, 14 Pro
  { w: 390, h: 844, dpr: 3 }, // 14, 13, 13 Pro, 12, 12 Pro
  { w: 375, h: 812, dpr: 3 }, // 13 mini, 12 mini, 11 Pro, XS, X
  { w: 414, h: 896, dpr: 3 }, // 11 Pro Max, XS Max
  { w: 414, h: 896, dpr: 2 }, // 11, XR
  { w: 375, h: 667, dpr: 2 }, // SE (2e et 3e gén.), 8
];

mkdirSync(outDir, { recursive: true });
const port = 9337;
const proc = spawn(chrome, [
  '--headless=new', `--remote-debugging-port=${port}`, '--disable-gpu', '--allow-file-access-from-files',
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cdp-splash-'))}`, 'about:blank',
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

await send('Page.enable');
const page = pathToFileURL(join(here, 'splash.html')).href;
const links = [];
for (const { w, h, dpr } of DEVICES) {
  for (const theme of ['light', 'dark']) {
    const name = `splash-${w * dpr}x${h * dpr}-${theme}.png`;
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: true });
    await send('Page.navigate', { url: `${page}#${theme}` });
    await sleep(500);
    await send('Page.reload'); // le hash seul ne recharge pas la page
    await sleep(600);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(outDir, name), Buffer.from(shot.result.data, 'base64'));
    const media = `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait) and (prefers-color-scheme: ${theme})`;
    links.push(`    <link rel="apple-touch-startup-image" media="${media}" href="/splash/${name}" />`);
  }
}
ws.close();
proc.kill();
console.log(links.join('\n'));
