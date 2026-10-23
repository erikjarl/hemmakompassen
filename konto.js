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
  const memberCount=members?.length||0;
  show('unpaired',memberCount===0);show('family',memberCount>0);show('waiting',memberCount===1);show('join-family',memberCount<2);
  $('members').textContent=members?.map(m=>m.role==='teen'?'Tonåring: '+(m.display_name||'Namnlös'):'Förälder: '+(m.display_name||'Namnlös')).join(' · ')||'';
}
let busy=false;
async function run(action){if(busy)return;busy=true;const buttons=[...document.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);try{status('Arbetar…');await action();await refresh();}catch(e){status(e.message||'Ett fel inträffade');}finally{busy=false;buttons.forEach(b=>b.disabled=false);}}
$('email-form').addEventListener('submit',e=>{e.preventDefault();run(async()=>{
  const {error}=await client.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});
  if(error)throw Error('Kunde inte logga in. Kontrollera e-post och lösenord. Har du bara använt mejllänk tidigare? Välj ”Glömt lösenord eller saknar lösenord?”.');
  $('password').value=''; location.assign('./index.html');
});});
$('signup-form').addEventListener('submit',e=>{e.preventDefault();run(async()=>{
  const password=$('signup-password').value;
  if(password.length<12)throw Error('Lösenordet behöver innehålla minst 12 tecken.');
  if(password!==$('signup-confirm').value)throw Error('Lösenorden stämmer inte överens.');
  const {data,error}=await client.auth.signUp({email:$('signup-email').value.trim(),password,options:{emailRedirectTo:new URL('konto.html',location.href).href}});
  if(error)throw error;
  $('signup-form').reset();
  status(data.session?'Kontot är skapat. Du är inloggad.':'Kontrollera din e-post för att bekräfta kontot. Om du redan har ett konto, logga in eller återställ lösenordet.');
});});
$('reset-form').addEventListener('submit',e=>{e.preventDefault();run(async()=>{
  const {error}=await client.auth.resetPasswordForEmail($('reset-email').value.trim(),{redirectTo:new URL('konto.html',location.href).href});
  if(error)throw error;
  status('Om adressen har ett konto får du ett mejl för att välja lösenord. Öppna länken i samma webbläsare.');
});});
$('password-form').addEventListener('submit',e=>{e.preventDefault();run(async()=>{
  const password=$('new-password').value;
  if(password.length<12)throw Error('Lösenordet behöver innehålla minst 12 tecken.');
  if(password!==$('confirm-password').value)throw Error('Lösenorden stämmer inte överens.');
  const {data:{user},error:authError}=await client.auth.getUser();
  if(authError||!user)throw Error('Logga in eller öppna en ny återställningslänk innan du väljer lösenord.');
  const {error}=await client.auth.updateUser({password});
  if(error)throw error;
  $('password-form').reset();
  status('Lösenordet är sparat. Nästa gång loggar du in med e-post och lösenord.');
});});
$('name-form').addEventListener('submit',e=>{e.preventDefault();run(async()=>{const {data:{user}}=await client.auth.getUser();if(!user)throw Error('Inte inloggad');const {error}=await client.from('profiles').upsert({user_id:user.id,display_name:$('display-name').value.trim()});if(error)throw error;status('Namnet sparat.');});});
$('create-family').addEventListener('click',()=>run(async()=>{const {error}=await client.rpc('start_family',{p_role:$('role').value});if(error)throw error;status('Familjen skapad. Skapa en kod för att bjuda in den andra personen.');}));
$('make-invite').addEventListener('click',()=>run(async()=>{const bytes=crypto.getRandomValues(new Uint8Array(18));const code=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();const {data,error}=await client.rpc('create_family_invite',{p_code:code});if(error)throw error;$('new-invite').textContent='Dela koden privat: '+code+' (gäller till '+new Date(data).toLocaleString('sv-SE')+')';status('Ny familjekod skapad.');}));
$('accept-form').addEventListener('submit',e=>{e.preventDefault();run(async()=>{const {error}=await client.rpc('accept_family_invite',{p_code:$('invite-code').value.trim().toUpperCase()});if(error)throw error;$('accept-form').reset();status('Du är nu ansluten till familjen. Din profil och privata kontodata är kvar.');});});
$('logout').addEventListener('click',()=>run(async()=>{const {error}=await client.auth.signOut();if(error)throw error;status('Utloggad.');}));
client.auth.onAuthStateChange(event=>{setTimeout(async()=>{try{await refresh();if(event==='PASSWORD_RECOVERY'){status('Välj ditt nya lösenord nedan.');$('new-password').focus();}}catch(e){status(e.message);}},0);});
if(location.hash==='#register')$('register').open=true;
if(location.hash==='#reset')$('reset').open=true;
refresh().catch(e=>status(e.message));
