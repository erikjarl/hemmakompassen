import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {GENERAL_CARDS,THEME_DECK_MODELS} from '../card-catalog.js';

const review=readFileSync(new URL('../docs/psychological-card-review-2026-10-27.md',import.meta.url),'utf8');
const aCards=[
  ...GENERAL_CARDS.filter(card=>card.type==='match'),
  ...THEME_DECK_MODELS.flatMap(deck=>deck.cards.filter(card=>card.type==='match')),
];

test('psychological review covers every current A card exactly once',()=>{
  assert.equal(aCards.length,73,'Expected the reviewed 21 general and 52 theme A cards');
  for(const card of aCards){
    const escaped=card.id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const matches=review.match(new RegExp('`'+escaped+'`','g'))||[];
    assert.equal(matches.length,1,card.id+' must have exactly one review row');
    assert.match(review,new RegExp('\\| `'+escaped+'` \\| [^\\n]+ \\| [^\\n]+ \\| \\*\\*(?:Behåll|Rollanpassa) A\\.\\*\\*'),card.id+' must contain risk and decision fields');
  }
});

test('review does not silently invent or omit A-card identifiers',()=>{
  const reviewed=[...review.matchAll(/`((?:general|samtal|aktiviteter|regler|uppskattning|aterhamtning|forandring)-\d{2})`/g)].map(match=>match[1]);
  assert.equal(reviewed.length,73,'Review must contain exactly 73 card rows');
  assert.deepEqual(new Set(reviewed),new Set(aCards.map(card=>card.id)),'Reviewed IDs must equal the live A inventory');
});

test('review labels evidence limits and preserves old answers',()=>{
  assert.match(review,/inte.*empirisk.*klinisk validering/i);
  assert.match(review,/gamla svar får aldrig flyttas eller delas automatiskt/i);
  assert.match(review,/B-delning.*förblir avstängd/i);
  assert.match(review,/34 kort behålls som A/);
  assert.match(review,/39 kort behöver rollanpassad A-text/);
});

