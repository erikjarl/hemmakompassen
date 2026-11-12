import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const start=source.indexOf('function insightsView(){');
const end=source.indexOf('async function fetchInsights(',start);
assert.ok(start>=0&&end>start,'production insights view exists');
const view=source.slice(start,end);
const fetchStart=end;
const fetchEnd=source.indexOf('async function prepareActivityMessage(',fetchStart);
assert.ok(fetchEnd>fetchStart);
const fetching=source.slice(fetchStart,fetchEnd);

test('cached JA+JA results remain invisible when current family epoch cannot be verified',()=>{
  const state={
    sharedInsightsEnabled:true,user:{id:'parent'},
    members:[{user_id:'parent',role:'parent'},{user_id:'teen',role:'teen'}],
    inboxPairEpoch:null,insightsLoading:false,insightsError:'',
    insightsRows:[{deck_id:'aktiviteter',card_id:'private-previous-family',answer:true}],
    card:html=>'<article>'+html+'</article>'
  };
  const result=runInNewContext(view+';insightsView()',state);
  assert.match(result,/Kontrollerar familjekopplingen/);
  assert.doesNotMatch(result,/private-previous-family|Möjligt att utforska|Visa detaljer per kortlek/);
});

test('shared insights fetch rejects an unverified epoch on both inbox and insights routes',()=>{
  assert.match(fetching,/if\(!sharedInsightsEnabled\|\|!viewer\|\|!inboxPairEpoch\|\|members\.length!==2/);
  assert.doesNotMatch(fetching,/page\(\)==='inkorg'&&!inboxPairEpoch/);
});
