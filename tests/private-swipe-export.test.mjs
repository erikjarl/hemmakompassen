import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const functions=source.match(/function privateSwipeExportRows\(\)\{[\s\S]*?(?=\nfunction downloadPrivateSwipeAnswers\()/)?.[0];
assert.ok(functions,'Production export snapshot and formatter must exist');
function harness(role='teen'){
 const env={
  user:{id:'owner'},swipeLoadError:'',swipeBusy:false,
  importanceAvailable:true,importanceLoadError:'',importanceSaving:new Set(),importancePending:new Map(),
  viewerRole:()=>role,
  GENERAL_CARDS:[
   {id:'general-01',type:'match',category:'Fritid',teenText:'En egen sak',parentText:'Förälderns perspektiv'},
   {id:'general-02',type:'understanding',category:'Känslor',teenText:'Privat B-text'},
   {id:'general-03',type:'match',category:'Samtal',teenText:'Ej besvarat'}
  ],
  THEME_DECK_MODELS:[{id:'aktiviteter',title:'Aktiviteter',cards:[
   {id:'aktiviteter-01',type:'match',category:'Ute',teenText:'Promenad'},
   {id:'aktiviteter-02',type:'match',category:'Hemma',teenText:'HEMLIGT OBESVARAT'}
  ]}],
  swipeAnswers:new Map([['general-01',false]]),
  skippedUnderstanding:new Set(['general-02']),
  themeAnswers:new Map([['aktiviteter',new Map([['aktiviteter-01',true]])]]),
  swipeImportance:new Map([['general\u0000general-01',1],['aktiviteter\u0000aktiviteter-01',-1]]),
  importanceKey:(deck,id)=>deck+'\u0000'+id,
  importanceValueText:n=>n===1?'Mycket viktigt':n===-1?'Mindre viktigt':'Neutral, inte prioriterad',
  cardTextForRole:(card,r)=>r==='parent'?(card.parentText||card.teenText):card.teenText
 };
 vm.runInNewContext(functions+'\nthis.rows=privateSwipeExportRows;this.format=privateSwipeExportText;',env);
 return env;
}
{
 const e=harness('teen');
 const rows=e.rows(),text=e.format(rows);
 assert.equal(rows.length,3);
 assert.match(text,/En egen sak/);
 assert.match(text,/Mitt svar: Nej · Viktighet: Mycket viktigt/);
 assert.match(text,/Privat B-text[\s\S]*?Mitt svar: Överhoppat/);
 assert.match(text,/Promenad[\s\S]*?Mitt svar: Ja · Viktighet: Mindre viktigt/);
 for(const forbidden of ['HEMLIGT OBESVARAT','general-01','aktiviteter-01','owner','user_id','sent_by','pair_id']){
  assert.doesNotMatch(text,new RegExp(forbidden));
 }
}
{
 const e=harness('parent');
 const text=e.format(e.rows());
 assert.doesNotMatch(text,/Privat B-text|Överhoppat/,'Parent never receives teen-only B cards');
 assert.match(text,/Förälderns perspektiv/);
}
{
 const e=harness();
 e.swipeLoadError='Läsfel';
 assert.equal(e.rows(),null,'Cannot export a partial failed own-answer load');
 e.swipeLoadError='';
 e.user=null;
 assert.equal(e.rows(),null,'No export without signed-in user');
 e.user={id:'owner'};
 e.swipeBusy=true;
 assert.equal(e.rows(),null,'Cannot export while own write is pending');
 e.swipeBusy=false;
 e.importanceAvailable=false;
 assert.equal(e.rows(),null,'Cannot silently omit importance ratings before server load');
 e.importanceAvailable=true;
 e.importanceLoadError='Failed fetching own ratings';
 assert.equal(e.rows(),null,'Cannot silently omit private ratings after Supabase read failure');
 e.importanceLoadError='';
 e.importancePending.set('general\u0000general-01',{value:1});
 assert.equal(e.rows(),null,'Queued private rating writes must finish before export');
 e.importancePending.clear();
 e.importanceSaving.add('general\u0000general-01');
 assert.equal(e.rows(),null,'In-progress private rating writes must finish before export');
 e.importanceSaving.clear();
 assert.ok(e.rows()?.length,'Export resumes when complete private data has loaded and writes finished');
}
assert.match(source,/id="swipe-export-private"/,'A named export control exists');
assert.match(source,/new Blob\(\['\\uFEFF',privateSwipeExportText\(rows\)\],\{type:'text\/plain;charset=utf-8'\}\)/,'UTF-8 BOM for Swedish text');
assert.match(source,/link\.download='mina-gillaswajp-svar\.txt'/);
assert.match(source,/if\(e\.target\.closest\('#swipe-export-private'\)&&page\(\)==='swipe'\)/,'Export is scoped to swipe page');
console.log('PASS: owner-only swipe export includes saved general/theme, skips, importance; excludes family and unknown data');