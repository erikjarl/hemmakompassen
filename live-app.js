import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const c=window.HEMMAKOMPASSEN_BACKEND;
const db=createClient(c.supabaseUrl,c.supabasePublishableKey,{auth:{flowType:'pkce',detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const nav=[['hem','Hem'],['inkorg','Inkorg'],['swipe','Gillaswajpen'],['personlighet','Min personlighet'],['kommunikation','Kommunikationsråd'],['regler','Schyssta listan'],['medlare','AI-medlaren'],['installningar','Inställningar']];
let user=null,profile=null,members=[];
function page(){const h=decodeURIComponent(location.hash.slice(1));return nav.some(n=>n[0]===h)?h:'hem';}
function menu(){for(const id of ['live-desktop-nav','live-mobile-nav'])$(id).innerHTML=nav.map(([key,label])=>'<a href="#'+key+'" '+(page()===key?'aria-current="page"':'')+'>'+label+'</a>').join('');}
const card=html=>'<section class="live-panel">'+html+'</section>';
function login(){
return '<h1>Välkommen till Hemmakompassen</h1><p>Logga in med din befintliga e-postadress eller skapa ett konto med samma inloggningsmetod.</p>'+card('<h2>Logga in eller registrera dig</h2><p>Har du redan skapat Tobbetonåring? Ange samma e-postadress för att logga in på det befintliga kontot. Du ska inte skapa en ny familj.</p><form id="live-login"><label class="live-field">E-postadress<input id="live-email" type="email" autocomplete="email" required></label><button class="live-button" type="submit">Skicka inloggningslänk</button></form><p id="login-feedback" role="status"></p><p class="live-muted">Öppna mejllänken i samma Safari-webbläsare. Supabase kan begränsa antalet mejl per timme.</p>') ;
}
function home(){
const name=profile?.display_name||'du';
const roster=members.length?members.map(m=>(m.role==='teen'?'Tonåring':'Förälder')+': '+esc(m.display_name||'Namnlös')).join(' · '):'Ingen familj är kopplad ännu.';
return '<h1>Hej, '+esc(name)+'</h1><p>Välkommen till ert gemensamma rum.</p>'+card('<h2>Din familj</h2><p>'+roster+'</p><p class="live-muted">'+(members.length===1?'Den andra familjemedlemmen har ännu inte anslutit.':'Familjemedlemskap hämtat från Supabase.')+'</p><a class="live-button" href="./konto.html">Hantera familj och inbjudningar</a>')+'<h2>Utforska Hemmakompassen</h2><div class="live-cards">'+nav.slice(1,7).map(([key,label])=>card('<h3>'+label+'</h3><p class="live-muted">Den här funktionen ansluts stegvis till riktiga konton.</p><a href="#'+key+'">Öppna →</a>')).join('')+'</div>';
}
function section(key){
const label=nav.find(n=>n[0]===key)?.[1]||'Hemmakompassen';
if(key==='installningar')return '<h1>Inställningar</h1>'+card('<h2>Ditt konto</h2><p>Inloggad som '+esc(user.email)+'</p><p>Visningsnamn: '+esc(profile?.display_name||'Inte angivet')+'</p><a class="live-button" href="./konto.html">Ändra namn, familj eller logga ut</a>');
if(key==='kommunikation')return '<h1>Kommunikationsråd</h1>'+card('<h2>Lyssna och förstå</h2><p>Beskriv en konkret situation utan att tolka den andras avsikt. Berätta hur du själv reagerade och fråga vad den andra behöver.</p><p>Försök komma överens om ett litet, frivilligt nästa steg.</p>');
return '<h1>'+label+'</h1>'+card('<h2>Funktionen är under utveckling</h2><p>Du är inloggad som '+esc(profile?.display_name||user.email)+'. Vi bygger nu den riktiga kopplingen till Supabase så att dina svar och den andra familjemedlemmens uppgifter hålls åtskilda.</p><p>Här visas inga påhittade demodata och inga svar lagras lokalt som om de vore delade med familjen.</p><a class="live-button" href="#hem">Till startsidan</a>');
}
function render(){menu();$('live-app').innerHTML=user?(page()==='hem'?home():section(page())):login();$('sidebar-account').textContent=user?'Inloggad: '+(profile?.display_name||user.email):'Inte inloggad';$('account-link').textContent=user?'Ditt konto →':'Logga in →';}
async function refresh(){
const {data:{user:u},error}=await db.auth.getUser();if(error&&error.name!=='AuthSessionMissingError')throw error;user=u;profile=null;members=[];
if(user){const [p,m]=await Promise.all([db.from('profiles').select('display_name').eq('user_id',user.id).maybeSingle(),db.rpc('my_family_members')]);if(p.error)throw p.error;if(m.error)throw m.error;profile=p.data;members=m.data||[];}
render();
}
document.addEventListener('submit',async e=>{if(e.target.id!=='live-login')return;e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;const feedback=$('login-feedback');feedback.textContent='Skickar…';const email=$('live-email').value.trim();try{const {error}=await db.auth.signInWithOtp({email,options:{emailRedirectTo:new URL('index.html',location.href).href}});if(error)throw error;feedback.textContent='Inloggningslänk skickad. Öppna mejlet i samma webbläsare.';}catch(err){feedback.textContent='Kunde inte skicka länken: '+err.message;}finally{b.disabled=false;}});
window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0);});
db.auth.onAuthStateChange(()=>setTimeout(()=>refresh().catch(showError),0));
function showError(e){$('live-app').innerHTML=card('<h2>Kunde inte läsa kontot</h2><p>'+esc(e.message)+'</p><a href="./konto.html">Öppna kontosidan</a>');}
refresh().catch(showError);
