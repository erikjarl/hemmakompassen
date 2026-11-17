import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const personality=readFileSync(new URL('../personality/ipip50-ui.js',import.meta.url),'utf8');
const toolkit=readFileSync(new URL('../communication/toolkit.js',import.meta.url),'utf8');
const section=css.split('/* DES-01H: 2026-11-17 iPhone contrast follow-up (five real tester screenshots).')[1]||'';

function block(selector) {
  const at=section.indexOf(selector);
  assert.notEqual(at,-1,'Missing screenshot selector: '+selector);
  return section.slice(at,section.indexOf('}',at)+1);
}
function luminance(hex) {
  const rgb=hex.match(/[a-f\d]{2}/gi);
  assert.ok(rgb?.length===3,'Expected hex RGB: '+hex);
  const channels=rgb.map(c=>parseInt(c,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);
  return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
}
function contrast(a,b) {
  const l=[luminance(a),luminance(b)].sort((x,y)=>y-x);
  return (l[0]+.05)/(l[1]+.05);
}

test('CSS revision is requested by the app without changing the script entrypoint',()=>{
  assert.ok(section,'Expected new iPhone screenshot contrast section');
  assert.match(html,/&visualfix=mobile-shots1&colorfix=iphone-20261117-1/);
  assert.match(html,/href="\.\/live-app\.css\?v=/);
  assert.match(html,/id="live-mobile-nav"/);
  assert.doesNotMatch(section,/display\s*:\s*none|visibility\s*:\s*hidden|pointer-events\s*:\s*none/i);
});
test('Inbox refresh secondary action has dark text on light sage',()=>{
  const s=block('.family-chat .family-chat-compose-actions [data-family-chat-refresh]');
  assert.match(s,/background:#e5e7db/);
  assert.match(s,/color:#394627/);
  assert.match(app,/data-family-chat-refresh>Uppdatera konversationen/);
});
test('nested shared Swipe activities do not inherit midnight li background',()=>{
  const s=block('.swipe-unified-list > li .swipe-unified-statements > li');
  assert.match(s,/background:#e5e7db/);
  assert.match(s,/color:#302b26/);
  assert.match(app,/class="swipe-match-list swipe-unified-list"/);
  assert.match(app,/class="swipe-unified-statements"/);
});
test('Schyssta disclosures, ongoing rules and filter controls have light surfaces',()=>{
  assert.match(block(':is(.schyssta-compose-panel,.schyssta-search-panel,.schyssta-extra-panel)'),/background:#fff9f1/);
  assert.match(block('.schyssta-filter-group[data-schyssta-filter-group="ongoing"] > .live-panel'),/background:#fff9f1/);
  assert.match(block('.schyssta-filter-toolbar :is(input,select)'),/color:#302b26/);
  assert.match(app,/class="schyssta-compose-panel"/);
  assert.match(app,/class="schyssta-search-panel"/);
});
test('communication reflection inputs and hints remain legible',()=>{
  assert.match(block('.comm-toolkit .comm-fields label span'),/color:#534c44/);
  assert.match(block('.comm-toolkit .comm-fields :is(textarea,input,select)'),/background:#fffdf8/);
  assert.match(block('.comm-toolkit .comm-fields :is(textarea,input,select)'),/color:#302b26/);
  assert.match(toolkit,/id="comm-reflection-form"/);
  assert.match(toolkit,/id="comm-reflection-heard/);
});
test('personality has a light canvas, cards and dark legend without touching IPIP values',()=>{
  assert.match(block('.live-main:has(#live-app > .pf-intro)'),/background:#f8f2ea/);
  assert.match(block(':is(.pf-results,.pf-overview,.pf-survey,.pf-sharing,.pf-comparison)'),/background:#fff9f1/);
  assert.match(block(':is(p,.live-muted,.pf-status,.pf-legend,.pf-reference-legend)'),/color:#534c44/);
  assert.match(personality,/class="pf-intro pf-intro-complete"/);
  assert.match(personality,/class="live-panel pf-results"/);
});
test('selected normal-text palette pairs meet at least 4.5:1 WCAG contrast',()=>{
  const pairs=[
    ['394627','e5e7db'], // olive on sage
    ['302b26','e5e7db'], // primary text on sage
    ['534c44','fff9f1'], // description on cream
    ['302b26','fffdf8'], // input on near-white
    ['302b26','f8f2ea'], // personality page
    ['fff9f1','666f3f'], // primary button
    ['394627','fff9f1']  // headings on cream
  ];
  for(const [foreground,background] of pairs) {
    assert.ok(contrast(foreground,background)>=4.5,
      '#'+foreground+' on #'+background+' = '+contrast(foreground,background).toFixed(2)+':1');
  }
});
