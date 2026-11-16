import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../konto.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../design-tokens.css', import.meta.url), 'utf8');
const app = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('DES-01B account theme is intentionally scoped', () => {
  assert.match(html, /<body class="hk-light-account">/);
  assert.match(html, /design-tokens\.css\?v=20261116-des01g-account-disclosures1/);
  assert.doesNotMatch(app, /design-tokens\.css/);
  assert.match(css, /body\.hk-light-account/);
  assert.doesNotMatch(css, /(?:^|\n)\s*(?:body|\.live-mobile|#live-mobile-nav)\s*\{/);
});

test('DES-01B preserves functional account and feedback form hooks', () => {
  for (const id of ['email-form', 'signup-form', 'reset-form', 'password-form',
    'accept-form', 'hk-feedback-dialog', 'hk-feedback-form', 'status']) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
});

test('DES-01B semantic tokens and focus style are present', () => {
  for (const token of ['--hk-bg', '--hk-surface', '--hk-ink', '--hk-muted',
    '--hk-olive', '--hk-border', '--hk-focus']) {
    assert.ok(css.includes(token + ':'), 'Missing '+token);
  }
  assert.match(css, /body\.hk-light-account :focus-visible/);
});
