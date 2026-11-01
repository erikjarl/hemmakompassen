import {IPIP50_V1} from './ipip50-v1.js';

// Redaktionella samtalsgränser (inte validerade psykometriska cutoffs).
// Varje domän innehåller tio 1–5-frågor. En råpoängsskillnad på 9 motsvarar
// i genomsnitt 0,9 svarssteg per fråga. Gränserna bör utvärderas med användare.
export const FAMILY_INSIGHT_RULES=Object.freeze({
  closeMax:3,       // 0,0–0,3 svarssteg per påstående
  noticeableMin:9, // minst 0,9 svarssteg per påstående
  strikingMin:15,  // minst 1,5 svarssteg per påstående, enbart sortering
  maxHighlights:3,
  version:'family-insights-editorial-v1'
});

const FACTORS=IPIP50_V1.factors;
const TEXT={
  extraversion:{
    parentHigher:{
      observation:'Föräldern beskriver sig som mer utåtriktad än tonåringen. Ni kanske trivs med olika mycket social aktivitet och gemensam tid.',
      suggestion:'Föräldern kan fråga när sällskap känns välkommet och ge tonåringen utrymme att tacka nej utan att behöva förklara sig.',
      question:'När vill vi umgås och när vill vi helst vara ifred?'
    },
    teenHigher:{
      observation:'Tonåringen beskriver sig som mer utåtriktad än föräldern. Det kan innebära olika önskemål om umgänge, aktivitet och sociala sammanhang.',
      suggestion:'Föräldern kan vara nyfiken på vilka sociala aktiviteter som betyder mest och stötta dem utan att själv behöva delta i allt.',
      question:'Hur kan vi hitta social tid och lugn tid som passar oss båda?'
    },
    similarity:{
      high:'Ni beskriver båda en relativt utåtriktad sida. Kanske tycker ni om samtal, människor eller aktiviteter tillsammans, men behoven kan ändå skifta.',
      low:'Ni beskriver båda en mer tillbakadragen sida. Det kan underlätta förståelsen för att man ibland vill vara för sig själv.',
      middle:'Era svar om socialt umgänge ligger nära varandra. Undersök om ni också delar önskemål om hur och när ni umgås.',
      suggestion:'Bestäm tillsammans hur ni kan bjuda in till umgänge utan att någon känner sig pressad.',
      question:'Vilka stunder tillsammans ger oss energi, och när behöver vi en paus?'
    }
  },
  agreeableness:{
    parentHigher:{
      observation:'Föräldern skattar fler drag kopplade till omtanke och samarbetsvilja. Det innebär inte att tonåringen är mindre omtänksam som person.',
      suggestion:'Föräldern kan berätta konkret vad omtanke betyder i vardagen och vara nyfiken på hur tonåringen själv visar den, utan att moralisera.',
      question:'Hur märker vi att den andra bryr sig, även när vi visar det olika?'
    },
    teenHigher:{
      observation:'Tonåringen skattar fler drag kopplade till omtanke och samarbetsvilja. Era sätt att ta hänsyn och uttrycka invändningar kan skilja sig.',
      suggestion:'Föräldern kan skapa utrymme för tonåringens egna gränser och undvika att tolka samarbetsvilja som att tonåringen alltid ska anpassa sig.',
      question:'Hur kan vi både visa omtanke och våga säga ifrån?'
    },
    similarity:{
      high:'Ni beskriver båda att omtanke och hänsyn ofta är viktiga i ert sätt att vara. Det betyder inte att ni alltid tycker lika.',
      low:'Ni ger liknande svar om omtanke och samarbetsvilja. Fundera på hur ni faktiskt brukar visa hänsyn; en låg summa är inte ett mått på människovärde.',
      middle:'Ni beskriver er på liknande sätt vad gäller omtanke och samarbete, men kan fortfarande uttrycka er på olika sätt.',
      suggestion:'Ge varandra varsitt konkret exempel på när ni känt er lyssnade på.',
      question:'Vad gör den andra som får mig att känna mig respekterad?'
    }
  },
  conscientiousness:{
    parentHigher:{
      observation:'Föräldern beskriver större benägenhet till ordning och planering. Det kan bidra till olika förväntningar på tider, läxor, uppgifter och ansvar.',
      suggestion:'Föräldern kan hjälpa till att göra överenskommelser tydliga och lagom stora, utan att likställa annorlunda planeringsstil med lathet.',
      question:'Vilka saker behöver vi planera tillsammans och var kan tonåringen bestämma själv?'
    },
    teenHigher:{
      observation:'Tonåringen beskriver större benägenhet till ordning och planering. Ni kanske vill ha olika mycket framförhållning.',
      suggestion:'Föräldern kan erkänna tonåringens förmåga att organisera sitt eget arbete och komma överens om vilket stöd som faktiskt efterfrågas.',
      question:'När hjälper fasta planer och när vill vi kunna vara spontana?'
    },
    similarity:{
      high:'Ni beskriver båda att planering och ordning ofta passar er. Det kan underlätta gemensamma rutiner, men det behövs fortfarande utrymme för flexibilitet.',
      low:'Ni beskriver båda ett mer flexibelt förhållningssätt till ordning och planering. Det kan vara skönt, men vissa saker kan behöva tydliga påminnelser.',
      middle:'Ni ger ungefär liknande svar om struktur och genomförande. Undersök vilka rutiner ni faktiskt tycker fungerar.',
      suggestion:'Välj en enda återkommande vardagssak och kom överens om en enkel rutin som båda godkänner.',
      question:'Vilka rutiner gör vår vardag lättare och vilka känns onödiga?'
    }
  },
  emotional_stability:{
    parentHigher:{
      observation:'Föräldern beskriver mer känslomässig stabilitet än tonåringen. Det kan betyda olika upplevelser av stress eller starka känslor, men säger inget säkert om hur ni mår.',
      suggestion:'Föräldern kan lyssna och bekräfta tonåringens upplevelse innan råd ges, och tillsammans föreslå en paus när samtal blir pressade.',
      question:'Hur vill var och en av oss bli bemött när något känns jobbigt?'
    },
    teenHigher:{
      observation:'Tonåringen beskriver mer känslomässig stabilitet än föräldern. Stress och reaktioner i vardagen kan därför upplevas olika.',
      suggestion:'Föräldern ansvarar för sin egen känsloreglering och kan visa hur man tar en paus och återkommer. Tonåringen ska inte behöva ta ansvar för förälderns mående.',
      question:'Hur kan vi ta pauser och sedan prata vidare om det som blev svårt?'
    },
    similarity:{
      high:'Ni beskriver båda en relativt lugn och stabil känslomässig sida. Det kan hjälpa i svåra samtal, men även ni kan behöva tydliga pauser.',
      low:'Ni beskriver båda att stress eller starka känslor kan vara påfrestande. Föräldern har ett särskilt ansvar att skapa trygghet och att hantera sina egna reaktioner.',
      middle:'Era svar om känslomässig stabilitet ligger nära varandra. Det betyder inte att ni reagerar likadant i varje situation.',
      suggestion:'Prata när det är lugnt om hur ni signalerar att ni behöver en kort paus.',
      question:'Vilka tidiga signaler märker vi när stressen stiger?'
    }
  },
  intellect_imagination:{
    parentHigher:{
      observation:'Föräldern skattar fler drag kopplade till idéer, fantasi och abstrakt tänkande. Det betyder inte att föräldern är mer intelligent.',
      suggestion:'Föräldern kan låta tonåringen välja ämnen och prata konkret när det behövs, i stället för att förutsätta att båda tycker om långa resonemang.',
      question:'Vad är vi var för sig nyfikna på att förstå eller prova?'
    },
    teenHigher:{
      observation:'Tonåringen skattar fler drag kopplade till idéer, fantasi och abstrakt tänkande. Intressena eller samtalsstilen kan vara olika.',
      suggestion:'Föräldern kan visa genuin nyfikenhet på tonåringens idéer och låta hen förklara något på sitt sätt, utan att genast bedöma det.',
      question:'Finns det något nytt tonåringen skulle vilja visa eller lära föräldern?'
    },
    similarity:{
      high:'Ni beskriver båda ett intresse för idéer och fantasi. Kanske finns gemensamma ämnen att upptäcka, men det behöver ni själva avgöra.',
      low:'Ni beskriver båda ett mer konkret förhållningssätt till idéer och fantasi. Det är inte ett mått på intelligens eller kreativt värde.',
      middle:'Era svar om idéer och fantasi ligger nära varandra. Det kan vara värt att utforska vilka intressen ni faktiskt delar.',
      suggestion:'Välj var sitt ämne, film, spel eller aktivitet som ni vill visa den andra.',
      question:'Vad skulle vi tycka vore roligt att utforska tillsammans?'
    }
  }
};

function validateScores(scores,role){
  if(!scores||typeof scores!=='object'||Array.isArray(scores))throw new TypeError('Saknade skalpoäng för '+role);
  if(Object.keys(scores).length!==FACTORS.length)throw new RangeError('Fel antal skalor för '+role);
  for(const factor of FACTORS){
    const sum=scores[factor.id];
    if(!Number.isInteger(sum)||sum<10||sum>50)throw new RangeError('Ogiltig skala '+factor.id+' för '+role);
  }
}

const typeForSimilarity=(parent,teen)=>{
  if(parent>=39&&teen>=39)return 'high';
  if(parent<=27&&teen<=27)return 'low';
  return 'middle';
};

export function buildIPIP50FamilyInsights({parent,teen,instrumentId=IPIP50_V1.id}){
  if(instrumentId!==IPIP50_V1.id)throw new RangeError('Fel instrumentversion');
  validateScores(parent,'föräldern');
  validateScores(teen,'tonåringen');
  const items=FACTORS.map((factor,index)=>{
    const p=parent[factor.id],t=teen[factor.id],difference=p-t,absoluteDifference=Math.abs(difference);
    const status=absoluteDifference<=FAMILY_INSIGHT_RULES.closeMax?'similarity'
      :absoluteDifference>=FAMILY_INSIGHT_RULES.noticeableMin?'notable':'moderate';
    const wording=TEXT[factor.id];
    const direction=difference>0?'parentHigher':difference<0?'teenHigher':'equal';
    const data=status==='similarity'?wording.similarity:wording[direction];
    const level=typeForSimilarity(p,t);
    const observation=status==='similarity'?data[level]:data.observation;
    return {
      factorId:factor.id,label:factor.id==='emotional_stability'?'Emotionell balans':factor.labelSv,
      order:index,parent:p,teen:t,difference,absoluteDifference,meanItemGap:absoluteDifference/10,
      status,direction,
      priority:status==='notable'?(absoluteDifference>=FAMILY_INSIGHT_RULES.strikingMin?'largest':'notable'):status,
      observation,suggestion:data.suggestion,question:data.question
    };
  });
  // Stable tie-breaking by the original factor order; never label a difference significant.
  const byDistanceDesc=(a,b)=>b.absoluteDifference-a.absoluteDifference||a.order-b.order;
  const byDistanceAsc=(a,b)=>a.absoluteDifference-b.absoluteDifference||a.order-b.order;
  const notable=items.filter(i=>i.status==='notable').sort(byDistanceDesc);
  const similar=items.filter(i=>i.status==='similarity').sort(byDistanceAsc);
  const moderate=items.filter(i=>i.status==='moderate').sort(byDistanceDesc);
  return {
    version:FAMILY_INSIGHT_RULES.version,items,
    notable,similar,moderate,
    featuredDifferences:notable.slice(0,FAMILY_INSIGHT_RULES.maxHighlights),
    featuredSimilarities:similar.slice(0,FAMILY_INSIGHT_RULES.maxHighlights),
    // Empty arrays mean no difference/similarity crossed the editorial threshold.
    thresholds:{...FAMILY_INSIGHT_RULES}
  };
}
