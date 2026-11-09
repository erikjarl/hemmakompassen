import test from 'node:test';
import assert from 'node:assert/strict';
import {createPersonalityExperience} from '../personality/ipip50-ui.js';

const never=new Promise(()=>{});
const userId='synthetic-parent-id';
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const btn=action=>({closest:selector=>selector==='[data-pf-action]'?{dataset:{pfAction:action}}:null});
const radio=(question_id,value)=>({
  matches:selector=>selector==='input[data-pf-answer]',
  dataset:{pfAnswer:question_id},value:String(value)
});

function fixture(){
  let stallRead=false,stallWrite=false;
  const answers=new Map();
  let writes=0;
  const db={
    auth:{async getUser(){return {data:{user:{id:userId}},error:null};}},
    from(name){
      assert.equal(name,'personality_answers');
      return {
        select(){return {eq(){return {eq(){
          if(stallRead)return never;
          return Promise.resolve({data:[...answers].map(([question_id,value])=>({
            question_id,answer:{value}
          })),error:null});
        }}};}},
        upsert(row){
          writes++;
          if(stallWrite)return never;
          answers.set(row.question_id,row.answer.value);
          return Promise.resolve({error:null});
        }
      };
    }
  };
  return {db,answers,setReadStall:v=>stallRead=v,setWriteStall:v=>stallWrite=v,
    get writes(){return writes;}};
}

test('FUN-04: an unanswered IPIP read must show a retry instead of hanging indefinitely',async()=>{
  const m=fixture();
  m.setReadStall(true);
  const ui=createPersonalityExperience({db:m.db,onRender:()=>{},requestTimeoutMs:25});
  ui.reset(userId);
  const completed=ui.load(userId).then(()=>true);
  assert.match(ui.render(),/Hämtar dina svar/);
  assert.equal(await Promise.race([completed,wait(450).then(()=>false)]),true,
    'Timed out own-answer read must return and unlock the UI');
  assert.match(ui.render(),/Kunde inte hämta dina privata svar/);
  assert.match(ui.render(),/data-pf-action="reload"/);
  m.setReadStall(false);
  assert.equal(await ui.handleClick(btn('reload')),true);
  assert.match(ui.render(),/Börja testet/);
});

test('FUN-04: an unanswered IPIP write must become uncertain, keep the current question, and allow server recheck',async()=>{
  for(const role of ['parent','teen']){
    const m=fixture();
    const ui=createPersonalityExperience({db:m.db,onRender:()=>{},requestTimeoutMs:25});
    ui.reset(userId);await ui.load(userId);
    await ui.handleClick(btn('start'));
    m.setWriteStall(true);
    const completed=ui.handleChange(radio('ipip50-001',4)).then(()=>true);
    assert.match(ui.render(),/Fråga 1 av 50/);
    assert.equal(await Promise.race([completed,wait(1150).then(()=>false)]),true,
      'Timed out answer write must release the selected control');
    assert.match(ui.render(),/Kontrollera sparat svar/);
    assert.match(ui.render(),/data-pf-action="verify-save"/);
    assert.match(ui.render(),/Fråga 1 av 50/,'No automatic advance from an unconfirmed write');
    assert.equal(m.writes,1,'No automatic duplicate write');
    m.setWriteStall(false);
    // Simulate server state that eventually committed the old in-flight write.
    m.answers.set('ipip50-001',4);
    assert.equal(await ui.handleClick(btn('verify-save')),true);
    assert.match(ui.render(),/1 av 50/);
    await ui.handleClick(btn('start'));
    assert.match(ui.render(),/Fråga 2 av 50/,'Confirmed server state is used after retry');
    assert.equal(m.writes,1,'Recheck must not silently resend');
  }
});
