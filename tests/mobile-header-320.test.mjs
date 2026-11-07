import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Source-level regression only. Actual 320px layout is checked separately in Chromium.
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
assert.match(html,/<header class="live-top">[\s\S]*?<a class="live-brand" href="#hem">Hemmakompassen<\/a>[\s\S]*?<a href="\.\/konto\.html" id="account-link">/);
assert.match(html, /@media\(max-width:380px\)\{[\s\S]*?\.live-top\{gap:6px\}[\s\S]*?\.live-top \.live-brand\{[^}]*font-size:16px;[^}]*white-space:nowrap;[^}]*\}[\s\S]*?\.live-top #account-link\{[^}]*white-space:nowrap;[^}]*\}/);
assert.match(css,/\.live-brand::before\{[^}]*width:38px;height:38px;/);
assert.match(html,/\.live-top \.live-brand::before\{width:30px;height:30px\}/);
console.log('PASS: 320px header retains compact branding and a non-wrapping account link (source-level only)');
