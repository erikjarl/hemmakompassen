import test from 'node:test';
import assert from 'node:assert/strict';
import {analysisInstructions,enforceActionableAnalysis} from '../workers/ai-mediator/src/analysis.mjs';
import {renderAiAnalysisReply} from '../ai-result-ui.js';

// Exercise the production backend validator and frontend renderer together.
// No model, database or existing family account is involved.
const answer='Reflektion:\nEra svar kan vara en början på ett samtal.\n\nFörslag:\n'
 +'1. Skriv ett kort frivilligt jag-budskap om vad du behöver och prova övningen. #nvc\n'
 +'2. Bjud in till en kort paus och föreslå när ni kan prata igen. #kommunikation/pausa';

test('AI-UX-05: Worker accepts an exact existing NVC route in both result modules',()=>{
  for(const kind of ['personality','swipe']){
    assert.equal(enforceActionableAnalysis(answer,kind),answer,
      kind+': two valid, distinct concrete actions must remain intact');
    const html=renderAiAnalysisReply(enforceActionableAnalysis(answer,kind));
    assert.match(html,/href="#nvc">Bygg ett jag-budskap med NVC<\/a>/);
    assert.match(html,/href="#kommunikation\/pausa"/);
    assert.doesNotMatch(html,/&lt;a href/);
  }
});

test('AI-UX-05: Worker prompt now agrees with the frontend NVC allowlist',()=>{
  const prompt=analysisInstructions({role:'teen',kind:'swipe'});
  assert.match(prompt,/#nvc/);
  assert.match(prompt,/ALDRIG FRÅGOR UNDER "Förslag:"/);
});

test('AI-UX-05: modified NVC routes and extra embedded routes are rejected, not partially linked',()=>{
  for(const kind of ['personality','swipe']){
    for(const bad of ['#nvc-extra','#nvc/andra','#nvc?step=2','#nvc2','#nvc_more','#nvcå',
      '#kommunikation/kontakt #nvc','https://example.org/#nvc']){
      const invalid=answer.replace('prova övningen. #nvc','prova övningen. '+bad);
      const fixed=enforceActionableAnalysis(invalid,kind);
      assert.notEqual(fixed,invalid,kind+' should replace untrusted '+bad);
      assert.doesNotMatch(fixed,/#nvc/,'Only fixed, vetted fallback routes remain');
      assert.match(fixed,/^Förslag:\n1\. /m);
      assert.doesNotMatch(fixed.split('Förslag:')[1],/\?/);
    }
  }
});
