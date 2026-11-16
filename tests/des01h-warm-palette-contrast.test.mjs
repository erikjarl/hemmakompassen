import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const tokens=readFileSync(new URL('../design-tokens.css',import.meta.url),'utf8');
const feedback=readFileSync(new URL('../feedback.css',import.meta.url),'utf8');
const app=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const names=['bg','surface','surface-alt','ink','muted','olive','sage-pale','border','focus'];
const palette=Object.fromEntries(names.map(name=>{
  const match=tokens.match(new RegExp('--hk-'+name+':\\s*(#[0-9a-fA-F]{6})\\s*;'));
  assert.ok(match,'missing canonical --hk-'+name);
  return [name,match[1]];
}));

function luminance(hex){
  const channels=hex.slice(1).match(/.{2}/g).map(part=>{
    const value=parseInt(part,16)/255;
    return value<=0.04045?value/12.92:((value+0.055)/1.055)**2.4;
  });
  return 0.2126*channels[0]+0.7152*channels[1]+0.0722*channels[2];
}
function contrast(first,second){
  const a=luminance(first),b=luminance(second);
  return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
}
// Selected pairs, not a complete computed-style or Safari accessibility audit.
const pairs=[
  ['main text on cream',palette.ink,palette.bg],
  ['secondary text on cream',palette.muted,palette.bg],
  ['secondary text on light panel',palette.muted,palette.surface],
  ['main text on neutral card',palette.ink,palette['surface-alt']],
  ['primary button label',palette.surface,palette.olive],
  ['AI-result heading','#394627',palette.surface],
  ['swipe information text','#534c44',palette.surface],
  ['feedback link on light form','#394627',palette.surface]
];

test('DES-01H: selected warm-theme normal-text pairs meet WCAG AA contrast',()=>{
  for(const [label,foreground,background] of pairs){
    const value=contrast(foreground,background);
    assert.ok(value>=4.5,label+' has only '+value.toFixed(2)+':1 contrast');
  }
});

test('tested presentation colors remain in their corresponding components',()=>{
  assert.match(feedback,/\.hk-feedback-dialog\s*\{\s*background:#fff9f1;[\s\S]*?color:#302b26/);
  assert.match(feedback,/\.hk-feedback-dialog button\[type=submit\]\s*\{\s*background:#666f3f;\s*color:#fff9f1;/);
  assert.match(app,/\.ai-result-panel\s*\{\s*background:#fff9f1;/);
  assert.match(app,/\.ai-result-panel h3\s*\{\s*color:#394627;/);
  assert.match(app,/\.swipe-results \.swipe-rule-summary,[\s\S]*?background:#e5e7db;/);
});
