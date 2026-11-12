import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const view=app.slice(app.indexOf('function schysstaView(){'),app.indexOf('function ',app.indexOf('function schysstaView(){')+10));

test('Schyssta listan hides empty secondary ongoing group unless explicitly filtered',()=>{
  assert.ok(view.includes("+(ongoing.length||schysstaFilterStatus==='ongoing'"),'Normal view has no empty ongoing panel; explicit filter retains it');
  assert.match(view,/data-schyssta-filter-group="ongoing"/);
  assert.match(view,/list\(ongoing,'Inga andra pågående förslag\.'\)/);
  assert.ok(view.indexOf('+approvedSection')<view.indexOf('+quickActions'));
  assert.ok(view.indexOf('+needsSection')<view.indexOf("+(ongoing.length||schysstaFilterStatus==='ongoing'"));
});

test('the ongoing filter still exists for an intentional empty-state inspection',()=>{
  assert.match(view,/value="ongoing"/);
  assert.match(view,/schysstaFilterStatus==='ongoing'/);
  assert.match(app,/function applySchysstaFilters\(\)/);
  assert.match(app,/group\.hidden=!categoryVisible/);
});
