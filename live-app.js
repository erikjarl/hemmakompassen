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
let swipeIndex=0,swipeBusy=false,swipeReview=false,swipeLoadError='',swipeSaveError='';
let sharedMatches=[],sharedError='',sharedLoading=false,sharedSession=0,sharedRequest=0;
let themesUnlocked=false,themesLoading=false,themesError='',themesRequest=0;
const swipeAnswers=new Map();
const themeAnswers=new Map(THEME_DECKS.map(deck=>[deck.id,new Map()]));
let activeThemeDeck=null,themeIndex=0,themeReview=false,themeSaveError='';
const themeCardId=(deck,index)=>deck.id+'-'+String(index+1).padStart(2,'0');
const themeAccessAllowed=()=>!!user&&members.length===2&&themesUnlocked&&!themesLoading&&!themesError;
function nextThemeUnanswered(deck,start=0){
  const answers=themeAnswers.get(deck.id);
  for(let i=start;i<deck.cards.length;i++)if(!answers.has(themeCardId(deck,i)))return i;
  for(let i=0;i<start;i++)if(!answers.has(themeCardId(deck,i)))return i;
  return deck.cards.length;
}
const swipeCardId=index=>'general-'+String(index+1).padStart(2,'0');
function nextUnanswered(start=0){for(let i=start;i<STATEMENTS.length;i++)if(!swipeAnswers.has(swipeCardId(i)))return i;for(let i=0;i<start;i++)if(!swipeAnswers.has(swipeCardId(i)))return i;return STATEMENTS.length;}

function sharedSummary(groups){
  const count=[...groups.values()].reduce((sum,statements)=>sum+statements.length,0);
  const categories=[...groups.keys()];
  const role=members.find(member=>member.user_id===user?.id)?.role;
  const roleLabel=role==='parent'?'förälder':role==='teen'?'tonåring':'familjemedlem';
  const categoryText=categories.length===1?categories[0]:categories.slice(0,-1).join(', ')+' och '+categories.at(-1);
  const opening=role==='parent'
    ?'Be tonåringen välja vilket gemensamt ja-svar ni ska prata om först. Lyssna färdigt och fråga vad svaret betyder för hen innan du föreslår lösningar.'
    :role==='teen'
      ?'Välj gärna ett gemensamt ja-svar som känns lättast att börja med och berätta vad det betyder för dig. Du behöver inte hålla med om mer än det som faktiskt står här.'
      :'Välj tillsammans ett gemensamt ja-svar och fråga vad det betyder för var och en.';
  return '<aside class="swipe-rule-summary" aria-labelledby="shared-summary-heading"><span class="swipe-summary-label">REGELBASERAD · INTE AI</span><h3 id="shared-summary-heading">Kort sammanfattning för '+esc(roleLabel)+'</h3>'+
    '<p><strong>Observation:</strong> Ni har '+count+' '+(count===1?'gemensamt ja-svar':'gemensamma ja-svar')+' inom '+esc(categoryText)+'. Det visar bara vad ni båda har bejakat i Gillaswajpen.</p>'+
    '<p><strong>Samtalsöppning:</strong> '+esc(opening)+'</p>'+
    '<p class="live-muted">Sammanfattningen använder enbart ömsesidiga ja-svar. Den använder inte nej-svar, oenighet, ensidiga svar eller AI.</p></aside>';
}

function swipeResults(){
  const title='<section class="live-panel swipe-results" aria-labelledby="shared-result-heading"><span class="swipe-eyebrow">BARA SÅDANT NI DELAR</span><h2 id="shared-result-heading">Era gemensamma svar</h2>';
  if(members.length!==2)return title+'<p class="live-muted">Här visas gemensamma resultat när ni är två sammankopplade familjemedlemmar. Dina egna svar är privata.</p></section>';
  const button='<button type="button" class="live-button swipe-refresh" id="refresh-matches" '+(sharedLoading?'disabled':'')+'>Uppdatera gemensamma svar</button>';
  if(sharedLoading)return title+'<p role="status">Hämtar gemensamma svar…</p>'+button+'</section>';
  if(sharedError)return title+'<p role="alert">'+esc(sharedError)+'</p>'+button+'</section>';
  if(!sharedMatches.length)return title+'<p class="live-muted">Inga gemensamma ja-svar att visa ännu. Här visas bara kort där ni båda har svarat ja.</p>'+button+'</section>';
  const groups=new Map();
  for(const r of sharedMatches){
    const item=STATEMENTS[Number(r.card_id.substring(8))-1];
    if(!item)continue;
    const [category,statement]=item;
    if(!groups.has(category))groups.set(category,[]);
    groups.get(category).push(statement);
  }
  const themes=[...groups.entries()].map(([category,statements])=>
    '<section class="swipe-match-theme"><h4>'+esc(category)+'</h4><ul class="swipe-match-list">'+
    statements.map(statement=>'<li><p>'+esc(statement)+'</p></li>').join('')+
    '</ul></section>'
  ).join('');
  return title+'<p class="live-muted">Bara kort där ni båda svarat ja visas här. Se dem som möjliga samtalsöppningar, inte som färdiga överenskommelser.</p>'+
    '<div class="swipe-match-group"><h3>Det ni båda svarat ja till</h3>'+themes+'</div>'+
    sharedSummary(groups)+
    button+'</section>';
}
async function fetchSwipeMatches(){
  if(!user||members.length!==2)return;
  const viewer=user.id,session=sharedSession,request=++sharedRequest;
  sharedLoading=true;sharedError='';
  if(page()==='swipe'&&!swipeBusy)render();
  try{
    const {data,error}=await db.rpc('shared_swipe_matches',{p_deck_id:'general'});
    if(session!==sharedSession||request!==sharedRequest||user?.id!==viewer)return;
    if(error||!Array.isArray(data))throw Error('Match RPC unavailable');
    const safe=new Map();
    for(const r of data){
      if(r?.deck_id!=='general'||r.answer!==true)continue;
      if(STATEMENTS.some((_,i)=>swipeCardId(i)===r.card_id))safe.set(r.card_id,{card_id:r.card_id,answer:true});
    }
    sharedMatches=[...safe.values()].sort((a,b)=>a.card_id.localeCompare(b.card_id));
  }catch(e){
    if(session!==sharedSession||request!==sharedRequest||user?.id!==viewer)return;
    sharedMatches=[];
    sharedError='Gemensamma resultat är inte tillgängliga just nu. Försök igen senare.';
  }finally{
    if(session===sharedSession&&request===sharedRequest&&user?.id===viewer){
      sharedLoading=false;
      if(page()==='swipe'&&!swipeBusy)render();
    }
  }
}

async function fetchThemeUnlock(){
  if(!user||members.length!==2){themesUnlocked=false;themesLoading=false;activeThemeDeck=null;return;}
  const viewer=user.id,session=sharedSession,request=++themesRequest;
  themesUnlocked=false;themesLoading=true;themesError='';
  if(page()==='swipe'&&!swipeBusy)render();
  try{
    const {data,error}=await db.rpc('shared_general_deck_complete');
    if(session!==sharedSession||request!==themesRequest||user?.id!==viewer)return;
    if(error||typeof data!=='boolean')throw Error('Unlock RPC unavailable');
    themesUnlocked=data===true;
    if(!themesUnlocked)activeThemeDeck=null;
  }catch(e){
    if(session!==sharedSession||request!==themesRequest||user?.id!==viewer)return;
    themesUnlocked=false;
    activeThemeDeck=null;
    themesError='Det går inte att kontrollera om temakortlekarna är upplåsta just nu.';
  }finally{
    if(session===sharedSession&&request===themesRequest&&user?.id===viewer){
      themesLoading=false;
      if(page()==='swipe'&&!swipeBusy)render();
    }
  }
}
function themeDecksView(){
  const unlocked=members.length===2&&themesUnlocked&&!themesLoading&&!themesError;
  const status=members.length!==2
    ?'Koppla ihop två familjemedlemmar för att kunna låsa upp fler kortlekar.'
    :themesLoading
      ?'Kontrollerar om ni båda har avslutat allmänna kortleken…'
      :themesError||(!unlocked
        ?'Temakortlekarna är låsta tills ni båda har besvarat alla 34 kort i allmänna kortleken.'
        :'Ni har båda avslutat allmänna kortleken. Temakortlekarna är upplåsta för förhandsvisning och privat swajpning; gemensamma temaresultat visas inte ännu.');
  return '<section class="swipe-themes" aria-labelledby="swipe-themes-heading"><h2 id="swipe-themes-heading">Fler kortlekar</h2>'+
    '<p class="live-muted" role="status">'+esc(status)+'</p>'+
    THEME_DECKS.map(deck=>card(unlocked
      ?'<details><summary><strong>'+esc(deck.title)+'</strong> · '+deck.cards.length+' kort</summary><ul>'+deck.cards.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul></details><p class="live-muted">Din privata status: '+themeAnswers.get(deck.id).size+' / '+deck.cards.length+' kort</p><button type="button" class="live-button" data-theme-open="'+esc(deck.id)+'">'+(themeAnswers.get(deck.id).size===deck.cards.length?'Visa och ändra svar':'Öppna kortleken')+'</button>'
      :'<h3>'+esc(deck.title)+'</h3><p class="live-muted">Låst · öppnas när ni båda är klara.</p>'
    )).join('')+
    (themesError?'<button type="button" class="live-button" id="retry-theme-unlock">Kontrollera igen</button>':'')+
    '</section>';
}


function themeSwipeView(){
  const deck=THEME_DECKS.find(d=>d.id===activeThemeDeck);
  if(!deck||!themeAccessAllowed()){activeThemeDeck=null;return swipeView();}
  const answers=themeAnswers.get(deck.id),item=deck.cards[themeIndex],answered=answers.size;
  return '<div class="swipe-experience swipe-theme-play"><header class="swipe-heading">'+
    '<button type="button" class="live-button swipe-theme-back" id="theme-back">← Alla kortlekar</button>'+
    '<span class="swipe-eyebrow">TEMAKORTLEK · PRIVATA SVAR</span><h1>'+esc(deck.title)+'</h1>'+
    '<p>Svara ja på sådant du vill prova eller prata om. Dina svar är privata. Ett ja är inte en bindande överenskommelse.</p></header>'+
    '<div class="swipe-stage"><div class="swipe-stage-top"><span>'+esc(deck.title)+'</span><span role="status">'+
    (item?(themeIndex+1)+' / '+deck.cards.length:answered+' / '+deck.cards.length+' sparade')+'</span></div>'+
    '<div class="swipe-track"><div class="swipe-track-fill" style="width:'+Math.round(100*(item?(themeReview?themeIndex:answered):deck.cards.length)/deck.cards.length)+'%"></div></div>'+
    (item?'<div id="swipe-card" class="swipe-playing-card" tabindex="0" aria-label="Temakort '+(themeIndex+1)+' av '+deck.cards.length+'. Svep höger för ja eller vänster för nej.">'+
      '<span class="swipe-stamp swipe-stamp-no" aria-hidden="true">NEJ</span><span class="swipe-stamp swipe-stamp-yes" aria-hidden="true">JA</span>'+
      '<span class="swipe-category">'+esc(deck.title)+'</span><h2>'+esc(item)+'</h2><span class="swipe-card-hint">Dra kortet åt höger eller vänster</span></div>'+
      '<div class="swipe-actions"><button type="button" class="swipe-choice swipe-no" data-swipe="no" aria-label="Nej">✕ <span>Nej</span></button>'+
      '<button type="button" class="swipe-choice swipe-yes" data-swipe="yes" aria-label="Ja">♥ <span>Ja</span></button></div>'
      :'<div class="swipe-finished"><h2>Alla '+deck.cards.length+' svar är sparade</h2><p>Du kan gå igenom kortleken igen och ändra dina egna svar.</p>'+
       '<button type="button" class="live-button" id="theme-restart">Gå igenom igen</button></div>')+
    '<p id="swipe-save-status" class="swipe-disclaimer" role="status">'+
    esc(themeSaveError||'Ditt svar sparas privat i ditt konto. Gemensamma temaresultat visas ännu inte.')+'</p></div></div>';
}
async function saveThemeAnswer(direction,index,deckId,viewer,session){
  const deck=THEME_DECKS.find(d=>d.id===deckId);
  if(!deck||!themeAccessAllowed()||user?.id!==viewer||sharedSession!==session||activeThemeDeck!==deckId){swipeBusy=false;return;}
  const status=$('swipe-save-status');if(status)status.textContent='Sparar ditt svar…';
  const row={user_id:viewer,deck_id:deckId,card_id:themeCardId(deck,index),answer:direction==='yes',updated_at:new Date().toISOString()};
  let error;
  try{({error}=await db.from('swipe_answers').upsert(row,{onConflict:'user_id,deck_id,card_id'}));}
  catch(e){error=e;}
  if(user?.id!==viewer||sharedSession!==session||activeThemeDeck!==deckId)return;
  if(error){themeSaveError='Svaret kunde inte sparas. Försök igen.';swipeBusy=false;render();return;}
  themeAnswers.get(deckId).set(row.card_id,row.answer);
  themeSaveError='';
  themeIndex=themeReview?index+1:nextThemeUnanswered(deck,index+1);
  swipeBusy=false;render();
}
function advanceThemeSwipe(direction){
  const deck=THEME_DECKS.find(d=>d.id===activeThemeDeck);
  if(swipeBusy||page()!=='swipe'||!themeAccessAllowed()||!deck||themeIndex>=deck.cards.length)return;
  const el=$('swipe-card');if(!el)return;
  const index=themeIndex,deckId=deck.id,viewer=user.id,session=sharedSession;
  swipeBusy=true;
  const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if(!reduce){el.style.transform='translateX('+(direction==='yes'?'120vw':'-120vw')+') rotate('+(direction==='yes'?18:-18)+'deg)';el.style.opacity='0';}
  setTimeout(()=>saveThemeAnswer(direction,index,deckId,viewer,session),reduce?0:220);
}

function swipeView(){if(activeThemeDeck)return themeSwipeView();const total=STATEMENTS.length,answered=swipeAnswers.size,item=STATEMENTS[swipeIndex];if(swipeLoadError)return '<div class="swipe-experience"><header class="swipe-heading"><span class="swipe-eyebrow">UPPTÄCK VARANDRA</span><h1>Gillaswajpen</h1></header>'+card('<h2>Kunde inte hämta dina svar</h2><p role="alert">'+esc(swipeLoadError)+'</p><button class="live-button" type="button" id="swipe-reload">Försök igen</button>')+'</div>';return '<div class="swipe-experience"><header class="swipe-heading"><span class="swipe-eyebrow">UPPTÄCK VARANDRA</span><h1>Gillaswajpen</h1><p>Vad är viktigt för dig? Utforska korten i din egen takt.</p></header><div class="swipe-stage"><div class="swipe-stage-top"><span>ALLMÄNNA KORTLEKEN</span><span role="status">'+(item?(swipeIndex+1)+' / '+total:answered+' / '+total+' sparade')+'</span></div><div class="swipe-track"><div class="swipe-track-fill" style="width:'+Math.round(100*(item?(swipeReview?swipeIndex:answered):total)/total)+'%"></div></div>'+(item?'<div id="swipe-card" class="swipe-playing-card" tabindex="0" aria-label="Kort '+(swipeIndex+1)+' av '+total+'. Svep höger för ja eller vänster för nej."><span class="swipe-stamp swipe-stamp-no" aria-hidden="true">NEJ</span><span class="swipe-stamp swipe-stamp-yes" aria-hidden="true">JA</span><span class="swipe-category">'+esc(item[0])+'</span><h2>'+esc(item[1])+'</h2><span class="swipe-card-hint">Dra kortet åt höger eller vänster</span></div><div class="swipe-actions"><button type="button" class="swipe-choice swipe-no" data-swipe="no" aria-label="Nej">✕ <span>Nej</span></button><button type="button" class="swipe-choice swipe-yes" data-swipe="yes" aria-label="Ja">♥ <span>Ja</span></button></div>':'<div class="swipe-finished"><h2>Alla '+total+' svar är sparade</h2><p>Du kan gå igenom korten igen och ändra dina egna svar.</p><button class="live-button" type="button" id="swipe-restart">Gå igenom igen</button></div>')+'<p id="swipe-save-status" class="swipe-disclaimer" role="status">'+(swipeSaveError?esc(swipeSaveError):'Ditt svar sparas privat i ditt konto. Ett kort visas som gemensamt resultat först när båda har svarat ja.')+'</p></div>'+swipeResults()+themeDecksView()+'</div>';}
async function saveSwipeAnswer(direction,index){const statusEl=$('swipe-save-status');if(statusEl)statusEl.textContent='Sparar ditt svar…';const row={user_id:user.id,deck_id:'general',card_id:swipeCardId(index),answer:direction==='yes',updated_at:new Date().toISOString()};const {error}=await db.from('swipe_answers').upsert(row,{onConflict:'user_id,deck_id,card_id'});if(error){swipeSaveError='Svaret kunde inte sparas. Kortet ligger kvar så att du kan försöka igen.';swipeBusy=false;render();return;}swipeAnswers.set(row.card_id,row.answer);swipeSaveError='';swipeIndex=swipeReview?index+1:nextUnanswered(index+1);swipeBusy=false;render();if(members.length===2){void fetchSwipeMatches();if(swipeAnswers.size===STATEMENTS.length)void fetchThemeUnlock();}}
function advanceSwipe(direction){if(activeThemeDeck){advanceThemeSwipe(direction);return;}if(swipeBusy||page()!=='swipe'||!user||swipeIndex>=STATEMENTS.length)return;const el=$('swipe-card');if(!el)return;const index=swipeIndex;swipeBusy=true;const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;if(!reduce){el.style.transform='translateX('+(direction==='yes'?'120vw':'-120vw')+') rotate('+(direction==='yes'?18:-18)+'deg)';el.style.opacity='0';}setTimeout(()=>saveSwipeAnswer(direction,index),reduce?0:220);}
function setupSwipeGesture(){const el=$('swipe-card');if(!el)return;let start=null;const reset=()=>{start=null;el.style.transform='';el.classList.remove('swipe-dragging','swipe-preview-yes','swipe-preview-no');};el.addEventListener('pointerdown',e=>{if(e.button!==undefined&&e.button!==0)return;start={id:e.pointerId,x:e.clientX,y:e.clientY,dragging:false};});el.addEventListener('pointermove',e=>{if(!start||start.id!==e.pointerId||swipeBusy)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(!start.dragging&&Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>12){start=null;return;}if(Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)){start.dragging=true;el.setPointerCapture?.(e.pointerId);}if(!start.dragging)return;el.classList.add('swipe-dragging');el.classList.toggle('swipe-preview-yes',dx>35);el.classList.toggle('swipe-preview-no',dx< -35);el.style.transform='translateX('+dx+'px) rotate('+Math.max(-13,Math.min(13,dx/18))+'deg)';});el.addEventListener('pointerup',e=>{if(!start||start.id!==e.pointerId)return;const dx=e.clientX-start.x,dragged=start.dragging;reset();if(dragged&&Math.abs(dx)>=85)advanceSwipe(dx>0?'yes':'no');});el.addEventListener('pointercancel',reset);}

function page(){const h=decodeURIComponent(location.hash.slice(1));return nav.some(n=>n[0]===h)?h:'hem';}
function menu(){for(const id of ['live-desktop-nav','live-mobile-nav'])$(id).innerHTML=nav.map(([key,label])=>'<a href="#'+key+'" '+(page()===key?'aria-current="page"':'')+'>'+label+'</a>').join('');}
const card=html=>'<section class="live-panel">'+html+'</section>';
function login(){
return '<h1>Välkommen till Hemmakompassen</h1>'+card('<h2>Logga in</h2><form id="live-login"><label class="live-field">E-postadress<input id="live-email" type="email" autocomplete="username" required></label><label class="live-field">Lösenord<input id="live-password" type="password" autocomplete="current-password" required></label><button class="live-button" type="submit">Logga in</button></form><p id="login-feedback" role="status"></p><p><a href="./konto.html#reset">Glömt lösenord eller saknar lösenord?</a></p><p><a href="./konto.html#register">Skapa konto</a></p>');
}
function home(){
const name=profile?.display_name||'du';
const roster=members.length?members.map(m=>(m.role==='teen'?'Tonåring':'Förälder')+': '+esc(m.display_name||'Namnlös')).join(' · '):'Ingen familj är kopplad ännu.';
return '<section class="home-hero"><div class="home-hero-inner"><span class="home-kicker">✦ '+(members.length>1?'ERT GEMENSAMMA RUM':'VÄNTAR PÅ DIN MOTPART')+'</span><h1>Hej '+esc(name)+'.<em>Välkommen till ert rum.</em></h1><p>'+(members.length>1?'Ett rum för att förstå varandra bättre, ett steg i taget.':'Medan du väntar kan du utforska Gillaswajpen och börja hitta nya samtalsämnen.')+'</p><a class="home-hero-link" href="#swipe">Utforska Gillaswajpen <span aria-hidden="true">→</span></a></div><div class="home-orbit" aria-hidden="true"><span></span></div></section>'+card('<h2>Din familj</h2><p>'+roster+'</p><p class="live-muted">'+(members.length===1?'Den andra familjemedlemmen har ännu inte anslutit.':'Familjemedlemskap hämtat från Supabase.')+'</p><a class="live-button" href="./konto.html">Hantera familj och inbjudningar</a>')+'<h2>Utforska Hemmakompassen</h2><div class="live-cards">'+nav.slice(1,7).map(([key,label])=>card('<h3>'+label+'</h3><p class="live-muted">Den här funktionen ansluts stegvis till riktiga konton.</p><a href="#'+key+'">Öppna →</a>')).join('')+'</div>';
}
function section(key){
const label=nav.find(n=>n[0]===key)?.[1]||'Hemmakompassen';
if(key==='installningar')return '<h1>Inställningar</h1>'+card('<h2>Ditt konto</h2><p>Inloggad som '+esc(user.email)+'</p><p>Visningsnamn: '+esc(profile?.display_name||'Inte angivet')+'</p><a class="live-button" href="./konto.html">Ändra namn, familj eller logga ut</a>');
if(key==='swipe')return swipeView();
if(key==='kommunikation')return '<h1>Kommunikationsråd</h1><p>Konkreta samtalsöppningar från den tidigare Hemmakompassen.</p>'+COMMUNICATION_GUIDES.map(([title,intro,tips])=>card('<h2>'+esc(title)+'</h2><p>'+esc(intro)+'</p><ul>'+tips.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul>')).join('');
return '<h1>'+label+'</h1>'+card('<h2>Funktionen är under utveckling</h2><p>Du är inloggad som '+esc(profile?.display_name||user.email)+'. Vi bygger nu den riktiga kopplingen till Supabase så att dina svar och den andra familjemedlemmens uppgifter hålls åtskilda.</p><p>Här visas inga påhittade demodata och inga svar lagras lokalt som om de vore delade med familjen.</p><a class="live-button" href="#hem">Till startsidan</a>');
}
function render(){if(activeThemeDeck&&!themeAccessAllowed())activeThemeDeck=null;menu();$('live-app').innerHTML=user?(page()==='hem'?home():section(page())):login();setupSwipeGesture();$('sidebar-account').textContent=user?'Inloggad: '+(profile?.display_name||user.email):'Inte inloggad';$('account-link').textContent=user?'Ditt konto →':'Logga in →';}
async function refresh(){
const {data:{user:u},error}=await db.auth.getUser();if(error&&error.name!=='AuthSessionMissingError')throw error;user=u;profile=null;members=[];swipeAnswers.clear();for(const answers of themeAnswers.values())answers.clear();activeThemeDeck=null;themeIndex=0;themeReview=false;themeSaveError='';swipeBusy=false;swipeLoadError='';swipeSaveError='';swipeReview=false;swipeIndex=0;sharedMatches=[];sharedError='';sharedLoading=false;sharedSession++;sharedRequest++;themesUnlocked=false;themesLoading=false;themesError='';themesRequest++;
if(user){const [p,m,s]=await Promise.all([db.from('profiles').select('display_name').eq('user_id',user.id).maybeSingle(),db.rpc('my_family_members'),db.from('swipe_answers').select('deck_id,card_id,answer').eq('user_id',user.id)]);if(p.error)throw p.error;if(m.error)throw m.error;profile=p.data;members=m.data||[];if(s.error)swipeLoadError='Kontrollera anslutningen och försök igen.';else for(const answer of s.data||[])if(answer.deck_id==='general'&&typeof answer.answer==='boolean'&&STATEMENTS.some((_,index)=>swipeCardId(index)===answer.card_id))swipeAnswers.set(answer.card_id,answer.answer);
if(!s.error)for(const answer of s.data||[]){
  if(typeof answer.answer!=='boolean')continue;
  const deck=THEME_DECKS.find(d=>d.id===answer.deck_id);
  if(deck&&deck.cards.some((_,index)=>themeCardId(deck,index)===answer.card_id))themeAnswers.get(deck.id).set(answer.card_id,answer.answer);
}swipeIndex=nextUnanswered();}
render();
if(user&&members.length===2){void fetchSwipeMatches();void fetchThemeUnlock();}
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-swipe]');if(b)advanceSwipe(b.dataset.swipe);if(e.target.closest('#swipe-restart')){swipeReview=true;swipeIndex=0;render();}if(e.target.closest('#swipe-reload'))refresh().catch(showError);if(e.target.closest('#refresh-matches')&&!sharedLoading)void fetchSwipeMatches();if(e.target.closest('#retry-theme-unlock')&&!themesLoading)void fetchThemeUnlock();
const open=e.target.closest('[data-theme-open]');
if(open&&themeAccessAllowed()){
  const deck=THEME_DECKS.find(d=>d.id===open.dataset.themeOpen);
  if(deck){activeThemeDeck=deck.id;themeIndex=nextThemeUnanswered(deck);themeReview=false;themeSaveError='';render();window.scrollTo(0,0);}
}
if(e.target.closest('#theme-back')){activeThemeDeck=null;themeReview=false;render();window.scrollTo(0,0);}
if(e.target.closest('#theme-restart')&&themeAccessAllowed()){themeReview=true;themeIndex=0;themeSaveError='';render();}
});
document.addEventListener('keydown',e=>{if(page()==='swipe'&&user&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();advanceSwipe(e.key==='ArrowRight'?'yes':'no');}});
document.addEventListener('submit',async e=>{if(e.target.id!=='live-login')return;e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;const feedback=$('login-feedback');feedback.textContent='Loggar in…';const email=$('live-email').value.trim();try{const {error}=await db.auth.signInWithPassword({email,password:$('live-password').value});if(error)throw error;$('live-password') && ($('live-password').value='');await refresh();}catch(err){feedback.textContent='Kunde inte logga in. Kontrollera e-post och lösenord, eller välj ”Glömt lösenord eller saknar lösenord?”.';}finally{b.disabled=false;}});
window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0);});
db.auth.onAuthStateChange(()=>setTimeout(()=>refresh().catch(showError),0));
function showError(e){$('live-app').innerHTML=card('<h2>Kunde inte läsa kontot</h2><p>'+esc(e.message)+'</p><a href="./konto.html">Öppna kontosidan</a>');}
refresh().catch(showError);
