import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('completed theme chooser keeps primary action visible without redundant help',async()=>{
  const app=await read('live-app.js');
  const start=app.indexOf('function themeDecksView(completedGeneral=false){');
  const end=app.indexOf('\nfunction privateThemeAnswerReview(',start);
  assert.ok(start>=0&&end>start,'Theme chooser must exist');
  const view=app.slice(start,end);
  assert.match(view,/completedGeneral\?'<details class="swipe-more-decks">/,
    'Completed deck should keep the prominent expandable action');
  assert.match(view,/Gör fler kortlekar/);
  assert.doesNotMatch(view,/Min progression:/,'Do not repeat abstract progress jargon under the next-decks heading');
  assert.match(view,/\?startedThemes\+' av '\+THEME_DECKS\.length\+' teman påbörjade'/,'Concise private deck progress still shows the count');
  assert.match(view,/\(\(!completedGeneral\|\|!unlocked\)\?'<p class="live-muted" role="status">'\+esc\(status\)\+'<\/p>':''\)\+/,
    'Redundant help is hidden after completion for an already paired viewer');
  assert.match(view,/Koppla ihop en förälder och en tonåring/,
    'Unpaired viewer must still get an explanation');
  assert.match(view,/swipe-theme-compact-list/,'Theme choices remain available');
  assert.match(view,/Din privata status/,'Own answer progress is still clearly identified');
});

test('readability roadmap and standing workflow instruction are present',async()=>{
  const [roadmap,agents]=await Promise.all([read('docs/ACTIVE_ROADMAP.md'),read('AGENTS.md')]);
  assert.match(roadmap,/## UX-READ-01/);
  assert.match(roadmap,/Informationshierarki/);
  assert.match(roadmap,/Språkgranskning/);
  assert.match(roadmap,/Visuell läsbarhet/);
  assert.match(roadmap,/två autentiserade konton/);
  assert.match(agents,/## Stående rutin: läsbarhet och tydlighet \(UX-READ-01\)/);
});

test('Schyssta listan keeps approved rules primary without redundant quick-action text',async()=>{
  const app=await read('live-app.js');
  const start=app.indexOf('function schysstaView(){');
  const end=app.indexOf('\nfunction ',start+25);
  assert.ok(start>=0&&end>start);
  const view=app.slice(start,end);
  const quick=view.slice(view.indexOf('const quickActions='),view.indexOf('const searchTools='));
  assert.match(quick,/needs\.length\?'<p>Välj ett svar nedan eller Inte nu\.<\/p>':''/);
  assert.match(quick,/ongoing\.length\|\|schysstaHistory\.length/);
  assert.doesNotMatch(quick,/schyssta-quick-counts[^\n]*approved\.length/);
  assert.match(quick,/data-schyssta-needs-jump/);
  assert.match(quick,/data-schyssta-start/);
  assert.match(view,/const approvedSection=/);
  assert.match(view,/approvedSection\s*\+quickActions/);
  assert.match(view,/item\.status==='accepted'/);
  assert.match(view,/schyssta-approved-details/);
});


test('Schyssta optional suggestions and getting-started card do not crowd existing decisions',async()=>{
  const app=await read('live-app.js');
  const start=app.indexOf('function schysstaView(){');
  const end=app.indexOf('\nfunction ',start+25);
  assert.ok(start>=0&&end>start);
  const view=app.slice(start,end);
  assert.match(view,/const firstRuleHint=rules\.length===0&&needs\.length===0&&ongoing\.length===0/,
    'Getting-started help must not compete with existing rule proposals');
  assert.match(view,/\+\(schysstaSuggestions\.length\?'<details class="schyssta-extra-panel">/,
    'An empty optional suggestion section should not occupy the default mobile flow');
  assert.match(view,/approvedSection\s*\+quickActions\s*\+\(schysstaDecisionFeedback/,
    'Approved agreements remain first and pending actions remain visible');
  assert.match(view,/\+needsSection\s*\+firstRuleHint\s*\+composeSection/,
    'Pending approvals still appear before optional compose controls');
});
