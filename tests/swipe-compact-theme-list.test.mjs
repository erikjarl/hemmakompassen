import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const code=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const start=code.indexOf('function themeDecksView(completedGeneral=false){');
const end=code.indexOf('function privateThemeAnswerReview(',start);
assert.ok(start>=0&&end>start,'Locate production theme-deck view');
const production=code.slice(start,end);

function view({completed=true,paired=true}={}){
  const ids=['samtal','aktiviteter','vardag','konflikter','forandring','framtid'];
  const decks=ids.map((id,i)=>({id,title:'Tema '+(i+1),cards:Array.from({length:4},(_,k)=>({category:'Kategori '+k}))}));
  const context={
    members:paired?[{user_id:'a',role:'parent'},{user_id:'b',role:'teen'}]:[],
    themesUnlocked:paired,themesLoading:false,themesError:'',
    THEME_DECKS:decks,THEME_DECK_MODELS:decks,
    themeAnswers:new Map([['samtal',new Map([['1',true]])],['aktiviteter',new Map(Array.from({length:4},(_,i)=>[''+i,true]))]]),
    esc:value=>String(value),card:html=>'<section class="live-panel">'+html+'</section>'
  };
  vm.runInNewContext(production+';this.renderThemes=themeDecksView;',context);
  return context.renderThemes(completed);
}

test('completed general deck shows six compact rows and private statuses with direct actions',()=>{
  const html=view();
  assert.match(html,/<details class="swipe-more-decks">/);
  assert.equal((html.match(/class="swipe-theme-compact-item"/g)||[]).length,6);
  assert.equal((html.match(/data-theme-open=/g)||[]).length,6);
  assert.match(html,/Din privata status: 1 \/ 4 kort/);
  assert.match(html,/Din privata status: 4 \/ 4 kort/);
  assert.match(html,/>Fortsätt<\/button>/);
  assert.match(html,/>Visa svar<\/button>/);
  assert.match(html,/>Börja<\/button>/);
  assert.doesNotMatch(html,/class="live-panel"/);
});
test('unpaired completed choice keeps all rows but no unauthorized open action',()=>{
  const html=view({paired:false});
  assert.equal((html.match(/class="swipe-theme-compact-item"/g)||[]).length,6);
  assert.doesNotMatch(html,/data-theme-open=/);
  assert.doesNotMatch(html,/Din privata status:/);
});
test('active general swipe retains directly accessible original themed panels',()=>{
  const html=view({completed:false});
  assert.doesNotMatch(html,/swipe-theme-compact-list|swipe-more-decks/);
  assert.equal((html.match(/class="live-panel"/g)||[]).length,6);
  assert.equal((html.match(/data-theme-open=/g)||[]).length,6);
});
