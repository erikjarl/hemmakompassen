import test from 'node:test';
import assert from 'node:assert/strict';
import {createAiMediatorExperience} from '../ai-mediator-ui.js';

const owner='11111111-1111-4111-8111-111111111111';
const endpoint='https://hemmakompassen-ai-medlare.erikbertiljarl.workers.dev/api/ai/mediate';
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function flush(){for(let i=0;i<12;i++)await Promise.resolve();}

for(const firstResult of ['error','success']){
 test('outdated '+firstResult+' cannot corrupt a newer context overview after opt-out/re-enable',async()=>{
  const pending=[];
  const db={auth:{getSession:async()=>({data:{session:{user:{id:owner},access_token:'fake-token'}},error:null})}};
  const fetchImpl=async(url,options)=>{
   assert.ok(url.endsWith('/api/ai/context'));
   assert.equal(options.headers.Authorization,'Bearer fake-token');
   return new Promise((resolve,reject)=>pending.push({resolve,reject}));
  };
  const ui=createAiMediatorExperience({
   db,config:{enableAiMediator:true,enableAiHistory:true,aiMediatorUrl:endpoint},
   escapeHtml,fetchImpl
  });
  ui.reset(owner);
  const oldRequest=ui.loadContextStatus();
  await flush();
  assert.equal(pending.length,1,'Initial context read must be pending');

  ui.setProjectContext(false);
  assert.equal(ui.getState().includeProjectContext,false);
  ui.setProjectContext(true);
  await flush();
  assert.equal(pending.length,2,'Re-enabling should start its own context read');

  if(firstResult==='error')pending[0].reject(new Error('FÖRÅLDRAT NÄTVERKSFEL'));
  else pending[0].resolve(Response.json({sections:['GAMMAL ÖVERSIKT'],unavailableCount:0}));
  assert.equal(await oldRequest,false,'The older request must be discarded');
  assert.equal(ui.getState().contextError,'','Old failure must not appear after re-enabling');
  assert.deepEqual(ui.getState().contextSections,[],'Old success must not be used');
  assert.match(ui.render(),/Kontrollerar tillgängliga uppgifter/,
   'The current request must still show a loading indicator');

  pending[1].resolve(Response.json({sections:['Aktuella insikter'],unavailableCount:0}));
  await flush();
  assert.equal(ui.getState().contextError,'');
  assert.deepEqual(ui.getState().contextSections,['Aktuella insikter']);
  assert.match(ui.render(),/Aktuella insikter/);
  assert.doesNotMatch(ui.render(),/Kontrollerar tillgängliga uppgifter|FÖRÅLDRAT NÄTVERKSFEL|GAMMAL ÖVERSIKT/);
 });
}
