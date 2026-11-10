import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

// Exercise the actual production rule view with server-shaped, synthetic data.
// This does not impersonate either real test account or change saved answers.
const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const start=app.indexOf('function schysstaView(){');
const end=app.indexOf('function section(key){',start);
assert.ok(start>0&&end>start,'Locate the actual Schyssta view implementation');
const viewSource=app.slice(start,end);
const id='123e4567-e89b-42d3-a456-426614174001';
const otherId='123e4567-e89b-42d3-a456-426614174002';

function view(overrides={}){
  const accepted={
    agreement_id:id,body:'Vi lyssnar när den andra pratar.',
    status:'accepted',source_card_id:null,own_decision:true,
    proposed_by_me:false,created_at:'2026-11-09T10:00:00Z'
  };
  const proposed={
    agreement_id:otherId,body:'Vi tar en kort paus när vi bråkar.',
    status:'proposed',source_card_id:null,own_decision:null,
    proposed_by_me:false,created_at:'2026-11-10T10:00:00Z'
  };
  const rules=[accepted,proposed];
  const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;')
    .replaceAll('>','&gt;').replaceAll('"','&quot;');
  const state={
    schysstaListEnabled:true,members:[{role:'parent'},{role:'teen'}],
    schysstaLoading:false,schysstaError:'',schysstaReplacementLinks:[],
    schysstaSaving:new Set(),schysstaPausedIds:new Set(),
    schysstaEndTarget:null,schysstaExpandedIds:new Set(),
    schysstaRules:rules,schysstaManualRules:[],schysstaHistory:[],
    schysstaAllRules:()=>rules,schysstaNeedsAnswer:()=>[proposed],
    schysstaDraftOpen:false,schysstaDraft:'',schysstaEditTarget:null,
    schysstaMessage:'',schysstaDecisionFeedback:'',
    schysstaSubmitting:false,schysstaSearch:'',schysstaFilterStatus:'all',
    schysstaSuggestions:[],schysstaCopyMessage:'',schysstaCopyFallback:false,
    currentApprovedSchysstaText:()=>accepted.body,
    card:html=>'<section class="live-panel">'+html+'</section>',
    esc:escape,viewerRole:()=> 'teen',profile:{display_name:'Test'},
    ...overrides
  };
  runInNewContext(viewSource+'\nthis.viewHtml=schysstaView()',state);
  return state.viewHtml;
}

test('FBK-02-05: agreed rule is a collapsed accessible summary and proposals stay actionable',()=>{
  const html=view();
  const prefix='<details class="schyssta-approved-details" data-agreement-id="'+id+'">';
  assert.ok(html.includes(prefix+'<summary><p>Vi lyssnar när den andra pratar.</p></summary>'));
  assert.ok(!html.includes('data-agreement-id="'+id+'" open>'),'Normally collapse agreed rule details');
  const approvedCard=html.split('class="schyssta-approved-item"')[1].split('</details></li>')[0];
  assert.match(approvedCard,/Föreslå ändring/);
  assert.match(approvedCard,/Avsluta överenskommelsen/);
  assert.doesNotMatch(approvedCard,/data-schyssta-decision/,'No approval action for already accepted rule');
  assert.match(html,/Behöver ditt svar \(1\)/);
  assert.match(html,/data-schyssta-decision="123e4567-e89b-42d3-a456-426614174002"/);
});

test('FBK-02-05: manually expanded rule survives refresh and end-confirmation stays visible',()=>{
  const expanded=view({schysstaExpandedIds:new Set([id])});
  assert.ok(expanded.includes('data-agreement-id="'+id+'" open>'));
  const confirming=view({schysstaEndTarget:id});
  assert.ok(confirming.includes('data-agreement-id="'+id+'" open>'));
  assert.match(confirming,/data-schyssta-end-confirm="123e4567-e89b-42d3-a456-426614174001"/);
  assert.match(app,/existingRules\.querySelectorAll\('\.schyssta-approved-details\[open\]'\)/,
    'A redraw must capture expanded rules before replacing the DOM');
});

test('FBK-02-05: save feedback is conditional on a fresh confirmed server decision',()=>{
  assert.match(app,/await fetchSchysstaList\(\);\s*if\(user\?\.id!==viewer\|\|sharedSession!==session\|\|schysstaError\)return;\s*const confirmed=/);
  assert.match(app,/confirmed\?\.own_decision===approved/);
  const html=view({schysstaDecisionFeedback:'Ditt ja är sparat.'});
  assert.match(html,/<p role="status" class="schyssta-feedback">Ditt ja är sparat\.<\/p>/);
});
