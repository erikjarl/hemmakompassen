import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../konto.js',import.meta.url),'utf8')
  .replace(/^import .*\n/,'');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const settle=async()=>{await tick();await tick();await tick();};

function harness(){
  const elements=new Map();
  function el(id){
    if(!elements.has(id)){
      const node={id,value:'',textContent:'',disabled:false,hidden:false,
        classList:{toggle(_name,hidden){node.hidden=hidden;}},
        addEventListener(type,fn){node[type]=fn;},
        removeAttribute(){},reset(){},focus(){}};
      elements.set(id,node);
    }
    return elements.get(id);
  }
  const refreshButton=el('refresh-account');
  const feedbackSubmit=el('feedback-submit');
  const reservedButton=el('reserved-action');
  feedbackSubmit.disabled=true;
  reservedButton.disabled=true;
  let nextMembersError=null;
  let holdNextMembers=false,finishMembers;
  const client={
    auth:{
      getUser:async()=>({data:{user:{id:'parent-a',email:'parent@example.invalid'}},error:null}),
      onAuthStateChange(){}
    },
    from(table){
      assert.equal(table,'profiles');
      return {select(){return {eq(){return {maybeSingle:async()=>({
        data:{display_name:'Testförälder'},error:null
      })}}}}};
    },
    rpc(name){
      assert.equal(name,'my_family_members');
      if(holdNextMembers){
        holdNextMembers=false;
        return new Promise(resolve=>{finishMembers=()=>resolve({
          data:[],error:nextMembersError
        });});
      }
      return Promise.resolve({data:[],error:nextMembersError});
    }
  };
  vm.runInNewContext(source,{
    createClient:()=>client,
    window:{HEMMAKOMPASSEN_BACKEND:{}},
    document:{getElementById:el,querySelectorAll:selector=>{
      assert.equal(selector,'button');
      return [refreshButton,feedbackSubmit,reservedButton];
    }},
    location:{href:'https://example.invalid/konto.html',hash:'',pathname:'/konto.html',search:'',assign(){}},
    URL,setTimeout,clearTimeout
  },{filename:'konto.js'});
  return {el,refreshButton,feedbackSubmit,reservedButton,
    hold(){holdNextMembers=true;},
    finish(){assert.equal(typeof finishMembers,'function');finishMembers();finishMembers=null;},
    fail(message){nextMembersError={message};},
    refresh(){refreshButton.click();}
  };
}

test('FUN-01: completing account refresh must preserve other controls disabled before it started',async()=>{
  const h=harness();await settle();
  assert.equal(h.feedbackSubmit.disabled,true);
  assert.equal(h.reservedButton.disabled,true);
  assert.equal(h.refreshButton.disabled,false);
  h.hold();
  h.refresh();await settle();
  assert.equal(h.refreshButton.disabled,true,'Account button is disabled while updating');
  assert.equal(h.feedbackSubmit.disabled,true,'An already disabled feedback submit stays disabled');
  h.finish();await settle();
  assert.equal(h.refreshButton.disabled,false,'Previously enabled button is restored');
  assert.equal(h.feedbackSubmit.disabled,true,'Feedback submit must remain disabled');
  assert.equal(h.reservedButton.disabled,true,'Other already disabled button must remain disabled');
  assert.equal(h.el('refresh-account-status').textContent,'Kontot har uppdaterats.');
});

test('FUN-01: a failed account refresh must not enable independently disabled buttons',async()=>{
  const h=harness();await settle();
  h.fail('Simulerat familjefel');
  h.refresh();await settle();
  assert.match(h.el('refresh-account-status').textContent,/Simulerat familjefel/);
  assert.equal(h.refreshButton.disabled,false,'Retry must become available');
  assert.equal(h.feedbackSubmit.disabled,true);
  assert.equal(h.reservedButton.disabled,true);
});
