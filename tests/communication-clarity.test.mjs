import test from 'node:test';
import assert from 'node:assert/strict';
import {renderCommunicationToolkit} from '../communication/toolkit.js';

test('communication overview offers plain Swedish titles and a next step to both roles',()=>{
  for(const role of ['parent','teen']){
    const html=renderCommunicationToolkit(role);
    assert.match(html,/Vad behöver du hjälp med just nu\?/);
    assert.match(html,/Säg vad du känner och behöver \(NVC\)/);
    assert.match(html,/Bygg ett jag-budskap/);
    assert.match(html,/Vad händer just nu\?/);
    assert.match(html,/Inga svar skickas eller sparas/);
    assert.match(html,/render|Trygg|hot|våld|säk|stöd/i);
    assert.doesNotMatch(html,/<h2>Nonviolent Communication \(NVC\)<\/h2>/);
  }
  const parent=renderCommunicationToolkit('parent');
  const teen=renderCommunicationToolkit('teen');
  assert.match(parent,/Lyssna utan att styra \(MI\)/);
  assert.match(parent,/Öppna MI-övningarna/);
  assert.match(teen,/Din röst är viktig/);
  assert.doesNotMatch(teen,/Lyssna utan att styra \(MI\)/);
});

test('communication overview starts with one understandable next step',()=>{
  for(const role of ['parent','teen']){
    const html=renderCommunicationToolkit(role);
    assert.match(html,/Börja med att välja en situation/);
    assert.match(html,/Vad händer just nu\?/);
    assert.match(html,/<details class="comm-hero-more"><summary>Fler sätt att börja<\/summary>/);\n    assert.match(html,/href="#kommunikation\/spegla"/);
    assert.match(html,/data-comm-open="lyssna"/);
    assert.match(html,/id="comm-reflection-form"/);
    assert.match(html,/När samtal inte känns trygga/);
  }
});
