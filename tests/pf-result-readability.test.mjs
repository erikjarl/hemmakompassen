import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const css = readFileSync(new URL('../live-app.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
test('personality result labels and reference focus remain readable', () => {
  assert.match(css, /\.pf-percentile-chart \.pf-pct-axis \{\s*font-size:12px;\s*line-height:20px;\s*height:20px;/);
  assert.match(css, /\.pf-percentile-chart \.pf-scale-summary \{\s*font-size:14px;\s*line-height:1\.5;\s*overflow-wrap:anywhere;/);
  assert.match(css, /\.pf-reference-caveat a:focus-visible \{\s*outline:3px solid #314f60;/);
  assert.match(html, /pfresult=readable1/);
});
