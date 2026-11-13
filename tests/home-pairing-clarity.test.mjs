import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');

test('home separates private and paired welcoming language',()=>{
  const start=source.indexOf('function home(){');
  const end=source.indexOf('const SCHYSSTA_UUID',start);
  assert.ok(start>=0&&end>start);
  const home=source.slice(start,end);
  assert.match(home,/members\.length===2\?'Välkommen till ert rum\.':'Välkommen till ditt rum\.'/);
  assert.match(home,/members\.length===2\?'Hantera familj och inbjudningar':members\.length===0\?'Koppla ditt konto till en familj':'Bjud in den andra familjemedlemmen'/);
  assert.match(home,/href="\.\/konto\.html"/);
  assert.match(home,/href="#swipe"/);
  assert.match(home,/Koppla ihop era konton för att använda funktionen/);
  assert.match(home,/role="alert"/);
});
