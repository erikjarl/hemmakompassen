const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const vm = require('node:vm');

const migration = readFileSync(
  join(__dirname, '..', 'supabase', 'migrations', '20261023074500_merge_empty_singleton_family_on_invite.sql'),
  'utf8'
);

test('pairing migration only moves an empty singleton with the complementary role', () => {
  assert.match(migration, /count\(\*\).*v_source_family[\s\S]*<> 1[\s\S]*Already paired/is);
  assert.match(migration, /v_source_role <> v_my_role[\s\S]*complementary family role/is);
  assert.match(migration, /exists \(select 1 from public\.messages where family_id = v_source_family\)/i);
  assert.match(migration, /exists \(select 1 from public\.agreements where family_id = v_source_family\)/i);
  assert.match(migration, /delete from public\.family_members[\s\S]*user_id = v_uid/is);
  assert.doesNotMatch(migration, /delete from public\.profiles/i);
  assert.match(migration, /revoke all on function public\.accept_family_invite\(text\) from public, anon/i);
  assert.match(migration, /grant execute on function public\.accept_family_invite\(text\) to authenticated/i);
});

test('a singleton account can enter a code and becomes paired after acceptance', async () => {
  const source = readFileSync(join(__dirname, '..', 'konto.js'), 'utf8').replace(/^import .*\n/, '');
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) {
      elements.set(id, {
        value: '', textContent: '', hidden: false, disabled: false,
        classList: {toggle(name, value) { if (name === 'hidden') this.owner.hidden = value; }, owner: null},
        addEventListener(type, handler) { this[type] = handler; },
        reset() { this.wasReset = true; }, focus() {}
      });
      elements.get(id).classList.owner = elements.get(id);
    }
    return elements.get(id);
  };
  let members = [{user_id:'teen-id', role:'teen', display_name:'Testtonåring'}];
  const calls = [];
  const user = {id:'teen-id', email:'teen@example.invalid'};
  const client = {
    auth: {
      async getUser(){ return {data:{user},error:null}; },
      onAuthStateChange(){},
      async signOut(){ return {error:null}; }
    },
    from(){ return {select(){ return {eq(){ return {async maybeSingle(){ return {data:{display_name:'Testtonåring'},error:null}; }}; }}; }}; },
    async rpc(name,args){
      calls.push([name,args]);
      if(name==='accept_family_invite') members=[members[0],{user_id:'parent-id',role:'parent',display_name:'Testförälder'}];
      return {data:name==='my_family_members'?members:null,error:null};
    }
  };
  vm.runInNewContext(source, {
    createClient:()=>client,
    window:{HEMMAKOMPASSEN_BACKEND:{}},
    document:{getElementById:element,querySelectorAll:()=>[]},
    location:{href:'https://example.com/konto.html',hash:'',assign(){}},
    URL,setTimeout,crypto
  });
  const tick=()=>new Promise(resolve=>setImmediate(resolve));
  await tick();await tick();
  assert.equal(element('waiting').hidden,false);
  assert.equal(element('join-family').hidden,false);
  assert.equal(element('unpaired').hidden,true);
  element('invite-code').value='abcdefabcdefabcdefabcdefabcdefabcdef';
  element('accept-form').submit({preventDefault(){}});
  await tick();await tick();
  const accept=calls.find(call=>call[0]==='accept_family_invite');
  assert.deepEqual(JSON.parse(JSON.stringify(accept)),['accept_family_invite',{p_code:'ABCDEFABCDEFABCDEFABCDEFABCDEFABCDEF'}]);
  assert.equal(element('accept-form').wasReset,true);
  assert.equal(element('waiting').hidden,true);
  assert.equal(element('join-family').hidden,true);
  assert.equal(element('family').hidden,false);
});


test('a QR invitation stays on the recipient device, pre-fills the code and needs confirmation', async () => {
  const qrSource = readFileSync(join(__dirname, '..', 'vendor', 'qrcode.js'), 'utf8');
  const qrContext = {};
  vm.runInNewContext(qrSource, qrContext);
  assert.equal(typeof qrContext.qrcode, 'function');

  const source = readFileSync(join(__dirname, '..', 'konto.js'), 'utf8').replace(/^import .*\n/, '');
  const qrCode = 'AB'.repeat(18);
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) {
      const current = {
        value:'', textContent:'', src:'', href:'', hidden:false, disabled:false,
        classList:{toggle(name, active) { if(name === 'hidden') current.hidden=active; }},
        addEventListener(name,fn) { this[name]=fn; },
        reset() { this.wasReset=true; }, focus() {}
      };
      elements.set(id,current);
    }
    return elements.get(id);
  };
  let user={id:'teen-id', email:'teen@example.invalid'};
  let members=[{user_id:'teen-id',role:'teen',display_name:'Testtonåring'}];
  const calls=[];
  const auth={
    async getUser(){return {data:{user},error:null};},
    async signInWithPassword(){user={id:'parent-id',email:'parent@example.invalid'};return {error:null};},
    onAuthStateChange(){},
    async signOut(){user=null;return {error:null};}
  };
  const client={
    auth,
    from(){return {select(){return {eq(){return {async maybeSingle(){return {data:{display_name:'Testkonto'},error:null};}};}};}};},
    async rpc(name,args){
      calls.push([name,args]);
      if(name==='my_family_members')return {data:members,error:null};
      if(name==='create_family_invite')return {data:'2026-10-24T10:00:00Z',error:null};
      if(name==='accept_family_invite')members=[members[0],{user_id:'parent-id',role:'parent',display_name:'Testförälder'}];
      return {data:null,error:null};
    }
  };
  const cryptoMock={getRandomValues(bytes){bytes.fill(0xAB);return bytes;}};
  const tick=()=>new Promise(resolve=>setImmediate(resolve));
  const location={href:'https://example.com/konto.html',hash:'',pathname:'/konto.html',search:'',assign(){}};
  vm.runInNewContext(source,{
    createClient:()=>client,window:{HEMMAKOMPASSEN_BACKEND:{}},
    document:{getElementById:element,querySelectorAll:()=>[]},
    location,URL,setTimeout,crypto:cryptoMock,qrcode:qrContext.qrcode
  });
  await tick();await tick();
  element('make-invite').click();
  await tick();await tick();
  const url=element('invite-link').href;
  assert.equal(url,'https://example.com/konto.html#invite='+qrCode);
  assert.equal(element('invite-qr').hidden,false);
  assert.match(element('new-invite').textContent,new RegExp(qrCode));
  assert.ok(element('invite-qr-image').src.startsWith('data:image/svg+xml;charset=utf-8,'));
  const svg=decodeURIComponent(element('invite-qr-image').src.split(',').slice(1).join(','));
  assert.match(svg,/<svg\b[\s\S]*<path d="/);
  assert.equal(calls.filter(([name])=>name==='accept_family_invite').length,0);

  const recipientElements=new Map();
  const recipientElement=id=>{
    if(!recipientElements.has(id)){
      const current={
        value:'',textContent:'',hidden:false,disabled:false,
        classList:{toggle(name,active){if(name==='hidden')current.hidden=active;}},
        addEventListener(name,fn){this[name]=fn;},reset(){},focus(){}
      };
      recipientElements.set(id,current);
    }
    return recipientElements.get(id);
  };
  user=null;
  members=[];
  const receiverCalls=[];
  const recipientClient={
    ...client,
    async rpc(name,args){
      receiverCalls.push([name,args]);
      if(name==='my_family_members')return {data:members,error:null};
      if(name==='accept_family_invite'){
        members=[{role:'parent',display_name:'Testförälder'},{role:'teen',display_name:'Testtonåring'}];
      }
      return {data:null,error:null};
    }
  };
  let destination;
  const recipientLocation={href:url,hash:'#invite='+qrCode,pathname:'/konto.html',search:'',assign:value=>destination=value};
  let cleaned=false;
  vm.runInNewContext(source,{
    createClient:()=>recipientClient,window:{HEMMAKOMPASSEN_BACKEND:{}},
    document:{getElementById:recipientElement,querySelectorAll:()=>[]},
    location:recipientLocation,URL,setTimeout,crypto:cryptoMock,qrcode:qrContext.qrcode,
    history:{replaceState(){cleaned=true;}}
  });
  await tick();await tick();
  assert.match(recipientElement('status').textContent,/Logga in/);
  recipientElement('email').value='parent@example.invalid';
  recipientElement('password').value='very-long-password';
  recipientElement('email-form').submit({preventDefault(){}});
  await tick();await tick();
  assert.equal(destination,undefined,'QR flow must stay on the account page after login');
  assert.equal(recipientElement('invite-code').value,qrCode);
  assert.equal(receiverCalls.some(([name])=>name==='accept_family_invite'),false,'no automatic pairing');
  recipientElement('accept-form').submit({preventDefault(){}});
  await tick();await tick();
  assert.equal(receiverCalls.filter(([name])=>name==='accept_family_invite').length,1);
  assert.equal(cleaned,true,'invitation URL fragment is cleared after acceptance');
});
