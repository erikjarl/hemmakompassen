import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const app=read('live-app.js');
const visual=read('tests/visual.mjs');
const account=read('konto.html');
const doc=read('docs/fun-00-functional-test-matrix.md');

const primary=['hem','inkorg','swipe','personlighet','kommunikation','regler','medlare','installningar'];
const extra=['insikter','nvc','mi-foralder'];
const forms=['email-form','signup-form','reset-form','password-form','name-form','accept-form'];

test('FUN-00 enumerates all eight actual primary routes and three reachable subroutes',()=>{
 const nav=app.match(/const nav=\[([^\n]+)\];/)?.[1];
 assert.ok(nav,'Cannot find primary navigation declaration');
 for(const route of primary){
   assert.match(nav,new RegExp("\\['"+route+"','"),'Navigation includes '+route);
   assert.match(visual,new RegExp("'"+route+"'"),'Visual inventory includes '+route);
 }
 for(const route of extra){
   assert.match(app,new RegExp("'"+route+"'"),'App recognizes subroute '+route);
   assert.match(visual,new RegExp("'"+route+"'"),'Visual inventory includes subroute '+route);
 }
 assert.match(visual,/page\.locator\(nav\+' a\[href="#'\+route\+'"\]'\)/,
   'Browser inventory uses actual clicked primary routes, not only static selectors');
});
test('FUN-00 role and viewport matrix declares dimensions and limitations',()=>{
 for(const token of ['parent-mobile-320','teen-mobile-390','parent-desktop-1440','parent-unpaired-390']){
   assert.ok(visual.includes(token),'Missing synthetic scenario '+token);
 }
 assert.match(visual,/controlsStatus:'discovered-not-individually-tested'/);
 assert.match(visual,/SYNTHETIC ONLY/);
 assert.match(visual,/functional-controls-synthetic\.json/);
 assert.match(doc,/Två verkligt inloggade konton:[^\n]*Ej verifierat/);
 assert.match(doc,/Fysisk iPhone\/VoiceOver:[^\n]*Ej verifierat/);
});
test('FUN-01 account form inventory reflects existing controls',()=>{
 for(const id of forms){
   assert.match(account,new RegExp('id="'+id+'"'),'Account form '+id+' exists');
   assert.ok(doc.includes(String.fromCharCode(96)+id+String.fromCharCode(96)),'Matrix includes form '+id);
 }
 for(const id of ['create-family','make-invite','invite-qr','accept-form','logout']){
   assert.match(account,new RegExp('id="'+id+'"'),'Account flow contains '+id);
 }
});
test('FUN-00 matrix links all modules to real test files and clearly names evidence quality',()=>{
 for(const id of ['FUN-01','FUN-02','FUN-03','FUN-04','FUN-05','FUN-06'])
   assert.match(doc,new RegExp('\\| '+id+'\\.'),'Missing traceable workflow '+id);
 for(const status of ['Syntetisk CI','Kodkontrakt','Ej testat i verklig session'])
   assert.ok(doc.includes(status),'Verification legend missing '+status);
 for(const file of ['tests/visual.mjs','tests/mi-guide.test.mjs','tests/ipip50-ui.test.mjs',
   'tests/live-schyssta-list.test.mjs','tests/ai-result-analysis.test.mjs']){
   assert.ok(existsSync(new URL('../'+file,import.meta.url)),'Evidence file missing '+file);
   assert.ok(doc.includes(file),'Documentation missing evidence '+file);
 }
});

test('FUN-00 distinguishes actual HTML/ARIA name evidence from mere placeholder hints',()=>{
 assert.match(visual,/el\.labels/,'Explicit and implicit HTML labels must be inspected');
 assert.match(visual,/aria-labelledby/,'ARIA ID-reference names must be inspected');
 assert.match(visual,/needsManualNameReview/,'Uncertain names are explicitly flagged');
 assert.match(visual,/nameProbe/,'Real Chromium DOM probes test the name extraction algorithm');
 assert.match(visual,/visibleControlOccurrences/,'Counts are render occurrences rather than unique buttons');
 assert.match(visual,/manualNameReviewOccurrences/,'Review candidates are explicitly counted');
 assert.match(visual,/NOT unique controls or individually passed functional tests/,
   'Inventory limitations must be explicit in the generated artifact');
});
