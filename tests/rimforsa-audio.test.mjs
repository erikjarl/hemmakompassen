import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../spel/rimforsa/index.html',import.meta.url),'utf8');
const source=readFileSync(new URL('../spel/rimforsa/audio.js',import.meta.url),'utf8');

function audioFixture(){
 const clocks=new Map();
 let nextClock=1,starts=0;
 class Param{
   constructor(){this.value=0;}
   setValueAtTime(v){this.value=v;}
   linearRampToValueAtTime(v){this.value=v;}
   exponentialRampToValueAtTime(v){this.value=v;}
   setTargetAtTime(v){this.value=v;}
 }
 class Node{
   constructor(){this.gain=new Param();this.frequency=new Param();}
   connect(){return this;}
   disconnect(){}
   start(){starts++;}
   stop(){}
 }
 class FakeAudioContext{
   constructor(){this.currentTime=0;this.sampleRate=8000;this.state='running';this.destination=new Node();}
   createGain(){return new Node();}
   createOscillator(){return new Node();}
   createBiquadFilter(){return new Node();}
   createBufferSource(){return new Node();}
   createBuffer(channels,length){return {getChannelData:()=>new Float32Array(length)};}
   resume(){this.state='running';return Promise.resolve();}
 }
 const window={AudioContext:FakeAudioContext,
   setInterval:(fn,delay)=>{let id=nextClock++;clocks.set(id,{fn,delay});return id;},
   clearInterval:id=>clocks.delete(id)};
 vm.runInNewContext(source,{window,Math});
 return {audio:window.RimforsaAudio,clocks,starts:()=>starts};
}

test('Ljud börjar först efter användarens ljudknapp',()=>{
 const {audio,clocks}=audioFixture();
 assert.equal(audio.status().enabled,false);
 assert.equal(clocks.size,0);
 assert.equal(audio.enable(),true);
 assert.equal(audio.status().playingMusic,true);
 assert.equal(audio.status().scene,'land');
 audio.disable();
 assert.equal(audio.status().enabled,false);
 assert.equal(clocks.size,0);
});

test('Landmusik ersätts av vågor, fiskmåsar och motor på sjön',()=>{
 const {audio,clocks,starts}=audioFixture();
 audio.enable();
 assert.equal(audio.status().playingMusic,true);
 audio.setScene('boat');
 assert.equal(audio.status().playingMusic,false);
 assert.equal(audio.status().playingWaves,true);
 assert.equal(audio.status().playingEngine,true);
 assert.equal(clocks.size,1);
 const first=starts();
 audio.setBoatSpeed(.75);
 audio.coin();
 audio.hit();
 assert.ok(starts()>first,'Coin and hit sound effects should be synthesized');
 audio.setScene('land');
 assert.equal(audio.status().playingMusic,true);
 assert.equal(audio.status().playingWaves,false);
 assert.equal(audio.status().playingEngine,false);
 assert.equal(clocks.size,1);
 audio.disable();
});

test('Ljud pausas när sidan döljs, med säkert läge i webbläsare utan Web Audio',()=>{
 const {audio,clocks}=audioFixture();
 audio.enable();audio.setScene('boat');
 audio.setVisible(false);
 assert.equal(clocks.size,0);
 assert.equal(audio.status().playingWaves,false);
 audio.setVisible(true);
 assert.equal(audio.status().playingWaves,true);
 audio.disable();
 const window={setInterval(){},clearInterval(){}};
 vm.runInNewContext(source,{window,Math});
 assert.equal(window.RimforsaAudio.enable(),false);
 assert.equal(window.RimforsaAudio.status().available,false);
});

test('Spelet har två ljudknappar och ljud kopplat till båda miljöerna',()=>{
 assert.match(html, /<script src="\.\/audio\.js\?v=\d+"><\/script>/);
 assert.equal((html.match(/data-sound-toggle/g)||[]).length>=3,true);
 for(const required of [
  "audio.setScene('boat')",
  "audio.setScene('land')",
  "audio.setBoatSpeed(Math.hypot(boatState.vx,boatState.vy)/155)",
  "audio.coin()",
  "audio.hit()",
  "document.addEventListener('visibilitychange'"
 ]) assert.ok(html.includes(required),'Missing sound integration: '+required);
 assert.match(html,/function scatterCoins\(\)/);
 assert.match(html,/function reachableBoatPoints\(\)/);
 assert.match(html,/boatW=boatChart\.naturalWidth;boatH=boatChart\.naturalHeight/);
});

test('Bilens motorljud följer ljudknappen och bytet till båtspelet',()=>{
 const {audio}=audioFixture();
 audio.enable();audio.setCarActive(true);audio.setCarSpeed(.6);
 assert.equal(audio.status().playingCarEngine,true);
 audio.setScene('boat');assert.equal(audio.status().playingCarEngine,false);
 audio.setScene('land');assert.equal(audio.status().playingCarEngine,true);
 audio.setCarActive(false);assert.equal(audio.status().playingCarEngine,false);
 audio.disable();
});

test('En originalskapad grattisfanfar spelas bara när ljud är aktiverat',()=>{
 const {audio,starts}=audioFixture();
 const silent=starts();audio.victory();assert.equal(starts(),silent);
 audio.enable();const before=starts();audio.victory();
 assert.ok(starts()>=before+5,'Firandet ska skapa minst fem toner');
 audio.disable();
});

test('Drakens musik växlar vid närhet och återgår när Lage går därifrån',()=>{
 const {audio,clocks,starts}=audioFixture();
 assert.equal(audio.status().dragonNearby,false);
 audio.setDragonNearby(true);
 assert.equal(audio.status().dragonNearby,true);
 assert.equal(clocks.size,0,'ljud får inte starta automatiskt');
 audio.enable();
 const before=starts();
 for(let i=0;i<4;i++)for(const clock of clocks.values())clock.fn();
 assert.ok(starts()>before,'draktemat ska spela toner');
 audio.setDragonNearby(false);
 assert.equal(audio.status().dragonNearby,false);
 audio.setScene('boat');
 assert.equal(audio.status().playingMusic,false);
 audio.disable();
});

test('Swimming uses waves but never boat engine or gull timer, and respects toggle and visibility',()=>{
 const {audio,clocks}=audioFixture();
 audio.setScene('swim');
 assert.equal(audio.status().playingWaves,false,'no autoplay before user enables sound');
 assert.equal(audio.enable(),true);
 assert.equal(audio.status().scene,'swim');
 assert.equal(audio.status().playingWaves,true);
 assert.equal(audio.status().playingEngine,false);
 assert.equal(audio.status().playingMusic,false);
 assert.equal(clocks.size,0,'no periodic boat gull while swimming');
 audio.setVisible(false);
 assert.equal(audio.status().playingWaves,false);
 audio.setVisible(true);
 assert.equal(audio.status().playingWaves,true);
 audio.disable();
 assert.equal(audio.status().playingWaves,false);
 assert.equal(audio.toggle(),true);
 assert.equal(audio.status().playingWaves,true);
 audio.setScene('land');
 assert.equal(audio.status().playingWaves,false);
 assert.equal(audio.status().playingMusic,true);
 audio.disable();
});

test('Återupptagning från en ny spelgest behåller friska ljudloopar utan dubletter',()=>{
 const {audio,clocks}=audioFixture();
 audio.enable();
 assert.equal(clocks.size,1);
 const original=[...clocks.keys()][0];
 assert.equal(audio.resumeFromGesture(),true);
 assert.equal(clocks.size,1);
 assert.equal([...clocks.keys()][0],original,'music interval must not restart when healthy');
 audio.setScene('boat');
 const boatTimer=[...clocks.keys()][0];
 assert.equal(audio.resumeFromGesture(),true);
 assert.equal(clocks.size,1);
 assert.equal([...clocks.keys()][0],boatTimer,'gull timer must not duplicate');
 audio.disable();
 assert.equal(clocks.size,0);
});
