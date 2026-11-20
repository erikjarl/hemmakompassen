import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Simulate iOS WebAudio with a resume() Promise that never settles.
const source=readFileSync(new URL('../spel/rimforsa/audio.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../spel/rimforsa/index.html',import.meta.url),'utf8');

function safariFixture(){
 let time=1000, timerId=0, notes=0;
 const contexts=[],timers=new Map();
 class Param {
  constructor(){this.value=0;}
  setValueAtTime(v){this.value=v;}
  linearRampToValueAtTime(v){this.value=v;}
  exponentialRampToValueAtTime(v){this.value=v;}
  setTargetAtTime(v){this.value=v;}
 }
 class Node {
  constructor(){this.gain=new Param();this.frequency=new Param();}
  connect(){return this;}
  disconnect(){}
  start(){notes++;}
  stop(){}
 }
 class Context {
  constructor(){
   this.state='suspended';
   this.currentTime=0;
   this.sampleRate=8000;
   this.destination=new Node();
   this.resumeCalls=0;this.closes=0;this.resolveResume=null;
   contexts.push(this);
  }
  createGain(){return new Node();}
  createOscillator(){return new Node();}
  createBiquadFilter(){return new Node();}
  createBufferSource(){return new Node();}
  createBuffer(_channels,length){return {getChannelData:()=>new Float32Array(length)};}
  resume(){
   this.resumeCalls++;
   return new Promise(resolve=>{
    this.resolveResume=()=>{
     this.state='running';
     if(this.onstatechange)this.onstatechange({target:this});
     resolve();
    };
   });
  }
  close(){this.closes++;this.state='closed';return Promise.resolve();}
 }
 const window={
  AudioContext:Context,
  setInterval:(fn,delay)=>{const id=++timerId;timers.set(id,{fn,delay});return id;},
  clearInterval:id=>timers.delete(id),
  dispatchEvent:()=>{},
  Event:class Event{constructor(type){this.type=type;}}
 };
 vm.runInNewContext(source,{window,Math,Date:{now:()=>time}});
 return {audio:window.RimforsaAudio,contexts,timers,notes:()=>notes,advance:ms=>{time+=ms;}};
}

test('A stuck iOS resume is replaced on the next gesture after timeout; late promises are ignored',async()=>{
 const {audio,contexts,timers,advance}=safariFixture();
 assert.equal(audio.enable(),true);
 assert.equal(contexts.length,1);
 const old=contexts[0];
 assert.equal(old.resumeCalls,1);
 assert.equal(audio.status().contextState,'suspended');
 advance(100);
 audio.resumeFromGesture();
 assert.equal(old.resumeCalls,1,'avoid concurrent resume calls while the first is pending');
 advance(2500);
 audio.resumeFromGesture();
 assert.equal(contexts.length,2,'a hung AudioContext must be replaced');
 assert.equal(old.closes,1,'the abandoned context must be closed');
 const replacement=contexts[1];
 assert.equal(replacement.resumeCalls,1);
 assert.equal(audio.status().contextState,'suspended');
 old.resolveResume();
 await Promise.resolve();
 assert.equal(audio.status().contextState,'suspended','late old resume must not change the new context');
 replacement.resolveResume();
 await Promise.resolve();
 assert.equal(audio.status().contextState,'running');
 assert.equal(audio.status().playingMusic,true);
 assert.equal(timers.size,1,'only one land music interval should run');
 audio.disable();
 assert.equal(timers.size,0);
 assert.equal(replacement.closes,1);
});

test('Sound Off then On creates a fresh audio engine even if the old one appeared to run',async()=>{
 const {audio,contexts}=safariFixture();
 audio.enable();
 contexts[0].resolveResume();
 await Promise.resolve();
 assert.equal(audio.status().playingMusic,true);
 assert.equal(audio.toggle(),false);
 assert.equal(contexts[0].closes,1);
 assert.equal(audio.status().enabled,false);
 assert.equal(audio.status().contextState,'not-created');
 assert.equal(audio.toggle(),true);
 assert.equal(contexts.length,2);
 assert.equal(audio.status().enabled,true);
 assert.equal(audio.status().contextState,'suspended');
 contexts[1].resolveResume();
 await Promise.resolve();
 assert.equal(audio.status().playingMusic,true);
 audio.disable();
});

test('The game requests the updated audio.js after the Safari fix',()=>{
 assert.match(html,/<script src="\.\/audio\.js\?v=29"><\/script>/);
});
