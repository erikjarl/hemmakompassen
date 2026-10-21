import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const config = window.HEMMAKOMPASSEN_BACKEND;
const client = createClient(config.supabaseUrl, config.supabasePublishableKey, {auth:{flowType:'pkce',detectSessionInUrl:true}});
const $ = id => document.getElementById(id);
const status = message => { $('status').textContent=message; };
const show = (id,yes) => $(id).classList.toggle('hidden',!yes);
async function refresh() {
  const {data:{user},error}=await client.auth.getUser();
  if(error && error.name!=='AuthSessionMissingError') status(error.message);
  show('logged-in',!!user);show('logged-out',!user);
  if(!user)return;
  $('account').textContent='Inloggad: '+user.email;
  const {data:profile}=await client.from('profiles').select('display_name').eq('user_id',user.id).maybeSingle();
  $('display-name').value=profile?.display_name||'';
  const {data:members,error:membersError}=await client.rpc('my_family_members');
  if(membersError){status(membersError.message);return;}
  show('unpaired',!members?.length);show('paired',!!members?.length);
  $('members').textContent=members?.map(m=>m.role==='teen'?'Tonåring: '+(m.display_name||'Namnlös'):'Förälder: '+(m.display_name||'Namnlös')).join(' · ')||'';
  show('make-invite',members?.length===1);
}
async function run(action){try{status('Arbetar…');await action();await refresh();}catch(e){status(e.message||'Ett fel inträffade');}}
$('email-form').addEventListener('submit',e=>{e.preventDefault();run(async()=>{const email=$('email').value.trim();const {error}=await client.auth.signInWithOtp({email,options:{emailRedirectTo:new URL('konto.html',location.href).href}});if(error)throw error;status('Inloggningslänk skickad. Kontrollera din e-post.');});});
$('name-form').addEventListener('submit',e=>{e.preventDefault();run(async()=>{const {data:{user}}=await client.auth.getUser();if(!user)throw Error('Inte inloggad');const {error}=await client.from('profiles').upsert({user_id:user.id,display_name:$('display-name').value.trim()});if(error)throw error;status('Namnet sparat.');});});
$('create-family').addEventListener('click',()=>run(async()=>{const {error}=await client.rpc('start_family',{p_role:$('role').value});if(error)throw error;status('Familjen skapad. Skapa en kod för att bjuda in den andra personen.');}));
$('make-invite').addEventListener('click',()=>run(async()=>{const bytes=crypto.getRandomValues(new Uint8Array(18));const code=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();const {data,error}=await client.rpc('create_family_invite',{p_code:code});if(error)throw error;$('new-invite').textContent='Dela koden privat: '+code+' (gäller till '+new Date(data).toLocaleString('sv-SE')+')';status('Ny familjekod skapad.');}));
$('accept-form').addEventListener('submit',e=>{e.preventDefault();run(async()=>{const {error}=await client.rpc('accept_family_invite',{p_code:$('invite-code').value.trim().toUpperCase()});if(error)throw error;status('Du är nu ansluten till familjen.');});});
$('logout').addEventListener('click',()=>run(async()=>{const {error}=await client.auth.signOut();if(error)throw error;status('Utloggad.');}));
client.auth.onAuthStateChange(()=>{setTimeout(()=>refresh().catch(e=>status(e.message)),0);});
refresh().catch(e=>status(e.message));
