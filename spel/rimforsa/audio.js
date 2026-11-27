/* Originalsyntetiserade spelljud för Lage i Rimforsa. Inga externa ljudfiler eller musikverk används. */
(function (root) {
  'use strict';
  const AudioCtor = root.AudioContext || root.webkitAudioContext;
  let ctx=null,master=null,scene='land',enabled=false,hidden=false;
  let recoveryNeeded=false, clockSample=null;
  let musicInterval=null,gullInterval=null,preschoolInterval=null,engine=null,waves=null,carEngine=null,carActive=false,melodyStep=0,volume=.55,dragonNearby=false;
  let rotor=null,heliActive=false;
  let sceneStarted=false,resumePending=false,resumeStartedAt=0,resumeSerial=0,resumeFailed=false,startChimePending=false;
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
    if(!ctx||ctx.state!=='running'||!freq||!enabled||hidden)return;
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
    if(!enabled||scene!=='boat'||hidden||!ctx||ctx.state!=='running')return;
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
    if(!enabled||scene!=='preschool'||hidden||!ctx||ctx.state!=='running')return;
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
    if(carEngine||!enabled||hidden||scene!=='land'||!ctx||ctx.state!=='running')return;
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
  function startRotor(){
    if(rotor||!heliActive||!enabled||hidden||scene!=='land'||!ctx||ctx.state!=='running')return;
    const blade=oscillator('sawtooth',72),pulse=oscillator('sine',14),filter=ctx.createBiquadFilter(),g=gain(.036),depth=gain(.025);
    filter.type='lowpass';filter.frequency.value=290;
    blade.connect(filter);filter.connect(g);g.connect(master);
    pulse.connect(depth);depth.connect(g.gain);
    blade.start();pulse.start();rotor={blade,pulse,filter,g,depth};
  }
  function stopRotor(){
    if(!rotor)return;
    try{rotor.blade.stop();rotor.pulse.stop();}catch(_){}
    for(const node of Object.values(rotor))try{node.disconnect();}catch(_){}
    rotor=null;
  }
  function setHeliActive(active){
    heliActive=!!active;
    if(heliActive)startRotor();else stopRotor();
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
    stopWaves();stopEngine();stopCarEngine();stopRotor();
    sceneStarted=false;
  }
  // Safari kan ibland behålla en körande kontext trots att en scenloop
  // har försvunnit. Återskapa i så fall scenen vid nästa spelgest,
  // men låt en redan komplett scen fortsätta utan dubbla timers.
  function sceneHealthy(){
    if(!sceneStarted)return false;
    if(scene==='boat')return !!waves&&!!engine&&gullInterval!==null;
    if(scene==='swim')return !!waves;
    if(scene==='preschool')return preschoolInterval!==null;
    return musicInterval!==null&&(!carActive||!!carEngine)&&(!heliActive||!!rotor);
  }
  function restoreSceneFromGesture(){
    if(!enabled||hidden||!ctx||ctx.state!=='running')return;
    if(!sceneHealthy())stopScene();
    startScene();
  }
  function startScene(){
    if(sceneStarted||!enabled||!ctx||hidden||ctx.state!=='running')return;
    sceneStarted=true;
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
      if(heliActive)startRotor();
    }
  }
  function notifyAudioState(){
    if(typeof root.dispatchEvent==='function'&&typeof root.Event==='function'){
      root.dispatchEvent(new root.Event('rimforsa-audio-state'));
    }
  }
  // iOS Safari kan pausa/interruptera AudioContext vid flik- och appbyte.
  // Starta om schemalagda loopar först när ljudmotorn faktiskt kör igen.
  // Bekräftelsen hör till ett aktivt på-tryck, aldrig till flikbyte.
  // Den schemaläggs först när AudioContext verkligen är running.
  function confirmEnabledSound(){
    if(!startChimePending||!enabled||hidden||!ctx||ctx.state!=='running')return;
    startChimePending=false;
    const t=now()+.025;
    tone(659.25,t,.12,.027,'triangle');
    tone(880,t+.13,.19,.029,'triangle');
  }
  function onContextStateChange(event){
    // Fördröjda events från en stängd Safari-kontext får inte ändra ny motor.
    if(!ctx||(event&&event.target&&event.target!==ctx))return;
    // Behåll resumePending tills det pågående resume()-löftet har avslutats.
    // En statechange till interrupted/suspended får inte starta flera samtidiga resume-anrop.
    if(ctx.state==='running'){
      // Starta bara om om ingen aktiv scen finns; både resume() och enable()
      // kan ge en statechange på iOS, ibland efter att ljudet redan startat.
      if(enabled&&!hidden){
        // En running-kontext kan sakna en timer eller motor efter iOS-avbrott.
        // Återställ då enbart den trasiga scenen; friska scener får ingen dublett.
        if(!sceneHealthy())stopScene();
        startScene();confirmEnabledSound();
      }
    }else{
      // En avbruten WebAudio-kontext ska inte lämna kvar en talröst
      // eller bakgrundsmusiken nedskruvad efter app-/flikbyte i Safari.
      stopSpeech();
      stopScene();
    }
    // Safari resolves resume() asynchronously. Refresh the visible sound button
    // when the actual context state changes, rather than after the initial tap only.
    notifyAudioState();
  }
  // En fastnad eller avstängd Safari-kontext ska inte kunna förgifta nästa
  // ljudstart. Stäng den gamla motorn, stoppa dess loopar och ignorera sena
  // resume()-löften innan en ny skapas under nästa riktiga användargest.
  function disposeContext(){
    stopScene();
    if(ctx){
      const oldContext=ctx;
      oldContext.onstatechange=null;
      if(master){try{master.disconnect();}catch(_){}}
      if(oldContext.state!=='closed'&&typeof oldContext.close==='function'){
        try{
          const closing=oldContext.close();
          if(closing&&typeof closing.catch==='function')closing.catch(()=>{});
        }catch(_){}
      }
    }
    ctx=null;master=null;clockSample=null;resumePending=false;resumeStartedAt=0;resumeFailed=false;resumeSerial++;
  }
  function ensureContext(){
    if(!AudioCtor)return false;
    // En redan stängd kontext kan inte återupptas, inte ens på iOS.
    if(ctx&&ctx.state==='closed')disposeContext();
    if(!ctx){
      ctx=new AudioCtor();
      master=gain(enabled?volume:0);master.connect(ctx.destination);
      ctx.onstatechange=onContextStateChange;
    }
    return true;
  }
  // Äldre mobil-Safari kan behöva en faktisk source.start() i samma
  // användargest som resume(). Spela EN tyst sample utan hörbart ljud.
  // Ingen timer, ingen automatisk unlock vid pageshow/visibilitychange.
  function primeFromGesture(){
    if(!ctx||ctx.state==='closed'||!master)return;
    try{
      const source=ctx.createBufferSource();
      source.buffer=ctx.createBuffer(1,1,ctx.sampleRate);
      source.connect(master);
      source.onended=()=>{try{source.disconnect();}catch(_){}};
      source.start(0);
    }catch(_){}
  }
  // Anropas bara som följd av ett aktivt fingertryck eller en tangentnedtryckning.
  // Inga försök att kringgå webbläsarens krav på användargest.
  function resumeFromGesture(){
    if(!enabled||hidden)return false;
    if(!ctx||ctx.state==='closed'){
      try{if(!ensureContext())return false;}catch(_){return false;}
    }
    // A returning iOS page may report running while its output is silent.
    // Recreate once, synchronously in a real gesture, never from a timer.
    if(recoveryNeeded){recoveryNeeded=false;disposeContext();try{if(!ensureContext())return false;}catch(_){return false;}}
    if(ctx.state==='running'){
      const stamp=Date.now(), t=ctx.currentTime;
      if(clockSample&&stamp-clockSample.stamp>=1500&&t-clockSample.t<.02){
        disposeContext();try{if(!ensureContext())return false;}catch(_){return false;}
      }else{
        if(!clockSample||t>clockSample.t+.02)clockSample={stamp,t};
        resumeFailed=false;restoreSceneFromGesture();confirmEnabledSound();return true;
      }
    }
    // Ett avslutat resume()-löfte kan lämna Safari kvar i suspended/interrupted.
    // Först NÄSTA användargest återskapar då kontexten, utan automatisk uppspelning.
    if(resumeFailed){
      disposeContext();
      try{if(!ensureContext())return false;}catch(_){return false;}
    }
    // Safari kan lämna resume() olöst, eller lösa det utan att kontexten
    // faktiskt börjar köra. Efter 2,5 sekunder bygger NÄSTA användargest
    // om en fastnad motor i stället för att prova samma trasiga kontext igen.
    if(resumeStartedAt&&Date.now()-resumeStartedAt>=2500){
      disposeContext();
      try{if(!ensureContext())return false;}catch(_){return false;}
    }else if(resumePending){
      // Inom tidsfönstret kan en andra gest hjälpa den första upplåsningen
      // utan att två samtidiga resume()-anrop skickas.
      primeFromGesture();
      return false;
    }
    try{
      resumePending=true;resumeStartedAt=Date.now();resumeFailed=false;
      const attempt=++resumeSerial;
      const resumingContext=ctx;
      // Start within the actual gesture before calling asynchronous resume().
      primeFromGesture();
      const pending=resumingContext.resume();
      if(pending&&typeof pending.then==='function'){
        pending.then(()=>{
          // Stale Promise från en äldre kontext får inte nollställa ny resume.
          if(ctx!==resumingContext||attempt!==resumeSerial)return;
          resumePending=false;
          resumeStartedAt=0; // Ett avslutat försök är inte en fastnad Safari-upplåsning.
          if(ctx.state==='running'&&enabled&&!hidden){startScene();confirmEnabledSound();}
          else if(ctx.state!=='running')resumeFailed=true;
          notifyAudioState();
        },()=>{
          if(ctx!==resumingContext||attempt!==resumeSerial)return;
          resumePending=false;
          resumeStartedAt=0;
          resumeFailed=true;
          notifyAudioState();
        });
      }else if(ctx===resumingContext&&attempt===resumeSerial){
        resumePending=false;
        resumeStartedAt=0;
        if(ctx.state!=='running')resumeFailed=true;
      }
      return true;
    }catch(_){resumePending=false;resumeStartedAt=0;resumeFailed=true;return false;}
  }
  function enable(){
    if(enabled){resumeFromGesture();return true;}
    try{
      if(!ensureContext())return false;
      // Restore volume even if sound was previously disabled outside toggle().
      master.gain.setTargetAtTime(volume,now(),.03);
      enabled=true;startChimePending=true;
      // Vid ett klick på ljudknappen får Safari starta motorn från denna gest.
      // Statechange återbygger ljudscenen när kontexten övergår till running.
      resumeFromGesture();
      if(ctx.state==='running'){startScene();confirmEnabledSound();}
      return true;
    }catch(e){enabled=false;disposeContext();return false;}
  }
  function disable(){
    stopSpeech();
    enabled=false;startChimePending=false;recoveryNeeded=false;
    // Av/på-knappen fungerar även som en riktig återställning när Safari
    // rapporterar "running" men högtalaren ändå har blivit tyst efter appbyte.
    // Nästa På-tryck skapar en fräsch motor direkt från klickets användargest.
    disposeContext();
  }
  function toggle(){
    if(enabled){disable();return false;}
    return enable();
  }
  function setScene(next){
    const newScene=['boat','preschool','swim'].includes(next)?next:'land';
    if(newScene===scene){
      // Scene selection can be repeated after a Safari interruption.
      // Resume only when the context really runs; do not duplicate loops.
      if(!sceneStarted)startScene();
      return;
    }
    // A real scene transition ends the old NPC line; a repeated scene
    // selection must not cut off speech already playing on mobile Safari.
    stopSpeech();
    stopScene();scene=newScene;startScene();
  }
  function setDragonNearby(value){
    const next=!!value;
    if(next===dragonNearby)return;
    dragonNearby=next;melodyStep=0;
  }
  function iceShoot(){
    if(!enabled||!ctx||hidden||ctx.state!=='running')return;
    const t=now()+.01;
    tone(1046.5,t,.055,.055,'triangle');
    tone(1568,t+.035,.09,.04,'sine');
    tone(2093,t+.07,.12,.025,'sine');
  }
  function dragonIceHit(){
    if(!enabled||!ctx||hidden||ctx.state!=='running')return;
    const t=now()+.01;
    tone(196,t,.16,.075,'sawtooth');
    tone(1174.66,t,.07,.045,'triangle');
    tone(783.99,t+.06,.13,.04,'square');
    tone(130.81,t+.12,.22,.04,'triangle');
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
  // Tre korta originalsyntetiserade återkopplingsljud: köp, tankning och grundstötning.
  // Återanvänder upplåst WebAudio-motor och respekterar ljudknapp/flikstatus.
  function purchase(){
    if(!enabled||!ctx||hidden||ctx.state!=='running')return;
    const t=now()+.01;
    tone(523.25,t,.11,.038,'triangle');
    tone(659.25,t+.09,.13,.042,'triangle');
    tone(783.99,t+.19,.19,.036,'sine');
  }
  // Snabba upprepade pektryck får inte stapla varningssignaler ovanpå varandra.
  // Använd ljudkontextens klocka och återställ spärren när Safari skapar en ny kontext.
  let warningContext=null;
  const warningLast={};
  function allowWarning(kind,seconds){
    if(warningContext!==ctx){warningContext=ctx;warningLast.route=-Infinity;warningLast.purchase=-Infinity;}
    const t=now();
    if(t-warningLast[kind]<seconds)return false;
    warningLast[kind]=t;
    return true;
  }
  // Kort låg dubbelton för ett aktivt köp som inte kan genomföras.
  // Spelas aldrig automatiskt eller när ljudmotorn är pausad.
  function purchaseDenied(){
    if(!enabled||hidden||!ctx||ctx.state!=='running'||!allowWarning('purchase',.32))return;
    const t=now()+.01;
    tone(246.94,t,.10,.025,'triangle');
    tone(185,t+.105,.15,.022,'sine');
  }
  function fuelFill(){
    if(!enabled||!ctx||hidden||ctx.state!=='running')return;
    const t=now()+.01;
    for(let i=0;i<4;i++)tone(155+i*37,t+i*.075,.10,.031,'triangle');
    tone(523.25,t+.32,.20,.042,'sine');
  }
  // Fotbollens tre separata, korta originalsyntetiserade återkopplingar.
  // Inga ljud spelas när ljudet är av, sidan dold eller Safari-kontexten pausad.
  function footballKick(){
    if(!enabled||!ctx||hidden||ctx.state!=='running')return;
    const t=now()+.006;
    const o=oscillator('triangle',160),g=gain(0);
    o.connect(g);g.connect(master);
    o.frequency.setValueAtTime(160,t);
    o.frequency.exponentialRampToValueAtTime(70,t+.11);
    g.gain.setValueAtTime(.0001,t);
    g.gain.linearRampToValueAtTime(.085,t+.012);
    g.gain.exponentialRampToValueAtTime(.0001,t+.12);
    o.start(t);o.stop(t+.13);
    o.onended=()=>{o.disconnect();g.disconnect();};
  }
  function footballSave(){
    if(!enabled||!ctx||hidden||ctx.state!=='running')return;
    const t=now()+.008;
    tone(310,t,.09,.042,'square');
    tone(230,t+.065,.16,.032,'triangle');
  }
  function footballGoal(){
    if(!enabled||!ctx||hidden||ctx.state!=='running')return;
    const t=now()+.012;
    [392,523.25,659.25,783.99,1046.5].forEach((f,i)=>tone(f,t+i*.105,.21,.044,'triangle'));
    tone(261.63,t+.38,.46,.026,'sine');
  }
  function boatTreasure(){
    if(!enabled||!ctx||hidden||ctx.state!=='running')return;
    const t=now()+.01;
    [523.25,659.25,880,1174.66].forEach((f,i)=>tone(f,t+i*.11,.19,.039,'square'));
    tone(440,t+.38,.38,.024,'sine');
  }
  // Originalsyntetiserad kort återkoppling när Lage sätter sig i bilen.
  function carEnter(){
    if(!enabled||hidden||!ctx||ctx.state!=='running')return;
    const t=now()+.012;
    tone(310,t,.085,.034,'triangle');
    tone(246.94,t+.072,.12,.041,'square');
    tone(196,t+.16,.13,.032,'triangle');
  }
  // Ljust fyndljud för nya föremål i väskan – skiljs från myntljudet.
  function itemFound(){
    if(!enabled||hidden||!ctx||ctx.state!=='running')return;
    const t=now()+.012;
    tone(587.33,t,.13,.035,'sine');
    tone(783.99,t+.11,.18,.045,'triangle');
    tone(1174.66,t+.24,.24,.029,'sine');
  }
  // Drakeld träffar parkerad helikopter: dov smäll + kort metallisk efterklang.
  function helicopterHit(){
    if(!enabled||hidden||!ctx||ctx.state!=='running')return;
    const t=now()+.008;
    tone(110,t,.19,.065,'sawtooth');
    tone(73.42,t+.07,.25,.052,'triangle');
    tone(523.25,t+.12,.10,.023,'square');
    tone(392,t+.23,.16,.018,'sine');
  }
  // Diskret dialogsignal när Lage pratar med en figur. Även när svensk
  // talsyntes saknas hörs en kort, egenkomponerad bekräftelse.
  // Spelas bara vid interaktion och när WebAudio redan är upplåst.
  function npcTalk(){
    if(!enabled||hidden||!ctx||ctx.state!=='running')return;
    const t=now()+.008;
    tone(587.33,t,.075,.018,'triangle');
    tone(739.99,t+.07,.10,.015,'sine');
  }
  // Tre korta originalsyntetiserade gränssnitts-/äventyrsljud.
  // Används endast när spelaren själv öppnar väska, karta eller båtspel.
  function bagOpen(){
    if(!enabled||hidden||!ctx||ctx.state!=='running')return;
    const t=now()+.01;
    tone(293.66,t,.09,.029,'triangle');
    tone(440,t+.075,.12,.031,'sine');
  }
  function mapOpen(){
    if(!enabled||hidden||!ctx||ctx.state!=='running')return;
    const t=now()+.01;
    tone(392,t,.09,.025,'square');
    tone(523.25,t+.08,.12,.028,'triangle');
    tone(659.25,t+.17,.15,.022,'sine');
  }
  function boatLaunch(){
    if(!enabled||hidden||!ctx||ctx.state!=='running')return;
    const t=now()+.01;
    tone(164.81,t,.13,.043,'triangle');
    tone(196,t+.11,.15,.039,'triangle');
    tone(261.63,t+.24,.20,.030,'sine');
  }
  // Tre små originalsyntetiserade bekräftelseljud vid tydliga spelarhandlingar.
  function potatoSale(){
    if(!enabled||hidden||!ctx||ctx.state!=='running')return;
    const t=now()+.01;
    tone(440,t,.11,.032,'triangle');
    tone(659.25,t+.11,.13,.040,'square');
    tone(880,t+.24,.19,.030,'sine');
  }
  function carExit(){
    if(!enabled||hidden||!ctx||ctx.state!=='running')return;
    const t=now()+.01;
    tone(280,t,.08,.035,'triangle');
    tone(180,t+.065,.16,.026,'square');
  }
  function bagClear(){
    if(!enabled||hidden||!ctx||ctx.state!=='running')return;
    const t=now()+.01;
    tone(523.25,t,.10,.026,'sine');
    tone(392,t+.09,.11,.024,'triangle');
    tone(261.63,t+.18,.17,.022,'sine');
  }
  // Korta egenkomponerade signaler för tre tydliga spelhändelser.
  // Alla använder den befintliga ljudknappen och samma WebAudio-master.
  // Korta originalsyntetiserade startljud, enbart från spelarens knappar.
  // Spelas inte när ljudet är av eller Safari-kontexten är pausad.
  function newHunt(){
    if(!enabled||hidden||!ctx||ctx.state!=='running')return;
    const t=now()+.012;
    tone(392,t,.10,.027,'triangle');
    tone(523.25,t+.10,.14,.031,'triangle');
    tone(659.25,t+.23,.20,.029,'sine');
  }
  function boatRetry(){
    if(!enabled||hidden||!ctx||ctx.state!=='running')return;
    const t=now()+.012;
    tone(196,t,.12,.027,'triangle');
    tone(293.66,t+.13,.13,.031,'square');
    tone(392,t+.27,.18,.025,'sine');
  }
  function gameOver(){
    if(!enabled||hidden||!ctx||ctx.state!=='running')return;
    const t=now()+.015;
    [392,311.13,246.94,196].forEach((f,i)=>tone(f,t+i*.15,.18,.040,'triangle'));
    tone(130.81,t+.47,.36,.024,'sine');
  }
  function shopEnter(){
    if(!enabled||hidden||!ctx||ctx.state!=='running')return;
    const t=now()+.012;
    tone(659.25,t,.085,.023,'triangle');
    tone(880,t+.10,.13,.027,'sine');
  }
  function mapClose(){
    if(!enabled||hidden||!ctx||ctx.state!=='running')return;
    const t=now()+.01;
    tone(523.25,t,.085,.018,'triangle');
    tone(392,t+.07,.12,.022,'sine');
  }
  // Två låga, avtagande tonsteg när en utpekad gångväg inte är möjlig.
  // Originalsyntes, ingen automatisk uppspelning eller ny ljudmotor.
  function routeBlocked(){
    if(!enabled||hidden||!ctx||ctx.state!=='running'||!allowWarning('route',.32))return;
    const t=now()+.008;
    tone(293.66,t,.11,.023,'triangle');
    tone(196,t+.11,.16,.019,'sine');
  }
  // Tre diskreta originalsignaler för att lämna miljöer och välja väg.
  // Spelas bara när ljudet är på och AudioContext är aktiv.
  function boatReturn(){
    if(!enabled||hidden||!ctx||ctx.state!=='running')return;
    const t=now()+.01;
    tone(329.63,t,.10,.030,'triangle');
    tone(261.63,t+.09,.13,.024,'sine');
    tone(196,t+.19,.17,.018,'sine');
  }
  function shopExit(){
    if(!enabled||hidden||!ctx||ctx.state!=='running')return;
    const t=now()+.01;
    tone(587.33,t,.08,.019,'triangle');
    tone(392,t+.075,.13,.018,'sine');
  }
  function routeSelected(){
    if(!enabled||hidden||!ctx||ctx.state!=='running')return;
    const t=now()+.01;
    tone(440,t,.075,.020,'square');
    tone(659.25,t+.075,.13,.021,'triangle');
  }
  // Diskreta originalsyntetiserade signaler för väska och bensinmack.
  // Spelas endast när ljudmotorn faktiskt kör; inga externa ljudfiler.
  function bagClose(){
    if(!enabled||hidden||!ctx||ctx.state!=='running')return;
    const t=now()+.01;
    tone(392,t,.085,.024,'triangle');
    tone(293.66,t+.08,.12,.019,'sine');
  }
  function fuelStationEnter(){
    if(!enabled||hidden||!ctx||ctx.state!=='running')return;
    const t=now()+.01;
    tone(329.63,t,.09,.022,'square');
    tone(440,t+.09,.12,.025,'triangle');
    tone(554.37,t+.19,.16,.020,'sine');
  }
  // Potatislandets egna subtila originalsyntetiserade ljud.
  // Spela bara efter lyckad plantering/skörd, inte för spärrade knappar.
  function potatoPlant(){
    if(!enabled||hidden||!ctx||ctx.state!=='running')return;
    const t=now()+.01;
    tone(220,t,.09,.024,'triangle');
    tone(164.81,t+.08,.15,.025,'sine');
    tone(130.81,t+.16,.13,.017,'triangle');
  }
  function potatoHarvest(){
    if(!enabled||hidden||!ctx||ctx.state!=='running')return;
    const t=now()+.01;
    tone(392,t,.095,.025,'triangle');
    tone(523.25,t+.10,.11,.034,'square');
    tone(659.25,t+.20,.20,.030,'sine');
  }
  // Förskolans rutschkana: ett kort satsljud och en separat långhoppsfanfar.
  // Spelas endast från användargest respektive nytt intjänat bonusmynt.
  function slideCharge(){
    if(!enabled||hidden||!ctx||ctx.state!=='running')return;
    const t=now()+.008;
    tone(220,t,.07,.022,'triangle');
    tone(277.18,t+.07,.10,.024,'sine');
  }
  function slideLongJump(){
    if(!enabled||hidden||!ctx||ctx.state!=='running')return;
    const t=now()+.01;
    [523.25,659.25,783.99,1046.5].forEach((f,i)=>tone(f,t+i*.105,.20,.035,'triangle'));
    tone(392,t+.34,.29,.022,'sine');
  }
  function boatGrounding(){
    if(!enabled||!ctx||hidden||ctx.state!=='running')return;
    const t=now()+.01;
    tone(165,t,.16,.072,'sawtooth');
    tone(117,t+.085,.22,.052,'triangle');
    tone(82.41,t+.20,.24,.035,'sine');
  }
  // Tom tank redan vid ett aktivt start-/påstigningsförsök.
  // Två mjuka pulser skiljer sig från bränslestopp under körning.
  function fuelEmpty(){
    if(!enabled||hidden||!ctx||ctx.state!=='running')return;
    const t=now()+.012;
    tone(220,t,.12,.026,'triangle');
    tone(185,t+.19,.17,.024,'sine');
  }
  // En kort, låg varningssignal när båten kör slut på sitt bränsle.
  // Utlöses endast vid övergång från bensin kvar till tom tank.
  function boatOutOfFuel(){
    if(!enabled||hidden||!ctx||ctx.state!=='running')return;
    const t=now()+.012;
    tone(294,t,.12,.035,'triangle');
    tone(220,t+.15,.15,.039,'triangle');
    tone(147,t+.34,.22,.029,'sine');
  }
  // Kort originalsyntetiserad välkomstfanfar vid en ny ort i regionutflykten.
  // Enbart vid första ankomst, aldrig på automatisk flikåterkomst.
  function regionArrival(){
    if(!enabled||hidden||!ctx||ctx.state!=='running')return;
    const t=now()+.01;
    tone(392,t,.11,.034,'triangle');
    tone(523.25,t+.12,.13,.036,'triangle');
    tone(659.25,t+.25,.18,.033,'sine');
    tone(783.99,t+.43,.26,.027,'sine');
  }
  function setVisible(visible){
    const nextHidden=!visible;
    // Safari kan skicka pageshow och visibilitychange för samma återkomst.
    // Starta inte om en redan körande scen vid en sådan dubbel signal.
    if(hidden===nextHidden){
      if(!hidden&&enabled&&ctx&&ctx.state==='running'){
        if(!sceneHealthy())stopScene();
        startScene();
      }
      return;
    }
    if(nextHidden){stopSpeech();if(enabled&&ctx)recoveryNeeded=true;}
    hidden=nextHidden;
    stopScene();
    if(!hidden&&enabled&&ctx&&ctx.state==='running'){
        if(!sceneHealthy())stopScene();
        startScene();
      }
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
    if(!enabled||hidden||scene!=='land'||!ctx||ctx.state!=='running'||!root.speechSynthesis||!root.SpeechSynthesisUtterance)return false;
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
  function status(){return {enabled,available:!!AudioCtor,contextState:ctx?ctx.state:'not-created',recoveryNeeded,clock:ctx?ctx.currentTime:0,scene,hidden,sceneStarted,playingMusic:musicInterval!==null,playingWaves:!!waves,playingEngine:!!engine,playingCarEngine:!!carEngine,playingRotor:!!rotor,heliActive,carActive,dragonNearby};}
  root.RimforsaAudio={enable,disable,toggle,resumeFromGesture,setScene,setBoatSpeed,setCarActive,setCarSpeed,setHeliActive,setDragonNearby,iceShoot,dragonIceHit,coin,hit,poop,victory,slideLaunch,slideLand,slideCharge,slideLongJump,sharkBump,purchase,purchaseDenied,fuelFill,fuelEmpty,boatGrounding,boatOutOfFuel,regionArrival,carEnter,itemFound,helicopterHit,footballKick,footballSave,footballGoal,boatTreasure,npcTalk,bagOpen,bagClose,fuelStationEnter,mapOpen,boatLaunch,potatoSale,carExit,bagClear,newHunt,boatRetry,gameOver,shopEnter,mapClose,boatReturn,shopExit,routeSelected,routeBlocked,potatoPlant,potatoHarvest,speak,stopSpeech,setVisible,status};
})(window);
