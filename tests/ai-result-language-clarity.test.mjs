import test from 'node:test';
import assert from 'node:assert/strict';
import {createAiResultExperience} from '../ai-result-ui.js';

test('UX-READ-01: AI-result panel explains its basis and limits in plain Swedish',()=>{
  const ui=createAiResultExperience({
    db:{auth:{}},
    config:{enableAiMediator:true,enableAiResultAnalyses:true,
      aiMediatorUrl:'https://hemmakompassen-ai-medlare.erikbertiljarl.workers.dev/api/ai/mediate'}
  });
  ui.reset('reader');
  const html=ui.panel('personality','own','profile-result');
  assert.match(html,/AI:n skriver utifrån resultat som kontrollerats på servern/);
  assert.match(html,/Den kan ha fel/);
  assert.match(html,/Texten är ingen diagnos/);
  assert.doesNotMatch(html,/Genereras automatiskt från serverkontrollerade resultat/);
});
