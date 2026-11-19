/* Originalsyntetiserade spelljud för Lage i Rimforsa. Inga externa ljudfiler eller musikverk används. */
(function (root) {
  'use strict';
  const AudioCtor = root.AudioContext || root.webkitAudioContext;
  let ctx=null,master=null,scene='land',enabled=false,hidden=false;
  let musicInterval=null,gullInterval=null,preschoolInterval=null,engine=null,waves=null,carEngine=null,carActive=false,melodyStep=0,volume=.55,dragonNearby=false;
  const melody=[392,440,523.25,440,392,329.63,349.23,392,440,392,329.63,293.66,329.63,349.23,392,0,
                 349.23,392,440,523.25,587.33,523.25,440,392,349.23,329.63,293.66,329.63,349.23,392,329.63,0];
  // Originalkomponerat molltema med låg bordun för drakens skog.
  const dangerMelody=[196,0,207.65,196,174.61,0,155.56,0,196,233.08,207.65,0,174.61,155.56,146.83,0];
  const dangerBass=[73.42,82.41,69.30,73.42];
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
  // Originalsyntetiserade lekfulla rop och fågelkvitter, utan inspelade barnröster.
  function preschoolSound(){
    if(!enabled||scene!=='preschool'||hidden||!ctx)return;
    const t=now()+.02;
    const pattern=[[784,988,784],[659,880,1046],[988,784,659]][Math.floor(Math.random()*3)];
    pattern.forEach((f,i)=>tone(f,t+i*.13,.17,.016,'sine'));
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
  function startCarEngine(){
    if(carEngine||!enabled||hidden||scene!=='land')return;
    const lo=oscillator('sawtooth',85),hi=oscillator('triangle',125),filter=ctx.createBiquadFilter(),g=gain(0);
    filter.type='lowpass';filter.frequency.value=340;
    lo.connect(filter);hi.connect(filter);filter.connect(g);g.connect(master);
    lo.start();hi.start();carEngine={lo,hi,filter,g};
  }
  function stopCarEngine(){
    if(!carEngine)return;
    try{carEngine.lo.stop();carEngine.hi.stop();}catch(_){}
    for(const n of [carEngine.lo,carEngine.hi,carEngine.filter,carEngine.g])n.disconnect();
    carEngine=null;
  }
  function setCarActive(active){
    carActive=!!active;
    if(!carActive)stopCarEngine();
    else if(enabled&&!hidden&&scene==='land')startCarEngine();
  }
  function setCarSpeed(speed){
    if(!carEngine||!ctx)return;
    const v=Math.max(0,Math.min(1,Number(speed)||0)),t=now();
    carEngine.lo.frequency.setTargetAtTime(70+v*110,t,.08);
    carEngine.hi.frequency.setTargetAtTime(105+v*135,t,.08);
    carEngine.filter.frequency.setTargetAtTime(260+v*550,t,.08);
    carEngine.g.gain.setTargetAtTime(v<.02?0:.014+.07*v,t,.06);
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
    const i=melodyStep++,t=now()+.015;
    if(dragonNearby){
      const note=dangerMelody[i%dangerMelody.length];
      if(note)tone(note,t,.32,.036,'sawtooth');
      if(i%4===0)tone(dangerBass[Math.floor(i/4)%dangerBass.length],t,.78,.035,'triangle');
    }else{
      const note=melody[i%melody.length];
      if(note)tone(note,t,.27,.028,'triangle');
      if(i%4===0)tone(bass[(Math.floor(i/4))%bass.length],t,.58,.021,'sine');
      if(i%8===4)tone(261.63,t,.27,.010,'sine');
    }
  }
  function stopScene(){
    if(musicInterval!==null){root.clearInterval(musicInterval);musicInterval=null;}
    if(gullInterval!==null){root.clearInterval(gullInterval);gullInterval=null;}
    if(preschoolInterval!==null){root.clearInterval(preschoolInterval);preschoolInterval=null;}
    stopWaves();stopEngine();stopCarEngine();
  }
  function startScene(){
    if(!enabled||!ctx||hidden||ctx.state!=='running')return;
    if(scene==='swim'){
      // Badet använder bara mjukt vågskvalp – inga måsar eller motorljud.
      startWaves();
    }else if(scene==='boat'){
      startWaves();startEngine();
      gullInterval=root.setInterval(gull,7200);
      gull();
    }else if(scene==='preschool'){
      preschoolSound();
      preschoolInterval=root.setInterval(preschoolSound,4800);
    }else{
      musicTick();
      musicInterval=root.setInterval(musicTick,360);
      if(carActive)startCarEngine();
    }
  }
  // iOS Safari kan pausa/interruptera AudioContext vid flik- och appbyte.
  // Starta om schemalagda loopar först när ljudmotorn faktiskt kör igen.
  function onContextStateChange(){
    if(!ctx)return;
    if(ctx.state==='running'){
      if(enabled&&!hidden){stopScene();startScene();}
    }else{
      stopScene();
    }
  }
  function ensureContext(){
    if(!AudioCtor)return false;
    if(!ctx){
      ctx=new AudioCtor();
      master=gain(volume);master.connect(ctx.destination);
      ctx.onstatechange=onContextStateChange;
    }
    return true;
  }
  // Anropas bara som följd av ett aktivt fingertryck eller en tangentnedtryckning.
  // Inga försök att kringgå webbläsarens krav på användargest.
  function resumeFromGesture(){
    if(!enabled||hidden||!ctx)return false;
    if(ctx.state==='running')return true;
    if(ctx.state==='closed')return false;
    try{
      const pending=ctx.resume();
      if(pending&&typeof pending.catch==='function')pending.catch(()=>{});
      return true;
    }catch(_){return false;}
  }
  function enable(){
    if(enabled){resumeFromGesture();return true;}
    try{
      if(!ensureContext())return false;
      enabled=true;
      // Vid ett klick på ljudknappen får Safari starta motorn från denna gest.
      // Statechange återbygger ljudscenen när kontexten övergår till running.
      resumeFromGesture();
      if(ctx.state==='running')startScene();
      return true;
    }catch(e){enabled=false;return false;}
  }
  function disable(){
    stopSpeech();
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
    stopSpeech();
    const newScene=['boat','preschool','swim'].includes(next)?next:'land';
    if(newScene===scene)return;
    stopScene();scene=newScene;startScene();
  }
  function setDragonNearby(value){
    const next=!!value;
    if(next===dragonNearby)return;
    dragonNearby=next;melodyStep=0;
  }
  function coin(){
    if(!enabled||!ctx||hidden)return;
    const t=now()+.01;
    tone(659.25,t,.12,.065,'square');
    tone(880,t+.09,.15,.064,'square');
    tone(1318.5,t+.19,.22,.045,'sine');
  }
  function victory(){
    if(!enabled||!ctx||hidden)return;
    const t=now()+.02;
    // Originalskapat fyrtons-firande, efter sista insamlade myntet.
    [523.25,659.25,783.99,1046.5].forEach((f,i)=>tone(f,t+i*.16,.28,.065,'triangle'));
    tone(261.63,t+.48,.6,.035,'sine');
  }
  function hit(){
    if(!enabled||!ctx||hidden)return;
    const t=now()+.01;
    tone(220,t,.14,.07,'triangle');
    tone(164.81,t+.12,.24,.055,'triangle');
  }
  // Originalsyntetiserad kort prutt med oregelbunden baspuls och luftpuff.
  // Ingen extern ljudfil, inga ljud om spelljud är av eller fliken dold.
  function poop(){
    if(!enabled||!ctx||hidden)return;
    const t=now()+.008,duration=.44;
    const osc=oscillator('sawtooth',138),filter=ctx.createBiquadFilter(),body=gain(0);
    const air=ctx.createBufferSource(),airFilter=ctx.createBiquadFilter(),airGain=gain(0);
    filter.type='lowpass';
    filter.frequency.setValueAtTime(620,t);
    filter.frequency.exponentialRampToValueAtTime(145,t+duration);
    osc.frequency.setValueAtTime(138,t);
    osc.frequency.exponentialRampToValueAtTime(61,t+duration);
    osc.connect(filter);filter.connect(body);body.connect(master);
    // Ojämna vibrationer ger en studsande, pruttig rytm i stället för en ren baston.
    for(const [offset,level] of [[0,.0001],[.025,.07],[.075,.025],[.115,.10],[.16,.018],[.205,.095],[.26,.031],[.31,.078],[.37,.015],[duration,.0001]]){
      body.gain.setValueAtTime(level,t+offset);
    }
    air.buffer=createNoise(.5);
    airFilter.type='lowpass';airFilter.frequency.value=850;
    air.connect(airFilter);airFilter.connect(airGain);airGain.connect(master);
    for(const [offset,level] of [[0,.0001],[.035,.018],[.09,.004],[.14,.028],[.19,.003],[.235,.025],[.295,.006],[.345,.019],[duration,.0001]]){
      airGain.gain.setValueAtTime(level,t+offset);
    }
    osc.start(t);air.start(t);
    osc.stop(t+duration+.015);air.stop(t+duration+.015);
    osc.onended=()=>{for(const n of [osc,filter,body])n.disconnect();};
    air.onended=()=>{for(const n of [air,airFilter,airGain])n.disconnect();};
  }
  // Korta originalsyntetiserade händelseljud: rutschkana och hajkollision.
  // Respekterar ljudknappen och dold flik; inga inspelade filer behövs.
  function slideLaunch(){
    if(!enabled||!ctx||hidden)return;
    const t=now()+.01;
    [392,523.25,659.25].forEach((f,i)=>tone(f,t+i*.075,.19,.038,'triangle'));
  }
  function slideLand(){
    if(!enabled||!ctx||hidden)return;
    const t=now()+.01;
    tone(262,t,.09,.044,'triangle');
    tone(392,t+.085,.13,.048,'triangle');
    tone(523.25,t+.17,.22,.04,'sine');
  }
  function sharkBump(){
    if(!enabled||!ctx||hidden)return;
    const t=now()+.01;
    tone(185,t,.16,.06,'sawtooth');
    tone(110,t+.11,.2,.047,'triangle');
  }
  function setVisible(visible){
    if(!visible)stopSpeech();
    hidden=!visible;
    stopScene();
    if(!hidden&&enabled&&ctx&&ctx.state==='running')startScene();
  }
  // Tal startas bara efter spelarens klick och med spelljudet aktiverat.
  // Samma repliker finns alltid kvar som text, även utan svensk systemröst.
  let speechToken=0;
  const npcVoices={
    maja:{rate:1.00,pitch:1.24},
    oliver:{rate:.92,pitch:.91},
    saga:{rate:.95,pitch:1.12}
  };
  function speechMusicVolume(value){
    if(master&&ctx&&enabled){
      master.gain.setTargetAtTime(value,now(),.14);
    }
  }
  function stopSpeech(){
    speechToken++;
    if(root.speechSynthesis&&typeof root.speechSynthesis.cancel==='function'){
      try{root.speechSynthesis.cancel();}catch(_){}
    }
    // Ingen bakgrundsmusik får ligga kvar på nedskruvad nivå efter dialogen.
    speechMusicVolume(volume);
  }
  function speak(text,speaker){
    if(!enabled||hidden||scene!=='land'||!root.speechSynthesis||!root.SpeechSynthesisUtterance)return false;
    const words=String(text||'').trim();
    if(!words)return false;
    stopSpeech();
    const token=speechToken,profile=npcVoices[speaker]||{rate:.91,pitch:1};
    try{
      const utterance=new root.SpeechSynthesisUtterance(words);
      utterance.lang='sv-SE';utterance.rate=profile.rate;utterance.pitch=profile.pitch;utterance.volume=.9;
      const voices=typeof root.speechSynthesis.getVoices==='function'?root.speechSynthesis.getVoices():[];
      const swedish=voices.find(v=>/^sv(?:-|_)/i.test(v.lang));
      if(swedish)utterance.voice=swedish;
      utterance.onstart=()=>{if(token===speechToken)speechMusicVolume(volume*.20);};
      const finish=()=>{if(token===speechToken)speechMusicVolume(volume);};
      utterance.onend=finish;utterance.onerror=finish;
      root.speechSynthesis.speak(utterance);
      return true;
    }catch(_){speechMusicVolume(volume);return false;}
  }
  function status(){return {enabled,available:!!AudioCtor,scene,hidden,playingMusic:musicInterval!==null,playingWaves:!!waves,playingEngine:!!engine,playingCarEngine:!!carEngine,carActive,dragonNearby};}
  root.RimforsaAudio={enable,disable,toggle,resumeFromGesture,setScene,setBoatSpeed,setCarActive,setCarSpeed,setDragonNearby,coin,hit,poop,victory,slideLaunch,slideLand,sharkBump,speak,stopSpeech,setVisible,status};
})(window);
