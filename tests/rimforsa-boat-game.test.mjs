import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../spel/rimforsa/index.html', import.meta.url), 'utf8');

test('Kinda båtklubb öppnar båtminispelet i samma spelsida', () => {
  assert.match(page, /id="boatOverlay"/);
  assert.match(page, /id="boatGame"/);
  assert.match(page, /near\.name==='Kinda Båtklubb'\)\{openBoatGame\(\);return;/);
  assert.match(page, /function closeBoatGame\(\)/);
  assert.match(page, /boat-minigame-map\.webp/);
});

test('Båtens hjärtan, grund och mynt finns och kan återställas', () => {
  assert.match(page, /BOAT_COIN_TARGET=8/);
  assert.match(page, /hearts:3/);
  assert.match(page, /function boatHitsHazard\(x,y\)/);
  assert.match(page, /function spawnBoatCoins\(\)/);
  assert.match(page, /function reachableBoatPoints\(\)/);
  assert.match(page, /boatState\.hearts--/);
  assert.match(page, /function resetBoatGame\(\)/);
  assert.match(page, /kartan får aldrig användas vid riktig båtfärd/);
});

test('Mobilstyrning och ordinarie Rimforsaäventyr bevaras', () => {
  assert.match(page, /button\.addEventListener\('touchstart'/);
  assert.match(page, /data-bdir="up"/);
  assert.match(page, /data-bdir="left"/);
  assert.match(page, /data-bdir="down"/);
  assert.match(page, /data-bdir="right"/);
  assert.match(page, /function scatterCoins\(\)/);
  assert.match(page, /edgeAssistedDirection/);
  assert.match(page, /id="boatRestart"/);
});

test('Båtens nya sprite och skalenliga kollisionskarta används',()=>{
 assert.match(page, /lage-motorboat\.png\?v=9/);
 assert.match(page, /boatW=boatChart\.naturalWidth;boatH=boatChart\.naturalHeight/);
 assert.match(page, /boatWaterData=g\.getImageData\(0,0,boatW,boatH\)\.data/);
 assert.match(page, /boatCtx\.drawImage\(boatSprite,-40,-40,80,77\)/);
 assert.match(page, /const acceleration=290/);
 assert.doesNotMatch(page, /boatW=710;boatH=1254/);
});
