import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../live-app.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const stage = css.split('/* DES-01G / UX-READ-01: light AI reflection output')[1] || '';

test('AI reflection is readable and has accessible disclosures and errors', () => {
  assert.ok(stage, 'missing warm reflection styles');
  assert.match(stage, /\.ai-result-panel\s*\{\s*background:#fff9f1/);
  assert.match(stage, /\.ai-result-panel h3\s*\{ color:#394627/);
  assert.match(stage, /\.ai-result-panel summary:focus-visible/);
  assert.match(stage, /min-height:44px/);
  assert.match(stage, /\.ai-result-panel \[role=alert\]\s*\{ color:#9b3026/);
  assert.doesNotMatch(stage, /display\s*:\s*none|visibility\s*:\s*hidden/);
  assert.match(html, /aireflection=light1/);
});

test('AI retry, disclosure and result classes keep original functional contracts', () => {
  assert.match(css, /\.ai-result-prose\{white-space:pre-wrap/);
  assert.match(css, /\.ai-result-panel \[data-ai-analysis-retry\]/);
  assert.match(css, /\.ai-result-panel details\{margin:15px/);
});
