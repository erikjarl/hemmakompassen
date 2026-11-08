import test from 'node:test';
import assert from 'node:assert/strict';
import {saveMyIPIP50Answer} from '../personality/ipip50-storage.js';
import {createPersonalityExperience} from '../personality/ipip50-ui.js';

const USER='test-viewer';
const QUESTION='ipip50-001';
const VERSION='ipip50-sv-v1';

function fixture({mode='ok',stored=null,readFailure=false,malformed=null}={}){
  const answers=new Map(stored===null?[]:[[QUESTION,stored]]);
  let readbacks=0,writes=0,readbackFail=readFailure,writeMode=mode;
  const filters=[];
  const db={
    auth:{async getUser(){return {data:{user:{id:USER}},error:null};}},
    from(table){
      assert.equal(table,'personality_answers');
      return {
        async upsert(row,{onConflict}){
          writes++;
          assert.equal(onConflict,'user_id,instrument_id,question_id');
          assert.equal(row.user_id,USER);assert.equal(row.instrument_id,VERSION);
          assert.equal(row.question_id,QUESTION);
          if(writeMode==='reject')return {error:{message:'database refused'}};
          answers.set(row.question_id,row.answer.value);
          if(writeMode==='throw-after')throw Error('socket closed after commit');
          if(writeMode==='lost-ack')return {error:{message:'response lost'}};
          return {error:null};
        },
        select(columns){
          const criteria={};
          const query={
            eq(column,value){criteria[column]=value;return query;},
            async maybeSingle(){
              readbacks++;
              filters.push({...criteria,columns});
              assert.deepEqual(criteria,{user_id:USER,instrument_id:VERSION,question_id:QUESTION});
              assert.equal(columns,'question_id,answer');
              if(readbackFail){readbackFail=false;return {data:null,error:{message:'temporarily offline'}};}
              if(malformed!==null)return {data:malformed,error:null};
              return {data:answers.has(QUESTION)
                ?{question_id:QUESTION,answer:{value:answers.get(QUESTION)}}:null,error:null};
            },
            then(resolve,reject){
              assert.equal(columns,'question_id,answer');
              assert.equal(criteria.user_id,USER);
              assert.equal(criteria.instrument_id,VERSION);
              return Promise.resolve({data:[...answers].map(([id,value])=>({question_id:id,answer:{value}})),error:null}).then(resolve,reject);
            }
          };
          return query;
        }
      };
    }
  };
  return {db,answers,filters,writes:()=>writes,readbacks:()=>readbacks,
    setMode:value=>writeMode=value,setReadFailure:()=>readbackFail=true};
}
const radio=value=>({matches:selector=>selector==='input[data-pf-answer]',
  dataset:{pfAnswer:QUESTION},value:String(value)});
const button=action=>({closest:selector=>selector==='[data-pf-action]'?
  {dataset:{pfAction:action}}:null});

test('lost acknowledgement after committed first answer returns success without duplicate write',async()=>{
  const x=fixture({mode:'lost-ack'});
  assert.deepEqual(await saveMyIPIP50Answer(x.db,QUESTION,4),
    {saved:true,questionId:QUESTION,instrumentId:VERSION});
  assert.equal(x.writes(),1);
  assert.equal(x.readbacks(),1);
  assert.deepEqual(x.filters[0],{user_id:USER,instrument_id:VERSION,question_id:QUESTION,
    columns:'question_id,answer'});
});
test('a thrown acknowledgement error after commit can also be confirmed',async()=>{
  const x=fixture({mode:'throw-after'});
  const result=await saveMyIPIP50Answer(x.db,QUESTION,5);
  assert.equal(result.saved,true);
  assert.equal(x.readbacks(),1);
  assert.equal(x.answers.get(QUESTION),5);
});
test('a rejected write with no saved answer must not be reported as success',async()=>{
  const x=fixture({mode:'reject'});
  await assert.rejects(saveMyIPIP50Answer(x.db,QUESTION,4),
    error=>error.code==='IPIP50_SAVE_NOT_CONFIRMED');
  assert.equal(x.answers.size,0);
  assert.equal(x.readbacks(),1);
});
test('an old different answer never confirms a new rejected value',async()=>{
  const x=fixture({mode:'reject',stored:2});
  await assert.rejects(saveMyIPIP50Answer(x.db,QUESTION,4),
    error=>error.code==='IPIP50_SAVE_NOT_CONFIRMED');
  assert.equal(x.answers.get(QUESTION),2);
});
test('readback failure or malformed row gives an explicitly unknown status',async()=>{
  const failed=fixture({mode:'lost-ack',readFailure:true});
  await assert.rejects(saveMyIPIP50Answer(failed.db,QUESTION,4),
    error=>error.code==='IPIP50_SAVE_UNKNOWN');
  const malformed=fixture({mode:'lost-ack',malformed:{question_id:'ipip50-099',answer:{value:4}}});
  await assert.rejects(saveMyIPIP50Answer(malformed.db,QUESTION,4),
    error=>error.code==='IPIP50_SAVE_UNKNOWN');
});
test('the questionnaire advances after a committed answer whose ACK was lost',async()=>{
  const x=fixture({mode:'lost-ack'});
  const ui=createPersonalityExperience({db:x.db,onRender:()=>{}});
  ui.reset(USER);await ui.load(USER);
  await ui.handleClick(button('start'));
  assert.match(ui.render(),/Fråga 1 av 50/);
  await ui.handleChange(radio(4));
  assert.match(ui.render(),/Fråga 2 av 50/);
  assert.doesNotMatch(ui.render(),/Kontrollera sparat svar/);
  assert.equal(x.writes(),1);
});
test('a rejected answer remains on the same question and can be retried',async()=>{
  const x=fixture({mode:'reject'});
  const ui=createPersonalityExperience({db:x.db,onRender:()=>{}});
  ui.reset(USER);await ui.load(USER);await ui.handleClick(button('start'));
  await ui.handleChange(radio(3));
  assert.match(ui.render(),/Fråga 1 av 50/);
  assert.match(ui.render(),/Svaret kunde inte bekräftas som sparat/);
  assert.doesNotMatch(ui.render(),/data-pf-action="verify-save"/);
  x.setMode('ok');
  await ui.handleChange(radio(3));
  assert.match(ui.render(),/Fråga 2 av 50/);
  assert.equal(x.answers.get(QUESTION),3);
});
test('an unknown save offers an explicit server reload that finds the saved answer',async()=>{
  const x=fixture({mode:'lost-ack',readFailure:true});
  const ui=createPersonalityExperience({db:x.db,onRender:()=>{}});
  ui.reset(USER);await ui.load(USER);await ui.handleClick(button('start'));
  await ui.handleChange(radio(4));
  assert.match(ui.render(),/Fråga 1 av 50/);
  assert.match(ui.render(),/Det går inte att kontrollera om svaret sparades/);
  assert.match(ui.render(),/data-pf-action="verify-save"/);
  await ui.handleClick(button('verify-save'));
  const refreshed=ui.render();
  assert.match(refreshed,/1 av 50/);
  assert.match(refreshed,/Fortsätt testet/);
  assert.doesNotMatch(refreshed,/data-pf-action="verify-save"/);
  await ui.handleClick(button('start'));
  assert.match(ui.render(),/Fråga 2 av 50/);
  assert.equal(x.writes(),1,'Reload reads saved state; it never writes the answer again');
});
