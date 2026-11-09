import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../konto.js',import.meta.url),'utf8').replace(/^import .*?\n/,'');
const never=new Promise(()=>{});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));

function makePage({signedIn=false,members=null}={}){
 const els=new Map(),buttons=[];
 function el(id){
   if(!els.has(id)){
     const node={
       id,value:'',textContent:'',disabled:false,href:'',src:'',
       classList:{toggle(name,enabled){node.hidden=enabled;}},
       addEventListener(type,listener){node[type]=listener;},
       removeAttribute(name){delete node[name];},
       reset(){},focus(){}
     };
     els.set(id,node);
   }
   return els.get(id);
 }
 for(const id of ['login-button','refresh-button','invite-button'])
   buttons.push(el(id));
 let user=signedIn?{id:'synthetic-parent',email:'parent@example.com'}:null;
 let stallLogin=false,stallFamily=false,stallInvite=false;
 let loginCalls=0,inviteCalls=0,memberCalls=0,destination=null;
 const auth={
   async getUser(){return {data:{user},error:null};},
   signInWithPassword(){
     loginCalls++;
     return stallLogin?never:Promise.resolve({error:null});
   },
   onAuthStateChange(){},
   signUp:async()=>({data:{session:null},error:null}),
   resetPasswordForEmail:async()=>({error:null}),
   updateUser:async()=>({error:null}),
   signOut:async()=>({error:null})
 };
 const client={
   auth,
   from(table){
     assert.equal(table,'profiles');
     const q={
       select(){return q;},
       eq(){return q;},
       maybeSingle:async()=>({data:{display_name:'Synthetic parent'},error:null}),
       upsert:async()=>({error:null})
     };
     return q;
   },
   rpc(name){
     if(name==='my_family_members'){
       memberCalls++;
       return stallFamily?never:Promise.resolve({data:members??[],error:null});
     }
     if(name==='create_family_invite'){
       inviteCalls++;
       return stallInvite?never:Promise.resolve({data:'2026-11-12T12:00:00Z',error:null});
     }
     return Promise.resolve({data:null,error:null});
   }
 };
 const context={
   createClient:()=>client,
   window:{HEMMAKOMPASSEN_BACKEND:{accountRequestTimeoutMs:25}},
   document:{getElementById:el,querySelectorAll:()=>buttons},
   location:{hash:'',href:'https://example.com/konto.html',
     pathname:'/konto.html',search:'',assign(value){destination=value;}},
   URL,crypto:{getRandomValues(bytes){bytes.fill(1);return bytes;}},
   setTimeout,clearTimeout,console
 };
 vm.runInNewContext(source,context);
 return {
   el,buttons,
   setLoginStall(v){stallLogin=v;},
   setFamilyStall(v){stallFamily=v;},
   setInviteStall(v){stallInvite=v;},
   setUser(v){user=v;},
   get loginCalls(){return loginCalls;},
   get inviteCalls(){return inviteCalls;},
   get memberCalls(){return memberCalls;},
   get destination(){return destination;}
 };
}
const submit=node=>{node.submit({preventDefault(){}});};

test('FUN-01: no login response must release disabled form buttons and permit a deliberate retry',async()=>{
 const p=makePage();
 await pause(15);
 p.el('email').value='parent@example.com';
 p.el('password').value='a-test-password';
 p.setLoginStall(true);
 submit(p.el('email-form'));
 assert.ok(p.buttons.every(button=>button.disabled));
 await pause(120);
 assert.ok(p.buttons.every(button=>!button.disabled),'No perpetual locked buttons');
 assert.match(p.el('status').textContent,/tog för lång tid|svarade inte i tid/i);
 assert.equal(p.loginCalls,1,'No automatic duplicate login');
 p.setLoginStall(false);
 submit(p.el('email-form'));
 await pause(90);
 assert.equal(p.loginCalls,2);
 assert.equal(p.destination,'./index.html');
});
test('FUN-01: family list timeout has explicit retry and does not show stale family',async()=>{
 const p=makePage({signedIn:true,members:[{role:'parent',display_name:'Parent'}]});
 p.setFamilyStall(true);
 p.el('refresh-account').click();
 assert.ok(p.buttons.every(button=>button.disabled));
 await pause(120);
 assert.ok(p.buttons.every(button=>!button.disabled));
 assert.match(p.el('status').textContent,/tog för lång tid|svarade inte i tid/i);
 p.setFamilyStall(false);
 p.el('refresh-account').click();
 await pause(100);
 assert.match(p.el('status').textContent,/Kontot har uppdaterats/);
 assert.match(p.el('members').textContent,/Förälder: Parent/);
 assert.equal(p.el('waiting').hidden,false);
});
test('FUN-01: unanswered invite creation shows failure, unlocks and never creates second invite automatically',async()=>{
 const p=makePage({signedIn:true,members:[{role:'parent',display_name:'Parent'}]});
 await pause(35);
 p.setInviteStall(true);
 p.el('make-invite').click();
 assert.ok(p.buttons.every(button=>button.disabled));
 await pause(120);
 assert.ok(p.buttons.every(button=>!button.disabled));
 assert.match(p.el('status').textContent,/tog för lång tid|svarade inte i tid/i);
 assert.equal(p.inviteCalls,1);
 assert.equal(p.el('new-invite').textContent,'');
});
