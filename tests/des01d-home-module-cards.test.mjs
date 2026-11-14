import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const js=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const scoped=css.slice(css.lastIndexOf('/* DES-01D: warm module tiles'));
function luminance(hex){
  const rgb=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255)
    .map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
test('DES-01D module tiles scope their visual changes to home',()=>{
  assert.match(js,/<div class="live-cards home-module-cards">/);
  assert.match(scoped,/\.home-module-cards > \.live-panel:nth-child\(4n \+ 1\)/);
  assert.match(scoped,/\.home-module-cards a:focus-visible/);
  assert.doesNotMatch(scoped,/(?:^|\n)\s*(?:body|\.live-mobile|\.live-sidebar|\.swipe-playing-card)\s*\{/);
  for(const bg of ['fff9f1','e5e7db','f7dccf','ece4d6']){
    assert.ok(contrast('302b26',bg)>=4.5,'Heading on '+bg);
    assert.ok(contrast('534c44',bg)>=4.5,'Description on '+bg);
    assert.ok(contrast('394627',bg)>=4.5,'Link on '+bg);
  }
});
