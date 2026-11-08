import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const start=app.indexOf('async function reconcileOwnImportanceValue(row){');
const end=app.indexOf('\nconst joinSwedish=',start);
assert.ok(start>=0&&end>start,'Use the production readback and save handlers');
const functions=app.slice(start,end);

function harness({server=null,readError=null,throwRead=false}={}){
  const writes=[],reads=[],input={
    dataset:{deckId:'general',cardId:'general-01'},
    value:'1',attributes:{},
    setAttribute(key,value){this.attributes[key]=value;}
  };
  const status={textContent:''};
  const swipeStatus={textContent:'Vänta tills viktighetsskattningen har sparats innan du väljer Ja eller Nej. Försök sedan igen.'};
  let write=async()=>({error:null});
  let stored=server;
  const ctx={
    db:{from(table){
      assert.equal(table,'swipe_importance');
      const filters={};
      const query={
        select(columns){assert.equal(columns,'deck_id,card_id,importance');return query;},
        eq(key,value){filters[key]=value;return query;},
        async maybeSingle(){
          reads.push({...filters});
          if(throwRead)throw Error('Offline');
          return {data:stored,error:readError};
        }
      };
      return {upsert(row,options){
        assert.equal(options.onConflict,'user_id,deck_id,card_id');
        writes.push(row);return write(row);
      },...query};
    }},
    user:{id:'parent-1'},sharedSession:8,importanceAvailable:true,
    importancePending:new Map(),importanceSaving:new Set(),swipeImportance:new Map(),
    validImportanceCard:()=>true,importanceKey:(deck,card)=>deck+'|'+card,
    importanceValueText:value=>value===1?'Mycket viktigt':value===-1?'Mindre viktigt':'Neutral, inte prioriterad',
    sharedPrioritiesEnabled:false,priorityShares:new Set(),
    fetchSwipeMatches:async()=>{},
    IMPORTANCE_WAIT_MESSAGE:swipeStatus.textContent,
    document:{querySelector:selector=>selector==='[data-importance]'?input:selector==='[data-importance-status]'?status:null},
    $:id=>id==='swipe-save-status'?swipeStatus:null,
    Date
  };
  vm.runInNewContext(functions+'\nthis.reconcile=reconcileOwnImportanceValue;this.saveImportance=saveImportance;',ctx);
  const save=value=>ctx.saveImportance('general','general-01',value,'parent-1',8);
  return {ctx,save,writes,reads,input,status,swipeStatus,setWrite:fn=>write=fn,setStored:value=>stored=value};
}
const saved=value=>({deck_id:'general',card_id:'general-01',importance:value});

test('a lost write acknowledgement is reconciled with the exact saved private value',async()=>{
  const h=harness({server:saved(1)});
  h.setWrite(async()=>({error:{message:'lost ACK'}}));
  await h.save(1);
  assert.equal(h.ctx.swipeImportance.get('general|general-01'),1);
  assert.equal(h.reads.length,1);
  assert.deepEqual(h.reads[0],{user_id:'parent-1',deck_id:'general',card_id:'general-01'});
  assert.match(h.status.textContent,/sparad privat/i);
  assert.match(h.swipeStatus.textContent,/är sparad/i);
});

test('old confirmed server value cannot be mistaken for the requested rating',async()=>{
  const h=harness({server:saved(0)});
  h.setWrite(async()=>({error:{message:'offline'}}));
  await h.save(1);
  assert.equal(h.ctx.swipeImportance.has('general|general-01'),false);
  assert.equal(h.input.value,'0');
  assert.match(h.status.textContent,/kunde inte bekräftas som sparad/i);
});

test('unreadable server value is unknown, not falsely declared unsaved',async()=>{
  const h=harness({server:saved(1),readError:{message:'offline'}});
  h.setWrite(async()=>({error:{message:'timeout'}}));
  await h.save(1);
  assert.match(h.status.textContent,/går inte att kontrollera om viktigheten sparades/i);
  assert.match(h.swipeStatus.textContent,/går inte att kontrollera/i);
  assert.equal(h.ctx.swipeImportance.has('general|general-01'),false);
});

test('invalid or unrelated server rows never confirm an ambiguous write',async()=>{
  for(const row of [
    {deck_id:'other',card_id:'general-01',importance:1},
    {deck_id:'general',card_id:'other',importance:1},
    {deck_id:'general',card_id:'general-01',importance:'1'},
    undefined
  ]){
    const h=harness({server:row});
    assert.equal(await h.ctx.reconcile({user_id:'parent-1',deck_id:'general',card_id:'general-01',importance:1}),'unknown');
  }
  const h=harness({server:null});
  assert.equal(await h.ctx.reconcile({user_id:'parent-1',deck_id:'general',card_id:'general-01',importance:1}),'different');
});

test('a thrown readback exception also produces an unknown result',async()=>{
  const h=harness({throwRead:true});
  assert.equal(await h.ctx.reconcile({user_id:'parent-1',deck_id:'general',card_id:'general-01',importance:1}),'unknown');
});

test('a later slider adjustment is not discarded if the preceding write loses its ACK',async()=>{
  const h=harness({server:saved(0)});
  let finishFirst,number=0;
  h.setWrite(()=>++number===1
    ?new Promise(resolve=>{finishFirst=resolve;})
    :Promise.resolve({error:null}));
  const pending=h.save(-1);
  await Promise.resolve();
  assert.equal(typeof finishFirst,'function');
  await h.save(1);
  finishFirst({error:{message:'first write timed out'}});
  await pending;
  assert.equal(h.writes.length,2,'The queued newest rating must be attempted');
  assert.equal(h.writes[0].importance,-1);
  assert.equal(h.writes[1].importance,1);
  assert.equal(h.ctx.swipeImportance.get('general|general-01'),1);
  assert.match(h.status.textContent,/sparad privat/i);
});

test('stale readback from a former session cannot update the current account',async()=>{
  const h=harness({server:saved(1)});
  let finishRead;
  h.setWrite(async()=>({error:{message:'timeout'}}));
  h.ctx.db.from=()=>({
    upsert:async()=>({error:{message:'timeout'}}),
    select:()=>({
      eq(){return this;},
      maybeSingle:()=>new Promise(resolve=>{finishRead=resolve;})
    })
  });
  const pending=h.save(1);
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(typeof finishRead,'function');
  h.ctx.user={id:'another-account'};
  h.ctx.sharedSession=9;
  finishRead({data:saved(1),error:null});
  await pending;
  assert.equal(h.ctx.swipeImportance.has('general|general-01'),false);
});
