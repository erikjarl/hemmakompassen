import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {communicationSkillFromHash,openCommunicationSkill,renderCommunicationToolkit} from '../communication/toolkit.js';

const skills=['lyssna','pausa','reparera','losning','kontakt','svaart','validera','onskemal','grans'];
test('all nine fixed links resolve to exercises in both role views',()=>{
 for(const skill of skills){
  assert.equal(communicationSkillFromHash('#kommunikation/'+skill),skill);
  for(const role of ['teen','parent'])assert.ok(renderCommunicationToolkit(role).includes('data-comm-skill="'+skill+'"'));
 }
});
test('unrecognised or injected targets never enter DOM selectors',()=>{
 let queries=0;
 for(const target of ['unknown','lyssna?private=yes','lyssna/extra','LYSSNA','%6cyssna','%E0%A4%A','"><img src=x>','__proto__','constructor','']){
  assert.equal(communicationSkillFromHash('#kommunikation/'+target),null);
  assert.equal(openCommunicationSkill({querySelector:()=>{queries++;}},target),false);
 }
 assert.equal(queries,0);
 for(const hash of ['#nvc','#mi-foralder','#kommunikation','https://evil.example/#kommunikation/lyssna'])assert.equal(communicationSkillFromHash(hash),null);
});
test('target opens with explicit keyboard focus; background render does not move focus',()=>{
 const events=[];
 const detail={open:false,querySelector:()=>({focus:()=>events.push('focus')}),scrollIntoView:()=>events.push('scroll')};
 const root={querySelector:selector=>{assert.equal(selector,'.comm-exercise[data-comm-skill="pausa"]');return detail;}};
 assert.equal(openCommunicationSkill(root,'pausa'),true);
 assert.equal(detail.open,true);
 assert.deepEqual(events,[]);
 assert.equal(openCommunicationSkill(root,'pausa',{focus:true}),true);
 assert.deepEqual(events,['focus','scroll']);
 assert.equal(openCommunicationSkill({querySelector:()=>null},'pausa',{focus:true}),false);
});
test('module shortcuts contain editorial IDs only and all resolve',()=>{
 const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
 const mapping=app.match(/const COMMUNICATION_TARGETS=Object.freeze\(\{([\s\S]*?)\}\);/)[1];
 const links=[...mapping.matchAll(/(\w+):\['([a-z]+)'/g)];
 assert.equal(links.length,6);
 for(const [,module,skill] of links)assert.equal(communicationSkillFromHash('#kommunikation/'+skill),skill,module);
});
