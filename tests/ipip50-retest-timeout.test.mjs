import test from 'node:test';
import assert from 'node:assert/strict';
import {IPIP50_V1} from '../personality/ipip50-v1.js';
import {createPrivateIpipRetests} from '../personality/ipip50-retest.js';

const USER='synthetic-retest-owner';
const ATTEMPT='synthetic-attempt-1';
const never=new Promise(()=>{});
const deadline=async(p,label,maxMs=1000)=>{
  const winner=await Promise.race([p.then(()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),maxMs))]);
  assert.equal(winner,true,label+' must not remain blocked');
};
const btn=(action,attemptId=ATTEMPT)=>({
  closest:selector=>selector==='[data-ipip-retest]'?{dataset:{ipipRetest:action,attemptId}}:null
});
const radio=(id,value)=>({
  matches:selector=>selector==='input[data-ipip-retest-answer]',
  dataset:{ipipRetestAnswer:id},value:String(value)
});
function fixture({draft=false,completed=false,answerCount=0}={}){
  const attempts=(draft||completed)?[{
    id:ATTEMPT,user_id:USER,instrument_id:IPIP50_V1.id,
    created_at:'2026-11-09T07:00:00Z',
    completed_at:completed?'2026-11-09T07:15:00Z':null
  }]:[];
  const answers=new Map(IPIP50_V1.items.slice(0,answerCount).map(i=>[i.id,3]));
  const stalls=new Set(),calls={};
  const count=k=>{calls[k]=(calls[k]||0)+1;};
  const db={from(table){
    assert.ok(['personality_test_attempts','personality_attempt_answers'].includes(table));
    const query=(op='read',payload=null)=>{
      const filters={};
      const q={
        select(){return q;},
        eq(key,value){filters[key]=value;return q;},
        order(){return run();},
        single(){return run();},
        maybeSingle(){return run(true);},
        then(resolve,reject){return run().then(resolve,reject);}
      };
      function run(single=false){
        const key=table+':'+op+(single?':single':'');
        count(key);
        if(stalls.has(key))return never;
        if(op==='insert'){
          const row={id:ATTEMPT,user_id:USER,instrument_id:payload.instrument_id,
            created_at:'2026-11-09T07:00:00Z',completed_at:null};
          attempts.push(row);
          return Promise.resolve({data:{...row},error:null});
        }
        if(op==='update'){
          const row=attempts.find(a=>a.id===filters.id&&a.user_id===filters.user_id);
          if(row)row.completed_at=payload.completed_at;
          return Promise.resolve({data:row?{id:row.id,completed_at:row.completed_at}:null,error:null});
        }
        if(op==='delete'){
          const i=attempts.findIndex(a=>a.id===filters.id&&a.user_id===filters.user_id);
          const row=i<0?null:attempts.splice(i,1)[0];
          return Promise.resolve({data:row?{id:row.id}:null,error:null});
        }
        const rows=table==='personality_test_attempts'
          ?attempts.filter(a=>Object.entries(filters).every(([k,v])=>a[k]===v))
          :[...answers].map(([question_id,answer_value])=>({
              user_id:USER,attempt_id:ATTEMPT,question_id,answer_value
            })).filter(a=>Object.entries(filters).every(([k,v])=>a[k]===v));
        return Promise.resolve({data:single?rows[0]||null:rows,error:null});
      }
      return q;
    };
    return {
      select(){return query();},
      insert(row){return query('insert',row);},
      update(row){return query('update',row);},
      delete(){return query('delete');},
      upsert(row){
        const key=table+':upsert';
        count(key);
        if(stalls.has(key))return never;
        answers.set(row.question_id,row.answer_value);
        return Promise.resolve({error:null});
      }
    };
  }};
  return {db,stalls,attempts,answers,calls};
}
function ui(f){return createPrivateIpipRetests({
  db:f.db,onRender:()=>{},confirmDelete:()=>true,requestTimeoutMs:25,saveExport:()=>{}
});}
test('FUN-04: private retest history read must time out and recover via visible retry',async()=>{
  for(const role of ['parent','teen']){
    const f=fixture(),p=ui(f);
    p.reset(USER);
    f.stalls.add('personality_test_attempts:read');
    await deadline(p.load(USER),role+' retest history read',500);
    assert.match(p.render(),/Det gick inte att hämta dina privata omtestningar/);
    assert.match(p.render(),/data-ipip-retest="reload"/);
    f.stalls.clear();
    await p.handleClick(btn('reload'));
    assert.match(p.render(),/Starta en ny privat testomgång/);
  }
});
test('FUN-04: private retest draft-answer read must time out and recover without overwriting answers',async()=>{
  const f=fixture({draft:true,answerCount:1}),p=ui(f);
  p.reset(USER);
  f.stalls.add('personality_attempt_answers:read');
  await deadline(p.load(USER),'private draft answers read',500);
  assert.match(p.render(),/Det gick inte att hämta dina privata omtestningar/);
  f.stalls.clear();
  await p.handleClick(btn('reload'));
  assert.match(p.render(),/Påbörjad omgång.*1 av 50/);
  assert.equal(f.answers.get('ipip50-001'),3);
});
test('FUN-04: stalled private retest write and verification must be unknown, never advance or write twice',async()=>{
  for(const role of ['parent','teen']){
    const f=fixture({draft:true}),p=ui(f);
    p.reset(USER);await p.load(USER);
    await p.handleClick(btn('resume'));
    f.stalls.add('personality_attempt_answers:upsert');
    f.stalls.add('personality_attempt_answers:read');
    await deadline(p.handleChange(radio('ipip50-001',4)),role+' retest answer write',1400);
    let html=p.render();
    assert.match(html,/Kontrollera sparat svar/);
    assert.match(html,/Fråga 1 av 50/);
    assert.equal(f.calls['personality_attempt_answers:upsert'],1);
    assert.equal(f.answers.size,0);
    f.stalls.clear();
    // The previously unknown request may have committed despite the lost receipt.
    f.answers.set('ipip50-001',4);
    await p.handleClick(btn('verify-save'));
    await p.handleClick(btn('resume'));
    html=p.render();
    assert.match(html,/Fråga 2 av 50/);
    assert.equal(f.calls['personality_attempt_answers:upsert'],1);
  }
});
test('FUN-04: stalled creation must never cause an automatic second private retest',async()=>{
  const f=fixture(),p=ui(f);p.reset(USER);await p.load(USER);
  f.stalls.add('personality_test_attempts:insert');
  await deadline(p.handleClick(btn('new')),'private attempt creation',700);
  assert.match(p.render(),/Servern visar ingen påbörjad omgång/);
  assert.equal(f.calls['personality_test_attempts:insert'],1);
  assert.equal(f.attempts.length,0);
  f.stalls.clear();
  await p.handleClick(btn('new'));
  assert.match(p.render(),/Fråga 1 av 50/);
  assert.equal(f.attempts.length,1);
});
test('FUN-04: stuck private retest completion requires verification rather than false success',async()=>{
  const f=fixture({draft:true,answerCount:50}),p=ui(f);
  p.reset(USER);await p.load(USER);await p.handleClick(btn('resume'));
  f.stalls.add('personality_test_attempts:update');
  f.stalls.add('personality_test_attempts:read:single');
  await deadline(p.handleClick(btn('complete')),'private retest completion',700);
  assert.match(p.render(),/Kontrollera omtestets status/);
  assert.doesNotMatch(p.render(),/Den privata omgången har avslutats och sparats/);
  assert.equal(f.attempts[0].completed_at,null);
  assert.equal(f.calls['personality_test_attempts:update'],1);
});
test('FUN-04: stuck deletion never silently retries the irreversible operation',async()=>{
  const f=fixture({draft:true,answerCount:1}),p=ui(f);p.reset(USER);await p.load(USER);
  f.stalls.add('personality_test_attempts:delete');
  f.stalls.add('personality_test_attempts:read:single');
  await deadline(p.handleClick(btn('delete')),'private retest deletion',700);
  assert.match(p.render(),/Raderingen kunde inte bekräftas/);
  assert.match(p.render(),/Kontrollera omtestets status/);
  assert.equal(f.attempts.length,1);
  assert.equal(f.calls['personality_test_attempts:delete'],1);
});
test('FUN-04: timeout in private historic export releases UI and never downloads stale data',async()=>{
  const f=fixture({completed:true,answerCount:50}),p=ui(f);
  p.reset(USER);await p.load(USER);
  f.stalls.add('personality_attempt_answers:read');
  await deadline(p.handleClick(btn('export')),'private retest export',500);
  assert.match(p.render(),/Det gick inte att exportera omtestet/);
  assert.match(p.render(),/data-ipip-retest="export"/);
});
