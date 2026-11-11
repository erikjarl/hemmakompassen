import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
function slice(start,end){
 const i=app.indexOf(start),j=app.indexOf(end,i+start.length);
 assert.ok(i>=0&&j>i,'Find Schyssta handler '+start);
 return app.slice(i,j);
}
const chunks=[
 slice('async function preflightSchysstaWrite','async function markSchysstaRead'),
 slice('async function markSchysstaRead','function validSchysstaReplacementLinks'),
 slice('async function withdrawSchysstaRule','async function submitManualSchysstaRule'),
 slice('async function submitManualSchysstaRule','function inboxView'),
 slice('async function proposeSchysstaRule','async function decideSchysstaRule'),
 slice('async function decideSchysstaRule','function schysstaView')
];
const names=['markSchysstaRead','withdrawSchysstaRule','submitManualSchysstaRule','proposeSchysstaRule','decideSchysstaRule'];
const writeRpc=['mark_schyssta_notification_read','withdraw_schyssta_rule',
 'propose_manual_schyssta_rule','propose_schyssta_rule','set_schyssta_rule_decision'];
const ID='30000000-0000-4000-8000-000000000001';
function scenario({allowed=true,moveSession=false,editDraft=false}={}){
 const events={checks:0,calls:[],fetches:0,renders:0};
 const state={
  user:{id:'viewer'},members:[{user_id:'viewer',role:'parent'},{user_id:'teen',role:'teen'}],
  sharedSession:3,schysstaListEnabled:true,schysstaSaving:new Set(),schysstaEndTarget:ID,
  schysstaSubmitting:false,schysstaLoading:false,schysstaError:'',schysstaMessage:'',
  schysstaDraft:'Vi pratar om våra gemensamma regler',schysstaDraftOpen:true,
  schysstaDraftKey:null,schysstaEditTarget:null,
  schysstaManualRules:[],schysstaReplacementLinks:[],schysstaNotifications:[],schysstaHistory:[],
  SCHYSSTA_RULES:{'regler-01':'En enkel regel'},
  SCHYSSTA_UUID:/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  crypto:{randomUUID:()=>ID},
  setTimeout,clearTimeout,
  recheckInboxPair:async()=>{events.checks++;if(moveSession)state.sharedSession++;if(editDraft)state.schysstaDraft='Ändrad text';return allowed;},
  db:{rpc:async(name,args)=>{events.calls.push({name,args});return {data:name==='propose_manual_schyssta_rule'?ID:null,error:null};}},
  fetchSchysstaList:async()=>{
    events.fetches++;
    // Successful write is confirmed only after the same UUID and body return.
    state.schysstaManualRules=[{agreement_id:ID,body:'Vi pratar om våra gemensamma regler',proposed_by_me:true}];
    return true;
  },schysstaAllRules:()=>[],schysstaDecisionFeedback:'',
  render:()=>{events.renders++;}
 };
 vm.runInNewContext(chunks.join('\n')+'\n'+names.map(n=>'this.'+n+'='+n+';').join('\n'),state);
 return {state,events};
}
async function invoke(name,state){
 if(name==='submitManualSchysstaRule')return state[name]();
 if(name==='proposeSchysstaRule')return state[name]('regler-01');
 if(name==='decideSchysstaRule')return state[name](ID,true);
 return state[name](ID);
}
test('five Schyssta writes require the exact current pair epoch before side-effecting RPCs',()=>{
 for(let i=0;i<names.length;i++){
   const part=chunks[i+1],where=part.indexOf('await preflightSchysstaWrite');
   const rpc=part.indexOf("db.rpc('"+writeRpc[i]+"'");
   assert.ok(where>=0&&rpc>where,names[i]+' requires preflight before '+writeRpc[i]);
 }
 assert.match(app,/if\(page\(\)==='regler'&&user&&members\.length===2\)\s*void recheckInboxPair\(\)/,
   'Refocusing the rule page must verify the family epoch');
});
test('revoked pair or unknown epoch blocks all five writes without recording an action',async()=>{
 for(const name of names){
   const {state,events}=scenario({allowed:false});
   const originalDraft=state.schysstaDraft;
   await invoke(name,state);
   assert.equal(events.checks,1,name+' must check current pair');
   assert.equal(events.calls.length,0,name+' must not invoke an RPC for a revoked/unknown pairing');
   assert.equal(state.schysstaDraft,originalDraft,'Check itself must not erase a private unsent draft');
   assert.equal(events.fetches,0);
 }
});
test('a changed account/session during pair preflight cannot write rules',async()=>{
 for(const name of names){
   const {state,events}=scenario({moveSession:true});
   await invoke(name,state);
   assert.equal(events.calls.length,0,name+' cannot send after session generation changes');
 }
});
test('valid pairing allows exactly the requested RPC and never registers implicit agreement',async()=>{
 for(let i=0;i<names.length;i++){
   const {state,events}=scenario();
   await invoke(names[i],state);
   assert.equal(events.calls.length,1,names[i]+' issues one RPC');
   assert.equal(events.calls[0].name,writeRpc[i]);
   if(names[i]==='submitManualSchysstaRule'){
     assert.equal(events.calls[0].args.p_body,'Vi pratar om våra gemensamma regler');
     assert.ok(events.calls[0].args.p_request_key,'An idempotency key is sent');
     assert.equal(state.schysstaDraftOpen,false,'Only confirmed save closes editor');
   }
 }
});
test('editing the private draft during async preflight aborts stale submit',async()=>{
 const {state,events}=scenario({editDraft:true});
 await state.submitManualSchysstaRule();
 assert.equal(events.calls.length,0);
 assert.equal(state.schysstaDraft,'Ändrad text');
 assert.equal(state.schysstaDraftOpen,true);
});
