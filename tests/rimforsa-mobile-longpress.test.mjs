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

test('Rimforsa: pilknappar är inte markerbara texttecken', () => {
  for (const dir of ['up', 'left', 'down', 'right']) {
    const button = html.match(new RegExp('<button[^>]+data-dir="' + dir + '"[^>]*>([^<]*)</button>'));
    assert.ok(button, 'Missing direction button: ' + dir);
    assert.equal(button[1], '', 'Direction button must not contain selectable arrow text');
  }
  assert.match(html, /\.dpad button::before\{[^}]*border-bottom:16px solid/);
  for (const dir of ['down', 'left', 'right']) {
    assert.match(html, new RegExp('\\.dpad button\\[data-dir=' + dir + '\\]::before\\{[^}]*transform:rotate\\('));
  }
});

test('Rimforsa: iOS långtryck stoppas med icke-passiva touch-lyssnare på pilarna', () => {
  assert.match(html, /button\.addEventListener\('touchstart',ev=>\{if\(ev\.cancelable\)ev\.preventDefault\(\);if\(!keys\[dir\]\)press\(\)\},\{passive:false\}\)/);
  assert.match(html, /button\.addEventListener\('touchmove',ev=>\{if\(ev\.cancelable\)ev\.preventDefault\(\)\},\{passive:false\}\)/);
  assert.match(html, /button\.addEventListener\('touchend',release,\{passive:false\}\)/);
  assert.match(html, /button\.addEventListener\('pointerdown',ev=>\{ev\.preventDefault\(\);press\(\)/);
  assert.match(html, /for\(const evt of \['pointerup','pointercancel','lostpointercapture'\]\)button\.addEventListener\(evt,release\)/);
});
