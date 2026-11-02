// Gathers the app's web files into www/, the folder Capacitor packs into the iOS and Android apps.
// Usage: node tools/build-www.mjs   (or: npm run build)
// www/ is generated, never committed. Only the files listed here end up in the store apps.
import { cpSync, existsSync, mkdirSync, rmSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'www');
const FILES = ['index.html'];
const DIRS = ['css', 'js', 'fonts', 'icons'];

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const f of FILES) copyFileSync(join(root, f), join(out, f));
for (const d of DIRS) cpSync(join(root, d), join(out, d), { recursive: true });

// The barcode reader ships inside the app, so it works offline and no code is downloaded at run time.
const zx = join(root, 'node_modules/@zxing/library/umd/index.min.js');
if (existsSync(zx)) {
  mkdirSync(join(out, 'vendor'), { recursive: true });
  copyFileSync(zx, join(out, 'vendor/zxing.min.js'));
} else {
  console.warn('Atenție: @zxing/library lipsește (rulează npm install). Cititorul de coduri va încerca rețeaua.');
}

// The store app is not a website: drop the PWA manifest link and the web-only meta tags.
const idx = join(out, 'index.html');
let html = readFileSync(idx, 'utf8');
html = html
  .replace(/^<link rel="manifest"[^\n]*\n/m, '')
  .replace(/^<meta name="apple-mobile-web-app-[^\n]*\n/gm, '')
  .replace(/^<meta name="mobile-web-app-capable"[^\n]*\n/m, '')
  .replace(/^<meta name="claude:[^\n]*\n/m, '');
writeFileSync(idx, html);

console.log('www/ e gata.');
