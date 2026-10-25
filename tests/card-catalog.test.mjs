import assert from 'node:assert/strict';
import {GENERAL_CARDS,THEME_DECK_MODELS} from '../card-catalog.js';

assert.equal(GENERAL_CARDS.length,34,'Preserves all 34 stable general cards');
assert.deepEqual(GENERAL_CARDS.map(card=>card.id),Array.from({length:34},(_,index)=>'general-'+String(index+1).padStart(2,'0')),'Preserves general card IDs and ordering');
assert.equal(new Set(GENERAL_CARDS.map(card=>card.id)).size,34,'General IDs are unique');
assert.ok(GENERAL_CARDS.some(card=>card.type==='understanding'),'Catalog contains teen understanding cards');
assert.deepEqual(
  GENERAL_CARDS.filter(card=>card.type==='understanding').map(card=>card.id),
  ['general-02','general-03','general-04','general-05','general-06','general-07','general-09','general-12','general-14','general-15','general-18','general-19','general-27'],
  'The reviewed understanding-card inventory is explicit and stable',
);
for(const card of GENERAL_CARDS){
  assert.ok(['match','understanding'].includes(card.type),card.id+' has a supported type');
  assert.equal(card.audience,card.type==='understanding'?'teen':'both',card.id+' has the correct audience');
  assert.equal(card.version,1,card.id+' is explicitly versioned');
  assert.ok(card.category&&card.teenText&&card.parentSharedText,card.id+' has complete display metadata');
  if(card.type==='understanding')assert.notEqual(card.teenText,card.parentSharedText,card.id+' has a separate neutral parent rendering');
}

assert.equal(THEME_DECK_MODELS.length,6,'Preserves all six theme decks');
const themeCards=THEME_DECK_MODELS.flatMap(deck=>deck.cards);
assert.equal(themeCards.length,52,'Inventories every existing theme card');
assert.equal(new Set(themeCards.map(card=>card.id)).size,52,'Theme card IDs are unique');
for(const deck of THEME_DECK_MODELS){
  assert.equal(deck.type,'match',deck.id+' remains a mutual matching deck');
  assert.equal(deck.audience,'both',deck.id+' is available to both roles');
  deck.cards.forEach((card,index)=>{
    assert.equal(card.id,deck.id+'-'+String(index+1).padStart(2,'0'),'Theme card keeps its stable ID');
    assert.equal(card.type,'match','Theme cards require mutual JA+JA before any future sharing');
    assert.equal(card.audience,'both','Theme cards target both roles');
  });
}

console.log('PASS: versioned A/B inventory preserves 34 general and 52 theme card IDs');
