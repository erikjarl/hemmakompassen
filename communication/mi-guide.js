import {renderCommunicationSafety} from './toolkit.js';
// Editorial, parent-only conversational support. No family data is read or stored.
// The exercises adapt MI-informed skills for everyday parenting; they are not MI treatment.
export const MI_PARENT_SOURCES=Object.freeze([
  {title:'Socialstyrelsen – MI (Motiverande samtal)',url:'https://socialstyrelsen.se/kunskapsstod-och-regler/omraden/evidensbaserad-praktik/metodguiden/mi-motiverande-samtal/'},
  {title:'MINT – Understanding Motivational Interviewing',url:'https://motivationalinterviewing.org/understanding-motivational-interviewing'},
  {title:'Folkhälsomyndigheten – Kommunikation och MI',url:'https://www.folkhalsomyndigheten.se/motiverande-samtal-om-sexuell-halsa/introduktion-till-mi/kommunikation/'},
  {title:'Kunskapsguiden – Samtal med barn',url:'https://kunskapsguiden.se/omraden-och-teman/barn-och-unga/samtal-med-barn/hantering-av-samtal-samtalstekniker-och-samtalsmetoder/'}
]);

export function renderParentMiGuide(){
  const sources=MI_PARENT_SOURCES.map(({title,url})=>
    '<li><a href="'+url+'" target="_blank" rel="noopener noreferrer">'+title+'</a></li>').join('');
  return '<div class="mi-parent-guide"><nav aria-label="Tillbaka till kommunikationsråd"><a href="#kommunikation">← Till Kommunikationsråd</a></nav>'+
    '<h1>Lyssna innan du föreslår</h1>'+
    '<p class="live-muted">MI-inspirerade samtalsfärdigheter för dig som är förälder</p>'+
    '<section class="live-panel"><h2>Vad är målet?</h2>'+
    '<p>Försök förstå tonåringens perspektiv innan du berättar vad du själv tänker. Det handlar inte om att få ett ja, vinna en diskussion eller övertyga med smarta frågor. Tonåringen har rätt att tycka annorlunda.</p>'+
    '<p>Detta är vardagliga samtalsförslag inspirerade av motiverande samtal (MI) – <strong>inte</strong> en prövad föräldrametod eller behandling. Forskning om MI i vård kan inte automatiskt överföras till relationen hemma.</p></section>'+
    renderCommunicationSafety('parent')+
    '<section class="live-panel"><h2>Fyra sätt att lyssna</h2><ol>'+
    '<li><strong>Fråga öppet:</strong> ”Hur ser du på det?” eller ”Vad blir svårt med den här regeln?” Ställ hellre en fråga och ge tid än många i följd.</li>'+
    '<li><strong>Återspegla utan att rätta:</strong> ”Det känns som att jag bestämmer allt” kan mötas med ”Du vill få mer att säga till om.” Kontrollera: ”Förstod jag rätt?”</li>'+
    '<li><strong>Bekräfta en ansträngning:</strong> ”Du försöker förklara fast vi är oense.” Bekräfta att personen försöker, utan att behöva hålla med om sakfrågan.</li>'+
    '<li><strong>Sammanfatta:</strong> ”Du vill kunna prata med vänner sent, och jag oroar mig för sömnen. Har jag uppfattat det rätt?”</li>'+
    '</ol></section>'+
    '<section class="live-panel"><h2>Två korta MI-inspirerade övningar</h2>'+ 
    '<h3>Fråga om lov innan du berättar vad du tänker</h3><p>”Jag har en tanke om det där. Vill du höra den, eller ska jag lyssna lite till?” Om tonåringen säger nej: lyssna eller välj en annan tid. Om du behöver sätta en gräns av omsorgsskäl ska du säga att beslutet är ditt vuxenansvar, inte låtsas att det är ett frivilligt samtycke.</p>'+ 
    '<h3>Utforska ambivalens utan att argumentera</h3><p>”Vad tycker du fungerar med situationen som den är? Och finns det något som du själv skulle vilja ändra?” Återge båda sidorna utan att bara förstärka det som passar ditt förslag. Du kan fråga om tonåringen har en egen idé, men du måste kunna acceptera att svaret blir nej.</p>'+ 
    '<p class="live-muted">MI utvecklades i professionella hjälpsamtal. Det här är frivilliga vardagsövningar, inte en metod för att få tonåringen att lyda eller ett påstående om klinisk effekt i familjer.</p></section>'+
    '<section class="live-panel"><h2>Exempel: konflikt om mobilen</h2>'+
    '<p><strong>Tonåring:</strong> ”Du fattar ingenting! Jag vill bestämma själv.”</p>'+
    '<p><strong>Förälder:</strong> ”Du vill att jag ska lita på dig och att du får mer frihet. Är det så du menar?”</p>'+
    '<p><strong>Tonåring:</strong> ”Ja, jag är inte liten längre.”</p>'+
    '<p><strong>Förälder:</strong> ”Du har börjat ta mer ansvar. Jag är samtidigt ansvarig för att du får sova. Får jag berätta vad jag oroar mig för?”</p>'+
    '<p><strong>Förälder efter samtalet:</strong> ”Vi behöver en fungerande kvällsrutin. Vad skulle du vilja pröva? Jag kan också säga vilken gräns jag behöver sätta.”</p>'+
    '<p class="live-muted">Exemplet illustrerar ett sätt att prata, inte vad tonåringen måste svara eller gå med på.</p></section>'+
    '<section class="live-panel"><h2>När ni inte är överens</h2><ul>'+
    '<li>Fråga om tonåringen vill fortsätta prata nu eller vid en annan tid. Ett nej är inte ett samtycke.</li>'+
    '<li>Om du behöver bestämma något för trygghet eller omsorg: var tydlig med att <strong>det är ditt vuxenansvar</strong>. Lägg inte över det på tonåringen.</li>'+
    '<li>Undvik att använda bekräftelser eller frågor för att styra fram ett bestämt svar. Lyssna också när svaret inte passar dig.</li>'+
    '<li>Om någon känner sig hotad eller rädd: prioritera trygghet och hjälp framför samtalsteknik.</li>'+
    '</ul></section>'+
    '<section class="live-panel"><h2>Från samtal till ett frivilligt förslag</h2>'+
    '<p>Om ni båda vill: formulera ett konkret förslag och prova det under en överenskommen tid. Ni kan skriva det i <a href="#regler">Schyssta listan</a>. Ett förslag där är inte en gemensam regel förrän båda uttryckligen har godkänt det.</p>'+
    '<p>Varken samtalsteknik eller Schyssta listan ska användas för att få tonåringen att ta ansvar för vuxnas omsorg eller för relationens trygghet.</p></section>'+
    '<section class="live-panel"><h2>Källor och begränsningar</h2>'+
    '<p>Principerna om öppna frågor, reflektivt lyssnande, bekräftelse och autonomi stöds av nedanstående metodbeskrivningar. De är <strong>inte</strong> belägg för effekten av just denna sida eller dessa formuleringar i familjer.</p>'+
    '<ul>'+sources+'</ul></section></div>';
}
