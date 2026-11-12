import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
function section(a,b){
 const start=app.indexOf(a),end=app.indexOf(b,start+a.length);
 assert.ok(start>=0&&end>start,'Find production bounds: '+a);
 return app.slice(start,end);
}
const source=section('async function schysstaWriteRpc(operation){','async function markSchysstaRead(id){')
 +'\n'+section('async function submitManualSchysstaRule(){','// A failed manual proposal may have committed');
const id='50000000-0000-4000-8000-000000000001';
const originalId='40000000-0000-4000-8000-000000000002';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};}
function harness({edit=false,delayedPreflight=false}={}){
 const rpc=deferred(),get=deferred(),calls=[],renders=[],pairChecks=[];
 const state={
   schysstaListEnabled:true,user:{id:'parent'},sharedSession:5,members:[{},{},],
   schysstaSubmitting:false,schysstaLoading:false,schysstaError:'',
   schysstaDraft:'  Prata lugnt   vid matbordet  ',
   schysstaDraftKey:null,schysstaEditTarget:edit?originalId:null,
   schysstaDraftOpen:true,schysstaMessage:'',
   schysstaManualRules:[],schysstaReplacementLinks:[],
   SCHYSSTA_UUID:/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
   crypto:{randomUUID:()=> '30000000-0000-4000-8000-000000000003'},
   preflightSchysstaWrite:()=>{
     if(!delayedPreflight)return Promise.resolve(true);
     const next=deferred();pairChecks.push(next);return next.promise;
   },
   setTimeout,clearTimeout,
   db:{rpc(name,args){calls.push({name,args});return rpc.promise;}},
   fetchSchysstaList:()=>get.promise,
   render:()=>renders.push({message:state.schysstaMessage,submitting:state.schysstaSubmitting})
 };
 vm.runInNewContext(source+'\nthis.submit=submitManualSchysstaRule;',state,{filename:'live-app.js'});
 return {state,rpc,get,calls,renders,pairChecks};
}
for(const mode of ['confirmed','absent','wrong-id','wrong-text','failed-get','bad-uuid']){
 test('FBK-02-05: manual proposal '+mode+' retains draft until exact readback',async()=>{
  const h=harness();
  const pending=h.state.submit();
  await tick();
  assert.equal(h.calls.length,1);
  assert.equal(h.calls[0].name,'propose_manual_schyssta_rule');
  h.rpc.resolve({data:mode==='bad-uuid'?'not-an-id':id,error:null});
  await tick();
  if(mode!=='bad-uuid'){
   assert.equal(h.state.schysstaSubmitting,true,'Keep submission locked until GET');
   await h.state.submit();
   assert.equal(h.calls.length,1,'No duplicate RPC under pending readback');
   if(mode!=='absent')h.state.schysstaManualRules=[{
     agreement_id:mode==='wrong-id'?originalId:id,
     body:mode==='wrong-text'?'Annat innehåll':'Prata lugnt vid matbordet',
     proposed_by_me:true
   }];
   h.get.resolve(mode!=='failed-get');
  }
  await pending;
  assert.equal(h.state.schysstaSubmitting,false);
  if(mode==='confirmed'){
   assert.equal(h.state.schysstaDraft,'');
   assert.equal(h.state.schysstaDraftKey,null);
   assert.match(h.state.schysstaMessage,/Förslaget är sparat/);
  }else{
   assert.match(h.state.schysstaDraft,/Prata lugnt/);
   assert.ok(h.state.schysstaDraftKey,'Keep idempotency key for uncertain result');
   assert.match(h.state.schysstaMessage,/inte att bekräfta|kunde inte bekräftas/);
  }
 });
}
test('FBK-02-05: change proposal requires exact replacement link',async()=>{
 const h=harness({edit:true});
 const pending=h.state.submit();
 await tick();
 h.rpc.resolve({data:id,error:null});
 await tick();
 h.state.schysstaManualRules=[{agreement_id:id,body:'Prata lugnt vid matbordet',proposed_by_me:true}];
 h.get.resolve(true);
 await pending;
 assert.ok(h.state.schysstaDraftKey);
 assert.match(h.state.schysstaMessage,/kunde inte bekräftas/);
});
test('FBK-02-05: confirmed change requires matching original agreement',async()=>{
 const h=harness({edit:true});
 const pending=h.state.submit();
 await tick();
 h.rpc.resolve({data:id,error:null});
 await tick();
 h.state.schysstaManualRules=[{agreement_id:id,body:'Prata lugnt vid matbordet',proposed_by_me:true}];
 h.state.schysstaReplacementLinks=[{agreement_id:id,replaces_agreement_id:originalId}];
 h.get.resolve(true);
 await pending;
 assert.equal(h.state.schysstaDraft,'');
});
test('FBK-02-05: successful request preserves newly edited draft',async()=>{
 const h=harness();
 const pending=h.state.submit();
 await tick();
 h.state.schysstaDraft='Ett helt nytt förslag';
 h.state.schysstaDraftKey=null;
 h.rpc.resolve({data:id,error:null});
 await tick();
 h.state.schysstaManualRules=[{agreement_id:id,body:'Prata lugnt vid matbordet',proposed_by_me:true}];
 h.get.resolve(true);
 await pending;
 assert.equal(h.state.schysstaDraft,'Ett helt nytt förslag');
 assert.equal(h.state.schysstaMessage,'');
});
test('FBK-02-05: old account readback cannot touch new draft',async()=>{
 const h=harness();
 const pending=h.state.submit();
 await tick();
 h.rpc.resolve({data:id,error:null});
 await tick();
 h.state.user={id:'teen'};h.state.sharedSession++;
 h.state.schysstaDraft='Ny persons utkast';
 h.state.schysstaSubmitting=true;
 h.get.resolve(true);
 await pending;
 assert.equal(h.state.schysstaDraft,'Ny persons utkast');
 assert.equal(h.state.schysstaSubmitting,true);
});

test('FBK-02-05: rule-list error panel shows failed proposal readback guidance',()=>{
 const start=app.indexOf('function schysstaView(){');
 const end=app.indexOf('  const schysstaDecisionStatus=',start);
 assert.ok(start>=0&&end>start);
 const earlyView=app.slice(start,end)+'}';
 const state={
   schysstaListEnabled:true,members:[{},{}],schysstaLoading:false,
   schysstaError:'Listan kunde inte hämtas',
   schysstaMessage:'Förslaget skickades, men kunde inte bekräftas i listan.',
   schysstaDecisionFeedback:'',
   card:html=>'<section>'+html+'</section>',
   esc:value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;')
 };
 vm.runInNewContext(earlyView+'\nthis.view=schysstaView;',state,{filename:'live-app.js'});
 const html=state.view();
 assert.match(html,/Kunde inte visa listan/);
 assert.match(html,/Förslaget skickades, men kunde inte bekräftas i listan/);
 assert.match(html,/id="schyssta-retry"/);
});

for(const outcome of ['rpc-failure','readback-failure']){
 test('FBK-02-05: late '+outcome+' must not overwrite a newer manual draft notice',async()=>{
  const h=harness();
  const pending=h.state.submit();
  await tick();
  // The user edits the draft while the earlier request is still running.
  h.state.schysstaDraft='En helt annan överenskommelse';
  h.state.schysstaDraftKey=null;
  h.state.schysstaMessage='Nytt utkast pågår';
  if(outcome==='rpc-failure'){
   h.rpc.resolve({data:null,error:{message:'offline'}});
  }else{
   h.rpc.resolve({data:id,error:null});
   await tick();
   h.get.resolve(false);
  }
  await pending;
  assert.equal(h.state.schysstaDraft,'En helt annan överenskommelse');
  assert.equal(h.state.schysstaMessage,'Nytt utkast pågår');
  assert.equal(h.state.schysstaSubmitting,false);
  assert.equal(h.calls.length,1);
 });
}

test('FBK-02-05: two manual submit clicks before RPC reply send one proposal',async()=>{
 const h=harness();
 const pending=h.state.submit();
 await tick();
 assert.equal(h.state.schysstaSubmitting,true,'The first click must lock submission');
 await h.state.submit();
 assert.equal(h.calls.length,1,'Second click must not send another write');
 h.rpc.resolve({data:id,error:null});
 await tick();
 h.state.schysstaManualRules=[{
   agreement_id:id,body:'Prata lugnt vid matbordet',proposed_by_me:true
 }];
 h.get.resolve(true);
 await pending;
 assert.equal(h.state.schysstaSubmitting,false);
 assert.equal(h.state.schysstaDraft,'');
 assert.match(h.state.schysstaMessage,/Förslaget är sparat/);
});

test('FBK-02-05: two clicks during an unresolved pair preflight issue one manual proposal RPC',async()=>{
 const h=harness({delayedPreflight:true});
 const first=h.state.submit();
 const second=h.state.submit();
 await tick();
 assert.equal(h.pairChecks.length,2,'Both clicks entered pairing verification');
 assert.equal(h.calls.length,0,'Neither click may write before pair verification');
 h.pairChecks[0].resolve(true);
 h.pairChecks[1].resolve(true);
 await tick();
 assert.equal(h.calls.length,1,'Second completed preflight must observe the first submission lock');
 assert.equal(h.state.schysstaSubmitting,true);
 h.rpc.resolve({data:id,error:null});
 await tick();
 h.state.schysstaManualRules=[{
   agreement_id:id,body:'Prata lugnt vid matbordet',proposed_by_me:true
 }];
 h.get.resolve(true);
 await Promise.all([first,second]);
 assert.equal(h.calls.length,1);
 assert.equal(h.state.schysstaDraft,'');
 assert.equal(h.state.schysstaSubmitting,false);
});
