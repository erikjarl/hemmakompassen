import test from 'node:test';
import assert from 'node:assert/strict';
import {createPrivateIpipRetests,buildPrivateIpipRetestExport} from '../personality/ipip50-retest.js';

function makeBackend(){
  const attempts=[],answers=[],calls=[];
  let owner='private-user',failNextAnswer=false,failDelete=false,failNextAnswerRead=false,failNextAttemptsRead=false,nextAnswerMode=null,writeAttempts=0,nextNewMode=null,nextCompleteMode=null,nextDeleteMode=null,newAttempts=0,completionAttempts=0,deleteAttempts=0;
  const db={
    from(table){
      assert.ok(['personality_test_attempts','personality_attempt_answers'].includes(table),
        'Retests must only read/write private versioned tables');
      function query(op='read',payload=null){
        const filters={};
        const q={
          select(){return q;},eq(k,v){filters[k]=v;return q;},
          order(){return Promise.resolve(run());},single(){return Promise.resolve(run());},
          maybeSingle(){const result=run();return Promise.resolve(result.error?result:{...result,data:Array.isArray(result.data)?result.data[0]||null:result.data});},
          then(ok,bad){return Promise.resolve(run()).then(ok,bad);}
        };
        function run(){
          if(op==='new'){
            newAttempts++;
            const mode=nextNewMode;nextNewMode=null;
            if(mode==='reject')return {data:null,error:{message:'creation rejected'}};
            if(attempts.some(a=>a.user_id===payload.user_id&&a.completed_at===null))
              return {data:null,error:{code:'23505',message:'one open attempt per owner'}};
            const row={id:'attempt-'+(attempts.length+1),user_id:payload.user_id,
              instrument_id:payload.instrument_id,created_at:'2026-11-07T10:00:00Z',completed_at:null};
            attempts.push(row);calls.push('new');
            if(mode==='throw-after')throw Error('creation ACK lost after commit');
            if(mode==='lost-ack')return {data:null,error:{message:'creation ACK lost'}};
            if(mode==='missing-ack')return {data:null,error:null};
            return {data:{...row},error:null};
          }
          if(op==='delete'){
            deleteAttempts++;
            const mode=nextDeleteMode;nextDeleteMode=null;
            if(failDelete||mode==='reject')return {data:null,error:{message:'delete unavailable'}};
            const index=attempts.findIndex(a=>a.id===filters.id&&a.user_id===filters.user_id);
            if(index===-1)return {data:null,error:{message:'not found'}};
            const [deleted]=attempts.splice(index,1);
            for(let i=answers.length-1;i>=0;i--){
              if(answers[i].attempt_id===deleted.id)answers.splice(i,1);
            }
            calls.push('delete');
            if(mode==='lost-ack')return {data:null,error:{message:'deleted, receipt lost'}};
            if(mode==='throw-after')throw Error('delete completed, connection closed');
            if(mode==='missing-ack')return {data:null,error:null};
            return {data:{id:deleted.id},error:null};
          }
          if(op==='update'){
            completionAttempts++;
            const mode=nextCompleteMode;nextCompleteMode=null;
            if(mode==='reject')return {data:null,error:{message:'completion rejected'}};
            const row=attempts.find(a=>a.id===filters.id&&a.user_id===filters.user_id);
            if(!row)return {data:null,error:{message:'not found'}};
            const items=answers.filter(a=>a.attempt_id===row.id&&a.user_id===row.user_id);
            if(row.completed_at||items.length!==50)return {data:null,error:{message:'incomplete'}};
            row.completed_at=payload.completed_at;calls.push('complete');
            if(mode==='lost-ack')return {data:null,error:{message:'completion ACK lost'}};
            if(mode==='throw-after')throw Error('completion transport closed after commit');
            if(mode==='missing-ack')return {data:null,error:null};
            return {data:{...row},error:null};
          }
          if(op==='read'&&table==='personality_test_attempts'&&failNextAttemptsRead){
            failNextAttemptsRead=false;
            return {data:null,error:{message:'offline attempts history'}};
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
          writeAttempts++;
          const mode=nextAnswerMode;nextAnswerMode=null;
          if(failNextAnswer||mode==='reject'){failNextAnswer=false;return {error:{message:'temporary offline'}};}
          const record=answers.find(a=>a.attempt_id===row.attempt_id&&a.question_id===row.question_id);
          if(record)record.answer_value=row.answer_value;
          else answers.push({...row});
          calls.push('answer');
          if(mode==='lost-ack')return {error:{message:'write committed, ACK lost'}};
          if(mode==='throw-after')throw Error('transport closed after commit');
          if(mode==='missing-ack')return undefined;
          return {error:null};
        }
      };
    }
  };
  return {db,attempts,answers,calls,setOwner:v=>owner=v,failNext:()=>failNextAnswer=true,
    setDeleteFailure:v=>failDelete=v,failAnswerRead:()=>failNextAnswerRead=true,
    nextAnswer:v=>nextAnswerMode=v,writeAttempts:()=>writeAttempts,
    nextNew:v=>nextNewMode=v,nextComplete:v=>nextCompleteMode=v,nextDelete:v=>nextDeleteMode=v,
    deleteAttempts:()=>deleteAttempts,
    newAttempts:()=>newAttempts,completionAttempts:()=>completionAttempts,
    failAttemptsRead:()=>failNextAttemptsRead=true};
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
  assert.match(ui.render(),/Svaret kunde inte bekräftas som sparat/);
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
  // Until the next verified page entry, local progress may be old; export must not be.
  assert.match(first.render(),/1 av 50 svar/);
  await first.load('private-user');
  assert.match(first.render(),/2 av 50 svar/);
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

test('re-entering the retest page does not show a deleted draft as an active test',async()=>{
  const b=makeBackend(),ui=createPrivateIpipRetests({db:b.db});
  ui.reset('private-user');await ui.load('private-user');
  await ui.handleClick(button('new'));
  await ui.handleChange(radio('ipip50-001',3));
  // Other tab has confirmed deletion via server; this tab is stale.
  b.attempts.splice(0,1);
  b.answers.splice(0,b.answers.length);
  await ui.load('private-user');
  assert.match(ui.render(),/Starta en ny privat testomgång/);
  assert.doesNotMatch(ui.render(),/Fortsätt privat omtest/);
  assert.equal(b.attempts.length,0);
});


test('two private retests completed the same day have distinguishable history and accessible actions',async()=>{
  const b=makeBackend(),downloads=[];
  const ui=createPrivateIpipRetests({
    db:b.db,renderOwnScores:score=>'<strong>Privat resultat '+score.answeredCount+' frågor</strong>',
    saveExport:(_,data)=>downloads.push(data),
    confirmDelete:()=>true
  });
  ui.reset('private-user');
  await ui.load('private-user');
  for(const value of [2,4]){
    await ui.handleClick(button('new'));
    for(let i=1;i<=50;i++){
      await ui.handleChange(radio('ipip50-'+String(i).padStart(3,'0'),value));
    }
    await ui.handleClick(button('complete'));
  }
  assert.equal(b.attempts.length,2);
  assert.equal(b.answers.length,100);
  // The two completion timestamps can share the same date and minute.
  const html=ui.render();
  assert.match(html,/Omtest 1 av 2/);
  assert.match(html,/Omtest 2 av 2/);
  assert.equal((html.match(/data-ipip-retest="view"/g)||[]).length,2);
  assert.match(html,/aria-label="Visa mitt resultat för Omtest 1 av 2/);
  assert.match(html,/aria-label="Visa mitt resultat för Omtest 2 av 2/);
  assert.match(html,/aria-label="Exportera omgången som JSON för Omtest 1 av 2/);
  assert.match(html,/aria-label="Radera omgången för Omtest 2 av 2/);
  assert.ok(!html.includes('private-user'),'History must not expose the account ID');
  await ui.handleClick(button('view','attempt-1'));
  assert.match(ui.render(),/Mitt privata omtest · Omtest 2 av 2/);
  await ui.handleClick(button('view','attempt-2'));
  assert.match(ui.render(),/Mitt privata omtest · Omtest 1 av 2/);
  await ui.handleClick(button('export','attempt-2'));
  assert.equal(downloads.length,1);
  assert.equal(downloads[0].answered_count,50);
  assert.equal(downloads[0].responses[0].value,4,
    'Newer retest exports its own result rather than the older attempt');
  await ui.handleClick(button('delete','attempt-1'));
  assert.equal(b.attempts.length,1);
  assert.equal(b.answers.length,50);
  assert.match(ui.render(),/Omtest 1 av 1/);
  assert.doesNotMatch(ui.render(),/Omtest 2 av 2/);
  await ui.load('private-user');
  assert.equal((ui.render().match(/data-ipip-retest="view"/g)||[]).length,1);
  assert.equal(b.attempts[0].id,'attempt-2');
  ui.reset('another-user');
  await ui.load('another-user');
  assert.doesNotMatch(ui.render(),/data-ipip-retest="view"/,
    'Switching user does not leave previous private history in the view');
  assert.match(ui.render(),/Ingen avslutad omgång ännu/);
});

test('failed private history load shows only retry, then restores distinguishable history',async()=>{
  const b=makeBackend(),ui=createPrivateIpipRetests({db:b.db});
  ui.reset('private-user');
  await ui.load('private-user');
  for(let i=0;i<2;i++){
    await ui.handleClick(button('new'));
    for(let n=1;n<=50;n++)await ui.handleChange(radio('ipip50-'+String(n).padStart(3,'0'),3));
    await ui.handleClick(button('complete'));
  }
  b.failAttemptsRead();
  await ui.load('private-user');
  assert.match(ui.render(),/Det gick inte att hämta dina privata omtestningar/);
  assert.match(ui.render(),/data-ipip-retest="reload"/);
  assert.doesNotMatch(ui.render(),/data-ipip-retest="view"/,
    'Historical results are not shown from stale cache during a server error');
  await ui.handleClick(button('reload'));
  assert.match(ui.render(),/Omtest 1 av 2/);
  assert.match(ui.render(),/Omtest 2 av 2/);
  assert.doesNotMatch(ui.render(),/data-ipip-retest="reload"/);
});

test('private retest: lost ACK after commit advances once with exactly one write',async()=>{
  const b=makeBackend(),ui=createPrivateIpipRetests({db:b.db});
  ui.reset('private-user');await ui.load('private-user');await ui.handleClick(button('new'));
  b.nextAnswer('lost-ack');
  await ui.handleChange(radio('ipip50-001',4));
  assert.equal(b.answers.length,1);
  assert.equal(b.answers[0].answer_value,4);
  assert.equal(b.writeAttempts(),1);
  assert.match(ui.render(),/Fråga 2 av 50/);
  assert.doesNotMatch(ui.render(),/Kontrollera sparat svar/);
});

test('private retest: exception and missing acknowledgement are reconciled without duplicate write',async()=>{
  for(const mode of ['throw-after','missing-ack']){
    const b=makeBackend(),ui=createPrivateIpipRetests({db:b.db});
    ui.reset('private-user');await ui.load('private-user');await ui.handleClick(button('new'));
    b.nextAnswer(mode);
    await ui.handleChange(radio('ipip50-001',3));
    assert.equal(b.writeAttempts(),1);
    assert.match(ui.render(),/Fråga 2 av 50/);
  }
});

test('private retest: rejected first write stays on the same question and permits a deliberate retry',async()=>{
  const b=makeBackend(),ui=createPrivateIpipRetests({db:b.db});
  ui.reset('private-user');await ui.load('private-user');await ui.handleClick(button('new'));
  b.nextAnswer('reject');
  const pending=ui.handleChange(radio('ipip50-001',5));
  const duplicate=await ui.handleChange(radio('ipip50-001',5));
  assert.equal(duplicate,false,'A second synthetic event during save must not rewrite');
  await pending;
  assert.equal(b.writeAttempts(),1);
  assert.equal(b.answers.length,0);
  assert.match(ui.render(),/Fråga 1 av 50/);
  assert.match(ui.render(),/Svaret kunde inte bekräftas som sparat/);
  assert.doesNotMatch(ui.render(),/Kontrollera sparat svar/);
  await ui.handleChange(radio('ipip50-001',5));
  assert.equal(b.writeAttempts(),2);
  assert.match(ui.render(),/Fråga 2 av 50/);
});

test('private retest: a previous different saved value does not confirm a failed overwrite',async()=>{
  const b=makeBackend(),ui=createPrivateIpipRetests({db:b.db});
  ui.reset('private-user');await ui.load('private-user');await ui.handleClick(button('new'));
  await ui.handleChange(radio('ipip50-001',2));
  await ui.handleClick(button('prev'));
  b.nextAnswer('reject');
  await ui.handleChange(radio('ipip50-001',4));
  assert.equal(b.answers[0].answer_value,2);
  assert.match(ui.render(),/Fråga 1 av 50/);
  assert.match(ui.render(),/kunde inte bekräftas som sparat/);
});

test('private retest: unknown save offers server-only check and resumes from actual stored answer',async()=>{
  const b=makeBackend(),ui=createPrivateIpipRetests({db:b.db});
  ui.reset('private-user');await ui.load('private-user');await ui.handleClick(button('new'));
  b.nextAnswer('lost-ack');b.failAnswerRead();
  await ui.handleChange(radio('ipip50-001',4));
  assert.equal(b.writeAttempts(),1);
  assert.match(ui.render(),/Fråga 1 av 50/);
  assert.match(ui.render(),/Det går inte att kontrollera om svaret sparades/);
  assert.match(ui.render(),/data-ipip-retest="verify-save"/);
  await ui.handleClick(button('verify-save'));
  assert.equal(b.writeAttempts(),1,'A check must only read, not re-send the answer');
  assert.match(ui.render(),/1 av 50 svar/);
  assert.doesNotMatch(ui.render(),/data-ipip-retest="verify-save"/);
  await ui.handleClick(button('resume'));
  assert.match(ui.render(),/Fråga 2 av 50/);
});

test('private retest: uncertain read and identity switch do not show a stale confirm control',async()=>{
  const b=makeBackend(),ui=createPrivateIpipRetests({db:b.db});
  ui.reset('private-user');await ui.load('private-user');await ui.handleClick(button('new'));
  b.nextAnswer('reject');b.failAnswerRead();
  await ui.handleChange(radio('ipip50-001',3));
  assert.match(ui.render(),/Kontrollera sparat svar/);
  ui.reset('another-user');
  await ui.load('another-user');
  assert.doesNotMatch(ui.render(),/Kontrollera sparat svar|3 av 50 svar/);
  assert.equal(b.writeAttempts(),1);
});


test('private retest start: a lost or thrown creation ACK resumes the one confirmed draft',async()=>{
  for(const mode of ['lost-ack','throw-after','missing-ack']){
    const b=makeBackend(),ui=createPrivateIpipRetests({db:b.db});
    ui.reset('private-user');await ui.load('private-user');
    b.nextNew(mode);
    await ui.handleClick(button('new'));
    assert.equal(b.attempts.length,1);
    assert.equal(b.newAttempts(),1,'No duplicate INSERT when the response is missing');
    assert.match(ui.render(),/Servern visar en påbörjad omgång/);
    assert.match(ui.render(),/Fortsätt privat omtest/);
    await ui.handleClick(button('resume'));
    assert.match(ui.render(),/Fråga 1 av 50/);
    assert.equal(b.newAttempts(),1);
  }
});

test('private retest start: server rejects creation, user may retry after fresh read',async()=>{
  const b=makeBackend(),ui=createPrivateIpipRetests({db:b.db});
  ui.reset('private-user');await ui.load('private-user');
  b.nextNew('reject');
  await ui.handleClick(button('new'));
  assert.equal(b.attempts.length,0);
  assert.match(ui.render(),/Servern visar ingen påbörjad omgång/);
  await ui.handleClick(button('new'));
  assert.equal(b.attempts.length,1);
  assert.equal(b.newAttempts(),2);
  assert.match(ui.render(),/Fråga 1 av 50/);
});

test('private retest start: unreadable server list allows only a refresh, not false success',async()=>{
  const b=makeBackend(),ui=createPrivateIpipRetests({db:b.db});
  ui.reset('private-user');await ui.load('private-user');
  b.nextNew('lost-ack');b.failAttemptsRead();
  await ui.handleClick(button('new'));
  assert.equal(b.attempts.length,1,'The creation actually committed');
  assert.match(ui.render(),/Det gick inte att hämta dina privata omtestningar/);
  assert.doesNotMatch(ui.render(),/Fortsätt privat omtest/);
  await ui.handleClick(button('reload'));
  assert.match(ui.render(),/Fortsätt privat omtest/);
  assert.equal(b.newAttempts(),1);
});

test('private retest completion: lost, thrown or missing ACK is read back and history updates once',async()=>{
  for(const mode of ['lost-ack','throw-after','missing-ack']){
    const b=makeBackend(),ui=createPrivateIpipRetests({db:b.db});
    ui.reset('private-user');await ui.load('private-user');
    await ui.handleClick(button('new'));
    for(let i=1;i<=50;i++)await ui.handleChange(radio('ipip50-'+String(i).padStart(3,'0'),3));
    b.nextComplete(mode);
    await ui.handleClick(button('complete'));
    assert.equal(b.completionAttempts(),1);
    assert.equal(b.attempts[0].completed_at!==null,true);
    assert.match(ui.render(),/Servern bekräftar att omgången avslutades/);
    assert.match(ui.render(),/Omtest 1 av 1/);
    assert.doesNotMatch(ui.render(),/Kontrollera omtestets status/);
    await ui.handleClick(button('complete'));
    assert.equal(b.completionAttempts(),1,'Completion is not resent after verified ACK loss');
  }
});

test('private retest completion: rejected update requires explicit server check before retry',async()=>{
  const b=makeBackend(),ui=createPrivateIpipRetests({db:b.db});
  ui.reset('private-user');await ui.load('private-user');await ui.handleClick(button('new'));
  for(let i=1;i<=50;i++)await ui.handleChange(radio('ipip50-'+String(i).padStart(3,'0'),3));
  b.nextComplete('reject');
  await ui.handleClick(button('complete'));
  assert.equal(b.attempts[0].completed_at,null);
  assert.equal(b.completionAttempts(),1);
  assert.match(ui.render(),/Det går inte att bekräfta om omgången avslutades/);
  assert.match(ui.render(),/data-ipip-retest="verify-attempts"/);
  await ui.handleClick(button('complete'));
  assert.equal(b.completionAttempts(),1,'An unconfirmed completion is not repeated blindly');
  await ui.handleClick(button('verify-attempts'));
  assert.match(ui.render(),/Fortsätt privat omtest/);
  await ui.handleClick(button('resume'));
  await ui.handleClick(button('complete'));
  assert.equal(b.completionAttempts(),2);
  assert.equal(b.attempts[0].completed_at!==null,true);
});

test('private retest completion: readback failure stays unknown until explicit refresh',async()=>{
  const b=makeBackend(),ui=createPrivateIpipRetests({db:b.db});
  ui.reset('private-user');await ui.load('private-user');await ui.handleClick(button('new'));
  for(let i=1;i<=50;i++)await ui.handleChange(radio('ipip50-'+String(i).padStart(3,'0'),4));
  b.nextComplete('lost-ack');b.failAttemptsRead();
  await ui.handleClick(button('complete'));
  assert.equal(b.attempts[0].completed_at!==null,true);
  assert.match(ui.render(),/Kontrollera omtestets status/);
  assert.doesNotMatch(ui.render(),/Omgången har avslutats och sparats/);
  await ui.handleClick(button('verify-attempts'));
  assert.match(ui.render(),/Omtest 1 av 1/);
  assert.equal(b.completionAttempts(),1);
});

test('private retest completion: account switching clears ambiguous operation state',async()=>{
  const b=makeBackend(),ui=createPrivateIpipRetests({db:b.db});
  ui.reset('private-user');await ui.load('private-user');await ui.handleClick(button('new'));
  for(let i=1;i<=50;i++)await ui.handleChange(radio('ipip50-'+String(i).padStart(3,'0'),3));
  b.nextComplete('reject');
  await ui.handleClick(button('complete'));
  assert.match(ui.render(),/Kontrollera omtestets status/);
  ui.reset('another-user');await ui.load('another-user');
  assert.doesNotMatch(ui.render(),/Kontrollera omtestets status|Omtest 1 av 1/);
});


test('private retest deletion reconciles a lost, thrown or missing server acknowledgement',async()=>{
  for(const mode of ['lost-ack','throw-after','missing-ack']){
    const b=makeBackend(),ui=createPrivateIpipRetests({db:b.db,confirmDelete:()=>true});
    ui.reset('private-user');await ui.load('private-user');await ui.handleClick(button('new'));
    await ui.handleChange(radio('ipip50-001',4));
    b.nextDelete(mode);
    await ui.handleClick(button('delete','attempt-1'));
    assert.equal(b.deleteAttempts(),1,'Never repeat a committed irreversible DELETE');
    assert.equal(b.attempts.length,0);
    assert.equal(b.answers.length,0);
    assert.match(ui.render(),/Servern bekräftar att omtestet är raderat trots ett kommunikationsfel/);
    assert.match(ui.render(),/Starta en ny privat testomgång/);
    assert.doesNotMatch(ui.render(),/Fortsätt privat omtest|Kontrollera omtestets status/);
    await ui.handleClick(button('delete','attempt-1'));
    assert.equal(b.deleteAttempts(),1,'Deleted attempt is no longer an actionable control');
  }
});

test('private retest deletion with rejected write preserves its answer and permits a deliberate retry',async()=>{
  const b=makeBackend(),ui=createPrivateIpipRetests({db:b.db,confirmDelete:()=>true});
  ui.reset('private-user');await ui.load('private-user');await ui.handleClick(button('new'));
  await ui.handleChange(radio('ipip50-001',2));
  b.nextDelete('reject');
  await ui.handleClick(button('delete','attempt-1'));
  assert.equal(b.deleteAttempts(),1);
  assert.equal(b.attempts.length,1);assert.equal(b.answers.length,1);
  assert.match(ui.render(),/Servern visar att omtestet fortfarande finns/);
  assert.doesNotMatch(ui.render(),/Servern bekräftar att omtestet är raderat/);
  await ui.handleClick(button('delete','attempt-1'));
  assert.equal(b.deleteAttempts(),2);
  assert.equal(b.attempts.length,0);
  assert.equal(b.answers.length,0);
});

test('private retest deletion on unreadable server result pauses further actions until explicit refresh',async()=>{
  const b=makeBackend(),ui=createPrivateIpipRetests({db:b.db,confirmDelete:()=>true});
  ui.reset('private-user');await ui.load('private-user');await ui.handleClick(button('new'));
  b.nextDelete('lost-ack');b.failAttemptsRead();
  await ui.handleClick(button('delete','attempt-1'));
  assert.equal(b.attempts.length,0,'Server did delete even though HTTP response failed');
  assert.equal(b.deleteAttempts(),1);
  assert.match(ui.render(),/Raderingen kunde inte bekräftas/);
  assert.match(ui.render(),/data-ipip-retest="verify-attempts"/);
  await ui.handleClick(button('new'));
  await ui.handleClick(button('delete','attempt-1'));
  assert.equal(b.deleteAttempts(),1,'An ambiguous deletion cannot be silently repeated');
  await ui.handleClick(button('verify-attempts'));
  assert.match(ui.render(),/Starta en ny privat testomgång/);
  assert.doesNotMatch(ui.render(),/Kontrollera omtestets status|Fortsätt privat omtest/);
  assert.equal(b.deleteAttempts(),1,'Explicit refresh only reads and never deletes');
});

test('lost deletion ACK removes only the selected historic attempt and keeps newer history',async()=>{
  const b=makeBackend(),ui=createPrivateIpipRetests({db:b.db,confirmDelete:()=>true});
  ui.reset('private-user');await ui.load('private-user');
  for(const value of [2,4]){
    await ui.handleClick(button('new'));
    for(let n=1;n<=50;n++)await ui.handleChange(radio('ipip50-'+String(n).padStart(3,'0'),value));
    await ui.handleClick(button('complete'));
  }
  assert.equal(b.attempts.length,2);assert.equal(b.answers.length,100);
  await ui.handleClick(button('view','attempt-1'));
  b.nextDelete('lost-ack');
  await ui.handleClick(button('delete','attempt-1'));
  assert.equal(b.deleteAttempts(),1);
  assert.deepEqual(b.attempts.map(a=>a.id),['attempt-2']);
  assert.equal(b.answers.length,50);
  assert.match(ui.render(),/Servern bekräftar att omtestet är raderat/);
  assert.match(ui.render(),/Omtest 1 av 1/);
  assert.doesNotMatch(ui.render(),/Omtest 2 av 2|Mitt privata omtest · Omtest 2/);
  await ui.handleClick(button('view','attempt-2'));
  assert.match(ui.render(),/Mitt privata omtest · Omtest 1 av 1/);
});

test('switching account after an uncertain delete clears the stale verification button',async()=>{
  const b=makeBackend(),ui=createPrivateIpipRetests({db:b.db,confirmDelete:()=>true});
  ui.reset('private-user');await ui.load('private-user');await ui.handleClick(button('new'));
  b.nextDelete('reject');b.failAttemptsRead();
  await ui.handleClick(button('delete','attempt-1'));
  assert.match(ui.render(),/Kontrollera omtestets status/);
  ui.reset('another-user');await ui.load('another-user');
  assert.doesNotMatch(ui.render(),/Kontrollera omtestets status|Påbörjad omgång/);
  assert.match(ui.render(),/Starta en ny privat testomgång/);
  assert.equal(b.deleteAttempts(),1);
});
