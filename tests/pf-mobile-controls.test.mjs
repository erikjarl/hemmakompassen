import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const css = readFileSync(new URL('../live-app.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
test('personality controls wrap and stack on narrow screens', () => {
  assert.match(css, /\.pf-sharing button\s*\{\s*min-width:0;\s*white-space:normal;\s*overflow-wrap:anywhere;/);
  assert.match(css, /@media \(max-width:390px\)\s*\{\s*body \.live-layout #live-app \.pf-controls\s*\{\s*display:grid;\s*grid-template-columns:minmax\(0,1fr\);/);
  assert.match(html, /pfcontrols=mobile1/);
});
