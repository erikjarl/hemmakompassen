import { mkdir, copyFile, rm, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const out = join(root, 'dist');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
const assets = ['index.html', 'app.js', 'styles.css', 'favicon.svg', 'landscape.svg', 'backend-config.js', 'konto.html', 'konto.js', 'home.js', 'live-app.js'];
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
