import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css = readFileSync(new URL('../live-app.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../live-app.js', import.meta.url), 'utf8');
const personality = readFileSync(new URL('../personality/ipip50-ui.js', import.meta.url), 'utf8');
const stage = (css.split('/* DES-01E: light, readable mutual-match summary.')[1] || '').split('/* DES-01G: readable Schyssta proposal/decision surfaces.')[0];

test('DES-01E mutual-match summary styles are scoped and have accessible colors', () => {
  assert.ok(stage, 'the targeted summary stage must exist');
  for (const selector of [
    '.swipe-results {',
    '.swipe-results .swipe-match-list li',
    '.swipe-results .swipe-summary-overview li',
    '.swipe-results .swipe-rule-summary',
    '.swipe-results .swipe-priority-summary',
    '.swipe-results .swipe-priority-share[aria-pressed="true"]',
    '.swipe-results .swipe-summary-details summary:focus-visible',
  ]) assert.ok(stage.includes(selector), `missing scoped selector: ${selector}`);
  assert.match(stage, /background:#fff9f1/);
  assert.match(stage, /color:#302b26/);
  assert.match(stage, /outline:3px solid #314f60/);
  assert.doesNotMatch(stage, /\.swipe-play-view|\.swipe-playing-card|\.swipe-actions/);
  assert.doesNotMatch(stage, /display\s*:none|visibility\s*:hidden|pointer-events\s*:none/);
});

test('DES-01E summary cache marker remains coherent across served HTML and module imports', () => {
  const revision = html.match(/name="hk-ui-version" content="([^"]+)"/)?.[1];
  assert.match(revision || '', /^20261115-des01[a-z]-[a-z0-9-]+$/);
  assert.ok(html.includes('live-app.css?v=' + revision));
  assert.ok(html.includes('live-app.js?v=' + revision));
  assert.ok(app.includes('ipip50-ui.js?v=' + revision));
  assert.ok(personality.includes('ipip50-family-insights.js?v=' + revision));
});
