import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const renderFn=source.match(/function privateGeneralAnswerReview\(\)\{[\s\S]*?(?=\nfunction filterPrivateGeneralReview\()/)?.[0];
assert.ok(renderFn,'Private general review implementation must be found');
const catalog=[
 {id:'general-01',type:'match',category:'Aktiviteter',parentText:'Vi vill fika tillsammans',teenText:'Vi vill fika tillsammans'},
 {id:'general-02',type:'understanding',category:'Behov',parentText:'Bara tonåringen',teenText:'<img src=x onerror=alert(1)>'},
 {id:'general-03',type:'match',category:'Samtal',parentText:'Vi lyssnar på varandra',teenText:'Vi lyssnar på varandra'}
];
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(role,answers,skips){
 const env={
  GENERAL_CARDS:catalog,
  swipeAnswers:new Map(answers),skippedUnderstanding:new Set(skips),
  visibleGeneralIndices:()=>catalog.flatMap((card,i)=>card.type==='match'||role==='teen'?[i]:[]),
  swipeCardId:i=>catalog[i]?.id,
  generalStatement:i=>[catalog[i].category,catalog[i][role==='teen'?'teenText':'parentText']],
  viewerRole:()=>role,esc:escapeHtml
 };
 vm.runInNewContext(renderFn+'\nthis.result=privateGeneralAnswerReview();',env);
 return env.result;
}
assert.equal(render('parent',[],[]),'');
let teen=render('teen',[['general-01',true],['general-03',false]],['general-02']);
assert.match(teen,/Mina svar i allmänna kortleken/);
assert.match(teen,/Bara ja/);
assert.match(teen,/Bara nej/);
assert.match(teen,/Bara överhoppade/);
assert.match(teen,/data-general-review-kind="skipped"/);
assert.match(teen,/data-general-review-index="1"/);
assert.match(teen,/data-general-review-index="0"/);
assert.match(teen,/data-general-review-index="2"/);
assert.doesNotMatch(teen,/<img src=x/);
assert.match(teen,/&lt;img src=x onerror=alert\(1\)&gt;/);
let parent=render('parent',[['general-01',false]],['general-02']);
assert.doesNotMatch(parent,/general-review-index="1"/,'Parent cannot access teen-only card');
assert.doesNotMatch(parent,/Bara tonåringen/);
assert.doesNotMatch(parent,/onerror=/);
assert.equal((parent.match(/data-general-review-index=/g)||[]).length,1);
assert.match(source,/if\(generalReviewButton&&page\(\)==='swipe'&&!activeThemeDeck&&user&&!swipeBusy\)/);
assert.match(source,/visibleGeneralIndices\(\)\.includes\(index\)/);
assert.match(source,/swipeAnswers\.has\(id\)/);
assert.match(source,/Number\.isSafeInteger\(index\)/);
assert.match(source,/\$\('swipe-card'\)\?\.focus/);
assert.match(source,/function filterPrivateGeneralReview\(\)/);
assert.match(source,/if\(e\.target\.matches\?\.\('#swipe-general-review-search'\)\)/);
assert.match(source,/if\(e\.target\.matches\?\.\('#swipe-general-review-answer'\)\)/);
assert.match(source,/if\(e\.target\.closest\('#swipe-general-review-reset'\)/);

assert.match(source,/function reopenGeneralReview\(\)/,
 'Private saved-answer edits restore the prior swipe position and review list');
assert.match(source,/swipeIndex=Number\.isSafeInteger\(state\?\.indexBefore\)/,
 'The original unanswered swipe position must not be replaced by a false completed-deck state');
assert.match(source,/filterPrivateGeneralReview\(\);[\s\S]*?\?\.focus\(\{preventScroll:true\}\)/,
 'The saved search and filter are reapplied with keyboard focus');
assert.match(source,/generalReviewEdit=\{index,viewer:user\.id,session:sharedSession/,
 'Only an explicitly opened own saved card starts a private editing session');
assert.match(source,/if\(returnToReview\)reopenGeneralReview\(\);else render\(\)/,
 'Successful answer or skip returns to the private review');
assert.match(source,/if\(e\.target\.closest\('#swipe-general-review-back'\)/,
 'Canceling a private edit is allowed without saving');
assert.match(source,/generalReviewEdit=null;user=u/,
 'Refresh clears ephemeral editing state across accounts');

console.log('PASS private general review: owner-only, role-safe, escaped, filtered and directly editable');
