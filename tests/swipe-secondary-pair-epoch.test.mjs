import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const start=app.indexOf('function themeSecondaryResults(');
const end=app.indexOf('function swipeView(){',start);
assert.ok(start>=0&&end>start,'locate production secondary-result functions');
const production=app.slice(start,end);

function render(epoch){
  const context={
    inboxPairEpoch:epoch,
    sharedInsightsEnabled:true,
    swipeOverviewLoading:false,swipeOverviewError:'',
    swipeOverviewRows:[{deck_id:'general',card_id:'a',answer:true}],
    user:{id:'parent'},
    members:[{user_id:'parent',role:'parent'},{user_id:'teen',role:'teen'}],
    swipeResults:(deckId='general')=>'<section data-legacy="'+deckId+'">Existing shared details</section>',
    sharedDeck:id=>({title:id==='tema'?'Temakortleken':'Allmänna kortleken'}),
    esc:value=>String(value)
  };
  vm.runInNewContext(production+';this.theme=themeSecondaryResults;this.general=swipeSecondaryResults;',context);
  return {theme:context.theme('tema',true),general:context.general(true)};
}

test('without a verified family epoch older per-deck results are never folded behind a missing unified view',()=>{
  const actual=render(null);
  for(const html of Object.values(actual)){
    assert.match(html,/Existing shared details/);
    assert.doesNotMatch(html,/swipe-secondary-results/);
  }
});

test('with a verified family epoch the unified summary remains primary and old details are optional',()=>{
  const actual=render('verified-pair');
  for(const html of Object.values(actual)){
    assert.match(html,/<details class="swipe-secondary-results">/);
    assert.match(html,/Existing shared details/);
  }
});

test('unavailable all-deck overview leaves secondary results accessible even with verified pair',()=>{
  const context={inboxPairEpoch:'verified-pair',sharedInsightsEnabled:true,swipeOverviewLoading:true,
    swipeOverviewError:'',swipeOverviewRows:[{answer:true}],user:{id:'parent'},
    members:[{user_id:'parent',role:'parent'},{user_id:'teen',role:'teen'}],
    swipeResults:()=>'<p>Older result</p>',sharedDeck:()=>({title:'Tema'}),esc:String};
  vm.runInNewContext(production+';this.theme=themeSecondaryResults;this.general=swipeSecondaryResults;',context);
  assert.doesNotMatch(context.theme('tema',false),/swipe-secondary-results/);
  assert.doesNotMatch(context.general(true),/swipe-secondary-results/);
});
