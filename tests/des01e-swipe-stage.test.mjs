import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../live-app.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../live-app.js', import.meta.url), 'utf8');
const ipip = readFileSync(new URL('../personality/ipip50-ui.js', import.meta.url), 'utf8');
const section = css.split('/* DES-01E: first warm swipe question surface.')[1] || '';

test('DES-01E stays scoped to existing swipe UI and preserves interaction CSS', () => {
  assert.ok(section, 'warm swipe styling must exist');
  for (const selector of ['.swipe-play-view .swipe-stage', '.swipe-play-view .swipe-playing-card', '.swipe-play-view .swipe-importance']) {
    assert.ok(section.includes(selector), selector);
  }
  assert.match(css, /\.swipe-playing-card\.swipe-dragging/);
  assert.match(css, /touch-action:none/);
  assert.match(css, /\.swipe-preview-yes \.swipe-stamp-yes/);
  assert.doesNotMatch(section, /(?:touch-action|pointer-events|display\s*:none|position\s*:absolute)/);
});
test('DES-01E light swipe palette keeps dark readable foreground and keyboard focus', () => {
  assert.match(section, /background:#fff9f1/);
  assert.match(section, /color:#302b26/);
  assert.match(section, /background:#e5e7db/);
  assert.match(section, /outline:3px solid #314f60/);
  assert.match(section, /\.swipe-stamp-no \{ color:#93432e/);
  assert.match(section, /\.swipe-stamp-yes \{ color:#394627/);
});
test('DES-01E CSS and module cache revisions agree', () => {
  const version = html.match(/name="hk-ui-version" content="([^"]+)"/)?.[1];
  assert.ok(version?.startsWith('20261115-des01e-'));
  assert.ok(html.includes('live-app.css?v=' + version));
  assert.ok(html.includes('live-app.js?v=' + version));
  assert.ok(app.includes('ipip50-ui.js?v=' + version));
  assert.ok(ipip.includes('ipip50-retest.js?v=' + version));
});
