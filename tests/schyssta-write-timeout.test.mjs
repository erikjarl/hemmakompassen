import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

// Five actual Schyssta handlers, not reconstructed business logic.
const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
function extract(start,end){
  const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,'Read production function bounds: '+start);
  return source.slice(a,b);
}
const helperStart=source.indexOf('async function schysstaWriteRpc(');
const helperEnd=source.indexOf('async function markSchysstaRead(',helperStart);
const helper=helperStart>=0&&helperEnd>helperStart?source.slice(helperStart,helperEnd):'';
const actions=[
  helper,
  extract('async function markSchysstaRead(id){','function validSchysstaReplacementLinks'),
  extract('async function withdrawSchysstaRule(id){','// An already-open inbox'),
  extract('async function proposeSchysstaRule(cardId){','function schysstaView')
].join('\n');
const ID='30000000-0000-4000-8000-000000000019';
const RULE='regler-01';
const step=()=>new Promise(resolve=>setImmediate(resolve));
function deferred(){let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};}
function harness(role){
  const calls=[],renders=[],refreshed=[],timers=new Map();
  let timerId=0;
  const state={
    user:{id:role},members:[{user_id:'parent',role:'parent'},{user_id:'teen',role:'teen'}],
    sharedSession:7,schysstaListEnabled:true,schysstaSaving:new Set(),
    schysstaSubmitting:false,schysstaLoading:false,schysstaError:'',schysstaMessage:'',
    schysstaEndTarget:ID,schysstaDraft:'Vi lyssnar klart innan vi svarar.',
    schysstaDraftOpen:true,schysstaDraftKey:null,schysstaEditTarget:null,
    schysstaSuggestions:[{card_id:RULE}],schysstaRules:[{agreement_id:ID}],
    schysstaManualRules:[],schysstaNotifications:[],schysstaReplacementLinks:[],schysstaHistory:[],
    SCHYSSTA_RULES:{[RULE]:'Vi lyssnar på varandra.'},
    SCHYSSTA_UUID:/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    crypto:{randomUUID:()=>ID},preflightSchysstaWrite:async()=>true,
    setTimeout:(fn,ms)=>{const id=++timerId;timers.set(id,{fn,ms});return id;},
    clearTimeout:id=>{timers.delete(id);},
    db:{rpc(name,args){const task=deferred();calls.push({name,args,...task});return task.promise;}},
    render:()=>renders.push({
      busy:[...state.schysstaSaving],submitting:state.schysstaSubmitting,
      message:state.schysstaMessage,error:state.schysstaError,draft:state.schysstaDraft
    }),
    fetchSchysstaList:async()=>{refreshed.push('refresh');}
  };
  vm.runInNewContext(actions+'\nthis.mark=markSchysstaRead;this.withdraw=withdrawSchysstaRule;this.submit=submitManualSchysstaRule;this.propose=proposeSchysstaRule;this.decide=decideSchysstaRule;',state);
  return {state,calls,renders,refreshed,timers,
    expire(){
      const entry=[...timers.values()].find(x=>x.ms===15000);
      assert.ok(entry,'An unanswered Schyssta write must have a 15-second deadline');
      entry.fn();
    }
  };
}
const variants=[
  {name:'new manual proposal',run:h=>h.state.submit(),rpc:'propose_manual_schyssta_rule',
    after:h=>{
      assert.equal(h.state.schysstaSubmitting,false);
      assert.equal(h.state.schysstaDraft,'Vi lyssnar klart innan vi svarar.');
      assert.equal(h.state.schysstaDraftOpen,true);
      assert.equal(h.state.schysstaDraftKey,ID,'Same idempotency key must be reusable on retry');
      assert.match(h.state.schysstaMessage,/inte att bekräfta/i);
    }},
  {name:'rule-card proposal',run:h=>h.state.propose(RULE),rpc:'propose_schyssta_rule',
    after:h=>{assert.equal(h.state.schysstaSaving.has(RULE),false);assert.match(h.state.schysstaError,/inte att bekräfta/i);}},
  {name:'accept decision',run:h=>h.state.decide(ID,true),rpc:'set_schyssta_rule_decision',
    after:h=>{assert.equal(h.state.schysstaSaving.has(ID),false);assert.equal(h.state.schysstaRules.length,0);assert.match(h.state.schysstaError,/inte att bekräfta/i);}},
  {name:'withdraw accepted agreement',run:h=>h.state.withdraw(ID),rpc:'withdraw_schyssta_rule',
    after:h=>{assert.equal(h.state.schysstaSaving.has(ID),false);assert.match(h.state.schysstaMessage,/inte att bekräfta/i);}},
  {name:'mark notice read',run:h=>h.state.mark(ID),rpc:'mark_schyssta_notification_read',
    after:h=>{assert.equal(h.state.schysstaSaving.has(ID),false);assert.match(h.state.schysstaMessage,/inte att bekräfta/i);}}
];
for(const role of ['parent','teen']){
 for(const action of variants){
  test('FUN-03: '+role+' '+action.name+' releases stuck UI on write deadline without false success',async()=>{
    const h=harness(role);
    const ongoing=action.run(h);
    await step();
    assert.equal(h.calls.length,1);
    assert.equal(h.calls[0].name,action.rpc);
    assert.equal(h.refreshed.length,0);
    h.expire();
    await ongoing;
    assert.equal(h.timers.size,0,'The finished operation must clean up its deadline timer');
    assert.equal(h.refreshed.length,0,'Unknown receipt must not follow the success path');
    action.after(h);
    h.calls[0].resolve({error:null});
    await step();
    assert.equal(h.refreshed.length,0,'Late success from timed-out call cannot overwrite the UI');
  });
 }
}
test('FUN-03: retrying manual proposal after an unknown receipt reuses its idempotency key',async()=>{
 const h=harness('parent');
 const first=h.state.submit();
 await step();
 const firstKey=h.calls[0].args.p_request_key;
 h.expire();await first;
 assert.equal(h.state.schysstaDraftKey,firstKey);
 const retry=h.state.submit();
 await step();
 assert.equal(h.calls.length,2);
 assert.equal(h.calls[1].args.p_request_key,firstKey);
 h.calls[1].resolve({error:null});
 await retry;
 assert.equal(h.state.schysstaDraft,'');
 assert.equal(h.state.schysstaDraftKey,null);
 assert.equal(h.refreshed.length,1);
 h.calls[0].resolve({error:null});
 await step();
 assert.equal(h.refreshed.length,1,'Late original receipt cannot duplicate a refresh');
});
