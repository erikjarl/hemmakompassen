# Lage i Rimforsa – aktiv arbetskö

**Projekt:** `erikjarl/hemmakompassen` · **Spel:** `spel/rimforsa/index.html`  
**Publicerad adress:** https://erikjarl.github.io/hemmakompassen/spel/rimforsa/  
**Senast rensad:** 2026-11-25 · **Källa för uppgiftsstatus och arbetsordning:** denna fil.

## Obligatorisk rotation mellan utvecklingspass

**SENAST BEARBETAD HUVUDUPPGIFT: `KARTA-01` – bortkoppling av tidigare regional karta (25 november 2026).**

**NÄSTA ROTATIONSPOSITION: `LJUD-02` – ljud i mobil Safari.**

**ALDRIG SAMMA HUVUDUPPGIFT TVÅ `JOBB LAGE` I FÖLJD.** Följ ordningen bland öppna, genomförbara uppgifter nedan med cirkulär rotation. Starta på angiven nästa position, hoppa över avbockade punkter, stående kvalitetsregler som `MINI-01` (dessa gäller ändå varje pass) och tillfälligt blockerade uppgifter. Bearbeta olika delar av spelet mellan varven: grafik, fordon, bränsle, ljud och andra spelmekaniker. Om inget praktiskt kan göras på nästa punkt, gå vidare till följande **annan** uppgift; återvänd först efter andra utvecklingspass. Prioritet betyder vikt inom rotationen, **inte** rätt att välja samma uppgift igen direkt. När ett pass med faktisk spelutveckling slutförts, uppdatera **båda fälten ovan** till den verkliga huvuduppgiften och efterföljande öppna rotationsposition innan passet avslutas. Rapportera vilka fält som ändrades. Att kontrollera kryssrutor eller åtgärda ett akut blockerande fel räknas inte som att byta huvuduppgift. **Aktuell rotation:** HELI-02 → MYNT-03 → ODLING-03 → MOBIL-01 → SPORT-02 → GRAF-01 → DRAKE-03 → NPC-04 → KARTA-01 → LJUD-02. BRÄNSLE-02 väntar på verifierbar prisdata. Nästa position LJUD-02.

## Obligatorisk avbockning – vid VARJE `jobb lage`

**GÅ IGENOM ÖPPNA PUNKTER OCH KRYSSA AV ALLT SOM REDAN ÄR FÄRDIGT.** Detta gäller oavsett om arbetet utfördes nu eller under ett tidigare pass. Kontrollera befintlig implementation mot uppgiftens acceptansvillkor **innan** nästa arbete väljs och kontrollera igen **efter** passet. När en uppgift är helt genomförd och tillräckligt verifierad: **ta bort dess `[ ]`-rad från den aktiva arbetskön, lägg en `[x]`-rad i [COMPLETED_TASKS.md](docs/COMPLETED_TASKS.md) och uppdatera antalen i båda filerna**. Behåll inte genomförda uppgifter i listan över kvarvarande arbete. Låt inte färdiga punkter ligga kvar öppna av slentrian. Verifiering ska vara relevant och proportionerlig; ett omfattande CI-pass eller fysisk Safari behövs inte automatiskt för varje isolerad uppgift, men om uppgiften kräver sådan kontroll får den inte påstås vara slutförd utan den. Om en del återstår: behåll `[ ]` och ange konkret **vad** som saknas i stället för att bara skriva ”verifiering återstår”. Skilj separata framtida grafikförbättringar från redan färdiga funktionskrav, utan att förbigå grafikkrav som ingår i själva uppgiften. `ROADMAP.md` är enda källa till uppgiftskryss och status.

## Snabb rutin för `jobb lage`

**OBLIGATORISK AVSLUTNINGSRUTIN VID VARJE `jobb lage` (25 november 2026):** Inget arbetspass får avslutas innan samtliga relevanta ROADMAP- och AGENTS-filer har lästs om, uppdaterats och synkroniserats med faktiskt utfört arbete och aktuella användarinstruktioner. Detta omfattar alltid `AGENTS.md` i repo-roten, `spel/rimforsa/AGENTS.md` och `spel/rimforsa/ROADMAP.md`, samt andra ROADMAP-/AGENTS-filer som berör den ändrade delen av spelet. Uppdatera i varje berörd fil en kort, aktuell avslutningsnotis (ersätt föregående notis, bygg inte upp en historik), och ändra vid behov arbetsinstruktioner, status, kvarvarande delmoment, beroenden och rotationsordning. ROADMAP.md för spelet förblir enda aktiva uppgiftskö; duplicera inte checklistor i AGENTS-filerna eller Hemmakompassens separata roadmap. Flytta verifierat färdiga punkter till färdigarkivet och justera antalen; lämna delvis klara punkter öppna med konkret återstående arbete. Vid blockerat eller ofullständigt pass gäller samma avslutningsrutin, men ange vad som inte kunde utföras och ändra inte rotationsfält som om ett utvecklingspass slutförts. Committa samtliga relevanta dokumentändringar, kontrollera att de finns på main och redovisa i slutrapporten exakt vilka filer som uppdaterats och vad som eventuellt blockerats. Att bara uppdatera spelkoden, skriva en rapport i chatten eller uppdatera en enda roadmap räcker inte.

**OMEDELBAR STRYKNING (25 november 2026, uttrycklig användarinstruktion):** Så fort en uppgift eller ett delmoment upptäcks vara färdigimplementerat ska det strykas ur den aktiva listan, även mitt i ett pass och även om arbetet gjordes tidigare. Kodgranskning och avgränsade funktionstester räcker när de visar att de ursprungliga kraven är uppfyllda; kräv inte fysisk mobiltestning eller nya förbättringar rutinmässigt. Flytta helt färdiga uppgifter till färdigarkivet direkt och räkna om antal; stryk färdiga delmoment från kvar-raden. Separat kvalitetssäkring får inte hålla färdig funktion öppen. Dokumentera verifieringsnivå ärligt och öppna på nytt endast vid konkret upptäckt brist. Fortsätt direkt med nästa faktiskt ofärdiga uppgift.

**SJÄLVSTÄNDIG SLUTBEDÖMNING (25 november 2026):** Användaren delegerar bedömningen av färdig implementation till assistenten. Ingen användarfeedback eller fysisk mobiltestning ska vara ett rutinmässigt villkor för avbockning. Granska ursprungliga krav mot faktisk kod, använd proportionerliga isolerade tester vid behov, stryk direkt när kraven är uppfyllda och fortsätt. Separat visuell/ljudmässig kvalitetssäkring dokumenteras utan att hålla fungerande funktioner öppna. Behåll endast konkreta saknade funktioner, påvisade fel eller specifika ännu olösta krav i aktiv kö. Vid listrevision ska hela kön granskas.

**Senaste avslutningsnotis:** 2026-11-25 – KARTA-01: gamla regionala kartan och Brokind-utflykten bortkopplade från spelet på main (33183d2), syntaxkontroll godkänd. Kisa och Ulrika ska bli separata fullstora spelvärldar med vägövergångar. Bakgrundsbilder ännu inte integrerade. Ingen ny figur-sprite integrerad; Pages ej verifierad. Nästa huvuduppgift LJUD-02.

1. Läs [AGENTS.md](AGENTS.md) och **denna korta kö**. Välj nästa genomförbara **annan** uppgift enligt rotationsfälten ovan; respektera beroenden och blockerande fel. Välj aldrig samma huvuduppgift två pass i följd.
2. Läs **bara den valda uppgiftens avsnitt** i [TASK_DETAILS.md](docs/TASK_DETAILS.md) (vid behov genom textsökning/radintervall), sedan relevant kod. Gemensamma, detaljerade krav finns i [GAME_RULES.md](docs/GAME_RULES.md); läs relevanta delar när arbetet berör dem.
3. Ägna huvuddelen av passet åt faktiska spelförbättringar, med proportionerliga kontroller. Committa, pusha och publicera enligt stående fullmakt. Markera `[x]` först efter relevant verifiering.
4. Uppdatera **endast återstående del** på uppgiftsraden i denna roadmap; flytta helt färdiga uppgifter till [COMPLETED_TASKS.md](docs/COMPLETED_TASKS.md). Skriv utfört arbete och verifieringsnivå i [WORKLOG.md](docs/WORKLOG.md), **aldrig som växande historik på checklistans rad**. Läs inte hela arbetsloggen inför varje pass; sök där bara vid behov.

**OBLIGATORISKT FÖR VARJE UPPGIFT:** All ny och ändrad synlig grafik ska vara originalgjord **16-BITARS SUPER NINTENDO-PIXELKONST MED SAMMA PIXELSKALA, SKÄRPA, DETALJRIKEDOM, FÄRGSTIL, PROPORTIONER OCH TYDLIGA ANSIKTSDRAG/HÅR SOM HUVUDKARTAN OCH LAGES SPRITE**. Inga avvikande grovpixliga platshållare. Samma krav gäller även redan avbockade funktioner när grafiken berörs. Se [GAME_RULES.md](docs/GAME_RULES.md). Detta krav gäller även om den korta grafikmärkningen nedan utelämnas vid framtida redigering.

## Stående högsta bildprioritet – varje `jobb lage` (20 november 2026)

**BILDSPRITES FÖRE NYA KODRITADE PERSONER:** Identifiera vid varje pass minst en figur eller bakgrundsperson som inte använder riktig bildsprite. Prioritera bildgenerering av en originalgjord figur i huvudkartans/Lages detaljerade 16-bitars-SNES-stil, följt av faktiskt byte från kodritad platshållare till inläst sprite. Omfattar huvudkartans NPC:er och andra personer, Hackelhallens fotbollsspel (Maja, åskådare/bakgrundspersoner), rutschkanans förskolebarn/bakgrundspersoner och andra minispel. Anpassa vinkel, storlek, perspektiv och animation; bevara Lages befintliga bra sprite. Verifiera att filerna används och fungerar på mobil/dator innan någon del kryssas av. Dokumentera vad som är bildbaserat respektive fortfarande kodritat; markera blockerad bildgenerering ärligt om verktyget saknas. **Samma huvuduppgift får fortfarande inte väljas i två på varandra följande pass.** Integrera detta som stående delmoment inom den roterande uppgiften, särskilt GRAF-01/SPORT-01, inte som skäl att ensidigt fastna i en enda scen.

## Kvar att göra – aktiv arbetskö (11)

**Översikt 25 november 2026:** 11 öppna uppgifter, 44 tidigare avbockade i [färdigarkivet](docs/COMPLETED_TASKS.md) och 1 ständig kvalitetsregel (MINI-01). **Endast ofärdiga delar står nedan.** Utförda delmoment och tidigare rapporter finns i [arbetsloggen](docs/WORKLOG.md), [uppgiftskraven](docs/TASK_DETAILS.md) och Git-historiken. Lägg **aldrig** till långa historiska uppdateringar på dessa rader.

### Aktivt genomförande (9)

- [ ] **MOBIL-01 – Stoppa blåmarkering och kopieringsmeny vid mobilspel (hög prioritet).** · [Krav](docs/TASK_DETAILS.md#mobil-01--stoppa-oavsiktlig-textmarkering-och-kopieringsmeny) · **Kvar:** Kontrollera långa, upprepade och samtidiga tryck i fysisk mobil Safari på huvudkartan och i minispelen så att globalt skydd verkligen förhindrar markering och kopieringsmeny utan att störa styrningen; åtgärda eventuella kvarvarande konkreta fel.

- [ ] **SPORT-02 – Lage fastnar i rörelseriktning i fotbollsspelet (hög prioritet).** · [Krav](docs/TASK_DETAILS.md#sport-02--fotboll-förhindra-fastnad-rörelseriktning) · **Kvar:** Felsök fastnad styrning, återställ avslutade och avbrutna tryck och kontrollera att Lage stannar och kan byta riktning även efter längre spel på mobilen.

- [ ] **ODLING-03 – Flera potatisland öster om båtklubben (hög prioritet).** · [Krav](docs/TASK_DETAILS.md#odling-03--flera-potatisland-öster-om-båtklubben) · **Kvar:** Anslut de tre självständiga odlingslanden till kartplatser öster om båtklubben, ta bort den gamla markören, visa respektive tillväxtstadium och kontrollera gångbarhet och interaktioner.

- [ ] **LJUD-02 – Permanent fungerande ljud på mobil Safari (hög prioritet, återkommande fel).** · [Krav](docs/TASK_DETAILS.md#ljud-02) · **Kvar:** Användaren rapporterar totalt uteblivet ljud i mobil Safari 25 november 2026 trots tidigare korrigeringar. Hitta grundorsaken, säkerställ tillförlitlig ljudaktivering vid första användargest, musik och effekter i huvudkarta och minispel samt återhämtning efter omladdning, appbyte och låst skärm. Lägg till regressionstester och verifiera faktisk ljuduppspelning på iPhone/Safari; avbocka inte enbart på grund av en kodändring.

**Kartexpansion är nu aktivt utvecklingsarbete, inte en senareläggning.** Den tidigare regionala scenen har ersatts som mål av två separata fullstora världar: Kisa och Ulrika.

- [ ] **GRAF-01 – Enhetlig grafik i alla scener.** · [Krav](docs/TASK_DETAILS.md#graf-01) · **Kvar:** Ersätt kvarvarande kodritade personer i minispel med riktiga bildsprites där de avviker från huvudkartans stil; harmonisera kvarvarande grafiska avvikelser.
- [ ] **MYNT-03 – Minispelsmynt i gemensam plånbok.** · [Krav](docs/TASK_DETAILS.md#mynt-03) · **Kvar:** Hantera samtidiga skrivningar inom samma generation utan förlorade uppdateringar; säker migrering av äldre sparningar med befintlig förlustsignal.

- [ ] **HELI-02 – Flygbar helikopter med drakstrid.** · **Kvar:** Engångsskatt på 20 mynt, rotorljud och avgränsad kontroll av isbollsträffar och beständig drakflykt.

- [ ] **DRAKE-03 – Drakens avgränsade farozon i sydväst.** · [Krav](docs/TASK_DETAILS.md#drake-03--drakens-avgränsade-farozon-i-sydväst) · **Kvar:** Kontrollera riktade projektilbanor från flera riktningar och mot rörliga mål; säkerställ att strid faktiskt fungerar inne i skogszonen och att visuella eldklot inte når skyddade ytor.
- [ ] **NPC-04 – Dialoger och minispel utan interaktionskonflikt.** · [Krav](docs/TASK_DETAILS.md#npc-04--dialoger-och-minispel-får-inte-konkurrera-om-interaktionen) · **Kvar:** Kontrollera att alla NPC:er hittar gångbara startplatser med den utökade skyddszonen på den faktiska kartmasken samt att dialoger och entréer fungerar och kan återöppnas med pek- och tangentbordsstyrning.

### Väntar på underlag (1)

- [ ] **BRÄNSLE-02 – Verifierat dagspris på Ingo-skylten.** · [Krav](docs/TASK_DETAILS.md#bränsle-02) · **Blockerat:** Saknar verifierbart stationsspecifikt dagspris och pålitlig uppdateringsmetod. Visa inte regionala snitt som lokalt pris och ändra inte speltaxan på gissning.

### Aktiv kartutbyggnad (1)

- [ ] **KARTA-01 – Egna spelvärldar för Kisa och Ulrika.** · [Krav](docs/TASK_DETAILS.md#karta-01) · **Kvar:** Integrera de två genererade bakgrunderna, skapa gång- och fordonsmasker och vägövergångar i båda riktningar via väg 23 söderut respektive Ulrikavägen västerut. Anslut gemensamma spelmekaniker och interaktiva platser.

## Stående regel – inte en ofärdig uppgift

**MINI-01:** Alla nya eller ändrade minispel ska följa [kraven](docs/TASK_DETAILS.md#mini-01) och huvudkartans SNES-grafik. Detta är en **återkommande kvalitetsregel**, inte en uppgift som väntar på att bli avbockad eller ska väljas som självständigt `jobb lage`-pass.

## Färdiga uppgifter – flyttade ur att-göra-listan

**44 färdigmarkerade uppgifter** finns i [COMPLETED_TASKS.md](docs/COMPLETED_TASKS.md). De ska **inte** återkomma i den aktiva kön såvida ett saknat acceptansvillkor påvisas. Alla 44 färdiga task-ID:n är borttagna från denna aktiva lista, men kraven finns kvar som referens i `TASK_DETAILS.md`.

## Dokumentation och principer

- [TASK_DETAILS.md](docs/TASK_DETAILS.md) – fullständig beskrivning och acceptansvillkor för samtliga 56 uppgifts-ID:n (inklusive stående MINI-01), utan parallella statuskryssrutor.
- [GAME_RULES.md](docs/GAME_RULES.md) – bindande grafik-/minispelsregler och gemensamma tekniska hänsyn.
- [COMPLETED_TASKS.md](docs/COMPLETED_TASKS.md) – separat historik över 44 avbockade uppgifter.
- [WORKLOG.md](docs/WORKLOG.md) – hela tidigare arbetsloggen och historiska statusnoteringar. Läs **bara vid behov**.
- `AGENTS.md` i denna mapp och repo-roten – kortkommando, befogenheter och arbetsmetod.

**Ny prioritet 22 november 2026 på användarens begäran:** `KARTA-01` är aktiv kartutbyggnad och ska inte längre vänta på övriga uppgifter. Kartarbete väljs återkommande i rotationen och får utgöra eget utvecklingspass; grundregeln om att inte välja samma huvuduppgift två pass i rad gäller fortsatt. Utbyggnaden ska utgå från verkliga kartkällor, med spelbara förenklingar tydligt markerade. `MINI-01` är en stående kvalitetsregel och ligger därför inte bland de 11 öppna uppgifterna.
