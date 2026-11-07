import test from 'node:test';
import assert from 'node:assert/strict';
import {createPrivateIpipRetests} from '../personality/ipip50-retest.js';

function makeBackend(){
  const attempts=[],answers=[],calls=[];
  let owner='private-user',failNextAnswer=false;
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
            const row={id:'attempt-'+(attempts.length+1),user_id:payload.user_id,
              instrument_id:payload.instrument_id,created_at:'2026-11-07T10:00:00Z',completed_at:null};
            attempts.push(row);calls.push('new');return {data:{...row},error:null};
          }
          if(op==='update'){
            const row=attempts.find(a=>a.id===filters.id&&a.user_id===filters.user_id);
            if(!row)return {data:null,error:{message:'not found'}};
            const items=answers.filter(a=>a.attempt_id===row.id&&a.user_id===row.user_id);
            if(row.completed_at||items.length!==50)return {data:null,error:{message:'incomplete'}};
            row.completed_at=payload.completed_at;calls.push('complete');
            return {data:{...row},error:null};
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
  return {db,attempts,answers,calls,setOwner:v=>owner=v,failNext:()=>failNextAnswer=true};
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
