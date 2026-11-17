import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const js=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const sig=js.match(/function insightsAiSignature\(\)\{[\s\S]*?\n\}(?=\nfunction insightsView)/)?.[0];
const view=js.match(/function insightsView\(\)\{[\s\S]*?\n\}(?=\nasync function fetchInsights)/)?.[0];
const style=css.split('/* DES-01G / UX-READ-01: shared-insights nested palette and early AI panel.')[1]||'';
assert.ok(sig&&view,'Read the actual consent-checked shared-insights renderer');

function render(overrides={}){
  const calls=[];
  const state={
    user:{id:'synthetic-viewer'},members:[
      {user_id:'synthetic-viewer',role:'parent'},
      {user_id:'synthetic-other',role:'teen'}],
    inboxPairEpoch:'verified-synthetic-pair',sharedSession:1,
    sharedInsightsEnabled:true,sharedUnderstandingEnabled:true,
    insightsLoading:false,insightsError:'',
    insightsRows:[{answer:true,deck_id:'general',card_id:'general-01'}],
    sharedUnderstandingRows:[],aiResultEnabled:true,
    sharedDeck:(id)=>({id,title:'Allmänt',cards:[
      {id:'general-01',type:'match',category:'Aktiviteter'}]}),
    cardTextForRole:()=> 'Laga mat tillsammans',
    viewerRole:()=> 'parent',
    esc:x=>String(x),
    card:content=>'<section class="live-panel">'+content+'</section>',
    activityInviteBusy:false,activityInviteError:'',
    insightTargetFromHash:()=>null,location:{hash:'#insikter'},
    sharedFactOverview:()=>'<aside data-test-fact="1">Verkliga matchningar</aside>',
    understandingInsights:()=>'<p>Inget delat</p>',
    aiResults:{panel:(kind,scope,signature)=>{
      calls.push({kind,scope,signature});
      return '<section class="ai-result-panel" data-test-ai="1">AI-reflektion</section>';
    }},
    ...overrides
  };
  vm.runInNewContext(sig+'\n'+view+'\nthis.renderInsights=insightsView;',state);
  return {markup:state.renderInsights(),calls};
}

test('available AI reflection appears near the top before long factual lists',()=>{
  const {markup,calls}=render();
  assert.equal(calls.length,1);
  assert.equal(calls[0].kind,'swipe');
  assert.equal(calls[0].scope,'all');
  assert.ok(calls[0].signature.includes('verified-synthetic-pair'));
  assert.ok(markup.indexOf('id="insights-a-heading"')<markup.indexOf('data-test-ai="1"'));
  assert.ok(markup.indexOf('data-test-ai="1"')<markup.indexOf('data-test-fact="1"'));
  assert.ok(markup.indexOf('data-test-fact="1"')<markup.indexOf('Visa detaljer per kortlek'));
  assert.match(markup,/ENDAST REDAN DELADE SVAR/);
});

test('never offer reflection without validated viewer, pair, server data or access',()=>{
  const cases=[
    {user:null},
    {members:[]},
    {inboxPairEpoch:''},
    {insightsLoading:true},
    {insightsError:'Det gick inte att kontrollera resultatet'},
    {insightsRows:[],sharedUnderstandingRows:[]},
    {sharedInsightsEnabled:false},
    {aiResultEnabled:false}
  ];
  for(const scenario of cases){
    const {markup,calls}=render(scenario);
    assert.equal(calls.length,0,'AI call when guard must prevent it: '+Object.keys(scenario));
    assert.ok(!markup.includes('data-test-ai="1"'));
  }
});

test('the design fixes nested midnight cards without hiding consent controls',()=>{
  assert.ok(style,'Missing scoped light insights styles');
  assert.match(style,/\.swipe-fact-summary\s*\{\s*background:#e5e7db/);
  assert.match(style,/\.swipe-summary-overview > li\s*\{\s*background:#fff9f1/);
  assert.match(style,/\.swipe-match-list > li,[\s\S]*?background:#f8f2ea/);
  assert.match(style,/\.understanding-share-list \.live-button\[aria-pressed="true"\]/);
  assert.match(style,/\.ai-result-panel\s*\{[\s\S]*?background:#f7dccf/);
  assert.match(style,/\.ai-result-panel \.swipe-summary-label\s*\{[\s\S]*?color:#693b2b/);
  assert.match(style,/\.ai-result-panel \[data-ai-analysis-retry\]\s*\{[\s\S]*?color:#394627/);
  assert.match(style,/outline:3px solid #314f60/);
  assert.doesNotMatch(style,/display\s*:\s*none|visibility\s*:\s*hidden|pointer-events\s*:\s*none/);
  assert.match(html,/insightspalette=warm-ai-1/);
});

function luminance(hex){
  const values=hex.match(/.{2}/g).map(x=>parseInt(x,16)/255)
    .map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  return .2126*values[0]+.7152*values[1]+.0722*values[2];
}
test('normal text on the new cream, sage and peach surfaces reaches 4.5:1',()=>{
  const pairs=[['302b26','e5e7db'],['394627','fff9f1'],['302b26','f8f2ea'],
    ['693b2b','f7dccf'],['394627','f7dccf'],['fff9f1','666f3f']];
  for(const [foreground,background] of pairs){
    const [light,dark]=[luminance(foreground),luminance(background)].sort((a,b)=>b-a);
    const ratio=(light+.05)/(dark+.05);
    assert.ok(ratio>=4.5,'#'+foreground+' on #'+background+' = '+ratio.toFixed(2)+':1');
  }
});
