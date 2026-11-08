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
  assert.match(html,/<details class="live-panel comm-safety">/,'MI must include safety guidance for unsafe situations');
  assert.match(html,/href="tel:112"/);
  assert.match(html,/href="tel:1177"/);
  assert.match(html,/href="tel:0771505050"/);
  assert.match(html,/Barnet ska inte behöva ta ansvar/);
  assert.doesNotMatch(html,/href="tel:116111"/,'parent-only MI must not show child help as though it were adult-specific');
  assert.match(html,/ditt vuxenansvar/);
  assert.match(html,/Forskning om MI i vård kan inte automatiskt överföras/);
  assert.match(html,/Schyssta listan/);
  assert.match(html,/Förstod jag rätt/);
  assert.match(html,/Fråga om lov innan du berättar/);
  assert.match(html,/Utforska ambivalens utan att argumentera/);
  assert.match(html,/du måste kunna acceptera att svaret blir nej/);
  assert.equal(MI_PARENT_SOURCES.length,4);
  assert.ok(MI_PARENT_SOURCES.every(x=>x.url.startsWith('https://')&&html.includes(x.url)));
  assert.ok(!html.includes('onclick='));
});

test('MI gets a distinct route gated by parent role and correct navigation highlighting',()=>{
  assert.match(live,/\['insikter','mi-foralder','nvc'\]\.includes\(h\)/);
  assert.match(live,/key==='mi-foralder'\)return viewerRole\(\)==='parent'\?renderParentMiGuide\(\)/);
  assert.match(live,/if\(key==='kommunikation'\)return/);
  assert.match(live,/if\(key==='kommunikation'\)return renderCommunicationToolkit\(viewerRole\(\)\)/);
  assert.match(live,/\['mi-foralder','nvc'\]\.includes\(route\)&&key==='kommunikation'/);
  assert.match(live,/viewerRole\(\)==='parent'\?'<p>För dig som förälder: beskriv ditt önskemål/);
  assert.match(live,/Läs guiden om motiverande samtal<\/a>/);
  assert.match(build,/communication\/mi-guide\.js/);
});
