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


// Redaktionella råd är metadata, aldrig AI-genererad text. Nytt kort får ett
// stabilt ID och kan ange adviceKey; nya råd läggs till i ADVICE_BY_KEY.
export const ADVICE_BY_KEY=Object.freeze({
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
export const adviceKeyForCard=(card,deckId='general')=>card.adviceKey|| (deckId==='general'?card.category:deckId);
