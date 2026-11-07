import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const fn=source.match(/function privateThemeAnswerReview\(deck\)\{[\s\S]*?(?=\nfunction themeSwipeView\()/)?.[0];
assert.ok(fn,'Execute the actual private saved-answer review renderer');
const catalog=[
 {id:'samtal-01',category:'Fritid',type:'match',teenText:'Vi kan fika tillsammans'},
 {id:'samtal-02',category:'Känslor',type:'match',teenText:'<img src=x onerror=alert(1)>'},
 {id:'samtal-03',category:'Tillit',type:'match',teenText:'Jag vill prata'}
];
function render(answers,role='teen'){
 const env={
  themeAnswers:new Map([['samtal',new Map(answers)]]),
  themeCardId:(deck,i)=>deck.cards[i]?.id,
  themeCardModel:(deck,i)=>deck.cards[i],
  viewerRole:()=>role,
  cardTextForRole:model=>model.teenText,
  esc:value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
 };
 vm.runInNewContext(fn+'\nthis.output=privateThemeAnswerReview({id:"samtal",title:"Samtalsämnen",cards:catalog});',env);
 return env.output;
}
assert.equal(render([]),'','Do not show an empty review section');
const html=render([['samtal-01',true],['samtal-02',false]]);
assert.match(html,/Mina sparade svar/);
assert.match(html,/Ditt svar: Ja/);
assert.match(html,/Ditt svar: Nej/);
assert.equal((html.match(/data-theme-review-index=/g)||[]).length,2);
assert.match(html,/data-theme-review-index="0"/);
assert.match(html,/data-theme-review-index="1"/);
assert.doesNotMatch(html,/data-theme-review-index="2"/,'Unanswered cards do not appear in saved-answer review');
assert.doesNotMatch(html,/<img src=x/,'User-visible card text must be HTML escaped');
assert.match(html,/&lt;img src=x onerror=alert\(1\)&gt;/);
assert.match(source,/reviewButton\.dataset\.themeReviewDeck===deck\.id/,'The click handler checks deck identity');
assert.match(source,/themeAnswers\.get\(deck\.id\)\.has\(themeCardId\(deck,index\)\)/,
 'The click handler rejects not-yet-answered card indices');
assert.match(source,/Number\.isSafeInteger\(index\)/,'The selected card index must be an integer');
assert.match(source,/themeReview=true;[\s\S]*?themeIndex=index;/,'Review uses the existing private editing path');
console.log('PASS: only own saved answers rendered, escaped, and eligible for direct per-card correction');
