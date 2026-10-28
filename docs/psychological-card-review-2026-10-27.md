# Psykologisk granskning av A-matchningskort

Datum: 2026-10-27  
Omfattning: samtliga 73 A-kort i `card-catalog.js` (21 allmänna och 52 temakort).  
Status: professionell, teoriinformerad redaktionell bedömning för fortsatt produktutveckling – **inte** empirisk eller klinisk validering av korten.

## Bedömningsram och säker implementering

Granskningen utgår från att en förälder har större ansvar för omsorg, trygghet, reglering, rimliga gränser och reparation efter konflikt. Tonåringen har samtidigt rätt till autonomi, inflytande och gränser samt ett åldersrimligt ansvar för respektfull kommunikation och praktiskt deltagande. Ett A-kort är lämpligt bara när ett gemensamt JA kan förstås som ett frivilligt gemensamt intresse – aldrig som bevis för att ansvaret är lika fördelat.

Riskbedömningen är informerad av etablerade principer om utvecklingsanpassat föräldraansvar, autonomistöd, validering, reparativt relationsarbete och risken för parentifiering. Den säger inte att formuleringarna är forskningsvaliderade. Begriplighet, upplevd frivillighet och faktisk effekt behöver senare användartestas med både tonåringar och föräldrar.

Besluten betyder:

- **Behåll A:** ömsesidigt inflytande är rimligt; befintlig text och ID kan behållas.
- **Rollanpassa A:** målet kan vara gemensamt men förälderns större ansvar måste framgå. Förslagen nedan ska införas med rollspecifik text. Om innebörden ändras mer än redaktionellt ska ett nytt versions-ID skapas och det gamla kortet inaktiveras; gamla svar får aldrig flyttas eller delas automatiskt.
- **B/ta bort:** hade krävt tonåringsstyrd delning eller borttagning. Inget nuvarande A-kort bedömdes behöva omklassificeras direkt i denna genomgång; det utesluter inte ändring efter användartestning.

Ingen text i detta dokument aktiverar B-delning, ändrar sparade svar eller gör gamla svar gemensamma.

## Allmän kortlek

| ID | Ursprungstext | Riskanalys | Beslut och rolltext | Motivering |
|---|---|---|---|---|
| `general-01` | Jag uppskattar när vi gör saker tillsammans utan mobiltelefoner. | Låg; frivillig gemensam tid, men får inte bli krav på närhet. | **Behåll A.** Oförändrad för båda. | Båda kan rimligt vilja skapa en avgränsad gemensam stund. |
| `general-08` | Jag tycker det är viktigt att vi har gemensamma aktiviteter. | Låg; risk endast om tonåringens nej tolkas som relationsvägran. | **Behåll A.** Oförändrad; råd ska betona frivilligt val. | Aktivitetens form kan väljas jämbördigt. |
| `general-10` | Jag vill att vi visar mer uppskattning i vardagen. | Måttlig; tonåringen får inte bära ansvar för förälderns självkänsla. | **Rollanpassa A.** T: ”Jag vill att vi visar uppskattning på sätt som känns bra för båda.” F: ”Jag vill bli bättre på att visa uppskattning och fråga hur den tas emot.” | Ömsesidighet är rimlig, men föräldern ska modellera utan att kräva gensvar. |
| `general-11` | Jag mår bra av tydliga överenskommelser hemma. | Måttlig; föräldern har ansvar för begripliga och rimliga ramar. | **Rollanpassa A.** T: ”Tydliga överenskommelser hemma hjälper mig att veta vad som gäller.” F: ”Jag vill göra hemmets överenskommelser tydliga och lyssna på tonåringens synpunkter.” | Gemensam tydlighet är relevant, men makt och ansvar är asymmetriska. |
| `general-13` | Vi brukar kunna skratta tillsammans även när vi tycker olika. | Låg; humor kan annars användas för att avfärda svåra känslor. | **Behåll A.** Oförändrad; råd ska säga att humor inte ersätter lyssnande. | Delad humor är en möjlig styrka, inte ett krav. |
| `general-16` | Jag tycker det är viktigt att vi håller det vi lovar varandra. | Måttlig; löften kan inte väga lika när vuxen styr resurser och beslut. | **Rollanpassa A.** T: ”Jag vill kunna lita på de löften vi ger varandra.” F: ”Jag vill ge realistiska löften, hålla dem och förklara tidigt om något måste ändras.” | Tonåringen har rimligt ansvar, men förälderns förutsebarhet väger tyngre. |
| `general-17` | Jag vill att vi berättar när något har skadat tilliten mellan oss. | Hög; tonåringen kan pressas att konfrontera eller reparera den vuxne. | **Rollanpassa A.** T: ”Jag vill kunna berätta när något har påverkat min tillit, i min egen takt.” F: ”Jag vill göra det tryggt att berätta och ta ansvar för min del när tilliten skadats.” | Samtal kan vara gemensamt, men trygghet och reparation är främst vuxenansvar. |
| `general-20` | Jag vill att vi respekterar varandras privatliv. | Måttlig; ”varandras” kan dölja skillnaden mellan tonåringens integritet och förälderns tillsynsansvar. | **Rollanpassa A.** T: ”Jag vill att mitt privatliv respekteras och att undantag för trygghet förklaras.” F: ”Jag vill respektera tonåringens privatliv och vara tydlig med när omsorgsansvar kräver insyn.” | Bevarar integritet utan att lova en falskt symmetrisk eller absolut gräns. |
| `general-21` | Jag vill att vi frågar varandra innan vi ger råd. | Låg–måttlig; föräldern behöver ibland ingripa för säkerhet. | **Behåll A.** Oförändrad; råd undantar akuta trygghetslägen. | Samtycke till vardagliga råd är ömsesidigt och autonomistödjande. |
| `general-22` | Jag skulle vilja att vi oftare frågade hur den andra har haft det. | Låg; får inte bli krav på redovisning eller omsorg om föräldern. | **Behåll A.** Oförändrad; korta svar och avböjande ska accepteras. | Nyfiken kontakt är rimligt ömsesidig när den är kravlös. |
| `general-23` | Jag vill att vi försöker förstå varandras skäl även när vi tycker olika. | Måttlig; förståelse får inte kräva att tonåringen legitimerar olämpligt vuxenbeteende. | **Rollanpassa A.** T: ”Jag vill att mina skäl blir lyssnade på även när beslutet inte blir som jag önskar.” F: ”Jag vill förstå tonåringens skäl och förklara mina beslut utan att kräva medhåll.” | Skiljer lyssnande och inflytande från jämlik beslutsmakt. |
| `general-24` | När vi har blivit osams vill jag att vi försöker hitta tillbaka till varandra. | Hög; reparationsansvar kan förskjutas till tonåringen. | **Rollanpassa A.** T: ”Efter ett bråk vill jag kunna visa när jag är redo att hitta tillbaka.” F: ”Efter ett bråk vill jag ta initiativ till trygg återkontakt utan att pressa tonåringen.” | Relationell reparation leds av den vuxne; tonåringen behåller tempo och gränser. |
| `general-25` | Jag tycker det hjälper när någon säger förlåt efter att ha sårat den andra. | Måttlig–hög; symmetri kan dölja makt och falska ursäkter. | **Rollanpassa A.** T: ”En uppriktig ursäkt hjälper mig när någon har sårat mig.” F: ”När jag sårat vill jag ta ansvar, be om ursäkt och ändra mitt beteende.” | Tonåringen har också ansvar för egna handlingar, men vuxen modellering är central. |
| `general-26` | Jag vill att vi undviker att höja rösten när vi är oense. | Hög; tonåringen kan göras medansvarig för vuxnas affektreglering. | **Rollanpassa A.** T: ”Jag vill kunna säga att ett samtal blir för intensivt och ta paus.” F: ”Jag vill reglera min röst, avbryta om det blir otryggt och återuppta samtalet lugnt.” | Den vuxne bär större ansvar för trygg affektnivå. |
| `general-28` | Jag vill att vi märker när någon behöver stöd och frågar vad som skulle hjälpa. | Måttlig; tonåringen ska inte övervaka eller reglera förälderns mående. | **Rollanpassa A.** T: ”Jag vill kunna visa eller säga när jag behöver stöd och få frågan vad som hjälper.” F: ”Jag vill vara uppmärksam på behov av stöd och fråga utan att pressa.” | Förälderns omsorgsansvar tydliggörs; tonåringens frivilliga omtanke förblir möjlig. |
| `general-29` | Jag vill att vi bestämmer viktiga saker tillsammans när det går. | Måttlig; ”tillsammans” kan lova veto där föräldern har juridiskt ansvar. | **Rollanpassa A.** T: ”Jag vill få verkligt inflytande i beslut som berör mig.” F: ”Jag vill ge åldersrimligt inflytande och förklara beslut jag måste ta.” | Barnets rätt att komma till tals skiljs från vuxnas slutansvar. |
| `general-30` | Jag tycker det är viktigt att vi kan ändra en regel som inte fungerar. | Måttlig; föräldern sätter ytterst säkra gränser. | **Rollanpassa A.** T: ”Jag vill kunna föreslå ändringar och bli lyssnad på när en regel inte fungerar.” F: ”Jag vill ompröva regler, väga in tonåringens erfarenhet och förklara kvarvarande gränser.” | Gemensam utvärdering utan falsk symmetri i ansvar. |
| `general-31` | Jag vill att vi pratar om mobilanvändning utan att någon känner sig anklagad. | Måttlig; ”ingen” kan osynliggöra förälderns makt över regler och övervakning. | **Rollanpassa A.** T: ”Jag vill kunna beskriva min mobilanvändning och mina behov utan att bli skammad.” F: ”Jag vill prata sakligt om mobilvanor, förklara omsorgsskäl och undvika skam.” | Föräldern sätter vid behov gränser men ansvarar för trygg dialog. |
| `general-32` | Jag skulle vilja att vi gjorde något roligt tillsammans oftare. | Låg; risk för skuld vid avböjande. | **Behåll A.** Oförändrad; råd ska erbjuda små frivilliga alternativ. | Ett gemensamt önskemål om aktivitet är jämbördigt. |
| `general-33` | Jag uppskattar små stunder tillsammans även när vi inte pratar om något särskilt. | Låg. | **Behåll A.** Oförändrad. | Kravlös närvaro kan väljas av båda. |
| `general-34` | Jag vill att vi oftare berättar vad vi uppskattar hos varandra. | Måttlig; får inte bli krav på att tonåringen bekräftar föräldern. | **Rollanpassa A.** T: ”Jag vill kunna ge och få uppskattning på sätt som känns äkta.” F: ”Jag vill visa konkret uppskattning utan att kräva ett visst svar tillbaka.” | Ömsesidig uppskattning är rimlig, men vuxen ska inte söka emotionell försörjning. |

## Temakortlek: Samtalsämnen

| ID | Ursprungstext | Riskanalys | Beslut och rolltext | Motivering |
|---|---|---|---|---|
| `samtal-01` | Vad som varit roligt den senaste veckan | Låg. | **Behåll A.** Oförändrad. | Neutralt, frivilligt samtalsämne. |
| `samtal-02` | Hur vi har det i skolan eller på jobbet | Låg–måttlig; tonåringen ska inte bära vuxnas arbetsstress. | **Behåll A.** Oförändrad; råd ska låta båda välja detaljnivå. | Delning kan vara ömsesidig utan omsorgskrav. |
| `samtal-03` | Vad vi vill göra under nästa ledighet | Låg. | **Behåll A.** Oförändrad. | Gemensam planering med rimligt inflytande. |
| `samtal-04` | Hur vi vill prata om sociala medier | Måttlig; förälderns tillsynsansvar behöver vara tydligt. | **Rollanpassa A.** T: ”Hur jag vill att vi pratar om sociala medier.” F: ”Hur jag kan prata om sociala medier utan skam och samtidigt ta mitt trygghetsansvar.” | Autonomi kombineras med vuxen omsorg. |
| `samtal-05` | Vad vi vill lära oss | Låg. | **Behåll A.** Oförändrad. | Jämbördigt, utforskande ämne. |
| `samtal-06` | Hur vi visar att vi lyssnar | Måttlig; föräldern ska modellera lyssnande. | **Rollanpassa A.** T: ”Vad som hjälper mig att känna mig lyssnad på.” F: ”Hur jag kan visa att jag lyssnar och kontrollera att jag förstått.” | Tonåringen beskriver behov; vuxen tar större genomförandeansvar. |
| `samtal-07` | Vad som gör oss stressade | Måttlig; risk att tonåringen blir förälderns stödperson. | **Rollanpassa A.** T: ”Vad som stressar mig och vilket stöd jag vill ha.” F: ”Hur jag kan lyssna på tonåringens stress utan att lägga min egen reglering på hen.” | Samtal tillåts men omsorgsansvaret hålls hos vuxen. |
| `samtal-08` | Vad vi drömmer om framöver | Låg. | **Behåll A.** Oförändrad. | Frivillig ömsesidig nyfikenhet. |

## Temakortlek: Aktiviteter tillsammans

Samtliga åtta kort har låg relationsrisk när aktiviteten är frivillig, säker och åldersrimlig. Ett nej får aldrig tolkas som avvisande av relationen.

| ID | Ursprungstext | Riskanalys | Beslut och rolltext | Motivering |
|---|---|---|---|---|
| `aktiviteter-01` | Laga mat tillsammans | Låg. | **Behåll A.** Oförändrad. | Konkret gemensamt val. |
| `aktiviteter-02` | Ta en promenad ihop | Låg. | **Behåll A.** Oförändrad. | Frivillig aktivitet. |
| `aktiviteter-03` | Se en film tillsammans | Låg. | **Behåll A.** Oförändrad. | Frivillig aktivitet. |
| `aktiviteter-04` | Spela ett spel | Låg. | **Behåll A.** Oförändrad. | Frivillig aktivitet. |
| `aktiviteter-05` | Prova en ny aktivitet | Låg; hänsyn behövs till kostnad och sensorisk/psykisk belastning. | **Behåll A.** Oförändrad. | Båda kan påverka valet. |
| `aktiviteter-06` | Göra en utflykt | Låg; föräldern ansvarar för säkerhet och resurser. | **Behåll A.** Oförändrad. | Själva önskemålet kan vara jämbördigt. |
| `aktiviteter-07` | Visa varandra favoritmusik | Låg. | **Behåll A.** Oförändrad. | Ömsesidigt och avgränsat. |
| `aktiviteter-08` | Skapa något tillsammans | Låg. | **Behåll A.** Oförändrad. | Frivilligt gemensamt projekt. |

## Temakortlek: Regler för Schyssta listan

| ID | Ursprungstext | Riskanalys | Beslut och rolltext | Motivering |
|---|---|---|---|---|
| `regler-01` | Vi knackar innan vi går in i varandras rum. | Måttlig; tonåringens integritet och förälderns tillsyn är inte symmetriska. | **Rollanpassa A.** T: ”Jag vill att den som kan knackar innan hen går in i mitt rum.” F: ”Jag vill respektera tonåringens rum och förklara sällsynta trygghetsundantag.” | Skyddar integritet utan absolut löfte. |
| `regler-02` | Vi lyssnar färdigt innan vi svarar. | Måttlig; föräldern ska modellera och skapa tryggt samtalsutrymme. | **Rollanpassa A.** T: ”Jag vill få prata färdigt och försöka lyssna när jag kan.” F: ”Jag vill lyssna färdigt och hjälpa samtalet att förbli tryggt.” | Båda bidrar, vuxen bär större regleringsansvar. |
| `regler-03` | Vi får pausa gräl och bestämmer när vi pratar vidare. | Hög; återupptagande får inte läggas på tonåringen eller användas för undvikande. | **Rollanpassa A.** T: ”Jag får be om paus och påverka när jag är redo igen.” F: ”Jag respekterar paus och tar ansvar för ett tryggt förslag om återupptagande.” | Paus och reparation kräver vuxen ledning utan press. |
| `regler-04` | Vi frågar innan vi lånar varandras saker. | Låg–måttlig; vissa familjeresurser ägs/ansvaras olika. | **Behåll A.** Oförändrad; råd ska avgränsa vilka saker regeln gäller. | Ömsesidig respekt är rimlig. |
| `regler-05` | Vi pratar om hur sysslorna ska fördelas. | Måttlig; tonåringens ansvar måste vara ålders- och belastningsrimligt. | **Rollanpassa A.** T: ”Jag vill kunna påverka vilka rimliga sysslor jag ansvarar för.” F: ”Jag vill fördela åldersrimliga sysslor och ta hänsyn till tonåringens belastning.” | Praktiskt eget ansvar bevaras utan vuxenlik börda. |
| `regler-06` | Vi berättar när planer som berör andra ändras. | Låg. | **Behåll A.** Oförändrad. | Ömsesidig vardagshänsyn är rimlig. |
| `regler-07` | Vi kommer överens om tider för sömn och hemkomst. | Hög; föräldern har omsorgs- och säkerhetsansvar och kan behöva sätta gräns. | **Rollanpassa A.** T: ”Jag vill få inflytande över tider och förstå skälen för gränser.” F: ”Jag vill lyssna, förklara trygghets- och hälsoskäl och sätta åldersrimliga tider.” | Inflytande är inte samma sak som gemensamt veto. |
| `regler-08` | Vi kan ompröva regler som inte fungerar. | Måttlig. | **Rollanpassa A.** T: ”Jag kan föreslå att en regel omprövas och bli lyssnad på.” F: ”Jag omprövar regler öppet och förklarar vad som kan eller inte kan ändras.” | Föräldern behåller slutansvar och transparens. |
| `regler-09` | Vi bestämmer gemensamma mobilfria stunder. | Måttlig; vuxen kan annars kräva symmetri utan hänsyn till olika behov. | **Rollanpassa A.** T: ”Jag vill kunna påverka när en gemensam mobilfri stund passar.” F: ”Jag vill föreslå avgränsade mobilfria stunder och själv föregå med gott exempel.” | Modellering och proportionerligt inflytande. |
| `regler-10` | Vi försöker prata utan att höja rösten. | Hög; vuxens affektreglering får inte göras beroende av tonåringen. | **Rollanpassa A.** T: ”Jag får säga att samtalet blir för intensivt och be om paus.” F: ”Jag ansvarar för att reglera min röst och avbryta ett otryggt samtal.” | Trygghet är primärt vuxenansvar. |
| `regler-11` | Vi får säga till när något känns orättvist. | Låg–måttlig; uttryckt orättvisa måste tas emot utan repressalie. | **Rollanpassa A.** T: ”Jag får säga att något känns orättvist utan att straffas för att jag säger det.” F: ”Jag vill lyssna och förklara mitt beslut utan att bestraffa invändningen.” | Skyddar tonåringens röst även när beslutet står kvar. |
| `regler-12` | Vi försöker reda ut saker efter ett bråk. | Hög; reparationsansvar riskerar att jämställas. | **Rollanpassa A.** T: ”Jag får påverka när och hur jag kan delta i ett samtal efter bråk.” F: ”Jag tar initiativ till trygg reparation och ansvar för min del.” | Föräldern leder återkontakt; tonåringen har handlingsutrymme. |

## Temakortlek: Sätt att visa uppskattning

| ID | Ursprungstext | Riskanalys | Beslut och rolltext | Motivering |
|---|---|---|---|---|
| `uppskattning-01` | Säga tack för små saker | Låg; tack får inte framtvingas. | **Behåll A.** Oförändrad. | Frivillig vardagsuppskattning är ömsesidig. |
| `uppskattning-02` | Fråga hur den andra mår | Måttlig; tonåringen ska inte bli förälderns behandlare. | **Rollanpassa A.** T: ”Jag kan fråga hur föräldern mår utan att behöva lösa det.” F: ”Jag vill fråga hur tonåringen mår och bära ansvaret för min egen reglering.” | Tillåter omtanke men stoppar parentifiering. |
| `uppskattning-03` | Skicka ett vänligt meddelande | Låg. | **Behåll A.** Oförändrad. | Avgränsad frivillig gest. |
| `uppskattning-04` | Göra något hjälpsamt | Måttlig; ”hjälpsamt” kan bli obegränsat omsorgsarbete. | **Rollanpassa A.** T: ”Göra en liten, frivillig och åldersrimlig hjälpsam sak.” F: ”Erbjuda konkret hjälp utan att kräva återgäldning.” | Begränsar börda och ömsesidighetskrav. |
| `uppskattning-05` | Ge en kram när båda vill | Låg; formuleringen har tydligt ömsesidigt samtycke. | **Behåll A.** Oförändrad. | Kroppslig autonomi är inbyggd. |
| `uppskattning-06` | Berätta vad man uppskattar | Låg–måttlig; får inte bli krav på emotionell bekräftelse. | **Behåll A.** Oförändrad; råd ska betona äkthet och frivillighet. | Rimlig ömsesidig handling. |
| `uppskattning-07` | Uppmärksamma den andras ansträngning | Låg–måttlig; tonåringen ska inte behöva validera vuxens omsorg. | **Behåll A.** Oförändrad; föräldraråd ska inte kräva gensvar. | Kan vara ömsesidigt när det inte blir skuldskapande. |
| `uppskattning-08` | Ge varandra odelad uppmärksamhet | Måttlig; tonåringen får inte åläggas ständig tillgänglighet. | **Rollanpassa A.** T: ”Välja en kort stund då jag vill ge och få odelad uppmärksamhet.” F: ”Skapa en kravlös stund och respektera om tonåringen inte är redo.” | Frivillighet och timing skyddas. |

## Temakortlek: Svåra situationer och återhämtning

| ID | Ursprungstext | Riskanalys | Beslut och rolltext | Motivering |
|---|---|---|---|---|
| `aterhamtning-01` | Ta en paus när vi blir arga | Hög; vuxen måste ansvara för egen affekt och trygghet. | **Rollanpassa A.** T: ”Jag får be om paus när samtalet blir för intensivt.” F: ”Jag tar paus innan jag tappar reglering och säkerställer ett tryggt återupptagande.” | Paus ska skydda, inte överge eller bestraffa. |
| `aterhamtning-02` | Fråga om den andra vill ha råd | Låg–måttlig; akut trygghet kan kräva handling. | **Behåll A.** Oförändrad; undantag för omedelbar säkerhet. | Autonomistödjande och rimligt ömsesidigt. |
| `aterhamtning-03` | Säga förlåt när vi sårat någon | Måttlig–hög; vuxen behöver modellera full reparation. | **Rollanpassa A.** T: ”Jag vill kunna ta ansvar för sådant jag gjort som sårat.” F: ”Jag tar ansvar, ber om ursäkt utan förbehåll och försöker ändra beteendet.” | Båda har ansvar, men den vuxnes är större. |
| `aterhamtning-04` | Prata vidare när vi lugnat oss | Hög; tonåringen kan behöva mer tid och ska inte pressas. | **Rollanpassa A.** T: ”Jag får säga när jag är tillräckligt redo att prata vidare.” F: ”Jag föreslår en lugn tid och respekterar att tonåringen kan behöva mer tid.” | Återupptagande leds tryggt utan tvång. |
| `aterhamtning-05` | Berätta vad vi behöver | Måttlig; tonåringen ska inte tillgodose förälderns emotionella behov. | **Rollanpassa A.** T: ”Jag vill kunna uttrycka behov och gränser i min egen takt.” F: ”Jag vill fråga om tonåringens behov och uttrycka mina vuxenbehov utan att lägga reglering på hen.” | Skiljer självuttryck från omsorgskrav. |
| `aterhamtning-06` | Komma överens om en paussignal | Låg–måttlig; signalen måste alltid respekteras av vuxen. | **Rollanpassa A.** T: ”Jag vill kunna använda en paussignal som tas på allvar.” F: ”Jag vill respektera paussignalen och ansvara för trygg återkontakt.” | Gemensamt verktyg, asymmetriskt genomförandeansvar. |
| `aterhamtning-07` | Be om hjälp när vi kör fast | Måttlig; tonåringen ska inte ansvara för att identifiera vuxnas stödbehov. | **Rollanpassa A.** T: ”Jag vill veta vilka trygga vuxna jag kan be om hjälp.” F: ”Jag söker vuxenstöd när situationen kräver det och hjälper tonåringen hitta stöd.” | Föräldern bär ansvar för extern hjälp och säkerhet. |
| `aterhamtning-08` | Visa att vi vill bli sams | Hög; kan pressa tonåringen till snabb försoning. | **Rollanpassa A.** T: ”Jag får visa på mitt sätt när jag är öppen för kontakt igen.” F: ”Jag visar att relationen är trygg och att jag finns kvar utan att kräva snabb försoning.” | Kontakt erbjuds av vuxen; tonåringens tempo respekteras. |

## Temakortlek: Små gemensamma förändringar

| ID | Ursprungstext | Riskanalys | Beslut och rolltext | Motivering |
|---|---|---|---|---|
| `forandring-01` | Äta en måltid tillsammans | Låg; hänsyn behövs till schema, ätproblematik och sensoriska behov. | **Behåll A.** Oförändrad; råd ska vara flexibelt och icke-moraliserande. | Frivillig konkret rutin. |
| `forandring-02` | Avsätta tio minuter för samtal | Låg–måttlig; tonåringen ska kunna avstå eller flytta tiden. | **Behåll A.** Oförändrad; råd ska respektera timing. | Avgränsad gemensam prövning. |
| `forandring-03` | Fråga innan vi ger råd | Låg–måttlig. | **Behåll A.** Oförändrad; undantag för akut säkerhet. | Autonomistödjande vardagsstrategi. |
| `forandring-04` | Prata om veckans planer | Låg. | **Behåll A.** Oförändrad. | Praktisk ömsesidig samordning. |
| `forandring-05` | Göra något roligt varje månad | Låg; ekonomi och ork kan begränsa. | **Behåll A.** Oförändrad; enkel kostnadsfri aktivitet ska vara möjlig. | Jämbördigt önskemål. |
| `forandring-06` | Ha en stund utan mobiler | Låg–måttlig; får inte bli dold kontroll. | **Rollanpassa A.** T: ”Välja en kort mobilfri stund som passar mig.” F: ”Föreslå en avgränsad mobilfri stund och själv delta på samma villkor.” | Föräldern modellerar och undviker ensidig kontroll. |
| `forandring-07` | Utvärdera en regel efter två veckor | Måttlig; föräldern måste förklara beslut och säkerhetsgränser. | **Rollanpassa A.** T: ”Få berätta hur regeln fungerat och föreslå ändring.” F: ”Följa upp, lyssna och förklara vad som ändras eller varför gränsen behövs.” | Ger reellt inflytande utan falskt veto. |
| `forandring-08` | Berätta något som fungerat bra | Låg; får inte användas för att tysta problem. | **Behåll A.** Oförändrad; råd ska tillåta blandade erfarenheter. | Resursorientering utan krav på positivitet. |

## Samlad konsekvensbedömning

- **34 kort behålls som A utan textändring.** De handlar främst om frivilliga aktiviteter, neutrala samtalsämnen och avgränsade ömsesidiga handlingar.
- **39 kort har fått rollanpassad A-text i den deklarativa katalogen.** Gemensamt mål är oförändrat, men vuxenansvaret syns i förälderns presentation och tonåringens autonomi i tonåringens presentation.
- **0 kort omklassificeras direkt till B och 0 tas bort i denna genomgång.** Flera högriskkort ligger nära gränsen; användartestning kan motivera senare omklassificering.
- Kortens stabila ID, typ, kanoniska ursprungstext och sparade svar är oförändrade. `ROLE_TEXT_BY_CARD` håller de 39 presentationerna separat från logiken och märker dem med `presentationVersion: 2`. Regressionstester jämför exakt mot granskningsprotokollet. Bedömningen är att dessa formuleringar förtydligar roller inom samma gemensamma mål och därför inte omtolkar svaret; en framtida större betydelseändring måste fortfarande få nytt ID och får inte ärva gamla svar.
- B-delning och gemensam viktighetsprioritering förblir avstängda tills separata server-/RLS-/tvåkontotester är godkända.

## Redaktionellt mandat och återstående användargranskning

Erik delegerade den 27 oktober 2026 den redaktionella och psykologiska bearbetningen, så separat innehållsgodkännande är inte längre en blockerare. De rollspecifika texterna ska ändå användartestas med frivilliga tonåringar och föräldrar före bred lansering. Det testet får leda till nya redaktionella versioner eller nya kort-ID:n, men befintliga svar får aldrig flyttas eller omtolkas automatiskt.
