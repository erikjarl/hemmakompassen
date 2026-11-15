import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../feedback.css',import.meta.url),'utf8');
const app=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const account=readFileSync(new URL('../konto.html',import.meta.url),'utf8');
const stage=css.split('/* DES-01G: warm light reporting dialog on account and app pages.')[1]||'';

test('feedback form and launcher use readable light styling on both pages',()=>{
 assert.ok(stage,'missing light feedback theme');
 for(const selector of [
   '.hk-feedback-open{',
   '.hk-feedback-dialog{',
   '.hk-feedback-dialog select,.hk-feedback-dialog textarea{',
   '.hk-feedback-dialog button[type=submit]{',
   '.hk-feedback-dialog button[type=button]{',
   '.hk-feedback-dialog .hk-feedback-note{',
   '.hk-feedback-dialog .hk-feedback-note a{',
   '#hk-feedback-status{'
 ]) assert.ok(stage.includes(selector),selector);
 assert.match(stage,/background:#fff9f1/);
 assert.match(stage,/color:#302b26/);
 assert.match(stage,/outline:3px solid #314f60/);
 assert.doesNotMatch(stage,/display\s*:\s*none|visibility\s*:\s*hidden|pointer-events\s*:\s*none/);
});
test('both pages fetch same stylesheet and retain privacy and draft controls',()=>{
 const rev='feedback.css?v=20261115-des01g-feedback-light1';
 for(const page of [app,account]){
  assert.ok(page.includes(rev));
  for(const id of ['hk-feedback-dialog','hk-feedback-form','hk-feedback-status','hk-feedback-close','hk-feedback-clear']){
   assert.ok(page.includes(id),id);
  }
  assert.ok(page.includes('inga privata svar, chattar eller skärmbilder'));
  assert.ok(page.includes('Utkastet bevaras'));
 }
 assert.match(css,/min-height:44px/);
});
