import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../konto.js',import.meta.url),'utf8').replace(/^import .*?\n/,'');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const settle=async()=>{await pause(0);await pause(0);};

function harness(){
 const elements=new Map();
 function el(id){
  if(!elements.has(id)){
   const node={id,value:'',textContent:'',disabled:false,hidden:false,
    classList:{toggle(_name,hide){node.hidden=hide;}},
    addEventListener(type,fn){node[type]=fn;},
    removeAttribute(){},reset(){},focus(){}};
   elements.set(id,node);
  }
  return elements.get(id);
 }
 const buttons=[el('refresh-account'),el('name-save'),el('other-locked')];
 el('other-locked').disabled=true;
 let profileMode='ok',current={id:'parent',email:'parent@example.invalid'};
 let saveMode='ok',saveCount=0,readCount=0,finishRead=null;
 let savedName='Gammalt namn';
 const client={
  auth:{getUser:async()=>({data:{user:current},error:null}),onAuthStateChange(){}},
  from(table){
   assert.equal(table,'profiles');
   return {
    select(){return {eq(){return {maybeSingle(){
     readCount++;
     if(profileMode==='fail')return Promise.resolve({data:null,error:{message:'Profilen kunde inte läsas'}});
     if(profileMode==='hang')return new Promise(resolve=>{finishRead=resolve;});
     return Promise.resolve({data:{display_name:savedName},error:null});
    }}}};},
    upsert(row){
     saveCount++;
     if(saveMode==='fail')return Promise.resolve({error:{message:'Sparandet misslyckades'}});
     savedName=row.display_name;
     return Promise.resolve({error:null});
    }
   };
  },
  rpc:async name=>{assert.equal(name,'my_family_members');return {data:[],error:null};}
 };
 vm.runInNewContext(source,{
  createClient:()=>client,window:{HEMMAKOMPASSEN_BACKEND:{accountRequestTimeoutMs:35}},
  document:{getElementById:el,querySelectorAll:()=>buttons},
  location:{href:'https://example.invalid/konto.html',hash:'',pathname:'/konto.html',search:'',assign(){}},
  URL,setTimeout,clearTimeout
 },{filename:'konto.js'});
 return {el,buttons,
  failRead(){profileMode='fail';},
  hangRead(){profileMode='hang';},
  restoreRead(){profileMode='ok';},
  finishOldRead(){assert.ok(finishRead);finishRead({data:{display_name:'FÖRÅLDRAD DATA'},error:null});finishRead=null;},
  failSave(){saveMode='fail';},
  get saves(){return saveCount;},
  get reads(){return readCount;},
  get name(){return savedName;},
  submitName(value){el('display-name').value=value;el('display-name').input();el('name-form').submit({preventDefault(){}});},
  refresh(){el('refresh-account').click();}
 };
}

test('FUN-01: confirmed name save followed by failed profile read retains success and warns against duplicate action',async()=>{
 const h=harness();await settle();
 h.failRead();
 h.submitName('Mitt nya namn');
 await settle();
 assert.equal(h.saves,1);
 assert.equal(h.name,'Mitt nya namn','The write was confirmed by the fake backend');
 assert.match(h.el('status').textContent,/Namnet sparat/);
 assert.match(h.el('status').textContent,/Åtgärden bekräftades, men kontovyn kunde inte uppdateras/);
 assert.match(h.el('status').textContent,/Kontrollera kontostatus innan du försöker igen/);
 assert.ok(h.buttons.slice(0,2).every(b=>!b.disabled),'Action controls unlock after failed follow-up');
 assert.equal(h.el('other-locked').disabled,true,'Unrelated already-disabled control remains disabled');
 assert.equal(h.saves,1,'Do not retry a confirmed write automatically');
});

test('FUN-01: an actual failed write is never presented as a confirmed action',async()=>{
 const h=harness();await settle();
 h.failSave();
 h.submitName('Namn som inte sparades');
 await settle();
 assert.equal(h.saves,1);
 assert.equal(h.name,'Gammalt namn');
 assert.match(h.el('status').textContent,/Sparandet misslyckades/);
 assert.doesNotMatch(h.el('status').textContent,/Åtgärden bekräftades/);
});

test('FUN-01: missing post-write profile response is bounded and late reply cannot overwrite the account view',async()=>{
 const h=harness();await settle();
 h.hangRead();
 h.submitName('Mitt sparade namn');
 await pause(100);
 assert.equal(h.saves,1);
 assert.equal(h.name,'Mitt sparade namn');
 assert.ok(h.buttons.slice(0,2).every(b=>!b.disabled));
 assert.equal(h.el('other-locked').disabled,true);
 assert.match(h.el('status').textContent,/Åtgärden bekräftades/);
 const before=h.el('display-name').value;
 h.finishOldRead();
 await settle();
 assert.equal(h.el('display-name').value,before,'Late timed-out read must not replace the current draft');
 assert.equal(h.saves,1,'Timeout must not cause automatic second write');
 h.restoreRead();
 h.refresh();
 await settle();
 assert.match(h.el('refresh-account-status').textContent,/Kontot har uppdaterats/);
 assert.equal(h.el('display-name').value,'Mitt sparade namn');
});

test('FUN-01: an explicit refresh failure retains its real read error, not a fake successful write',async()=>{
 const h=harness();await settle();
 h.failRead();
 h.refresh();
 await settle();
 assert.match(h.el('refresh-account-status').textContent,/Profilen kunde inte läsas/);
 assert.doesNotMatch(h.el('refresh-account-status').textContent,/Åtgärden bekräftades/);
 assert.equal(h.saves,0);
});
