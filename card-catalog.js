const generalCard=(id,type,category,teenText,parentSharedText=teenText)=>Object.freeze({
  id,
  type,
  audience:type==='understanding'?'teen':'both',
  category,
  teenText,
  parentSharedText,
  version:1,
});

// Stable IDs preserve every existing general-deck answer. Classification only
// describes future role-specific presentation; it does not migrate or share data.
export const GENERAL_CARDS=Object.freeze([
  generalCard('general-01','match','Relationer','Jag uppskattar när vi gör saker tillsammans utan mobiltelefoner.'),
  generalCard('general-02','understanding','Samtal','Jag vill helst prata färdigt innan någon kommer med råd.','Tonåringen vill få prata färdigt innan du kommer med råd.'),
  generalCard('general-03','understanding','Vardag','Jag behöver få vara ifred ibland, även när jag är hemma.','Tonåringen behöver ibland få vara ifred hemma.'),
  generalCard('general-04','understanding','Känslor','Jag tycker det är lätt att säga hur jag mår.','Tonåringen upplever att det är lätt att säga hur hen mår.'),
  generalCard('general-05','understanding','Relationer','Jag känner mig lyssnad på när vi är oense.','Tonåringen känner sig lyssnad på när ni är oense.'),
  generalCard('general-06','understanding','Vardag','Jag vill vara med och bestämma över regler som gäller mig.','Tonåringen vill vara delaktig i beslut om regler som gäller hen.'),
  generalCard('general-07','understanding','Samtal','När vi bråkar behöver jag tid innan jag kan prata igen.','Tonåringen behöver ibland tid innan hen kan prata vidare efter ett bråk.'),
  generalCard('general-08','match','Fritid','Jag tycker det är viktigt att vi har gemensamma aktiviteter.'),
  generalCard('general-09','understanding','Känslor','Jag kan berätta när jag har gjort något som jag ångrar.','Tonåringen upplever att hen kan berätta när hen har gjort något som hen ångrar.'),
  generalCard('general-10','match','Relationer','Jag vill att vi visar mer uppskattning i vardagen.'),
  generalCard('general-11','match','Vardag','Jag mår bra av tydliga överenskommelser hemma.'),
  generalCard('general-12','understanding','Samtal','Jag vill kunna be om hjälp utan att bli bedömd.','Tonåringen vill kunna be om hjälp utan att känna sig bedömd.'),
  generalCard('general-13','match','Relationer','Vi brukar kunna skratta tillsammans även när vi tycker olika.'),
  generalCard('general-14','understanding','Känslor','Jag önskar att vi pratade mer om sådant som är svårt.','Tonåringen önskar att ni pratade mer om sådant som är svårt.'),
  generalCard('general-15','understanding','Tillit','Jag vill kunna berätta om ett misstag utan att samtalet direkt blir ett gräl.','Tonåringen vill kunna berätta om ett misstag utan att samtalet direkt blir ett gräl.'),
  generalCard('general-16','match','Tillit','Jag tycker det är viktigt att vi håller det vi lovar varandra.'),
  generalCard('general-17','match','Tillit','Jag vill att vi berättar när något har skadat tilliten mellan oss.'),
  generalCard('general-18','understanding','Självständighet','Jag vill att vi pratar om hur jag kan få mer ansvar och frihet.','Tonåringen vill prata om hur hen kan få mer ansvar och frihet.'),
  generalCard('general-19','understanding','Självständighet','Det är viktigt för mig att kunna säga nej utan att det blir ett bråk.','Tonåringen vill kunna säga nej utan att det blir ett bråk.'),
  generalCard('general-20','match','Självständighet','Jag vill att vi respekterar varandras privatliv.'),
  generalCard('general-21','match','Samtal','Jag vill att vi frågar varandra innan vi ger råd.'),
  generalCard('general-22','match','Samtal','Jag skulle vilja att vi oftare frågade hur den andra har haft det.'),
  generalCard('general-23','match','Samtal','Jag vill att vi försöker förstå varandras skäl även när vi tycker olika.'),
  generalCard('general-24','match','Konflikter','När vi har blivit osams vill jag att vi försöker hitta tillbaka till varandra.'),
  generalCard('general-25','match','Konflikter','Jag tycker det hjälper när någon säger förlåt efter att ha sårat den andra.'),
  generalCard('general-26','match','Konflikter','Jag vill att vi undviker att höja rösten när vi är oense.'),
  generalCard('general-27','understanding','Känslor','Jag vill kunna säga att jag är ledsen eller orolig utan att behöva förklara allt direkt.','Tonåringen vill kunna säga att hen är ledsen eller orolig utan att behöva förklara allt direkt.'),
  generalCard('general-28','match','Känslor','Jag vill att vi märker när någon behöver stöd och frågar vad som skulle hjälpa.'),
  generalCard('general-29','match','Vardag','Jag vill att vi bestämmer viktiga saker tillsammans när det går.'),
  generalCard('general-30','match','Vardag','Jag tycker det är viktigt att vi kan ändra en regel som inte fungerar.'),
  generalCard('general-31','match','Digital vardag','Jag vill att vi pratar om mobilanvändning utan att någon känner sig anklagad.'),
  generalCard('general-32','match','Gemenskap','Jag skulle vilja att vi gjorde något roligt tillsammans oftare.'),
  generalCard('general-33','match','Gemenskap','Jag uppskattar små stunder tillsammans även när vi inte pratar om något särskilt.'),
  generalCard('general-34','match','Uppskattning','Jag vill att vi oftare berättar vad vi uppskattar hos varandra.'),
]);

const themeDeck=(id,title,texts)=>Object.freeze({
  id,
  title,
  type:'match',
  audience:'both',
  version:1,
  cards:Object.freeze(texts.map((text,index)=>Object.freeze({
    id:id+'-'+String(index+1).padStart(2,'0'),
    type:'match',
    audience:'both',
    category:title,
    teenText:text,
    parentSharedText:text,
    version:1,
  }))),
});

export const THEME_DECK_MODELS=Object.freeze([
  themeDeck('samtal','Samtalsämnen',['Vad som varit roligt den senaste veckan','Hur vi har det i skolan eller på jobbet','Vad vi vill göra under nästa ledighet','Hur vi vill prata om sociala medier','Vad vi vill lära oss','Hur vi visar att vi lyssnar','Vad som gör oss stressade','Vad vi drömmer om framöver']),
  themeDeck('aktiviteter','Aktiviteter tillsammans',['Laga mat tillsammans','Ta en promenad ihop','Se en film tillsammans','Spela ett spel','Prova en ny aktivitet','Göra en utflykt','Visa varandra favoritmusik','Skapa något tillsammans']),
  themeDeck('regler','Regler för Schyssta listan',['Vi knackar innan vi går in i varandras rum.','Vi lyssnar färdigt innan vi svarar.','Vi får pausa gräl och bestämmer när vi pratar vidare.','Vi frågar innan vi lånar varandras saker.','Vi pratar om hur sysslorna ska fördelas.','Vi berättar när planer som berör andra ändras.','Vi kommer överens om tider för sömn och hemkomst.','Vi kan ompröva regler som inte fungerar.','Vi bestämmer gemensamma mobilfria stunder.','Vi försöker prata utan att höja rösten.','Vi får säga till när något känns orättvist.','Vi försöker reda ut saker efter ett bråk.']),
  themeDeck('uppskattning','Sätt att visa uppskattning',['Säga tack för små saker','Fråga hur den andra mår','Skicka ett vänligt meddelande','Göra något hjälpsamt','Ge en kram när båda vill','Berätta vad man uppskattar','Uppmärksamma den andras ansträngning','Ge varandra odelad uppmärksamhet']),
  themeDeck('aterhamtning','Svåra situationer och återhämtning',['Ta en paus när vi blir arga','Fråga om den andra vill ha råd','Säga förlåt när vi sårat någon','Prata vidare när vi lugnat oss','Berätta vad vi behöver','Komma överens om en paussignal','Be om hjälp när vi kör fast','Visa att vi vill bli sams']),
  themeDeck('forandring','Små gemensamma förändringar',['Äta en måltid tillsammans','Avsätta tio minuter för samtal','Fråga innan vi ger råd','Prata om veckans planer','Göra något roligt varje månad','Ha en stund utan mobiler','Utvärdera en regel efter två veckor','Berätta något som fungerat bra']),
]);

// Role-specific presentation is editorial metadata, separate from answer IDs,
// matching rules and program logic. The canonical card text above remains
// unchanged so existing private answers keep their original meaning. Version 2
// clarifies each role's responsibility within the same shared A-card goal.
const roleText=(teen,parent)=>Object.freeze({teen,parent,presentationVersion:2});
export const ROLE_TEXT_BY_CARD=Object.freeze({
  'general-10':roleText('Jag vill att vi visar uppskattning på sätt som känns bra för båda.','Jag vill bli bättre på att visa uppskattning och fråga hur den tas emot.'),
  'general-11':roleText('Tydliga överenskommelser hemma hjälper mig att veta vad som gäller.','Jag vill göra hemmets överenskommelser tydliga och lyssna på tonåringens synpunkter.'),
  'general-16':roleText('Jag vill kunna lita på de löften vi ger varandra.','Jag vill ge realistiska löften, hålla dem och förklara tidigt om något måste ändras.'),
  'general-17':roleText('Jag vill kunna berätta när något har påverkat min tillit, i min egen takt.','Jag vill göra det tryggt att berätta och ta ansvar för min del när tilliten skadats.'),
  'general-20':roleText('Jag vill att mitt privatliv respekteras och att undantag för trygghet förklaras.','Jag vill respektera tonåringens privatliv och vara tydlig med när omsorgsansvar kräver insyn.'),
  'general-23':roleText('Jag vill att mina skäl blir lyssnade på även när beslutet inte blir som jag önskar.','Jag vill förstå tonåringens skäl och förklara mina beslut utan att kräva medhåll.'),
  'general-24':roleText('Efter ett bråk vill jag kunna visa när jag är redo att hitta tillbaka.','Efter ett bråk vill jag ta initiativ till trygg återkontakt utan att pressa tonåringen.'),
  'general-25':roleText('En uppriktig ursäkt hjälper mig när någon har sårat mig.','När jag sårat vill jag ta ansvar, be om ursäkt och ändra mitt beteende.'),
  'general-26':roleText('Jag vill kunna säga att ett samtal blir för intensivt och ta paus.','Jag vill reglera min röst, avbryta om det blir otryggt och återuppta samtalet lugnt.'),
  'general-28':roleText('Jag vill kunna visa eller säga när jag behöver stöd och få frågan vad som hjälper.','Jag vill vara uppmärksam på behov av stöd och fråga utan att pressa.'),
  'general-29':roleText('Jag vill få verkligt inflytande i beslut som berör mig.','Jag vill ge åldersrimligt inflytande och förklara beslut jag måste ta.'),
  'general-30':roleText('Jag vill kunna föreslå ändringar och bli lyssnad på när en regel inte fungerar.','Jag vill ompröva regler, väga in tonåringens erfarenhet och förklara kvarvarande gränser.'),
  'general-31':roleText('Jag vill kunna beskriva min mobilanvändning och mina behov utan att bli skammad.','Jag vill prata sakligt om mobilvanor, förklara omsorgsskäl och undvika skam.'),
  'general-34':roleText('Jag vill kunna ge och få uppskattning på sätt som känns äkta.','Jag vill visa konkret uppskattning utan att kräva ett visst svar tillbaka.'),
  'samtal-04':roleText('Hur jag vill att vi pratar om sociala medier.','Hur jag kan prata om sociala medier utan skam och samtidigt ta mitt trygghetsansvar.'),
  'samtal-06':roleText('Vad som hjälper mig att känna mig lyssnad på.','Hur jag kan visa att jag lyssnar och kontrollera att jag förstått.'),
  'samtal-07':roleText('Vad som stressar mig och vilket stöd jag vill ha.','Hur jag kan lyssna på tonåringens stress utan att lägga min egen reglering på hen.'),
  'regler-01':roleText('Jag vill att den som kan knackar innan hen går in i mitt rum.','Jag vill respektera tonåringens rum och förklara sällsynta trygghetsundantag.'),
  'regler-02':roleText('Jag vill få prata färdigt och försöka lyssna när jag kan.','Jag vill lyssna färdigt och hjälpa samtalet att förbli tryggt.'),
  'regler-03':roleText('Jag får be om paus och påverka när jag är redo igen.','Jag respekterar paus och tar ansvar för ett tryggt förslag om återupptagande.'),
  'regler-05':roleText('Jag vill kunna påverka vilka rimliga sysslor jag ansvarar för.','Jag vill fördela åldersrimliga sysslor och ta hänsyn till tonåringens belastning.'),
  'regler-07':roleText('Jag vill få inflytande över tider och förstå skälen för gränser.','Jag vill lyssna, förklara trygghets- och hälsoskäl och sätta åldersrimliga tider.'),
  'regler-08':roleText('Jag kan föreslå att en regel omprövas och bli lyssnad på.','Jag omprövar regler öppet och förklarar vad som kan eller inte kan ändras.'),
  'regler-09':roleText('Jag vill kunna påverka när en gemensam mobilfri stund passar.','Jag vill föreslå avgränsade mobilfria stunder och själv föregå med gott exempel.'),
  'regler-10':roleText('Jag får säga att samtalet blir för intensivt och be om paus.','Jag ansvarar för att reglera min röst och avbryta ett otryggt samtal.'),
  'regler-11':roleText('Jag får säga att något känns orättvist utan att straffas för att jag säger det.','Jag vill lyssna och förklara mitt beslut utan att bestraffa invändningen.'),
  'regler-12':roleText('Jag får påverka när och hur jag kan delta i ett samtal efter bråk.','Jag tar initiativ till trygg reparation och ansvar för min del.'),
  'uppskattning-02':roleText('Jag kan fråga hur föräldern mår utan att behöva lösa det.','Jag vill fråga hur tonåringen mår och bära ansvaret för min egen reglering.'),
  'uppskattning-04':roleText('Göra en liten, frivillig och åldersrimlig hjälpsam sak.','Erbjuda konkret hjälp utan att kräva återgäldning.'),
  'uppskattning-08':roleText('Välja en kort stund då jag vill ge och få odelad uppmärksamhet.','Skapa en kravlös stund och respektera om tonåringen inte är redo.'),
  'aterhamtning-01':roleText('Jag får be om paus när samtalet blir för intensivt.','Jag tar paus innan jag tappar reglering och säkerställer ett tryggt återupptagande.'),
  'aterhamtning-03':roleText('Jag vill kunna ta ansvar för sådant jag gjort som sårat.','Jag tar ansvar, ber om ursäkt utan förbehåll och försöker ändra beteendet.'),
  'aterhamtning-04':roleText('Jag får säga när jag är tillräckligt redo att prata vidare.','Jag föreslår en lugn tid och respekterar att tonåringen kan behöva mer tid.'),
  'aterhamtning-05':roleText('Jag vill kunna uttrycka behov och gränser i min egen takt.','Jag vill fråga om tonåringens behov och uttrycka mina vuxenbehov utan att lägga reglering på hen.'),
  'aterhamtning-06':roleText('Jag vill kunna använda en paussignal som tas på allvar.','Jag vill respektera paussignalen och ansvara för trygg återkontakt.'),
  'aterhamtning-07':roleText('Jag vill veta vilka trygga vuxna jag kan be om hjälp.','Jag söker vuxenstöd när situationen kräver det och hjälper tonåringen hitta stöd.'),
  'aterhamtning-08':roleText('Jag får visa på mitt sätt när jag är öppen för kontakt igen.','Jag visar att relationen är trygg och att jag finns kvar utan att kräva snabb försoning.'),
  'forandring-06':roleText('Välja en kort mobilfri stund som passar mig.','Föreslå en avgränsad mobilfri stund och själv delta på samma villkor.'),
  'forandring-07':roleText('Få berätta hur regeln fungerat och föreslå ändring.','Följa upp, lyssna och förklara vad som ändras eller varför gränsen behövs.'),
});

export const cardTextForRole=(card,role)=>{
  const adapted=ROLE_TEXT_BY_CARD[card.id];
  if(adapted&&(role==='teen'||role==='parent'))return adapted[role];
  return card.teenText;
};


// Redaktionella råd är metadata, aldrig AI-genererad text. Nytt kort får ett
// stabilt ID och kan ange adviceKey; nya råd läggs till i ADVICE_BY_KEY.
export const ADVICE_BY_KEY=Object.freeze({
  'general-01':'Bestäm en kort stund då mobilerna får vila och välj något enkelt ni båda brukar tycka om.',
  'general-08':'Skriv varsin idé till en gemensam aktivitet och turas om att välja vad ni provar först.',
  'general-10':'Börja med att nämna en konkret sak ni uppskattade hos den andra under veckan.',
  'general-11':'Formulera en överenskommelse så konkret att båda vet vad den innebär och när den ska följas upp.',
  'general-13':'Ge plats åt humor utan att skämta bort det som känns viktigt för någon av er.',
  'general-16':'Välj hellre ett litet löfte som går att hålla än ett stort löfte som blir otydligt.',
  'general-17':'Beskriv vad som hände och vad som skulle kunna återbygga tilliten, utan att kräva en omedelbar lösning.',
  'general-20':'Prata konkret om vad privatliv betyder för var och en och vilka undantag som behövs för trygghet.',
  'general-21':'Fråga ”vill du att jag lyssnar eller hjälper dig att tänka?” innan ni går över till råd.',
  'general-22':'Prova en återkommande, kravlös fråga om dagen och acceptera även ett kort svar.',
  'general-23':'Återge först den andras skäl med egna ord och kontrollera att du förstått innan du svarar.',
  'general-24':'Bestäm en enkel väg tillbaka efter bråk, till exempel en paus följd av en bestämd tid för nytt samtal.',
  'general-25':'En hjälpsam ursäkt nämner vad som blev fel och vad personen vill försöka göra annorlunda nästa gång.',
  'general-26':'Kom överens om en paussignal och återuppta samtalet när båda kan prata i normal samtalston.',
  'general-28':'Fråga vilket slags stöd som önskas i stället för att gissa eller lösa problemet direkt.',
  'general-29':'Avgränsa ett beslut som berör er båda och låt båda föreslå ett genomförbart alternativ.',
  'general-30':'Bestäm i förväg när en regel ska utvärderas och vad som skulle visa att den behöver ändras.',
  'general-31':'Välj ett konkret skärmtillfälle och beskriv egna behov utan att räkna upp den andras fel.',
  'general-32':'Välj något litet och lätt att boka in snart; gemensam tid behöver inte vara avancerad eller dyr.',
  'general-33':'Skydda en kort stund av kravlös närvaro där ni inte måste prestera ett bra samtal.',
  'general-34':'Gör uppskattningen konkret genom att säga vad den andra gjorde och varför det betydde något.',
  aktiviteter:'Välj tillsammans en aktivitet och bestäm en dag och plats. Små återkommande stunder kan göra det lättare att hålla kontakten utan krav på stora samtal.',
  samtal:'Välj ett ämne och låt var och en berätta i sin egen takt. Prova att lyssna färdigt och ställa en nyfiken följdfråga innan ni ger råd.',
  regler:'Välj en regel att diskutera. Formulera ett konkret förslag tillsammans och bestäm när ni ska utvärdera det; ett gemensamt intresse är ännu ingen överenskommelse.',
  uppskattning:'Välj ett litet sätt att visa uppskattning redan i veckan. Fråga gärna hur den andra helst vill bli uppmärksammad.',
  aterhamtning:'Prata om vad som hjälper när det blir svårt. En överenskommen paus och en bestämd tid att återuppta samtalet kan minska pressen.',
  forandring:'Börja med en liten förändring som känns möjlig för er båda och följ upp efter någon vecka.',
  Relationer:'Välj en stund då ni kan vara tillsammans utan andra krav och fråga vad ni båda uppskattar med den.',
  Fritid:'Prova att boka in en gemensam aktivitet och låt båda påverka vad ni gör.',
  Vardag:'Välj en vardagssituation och fråga vad som skulle göra den enklare för er båda.',
  Samtal:'Låt var och en beskriva vad som känns viktigt. Lyssna färdigt innan ni försöker hitta en lösning.',
  Konflikter:'Kom överens om hur ni kan ta paus och hitta tillbaka till samtalet när känslorna lugnat sig.',
  Tillit:'Börja med ett litet, konkret löfte som ni båda kan hålla och följ upp hur det fungerade.',
  Självständighet:'Prata om vilka behov av frihet och trygghet som ska få plats och pröva en liten förändring.',
  Känslor:'Fråga om den andra vill bli lyssnad på eller få hjälp att hitta en lösning.',
  'Digital vardag':'Välj ett avgränsat tillfälle att prata om skärmar utan anklagelser och var nyfikna på varandras perspektiv.',
  Gemenskap:'Planera en enkel stund tillsammans som båda får vara med och utforma.',
  Uppskattning:'Berätta något konkret som ni uppskattar hos varandra.',
});
export const adviceKeyForCard=(card,deckId='general')=>card.adviceKey|| (deckId==='general'&&ADVICE_BY_KEY[card.id]?card.id:deckId==='general'?card.category:deckId);
