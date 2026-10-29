import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const script=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');

assert.match(script,/db\.rpc\('shared_swipe_matches',\{p_deck_id:deckId\}\)/,'Uses only the reviewed aggregate function for the selected deck');
assert.match(script,/sharedPrioritiesEnabled[\s\S]*?db\.rpc\('shared_swipe_priorities',\{p_deck_id:deckId\}\)/,'Priority IDs come only from the separately gated aggregate RPC');
assert.match(script,/if\(row\?\.deck_id!==deckId\|\|!safe\.has\(row\.card_id\)\)continue/,'A priority must also exist in the current server-verified mutual-YES set');
assert.match(script,/enableSharedPriorities===true/,'Shared priorities require an explicit disabled-by-default feature flag');
assert.match(script,/r\?\.deck_id!==deckId\|\|r\.answer!==true/,'Rejects rows from another deck and every non-YES answer');
assert.match(script,/deck\.cards\.find\(card=>card\.id===r\.card_id&&card\.type==='match'\)/,'Allows only catalogued A cards from the selected deck');
assert.match(script,/if\(!user\|\|members\.length!==2\)return/,'Requires an authenticated paired family');
assert.match(script,/session!==sharedSession\|\|request!==sharedRequest\|\|user\?\.id!==viewer/,'Rejects stale results after a session switch or refresh');
assert.match(script,/sharedMatches=\[\];[\s\S]*sharedError='Gemensamma resultat är inte tillgängliga/,'Clears results after RPC errors');
assert.match(script,/safe\.set\(r\.card_id,\{deck_id:deckId,card_id:r\.card_id,answer:true\}\)/,'Stores only true answers with their verified deck id');
assert.doesNotMatch(script,/sharedMatches\.filter\(r=>r\.answer===false\)/,'No mutual NO category is rendered');
assert.doesNotMatch(script,/Det ni båda svarat nej till/,'Never renders a shared NO heading');
assert.match(script,/swipe-match-theme/,'Mutual YES results are grouped by theme');
assert.match(script,/function sharedSummary\(groups,deckId='general',priorityIds=new Set\(\)\)/,'Builds the ordinary summary from mutual YES while excluding already prioritised advice');
assert.match(script,/const summaryIconFor=\(category,advice=''\)=>/,'Chooses deterministic topic icons from permitted editorial content without using private response data');
assert.match(script,/aria-hidden="true" focusable="false"/,'Decorative SVG icons stay out of the accessibility tree');
assert.match(script,/Läs mer om råden och vad de bygger på/,'Keeps the full card-specific basis available in an expandable section');
assert.match(script,/function sharedPrioritySummary\(items,deckId='general'\)/,'Builds a separate deterministic priority summary');
assert.match(script,/Låga, neutrala och privata nivåer visas aldrig/,'Explains the priority privacy boundary without exposing raw levels');
assert.match(script,/const statement=cardTextForRole\(matchedCard,viewerRole\(\)\)/,'Uses reviewed role wording in both the result list and summary');
assert.match(script,/remaining\.map\(item=>ADVICE_BY_KEY\[adviceKeyForCard\(item\.card,deckId\)\]\)/,'Derives ordinary editorial advice from each non-prioritised allowed matched card and deck');
assert.match(script,/new Set\(/,'Deduplicates repeated advice before rendering grouped prose');
assert.match(script,/members\.find\(member=>member\.user_id===user\?\.id\)\?\.role/,'Uses the signed-in member role for separate parent and teen wording');
assert.match(script,/REDAKTIONELLA RÅD · INTE AI/,'Labels the deterministic editorial advice clearly');
assert.match(script,/Texten bygger enbart på serververifierade ömsesidiga ja-svar/,'States the summary privacy boundary');
assert.doesNotMatch(script,/localStorage/,'No shared answers are cached locally');
assert.doesNotMatch(script,/shared_general_deck_complete/,'Theme decks no longer depend on finishing the general deck');
assert.ok(script.includes("themesUnlocked=!!user&&members.length===2&&members.some(member=>member.user_id===user.id)&&members.some(member=>member.role==='parent')&&members.some(member=>member.role==='teen')"),'Private theme access requires the signed-in user in an exact parent-teen pair');
assert.ok(script.includes("const unlocked=members.length===2&&themesUnlocked&&!themesLoading&&!themesError"),'Unpaired viewers cannot preview theme choices');
assert.match(script,/visibleGeneralIndices\(\)\.every\(i=>swipeAnswers\.has\(swipeCardId\(i\)\)\|\|skippedUnderstanding\.has\(swipeCardId\(i\)\)\)/,'Rechecks completion for role-visible cards and skipped understanding cards');
assert.match(script,/db\.from\('swipe_skips'\)\.select\('deck_id,card_id'\)\.eq\('user_id',viewer\)/,'Reloads only the signed-in user’s private skips');
assert.match(script,/db\.rpc\('set_understanding_card_state',\{p_card_id:row\.card_id,p_answer:row\.answer,p_skipped:false\}\)/,'Stores B answers through the role-checked atomic RPC');
assert.match(script,/db\.rpc\('set_understanding_card_state',\{p_card_id:cardId,p_answer:null,p_skipped:true\}\)/,'Stores B skips through the role-checked atomic RPC');
assert.match(script,/swipeAnswers\.delete\(cardId\);\s*skippedUnderstanding\.add\(cardId\)/,'A successful skip revokes the prior answer locally');
assert.doesNotMatch(script,/#swipe-restart'[\s\S]{0,160}skippedUnderstanding\.clear/,'Review does not erase persistent private skip state');
console.log('PASS: mutual-YES-only RPC results, role-specific rule summary, theme groups and fail-closed state');


// Execute the actual shared-view and summary functions with synthetic data.
const sharedViewFunctions=script.match(/const joinSwedish=[\s\S]*?(?=\nasync function fetchSwipeMatches\()/);
assert.ok(sharedViewFunctions,'Shared result rendering can be tested independently');
function renderSharedResult(rows,role='parent',priorityRows=[],adviceByKey={'general-01':'Välj en gemensam dag.','general-04':'Lyssna färdigt och välj ett litet nästa steg.'}){
  const state={
    members:[{role:'parent'},{role:'teen'}],sharedLoading:false,sharedDeckId:'general',sharedError:'',sharedMatches:rows.map(row=>({deck_id:'general',...row})),sharedPriorities:priorityRows.map(row=>({deck_id:'general',...row})),
    GENERAL_CARDS:[
      {id:'general-01',type:'match',category:'Fritid',teenText:'Tonåringens frivilliga aktivitet',parentText:'Förälderns ansvarstagande aktivitet'},
      {id:'general-02',type:'understanding',category:'Känslor',teenText:'HEMLIGT FÖRSTÅELSEKORT'},
      {id:'general-03',type:'match',category:'Samtal',teenText:'HEMLIGT NEJ-SVAR'},
      {id:'general-04',type:'match',category:'Samtal',teenText:'Tonåringens andra gemensamma kort',parentText:'Förälderns andra gemensamma kort'},
    ],
    THEME_DECK_MODELS:[],ADVICE_BY_KEY:adviceByKey,
    adviceKeyForCard:card=>card.id,
    cardTextForRole:(card,viewerRole)=>viewerRole==='parent'?(card.parentText||card.teenText):card.teenText,
    viewerRole:()=>role,
    esc:value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])),
  };
  vm.runInNewContext(sharedViewFunctions[0]+'\nthis.html=swipeResults();',state);
  return state.html;
}
{
  const html=renderSharedResult([
    {card_id:'general-01',answer:true},
    {card_id:'general-02',answer:true},
    {card_id:'general-03',answer:false},
    {card_id:'unknown',answer:true},
  ]);
  assert.match(html,/Förälderns ansvarstagande aktivitet/,'Parent sees the reviewed parent wording for a verified A-YES');
  assert.match(html,/Välj en gemensam dag/,'Only allowed A cards contribute editorial advice');
  assert.doesNotMatch(html,/HEMLIGT/,'B-YES and A-NO cannot leak into results or summaries');
  assert.match(html,/Gemensamma möjligheter – förälder/,'Parent gets the parent-facing summary');
  assert.match(html,/swipe-summary-overview/,'Verified A results produce the compact icon overview');
  assert.match(html,/Gemensam aktivitet:/,'The icon has a visible-to-assistive-tech topic label');
  assert.match(html,/<details class="swipe-summary-details">/,'Longer advice is disclosed on demand');
  const teenHtml=renderSharedResult([{card_id:'general-01',answer:true}],'teen');
  assert.match(teenHtml,/Gemensamma möjligheter – tonåring/,'Teen gets the teen-facing summary');
  assert.match(teenHtml,/Tonåringens frivilliga aktivitet/,'Teen sees the reviewed teen wording');
  assert.doesNotMatch(teenHtml,/Förälderns ansvarstagande aktivitet/,'Teen does not receive parent wording');
  const mobileHtml=renderSharedResult([{card_id:'general-01',answer:true}],'parent',[],{'general-01':'Lägg undan mobiltelefonerna en kort stund.'});
  assert.match(mobileHtml,/Mobil:/,'The icon follows the actual mobile-related advice subject, not only its broad category');
}
{
  const html=renderSharedResult([
    {card_id:'general-01',answer:true},
    {card_id:'general-02',answer:true},
    {card_id:'general-03',answer:false},
    {card_id:'general-04',answer:true},
  ],'parent',[
    {card_id:'general-01'},
    {card_id:'general-02'},
    {card_id:'general-03'},
    {card_id:'unknown'},
  ]);
  assert.match(html,/Viktigast att fokusera på/,'A server-prioritised mutual A-YES gets its own section');
  assert.match(html,/tonåringen har markerat detta som särskilt viktigt/,'Parent wording preserves teen-first priority');
  assert.equal((html.match(/Välj en gemensam dag\./g)||[]).length,1,'Prioritised advice is not duplicated in the ordinary summary');
  assert.match(html,/Förälderns andra gemensamma kort/,'Non-prioritised mutual YES remains in the ordinary shared result');
  assert.match(html,/Lyssna färdigt och välj ett litet nästa steg/,'Non-prioritised advice remains in the ordinary summary');
  assert.doesNotMatch(html,/HEMLIGT|unknown/,'B, NO and unknown priority rows cannot leak');
  assert.doesNotMatch(html,/HEMLIGT|unknown/,'B, NO and unknown rows cannot leak through the icon overview');
}
{
  const html=renderSharedResult([{card_id:'general-01',answer:true}],'parent',[
    {card_id:'general-02'},{card_id:'general-03'},{card_id:'unknown'}
  ]);
  assert.doesNotMatch(html,/Viktigast att fokusera på/,'Priority rows without the same verified A-YES remain invisible');
}
{
  const html=renderSharedResult([
    {card_id:'general-02',answer:true},
    {card_id:'general-03',answer:false},
    {card_id:'unknown',answer:true},
  ]);
  assert.match(html,/Inga gemensamma ja-svar/,'Invalid-only results render the safe empty state');
  assert.doesNotMatch(html,/swipe-rule-summary|HEMLIGT|Välj en gemensam dag/,'Invalid-only results cannot create a shared summary');
}
{
  const duplicateAdvice={'general-01':'Välj en gemensam dag.','general-04':'Välj en gemensam dag.'};
  const matches=[{card_id:'general-01',answer:true},{card_id:'general-04',answer:true}];
  const ordinary=renderSharedResult(matches,'parent',[],duplicateAdvice);
  assert.equal(ordinary.split('Välj en gemensam dag.').length-1,2,'One generic tip appears once in the overview and once in expanded detail, never as separate duplicate themes');
  const prioritised=renderSharedResult(matches,'parent',[{card_id:'general-01'}],duplicateAdvice);
  assert.equal(prioritised.split('Välj en gemensam dag.').length-1,1,'A priority tip is not duplicated in the ordinary summary');
}
console.log('PASS: shared result renderer and role summaries reject B, NO and unknown cards');

{
  // Exercise the actual polling functions using a synthetic aggregate RPC.
  // No private answer table or production Supabase is involved.
  const source=script.match(/async function fetchSwipeMatches\([\s\S]*?(?=\nconst INSIGHT_DECK_IDS)/);
   const pollSource=script.match(/async function pollSharedMatches\([\s\S]*?(?=\n\/\/ Theme access)/);
  assert.ok(source,'The aggregate fetch and polling functions remain independently testable');
   assert.ok(pollSource,'The aggregate polling function remains independently testable');
  let rows=[{deck_id:'general',card_id:'general-01',answer:true}],calls=0,renders=0;
  const state={
    user:{id:'account-1'},members:[{},{}],sharedSession:1,sharedRequest:0,
    sharedDeckId:'general',sharedMatches:[],sharedPriorities:[],sharedError:'',
    sharedLoading:false,sharedPollPending:false,sharedPollingEnabled:true,sharedPrioritiesEnabled:false,swipeBusy:false,activeThemeDeck:null,
    document:{hidden:false},page:()=> 'swipe',render:()=>{renders++;},
    sharedDeck:id=>id==='general'?{cards:[
      {id:'general-01',type:'match'},{id:'general-02',type:'understanding'},
      {id:'general-03',type:'match'}
    ]}:null,
    db:{rpc:async(name,args)=>{
      assert.equal(name,'shared_swipe_matches','Polling reads only the server-verified aggregate');
      assert.equal(args.p_deck_id,'general');calls++;return {data:rows,error:null};
    }},
  };
  vm.runInNewContext(source[0]+'\n'+pollSource[0]+'\nthis.pollSharedMatches=pollSharedMatches;this.fetchSwipeMatches=fetchSwipeMatches;',state);
  await state.fetchSwipeMatches('general');
  assert.equal(state.sharedMatches.length,1,'Initial mutual A-YES is shown');
  const firstRenders=renders;
  await state.pollSharedMatches();
  assert.equal(renders,firstRenders,'Unchanged poll does not flash loading or rerender');
  rows=[
    {deck_id:'general',card_id:'general-01',answer:false},
    {deck_id:'general',card_id:'general-02',answer:true},
    {deck_id:'general',card_id:'general-03',answer:true},
    {deck_id:'wrong',card_id:'general-01',answer:true},
    {deck_id:'general',card_id:'unknown',answer:true},
  ];
  await state.pollSharedMatches();
  assert.equal(state.sharedMatches.length,1,'NO, B, unknown and wrong-deck rows remain hidden');
  assert.equal(state.sharedMatches[0].card_id,'general-03','New mutual YES replaces revoked match');
  assert.ok(renders>firstRenders,'Changed result triggers a new rendering');
  rows=[];
  await state.pollSharedMatches();
  assert.equal(state.sharedMatches.length,0,'Revocation removes an old shared result');
  const beforeHidden=calls;
  state.document.hidden=true;
  await state.pollSharedMatches();
  assert.equal(calls,beforeHidden,'Hidden tab does not poll');
  state.document.hidden=false;
  state.db.rpc=async()=>({data:null,error:{message:'synthetic outage'}});
  await state.pollSharedMatches();
  assert.equal(state.sharedMatches.length,0,'RPC failure clears stale results');
  assert.match(state.sharedError,/inte tillgängliga/);
  state.sharedError='';state.db.rpc=()=>new Promise(resolve=>{state.resolvePending=resolve;});
  const pending=state.pollSharedMatches();
  state.user={id:'account-2'};state.sharedSession++;state.sharedMatches=[];state.sharedPriorities=[];
  state.resolvePending({data:[{deck_id:'general',card_id:'general-01',answer:true}],error:null});
  await pending;
  assert.equal(state.sharedMatches.length,0,'Late response cannot restore a prior account’s matches');
}
console.log('PASS: automatic aggregate polling, revocation, hidden tabs and session isolation');


// Cross-deck insights are fail-closed and never derive shared content from local answers.
assert.match(script,/enableSharedInsights===true/,'All-deck insights require an explicit feature gate');
assert.match(script,/INSIGHT_DECK_IDS\.map\(deckId=>db\.rpc\('shared_swipe_matches',\{p_deck_id:deckId\}\)\)/,'Each deck is checked by the authenticated aggregate RPC');
assert.match(script,/request!==insightsRequest\|\|session!==sharedSession\|\|user\?\.id!==viewer/,'Stale multi-deck results are rejected on session changes');
assert.match(script,/insightsRows=\[\];insightsError='';insightsLoading=false/,'Every insights refresh starts with an empty result');
assert.match(script,/insightsRows=\[\];\s*insightsError='Gemensamma insikter/,'Partial failures clear all insights');
assert.doesNotMatch(script,/insightsRows\s*=\s*\[\.\.\.swipeAnswers/,'Private answers cannot seed the insights page');
const insightSanitizer=script.match(/function safeInsightMatches\(deckId,rows\)\{[\s\S]*?\n\}/);
assert.ok(insightSanitizer,'The real insights allowlist can be exercised');
const insightState={
  sharedDeck:id=>id==='general'?{cards:[
    {id:'general-01',type:'match'},
    {id:'general-02',type:'understanding'},
    {id:'general-03',type:'match'}
  ]}:id==='samtal'?{cards:[{id:'samtal-01',type:'match'}]}:undefined
};
vm.runInNewContext(insightSanitizer[0]+'\nthis.sanitize=safeInsightMatches;',insightState);
const safeGeneral=insightState.sanitize('general',[
  {deck_id:'general',card_id:'general-01',answer:true},
  {deck_id:'general',card_id:'general-02',answer:true}, // historical B YES
  {deck_id:'general',card_id:'general-03',answer:false}, // mutual NO
  {deck_id:'general',card_id:'general-04',answer:true}, // unknown
  {deck_id:'samtal',card_id:'samtal-01',answer:true}, // wrong deck
  {deck_id:'general',card_id:'general-01',answer:true} // duplicate
]);
assert.equal(JSON.stringify(safeGeneral),JSON.stringify([{deck_id:'general',card_id:'general-01',answer:true}]),'Only one known A JA+JA survives malformed RPC rows');
assert.equal(insightState.sanitize('samtal',[{deck_id:'samtal',card_id:'samtal-01',answer:true}]).length,1,'Valid themed A matches are preserved');
assert.throws(()=>insightState.sanitize('general',null),/Invalid shared results/,'Malformed server data fails closed');
console.log('PASS: all-deck insights gate, A-only sanitizer, B/NO isolation, session and error guards');
