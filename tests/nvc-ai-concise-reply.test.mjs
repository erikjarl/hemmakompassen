import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {buildNvcAiPrompt,normalizeNvcAiReply} from '../communication/toolkit.js';

const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const active=app.match(/async function rewriteNvcWithAi\(\)\{[\s\S]*?(?=\n\/\/ FUN-06: These three previews)/)?.[0];
assert.ok(active,'Execute the actual opt-in NVC AI rewrite handler');
assert.match(active,/normalizeNvcAiReply\(result\.reply\)/,
 'Production must validate the content before showing model text');

test('FBK-02-02: normalized NVC text is concise, with exactly 65 words allowed',()=>{
 const words=length=>Array.from({length},(_,i)=>i%3===0?'Jag':'behöver').join(' ');
 assert.equal(normalizeNvcAiReply(words(65)),words(65));
 assert.equal(normalizeNvcAiReply(words(66)),null,'66 short words exceed prompt limit');
 assert.equal(normalizeNvcAiReply(' \tHej\n\n jag   önskar\t lugn.  '),'Hej jag önskar lugn.');
 assert.equal(normalizeNvcAiReply(''.padEnd(601,'x')),null,'600-character cap remains');
 assert.equal(normalizeNvcAiReply(''.padEnd(600,'x')),''.padEnd(600,'x'));
 for(const input of ['', '  \n ',null,undefined,{},7]){
   assert.equal(normalizeNvcAiReply(input),null,'Invalid or empty text must keep fallback');
 }
});

function harness(role,reply){
 const form={fields:{
  observation:'vi avbryter varandra',feeling:'frustrerad',
  need:'bli lyssnad på',request:'prata klart i två minuter'
 }};
 const output={dataset:{commReady:'true'},textContent:'Det jag lade märke till: vi avbryter varandra'};
 const button={disabled:false},status={textContent:''};
 const elements=new Map([
  ['comm-nvc-form',form],['comm-nvc-output',output],['comm-nvc-ai',button],
  ['comm-nvc-ai-status',status]
 ]);
 let requests=0,applied=0;
 class MockFormData{
  constructor(node){this.node=node;}
  *[Symbol.iterator](){yield* Object.entries(this.node.fields);}
 }
 const state={
  user:{id:role},sharedSession:3,page:()=> 'nvc',nvcAiEpoch:0,nvcAiController:null,
  c:{aiMediatorUrl:'https://fictional.erikbertiljarl.workers.dev/api/ai/mediate'},
  $:id=>elements.get(id),FormData:MockFormData,
  AbortController,Error,
  nvcAiAvailable:()=>true,buildNvcAiPrompt,normalizeNvcAiReply,
  cancelNvcAi(){state.nvcAiEpoch++;state.nvcAiController?.abort();state.nvcAiController=null;},
  withNvcAiDeadline:promise=>Promise.resolve(promise),
  db:{auth:{getSession:async()=>({data:{session:{access_token:'synthetic-token'}},error:null})}},
  fetch:async (_url,options)=>{
   requests++;
   assert.equal(JSON.parse(options.body).useProjectContext,false);
   return {ok:true,json:async()=>({reply,ephemeral:true,chatId:null,safetyNotice:false})};
  },
  updateCommunicationPreview:(kind,text)=>{
   assert.equal(kind,'nvc');
   output.textContent=text;applied++;
  }
 };
 vm.runInNewContext(active+'\nthis.runNvc=rewriteNvcWithAi;',state,{filename:'live-app.js'});
 return {state,output,status,button,form,run:()=>state.runNvc(),get calls(){return requests;},get applied(){return applied;}};
}

for(const role of ['parent','teen']){
 test('FBK-02-02 '+role+': overly wordy but short-character AI text is rejected without deleting local draft',async()=>{
  const sample=Array.from({length:75},()=> 'jag').join(' ');
  assert.ok(sample.length<600,'Reproduces previously accepted long text');
  const h=harness(role,sample),original=h.output.textContent;
  await h.run();
  assert.equal(h.calls,1);
  assert.equal(h.applied,0,'No generated text may replace local draft');
  assert.equal(h.output.textContent,original);
  assert.match(h.status.textContent,/för långt/);
  assert.equal(h.button.disabled,false,'Allow a deliberate retry after rejected response');
  assert.match(buildNvcAiPrompt(h.form.fields),/högst 65 ord/);
 });

 test('FBK-02-02 '+role+': concise, ordinary AI suggestion is displayed and remains copyable',async()=>{
  const reply='När vi avbryter varandra blir jag frustrerad. Jag behöver få tala klart. Kan vi lyssna färdigt på varandra?';
  const h=harness(role,reply);
  await h.run();
  assert.equal(h.calls,1);
  assert.equal(h.applied,1);
  assert.equal(h.output.textContent,reply);
  assert.match(h.status.textContent,/Granska att texten stämmer/);
  assert.equal(h.button.disabled,false);
 });
}
