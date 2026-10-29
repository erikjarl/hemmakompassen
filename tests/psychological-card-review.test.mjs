import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {GENERAL_CARDS,THEME_DECK_MODELS,ROLE_TEXT_BY_CARD} from '../card-catalog.js';

const review=readFileSync(new URL('../docs/psychological-card-review-2026-10-27.md',import.meta.url),'utf8');
const aCards=[
  ...GENERAL_CARDS.filter(card=>card.type==='match'),
  ...THEME_DECK_MODELS.flatMap(deck=>deck.cards.filter(card=>card.type==='match')),
];

const newReview=readFileSync(new URL('../docs/psychological-new-theme-cards-2026-10-29.md',import.meta.url),'utf8');
const reviewedRows=[...review.matchAll(/^\| \x60([^\x60]+)\x60 \|/gm),...newReview.matchAll(/^\| \x60([^\x60]+)\x60 \|/gm)].map(match=>match[1]);

test('psychological reviews cover all 265 current A cards exactly once',()=>{
  assert.equal(aCards.length,265,'21 general + 52 original theme + 192 new theme A cards');
  assert.equal(reviewedRows.length,265,'Every A card has one explicit review table row');
  assert.equal(new Set(reviewedRows).size,265,'No A card is reviewed twice');
  assert.deepEqual(new Set(reviewedRows),new Set(aCards.map(card=>card.id)),'Review tables match the current A inventory');
  const rows=[...review.split('\n'),...newReview.split('\n')];
  for(const card of aCards){
    const row=rows.find(line=>line.startsWith('| '+String.fromCharCode(96)+card.id+String.fromCharCode(96)+' |'));
    assert.ok(row,card.id+' must have a review row');
    assert.ok(row.split('|').length>=7,card.id+' includes text, risk, decision and rationale');
    if((card.id.startsWith('samtal-')||card.id.startsWith('aktiviteter-'))&&Number(card.id.split('-')[1])>=9)assert.ok(row.split('|').length>=8,card.id+' additionally documents unchanged role text');
  }
});

test('new theme A review preserves voluntary participation and evidence limits',()=>{
  assert.match(newReview,/inte empirisk validering/i);
  assert.match(newReview,/Tonåringen har rätt att uttrycka intresse, avstå och ändra sig/i);
  assert.match(newReview,/föräldern har fortsatt huvudansvar/i);
  assert.equal([...newReview.matchAll(/^\| \x60(?:samtal|aktiviteter)-\d{2,3}\x60 \|/gm)].length,192);
});

test('review labels evidence limits and preserves old answers',()=>{
  assert.match(review,/inte.*empirisk.*klinisk validering/i);
  assert.match(review,/gamla svar får aldrig flyttas eller delas automatiskt/i);
  assert.match(review,/B-delning.*förblir avstängd/i);
  assert.match(review,/34 kort behålls som A/);
  assert.match(review,/39 kort har fått rollanpassad A-text/);
});

test('every reviewed role adaptation is implemented without changing stable IDs',()=>{
  const adapted=[...review.matchAll(/\| `([^`]+)` \|[^\n]+\|[^\n]+\| \*\*Rollanpassa A\.\*\*/g)].map(match=>match[1]).sort();
  assert.equal(adapted.length,39,'Review contains the expected 39 role adaptations');
  assert.deepEqual(Object.keys(ROLE_TEXT_BY_CARD).sort(),adapted,'Catalog implementation exactly matches the reviewed adaptation set');
  const currentIds=aCards.map(card=>card.id);
  assert.ok(adapted.every(id=>currentIds.includes(id)),'No adaptation invents or replaces a stored answer ID');
});

