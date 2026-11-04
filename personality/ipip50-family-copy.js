// Carefully authored, role-sensitive conversation prompts, not clinical interpretations.
// One narrative for each direction and each perspective per Big Five domain.
// Resources point only to sections that currently work in Hemmakompassen.
export const FAMILY_REFLECTION_RESOURCES=Object.freeze({
  extraversion:{href:'#swipe',title:'Gillaswajpen · Aktiviteter tillsammans',instruction:'Gå till Gillaswajpen och välj kortleken ”Aktiviteter tillsammans”. Börja med sådant som inte kräver att ni umgås länge.'},
  agreeableness:{href:'#swipe',title:'Gillaswajpen · Sätt att visa uppskattning',instruction:'Gå till Gillaswajpen och välj kortleken ”Sätt att visa uppskattning”. Prata om vilka små handlingar som faktiskt uppskattas.'},
  conscientiousness:{href:'#regler',title:'Schyssta listan',instruction:'Gå till Schyssta listan och pröva en liten, konkret överenskommelse som ni båda får påverka.'},
  emotional_stability:{href:'#kommunikation',title:'Kommunikationsråd',instruction:'Läs gärna råden om att lyssna och ta paus vid gräl under Kommunikationsråd. Välj ett sätt som känns tryggt för er båda.'},
  intellect_imagination:{href:'#swipe',title:'Gillaswajpen · Samtalsämnen',instruction:'Gå till Gillaswajpen och välj kortleken ”Samtalsämnen”. Välj hellre en fråga ni båda är nyfikna på än att tvinga fram ett djupt samtal.'}
});

// Each paragraph identifies a plausible friction or strength, offers a concrete
// repair/experiment, and gives the viewer a role-appropriate level of responsibility.
const REFLECTIONS={
  extraversion:{
    parentHigher:{
      parent:'Det kan göra ont när din önskan om samtal eller gemensam tid möts av ett kort svar eller en stängd dörr. Men det behöver inte betyda att kontakten är dålig: olika behov av stimulans och återhämtning kan ligga bakom. Pröva att fråga när det passar att ses, acceptera ett nej utan att dra dig undan och erbjud en ny möjlighet en annan dag.',
      teen:'När en förälder gärna vill prata eller hitta på saker just när du behöver lugn och egen tid kan omtanken kännas som press. Att vilja vara ifred betyder inte att du avvisar personen. Om det känns okej kan du säga ungefär när du hellre vill ses; det är fortfarande den vuxnas ansvar att respektera din gräns.'
    },
    teenHigher:{
      parent:'Om tonåringen vill träffa människor, byta miljö eller hitta på mer än du orkar kan era behov lätt krocka. Det är förståeligt att behöva lugn som vuxen, men tonåringens sociala nyfikenhet behöver inte vara ett avståndstagande. Fråga vilka sammanhang som är viktigast och försök hitta stöd eller praktiska lösningar utan att själv behöva vara med överallt.',
      teen:'Det kan kännas tråkigt om du vill vara social eller göra något medan din förälder oftare vill ha det lugnt. Det betyder inte att ditt behov är för mycket. Försök berätta vilken aktivitet som är viktigast och vilken hjälp du behöver, men ansvaret för de vuxnas ork och för familjens planering ligger hos föräldern.'
    },
    similarity:{
      parent:'Liknande social stil kan göra det lättare att känna igen när den andra vill umgås – eller när det blivit för mycket. Samtidigt säger två lika testpoäng inte att ni vill samma sak vid samma tidpunkt. Testa att låta var och en välja en stund för gemenskap och en stund för ostörd återhämtning.',
      teen:'Det kan vara skönt när ni ungefär känner igen varandras sätt att vara med människor. Ändå kan du vilja vara själv när din förälder vill prata, även om testresultaten liknar varandra. Försök beskriva vad som gör en gemensam stund rolig för dig, utan att känna att du måste vara social på beställning.'
    }
  },
  agreeableness:{
    parentHigher:{
      parent:'Ni kanske har olika sätt att visa hänsyn eller olika lätt att gå med på förslag. Det kan vara frustrerande om du upplever motstånd när du försöker vara hjälpsam. Undvik att göra ett lägre testresultat till en fråga om egoism: säg konkret vilket beteende du behöver och fråga hur tonåringen upplevde situationen. Försök skilja på att visa omtanke och att alltid vara överens.',
      teen:'När en förälder gärna vill att alla ska vara överens kan ett tydligt nej ibland uppfattas som ovänligt, trots att du bara försöker säga vad du tycker. Det kan vara svårt att känna sig förstådd då. Du har rätt att ha en annan åsikt. Om det fungerar kan du berätta vad som känns viktigt för dig; föräldern ansvarar för att lyssna utan att göra din självständighet till ett problem.'
    },
    teenHigher:{
      parent:'Om tonåringen ofta försöker förstå andra eller undvika konflikter finns en risk att du tolkar tystnad som samtycke. Det kan bli svårt för tonåringen att säga ifrån om den vuxna redan har bestämt sig. Pröva att fråga ”Vad vill du själv?” och låt svaret få verklig betydelse, även när det skiljer sig från ditt.',
      teen:'Om du ofta försöker hålla god stämning kan du ibland gå med på saker som du inte riktigt vill. Det kan kännas jobbigt att vara den som säger emot. Att säga nej kan vara ett sätt att ta hand om både dig och relationen. En förälder behöver kunna ta emot ditt nej utan att lägga ansvaret för familjens känslor på dig.'
    },
    similarity:{
      parent:'Ni kan känna igen något i varandras sätt att ta hänsyn eller säga ifrån. Men lika poäng betyder inte att ni visar omtanke på samma sätt, och låg skattning säger inget om människovärde. Pröva att nämna en liten handling från den andra som faktiskt fick dig att känna dig respekterad och fråga om din bild stämmer.',
      teen:'Kanske har ni liknande sätt att bry er om andra eller att uttrycka vad ni vill. Det kan underlätta, men man kan fortfarande missförstå varandra. Berätta gärna om en situation där du kände dig lyssnad på och fråga din förälder när hen upplevde något liknande. Ingen av er behöver vara överens om allt för att visa omtanke.'
    }
  },
  conscientiousness:{
    parentHigher:{
      parent:'När du vill planera i god tid och tonåringen tar saker mer som de kommer kan samma vardagssituation uppfattas helt olika: du ser risk för att något glöms, medan tonåringen kan uppleva kontroll. Det kan bli tröttsamt för er båda. Välj en konkret uppgift, kom överens om vad som faktiskt behöver bli gjort och låt tonåringen påverka hur och när – med stöd som passar åldern.',
      teen:'Om din förälder vill ha ordning och framförhållning när du hellre gör saker mer spontant kan påminnelser kännas som tjat eller misstro. Det betyder inte automatiskt att någon av er har rätt eller fel. Försök komma överens om vad som verkligen måste bli klart, men be om att få bestämma hur du gör det. Föräldern ska hjälpa dig att hitta rimliga lösningar.'
    },
    teenHigher:{
      parent:'Tonåringen kanske uppskattar tydliga planer mer än du själv gör. Då kan sena ändringar eller oklara besked skapa onödig stress, trots att du menar väl. Pröva att ge besked i god tid när det är möjligt, och fråga vilka överenskommelser tonåringen helst vill ha fasta. Samtidigt behöver planeringen ha utrymme för att livet ibland ändras.',
      teen:'Om du gärna vill veta vad som ska hända men din förälder tar dagen som den kommer kan det kännas osäkert eller irriterande. Det är rimligt att önska tydliga besked. Be gärna om en konkret plan för det som är viktigast för dig. Din förälder behöver hjälpa till att skapa förutsägbarhet; du ska inte behöva hålla ordning på allt själv.'
    },
    similarity:{
      parent:'Liknande sätt att planera kan ge er en gemensam utgångspunkt, vare sig ni gillar fasta rutiner eller mer flexibilitet. Ändå kan ni prioritera helt olika saker. Pröva att komma överens om en enda vardagsrutin som ni båda vill förbättra och utvärdera den efter en vecka, utan att göra resultatet till ett betyg på någon av er.',
      teen:'Ni verkar beskriva ett ganska liknande förhållningssätt till planering. Det kan vara lättare att förstå varandra, men ni behöver inte tycka lika om läxor, tider eller ordning. Välj en vardagssak där ni ofta blir irriterade och föreslå en enkel regel ni kan testa tillsammans. Den vuxna ska hjälpa till att göra den rimlig.'
    }
  },
  emotional_stability:{
    parentHigher:{
      parent:'Ni kan uppleva och uttrycka stress olika starkt. Det kan vara svårt när du själv tycker att en situation känns hanterbar men tonåringen reagerar starkare; risken är att du råkar bagatellisera något viktigt. Lyssna först och fråga vad som hjälper, innan du erbjuder lösningar. Testresultatet säger inte om någon av er har psykiska besvär, och det är du som vuxen som ansvarar för ett tryggt samtalsklimat.',
      teen:'Om din förälder verkar lugn när du känner dig upprörd kan du ibland få känslan av att du överreagerar eller inte blir förstådd. Men två personer kan uppleva samma situation olika. Du får önska att bli lyssnad på innan någon ger råd. Berätta gärna hur du vill bli bemött om det känns tryggt; den vuxna ansvarar för att ta dina känslor på allvar.'
    },
    teenHigher:{
      parent:'Om tonåringen beskriver sig som mer känslomässigt stabil kan ni ha olika sätt att reagera när något blir stressigt. Det betyder inte att tonåringen kan eller ska bära dina känslor. Visa gärna hur du själv tar en paus, lugnar dig och återkommer för att reda ut det som hänt. Be om stöd från andra vuxna vid behov, inte från tonåringen.',
      teen:'Om din förälder reagerar starkare än du i pressade situationer kan det kännas förvirrande eller orättvist, särskilt om du förväntas lugna ner situationen. Det är inte ditt ansvar att ta hand om förälderns känslor. Du får säga att du behöver en paus eller stöd av en annan trygg vuxen. Det är förälderns ansvar att reparera efter ett gräl.'
    },
    similarity:{
      parent:'Era svar om känslor och stress ligger nära varandra. Det kan göra vissa reaktioner lättare att känna igen, men också innebära att ni båda blir pressade i samma situation. Bestäm gärna en enkel paussignal i lugnt läge och säg tydligt när ni ska återkomma till samtalet. Som förälder ansvarar du för att pausen blir trygg och för att ni hittar tillbaka.',
      teen:'Ni verkar beskriva ungefär liknande reaktioner på känslor och stress. Det betyder inte att ni alltid känner samma sak, och det kan fortfarande bli jobbigt när båda är upprörda. En gemensam paussignal kan hjälpa. Du får be om en paus, men det är föräldern som ska ta ansvar för att samtalet tas upp på ett lugnt sätt igen.'
    }
  },
  intellect_imagination:{
    parentHigher:{
      parent:'Du kanske gärna resonerar länge om idéer och möjliga lösningar medan tonåringen hellre håller sig till det konkreta. Det kan leda till att en välmenad diskussion upplevs som en föreläsning. Prova att fråga om tonåringen vill bolla tankar eller bara få ett enkelt svar, och låt hen välja ämne ibland. Skalan mäter inte vem som är intelligentast.',
      teen:'Om din förälder gärna vill diskutera olika idéer eller analysera allt kan det ibland kännas som att ett enkelt svar inte duger. Du behöver inte tycka om långa resonemang för att vara nyfiken eller klok. Det kan hjälpa att säga om du vill prata mer, få något konkret förklarat eller byta ämne. Din förälder får anpassa samtalet efter dig också.'
    },
    teenHigher:{
      parent:'Tonåringen kanske är nyfiken på idéer, perspektiv eller ämnen som du inte själv fastnar för. Det kan vara svårt att hänga med, och lätt att råka avfärda något som opraktiskt. Pröva att be tonåringen visa eller förklara ett intresse utan att du genast värderar det. Att visa nyfikenhet är viktigare än att förstå allt direkt.',
      teen:'Du kanske tycker om att utforska idéer och nya perspektiv mer än din förälder. Det kan kännas ensamt eller frustrerande när något som är viktigt för dig möts av ett kort svar. Du får önska mer nyfikenhet. Testa att visa ett konkret exempel på vad du fastnat för, men kom ihåg att du inte behöver övertyga någon om att ditt intresse är värt något.'
    },
    similarity:{
      parent:'Ni verkar beskriva en liknande relation till idéer och fantasi. Det kan finnas en öppning för gemensamma upptäckter, men testpoäng berättar inte vilka intressen ni delar. Fråga vad tonåringen skulle vilja visa dig och erbjud gärna att prova, även om ämnet ligger utanför din vanliga smak.',
      teen:'Ni verkar svara ungefär lika om idéer och fantasi, men ni kan fortfarande vara intresserade av helt olika saker. Ibland kan likheten vara en chans att bli mer nyfikna på varandras värld. Välj gärna något du vill visa din förälder och be hen välja något tillbaka; båda ska få bestämma vad ni utforskar.'
    }
  }
};
export function richFamilyReflection(item,viewerRole){
  if(!item||!['parent','teen'].includes(viewerRole))throw new RangeError('Giltig skala och läsarroll krävs');
  const block=REFLECTIONS[item.factorId];
  const condition=item.status==='similarity'?'similarity':item.direction;
  const paragraph=block?.[condition]?.[viewerRole];
  const resource=FAMILY_REFLECTION_RESOURCES[item.factorId];
  if(!paragraph||!resource)throw new RangeError('Saknad redaktionell text för skala/riktning/roll');
  return {paragraph,resource};
}
