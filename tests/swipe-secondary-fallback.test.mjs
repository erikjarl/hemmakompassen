import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const start=source.indexOf('function swipeSecondaryResults(completed){');
const end=source.indexOf('function swipeView(){',start);
assert.ok(start>=0&&end>start,'Locate production fallback function');
const action=source.slice(start,end);
const legacy='<section id="existing-result">Tidigare gemensamt resultat</section>';

function render({completed=true,loading=false,error='',rows=[{deck_id:'general',card_id:'general-01',answer:true}],paired=true,enabled=true}={}){
  const state={
    sharedInsightsEnabled:enabled,swipeOverviewLoading:loading,swipeOverviewError:error,
    swipeOverviewRows:rows,user:{id:'parent'},
    members:paired?[{user_id:'parent',role:'parent'},{user_id:'teen',role:'teen'}]:[],
    swipeResults:()=>legacy
  };
  runInNewContext(action+'\nthis.html=swipeSecondaryResults('+completed+');',state);
  return state.html;
}

test('completed verified all-deck summary folds the duplicate detail panel',()=>{
  const html=render();
  assert.match(html,/<details class="swipe-secondary-results">/);
  assert.match(html,/Tidigare gemensamt resultat/);
});
test('loading, error or zero matches preserve accessible older results',()=>{
  for(const changes of [{loading:true},{error:'Tillfälligt fel'},{rows:[]}]){
    assert.equal(render(changes),legacy,JSON.stringify(changes));
  }
});
test('incomplete deck or unpaired viewer do not hide the only usable results',()=>{
  assert.equal(render({completed:false}),legacy);
  assert.equal(render({paired:false}),legacy);
  assert.equal(render({enabled:false}),legacy);
});
