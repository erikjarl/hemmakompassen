import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('FBK-02: the existing more-decks shortcut stays a real button above swipe content',()=>{
  assert.match(app,/<header class="swipe-heading">[\s\S]*?<button type="button" class="live-button swipe-more-decks-shortcut" id="swipe-show-more-decks">Gör fler kortlekar/);
  assert.match(app,/if\(e\.target\.closest\('#swipe-show-more-decks'\)&&page\(\)==='swipe'\)/);
  assert.match(app,/if\(chooser\)chooser\.open=true;/);
  assert.match(app,/target\.querySelector\('#swipe-themes-heading'\)\?\.focus/);
});

test('DES-01E: the more-decks shortcut wraps and fills narrow phone width',()=>{
  const scope=css.split('/* DES-01E / FBK-02 / UX-READ-01: make the existing "more decks" action')[1];
  assert.ok(scope,'expected scoped shortcut styles');
  assert.match(scope,/\.swipe-more-decks-shortcut\s*\{[\s\S]*?max-width:100%;[\s\S]*?white-space:normal;/);
  assert.match(scope,/@media \(max-width:430px\)[\s\S]*?\.swipe-more-decks-shortcut\s*\{[\s\S]*?width:100%;[\s\S]*?min-height:48px;/);
  assert.match(scope,/\.swipe-more-decks-shortcut:focus-visible\s*\{\s*outline:3px solid #314f60;/);
  assert.doesNotMatch(scope,/display:none|pointer-events:none|visibility:hidden/);
  assert.match(html,/live-app\.css\?v=[^"\n]*&deckscta=mobile1/);
});
