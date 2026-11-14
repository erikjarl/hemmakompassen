import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
function lum(hex){
 const s=hex.replace('#','');
 const rgb=[0,2,4].map(i=>parseInt(s.slice(i,i+2),16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
 return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
}
const contrast=(a,b)=>{const [hi,lo]=[lum(a),lum(b)].sort((x,y)=>y-x);return(hi+.05)/(lo+.05);};
test('DES-01D homepage hero uses a warm light palette only in hero scope',()=>{
 const start=css.lastIndexOf('/* DES-01D: first warm');
 assert.ok(start>0,'DES-01D override exists');
 const scoped=css.slice(start);
 assert.match(scoped,/\.home-hero\s*\{/);
 assert.match(scoped,/\.home-hero h1/);
 assert.match(scoped,/\.home-kicker/);
 assert.match(scoped,/\.home-hero-link/);
 assert.doesNotMatch(scoped,/(?:^|\n)\s*(?:body|\.live-mobile|\.live-nav|\.swipe-playing-card)\s*\{/);
 assert.match(html,/live-app\.css\?v=202611\\d\\d-des01d-[a-z0-9-]+/);
});
test('DES-01D main text, secondary text and CTA meet minimum 4.5 contrast on warm surface',()=>{
 for(const [fg,bg,label] of [
   ['#302b26','#fff9f1','heading'],
   ['#665e54','#f8f2ea','body'],
   ['#394627','#e5e7db','kicker'],
   ['#394627','#fff9f1','link']
 ])assert.ok(contrast(fg,bg)>=4.5,label+': contrast '+contrast(fg,bg).toFixed(2));
});
