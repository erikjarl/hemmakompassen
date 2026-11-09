import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../konto.js',import.meta.url),'utf8')
  .replace(/^import .*\n/,'');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const deferred=()=>{
  let resolve;
  const promise=new Promise(res=>{resolve=res;});
  return {promise,resolve};
};
const generatedCode='AB'.repeat(18);

function harness({delayInvite=false}={}){
  const nodes=new Map(),gate=deferred();
  const el=id=>{
    if(!nodes.has(id)){
      const element={
        value:'',textContent:'',hidden:false,disabled:false,src:undefined,href:undefined,
        classList:{toggle(_name,hidden){element.hidden=hidden;}},
        addEventListener(event,fn){this[event]=fn;},
        removeAttribute(name){delete this[name];},
        reset(){},focus(){}
      };
      nodes.set(id,element);
    }
    return nodes.get(id);
  };
  let current={id:'parent-a',email:'parent-a@example.test'};
  let memberCount=1;
  let authEvent;
  let inviteCalls=0;
  const auth={
    async getUser(){return {data:{user:current},error:null};},
    onAuthStateChange(fn){authEvent=fn;},
    async signOut(){current=null;return {error:null};}
  };
  const client={
    auth,
    from(){return {select(){return {eq(){return {async maybeSingle(){return {data:{display_name:'Namn'}};}};}};}};},
    async rpc(name){
      if(name==='my_family_members'){
        return {data:current?Array.from({length:memberCount},(_,index)=>({role:index?'teen':'parent',display_name:index?'Tonåring':'Namn'})):[],error:null};
      }
      assert.equal(name,'create_family_invite');
      inviteCalls++;
      if(delayInvite) return gate.promise;
      return {data:'2026-12-01T12:00:00Z',error:null};
    }
  };
  const crypto={getRandomValues(bytes){bytes.fill(0xab);return bytes;}};
  const qrcode=()=>({
    addData(){},
    make(){},
    createSvgTag(){return '<svg xmlns="http://www.w3.org/2000/svg"></svg>';}
  });
  vm.runInNewContext(source,{
    createClient:()=>client,document:{getElementById:el,querySelectorAll:()=>[]},
    window:{HEMMAKOMPASSEN_BACKEND:{}},
    location:{href:'https://example.test/konto.html',hash:'',pathname:'/konto.html',search:'',assign(){}},
    URL,setTimeout,clearTimeout,crypto,qrcode
  },{filename:'konto.js'});
  return {
    el,gate,
    switchUser(user){current=user;authEvent('SIGNED_IN');},
    setMemberCount(value){memberCount=value;},
    async createInvite(){el('make-invite').click();await tick();await tick();},
    async logOut(){el('logout').click();await tick();await tick();},
    get inviteCalls(){return inviteCalls;}
  };
}

test('FUN-01: same-account refresh preserves freshly generated QR invitation',async()=>{
  const h=harness();
  await tick();await tick();
  await h.createInvite();
  assert.match(h.el('new-invite').textContent,new RegExp(generatedCode));
  assert.equal(h.el('invite-link').href,'https://example.test/konto.html#invite='+generatedCode);
  assert.equal(h.el('invite-qr').hidden,false);
  assert.match(h.el('invite-qr-image').src,/^data:image\/svg\+xml/);
  h.switchUser({id:'parent-a',email:'parent-a@example.test'});
  await delay(15);
  assert.match(h.el('new-invite').textContent,new RegExp(generatedCode));
  assert.equal(h.el('invite-qr').hidden,false);
  assert.equal(h.inviteCalls,1,'Refreshing must not create another invite');
});

test('FUN-01: switching account clears old generated invitation and QR',async()=>{
  const h=harness();
  await tick();await tick();
  await h.createInvite();
  h.switchUser({id:'teen-b',email:'teen-b@example.test'});
  await delay(15);
  assert.equal(h.el('account').textContent,'Inloggad: teen-b@example.test');
  assert.equal(h.el('new-invite').textContent,'');
  assert.equal(h.el('invite-qr').hidden,true);
  assert.equal(h.el('invite-link').href,undefined);
  assert.equal(h.el('invite-qr-image').src,undefined);
  assert.equal(h.inviteCalls,1,'No invitation is automatically created for the second account');
});

test('FUN-01: logout clears previous invitation while retaining no generated link',async()=>{
  const h=harness();
  await tick();await tick();
  await h.createInvite();
  await h.logOut();
  assert.equal(h.el('logged-in').hidden,true);
  assert.equal(h.el('new-invite').textContent,'');
  assert.equal(h.el('invite-qr').hidden,true);
  assert.equal(h.el('invite-link').href,undefined);
  assert.equal(h.el('invite-qr-image').src,undefined);
});

test('FUN-01: late invitation RPC result cannot appear after account switch',async()=>{
  const h=harness({delayInvite:true});
  await tick();await tick();
  await h.createInvite();
  assert.equal(h.inviteCalls,1);
  h.switchUser({id:'teen-b',email:'teen-b@example.test'});
  await delay(15);
  h.gate.resolve({data:'2026-12-01T12:00:00Z',error:null});
  await tick();await tick();
  assert.equal(h.el('new-invite').textContent,'');
  assert.equal(h.el('invite-qr').hidden,true);
  assert.equal(h.el('account').textContent,'Inloggad: teen-b@example.test');
});

test('FUN-01: pending invitation remains visible after same-account auth refresh',async()=>{
  const h=harness({delayInvite:true});
  await tick();await tick();
  await h.createInvite();
  assert.equal(h.inviteCalls,1);
  h.switchUser({id:'parent-a',email:'parent-a@example.test'});
  await delay(15);
  h.gate.resolve({data:'2026-12-01T12:00:00Z',error:null});
  await tick();await tick();
  assert.match(h.el('new-invite').textContent,new RegExp(generatedCode));
  assert.equal(h.el('invite-qr').hidden,false);
  assert.equal(h.inviteCalls,1);
});

test('FUN-01: a completed family pair removes an obsolete invitation',async()=>{
  const h=harness();
  await tick();await tick();
  await h.createInvite();
  assert.equal(h.el('invite-qr').hidden,false);
  h.setMemberCount(2);
  h.switchUser({id:'parent-a',email:'parent-a@example.test'});
  await delay(15);
  assert.match(h.el('members').textContent,/Tonåring/);
  assert.equal(h.el('waiting').hidden,true);
  assert.equal(h.el('new-invite').textContent,'');
  assert.equal(h.el('invite-qr').hidden,true);
  assert.equal(h.el('invite-qr-image').src,undefined);
  assert.equal(h.el('invite-link').href,undefined);
  h.setMemberCount(1);
  h.switchUser({id:'parent-a',email:'parent-a@example.test'});
  await delay(15);
  assert.equal(h.el('new-invite').textContent,'','Old invite must not reappear after later family changes');
});
