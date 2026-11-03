import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {renderParentMiGuide,MI_PARENT_SOURCES} from '../communication/mi-guide.js';

const live=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const build=readFileSync(new URL('../scripts/build-static.mjs',import.meta.url),'utf8');

test('MI editorial support states its limits, respects teenager autonomy, and uses verified links',()=>{
  const html=renderParentMiGuide();
  assert.match(html,/inte<\/strong> en prövad föräldrametod/);
  assert.match(html,/Ett nej är inte ett samtycke/);
  assert.match(html,/ditt vuxenansvar/);
  assert.match(html,/Forskning om MI i vård kan inte automatiskt överföras/);
  assert.match(html,/Schyssta listan/);
  assert.match(html,/Förstod jag rätt/);
  assert.equal(MI_PARENT_SOURCES.length,3);
  assert.ok(MI_PARENT_SOURCES.every(x=>x.url.startsWith('https://')&&html.includes(x.url)));
  assert.ok(!html.includes('onclick='));
});

test('MI gets a distinct route gated by parent role and correct navigation highlighting',()=>{
  assert.match(live,/\['insikter','mi-foralder'\]\.includes\(h\)/);
  assert.match(live,/key==='mi-foralder'\)return viewerRole\(\)==='parent'\?renderParentMiGuide\(\)/);
  assert.match(live,/if\(key==='kommunikation'\)return/);
  assert.match(live,/viewerRole\(\)==='parent'\?card/);
  assert.match(live,/route==='mi-foralder'&&key==='kommunikation'/);
  assert.match(live,/viewerRole\(\)==='parent'\?'<p><a href="#mi-foralder"/);
  assert.match(build,/communication\/mi-guide\.js/);
});
