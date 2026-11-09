import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../konto.js',import.meta.url),'utf8').replace(/^import .*\n/,'');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function setup(){
 const elements=new Map();
 function element(id){
  if(!elements.has(id)){
   const node={id,value:'',textContent:'',disabled:false,open:false,hidden:false,
    classList:{toggle(_name,hide){node.hidden=hide;}},
    addEventListener(type,fn){node[type]=fn;},
    removeAttribute(name){delete node[name];},
    reset(){},focus(){}};
   elements.set(id,node);
  }
  return elements.get(id);
 }
 let result={data:[{role:'parent',display_name:'Testförälder'}],error:null};
 let profileError=null,userError=null;
 let stalls=false,stallsAuth=false,readCount=0;
 const client={
  auth:{getUser:async()=>stallsAuth?new Promise(()=>{}):({data:{user:{id:'parent-a',email:'parent@example.invalid'}},error:userError}),
   onAuthStateChange(){}},
  from(name){
   assert.equal(name,'profiles');
   return {select(){return {eq(){return {maybeSingle:async()=>({
     data:profileError?null:{display_name:'Testförälder'},error:profileError
   })}}}}};
  },
  async rpc(name){
   assert.equal(name,'my_family_members');
   readCount++;
   if(stalls)return new Promise(()=>{});
   return result;
  }
 };
 vm.runInNewContext(source,{
  createClient:()=>client,
  window:{HEMMAKOMPASSEN_BACKEND:{accountRequestTimeoutMs:30}},
  document:{getElementById:element,querySelectorAll:()=>[]},
  location:{href:'https://example.invalid/konto.html',pathname:'/konto.html',search:'',hash:'',assign(){}},
  URL,setTimeout,clearTimeout
 },{filename:'konto.js'});
 return {element,
  setFamily(value){result=value;stalls=false;},
  stallFamily(){stalls=true;},
  setProfileError(value){profileError=value;},
  setUserError(value){userError=value;},
  stallAuth(){stallsAuth=true;},
  resumeAuth(){stallsAuth=false;},
  refresh(){element('refresh-account').click();},
  get familyReads(){return readCount;}
 };
}

async function initialVerified(){
 const h=setup();
 await tick();await tick();
 assert.equal(h.element('family').hidden,false);
 assert.equal(h.element('waiting').hidden,false);
 assert.match(h.element('members').textContent,/Testförälder/);
 return h;
}

test('FUN-01: family RPC error removes stale controls and never reports successful refresh',async()=>{
 const h=await initialVerified();
 h.setFamily({data:null,error:{message:'Familjetjänsten svarade med fel'}});
 h.refresh();
 await tick();await tick();
 assert.equal(h.element('family').hidden,true);
 assert.equal(h.element('waiting').hidden,true);
 assert.equal(h.element('unpaired').hidden,true);
 assert.equal(h.element('join-family').hidden,true);
 assert.equal(h.element('members').textContent,'');
 assert.match(h.element('refresh-account-status').textContent,/Familjetjänsten svarade med fel/);
 assert.doesNotMatch(h.element('refresh-account-status').textContent,/Kontot har uppdaterats/);
});

test('FUN-01: a family read timeout cannot leave the last verified pairing onscreen',async()=>{
 const h=await initialVerified();
 h.stallFamily();
 h.refresh();
 await delay(100);
 assert.equal(h.element('family').hidden,true);
 assert.equal(h.element('waiting').hidden,true);
 assert.equal(h.element('join-family').hidden,true);
 assert.equal(h.element('members').textContent,'');
 assert.match(h.element('refresh-account-status').textContent,/svarade inte i tid/i);
});

test('FUN-01: missing or malformed member payload never becomes false "unpaired" state',async()=>{
 const h=await initialVerified();
 for(const invalid of [null,{},[{role:'unknown'}],
  [{role:'parent'},{role:'parent'}],Array(3).fill({role:'teen'})]){
  h.setFamily({data:invalid,error:null});
  h.refresh();
  await tick();await tick();
  assert.equal(h.element('unpaired').hidden,true,'Malformed payload must not enable Create family');
  assert.equal(h.element('waiting').hidden,true);
  assert.equal(h.element('join-family').hidden,true);
  assert.equal(h.element('family').hidden,true);
  assert.match(h.element('refresh-account-status').textContent,/kunde inte bekräftas/);
 }
 // A genuinely successful empty array is the only verified unpaired state.
 h.setFamily({data:[],error:null});
 h.refresh();await tick();await tick();
 assert.equal(h.element('unpaired').hidden,false);
 assert.equal(h.element('join-family').hidden,false);
 assert.equal(h.element('family').hidden,true);
 assert.equal(h.element('refresh-account-status').textContent,'Kontot har uppdaterats.');
});

test('FUN-01: successful family retry restores the correct controls',async()=>{
 const h=await initialVerified();
 h.setFamily({data:null,error:{message:'Simulerat fel'}});
 h.refresh();await tick();await tick();
 assert.equal(h.element('family').hidden,true);
 h.setFamily({data:[{role:'teen',display_name:'Testtonåring'}],error:null});
 h.refresh();await tick();await tick();
 assert.equal(h.element('waiting').hidden,false);
 assert.equal(h.element('family').hidden,false);
 assert.match(h.element('members').textContent,/Tonåring: Testtonåring/);
 assert.equal(h.element('refresh-account-status').textContent,'Kontot har uppdaterats.');
});

test('FUN-01: profile or Auth lookup errors cannot falsely confirm an account refresh',async()=>{
 const h=await initialVerified();
 h.setProfileError({message:'Profilfel'});
 h.refresh();await tick();await tick();
 assert.equal(h.element('family').hidden,true);
 assert.match(h.element('refresh-account-status').textContent,/Profilfel/);
 assert.doesNotMatch(h.element('refresh-account-status').textContent,/Kontot har uppdaterats/);
 h.setProfileError(null);
 h.setUserError({name:'NetworkError',message:'Auth ej tillgänglig'});
 h.refresh();await tick();await tick();
 assert.equal(h.element('family').hidden,true);
 assert.match(h.element('refresh-account-status').textContent,/Auth ej tillgänglig/);
});


test('FUN-01: failed Auth refresh hides an old signed-in account and preserves its name draft for retry',async()=>{
 const h=await initialVerified();
 assert.match(h.element('account').textContent,/parent@example.invalid/);
 h.element('display-name').value='Mitt osparade namn';
 h.element('display-name').input();
 h.setUserError({name:'AuthApiError',message:'Auth kunde inte kontrolleras'});
 h.refresh();await tick();await tick();
 assert.equal(h.element('logged-in').hidden,true,'Previous signed-in controls must not remain visible');
 assert.equal(h.element('logged-out').hidden,true,'Unknown identity is not a confirmed logout');
 assert.equal(h.element('account').textContent,'');
 assert.equal(h.element('display-name').value,'Mitt osparade namn','Do not erase a hidden unsaved draft');
 assert.equal(h.element('family').hidden,true);
 assert.equal(h.element('refresh-account').disabled,false,'Independent retry must remain available');
 assert.match(h.element('refresh-account-status').textContent,/Auth kunde inte kontrolleras/);
 h.setUserError(null);
 h.refresh();await tick();await tick();
 assert.equal(h.element('logged-in').hidden,false);
 assert.equal(h.element('logged-out').hidden,true);
 assert.equal(h.element('family').hidden,false);
 assert.match(h.element('account').textContent,/parent@example.invalid/);
 assert.equal(h.element('display-name').value,'Mitt osparade namn');
 assert.equal(h.element('refresh-account-status').textContent,'Kontot har uppdaterats.');
});

test('FUN-01: Auth timeout hides stale account details until successful manual retry',async()=>{
 const h=await initialVerified();
 h.stallAuth();
 h.refresh();await delay(100);
 assert.equal(h.element('logged-in').hidden,true);
 assert.equal(h.element('logged-out').hidden,true);
 assert.equal(h.element('account').textContent,'');
 assert.equal(h.element('waiting').hidden,true);
 assert.match(h.element('refresh-account-status').textContent,/svarade inte i tid/);
 h.resumeAuth();
 h.refresh();await tick();await tick();
 assert.equal(h.element('logged-in').hidden,false);
 assert.equal(h.element('waiting').hidden,false);
 assert.equal(h.element('refresh-account-status').textContent,'Kontot har uppdaterats.');
});


test('VIS-00-12: manual account refresh reports errors and success only beside refresh button',async()=>{
 const h=await initialVerified();
 h.element('status').textContent='Tidigare status för ett annat formulär';
 h.setFamily({data:null,error:{message:'Familjeläsning misslyckades'}});
 h.refresh();await tick();await tick();
 assert.match(h.element('refresh-account-status').textContent,/Familjeläsning misslyckades/);
 assert.equal(h.element('status').textContent,'','Old form status must not duplicate refresh feedback');
 h.setFamily({data:[{role:'parent',display_name:'Testförälder'}],error:null});
 h.refresh();await tick();await tick();
 assert.equal(h.element('refresh-account-status').textContent,'Kontot har uppdaterats.');
 assert.equal(h.element('status').textContent,'');
 // Other forms still have their own status target and clear obsolete refresh feedback.
 h.element('refresh-account-status').textContent='Gammalt uppdateringsmeddelande';
 h.element('name-form').submit({preventDefault(){}});
 await tick();await tick();
 assert.equal(h.element('refresh-account-status').textContent,'');
});
