import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const s=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const guard=s.match(/document\.addEventListener\('keydown',e=>\{[\s\S]*?(?=\n\}\);\ndocument\.addEventListener\('submit')/);
assert.ok(guard,'The global keyboard handler is available');
assert.match(guard[0],/document\.activeElement\?\.id==='swipe-card'/,'Only a focused card can save with arrow keys');
assert.match(guard[0],/e\.target===document\.activeElement/,'A bubbled keyboard event from child controls cannot save');
assert.match(guard[0],/!e\.repeat/,'Repeated held key must not submit another answer');
assert.match(guard[0],/!e\.altKey&&!e\.ctrlKey&&!e\.metaKey&&!e\.shiftKey/,'Modified arrow keys are never answers');
assert.doesNotMatch(guard[0],/const interactive=/,'Do not treat any non-interactive page region as a swipable card');
assert.ok((s.match(/Med tangentbordet: ← eller →./g)||[]).length===2,
  'Both general and themed cards explain explicit keyboard control');
const render=s.match(/function render\(\)\{[\s\S]*?(?=\nasync function refresh\(\))/)?.[0];
assert.ok(render,'The main renderer is available');
assert.match(render,/focusedSwipeCard=page\(\)==='swipe'&&document\.activeElement\?\.id==='swipe-card'/,
  'Rerender detects a focused playing card');
assert.match(render,/replacement\?\.getAttribute\('aria-label'\)===focusedSwipeCard/,
  'Only the same visible question is eligible to retain focus');
assert.match(render,/replacement\.focus\(\{preventScroll:true\}\)/,
  'A match refresh must not drop keyboard focus from the current card');

console.log('PASS: swipe keyboard controls require focus on the playing card');
