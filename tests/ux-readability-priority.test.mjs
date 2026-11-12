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
