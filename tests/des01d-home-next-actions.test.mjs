import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const live=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const personality=readFileSync(new URL('../personality/ipip50-ui.js',import.meta.url),'utf8');
const start=css.lastIndexOf('/* DES-01D / UX-READ-01: verified next steps');
const end=css.indexOf('/* DES-01D: warm module tiles',start);
const section=css.slice(start,end>=0?end:undefined);

test('DES-01D homepage next actions use scoped warm surfaces and accessible CTA',()=>{
  assert.ok(section.includes('.home-next-actions > .live-panel'));
  assert.match(section,/background:\s*#fff9f1/i);
  assert.match(section,/color:\s*#302b26/i);
  assert.match(section,/\.home-next-actions \.live-muted \{ color:#665e54;/);
  assert.match(section,/\.home-next-actions \.live-button:focus-visible/);
  assert.doesNotMatch(section,/\.live-mobile|\.live-sidebar|\.schyssta-view/);
  const contrast=(a,b)=>{
    const L=x=>{
      const rgb=x.match(/\w\w/g).map(v=>parseInt(v,16)/255)
        .map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
      return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
    };
    const x=L(a),y=L(b);
    return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
  };
  assert.ok(contrast('302b26','fff9f1')>=4.5);
  assert.ok(contrast('665e54','fff9f1')>=4.5);
  assert.ok(contrast('fff9f1','515b32')>=4.5);
});
test('DES-01D cache revision is coordinated with module imports',()=>{
  const version=html.match(/live-app\.css\?v=(202611\d\d-[a-z0-9-]+)/)?.[1];
  assert.ok(version,'DES-01D stylesheet has a version');
  assert.ok(html.includes('live-app.css?v='+version));
  assert.ok(html.includes('live-app.js?v='+version));
  assert.ok(live.includes('ipip50-ui.js?v='+version));
  assert.ok(personality.includes(version));
});
