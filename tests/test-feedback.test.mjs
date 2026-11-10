import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {runInNewContext} from 'node:vm';
const scope={window:{},URL};
runInNewContext(readFileSync(new URL('../feedback.js',import.meta.url),'utf8'),scope);
const {feedbackPageContext,feedbackPayload}=scope.window.HKFeedback;

// A stalled auth lookup must release the report form without sending any INSERT.
const pendingTimeouts = new Map();
const clearedTimeouts = [];
let nextTimeout = 1;
let onBeforeUnload;
const timeoutScope = {
  window: {addEventListener(type, handler) { if (type === 'beforeunload') onBeforeUnload = handler; }}, URL,
  setTimeout: callback => { const id = nextTimeout++; pendingTimeouts.set(id, callback); return id; },
  clearTimeout: id => { clearedTimeouts.push(id); pendingTimeouts.delete(id); }
};
runInNewContext(readFileSync(new URL('../feedback.js', import.meta.url), 'utf8'), timeoutScope);
const withFeedbackDeadline = timeoutScope.window.HKFeedback.withFeedbackDeadline;
const pending = withFeedbackDeadline(new Promise(() => {}), 15000);
assert.equal(pendingTimeouts.size, 1, 'A stalled operation gets one timeout');
const [timerId, fireTimeout] = [...pendingTimeouts.entries()][0];
fireTimeout();
await assert.rejects(pending, error => error.code === 'FEEDBACK_TIMEOUT');
assert.ok(clearedTimeouts.includes(timerId), 'Timeout is cleared on failure');
assert.equal(await withFeedbackDeadline(Promise.resolve('ok')), 'ok');
assert.equal(pendingTimeouts.size, 0, 'Success also clears the timeout');

let onSubmit;
const sendButton = {disabled: false};
const closeButton = {disabled: false, addEventListener() {}};
const clearButton = {disabled: false, addEventListener() {}};
const statusNode = {textContent: ''};
const fakeForm = {
  elements: {
    category: {value: 'bug'}, description: {value: 'Beskrivning av ett riktigt fel'},
    expected: {value: ''}
  },
  querySelector: () => sendButton,
  addEventListener(type, handler) { if (type === 'submit') onSubmit = handler; }
};
const fakeNodes = {
  'hk-feedback-dialog': {addEventListener() {}},
  'hk-feedback-open': {addEventListener() {}},
  'hk-feedback-form': fakeForm,
  'hk-feedback-close': closeButton,
  'hk-feedback-clear': clearButton,
  'hk-feedback-status': statusNode
};
timeoutScope.document = {getElementById: id => fakeNodes[id]};
timeoutScope.location = {href: 'https://site.test/hk/index.html#swipe'};
let inserted = 0;
timeoutScope.window.HKFeedback.installFeedback({
  db: {
    auth: {getUser: () => new Promise(() => {})},
    from: () => ({insert: () => { inserted++; return Promise.resolve({error:null}); }})
  }
});
assert.equal(typeof onSubmit, 'function');
assert.equal(typeof onBeforeUnload, 'function', 'A real unload handler is installed');
function unloadingPrevented() {
  const event = {prevented:false,returnValue:null,preventDefault() {this.prevented=true;}};
  onBeforeUnload(event);
  return event.prevented && event.returnValue === '';
}
assert.equal(unloadingPrevented(), true, 'A non-empty report draft is protected');
const originalDraft = fakeForm.elements.description.value;
fakeForm.elements.description.value = '             ';
assert.equal(unloadingPrevented(), false, 'Whitespace is not an unsent draft');
await onSubmit({preventDefault() {}});
assert.match(statusNode.textContent, /minst 10 tecken/,
  'Whitespace-only reports are rejected locally before Auth');
assert.equal(pendingTimeouts.size, 0, 'An invalid draft must not start an Auth request');
assert.equal(sendButton.disabled, false, 'Local validation never locks the form');
assert.equal(inserted, 0);
fakeForm.elements.description.value = originalDraft;
const submission = onSubmit({preventDefault() {}});
assert.equal(sendButton.disabled, true);
assert.equal(pendingTimeouts.size, 1);
[...pendingTimeouts.values()][0]();
await submission;
assert.equal(inserted, 0, 'No report is inserted without completed authentication');
assert.match(statusNode.textContent, /Ingen rapport har skickats/);
assert.equal(sendButton.disabled, false, 'The report form is available again');
assert.equal(closeButton.disabled, false, 'The report can be closed after an auth timeout');
assert.equal(clearButton.disabled, false, 'The report can be cleared after an auth timeout');

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
assert.deepEqual(JSON.parse(JSON.stringify(report)), {
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
  for (const marker of ['id="hk-feedback-open"','id="hk-feedback-dialog"','id="hk-feedback-form"','id="hk-feedback-close"','id="hk-feedback-clear"','id="hk-feedback-status"']) {
    assert.ok(page.includes(marker), 'Missing tester feedback control: ' + marker);
  }
  assert.match(page,/feedback\.css/);
}
assert.match(live,/HKFeedback\?\.installFeedback\(\{db\}\)/);
assert.match(readFileSync(new URL('../feedback.js',import.meta.url),'utf8'), /withFeedbackDeadline\(db\.auth\.getUser\(\)\)/);
assert.match(account,/HKFeedback\?\.installFeedback\(\{db:client\}\)/);
assert.match(build,/'feedback\.js'/);
assert.match(build,/'feedback\.css'/);
assert.match(sql,/enable row level security/i);
assert.match(sql,/grant insert \(user_id,category,page_context,description,expected_result\)/i);
assert.doesNotMatch(sql,/grant (?:all|select|update|delete) .* to authenticated/i);
assert.match(sql,/with check \(\(select auth\.uid\(\)\) = user_id and status = 'new'\)/i);
console.log('Tester feedback: route sanitization, payload, both pages, build and insert-only database contract OK.');
