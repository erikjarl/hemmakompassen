import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
import {createPersonalityExperience} from './personality/ipip50-ui.js';
import {GENERAL_CARDS,THEME_DECK_MODELS,ADVICE_BY_KEY,adviceKeyForCard,cardTextForRole} from './card-catalog.js';
const c=window.HEMMAKOMPASSEN_BACKEND;
const sharedPrioritiesEnabled=c.enableSharedPriorities===true;
// Do not activate background polling until the server-side A allowlist and
// authenticated two-account revocation tests have been approved.
const sharedPollingEnabled=c.enableSharedPolling===true;
// The all-deck insights page remains OFF until the server A allowlist and
// authenticated two-account tests are verified. B sharing has a separate gate.
const sharedInsightsEnabled=c.enableSharedInsights===true;
const sharedUnderstandingEnabled=c.enableSharedUnderstanding===true;
const schysstaListEnabled=c.enableSchysstaList===true;
const personalitySharingEnabled=c.enablePersonalitySharing===true;
const db=createClient(c.supabaseUrl,c.supabasePublishableKey,{auth:{flowType:'pkce',detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const nav=[['hem','Hem'],['inkorg','Inkorg'],['swipe','Gillaswajpen'],['personlighet','Min personlighet'],['kommunikation','Kommunikationsråd'],['regler','Schyssta listan'],['medlare','AI-medlaren'],['installningar','Inställningar']];
const SCHYSSTA_RULES=Object.freeze({
  'regler-01':'Vi knackar innan vi går in i varandras rum.',
  'regler-02':'Vi lyssnar färdigt innan vi svarar.',
  'regler-03':'Vi får pausa gräl och bestämmer när vi pratar vidare.',
  'regler-04':'Vi frågar innan vi lånar varandras saker.',
  'regler-05':'Vi pratar om hur sysslorna ska fördelas.',
  'regler-06':'Vi berättar när planer som berör andra ändras.',
  'regler-07':'Vi kommer överens om tider för sömn och hemkomst.',
  'regler-08':'Vi kan ompröva regler som inte fungerar.',
  'regler-09':'Vi bestämmer gemensamma mobilfria stunder.',
  'regler-10':'Vi försöker prata utan att höja rösten.',
  'regler-11':'Vi får säga till när något känns orättvist.',
  'regler-12':'Vi försöker reda ut saker efter ett bråk.'
});
const COMMUNICATION_GUIDES=[["Vi har svårt att lyssna","När båda vill bli förstådda kan samtalet lätt bli en tävling om att få rätt.",["Försök återge vad den andra menade innan du svarar.","Ställ en nyfiken fråga: Vad är det viktigaste för dig här?","Den som lyssnar måste inte hålla med."]],["Vi bråkar om regler","Regelkonflikter handlar ofta både om praktiska behov och om självständighet.",["Beskriv konkret vad som behöver fungera hemma.","Låt båda formulera vad de vill skydda: frihet, trygghet, sömn eller tillit.","Skriv ett tidsbegränsat förslag i Schyssta listan och utvärdera tillsammans."]],["Vi har hamnat i ett gräl","Det kan vara svårt att lösa problem när stressen redan är hög.",["Ta en överenskommen paus och säg när du kommer tillbaka.","Beskriv senare vad som hände utan anklagelser.","Fråga vad var och en skulle behöva nästa gång."]],["Vi pratar nästan aldrig","Kontakt kan ibland börja i små, kravlösa stunder.",["Föreslå tio minuter tillsammans utan mål att lösa något.","Ställ en fråga från Gillaswajpen och var nyfiken på svaret.","Skilj mellan att vara tillsammans och att prestera ett bra samtal."]]];
const STATEMENTS=GENERAL_CARDS.map(card=>[card.category,card.teenText]);
const THEME_DECKS=THEME_DECK_MODELS.map(deck=>({...deck,cards:deck.cards.map(card=>card.teenText),cardIds:deck.cards.map(card=>card.id)}));
let user=null,profile=null,members=[],refreshGeneration=0;
const personalityExperience=createPersonalityExperience({db,isSharingEnabled:personalitySharingEnabled,onRender:()=>{if(user&&page()==='personlighet')render();}});
let swipeIndex=0,swipeBusy=false,swipeReview=false,swipeLoadError='',swipeSaveError='';
let sharedMatches=[],sharedPriorities=[],sharedDeckId='general',sharedError='',sharedLoading=false,sharedSession=0,sharedRequest=0;
let sharedPollPending=false;
let insightsRows=[],insightsLoading=false,insightsError='',insightsRequest=0;
let sharedUnderstandingRows=[],understandingShareError='';
let schysstaSuggestions=[],schysstaRules=[],schysstaManualRules=[],schysstaNotifications=[],schysstaReplacementLinks=[],schysstaHistory=[],schysstaEndTarget=null,schysstaLoading=false,schysstaError='',schysstaRequest=0;
let schysstaDraft='',schysstaDraftOpen=false,schysstaDraftKey=null,schysstaEditTarget=null,schysstaSubmitting=false,schysstaMessage='',schysstaCopyMessage='',schysstaFocusId='',schysstaSearch='',schysstaFilterStatus='all';
const schysstaSaving=new Set();
// Independent of agreement notifications: a current family's private 1:1 conversation.
let familyChatMessages=[],familyChatUnread=0,familyChatLoading=false,familyChatLoadingOlder=false,
  familyChatHasMore=false,familyChatError='',familyChatStatus='',familyChatDraft='',
  familyChatRequestKey=null,familyChatSending=false,familyChatRequest=0,familyChatCountRequest=0;
const familyChatTimestamp=timestamp=>new Intl.DateTimeFormat('sv-SE',{dateStyle:'medium',timeStyle:'short'}).format(new Date(timestamp));
function validFamilyChatRows(rows){
  return Array.isArray(rows)&&rows.length<=50
    &&rows.every(m=>m&&typeof m==='object'&&!Array.isArray(m)
      &&Object.keys(m).length===5
      &&Object.keys(m).every(k=>['message_id','body','sent_by_me','created_at','read_at'].includes(k))
      &&SCHYSSTA_UUID.test(m.message_id)&&typeof m.body==='string'&&m.body.length>=1&&m.body.length<=1500
      &&typeof m.sent_by_me==='boolean'
      &&typeof m.created_at==='string'&&!Number.isNaN(Date.parse(m.created_at))
      &&(m.read_at===null||(typeof m.read_at==='string'&&!Number.isNaN(Date.parse(m.read_at)))))
    &&new Set(rows.map(m=>m.message_id)).size===rows.length;
}
function clearFamilyChat(){
  familyChatRequest++;familyChatCountRequest++;
  familyChatMessages=[];familyChatUnread=0;familyChatLoading=false;familyChatLoadingOlder=false;
  familyChatHasMore=false;familyChatError='';familyChatStatus='';familyChatDraft='';
  familyChatRequestKey=null;familyChatSending=false;
}
async function fetchFamilyChatUnread(){
  if(!user||members.length!==2){familyChatUnread=0;return;}
  const request=++familyChatCountRequest,viewer=user.id,session=sharedSession;
  let result;
  try{result=await db.rpc('my_family_unread_message_count');}catch(e){result={error:e};}
  if(request!==familyChatCountRequest||user?.id!==viewer||sharedSession!==session)return;
  if(result?.error||!Number.isInteger(result?.data)||result.data<0){
    familyChatUnread=0;
  }else familyChatUnread=result.data;
  if(['hem','regler'].includes(page()))render();
  else menu();
}
async function fetchFamilyChat(older=false){
  if(!user||members.length!==2)return;
  if(older?(!familyChatHasMore||familyChatLoadingOlder||familyChatLoading):familyChatLoading)return;
  const viewer=user.id,session=sharedSession,request=++familyChatRequest;
  const oldest=older?familyChatMessages[familyChatMessages.length-1]:null;
  familyChatError='';familyChatStatus='';
  if(older)familyChatLoadingOlder=true;else familyChatLoading=true;
  if(page()==='inkorg'&&!familyChatDraft.trim())render();
  let result,timer;
  try{
    result=await Promise.race([
      db.rpc('my_family_messages',{
        p_before_created_at:oldest?.created_at||null,p_before_id:oldest?.message_id||null
      }),
      new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Message request timed out')),15000);})
    ]);
  }catch(e){result={error:e};}
  finally{clearTimeout(timer);}
  if(request!==familyChatRequest||viewer!==user?.id||session!==sharedSession)return;
  if(older)familyChatLoadingOlder=false;else familyChatLoading=false;
  if(result?.error||!validFamilyChatRows(result.data)){
    familyChatError='Kunde inte hämta meddelandena. Kontrollera anslutningen och försök igen.';
    if(!older){familyChatMessages=[];familyChatHasMore=false;familyChatUnread=0;}
  }else{
    familyChatMessages=older?[...familyChatMessages,...result.data]:result.data;
    familyChatHasMore=result.data.length===50;
    if(!older&&page()==='inkorg'){
      // Reading the conversation is not an approval of any proposal.
      let marked;
      try{marked=await db.rpc('mark_family_messages_read');}catch(e){marked={error:e};}
      if(request!==familyChatRequest||viewer!==user?.id||session!==sharedSession)return;
      if(!marked?.error&&Number.isInteger(marked?.data)&&marked.data>=0){
        familyChatUnread=0;
        // Refresh sender-side delivery/read ticks with later fetches, never forge remote approval.
        familyChatMessages=familyChatMessages.map(m=>m.sent_by_me?m:{...m,read_at:m.read_at||new Date().toISOString()});
      }else familyChatStatus='Meddelandena visas, men kunde inte markeras som lästa.';
    }
  }
  if(page()==='inkorg'&&!familyChatDraft.trim())render();
  else menu();
}
async function sendFamilyChatMessage(){
  if(!user||members.length!==2||familyChatSending)return;
  const body=familyChatDraft.trim();
  if(!body||body.length>1500){familyChatStatus='Skriv ett meddelande med högst 1 500 tecken.';render();return;}
  if(!familyChatRequestKey)familyChatRequestKey=crypto.randomUUID();
  const viewer=user.id,session=sharedSession,token=familyChatRequestKey;
  familyChatSending=true;familyChatStatus='Skickar meddelandet…';render();
  let result;
  try{result=await db.rpc('send_family_message',{p_body:body,p_request_key:token});}catch(e){result={error:e};}
  if(viewer!==user?.id||session!==sharedSession)return;
  familyChatSending=false;
  if(result?.error||!SCHYSSTA_UUID.test(result?.data)){
    familyChatStatus='Meddelandet kunde inte skickas. Försök igen – inget nytt meddelande skapas vid ett identiskt återförsök.';
    render();return;
  }
  familyChatDraft='';familyChatRequestKey=null;familyChatStatus='Meddelandet har skickats.';
  await fetchFamilyChat();
}
// A local, session-only pause never records a NO vote or changes shared data.
const schysstaPausedIds=new Set();
const understandingShares=new Set();
const understandingShareSaving=new Set();
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
const firstSentence=text=>String(text||'').match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim()||String(text||'').trim();
const summaryIconFor=(category,advice='')=>{
  const value=(String(advice)+' '+String(category)).toLocaleLowerCase('sv-SE');
  if(/mobil|skärm|teknik|digital|medier/.test(value))return {name:'Mobil',path:'M8 2.5h8a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2Zm1 3h6m-4 13h2'};
  if(/samtal|konflikt|känsl|tillit|värdering/.test(value))return {name:'Samtal',path:'M4 5.5h11a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3H9l-4 3v-3H4a3 3 0 0 1-3-3v-3a3 3 0 0 1 3-3Zm5 12h6l4 3v-3h1a3 3 0 0 0 3-3v-3a3 3 0 0 0-2-2.83'};
  if(/relation|uppskatt|gemenskap|vän/.test(value))return {name:'Relation',path:'M12 20.5 3.8 12.7A5.2 5.2 0 0 1 11 5.2l1 1 1-1a5.2 5.2 0 0 1 7.2 7.5Z'};
  if(/vardag|rutin|lugn|återhämt|förändring|hemma|hjälpa/.test(value))return {name:'Tid och vardag',path:'M12 3a9 9 0 1 1-9 9 9 9 0 0 1 9-9Zm0 4v5l3.5 2'};
  return {name:'Gemensam aktivitet',path:'M5 3v3m14-3v3M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z'};
};
const summaryIcon=icon=>'<svg class="swipe-summary-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="'+icon.path+'"/></svg>';
const sharedDeck=deckId=>deckId==='general'
  ?{id:'general',title:'Allmänna kortleken',cards:GENERAL_CARDS}
  :THEME_DECK_MODELS.find(deck=>deck.id===deckId);
function sharedSummary(groups,deckId='general',priorityIds=new Set()){
  const role=viewerRole();
  const roleLabel=role==='parent'?'förälder':role==='teen'?'tonåring':'familjemedlem';
  const paragraphs=[];
  const overview=[];
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
    const icon=summaryIconFor(category,advice);
    const concise=firstSentence(advice)||('Utforska '+joinSwedish(cardTexts)+'.');
    overview.push('<li>'+summaryIcon(icon)+'<div><h4>'+esc(category)+'</h4><span class="swipe-summary-icon-label">'+esc(icon.name)+': </span><p>'+esc(concise)+'</p></div></li>');
  }
  const opening=role==='parent'
    ?'Fråga gärna tonåringen vad hen vill börja med och lyssna färdigt innan du föreslår något.'
    :role==='teen'
      ?'Välj gärna själv vad du vill börja prata om; ett ja betyder inte att du måste göra något direkt.'
      :'Välj tillsammans något som känns enkelt att börja med.';
  if(!paragraphs.length)return '';
  return '<aside class="swipe-rule-summary" aria-labelledby="shared-summary-heading"><span class="swipe-summary-label">REDAKTIONELLA RÅD · INTE AI</span><h3 id="shared-summary-heading">Gemensamma möjligheter – '+esc(roleLabel)+'</h3>'+
    '<ul class="swipe-summary-overview">'+overview.join('')+'</ul>'+
    '<details class="swipe-summary-details"><summary>Läs mer om råden och vad de bygger på</summary><div>'+paragraphs.join('')+'<p>'+esc(opening)+'</p></div></details>'+
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
// The B channel has a separate RPC and allowlist. It never accepts an answer,
// priority or A-match shape from the browser or from a malformed response.
function safeSharedUnderstanding(rows){
  if(!Array.isArray(rows))throw Error('Invalid shared understanding results');
  const safe=new Map();
  for(const row of rows){
    if(row?.deck_id!=='general')continue;
    const matched=GENERAL_CARDS.find(card=>card.id===row.card_id&&card.type==='understanding');
    if(matched)safe.set(matched.id,matched);
  }
  return [...safe.values()];
}
function understandingInsights(){
  if(!sharedUnderstandingEnabled)return '<p class="live-muted">Förståelsekort visas inte här ännu. Frivillig, återkallelig delning kräver en separat säker funktion och ett nytt aktivt val av tonåringen. Inga tidigare svar delas automatiskt.</p>';
  const shared=safeSharedUnderstanding(sharedUnderstandingRows);
  const sharedList=shared.length
    ?'<ul class="swipe-match-list">'+shared.map(card=>'<li><p>'+esc(cardTextForRole(card,viewerRole()))+'</p></li>').join('')+'</ul>'
    :'<p class="live-muted">Inga förståelsekort är aktivt delade just nu.</p>';
  if(viewerRole()!=='teen')return sharedList+'<p class="live-muted">Det här är tonåringens frivilligt delade budskap, inte A-matchningar eller överenskommelser.</p>';
  const eligible=GENERAL_CARDS.filter(card=>card.type==='understanding'&&swipeAnswers.get(card.id)===true);
  const controls=eligible.length
    ?'<ul class="swipe-match-list understanding-share-list">'+eligible.map(card=>{
      const active=understandingShares.has(card.id),saving=understandingShareSaving.has(card.id);
      return '<li><p>'+esc(card.teenText)+'</p><button type="button" class="live-button" data-understanding-share="'+esc(card.id)+'" aria-pressed="'+active+'"'+(saving?' disabled':'')+'>'+(active?'Återkalla delning':'Dela med min förälder')+'</button></li>';
    }).join('')+'</ul>'
    :'<p class="live-muted">Svara ja på ett förståelsekort för att kunna välja delning här.</p>';
  const error=understandingShareError?'<p role="alert">'+esc(understandingShareError)+'</p>':'';
  return sharedList+'<div class="understanding-consent"><h3>Du bestämmer vad som delas</h3><p>Varje knapp gäller bara det angivna budskapet. Ett delat förståelsekort blir aldrig en A-matchning eller en överenskommelse. Du kan återkalla delningen när som helst.</p>'+error+controls+'</div>';
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
    '</h2>'+understandingInsights()+'</section>'+
    '<button type="button" class="live-button" id="insights-retry">Uppdatera gemensamma insikter</button></div>';
}
async function fetchInsights(){
  const viewer=user?.id,session=sharedSession,request=++insightsRequest;
  // Fail closed: never retain a previous result during a new request,
  // family/session change, network error or partial multi-deck failure.
  insightsRows=[];sharedUnderstandingRows=[];insightsError='';insightsLoading=false;
  if(!sharedInsightsEnabled||!viewer||members.length!==2||!members.some(m=>m.user_id===viewer)||
     !members.some(m=>m.role==='parent')||!members.some(m=>m.role==='teen')||page()!=='insikter'){render();return;}
  insightsLoading=true;render();
  try{
    const [responses,understandingResponse]=await Promise.all([
      Promise.all(INSIGHT_DECK_IDS.map(deckId=>db.rpc('shared_swipe_matches',{p_deck_id:deckId}))),
      sharedUnderstandingEnabled?db.rpc('shared_understanding_cards'):Promise.resolve({data:[],error:null})
    ]);
    if(request!==insightsRequest||session!==sharedSession||user?.id!==viewer||page()!=='insikter')return;
    const safe=[];
    for(let i=0;i<INSIGHT_DECK_IDS.length;i++){
      const {data,error}=responses[i]||{};
      if(error||!Array.isArray(data))throw Error('Shared RPC unavailable');
      safe.push(...safeInsightMatches(INSIGHT_DECK_IDS[i],data));
    }
    insightsRows=safe;
    if(understandingResponse?.error||!Array.isArray(understandingResponse?.data))throw Error('Shared understanding RPC unavailable');
    sharedUnderstandingRows=safeSharedUnderstanding(understandingResponse.data).map(card=>({deck_id:'general',card_id:card.id}));
  }catch(e){
    if(request!==insightsRequest||session!==sharedSession||user?.id!==viewer||page()!=='insikter')return;
    insightsRows=[];
    sharedUnderstandingRows=[];
    insightsError='Gemensamma insikter är inte tillgängliga just nu. Inga tidigare resultat visas.';
  }finally{
    if(request===insightsRequest&&session===sharedSession&&user?.id===viewer&&page()==='insikter'){
      insightsLoading=false;render();
    }
  }
}

async function setUnderstandingShare(cardId,share,viewer,session){
  const card=GENERAL_CARDS.find(candidate=>candidate.id===cardId&&candidate.type==='understanding');
  if(!sharedUnderstandingEnabled||!card||viewerRole()!=='teen'||user?.id!==viewer||sharedSession!==session||members.length!==2||understandingShareSaving.has(cardId))return;
  if(share&&swipeAnswers.get(cardId)!==true)return;
  understandingShareSaving.add(cardId);understandingShareError='';render();
  let error;
  try{({error}=await db.rpc('set_understanding_card_share',{p_card_id:cardId,p_share:share}));}
  catch(e){error=e;}
  if(user?.id!==viewer||sharedSession!==session)return;
  understandingShareSaving.delete(cardId);
  if(error){understandingShareError='Delningen kunde inte ändras. Ditt privata svar är oförändrat.';render();return;}
  if(share)understandingShares.add(cardId);else understandingShares.delete(cardId);
  await fetchInsights();
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
  if(GENERAL_CARDS[index]?.type==='understanding')understandingShares.delete(row.card_id);
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
  understandingShares.delete(cardId);
  swipeIndex=swipeReview?nextVisibleAfter(index):nextUnanswered(index+1);
  swipeBusy=false;render();
  if(members.length===2&&visibleGeneralIndices().every(i=>swipeAnswers.has(swipeCardId(i))||skippedUnderstanding.has(swipeCardId(i))))void fetchThemeUnlock();
}
function nextVisibleAfter(index){return visibleGeneralIndices().find(i=>i>index)??STATEMENTS.length;}
function advanceSwipe(direction){if(activeThemeDeck){advanceThemeSwipe(direction);return;}if(swipeBusy||importanceSaving.size||page()!=='swipe'||!user||swipeIndex>=STATEMENTS.length||!visibleGeneralIndices().includes(swipeIndex))return;const el=$('swipe-card');if(!el)return;const index=swipeIndex,viewer=user.id,session=sharedSession;swipeBusy=true;const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;if(!reduce){el.style.transform='translateX('+(direction==='yes'?'120vw':'-120vw')+') rotate('+(direction==='yes'?18:-18)+'deg)';el.style.opacity='0';}setTimeout(()=>saveSwipeAnswer(direction,index,viewer,session),reduce?0:220);}
function setupSwipeGesture(){const el=$('swipe-card');if(!el)return;let start=null;const reset=()=>{start=null;el.style.transform='';el.classList.remove('swipe-dragging','swipe-preview-yes','swipe-preview-no');};el.addEventListener('pointerdown',e=>{if(e.target.closest?.('[data-importance-control]')||(e.button!==undefined&&e.button!==0))return;start={id:e.pointerId,x:e.clientX,y:e.clientY,dragging:false};});el.addEventListener('pointermove',e=>{if(!start||start.id!==e.pointerId||swipeBusy)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(!start.dragging&&Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>12){start=null;return;}if(Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)){start.dragging=true;el.setPointerCapture?.(e.pointerId);}if(!start.dragging)return;el.classList.add('swipe-dragging');el.classList.toggle('swipe-preview-yes',dx>35);el.classList.toggle('swipe-preview-no',dx< -35);el.style.transform='translateX('+dx+'px) rotate('+Math.max(-13,Math.min(13,dx/18))+'deg)';});el.addEventListener('pointerup',e=>{if(!start||start.id!==e.pointerId)return;const dx=e.clientX-start.x,dragged=start.dragging;reset();if(dragged&&Math.abs(dx)>=85)advanceSwipe(dx>0?'yes':'no');});el.addEventListener('pointercancel',reset);}

function page(){const h=decodeURIComponent(location.hash.slice(1));return h==='insikter'?'insikter':nav.some(n=>n[0]===h)?h:'hem';}
// On mobile, the scroll container is .live-main rather than window.
function scrollLiveMainTop(){const main=document.querySelector('.live-main');if(main)main.scrollTop=0;window.scrollTo(0,0);}
function menu(){
  const unread=schysstaListEnabled&&user&&members.length===2&&!schysstaError?schysstaUnreadCount():0;
  const pending=schysstaListEnabled&&user&&members.length===2&&!schysstaError?schysstaNeedsAnswer().length:0;
  const navItem=([key,label])=>{
    const count=key==='inkorg'?(unread+familyChatUnread):key==='regler'?pending:0;
    const descriptor=key==='inkorg'?' olästa meddelanden':' obesvarade regelförslag';
    const aria=count?' aria-label="'+label+', '+count+descriptor+'"':'';
    const badge=count?'<span class="live-nav-count" aria-hidden="true">'+(count>9?'9+':count)+'</span>':'';
    return '<a href="#'+key+'"'+(page()===key?' aria-current="page"':'')+aria+'>'+label+badge+'</a>';
  };
  for(const id of ['live-desktop-nav','live-mobile-nav'])$(id).innerHTML=nav.map(navItem).join('');
}
const card=html=>'<section class="live-panel">'+html+'</section>';
function login(){
return '<h1>Välkommen till Hemmakompassen</h1>'+card('<h2>Logga in</h2><form id="live-login"><label class="live-field">E-postadress<input id="live-email" type="email" autocomplete="username" required></label><label class="live-field">Lösenord<input id="live-password" type="password" autocomplete="current-password" required></label><button class="live-button" type="submit">Logga in</button></form><p id="login-feedback" role="status"></p><p><a href="./konto.html#reset">Glömt lösenord eller saknar lösenord?</a></p><p><a href="./konto.html#register">Skapa konto</a></p>');
}
function home(){
const name=profile?.display_name||'du';
const roster=members.length?members.map(m=>(m.role==='teen'?'Tonåring':'Förälder')+': '+esc(m.display_name||'Namnlös')).join(' · '):'Ingen familj är kopplad ännu.';
const unread=schysstaListEnabled?schysstaUnreadCount():0;
const needs=schysstaListEnabled?schysstaNeedsAnswer().length:0;
const pendingBanner=needs?card('<h2>Behöver ditt svar · '+needs+' förslag</h2><p>Den andra personen väntar på ditt beslut. Du kan också välja att svara senare.</p><a class="live-button" href="#regler">Ta ställning i Schyssta listan</a>'):'';
const totalUnread=unread+familyChatUnread;
const inboxBanner=totalUnread?card('<h2>Inkorgen · '+totalUnread+' olästa</h2><p>'+(
  familyChatUnread?('Du har '+familyChatUnread+' olästa privata meddelanden'+(unread?' och '+unread+' nya regelhändelser':'')+'.')
    :'Du har fått nya meddelanden om era överenskommelser.')+'</p><a class="live-button" href="#inkorg">Visa inkorgen</a>'):'';
return '<section class="home-hero"><div class="home-hero-inner"><span class="home-kicker">✦ '+(members.length>1?'ERT GEMENSAMMA RUM':'VÄNTAR PÅ DIN MOTPART')+'</span><h1>Hej '+esc(name)+'.<em>Välkommen till ert rum.</em></h1><p>'+(members.length>1?'Ett rum för att förstå varandra bättre, ett steg i taget.':'Medan du väntar kan du utforska Gillaswajpen och börja hitta nya samtalsämnen.')+'</p><a class="home-hero-link" href="#swipe">Utforska Gillaswajpen <span aria-hidden="true">→</span></a></div><div class="home-orbit" aria-hidden="true"><span></span></div></section>'+pendingBanner+inboxBanner+card('<h2>Din familj</h2><p>'+roster+'</p><p class="live-muted">'+(members.length===1?'Den andra familjemedlemmen har ännu inte anslutit.':'Familjemedlemskap hämtat från Supabase.')+'</p><a class="live-button" href="./konto.html">Hantera familj och inbjudningar</a>')+'<h2>Utforska Hemmakompassen</h2><div class="live-cards">'+nav.slice(1,7).map(([key,label])=>card('<h3>'+label+'</h3><p class="live-muted">Den här funktionen ansluts stegvis till riktiga konton.</p><a href="#'+key+'">Öppna →</a>')).join('')+'</div>';
}
const SCHYSSTA_UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function validSchysstaSuggestion(row){
  if(!row||typeof row!=='object'||Array.isArray(row)||typeof row.card_id!=='string'||typeof row.body!=='string')return false;
  return Object.hasOwn(SCHYSSTA_RULES,row.card_id)&&SCHYSSTA_RULES[row.card_id]===row.body
    &&Object.keys(row).length===2&&Object.keys(row).every(key=>key==='card_id'||key==='body');
}
function validSchysstaRule(row){
  if(!row||typeof row!=='object'||Array.isArray(row)||typeof row.source_card_id!=='string'||typeof row.body!=='string'
    ||!Object.hasOwn(SCHYSSTA_RULES,row.source_card_id)
    ||!SCHYSSTA_UUID.test(row.agreement_id)||SCHYSSTA_RULES[row.source_card_id]!==row.body||!['proposed','accepted','rejected'].includes(row.status))return false;
  if(typeof row.proposed_by_me!=='boolean'||![true,false,null].includes(row.own_decision)||![true,false,null].includes(row.parent_decision)||![true,false,null].includes(row.teen_decision))return false;
  const allowed=['agreement_id','source_card_id','body','status','proposed_by_me','own_decision','parent_decision','teen_decision','created_at'];
  return Object.keys(row).every(key=>allowed.includes(key))&&(!row.created_at||!Number.isNaN(Date.parse(row.created_at)));
}
function validSchysstaPayload(suggestions,rules){
  // An unexpected response must not be mistaken for a complete, trustworthy list.
  // Reject the whole snapshot, including duplicates or cards already proposed.
  if(!Array.isArray(suggestions)||!Array.isArray(rules))return false;
  if(!suggestions.every(validSchysstaSuggestion)||!rules.every(validSchysstaRule))return false;
  const proposedCardIds=new Set(rules.map(row=>row.source_card_id));
  return new Set(suggestions.map(row=>row.card_id)).size===suggestions.length
    &&new Set(rules.map(row=>row.agreement_id)).size===rules.length
    &&!suggestions.some(row=>proposedCardIds.has(row.card_id));
}
function validManualSchysstaRule(row){
  if(!row||typeof row!=='object'||Array.isArray(row)||!SCHYSSTA_UUID.test(row.agreement_id)
    ||typeof row.body!=='string'||row.body.length<5||row.body.length>500
    ||!['proposed','accepted','rejected'].includes(row.status)
    ||!Number.isInteger(row.agreement_version)||row.agreement_version<1
    ||typeof row.proposed_by_me!=='boolean'
    ||![true,false,null].includes(row.own_decision)
    ||![true,false,null].includes(row.parent_decision)
    ||![true,false,null].includes(row.teen_decision)
    ||typeof row.created_at!=='string'||Number.isNaN(Date.parse(row.created_at)))return false;
  const keys=['agreement_id','body','status','agreement_version','proposed_by_me',
    'own_decision','parent_decision','teen_decision','created_at'];
  return Object.keys(row).length===keys.length&&Object.keys(row).every(key=>keys.includes(key));
}
function validManualSchysstaPayload(rows,matchedRules){
  return Array.isArray(rows)&&rows.every(validManualSchysstaRule)
    &&new Set(rows.map(row=>row.agreement_id)).size===rows.length
    &&!rows.some(row=>matchedRules.some(other=>other.agreement_id===row.agreement_id));
}
const schysstaAllRules=()=>[...schysstaManualRules,...schysstaRules];
// Client-side filtering only: all displayed content has already passed the
// authenticated backend's whole-response integrity checks. No new RPC needed.
function applySchysstaFilters(){
  const root=document.querySelector('.schyssta-view');
  if(!root)return;
  const phrase=schysstaSearch.trim().toLocaleLowerCase('sv-SE');
  let shown=0,total=0;
  for(const group of root.querySelectorAll('[data-schyssta-filter-group]')){
    const category=group.dataset.schysstaFilterGroup;
    const categoryVisible=schysstaFilterStatus==='all'||category===schysstaFilterStatus;
    group.hidden=!categoryVisible;
    const items=[...group.querySelectorAll('.schyssta-list>li')];
    let inGroup=0;
    for(const item of items){
      const wording=item.querySelector('p')?.textContent?.toLocaleLowerCase('sv-SE')||'';
      const match=!phrase||wording.includes(phrase);
      item.hidden=!match;
      if(match)inGroup++;
    }
    const noResults=group.querySelector('.schyssta-no-results');
    if(noResults)noResults.hidden=!categoryVisible||!phrase||inGroup!==0||items.length===0;
    if(categoryVisible){shown+=inGroup;total+=items.length;}
  }
  const summary=root.querySelector('#schyssta-filter-summary');
  if(summary)summary.textContent=phrase||schysstaFilterStatus!=='all'
    ?'Visar '+shown+' av '+total+' regler och förslag.':'';
}
const schysstaNeedsAnswer=()=>schysstaAllRules().filter(row=>row.status==='proposed'&&!row.proposed_by_me&&row.own_decision===null&&!schysstaPausedIds.has(row.agreement_id)).sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at));
function validSchysstaNotifications(rows){
  const kinds=['rule_proposed','rule_accepted','rule_declined','rule_withdrawn'];
  return Array.isArray(rows)&&rows.every(row=>row&&typeof row==='object'&&!Array.isArray(row)
    &&SCHYSSTA_UUID.test(row.notification_id)&&SCHYSSTA_UUID.test(row.agreement_id)
    &&kinds.includes(row.kind)&&typeof row.body==='string'&&row.body.length<=2000
    &&(row.read_at===null||(typeof row.read_at==='string'&&!Number.isNaN(Date.parse(row.read_at))))
    &&typeof row.created_at==='string'&&!Number.isNaN(Date.parse(row.created_at))
    &&Object.keys(row).length===6
    &&Object.keys(row).every(key=>['notification_id','agreement_id','kind','body','read_at','created_at'].includes(key)))
    &&new Set(rows.map(row=>row.notification_id)).size===rows.length;
}
const schysstaUnreadCount=()=>schysstaNotifications.filter(n=>n.read_at===null).length;
async function copySchysstaAgreements(){
  if(!schysstaListEnabled||!user||members.length!==2||schysstaLoading||schysstaError)return;
  const approved=schysstaAllRules().filter(item=>item.status==='accepted');
  if(!approved.length)return;
  const payload='Våra gemensamma överenskommelser\n\n'
    +approved.map((item,index)=>(index+1)+'. '+item.body).join('\n');
  const viewer=user.id,session=sharedSession;
  try{
    if(typeof navigator.clipboard?.writeText!=='function')throw new Error('Clipboard unsupported');
    await navigator.clipboard.writeText(payload);
    if(user?.id!==viewer||sharedSession!==session)return;
    schysstaCopyMessage=approved.length===1?'Den aktuella regeln har kopierats.':'De '+approved.length+' aktuella reglerna har kopierats.';
  }catch(e){
    if(user?.id!==viewer||sharedSession!==session)return;
    schysstaCopyMessage='Det gick inte att kopiera. Du kan markera och kopiera texten manuellt.';
  }
  render();
}
async function markSchysstaRead(id){
  if(!schysstaListEnabled||!user||!SCHYSSTA_UUID.test(id)||schysstaSaving.has(id))return;
  const viewer=user.id,session=sharedSession;schysstaSaving.add(id);
  let error;try{({error}=await db.rpc('mark_schyssta_notification_read',{p_notification_id:id}));}catch(e){error=e;}
  schysstaSaving.delete(id);
  if(user?.id!==viewer||session!==sharedSession)return;
  if(error){schysstaMessage='Det gick inte att markera meddelandet som läst.';render();return;}
  await fetchSchysstaList();
}
function validSchysstaReplacementLinks(rows,manualRules){
  return Array.isArray(rows)&&rows.every(row=>row&&typeof row==='object'
    &&SCHYSSTA_UUID.test(row.agreement_id)&&SCHYSSTA_UUID.test(row.replaces_agreement_id)
    &&Object.keys(row).length===2
    &&Object.keys(row).every(key=>['agreement_id','replaces_agreement_id'].includes(key))
    &&manualRules.some(rule=>rule.agreement_id===row.agreement_id))
    &&new Set(rows.map(row=>row.agreement_id)).size===rows.length;
}
function validSchysstaHistory(rows){
  return Array.isArray(rows)&&rows.every(row=>row&&typeof row==='object'
    &&SCHYSSTA_UUID.test(row.agreement_id)&&typeof row.body==='string'
    &&row.body.length<=2000&&typeof row.created_at==='string'
    &&!Number.isNaN(Date.parse(row.created_at))&&Object.keys(row).length===3
    &&Object.keys(row).every(key=>['agreement_id','body','created_at'].includes(key)))
    &&new Set(rows.map(row=>row.agreement_id)).size===rows.length;
}
async function withdrawSchysstaRule(id){
  if(!schysstaListEnabled||!user||!SCHYSSTA_UUID.test(id)||schysstaSaving.has(id)||schysstaEndTarget!==id)return;
  const viewer=user.id,session=sharedSession;schysstaSaving.add(id);
  let error;try{({error}=await db.rpc('withdraw_schyssta_rule',{p_agreement_id:id}));}catch(e){error=e;}
  schysstaSaving.delete(id);schysstaEndTarget=null;
  if(user?.id!==viewer||session!==sharedSession)return;
  if(error){schysstaMessage='Det gick inte att avsluta överenskommelsen.';render();return;}
  schysstaMessage='Överenskommelsen är avslutad och finns kvar i historiken.';
  await fetchSchysstaList();
}
async function submitManualSchysstaRule(){
  if(!schysstaListEnabled||!user||members.length!==2||schysstaSubmitting||schysstaLoading||schysstaError)return;
  const body=schysstaDraft.trim().replace(/\s+/g,' ');
  if(body.length<5||body.length>500){schysstaMessage='Skriv mellan 5 och 500 tecken.';render();return;}
  if(!schysstaDraftKey)schysstaDraftKey=crypto.randomUUID();
  const requestKey=schysstaDraftKey,viewer=user.id,session=sharedSession;
  schysstaSubmitting=true;schysstaMessage='Skickar förslaget…';render();
  let error;try{({error}=schysstaEditTarget?await db.rpc('propose_schyssta_change',{p_agreement_id:schysstaEditTarget,p_body:body,p_request_key:requestKey}):await db.rpc('propose_manual_schyssta_rule',{p_body:body,p_request_key:requestKey}));}
  catch(e){error=e;}
  schysstaSubmitting=false;
  if(user?.id!==viewer||sharedSession!==session)return;
  if(error){schysstaMessage='Kunde inte skicka förslaget. Kontrollera anslutningen och försök igen.';render();return;}
  schysstaDraft='';schysstaDraftKey=null;schysstaEditTarget=null;schysstaDraftOpen=false;
  schysstaMessage='Förslaget är skickat. Ni behöver båda godkänna det innan det blir en överenskommelse.';
  await fetchSchysstaList();
}
function inboxView(){
  if(!user)return '<h1>Inkorg</h1>'+card('<p>Logga in för att läsa dina meddelanden.</p>');
  if(members.length!==2)return '<h1>Inkorg</h1>'+card('<h2>Para ihop era konton</h2><p>Ni behöver vara en förälder och en tonåring i samma familj för att kunna skicka privata meddelanden.</p><a class="live-button" href="./konto.html">Hantera parning</a>');
  const counterpart=members.find(m=>m.user_id!==user.id);
  const otherName=esc(counterpart?.display_name||(counterpart?.role==='parent'?'Din förälder':'Din tonåring'));
  const messages=familyChatMessages.slice().reverse();
  const messageList=messages.length?'<ol class="family-chat-messages" aria-label="Er privata konversation">'
    +messages.map(m=>'<li class="family-chat-bubble '+(m.sent_by_me?'family-chat-mine':'family-chat-theirs')+'">'
      +'<p class="family-chat-author">'+(m.sent_by_me?'Du':otherName)+' · <time datetime="'+esc(m.created_at)+'">'+esc(familyChatTimestamp(m.created_at))+'</time></p>'
      +'<p class="family-chat-text">'+esc(m.body)+'</p>'
      +(m.sent_by_me?'<p class="family-chat-receipt">'+(m.read_at?'Läst':'Skickat')+'</p>':'')+'</li>').join('')+'</ol>'
    :'<p class="live-muted">Inga meddelanden ännu. Skriv det första nedan.</p>';
  const chat=card('<div class="family-chat"><h2>Privata meddelanden med '+otherName+'</h2>'
    +'<p class="live-muted">Bara ni två i den aktuella familjeparningen kan läsa konversationen. Tidigare parningars meddelanden visas inte.</p>'
    +(familyChatError?'<p role="alert">'+esc(familyChatError)+'</p>':'')
    +(familyChatLoading?'<p role="status">Hämtar meddelanden…</p>':
      '<div class="family-chat-history">'
      +(familyChatHasMore?'<button type="button" class="schyssta-secondary" data-family-chat-more'+(familyChatLoadingOlder?' disabled':'')+'>Visa äldre meddelanden</button>':'')
      +messageList+'</div>')
    +'<form id="family-chat-form" class="family-chat-form">'
    +'<label for="family-chat-body">Skriv till '+otherName+'</label>'
    +'<textarea id="family-chat-body" rows="3" maxlength="1500" required placeholder="Skriv ett meddelande…" aria-describedby="family-chat-help">'+esc(familyChatDraft)+'</textarea>'
    +'<p id="family-chat-help" class="live-muted">Skickas bara när du väljer Skicka. Ctrl/⌘ + Enter fungerar också.</p>'
    +'<div class="family-chat-compose-actions"><button type="submit" class="live-button"'+(familyChatSending?' disabled':'')+'>'+(familyChatSending?'Skickar…':'Skicka meddelande')+'</button>'
    +'<button type="button" class="schyssta-secondary" data-family-chat-refresh>Uppdatera konversationen</button></div></form>'
    +(familyChatStatus?'<p role="status" class="schyssta-feedback">'+esc(familyChatStatus)+'</p>':'')
    +'</div>');
  const needs=(!schysstaLoading&&!schysstaError&&schysstaListEnabled)?schysstaNeedsAnswer():[];
  const kinds={rule_proposed:'Nytt regelförslag',rule_accepted:'En regel har godkänts',
    rule_declined:'Ett regelförslag har avböjts',rule_withdrawn:'En överenskommelse har avslutats'};
  const noticeHtml=schysstaNotifications.length?'<ul class="schyssta-list">'
    +schysstaNotifications.map(n=>'<li class="'+(n.read_at===null?'schyssta-unread':'')+'"><p><strong>'+kinds[n.kind]+'</strong>'+(n.read_at===null?' · Oläst':'')+'</p>'
      +'<p>'+esc(n.body)+'</p><p class="live-muted">Från: '+otherName+' · <time datetime="'+esc(n.created_at)+'">'+esc(familyChatTimestamp(n.created_at))+'</time></p>'
      +'<div class="schyssta-actions"><button type="button" class="live-button" data-schyssta-open="'+n.agreement_id+'">Visa regeln</button>'
      +(n.read_at===null?'<button type="button" class="schyssta-secondary" data-schyssta-read="'+n.notification_id+'">Markera som läst</button>':'')+'</div></li>').join('')+'</ul>'
    :'<p class="live-muted">Inga regelhändelser ännu.</p>';
  const rules=!schysstaListEnabled?''
    :schysstaLoading?card('<p role="status">Hämtar regelförfrågningar…</p>')
    :schysstaError?card('<p role="alert">'+esc(schysstaError)+'</p><button type="button" class="schyssta-secondary" id="schyssta-retry">Försök igen</button>')
    :card('<h2>Regelförfrågningar'+(needs.length?' ('+needs.length+')':'')+'</h2>'
      +(needs.length?'<ul class="schyssta-list">'+needs.map(row=>'<li><p>'+esc(row.body)+'</p><button type="button" class="live-button" data-schyssta-open="'+row.agreement_id+'">Se och svara i Schyssta listan</button></li>').join('')+'</ul>'
        :'<p class="live-muted">Inga regelförslag väntar på ditt svar.</p>')
      +'<h3>Händelser från Schyssta listan'+(schysstaUnreadCount()?' · '+schysstaUnreadCount()+' olästa':'')+'</h3>'
      +noticeHtml+'<p><a href="#regler">Öppna Schyssta listan</a></p>');
  return '<h1>Inkorg</h1><p>Här kan ni skriva privata meddelanden till varandra och hantera gemensamma regelförfrågningar.</p>'
    +chat+rules;
}
async function fetchSchysstaList(){
  const request=++schysstaRequest,viewer=user?.id,session=sharedSession;
  schysstaSuggestions=[];schysstaRules=[];schysstaManualRules=[];schysstaNotifications=[];schysstaReplacementLinks=[];schysstaHistory=[];schysstaError='';
  if(!schysstaListEnabled||!viewer||members.length!==2){schysstaLoading=false;if(['regler','inkorg','hem'].includes(page()))render();return;}
  schysstaLoading=true;if(['regler','inkorg','hem'].includes(page()))render();
  let results,timeoutHandle;
  try{
    const pending=Promise.all([db.rpc('shared_schyssta_rule_suggestions'),db.rpc('my_schyssta_rules'),db.rpc('my_manual_schyssta_rules'),db.rpc('my_schyssta_notifications'),db.rpc('my_schyssta_replacement_links'),db.rpc('my_schyssta_rule_history')]);
    // Fail closed if Supabase stays unreachable; no stale snapshot shown.
    results=await Promise.race([pending,new Promise((_,reject)=>{
      timeoutHandle=setTimeout(()=>reject(new Error('Schyssta fetch timeout')),15000);
    })]);
  }catch(e){
    results=[{error:e},{error:e},{error:e},{error:e},{error:e},{error:e}];
  }finally{clearTimeout(timeoutHandle);}
  if(request!==schysstaRequest||user?.id!==viewer||sharedSession!==session)return;
  schysstaLoading=false;
  if(results.some(result=>result.error)){schysstaError='Schyssta listan kunde inte hämtas. Inga tidigare förslag visas.';}
  else if(!validSchysstaPayload(results[0].data,results[1].data)||!validManualSchysstaPayload(results[2].data,results[1].data)||!validSchysstaNotifications(results[3].data)||!validSchysstaReplacementLinks(results[4].data,results[2].data)||!validSchysstaHistory(results[5].data)){
    schysstaError='Schyssta listan skickade ett oväntat svar. Inga förslag eller överenskommelser visas.';
  }else{
    schysstaSuggestions=results[0].data;
    schysstaRules=results[1].data;
    schysstaManualRules=results[2].data;
    schysstaNotifications=results[3].data;
    schysstaReplacementLinks=results[4].data;
    schysstaHistory=results[5].data;
    const pendingIds=new Set(schysstaAllRules().filter(row=>row.status==='proposed'&&row.own_decision===null).map(row=>row.agreement_id));
    for(const id of schysstaPausedIds)if(!pendingIds.has(id))schysstaPausedIds.delete(id);
  }
  if(['regler','inkorg','hem'].includes(page()))render();
  if(page()==='regler'&&schysstaFocusId){
    const id=schysstaFocusId;schysstaFocusId='';
    requestAnimationFrame(()=>{
      const el=document.getElementById('schyssta-rule-'+id);
      if(el?.closest('details')&&!el.closest('details').open)el.closest('details').open=true;
      el?.scrollIntoView({block:'center'});
    });
  }
}
async function proposeSchysstaRule(cardId){
  if(!schysstaListEnabled||!user||!SCHYSSTA_RULES[cardId]||schysstaSaving.has(cardId))return;
  const viewer=user.id,session=sharedSession;schysstaSaving.add(cardId);render();
  let error;try{({error}=await db.rpc('propose_schyssta_rule',{p_card_id:cardId}));}catch(e){error=e;}
  schysstaSaving.delete(cardId);if(user?.id!==viewer||sharedSession!==session)return;
  if(error){schysstaError='Förslaget kunde inte sparas. Inget godkännande registrerades.';render();return;}
  await fetchSchysstaList();
}
async function decideSchysstaRule(agreementId,approved){
  if(!schysstaListEnabled||!user||!SCHYSSTA_UUID.test(agreementId)||schysstaSaving.has(agreementId))return;
  const viewer=user.id,session=sharedSession;schysstaSaving.add(agreementId);render();
  let error;try{({error}=await db.rpc('set_schyssta_rule_decision',{p_agreement_id:agreementId,p_approved:approved}));}catch(e){error=e;}
  schysstaSaving.delete(agreementId);if(user?.id!==viewer||sharedSession!==session)return;
  if(error){schysstaError='Ditt val kunde inte sparas. Listan har rensats tills den kan hämtas igen.';schysstaSuggestions=[];schysstaRules=[];schysstaManualRules=[];schysstaNotifications=[];schysstaReplacementLinks=[];schysstaHistory=[];render();return;}
  await fetchSchysstaList();
}
function schysstaView(){
  if(!schysstaListEnabled)return '<h1>Schyssta listan</h1>'+card('<p>Regelvyn är inte aktiverad i denna miljö.</p>');
  if(members.length!==2)return '<h1>Schyssta listan</h1>'+card('<h2>Koppla först en familjemedlem</h2><p>Listan kräver exakt en parad förälder och tonåring.</p><a class="live-button" href="./konto.html">Hantera familj</a>');
  if(schysstaLoading)return '<h1>Schyssta listan</h1>'+card('<p role="status">Hämtar serververifierade förslag…</p>');
  if(schysstaError)return '<h1>Schyssta listan</h1>'+card('<h2>Kunde inte visa listan</h2><p role="alert">'+esc(schysstaError)+'</p><button class="live-button" type="button" id="schyssta-retry">Försök igen</button>');
  const statusLabel={proposed:'Väntar på bådas beslut',accepted:'Godkänd av båda',rejected:'Inte gemensamt godkänd'};
  const itemHtml=item=>{
    const source=schysstaReplacementLinks.some(link=>link.agreement_id===item.agreement_id)?'Ändringsförslag':item.source_card_id?'Från Gillaswajpen':'Eget regelförslag';
    const action=schysstaSaving.has(item.agreement_id);
    const submitButton=(approved,label,style='live-button')=>'<button class="'+style+'" type="button" data-schyssta-decision="'+item.agreement_id+'" data-approved="'+approved+'"'+(action?' disabled':'')+'>'+label+'</button>';
    const decisionActions=item.status==='accepted'
      ?'<p class="live-muted">Ni har båda godkänt denna överenskommelse.</p>'
      :item.status==='rejected'
      ?'<p class="live-muted">Ni är inte överens om förslaget just nu. Ni kan prata om en annan formulering.</p>'
        +(item.own_decision===false?submitButton(true,'Ändra mitt svar till ja')
          :item.own_decision===true?submitButton(false,'Ta tillbaka mitt ja','schyssta-secondary'):'')
      :item.own_decision===true
      ?'<p class="live-muted">Du har sagt ja. Den andra personen behöver också säga ja till samma text.</p>'+submitButton(false,'Ta tillbaka mitt ja','schyssta-secondary')
      :item.own_decision===false
      ?'<p class="live-muted">Du har avböjt detta förslag. Du kan ändra ditt svar.</p>'+submitButton(true,'Ändra till ja')
      :submitButton(true,'Jag godkänner')+submitButton(false,'Avböj förslaget','schyssta-secondary')
        +(schysstaPausedIds.has(item.agreement_id)
          ?'<button class="schyssta-secondary" type="button" data-schyssta-resume="'+item.agreement_id+'">Visa bland förslag som behöver mitt svar</button>'
          :'<button class="schyssta-secondary" type="button" data-schyssta-pause="'+item.agreement_id+'">Inte nu</button>');
    const manageActions=item.status==='accepted'
      ?'<button class="schyssta-secondary" type="button" data-schyssta-edit="'+item.agreement_id+'">Föreslå ändring</button>'
        +'<button class="schyssta-secondary" type="button" data-schyssta-end="'+item.agreement_id+'">Avsluta överenskommelsen</button>'
      :'';
    return '<li id="schyssta-rule-'+item.agreement_id+'"><p>'+esc(item.body)+'</p>'
      +'<p class="schyssta-status"><span>'+source+'</span> · <span class="schyssta-status-mark schyssta-status-'+item.status+'" aria-hidden="true"></span><strong>'+statusLabel[item.status]+'</strong> · Ditt val: '
      +(item.own_decision===true?'ja':item.own_decision===false?'nej':'inte lämnat')+'</p>'
      +(source==='Ändringsförslag'&&item.status==='proposed'?'<p class="live-muted">Den tidigare överenskommelsen gäller tills ni båda har godkänt den nya formuleringen.</p>':'')
      +'<div class="schyssta-actions">'+decisionActions+manageActions+'</div>'
      +(item.status==='accepted'?'<details class="schyssta-review"><summary>Hur fungerar den här regeln för oss?</summary><p>Ni kan välja att prata om regeln när det passar båda. Det här är ingen bedömning av vem som gör rätt eller fel.</p><ul><li>Vad har fungerat bra för oss?</li><li>Finns det något som känns svårt eller orättvist?</li><li>Vill vi behålla regeln eller föreslå en ändring?</li></ul></details>':'')
      +(schysstaEndTarget===item.agreement_id?'<div class="schyssta-confirm" role="group" aria-label="Bekräfta avslut"><p>Om du avslutar gäller regeln inte längre som gemensam överenskommelse. Den finns kvar i historiken.</p><button class="live-button" type="button" data-schyssta-end-confirm="'+item.agreement_id+'">Ja, avsluta</button><button class="schyssta-secondary" type="button" id="schyssta-end-cancel">Avbryt</button></div>':'')
      +'</li>';
  };
  const list=(rows,empty)=>rows.length?'<ul class="schyssta-list">'+rows.map(itemHtml).join('')+'</ul>':'<p class="live-muted">'+empty+'</p>';
  const rules=schysstaAllRules(), needs=schysstaNeedsAnswer();
  const approved=rules.filter(item=>item.status==='accepted');
  const ongoing=rules.filter(item=>item.status!=='accepted'&&!needs.includes(item));
  const searchTools='<div class="schyssta-filter-toolbar" role="search" aria-label="Sök bland aktuella regler och förslag">'
    +'<label for="schyssta-search">Sök bland era regler och förslag</label>'
    +'<input type="search" id="schyssta-search" maxlength="100" autocomplete="off" placeholder="Skriv ett ord i regeln…" value="'+esc(schysstaSearch)+'">'
    +'<label for="schyssta-status-filter">Visa</label>'
    +'<select id="schyssta-status-filter">'
    +'<option value="all"'+(schysstaFilterStatus==='all'?' selected':'')+'>Alla</option>'
    +'<option value="approved"'+(schysstaFilterStatus==='approved'?' selected':'')+'>Bara gemensamt godkända</option>'
    +'<option value="ongoing"'+(schysstaFilterStatus==='ongoing'?' selected':'')+'>Bara pågående förslag</option>'
    +'</select>'
    +'<p class="live-muted">Förslag som behöver ditt svar visas alltid överst.</p>'
    +'<p id="schyssta-filter-summary" role="status" aria-live="polite"></p></div>';
  const suggestionHtml=schysstaSuggestions.length?'<ul class="schyssta-list">'+schysstaSuggestions.map(item=>'<li><p>'+esc(item.body)+'</p><button class="live-button" type="button" data-schyssta-propose="'+esc(item.card_id)+'"'+(schysstaSaving.has(item.card_id)?' disabled':'')+'>Föreslå</button></li>').join('')+'</ul>':'<p class="live-muted">Inga nya gemensamma ja-förslag finns just nu.</p>';
  const firstRuleHint=rules.length===0
    ?card('<h2>Kom igång tillsammans</h2><p>Ni har inte gjort någon gemensam överenskommelse än. Ni kan skriva ett eget förslag eller hitta idéer i Gillaswajpen.</p><div class="schyssta-actions"><button class="live-button" type="button" data-schyssta-start>+ Föreslå en regel</button><a class="schyssta-secondary" href="#swipe">Hitta idéer i Gillaswajpen</a></div>')
    :'';
  const formHtml=schysstaDraftOpen?'<form id="schyssta-manual-form" class="schyssta-compose">'
    +'<label for="schyssta-body">Vad vill du att ni båda ska kunna komma överens om?</label>'
    +'<textarea id="schyssta-body" name="rule" rows="3" minlength="5" maxlength="500" required placeholder="Vi knackar innan vi går in i varandras rum…" aria-describedby="schyssta-length schyssta-description">'+esc(schysstaDraft)+'</textarea>'
    +'<p id="schyssta-length" class="live-muted" aria-live="off">'+schysstaDraft.length+' av 500 tecken</p>'
    +'<div class="schyssta-preview" aria-label="Förhandsgranskning av regelförslag"><strong>Så här ser förslaget ut</strong><p class="live-muted">Från: '+esc(profile?.display_name||'Du')+' · Till den andra familjemedlemmen</p><p id="schyssta-preview-text">'+esc(schysstaDraft.trim()||'Skriv en regel ovan för att förhandsgranska texten.')+'</p><p class="live-muted">Förslag – ännu inte godkänt av båda</p></div>'
    +'<p id="schyssta-description" class="live-muted">Skriv ett konkret förslag. Det skickas till den andra personen, men blir en överenskommelse först när ni båda sagt ja.</p>'
    +'<details class="schyssta-tips"><summary>Tips för en tydlig och rättvis överenskommelse</summary>'
    +'<p>Beskriv helst vad ni vill göra, snarare än vad den andra ska sluta med.</p>'
    +'<ul><li>När ska regeln gälla?</li><li>Vad betyder den i praktiken för var och en?</li><li>När vill ni prata om hur den fungerar?</li></ul>'
    +'<p>Ni får båda föreslå ändringar. Vuxnas ansvar för trygghet och omsorg ska inte läggas på tonåringen.</p>'
    +(viewerRole()==='parent'?'<p>Som förälder: prova att prata om förslaget och lyssna på tonåringens perspektiv innan du skickar. <a href="#kommunikation">Öppna kommunikationsråden</a>.</p>':'')+'</details>'
    +'<button class="live-button" type="submit"'+(schysstaSubmitting?' disabled':'')+'>'+(schysstaSubmitting?'Skickar…':schysstaEditTarget?'Skicka ändringsförslag':'Skicka regelförslag')+'</button>'
    +'<button class="schyssta-secondary" type="button" id="schyssta-compose">Stäng formuläret</button></form>'
    :'<button class="live-button" type="button" id="schyssta-compose">+ Föreslå en regel</button>';
  return '<div class="schyssta-view"><h1>Schyssta listan</h1><p>Här samlar ni sådant ni båda har sagt ja till. Regler kan komma från Gillaswajpen eller skrivas av någon av er.</p><button class="schyssta-secondary" type="button" data-schyssta-refresh>Uppdatera listan</button>'
    +card('<h2>Behöver ditt svar'+(needs.length?' ('+needs.length+')':'')+'</h2><p>Förslag från den andra personen visas här först.</p>'+list(needs,'Inga nya förslag väntar på ditt svar.'))
    +firstRuleHint
    +card('<h2>'+(schysstaEditTarget?'Föreslå ändring av regel':'Skriv ett eget förslag')+'</h2>'+formHtml+(schysstaMessage?'<p role="status" class="schyssta-feedback">'+esc(schysstaMessage)+'</p>':''))
    +searchTools
    +'<div class="schyssta-filter-group" data-schyssta-filter-group="approved">'
    +card('<h2>Våra överenskommelser</h2>'+list(approved,'Ni har ännu inga regler som båda godkänt.')
      +(approved.length?'<button class="schyssta-secondary" type="button" data-schyssta-copy>Kopiera aktuella regler</button>':'')
      +(schysstaCopyMessage?'<p role="status" class="schyssta-feedback">'+esc(schysstaCopyMessage)+'</p>':''))
    +'<p class="schyssta-no-results live-muted" hidden>Inga gemensamma regler matchar sökningen.</p></div>'
    +'<div class="schyssta-filter-group" data-schyssta-filter-group="ongoing">'
    +card('<h2>Förslag på gång</h2><p>Här hittar du även förslag där du valt Inte nu. Ett eget skickat förslag kräver också ditt separata godkännande.</p>'+list(ongoing,'Inga andra pågående förslag.'))
    +'<p class="schyssta-no-results live-muted" hidden>Inga pågående förslag matchar sökningen.</p></div>'
    +card('<h2>Gemensamma förslag</h2><p>Här kan bara regler som servern verifierat som JA+JA visas. Ett förslag är inte ett godkännande.</p>'+suggestionHtml)
    +(schysstaHistory.length?'<details class="schyssta-history" id="schyssta-history"><summary>Tidigare överenskommelser ('+schysstaHistory.length+')</summary><ul class="schyssta-list">'+schysstaHistory.map(item=>'<li id="schyssta-rule-'+item.agreement_id+'"><p>'+esc(item.body)+'</p><p class="live-muted">Avslutad överenskommelse</p></li>').join('')+'</ul></details>':'')
    +'</div>';
}
function section(key){
const label=nav.find(n=>n[0]===key)?.[1]||'Hemmakompassen';
if(key==='installningar')return '<h1>Inställningar</h1>'+card('<h2>Ditt konto</h2><p>Inloggad som '+esc(user.email)+'</p><p>Visningsnamn: '+esc(profile?.display_name||'Inte angivet')+'</p><a class="live-button" href="./konto.html">Ändra namn, familj eller logga ut</a>');
if(key==='swipe')return swipeView();
if(key==='personlighet')return personalityExperience.render({isPaired:members.length===2 && members.some(m=>m.role==='parent') && members.some(m=>m.role==='teen'),viewerRole:viewerRole()});
 if(key==='insikter')return insightsView();
if(key==='regler')return schysstaView();
if(key==='inkorg')return inboxView();
if(key==='kommunikation')return '<h1>Kommunikationsråd</h1><p>Konkreta samtalsöppningar från den tidigare Hemmakompassen.</p>'+COMMUNICATION_GUIDES.map(([title,intro,tips])=>card('<h2>'+esc(title)+'</h2><p>'+esc(intro)+'</p><ul>'+tips.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul>')).join('');
return '<h1>'+label+'</h1>'+card('<h2>Funktionen är under utveckling</h2><p>Du är inloggad som '+esc(profile?.display_name||user.email)+'. Vi bygger nu den riktiga kopplingen till Supabase så att dina svar och den andra familjemedlemmens uppgifter hålls åtskilda.</p><p>Här visas inga påhittade demodata och inga svar lagras lokalt som om de vore delade med familjen.</p><a class="live-button" href="#hem">Till startsidan</a>');
}
function render(){if(activeThemeDeck&&!themeAccessAllowed())activeThemeDeck=null;menu();$('live-app').innerHTML=user?(page()==='hem'?home():section(page())):login();if(page()==='regler'&&user)applySchysstaFilters();setupSwipeGesture();$('sidebar-account').textContent=user?'Inloggad: '+(profile?.display_name||user.email):'Inte inloggad';$('account-link').textContent=user?'Ditt konto →':'Logga in →';}
async function refresh(){
const generation=++refreshGeneration;
let authResult;
try{authResult=await db.auth.getUser();}
catch(e){if(generation!==refreshGeneration)return;throw e;}
if(generation!==refreshGeneration)return;
const {data:{user:u},error}=authResult;if(error&&error.name!=='AuthSessionMissingError')throw error;user=u;profile=null;members=[];personalityExperience.reset(u?.id??null);swipeAnswers.clear();swipeImportance.clear();importancePending.clear();importanceSaving.clear();importanceAvailable=false;importanceLoadError='';skippedUnderstanding.clear();understandingShares.clear();understandingShareSaving.clear();understandingShareError='';for(const answers of themeAnswers.values())answers.clear();activeThemeDeck=null;themeCategory='all';themeIndex=0;themeReview=false;themeSaveError='';swipeBusy=false;swipeLoadError='';swipeSaveError='';swipeReview=false;swipeIndex=0;sharedMatches=[];sharedPriorities=[];sharedDeckId='general';sharedError='';sharedLoading=false;sharedSession++;sharedRequest++;insightsRows=[];sharedUnderstandingRows=[];insightsLoading=false;insightsError='';insightsRequest++;themesUnlocked=false;themesLoading=false;themesError='';themesRequest++;
if(typeof schysstaRequest!=='undefined'){schysstaSuggestions=[];schysstaRules=[];schysstaManualRules=[];schysstaNotifications=[];schysstaReplacementLinks=[];schysstaHistory=[];schysstaEndTarget=null;schysstaLoading=false;schysstaError='';schysstaRequest++;schysstaSaving.clear();schysstaPausedIds.clear();clearFamilyChat();schysstaDraft='';schysstaDraftOpen=false;schysstaDraftKey=null;schysstaEditTarget=null;schysstaSubmitting=false;schysstaMessage='';schysstaCopyMessage='';schysstaFocusId='';schysstaSearch='';schysstaFilterStatus='all';}
if(user){const viewer=user.id;
let loaded;
try{loaded=await Promise.all([db.from('profiles').select('display_name').eq('user_id',viewer).maybeSingle(),db.rpc('my_family_members'),db.from('swipe_answers').select('deck_id,card_id,answer').eq('user_id',viewer),db.from('swipe_skips').select('deck_id,card_id').eq('user_id',viewer),db.from('swipe_importance').select('deck_id,card_id,importance').eq('user_id',viewer),sharedUnderstandingEnabled?db.from('understanding_card_shares').select('deck_id,card_id').eq('user_id',viewer):Promise.resolve({data:[],error:null})]);}
catch(e){if(generation!==refreshGeneration)return;throw e;}
if(generation!==refreshGeneration||user?.id!==viewer)return;
const [p,m,s,k,i,b]=loaded;if(p.error)throw p.error;if(m.error)throw m.error;profile=p.data;members=m.data||[];if(s.error||k.error)swipeLoadError='Kontrollera anslutningen och försök igen.';else for(const answer of s.data||[])if(answer.deck_id==='general'&&typeof answer.answer==='boolean'&&STATEMENTS.some((_,index)=>swipeCardId(index)===answer.card_id))swipeAnswers.set(answer.card_id,answer.answer);
if(!s.error)for(const answer of s.data||[]){
  if(typeof answer.answer!=='boolean')continue;
  const deck=THEME_DECKS.find(d=>d.id===answer.deck_id);
  if(deck&&deck.cards.some((_,index)=>themeCardId(deck,index)===answer.card_id))themeAnswers.get(deck.id).set(answer.card_id,answer.answer);
}if(!k.error)for(const skipped of k.data||[])if(skipped.deck_id==='general'&&GENERAL_CARDS.some(card=>card.id===skipped.card_id&&card.type==='understanding'))skippedUnderstanding.add(skipped.card_id);
if(i.error)importanceLoadError='Den säkra lagringen är inte aktiverad.';else{importanceAvailable=true;for(const row of i.data||[])if([-1,0,1].includes(row.importance)&&validImportanceCard(row.deck_id,row.card_id))swipeImportance.set(importanceKey(row.deck_id,row.card_id),row.importance);}
if(sharedUnderstandingEnabled){if(b.error)understandingShareError='Delningsstatus kunde inte hämtas.';else if(viewerRole()==='teen')for(const row of b.data||[])if(row.deck_id==='general'&&GENERAL_CARDS.some(card=>card.id===row.card_id&&card.type==='understanding'))understandingShares.add(row.card_id);}
swipeIndex=nextUnanswered();}
if(generation!==refreshGeneration)return;
render();
if(user)void personalityExperience.load(user.id);
if(user&&members.length===2){void fetchSwipeMatches('general');void fetchThemeUnlock();}
if(page()==='insikter')void fetchInsights();
if(typeof fetchSchysstaList==='function'&&schysstaListEnabled&&['regler','inkorg','hem'].includes(page()))void fetchSchysstaList();
if(user&&members.length===2){
  if(page()==='inkorg')void fetchFamilyChat();
  else void fetchFamilyChatUnread();
}
}
document.addEventListener('click',e=>{if(e.target.closest('[data-pf-action]')){void personalityExperience.handleClick(e.target,{isPaired:members.length===2&&members.some(m=>m.role==='parent')&&members.some(m=>m.role==='teen')});return;}const b=e.target.closest('[data-swipe]');if(b)advanceSwipe(b.dataset.swipe);if(e.target.closest('#swipe-restart')){swipeReview=true;swipeIndex=visibleGeneralIndices()[0]??STATEMENTS.length;render();}if(e.target.closest('#swipe-skip')&&viewerRole()==='teen'&&GENERAL_CARDS[swipeIndex]?.type==='understanding'&&!swipeBusy)void skipUnderstandingCard(swipeIndex,user.id,sharedSession);if(e.target.closest('#swipe-reload'))refresh().catch(showError);const refreshMatches=e.target.closest('[data-refresh-matches]');if(refreshMatches&&!sharedLoading)void fetchSwipeMatches(refreshMatches.dataset.refreshMatches);if(e.target.closest('#retry-theme-unlock')&&!themesLoading)void fetchThemeUnlock();
if(e.target.closest('#insights-retry')&&!insightsLoading)void fetchInsights();
if(e.target.closest('[data-family-chat-refresh]'))void fetchFamilyChat();
if(e.target.closest('[data-family-chat-more]'))void fetchFamilyChat(true);
if(e.target.closest('#schyssta-retry')&&!schysstaLoading)void fetchSchysstaList();
if(e.target.closest('[data-schyssta-refresh]')&&!schysstaLoading)void fetchSchysstaList();
if(e.target.closest('[data-schyssta-copy]'))void copySchysstaAgreements();
if(e.target.closest('[data-schyssta-start]')){schysstaDraftOpen=true;schysstaEditTarget=null;schysstaDraft='';schysstaDraftKey=null;render();document.getElementById('schyssta-body')?.focus();}
if(e.target.closest('#schyssta-compose')){schysstaDraftOpen=!schysstaDraftOpen;if(!schysstaDraftOpen){schysstaEditTarget=null;schysstaDraftKey=null;schysstaDraft='';}schysstaMessage='';render();}
const openRule=e.target.closest('[data-schyssta-open]');
if(openRule&&SCHYSSTA_UUID.test(openRule.dataset.schysstaOpen)){
  schysstaFocusId=openRule.dataset.schysstaOpen;
  location.hash='regler';
  if(page()==='regler')void fetchSchysstaList();
}
const readNotice=e.target.closest('[data-schyssta-read]');if(readNotice)void markSchysstaRead(readNotice.dataset.schysstaRead);
const endRule=e.target.closest('[data-schyssta-end]');if(endRule&&SCHYSSTA_UUID.test(endRule.dataset.schysstaEnd)){schysstaEndTarget=endRule.dataset.schysstaEnd;render();}
if(e.target.closest('#schyssta-end-cancel')){schysstaEndTarget=null;render();}
const endConfirm=e.target.closest('[data-schyssta-end-confirm]');if(endConfirm)void withdrawSchysstaRule(endConfirm.dataset.schysstaEndConfirm);
const startEdit=e.target.closest('[data-schyssta-edit]');
if(startEdit&&SCHYSSTA_UUID.test(startEdit.dataset.schysstaEdit)){
  const old=schysstaAllRules().find(row=>row.agreement_id===startEdit.dataset.schysstaEdit&&row.status==='accepted');
  if(old){schysstaEditTarget=old.agreement_id;schysstaDraft=old.body;schysstaDraftKey=null;
    schysstaDraftOpen=true;schysstaMessage='Du föreslår en ny formulering. Den gamla gäller tills båda godkänt ändringen.';
    render();document.getElementById('schyssta-body')?.focus();}
}
const schysstaProposal=e.target.closest('[data-schyssta-propose]');if(schysstaProposal)void proposeSchysstaRule(schysstaProposal.dataset.schysstaPropose);
const resume=e.target.closest('[data-schyssta-resume]');
if(resume&&SCHYSSTA_UUID.test(resume.dataset.schysstaResume)){
  schysstaPausedIds.delete(resume.dataset.schysstaResume);
  schysstaMessage='Förslaget visas återigen bland de förslag som behöver ditt svar.';
  render();
}
const pause=e.target.closest('[data-schyssta-pause]');
if(pause&&SCHYSSTA_UUID.test(pause.dataset.schysstaPause)){
  const row=schysstaAllRules().find(item=>item.agreement_id===pause.dataset.schysstaPause);
  if(row&&row.status==='proposed'&&!row.proposed_by_me&&row.own_decision===null){
    schysstaPausedIds.add(row.agreement_id);
    schysstaMessage='Förslaget ligger nu under Förslag på gång. Du kan återkomma när du vill. Inget beslut har sparats.';
    render();
  }
}
const schysstaDecision=e.target.closest('[data-schyssta-decision]');if(schysstaDecision)void decideSchysstaRule(schysstaDecision.dataset.schysstaDecision,schysstaDecision.dataset.approved==='true');
const understandingShare=e.target.closest('[data-understanding-share]');
if(understandingShare&&user&&viewerRole()==='teen')void setUnderstandingShare(understandingShare.dataset.understandingShare,understandingShare.getAttribute('aria-pressed')!=='true',user.id,sharedSession);
const insightOpen=e.target.closest('[data-insight-open]');
if(insightOpen&&sharedInsightsEnabled&&themeAccessAllowed()){
  const id=insightOpen.dataset.insightOpen;
  if(id==='general'){activeThemeDeck=null;location.hash='swipe';void fetchSwipeMatches('general');}
  else{const deck=THEME_DECKS.find(d=>d.id===id);if(deck){activeThemeDeck=id;themeCategory='all';themeIndex=nextThemeUnanswered(deck);themeReview=false;location.hash='swipe';void fetchSwipeMatches(id);}}
}
const open=e.target.closest('[data-theme-open]');
if(open&&themeAccessAllowed()){
  const deck=THEME_DECKS.find(d=>d.id===open.dataset.themeOpen);
  if(deck){activeThemeDeck=deck.id;themeCategory='all';themeIndex=nextThemeUnanswered(deck);themeReview=false;themeSaveError='';void fetchSwipeMatches(deck.id);render();scrollLiveMainTop();}
}
if(e.target.closest('#theme-back')){activeThemeDeck=null;themeCategory='all';themeReview=false;void fetchSwipeMatches('general');render();scrollLiveMainTop();}
if(e.target.closest('#theme-restart')&&themeAccessAllowed()){const deck=THEME_DECKS.find(d=>d.id===activeThemeDeck);if(deck){themeReview=true;themeIndex=themeVisibleIndices(deck)[0]??deck.cards.length;themeSaveError='';render();}}
});
document.addEventListener('input',e=>{if(e.target.matches?.('#family-chat-body')){familyChatDraft=e.target.value;familyChatRequestKey=null;familyChatStatus='';return;}if(e.target.matches?.('#schyssta-search')){schysstaSearch=e.target.value.slice(0,100);applySchysstaFilters();return;}if(e.target.matches?.('#schyssta-body')){schysstaDraft=e.target.value;schysstaDraftKey=null;schysstaMessage='';const preview=document.getElementById('schyssta-preview-text');if(preview)preview.textContent=schysstaDraft.trim()||'Skriv en regel ovan för att förhandsgranska texten.';const count=document.getElementById('schyssta-length');if(count)count.textContent=schysstaDraft.length+' av 500 tecken';return;}if(!e.target.matches?.('[data-importance]'))return;e.target.setAttribute('aria-valuetext',importanceValueText(Number(e.target.value)));});
document.addEventListener('change',e=>{
  if(e.target.matches?.('input[data-pf-answer]')){void personalityExperience.handleChange(e.target);return;}
  if(e.target.matches?.('#schyssta-status-filter')){schysstaFilterStatus=['all','approved','ongoing'].includes(e.target.value)?e.target.value:'all';applySchysstaFilters();return;}
  if(e.target.matches?.('#theme-category')&&activeThemeDeck&&themeAccessAllowed()){
    const deck=THEME_DECKS.find(d=>d.id===activeThemeDeck),category=e.target.value;
    if(deck&&(category==='all'||themeCategories(deck).includes(category))){themeCategory=category;themeReview=false;themeIndex=nextThemeUnanswered(deck,0,category);themeSaveError='';render();$('theme-category')?.focus();}
    return;
  }
  if(!e.target.matches?.('[data-importance]')||!user)return;
  void saveImportance(e.target.dataset.deckId,e.target.dataset.cardId,Number(e.target.value),user.id,sharedSession);
});
document.addEventListener('keydown',e=>{
  if(e.target.matches?.('#family-chat-body')&&(e.ctrlKey||e.metaKey)&&e.key==='Enter'){
    e.preventDefault();e.target.closest('form')?.requestSubmit();return;
  }
  if(page()==='swipe'&&user&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();advanceSwipe(e.key==='ArrowRight'?'yes':'no');}});
document.addEventListener('submit',async e=>{if(e.target.id==='family-chat-form'){e.preventDefault();await sendFamilyChatMessage();return;}if(e.target.id==='schyssta-manual-form'){e.preventDefault();await submitManualSchysstaRule();return;}if(e.target.id!=='live-login')return;e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;const feedback=$('login-feedback');feedback.textContent='Loggar in…';const email=$('live-email').value.trim();try{const {error}=await db.auth.signInWithPassword({email,password:$('live-password').value});if(error)throw error;$('live-password') && ($('live-password').value='');await refresh();}catch(err){feedback.textContent='Kunde inte logga in. Kontrollera e-post och lösenord, eller välj ”Glömt lösenord eller saknar lösenord?”.';}finally{b.disabled=false;}});
window.addEventListener('hashchange',()=>{
  if(page()!=='insikter'){insightsRows=[];sharedUnderstandingRows=[];insightsError='';insightsLoading=false;insightsRequest++;}
  if(page()!=='regler'&&page()!=='inkorg'){schysstaSuggestions=[];schysstaRules=[];schysstaManualRules=[];schysstaNotifications=[];schysstaReplacementLinks=[];schysstaHistory=[];schysstaError='';schysstaLoading=false;schysstaRequest++;}
  render();scrollLiveMainTop();
  if(page()==='insikter')void fetchInsights();
  if(page()==='personlighet')void personalityExperience.refreshShared();
  if(['regler','inkorg','hem'].includes(page()))void fetchSchysstaList();
  if(page()==='inkorg')void fetchFamilyChat();
  else if(page()==='hem')void fetchFamilyChatUnread();
  if(page()==='swipe')void pollSharedMatches();
});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden)return;
  void pollSharedMatches();
  if(page()==='personlighet')void personalityExperience.refreshShared();
  // Refresh the family's inbox after returning to the tab, without overwriting a draft.
  if(schysstaListEnabled&&user&&members.length===2&&!schysstaLoading&&!schysstaDraftOpen
    &&['hem','inkorg','regler'].includes(page()))void fetchSchysstaList();
});
window.addEventListener('online',()=>{
  if(schysstaListEnabled&&user&&members.length===2&&!schysstaDraftOpen&&!schysstaLoading
     &&schysstaError&&['hem','inkorg','regler'].includes(page()))void fetchSchysstaList();
});
window.addEventListener('focus',()=>void pollSharedMatches());
// Light polling while the tab is visible. Never rerender the message composer mid-draft.
window.setInterval(()=>{
  if(document.hidden||!user||members.length!==2)return;
  if(page()==='inkorg'&&!familyChatDraft.trim()&&!familyChatSending&&!familyChatLoading)void fetchFamilyChat();
  else if(page()==='hem')void fetchFamilyChatUnread();
},15000);
window.addEventListener('focus',()=>void pollSharedMatches());
window.setInterval(()=>void pollSharedMatches(),SHARED_POLL_INTERVAL_MS);
// If the other family member withdraws consent, remove their profile on the next check.
window.setInterval(()=>{if(!document.hidden&&page()==='personlighet'&&user)void personalityExperience.refreshShared();},15000);
db.auth.onAuthStateChange(()=>setTimeout(()=>refresh().catch(showError),0));
function showError(e){$('live-app').innerHTML=card('<h2>Kunde inte läsa kontot</h2><p>'+esc(e.message)+'</p><a href="./konto.html">Öppna kontosidan</a>');}
refresh().catch(showError);
