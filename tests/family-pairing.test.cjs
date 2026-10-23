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
