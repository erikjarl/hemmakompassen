// Frivilliga, redaktionella samtalsövningar. Inga familjeuppgifter hämtas eller sparas.
export const COMMUNICATION_SOURCES=[
 {title:'MINT – Motivational Interviewing (OARS)',url:'https://motivationalinterviewing.org/understanding-motivational-interviewing'},
 {title:'Center for Nonviolent Communication – NVC',url:'https://www.cnvc.org/about/purpose-of-nvc'},
 {title:'1177 – Tonåringar 13–18 år',url:'https://www.1177.se/barn--gravid/sa-vaxer-och-utvecklas-barn/barnets-utveckling/tonaringar-13-18-ar'},
 {title:'CDC – Connecting Conversations',url:'https://www.cdc.gov/healthy-youth/connecting-conversations/index.html'},
 {title:'American Academy of Pediatrics – Communicating with teens',url:'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/How-to-Communicate-with-a-Teenager.aspx'}
];
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function exercise(title,purpose,steps,example){
 return '<details class="comm-exercise"><summary><strong>'+e(title)+'</strong><span>'+e(purpose)+'</span></summary><div class="comm-exercise-content"><ol>'+steps.map(s=>'<li>'+e(s)+'</li>').join('')+'</ol><p class="comm-example"><strong>Exempel:</strong> '+e(example)+'</p></div></details>';
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
  ],'”Jag har tänkt på hur våra morgnar blir. Skulle vi kunna prata om det i kväll?”')
 ];
 return '<div class="comm-toolkit"><header class="comm-hero"><p class="comm-kicker">Förstå först, lös sedan</p><h1>Verktyg för bättre samtal</h1><p>Välj ett verktyg utifrån vad som händer mellan er. Ni kan lyssna och ta varandras perspektiv utan att hålla med.</p></header>'+
  '<div class="comm-feature-grid"><section class="live-panel comm-feature"><p class="comm-kicker">För båda</p><h2>Nonviolent Communication (NVC)</h2><p>Observation, känsla, behov och önskemål. Träna på ett tydligt jag-budskap utan anklagelser.</p><a class="live-button" href="#nvc">Bygg ett jag-budskap</a></section>'+
  (parent?'<section class="live-panel comm-feature"><p class="comm-kicker">För föräldern</p><h2>Motiverande samtal (MI)</h2><p>Öppna frågor, reflektioner, bekräftelse och sammanfattning. Lyssna utan att försöka styra fram ett visst svar.</p><a class="live-button" href="#mi-foralder">Öppna MI-övningarna</a></section>':'<section class="live-panel comm-feature"><p class="comm-kicker">För tonåringen</p><h2>Din röst är viktig</h2><p>Du får be om att bli lyssnad på, föreslå en annan tid eller tacka nej. Det är inte ditt ansvar att lösa alla konflikter.</p><a href="#nvc">Träna på att uttrycka dig</a></section>')+
  '</div><section class="comm-section"><h2>När samtalet fastnar</h2><p class="live-muted">Öppna en övning och prova en enda sak. Exemplen är förslag, inte repliker någon måste säga.</p><div class="comm-exercises">'+exercises.join('')+'</div></section>'+
  '<section class="live-panel"><h2>Från samtal till en idé</h2><p>Vill ni testa en ny rutin? Skriv ett frivilligt förslag i <a href="#regler">Schyssta listan</a>. Ingen regel är gemensam förrän båda uttryckligen sagt ja. Hitta gemensamma intressen i <a href="#swipe">Gillaswajpen</a>.</p>'+
  '<p>Föräldern har fortfarande ansvar för säkerhet, omsorg och rimliga gränser. Om någon är rädd eller hotad: prioritera trygghet och stöd, inte samtalsteknik.</p></section>'+
  '<section class="live-panel comm-sources"><h2>Källor och begränsningar</h2><p>Övningarna utgår från beskrivna samtalsfärdigheter och är redaktionellt anpassade för vardagen. De är inte en prövad familjebehandling. NVC är en kommunikationsmodell – inte en metod vars effekter här är kliniskt validerade.</p><ul>'+COMMUNICATION_SOURCES.map(s=>'<li><a href="'+e(s.url)+'" target="_blank" rel="noopener noreferrer">'+e(s.title)+'</a></li>').join('')+'</ul></section></div>';
}
export function buildNvcSentence(input={}){
 const trim=s=>typeof s==='string'?s.replace(/\s+/g,' ').trim().replace(/[.!?;,:]+$/u,'').slice(0,240):'';
 const a=['observation','feeling','need','request'].map(k=>trim(input[k]));
 if(a.some(s=>!s))return null;
 return 'När '+a[0]+' känner jag '+a[1]+'. Jag behöver '+a[2]+'. Skulle du vilja '+a[3]+'?';
}
export function renderNvcExercise(role='teen'){
 const parent=role==='parent';
 const fields=[
  ['observation','1. Vad hände?','Beskriv något man kan se eller höra, utan ”alltid” eller tolkningar.','vi börjar diskutera medan jag gör läxor'],
  ['feeling','2. Vad känner jag?','Till exempel frustrerad, rädd, ledsen eller lättad.','mig frustrerad'],
  ['need','3. Vad behöver jag?','Exempelvis lugn, inflytande, trygghet eller tydlighet.','lugn och tid att förklara'],
  ['request','4. Vad vill jag be om?','En konkret, genomförbar handling som går att säga nej till.','prata i tio minuter i kväll']
 ];
 return '<div class="comm-toolkit comm-nvc"><nav aria-label="Tillbaka till kommunikationsråd"><a href="#kommunikation">← Alla samtalsverktyg</a></nav><header class="comm-hero"><p class="comm-kicker">För båda</p><h1>Nonviolent Communication</h1><p>Fyra steg: observation, känsla, behov och ett konkret önskemål. Det handlar om kontakt – inte om att vinna diskussionen.</p></header>'+
 '<section class="live-panel"><h2>Från anklagelse till jag-budskap</h2><p><strong>Prova istället för ”Du lyssnar aldrig!”</strong></p><p class="comm-example">'+(parent?'”När vi börjar prata om skärmtid sent känner jag mig stressad. Jag behöver lugn och tydlighet. Skulle du vilja prata om en plan efter middagen?”':'”När du ger råd innan jag har berättat färdigt känner jag mig frustrerad. Jag behöver få säga klart. Skulle du vilja lyssna innan du svarar?”')+'</p>'+
 '<p>En önskan är inte en dold order. Respektera ett nej och var beredd att föreslå en annan väg. Förälderns ansvar för trygghet och omsorg finns kvar.</p></section>'+
 '<section class="live-panel"><h2>Bygg din egen formulering</h2><p>Texten skapas bara i din webbläsare. Den <strong>sparas inte</strong>, skickas inte till familjemedlemmen och används inte av AI.</p>'+
 '<form id="comm-nvc-form"><div class="comm-fields">'+fields.map(([id,title,hint,placeholder])=>'<label for="comm-'+id+'"><strong>'+e(title)+'</strong><span>'+e(hint)+'</span></label><textarea id="comm-'+id+'" name="'+id+'" rows="2" required maxlength="240" placeholder="'+e(placeholder)+'"></textarea>').join('')+'</div><div class="comm-actions"><button class="live-button" type="submit">Sätt ihop min formulering</button><button class="comm-quiet-button" type="button" data-comm-reset>Töm fälten</button></div></form>'+
 '<p id="comm-nvc-output" class="comm-output" tabindex="-1" role="status" aria-live="polite">Din formulering visas här när du är redo.</p><p class="live-muted">Läs gärna högt och ändra texten om den låter onaturlig. Den försvinner när du lämnar sidan.</p></section>'+
 '<section class="live-panel"><h2>Lyssna med samma fyra steg</h2><p>Pröva en försiktig gissning i stället för att tillskriva den andra motiv: ”Känner du dig frustrerad för att du vill ha mer inflytande?” Fråga om du uppfattat rätt.</p><p>NVC är en modell för samtal, inte en garanti för konfliktlösning eller en kliniskt validerad familjebehandling. <a href="https://www.cnvc.org/about/purpose-of-nvc" target="_blank" rel="noopener noreferrer">Läs mer hos CNVC</a>.</p></section></div>';
}
