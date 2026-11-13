#!/usr/bin/env node
// Read-only release check. Run from repository root after a Pages deployment.
import {readFile} from 'node:fs/promises';

const url = process.env.HK_PAGES_URL || 'https://erikjarl.github.io/hemmakompassen/index.html';
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const version = source => source.match(/<meta\s+name=["']hk-ui-version["']\s+content=["']([^"']+)["']/i)?.[1] ?? null;
const expected = version(html);
if (!expected) {
  console.error('BLOCKERAD: index.html saknar hk-ui-version.');
  process.exitCode = 2;
} else {
  try {
    const response = await fetch(url, {redirect:'follow', cache:'no-store', signal:AbortSignal.timeout(15000), headers:{'cache-control':'no-cache'}});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const deployed = version(await response.text());
    if (!deployed) throw new Error('Publicerad sida saknar hk-ui-version');
    console.log(`Kontrollerad URL: ${response.url}`);
    console.log(`Lokal main-version: ${expected}`);
    console.log(`Publicerad version: ${deployed}`);
    if (deployed === expected) console.log('PASS: versionerna matchar (inte ett fullständigt funktionstest).');
    else {
      console.error('FAIL: den publicerade versionen skiljer sig från lokal kod.');
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(`BLOCKERAD: kunde inte verifiera den publicerade sidan: ${error.message}`);
    process.exitCode = 2;
  }
}
