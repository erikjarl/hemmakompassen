import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
import {GENERAL_CARDS,THEME_DECK_MODELS,ADVICE_BY_KEY,adviceKeyForCard,cardTextForRole} from './card-catalog.js';
const c=window.HEMMAKOMPASSEN_BACKEND;
const sharedPrioritiesEnabled=c.enableSharedPriorities===true;
// Do not activate background polling until the server-side A allowlist and
// authenticated two-account revocation tests have been approved.
const sharedPollingEnabled=c.enableSharedPolling===true;
// The all-deck insights page remains OFF until the server A allowlist and
// authenticated two-account tests are verified. B sharing has a separate gate.
const sharedInsightsEnabled=c.enableSharedInsights===true;
const db=createClient(c.supabaseUrl,c.supabasePublishableKey,{auth:{flowType:'pkce',detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const nav=[['hem','Hem'],['inkorg','Inkorg'],['swipe','Gillaswajpen'],['personlighet','Min personlighet'],['kommunikation','Kommunikationsråd'],['regler','Schyssta listan'],['medlare','AI-medlaren'],['installningar','Inställningar']];
const COMMUNICATION_GUIDES=[["Vi har svårt att lyssna","När båda vill bli förstådda kan samtalet lätt bli en tävling om att få rätt.",["Försök återge vad den andra menade innan du svarar.","Ställ en nyfiken fråga: Vad är det viktigaste för dig här?","Den som lyssnar måste inte hålla med."]],["Vi bråkar om regler","Regelkonflikter handlar ofta både om praktiska behov och om självständighet.",["Beskriv konkret vad som behöver fungera hemma.","Låt båda formulera vad de vill skydda: frihet, trygghet, sömn eller tillit.","Skriv ett tidsbegränsat förslag i Schyssta listan och utvärdera tillsammans."]],["Vi har hamnat i ett gräl","Det kan vara svårt att lösa problem när stressen redan är hög.",["Ta en överenskommen paus och säg när du kommer tillbaka.","Beskriv senare vad som hände utan anklagelser.","Fråga vad var och en skulle behöva nästa gång."]],["Vi pratar nästan aldrig","Kontakt kan ibland börja i små, kravlösa stunder.",["Föreslå tio minuter tillsammans utan mål att lösa något.","Ställ en fråga från Gillaswajpen och var nyfiken på svaret.","Skilj mellan att vara tillsammans och att prestera ett bra samtal."]]];
const STATEMENTS=GENERAL_CARDS.map(card=>[card.category,card.teenText]);
const THEME_DECKS=THEME_DECK_MODELS.map(deck=>({...deck,cards:deck.cards.map(card=>card.teenText),cardIds:deck.cards.map(card=>card.id)}));
let user=null,profile=null,members=[],refreshGeneration=0;
let swipeIndex=0,swipeBusy=false,swipeReview=false,swipeLoadError='',swipeSaveError='';
let sharedMatches=[],sharedPriorities=[],sharedDeckId='general',sharedError='',sharedLoading=false,sharedSession=0,sharedRequest=0;
let sharedPollPending=false;
let insightsRows=[],insightsLoading=false,insightsError='',insightsRequest=0;
const SHARED_POLL_INTERVAL_MS=15000;
let themesUnlocked=false,themesLoading=false,themesError='',themesRequest=0;
const swipeAnswers=new Map();
const themeAnswers=new Map(THEME_DECKS.map(deck=>[deck.id,new Map()]));
const swipeImportance=new Map();
const importancePending=new Map();
const importanceSaving=new Set();
let importanceAvailable=false,importanceLoadError='';
let activeThemeDeck=null,themeCategory='all',themeIndex=0,themeReview=false,themeSaveError='';
const themeCardId=(deck,index)=>deck.cardIds[index];
const themeCardModel=(deck,index)=>THEME_DECK_MODELS.find(model=>model.id===deck.id)?.cards[index];
const themeAccessAllowed=()=>!!user&&members.length===2&&themesUnlocked&&!themesLoading&&!themesError;
const themeCategories=deck=>[...new Set(deck.cards.map((_,index)=>themeCardModel(deck,index)?.category||deck.title))];
function themeVisibleIndices(deck,category=themeCategory){
  return deck.cards.map((_,index)=>index).filter(index=>category==='all'||themeCardModel(deck,index)?.category===category);
}
function nextThemeUnanswered(deck,start=0,category=themeCategory){
  const answers=themeAnswers.get(deck.id);
  const visible=themeVisibleIndices(deck,category);
  for(const index of visible)if(index>=start&&!answers.has(themeCardId(deck,index)))return index;
  for(const index of visible)if(index<start&&!answers.has(themeCardId(deck,index)))return index;
  return deck.cards.length;
}
function nextThemeVisible(deck,index,category=themeCategory){
  return themeVisibleIndices(deck,category).find(candidate=>candidate>index)??deck.cards.length;
}
const swipeCardId=index=>GENERAL_CARDS[index]?.id;
const viewerRole=()=>members.find(member=>member.user_id===user?.id)?.role;
const generalStatement=index=>{
  const card=GENERAL_CARDS[index];
  return card?[card.category,cardTextForRole(card,viewerRole())]:undefined;
};
const visibleGeneralIndices=()=>GENERAL_CARDS.flatMap((card,index)=>card.type==='match'||viewerRole()==='teen'?[index]:[]);
const skippedUnderstanding=new Set();
function nextUnanswered(start=0){const visible=visibleGeneralIndices();const pending=i=>!swipeAnswers.has(swipeCardId(i))&&!skippedUnderstanding.has(swipeCardId(i));return visible.find(i=>i>=start&&pending(i))??visible.find(i=>i<start&&pending(i))??STATEMENTS.length;}

const importanceKey=(deckId,cardId)=>deckId+'\u0000'+cardId;
const importanceValueText=value=>value===1?'Mycket viktigt':value===-1?'Mindre viktigt':'Neutral, inte prioriterad';
function importanceControl(deckId,cardId){
  const value=swipeImportance.get(importanceKey(deckId,cardId))??0;
  const disabled=importanceAvailable?'':' disabled';
  const status=importanceLoadError?'Viktighet kan inte sparas ännu. '+importanceLoadError:'Din viktighetsskattning sparas privat och påverkar inte ditt ja eller nej.';
  return '<div class="swipe-importance" data-importance-control>'+
    '<label class="swipe-importance-title" for="swipe-importance-range">Hur viktigt är det här för dig?</label>'+
    '<input id="swipe-importance-range" data-importance data-deck-id="'+esc(deckId)+'" data-card-id="'+esc(cardId)+'" type="range" min="-1" max="1" step="1" value="'+value+'" aria-valuetext="'+esc(importanceValueText(value))+'"'+disabled+'>'+
    '<div class="swipe-importance-scale" aria-hidden="true"><span>Mindre viktigt</span><span>Mycket viktigt</span></div>'+
    '<span class="swipe-importance-status" data-importance-status role="status">'+esc(status)+'</span>'+
    '</div>';
}
function validImportanceCard(deckId,cardId){
  if(deckId==='general')return GENERAL_CARDS.some(card=>card.id===cardId&&(card.type==='match'||viewerRole()==='teen'));
  return !!THEME_DECKS.find(deck=>deck.id===deckId&&deck.cardIds.includes(cardId));
}
async function saveImportance(deckId,cardId,value,viewer,session){
  if(!importanceAvailable||user?.id!==viewer||sharedSession!==session||!validImportanceCard(deckId,cardId)||![-1,0,1].includes(value))return;
  const key=importanceKey(deckId,cardId);
  importancePending.set(key,{deckId,cardId,value,viewer,session});
  if(importanceSaving.has(key))return;
  importanceSaving.add(key);
  while(importancePending.has(key)){
    const next=importancePending.get(key);importancePending.delete(key);
    if(user?.id!==next.viewer||sharedSession!==next.session)break;
    const status=document.querySelector('[data-importance-status]');if(status)status.textContent='Sparar viktighet…';
    const row={user_id:next.viewer,deck_id:next.deckId,card_id:next.cardId,importance:next.value,updated_at:new Date().toISOString()};
    let error;
    try{({error}=await db.from('swipe_importance').upsert(row,{onConflict:'user_id,deck_id,card_id'}));}
    catch(e){error=e;}
    if(user?.id!==next.viewer||sharedSession!==next.session)break;
    if(error){
      importancePending.delete(key);
      const input=document.querySelector('[data-importance]');
      if(input&&input.dataset.deckId===next.deckId&&input.dataset.cardId===next.cardId){const saved=swipeImportance.get(key)??0;input.value=String(saved);input.setAttribute('aria-valuetext',importanceValueText(saved));}
      if(status)status.textContent='Viktigheten kunde inte sparas. Kortet ligger kvar så att du kan försöka igen.';
      break;
    }
    swipeImportance.set(key,next.value);
    if(status)status.textContent='Viktighet sparad privat.';
  }
  importanceSaving.delete(key);
}

const joinSwedish=items=>items.length<2?(items[0]||''):items.slice(0,-1).join(', ')+' och '+items.at(-1);
const shortCardText=text=>String(text).replace(/[.!?]+$/,'').replace(/^Jag (?:vill|skulle vilja|tycker|uppskattar) (?:att |när )?/i,'').replace(/^Vi /,'att ni ').trim();
const sharedDeck=deckId=>deckId==='general'
  ?{id:'general',title:'Allmänna kortleken',cards:GENERAL_CARDS}
  :THEME_DECK_MODELS.find(deck=>deck.id===deckId);
function sharedSummary(groups,deckId='general',priorityIds=new Set()){
  const role=viewerRole();
  const roleLabel=role==='parent'?'förälder':role==='teen'?'tonåring':'familjemedlem';
  const paragraphs=[];
  // Never repeat a category-level tip across many matching cards, or repeat
  // advice already present in the teenager-prioritised section.
  const usedAdvice=new Set([...groups.values()].flatMap(items=>items.filter(item=>priorityIds.has(item.card.id)).map(item=>ADVICE_BY_KEY[adviceKeyForCard(item.card,deckId)]).filter(Boolean)));
  for(const [category,items] of groups){
    const remaining=items.filter(item=>!priorityIds.has(item.card.id));
    if(!remaining.length)continue;
    const cardTexts=remaining.map(item=>shortCardText(item.statement));
    const advice=[...new Set(remaining.map(item=>ADVICE_BY_KEY[adviceKeyForCard(item.card,deckId)]).filter(Boolean))].filter(text=>{if(usedAdvice.has(text))return false;usedAdvice.add(text);return true;}).join(' ');
    const intro=category==='Fritid'||category==='Gemenskap'
      ?'Ni har båda visat intresse för '
      :'Ni har båda bejakat ';
    paragraphs.push('<p>'+esc(intro)+'<strong>'+esc(joinSwedish(cardTexts))+'</strong>.'+(advice?' '+esc(advice):'')+'</p>');
  }
  const opening=role==='parent'
    ?'Fråga gärna tonåringen vad hen vill börja med och lyssna färdigt innan du föreslår något.'
    :role==='teen'
      ?'Välj gärna själv vad du vill börja prata om; ett ja betyder inte att du måste göra något direkt.'
      :'Välj tillsammans något som känns enkelt att börja med.';
  if(!paragraphs.length)return '';
  return '<aside class="swipe-rule-summary" aria-labelledby="shared-summary-heading"><span class="swipe-summary-label">REDAKTIONELLA RÅD · INTE AI</span><h3 id="shared-summary-heading">Gemensamma möjligheter – '+esc(roleLabel)+'</h3>'+
    paragraphs.join('')+'<p>'+esc(opening)+'</p>'+
    '<p class="live-muted">Texten bygger enbart på serververifierade ömsesidiga ja-svar. Råden är förskrivna, inte AI-genererade; inget privat svar ingår.</p></aside>';
}

function sharedPrioritySummary(items,deckId='general'){
  if(!items.length)return '';
  const role=viewerRole();
  const groups=new Map();
  for(const item of items){
    if(!groups.has(item.card.category))groups.set(item.card.category,[]);
    groups.get(item.card.category).push(item);
  }
  const usedAdvice=new Set();
  const sections=[...groups.entries()].map(([category,cards])=>{
    const texts=cards.map(item=>shortCardText(item.statement));
    const lead=role==='teen'
      ?'Du har markerat <strong>'+esc(joinSwedish(texts))+'</strong> som särskilt viktigt bland det ni båda sagt ja till.'
      :'Ni har båda sagt ja till <strong>'+esc(joinSwedish(texts))+'</strong>, och tonåringen har markerat detta som särskilt viktigt.';
    const advice=[...new Set(cards.map(item=>ADVICE_BY_KEY[adviceKeyForCard(item.card,deckId)]).filter(Boolean))].filter(text=>{if(usedAdvice.has(text))return false;usedAdvice.add(text);return true;}).join(' ');
    return '<section class="swipe-priority-theme"><h4>'+esc(category)+'</h4><p>'+lead+(advice?' '+esc(advice):'')+'</p></section>';
  }).join('');
  const opening=role==='teen'
    ?'Du bestämmer vad du vill börja prata om. En hög markering betyder inte att något måste lösas direkt.'
    :'Börja gärna med att fråga vad som skulle kännas hjälpsamt och lyssna färdigt utan att förutsätta att ett problem måste lösas direkt.';
  return '<aside class="swipe-priority-summary" aria-labelledby="shared-priority-heading"><span class="swipe-summary-label">TONÅRINGENS PRIORITERING · REDAN DELADE A-KORT</span><h3 id="shared-priority-heading">Viktigast att fokusera på</h3>'+
    '<p>Det här är särskilt viktigt för tonåringen bland sådant som ni redan valt att dela genom att båda svara ja.</p>'+
    sections+'<p>'+esc(opening)+'</p>'+
    '<p class="live-muted">Sektionen bygger endast på serververifierat JA+JA och tonåringens höga markering. Låga, neutrala och privata nivåer visas aldrig.</p></aside>';
}

function swipeResults(deckId='general'){
  const deck=sharedDeck(deckId);
  if(!deck)return '';
  const headingId='shared-result-heading-'+deckId;
  const heading=deckId==='general'?'Era gemensamma svar':'Era gemensamma svar · '+deck.title;
  const title='<section class="live-panel swipe-results" aria-labelledby="'+esc(headingId)+'"><span class="swipe-eyebrow">BARA SÅDANT NI DELAR</span><h2 id="'+esc(headingId)+'">'+esc(heading)+'</h2>';
  if(members.length!==2)return title+'<p class="live-muted">Här visas gemensamma resultat när ni är två sammankopplade familjemedlemmar. Dina egna svar är privata.</p></section>';
  const current=sharedDeckId===deckId;
  const button='<button type="button" class="live-button swipe-refresh" data-refresh-matches="'+esc(deckId)+'" '+(sharedLoading&&current?'disabled':'')+'>Uppdatera gemensamma svar</button>';
  if(!current)return title+'<p role="status">Hämtar gemensamma svar…</p>'+button+'</section>';
  if(sharedLoading)return title+'<p role="status">Hämtar gemensamma svar…</p>'+button+'</section>';
  if(sharedError)return title+'<p role="alert">'+esc(sharedError)+'</p>'+button+'</section>';
  // Defense in depth: a stale or malformed client result must never reach the
  // shared view or its editorial summary, even if the RPC filter regresses.
  const groups=new Map();
  for(const r of sharedMatches){
    if(r?.answer!==true)continue;
    if(r.deck_id!==deckId)continue;
    const matchedCard=deck.cards.find(card=>card.id===r.card_id&&card.type==='match');
    if(!matchedCard)continue;
    const {category}=matchedCard;
    const statement=cardTextForRole(matchedCard,viewerRole());
    if(!groups.has(category))groups.set(category,[]);
    groups.get(category).push({statement,card:matchedCard});
  }
  if(!groups.size)return title+'<p class="live-muted">Inga gemensamma ja-svar att visa ännu. Här visas bara kort där ni båda har svarat ja.</p>'+button+'</section>';
  const themes=[...groups.entries()].map(([category,items])=>
    '<section class="swipe-match-theme"><h4>'+esc(category)+'</h4><ul class="swipe-match-list">'+
    items.map(item=>'<li><p>'+esc(item.statement)+'</p></li>').join('')+
    '</ul></section>'
  ).join('');
  const matchedById=new Map([...groups.values()].flat().map(item=>[item.card.id,item]));
  const priorityItems=sharedPriorities
    .filter(row=>row?.deck_id===deckId&&matchedById.has(row.card_id))
    .map(row=>matchedById.get(row.card_id))
    .sort((a,b)=>a.card.id.localeCompare(b.card.id));
  const priorityIds=new Set(priorityItems.map(item=>item.card.id));
  return title+'<p class="live-muted">Bara kort där ni båda svarat ja visas här. Se dem som möjliga samtalsöppningar, inte som färdiga överenskommelser.</p>'+
    sharedPrioritySummary(priorityItems,deckId)+
    '<div class="swipe-match-group"><h3>Det ni båda svarat ja till</h3>'+themes+'</div>'+
    sharedSummary(groups,deckId,priorityIds)+
    button+'</section>';
}
async function fetchSwipeMatches(deckId='general',{quiet=false}={}){
  if(!user||members.length!==2)return;
  const deck=sharedDeck(deckId);
  if(!deck)return;
  const viewer=user.id,session=sharedSession,request=++sharedRequest;
  const quietRefresh=quiet&&sharedDeckId===deckId&&!sharedLoading&&!sharedError;
  const previousResults=quietRefresh?JSON.stringify([sharedMatches,sharedPriorities]):null;
  sharedDeckId=deckId;
  if(!quietRefresh){sharedMatches=[];sharedPriorities=[];sharedLoading=true;sharedError='';
    if(page()==='swipe'&&!swipeBusy)render();}
  try{
    const [matchResult,priorityResult]=await Promise.all([
      db.rpc('shared_swipe_matches',{p_deck_id:deckId}),
      sharedPrioritiesEnabled
        ?db.rpc('shared_swipe_priorities',{p_deck_id:deckId})
        :Promise.resolve({data:[],error:null})
    ]);
    if(session!==sharedSession||request!==sharedRequest||user?.id!==viewer||sharedDeckId!==deckId)return;
    const {data,error}=matchResult;
    if(error||!Array.isArray(data))throw Error('Match RPC unavailable');
    const safe=new Map();
    for(const r of data){
      if(r?.deck_id!==deckId||r.answer!==true||!deck.cards.find(card=>card.id===r.card_id&&card.type==='match'))continue;
      safe.set(r.card_id,{deck_id:deckId,card_id:r.card_id,answer:true});
    }
    sharedMatches=[...safe.values()].sort((a,b)=>a.card_id.localeCompare(b.card_id));
    if(sharedPrioritiesEnabled&&!priorityResult.error&&Array.isArray(priorityResult.data)){
      const priorities=new Map();
      for(const row of priorityResult.data){
        if(row?.deck_id!==deckId||!safe.has(row.card_id))continue;
        priorities.set(row.card_id,{deck_id:deckId,card_id:row.card_id});
      }
      sharedPriorities=[...priorities.values()].sort((a,b)=>a.card_id.localeCompare(b.card_id));
    }
  }catch(e){
    if(session!==sharedSession||request!==sharedRequest||user?.id!==viewer||sharedDeckId!==deckId)return;
    sharedMatches=[];
    sharedPriorities=[];
    sharedError='Gemensamma resultat är inte tillgängliga just nu. Försök igen senare.';
  }finally{
    if(session===sharedSession&&request===sharedRequest&&user?.id===viewer&&sharedDeckId===deckId){
      sharedLoading=false;
      if(page()==='swipe'&&!swipeBusy&&(!quietRefresh||sharedError||previousResults!==JSON.stringify([sharedMatches,sharedPriorities])))render();
    }
  }
}


const INSIGHT_DECK_IDS=['general',...THEME_DECKS.map(deck=>deck.id)];
// Pure allowlist. Even a malformed RPC response cannot turn a B card,
// mutual NO, one-sided answer, unknown ID or another deck into shared insight.
function safeInsightMatches(deckId,rows){
  const deck=sharedDeck(deckId);
  if(!deck||!Array.isArray(rows))throw Error('Invalid shared results');
  const safe=new Map();
  for(const r of rows){
    if(r?.deck_id!==deckId||r.answer!==true)continue;
    const matched=deck.cards.find(card=>card.id===r.card_id&&card.type==='match');
    if(!matched)continue;
    safe.set(matched.id,{deck_id:deckId,card_id:matched.id,answer:true});
  }
  return [...safe.values()];
}
function insightsEntry(){
  return sharedInsightsEnabled?'<p class="insights-entry"><a class="live-button" href="#insikter">Gemensamma insikter från alla kortlekar →</a></p>':'';
}
function insightsView(){
  const title='<div class="swipe-experience insights-view"><header class="swipe-heading"><span class="swipe-eyebrow">ENDAST REDAN DELADE SVAR</span><h1>Era gemensamma insikter</h1><p>Här samlas möjliga samtalsöppningar från alla kortlekar. Ni kan fortsätta swajpa i er egen takt.</p><a class="live-button" href="#swipe">← Till Gillaswajpen</a></header>';
  if(!sharedInsightsEnabled)return title+card('<h2>Insiktsytan förbereds</h2><p>Den aktiveras först efter säker serververifiering med två konton.</p>')+'</div>';
  if(!user||members.length!==2||!members.some(m=>m.user_id===user.id)||!members.some(m=>m.role==='parent')||!members.some(m=>m.role==='teen'))
    return title+card('<h2>Gemensamma insikter</h2><p>Koppla ihop en förälder och en tonåring för att se sådant ni båda aktivt har valt.</p>')+'</div>';
  if(insightsLoading)return title+card('<p role="status">Kontrollerar era gemensamma ja-svar säkert…</p>')+'</div>';
  if(insightsError)return title+card('<h2>Gemensamma insikter</h2><p role="alert">'+esc(insightsError)+'</p><button type="button" class="live-button" id="insights-retry">Försök igen</button>')+'</div>';
  const byDeck=new Map();
  for(const row of insightsRows){
    if(row?.answer!==true)continue;
    const deck=sharedDeck(row.deck_id);
    const matched=deck?.cards.find(c=>c.id===row.card_id&&c.type==='match');
    if(!matched)continue;
    if(!byDeck.has(deck.id))byDeck.set(deck.id,{deck,groups:new Map()});
    const group=byDeck.get(deck.id).groups;
    if(!group.has(matched.category))group.set(matched.category,[]);
    group.get(matched.category).push(cardTextForRole(matched,viewerRole()));
  }
  const sections=[...byDeck.values()].map(({deck,groups})=>
    '<section class="live-panel insights-deck"><h3>'+esc(deck.title)+'</h3>'+
    [...groups.entries()].map(([category,texts])=>
      '<div class="swipe-match-theme"><h4>'+esc(category)+'</h4><ul class="swipe-match-list">'+
      texts.map(t=>'<li><p>'+esc(t)+'</p></li>').join('')+'</ul></div>'
    ).join('')+
    '<button type="button" class="live-button" data-insight-open="'+esc(deck.id)+'">Öppna '+esc(deck.title)+'</button></section>'
  ).join('');
  const empty='<p class="live-muted">Inga gemensamma ja-svar att visa ännu. Ett kort syns först när ni båda har svarat ja.</p>';
  return title+'<section class="live-panel" aria-labelledby="insights-a-heading"><h2 id="insights-a-heading">Möjligt att utforska</h2>'+
    '<p class="live-muted">Endast serververifierade JA+JA på A-kort. Det här är möjligheter, inte färdiga överenskommelser.</p>'+
    (sections||empty)+'</section>'+
    '<section class="live-panel" aria-labelledby="insights-b-heading"><h2 id="insights-b-heading">'+
    (viewerRole()==='parent'?'Så här funkar min tonåring':'Så här funkar jag')+
    '</h2><p class="live-muted">Förståelsekort visas inte här ännu. Frivillig, återkallelig delning kräver en separat säker funktion och ett nytt aktivt val av tonåringen. Inga tidigare svar delas automatiskt.</p></section>'+
    '<button type="button" class="live-button" id="insights-retry">Uppdatera gemensamma insikter</button></div>';
}
async function fetchInsights(){
  const viewer=user?.id,session=sharedSession,request=++insightsRequest;
  // Fail closed: never retain a previous result during a new request,
  // family/session change, network error or partial multi-deck failure.
  insightsRows=[];insightsError='';insightsLoading=false;
  if(!sharedInsightsEnabled||!viewer||members.length!==2||!members.some(m=>m.user_id===viewer)||
     !members.some(m=>m.role==='parent')||!members.some(m=>m.role==='teen')||page()!=='insikter'){render();return;}
  insightsLoading=true;render();
  try{
    const responses=await Promise.all(INSIGHT_DECK_IDS.map(deckId=>db.rpc('shared_swipe_matches',{p_deck_id:deckId})));
    if(request!==insightsRequest||session!==sharedSession||user?.id!==viewer||page()!=='insikter')return;
    const safe=[];
    for(let i=0;i<INSIGHT_DECK_IDS.length;i++){
      const {data,error}=responses[i]||{};
      if(error||!Array.isArray(data))throw Error('Shared RPC unavailable');
      safe.push(...safeInsightMatches(INSIGHT_DECK_IDS[i],data));
    }
    insightsRows=safe;
  }catch(e){
    if(request!==insightsRequest||session!==sharedSession||user?.id!==viewer||page()!=='insikter')return;
    insightsRows=[];
    insightsError='Gemensamma insikter är inte tillgängliga just nu. Inga tidigare resultat visas.';
  }finally{
    if(request===insightsRequest&&session===sharedSession&&user?.id===viewer&&page()==='insikter'){
      insightsLoading=false;render();
    }
  }
}

// Only poll the authenticated, server-verified shared RPC for the currently visible deck.
// Never subscribe to, query or infer the other family member's private answers.
// Background tabs are paused, and the existing session/request guards reject stale replies.
async function pollSharedMatches(){
  if(!sharedPollingEnabled||sharedPollPending||sharedLoading||!user||members.length!==2||page()!=='swipe'||document.hidden)return;
  const deckId=activeThemeDeck||'general';
  if(!sharedDeck(deckId))return;
  sharedPollPending=true;
  try{await fetchSwipeMatches(deckId,{quiet:true});}
  finally{sharedPollPending=false;}
}

// Theme access no longer depends on completing the general deck. This check
// grants only private swipe access; all shared A results remain server-gated.
async function fetchThemeUnlock(){
  themesUnlocked=!!user&&members.length===2&&members.some(member=>member.user_id===user.id)&&members.some(member=>member.role==='parent')&&members.some(member=>member.role==='teen');
  themesLoading=false;themesError='';
  if(!themesUnlocked)activeThemeDeck=null;
  if(page()==='swipe'&&!swipeBusy)render();
}
function themeDecksView(){
  const unlocked=members.length===2&&themesUnlocked&&!themesLoading&&!themesError;
  const status=unlocked
    ?'Utforska kortlekarna i egen takt. Gemensamma ja kan visas direkt, även om kortlekarna inte är färdigspelade.'
    :'Koppla ihop en förälder och en tonåring för att öppna kortlekarna. Dina egna svar förblir privata.';
  return '<section class="swipe-themes" aria-labelledby="swipe-themes-heading"><h2 id="swipe-themes-heading">Fler kortlekar</h2>'+
    '<p class="live-muted" role="status">'+esc(status)+'</p>'+
    THEME_DECKS.map(deck=>card(unlocked
      ?'<details><summary><strong>'+esc(deck.title)+'</strong> · '+deck.cards.length+' kort</summary><p class="live-muted">Ämnen: '+esc([...new Set(THEME_DECK_MODELS.find(model=>model.id===deck.id).cards.map(item=>item.category))].join(' · '))+'</p></details><p class="live-muted">Din privata status: '+themeAnswers.get(deck.id).size+' / '+deck.cards.length+' kort</p><button type="button" class="live-button" data-theme-open="'+esc(deck.id)+'">'+(themeAnswers.get(deck.id).size===deck.cards.length?'Visa och ändra svar':'Öppna kortleken')+'</button>'
      :'<h3>'+esc(deck.title)+'</h3><p class="live-muted">Tillgänglig efter säker familjeparning.</p>'
    )).join('')+
    (themesError?'<button type="button" class="live-button" id="retry-theme-unlock">Kontrollera igen</button>':'')+
    '</section>';
}


function themeSwipeView(){
  const deck=THEME_DECKS.find(d=>d.id===activeThemeDeck);
  if(!deck||!themeAccessAllowed()){activeThemeDeck=null;return swipeView();}
  const answers=themeAnswers.get(deck.id),categories=themeCategories(deck),visible=themeVisibleIndices(deck),item=visible.includes(themeIndex)?deck.cards[themeIndex]:undefined;
  const itemText=item?cardTextForRole(themeCardModel(deck,themeIndex),viewerRole()):'',answered=visible.filter(index=>answers.has(themeCardId(deck,index))).length,ordinal=visible.indexOf(themeIndex)+1;
  const categoryLabel=themeCategory==='all'?'Alla kategorier':themeCategory;
  const filter=categories.length>1?'<div class="swipe-category-filter"><label for="theme-category">Välj kategori</label><select id="theme-category" aria-describedby="theme-category-status"><option value="all"'+(themeCategory==='all'?' selected':'')+'>Alla kategorier ('+deck.cards.length+')</option>'+categories.map(category=>'<option value="'+esc(category)+'"'+(themeCategory===category?' selected':'')+'>'+esc(category)+' ('+themeVisibleIndices(deck,category).length+')</option>').join('')+'</select><p id="theme-category-status" class="live-muted" role="status">'+answered+' av '+visible.length+' kort sparade i '+esc(categoryLabel)+'.</p></div>':'';
  return '<div class="swipe-experience swipe-theme-play"><header class="swipe-heading">'+
    '<button type="button" class="live-button swipe-theme-back" id="theme-back">← Alla kortlekar</button>'+
    '<span class="swipe-eyebrow">TEMAKORTLEK · PRIVATA SVAR</span><h1>'+esc(deck.title)+'</h1>'+
    '<p>Svara ja på sådant du vill prova eller prata om. Dina svar är privata. Ett ja är inte en bindande överenskommelse.</p>'+filter+'</header>'+
    '<div class="swipe-stage"><div class="swipe-stage-top"><span>'+esc(deck.title)+'</span><span role="status">'+
    (item?ordinal+' / '+visible.length:answered+' / '+visible.length+' sparade')+'</span></div>'+
    '<div class="swipe-track"><div class="swipe-track-fill" style="width:'+Math.round(100*(item?(themeReview?ordinal-1:answered):visible.length)/visible.length)+'%"></div></div>'+
    (item?'<div id="swipe-card" class="swipe-playing-card" tabindex="0" aria-label="Temakort '+ordinal+' av '+visible.length+' i '+esc(categoryLabel)+'. Svep höger för ja eller vänster för nej.">'+
      '<span class="swipe-stamp swipe-stamp-no" aria-hidden="true">NEJ</span><span class="swipe-stamp swipe-stamp-yes" aria-hidden="true">JA</span>'+
      '<span class="swipe-category">'+esc(themeCardModel(deck,themeIndex)?.category||deck.title)+'</span><h2>'+esc(itemText)+'</h2><span class="swipe-card-hint">Dra kortet åt höger eller vänster</span>'+importanceControl(deck.id,themeCardId(deck,themeIndex))+'</div>'+
      '<div class="swipe-actions"><button type="button" class="swipe-choice swipe-no" data-swipe="no" aria-label="Nej">✕ <span>Nej</span></button>'+
      '<button type="button" class="swipe-choice swipe-yes" data-swipe="yes" aria-label="Ja">♥ <span>Ja</span></button></div>'
      :'<div class="swipe-finished"><h2>Alla '+visible.length+' kort i '+esc(categoryLabel)+' är sparade</h2><p>Du kan gå igenom urvalet igen och ändra dina egna svar.</p>'+
       '<button type="button" class="live-button" id="theme-restart">Gå igenom igen</button></div>')+
    '<p id="swipe-save-status" class="swipe-disclaimer" role="status">'+
    esc(themeSaveError||'Ditt svar sparas privat i ditt konto. Gemensamt visas bara kort där ni båda svarat ja.')+'</p></div>'+swipeResults(deck.id)+insightsEntry()+'</div>';
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
  themeIndex=themeReview?nextThemeVisible(deck,index):nextThemeUnanswered(deck,index+1);
  swipeBusy=false;render();
  if(members.length===2)void fetchSwipeMatches(deckId);
}
function advanceThemeSwipe(direction){
  const deck=THEME_DECKS.find(d=>d.id===activeThemeDeck);
  if(swipeBusy||importanceSaving.size||page()!=='swipe'||!themeAccessAllowed()||!deck||themeIndex>=deck.cards.length)return;
  const el=$('swipe-card');if(!el)return;
  const index=themeIndex,deckId=deck.id,viewer=user.id,session=sharedSession;
  swipeBusy=true;
  const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if(!reduce){el.style.transform='translateX('+(direction==='yes'?'120vw':'-120vw')+') rotate('+(direction==='yes'?18:-18)+'deg)';el.style.opacity='0';}
  setTimeout(()=>saveThemeAnswer(direction,index,deckId,viewer,session),reduce?0:220);
}

function swipeView(){if(activeThemeDeck)return themeSwipeView();const total=visibleGeneralIndices().length,answered=visibleGeneralIndices().filter(i=>swipeAnswers.has(swipeCardId(i))).length,item=generalStatement(swipeIndex),isUnderstanding=GENERAL_CARDS[swipeIndex]?.type==='understanding',ordinal=visibleGeneralIndices().indexOf(swipeIndex)+1;if(swipeLoadError)return '<div class="swipe-experience"><header class="swipe-heading"><span class="swipe-eyebrow">UPPTÄCK VARANDRA</span><h1>Gillaswajpen</h1></header>'+card('<h2>Kunde inte hämta dina svar</h2><p role="alert">'+esc(swipeLoadError)+'</p><button class="live-button" type="button" id="swipe-reload">Försök igen</button>')+'</div>';return '<div class="swipe-experience"><header class="swipe-heading"><span class="swipe-eyebrow">UPPTÄCK VARANDRA</span><h1>Gillaswajpen</h1><p>Vad är viktigt för dig? Utforska korten i din egen takt.</p></header>'+(isUnderstanding?'<p class="swipe-understanding-notice">Förståelsekort: ditt svar sparas tills vidare privat. Delning med förälder är ännu inte aktiverad och gamla svar delas aldrig automatiskt.</p>':'')+'<div class="swipe-stage"><div class="swipe-stage-top"><span>ALLMÄNNA KORTLEKEN</span><span role="status">'+(item?ordinal+' / '+total:answered+' svar, '+skippedUnderstanding.size+' överhoppade av '+total)+'</span></div><div class="swipe-track"><div class="swipe-track-fill" style="width:'+Math.round(100*(item?(swipeReview?ordinal-1:answered+skippedUnderstanding.size):total)/total)+'%"></div></div>'+(item?'<div id="swipe-card" class="swipe-playing-card" tabindex="0" aria-label="Kort '+ordinal+' av '+total+'. Svep höger för ja eller vänster för nej."><span class="swipe-stamp swipe-stamp-no" aria-hidden="true">NEJ</span><span class="swipe-stamp swipe-stamp-yes" aria-hidden="true">JA</span><span class="swipe-category">'+esc(item[0])+'</span><h2>'+esc(item[1])+'</h2><span class="swipe-card-hint">Dra kortet åt höger eller vänster</span>'+importanceControl('general',swipeCardId(swipeIndex))+'</div><div class="swipe-actions"><button type="button" class="swipe-choice swipe-no" data-swipe="no" aria-label="Nej">✕ <span>Nej</span></button><button type="button" class="swipe-choice swipe-yes" data-swipe="yes" aria-label="Ja">♥ <span>Ja</span></button></div>'+(isUnderstanding?'<button type="button" id="swipe-skip" class="swipe-skip">Vill inte svara just nu</button>':''):'<div class="swipe-finished"><h2>Alla '+total+' kort genomgångna</h2><p>Du har sparat '+answered+' svar'+(skippedUnderstanding.size?' och hoppat över '+skippedUnderstanding.size+' förståelsekort':'')+'. Du kan gå igenom korten igen och ändra dina egna svar.</p><button class="live-button" type="button" id="swipe-restart">Gå igenom igen</button></div>')+'<p id="swipe-save-status" class="swipe-disclaimer" role="status">'+(swipeSaveError?esc(swipeSaveError):(isUnderstanding?'Ditt svar sparas privat. Förståelsekort delas inte förrän säker delning är aktiverad.':'Ditt svar sparas privat i ditt konto. Matchningskort visas gemensamt först när båda svarat ja.'))+'</p></div>'+swipeResults()+insightsEntry()+themeDecksView()+'</div>';}
async function saveSwipeAnswer(direction,index,viewer,session){
  // An animated swipe can finish after sign-out or a switch to another account.
  // Never write or render its result in the new user's session.
  if(user?.id!==viewer||sharedSession!==session)return;
  const statusEl=$('swipe-save-status');if(statusEl)statusEl.textContent='Sparar ditt svar…';
  const row={user_id:viewer,deck_id:'general',card_id:swipeCardId(index),answer:direction==='yes',updated_at:new Date().toISOString()};
  let error;
  try{
    if(GENERAL_CARDS[index]?.type==='understanding')({error}=await db.rpc('set_understanding_card_state',{p_card_id:row.card_id,p_answer:row.answer,p_skipped:false}));
    else ({error}=await db.from('swipe_answers').upsert(row,{onConflict:'user_id,deck_id,card_id'}));
  }
  catch(e){error=e;}
  if(user?.id!==viewer||sharedSession!==session)return;
  if(error){swipeSaveError='Svaret kunde inte sparas. Kortet ligger kvar så att du kan försöka igen.';swipeBusy=false;render();return;}
  swipeAnswers.set(row.card_id,row.answer);
  skippedUnderstanding.delete(row.card_id);
  swipeSaveError='';
  swipeIndex=swipeReview?nextVisibleAfter(index):nextUnanswered(index+1);
  swipeBusy=false;render();
  if(members.length===2){
    void fetchSwipeMatches('general');
    // A parent sees only 21 match cards; a teen can also skip 13 understanding cards.
    if(visibleGeneralIndices().every(i=>swipeAnswers.has(swipeCardId(i))||skippedUnderstanding.has(swipeCardId(i))))void fetchThemeUnlock();
  }
}
async function skipUnderstandingCard(index,viewer,session){
  const cardId=swipeCardId(index);
  if(swipeBusy||user?.id!==viewer||sharedSession!==session||viewerRole()!=='teen'||GENERAL_CARDS[index]?.type!=='understanding')return;
  swipeBusy=true;swipeSaveError='';
  const statusEl=$('swipe-save-status');if(statusEl)statusEl.textContent='Sparar ditt val…';
  let error;
  try{({error}=await db.rpc('set_understanding_card_state',{p_card_id:cardId,p_answer:null,p_skipped:true}));}
  catch(e){error=e;}
  if(user?.id!==viewer||sharedSession!==session)return;
  if(error){swipeSaveError='Överhoppningen kunde inte sparas. Kortet ligger kvar så att du kan försöka igen.';swipeBusy=false;render();return;}
  swipeAnswers.delete(cardId);
  skippedUnderstanding.add(cardId);
  swipeIndex=swipeReview?nextVisibleAfter(index):nextUnanswered(index+1);
  swipeBusy=false;render();
  if(members.length===2&&visibleGeneralIndices().every(i=>swipeAnswers.has(swipeCardId(i))||skippedUnderstanding.has(swipeCardId(i))))void fetchThemeUnlock();
}
function nextVisibleAfter(index){return visibleGeneralIndices().find(i=>i>index)??STATEMENTS.length;}
function advanceSwipe(direction){if(activeThemeDeck){advanceThemeSwipe(direction);return;}if(swipeBusy||importanceSaving.size||page()!=='swipe'||!user||swipeIndex>=STATEMENTS.length||!visibleGeneralIndices().includes(swipeIndex))return;const el=$('swipe-card');if(!el)return;const index=swipeIndex,viewer=user.id,session=sharedSession;swipeBusy=true;const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;if(!reduce){el.style.transform='translateX('+(direction==='yes'?'120vw':'-120vw')+') rotate('+(direction==='yes'?18:-18)+'deg)';el.style.opacity='0';}setTimeout(()=>saveSwipeAnswer(direction,index,viewer,session),reduce?0:220);}
function setupSwipeGesture(){const el=$('swipe-card');if(!el)return;let start=null;const reset=()=>{start=null;el.style.transform='';el.classList.remove('swipe-dragging','swipe-preview-yes','swipe-preview-no');};el.addEventListener('pointerdown',e=>{if(e.target.closest?.('[data-importance-control]')||(e.button!==undefined&&e.button!==0))return;start={id:e.pointerId,x:e.clientX,y:e.clientY,dragging:false};});el.addEventListener('pointermove',e=>{if(!start||start.id!==e.pointerId||swipeBusy)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(!start.dragging&&Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>12){start=null;return;}if(Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)){start.dragging=true;el.setPointerCapture?.(e.pointerId);}if(!start.dragging)return;el.classList.add('swipe-dragging');el.classList.toggle('swipe-preview-yes',dx>35);el.classList.toggle('swipe-preview-no',dx< -35);el.style.transform='translateX('+dx+'px) rotate('+Math.max(-13,Math.min(13,dx/18))+'deg)';});el.addEventListener('pointerup',e=>{if(!start||start.id!==e.pointerId)return;const dx=e.clientX-start.x,dragged=start.dragging;reset();if(dragged&&Math.abs(dx)>=85)advanceSwipe(dx>0?'yes':'no');});el.addEventListener('pointercancel',reset);}

function page(){const h=decodeURIComponent(location.hash.slice(1));return h==='insikter'?'insikter':nav.some(n=>n[0]===h)?h:'hem';}
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
 if(key==='insikter')return insightsView();
if(key==='kommunikation')return '<h1>Kommunikationsråd</h1><p>Konkreta samtalsöppningar från den tidigare Hemmakompassen.</p>'+COMMUNICATION_GUIDES.map(([title,intro,tips])=>card('<h2>'+esc(title)+'</h2><p>'+esc(intro)+'</p><ul>'+tips.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul>')).join('');
return '<h1>'+label+'</h1>'+card('<h2>Funktionen är under utveckling</h2><p>Du är inloggad som '+esc(profile?.display_name||user.email)+'. Vi bygger nu den riktiga kopplingen till Supabase så att dina svar och den andra familjemedlemmens uppgifter hålls åtskilda.</p><p>Här visas inga påhittade demodata och inga svar lagras lokalt som om de vore delade med familjen.</p><a class="live-button" href="#hem">Till startsidan</a>');
}
function render(){if(activeThemeDeck&&!themeAccessAllowed())activeThemeDeck=null;menu();$('live-app').innerHTML=user?(page()==='hem'?home():section(page())):login();setupSwipeGesture();$('sidebar-account').textContent=user?'Inloggad: '+(profile?.display_name||user.email):'Inte inloggad';$('account-link').textContent=user?'Ditt konto →':'Logga in →';}
async function refresh(){
const generation=++refreshGeneration;
let authResult;
try{authResult=await db.auth.getUser();}
catch(e){if(generation!==refreshGeneration)return;throw e;}
if(generation!==refreshGeneration)return;
const {data:{user:u},error}=authResult;if(error&&error.name!=='AuthSessionMissingError')throw error;user=u;profile=null;members=[];swipeAnswers.clear();swipeImportance.clear();importancePending.clear();importanceSaving.clear();importanceAvailable=false;importanceLoadError='';skippedUnderstanding.clear();for(const answers of themeAnswers.values())answers.clear();activeThemeDeck=null;themeCategory='all';themeIndex=0;themeReview=false;themeSaveError='';swipeBusy=false;swipeLoadError='';swipeSaveError='';swipeReview=false;swipeIndex=0;sharedMatches=[];sharedPriorities=[];sharedDeckId='general';sharedError='';sharedLoading=false;sharedSession++;sharedRequest++;insightsRows=[];insightsLoading=false;insightsError='';insightsRequest++;themesUnlocked=false;themesLoading=false;themesError='';themesRequest++;
if(user){const viewer=user.id;
let loaded;
try{loaded=await Promise.all([db.from('profiles').select('display_name').eq('user_id',viewer).maybeSingle(),db.rpc('my_family_members'),db.from('swipe_answers').select('deck_id,card_id,answer').eq('user_id',viewer),db.from('swipe_skips').select('deck_id,card_id').eq('user_id',viewer),db.from('swipe_importance').select('deck_id,card_id,importance').eq('user_id',viewer)]);}
catch(e){if(generation!==refreshGeneration)return;throw e;}
if(generation!==refreshGeneration||user?.id!==viewer)return;
const [p,m,s,k,i]=loaded;if(p.error)throw p.error;if(m.error)throw m.error;profile=p.data;members=m.data||[];if(s.error||k.error)swipeLoadError='Kontrollera anslutningen och försök igen.';else for(const answer of s.data||[])if(answer.deck_id==='general'&&typeof answer.answer==='boolean'&&STATEMENTS.some((_,index)=>swipeCardId(index)===answer.card_id))swipeAnswers.set(answer.card_id,answer.answer);
if(!s.error)for(const answer of s.data||[]){
  if(typeof answer.answer!=='boolean')continue;
  const deck=THEME_DECKS.find(d=>d.id===answer.deck_id);
  if(deck&&deck.cards.some((_,index)=>themeCardId(deck,index)===answer.card_id))themeAnswers.get(deck.id).set(answer.card_id,answer.answer);
}if(!k.error)for(const skipped of k.data||[])if(skipped.deck_id==='general'&&GENERAL_CARDS.some(card=>card.id===skipped.card_id&&card.type==='understanding'))skippedUnderstanding.add(skipped.card_id);
if(i.error)importanceLoadError='Den säkra lagringen är inte aktiverad.';else{importanceAvailable=true;for(const row of i.data||[])if([-1,0,1].includes(row.importance)&&validImportanceCard(row.deck_id,row.card_id))swipeImportance.set(importanceKey(row.deck_id,row.card_id),row.importance);}
swipeIndex=nextUnanswered();}
if(generation!==refreshGeneration)return;
render();
if(user&&members.length===2){void fetchSwipeMatches('general');void fetchThemeUnlock();}
if(page()==='insikter')void fetchInsights();
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-swipe]');if(b)advanceSwipe(b.dataset.swipe);if(e.target.closest('#swipe-restart')){swipeReview=true;swipeIndex=visibleGeneralIndices()[0]??STATEMENTS.length;render();}if(e.target.closest('#swipe-skip')&&viewerRole()==='teen'&&GENERAL_CARDS[swipeIndex]?.type==='understanding'&&!swipeBusy)void skipUnderstandingCard(swipeIndex,user.id,sharedSession);if(e.target.closest('#swipe-reload'))refresh().catch(showError);const refreshMatches=e.target.closest('[data-refresh-matches]');if(refreshMatches&&!sharedLoading)void fetchSwipeMatches(refreshMatches.dataset.refreshMatches);if(e.target.closest('#retry-theme-unlock')&&!themesLoading)void fetchThemeUnlock();
if(e.target.closest('#insights-retry')&&!insightsLoading)void fetchInsights();
const insightOpen=e.target.closest('[data-insight-open]');
if(insightOpen&&sharedInsightsEnabled&&themeAccessAllowed()){
  const id=insightOpen.dataset.insightOpen;
  if(id==='general'){activeThemeDeck=null;location.hash='swipe';void fetchSwipeMatches('general');}
  else{const deck=THEME_DECKS.find(d=>d.id===id);if(deck){activeThemeDeck=id;themeCategory='all';themeIndex=nextThemeUnanswered(deck);themeReview=false;location.hash='swipe';void fetchSwipeMatches(id);}}
}
const open=e.target.closest('[data-theme-open]');
if(open&&themeAccessAllowed()){
  const deck=THEME_DECKS.find(d=>d.id===open.dataset.themeOpen);
  if(deck){activeThemeDeck=deck.id;themeCategory='all';themeIndex=nextThemeUnanswered(deck);themeReview=false;themeSaveError='';void fetchSwipeMatches(deck.id);render();window.scrollTo(0,0);}
}
if(e.target.closest('#theme-back')){activeThemeDeck=null;themeCategory='all';themeReview=false;void fetchSwipeMatches('general');render();window.scrollTo(0,0);}
if(e.target.closest('#theme-restart')&&themeAccessAllowed()){const deck=THEME_DECKS.find(d=>d.id===activeThemeDeck);if(deck){themeReview=true;themeIndex=themeVisibleIndices(deck)[0]??deck.cards.length;themeSaveError='';render();}}
});
document.addEventListener('input',e=>{if(!e.target.matches?.('[data-importance]'))return;e.target.setAttribute('aria-valuetext',importanceValueText(Number(e.target.value)));});
document.addEventListener('change',e=>{
  if(e.target.matches?.('#theme-category')&&activeThemeDeck&&themeAccessAllowed()){
    const deck=THEME_DECKS.find(d=>d.id===activeThemeDeck),category=e.target.value;
    if(deck&&(category==='all'||themeCategories(deck).includes(category))){themeCategory=category;themeReview=false;themeIndex=nextThemeUnanswered(deck,0,category);themeSaveError='';render();$('theme-category')?.focus();}
    return;
  }
  if(!e.target.matches?.('[data-importance]')||!user)return;
  void saveImportance(e.target.dataset.deckId,e.target.dataset.cardId,Number(e.target.value),user.id,sharedSession);
});
document.addEventListener('keydown',e=>{if(page()==='swipe'&&user&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();advanceSwipe(e.key==='ArrowRight'?'yes':'no');}});
document.addEventListener('submit',async e=>{if(e.target.id!=='live-login')return;e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;const feedback=$('login-feedback');feedback.textContent='Loggar in…';const email=$('live-email').value.trim();try{const {error}=await db.auth.signInWithPassword({email,password:$('live-password').value});if(error)throw error;$('live-password') && ($('live-password').value='');await refresh();}catch(err){feedback.textContent='Kunde inte logga in. Kontrollera e-post och lösenord, eller välj ”Glömt lösenord eller saknar lösenord?”.';}finally{b.disabled=false;}});
window.addEventListener('hashchange',()=>{
  if(page()!=='insikter'){insightsRows=[];insightsError='';insightsLoading=false;insightsRequest++;}
  render();window.scrollTo(0,0);
  if(page()==='insikter')void fetchInsights();
  if(page()==='swipe')void pollSharedMatches();
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void pollSharedMatches();});
window.addEventListener('focus',()=>void pollSharedMatches());
window.setInterval(()=>void pollSharedMatches(),SHARED_POLL_INTERVAL_MS);
db.auth.onAuthStateChange(()=>setTimeout(()=>refresh().catch(showError),0));
function showError(e){$('live-app').innerHTML=card('<h2>Kunde inte läsa kontot</h2><p>'+esc(e.message)+'</p><a href="./konto.html">Öppna kontosidan</a>');}
refresh().catch(showError);
