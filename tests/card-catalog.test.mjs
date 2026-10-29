import assert from 'node:assert/strict';
import {GENERAL_CARDS,THEME_DECK_MODELS,ADVICE_BY_KEY,ROLE_TEXT_BY_CARD,adviceKeyForCard,cardTextForRole} from '../card-catalog.js';

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
for(const card of GENERAL_CARDS.filter(card=>card.type==='match')){
  const key=adviceKeyForCard(card);
  assert.equal(key,card.id,card.id+' uses its stable ID as editorial advice key');
  assert.ok(ADVICE_BY_KEY[key]?.length>=60,card.id+' has a substantive card-specific editorial advice sentence');
}
assert.equal(new Set(GENERAL_CARDS.filter(card=>card.type==='match').map(adviceKeyForCard)).size,21,'Every general A card has its own advice key');

assert.equal(THEME_DECK_MODELS.length,6,'Preserves all six theme decks');
const themeCards=THEME_DECK_MODELS.flatMap(deck=>deck.cards);
assert.equal(themeCards.length,244,'Keeps the original 52 cards and appends 192 new cards');
assert.equal(new Set(themeCards.map(card=>card.id)).size,244,'Theme card IDs are unique');
for(const id of ['samtal','aktiviteter']){
  const deck=THEME_DECK_MODELS.find(item=>item.id===id);
  assert.equal(deck.cards.length,104,id+' has at least 100 options');
  assert.equal(new Set(deck.cards.map(card=>card.teenText.toLocaleLowerCase('sv'))).size,104,id+' has no repeated choices');
  assert.equal(deck.cards[8].id,id+'-09','New choices start after the legacy IDs');
  assert.equal(deck.cards.at(-1).id,id+'-104','New choices use stable append-only IDs');
  assert.ok(deck.cards.slice(8).every(card=>card.category!==deck.title&&card.category.length>2),'New cards have an explicit discovery category');
}
const newActivityCards=THEME_DECK_MODELS.find(deck=>deck.id==='aktiviteter').cards.slice(8);
for(const card of newActivityCards){
  const key=adviceKeyForCard(card,'aktiviteter');
  assert.equal(key,card.id,card.id+' uses its stable ID as editorial advice key');
  assert.ok(ADVICE_BY_KEY[key]?.length>=80,card.id+' has a substantive card-specific editorial advice sentence');
}
assert.equal(new Set(newActivityCards.map(card=>ADVICE_BY_KEY[adviceKeyForCard(card,'aktiviteter')])).size,96,'Every new activity card has a unique editorial advice sentence');
const newConversationCards=THEME_DECK_MODELS.find(deck=>deck.id==='samtal').cards.slice(8);
for(const card of newConversationCards){
  const key=adviceKeyForCard(card,'samtal');
  assert.equal(key,card.id,card.id+' uses its stable ID as editorial advice key');
  assert.ok(ADVICE_BY_KEY[key]?.length>=80,card.id+' has a substantive card-specific editorial advice sentence');
}
assert.equal(new Set(newConversationCards.map(card=>ADVICE_BY_KEY[adviceKeyForCard(card,'samtal')])).size,96,'Every new conversation card has a unique editorial advice sentence');
for(const card of themeCards){
  const deckId=card.id.split('-')[0];
  const key=adviceKeyForCard(card,deckId);
  assert.equal(key,card.id,card.id+' uses its stable ID as editorial advice key');
  assert.ok(ADVICE_BY_KEY[key]?.length>=80,card.id+' has a substantive card-specific editorial advice sentence');
}
assert.equal(new Set(themeCards.map(card=>ADVICE_BY_KEY[adviceKeyForCard(card,card.id.split('-')[0])])).size,244,'Every theme A card has its own unique editorial advice sentence');
assert.deepEqual(THEME_DECK_MODELS.find(deck=>deck.id==='samtal').cards.slice(0,8).map(card=>card.teenText),['Vad som varit roligt den senaste veckan','Hur vi har det i skolan eller på jobbet','Vad vi vill göra under nästa ledighet','Hur vi vill prata om sociala medier','Vad vi vill lära oss','Hur vi visar att vi lyssnar','Vad som gör oss stressade','Vad vi drömmer om framöver'],'Legacy conversation card texts remain unchanged');
assert.deepEqual(THEME_DECK_MODELS.find(deck=>deck.id==='aktiviteter').cards.slice(0,8).map(card=>card.teenText),['Laga mat tillsammans','Ta en promenad ihop','Se en film tillsammans','Spela ett spel','Prova en ny aktivitet','Göra en utflykt','Visa varandra favoritmusik','Skapa något tillsammans'],'Legacy activity card texts remain unchanged');
for(const deck of THEME_DECK_MODELS){
  assert.equal(deck.type,'match',deck.id+' remains a mutual matching deck');
  assert.equal(deck.audience,'both',deck.id+' is available to both roles');
  deck.cards.forEach((card,index)=>{
    assert.equal(card.id,deck.id+'-'+String(index+1).padStart(2,'0'),'Theme card keeps its stable ID');
    assert.equal(card.type,'match','Theme cards require mutual JA+JA before any future sharing');
    assert.equal(card.audience,'both','Theme cards target both roles');
  });
}

const allCards=[...GENERAL_CARDS,...themeCards];
assert.equal(Object.keys(ROLE_TEXT_BY_CARD).length,39,'Every reviewed role adaptation is declarative and no extra card is silently changed');
for(const [id,text] of Object.entries(ROLE_TEXT_BY_CARD)){
  const card=allCards.find(candidate=>candidate.id===id);
  assert.ok(card,id+' points to an existing stable card');
  assert.equal(card.type,'match',id+' remains an A match card');
  assert.equal(text.presentationVersion,2,id+' explicitly versions role-specific presentation');
  assert.ok(text.teen.length>=35&&text.parent.length>=35,id+' has substantive text for both roles');
  assert.notEqual(text.teen,text.parent,id+' does not impose symmetric wording on both roles');
  assert.equal(cardTextForRole(card,'teen'),text.teen,id+' gives the teen the reviewed wording');
  assert.equal(cardTextForRole(card,'parent'),text.parent,id+' gives the parent the reviewed wording');
  assert.equal(cardTextForRole(card,'unknown'),card.teenText,id+' safely falls back to canonical text without a known role');
}
assert.equal(cardTextForRole(GENERAL_CARDS[0],'parent'),GENERAL_CARDS[0].teenText,'Unchanged cards preserve canonical wording');

console.log('PASS: 34 general and 244 theme cards, with all 52 legacy theme IDs/texts preserved');
