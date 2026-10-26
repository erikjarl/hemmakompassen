import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const extracted=source.match(/async function saveSwipeAnswer\([\s\S]*?(?=\nfunction nextVisibleAfter)/);
assert.ok(extracted,'General swipe save and skip functions exist');

function harness({upsert=async()=>({error:null}),rpc=async()=>({error:null})}={}){
  const calls={writes:0,rpcs:[],renders:0,matches:0,unlocks:0};
  const state={
    user:{id:'parent'},sharedSession:7,swipeBusy:true,swipeReview:false,swipeSaveError:'',swipeIndex:1,
    swipeAnswers:new Map([['general-01',true]]),skippedUnderstanding:new Set(),members:[{role:'parent'},{role:'teen'}],
    visibleGeneralIndices:()=>[0,1],swipeCardId:i=>'general-'+String(i+1).padStart(2,'0'),
    GENERAL_CARDS:[{type:'match'},{type:'match'},{type:'match'}],viewerRole:()=>state.user?.id==='teen'?'teen':'parent',
    nextVisibleAfter:i=>i+1,nextUnanswered:i=>i,
    $:()=>({textContent:''}),render:()=>{calls.renders++;},
    fetchSwipeMatches:()=>{calls.matches++;},fetchThemeUnlock:()=>{calls.unlocks++;},
    db:{
      from:table=>{assert.equal(table,'swipe_answers');return {upsert:(row,options)=>{calls.writes++;assert.equal(options.onConflict,'user_id,deck_id,card_id');return upsert(row);}}},
      rpc:(name,args)=>{calls.rpcs.push({name,args});return rpc(name,args);},
    },
  };
  vm.runInNewContext(extracted[0]+'\nthis.run=saveSwipeAnswer;this.skip=skipUnderstandingCard;',state);
  return {state,calls};
}

{
  const h=harness();
  h.state.user={id:'another'};
  await h.state.run('yes',1,'parent',7);
  assert.equal(h.calls.writes,0,'An animated swipe must not write after account switch');
}
{
  let finish;
  const h=harness({upsert:()=>new Promise(resolve=>{finish=resolve;})});
  const pending=h.state.run('yes',1,'parent',7);
  assert.equal(h.calls.writes,1,'The save began in the original session');
  h.state.user={id:'another'};h.state.sharedSession=8;
  finish({error:null});
  await pending;
  assert.equal(h.state.swipeAnswers.has('general-02'),false,'Old account result must not contaminate the new account');
  assert.equal(h.calls.renders,0,'Stale response must not redraw another account');
  assert.equal(h.calls.matches,0,'Stale response must not refresh shared results');
}
{
  const h=harness();
  await h.state.run('yes',1,'parent',7);
  assert.equal(h.state.swipeAnswers.get('general-02'),true);
  assert.equal(h.calls.matches,1);
  assert.equal(h.calls.unlocks,1,'A parent completing the 21 visible match cards must recheck unlock');
}
{
  const h=harness();
  h.state.user={id:'teen'};
  h.state.swipeBusy=false;
  h.state.GENERAL_CARDS[1].type='understanding';
  h.state.visibleGeneralIndices=()=>[0,1,2];
  h.state.skippedUnderstanding.add('general-02');
  await h.state.run('yes',2,'teen',7);
  assert.equal(h.calls.unlocks,1,'A teen who explicitly skipped an understanding card can complete the visible deck');
}
{
  const h=harness({upsert:async()=>{throw Error('synthetic network failure');}});
  await h.state.run('yes',1,'parent',7);
  assert.match(h.state.swipeSaveError,/kunde inte sparas/,'A rejected upsert shows a recoverable error');
  assert.equal(h.calls.renders,1);
  assert.equal(h.calls.matches,0);
}
{
  const h=harness();
  h.state.user={id:'teen'};
  h.state.swipeBusy=false;
  h.state.GENERAL_CARDS[1].type='understanding';
  h.state.swipeAnswers.set('general-02',true);
  await h.state.skip(1,'teen',7);
  assert.equal(JSON.stringify(h.calls.rpcs[0]),JSON.stringify({name:'set_understanding_card_state',args:{p_card_id:'general-02',p_answer:null,p_skipped:true}}));
  assert.equal(h.state.swipeAnswers.has('general-02'),false,'A successful skip revokes the prior private answer');
  assert.equal(h.state.skippedUnderstanding.has('general-02'),true,'A successful skip is reflected locally');
}
{
  const h=harness({rpc:async()=>({error:{message:'synthetic RPC failure'}})});
  h.state.user={id:'teen'};
  h.state.swipeBusy=false;
  h.state.GENERAL_CARDS[1].type='understanding';
  h.state.swipeAnswers.set('general-02',true);
  await h.state.skip(1,'teen',7);
  assert.equal(h.state.swipeAnswers.get('general-02'),true,'A failed skip must retain the prior answer');
  assert.equal(h.state.skippedUnderstanding.has('general-02'),false,'A failed skip must not invent local state');
  assert.match(h.state.swipeSaveError,/kunde inte sparas/);
}
{
  let finish;
  const h=harness({rpc:()=>new Promise(resolve=>{finish=resolve;})});
  h.state.user={id:'teen'};
  h.state.swipeBusy=false;
  h.state.GENERAL_CARDS[1].type='understanding';
  const pending=h.state.skip(1,'teen',7);
  h.state.user={id:'another'};h.state.sharedSession=8;
  finish({error:null});
  await pending;
  assert.equal(h.state.skippedUnderstanding.has('general-02'),false,'A stale skip response must not contaminate another session');
}
{
  const h=harness();
  h.state.user={id:'teen'};
  h.state.GENERAL_CARDS[1].type='understanding';
  h.state.skippedUnderstanding.add('general-02');
  await h.state.run('no',1,'teen',7);
  assert.equal(JSON.stringify(h.calls.rpcs[0]),JSON.stringify({name:'set_understanding_card_state',args:{p_card_id:'general-02',p_answer:false,p_skipped:false}}));
  assert.equal(h.state.swipeAnswers.get('general-02'),false,'A B-card answer is stored after RPC success');
  assert.equal(h.state.skippedUnderstanding.has('general-02'),false,'Answering revokes the private skip locally');
}
console.log('PASS: session-isolated saves and atomic understanding-card answers/skips');
