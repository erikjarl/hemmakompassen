import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../konto.js',import.meta.url),'utf8').replace(/^import .*\n/,'');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const settle=async()=>{await tick();await tick();};
function setup(){
 const els=new Map();
 const el=id=>{
  if(!els.has(id)){
   const node={id,value:'',textContent:'',disabled:false,hidden:false,
    classList:{toggle(_name,hidden){node.hidden=hidden;}},
    addEventListener(type,listener){node[type]=listener;},
    removeAttribute(){},reset(){},focus(){}};
   els.set(id,node);
  }
  return els.get(id);
 };
 let account={id:'parent-a',email:'parent-a@example.invalid'};
 const names={'parent-a':'Sparat namn A','teen-b':'Namn B'};
 let authEvent;
 let saveError=null,pendingSave=false,finishSave=null;
 const saved=[];
 const client={
  auth:{
   getUser:async()=>({data:{user:account},error:null}),
   onAuthStateChange(fn){authEvent=fn;}
  },
  from(table){
   assert.equal(table,'profiles');
   return {
    select(){return {eq(_key,id){return {maybeSingle:async()=>({
      data:{display_name:names[id]},error:null
    })}}};},
    upsert(row){
     saved.push({...row});
     if(pendingSave)return new Promise(resolve=>{finishSave=()=>{if(!saveError)names[row.user_id]=row.display_name;resolve({error:saveError});};});
     if(!saveError)names[row.user_id]=row.display_name;
     return Promise.resolve({error:saveError});
    }
   };
  },
  rpc(name){assert.equal(name,'my_family_members');return Promise.resolve({data:[],error:null});}
 };
 vm.runInNewContext(source,{
  createClient:()=>client,
  window:{HEMMAKOMPASSEN_BACKEND:{}},
  document:{getElementById:el,querySelectorAll:()=>[]},
  location:{href:'https://example.invalid/konto.html',hash:'',pathname:'/konto.html',search:'',assign(){}},
  URL,setTimeout,clearTimeout
 },{filename:'konto.js'});
 return {el,names,saved,
  setAccount(v){account=v;},
  setSaveError(v){saveError=v;},
  stallNextSave(){pendingSave=true;},
  finishSave(){assert.equal(typeof finishSave,'function');pendingSave=false;finishSave();finishSave=null;},
  edit(value){el('display-name').value=value;el('display-name').input();},
  refresh(){el('refresh-account').click();},
  authRefresh(){authEvent('TOKEN_REFRESHED');},
  submit(){el('name-form').submit({preventDefault(){}});}
 };
}

test('FUN-01: background auth refresh preserves an unsaved name draft even after blur',async()=>{
 const h=setup();await settle();
 assert.equal(h.el('display-name').value,'Sparat namn A');
 h.edit('Mitt ännu osparade visningsnamn');
 h.authRefresh();
 await pause(15);
 assert.equal(h.el('display-name').value,'Mitt ännu osparade visningsnamn');
 h.names['parent-a']='Uppdaterat på annan flik';
 h.refresh();await settle();
 assert.equal(h.el('display-name').value,'Mitt ännu osparade visningsnamn',
  'A manual account refresh also must not delete unsent text');
});

test('FUN-01: after a confirmed name save, later refresh can show verified external changes',async()=>{
 const h=setup();await settle();
 h.edit('Nytt sparat namn');
 h.submit();await settle();
 assert.deepEqual(h.saved.map(x=>x.display_name),['Nytt sparat namn']);
 assert.equal(h.names['parent-a'],'Nytt sparat namn');
 assert.equal(h.el('display-name').value,'Nytt sparat namn');
 h.names['parent-a']='Namnet uppdaterat i andra fliken';
 h.refresh();await settle();
 assert.equal(h.el('display-name').value,'Namnet uppdaterat i andra fliken');
});

test('FUN-01: failed write preserves draft and does not claim it was saved',async()=>{
 const h=setup();await settle();
 h.edit('Namn som ännu inte sparats');
 h.setSaveError({message:'Simulerat sparfel'});
 h.submit();await settle();
 assert.match(h.el('status').textContent,/Simulerat sparfel/);
 assert.equal(h.names['parent-a'],'Sparat namn A');
 h.refresh();await settle();
 assert.equal(h.el('display-name').value,'Namn som ännu inte sparats');
 h.setSaveError(null);
 h.submit();await settle();
 assert.equal(h.names['parent-a'],'Namn som ännu inte sparats');
});

test('FUN-01: edits made during a delayed save remain after old write succeeds',async()=>{
 const h=setup();await settle();
 h.edit('Första versionen');
 h.stallNextSave();
 h.submit();
 await settle();
 assert.equal(h.saved.length,1);
 assert.equal(h.saved[0].display_name,'Första versionen');
 h.edit('Andra versionen efter klick');
 h.finishSave();
 await settle();
 assert.equal(h.names['parent-a'],'Första versionen');
 assert.equal(h.el('display-name').value,'Andra versionen efter klick');
 h.refresh();await settle();
 assert.equal(h.el('display-name').value,'Andra versionen efter klick',
  'The already-written first version must not replace a newer unsubmitted draft');
});

test('FUN-01: a draft for account A must never be shown after switching to B',async()=>{
 const h=setup();await settle();
 h.edit('HEMLIGT A-UTKAST');
 h.setAccount({id:'teen-b',email:'teen-b@example.invalid'});
 h.authRefresh();await pause(15);
 assert.equal(h.el('display-name').value,'Namn B');
 assert.equal(h.el('account').textContent,'Inloggad: teen-b@example.invalid');
 assert.doesNotMatch(h.el('display-name').value,/HEMLIGT/);
});
