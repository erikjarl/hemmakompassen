import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { feedbackPageContext, feedbackPayload } from '../feedback.js';

assert.equal(feedbackPageContext('https://site.test/hk/index.html#swipe/theme'),
  'index.html#swipe');
assert.equal(feedbackPageContext('https://site.test/hk/index.html#kommunikation/plan'),
  'index.html#kommunikation');
assert.equal(feedbackPageContext('https://site.test/hk/konto.html#invite=SECRET123'),
  'konto.html');
assert.equal(feedbackPageContext('https://site.test/hk/index.html#invite=SECRET123'),
  'index.html');
assert.equal(feedbackPageContext('https://site.test/hk/'), 'index.html');
const report = feedbackPayload('self-test-id', {category:'content',description:'  Texten kan misstolkas  ',expected:'Skriv tydligare'},
  'https://site.test/hk/index.html#personlighet');
assert.deepEqual(report, {
  user_id:'self-test-id',category:'content',page_context:'index.html#personlighet',
  description:'Texten kan misstolkas',expected_result:'Skriv tydligare'
});
assert.throws(()=>feedbackPayload('self-test-id',{category:'unknown',description:'En beskrivning'},'https://site.test/'));
assert.throws(()=>feedbackPayload('self-test-id',{category:'bug',description:'för kort'},'https://site.test/'));
assert.throws(()=>feedbackPayload('',{category:'bug',description:'Ett ordentligt fel'},'https://site.test/'));
const html = readFileSync(new URL('../index.html',import.meta.url),'utf8');
const konto = readFileSync(new URL('../konto.html',import.meta.url),'utf8');
const live = readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const account = readFileSync(new URL('../konto.js',import.meta.url),'utf8');
const build = readFileSync(new URL('../scripts/build-static.mjs',import.meta.url),'utf8');
const sql = readFileSync(new URL('../supabase/migrations/20261109121500_test_feedback.sql',import.meta.url),'utf8');
for (const page of [html,konto]) {
  for (const marker of ['id="hk-feedback-open"','id="hk-feedback-dialog"','id="hk-feedback-form"','id="hk-feedback-close"','id="hk-feedback-status"']) {
    assert.ok(page.includes(marker), 'Missing tester feedback control: ' + marker);
  }
  assert.match(page,/feedback\.css/);
}
assert.match(live,/installFeedback\(\{db\}\)/);
assert.match(account,/installFeedback\(\{db:client\}\)/);
assert.match(build,/'feedback\.js'/);
assert.match(build,/'feedback\.css'/);
assert.match(sql,/enable row level security/i);
assert.match(sql,/grant insert \(user_id,category,page_context,description,expected_result\)/i);
assert.doesNotMatch(sql,/grant (?:all|select|update|delete) .* to authenticated/i);
assert.match(sql,/with check \(\(select auth\.uid\(\)\) = user_id and status = 'new'\)/i);
console.log('Tester feedback: route sanitization, payload, both pages, build and insert-only database contract OK.');
