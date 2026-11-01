import { mkdir, copyFile, rm, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const out = join(root, 'dist');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await mkdir(join(out, 'vendor'), { recursive: true });
await mkdir(join(out, 'personality'), { recursive: true });
const assets = ['index.html', 'app.js', 'styles.css', 'live-app.css', 'favicon.svg', 'landscape.svg', 'backend-config.js', 'konto.html', 'konto.js', 'vendor/qrcode.js', 'home.js', 'live-app.js', 'card-catalog.js', 'personality/ipip50-v1.js', 'personality/ipip50-scoring.js', 'personality/ipip50-storage.js', 'personality/ipip50-ui.js', 'personality/ipip50-reference.js'];
for (const file of assets) await copyFile(join(root, file), join(out, file));
await writeFile(join(out, '_headers'), [
  '/*',
  '  X-Content-Type-Options: nosniff',
  '  Referrer-Policy: strict-origin-when-cross-origin',
  '  X-Frame-Options: DENY',
  '  Permissions-Policy: camera=(), microphone=(), geolocation=()',
  '',
].join('\n'));
console.log('Built dist/ with', assets.length, 'public assets');
