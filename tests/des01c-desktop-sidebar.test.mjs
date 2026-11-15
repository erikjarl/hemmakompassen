import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const scope=css.slice(css.lastIndexOf('/* DES-01C: warm desktop navigation shell'));
const lum=h=>{
 const v=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
 return .2126*v[0]+.7152*v[1]+.0722*v[2];
};
const ratio=(a,b)=>{const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
test('DES-01C desktop sidebar styles stay isolated from swipeable mobile navigation',()=>{
 assert.match(scope,/@media\s*\(min-width:801px\)/);
 assert.match(scope,/body \.live-layout \.live-sidebar/);
 assert.match(scope,/body \.live-sidebar #live-desktop-nav a\[aria-current=page\]/);
 assert.match(scope,/#live-desktop-nav a:focus-visible/);
 assert.doesNotMatch(scope,/#live-mobile-nav|\.live-mobile|touch-action|overflow-x/);
 assert.match(html,/id="live-mobile-nav"/);
 assert.match(html,/id="live-desktop-nav"/);
});
test('DES-01C desktop navigation has readable contrast and coordinated CSS cache',()=>{
 for(const [ink,surface] of [['302b26','f8f2ea'],['394627','f8f2ea'],['302b26','e5e7db'],['665e54','f8f2ea']])
   assert.ok(ratio(ink,surface)>=4.5,ink+' on '+surface);
 const version='20261115-des01c-light-sidebar1';
 assert.match(html,new RegExp('live-app\\.css\\?v='+version));
 assert.match(html,new RegExp('live-app\\.js\\?v='+version));
 assert.match(js,new RegExp('ipip50-ui\\.js\\?v='+version));
});
