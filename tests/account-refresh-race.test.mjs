import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const code = readFileSync(new URL('../konto.js',import.meta.url),'utf8')
  .replace(/^import .*\n/,'');
const tick = () => new Promise(resolve => setImmediate(resolve));
const delay = ms => new Promise(resolve => setTimeout(resolve,ms));
const deferred = () => {
  let resolve;
  const promise = new Promise(res => {resolve=res;});
  return {promise,resolve};
};

function accountHarness({holdUser=false,holdProfile=false,holdMembers=false}={}) {
  const nodes=new Map();
  const node=id=>{
    if(!nodes.has(id)){
      const element={
        value:'',textContent:'',hidden:false,open:false,
        classList:{toggle(_name,hide){element.hidden=hide;}},
        addEventListener(type,fn){element[type]=fn;},
        reset(){},focus(){}
      };
      nodes.set(id,element);
    }
    return nodes.get(id);
  };
  const gates={user:deferred(),profile:deferred(),members:deferred()};
  let current={id:'parent-a',email:'parent-a@example.test'};
  let authEvent;
  let userReads=0,profileReads=0,memberReads=0;
  const auth={
    async getUser(){
      const snapshot=current;
      if(holdUser && ++userReads===1) return gates.user.promise;
      return {data:{user:snapshot},error:null};
    },
    async signOut(){current=null;return {error:null};},
    onAuthStateChange(fn){authEvent=fn;}
  };
  const client={
    auth,
    from(name){
      assert.equal(name,'profiles');
      return {select(){
        return {eq(_name,id){
          return {maybeSingle(){
            profileReads++;
            if(holdProfile && id==='parent-a') return gates.profile.promise;
            return Promise.resolve({data:{display_name:id==='parent-a'?'Förälder A':'Tonåring B'}});
          }};
        }};
      }};
    },
    async rpc(name){
      assert.equal(name,'my_family_members');
      const id=current?.id;
      memberReads++;
      if(holdMembers && id==='parent-a') return gates.members.promise;
      return {data:id?[{role:id==='parent-a'?'parent':'teen',display_name:id==='parent-a'?'Förälder A':'Tonåring B'}]:[],error:null};
    }
  };
  vm.runInNewContext(code,{
    createClient:()=>client,document:{getElementById:node,querySelectorAll:()=>[]},
    window:{HEMMAKOMPASSEN_BACKEND:{}},
    location:{href:'https://example.test/konto.html',hash:'',pathname:'/konto.html',search:'',assign(){}},
    URL,setTimeout
  },{filename:'konto.js'});
  return {
    node,gates,
    setUser(value){current=value;},
    sendAuth(event){authEvent(event);},
    get reads(){return {user:userReads,profile:profileReads,members:memberReads};}
  };
}

test('FUN-01: a delayed profile response cannot write an old name after logout',async()=>{
  const h=accountHarness({holdProfile:true});
  await tick();
  assert.equal(h.reads.profile,1,'Initial account refresh reached the profile read');
  h.node('logout').click();
  await tick();
  await tick();
  assert.equal(h.node('logged-in').hidden,true);
  h.gates.profile.resolve({data:{display_name:'Förälder A'}});
  await tick();
  assert.equal(h.reads.members,0,'The old refresh must not continue to read family members');
  assert.equal(h.node('display-name').value,'');
  assert.equal(h.node('account').textContent,'');
  assert.equal(h.node('members').textContent,'');
});

test('FUN-01: a delayed family response cannot overwrite a newer signed-in account',async()=>{
  const h=accountHarness({holdMembers:true});
  await tick();
  assert.equal(h.reads.members,1,'First account refresh reached the family read');
  h.setUser({id:'teen-b',email:'teen-b@example.test'});
  h.sendAuth('SIGNED_IN');
  await delay(15);
  assert.equal(h.node('account').textContent,'Inloggad: teen-b@example.test');
  assert.equal(h.node('display-name').value,'Tonåring B');
  assert.equal(h.node('members').textContent,'Tonåring: Tonåring B');
  h.gates.members.resolve({data:[{role:'parent',display_name:'Förälder A'}],error:null});
  await tick();
  assert.equal(h.node('members').textContent,'Tonåring: Tonåring B','Old family data must not replace B');
  assert.equal(h.node('waiting').hidden,false,'The new account still has one family member');
});

test('FUN-01: an old getUser response cannot restore a signed-out account view',async()=>{
  const h=accountHarness({holdUser:true});
  await tick();
  h.node('logout').click();
  await tick();
  await tick();
  assert.equal(h.node('logged-in').hidden,true);
  h.gates.user.resolve({data:{user:{id:'parent-a',email:'parent-a@example.test'}},error:null});
  await tick();
  assert.equal(h.node('logged-in').hidden,true);
  assert.equal(h.node('account').textContent,'');
  assert.equal(h.reads.profile,0,'Stale authentication must not trigger profile access');
});
