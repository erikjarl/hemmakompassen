import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const app=await readFile(new URL('../live-app.js',import.meta.url),'utf8');
const config=await readFile(new URL('../backend-config.js',import.meta.url),'utf8');
const migration=await readFile(new URL('../supabase/migrations/20261030180000_schyssta_list_server_contract.sql',import.meta.url),'utf8');

test('Schyssta listan is enabled for the online test site, with authenticated RPCs',()=>{
  assert.match(config,/enableSchysstaList:\s*true/);
  assert.match(app,/const schysstaListEnabled=c\.enableSchysstaList===true/);
  assert.match(app,/if\(!schysstaListEnabled\)return/);
});

test('client uses only the four narrow reviewed RPCs and separate decisions',()=>{
  for(const rpc of ['shared_schyssta_rule_suggestions','my_schyssta_rules','propose_schyssta_rule','set_schyssta_rule_decision']){
    assert.match(app,new RegExp("db\\.rpc\\('"+rpc.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+"'"));
    assert.match(migration,new RegExp('function public\\.'+rpc));
  }
  assert.match(app,/\{p_card_id:cardId\}/);
  assert.match(app,/\{p_agreement_id:agreementId,p_approved:approved\}/);
  assert.match(app,/Ett förslag är inte ett godkännande/);
});

test('all shared rows are constrained to the 12 canonical rule cards',()=>{
  const ids=[...app.matchAll(/'regler-(\d{2})':'Vi /g)].map(match=>match[1]);
  assert.deepEqual(ids.slice(0,12),Array.from({length:12},(_,index)=>String(index+1).padStart(2,'0')));
  assert.match(app,/SCHYSSTA_RULES\[row\.card_id\]===row\.body/);
  assert.match(app,/SCHYSSTA_RULES\[row\.source_card_id\]!==row\.body/);
  assert.match(app,/Object\.keys\(row\)\.every/);
  assert.doesNotMatch(app,/schysstaSuggestions.*user_id|schysstaRules.*user_id/);
});

test('Schyssta listan rejects incomplete, duplicate or contradictory RPC snapshots in full',()=>{
  const start=app.indexOf('const SCHYSSTA_UUID=');
  const end=app.indexOf('async function fetchSchysstaList()');
  assert.ok(start>=0&&end>start,'Locate the production validators');
  const catalog=Object.fromEntries([...app.matchAll(/'(regler-\d{2})':'([^']+)'/g)].map(match=>[match[1],match[2]]));
  assert.equal(Object.keys(catalog).length,12);
  const validate=runInNewContext(app.slice(start,end)+'\nvalidSchysstaPayload',{SCHYSSTA_RULES:catalog});
  const suggestion={card_id:'regler-01',body:catalog['regler-01']};
  const rule={agreement_id:'123e4567-e89b-42d3-a456-426614174000',source_card_id:'regler-02',
    body:catalog['regler-02'],status:'proposed',proposed_by_me:false,
    own_decision:null,parent_decision:null,teen_decision:null,created_at:'2026-10-31T15:00:00Z'};
  assert.equal(validate([suggestion],[rule]),true,'Valid independent snapshots remain usable');
  assert.equal(validate([],[]),true,'A legitimately empty snapshot is safe');
  assert.equal(validate([suggestion,{card_id:'regler-99',body:'unexpected'}],[rule]),false,'Reject any unexpected row, not only that row');
  assert.equal(validate([suggestion,suggestion],[rule]),false,'Reject duplicate suggested cards');
  assert.equal(validate([suggestion],[rule,rule]),false,'Reject duplicate agreements');
  assert.equal(validate([suggestion],[{...rule,source_card_id:'regler-01',body:catalog['regler-01']}]),false,'A proposed rule cannot simultaneously be available as a suggestion');
  assert.equal(validate([{}],[]),false,'Missing both card ID and body must not validate as undefined equals undefined');
  assert.equal(validate([7],[]),false,'Primitive suggestion rows are invalid');
  assert.equal(validate([], [{...rule,source_card_id:undefined,body:undefined}]),false,'Missing rule source ID and body is invalid');
  assert.equal(validate([], [{...rule,source_card_id:42}]),false,'Non-text source ID is invalid');
  const {created_at:missingTimestamp,...withoutTimestamp}=rule;
  assert.equal(validate([], [withoutTimestamp]),false,'Missing server timestamp cannot confirm an agreement');
  const {own_decision:missingVote,...withoutOwnVote}=rule;
  assert.equal(validate([], [withoutOwnVote]),false,'Missing own vote cannot appear as an unanswered proposal');
  const {parent_decision:missingParent,...withoutParentVote}=rule;
  assert.equal(validate([], [withoutParentVote]),false,'Missing parent decision cannot imply pending approval');
  assert.equal(validate([], [{...rule,extra_field:'unexpected'}]),false,'Unexpected server field rejects the snapshot');
  assert.equal(validate(null,[rule]),false,'Null RPC payload is not a legitimate empty array');
  assert.equal(validate([suggestion],null),false,'Missing agreements cannot imply an empty list');
  assert.equal(validate([suggestion],[{...rule,parent_decision:'yes'}]),false,'Reject invalid decision types');
  assert.ok(app.includes("else if(!validSchysstaPayload(results[0].data,results[1].data)||!validManualSchysstaPayload(results[2].data,results[1].data)||!validSchysstaNotifications(results[3].data)||!validSchysstaReplacementLinks(results[4].data,results[2].data)||!validSchysstaHistory(results[5].data))"),'All rule, manual, notification, replacement and archived sources fail closed together');
  assert.match(app,/Inga förslag eller överenskommelser visas/);
});

test('manual Schyssta proposals and inbox are backed by the installed authenticated RPCs',()=>{
  assert.match(app,/db\.rpc\('my_manual_schyssta_rules'\)/);
  assert.match(app,/db\.rpc\('propose_manual_schyssta_rule'/);
  assert.match(app,/data-schyssta-open/);
  assert.match(app,/function inboxView\(\)/);
  assert.match(app,/schysstaNeedsAnswer/);
  assert.match(app,/Ni behöver båda godkänna det innan det blir en överenskommelse/);
  assert.match(app,/Ditt val: /);
});

test('Schyssta inbox ranks actionable requests newest first and reloads after foregrounding',()=>{
  assert.match(app,/schysstaNeedsAnswer=.*\.sort\(\(a,b\)=>Date\.parse\(b\.created_at\)-Date\.parse\(a\.created_at\)\)/);
  assert.match(app,/data-schyssta-refresh/);
  assert.match(app,/document\.addEventListener\('visibilitychange'/);
  assert.match(app,/!schysstaDraftOpen/);
  assert.match(app,/Tips för en tydlig och rättvis överenskommelse/);
});

test('Schyssta accepted rules have only management actions and requests come first',()=>{
  assert.match(app,/const decisionActions=item\.status==='accepted'/);
  assert.match(app,/const manageActions=item\.status==='accepted'/);
  assert.match(app,/Ta tillbaka mitt ja/);
  assert.match(app,/Ändra till ja/);
  assert.match(app,/data-schyssta-refresh/);
  assert.match(app,/id="schyssta-history"/);
  assert.match(app,/el\?\.closest\('details'\)/);
});

test('Schyssta history is private and withdrawal needs explicit confirmation',()=>{
  assert.match(app,/db\.rpc\('my_schyssta_rule_history'\)/);
  assert.match(app,/db\.rpc\('withdraw_schyssta_rule'/);
  assert.match(app,/data-schyssta-end-confirm/);
  assert.match(app,/schysstaHistory\.length/);
});

test('Schyssta rule changes are proposed as new manual rules without implicit approval',()=>{
  assert.match(app,/db\.rpc\('propose_schyssta_change'/);
  assert.match(app,/db\.rpc\('my_schyssta_replacement_links'/);
  assert.match(app,/data-schyssta-edit/);
  assert.match(app,/Föreslå ändring/);
  assert.match(app,/Den tidigare överenskommelsen gäller tills ni båda/);
});

test('Rule review never scores a family and copy exports only approved text on click',()=>{
  assert.match(app,/function copySchysstaAgreements\(\)/);
  assert.match(app,/const approved=schysstaAllRules\(\)\.filter\(item=>item\.status==='accepted'\)/);
  assert.match(app,/navigator\.clipboard\.writeText\(payload\)/);
  assert.match(app,/data-schyssta-copy/);
  assert.match(app,/Hur fungerar den här regeln för oss/);
  assert.match(app,/Vad har fungerat bra för oss/);
  assert.doesNotMatch(app,/schysstaCopyMessage.*user_id/);
});

test('Schyssta search only filters an authorized, already validated snapshot',()=>{
  assert.match(app,/function applySchysstaFilters\(\)/);
  assert.match(app,/item\.querySelector\('p'\)\?\.textContent/);
  assert.match(app,/data-schyssta-filter-group="approved"/);
  assert.match(app,/data-schyssta-filter-group="ongoing"/);
  assert.match(app,/function render\(\)\s*\{[\s\S]*?if\(page\(\)==='regler'&&user\)applySchysstaFilters\(\)/,'Schyssta filtering remains attached to render despite additional accessibility logic');
  assert.match(app,/schysstaFilterStatus=\['all','approved','ongoing'\]/);
  assert.match(app,/schysstaSearch='';schysstaFilterStatus='all'/);
  assert.match(app,/item\.status==='rejected'/);
  assert.doesNotMatch(app,/db\.rpc\('search_schyssta/);
});

test('Schyssta first-time guidance, live rule preview and menus use safe local display data',()=>{
  assert.match(app,/function menu\(\)/);
  assert.match(app,/schysstaNeedsAnswer\(\)\.length/);
  assert.match(app,/schysstaUnreadCount\(\)/);
  assert.match(app,/class="live-nav-count" aria-hidden="true"/);
  assert.match(app,/aria-describedby="schyssta-length schyssta-description"/);
  assert.match(app,/id="schyssta-preview-text"/);
  assert.match(app,/preview\.textContent=schysstaDraft\.trim\(\)/);
  assert.match(app,/data-schyssta-start/);
  assert.match(app,/Ni har inte gjort någon gemensam överenskommelse än/);
  assert.match(app,/Hitta idéer i Gillaswajpen/);
  assert.match(app,/new Intl\.DateTimeFormat\('sv-SE'/);
  assert.doesNotMatch(app,/schysstaDraft[^\n]{0,100}\.innerHTML=/);
});

test('Inte nu is a local deferral and never sends a backend decision',()=>{
  assert.match(app,/const schysstaPausedIds=new Set\(\)/);
  assert.match(app,/!schysstaPausedIds\.has\(row\.agreement_id\)/);
  assert.match(app,/schysstaPausedIds\.add\(row\.agreement_id\)/);
  assert.match(app,/schysstaPausedIds\.clear\(\)/);
  assert.match(app,/Inget beslut har sparats/);
});

test('Schyssta fetch failure clears old data and bounds a stalled network request',()=>{
  assert.match(app,/results=await Promise\.race\(\[pending,new Promise/);
  assert.match(app,/setTimeout\(\(\)=>reject\(new Error\('Schyssta fetch timeout'\)\),15000\)/);
  assert.match(app,/finally\{clearTimeout\(timeoutHandle\);\}/);
  assert.match(app,/schysstaSuggestions=\[\];schysstaRules=\[\];schysstaManualRules=\[\];schysstaNotifications=\[\]/);
  assert.match(app,/window\.addEventListener\('online'/);
  assert.match(app,/schysstaError&&\['hem','inkorg','regler'\]\.includes\(page\(\)\)/);
});

test('Inbox has pair-private messages independent of rule decisions',()=>{
  assert.match(app,/db\.rpc\('send_family_message'/);
  assert.match(app,/db\.rpc\('my_family_messages'/);
  assert.match(app,/db\.rpc\('my_family_unread_message_count'/);
  assert.match(app,/db\.rpc\('mark_family_messages_read'/);
  assert.match(app,/function validFamilyChatRows\(rows\)/);
  assert.match(app,/function clearFamilyChat\(\)/);
  assert.match(app,/familyChatRequestKey=crypto\.randomUUID\(\)/);
  assert.match(app,/navigator\.clipboard\.writeText\(payload\)/);
  assert.match(app,/id="family-chat-form"/);
  assert.match(app,/data-family-chat-more/);
  assert.match(app,/data-family-chat-refresh/);
  assert.match(app,/if\(familyChatDraft\.trim\(\)===body\)familyChatDraft='';/);
  assert.match(app,/if\(familyChatRequestKey===token\)familyChatRequestKey=null;/);
  assert.match(app,/esc\(m\.body\)/);
  assert.match(app,/!Number\.isNaN\(Date\.parse\(m\.created_at\)\)/);
  assert.doesNotMatch(app,/familyChatMessages[^\n]*\.innerHTML/);
});


test('SL-UX-01: next action, empty state and counts are derived from validated rules',()=>{
 assert.match(app,/const quickActions='<section class="schyssta-quick-actions'\+\(approved\.length\?' schyssta-quick-actions--secondary':''\)/);
 assert.match(app,/needs\.length===0\?'Inget väntar just nu'/);
 assert.doesNotMatch(app,/approved\.length\+' '/); // approved count is already represented by the visible list
 assert.match(app,/ongoing\.length\+' '/);
 assert.match(app,/schysstaHistory\.length\+' '/);
 assert.match(app,/data-schyssta-compose-jump/);
 assert.match(app,/editor\?\.focus\(\)/);
 assert.doesNotMatch(app,/För dig som förälder: lyssna före regelförslaget/);
 assert.match(app,/if\(schysstaError\)return '<h1>Schyssta listan<\/h1>'\+card\('<h2>'\+/);
 assert.match(app,/Kunde inte bekräfta åtgärden/);
 assert.match(app,/Kunde inte visa listan/);
});


test('FBK-02-05: pending rule actions clearly indicate the server write',()=>{
  assert.match(app,/const submitButton=\(approved,label,style='live-button'\)/);
  assert.match(app,/action\?'Sparar…':label/);
  assert.match(app,/schysstaSaving\.has\(item\.card_id\)\?'Skickar…':'Föreslå'/);
  assert.match(app,/disabled aria-busy="true"/);
});


test('FBK-02-04: Inbox nav badge excludes unverified pairs and labels failed reads unknown',()=>{
  const begin=app.indexOf('function inboxNavUnreadState(){');
  const end=app.indexOf('function menu(){',begin);
  const helper=app.slice(begin,end);
  const menu=app.slice(end,app.indexOf('\nfunction ',end+10));
  assert.match(helper,/const ready=!!user&&members\.length===2&&!!inboxPairEpoch/);
  assert.match(helper,/if\(!ready\)return \{total:0,unknown:false,parts:\[0,0,0\]\}/);
  assert.match(helper,/familyChatUnreadError\?null:familyChatUnread/);
  assert.match(helper,/schysstaLoading\|\|schysstaError\?null:schysstaUnreadCount\(\)/);
  assert.match(helper,/activityNotificationsLoading\|\|activityNotificationsError\?null:activityUnreadCount\(\)/);
  assert.match(menu,/const unreadState=inboxNavUnreadState\(\)/);
  assert.match(menu,/const unknown=isInbox&&unreadState\.unknown/);
});

test('FBK-02-04: marking chat read waits for authoritative unread count before confirming',async()=>{
  const begin=app.indexOf('async function markAllFamilyChatRead(){');
  const end=app.indexOf('\nfunction updateFamilyChatDraft(',begin);
  assert.ok(begin>=0&&end>begin,'Find production mark-all implementation');
  for(const remaining of [0,2,'error']){
    let releaseReadback;
    const pendingReadback=new Promise(resolve=>{releaseReadback=resolve;});
    const state={
      user:{id:'reader'},members:[{},{}],inboxPairEpoch:'current-pair',
      familyChatReadBusy:false,familyChatLoading:false,
      familyChatUnreadError:false,familyChatUnread:3,familyChatStatus:'',
      familyChatCountRequest:0,sharedSession:1,
      recheckInboxPair:async()=>true,
      db:{rpc:async name=>{
        assert.equal(name,'mark_family_messages_read');
        return {data:3,error:null};
      }},
      fetchFamilyChatUnread:async()=>{
        await pendingReadback;
        state.familyChatCountRequest++;
        state.familyChatUnreadError=remaining==='error';
        state.familyChatUnread=remaining==='error'?0:remaining;
      },
      render:()=>{},setTimeout,clearTimeout
    };
    runInNewContext(app.slice(begin,end)+'\nthis.markRead=markAllFamilyChatRead;',state);
    const action=state.markRead();
    // Let preflight and the write receipt finish before readback is released.
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(state.familyChatReadBusy,true);
    assert.notEqual(state.familyChatStatus,'Alla meddelanden har markerats som lästa.',
      'A write receipt alone cannot prove zero unread messages');
    releaseReadback();
    const confirmed=await action;
    assert.equal(state.familyChatReadBusy,false);
    assert.equal(state.familyChatCountRequest,2);
    if(remaining===0){
      assert.equal(confirmed,true);
      assert.equal(state.familyChatStatus,'Alla meddelanden har markerats som lästa.');
    }else{
      assert.equal(confirmed,false);
      assert.doesNotMatch(state.familyChatStatus,/^Alla meddelanden har markerats som lästa/);
      assert.match(state.familyChatStatus,remaining==='error'?/kunde inte bekräftas/:/2 olästa/);
    }
  }
});


test('FBK-02-05: only two current yes votes can be displayed as accepted for either rule type',()=>{
  const start=app.indexOf('const SCHYSSTA_UUID=');
  const end=app.indexOf('async function fetchSchysstaList()');
  assert.ok(start>=0&&end>start);
  const catalog=Object.fromEntries([...app.matchAll(/'(regler-\d{2})':'([^']+)'/g)].map(match=>[match[1],match[2]]));
  const validators=runInNewContext(app.slice(start,end)+'\n({catalogRule:validSchysstaRule,manualRule:validManualSchysstaRule})',{SCHYSSTA_RULES:catalog});
  const common={
    agreement_id:'123e4567-e89b-42d3-a456-426614174000',status:'accepted',
    proposed_by_me:false,own_decision:true,parent_decision:true,teen_decision:true,
    created_at:'2026-11-11T08:00:00Z'
  };
  const card={...common,source_card_id:'regler-01',body:catalog['regler-01']};
  const manual={...common,agreement_version:1,body:'Vi kommer överens om en sak i taget.'};
  for(const [name,validator,rule] of [
    ['card',validators.catalogRule,card],['manual',validators.manualRule,manual]
  ]){
    assert.equal(validator(rule),true,name+' accepts two yes decisions');
    assert.equal(validator({...rule,parent_decision:null}),false,name+' rejects one yes as accepted');
    assert.equal(validator({...rule,teen_decision:false}),false,name+' rejects a no as accepted');
    assert.equal(validator({...rule,status:'proposed'}),false,name+' cannot leave two yes as proposed');
    assert.equal(validator({...rule,status:'rejected'}),false,name+' cannot reject two yes votes');
    assert.equal(validator({...rule,status:'proposed',teen_decision:null}),true,name+' accepts one yes pending');
    assert.equal(validator({...rule,status:'rejected',teen_decision:false}),true,name+' accepts one no rejection');
  }
});


test('FBK-02-01: approved agreements precede secondary actions and optional panels are folded',()=>{
  const view=app.slice(app.indexOf('function schysstaView(){'),app.indexOf('\nfunction section(key)',app.indexOf('function schysstaView(){')));
  assert.ok(view.includes("const approvedSection="),'Approved section remains present');
  assert.match(view,/return '<div class="schyssta-view">/);
  const returnMarkup=view.slice(view.lastIndexOf("return '<div class=\"schyssta-view\""));
  assert.ok(returnMarkup.indexOf('+approvedSection')<returnMarkup.indexOf('+quickActions'),'Agreed rules must come first');
  assert.match(view,/const searchTools='<details class="schyssta-search-panel"/);
  assert.match(view,/schysstaSearch\.trim\(\)\|\|schysstaFilterStatus!==/);
  assert.match(view,/<summary>Sök och filtrera regler<\/summary>/);
  assert.match(returnMarkup,/<details class="schyssta-extra-panel"><summary>Fler förslag från Gillaswajpen/);
  assert.match(view,/const needsSection=needs\.length/);
  assert.match(returnMarkup,/\+needsSection/);
});
