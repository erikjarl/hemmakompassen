import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const start=source.indexOf('  const allAdvice=');
const end=source.indexOf('  const count=',start);
assert.ok(start>=0&&end>start,'unified advice formatter is present in production source');
const code=source.slice(start,end);

function render(groups){
  return vm.runInNewContext(
    '(function(sortedGroups){'+code+'return {allAdvice,advicePreview,moreAdvice};})',
    {
      firstSentence:value=>String(value||'').split('.')[0],
      esc:value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))
    }
  )(groups);
}

test('unified swipe advice keeps all distinct reviewed tips, with only two expanded',()=>{
  const data=render([
    ['Aktiviteter',[
      {advice:'Boka egentid. Veckovis.'},{advice:'Välj en dag. Gör något tillsammans.'}
    ]],
    ['Samtal',[
      {advice:'Boka egentid. Överlappande råd.'},{advice:'Lyssna utan avbrott. Fortsättning.'},
      {advice:'Fråga hur det känns. Fortsättning.'}
    ]]
  ]);
  assert.deepEqual([...data.allAdvice],['Boka egentid','Välj en dag','Lyssna utan avbrott','Fråga hur det känns']);
  assert.deepEqual([...data.advicePreview],['Boka egentid','Välj en dag']);
  assert.match(data.moreAdvice,/Visa 2 fler råd/);
  assert.match(data.moreAdvice,/Lyssna utan avbrott/);
  assert.match(data.moreAdvice,/Fråga hur det känns/);
  assert.doesNotMatch(data.moreAdvice,/Överlappande råd/);
});

test('two or fewer verified tips do not introduce unnecessary disclosure',()=>{
  assert.equal(render([['Samtal',[{advice:'Lyssna aktivt.'}]]]).moreAdvice,'');
  assert.equal(render([]).moreAdvice,'');
});

test('additional editorial advice is escaped before HTML rendering',()=>{
  const data=render([['Aktiviteter',[
    {advice:'Första.'},{advice:'Andra.'},{advice:'Råd <script>alert(1)</script>.'}
  ]]]);
  assert.match(data.moreAdvice,/&lt;script&gt;/);
  assert.doesNotMatch(data.moreAdvice,/<script>/);
});
