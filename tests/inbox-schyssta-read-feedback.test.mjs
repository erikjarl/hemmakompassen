import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

// Exercise the actual rule-notice read handler and the actual inbox HTML,
// not merely the underlying state or a separately reconstructed message.
const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
function chunk(start,end){
 const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'Read production bounds '+start);
 return source.slice(a,b);
}
const production=[
 chunk('async function schysstaWriteRpc(operation){','async function markSchysstaRead(id){'),
 chunk('async function markSchysstaRead(id){','function validSchysstaReplacementLinks'),
 chunk('function familyChatEmptyMessage(){','async function fetchSchysstaList(){')
].join('\n');
const noticeId='40000000-0000-4000-8000-000000000091';
const agreementId='30000000-0000-4000-8000-000000000092';
function harness({role='parent',fail=true,readback=true,confirmed=true,previous=''}={}){
 const frames=[],calls=[],reloads=[];
 const state={
   user:{id:role,email:'test@example.invalid'},
   members:[{user_id:'parent',role:'parent',display_name:'Förälder'},
     {user_id:'teen',role:'teen',display_name:'Tonåring'}],
   sharedSession:2,inboxPairEpoch:'epoch-1',
   familyChatDraft:'Privat oskickat utkast',familyChatMessages:[],
   familyChatUnread:0,familyChatUnreadError:false,familyChatLoading:false,
   familyChatLoadingOlder:false,familyChatHasMore:false,familyChatHistoryVerified:false,
   familyChatSending:false,familyChatStatus:'',familyChatError:'',
   familyChatReadBusy:false,
   schysstaListEnabled:true,schysstaLoading:false,schysstaError:'',
   schysstaSaving:new Set(),schysstaMessage:previous,
   schysstaNotifications:[{notification_id:noticeId,agreement_id:agreementId,
     kind:'rule_proposed',body:'Prata efter skolan',read_at:null,created_at:'2026-11-09T07:00:00Z'}],
   schysstaSuggestions:[],schysstaRules:[],schysstaManualRules:[],
   schysstaReplacementLinks:[],schysstaHistory:[],
   sharedInsightsEnabled:true,
   activityNotificationsEnabled:false,activityNotificationsLoading:false,
   activityNotificationsError:'',activityUnreadCount:()=>0,
   inboxRefreshing:false,inboxRefreshStatus:'',
   SCHYSSTA_UUID:/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
   preflightSchysstaWrite:async()=>true,
   schysstaNeedsAnswer:()=>[],schysstaUnreadCount:()=>1,
   page:()=> 'inkorg',card:html=>'<section>'+html+'</section>',
   esc:s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;'),
   familyChatTimestamp:()=> '9 november',
   setTimeout,clearTimeout,
   db:{rpc(name,args){
     calls.push({name,args});
     assert.equal(name,'mark_schyssta_notification_read');
     assert.equal(args.p_notification_id,noticeId);
     return Promise.resolve(fail?{data:null,error:{message:'Synthetic offline'}}:{data:null,error:null});
   }},
   render:()=>{frames.push(state.inboxView());},
   fetchSchysstaList:async()=>{reloads.push('refresh');if(readback&&confirmed)state.schysstaNotifications[0].read_at='2026-11-11T00:00:00Z';state.render();return readback;}
 };
 vm.runInNewContext(production+'\nthis.inboxView=inboxView;this.markNotice=markSchysstaRead;',
  state,{filename:'live-app.js'});
 return {state,frames,calls,reloads};
}
for(const role of ['parent','teen']){
 test('FUN-03: '+role+' sees a failed Schyssta notification read inside inbox, not only on rules page',async()=>{
   const h=harness({role});
   assert.match(h.state.inboxView(),/data-schyssta-read=/);
   await h.state.markNotice(noticeId);
   assert.equal(h.calls.length,1);
   assert.equal(h.state.schysstaSaving.size,0);
   assert.match(h.state.schysstaMessage,/inte att bekräfta läsmarkeringen/);
   assert.match(h.frames.at(-1),/role="(?:status|alert)"[^>]*>Det gick inte att bekräfta läsmarkeringen/,
     'The actual inbox HTML must expose the error close to rule notices');
   assert.equal(h.state.familyChatDraft,'Privat oskickat utkast');
   assert.equal(h.reloads.length,0,'No success reload after a failed receipt');
 });
}
test('FUN-03: a successful Schyssta receipt retry clears the old visible failure',async()=>{
 const h=harness({fail:false,previous:'Det gick inte att bekräfta läsmarkeringen. Uppdatera listan för att kontrollera statusen.'});
 assert.match(h.state.inboxView(),/Det gick inte att bekräfta/);
 await h.state.markNotice(noticeId);
 assert.equal(h.calls.length,1);
 assert.equal(h.reloads.length,1);
 assert.equal(h.state.schysstaMessage,'','Success must dismiss a stale error');
 assert.doesNotMatch(h.frames.at(-1),/Det gick inte att bekräfta läsmarkeringen/);
 assert.equal(h.state.familyChatDraft,'Privat oskickat utkast');
});

test('FBK-02-04: successful rule-notice RPC with failed list readback shows uncertainty',async()=>{
 const h=harness({fail:false,readback:false});
 await h.state.markNotice(noticeId);
 assert.equal(h.calls.length,1);
 assert.equal(h.reloads.length,1);
 assert.match(h.state.schysstaMessage,/inte att bekräfta att aviseringen är läst/);
 assert.match(h.frames.at(-1),/Läsmarkeringen skickades, men det gick inte att bekräfta att aviseringen är läst/);
 assert.equal(h.state.familyChatDraft,'Privat oskickat utkast');
});

test('FBK-02-04: late readback after account switch must not alter the new inbox',async()=>{
 const h=harness({fail:false});
 let release;
 h.state.fetchSchysstaList=()=>new Promise(resolve=>{release=resolve;});
 const pending=h.state.markNotice(noticeId);
 for(let i=0;i<5&&!release;i++)await new Promise(resolve=>setImmediate(resolve));
 assert.ok(release,'Readback is pending');
 h.state.user={id:'new-viewer'};
 h.state.sharedSession++;
 h.state.schysstaMessage='Ny sessionsstatus';
 release(false);
 await pending;
 assert.equal(h.state.schysstaMessage,'Ny sessionsstatus');
});

test('FBK-02-04: successful server fetch without the specific read receipt remains unconfirmed',async()=>{
 const h=harness({fail:false,confirmed:false});
 await h.state.markNotice(noticeId);
 assert.equal(h.calls.length,1);
 assert.equal(h.reloads.length,1);
 assert.equal(h.state.schysstaNotifications[0].read_at,null);
 assert.match(h.state.schysstaMessage,/inte att bekräfta att aviseringen är läst/);
 assert.match(h.frames.at(-1),/Läsmarkeringen skickades, men det gick inte att bekräfta/);
});

test('FBK-02-04: missing notice in a successful server list is not a verified read receipt',async()=>{
 const h=harness({fail:false,confirmed:false});
 h.state.fetchSchysstaList=async()=>{h.state.schysstaNotifications=[];return true;};
 await h.state.markNotice(noticeId);
 assert.match(h.state.schysstaMessage,/inte att bekräfta att aviseringen är läst/);
});

test('FBK-02-04: rule-notice read button stays busy until its server readback completes',async()=>{
 const h=harness({fail:false});
 let complete;
 h.state.fetchSchysstaList=()=>new Promise(resolve=>{complete=resolve;});
 const pending=h.state.markNotice(noticeId);
 for(let i=0;i<5&&!complete;i++)await new Promise(resolve=>setImmediate(resolve));
 assert.ok(complete,'Readback starts');
 assert.equal(h.state.schysstaSaving.has(noticeId),true);
 await h.state.markNotice(noticeId);
 assert.equal(h.calls.length,1,'Duplicate click cannot send a second receipt RPC');
 h.state.schysstaNotifications[0].read_at='2026-11-11T00:00:00Z';
 complete(true);
 await pending;
 assert.equal(h.state.schysstaSaving.has(noticeId),false);
 assert.equal(h.state.schysstaMessage,'');
});
