import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../spel/rimforsa/index.html', import.meta.url), 'utf8');

test('Rimforsa: long press does not select text or open iOS callout inside game controls', () => {
  const selector = '.game-frame,.game-frame *,.controls,.controls *';
  const rule = html.split(selector + '{')[1]?.split('}')[0];
  assert.ok(rule, 'Game area and control buttons must share a selection guard');
  for (const css of ['-webkit-user-select:none', 'user-select:none', '-webkit-touch-callout:none']) {
    assert.ok(rule.includes(css), 'Missing CSS for mobile: ' + css);
  }
  assert.match(html, /for\(const zone of \[document\.querySelector\('\.game-frame'\),document\.querySelector\('\.controls'\)\]\)/);
  assert.match(html, /\['contextmenu','selectstart','dragstart'\]/);
  assert.match(html, /zone\.addEventListener\(type,event=>event\.preventDefault\(\)\)/);
});

test('Rimforsa: touch movement and regular page text remain usable', () => {
  assert.match(html, /canvas#world\{[^}]*touch-action:none/);
  assert.match(html, /\.dpad button\{[^}]*touch-action:none/);
  assert.match(html, /button\.addEventListener\('pointerdown',ev=>/);
  assert.match(html, /button\.setPointerCapture\(ev\.pointerId\)/);
  assert.ok(!html.includes('body{-webkit-user-select:none'), 'Do not prevent text selection across the entire page');
});
