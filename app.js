"use strict";
(function(){
  const STORAGE_KEY="hemmakompassen-demo-v1";
  const NAV=[
    ["hem","Hem","home"],
    ["inkorg","Inkorg","message"],
    ["swipe","Gillaswajpen","heart"],
    ["personlighet","Min personlighet","brain"],
    ["kommunikation","Kommunikationsråd","book"],
    ["regler","Schyssta listan","list"],
    ["medlare","AI-medlaren","sparkles"]
  ];
  const STATEMENTS=[
    ["Relationer","Jag uppskattar när vi gör saker tillsammans utan mobiltelefoner."],
    ["Samtal","Jag vill helst prata färdigt innan någon kommer med råd."],
    ["Vardag","Jag behöver få vara ifred ibland, även när jag är hemma."],
    ["Känslor","Jag tycker det är lätt att säga hur jag mår."],
    ["Relationer","Jag känner mig lyssnad på när vi är oense."],
    ["Vardag","Jag vill vara med och bestämma över regler som gäller mig."],
    ["Samtal","När vi bråkar behöver jag tid innan jag kan prata igen."],
    ["Fritid","Jag tycker det är viktigt att vi har gemensamma aktiviteter."],
    ["Känslor","Jag kan berätta när jag har gjort något som jag ångrar."],
    ["Relationer","Jag vill att vi visar mer uppskattning i vardagen."],
    ["Vardag","Jag mår bra av tydliga överenskommelser hemma."],
    ["Samtal","Jag vill kunna be om hjälp utan att bli bedömd."],
    ["Relationer","Vi brukar kunna skratta tillsammans även när vi tycker olika."],
    ["Känslor","Jag önskar att vi pratade mer om sådant som är svårt."]
  ];
  const ITEMS=[
    ["E","Jag trivs när jag får träffa nya människor.",false],
    ["E","Jag föredrar nästan alltid att vara för mig själv.",true],
    ["E","Jag tar gärna initiativ i en grupp.",false],
    ["A","Jag försöker förstå andras perspektiv.",false],
    ["A","Jag har svårt att känna med andra när de är ledsna.",true],
    ["A","Jag vill helst samarbeta hellre än konkurrera.",false],
    ["C","Jag planerar gärna innan jag börjar med något.",false],
    ["C","Jag skjuter ofta upp sådant jag behöver göra.",true],
    ["C","Jag brukar fullfölja det jag har påbörjat.",false],
    ["N","Jag oroar mig ofta för sådant som kan gå fel.",false],
    ["N","Jag brukar känna mig lugn även när det är stressigt.",true],
    ["N","Jag blir lätt påverkad av motgångar.",false],
    ["O","Jag tycker om att pröva nya idéer.",false],
    ["O","Jag håller helst fast vid sådant som är välbekant.",true],
    ["O","Jag är nyfiken på hur andra människor tänker.",false]
  ];
  const TRAITS=[
    ["E","Utåtriktning","Social energi och initiativ"],
    ["A","Vänlighet","Samarbete och omtanke"],
    ["C","Målmedvetenhet","Planering och genomförande"],
    ["N","Känslomässig reaktivitet","Hur starkt stress och oro påverkar dig"],
    ["O","Öppenhet","Nyfikenhet och nya perspektiv"]
  ];
  const GUIDES=[
    {title:"Vi har svårt att lyssna",intro:"När båda vill bli förstådda kan samtalet lätt bli en tävling om att få rätt.",tips:["Försök återge vad den andra menade innan du svarar.","Ställ en nyfiken fråga, till exempel: Vad är det viktigaste för dig här?","Kom överens om att den som lyssnar inte måste hålla med."]},
    {title:"Vi bråkar om regler",intro:"Regelkonflikter handlar ofta både om praktiska behov och om självständighet.",tips:["Beskriv konkret vad som behöver fungera hemma.","Låt båda formulera vad de vill skydda: frihet, trygghet, sömn eller tillit.","Skriv ett tidsbegränsat förslag i Schyssta listan och utvärdera tillsammans."]},
    {title:"Vi har hamnat i ett gräl",intro:"Det kan vara svårt att lösa problem när stressen redan är hög.",tips:["Ta en överenskommen paus och säg när du kommer tillbaka.","Börja senare med att beskriva vad som hände utan anklagelser.","Fråga vad var och en skulle behöva nästa gång."]},
    {title:"Vi pratar nästan aldrig",intro:"Kontakt kan ibland börja i små, kravlösa stunder.",tips:["Föreslå tio minuter tillsammans utan mål att lösa något.","Ställ en fråga från Gillaswajpen och var nyfiken på svaret.","Försök skilja mellan att vara tillsammans och att prestera ett bra samtal."]}
  ];
  const COMM_STEPS=[
    ["Beskriv vad du såg","Beskriv en konkret situation utan att tolka den andras avsikt.","När jag märkte att ..."],
    ["Sätt ord på känslan","Berätta om din egen reaktion, inte vad den andra är för slags person.","... kände jag ..."],
    ["Utforska behovet","Vad var viktigt för dig i situationen?","... eftersom jag behöver ..."],
    ["Be om något konkret","Formulera en möjlig och frivillig önskan.","Skulle vi kunna ...?"]
  ];
  function newState(){return {version:1,onboarded:false,role:"teen",profiles:{teen:{name:""},parent:{name:""}},swipes:{teen:{},parent:{}},personality:{teen:{},parent:{}},messages:[],rules:[]};}
  let S=newState();
  try{const x=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");if(x&&x.version===1&&x.profiles&&x.swipes&&x.personality&&Array.isArray(x.messages)&&Array.isArray(x.rules)){S=x;if(typeof S.onboarded!=="boolean")S.onboarded=true;}}catch(e){}
  let swipeHistory=[];
  let activeGuide=-1;
  let exerciseOutput="";
  const $=sel=>document.querySelector(sel);
  const esc=str=>String(str==null?"":str).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const ico=(name,extra)=>'<svg class="icon '+(extra||"")+'" aria-hidden="true"><use href="#i-'+name+'"></use></svg>';
  const other=()=>S.role==="teen"?"parent":"teen";
  const roleName=r=>r==="teen"?"Tonåring":"Förälder";
  const displayName=r=>(S.profiles[r]&&S.profiles[r].name)||roleName(r);
  const countUnread=()=>S.messages.filter(m=>m.to===S.role&&!m.read).length;
  const swipeCount=r=>Object.keys(S.swipes[r]||{}).length;
  const personalityCount=r=>Object.keys(S.personality[r]||{}).length;
  const isBoth=()=>!!(S.profiles.parent.name&&S.profiles.teen.name);
  const page=()=>{const hash=decodeURIComponent(location.hash.slice(1));const p=NAV.some(n=>n[0]===hash)||["installningar","kom-igang","familj"].includes(hash)?hash:"hem";return p==="hem"&&!S.onboarded?"kom-igang":p;};
  const persist=()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(S));}catch(e){toast("Webbläsaren kunde inte spara demodata.");}};
  let toastTimer;
  function toast(msg){const t=$("#toast");if(!t)return;t.textContent=msg;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),3400);}
  function navMarkup(mobile){return NAV.map(([key,label,icon])=>'<button class="nav-item '+(page()===key?"active":"")+'" data-page="'+key+'" '+(page()===key?'aria-current="page"':"")+'>'+ico(icon)+'<span>'+label+'</span>'+(key==="inkorg"&&countUnread()?'<span class="nav-count">'+countUnread()+'</span>':"")+'</button>').join("");}
  function header(title,description,kicker){return '<section class="page-lead"><span class="eyebrow">'+esc(kicker||"ERT GEMENSAMMA RUM")+'</span><h1>'+esc(title)+'</h1><p>'+esc(description||"")+'</p></section>';}
  function sectionTitle(title,route,text){return '<div class="section-title"><h2>'+esc(title)+'</h2>'+(route?'<button class="quiet-link" data-page="'+route+'">'+esc(text||"Visa alla")+' '+ico("arrow")+'</button>':"")+'</div>';}
  function card(route,icon,title,copy,blue){return '<button class="feature-card" data-page="'+route+'"><span class="feature-icon '+(blue?"blue":"")+'">'+ico(icon)+'</span><h3>'+esc(title)+'</h3><p>'+esc(copy)+'</p>'+ico("arrow")+'</button>';}

  function sharingRows(){
    return '<div class="policy-list">'+[
      ["Gillaswajpen","Delas mellan paret"],
      ["Personlighetstest","Delas mellan paret"],
      ["Schyssta listan","Gemensamt innehåll"],
      ["Inkorg","Endast avsändare och mottagare"],
      ["AI-medlarens samtal","Privat för varje konto"]
    ].map(([name,scope])=>'<div class="policy-row"><span>'+esc(name)+'</span><strong>'+esc(scope)+'</strong></div>').join("")+'</div>';
  }
  function renderWelcome(){
    return '<section class="welcome-intro"><span class="eyebrow">VÄLKOMMEN TILL HEMMAKOMPASSEN</span><h1>Ett rum för <em>större förståelse.</em></h1><p>En gemensam väg mot mer nyfikenhet, öppnare samtal och färre missförstånd. Börja med att välja vilken vy du vill prova.</p><div class="welcome-values"><span>'+ico("heart")+' Lyssna</span><span>'+ico("message")+' Förstå</span><span>'+ico("sparkles")+' Mötas</span></div></section>'+
      '<div class="welcome-columns"><section class="panel welcome-card"><span class="eyebrow">UTFORSKA APPEN</span><h2>Vem är du?</h2><p>Detta skapar en demoprofil på just den här enheten – inte ett riktigt konto.</p><form id="onboarding-form">'+
      '<fieldset class="role-chooser"><legend class="field-label">Jag vill prova som</legend>'+
      '<label><input name="first-role" type="radio" value="teen" checked><span>'+ico("heart")+' Tonåring<small>För dig som vill bli lyssnad på.</small></span></label>'+
      '<label><input name="first-role" type="radio" value="parent"><span>'+ico("user")+' Förälder<small>För dig som vill förstå bättre.</small></span></label></fieldset>'+
      '<div class="field"><label for="first-name">Visningsnamn (valfritt)</label><input id="first-name" maxlength="32" autocomplete="off" placeholder="Exempel: Alex"></div>'+
      '<button class="btn btn-primary btn-block" type="submit">Börja utforska '+ico("arrow")+'</button></form></section>'+
      '<aside class="panel welcome-aside"><div class="feature-icon">'+ico("shield")+'</div><h2>Här kan du prova i lugn och ro.</h2><ul class="plain-list">'+
      '<li>'+ico("check")+' Ingen registrering behövs.</li><li>'+ico("check")+' Du kan byta mellan två demoprofiler.</li>'+
      '<li>'+ico("check")+' Inget skickas till någon annan enhet.</li></ul>'+
      '<div class="info-card">'+ico("info")+'<p>Ingen säker lagring finns ännu. Använd bara påhittade uppgifter och skriv inte känslig information.</p></div></aside></div>';
  }
  function renderFamily(){
    const steps=[
      ["01","Skapa varsitt konto","Förälder och tonåring kommer att få säkra och separata konton."],
      ["02","Använd en familjekod","En inbjudan med begränsad giltighetstid kopplar rätt två personer."],
      ["03","Bekräfta delningen","Båda får först veta vad som delas och ska sedan godkänna kopplingen."]
    ];
    return header("Hitta varandra","Så kommer ni att kunna koppla ihop två separata konton.","FAMILJEKOPPLING")+
      '<div class="info-card">'+ico("lock")+'<p><strong>Planerad funktion.</strong> Familjekoder fungerar inte ännu. Demonstrationen kan inte koppla ihop två olika telefoner eller riktiga användare.</p></div>'+
      '<div class="steps-grid">'+steps.map(x=>'<article class="step-card"><span class="step-number">'+x[0]+'</span><h3>'+x[1]+'</h3><p>'+x[2]+'</p></article>').join("")+'</div>'+
      '<div class="panel"><h2>Testa båda perspektiven</h2><p>Du kan redan nu växla mellan en föräldra- och en tonårsprofil på samma enhet.</p>'+
      '<div class="demo-status"><div><span class="demo-dot '+(S.profiles.teen.name?"ready":"")+'"></span>Tonåring: '+esc(displayName("teen"))+'</div>'+
      '<div><span class="demo-dot '+(S.profiles.parent.name?"ready":"")+'"></span>Förälder: '+esc(displayName("parent"))+'</div></div>'+
      '<button class="btn btn-primary" data-page="installningar">Byt demoprofil '+ico("arrow")+'</button></div>'+
      '<div class="panel"><h2>Vem kommer att se vad?</h2>'+sharingRows()+
      '<p class="footer-help">Förslaget behöver godkännas innan riktig backend och datadelning tas i bruk.</p></div>';
  }
  function renderHome(){
    const welcome=isBoth()?"BÅDA DEMOPROFILERNA ÄR REDO":"VÄNTAR PÅ DIN MOTPART · DEMO";
    const intro=isBoth()?"Ni kan prova övningarna med varsin demoprofil på denna enhet.":S.role==="parent"?"Som förälder kan du utforska nya sätt att lyssna, förstå och mötas. Skapa en andra demoprofil om du vill jämföra svar.":"Här finns plats för dina tankar. Du kan börja swajpa, göra testet och utforska vad som är viktigt för dig.";
    const total=swipeCount(S.role);
    return '<div class="hero"><div class="hero-orbit"></div><div class="hero-content"><span class="status-pill">'+ico("sparkles")+welcome+'</span><h1>Hej '+esc(displayName(S.role))+'.<em>Välkommen till ert rum.</em></h1><p>'+intro+'</p></div></div>'+
      '<div class="home-connection"><span class="eyebrow">'+(S.role==="parent"?"FÖR DIG SOM FÖRÄLDER":"FÖR DIG SOM TONÅRING")+'</span><button class="quiet-link" data-page="familj">Så ska ni kopplas ihop '+ico("arrow")+'</button></div>'+
      sectionTitle("Nästa steg","medlare","Utforska")+
      '<button class="next-step" data-page="medlare"><span class="round-icon">'+ico("sparkles")+'</span><span><span class="kicker">NÄSTA STEG</span><strong>Utforska samtalsstöd</strong><p>Förskrivna råd – ingen AI ansluten ännu.</p></span>'+ico("arrow")+'</button>'+
      sectionTitle("Utforska tillsammans")+
      '<div class="tile-grid">'+
      card("swipe","heart","Gillaswajpen",total?total+" av "+STATEMENTS.length+" påståenden besvarade.":"Upptäck vad ni tycker lika och olika om.")+
      card("personlighet","brain","Min personlighet","Lär känna era likheter och skillnader.",true)+
      card("inkorg","message","Inkorg","Skicka ett meddelande i den lokala demon.",true)+
      card("kommunikation","book","Kommunikationsråd","Öva på att tala så att ni kan förstå varandra.")+
      card("regler","list","Schyssta listan","Skapa gemensamma överenskommelser.",true)+
      card("medlare","sparkles","AI-medlaren","Ett lugnt bollplank för svåra situationer.")+
      '</div>'+
      sectionTitle("Ett steg i taget")+
      '<div class="panel"><span class="eyebrow">SMÅ SAMTAL KAN GÖRA SKILLNAD</span><h3 class="serif" style="font-size:27px;margin:14px 0">Börja med nyfikenhet, inte med att ha rätt.</h3><p>Välj en fråga, låt varandra tala till punkt och jämför vad ni tänkte. Ni behöver inte vara överens för att förstå varandra bättre.</p><button class="btn btn-outline" data-page="swipe">Börja swajpa '+ico("arrow")+'</button></div>';
  }
  function renderSwipe(){
    const a=S.swipes[S.role];const idx=STATEMENTS.findIndex((q,i)=>!Object.prototype.hasOwnProperty.call(a,i));const n=swipeCount(S.role);
    let html=header("Gillaswajpen","Tycker du så här eller inte? Era svar kan bli en början på ett samtal.","LÄR KÄNNA VARANDRA")+
      '<div class="info-card">'+ico("info")+'<p><strong>Demo:</strong> Svaren lagras bara i denna webbläsare. De skickas inte till någon motpart. Växla demoprofil under Inställningar för att testa jämförelser.</p></div>'+
      '<div style="margin-top:26px"><div class="progress-top"><span>'+n+' av '+STATEMENTS.length+' påståenden</span><span>'+Math.round(n/STATEMENTS.length*100)+' %</span></div><div class="progress-bar"><span class="progress-fill" style="width:'+(n/STATEMENTS.length*100)+'%"></span></div></div>';
    if(idx===-1){html+='<div class="panel completion">'+ico("check")+'<h2>Du har svarat på allt!</h2><p>Din del av swajpen är klar. Testa den andra demoprofilen för att se likheter och skillnader.</p><div class="row"><button class="btn btn-primary" data-action="review-swipes">Se svaren</button><button class="btn btn-ghost" data-action="reset-swipes">Börja om</button></div></div>';}
    else{const s=STATEMENTS[idx];html+='<div class="swipe-card" id="swipe-card"><span class="eyebrow">'+esc(s[0])+'</span><blockquote>'+esc(s[1])+'</blockquote><span class="swipe-number">PÅSTÅENDE '+(idx+1)+' / '+STATEMENTS.length+'</span></div>'+
      '<div class="swipe-actions"><button class="swipe-choice" data-action="swipe-no" aria-label="Stämmer inte">'+ico("x")+'</button><button class="swipe-choice like" data-action="swipe-yes" aria-label="Stämmer">'+ico("heart")+'</button></div><p class="swipe-hint">Vänster = stämmer inte · Höger = stämmer · eller använd knapparna</p>'+(swipeHistory.length?'<div class="row" style="justify-content:center"><button class="quiet-link" data-action="undo-swipe">'+ico("back")+' Ångra senaste</button></div>':"");}
    html+=sectionTitle("Era svar");
    const both=Object.keys(S.swipes[other()]).length;
    if(!n&&!both){html+='<div class="empty">'+ico("heart")+'<h3>Inga svar ännu</h3><p>När ni har svarat visas resultaten här.</p></div>';}
    else{html+='<div class="swipe-review">'+STATEMENTS.map((s,i)=>{const x=S.swipes[S.role][i],y=S.swipes[other()][i];if(x===undefined&&y===undefined)return "";return '<div class="answer-row"><span>'+esc(s[1])+'</span><div><div class="mini muted">Ditt svar: '+(x===undefined?"—":x?"Ja":"Nej")+'</div><div class="mini muted">Andra demon: '+(y===undefined?"—":y?"Ja":"Nej")+'</div>'+(x!==undefined&&y!==undefined?'<span class="tag '+(x===y?"":"no")+'">'+(x===y?"Lika":"Olika")+'</span>':"")+'</div></div>';}).join("")+'</div>';}
    return html;
  }
  function renderPersonality(){
    const ans=S.personality[S.role];const done=personalityCount(S.role);
    let html=header("Min personlighet","En kort reflektionsövning inspirerad av femfaktormodellen (Big Five).","SE LIKHETER OCH SKILLNADER")+
      '<div class="info-card">'+ico("info")+'<p><strong>Viktigt:</strong> Detta är inte ett validerat personlighetstest. Frågorna och resultaten är endast samtalsunderlag – inte vetenskapliga mätvärden eller diagnostik.</p></div>'+
      '<div style="margin:26px 0 20px"><div class="progress-top"><span>'+done+' av '+ITEMS.length+' besvarade</span><span>'+Math.round(done/ITEMS.length*100)+' %</span></div><div class="progress-bar"><span class="progress-fill" style="width:'+(done/ITEMS.length*100)+'%"></span></div></div>';
    html+='<div class="panel"><div class="row justify-between"><h3 style="margin:0">Hur väl stämmer påståendet på dig?</h3><button class="quiet-link" data-action="reset-personality">Nollställ svar</button></div><p class="mini">1 = stämmer inte alls · 5 = stämmer helt</p><div class="divider"></div>'+
      ITEMS.map((it,i)=>'<div class="question-box"><span class="eyebrow">FRÅGA '+(i+1)+' / '+ITEMS.length+'</span><h3>'+esc(it[1])+'</h3><div class="scale" role="group" aria-label="Hur väl stämmer: '+esc(it[1])+'">'+[1,2,3,4,5].map(n=>'<label><input type="radio" name="q'+i+'" value="'+n+'" data-q="'+i+'" '+(ans[i]===n?"checked":"")+'><span>'+n+'</span></label>').join("")+'</div><div class="scale-labels"><span>Inte alls</span><span>Helt</span></div></div>').join("")+'</div>';
    if(done===ITEMS.length){const mine=traitScores(S.role),partner=traitScores(other());html+=sectionTitle("Din profil");
      html+='<div class="panel"><p>Staplarna beskriver bara dina svar på dessa 15 övningsfrågor. De ska inte tolkas som jämförbara normpoäng.</p><div class="legend"><span><i></i>Din demoprofil</span>'+(partner?'<span class="partner"><i></i>Andra demoprofilen</span>':"")+'</div>'+
      TRAITS.map(tr=>'<div class="metric"><div class="metric-header"><strong>'+tr[1]+'</strong><span>'+mine[tr[0]]+' / 100</span></div><div class="comparison"><div class="meter-track"><span class="meter-fill" style="width:'+mine[tr[0]]+'%"></span></div>'+(partner?'<div class="meter-track"><span class="meter-fill partner" style="width:'+partner[tr[0]]+'%"></span></div>':"")+'</div><p class="mini muted" style="margin:6px 0 0">'+tr[2]+'</p></div>').join("")+
      (partner?"":'<p class="mini muted">Fyll i frågorna också i den andra demoprofilen för att jämföra staplarna på samma enhet.</p>')+'</div>';}
    return html;
  }
  function traitScores(role){
    const data=S.personality[role];if(Object.keys(data).length!==ITEMS.length)return null;
    const score={};TRAITS.forEach(t=>{const vals=ITEMS.map((it,i)=>it[0]===t[0]?(it[2]?6-data[i]:data[i]):null).filter(n=>n!==null);score[t[0]]=Math.round(((vals.reduce((a,b)=>a+b,0)/vals.length)-1)*25);});return score;
  }
  function renderInbox(){
    const msgs=S.messages.filter(m=>m.from===S.role||m.to===S.role).slice().reverse();
    return header("Inkorg","Här kan du prova att lämna ett meddelande och växla mellan två demoprofiler.","SÄG DET DU VILL SÄGA")+
      '<div class="info-card">'+ico("lock")+'<p><strong>Endast demo:</strong> Meddelanden sparas lokalt i denna webbläsare. Inget skickas till andra enheter och detta är inte en säker kommunikationstjänst.</p></div>'+
      sectionTitle("Nytt meddelande")+
      '<form class="panel" id="message-form"><p>Från <strong>'+esc(displayName(S.role))+'</strong> till <strong>'+esc(displayName(other()))+'</strong></p><div class="field"><label for="msg-body">Ditt meddelande</label><textarea id="msg-body" maxlength="800" required placeholder="Skriv en vänlig hälsning eller något du vill prata om..." minlength="1"></textarea></div><button class="btn btn-primary" type="submit">'+ico("send")+' Spara i demoinboxen</button></form>'+
      sectionTitle("Meddelanden")+
      (msgs.length?'<div class="message-list">'+msgs.map(m=>'<article class="message-card '+(m.to===S.role&&!m.read?"unread":"")+'"><div class="row justify-between"><strong>'+esc(m.from===S.role?"Du → "+displayName(other()):displayName(other())+" → dig")+'</strong><small>'+new Date(m.ts).toLocaleString("sv-SE",{dateStyle:"short",timeStyle:"short"})+'</small></div><p>'+esc(m.body)+'</p></article>').join("")+'</div>':'<div class="empty">'+ico("message")+'<h3>Inga meddelanden ännu</h3><p>Prova att skriva ett meddelande i din demoprofil.</p></div>');
  }
  function renderComm(){
    return header("Kommunikationsråd","Lär dig ett sätt att uttrycka det som är svårt – utan att fastna i anklagelser.","FÖRSTÅ OCH BLI FÖRSTÅDD")+
      '<div class="panel"><span class="eyebrow">ÖVNING · FYRA STEG</span><h2 style="margin:10px 0">Prata med giraffspråket</h2><p>Inspirerat av Nonviolent Communication (NVC). Modellen kan användas som ett samtalsstöd, men passar inte alla situationer och är ingen garanti för att konflikter löses.</p>'+
      '<div class="step-indicator"><span class="complete"></span><span class="complete"></span><span class="complete"></span><span class="complete"></span></div>'+
      COMM_STEPS.map((s,i)=>'<div class="row" style="align-items:flex-start;margin:20px 0"><span class="lesson-number">'+(i+1)+'</span><div style="flex:1"><h3 style="font-family:var(--sans);font-size:17px;margin:0 0 5px">'+esc(s[0])+'</h3><p style="font-size:14px;margin:0">'+esc(s[1])+'</p></div></div>').join("")+'</div>'+
      sectionTitle("Öva på en formulering")+
      '<form class="panel" id="nvc-form"><p>Texten används endast för att skapa en formulering på skärmen och sparas inte när du lämnar sidan.</p>'+
      '<div class="field"><label for="nvc-obs">1. Observation – vad hände konkret?</label><input id="nvc-obs" maxlength="250" placeholder="du avbröt mig när jag berättade"></div>'+
      '<div class="field"><label for="nvc-feel">2. Vad kände du?</label><input id="nvc-feel" maxlength="150" placeholder="ledsen och frustrerad"></div>'+
      '<div class="field"><label for="nvc-need">3. Vad behövde du?</label><input id="nvc-need" maxlength="150" placeholder="bli lyssnad på"></div>'+
      '<div class="field"><label for="nvc-ask">4. Vad vill du be om?</label><input id="nvc-ask" maxlength="250" placeholder="vi turas om att prata i fem minuter"></div>'+
      '<button class="btn btn-primary" type="submit">Hjälp mig formulera '+ico("arrow")+'</button></form>'+
      (exerciseOutput?'<div class="panel"><span class="eyebrow">DIN FORMULERING</span><div class="exercise-output">'+esc(exerciseOutput)+'</div><p class="footer-help">Anpassa gärna orden så att de känns naturliga och stämmer med det du vill säga.</p></div>':"");
  }
  function renderRules(){
    return header("Schyssta listan","Hitta regler och överenskommelser som båda kan vara med och påverka.","VÅRT GEMENSAMMA ANSVAR")+
      '<div class="info-card">'+ico("info")+'<p><strong>Demoläge:</strong> Förslag och godkännanden finns bara på denna enhet. Ett godkännande här är inte en verifierad underskrift från en annan person.</p></div>'+
      sectionTitle("Föreslå en överenskommelse")+
      '<form id="rule-form" class="panel"><div class="field"><label for="rule-body">Vad vill du att ni ska prova?</label><textarea id="rule-body" required maxlength="300" placeholder="Exempel: Vi lägger undan mobilerna under middagen."></textarea></div><button class="btn btn-primary" type="submit">'+ico("plus")+' Lägg till förslag</button></form>'+
      sectionTitle("Era överenskommelser")+
      (S.rules.length?'<div class="rules">'+S.rules.slice().reverse().map(r=>{const agreed=r.confirmed.teen&&r.confirmed.parent;return '<article class="rule-row"><div class="rule-text"><strong>'+esc(r.text)+'</strong><small>Föreslagen av '+roleName(r.by)+'</small><div class="rule-votes" style="margin-top:12px"><span class="'+(r.confirmed.parent?"ok":"")+'">Förälder: '+(r.confirmed.parent?"Bekräftat":"Väntar")+'</span><span class="'+(r.confirmed.teen?"ok":"")+'">Tonåring: '+(r.confirmed.teen?"Bekräftat":"Väntar")+'</span></div></div><div class="status"><span class="tag '+(agreed?"":"neutral")+'">'+(agreed?"Gemensam regel":"Förslag")+'</span>'+(r.confirmed[S.role]?"":'<div style="margin-top:12px"><button class="btn btn-small btn-outline" data-action="approve-rule" data-id="'+r.id+'">'+ico("check")+' Bekräfta</button></div>')+'</div></article>';}).join("")+'</div>':'<div class="empty">'+ico("list")+'<h3>Listan är tom</h3><p>Börja med en liten regel som ni kan testa och utvärdera.</p></div>');
  }
  function renderGuide(){
    let h=header("AI-medlaren","Ett lugnt bollplank när något skaver i relationen.","STÖD FÖR SVÅRA STUNDER")+
      '<div class="info-card">'+ico("lock")+'<p><strong>AI är inte ansluten ännu.</strong> Här finns förskrivna reflektionsövningar, inte en chatbot. Ingen chatt skickas till eller sparas hos en AI-tjänst. En framtida personlig AI-medlare måste ha skyddad backend och separata privata samtal.</p></div>'+
      sectionTitle("Vad skulle du vilja ha hjälp med?")+
      '<div class="guide-options">'+GUIDES.map((g,i)=>'<button class="guide-option '+(activeGuide===i?"active":"")+'" data-action="guide" data-id="'+i+'">'+esc(g.title)+' '+ico("arrow","small-icon")+'</button>').join("")+'</div>';
    if(activeGuide>=0&&GUIDES[activeGuide]){const g=GUIDES[activeGuide];h+='<div class="guide-result"><span class="eyebrow">REFLEKTIONSSTÖD</span><h3>'+esc(g.title)+'</h3><p>'+esc(g.intro)+'</p><ol>'+g.tips.map(t=>'<li>'+esc(t)+'</li>').join("")+'</ol><p class="footer-help">Detta är generella idéer, inte individanpassad behandling eller en bedömning av din familj.</p></div>';}
    return h+'<div class="panel" style="margin-top:30px"><h3>Privat samtal – nästa utvecklingssteg</h3><p>Den färdiga tjänsten är tänkt att använda delade svar från swajpen, personlighetstestet och era överenskommelser. Själva samtalet med AI-medlaren ska däremot vara privat för varje användare.</p><p class="mini muted">Vid hot, våld eller akut fara är den här demonstrationsfunktionen inte rätt stöd. Kontakta relevant hjälpinstans; ring 112 vid omedelbar fara.</p></div>';
  }
  function renderSettings(){
    return header("Inställningar","Hantera demonstrationsprofiler och se hur informationen hanteras i prototypen.","DIN DEMOMILJÖ")+
      '<div class="panel"><h3>Demoprofiler</h3><p>Välj vilken roll du vill testa. Detta är ett byte av vy i samma webbläsare, inte en riktig inloggning.</p><form id="profile-form">'+
      '<div class="field"><label for="role">Aktiv roll</label><select id="role" name="role"><option value="teen" '+(S.role==="teen"?"selected":"")+'>Tonåring</option><option value="parent" '+(S.role==="parent"?"selected":"")+'>Förälder</option></select></div>'+
      '<div class="field"><label for="profile-name">Visningsnamn för vald roll</label><input id="profile-name" name="name" maxlength="32" value="'+esc(S.profiles[S.role].name)+'" placeholder="Skriv ett namn"></div>'+
      '<button class="btn btn-primary" type="submit">Spara demoprofil</button></form></div>'+
      '<div class="panel"><h3>Så fungerar prototypen</h3><div class="row" style="align-items:flex-start">'+ico("shield")+'<p style="flex:1;margin:0">Inga konton skapas. Allt du sparar här lagras i din webbläsares lokala lagring. Den som använder samma webbläsare kan se detta. Datan synkroniseras inte mellan enheter.</p></div><div class="divider"></div><div class="row" style="align-items:flex-start">'+ico("lock")+'<p style="flex:1;margin:0">En produktionsversion behöver säker autentisering, åtkomstkontroll för varje familjepar, serverlagring, integritetspolicy och särskild hänsyn till minderårigas uppgifter.</p></div><div class="divider"></div><button class="btn btn-danger" data-action="clear-demo">Radera alla lokala demodata</button></div>'+
      '<div class="panel"><h3>Planerad delning i den färdiga tjänsten</h3><p><strong>Delas mellan paret:</strong> svar från Gillaswajpen, personlighetsresultat och gemensamma regler.</p><p><strong>Privat:</strong> konversationen med AI-medlaren. Privat betyder att den andra användaren inte får tillgång till chattinnehållet.</p><p class="mini muted">Detta beskriver målbilden; funktionerna för säker delning är inte byggda i denna prototyp.</p></div>';
  }
  function render(){
    const pg=page();
    if(pg==="inkorg"){let changed=false;S.messages.forEach(m=>{if(m.to===S.role&&!m.read){m.read=true;changed=true;}});if(changed)persist();}
    $("#desktop-nav").innerHTML=navMarkup(false);
    $("#mobile-nav").innerHTML=navMarkup(true);
    const profile=$("#side-profile");if(profile){profile.querySelector("strong").textContent=displayName(S.role);profile.querySelector(".avatar").textContent=displayName(S.role).slice(0,1).toUpperCase();}
    const views={hem:renderHome,swipe:renderSwipe,personlighet:renderPersonality,inkorg:renderInbox,kommunikation:renderComm,regler:renderRules,medlare:renderGuide,installningar:renderSettings,"kom-igang":renderWelcome,familj:renderFamily};
    $("#app").innerHTML=views[pg]();
    if(pg==="swipe"){let initialX=null;const card=$("#swipe-card");if(card){card.addEventListener("pointerdown",e=>{initialX=e.clientX;});card.addEventListener("pointerup",e=>{if(initialX===null)return;const d=e.clientX-initialX;initialX=null;if(Math.abs(d)>65)answerSwipe(d>0);});}}
  }
  function navigate(p){if(page()===p){render();window.scrollTo({top:0,behavior:"smooth"});}else location.hash=p;}
  function answerSwipe(value){const idx=STATEMENTS.findIndex((q,i)=>!Object.prototype.hasOwnProperty.call(S.swipes[S.role],i));if(idx<0)return;S.swipes[S.role][idx]=value;swipeHistory.push({role:S.role,index:idx});persist();render();}
  document.addEventListener("click",function(e){
    const pageButton=e.target.closest("[data-page]");if(pageButton){e.preventDefault();navigate(pageButton.dataset.page);return;}
    const a=e.target.closest("[data-action]");if(!a)return;
    const act=a.dataset.action;
    if(act==="swipe-yes"||act==="swipe-no")answerSwipe(act==="swipe-yes");
    else if(act==="undo-swipe"){const last=swipeHistory.pop();if(last&&last.role===S.role){delete S.swipes[S.role][last.index];persist();render();}}
    else if(act==="review-swipes"){document.querySelector(".swipe-review")?.scrollIntoView({behavior:"smooth",block:"start"});}
    else if(act==="reset-swipes"){if(confirm("Vill du ta bort den här demoprofilens swajpsvar?")){S.swipes[S.role]={};swipeHistory=[];persist();render();}}
    else if(act==="reset-personality"){if(confirm("Vill du ta bort den här demoprofilens testsvar?")){S.personality[S.role]={};persist();render();}}
    else if(act==="approve-rule"){const rule=S.rules.find(r=>String(r.id)===a.dataset.id);if(rule){rule.confirmed[S.role]=true;persist();render();toast("Bekräftat i den lokala demon.");}}
    else if(act==="guide"){activeGuide=Number(a.dataset.id);render();document.querySelector(".guide-result")?.scrollIntoView({behavior:"smooth",block:"nearest"});}
    else if(act==="clear-demo"){if(confirm("Radera samtliga lokala demodata från denna webbläsare?")){S=newState();swipeHistory=[];activeGuide=-1;exerciseOutput="";persist();navigate("hem");toast("Lokala demodata raderade.");}}
  });
  document.addEventListener("change",function(e){
    const el=e.target;if(el.matches("input[data-q]")){const ix=Number(el.dataset.q);const val=Number(el.value);if(ix>=0&&ix<ITEMS.length&&val>=1&&val<=5){S.personality[S.role][ix]=val;persist();const completed=personalityCount(S.role)===ITEMS.length;const p=el.closest(".question-box");const following=p?.nextElementSibling;if(completed){render();document.querySelector(".metric")?.scrollIntoView({behavior:"smooth",block:"center"});}else if(following?.classList.contains("question-box"))following.scrollIntoView({behavior:"smooth",block:"center"});else render();}}
    if(el.id==="role"){const selected=el.value;if(selected==="teen"||selected==="parent"){$("#profile-name").value=S.profiles[selected].name||"";}}
  });
  document.addEventListener("submit",function(e){
    const f=e.target;if(!f.id)return;e.preventDefault();
    if(f.id==="message-form"){const el=$("#msg-body");const body=el.value.trim();if(!body)return;if(body.length>800)return;S.messages.push({id:Date.now()+Math.random(),from:S.role,to:other(),body,ts:Date.now(),read:false});persist();render();toast("Meddelandet sparades i denna webbläsare.");}
    if(f.id==="rule-form"){const body=$("#rule-body").value.trim();if(!body)return;S.rules.push({id:Date.now()+Math.random(),text:body.slice(0,300),by:S.role,confirmed:{teen:false,parent:false}});persist();render();toast("Förslaget lades till lokalt.");}
    if(f.id==="onboarding-form"){const selected=f.querySelector('input[name="first-role"]:checked')?.value;const name=$("#first-name").value.trim();if(selected!=="teen"&&selected!=="parent")return;S.role=selected;S.profiles[selected].name=name.slice(0,32)||roleName(selected);S.onboarded=true;persist();navigate("hem");toast("Demoprofil skapad. Ingen riktig användare registrerades.");}
    if(f.id==="profile-form"){const role=$("#role").value;const name=$("#profile-name").value.trim();if(role!=="teen"&&role!=="parent")return;S.role=role;S.profiles[role].name=name.slice(0,32)||roleName(role);swipeHistory=[];persist();navigate("hem");toast("Demoprofil sparad.");}
    if(f.id==="nvc-form"){const v=["nvc-obs","nvc-feel","nvc-need","nvc-ask"].map(id=>$("#"+id).value.trim());if(v.every(Boolean)){exerciseOutput="När "+v[0]+" kände jag mig "+v[1]+", eftersom jag behöver "+v[2]+". Skulle vi kunna "+v[3]+"?";render();document.querySelector(".exercise-output")?.scrollIntoView({behavior:"smooth",block:"center"});}else toast("Fyll i alla fyra fälten först.");}
  });
  window.addEventListener("hashchange",()=>{render();window.scrollTo(0,0);});
  render();
})();