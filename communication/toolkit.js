// Frivilliga, redaktionella samtalsövningar. Inga familjeuppgifter hämtas eller sparas.
export const COMMUNICATION_SOURCES=[
 {title:'MINT – Motivational Interviewing (OARS)',url:'https://motivationalinterviewing.org/understanding-motivational-interviewing'},
 {title:'Center for Nonviolent Communication – NVC',url:'https://www.cnvc.org/about/purpose-of-nvc'},
 {title:'1177 – Tonåringar 13–18 år',url:'https://www.1177.se/barn--gravid/sa-vaxer-och-utvecklas-barn/barnets-utveckling/tonaringar-13-18-ar'},
 {title:'CDC – Connecting Conversations',url:'https://www.cdc.gov/healthy-youth/connecting-conversations/index.html'},
 {title:'American Academy of Pediatrics – Communicating with teens',url:'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/How-to-Communicate-with-a-Teenager.aspx'}
];
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const COMM_SKILL_IDS={
 'Spegla innan du svarar':'lyssna',
 'Pausa och återkom':'pausa',
 'Reparera efter ett gräl':'reparera',
 'Hitta en gemensam lösning':'losning',
 'Fem minuter kontakt':'kontakt',
 'Ta upp något känsligt':'svaart',
 'Bekräfta utan att hålla med':'validera',
 'Be om något konkret':'onskemal',
 'Sätt en gräns med respekt':'grans'
};
// Only fixed editorial exercise IDs may enter a route or a selector.
export function communicationSkillFromHash(hash=''){
 const match=/^#kommunikation\/([a-z]+)$/.exec(hash);
 return match&&((match[1]==='plan'||match[1]==='spegla')||Object.values(COMM_SKILL_IDS).includes(match[1]))?match[1]:null;
}
export function openCommunicationSkill(root,skill,{focus=false}={}){
 if(skill==='spegla'){
  const practice=root?.querySelector('#comm-reflection-practice');
  if(!practice)return false;
  if(focus){
    practice.querySelector('h2')?.focus({preventScroll:true});
    practice.scrollIntoView({block:'nearest',behavior:'auto'});
  }
  return true;
 }
 if(skill==='plan'){
  const planner=root?.querySelector('#comm-solution-planner');
  if(!planner)return false;
  if(focus){
    planner.querySelector('h2')?.focus({preventScroll:true});
    planner.scrollIntoView({block:'nearest',behavior:'auto'});
  }
  return true;
 }
 if(!Object.values(COMM_SKILL_IDS).includes(skill))return false;
 const detail=root.querySelector('.comm-exercise[data-comm-skill="'+skill+'"]');
 if(!detail)return false;
 detail.open=true;
 if(focus){detail.querySelector('summary')?.focus({preventScroll:true});detail.scrollIntoView({block:'nearest',behavior:'auto'});}
 return true;
}
// Local-only copy controls: initially disabled until a new preview is generated.
// Fallback text is created in the browser only when automatic copying is refused.
function renderCommunicationCopyTools(kind){
 if(!['reflection','solution','nvc'].includes(kind))return '';
 return '<div class="comm-copy-tools">'+
  '<button type="button" class="comm-quiet-button" data-comm-copy="'+kind+'" disabled>Kopiera min text</button>'+
  '<p class="live-muted" id="comm-'+kind+'-copy-status" role="status" aria-live="polite"></p>'+
  '<div id="comm-'+kind+'-copy-manual" hidden><label for="comm-'+kind+'-copy-fallback">Markera och kopiera texten manuellt</label>'+
  '<textarea id="comm-'+kind+'-copy-fallback" rows="5" readonly spellcheck="false"></textarea>'+
  '<button type="button" class="comm-quiet-button" data-comm-select-copy="'+kind+'">Markera texten igen</button></div>'+
 '</div>';
}
function exercise(title,purpose,steps,example){
 return '<details class="comm-exercise" data-comm-skill="'+e(COMM_SKILL_IDS[title])+'"><summary><strong>'+e(title)+'</strong><span>'+e(purpose)+'</span></summary><div class="comm-exercise-content"><ol>'+steps.map(s=>'<li>'+e(s)+'</li>').join('')+'</ol><p class="comm-example"><strong>Exempel:</strong> '+e(example)+'</p></div></details>';
}
// Trygghetsinformation är statisk, rollanpassad och helt frikopplad från svar, AI och lagring.
export function renderCommunicationSafety(role='teen'){
 const parent=role==='parent';
 const support=parent
  ? '<p><strong>För dig som vuxen:</strong> Barnet ska inte behöva ta ansvar för hot eller våld. Om du själv hotar, skrämmer eller skadar någon: ta ansvar och sök hjälp, exempelvis via socialtjänsten eller vården. Du kan ringa <a href="tel:1177">1177</a> för vårdråd eller <a href="tel:0771505050">Bris vuxentelefon 0771-50 50 50</a> för frågor om barn.</p>'
  : '<p><strong>För dig som är ung:</strong> Du har rätt att känna dig trygg och behöver inte lösa hot eller våld med bättre samtalsteknik. Prata med en trygg vuxen. Är du under 18 kan du kontakta <a href="https://www.bris.se/" target="_blank" rel="noopener noreferrer">Bris</a> gratis och anonymt via <a href="tel:116111">116 111</a>, sms eller chatt. Är du 18 år eller äldre kan du kontakta <a href="tel:1177">1177</a> för råd om vart du kan vända dig.</p>';
 return '<details class="live-panel comm-safety"><summary><strong>När samtal inte känns trygga</strong><span>Vid hot, rädsla eller kontroll behöver trygghet komma före samtalsövningar.</span></summary>'+
  '<div class="comm-safety-body"><p>Om någon är i akut fara: ring <a href="tel:112">112</a>. Om det inte är akut kan du söka stöd via <a href="https://www.1177.se/" target="_blank" rel="noopener noreferrer">1177</a>, socialtjänsten eller en person du litar på. Du behöver inte vara säker på om det du upplever räknas som våld för att be om hjälp.</p>'+support+
  '<p>Det här är generell information. Hemmakompassen bedömer inte risknivå och kontaktar ingen åt dig. Inget skrivs ned eller skickas när du öppnar texten.</p></div></details>';
}
export function renderCommunicationToolkit(role='teen'){
 const parent=role==='parent';
 const exercises=[
  exercise('Spegla innan du svarar','När ni talar förbi varandra',[
   'En person berättar utan avbrott. Den andra försöker förstå.',
   'Återge vad du hört med egna ord och fråga ”Har jag förstått rätt?”',
   'Låt den andra rätta dig. Först sedan berättar du ditt perspektiv.'
  ],parent?'”Du vill få mer inflytande. Stämmer det att det är det viktigaste?”':'”Du är orolig för att jag ska sova för lite. Har jag förstått?”'),
  exercise('Pausa och återkom','När stressen är för hög',[
   'Säg att du behöver en paus, utan att hota eller straffa med tystnad.',
   'Föreslå en tid att återkomma till samtalet.',
   'När ni börjar igen: ta en sak i taget och fråga vad den andra behöver.'
  ],'”Jag märker att jag höjer rösten. Jag behöver pausa. Kan vi försöka igen efter middagen?”'),
  exercise('Reparera efter ett gräl','När något blivit sårande',[
   'Beskriv vad du gjorde, utan ett ”men du …”.',
   'Lyssna på hur det påverkade den andra. Kräv inte förlåtelse.',
   'Säg vad du själv vill försöka göra annorlunda.'
  ],parent?'”Jag avbröt dig och höjde rösten. Det var inte okej. Jag vill lyssna färdigt nästa gång.”':'”Jag sa något sårande. Jag vill inte göra om det. Vill du berätta hur det kändes?”'),
  exercise('Hitta en gemensam lösning','När ni bråkar om ett vardagsproblem',[
   'Beskriv problemet konkret utan att skuldbelägga.',
   'Låt båda förklara sina behov. Skilj på förälderns trygghetsansvar och förhandlingsbara frågor.',
   'Kom på flera alternativ. Välj ett frivilligt försök och bestäm när ni vill följa upp.'
  ],'”Jag behöver lugn på kvällen, och du vill prata med dina vänner. Vad skulle vi kunna testa?”'),
  exercise('Fem minuter kontakt','När ni pratar för lite',[
   'Fråga om det finns en stund som passar. Ett nej eller ”inte nu” är okej.',
   'Ställ en nyfiken, öppen fråga utan att ge råd direkt.',
   'Tacka för det som delas. Ni behöver inte lösa någonting.'
  ],'”Vad har varit bäst och svårast den här veckan? Du får också säga pass.”'),
  exercise('Ta upp något känsligt','När tidpunkten spelar roll',[
   'Fråga först om det passar eller när den andra hellre vill prata.',
   'Säg konkret vad saken gäller, utan att förklara vad den andra ”egentligen” vill.',
   'Håll er till en fråga i taget.'
  ],'”Jag har tänkt på hur våra morgnar blir. Skulle vi kunna prata om det i kväll?”'),
  exercise('Bekräfta utan att hålla med','När den andra känner sig missförstådd',[
   'Beskriv försiktigt vad du hör att den andra känner eller behöver, utan att sätta etikett på personen.',
   'Fråga om din tolkning stämmer och lyssna på rättelsen.',
   'Skilj på att förstå en upplevelse och att hålla med om slutsatsen. Ditt perspektiv får finnas kvar.'
  ],'”Jag hör att du blev besviken när jag sa nej. Har jag förstått? Vi kan prata om det, även om mitt beslut står kvar.”'),
  exercise('Be om något konkret','När kritik blir till låsning',[
   'Beskriv en specifik situation utan att säga ”alltid” eller ”aldrig”.',
   'Säg vad du själv behöver och be om en liten, genomförbar handling.',
   'Ge plats för ett nej eller ett annat förslag. Förälderns nödvändiga omsorgsbeslut är inte en låtsasförhandling.'
  ],parent?'”När vi pratar över varandra blir jag stressad. Kan vi prova att låta varandra tala klart?”':'”När jag blir avbruten tappar jag tråden. Skulle du kunna låta mig prata färdigt?”'),
  exercise('Sätt en gräns med respekt','När ett nej behöver bli tydligt',parent?[
   'Lyssna på hur tonåringen ser på saken och skilj på önskemål och omsorgsansvar.',
   'Säg tydligt vilket beslut du som vuxen behöver ta och varför, utan hot eller skuld.',
   'Låt tonåringen ha inflytande över sådant som faktiskt kan diskuteras och följ upp hur det fungerade.'
  ]:[
   'Säg kort vad du inte vill eller orkar just nu. Du behöver inte bevisa att din känsla är rätt.',
   'Föreslå en annan tid eller ett alternativ om du vill – ett nej får också vara ett nej.',
   'Om någon hotar eller inte respekterar din trygghet: sök hjälp hos en trygg vuxen. Du ska inte behöva lösa det genom bättre formuleringar.'
  ],parent?'”Jag förstår att du vill fortsätta spela. Jag ansvarar för att du får sova. Vi stänger nu, och du får föreslå hur vi gör imorgon.”':'”Jag vill inte prata om det just nu. Jag kan prata imorgon, men jag behöver en paus ikväll.”')
 ];
 const situations=[
  ['Vi avbryter varandra','lyssna','Öva på att återge innan ni svarar'],
  ['Vi är för upprörda','pausa','Pausa och bestäm när ni återkommer'],
  ['Någon blev sårad','reparera','Ta ansvar utan att kräva förlåtelse'],
  ['Vi kör fast i en regel','losning','Skilj på behov och vuxenansvar'],
  ['Jag känner mig missförstådd','validera','Bekräfta utan att hålla med'],
  [parent?'Jag behöver sätta en gräns':'Jag vill säga nej','grans','Var tydlig utan hot eller skuld']
 ];
 return '<div class="comm-toolkit"><header class="comm-hero"><p class="comm-kicker">Förstå först, lös sedan</p><h1>Verktyg för bättre samtal</h1><p>Välj ett verktyg utifrån vad som händer mellan er. Ni kan lyssna och ta varandras perspektiv utan att hålla med.</p><p><a href="#kommunikation/spegla">Öva på att spegla någon</a> · <a href="#kommunikation/plan">Förbered en privat samtalsplan</a></p></header>'+
  '<div class="comm-feature-grid"><section class="live-panel comm-feature"><p class="comm-kicker">För båda</p><h2>Nonviolent Communication (NVC)</h2><p>Observation, känsla, behov och önskemål. Träna på ett tydligt jag-budskap utan anklagelser.</p><a class="live-button" href="#nvc">Bygg ett jag-budskap</a></section>'+
  (parent?'<section class="live-panel comm-feature"><p class="comm-kicker">För föräldern</p><h2>Motiverande samtal (MI)</h2><p>Öppna frågor, reflektioner, bekräftelse och sammanfattning. Lyssna utan att försöka styra fram ett visst svar.</p><a class="live-button" href="#mi-foralder">Öppna MI-övningarna</a></section>':'<section class="live-panel comm-feature"><p class="comm-kicker">För tonåringen</p><h2>Din röst är viktig</h2><p>Du får be om att bli lyssnad på, föreslå en annan tid eller tacka nej. Det är inte ditt ansvar att lösa alla konflikter.</p><a href="#nvc">Träna på att uttrycka dig</a></section>')+
  '</div>'+renderCommunicationSafety(role)+'<section class="live-panel comm-situations" aria-labelledby="comm-situations-title"><h2 id="comm-situations-title">Vad händer just nu?</h2><p>Välj en situation. Den passande övningen öppnas direkt här på sidan. Inga svar skickas eller sparas.</p><div class="comm-situation-grid">'+situations.map(([title,skill,desc])=>'<button type="button" class="comm-situation" data-comm-open="'+e(skill)+'"><strong>'+e(title)+'</strong><span>'+e(desc)+'</span></button>').join('')+'</div></section><section class="comm-section"><h2>När samtalet fastnar</h2><p class="live-muted">Öppna en övning och prova en enda sak. Exemplen är förslag, inte repliker någon måste säga.</p><div class="comm-exercises">'+exercises.join('')+'</div></section>'+
  '<section class="live-panel" id="comm-reflection-practice"><h2 tabindex="-1">Öva på att lyssna och spegla</h2><p>Formulera en varsam spegling av något den andra faktiskt sagt. Avstå från att tolka tankar, tillskriva motiv eller kräva ett visst svar. Det är helt okej om den andra inte vill prata.</p>'+
  '<form id="comm-reflection-form"><div class="comm-fields">'+[
    ['heard','1. Vad hörde jag personen säga?','Återge kort personens egna ord, utan att fylla i vad du tror att hen menar.'],
    ['meaning','2. Vad kan vara viktigt för personen?','En försiktig gissning, inte en sanning. Det går också bra att skriva att du är osäker.'],
    ['check','3. Hur kan jag fråga om jag förstått?','En kort, öppen kontrollfråga som den andra kan säga nej till eller rätta.']
  ].map(([key,title,hint])=>'<label for="comm-reflection-'+key+'"><strong>'+e(title)+'</strong><span>'+e(hint)+'</span></label><textarea id="comm-reflection-'+key+'" name="'+key+'" rows="2" maxlength="240" required></textarea>').join('')+
  '</div><div class="comm-actions"><button type="submit" class="live-button">Förhandsgranska min spegling</button><button type="button" class="comm-quiet-button" data-comm-reflection-reset>Töm speglingen</button></div></form>'+
  '<p id="comm-reflection-output" class="comm-output" tabindex="-1" role="status" aria-live="polite">Din privata spegling visas här.</p>'+renderCommunicationCopyTools('reflection')+
  '<p class="live-muted">'+(parent?'Du är som vuxen ansvarig för att inte pressa fram svar.':'Du behöver inte bära ansvaret för att lösa en vuxens oro eller konflikt.')+' Inget sparas eller skickas. Vid rädsla, hot eller kontroll ska trygghet gå före samtalsövningar.</p></section>'+
  '<section class="live-panel" id="comm-solution-planner"><h2 tabindex="-1">Förbered ett förslag – utan att bestämma åt den andra</h2><p>Skriv din egen bild, en öppen fråga och ett förslag som ni kan diskutera. Din text <strong>sparas inte</strong>, skickas inte till någon och används inte av AI. Den andra personen har inte godkänt något bara för att du fyller i formuläret.</p>'+
  '<form id="comm-solution-form"><div class="comm-fields">'+[
    ['problem','1. Vad vill jag prata om?','Beskriv en konkret situation, utan att tolka den andras motiv.'],
    ['question','2. Vad vill jag förstå?','Formulera en öppen fråga om den andras perspektiv.'],
    ['experiment','3. Vad skulle jag vilja prova?','Föreslå ett litet, frivilligt försök. Det är okej om den andra säger nej.'],
    ['followup','4. När skulle vi kunna följa upp?','Föreslå en tid – låt den andra välja om och när ni pratar vidare.']
  ].map(([key,title,hint])=>'<label for="comm-solution-'+key+'"><strong>'+e(title)+'</strong><span>'+e(hint)+'</span></label><textarea id="comm-solution-'+key+'" name="'+key+'" rows="2" maxlength="240" required></textarea>').join('')+
  '</div><div class="comm-actions"><button class="live-button" type="submit">Förhandsgranska min samtalsplan</button><button class="comm-quiet-button" type="button" data-comm-solution-reset>Töm fälten</button></div></form>'+
  '<p id="comm-solution-output" class="comm-output" role="status" aria-live="polite" tabindex="-1">Din privata samtalsplan visas här.</p>'+renderCommunicationCopyTools('solution')+'<p class="live-muted">Det här är ett eget utkast, inte ett gemensamt beslut. Vid hot, kontroll eller rädsla ska trygghet och stöd gå före en sådan övning.</p></section>'+
  '<section class="live-panel"><h2>Från samtal till en idé</h2><p>Vill ni testa en ny rutin? Skriv ett frivilligt förslag i <a href="#regler">Schyssta listan</a>. Ingen regel är gemensam förrän båda uttryckligen sagt ja. Hitta gemensamma intressen i <a href="#swipe">Gillaswajpen</a>.</p>'+
  '<p>Föräldern har fortfarande ansvar för säkerhet, omsorg och rimliga gränser. Om någon är rädd eller hotad: prioritera trygghet och stöd, inte samtalsteknik.</p></section>'+
  '<section class="live-panel comm-sources"><h2>Källor och begränsningar</h2><p>Övningarna utgår från beskrivna samtalsfärdigheter och är redaktionellt anpassade för vardagen. De är inte en prövad familjebehandling. NVC är en kommunikationsmodell – inte en metod vars effekter här är kliniskt validerade.</p><ul>'+COMMUNICATION_SOURCES.map(s=>'<li><a href="'+e(s.url)+'" target="_blank" rel="noopener noreferrer">'+e(s.title)+'</a></li>').join('')+'</ul></section></div>';
}
export function buildReflectionPractice(input={}){
 const normalize=value=>typeof value==='string'?value.replace(/\s+/g,' ').trim().slice(0,240):'';
 const [heard,meaning,check]=['heard','meaning','check'].map(key=>normalize(input[key]));
 if(!heard||!meaning||!check)return null;
 // Free-text answers may be nouns, sentence fragments or complete sentences.
 // Present the user's three parts as labelled notes, never splice them into
 // a grammatical claim or invent what the other person meant.
 return 'Det jag hörde: '+heard+'\nMin försiktiga gissning om vad som kan vara viktigt: '+meaning+'\nMin fråga för att kontrollera om jag förstått: '+check+'\nDen andra kan rätta min gissning, säga nej eller avstå från samtalet.';
}
export function buildSolutionPlan(input={}){
 const normalize=value=>typeof value==='string'?value.replace(/\s+/g,' ').trim().slice(0,240):'';
 const [problem,question,experiment,followup]=['problem','question','experiment','followup'].map(key=>normalize(input[key]));
 if(!problem||!question||!experiment||!followup)return null;
 return 'Jag vill prata om: '+problem+'\nJag vill förstå: '+question+'\nMitt förslag att diskutera: '+experiment+'\nFörslag på uppföljning: '+followup+'\nDetta är bara mitt utkast. Den andra får säga nej eller föreslå något annat.';
}
// Free-text fields cannot safely be concatenated into one Swedish sentence.
// This labelled local draft preserves the four NVC parts without inventing grammar.
function nvcParts(input={}){
 if(!input || typeof input!=='object'||Array.isArray(input))return null;
 const trim=s=>typeof s==='string'?s.replace(/\s+/g,' ').trim().replace(/[.!?;,:]+$/u,'').slice(0,240):'';
 const a=['observation','feeling','need','request'].map(k=>trim(input[k]));
 return a.some(s=>!s)?null:a;
}
export function buildNvcSentence(input={}){
 const a=nvcParts(input);
 if(!a)return null;
 return 'Det jag lade märke till: '+a[0]+'\nMin känsla: '+a[1]+'\nMitt behov: '+a[2]+'\nMitt önskemål: '+a[3];
}
// Time-limit a single AI step: login, HTTP and JSON parsing may each stall.
// The controller also cancels the fetch where supported. A timed-out response
// must never replace the user's local four-part draft.
export async function withNvcAiDeadline(promise,controller,timeoutMs=30000){
 let timer;
 try{
  return await Promise.race([
   Promise.resolve(promise),
   new Promise((_,reject)=>{
    timer=setTimeout(()=>{
     controller?.abort();
     reject(new Error('AI-tjänsten svarade inte i tid. Ditt fyrdelade utkast finns kvar.'));
    },timeoutMs);
   })
  ]);
 }finally{clearTimeout(timer);}
}
// Used only after an explicit AI-button click. No project/family context is included.
export function buildNvcAiPrompt(input={}){
 const a=nvcParts(input);
 if(!a)return null;
 return 'Skriv EN kort (högst 65 ord), naturlig och grammatiskt korrekt svensk NVC-formulering i jagform. '+
  'Utgå från observation, känsla, behov och ett konkret, frivilligt önskemål. '+
  'Skriv om råa fältanteckningar till idiomatisk svenska: anpassa meningsbyggnad, pronomen, verb och böjningar. '+
  'Klistra aldrig bara ihop fälten efter orden ”När”, ”känner jag”, ”Jag behöver” eller ”Skulle du vilja”. '+
  'Om ett fält redan är en hel mening, väv in dess innebörd utan att dubblera inledningen. '+
  'Behåll användarens avsedda innebörd, även om orden är ovanliga. Hitta inte på händelser, känslor, behov eller råd. '+
  'Svara bara med den färdiga formuleringen, utan rubriker, fältetiketter, punktlista, förklaring eller följdfråga.\n'+
  'Observation: '+a[0]+'\nKänsla: '+a[1]+'\nBehov: '+a[2]+'\nÖnskemål: '+a[3];
}
// The prompt's 65-word limit is not a guarantee: model outputs are untrusted.
// Reject overlong replies rather than silently truncating a user's requested
// observation, feeling, need or request mid-sentence.
export function normalizeNvcAiReply(value){
 if(typeof value!=='string')return null;
 const original=value.trim();
 // Reject field-by-field output and lists: the AI button promises one natural
 // utterance, not a repeat of the four labelled draft fields.
 if(/(?:^|\n)\s*(?:#{1,6}\s+|[-*]\s+|\d+[.)]\s+|(?:observation|känsla|behov|önskemål)\s*:)/iu.test(original))return null;
 const reply=original.replace(/\s+/gu,' ');
 // A punctuation-only response is not a usable sentence, even if it is short.
 // Keep the four-part local draft rather than claiming such output is ready.
 if(!reply||reply.length>600||reply.split(' ').length>65||!/\p{L}/u.test(reply))return null;
 return reply;
}
export function renderNvcExercise(role='teen'){
 const parent=role==='parent';
 const fields=[
  ['observation','1. Vad hände?','Beskriv vad någon gjorde eller sade, utan att tolka varför. Skriv med egna ord – det behöver inte bli en färdig mening.','Vi började prata om skärmtid mitt under läxorna'],
  ['feeling','2. Vad känner jag?','Skriv känslan med ett eller några ord. Exempelvis frustrerad, orolig eller lättad.','frustrerad'],
  ['need','3. Vad behöver jag?','Beskriv ett behov, inte vad den andra personen måste göra. Exempelvis lugn, inflytande eller tydlighet.','lugn och tid att förklara'],
  ['request','4. Vad vill jag be om?','Föreslå en konkret handling eller tidpunkt. Lämna utrymme för att säga nej eller föreslå något annat.','prata i tio minuter i kväll']
 ];
 return '<div class="comm-toolkit comm-nvc"><nav aria-label="Tillbaka till kommunikationsråd"><a href="#kommunikation">← Alla samtalsverktyg</a></nav><header class="comm-hero"><p class="comm-kicker">För båda</p><h1>Nonviolent Communication</h1><p>Fyra steg: observation, känsla, behov och ett konkret önskemål. Det handlar om kontakt – inte om att vinna diskussionen.</p></header>'+
 '<section class="live-panel"><h2>Från anklagelse till jag-budskap</h2><p><strong>Prova istället för ”Du lyssnar aldrig!”</strong></p><p class="comm-example">'+(parent?'”När vi börjar prata om skärmtid sent känner jag mig stressad. Jag behöver lugn och tydlighet. Skulle du vilja prata om en plan efter middagen?”':'”När du ger råd innan jag har berättat färdigt känner jag mig frustrerad. Jag behöver få säga klart. Skulle du vilja lyssna innan du svarar?”')+'</p>'+
 '<p>En önskan är inte en dold order. Respektera ett nej och var beredd att föreslå en annan väg. Förälderns ansvar för trygghet och omsorg finns kvar.</p></section>'+
 renderCommunicationSafety(role)+
 '<section class="live-panel"><h2>Bygg din egen formulering</h2><p>Skriv kort i varje fält, precis som du skulle anteckna. Du behöver inte själv få delarna att bilda en grammatisk mening. Den första knappen visar dina fyra delar var för sig; AI-knappen kan sedan göra ett sammanhängande språkförslag.</p><p>Ditt fyrdelade utkast skapas lokalt i webbläsaren och sparas inte. Vill du få en kort, mer naturlig mening kan du sedan välja <strong>Förbättra språket med AI</strong>. Då skickas just de fyra fälten till AI-tjänsten. Ingen projektinformation hämtas, ingen sparad chatt skapas och inget skickas till familjemedlemmen. Undvik känsliga namn eller detaljer i text som skickas till AI.</p>'+
 '<form id="comm-nvc-form"><div class="comm-fields">'+fields.map(([id,title,hint,placeholder])=>'<label for="comm-'+id+'"><strong>'+e(title)+'</strong><span>'+e(hint)+'</span></label><textarea id="comm-'+id+'" name="'+id+'" rows="2" required maxlength="240" placeholder="'+e(placeholder)+'"></textarea>').join('')+'</div><div class="comm-actions"><button class="live-button" type="submit">Visa mina fyra delar</button><button class="comm-quiet-button" type="button" data-comm-reset>Töm fälten</button></div></form>'+
 '<p id="comm-nvc-output" class="comm-output" tabindex="-1" role="status" aria-live="polite">Ditt utkast visas här när du är redo.</p>'+
 '<div class="comm-actions"><button class="comm-quiet-button" id="comm-nvc-ai" type="button" disabled>Förbättra språket med AI</button></div>'+
 '<p id="comm-nvc-ai-status" role="status" aria-live="polite"></p>'+
 renderCommunicationCopyTools('nvc')+'<p class="live-muted">AI-förslaget är bara ett utkast, inte en garanti för en bra formulering. Granska innehållet innan du använder det. Texten försvinner när du lämnar sidan.</p></section>'+
 '<section class="live-panel"><h2>Lyssna med samma fyra steg</h2><p>Pröva en försiktig gissning i stället för att tillskriva den andra motiv: ”Känner du dig frustrerad för att du vill ha mer inflytande?” Fråga om du uppfattat rätt.</p><p>NVC är en modell för samtal, inte en garanti för konfliktlösning eller en kliniskt validerad familjebehandling. <a href="https://www.cnvc.org/about/purpose-of-nvc" target="_blank" rel="noopener noreferrer">Läs mer hos CNVC</a>.</p></section></div>';
}
