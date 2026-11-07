import test from 'node:test';
import assert from 'node:assert/strict';
import {createPrivateIpipRetests,buildPrivateIpipRetestExport} from '../personality/ipip50-retest.js';

function makeBackend(){
  const attempts=[],answers=[],calls=[];
  let owner='private-user',failNextAnswer=false,failDelete=false,failNextAnswerRead=false;
  const db={
    from(table){
      assert.ok(['personality_test_attempts','personality_attempt_answers'].includes(table),
        'Retests must only read/write private versioned tables');
      function query(op='read',payload=null){
        const filters={};
        const q={
          select(){return q;},eq(k,v){filters[k]=v;return q;},
          order(){return Promise.resolve(run());},single(){return Promise.resolve(run());},
          then(ok,bad){return Promise.resolve(run()).then(ok,bad);}
        };
        function run(){
          if(op==='new'){
            if(attempts.some(a=>a.user_id===payload.user_id&&a.completed_at===null))
              return {data:null,error:{code:'23505',message:'one open attempt per owner'}};
            const row={id:'attempt-'+(attempts.length+1),user_id:payload.user_id,
              instrument_id:payload.instrument_id,created_at:'2026-11-07T10:00:00Z',completed_at:null};
            attempts.push(row);calls.push('new');return {data:{...row},error:null};
          }
          if(op==='delete'){
            if(failDelete)return {data:null,error:{message:'delete unavailable'}};
            const index=attempts.findIndex(a=>a.id===filters.id&&a.user_id===filters.user_id);
            if(index===-1)return {data:null,error:{message:'not found'}};
            const [deleted]=attempts.splice(index,1);
            for(let i=answers.length-1;i>=0;i--){
              if(answers[i].attempt_id===deleted.id)answers.splice(i,1);
            }
            calls.push('delete');return {data:{id:deleted.id},error:null};
          }
          if(op==='update'){
            const row=attempts.find(a=>a.id===filters.id&&a.user_id===filters.user_id);
            if(!row)return {data:null,error:{message:'not found'}};
            const items=answers.filter(a=>a.attempt_id===row.id&&a.user_id===row.user_id);
            if(row.completed_at||items.length!==50)return {data:null,error:{message:'incomplete'}};
            row.completed_at=payload.completed_at;calls.push('complete');
            return {data:{...row},error:null};
          }
          if(op==='read'&&table==='personality_attempt_answers'&&failNextAnswerRead){
            failNextAnswerRead=false;
            return {data:null,error:{message:'offline read'}};
          }
          const rows=(table==='personality_test_attempts'?attempts:answers)
            .filter(a=>Object.entries(filters).every(([key,value])=>a[key]===value));
          return {data:rows.map(row=>({...row})),error:null};
        }
        return q;
      }
      return {
        select(){return query();},
        insert(row){assert.equal(row.user_id,owner);return query('new',row);},
        update(row){return query('update',row);},
        delete(){return query('delete');}, 
        async upsert(row){
          assert.equal(row.user_id,owner);
          if(failNextAnswer){failNextAnswer=false;return {error:{message:'temporary offline'}};}
          const record=answers.find(a=>a.attempt_id===row.attempt_id&&a.question_id===row.question_id);
          if(record)record.answer_value=row.answer_value;
          else answers.push({...row});
          calls.push('answer');return {error:null};
        }
      };
    }
  };
  return {db,attempts,answers,calls,setOwner:v=>owner=v,failNext:()=>failNextAnswer=true,
    setDeleteFailure:v=>failDelete=v,failAnswerRead:()=>failNextAnswerRead=true};
}
const button=(action,attemptId)=>({closest:sel=>sel==='[data-ipip-retest]'?{dataset:{ipipRetest:action,attemptId}}:null});
const radio=(item,value)=>({matches:sel=>sel==='input[data-ipip-retest-answer]',dataset:{ipipRetestAnswer:item},value:String(value)});

test('new private IPIP retest saves 50 owner-only answers and shows immutable historic results',async()=>{
  const b=makeBackend(),ui=createPrivateIpipRetests({db:b.db,renderOwnScores:score=>'<strong data-score="'+score.answeredCount+'">Endast min graf</strong>'});
  ui.reset('private-user');await ui.load('private-user');
  assert.match(ui.render(),/Starta en ny privat testomgång/);
  assert.match(ui.render(),/visas bara för dig/);
  await ui.handleClick(button('new'));
  assert.match(ui.render(),/Fråga 1 av 50/);
  for(let i=1;i<=50;i++){
    await ui.handleChange(radio('ipip50-'+String(i).padStart(3,'0'),3));
  }
  assert.equal(b.answers.length,50);
  assert.match(ui.render(),/Avsluta omgången/);
  await ui.handleClick(button('complete'));
  assert.equal(b.attempts[0].completed_at!==null,true);
  assert.match(ui.render(),/data-score="50"/);
  assert.match(ui.render(),/Starta en ny privat testomgång/);
  assert.ok(b.calls.includes('complete'));
  assert.ok(!b.calls.some(c=>/share|ai|personality_answers/.test(c)));
  await ui.handleClick(button('view','attempt-1'));
  assert.match(ui.render(),/Endast min graf/);
});

test('unfinished attempt resumes; failed save never counts an answer',async()=>{
  const b=makeBackend(),ui=createPrivateIpipRetests({db:b.db});
  ui.reset('private-user');await ui.load('private-user');
  await ui.handleClick(button('new'));
  b.failNext();
  await ui.handleChange(radio('ipip50-001',4));
  assert.equal(b.answers.length,0);
  assert.match(ui.render(),/Svaret kunde inte sparas/);
  await ui.handleChange(radio('ipip50-001',4));
  assert.equal(b.answers.length,1);
  await ui.handleClick(button('overview'));
  assert.match(ui.render(),/1 av 50 svar/);
  const ui2=createPrivateIpipRetests({db:b.db});
  ui2.reset('private-user');await ui2.load('private-user');
  assert.match(ui2.render(),/1 av 50 svar/);
  await ui2.handleClick(button('resume'));
  assert.match(ui2.render(),/Fråga 2 av 50/);
});

test('retest UI never initiates another owner or a second snapshot while a draft exists',async()=>{
  const b=makeBackend(),ui=createPrivateIpipRetests({db:b.db});
  ui.reset('private-user');await ui.load('private-user');
  await ui.handleClick(button('new'));
  assert.equal(b.attempts.length,1);
  await ui.handleClick(button('new'));
  assert.equal(b.attempts.length,1);
  assert.doesNotMatch(ui.render(),/Avsluta omgången/);
  assert.equal(b.answers.length,0);
});

test('export contains only the active viewer’s saved retest answers and no identity fields',async()=>{
  const b=makeBackend(),downloads=[],ui=createPrivateIpipRetests({
    db:b.db,saveExport:(filename,data)=>downloads.push({filename,data})
  });
  ui.reset('private-user');await ui.load('private-user');
  await ui.handleClick(button('new'));
  await ui.handleChange(radio('ipip50-001',4));
  await ui.handleClick(button('export','attempt-1'));
  assert.equal(downloads.length,1);
  const payload=downloads[0].data;
  assert.equal(payload.answered_count,1);
  assert.equal(payload.complete,false);
  assert.equal(payload.responses[0].value,4);
  assert.match(downloads[0].filename,/^hemmakompassen-ipip50-omtest-\d{4}-\d{2}-\d{2}\.json$/);
  assert.equal(Object.hasOwn(payload,'user_id'),false);
  assert.equal(Object.hasOwn(payload,'attempt_id'),false);
  assert.equal(Object.hasOwn(payload,'partner'),false);
  assert.doesNotMatch(JSON.stringify(payload),/private-user|family_id|parent-id|access_token/);
  assert.equal(b.calls.filter(x=>x==='delete').length,0);
  assert.equal(b.attempts.length,1);
});
test('historic export is read-only and includes all fifty answers',async()=>{
  const b=makeBackend(),downloads=[],ui=createPrivateIpipRetests({
    db:b.db,saveExport:(filename,data)=>downloads.push(data)
  });
  ui.reset('private-user');await ui.load('private-user');
  await ui.handleClick(button('new'));
  for(let i=1;i<=50;i++)await ui.handleChange(radio('ipip50-'+String(i).padStart(3,'0'),3));
  await ui.handleClick(button('complete'));
  await ui.handleClick(button('export','attempt-1'));
  assert.equal(downloads.length,1);
  assert.equal(downloads[0].answered_count,50);
  assert.equal(downloads[0].complete,true);
  assert.ok(downloads[0].completed_at);
  assert.equal(b.attempts.length,1);
  assert.equal(b.answers.length,50);
});
test('delete requires explicit confirmation and removes only chosen retest and its child responses',async()=>{
  const b=makeBackend();let accept=false,confirmCount=0;
  const ui=createPrivateIpipRetests({db:b.db,confirmDelete:()=>{
    confirmCount++;return accept;
  }});
  ui.reset('private-user');await ui.load('private-user');
  await ui.handleClick(button('new'));
  await ui.handleChange(radio('ipip50-001',4));
  await ui.handleClick(button('delete','attempt-1'));
  assert.equal(confirmCount,1);
  assert.equal(b.attempts.length,1);
  assert.equal(b.answers.length,1);
  accept=true;
  await ui.handleClick(button('delete','attempt-1'));
  assert.equal(b.attempts.length,0);
  assert.equal(b.answers.length,0);
  assert.match(ui.render(),/har raderats/);
  assert.match(ui.render(),/Starta en ny privat testomgång/);
});
test('failed deletion retains local draft until server verifies removal',async()=>{
  const b=makeBackend(),ui=createPrivateIpipRetests({db:b.db,confirmDelete:()=>true});
  ui.reset('private-user');await ui.load('private-user');
  await ui.handleClick(button('new'));
  b.setDeleteFailure(true);
  await ui.handleClick(button('delete','attempt-1'));
  assert.equal(b.attempts.length,1);
  assert.match(ui.render(),/Radering kunde inte bekräftas/);
  assert.match(ui.render(),/Fortsätt privat omtest|Spara och pausa/);
});
test('export helper discards unknown questions and out-of-range answers',()=>{
 const result=buildPrivateIpipRetestExport({
   'ipip50-001':5,'ipip50-002':0,'ipip50-003':6,'other':4
 },{startedAt:'2026-11-07T00:00:00Z',completedAt:null,exportedAt:'2026-11-07T12:00:00Z'});
 assert.equal(result.responses.length,1);
 assert.deepEqual(result.responses.map(a=>a.item_id),['ipip50-001']);
 assert.equal(result.instrument_id,'ipip50-sv-v1');
});

test('two simulated tabs race for a retest; second tab resumes the existing draft',async()=>{
  const b=makeBackend();
  const first=createPrivateIpipRetests({db:b.db});
  const second=createPrivateIpipRetests({db:b.db});
  first.reset('private-user');
  second.reset('private-user');
  await first.load('private-user');
  await second.load('private-user');
  await first.handleClick(button('new'));
  assert.equal(b.attempts.length,1);
  await first.handleChange(radio('ipip50-001',4));
  await second.handleClick(button('new'));
  assert.equal(b.attempts.length,1,'Database rejects second open attempt');
  assert.equal(b.answers.length,1,'Already saved answers remain intact');
  assert.match(second.render(),/Det finns redan en påbörjad omgång från en annan flik/);
  assert.match(second.render(),/1 av 50 svar/);
  assert.match(second.render(),/Fortsätt privat omtest/);
  await second.handleClick(button('resume'));
  assert.match(second.render(),/Fråga 2 av 50/);
});

test('draft export reads updated server values rather than an older tab-local copy',async()=>{
  const b=makeBackend(),downloads=[];
  const first=createPrivateIpipRetests({db:b.db,saveExport:(_,data)=>downloads.push(data)});
  first.reset('private-user');await first.load('private-user');
  await first.handleClick(button('new'));
  await first.handleChange(radio('ipip50-001',2));
  assert.equal(b.answers[0].answer_value,2);
  // A second tab saved a new answer after the first tab's last render.
  b.answers[0].answer_value=5;
  b.answers.push({attempt_id:'attempt-1',user_id:'private-user',question_id:'ipip50-002',answer_value:4});
  await first.handleClick(button('export','attempt-1'));
  assert.equal(downloads.length,1);
  assert.equal(downloads[0].answered_count,2);
  assert.deepEqual(downloads[0].responses.map(r=>r.value),[5,4]);
  assert.doesNotMatch(JSON.stringify(downloads[0]),/private-user|attempt-1/);
  // Until manual refresh, the local progress may be old; export must not be.
  assert.match(first.render(),/1 av 50 svar/);
  await first.handleClick(button('refresh'));
  assert.match(first.render(),/2 av 50 svar/);
  assert.match(first.render(),/Dina omtest har uppdaterats från servern/);
});

test('server read failure never downloads a stale or partial draft snapshot',async()=>{
  const b=makeBackend(),downloads=[];
  const ui=createPrivateIpipRetests({db:b.db,saveExport:(_,payload)=>downloads.push(payload)});
  ui.reset('private-user');await ui.load('private-user');
  await ui.handleClick(button('new'));
  await ui.handleChange(radio('ipip50-001',3));
  b.failAnswerRead();
  await ui.handleClick(button('export','attempt-1'));
  assert.equal(downloads.length,0,'Export requires successful server read');
  assert.match(ui.render(),/Det gick inte att exportera omtestet/);
  assert.equal(b.answers.length,1,'Server-side answers are preserved');
  await ui.handleClick(button('export','attempt-1'));
  assert.equal(downloads.length,1);
});

test('manual refresh does not show a deleted draft as an active test',async()=>{
  const b=makeBackend(),ui=createPrivateIpipRetests({db:b.db});
  ui.reset('private-user');await ui.load('private-user');
  await ui.handleClick(button('new'));
  await ui.handleChange(radio('ipip50-001',3));
  // Other tab has confirmed deletion via server; this tab is stale.
  b.attempts.splice(0,1);
  b.answers.splice(0,b.answers.length);
  await ui.handleClick(button('refresh'));
  assert.match(ui.render(),/Starta en ny privat testomgång/);
  assert.doesNotMatch(ui.render(),/Fortsätt privat omtest/);
  assert.equal(b.attempts.length,0);
});
