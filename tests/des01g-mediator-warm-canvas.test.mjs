import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../live-app.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('DES-01G mediator canvas uses route-scoped warm styling', () => {
  assert.match(css, /\.live-main:has\(#live-app > \.mediator-view\)\s*\{\s*background:#f8f2ea/);
  assert.match(css, /\.mediator-view > \.live-panel:not\(\.mediator-notice\)/);
  assert.match(css, /\.mediator-view \.mediator-actions \.live-button:focus-visible/);
  assert.match(html, /mediatorcanvas=warm1/);
});
test('DES-01G mediator change preserves existing safety notice styling', () => {
  assert.match(css, /\.mediator-view \.mediator-notice\s*\{/);
  assert.match(css, /\.mediator-view \.mediator-message-safety\s*\{/);
  assert.match(css, /\.mediator-view \.mediator-context-choice\s*\{/);
});
