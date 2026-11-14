import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../konto.html',import.meta.url),'utf8');
const builder=readFileSync(new URL('../scripts/build-static.mjs',import.meta.url),'utf8');
const allAssets=builder.match(/const assets = \[([\s\S]*?)\];/)?.[1]||'';
const assets=new Set([...allAssets.matchAll(/'([^']+)'/g)].map(m=>m[1]));
test('Cloudflare static dist includes every local stylesheet linked by account',()=>{
  const links=[...html.matchAll(/<link\s+[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)]
    .map(m=>m[1].replace(/^\.\//,'').split('?')[0]);
  assert.ok(links.includes('design-tokens.css'));
  for(const href of links) assert.ok(assets.has(href), 'Static build excludes '+href);
});
