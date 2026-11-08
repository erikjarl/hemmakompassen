import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const start=app.indexOf('async function reconcileOwnUnderstandingCardState(');
const end=app.indexOf('function swipeAnswerRecheckMessage(result)',start);
assert.ok(start>=0&&end>start,'Production B-state readback helper must be testable');

const id='general-02',viewer='teen-1';
function harness({answer=null,skip=null,answerError=false,skipError=false,throws=false}={}){
 const queries=[];
 const mock={
  swipe_answers:{row:answer,columns:'deck_id,card_id,answer',error:answerError},
  swipe_skips:{row:skip,columns:'deck_id,card_id',error:skipError}
 };
 const state={db:{from(table){
  const info=mock[table];
  assert.ok(info,'The readback must query only own answer and skip tables');
  const filters={};
  const query={
   select(columns){assert.equal(columns,info.columns);return query;},
   eq(key,value){filters[key]=value;return query;},
   async maybeSingle(){
    queries.push({table,columns:info.columns,filters:{...filters}});
    if(throws)throw Error('offline');
    return {data:info.row,error:info.error?{message:'simulated read failure'}:null};
   }
  };
  return query;
 }}};
 vm.runInNewContext(app.slice(start,end)+'\nthis.verify=reconcileOwnUnderstandingCardState;this.message=understandingStateRecheckMessage;',state);
 return {state,queries};
}
const yes={deck_id:'general',card_id:id,answer:true};
const no={deck_id:'general',card_id:id,answer:false};
const skipped={deck_id:'general',card_id:id};

for(const [name,options,expectedAction,result] of [
 ['saved yes is confirmed',{answer:yes},true,'confirmed'],
 ['saved no is confirmed',{answer:no},false,'confirmed'],
 ['saved skip is confirmed',{skip:skipped},'skipped','confirmed'],
 ['old no does not confirm new yes',{answer:no},true,'different'],
 ['old yes does not confirm new no',{answer:yes},false,'different'],
 ['existing answer does not confirm skip',{answer:yes},'skipped','different'],
 ['existing skip does not confirm an answer',{skip:skipped},true,'different'],
 ['no row in either table is not confirmed',{},true,'different'],
 ['no row in either table does not confirm skip',{},'skipped','different'],
 ['both rows present is ambiguous',{answer:yes,skip:skipped},true,'unknown'],
 ['both rows present cannot confirm a skip',{answer:yes,skip:skipped},'skipped','unknown'],
 ['wrong answer card cannot confirm',{answer:{...yes,card_id:'general-03'}},true,'unknown'],
 ['wrong skip card cannot confirm',{skip:{...skipped,card_id:'general-03'}},'skipped','unknown'],
 ['malformed answer cannot confirm',{answer:{...yes,answer:'yes'}},true,'unknown'],
 ['answer read failure is unknown',{answer:yes,answerError:true},true,'unknown'],
 ['skip read failure is unknown',{answer:yes,skipError:true},true,'unknown'],
 ['thrown read failure is unknown',{throws:true},true,'unknown']
]){
 test(name,async()=>{
  const h=harness(options);
  assert.equal(await h.state.verify(id,viewer,expectedAction),result);
  if(!options.throws){
   assert.equal(h.queries.length,2);
   for(const q of h.queries){
    assert.equal(q.filters.user_id,viewer,'Never fetch another account');
    assert.equal(q.filters.deck_id,'general');
    assert.equal(q.filters.card_id,id);
   }
  }
 });
}
test('unrecognized operation is unknown and never counted as a success',async()=>{
 const h=harness({answer:yes});
 assert.equal(await h.state.verify(id,viewer,'share'),'unknown');
});
test('unknown status explains uncertainty for an answer and a skip',()=>{
 const h=harness();
 assert.match(h.state.message('unknown','answer'),/går inte att kontrollera om ditt svar sparades/i);
 assert.match(h.state.message('unknown','skip'),/går inte att kontrollera om din överhoppning sparades/i);
 assert.match(h.state.message('different','answer'),/kunde inte bekräftas som sparad/i);
 assert.match(h.state.message('different','skip'),/kunde inte bekräftas som sparad/i);
});
test('both B answer and B skip use the production readback after write errors',()=>{
 const answerFn=app.slice(app.indexOf('async function saveSwipeAnswer('),app.indexOf('async function skipUnderstandingCard('));
 const skipFn=app.slice(app.indexOf('async function skipUnderstandingCard('),app.indexOf('function nextVisibleAfter('));
 assert.match(answerFn,/await reconcileOwnUnderstandingCardState\(row\.card_id,viewer,row\.answer\)/);
 assert.match(skipFn,/await reconcileOwnUnderstandingCardState\(cardId,viewer,'skipped'\)/);
 assert.match(answerFn,/if\(user\?\.id!==viewer\|\|sharedSession!==session\)return;/);
 assert.match(skipFn,/if\(user\?\.id!==viewer\|\|sharedSession!==session\)return;/);
 // The shared-consent RPC is not invoked by automatic reconciliation.
 assert.doesNotMatch(app.slice(start,end),/set_understanding_card_share|set_understanding_card_state|\.insert\(|\.upsert\(/);
});
