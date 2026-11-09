import test from 'node:test';
import assert from 'node:assert/strict';
import {IPIP50_V1} from '../personality/ipip50-v1.js';
import {createPersonalityExperience} from '../personality/ipip50-ui.js';

const never=new Promise(()=>{});
const completeRows=IPIP50_V1.items.map(item=>({question_id:item.id,answer:{value:3}}));
const button=action=>({closest:selector=>
  selector==='[data-pf-action]'?{dataset:{pfAction:action}}:null});
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

function fixture(role){
 const userId='synthetic-'+role;
 let shared=true,stallWrite=false,stallRead=false,writes=0,reads=0;
 const db={
  auth:{async getUser(){return {data:{user:{id:userId}},error:null};}},
  from(table){
   if(table==='personality_answers')return {select(){
    const query={
     eq(){return this;},
     then(resolve,reject){
      return Promise.resolve({data:completeRows,error:null}).then(resolve,reject);
     }
    };
    return query;
   }};
   assert.equal(table,'personality_share_preferences');
   return {select(){
    const query={
     eq(){return this;},
     maybeSingle(){
      reads++;
      return stallRead?never:Promise.resolve({
       data:shared?{share_enabled:true}:null,error:null
      });
     }
    };
    return query;
   }};
  },
  rpc(name,args){
   if(name==='my_ipip50_shared_profiles')return Promise.resolve({data:null,error:null});
   assert.equal(name,'set_my_ipip50_share');
   writes++;
   if(stallWrite)return never;
   shared=args.p_share;
   return Promise.resolve({data:shared,error:null});
  }
 };
 return {db,userId,
  setWriteStall:value=>{stallWrite=value;},
  setReadStall:value=>{stallRead=value;},
  get writes(){return writes;},get reads(){return reads;}
 };
}
async function setup(role){
 const f=fixture(role);
 const ui=createPersonalityExperience({
  db:f.db,onRender:()=>{},isSharingEnabled:true,requestTimeoutMs:25
 });
 ui.reset(f.userId);
 await ui.load(f.userId);
 assert.match(ui.render({isPaired:true,viewerRole:role}),/Sluta dela min profil/);
 return {f,ui,role};
}
const bounded=async(p,label)=>assert.equal(
 await Promise.race([p.then(()=>true),wait(450).then(()=>false)]),true,label
);

test('FUN-04: stalled profile withdrawal releases controls and does not claim revoked consent',async()=>{
 for(const role of ['parent','teen']){
  const {f,ui}=await setup(role);
  f.setWriteStall(true);
  await bounded(ui.handleClick(button('withdraw'),{isPaired:true}),role+' profile write');
  let html=ui.render({isPaired:true,viewerRole:role});
  assert.match(html,/Din inställning:<\/strong> Delning aktiverad/);
  assert.match(html,/Sluta dela min profil/);
  assert.doesNotMatch(html,/Sparar…|Delningen är återkallad och bekräftad/);
  assert.match(html,/Återkallelsen är inte bekräftad/);
  assert.equal(f.writes,1,'No repeated write without a new user action');
  f.setWriteStall(false);
  assert.equal(await ui.handleClick(button('withdraw'),{isPaired:true}),true);
  html=ui.render({isPaired:true,viewerRole:role});
  assert.match(html,/Din inställning:<\/strong> Privat/);
  assert.match(html,/Delningen är återkallad och bekräftad/);
 }
});

test('FUN-04: missing readback after a completed consent write must mark status unknown',async()=>{
 for(const role of ['parent','teen']){
  const {f,ui}=await setup(role);
  f.setReadStall(true);
  await bounded(ui.handleClick(button('withdraw'),{isPaired:true}),role+' profile verification');
  let html=ui.render({isPaired:true,viewerRole:role});
  assert.match(html,/Delningens aktuella status är okänd/);
  assert.match(html,/data-pf-action="verify-share"/);
  assert.doesNotMatch(html,/Sparar…|Delningen är återkallad och bekräftad/);
  assert.equal(f.writes,1,'Unknown status must not trigger a duplicate write');
  f.setReadStall(false);
  assert.equal(await ui.handleClick(button('verify-share'),{isPaired:true}),true);
  html=ui.render({isPaired:true,viewerRole:role});
  assert.match(html,/Din inställning:<\/strong> Privat/);
  assert.match(html,/Delningsstatus kontrollerad mot servern/);
  assert.equal(f.writes,1,'Manual verification never repeats the original write');
 }
});

test('FUN-04: stalled periodic consent refresh fails closed and can be retried',async()=>{
 for(const role of ['parent','teen']){
  const {f,ui}=await setup(role);
  f.setReadStall(true);
  await bounded(ui.refreshShared(),role+' periodic consent refresh');
  let html=ui.render({isPaired:true,viewerRole:role});
  assert.match(html,/Delningens aktuella status är okänd/);
  assert.match(html,/data-pf-action="verify-share"/);
  assert.doesNotMatch(html,/Våra profiler/);
  f.setReadStall(false);
  await ui.handleClick(button('verify-share'),{isPaired:true});
  html=ui.render({isPaired:true,viewerRole:role});
  assert.match(html,/Din inställning:<\/strong> Delning aktiverad/);
  assert.equal(f.writes,0);
 }
});
