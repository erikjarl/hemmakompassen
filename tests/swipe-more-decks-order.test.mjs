import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const start=app.indexOf('function swipeView(){');
const end=app.indexOf('async function saveSwipeAnswer(',start);
assert.ok(start>=0&&end>start);
const view=app.slice(start,end);
const decks=app.slice(app.indexOf('function themeDecksView('),app.indexOf('// A private, read-only overview',app.indexOf('function themeDecksView(')));

test('finished general deck shows the next-deck disclosure ahead of secondary results',()=>{
  assert.match(view,/\(item\?'':themeDecksView\(true\)\)\+privateGeneralAnswerReview\(\)\+swipeSecondaryResults\(!item\)/);
  assert.match(view,/:swipeOverviewView\(\)\+privateSwipeExportControls\(\)\)/);
  assert.match(decks,/completedGeneral\?'<details class="swipe-more-decks"><summary id="swipe-themes-heading">Gör fler kortlekar<\/summary>'/);
  assert.match(decks,/\(completedGeneral\?'<\/details>':''\)/);
});

test('unfinished general deck keeps optional decks after its active card and results',()=>{
  assert.match(view,/\+insightsEntry\(\)\+\(item\?themeDecksView\(false\):''\)/);
  assert.match(view,/\(item\?privateSwipeExportControls\(\)\+swipeOverviewView\(\):/);
});
