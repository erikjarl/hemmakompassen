import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('../konto.js',import.meta.url),'utf8').replace(/^import .*\n/,'');
const elements=new Map();
const el=id=>{if(!elements.has(id))elements.set(id,{value:'',textContent:'',classList:{toggle(){}},addEventListener(type,fn){this[type]=fn;},reset(){},focus(){}});return elements.get(id);};
let user=null,calls=[],destination;
const auth={
 getUser:async()=>({data:{user}}),
 signInWithPassword:async value=>{calls.push(['login',value]);return {error:null};},
 signUp:async value=>{calls.push(['signup',value]);return {data:{session:null},error:null};},
 resetPasswordForEmail:async(...value)=>{calls.push(['reset',...value]);return {error:null};},
 updateUser:async value=>{calls.push(['update',value]);return {error:null};},
 onAuthStateChange(){},signOut:async()=>({error:null})
};
const client={auth,from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:null})})})}),rpc:async()=>({data:[]})};
vm.runInNewContext(source,{createClient:()=>client,window:{HEMMAKOMPASSEN_BACKEND:{}},document:{getElementById:el,querySelectorAll:()=>[]},location:{href:'https://example.com/konto.html',hash:'',assign:v=>destination=v},URL,setTimeout});
const tick=()=>new Promise(r=>setImmediate(r));
async function submit(id){el(id).submit({preventDefault(){}});await tick();await tick();}
await tick();
el('email').value=' existing@example.com ';el('password').value='existing password';
await submit('email-form');assert.equal(calls[0][0],'login');assert.equal(calls[0][1].email,'existing@example.com');assert.equal(destination,'./index.html');assert.equal(calls.length,1);
el('signup-password').value='long password 123';el('signup-confirm').value='different';
await submit('signup-form');assert.equal(calls.length,1);assert.match(el('status').textContent,/stämmer inte/);
el('signup-confirm').value='long password 123';el('signup-email').value='new@example.com';
await submit('signup-form');assert.equal(calls.at(-1)[0],'signup');assert.match(el('status').textContent,/bekräfta/);
el('reset-email').value='existing@example.com';await submit('reset-form');
assert.equal(calls.at(-1)[0],'reset');assert.equal(calls.at(-1)[2].redirectTo,'https://example.com/konto.html');
el('new-password').value='another password';el('confirm-password').value='another password';
let before=calls.length;await submit('password-form');assert.equal(calls.length,before);assert.match(el('status').textContent,/Logga in/);
user={id:'existing-user',email:'existing@example.com'};await submit('password-form');
assert.deepEqual(JSON.parse(JSON.stringify(calls.at(-1))),['update',{password:'another password'}]);
assert.equal(calls.filter(c=>c[0]==='signup').length,1);
console.log('PASS: password login, registration, mismatch validation, reset, session guard, existing-account password update');
