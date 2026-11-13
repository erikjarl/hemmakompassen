import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeNvcAiReply} from '../communication/toolkit.js';

// FBK-02-02: a natural AI proposal may be used only after the user explicitly
// requests one. Structured field echoes must never masquerade as a proposal.
test('NVC AI reply accepts a short, natural Swedish request',()=>{
  assert.equal(normalizeNvcAiReply('När jag inte får prata klart blir jag ledsen. Jag vill gärna bli lyssnad på. Kan vi prata i fem minuter?'),
    'När jag inte får prata klart blir jag ledsen. Jag vill gärna bli lyssnad på. Kan vi prata i fem minuter?');
});
test('NVC AI reply rejects inline fields rather than copying form notes',()=>{
  assert.equal(normalizeNvcAiReply('Observation: du avbröt. Känsla: ledsen. Behov: lugn. Önskemål: låt mig prata klart.'),null);
  assert.equal(normalizeNvcAiReply('Ett förslag: Observation: du avbröt. Känsla: ledsen. Behov: lugn.'),null);
  assert.equal(normalizeNvcAiReply('När jag blir avbruten vill jag prata klart. Behov: lugn.'),null);
});
test('NVC AI reply rejects earlier evidenced malformed composition',()=>{
  assert.equal(normalizeNvcAiReply('När Erik lyssnade inte när jag pratade känner jag Trött och uppblåst. Jag behöver Att Erik lyssnar.'),null);
});
test('NVC AI reply rejects long or purely decorative text',()=>{
  assert.equal(normalizeNvcAiReply('!!!'),null);
  assert.equal(normalizeNvcAiReply('Hej '.repeat(70)),null);
});
