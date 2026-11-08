import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const start=app.indexOf('async function reconcileOwnSwipeAnswer(row){');
const end=app.indexOf('async function saveThemeAnswer(direction,index,deckId,viewer,session){',start);
assert.ok(start>=0&&end>start,'Use production answer reconciliation helpers');

function harness(options={}){
 const {error=null,throws=false}=options;
 const saved=Object.hasOwn(options,'saved')?options.saved:{deck_id:'general',card_id:'general-01',answer:true};
 const queries=[];
 const ctx={db:{from(table){
  assert.equal(table,'swipe_answers');
  const filters={};
  const chain={
   select(columns){assert.equal(columns,'deck_id,card_id,answer');return chain;},
   eq(key,value){filters[key]=value;return chain;},
   async maybeSingle(){queries.push({...filters});if(throws)throw Error('offline');return {data:saved,error};}
  };
  return chain;
 }}};
 vm.runInNewContext(app.slice(start,end)+ '\nthis.reconcile=reconcileOwnSwipeAnswer;this.message=swipeAnswerRecheckMessage;',ctx);
 return {ctx,queries};
}
const request={user_id:'parent',deck_id:'general',card_id:'general-01',answer:true};

for(const [name,saved,expected] of [
 ['same server YES after lost acknowledgement',{deck_id:'general',card_id:'general-01',answer:true},'confirmed'],
 ['old server NO does not confirm requested YES',{deck_id:'general',card_id:'general-01',answer:false},'different'],
 ['server retained previous opposite answer',{deck_id:'general',card_id:'general-01',answer:false},'different'],
 ['server has no answer',null,'different'],
 ['server returned another deck',{deck_id:'samtal',card_id:'general-01',answer:true},'unknown'],
 ['server returned another card',{deck_id:'general',card_id:'general-02',answer:true},'unknown'],
 ['server returned invalid answer',{deck_id:'general',card_id:'general-01',answer:'yes'},'unknown'],
 ['server returned no data field',undefined,'unknown']
]){
 test(name,async()=>{
  const h=harness({saved});
  const result=await h.ctx.reconcile(request);
  assert.equal(result,expected);
  assert.deepEqual(Object.fromEntries(Object.entries(h.queries[0])),{
   user_id:'parent',deck_id:'general',card_id:'general-01'
  },'Readback is scoped to the viewer and exact card');
 });
}
test('saved NO is also positively confirmed after a lost acknowledgement',async()=>{
 const h=harness({saved:{deck_id:'samtal',card_id:'samtal-01',answer:false}});
 assert.equal(await h.ctx.reconcile({user_id:'teen',deck_id:'samtal',card_id:'samtal-01',answer:false}),'confirmed');
});
test('failed or thrown readback says unknown, never definitely unsaved',async()=>{
 const a=harness({error:{message:'temporary outage'},saved:null});
 const b=harness({throws:true});
 assert.equal(await a.ctx.reconcile(request),'unknown');
 assert.equal(await b.ctx.reconcile(request),'unknown');
 assert.match(a.ctx.message('unknown'),/går inte att kontrollera om ditt svar sparats/i);
 assert.doesNotMatch(a.ctx.message('unknown'),/kunde inte sparas/i);
 assert.match(a.ctx.message('different'),/kunde inte bekräftas som sparat/i);
});
test('both ordinary general and theme save paths recheck only on write error',()=>{
 const general=app.slice(app.indexOf('async function saveSwipeAnswer(direction'),app.indexOf('async function skipUnderstandingCard('));
 const theme=app.slice(app.indexOf('async function saveThemeAnswer(direction'),app.indexOf('function advanceThemeSwipe(direction)'));
 assert.match(general,/error&&GENERAL_CARDS\[index\]\?\.type!=='understanding'/);
 assert.match(general,/await reconcileOwnSwipeAnswer\(row\)/);
 assert.match(theme,/error\?await reconcileOwnSwipeAnswer\(row\):'confirmed'/);
 assert.match(theme,/if\(user\?\.id!==viewer\|\|sharedSession!==session\|\|activeThemeDeck!==deckId\)return;/);
 assert.match(general,/if\(user\?\.id!==viewer\|\|sharedSession!==session\)return;/);
});
