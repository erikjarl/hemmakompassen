/* Originalsyntetiserade spelljud för Lage i Rimforsa. Inga externa ljudfiler eller musikverk används. */
(function (root) {
  'use strict';
  const AudioCtor = root.AudioContext || root.webkitAudioContext;
  let ctx=null,master=null,scene='land',enabled=false,hidden=false;
  let musicInterval=null,gullInterval=null,engine=null,waves=null,melodyStep=0,volume=.55;
  const melody=[392,440,523.25,440,392,329.63,349.23,392,440,392,329.63,293.66,329.63,349.23,392,0,
                 349.23,392,440,523.25,587.33,523.25,440,392,349.23,329.63,293.66,329.63,349.23,392,329.63,0];
  const bass=[130.81,146.83,174.61,196,164.81,146.83,130.81,146.83];
  const now=()=>ctx?ctx.currentTime:0;
  function gain(v=0){const n=ctx.createGain();n.gain.value=v;return n;}
  function oscillator(type,freq){const n=ctx.createOscillator();n.type=type;n.frequency.value=freq;return n;}
  function tone(freq,start,duration=0.15,level=.055,type='sine',destination=master){
    if(!ctx||!freq||!enabled||hidden)return;
    const o=oscillator(type,freq),g=gain(0);
    o.connect(g);g.connect(destination);
    const t=Math.max(now(),start);g.gain.setValueAtTime(0,t);
    g.gain.linearRampToValueAtTime(level,t+.012);
    g.gain.exponentialRampToValueAtTime(.0001,t+duration);
    o.start(t);o.stop(t+duration+.012);
  }
  function createNoise(seconds=2){
    const sampleRate=ctx.sampleRate;
    const b=ctx.createBuffer(1,Math.round(sampleRate*seconds),sampleRate);
    const d=b.getChannelData(0);
    let brown=0;
    for(let i=0;i<d.length;i++){brown=(brown+(.15*(Math.random()*2-1)))/1.018;d[i]=Math.max(-1,Math.min(1,brown*.55));}
    return b;
  }
  function startWaves(){
    const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=gain(.035),lfo=oscillator('sine',.18),depth=gain(.02);
    src.buffer=createNoise();src.loop=true;
    filter.type='lowpass';filter.frequency.value=900;
    src.connect(filter);filter.connect(g);g.connect(master);
    lfo.connect(depth);depth.connect(g.gain);
    src.start();lfo.start();waves={src,lfo,g,filter,depth};
  }
  function stopWaves(){
    if(!waves)return;
    try{waves.src.stop();waves.lfo.stop();}catch(_){}
    for(const n of [waves.src,waves.lfo,waves.g,waves.filter,waves.depth])n.disconnect();
    waves=null;
  }
  function gull(){
    if(!enabled||scene!=='boat'||hidden||!ctx)return;
    const t=now()+.02, g=gain(0),o=oscillator('sine',980);
    o.connect(g);g.connect(master);
    o.frequency.setValueAtTime(980,t);
    o.frequency.exponentialRampToValueAtTime(1570,t+.12);
    o.frequency.exponentialRampToValueAtTime(870,t+.38);
    g.gain.setValueAtTime(.0001,t);
    g.gain.linearRampToValueAtTime(.034,t+.04);
    g.gain.exponentialRampToValueAtTime(.0001,t+.42);
    o.start(t);o.stop(t+.45);
  }
  function startEngine(){
    const lo=oscillator('sawtooth',55),hi=oscillator('triangle',84);
    const filter=ctx.createBiquadFilter(),g=gain(0);
    filter.type='lowpass';filter.frequency.value=250;
    lo.connect(filter);hi.connect(filter);filter.connect(g);g.connect(master);
    lo.start();hi.start();engine={lo,hi,filter,g};
  }
  function stopEngine(){
    if(!engine)return;
    try{engine.lo.stop();engine.hi.stop();}catch(_){}
    for(const n of [engine.lo,engine.hi,engine.filter,engine.g])n.disconnect();
    engine=null;
  }
  function setBoatSpeed(speed){
    if(!engine||!ctx)return;
    const v=Math.max(0,Math.min(1,Number(speed)||0)),t=now();
    // Avstängd när båten står stilla; mjukt högre ton vid större fart.
    engine.lo.frequency.setTargetAtTime(52+v*80,t,.09);
    engine.hi.frequency.setTargetAtTime(77+v*130,t,.09);
    engine.filter.frequency.setTargetAtTime(190+v*500,t,.11);
    engine.g.gain.setTargetAtTime(v<.02?0:.015+.105*v,t,.09);
  }
  function musicTick(){
    if(!enabled||scene!=='land'||hidden)return;
    const i=melodyStep++,t=now()+.015,note=melody[i%melody.length];
    if(note)tone(note,t,.27,.028,'triangle');
    if(i%4===0)tone(bass[(Math.floor(i/4))%bass.length],t,.58,.021,'sine');
    if(i%8===4)tone(261.63,t,.27,.010,'sine');
  }
  function stopScene(){
    if(musicInterval!==null){root.clearInterval(musicInterval);musicInterval=null;}
    if(gullInterval!==null){root.clearInterval(gullInterval);gullInterval=null;}
    stopWaves();stopEngine();
  }
  function startScene(){
    if(!enabled||!ctx||hidden)return;
    if(scene==='boat'){
      startWaves();startEngine();
      gullInterval=root.setInterval(gull,7200);
      gull();
    }else{
      musicTick();
      musicInterval=root.setInterval(musicTick,360);
    }
  }
  function ensureContext(){
    if(!AudioCtor)return false;
    if(!ctx){
      ctx=new AudioCtor();
      master=gain(volume);master.connect(ctx.destination);
    }
    if(ctx.state==='suspended'){const p=ctx.resume();if(p&&p.catch)p.catch(()=>{});}
    return true;
  }
  function enable(){
    if(enabled)return true;
    try{
      if(!ensureContext())return false;
      enabled=true;startScene();
      return true;
    }catch(e){enabled=false;return false;}
  }
  function disable(){
    if(!enabled)return;
    enabled=false;stopScene();
    if(master&&ctx)master.gain.setTargetAtTime(0,now(),.03);
  }
  function toggle(){
    if(enabled){disable();return false;}
    if(master&&ctx)master.gain.setTargetAtTime(volume,now(),.03);
    return enable();
  }
  function setScene(next){
    const newScene=next==='boat'?'boat':'land';
    if(newScene===scene)return;
    stopScene();scene=newScene;startScene();
  }
  function coin(){
    if(!enabled||!ctx||hidden)return;
    const t=now()+.01;
    tone(659.25,t,.12,.065,'square');
    tone(880,t+.09,.15,.064,'square');
    tone(1318.5,t+.19,.22,.045,'sine');
  }
  function hit(){
    if(!enabled||!ctx||hidden)return;
    const t=now()+.01;
    tone(220,t,.14,.07,'triangle');
    tone(164.81,t+.12,.24,.055,'triangle');
  }
  function setVisible(visible){
    hidden=!visible;
    stopScene();
    if(!hidden&&enabled){ensureContext();startScene();}
  }
  function status(){return {enabled,available:!!AudioCtor,scene,hidden,playingMusic:musicInterval!==null,playingWaves:!!waves,playingEngine:!!engine};}
  root.RimforsaAudio={enable,disable,toggle,setScene,setBoatSpeed,coin,hit,setVisible,status};
})(window);
