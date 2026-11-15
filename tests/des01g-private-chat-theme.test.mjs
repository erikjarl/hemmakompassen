import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const section=css.split('/* DES-01G: warm private conversation, presentation only.')[1]||'';

test('private chat styles preserve alignment, text, receipt and keyboard focus',()=>{
 assert.ok(section);
 for(const selector of [
  '.family-chat-history {',
  '.family-chat-bubble {',
  '.family-chat-mine {',
  '.family-chat-theirs {',
  '.family-chat-author {',
  '.family-chat-text {',
  '.family-chat-receipt {',
  '.family-chat-form textarea {',
  '.family-chat-read-controls {',
 ])assert.ok(section.includes(selector),selector);
 assert.match(section,/background:#f8f2ea/);
 assert.match(section,/background:#e5e7db/);
 assert.match(section,/color:#302b26/);
 assert.match(section,/outline:3px solid #314f60/);
 assert.doesNotMatch(section,/display\s*:\s*none|visibility\s*:\s*hidden|pointer-events\s*:\s*none/);
 for(const rule of section.matchAll(/^(\.[^\n{]+)\s*\{/gm)){
   assert.ok(rule[1].trim().startsWith('.family-chat'),rule[1]);
 }
});

test('chat style version stays coherent and existing read/privacy protections remain',()=>{
 const version='20261115-des01g-chat1';
 assert.ok(html.includes('live-app.css?v='+version));
 assert.ok(html.includes('live-app.js?v='+version));
 assert.ok(app.includes('ipip50-ui.js?v='+version));
 for(const fragment of [
  'family-chat-mine','family-chat-theirs','family-chat-receipt',
  'Markera alla meddelanden som lästa','data-family-chat-mark-all-read',
  'Bara ni två i den aktuella familjeparningen kan läsa konversationen',
  'familyChatUnreadError',
 ])assert.ok(app.includes(fragment),fragment);
});
