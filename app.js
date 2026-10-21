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
    ["Känslor","Jag önskar att vi pratade mer om sådant som är svårt."],
    ["Tillit","Jag vill kunna berätta om ett misstag utan att samtalet direkt blir ett gräl."],
    ["Tillit","Jag tycker det är viktigt att vi håller det vi lovar varandra."],
    ["Tillit","Jag vill att vi berättar när något har skadat tilliten mellan oss."],
    ["Självständighet","Jag vill att vi pratar om hur jag kan få mer ansvar och frihet."],
    ["Självständighet","Det är viktigt för mig att kunna säga nej utan att det blir ett bråk."],
    ["Självständighet","Jag vill att vi respekterar varandras privatliv."],
    ["Samtal","Jag vill att vi frågar varandra innan vi ger råd."],
    ["Samtal","Jag skulle vilja att vi oftare frågade hur den andra har haft det."],
    ["Samtal","Jag vill att vi försöker förstå varandras skäl även när vi tycker olika."],
    ["Konflikter","När vi har blivit osams vill jag att vi försöker hitta tillbaka till varandra."],
    ["Konflikter","Jag tycker det hjälper när någon säger förlåt efter att ha sårat den andra."],
    ["Konflikter","Jag vill att vi undviker att höja rösten när vi är oense."],
    ["Känslor","Jag vill kunna säga att jag är ledsen eller orolig utan att behöva förklara allt direkt."],
    ["Känslor","Jag vill att vi märker när någon behöver stöd och frågar vad som skulle hjälpa."],
    ["Vardag","Jag vill att vi bestämmer viktiga saker tillsammans när det går."],
    ["Vardag","Jag tycker det är viktigt att vi kan ändra en regel som inte fungerar."],
    ["Digital vardag","Jag vill att vi pratar om mobilanvändning utan att någon känner sig anklagad."],
    ["Gemenskap","Jag skulle vilja att vi gjorde något roligt tillsammans oftare."],
    ["Gemenskap","Jag uppskattar små stunder tillsammans även när vi inte pratar om något särskilt."],
    ["Uppskattning","Jag vill att vi oftare berättar vad vi uppskattar hos varandra."]
  ];
  const THEME_DECKS=[{"id":"samtal","title":"Samtalsämnen","cards":["Vad som varit roligt den senaste veckan","Hur vi har det i skolan eller på jobbet","Vad vi vill göra under nästa ledighet","Hur vi vill prata om sociala medier","Vad vi vill lära oss","Hur vi visar att vi lyssnar","Vad som gör oss stressade","Vad vi drömmer om framöver"]},{"id":"aktiviteter","title":"Aktiviteter tillsammans","cards":["Laga mat tillsammans","Ta en promenad ihop","Se en film tillsammans","Spela ett spel","Prova en ny aktivitet","Göra en utflykt","Visa varandra favoritmusik","Skapa något tillsammans"]},{"id":"regler","title":"Regler för Schyssta listan","cards":["Vi knackar innan vi går in i varandras rum.","Vi lyssnar färdigt innan vi svarar.","Vi får pausa gräl och bestämmer när vi pratar vidare.","Vi frågar innan vi lånar varandras saker.","Vi pratar om hur sysslorna ska fördelas.","Vi berättar när planer som berör andra ändras.","Vi kommer överens om tider för sömn och hemkomst.","Vi kan ompröva regler som inte fungerar.","Vi bestämmer gemensamma mobilfria stunder.","Vi försöker prata utan att höja rösten.","Vi får säga till när något känns orättvist.","Vi försöker reda ut saker efter ett bråk."]},{"id":"uppskattning","title":"Sätt att visa uppskattning","cards":["Säga tack för små saker","Fråga hur den andra mår","Skicka ett vänligt meddelande","Göra något hjälpsamt","Ge en kram när båda vill","Berätta vad man uppskattar","Uppmärksamma den andras ansträngning","Ge varandra odelad uppmärksamhet"]},{"id":"aterhamtning","title":"Svåra situationer och återhämtning","cards":["Ta en paus när vi blir arga","Fråga om den andra vill ha råd","Säga förlåt när vi sårat någon","Prata vidare när vi lugnat oss","Berätta vad vi behöver","Komma överens om en paussignal","Be om hjälp när vi kör fast","Visa att vi vill bli sams"]},{"id":"forandring","title":"Små gemensamma förändringar","cards":["Äta en måltid tillsammans","Avsätta tio minuter för samtal","Fråga innan vi ger råd","Prata om veckans planer","Göra något roligt varje månad","Ha en stund utan mobiler","Utvärdera en regel efter två veckor","Berätta något som fungerat bra"]}];
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
  function newState(){return {version:1,onboarded:false,role:"teen",profiles:{teen:{name:""},parent:{name:""}},swipes:{teen:{},parent:{}},personality:{teen:{},parent:{}},messages:[],rules:[],themeSwipes:{teen:{},parent:{}}};}
  let S=newState();
  try{const x=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");if(x&&x.version===1&&x.profiles&&x.swipes&&x.personality&&Array.isArray(x.messages)&&Array.isArray(x.rules)){S=x;if(typeof S.onboarded!=="boolean")S.onboarded=true;if(!S.themeSwipes)S.themeSwipes={teen:{},parent:{}};for(const r of ["teen","parent"])if(!S.themeSwipes[r])S.themeSwipes[r]={};}}catch(e){}
  let swipeHistory=[];
  let activeDeck="general";
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
  const unlocked=()=>["teen","parent"].every(r=>STATEMENTS.every((q,i)=>Object.hasOwn(S.swipes[r],i)));
  const deck=id=>THEME_DECKS.find(d=>d.id===id);
  const cards=id=>id==="general"?STATEMENTS:deck(id).cards.map(t=>["Tema",t]);
  const answers=(role,id)=>id==="general"?S.swipes[role]:(S.themeSwipes[role][id]||{});
  const matchedRules=()=>deck("regler").cards.map((text,i)=>({text,i})).filter(q=>answers("teen","regler")[q.i]===true&&answers("parent","regler")[q.i]===true);
  function renderSwipe(){
    if(activeDeck!=="general"&&!unlocked())activeDeck="general";
    const id=activeDeck,arr=cards(id),a=answers(S.role,id),idx=arr.findIndex((q,i)=>!Object.hasOwn(a,i)),n=Object.keys(a).length;
    let html=header("Gillaswajpen","Upptäck sådant ni båda vill prata om eller prova.","LÄR KÄNNA VARANDRA")+
    '<div class="info-card">'+ico("info")+'<p><strong>Demo:</strong> Svar lagras bara i den här webbläsaren. Gemensamma ja är samtalsförslag, inte beslut.</p></div>'+
    sectionTitle("Välj kortlek")+
    '<div class="tile-grid"><button class="feature-card" data-action="deck" data-id="general"><h3>Allmänna kortleken</h3><p>'+Object.keys(S.swipes[S.role]).length+' / '+STATEMENTS.length+'</p></button>'+
    THEME_DECKS.map(d=>'<button class="feature-card" data-action="deck" data-id="'+d.id+'" '+(!unlocked()?'disabled':'')+'><h3>'+esc(d.title)+'</h3><p>'+(unlocked()?Object.keys(answers(S.role,d.id)).length+' / '+d.cards.length+' kort':'Låst tills båda avslutat allmänna kortleken')+'</p></button>').join("")+'</div>'+
    sectionTitle(id==="general"?"Allmänna kortleken":deck(id).title)+
    '<div class="progress-top"><span>'+n+' av '+arr.length+' kort</span><span>'+Math.round(n/arr.length*100)+' %</span></div><div class="progress-bar"><span class="progress-fill" style="width:'+(100*n/arr.length)+'%"></span></div>';
    if(idx<0)html+='<div class="panel completion"><h2>Du är klar!</h2><p>Välj en annan kortlek eller invänta den andra demoprofilens svar.</p><button class="btn btn-ghost" data-action="reset-swipes">Börja om med denna kortlek</button></div>';
    else html+='<div class="swipe-card" id="swipe-card" tabindex="0" role="group" aria-label="Svep höger för ja eller vänster för nej"><span class="swipe-stamp stamp-no" aria-hidden="true">NEJ</span><span class="swipe-stamp stamp-yes" aria-hidden="true">JA</span><span class="eyebrow">'+esc(arr[idx][0])+'</span><blockquote>'+esc(arr[idx][1])+'</blockquote><span class="swipe-number">KORT '+(idx+1)+' / '+arr.length+'</span></div><div class="swipe-actions"><button class="swipe-choice" data-action="swipe-no" aria-label="Nej">'+ico("x")+'</button><button class="swipe-choice like" data-action="swipe-yes" aria-label="Ja">'+ico("heart")+'</button></div><p class="swipe-hint">Vänster = nej · Höger = ja</p>'+(swipeHistory.some(h=>h.role===S.role&&h.deck===id)?'<button class="quiet-link" data-action="undo-swipe">Ångra senaste</button>':"");
    const shared=arr.filter((q,i)=>answers("teen",id)[i]===true&&answers("parent",id)[i]===true);
    html+=sectionTitle("Gemensamma ja")+(shared.length?'<div class="swipe-review">'+shared.map(q=>'<div class="answer-row"><span>'+esc(q[1])+'</span><span class="tag">Båda valde ja</span></div>').join("")+'</div>':'<div class="empty"><p>Här visas endast sådant båda svarat ja på.</p></div>');
    if(id==="regler")html+='<button class="btn btn-outline" data-page="regler">Till Schyssta listan</button>';
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
      sectionTitle("Regelförslag från Gillaswajpen")+
      (matchedRules().length?'<div class="rules">'+matchedRules().map(q=>'<div class="rule-row"><strong>'+esc(q.text)+'</strong>'+(S.rules.some(r=>r.sourceDeck==="regler"&&r.sourceIndex===q.i)?'<span class="tag neutral">Redan föreslagen</span>':'<button class="btn btn-small btn-outline" data-action="propose-swipe-rule" data-id="'+q.i+'">Lägg som förslag</button>')+'</div>').join("")+'</div>':'<p>Inga gemensamt gillade regelförslag ännu.</p>')+
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
    const mobileNav=$("#mobile-nav");
    const activeMobileItem=mobileNav.querySelector('.nav-item.active');
    if(activeMobileItem)requestAnimationFrame(()=>activeMobileItem.scrollIntoView({block:"nearest",inline:"nearest",behavior:"instant"}));
    const profile=$("#side-profile");if(profile){profile.querySelector("strong").textContent=displayName(S.role);profile.querySelector(".avatar").textContent=displayName(S.role).slice(0,1).toUpperCase();}
    const views={hem:renderHome,swipe:renderSwipe,personlighet:renderPersonality,inkorg:renderInbox,kommunikation:renderComm,regler:renderRules,medlare:renderGuide,installningar:renderSettings,"kom-igang":renderWelcome,familj:renderFamily};
    $("#app").innerHTML=views[pg]();
    if(pg==="swipe")setupSwipeGesture();
  }
  function setupSwipeGesture(){
    const card=$("#swipe-card");if(!card)return;
    let start=null,locked=false;
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function reset(){start=null;card.style.transform="";card.style.opacity="";card.classList.remove("swipe-dragging","swipe-yes","swipe-no");}
    card.addEventListener("pointerdown",e=>{
      if(e.button!==0||locked)return;
      start={id:e.pointerId,x:e.clientX,y:e.clientY,dragging:false};
    });
    card.addEventListener("pointermove",e=>{
      if(!start||start.id!==e.pointerId||locked)return;
      const dx=e.clientX-start.x,dy=e.clientY-start.y;
      if(!start.dragging&&Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>12){start=null;return;}
      if(Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)){start.dragging=true;card.setPointerCapture(e.pointerId);}
      if(!start.dragging)return;
      const tilt=Math.max(-13,Math.min(13,dx/18));
      card.classList.add("swipe-dragging");
      card.classList.toggle("swipe-yes",dx>35);card.classList.toggle("swipe-no",dx< -35);
      card.style.transform="translateX("+dx+"px) rotate("+tilt+"deg)";
    });
    card.addEventListener("pointerup",e=>{
      if(!start||start.id!==e.pointerId)return;
      const dx=e.clientX-start.x,dragged=start.dragging;start=null;
      if(!dragged||Math.abs(dx)<85){reset();return;}
      locked=true;
      card.classList.remove("swipe-dragging");
      card.classList.toggle("swipe-yes",dx>0);card.classList.toggle("swipe-no",dx<0);
      if(reduced){answerSwipe(dx>0);return;}
      card.style.transform="translateX("+(dx>0?"120vw":"-120vw")+") rotate("+(dx>0?18:-18)+"deg)";
      card.style.opacity="0";
      window.setTimeout(()=>answerSwipe(dx>0),260);
    });
    card.addEventListener("pointercancel",reset);
    card.addEventListener("lostpointercapture",()=>{if(!locked)reset();});
    card.addEventListener("keydown",e=>{
      if(e.key==="ArrowRight"||e.key==="ArrowLeft"){e.preventDefault();if(!locked){locked=true;answerSwipe(e.key==="ArrowRight");}}
    });
  }
  function focusMain(scrollIntoView=false){const main=$("#app");if(main)main.focus({preventScroll:!scrollIntoView});}
  function navigate(p){if(page()===p){render();window.scrollTo({top:0,behavior:"smooth"});focusMain();}else location.hash=p;}
  function answerSwipe(value){const id=activeDeck;if(id!=="general"&&!unlocked())return;const idx=cards(id).findIndex((q,i)=>!Object.hasOwn(answers(S.role,id),i));if(idx<0)return;if(id!=="general"&&!S.themeSwipes[S.role][id])S.themeSwipes[S.role][id]={};answers(S.role,id)[idx]=value;swipeHistory.push({role:S.role,deck:id,index:idx});persist();render();}
  document.addEventListener("click",function(e){
    if(e.target.closest(".skip-link")){e.preventDefault();focusMain(true);return;}
    const pageButton=e.target.closest("[data-page]");if(pageButton){e.preventDefault();navigate(pageButton.dataset.page);return;}
    const a=e.target.closest("[data-action]");if(!a)return;
    const act=a.dataset.action;
    if(act==="deck"){if(a.dataset.id==="general"||(unlocked()&&deck(a.dataset.id))){activeDeck=a.dataset.id;render();}return;}
    if(act==="swipe-yes"||act==="swipe-no")answerSwipe(act==="swipe-yes");
    else if(act==="undo-swipe"){const i=swipeHistory.findLastIndex(h=>h.role===S.role&&h.deck===activeDeck);if(i>=0){const last=swipeHistory.splice(i,1)[0];delete answers(S.role,last.deck)[last.index];persist();render();}}
    else if(act==="review-swipes"){document.querySelector(".swipe-review")?.scrollIntoView({behavior:"smooth",block:"start"});}
    else if(act==="reset-swipes"){if(confirm("Vill du ta bort svaren i denna kortlek?")){if(activeDeck==="general")S.swipes[S.role]={};else S.themeSwipes[S.role][activeDeck]={};swipeHistory=[];persist();render();}}
    else if(act==="reset-personality"){if(confirm("Vill du ta bort den här demoprofilens testsvar?")){S.personality[S.role]={};persist();render();}}
    else if(act==="propose-swipe-rule"){const i=Number(a.dataset.id),q=matchedRules().find(q=>q.i===i);if(q&&!S.rules.some(r=>r.sourceDeck==="regler"&&r.sourceIndex===i)){S.rules.push({id:Date.now()+Math.random(),text:q.text,by:S.role,sourceDeck:"regler",sourceIndex:i,confirmed:{teen:false,parent:false}});persist();render();}}
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
  window.addEventListener("hashchange",()=>{render();window.scrollTo(0,0);focusMain();});
  render();
})();