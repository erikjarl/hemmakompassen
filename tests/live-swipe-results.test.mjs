import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const script=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');

assert.match(script,/db\.rpc\('shared_swipe_matches',\{p_deck_id:deckId\}\)/,'Uses only the reviewed aggregate function for the selected deck');
assert.match(script,/r\?\.deck_id!==deckId\|\|r\.answer!==true/,'Rejects rows from another deck and every non-YES answer');
assert.match(script,/deck\.cards\.find\(card=>card\.id===r\.card_id&&card\.type==='match'\)/,'Allows only catalogued A cards from the selected deck');
assert.match(script,/if\(!user\|\|members\.length!==2\)return/,'Requires an authenticated paired family');
assert.match(script,/session!==sharedSession\|\|request!==sharedRequest\|\|user\?\.id!==viewer/,'Rejects stale results after a session switch or refresh');
assert.match(script,/sharedMatches=\[\];[\s\S]*sharedError='Gemensamma resultat är inte tillgängliga/,'Clears results after RPC errors');
assert.match(script,/safe\.set\(r\.card_id,\{deck_id:deckId,card_id:r\.card_id,answer:true\}\)/,'Stores only true answers with their verified deck id');
assert.doesNotMatch(script,/sharedMatches\.filter\(r=>r\.answer===false\)/,'No mutual NO category is rendered');
assert.doesNotMatch(script,/Det ni båda svarat nej till/,'Never renders a shared NO heading');
assert.match(script,/swipe-match-theme/,'Mutual YES results are grouped by theme');
assert.match(script,/function sharedSummary\(groups,deckId='general'\)/,'Builds the rule-based summary only from the already filtered mutual-YES groups');
assert.match(script,/items\.map\(item=>ADVICE_BY_KEY\[adviceKeyForCard\(item\.card,deckId\)\]\)/,'Derives editorial advice from each allowed matched card and deck');
assert.match(script,/new Set\(/,'Deduplicates repeated advice before rendering grouped prose');
assert.match(script,/members\.find\(member=>member\.user_id===user\?\.id\)\?\.role/,'Uses the signed-in member role for separate parent and teen wording');
assert.match(script,/REDAKTIONELLA RÅD · INTE AI/,'Labels the deterministic editorial advice clearly');
assert.match(script,/Texten bygger enbart på serververifierade ömsesidiga ja-svar/,'States the summary privacy boundary');
assert.doesNotMatch(script,/localStorage/,'No shared answers are cached locally');
assert.match(script,/db\.rpc\('shared_general_deck_complete'\)/,'Checks both members completion through authenticated aggregate RPC');
assert.match(script,/if\(!user\|\|members\.length!==2\)\{themesUnlocked=false/,'Never requests unlock for unpaired accounts');
assert.match(script,/session!==sharedSession\|\|request!==themesRequest\|\|user\?\.id!==viewer/,'Ignores stale unlock responses after session change');
assert.match(script,/if\(error\|\|typeof data!=='boolean'\)throw/,'Fail-closed when unlock RPC is missing or malformed');
assert.match(script,/themesUnlocked=data===true/,'Only an explicit true unlocks theme previews');
assert.match(script,/const unlocked=members\.length===2&&themesUnlocked&&!themesLoading&&!themesError/,'Never renders theme previews without a valid pair and current RPC');
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
function renderSharedResult(rows,role='parent'){
  const state={
    members:[{role:'parent'},{role:'teen'}],sharedLoading:false,sharedDeckId:'general',sharedError:'',sharedMatches:rows.map(row=>({deck_id:'general',...row})),
    GENERAL_CARDS:[
      {id:'general-01',type:'match',category:'Fritid',teenText:'Spela fotboll'},
      {id:'general-02',type:'understanding',category:'Känslor',teenText:'HEMLIGT FÖRSTÅELSEKORT'},
      {id:'general-03',type:'match',category:'Samtal',teenText:'HEMLIGT NEJ-SVAR'},
    ],
    THEME_DECK_MODELS:[],ADVICE_BY_KEY:{'general-01':'Välj en gemensam dag.'},
    adviceKeyForCard:card=>card.id,
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
  assert.match(html,/Spela fotboll/,'A verified A-YES can appear');
  assert.match(html,/Välj en gemensam dag/,'Only allowed A cards contribute editorial advice');
  assert.doesNotMatch(html,/HEMLIGT/,'B-YES and A-NO cannot leak into results or summaries');
  assert.match(html,/Gemensamma möjligheter – förälder/,'Parent gets the parent-facing summary');
  assert.match(renderSharedResult([{card_id:'general-01',answer:true}],'teen'),/Gemensamma möjligheter – tonåring/,'Teen gets the teen-facing summary');
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
console.log('PASS: shared result renderer and role summaries reject B, NO and unknown cards');
