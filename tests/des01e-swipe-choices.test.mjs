import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const ipip=readFileSync(new URL('../personality/ipip50-ui.js',import.meta.url),'utf8');
const section=css.split('/* DES-01E continued: warm answer controls and progress;')[1]||'';

test('warm swipe choices stay scoped and preserve existing interactive control states',()=>{
  assert.ok(section,'style block exists');
  for(const selector of ['.swipe-play-view .swipe-track','.swipe-play-view .swipe-track-fill','.swipe-play-view .swipe-actions .swipe-choice','.swipe-play-view .swipe-actions .swipe-yes','.swipe-play-view .swipe-actions .swipe-no','.swipe-play-view .swipe-actions .swipe-choice:focus-visible','.swipe-play-view .swipe-actions .swipe-choice:disabled']){
    assert.ok(section.includes(selector),selector);
  }
  assert.doesNotMatch(section,/(?:touch-action|pointer-events|user-select|position\s*:|display\s*:none)/);
  assert.match(html,/\.swipe-playing-card\{touch-action:pan-y/);
  assert.match(css,/\.swipe-choice:disabled/);
});
test('warm progress and answer palette remains semantically distinct',()=>{
  assert.match(section,/\.swipe-play-view \.swipe-track-fill \{\s*background:#666f3f/);
  assert.match(section,/\.swipe-play-view \.swipe-actions \.swipe-yes \{\s*background:#e5e7db/);
  assert.match(section,/\.swipe-play-view \.swipe-actions \.swipe-no \{\s*background:#f7dccf/);
  assert.match(section,/min-height:48px/);
  assert.match(section,/outline:3px solid #314f60/);
});
test('new CSS version matches HTML and JS module imports',()=>{
  const version=html.match(/name="hk-ui-version" content="([^"]+)"/)?.[1];
  assert.ok(version?.startsWith('20261115-des01e-swipe-choices'));
  assert.ok(html.includes('live-app.css?v='+version));
  assert.ok(html.includes('live-app.js?v='+version));
  assert.ok(app.includes('ipip50-ui.js?v='+version));
  assert.ok(ipip.includes('ipip50-retest.js?v='+version));
});
