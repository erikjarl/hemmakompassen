import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const c=window.HEMMAKOMPASSEN_BACKEND;
const db=createClient(c.supabaseUrl,c.supabasePublishableKey,{auth:{flowType:'pkce',detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const nav=[['hem','Hem'],['inkorg','Inkorg'],['swipe','Gillaswajpen'],['personlighet','Min personlighet'],['kommunikation','Kommunikationsråd'],['regler','Schyssta listan'],['medlare','AI-medlaren'],['installningar','Inställningar']];
const COMMUNICATION_GUIDES=[["Vi har svårt att lyssna","När båda vill bli förstådda kan samtalet lätt bli en tävling om att få rätt.",["Försök återge vad den andra menade innan du svarar.","Ställ en nyfiken fråga: Vad är det viktigaste för dig här?","Den som lyssnar måste inte hålla med."]],["Vi bråkar om regler","Regelkonflikter handlar ofta både om praktiska behov och om självständighet.",["Beskriv konkret vad som behöver fungera hemma.","Låt båda formulera vad de vill skydda: frihet, trygghet, sömn eller tillit.","Skriv ett tidsbegränsat förslag i Schyssta listan och utvärdera tillsammans."]],["Vi har hamnat i ett gräl","Det kan vara svårt att lösa problem när stressen redan är hög.",["Ta en överenskommen paus och säg när du kommer tillbaka.","Beskriv senare vad som hände utan anklagelser.","Fråga vad var och en skulle behöva nästa gång."]],["Vi pratar nästan aldrig","Kontakt kan ibland börja i små, kravlösa stunder.",["Föreslå tio minuter tillsammans utan mål att lösa något.","Ställ en fråga från Gillaswajpen och var nyfiken på svaret.","Skilj mellan att vara tillsammans och att prestera ett bra samtal."]]];
const STATEMENTS=[
  ["Relationer","Jag uppskattar när vi gör saker tillsammans utan mobiltelefoner."],
  ["Samtal","Jag vill helst prata färdigt innan någon kommer med råd."],
  ["Vardag","Jag behöver få vara ifred ibland, även när jag är hemma."],
  ["Känslor","Jag tycker det är lätt att säga hur jag mår."],
  ["Relationer","Jag känner mig lyssnad på när vi är oense."],
  ["Vardag","Jag vill vara med och bestämma över regler som gäller mig."],
  ["Samtal","När vi bråkar behöver jag tid innan jag kan prata igen."],
  ["Fritid","Jag tycker det är viktigt att vi har gemensamma aktiviteter."],
  ["Känslor","Jag kan berätta när jag har gjort något som jag ångrar."],
  ["Relationer","Jag vill att vi visar mer uppskattning i vardagen."],
  ["Vardag","Jag mår bra av tydliga överenskommelser hemma."],
  ["Samtal","Jag vill kunna be om hjälp utan att bli bedömd."],
  ["Relationer","Vi brukar kunna skratta tillsammans även när vi tycker olika."],
  ["Känslor","Jag önskar att vi pratade mer om sådant som är svårt."],
  ["Tillit","Jag vill kunna berätta om ett misstag utan att samtalet direkt blir ett gräl."],
  ["Tillit","Jag tycker det är viktigt att vi håller det vi lovar varandra."],
  ["Tillit","Jag vill att vi berättar när något har skadat tilliten mellan oss."],
  ["Självständighet","Jag vill att vi pratar om hur jag kan få mer ansvar och frihet."],
  ["Självständighet","Det är viktigt för mig att kunna säga nej utan att det blir ett bråk."],
  ["Självständighet","Jag vill att vi respekterar varandras privatliv."],
  ["Samtal","Jag vill att vi frågar varandra innan vi ger råd."],
  ["Samtal","Jag skulle vilja att vi oftare frågade hur den andra har haft det."],
  ["Samtal","Jag vill att vi försöker förstå varandras skäl även när vi tycker olika."],
  ["Konflikter","När vi har blivit osams vill jag att vi försöker hitta tillbaka till varandra."],
  ["Konflikter","Jag tycker det hjälper när någon säger förlåt efter att ha sårat den andra."],
  ["Konflikter","Jag vill att vi undviker att höja rösten när vi är oense."],
  ["Känslor","Jag vill kunna säga att jag är ledsen eller orolig utan att behöva förklara allt direkt."],
  ["Känslor","Jag vill att vi märker när någon behöver stöd och frågar vad som skulle hjälpa."],
  ["Vardag","Jag vill att vi bestämmer viktiga saker tillsammans när det går."],
  ["Vardag","Jag tycker det är viktigt att vi kan ändra en regel som inte fungerar."],
  ["Digital vardag","Jag vill att vi pratar om mobilanvändning utan att någon känner sig anklagad."],
  ["Gemenskap","Jag skulle vilja att vi gjorde något roligt tillsammans oftare."],
  ["Gemenskap","Jag uppskattar små stunder tillsammans även när vi inte pratar om något särskilt."],
  ["Uppskattning","Jag vill att vi oftare berättar vad vi uppskattar hos varandra."]
];
const THEME_DECKS=[{"id":"samtal","title":"Samtalsämnen","cards":["Vad som varit roligt den senaste veckan","Hur vi har det i skolan eller på jobbet","Vad vi vill göra under nästa ledighet","Hur vi vill prata om sociala medier","Vad vi vill lära oss","Hur vi visar att vi lyssnar","Vad som gör oss stressade","Vad vi drömmer om framöver"]},{"id":"aktiviteter","title":"Aktiviteter tillsammans","cards":["Laga mat tillsammans","Ta en promenad ihop","Se en film tillsammans","Spela ett spel","Prova en ny aktivitet","Göra en utflykt","Visa varandra favoritmusik","Skapa något tillsammans"]},{"id":"regler","title":"Regler för Schyssta listan","cards":["Vi knackar innan vi går in i varandras rum.","Vi lyssnar färdigt innan vi svarar.","Vi får pausa gräl och bestämmer när vi pratar vidare.","Vi frågar innan vi lånar varandras saker.","Vi pratar om hur sysslorna ska fördelas.","Vi berättar när planer som berör andra ändras.","Vi kommer överens om tider för sömn och hemkomst.","Vi kan ompröva regler som inte fungerar.","Vi bestämmer gemensamma mobilfria stunder.","Vi försöker prata utan att höja rösten.","Vi får säga till när något känns orättvist.","Vi försöker reda ut saker efter ett bråk."]},{"id":"uppskattning","title":"Sätt att visa uppskattning","cards":["Säga tack för små saker","Fråga hur den andra mår","Skicka ett vänligt meddelande","Göra något hjälpsamt","Ge en kram när båda vill","Berätta vad man uppskattar","Uppmärksamma den andras ansträngning","Ge varandra odelad uppmärksamhet"]},{"id":"aterhamtning","title":"Svåra situationer och återhämtning","cards":["Ta en paus när vi blir arga","Fråga om den andra vill ha råd","Säga förlåt när vi sårat någon","Prata vidare när vi lugnat oss","Berätta vad vi behöver","Komma överens om en paussignal","Be om hjälp när vi kör fast","Visa att vi vill bli sams"]},{"id":"forandring","title":"Små gemensamma förändringar","cards":["Äta en måltid tillsammans","Avsätta tio minuter för samtal","Fråga innan vi ger råd","Prata om veckans planer","Göra något roligt varje månad","Ha en stund utan mobiler","Utvärdera en regel efter två veckor","Berätta något som fungerat bra"]}];
let user=null,profile=null,members=[];
let swipeIndex=0;let swipeBusy=false;
function swipeView(){const total=STATEMENTS.length;const item=STATEMENTS[swipeIndex];return '<h1>Gillaswajpen</h1><p>Testa svepningen med de återställda korten. Valen är tillfälliga och sparas inte. När säker kontolagring är ansluten aktiveras riktiga svar och gemensamma resultat.</p>'+card('<h2>Allmänna kortleken</h2><p role="status" id="swipe-progress">Kort '+Math.min(swipeIndex+1,total)+' av '+total+'</p>'+(item?'<div id="swipe-card" style="touch-action:pan-y;user-select:none;max-width:440px;margin:20px auto;padding:32px 24px;min-height:210px;border-radius:22px;border:1px solid var(--line2);background:var(--card2);transition:transform .22s ease,opacity .22s ease;display:flex;flex-direction:column;justify-content:center;text-align:center"><p class="live-muted">'+esc(item[0])+'</p><h2>'+esc(item[1])+'</h2></div><div style="display:flex;justify-content:center;gap:14px;flex-wrap:wrap"><button type="button" class="live-button" data-swipe="no">← Nej</button><button type="button" class="live-button" data-swipe="yes">Ja →</button></div><p class="live-muted">Dra kortet åt vänster eller höger, eller använd knapparna.</p>':'<p>Du har tittat igenom alla kort.</p><button class="live-button" type="button" id="swipe-restart">Börja om</button>')+'</section>'.replace('</section>',''))+'<h2>Temakortlekar</h2>'+THEME_DECKS.map(deck=>card('<details><summary><strong>'+esc(deck.title)+'</strong> · '+deck.cards.length+' kort</summary><ul>'+deck.cards.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul></details>')).join('');}
function advanceSwipe(direction){if(swipeBusy||page()!=='swipe'||!user||swipeIndex>=STATEMENTS.length)return;const el=$('swipe-card');if(!el)return;swipeBusy=true;const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;if(!reduce){el.style.transform='translateX('+(direction==='yes'?120:-120)+'px) rotate('+(direction==='yes'?12:-12)+'deg)';el.style.opacity='0';}setTimeout(()=>{swipeIndex++;swipeBusy=false;render();},reduce?0:220);}
function setupSwipeGesture(){const el=$('swipe-card');if(!el)return;let x=null,y=null;el.addEventListener('pointerdown',e=>{x=e.clientX;y=e.clientY;});el.addEventListener('pointerup',e=>{if(x===null)return;const dx=e.clientX-x,dy=e.clientY-y;x=null;y=null;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy))advanceSwipe(dx>0?'yes':'no');});el.addEventListener('pointercancel',()=>{x=null;y=null;});}

function page(){const h=decodeURIComponent(location.hash.slice(1));return nav.some(n=>n[0]===h)?h:'hem';}
function menu(){for(const id of ['live-desktop-nav','live-mobile-nav'])$(id).innerHTML=nav.map(([key,label])=>'<a href="#'+key+'" '+(page()===key?'aria-current="page"':'')+'>'+label+'</a>').join('');}
const card=html=>'<section class="live-panel">'+html+'</section>';
function login(){
return '<h1>Välkommen till Hemmakompassen</h1>'+card('<h2>Logga in</h2><form id="live-login"><label class="live-field">E-postadress<input id="live-email" type="email" autocomplete="username" required></label><label class="live-field">Lösenord<input id="live-password" type="password" autocomplete="current-password" required></label><button class="live-button" type="submit">Logga in</button></form><p id="login-feedback" role="status"></p><p><a href="./konto.html#reset">Glömt lösenord eller saknar lösenord?</a></p><p><a href="./konto.html#register">Skapa konto</a></p>');
}
function home(){
const name=profile?.display_name||'du';
const roster=members.length?members.map(m=>(m.role==='teen'?'Tonåring':'Förälder')+': '+esc(m.display_name||'Namnlös')).join(' · '):'Ingen familj är kopplad ännu.';
return '<h1>Hej, '+esc(name)+'</h1><p>Välkommen till ert gemensamma rum.</p>'+card('<h2>Din familj</h2><p>'+roster+'</p><p class="live-muted">'+(members.length===1?'Den andra familjemedlemmen har ännu inte anslutit.':'Familjemedlemskap hämtat från Supabase.')+'</p><a class="live-button" href="./konto.html">Hantera familj och inbjudningar</a>')+'<h2>Utforska Hemmakompassen</h2><div class="live-cards">'+nav.slice(1,7).map(([key,label])=>card('<h3>'+label+'</h3><p class="live-muted">Den här funktionen ansluts stegvis till riktiga konton.</p><a href="#'+key+'">Öppna →</a>')).join('')+'</div>';
}
function section(key){
const label=nav.find(n=>n[0]===key)?.[1]||'Hemmakompassen';
if(key==='installningar')return '<h1>Inställningar</h1>'+card('<h2>Ditt konto</h2><p>Inloggad som '+esc(user.email)+'</p><p>Visningsnamn: '+esc(profile?.display_name||'Inte angivet')+'</p><a class="live-button" href="./konto.html">Ändra namn, familj eller logga ut</a>');
if(key==='swipe')return swipeView();
if(key==='kommunikation')return '<h1>Kommunikationsråd</h1><p>Konkreta samtalsöppningar från den tidigare Hemmakompassen.</p>'+COMMUNICATION_GUIDES.map(([title,intro,tips])=>card('<h2>'+esc(title)+'</h2><p>'+esc(intro)+'</p><ul>'+tips.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul>')).join('');
return '<h1>'+label+'</h1>'+card('<h2>Funktionen är under utveckling</h2><p>Du är inloggad som '+esc(profile?.display_name||user.email)+'. Vi bygger nu den riktiga kopplingen till Supabase så att dina svar och den andra familjemedlemmens uppgifter hålls åtskilda.</p><p>Här visas inga påhittade demodata och inga svar lagras lokalt som om de vore delade med familjen.</p><a class="live-button" href="#hem">Till startsidan</a>');
}
function render(){menu();$('live-app').innerHTML=user?(page()==='hem'?home():section(page())):login();setupSwipeGesture();$('sidebar-account').textContent=user?'Inloggad: '+(profile?.display_name||user.email):'Inte inloggad';$('account-link').textContent=user?'Ditt konto →':'Logga in →';}
async function refresh(){
const {data:{user:u},error}=await db.auth.getUser();if(error&&error.name!=='AuthSessionMissingError')throw error;user=u;profile=null;members=[];
if(user){const [p,m]=await Promise.all([db.from('profiles').select('display_name').eq('user_id',user.id).maybeSingle(),db.rpc('my_family_members')]);if(p.error)throw p.error;if(m.error)throw m.error;profile=p.data;members=m.data||[];}
render();
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-swipe]');if(b)advanceSwipe(b.dataset.swipe);if(e.target.closest('#swipe-restart')){swipeIndex=0;render();}});
document.addEventListener('keydown',e=>{if(page()==='swipe'&&user&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();advanceSwipe(e.key==='ArrowRight'?'yes':'no');}});
document.addEventListener('submit',async e=>{if(e.target.id!=='live-login')return;e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;const feedback=$('login-feedback');feedback.textContent='Loggar in…';const email=$('live-email').value.trim();try{const {error}=await db.auth.signInWithPassword({email,password:$('live-password').value});if(error)throw error;$('live-password') && ($('live-password').value='');await refresh();}catch(err){feedback.textContent='Kunde inte logga in. Kontrollera e-post och lösenord, eller välj ”Glömt lösenord eller saknar lösenord?”.';}finally{b.disabled=false;}});
window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0);});
db.auth.onAuthStateChange(()=>setTimeout(()=>refresh().catch(showError),0));
function showError(e){$('live-app').innerHTML=card('<h2>Kunde inte läsa kontot</h2><p>'+esc(e.message)+'</p><a href="./konto.html">Öppna kontosidan</a>');}
refresh().catch(showError);
