import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
import {createPersonalityExperience} from './personality/ipip50-ui.js?v=20261107-authoritative-export4';
import {createAiMediatorExperience} from './ai-mediator-ui.js?v=20261107-authoritative-export4';
import {createAiResultExperience} from './ai-result-ui.js?v=20261107-authoritative-export4';
import {renderParentMiGuide} from './communication/mi-guide.js?v=20261107-authoritative-export4';
import {renderCommunicationToolkit,renderNvcExercise,buildNvcSentence,buildSolutionPlan,buildReflectionPractice,communicationSkillFromHash,openCommunicationSkill} from './communication/toolkit.js?v=20261107-authoritative-export4';
import {GENERAL_CARDS,THEME_DECK_MODELS,ADVICE_BY_KEY,adviceKeyForCard,cardTextForRole} from './card-catalog.js';
const c=window.HEMMAKOMPASSEN_BACKEND;
const sharedPrioritiesEnabled=c.enableSharedPriorities===true;
// Do not activate background polling until the server-side A allowlist and
// authenticated two-account revocation tests have been approved.
const sharedPollingEnabled=c.enableSharedPolling===true;
// Shared insights and explicitly shared B cards are enabled for internal testing.
// Authenticated two-account and revocation verification is still required.
const sharedInsightsEnabled=c.enableSharedInsights===true;
const sharedUnderstandingEnabled=c.enableSharedUnderstanding===true;
const schysstaListEnabled=c.enableSchysstaList===true;
const activityNotificationsEnabled=c.enableActivityNotifications===true;
const personalitySharingEnabled=c.enablePersonalitySharing===true;
const aiResultEnabled=c.enableAiResultAnalyses===true;
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
const mediatorExperience=createAiMediatorExperience({db,config:c,escapeHtml:esc,getViewerRole:()=>viewerRole(),onRender:()=>{if(user&&page()==='medlare')render();}});
const aiResults=createAiResultExperience({db,config:c,onRender:()=>{if(user&&['personlighet','swipe','insikter'].includes(page()))render();}});
const personalityExperience=createPersonalityExperience({db,isSharingEnabled:personalitySharingEnabled,isRetestEnabled:c.enablePrivateRetests===true,
  useAiAnalysis:aiResultEnabled,analysisPanel:(kind,scope,signature)=>aiResults.panel(kind,scope,signature),
  onRender:()=>{if(user&&page()==='personlighet')render();}});
let swipeIndex=0,swipeBusy=false,swipeReview=false,swipeLoadError='',swipeSaveError='';
let sharedMatches=[],sharedPriorities=[],sharedDeckId='general',sharedError='',sharedPriorityError='',sharedLoading=false,sharedSession=0,sharedRequest=0;
let sharedPollPending=false;
// Presentation-only selection. It never changes, fetches, or shares answers.
let sharedMatchFilter={deckId:null,category:null};
let insightsRows=[],insightsLoading=false,insightsError='',insightsRequest=0;
let activityInviteBusy=false,activityInviteError='';
let sharedUnderstandingRows=[],understandingShareError='';
let schysstaSuggestions=[],schysstaRules=[],schysstaManualRules=[],schysstaNotifications=[],schysstaReplacementLinks=[],schysstaHistory=[],schysstaEndTarget=null,schysstaLoading=false,schysstaError='',schysstaRequest=0;
let schysstaDraft='',schysstaDraftOpen=false,schysstaDraftKey=null,schysstaEditTarget=null,schysstaSubmitting=false,schysstaMessage='',schysstaCopyMessage='',schysstaFocusId='',schysstaSearch='',schysstaFilterStatus='all';
const schysstaSaving=new Set();
let activityNotifications=[],activityNotificationsError='',activityNotificationsLoading=false,
  activityNotificationsRequest=0,activityMarkBusy=null,activityFeedback='';
const ACTIVITY_DECK_LABELS=Object.freeze({
  general:'Allmänna frågor',samtal:'Samtalsämnen',aktiviteter:'Aktiviteter',
  regler:'Regler',uppskattning:'Uppskattning',aterhamtning:'Återhämtning',
  forandring:'Förändring'
});
// Independent of agreement notifications: a current family's private 1:1 conversation.
let familyChatMessages=[],familyChatUnread=0,familyChatLoading=false,familyChatLoadingOlder=false,
  familyChatHasMore=false,familyChatError='',familyChatStatus='',familyChatDraft='',
  familyChatRequestKey=null,familyChatSending=false,familyChatRequest=0,familyChatCountRequest=0,
  familyChatUnreadError=false,familyChatReadBusy=false;
function validActivityNotifications(rows){
  if(!Array.isArray(rows)||rows.length>30)return false;
  const allowed=['notification_id','event_kind','deck_id','read_at','updated_at'];
  return rows.every(row=>row&&typeof row==='object'&&!Array.isArray(row)
    &&Object.keys(row).length===allowed.length
    &&Object.keys(row).every(k=>allowed.includes(k))
    &&SCHYSSTA_UUID.test(row.notification_id)
    &&['mutual_match','teen_shared_understanding'].includes(row.event_kind)
    &&Object.hasOwn(ACTIVITY_DECK_LABELS,row.deck_id)
    &&(row.event_kind!=='teen_shared_understanding'||row.deck_id==='general')
    &&(row.read_at===null||(typeof row.read_at==='string'&&!Number.isNaN(Date.parse(row.read_at))))
    &&typeof row.updated_at==='string'&&!Number.isNaN(Date.parse(row.updated_at)))
    &&new Set(rows.map(row=>row.notification_id)).size===rows.length;
}
// Snapshot actual pair identity, not just its member count. A replacement pair
// must never inherit an in-flight response from the previous pair.
const activityPairSignature=()=>JSON.stringify(members.map(member=>[
  member.user_id,member.role,member.family_id??null,member.joined_at??null
]).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))));
const activityUnreadCount=()=>activityNotifications.filter(n=>n.read_at===null).length;
async function fetchActivityNotifications({quiet=false}={}){
  const request=++activityNotificationsRequest,viewer=user?.id,session=sharedSession,pair=activityPairSignature();
  if(!activityNotificationsEnabled||!viewer||members.length!==2){
    activityNotifications=[];activityNotificationsError='';activityNotificationsLoading=false;
    if(['hem','inkorg'].includes(page())&&!familyChatDraft.trim())render();
    return;
  }
  const previous=JSON.stringify([activityNotifications,activityNotificationsError]);
  activityNotificationsLoading=true;
  if(!quiet&&page()==='inkorg'&&!familyChatDraft.trim())render();
  let result;
  try{result=await db.rpc('my_activity_notifications');}catch(e){result={error:e};}
  if(request!==activityNotificationsRequest||viewer!==user?.id||session!==sharedSession)return;
  if(pair!==activityPairSignature()){
    activityNotifications=[];activityNotificationsError='';activityNotificationsLoading=false;
    if(['hem','inkorg'].includes(page())&&(page()!=='inkorg'||!familyChatDraft.trim()))render();
    else menu();
    return;
  }
  if(members.length!==2||!activityNotificationsEnabled){
    // The pairing may have disappeared without another refresh invalidating this request.
    activityNotifications=[];activityNotificationsError='';activityNotificationsLoading=false;
    if(['hem','inkorg'].includes(page())&&(page()!=='inkorg'||!familyChatDraft.trim()))render();
    else menu();
    return;
  }
  activityNotificationsLoading=false;
  if(result?.error||!validActivityNotifications(result?.data)){
    activityNotifications=[];activityNotificationsError='Aktivitetsaviseringar kunde inte kontrolleras. Försök igen.';
  }else{
    activityNotifications=result.data;activityNotificationsError='';activityFeedback='';
  }
  if(previous===JSON.stringify([activityNotifications,activityNotificationsError]))return;
  if(['hem','inkorg'].includes(page())&&(page()!=='inkorg'||!familyChatDraft.trim()))render();
  else menu();
}
async function markActivityNotificationRead(notificationId){
  if(!activityNotificationsEnabled||!user||members.length!==2||activityMarkBusy
    ||!SCHYSSTA_UUID.test(notificationId)
    ||!activityNotifications.some(n=>n.notification_id===notificationId&&n.read_at===null))return;
  const viewer=user.id,session=sharedSession,pair=activityPairSignature();
  activityMarkBusy=notificationId;activityFeedback='';
  if(page()==='inkorg'&&!familyChatDraft.trim())render();
  let result;
  try{result=await db.rpc('mark_activity_notification_read',{p_notification_id:notificationId});}
  catch(e){result={error:e};}
  if(viewer!==user?.id||session!==sharedSession)return;
  if(members.length!==2||!activityNotificationsEnabled||pair!==activityPairSignature()){
    activityMarkBusy=null;return;
  }
  activityMarkBusy=null;
  if(result?.error){
    activityFeedback='Det gick inte att bekräfta läsmarkeringen. Uppdatera aviseringarna.';
    // An unconfirmed write must never be treated as a confirmed unread count.
    activityNotificationsError=activityFeedback;
    activityNotifications=[];
    if(page()==='inkorg'&&!familyChatDraft.trim())render();
    else menu();
    return;
  }
  // Recheck server state, rather than optimistically removing the unread badge.
  await fetchActivityNotifications();
}
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
  familyChatMessages=[];familyChatUnread=0;familyChatUnreadError=false;familyChatReadBusy=false;familyChatLoading=false;familyChatLoadingOlder=false;
  familyChatHasMore=false;familyChatError='';familyChatStatus='';familyChatDraft='';
  familyChatRequestKey=null;familyChatSending=false;
}
// Recheck family membership on the server before background inbox reads.
// Membership can change in another tab without an Auth event in this one.
// Display names are deliberately ignored: only the two exact role/user IDs
// determine whether the locally displayed private conversation is current.
function sameInboxPair(previous,current,viewer){
  const valid=rows=>Array.isArray(rows)&&rows.length===2
    &&rows.some(m=>m?.role==='parent'&&typeof m.user_id==='string')
    &&rows.some(m=>m?.role==='teen'&&typeof m.user_id==='string')
    &&rows.some(m=>m?.user_id===viewer)
    &&new Set(rows.map(m=>m.user_id)).size===2;
  return valid(previous)&&valid(current)
    &&['parent','teen'].every(role=>
      previous.find(m=>m.role===role)?.user_id===current.find(m=>m.role===role)?.user_id);
}
let inboxPairCheckBusy=false,inboxPairEpoch=null;
async function recheckInboxPair(){
  if(inboxPairCheckBusy||!user||members.length!==2)return false;
  const viewer=user.id,session=sharedSession,oldMembers=members;
  inboxPairCheckBusy=true;
  let result,epoch;
  try{[result,epoch]=await Promise.all([db.rpc('my_family_members'),db.rpc('my_current_inbox_pair_epoch')]);}
  catch(error){result={error};}
  finally{inboxPairCheckBusy=false;}
  if(user?.id!==viewer||sharedSession!==session)return false;
  if(!result?.error&&sameInboxPair(oldMembers,result.data,viewer)
    &&typeof epoch?.data==='string'&&epoch.data.length>0
    &&!epoch.error&&epoch.data===inboxPairEpoch)return true;
  // Fail closed, including RPC failure. Invalidate in-flight message reads
  // before triggering refresh, so neither previous messages nor old badges
  // can survive a revoked pairing or a failed membership check.
  sharedSession++;
  clearFamilyChat();
  inboxPairEpoch=null;
  members=[];
  render();
  void refresh().catch(showError);
  return false;
}
async function fetchFamilyChatUnread(){
  if(!user||members.length!==2||!inboxPairEpoch){familyChatUnread=0;familyChatUnreadError=!!user&&members.length===2&&!inboxPairEpoch;return;}
  const request=++familyChatCountRequest,viewer=user.id,session=sharedSession;
  let result;
  try{result=await db.rpc('my_family_unread_message_count');}catch(e){result={error:e};}
  if(request!==familyChatCountRequest||user?.id!==viewer||sharedSession!==session)return;
  const beforeCount=familyChatUnread,beforeError=familyChatUnreadError;
  if(result?.error||!Number.isInteger(result?.data)||result.data<0){
    familyChatUnread=0;familyChatUnreadError=true;
  }else {familyChatUnread=result.data;familyChatUnreadError=false;}
  // Keep a reader's scroll/focus still if the count and confidence are unchanged.
  if(beforeCount===familyChatUnread&&beforeError===familyChatUnreadError)return;
  if(['hem','regler'].includes(page())||(page()==='inkorg'&&!familyChatDraft.trim()))render();
  else menu();
}
// Keep already-read older pages on routine refresh only when the newest
// server page overlaps this exact conversation. On revocation, re-pairing,
// empty/error responses or an unrelated page, fail closed to fresh data.
function mergeFamilyChatPage(previous,latest,{older=false,quiet=false,hasMore=false}={}){
  if(older){
    const seen=new Set(previous.map(message=>message.message_id));
    return {messages:[...previous,...latest.filter(message=>!seen.has(message.message_id))],
      hasMore:latest.length===50};
  }
  if(quiet&&previous.length>50&&latest.length===50){
    const anchor=previous.findIndex(message=>message.message_id===latest[latest.length-1].message_id);
    if(anchor>=0){
      const refreshed=new Set(latest.map(message=>message.message_id));
      return {messages:[...latest,...previous.slice(anchor+1).filter(message=>!refreshed.has(message.message_id))],
        hasMore};
    }
  }
  return {messages:latest,hasMore:latest.length===50};
}
async function fetchFamilyChat(older=false,{quiet=false}={}){
  if(!user||members.length!==2||!inboxPairEpoch)return;
  if(older?(!familyChatHasMore||familyChatLoadingOlder||familyChatLoading):(familyChatLoading||familyChatLoadingOlder))return;
  const viewer=user.id,session=sharedSession,request=++familyChatRequest;
  const oldest=older?familyChatMessages[familyChatMessages.length-1]:null;
  const previous=quiet?JSON.stringify([familyChatMessages,familyChatHasMore,familyChatError]):null;
  familyChatError='';
  if(!quiet)familyChatStatus='';
  if(older)familyChatLoadingOlder=true;else familyChatLoading=true;
  if(!quiet&&page()==='inkorg'&&!familyChatDraft.trim()&&!familyChatMessages.length)render();
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
    if(!older){
      familyChatMessages=[];familyChatHasMore=false;
      // Message loading cannot establish a trusted unread count.
      // Do not present a zero as confirmed until the count RPC succeeds.
      familyChatUnread=0;familyChatUnreadError=true;
    }
  }else{
    const merged=mergeFamilyChatPage(familyChatMessages,result.data,
      {older,quiet,hasMore:familyChatHasMore});
    familyChatMessages=merged.messages;
    familyChatHasMore=merged.hasMore;
    // Loading a message page must never create a receipt for pages not viewed.
    // Only the deliberate mark-all action below calls the RPC.
    if(!older&&page()==='inkorg')void fetchFamilyChatUnread();
  }
  const changed=!quiet||previous!==JSON.stringify([familyChatMessages,familyChatHasMore,familyChatError]);
  if(changed&&page()==='inkorg'&&!familyChatDraft.trim()){
    // Rerendering the paged conversation must not strand keyboard users.
    const hadOlderFocus=older&&document.activeElement?.matches?.('[data-family-chat-more]');
    render();
    if(hadOlderFocus){
      const focusTarget=document.querySelector('[data-family-chat-more]')||
        document.querySelector('.family-chat-history');
      focusTarget?.focus({preventScroll:true});
    }
  }else if(changed)menu();
}
async function markAllFamilyChatRead(){
  if(!user||members.length!==2||!inboxPairEpoch||familyChatReadBusy||familyChatLoading||familyChatUnreadError||familyChatUnread<1)return false;
  const viewer=user.id,session=sharedSession;
  familyChatReadBusy=true;
  familyChatStatus='Markerar alla meddelanden som lästa…';
  render();
  let result;
  try{result=await db.rpc('mark_family_messages_read');}catch(e){result={error:e};}
  if(user?.id!==viewer||sharedSession!==session)return false;
  familyChatReadBusy=false;
  if(result?.error||!Number.isInteger(result?.data)||result.data<0){
    familyChatStatus='Det gick inte att markera meddelandena som lästa. Inga läskvittenser har bekräftats.';
    render();return false;
  }
  // A count request started before this RPC must not restore the stale badge.
  familyChatCountRequest++;
  familyChatUnread=0;familyChatUnreadError=false;
  familyChatStatus='Alla meddelanden har markerats som lästa.';
  render();
  // Another message may have arrived while the receipt RPC was in flight.
  // Fetch a fresh authoritative count instead of trusting a stale zero.
  void fetchFamilyChatUnread();
  return true;
}
async function sendFamilyChatMessage(){
  if(!user||members.length!==2||!inboxPairEpoch||familyChatSending)return;
  const body=familyChatDraft.trim();
  if(!body||body.length>1500){familyChatStatus='Skriv ett meddelande med högst 1 500 tecken.';render();return;}
  if(!familyChatRequestKey)familyChatRequestKey=crypto.randomUUID();
  const viewer=user.id,session=sharedSession,token=familyChatRequestKey;
  familyChatSending=true;familyChatStatus='Skickar meddelandet…';render();
  let result,timer;
  try{
    result=await Promise.race([
      db.rpc('send_family_message',{p_body:body,p_request_key:token}),
      new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Message send timed out')),15000);})
    ]);
  }catch(e){result={error:e};}
  finally{clearTimeout(timer);}
  if(viewer!==user?.id||session!==sharedSession)return;
  familyChatSending=false;
  if(result?.error||!SCHYSSTA_UUID.test(result?.data)){
    // A lost response does not prove that the server failed to send the message.
    // Reuse the request key with the unchanged draft for a duplicate-safe retry.
    familyChatStatus='Vi kunde inte bekräfta om meddelandet skickades. Försök igen med samma text – ett återförsök med samma text skapar ingen dubblett.';
    render();return;
  }
  // Never discard text typed or prepared after this request started.
  if(familyChatDraft.trim()===body)familyChatDraft='';
  if(familyChatRequestKey===token)familyChatRequestKey=null;
  familyChatStatus='Meddelandet har skickats.';
  await fetchFamilyChat();
}
// A local, session-only pause never records a NO vote or changes shared data.
const schysstaPausedIds=new Set();
const understandingShares=new Set();
const understandingShareSaving=new Set();
const SHARED_POLL_INTERVAL_MS=15000;
// Consent-sensitive shared insights refresh independently of general match polling.
const INSIGHTS_CONSENT_REFRESH_MS=60000;
let themesUnlocked=false,themesLoading=false,themesError='',themesRequest=0;
const swipeAnswers=new Map();
const themeAnswers=new Map(THEME_DECKS.map(deck=>[deck.id,new Map()]));
const swipeImportance=new Map();
const importancePending=new Map();
const importanceSaving=new Set();
let importanceAvailable=false,importanceLoadError='';
const priorityShares=new Set();
const priorityShareSaving=new Set();
let prioritySharesAvailable=false,priorityShareError='';
let activeThemeDeck=null,themeCategory='all',themeIndex=0,themeReview=false,themeSaveError='';
let swipeSkippedReview=false;
// Ephemeral private-list context, invalidated on refresh or account switch.
let generalReviewEdit=null;
let themeReviewEdit=null;
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
const nextSkippedAfter=index=>visibleGeneralIndices().find(i=>i>index&&skippedUnderstanding.has(swipeCardId(i)))??STATEMENTS.length;
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
    if(next.value!==1&&priorityShares.delete(key)&&sharedPrioritiesEnabled)await fetchSwipeMatches(next.deckId,{quiet:true});
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
// This fact-only summary remains visible when AI replaces editorial advice.
// It is constructed exclusively from server-verified mutual A-YES groups.
function sharedFactOverview(groups,title='Gemensamt i korthet'){
  const entries=[...groups.entries()].filter(([,items])=>items.length>0);
  if(!entries.length)return '';
  const overview=entries.map(([category,items])=>{
    const icon=summaryIconFor(category,items[0].statement);
    const first=items[0].statement;
    const rest=items.length-1;
    return '<li>'+summaryIcon(icon)+'<div><h4>'+esc(category)+' · '+items.length+' '+
      (items.length===1?'gemensamt ja-svar':'gemensamma ja-svar')+'</h4>'+
      '<span class="swipe-summary-icon-label">'+esc(icon.name)+': </span>'+
      '<p>'+esc(first)+(rest?' · och '+rest+' till':'')+'</p></div></li>';
  }).join('');
  return '<aside class="swipe-fact-summary" aria-labelledby="shared-fact-heading">'+
    '<span class="swipe-summary-label">ÖVERSIKT · SERVERVERIFIERADE JA-SVAR</span>'+
    '<h3 id="shared-fact-heading">'+esc(title)+'</h3>'+
    '<p class="live-muted">En kort översikt över kort där ni båda sagt ja. Inga privata svar eller förskrivna råd visas här.</p>'+
    '<ul class="swipe-summary-overview">'+overview+'</ul></aside>';
}

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

// Personal preview only. Shared priority data is not exposed while the
// consent-verified shared-priority feature is disabled in the test release.
function privateTeenPrioritySummary(matchedById,deckId){
  if(viewerRole()!=='teen'||!importanceAvailable)return '';
  const selected=[...matchedById.values()]
    .filter(item=>swipeImportance.get(importanceKey(deckId,item.card.id))===1)
    .sort((a,b)=>a.card.id.localeCompare(b.card.id));
  if(!selected.length)return '';
  const entries=selected.map(item=>{
    const key=importanceKey(deckId,item.card.id),shared=priorityShares.has(key),saving=priorityShareSaving.has(key);
    return '<li><p>'+esc(item.statement)+'</p>'+(sharedPrioritiesEnabled
      ?'<button type="button" class="swipe-priority-share" data-priority-share data-deck-id="'+esc(deckId)+'" data-card-id="'+esc(item.card.id)+'" aria-pressed="'+shared+'" '+('aria-disabled="'+(!prioritySharesAvailable||saving)+'"')+'>'+(saving?'Sparar…':shared?'Återkalla delning':'Dela som gemensamt fokus')+'</button>'
      :'')+'</li>';
  }).join('');
  const consentIntro=sharedPrioritiesEnabled
    ?'<p>Din markering är privat tills du själv väljer <strong>Dela som gemensamt fokus</strong>. Delningen gäller bara det här kortet, där ni båda redan svarat ja, och du kan återkalla den när som helst.</p>'
    :'<p>Här ser du sådant som ni båda svarat ja till och som du själv markerat som mycket viktigt.</p>';
  const consentStatus=sharedPrioritiesEnabled
    ?'<p class="swipe-priority-share-status" role="'+(prioritySharesAvailable?'status':'alert')+'">'+
      esc(priorityShareError||(prioritySharesAvailable
        ?'Du bestämmer separat för varje kort. Föräldern ser aldrig din privata nivå, bara aktivt delade fokus.'
        :'Delningens aktuella status går inte att kontrollera. Det är möjligt att ett kort fortfarande är delat.'))+'</p>'+
      (!prioritySharesAvailable?'<button type="button" class="live-button" data-priority-retry>Kontrollera delningen igen</button>':'')
    :'';
  return '<aside class="swipe-priority-summary swipe-private-priority" aria-label="Dina privata prioriteringar">'+
    '<span class="swipe-summary-label">'+(sharedPrioritiesEnabled?'DIN PRIVATA ÖVERSIKT · DELNING PER KORT':'ENDAST FÖR DIG · INTE DELAT')+'</span>'+
    '<h3>Mina viktigaste gemensamma ja-svar</h3>'+
    consentIntro+
    '<ul class="swipe-match-list">'+entries+'</ul>'+
    consentStatus+
    '<p class="live-muted">Den här listan visas bara för dig. Föräldern ser inte dina privata viktighetsskattningar här. AI-medlaren kan använda dina egna skattningar när projektkontexten är påslagen.</p></aside>';
}

// An RPC response can be lost after the server has saved or revoked a share.
// Read the RLS-protected consent row again instead of guessing the outcome.
async function verifyPriorityShares(viewer,session){
  let result;
  try{result=await db.from('swipe_priority_shares').select('deck_id,card_id').eq('user_id',viewer);}
  catch(e){result={error:e};}
  if(user?.id!==viewer||sharedSession!==session)return false;
  priorityShares.clear();
  if(result?.error||!Array.isArray(result?.data)){
    prioritySharesAvailable=false;
    return false;
  }
  for(const row of result.data){
    if(validImportanceCard(row?.deck_id,row?.card_id))priorityShares.add(importanceKey(row.deck_id,row.card_id));
  }
  prioritySharesAvailable=viewerRole()==='teen'&&members.length===2;
  return prioritySharesAvailable;
}

async function setPriorityShare(deckId,cardId,share,viewer,session){
  const key=importanceKey(deckId,cardId);
  const eligible=sharedPrioritiesEnabled&&prioritySharesAvailable&&viewerRole()==='teen'&&members.length===2&&
    swipeImportance.get(key)===1&&sharedDeckId===deckId&&sharedMatches.some(row=>row.deck_id===deckId&&row.card_id===cardId&&row.answer===true)&&
    sharedDeck(deckId)?.cards.some(card=>card.id===cardId&&card.type==='match');
  if(!eligible||user?.id!==viewer||sharedSession!==session||priorityShareSaving.has(key))return;
  priorityShareSaving.add(key);priorityShareError='';render();
  let error;
  try{({error}=await db.rpc('set_swipe_priority_share',{p_deck_id:deckId,p_card_id:cardId,p_share:share}));}
  catch(e){error=e;}
  if(user?.id!==viewer||sharedSession!==session)return;
  const verified=await verifyPriorityShares(viewer,session);
  if(user?.id!==viewer||sharedSession!==session)return;
  priorityShareSaving.delete(key);
  if(!verified){
    priorityShareError='Serverns delningsstatus kunde inte kontrolleras. Det går inte att veta om kortet fortfarande är delat. Kontrollera igen innan du litar på en återkallelse.';
    render();
    return;
  }
  const isShared=priorityShares.has(key);
  if(isShared!==share){
    priorityShareError=share
      ?'Servern bekräftar inte någon delning av kortet. Försök igen.'
      :'Kortet är fortfarande delat enligt servern. Återkallelsen har inte bekräftats. Försök igen.';
  }else if(error){
    priorityShareError=share
      ?'Servern bekräftar att kortet är delat trots ett kommunikationsfel. Du kan återkalla delningen.'
      :'Servern bekräftar att delningen är återkallad trots ett kommunikationsfel.';
  }else{
    priorityShareError=share
      ?'Delat som gemensamt fokus. Du kan återkalla när som helst.'
      :'Delningen är återkallad och tas bort från det gemensamma fokuset.';
  }
  await fetchSwipeMatches(deckId,{quiet:true});
  if(page()==='swipe')render();
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
  const activeFilter=sharedMatchFilter.deckId===deckId&&groups.has(sharedMatchFilter.category)
    ?sharedMatchFilter.category:null;
  const categoryPicker=groups.size>1?'<div class="swipe-match-filter" role="group" aria-label="Filtrera gemensamma träffar efter ämne">'+
    '<button type="button" class="schyssta-secondary" data-shared-match-filter="all" data-deck-id="'+esc(deckId)+'" aria-pressed="'+(!activeFilter)+'">Alla ('+[...groups.values()].reduce((sum,items)=>sum+items.length,0)+')</button>'+
    [...groups].map(([category,items])=>'<button type="button" class="schyssta-secondary" data-shared-match-filter="'+esc(category)+'" data-deck-id="'+esc(deckId)+'" aria-pressed="'+(activeFilter===category)+'">'+esc(category)+' ('+items.length+')</button>').join('')+
    '</div>':'';
  const visibleGroups=activeFilter?new Map([[activeFilter,groups.get(activeFilter)]]):groups;
  const themes=[...visibleGroups.entries()].map(([category,items])=>
    '<section class="swipe-match-theme"><h4>'+esc(category)+'</h4><ul class="swipe-match-list">'+
    items.map(item=>'<li><p>'+esc(item.statement)+'</p>'+
      (deckId==='aktiviteter'?
        '<button type="button" class="schyssta-secondary" data-insight-activity="'+esc(item.card.id)+'"'+
        (activityInviteBusy?' disabled':'')+'>Föreslå tid i inkorgen</button>':'')+'</li>').join('')+
    '</ul></section>'
  ).join('');
  const matchedById=new Map([...groups.values()].flat().map(item=>[item.card.id,item]));
  const privatePriority=privateTeenPrioritySummary(matchedById,deckId);
  const priorityItems=sharedPriorities
    .filter(row=>row?.deck_id===deckId&&matchedById.has(row.card_id))
    .map(row=>matchedById.get(row.card_id))
    .sort((a,b)=>a.card.id.localeCompare(b.card.id));
  const priorityIds=new Set(priorityItems.map(item=>item.card.id));
  const useAi=typeof aiResultEnabled!=='undefined'&&aiResultEnabled;
  const sig=useAi?swipeAiSignature(deckId):null;
  const aiPriority=priorityItems.length?'<aside class="swipe-priority-summary"><h3>Viktigast att fokusera på</h3>'+
    '<p>Prioriterade, gemensamt bejakade kort:</p><ul>'+
    priorityItems.map(item=>'<li>'+esc(item.statement)+'</li>').join('')+'</ul></aside>':'';
  return title+'<p class="live-muted">Bara kort där ni båda svarat ja visas här. Se dem som möjliga samtalsöppningar, inte som färdiga överenskommelser.</p>'+
    (sharedPrioritiesEnabled&&sharedPriorityError?'<p role="alert">'+esc(sharedPriorityError)+'</p>':'')+
    (deckId==='aktiviteter'&&activityInviteError?'<p role="alert">'+esc(activityInviteError)+'</p>':'')+
    privatePriority+
    (useAi?aiPriority:sharedPrioritySummary(priorityItems,deckId))+
    '<div class="swipe-match-group"><h3>Det ni båda svarat ja till</h3><p class="live-muted">Filtreringen ändrar bara vad som visas här, inte era svar eller sammanfattningen.</p>'+categoryPicker+themes+'</div>'+
    (useAi?sharedFactOverview(groups)+aiResults.panel('swipe',deckId,sig):sharedSummary(groups,deckId,priorityIds))+
    button+'</section>';
}
// A shared-match refresh must not collapse a user's expanded private answer list.
// Only restores local presentation for the same signed-in account and pairing session.
function renderKeepingGeneralReview(){
 // Existing shared-match refresh also redraws themed decks. Preserve only this
 // viewer's expanded private answer list, never remote or stale session data.
 if(page()==='swipe'&&activeThemeDeck){
  const owner=user?.id,session=sharedSession,deckId=activeThemeDeck;
  const root=$('swipe-private-review');
  const expanded=root?.querySelector('details')?.open===true;
  const active=document.activeElement;
  const state=expanded?{
   search:String($('private-theme-review-search')?.value||'').slice(0,120),
   filter:$('private-theme-review-answer')?.value||'all',
   focusIndex:active?.closest?.('[data-theme-review-index]')?.dataset.themeReviewIndex,
   focusId:active?.id?.startsWith('private-theme-review-')?active.id:null
  }:null;
  render();
  if(!state||owner!==user?.id||session!==sharedSession||deckId!==activeThemeDeck||page()!=='swipe')return;
  const replacement=$('swipe-private-review');if(!replacement)return;
  const details=replacement.querySelector('details');if(details)details.open=true;
  const search=$('private-theme-review-search'),filter=$('private-theme-review-answer');
  if(search)search.value=state.search;
  if(filter)filter.value=['yes','no'].includes(state.filter)?state.filter:'all';
  filterPrivateThemeReview();
  if(state.focusIndex){
   const button=[...replacement.querySelectorAll('[data-theme-review-index]')].find(b=>
    b.dataset.themeReviewIndex===state.focusIndex&&!b.closest('[data-private-theme-answer]')?.hidden);
   (button||search)?.focus({preventScroll:true});
  }else if(state.focusId)document.getElementById(state.focusId)?.focus({preventScroll:true});
  return;
 }
 const owner=user?.id,session=sharedSession;
 const root=page()==='swipe'&&!activeThemeDeck?$('swipe-general-review'):null;
 const expanded=root?.querySelector('details')?.open===true;
 const active=document.activeElement;
 const focusIndex=expanded?active?.closest?.('[data-general-review-index]')?.dataset.generalReviewIndex:null;
 const focusId=expanded&&active?.id?.startsWith('swipe-general-review-')?active.id:null;
 const state=expanded?{
  search:String($('swipe-general-review-search')?.value||'').slice(0,120),
  filter:$('swipe-general-review-answer')?.value||'all',
  focusIndex,focusId
 }:null;
 render();
 if(!state||owner!==user?.id||session!==sharedSession||page()!=='swipe'||activeThemeDeck)return;
 const replacement=$('swipe-general-review');
 if(!replacement)return;
 const details=replacement.querySelector('details');
 if(details)details.open=true;
 const search=$('swipe-general-review-search'),answer=$('swipe-general-review-answer');
 if(search)search.value=state.search;
 if(answer)answer.value=['yes','no','skipped'].includes(state.filter)?state.filter:'all';
 filterPrivateGeneralReview();
 if(focusIndex){
  const selected=[...replacement.querySelectorAll('[data-general-review-index]')].find(b=>
    b.dataset.generalReviewIndex===focusIndex&&!b.closest('[data-general-review-kind]')?.hidden);
  (selected||search)?.focus({preventScroll:true});
 }else if(focusId){
  document.getElementById(focusId)?.focus({preventScroll:true});
 }
}
async function fetchSwipeMatches(deckId='general',{quiet=false}={}){
  if(!user||members.length!==2)return;
  const deck=sharedDeck(deckId);
  if(!deck)return;
  const viewer=user.id,session=sharedSession,request=++sharedRequest;
  const quietRefresh=quiet&&sharedDeckId===deckId&&!sharedLoading&&!sharedError;
  const previousResults=quietRefresh?JSON.stringify([sharedMatches,sharedPriorities,sharedPriorityError]):null;
  sharedDeckId=deckId;
  if(!quietRefresh){sharedMatches=[];sharedPriorities=[];sharedLoading=true;sharedError='';sharedPriorityError='';
    if(page()==='swipe'&&!swipeBusy)renderKeepingGeneralReview();}
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
    // A failed priority RPC must not leave an earlier consent-derived result
    // visible after a quiet refresh (e.g. a share was revoked elsewhere).
    sharedPriorities=[];
    sharedPriorityError='';
    if(sharedPrioritiesEnabled&&(priorityResult.error||!Array.isArray(priorityResult.data))){
      sharedPriorityError='Delade prioriteringar kunde inte kontrolleras. Tidigare prioriterade fokus har dolts tills servern svarar igen.';
    }else if(sharedPrioritiesEnabled){
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
    sharedPriorityError='';
    sharedError='Gemensamma resultat är inte tillgängliga just nu. Försök igen senare.';
  }finally{
    if(session===sharedSession&&request===sharedRequest&&user?.id===viewer&&sharedDeckId===deckId){
      sharedLoading=false;
      if(page()==='swipe'&&!swipeBusy&&(!quietRefresh||sharedError||previousResults!==JSON.stringify([sharedMatches,sharedPriorities,sharedPriorityError])))renderKeepingGeneralReview();
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
function swipeAiSignature(deckId){
  if(!user||sharedLoading||sharedError||sharedDeckId!==deckId||!sharedMatches.length)return null;
  const deck=sharedDeck(deckId);
  const allowed=sharedMatches.filter(row=>row.answer===true&&row.deck_id===deckId&&
    deck?.cards.some(card=>card.id===row.card_id&&card.type==='match'));
  return allowed.length?JSON.stringify([user.id,viewerRole(),deckId,allowed,sharedPriorities]):null;
}
function insightsAiSignature(){
  if(!user||insightsLoading||insightsError||(!insightsRows.length&&!sharedUnderstandingRows.length))return null;
  return JSON.stringify([user.id,viewerRole(),insightsRows,sharedUnderstandingEnabled?sharedUnderstandingRows:[]]);
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
    '<section id="insights-deck-'+esc(deck.id)+'" tabindex="-1" class="live-panel insights-deck"><h3>'+esc(deck.title)+'</h3>'+
    [...groups.entries()].map(([category,texts])=>
      '<div class="swipe-match-theme"><h4>'+esc(category)+'</h4><ul class="swipe-match-list">'+
      texts.map(t=>{
        const activity=deck.id==='aktiviteter'?deck.cards.find(card=>
          card.type==='match'&&cardTextForRole(card,viewerRole())===t&&
          insightsRows.some(row=>row.answer===true&&row.deck_id==='aktiviteter'&&row.card_id===card.id)
        ):null;
        return '<li><p>'+esc(t)+'</p>'+(activity?
          '<button type="button" class="schyssta-secondary" data-insight-activity="'+esc(activity.id)+'"'+
          (activityInviteBusy?' disabled':'')+'>Föreslå tid i inkorgen</button>':'')+'</li>';
      }).join('')+'</ul></div>'
    ).join('')+
    '<button type="button" class="live-button" data-insight-open="'+esc(deck.id)+'">Öppna '+esc(deck.title)+'</button></section>'
  ).join('');
  // Aggregate only the A cards that passed the existing verified byDeck filter.
  const overviewGroups=new Map();
  for(const {groups} of byDeck.values()){
    for(const [category,texts] of groups){
      if(!overviewGroups.has(category))overviewGroups.set(category,[]);
      for(const statement of texts)overviewGroups.get(category).push({statement});
    }
  }
  const empty='<p class="live-muted">Inga gemensamma ja-svar att visa ännu. Ett kort syns först när ni båda har svarat ja.</p>';
  const requested=insightTargetFromHash(location.hash);
  const stillShared=requested==='forstaelse'?sharedUnderstandingRows.length>0:byDeck.has(requested);
  const missingTargetNotice=requested&&!stillShared
    ?'<p id="insights-target-unavailable" tabindex="-1" role="status">Den här insikten är inte längre tillgänglig eller delad. Du kan se andra gemensamma insikter nedan.</p>':'';
  return title+missingTargetNotice+'<section class="live-panel" aria-labelledby="insights-a-heading"><h2 id="insights-a-heading">Möjligt att utforska</h2>'+
    '<p class="live-muted">Endast serververifierade JA+JA på A-kort. Det här är möjligheter, inte färdiga överenskommelser. För aktiviteter kan du öppna ett frivilligt meddelandeutkast, utan att något skickas automatiskt.</p>'+ 
    (activityInviteError?'<p role="alert">'+esc(activityInviteError)+'</p>':'')+
    (sections?sharedFactOverview(overviewGroups,'Gemensamt i alla kortlekar'): '')+(sections||empty)+
    (aiResultEnabled&&insightsAiSignature()?aiResults.panel('swipe','all',insightsAiSignature()):'')+'</section>'+
    '<section id="insights-understanding" tabindex="-1" class="live-panel" aria-labelledby="insights-b-heading"><h2 id="insights-b-heading">'+
    (viewerRole()==='parent'?'Så här funkar min tonåring':'Så här funkar jag')+
    '</h2>'+understandingInsights()+'</section>'+
    '<button type="button" class="live-button" id="insights-retry">Uppdatera gemensamma insikter</button></div>';
}
async function fetchInsights({quiet=false}={}){
  if(quiet&&insightsLoading)return;
  const viewer=user?.id,session=sharedSession,request=++insightsRequest;
  const previousSnapshot=quiet?JSON.stringify([insightsRows,sharedUnderstandingRows,insightsError]):null;
  // Full manual refresh clears first. Quiet consent rechecks keep the prior
  // server-verified display until a new all-deck snapshot is confirmed.
  // Failure clears BOTH A and B results, rather than retaining stale data.
  if(!quiet){insightsRows=[];sharedUnderstandingRows=[];insightsError='';insightsLoading=false;}
  if(!sharedInsightsEnabled||!viewer||members.length!==2||!members.some(m=>m.user_id===viewer)||
     !members.some(m=>m.role==='parent')||!members.some(m=>m.role==='teen')||page()!=='insikter'){
    insightsRows=[];sharedUnderstandingRows=[];insightsError='';insightsLoading=false;render();return;
  }
  insightsLoading=true;
  if(!quiet)render();
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
      insightsLoading=false;
      // Same data: avoid unnecessary rerenders, scroll jumps and AI requests.
      // Changed/revoked sharing creates a different analysis signature.
      if(!quiet||previousSnapshot!==JSON.stringify([insightsRows,sharedUnderstandingRows,insightsError]))render();
      // Focus once on an intentional deep-link load; quiet consent refreshes never steal focus.
      if(!quiet&&!insightsError)focusInsightTarget();
    }
  }
}


async function prepareActivityMessage(cardId){
  // A verified activity match is the only source. B, NO and unilateral answers
  // never become a message draft. Recheck the server before showing a draft.
  const origin=page();
  const verifiedCurrent=origin==='insikter'
    ? !insightsLoading&&!insightsError&&insightsRows.some(row=>
      row.answer===true&&row.deck_id==='aktiviteter'&&row.card_id===cardId)
    : origin==='swipe'&&sharedDeckId==='aktiviteter'&&!sharedLoading&&!sharedError&&
      sharedMatches.some(row=>row.answer===true&&row.deck_id==='aktiviteter'&&row.card_id===cardId);
  if(activityInviteBusy||!sharedInsightsEnabled||!user||members.length!==2||
     !members.some(m=>m.user_id===user.id)||!members.some(m=>m.role==='parent')||
     !members.some(m=>m.role==='teen')||!verifiedCurrent)return;
  const card=sharedDeck('aktiviteter')?.cards.find(item=>item.id===cardId&&item.type==='match');
  if(!card)return;
  if(familyChatDraft.trim()){
    activityInviteError='Du har redan ett meddelandeutkast. Öppna Inkorgen och ta hand om det först.';
    render();return;
  }
  const viewer=user.id,session=sharedSession;
  activityInviteBusy=true;activityInviteError='';render();
  let response;
  try{response=await db.rpc('shared_swipe_matches',{p_deck_id:'aktiviteter'});}
  catch(error){response={error};}
  if(user?.id!==viewer||sharedSession!==session||page()!==origin){
    activityInviteBusy=false;return;
  }
  activityInviteBusy=false;
  let stillMatched=false;
  try{stillMatched=!response?.error&&Array.isArray(response.data)&&
    safeInsightMatches('aktiviteter',response.data).some(row=>row.answer===true&&row.card_id===cardId);}
  catch{stillMatched=false;}
  if(!stillMatched){
    activityInviteError='Kunde inte bekräfta att aktiviteten fortfarande är gemensam. Uppdatera insikterna och försök igen.';
    render();return;
  }
  if(familyChatDraft.trim()){
    activityInviteError='Du har redan ett meddelandeutkast. Öppna Inkorgen och ta hand om det först.';
    render();return;
  }
  const title=String(card.teenText).replace(/\s+/g,' ').trim().slice(0,240);
  familyChatDraft='Hej! Vi har båda valt ja till aktiviteten ”'+title+'”. Vill du att vi bestämmer en dag då vi kan göra det tillsammans?';
  familyChatRequestKey=null;
  familyChatStatus='Detta är bara ett utkast. Läs igenom och välj själv om du vill skicka.';
  activityInviteError='';
  location.hash='inkorg';
  requestAnimationFrame(()=>document.getElementById('family-chat-body')?.focus({preventScroll:true}));
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


// A private, read-only overview of this account's already saved theme answers.
// Do not query or expose the other family member's individual responses.
function privateThemeAnswerReview(deck){
  const answers=themeAnswers.get(deck.id);
  if(!answers?.size)return '';
  const items=deck.cards.flatMap((_,index)=>{
    const id=themeCardId(deck,index);
    if(!answers.has(id))return [];
    const model=themeCardModel(deck,index);
    return [{index,text:cardTextForRole(model,viewerRole()),category:model?.category||deck.title,answer:answers.get(id)}];
  });
  if(!items.length)return '';
  return '<section id="swipe-private-review" class="live-panel swipe-private-review" aria-labelledby="swipe-private-review-heading">'+
    '<h2 id="swipe-private-review-heading">Mina sparade svar</h2>'+
    '<p class="live-muted">Bara dina egna svar visas här. Tryck på ett kort för att ändra ditt svar. Ingen delning sker automatiskt.</p>'+
    '<details><summary>Visa mina '+items.length+' besvarade kort</summary>'+
    '<div class="comm-fields"><label for="private-theme-review-search">Sök bland mina svar</label>'+
    '<input type="search" id="private-theme-review-search" maxlength="120" autocomplete="off" placeholder="Sök kort eller ämne">'+
    '<label for="private-theme-review-answer">Visa svar</label><select id="private-theme-review-answer">'+
    '<option value="all">Alla svar</option><option value="yes">Bara ja</option><option value="no">Bara nej</option></select>'+
    '<button type="button" id="private-theme-review-reset" class="schyssta-secondary">Rensa sökning och filter</button></div>'+
    '<p id="private-theme-review-count" class="live-muted" role="status" aria-live="polite">Visar '+items.length+' av '+items.length+' sparade svar.</p>'+
    '<p id="private-theme-review-empty" class="live-muted" hidden>Inga sparade svar matchar sökningen. Ändra sökord eller filter.</p>'+
    '<ul class="swipe-match-list">'+
    items.map(item=>'<li data-private-theme-answer="'+(item.answer?'yes':'no')+'"><p data-private-theme-statement><strong>'+esc(item.category)+'</strong> · '+esc(item.text)+'</p>'+
      '<p class="live-muted">Ditt svar: '+(item.answer?'Ja':'Nej')+'</p>'+
      '<button type="button" class="schyssta-secondary" data-theme-review-index="'+item.index+'" data-theme-review-deck="'+esc(deck.id)+'">Ändra detta svar</button></li>').join('')+
    '</ul></details></section>';
}
// Search only text already loaded for the current viewer. No RPC or family data access.
function filterPrivateThemeReview(){
  const root=$('swipe-private-review');
  if(!root)return;
  const search=String($('private-theme-review-search')?.value||'').trim().toLocaleLowerCase('sv');
  const value=$('private-theme-review-answer')?.value;
  const answer=value==='yes'||value==='no'?value:'all';
  const rows=[...root.querySelectorAll('[data-private-theme-answer]')];
  let visible=0;
  for(const row of rows){
    const text=(row.querySelector('[data-private-theme-statement]')?.textContent||'').toLocaleLowerCase('sv');
    const show=(answer==='all'||row.dataset.privateThemeAnswer===answer)&&text.includes(search);
    row.hidden=!show;
    // Author CSS may set display on list items and override the hidden UA rule.
    row.style.display=show?'':'none';
    if(show)visible++;
  }
  const status=$('private-theme-review-count');
  if(status)status.textContent='Visar '+visible+' av '+rows.length+' sparade svar.';
  const empty=$('private-theme-review-empty');
  if(empty)empty.hidden=visible!==0;
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
      (themeReviewEdit?.deckId===deck.id&&themeReviewEdit.index===themeIndex?'<button type="button" class="schyssta-secondary" id="theme-review-back">Tillbaka till mina sparade svar</button>':'')+
      '<div class="swipe-actions"><button type="button" class="swipe-choice swipe-no" data-swipe="no" aria-label="Nej">✕ <span>Nej</span></button>'+
      '<button type="button" class="swipe-choice swipe-yes" data-swipe="yes" aria-label="Ja">♥ <span>Ja</span></button></div>'
      :'<div class="swipe-finished"><h2>Alla '+visible.length+' kort i '+esc(categoryLabel)+' är sparade</h2><p>Du kan gå igenom urvalet igen och ändra dina egna svar.</p>'+
       '<button type="button" class="live-button" id="theme-restart">Gå igenom igen</button></div>')+
    '<p id="swipe-save-status" class="swipe-disclaimer" role="status">'+
    esc(themeSaveError||'Ditt svar sparas privat i ditt konto. Gemensamt visas bara kort där ni båda svarat ja.')+'</p></div>'+privateThemeAnswerReview(deck)+swipeResults(deck.id)+insightsEntry()+'</div>';
}
// Return to the private themed answer list without losing the original deck position.
function reopenThemeReview(){
 const state=themeReviewEdit;themeReviewEdit=null;
 if(!state||state.viewer!==user?.id||state.session!==sharedSession||state.deckId!==activeThemeDeck)return;
 themeCategory=state.categoryBefore;themeIndex=state.indexBefore;themeReview=state.reviewBefore;
 render();
 const root=$('swipe-private-review');if(!root)return;
 const details=root.querySelector('details');if(details)details.open=true;
 const search=$('private-theme-review-search'),filter=$('private-theme-review-answer');
 if(search)search.value=state.search;
 if(filter)filter.value=['yes','no'].includes(state.filter)?state.filter:'all';
 filterPrivateThemeReview();
 const button=[...root.querySelectorAll('[data-theme-review-index]')].find(b=>
  b.dataset.themeReviewIndex===String(state.index)&&!b.closest('[data-private-theme-answer]')?.hidden);
 (button||search||details?.querySelector('summary'))?.focus({preventScroll:true});
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
  const returnToReview=themeReviewEdit?.index===index&&themeReviewEdit?.deckId===deckId&&themeReviewEdit?.viewer===viewer&&themeReviewEdit?.session===session;
  themeIndex=themeReview?nextThemeVisible(deck,index):nextThemeUnanswered(deck,index+1);
  swipeBusy=false;
  if(returnToReview)reopenThemeReview();else render();
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

// Private overview: only the currently signed-in user's already loaded general answers
// and their teen-only skipped understanding cards. Never read the other account's answers.
function privateGeneralAnswerReview(){
 const visible=visibleGeneralIndices();
 const items=visible.flatMap(index=>{
  const id=swipeCardId(index);
  const hasAnswer=swipeAnswers.has(id);
  const skipped=!hasAnswer&&viewerRole()==='teen'&&GENERAL_CARDS[index]?.type==='understanding'&&skippedUnderstanding.has(id);
  if(!hasAnswer&&!skipped)return [];
  const text=generalStatement(index);
  if(!text)return [];
  return [{index,id,category:text[0],statement:text[1],kind:skipped?'skipped':swipeAnswers.get(id)?'yes':'no'}];
 });
 if(!items.length)return '';
 return '<section id="swipe-general-review" class="live-panel swipe-private-review" aria-labelledby="swipe-general-review-heading">'+
  '<h2 id="swipe-general-review-heading">Mina svar i allmänna kortleken</h2>'+
  '<p class="live-muted">Här ser du bara dina egna sparade svar och eventuella överhoppade förståelsekort. Öppna ett kort för att svara på nytt. Ingenting delas när du öppnar översikten.</p>'+
  '<details><summary>Visa '+items.length+' besvarade eller överhoppade kort</summary>'+
  '<div class="comm-fields"><label for="swipe-general-review-search">Sök bland mina kort</label>'+
  '<input type="search" id="swipe-general-review-search" maxlength="120" autocomplete="off" placeholder="Sök ord eller ämne">'+
  '<label for="swipe-general-review-answer">Visa kort</label><select id="swipe-general-review-answer">'+
  '<option value="all">Alla svar och överhoppade</option><option value="yes">Bara ja</option><option value="no">Bara nej</option>'+
  '<option value="skipped">Bara överhoppade</option></select>'+
  '<button type="button" id="swipe-general-review-reset" class="schyssta-secondary">Rensa sökning och filter</button></div>'+
  '<p id="swipe-general-review-count" class="live-muted" role="status" aria-live="polite">Visar '+items.length+' av '+items.length+' kort.</p>'+
  '<p id="swipe-general-review-empty" class="live-muted" hidden>Inga egna kort matchar sökningen. Ändra sökord eller filter.</p>'+
  '<ul class="swipe-match-list">'+items.map(item=>'<li data-general-review-kind="'+item.kind+'">'+
   '<p data-general-review-statement><strong>'+esc(item.category)+'</strong> · '+esc(item.statement)+'</p>'+
   '<p class="live-muted">Ditt val: '+(item.kind==='skipped'?'Inte svarat just nu':item.kind==='yes'?'Ja':'Nej')+'</p>'+
   '<button type="button" class="schyssta-secondary" data-general-review-index="'+item.index+'">Öppna detta kort</button></li>').join('')+
  '</ul></details></section>';
}
function filterPrivateGeneralReview(){
 const root=$('swipe-general-review');if(!root)return;
 const search=String($('swipe-general-review-search')?.value||'').trim().toLocaleLowerCase('sv');
 const selected=$('swipe-general-review-answer')?.value;
 const kind=['yes','no','skipped'].includes(selected)?selected:'all';
 const rows=[...root.querySelectorAll('[data-general-review-kind]')];
 let count=0;
 for(const row of rows){
  const statement=(row.querySelector('[data-general-review-statement]')?.textContent||'').toLocaleLowerCase('sv');
  const show=(kind==='all'||row.dataset.generalReviewKind===kind)&&statement.includes(search);
  row.hidden=!show;row.style.display=show?'':'none';
  if(show)count++;
 }
 const status=$('swipe-general-review-count');if(status)status.textContent='Visar '+count+' av '+rows.length+' kort.';
 const empty=$('swipe-general-review-empty');if(empty)empty.hidden=count!==0;
}
function reopenGeneralReview(){
 const state=generalReviewEdit;generalReviewEdit=null;
 swipeReview=state?.reviewBefore===true;swipeSkippedReview=state?.skippedBefore===true;
 swipeIndex=Number.isSafeInteger(state?.indexBefore)?state.indexBefore:nextUnanswered();
 render();
 const root=$('swipe-general-review');if(!root)return;
 const details=root.querySelector('details');if(details)details.open=true;
 const search=$('swipe-general-review-search'),answer=$('swipe-general-review-answer');
 if(search)search.value=state?.search||'';
 if(answer)answer.value=['yes','no','skipped'].includes(state?.filter)?state.filter:'all';
 filterPrivateGeneralReview();
 const selected=[...root.querySelectorAll('[data-general-review-index]')].find(button=>
   button.dataset.generalReviewIndex===String(state?.index)&&
   !button.closest('[data-general-review-kind]')?.hidden);
 (selected||search||details?.querySelector('summary'))?.focus({preventScroll:true});
}
function swipeView(){if(activeThemeDeck)return themeSwipeView();const total=visibleGeneralIndices().length,answered=visibleGeneralIndices().filter(i=>swipeAnswers.has(swipeCardId(i))).length,item=generalStatement(swipeIndex),isUnderstanding=GENERAL_CARDS[swipeIndex]?.type==='understanding',ordinal=visibleGeneralIndices().indexOf(swipeIndex)+1;if(swipeLoadError)return '<div class="swipe-experience"><header class="swipe-heading"><span class="swipe-eyebrow">UPPTÄCK VARANDRA</span><h1>Gillaswajpen</h1></header>'+card('<h2>Kunde inte hämta dina svar</h2><p role="alert">'+esc(swipeLoadError)+'</p><button class="live-button" type="button" id="swipe-reload">Försök igen</button>')+'</div>';return '<div class="swipe-experience"><header class="swipe-heading"><span class="swipe-eyebrow">UPPTÄCK VARANDRA</span><h1>Gillaswajpen</h1><p>Vad är viktigt för dig? Utforska korten i din egen takt.</p></header>'+(isUnderstanding?'<p class="swipe-understanding-notice">'+(sharedUnderstandingEnabled?'Förståelsekort: ditt svar förblir privat tills du själv väljer att dela ett ja-svar i <a href="#insikter">Gemensamma insikter</a>. Du kan återkalla delningen när som helst. Inga tidigare svar delas automatiskt.':'Förståelsekort: ditt svar sparas tills vidare privat. Delning med förälder är inte aktiverad här och gamla svar delas aldrig automatiskt.')+'</p>':'')+'<div class="swipe-stage"><div class="swipe-stage-top"><span>ALLMÄNNA KORTLEKEN</span><span role="status">'+(item?ordinal+' / '+total:answered+' svar, '+skippedUnderstanding.size+' överhoppade av '+total)+'</span></div><div class="swipe-track"><div class="swipe-track-fill" style="width:'+Math.round(100*(item?(swipeReview?ordinal-1:answered+skippedUnderstanding.size):total)/total)+'%"></div></div>'+(item?'<div id="swipe-card" class="swipe-playing-card" tabindex="0" aria-label="Kort '+ordinal+' av '+total+'. Svep höger för ja eller vänster för nej."><span class="swipe-stamp swipe-stamp-no" aria-hidden="true">NEJ</span><span class="swipe-stamp swipe-stamp-yes" aria-hidden="true">JA</span><span class="swipe-category">'+esc(item[0])+'</span><h2>'+esc(item[1])+'</h2><span class="swipe-card-hint">Dra kortet åt höger eller vänster</span>'+importanceControl('general',swipeCardId(swipeIndex))+'</div>'+(generalReviewEdit?.index===swipeIndex?'<button type="button" class="schyssta-secondary" id="swipe-general-review-back">Tillbaka till mina svar</button>':'')+'<div class="swipe-actions"><button type="button" class="swipe-choice swipe-no" data-swipe="no" aria-label="Nej">✕ <span>Nej</span></button><button type="button" class="swipe-choice swipe-yes" data-swipe="yes" aria-label="Ja">♥ <span>Ja</span></button></div>'+(isUnderstanding?'<button type="button" id="swipe-skip" class="swipe-skip">Vill inte svara just nu</button>':''):'<div class="swipe-finished"><h2>'+(skippedUnderstanding.size?'Du har '+skippedUnderstanding.size+' kort kvar att svara på':'Alla '+total+' kort besvarade')+'</h2><p>Du har sparat '+answered+' svar'+(skippedUnderstanding.size?' och lämnat '+skippedUnderstanding.size+' förståelsekort obesvarade för tillfället':'')+'. Du kan ändra dina egna svar när du vill.</p>'+'<div class="swipe-finished-actions">'+(skippedUnderstanding.size?'<button class="live-button" type="button" id="swipe-review-skipped">Gå till överhoppade kort</button>':'')+'<button class="live-button" type="button" id="swipe-restart">Gå igenom alla kort igen</button></div></div>')+'<p id="swipe-save-status" class="swipe-disclaimer" role="status">'+(swipeSaveError?esc(swipeSaveError):(isUnderstanding?(sharedUnderstandingEnabled?'Ditt svar sparas privat. Ett ja på förståelsekort blir inte delat förrän du själv väljer Dela med min förälder i Gemensamma insikter.':'Ditt svar sparas privat. Förståelsekort delas inte förrän säker delning är aktiverad.'):'Ditt svar sparas privat i ditt konto. Matchningskort visas gemensamt först när båda svarat ja.'))+'</p></div>'+privateGeneralAnswerReview()+swipeResults()+insightsEntry()+themeDecksView()+'</div>';}
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
  const returnToReview=generalReviewEdit?.index===index&&generalReviewEdit?.viewer===viewer&&generalReviewEdit?.session===session;
  swipeIndex=swipeSkippedReview?nextSkippedAfter(index):swipeReview?nextVisibleAfter(index):nextUnanswered(index+1);
  swipeBusy=false;
  if(returnToReview)reopenGeneralReview();else render();
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
  const returnToReview=generalReviewEdit?.index===index&&generalReviewEdit?.viewer===viewer&&generalReviewEdit?.session===session;
  swipeIndex=swipeSkippedReview?nextSkippedAfter(index):swipeReview?nextVisibleAfter(index):nextUnanswered(index+1);
  swipeBusy=false;
  if(returnToReview)reopenGeneralReview();else render();
  if(members.length===2&&visibleGeneralIndices().every(i=>swipeAnswers.has(swipeCardId(i))||skippedUnderstanding.has(swipeCardId(i))))void fetchThemeUnlock();
}
function nextVisibleAfter(index){return visibleGeneralIndices().find(i=>i>index)??STATEMENTS.length;}
function advanceSwipe(direction){if(activeThemeDeck){advanceThemeSwipe(direction);return;}if(swipeBusy||importanceSaving.size||page()!=='swipe'||!user||swipeIndex>=STATEMENTS.length||!visibleGeneralIndices().includes(swipeIndex))return;const el=$('swipe-card');if(!el)return;const index=swipeIndex,viewer=user.id,session=sharedSession;swipeBusy=true;const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;if(!reduce){el.style.transform='translateX('+(direction==='yes'?'120vw':'-120vw')+') rotate('+(direction==='yes'?18:-18)+'deg)';el.style.opacity='0';}setTimeout(()=>saveSwipeAnswer(direction,index,viewer,session),reduce?0:220);}
function setupSwipeGesture(){const el=$('swipe-card');if(!el)return;let start=null;const reset=()=>{start=null;el.style.transform='';el.classList.remove('swipe-dragging','swipe-preview-yes','swipe-preview-no');};el.addEventListener('pointerdown',e=>{if(e.target.closest?.('[data-importance-control]')||(e.button!==undefined&&e.button!==0))return;start={id:e.pointerId,x:e.clientX,y:e.clientY,dragging:false};});el.addEventListener('pointermove',e=>{if(!start||start.id!==e.pointerId||swipeBusy)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(!start.dragging&&Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>12){start=null;return;}if(Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)){start.dragging=true;el.setPointerCapture?.(e.pointerId);}if(!start.dragging)return;el.classList.add('swipe-dragging');el.classList.toggle('swipe-preview-yes',dx>35);el.classList.toggle('swipe-preview-no',dx< -35);el.style.transform='translateX('+dx+'px) rotate('+Math.max(-13,Math.min(13,dx/18))+'deg)';});el.addEventListener('pointerup',e=>{if(!start||start.id!==e.pointerId)return;const dx=e.clientX-start.x,dragged=start.dragging;reset();if(dragged&&Math.abs(dx)>=85)advanceSwipe(dx>0?'yes':'no');});el.addEventListener('pointercancel',reset);}

function insightTargetFromHash(hash){
  const found=/^#insikter\/([a-z-]+)$/.exec(hash);
  return found&&(found[1]==='forstaelse'||INSIGHT_DECK_IDS.includes(found[1]))?found[1]:null;
}
function focusInsightTarget(){
  const target=insightTargetFromHash(location.hash);
  if(!target||page()!=='insikter'||insightsLoading||insightsError)return false;
  // Only server-verified, currently shared sections are focus targets.
  const element=$(target==='forstaelse'?'insights-understanding':'insights-deck-'+target)
    ||$('insights-target-unavailable');
  if(!element)return false;
  element.focus({preventScroll:true});
  element.scrollIntoView({block:'start'});
  return true;
}
function page(){if(insightTargetFromHash(location.hash))return 'insikter';if(location.hash.startsWith('#kommunikation/'))return 'kommunikation';let h;try{h=decodeURIComponent(location.hash.slice(1));}catch{return 'hem';}return ['insikter','mi-foralder','nvc'].includes(h)?h:nav.some(n=>n[0]===h)?h:'hem';}
// On mobile, the scroll container is .live-main rather than window.
function scrollLiveMainTop(){const main=document.querySelector('.live-main');if(main)main.scrollTop=0;window.scrollTo(0,0);}
let previousMenuRoute=null;
function menu(){
  const route=page();
  const routeChanged=route!==previousMenuRoute;
  previousMenuRoute=route;
  const unread=schysstaListEnabled&&user&&members.length===2&&!schysstaError?schysstaUnreadCount():0;
  const pending=schysstaListEnabled&&user&&members.length===2&&!schysstaError?schysstaNeedsAnswer().length:0;
  const navItem=([key,label])=>{
    const count=key==='inkorg'?(unread+familyChatUnread+activityUnreadCount()):key==='regler'?pending:0;
    const descriptor=key==='inkorg'?' olästa meddelanden och aviseringar':' obesvarade regelförslag';
    const aria=count?' aria-label="'+label+', '+count+descriptor+'"':'';
    const badge=count?'<span class="live-nav-count" aria-hidden="true">'+(count>9?'9+':count)+'</span>':'';
    const active=route===key||(['mi-foralder','nvc'].includes(route)&&key==='kommunikation')||(route==='insikter'&&key==='swipe');
    return '<a href="#'+key+'"'+(active?' aria-current="page"':'')+aria+'>'+label+badge+'</a>';
  };
  const html=nav.map(navItem).join('');
  for(const id of ['live-desktop-nav','live-mobile-nav']){
    const element=$(id);
    // Do not replace an unchanged focused link during background refreshes.
    if(element.innerHTML===html)continue;
    const scrollLeft=element.scrollLeft;
    const focusedHref=element.contains(document.activeElement)?document.activeElement.getAttribute('href'):null;
    element.innerHTML=html;
    element.scrollLeft=scrollLeft;
    if(focusedHref){
      const restored=[...element.querySelectorAll('a')].find(link=>link.getAttribute('href')===focusedHref);
      restored?.focus({preventScroll:true});
    }
  }
  // Bring the active tab into view only when changing pages, not during polling.
  const mobile=$('live-mobile-nav');
  if(routeChanged&&mobile.clientWidth){
    const active=mobile.querySelector('a[aria-current="page"]');
    if(active){
      const outer=mobile.getBoundingClientRect(),bounds=active.getBoundingClientRect();
      if(bounds.left<outer.left+4)mobile.scrollLeft-=outer.left+4-bounds.left;
      else if(bounds.right>outer.right-4)mobile.scrollLeft+=bounds.right-(outer.right-4);
    }
  }
}
const card=html=>'<section class="live-panel">'+html+'</section>';
const COMMUNICATION_BRIDGES=Object.freeze({
  swipe:'Känns ett kort svårt att prata om? Pröva att lyssna och formulera ett behov utan att pressa fram ett svar.',
  insikter:'När ni vill utforska en matchning eller ett delat behov kan ni börja med ett konkret samtalsverktyg.',
  regler:'Innan ni diskuterar eller omprövar en regel: prova ett gemensamt problemlösningssamtal.',
  inkorg:'Vill du skriva ett känsligt meddelande? Du kan öva på ett jag-budskap först. Ingenting skickas automatiskt.',
  personlighet:'Självskattningar förklarar inte varför ni reagerar olika. Verktygen kan hjälpa er prata om era perspektiv utan etiketter.',
  medlare:'Vill du prova ett av förslagen i en övning utan AI? Börja med NVC eller någon av samtalsövningarna.'
});
const COMMUNICATION_TARGETS=Object.freeze({
 swipe:['lyssna','Öva på att lyssna'],
 insikter:['kontakt','Börja med fem minuter kontakt'],
 regler:['losning','Hitta en gemensam lösning'],
 inkorg:['svaart','Förbered ett känsligt samtal'],
 personlighet:['validera','Bekräfta varandras perspektiv'],
 medlare:['pausa','Öva på paus och återkomst']
});
function communicationBridge(key){
  const text=COMMUNICATION_BRIDGES[key];
  if(!text)return '';
  const [skill,label]=COMMUNICATION_TARGETS[key];
  return '<aside class="comm-crosslink" aria-label="Relaterat samtalsstöd"><strong>Prata vidare tillsammans</strong><p>'+text+'</p><div class="comm-crosslink-links"><a href="#kommunikation/'+skill+'">'+label+'</a><a href="#kommunikation">Alla kommunikationsverktyg</a><a href="#kommunikation/plan">Förbered en privat samtalsplan</a><a href="#nvc">Bygg ett jag-budskap (NVC)</a>'
    +(viewerRole()==='parent'?'<a href="#mi-foralder">MI för föräldrar</a>':'')+'</div></aside>';
}

const HOME_MODULE_INTROS=Object.freeze({
  inkorg:'Läs privata meddelanden och svara på förfrågningar om gemensamma regler.',
  swipe:'Svara privat på frågor och hitta möjliga samtal eller aktiviteter där ni båda har valt ja.',
  personlighet:'Utforska fem personlighetsdimensioner med 50 frågor och jämför profiler först efter bådas samtycke.',
  kommunikation:'Öva på NVC, lyssnande, pauser och reparation efter gräl. Förbered en privat samtalsplan. Föräldrar får även en MI-inspirerad guide.',
  regler:'Föreslå överenskommelser och ändringar. En regel gäller gemensamt först när båda har godkänt samma text.',
  medlare:'Utforska fiktiva samtal med privat AI-stöd i testversion. Inte terapi eller akut hjälp.'
});
function login(){
return '<h1>Välkommen till Hemmakompassen</h1>'+card('<h2>Logga in</h2><form id="live-login"><label class="live-field">E-postadress<input id="live-email" type="email" autocomplete="username" required></label><label class="live-field">Lösenord<input id="live-password" type="password" autocomplete="current-password" required></label><button class="live-button" type="submit">Logga in</button></form><p id="login-feedback" role="status"></p><p><a href="./konto.html#reset">Glömt lösenord eller saknar lösenord?</a></p><p><a href="./konto.html#register">Skapa konto</a></p>');
}
function home(){
const name=profile?.display_name||'du';
const roster=members.length?members.map(m=>(m.role==='teen'?'Tonåring':'Förälder')+': '+esc(m.display_name||'Namnlös')).join(' · '):'Ingen familj är kopplad ännu.';
const unread=schysstaListEnabled?schysstaUnreadCount():0;
const needs=schysstaListEnabled?schysstaNeedsAnswer().length:0;
const pendingBanner=needs?card('<h2>Behöver ditt svar · '+needs+' förslag</h2><p>Den andra personen väntar på ditt beslut. Du kan också välja att svara senare.</p><a class="live-button" href="#regler">Ta ställning i Schyssta listan</a>'):'';
const activityUnread=activityNotificationsEnabled?activityUnreadCount():0;
const totalUnread=unread+familyChatUnread+activityUnread;
const incompleteNoticeCheck=members.length===2&&(!!schysstaError||familyChatUnreadError
  ||(activityNotificationsEnabled&&!!activityNotificationsError));
const noticeWarning=incompleteNoticeCheck?card('<h2>Alla aviseringar kunde inte kontrolleras</h2><p role="alert">Någon av kontrollerna för meddelanden, regelförslag eller aktivitetsaviseringar misslyckades. Noll betyder därför inte säkert att inkorgen är tom.</p><button type="button" class="live-button" id="home-refresh-notices">Försök kontrollera igen</button>'):'';
const inboxBanner=totalUnread?card('<h2>Inkorgen · '+(incompleteNoticeCheck?'minst ':'')+totalUnread+' olästa</h2><p>'
  +[familyChatUnread?familyChatUnread+' privata meddelanden':'',
    unread?unread+' regelhändelser':'',
    activityUnread?activityUnread+' nya gemensamma kort- eller aktivitetsaviseringar':''
   ].filter(Boolean).join(' · ')
  +'</p><a class="live-button" href="#inkorg">Visa inkorgen</a>'):'';
return '<section class="home-hero"><div class="home-hero-inner"><span class="home-kicker">✦ '+(members.length>1?'ERT GEMENSAMMA RUM':'VÄNTAR PÅ DIN MOTPART')+'</span><h1>Hej '+esc(name)+'.<em>Välkommen till ert rum.</em></h1><p>'+(members.length>1?'Ett rum för att förstå varandra bättre, ett steg i taget.':'Medan du väntar kan du utforska Gillaswajpen och börja hitta nya samtalsämnen.')+'</p><a class="home-hero-link" href="#swipe">Utforska Gillaswajpen <span aria-hidden="true">→</span></a></div><div class="home-orbit" aria-hidden="true"><span></span></div></section>'+noticeWarning+pendingBanner+inboxBanner+card('<h2>Din familj</h2><p>'+roster+'</p><p class="live-muted">'+(members.length===1?'Den andra familjemedlemmen har ännu inte anslutit.':'Familjemedlemskap hämtat från Supabase.')+'</p><a class="live-button" href="./konto.html">Hantera familj och inbjudningar</a>')+'<h2>Utforska Hemmakompassen</h2><div class="live-cards">'+nav.slice(1,7).map(([key,label])=>card('<h3>'+esc(label)+'</h3><p class="live-muted">'+esc(members.length!==2&&['inkorg','regler'].includes(key)?'Koppla ihop era konton för att använda funktionen.':HOME_MODULE_INTROS[key])+'</p><a href="#'+key+'">Öppna →</a>')).join('')+'</div>';
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
// Only server-validated, mutually accepted rules are available for personal export.
function approvedSchysstaText(rows){
 const approved=Array.isArray(rows)?rows.filter(item=>item?.status==='accepted'&&typeof item.body==='string'):[];
 if(!approved.length)return '';
 return 'Våra gemensamma överenskommelser\n\n'+approved.map((item,index)=>
  (index+1)+'. '+item.body.replace(/\s+/g,' ').trim()).join('\n')+'\n';
}
function currentApprovedSchysstaText(){
 if(!schysstaListEnabled||!user||members.length!==2||schysstaLoading||schysstaError)return '';
 return approvedSchysstaText(schysstaAllRules());
}
function downloadSchysstaAgreements(){
 const payload=currentApprovedSchysstaText();
 if(!payload)return;
 try{
  const file=new Blob(['\uFEFF',payload],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(file),link=document.createElement('a');
  link.href=url;link.download='schyssta-listan-overenskommelser.txt';
  link.style.display='none';document.body.appendChild(link);
  try{link.click();schysstaCopyMessage='Textfilen har förberetts för nedladdning. Förvara den privat om den innehåller personliga överenskommelser.';}
  finally{link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 }catch(e){schysstaCopyMessage='Det gick inte att skapa textfilen. Prova Kopiera aktuella regler i stället.';}
 render();
}
async function copySchysstaAgreements(){
  const payload=currentApprovedSchysstaText();
  if(!payload)return;
  const approved=schysstaAllRules().filter(item=>item.status==='accepted');
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
  if(members.length===2&&!inboxPairEpoch)return '<h1>Inkorg</h1>'+card('<h2>Familjekopplingen kunde inte kontrolleras</h2><p>Privata meddelanden visas inte förrän aktuell parning har verifierats.</p><button type="button" class="live-button" id="inbox-retry-pair">Kontrollera igen</button>');
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
  const markAllHtml=familyChatUnreadError
    ?'<p role="alert">Antalet olästa privata meddelanden kunde inte kontrolleras. Uppdatera konversationen för att försöka igen.</p>'
    :familyChatUnread>0
      ?'<div class="family-chat-read-controls"><p>'+familyChatUnread+' olästa privata meddelanden. De markeras inte som lästa bara för att du öppnar inkorgen.</p>'+
        '<button type="button" class="schyssta-secondary" data-family-chat-mark-all-read'+(familyChatReadBusy||familyChatLoading?' disabled':'')+'>Markera alla meddelanden som lästa</button></div>'
      :'';
  const chat=card('<div class="family-chat"><h2>Privata meddelanden med '+otherName+'</h2>'
    +'<p class="live-muted">Bara ni två i den aktuella familjeparningen kan läsa konversationen. Tidigare parningars meddelanden visas inte.</p>'
    +(familyChatError?'<p role="alert">'+esc(familyChatError)+'</p>':'')
    +markAllHtml
    +(familyChatLoading?'<p role="status">Hämtar meddelanden…</p>':
      '<div class="family-chat-history" tabindex="-1">'
      +(familyChatHasMore?'<button type="button" class="schyssta-secondary" data-family-chat-more'+(familyChatLoadingOlder?' disabled':'')+'>'+(familyChatLoadingOlder?'Hämtar äldre meddelanden…':'Visa äldre meddelanden')+'</button>':'')
      +messageList+'</div>')
    +'<form id="family-chat-form" class="family-chat-form">'
    +'<label for="family-chat-body">Skriv till '+otherName+'</label>'
    +'<textarea id="family-chat-body" rows="3" maxlength="1500" required placeholder="Skriv ett meddelande…" aria-describedby="family-chat-help"'+(familyChatSending?' disabled':'')+'>'+esc(familyChatDraft)+'</textarea>'
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
  const activityPanel=!activityNotificationsEnabled?''
    :card('<h2>Gemensamma kort och aktiviteter'
      +(activityUnreadCount()?' · '+activityUnreadCount()+' olästa':'')+'</h2>'
      +'<p class="live-muted">En avisering visar bara att ett nytt gemensamt kort eller en frivilligt delad förståelse har blivit tillgänglig. Inga privata svar visas här.</p>'
      +(activityNotificationsError?'<p role="alert">'+esc(activityNotificationsError)+'</p>'
        +'<button type="button" class="schyssta-secondary" data-activity-refresh>Försök igen</button>':'')
      +(activityNotificationsLoading&&!activityNotifications.length?'<p role="status">Hämtar aviseringar…</p>':'')
      +(activityNotifications.length?'<ul class="schyssta-list">'
        +activityNotifications.map(n=>'<li class="'+(n.read_at===null?'schyssta-unread':'')+'">'
          +'<p><strong>'+(n.event_kind==='mutual_match'
            ?'Nytt gemensamt JA · '+esc(ACTIVITY_DECK_LABELS[n.deck_id])
            :'Ett förståelsekort har delats frivilligt')+'</strong>'+(n.read_at===null?' · Oläst':'')+'</p>'
          +'<p class="live-muted"><time datetime="'+esc(n.updated_at)+'">'+esc(familyChatTimestamp(n.updated_at))+'</time></p>'
          +'<div class="schyssta-actions"><a class="live-button" href="#insikter/'+esc(n.event_kind==='teen_shared_understanding'?'forstaelse':n.deck_id)+'">Visa '+(n.event_kind==='teen_shared_understanding'?'delad förståelse':'kortlekens insikter')+'</a>'
          +(n.read_at===null?'<button type="button" class="schyssta-secondary" data-activity-read="'
            +esc(n.notification_id)+'"'+(activityMarkBusy?' disabled':'')+'>Markera som läst</button>':'')
          +'</div></li>').join('')+'</ul>'
        :(!activityNotificationsLoading&&!activityNotificationsError?'<p class="live-muted">Inga nya aviseringar just nu.</p>':'')));
  return '<h1>Inkorg</h1><p>Här kan ni skriva privata meddelanden, se frivilligt delade gemensamma kort och hantera regelförfrågningar.</p>'
    +activityPanel+chat+rules;
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
    +(viewerRole()==='parent'?'<p>Som förälder: prova att prata om förslaget och lyssna på tonåringens perspektiv innan du skickar. <a href="#mi-foralder">Läs guiden om att lyssna före förslag</a>.</p>':'')+'</details>'
    +'<button class="live-button" type="submit"'+(schysstaSubmitting?' disabled':'')+'>'+(schysstaSubmitting?'Skickar…':schysstaEditTarget?'Skicka ändringsförslag':'Skicka regelförslag')+'</button>'
    +'<button class="schyssta-secondary" type="button" id="schyssta-compose">Stäng formuläret</button></form>'
    :'<button class="live-button" type="button" id="schyssta-compose">+ Föreslå en regel</button>';
  return '<div class="schyssta-view"><h1>Schyssta listan</h1><p>Här samlar ni sådant ni båda har sagt ja till. Regler kan komma från Gillaswajpen eller skrivas av någon av er.</p>'
    +(viewerRole()==='parent'?'<p><a href="#mi-foralder">För dig som förälder: lyssna före regelförslaget</a></p>':'')
    +'<button class="schyssta-secondary" type="button" data-schyssta-refresh>Uppdatera listan</button>'
    +card('<h2>Behöver ditt svar'+(needs.length?' ('+needs.length+')':'')+'</h2><p>Förslag från den andra personen visas här först.</p>'+list(needs,'Inga nya förslag väntar på ditt svar.'))
    +firstRuleHint
    +card('<h2>'+(schysstaEditTarget?'Föreslå ändring av regel':'Skriv ett eget förslag')+'</h2>'+formHtml+(schysstaMessage?'<p role="status" class="schyssta-feedback">'+esc(schysstaMessage)+'</p>':''))
    +searchTools
    +'<div class="schyssta-filter-group" data-schyssta-filter-group="approved">'
    +card('<h2>Våra överenskommelser</h2>'+list(approved,'Ni har ännu inga regler som båda godkänt.')
      +(approved.length?'<div class="schyssta-actions"><button class="schyssta-secondary" type="button" data-schyssta-copy>Kopiera aktuella regler</button><button class="schyssta-secondary" type="button" data-schyssta-download>Ladda ner som textfil</button></div><p class="live-muted">Textfilen innehåller bara regler som båda har godkänt. Den sparas på din enhet, så hantera den privat.</p>':'')
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
if(key==='swipe')return swipeView()+communicationBridge('swipe');
if(key==='personlighet')return personalityExperience.render({isPaired:members.length===2 && members.some(m=>m.role==='parent') && members.some(m=>m.role==='teen'),viewerRole:viewerRole()})+communicationBridge('personlighet');
 if(key==='insikter')return insightsView()+communicationBridge('insikter');
if(key==='regler')return schysstaView()+communicationBridge('regler');
if(key==='inkorg')return inboxView()+communicationBridge('inkorg');
if(key==='medlare')return mediatorExperience.render()+communicationBridge('medlare');
if(key==='mi-foralder')return viewerRole()==='parent'?renderParentMiGuide():'<h1>Samtalsstöd för föräldrar</h1>'+card('<p>Den här guiden är skriven för föräldrar. Du kan läsa de gemensamma råden i stället.</p><a href="#kommunikation">Till Kommunikationsråd</a>');
if(key==='kommunikation')return renderCommunicationToolkit(viewerRole());
if(key==='nvc')return renderNvcExercise(viewerRole());
return '<h1>'+label+'</h1>'+card('<h2>Funktionen är under utveckling</h2><p>Du är inloggad som '+esc(profile?.display_name||user.email)+'. Vi bygger nu den riktiga kopplingen till Supabase så att dina svar och den andra familjemedlemmens uppgifter hålls åtskilda.</p><p>Här visas inga påhittade demodata och inga svar lagras lokalt som om de vore delade med familjen.</p><a class="live-button" href="#hem">Till startsidan</a>');
}
function autoAnalyze(){
  if(!aiResultEnabled||!user)return;
  if(page()==='personlighet'){
    const signature=personalityExperience.getAiSnapshot();
    if(signature)void aiResults.ensure('personality','own',signature);
  }else if(page()==='swipe'){
    const deckId=activeThemeDeck||'general';
    const signature=swipeAiSignature(deckId);
    if(signature)void aiResults.ensure('swipe',deckId,signature);
  }else if(page()==='insikter'&&sharedInsightsEnabled){
    const signature=insightsAiSignature();
    if(signature)void aiResults.ensure('swipe','all',signature);
  }
}
function render(){
  if(activeThemeDeck&&!themeAccessAllowed())activeThemeDeck=null;
  // Inbox can rerender after a remote message or an explicit read action.
  // Preserve the mobile main scroller instead of jumping to the heading.
  // Hash navigation explicitly calls scrollLiveMainTop() after its render.
  const focusedPriority=page()==='swipe'?document.activeElement?.closest?.('[data-priority-share]'):null;
  const priorityFocus=focusedPriority?{deck:focusedPriority.dataset.deckId,card:focusedPriority.dataset.cardId}:null;
  const mainScroll=(page()==='inkorg'||priorityFocus)?document.querySelector('.live-main')?.scrollTop:null;
  menu();$('live-app').innerHTML=user?(page()==='hem'?home():section(page())):login();
  if(mainScroll!=null){
    const main=document.querySelector('.live-main');
    if(main)main.scrollTop=Math.min(mainScroll,Math.max(0,main.scrollHeight-main.clientHeight));
  }
  if(priorityFocus&&page()==='swipe'){
    const replacement=[...document.querySelectorAll('[data-priority-share]')]
      .find(button=>button.dataset.deckId===priorityFocus.deck&&button.dataset.cardId===priorityFocus.card);
    replacement?.focus({preventScroll:true});
  }
  if(user&&page()==='kommunikation')openCommunicationSkill($('live-app'),communicationSkillFromHash(location.hash));
  if(page()==='regler'&&user)applySchysstaFilters();
  setupSwipeGesture();$('sidebar-account').textContent=user?'Inloggad: '+(profile?.display_name||user.email):'Inte inloggad';
  $('account-link').textContent=user?'Ditt konto →':'Logga in →';
  if(aiResultEnabled&&user)queueMicrotask(autoAnalyze);
}
async function refresh(){
const generation=++refreshGeneration;
let authResult;
try{authResult=await db.auth.getUser();}
catch(e){if(generation!==refreshGeneration)return;throw e;}
if(generation!==refreshGeneration)return;
const {data:{user:u},error}=authResult;if(error&&error.name!=='AuthSessionMissingError')throw error;generalReviewEdit=null;themeReviewEdit=null;user=u;profile=null;members=[];mediatorExperience.reset(u?.id??null);aiResults.reset(u?.id??null);personalityExperience.reset(u?.id??null);swipeAnswers.clear();swipeImportance.clear();importancePending.clear();importanceSaving.clear();importanceAvailable=false;importanceLoadError='';priorityShares.clear();priorityShareSaving.clear();prioritySharesAvailable=false;priorityShareError='';skippedUnderstanding.clear();understandingShares.clear();understandingShareSaving.clear();understandingShareError='';for(const answers of themeAnswers.values())answers.clear();activeThemeDeck=null;themeCategory='all';themeIndex=0;themeReview=false;themeSaveError='';swipeBusy=false;swipeLoadError='';swipeSaveError='';swipeReview=false;swipeSkippedReview=false;swipeIndex=0;sharedMatches=[];sharedPriorities=[];sharedDeckId='general';sharedError='';sharedPriorityError='';sharedLoading=false;sharedSession++;sharedRequest++;insightsRows=[];sharedUnderstandingRows=[];insightsLoading=false;insightsError='';insightsRequest++;themesUnlocked=false;themesLoading=false;themesError='';themesRequest++;
inboxPairEpoch=null;
activityNotificationsRequest++;activityNotifications=[];activityNotificationsError='';activityNotificationsLoading=false;activityMarkBusy=null;activityFeedback='';
if(typeof schysstaRequest!=='undefined'){schysstaSuggestions=[];schysstaRules=[];schysstaManualRules=[];schysstaNotifications=[];schysstaReplacementLinks=[];schysstaHistory=[];schysstaEndTarget=null;schysstaLoading=false;schysstaError='';schysstaRequest++;schysstaSaving.clear();schysstaPausedIds.clear();clearFamilyChat();schysstaDraft='';schysstaDraftOpen=false;schysstaDraftKey=null;schysstaEditTarget=null;schysstaSubmitting=false;schysstaMessage='';schysstaCopyMessage='';schysstaFocusId='';schysstaSearch='';schysstaFilterStatus='all';}
if(user){const viewer=user.id;
let loaded;
try{loaded=await Promise.all([db.from('profiles').select('display_name').eq('user_id',viewer).maybeSingle(),db.rpc('my_family_members'),db.from('swipe_answers').select('deck_id,card_id,answer').eq('user_id',viewer),db.from('swipe_skips').select('deck_id,card_id').eq('user_id',viewer),db.from('swipe_importance').select('deck_id,card_id,importance').eq('user_id',viewer),sharedUnderstandingEnabled?db.from('understanding_card_shares').select('deck_id,card_id').eq('user_id',viewer):Promise.resolve({data:[],error:null}),sharedPrioritiesEnabled?db.from('swipe_priority_shares').select('deck_id,card_id').eq('user_id',viewer):Promise.resolve({data:[],error:null}),db.rpc('my_current_inbox_pair_epoch')]);}
catch(e){if(generation!==refreshGeneration)return;throw e;}
if(generation!==refreshGeneration||user?.id!==viewer)return;
const [p,m,s,k,i,b,ps,inboxEpochResult]=loaded;if(p.error)throw p.error;if(m.error)throw m.error;profile=p.data;members=m.data||[];
if(members.length===2&&!inboxEpochResult?.error&&typeof inboxEpochResult?.data==='string'&&inboxEpochResult.data)
  inboxPairEpoch=inboxEpochResult.data;if(s.error||k.error)swipeLoadError='Kontrollera anslutningen och försök igen.';else for(const answer of s.data||[])if(answer.deck_id==='general'&&typeof answer.answer==='boolean'&&STATEMENTS.some((_,index)=>swipeCardId(index)===answer.card_id))swipeAnswers.set(answer.card_id,answer.answer);
if(!s.error)for(const answer of s.data||[]){
  if(typeof answer.answer!=='boolean')continue;
  const deck=THEME_DECKS.find(d=>d.id===answer.deck_id);
  if(deck&&deck.cards.some((_,index)=>themeCardId(deck,index)===answer.card_id))themeAnswers.get(deck.id).set(answer.card_id,answer.answer);
}if(!k.error)for(const skipped of k.data||[])if(skipped.deck_id==='general'&&GENERAL_CARDS.some(card=>card.id===skipped.card_id&&card.type==='understanding'))skippedUnderstanding.add(skipped.card_id);
if(i.error)importanceLoadError='Den säkra lagringen är inte aktiverad.';else{importanceAvailable=true;for(const row of i.data||[])if([-1,0,1].includes(row.importance)&&validImportanceCard(row.deck_id,row.card_id))swipeImportance.set(importanceKey(row.deck_id,row.card_id),row.importance);}
if(sharedPrioritiesEnabled){if(ps.error)priorityShareError='Delningsstatus kunde inte hämtas säkert. Inget kan delas.';else if(viewerRole()==='teen'){prioritySharesAvailable=true;for(const row of ps.data||[])if(validImportanceCard(row.deck_id,row.card_id))priorityShares.add(importanceKey(row.deck_id,row.card_id));}}
if(sharedUnderstandingEnabled){if(b.error)understandingShareError='Delningsstatus kunde inte hämtas.';else if(viewerRole()==='teen')for(const row of b.data||[])if(row.deck_id==='general'&&GENERAL_CARDS.some(card=>card.id===row.card_id&&card.type==='understanding'))understandingShares.add(row.card_id);}
swipeIndex=nextUnanswered();swipeSkippedReview=false;}
if(generation!==refreshGeneration)return;
render();
if(user)openCommunicationSkill($('live-app'),communicationSkillFromHash(location.hash),{focus:true});
if(user)void personalityExperience.load(user.id);
if(user&&page()==='medlare')void mediatorExperience.loadList();
if(user&&members.length===2){void fetchSwipeMatches('general');void fetchThemeUnlock();void fetchActivityNotifications();}
if(page()==='insikter')void fetchInsights();
if(typeof fetchSchysstaList==='function'&&schysstaListEnabled&&['regler','inkorg','hem'].includes(page()))void fetchSchysstaList();
if(user&&members.length===2){
  if(page()==='inkorg')void fetchFamilyChat();
  else void fetchFamilyChatUnread();
}
}
document.addEventListener('click',e=>{
if(page()==='kommunikation'){
   const choice=e.target.closest('[data-comm-open]');
   if(choice){
     const skill=choice.dataset.commOpen;
     openCommunicationSkill($('live-app'),skill,{focus:true});
     return;
   }
 }
 if(e.target.closest('#private-theme-review-reset')){
  const root=$('swipe-private-review');
  if(!root)return;
  const search=$('private-theme-review-search'),answer=$('private-theme-review-answer');
  if(search)search.value='';
  if(answer)answer.value='all';
  filterPrivateThemeReview();
  search?.focus();
  return;
}
if(page()==='kommunikation'&&e.target.closest('[data-comm-reflection-reset]')){const form=$('comm-reflection-form');form?.reset();const output=$('comm-reflection-output');if(output)output.textContent='Din privata spegling visas här.';$('comm-reflection-heard')?.focus();return;}
if(page()==='kommunikation'&&e.target.closest('[data-comm-solution-reset]')){const form=$('comm-solution-form');form?.reset();const output=$('comm-solution-output');if(output)output.textContent='Din privata samtalsplan visas här.';$('comm-solution-problem')?.focus();return;}
if(page()==='nvc'&&e.target.closest('[data-comm-reset]')){const form=$('comm-nvc-form');form?.reset();const output=$('comm-nvc-output');if(output)output.textContent='Din formulering visas här när du är redo.';$('comm-observation')?.focus();return;}
if(e.target.closest('#live-skip-to-main')){e.preventDefault();$('live-app')?.focus({preventScroll:true});return;}
const aiRetry=e.target.closest('[data-ai-analysis-retry]');
if(aiRetry&&aiResultEnabled&&user){
  const [kind,scope]=aiRetry.dataset.aiAnalysisRetry.split(':');
  const signature=kind==='personality'?personalityExperience.getAiSnapshot():
    scope==='all'?insightsAiSignature():swipeAiSignature(scope);
  if(signature)void aiResults.ensure(kind,scope,signature,{force:true});
  return;
}
if(e.target.closest('#mediator-clear')){mediatorExperience.clear();return;}if(e.target.closest('#mediator-new')){void mediatorExperience.createChat();return;}if(e.target.closest('#mediator-refresh-context')){void mediatorExperience.loadContextStatus();return;}if(e.target.closest('#mediator-delete')){if(window.confirm('Vill du radera hela detta privata samtal permanent?'))void mediatorExperience.deleteChat();return;}const mediatorOpen=e.target.closest('[data-mediator-open]');if(mediatorOpen){void mediatorExperience.openChat(mediatorOpen.dataset.mediatorOpen);return;}if(e.target.closest('[data-pf-action],[data-ipip-retest]')){void personalityExperience.handleClick(e.target,{isPaired:members.length===2&&members.some(m=>m.role==='parent')&&members.some(m=>m.role==='teen')});return;}const b=e.target.closest('[data-swipe]');if(b)advanceSwipe(b.dataset.swipe);if(e.target.closest('#swipe-restart')){generalReviewEdit=null;swipeSkippedReview=false;swipeReview=true;swipeIndex=visibleGeneralIndices()[0]??STATEMENTS.length;render();}
const generalReviewButton=e.target.closest('[data-general-review-index]');
if(generalReviewButton&&page()==='swipe'&&!activeThemeDeck&&user&&!swipeBusy){
 const raw=generalReviewButton.dataset.generalReviewIndex;
 const index=Number(raw);
 const id=Number.isSafeInteger(index)&&String(index)===raw?swipeCardId(index):null;
 if(id&&visibleGeneralIndices().includes(index)&&(swipeAnswers.has(id)||
   (viewerRole()==='teen'&&GENERAL_CARDS[index]?.type==='understanding'&&skippedUnderstanding.has(id)))){
  generalReviewEdit={index,viewer:user.id,session:sharedSession,
   indexBefore:swipeIndex,reviewBefore:swipeReview,skippedBefore:swipeSkippedReview,
   search:String($('swipe-general-review-search')?.value||'').slice(0,120),
   filter:$('swipe-general-review-answer')?.value||'all'};
  swipeReview=true;swipeSkippedReview=false;swipeIndex=index;render();
  $('swipe-card')?.focus({preventScroll:true});
 }
 return;
}
if(e.target.closest('#swipe-general-review-back')&&generalReviewEdit&&page()==='swipe'&&!activeThemeDeck&&!swipeBusy){
 reopenGeneralReview();return;
}
if(e.target.closest('#swipe-general-review-reset')&&page()==='swipe'&&!activeThemeDeck){
 const search=$('swipe-general-review-search'),answer=$('swipe-general-review-answer');
 if(search)search.value='';if(answer)answer.value='all';filterPrivateGeneralReview();
 search?.focus();return;
}
if(e.target.closest('#swipe-review-skipped')&&viewerRole()==='teen'&&!swipeBusy){swipeSkippedReview=true;swipeReview=false;swipeIndex=nextSkippedAfter(-1);render();}if(e.target.closest('#swipe-skip')&&viewerRole()==='teen'&&GENERAL_CARDS[swipeIndex]?.type==='understanding'&&!swipeBusy)void skipUnderstandingCard(swipeIndex,user.id,sharedSession);if(e.target.closest('#swipe-reload'))refresh().catch(showError);const filterButton=e.target.closest('[data-shared-match-filter]');
if(filterButton&&page()==='swipe'&&sharedDeckId===filterButton.dataset.deckId&&!sharedLoading&&!sharedError){
  // Only categories present in the exact current server-verified result can be selected.
  const validCategories=new Set();
  const currentDeck=sharedDeck(sharedDeckId);
  if(currentDeck)for(const row of sharedMatches){
    if(row?.answer!==true||row.deck_id!==sharedDeckId)continue;
    const card=currentDeck.cards.find(c=>c.id===row.card_id&&c.type==='match');
    if(card)validCategories.add(card.category);
  }
  const selected=filterButton.dataset.sharedMatchFilter;
  if(selected==='all'||validCategories.has(selected)){
    sharedMatchFilter={deckId:sharedDeckId,category:selected==='all'?null:selected};
    render();
    const replacement=[...document.querySelectorAll('[data-shared-match-filter]')]
      .find(el=>el.dataset.deckId===sharedDeckId&&el.dataset.sharedMatchFilter===selected);
    replacement?.focus({preventScroll:true});
  }
  return;
}
const refreshMatches=e.target.closest('[data-refresh-matches]');if(refreshMatches&&!sharedLoading)void fetchSwipeMatches(refreshMatches.dataset.refreshMatches);if(e.target.closest('#retry-theme-unlock')&&!themesLoading)void fetchThemeUnlock();
if(e.target.closest('#insights-retry')&&!insightsLoading)void fetchInsights();
const inviteActivity=e.target.closest('[data-insight-activity]');
if(inviteActivity&&['insikter','swipe'].includes(page())&&!activityInviteBusy)void prepareActivityMessage(inviteActivity.dataset.insightActivity);
if(e.target.closest('#home-refresh-notices')&&user&&members.length===2){if(schysstaListEnabled&&!schysstaLoading)void fetchSchysstaList();void fetchFamilyChatUnread();void fetchActivityNotifications();}
if(e.target.closest('#inbox-retry-pair'))void refresh().catch(showError);
if(e.target.closest('[data-family-chat-refresh]'))void fetchFamilyChat();
if(e.target.closest('[data-family-chat-mark-all-read]'))void markAllFamilyChatRead();
if(e.target.closest('[data-family-chat-more]'))void fetchFamilyChat(true);
if(e.target.closest('#schyssta-retry')&&!schysstaLoading)void fetchSchysstaList();
if(e.target.closest('[data-schyssta-refresh]')&&!schysstaLoading)void fetchSchysstaList();
if(e.target.closest('[data-schyssta-copy]'))void copySchysstaAgreements();
if(e.target.closest('[data-schyssta-download]'))downloadSchysstaAgreements();
if(e.target.closest('[data-schyssta-start]')){schysstaDraftOpen=true;schysstaEditTarget=null;schysstaDraft='';schysstaDraftKey=null;render();document.getElementById('schyssta-body')?.focus();}
if(e.target.closest('#schyssta-compose')){schysstaDraftOpen=!schysstaDraftOpen;if(!schysstaDraftOpen){schysstaEditTarget=null;schysstaDraftKey=null;schysstaDraft='';}schysstaMessage='';render();}
const openRule=e.target.closest('[data-schyssta-open]');
if(openRule&&SCHYSSTA_UUID.test(openRule.dataset.schysstaOpen)){
  schysstaFocusId=openRule.dataset.schysstaOpen;
  location.hash='regler';
  if(page()==='regler')void fetchSchysstaList();
}
const activityRefresh=e.target.closest('[data-activity-refresh]');
if(activityRefresh&&user&&members.length===2)void fetchActivityNotifications();
const activityRead=e.target.closest('[data-activity-read]');
if(activityRead)void markActivityNotificationRead(activityRead.dataset.activityRead);
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
const priorityShare=e.target.closest('[data-priority-share]');
if(priorityShare&&user&&viewerRole()==='teen')void setPriorityShare(priorityShare.dataset.deckId,priorityShare.dataset.cardId,priorityShare.getAttribute('aria-pressed')!=='true',user.id,sharedSession);
if(e.target.closest('[data-priority-retry]')&&user&&viewerRole()==='teen')void refresh().catch(showError);
const insightOpen=e.target.closest('[data-insight-open]');
if(insightOpen&&sharedInsightsEnabled&&themeAccessAllowed()){
  const id=insightOpen.dataset.insightOpen;
  if(id==='general'){activeThemeDeck=null;location.hash='swipe';void fetchSwipeMatches('general');}
  else{const deck=THEME_DECKS.find(d=>d.id===id);if(deck){activeThemeDeck=id;themeCategory='all';themeIndex=nextThemeUnanswered(deck);themeReview=false;location.hash='swipe';void fetchSwipeMatches(id);}}
}
const open=e.target.closest('[data-theme-open]');
if(open&&themeAccessAllowed()){
  const deck=THEME_DECKS.find(d=>d.id===open.dataset.themeOpen);
  if(deck){themeReviewEdit=null;activeThemeDeck=deck.id;themeCategory='all';themeIndex=nextThemeUnanswered(deck);themeReview=false;themeSaveError='';void fetchSwipeMatches(deck.id);render();scrollLiveMainTop();}
}
if(e.target.closest('#theme-review-back')&&themeReviewEdit&&page()==='swipe'&&!swipeBusy){
 reopenThemeReview();return;
}
if(e.target.closest('#theme-back')){themeReviewEdit=null;activeThemeDeck=null;themeCategory='all';themeReview=false;void fetchSwipeMatches('general');render();scrollLiveMainTop();}
const reviewButton=e.target.closest('[data-theme-review-index]');
if(reviewButton&&page()==='swipe'&&themeAccessAllowed()&&!swipeBusy&&!importanceSaving.size){
  const deck=THEME_DECKS.find(d=>d.id===activeThemeDeck);
  const index=Number(reviewButton.dataset.themeReviewIndex);
  if(deck&&reviewButton.dataset.themeReviewDeck===deck.id&&Number.isSafeInteger(index)
     &&index>=0&&index<deck.cards.length&&themeAnswers.get(deck.id).has(themeCardId(deck,index))){
    themeReviewEdit={viewer:user.id,session:sharedSession,deckId:deck.id,index,
      categoryBefore:themeCategory,indexBefore:themeIndex,reviewBefore:themeReview,
      search:String($('private-theme-review-search')?.value||'').slice(0,120),
      filter:$('private-theme-review-answer')?.value||'all'};
    const category=themeCardModel(deck,index)?.category;
    themeCategory=category&&themeCategories(deck).includes(category)?category:'all';
    themeReview=true;
    themeIndex=index;
    themeSaveError='';
    render();
    scrollLiveMainTop();
    $('swipe-card')?.focus({preventScroll:true});
  }
  return;
}
if(e.target.closest('#theme-restart')&&themeAccessAllowed()){const deck=THEME_DECKS.find(d=>d.id===activeThemeDeck);if(deck){themeReviewEdit=null;themeReview=true;themeIndex=themeVisibleIndices(deck)[0]??deck.cards.length;themeSaveError='';render();}}
});
document.addEventListener('input',e=>{if(e.target.matches?.('#swipe-general-review-search'))filterPrivateGeneralReview();if(e.target.matches?.('#private-theme-review-search')){filterPrivateThemeReview();return;}if(e.target.matches?.('#mediator-input')){mediatorExperience.input(e.target.value);const count=document.getElementById('mediator-char-count');if(count)count.textContent=e.target.value.length+' / 2000 tecken';const send=document.querySelector('#mediator-form button[type="submit"]');if(send)send.disabled=!e.target.value.trim();return;}if(e.target.matches?.('#family-chat-body')){familyChatDraft=e.target.value;familyChatRequestKey=null;familyChatStatus='';return;}if(e.target.matches?.('#schyssta-search')){schysstaSearch=e.target.value.slice(0,100);applySchysstaFilters();return;}if(e.target.matches?.('#schyssta-body')){schysstaDraft=e.target.value;schysstaDraftKey=null;schysstaMessage='';const preview=document.getElementById('schyssta-preview-text');if(preview)preview.textContent=schysstaDraft.trim()||'Skriv en regel ovan för att förhandsgranska texten.';const count=document.getElementById('schyssta-length');if(count)count.textContent=schysstaDraft.length+' av 500 tecken';return;}if(!e.target.matches?.('[data-importance]'))return;e.target.setAttribute('aria-valuetext',importanceValueText(Number(e.target.value)));});
document.addEventListener('change',e=>{if(e.target.matches?.('#swipe-general-review-answer'))filterPrivateGeneralReview();if(e.target.matches?.('#private-theme-review-answer')){filterPrivateThemeReview();return;}
  if(e.target.matches?.('#mediator-use-context')){mediatorExperience.setProjectContext(e.target.checked);return;}
  if(e.target.matches?.('input[data-pf-answer],input[data-ipip-retest-answer]')){void personalityExperience.handleChange(e.target);return;}
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
  // Arrow keys may control the card only when no navigation, form or slider is focused.
  // Without this guard, keyboard navigation could silently save an unintended answer.
  const interactive=e.target.closest?.('a,button,input,textarea,select,[contenteditable],[role="slider"],[role="button"],[role="link"],[role="textbox"],[role="spinbutton"],[role="combobox"],[role="menuitem"],[role="radio"]');
  if(page()==='swipe'&&user&&!interactive&&!e.altKey&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&['ArrowLeft','ArrowRight'].includes(e.key)){
    e.preventDefault();advanceSwipe(e.key==='ArrowRight'?'yes':'no');
  }
});
document.addEventListener('submit',async e=>{if(e.target.id==='comm-reflection-form'){e.preventDefault();if(page()!=='kommunikation'||!user)return;const values=Object.fromEntries(new FormData(e.target));const result=buildReflectionPractice(values);const output=$('comm-reflection-output');if(output){output.textContent=result||'Fyll i alla tre stegen innan du skapar en spegling.';output.focus();}return;}if(e.target.id==='comm-solution-form'){e.preventDefault();if(page()!=='kommunikation'||!user)return;const values=Object.fromEntries(new FormData(e.target));const plan=buildSolutionPlan(values);const output=$('comm-solution-output');if(output){output.textContent=plan||'Fyll i alla fyra fälten innan du skapar ett utkast.';output.focus();}return;}if(e.target.id==='comm-nvc-form'){e.preventDefault();if(page()!=='nvc'||!user)return;const values=Object.fromEntries(new FormData(e.target));const sentence=buildNvcSentence(values);const output=$('comm-nvc-output');if(output){output.textContent=sentence||'Fyll i alla fyra steg innan du skapar en formulering.';output.focus();}return;}if(e.target.id==='mediator-form'){e.preventDefault();await mediatorExperience.submit();return;}if(e.target.id==='family-chat-form'){e.preventDefault();await sendFamilyChatMessage();return;}if(e.target.id==='schyssta-manual-form'){e.preventDefault();await submitManualSchysstaRule();return;}if(e.target.id!=='live-login')return;e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;const feedback=$('login-feedback');feedback.textContent='Loggar in…';const email=$('live-email').value.trim();try{const {error}=await db.auth.signInWithPassword({email,password:$('live-password').value});if(error)throw error;$('live-password') && ($('live-password').value='');await refresh();}catch(err){feedback.textContent='Kunde inte logga in. Kontrollera e-post och lösenord, eller välj ”Glömt lösenord eller saknar lösenord?”.';}finally{b.disabled=false;}});
window.addEventListener('hashchange',()=>{
  if(page()!=='insikter'){activityInviteError='';insightsRows=[];sharedUnderstandingRows=[];insightsError='';insightsLoading=false;insightsRequest++;}
  if(page()!=='regler'&&page()!=='inkorg'){schysstaSuggestions=[];schysstaRules=[];schysstaManualRules=[];schysstaNotifications=[];schysstaReplacementLinks=[];schysstaHistory=[];schysstaError='';schysstaLoading=false;schysstaRequest++;}
  render();scrollLiveMainTop();
  if(!user||!openCommunicationSkill($('live-app'),communicationSkillFromHash(location.hash),{focus:true}))$('live-app')?.focus({preventScroll:true});
  if(page()==='insikter')void fetchInsights();
  if(page()==='personlighet')void personalityExperience.refreshShared();
  if(page()==='medlare')void mediatorExperience.loadList();
  if(['regler','inkorg','hem'].includes(page()))void fetchSchysstaList();
  if(page()==='inkorg')void fetchFamilyChat();
  else if(page()==='hem')void fetchFamilyChatUnread();
  if(['hem','inkorg'].includes(page())&&user&&members.length===2)void fetchActivityNotifications();
  if(page()==='swipe')void pollSharedMatches();
});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden)return;
  void pollSharedMatches();
  if(page()==='personlighet')void personalityExperience.refreshShared();
  if(page()==='insikter'&&user&&members.length===2)void fetchInsights({quiet:true});
  // Refresh the family's inbox after returning to the tab, without overwriting a draft.
  if(schysstaListEnabled&&user&&members.length===2&&!schysstaLoading&&!schysstaDraftOpen
    &&['hem','inkorg','regler'].includes(page()))void fetchSchysstaList();
  if(activityNotificationsEnabled&&user&&members.length===2&&['hem','inkorg'].includes(page()))
    void fetchActivityNotifications({quiet:true});
});
window.addEventListener('online',()=>{
  if(page()==='insikter'&&user&&members.length===2)void fetchInsights({quiet:true});
  if(schysstaListEnabled&&user&&members.length===2&&!schysstaDraftOpen&&!schysstaLoading
     &&schysstaError&&['hem','inkorg','regler'].includes(page()))void fetchSchysstaList();
});
window.addEventListener('focus',()=>{
  void pollSharedMatches();
  if(page()==='insikter'&&user&&members.length===2)void fetchInsights({quiet:true});
  if(page()==='inkorg'&&user&&members.length===2)void recheckInboxPair();
});
// Light polling while the tab is visible. Never rerender the message composer mid-draft.
window.setInterval(()=>{
  if(document.hidden||!user||members.length!==2)return;
  if(page()==='inkorg'){
    void recheckInboxPair().then(valid=>{
      if(valid&&!familyChatDraft.trim()&&!familyChatSending&&!familyChatLoading&&!familyChatLoadingOlder)
        void fetchFamilyChat(false,{quiet:true});
    });
  }else if(page()==='hem')void fetchFamilyChatUnread();
},15000);
window.setInterval(()=>void pollSharedMatches(),SHARED_POLL_INTERVAL_MS);
window.setInterval(()=>{if(!document.hidden&&page()==='insikter'&&user&&members.length===2)void fetchInsights({quiet:true});},INSIGHTS_CONSENT_REFRESH_MS);
// If the other family member withdraws consent, remove their profile on the next check.
window.setInterval(()=>{if(!document.hidden&&page()==='personlighet'&&user)void personalityExperience.refreshShared();},15000);
db.auth.onAuthStateChange(()=>setTimeout(()=>refresh().catch(showError),0));
function showError(e){$('live-app').innerHTML=card('<h2>Kunde inte läsa kontot</h2><p>'+esc(e.message)+'</p><a href="./konto.html">Öppna kontosidan</a>');}
refresh().catch(showError);
