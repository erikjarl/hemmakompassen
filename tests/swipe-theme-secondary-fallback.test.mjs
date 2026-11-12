import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const start=source.indexOf('function themeSecondaryResults(deckId,completed){');
const end=source.indexOf('function swipeSecondaryResults(completed){',start);
assert.ok(start>=0&&end>start,'Find production theme-result disclosure');
const production=source.slice(start,end);
const legacy='<section class="theme-old-result">Tidigare temaresultat</section>';
function render({completed=false,loading=false,error='',rows=[{deck_id:'samtal',card_id:'samtal-01',answer:true}],paired=true}={}){
 const state={
  inboxPairEpoch:'verified-fixture-pair',sharedInsightsEnabled:true,swipeOverviewLoading:loading,
  swipeOverviewError:error,swipeOverviewRows:rows,user:{id:'parent'},
  members:paired?[{user_id:'parent',role:'parent'},{user_id:'teen',role:'teen'}]:[],
  swipeResults:()=>legacy,sharedDeck:()=>({title:'Samtalsämnen'}),
  esc:s=>String(s)
 };
 runInNewContext(production+'\nthis.html=themeSecondaryResults("samtal",'+completed+');',state);
 return state.html;
}
test('active and completed theme decks collapse duplicate result when aggregate exists',()=>{
 for(const completed of [false,true]){
   const html=render({completed});
   assert.match(html,/<details class="swipe-secondary-results">/);
   assert.match(html,/Tidigare temaresultat/);
   assert.doesNotMatch(html,/<details class="swipe-secondary-results" open/);
 }
});
test('unavailable aggregate keeps the theme result visible in active and completed decks',()=>{
 for(const completed of [false,true]){
  for(const overrides of [{loading:true},{error:'Fel'},{rows:[]},{paired:false}]){
   assert.equal(render({...overrides,completed}),legacy);
  }
 }
});
