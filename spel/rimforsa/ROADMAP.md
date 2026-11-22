# Lage i Rimforsa – aktiv arbetskö

**Projekt:** `erikjarl/hemmakompassen` · **Spel:** `spel/rimforsa/index.html`  
**Publicerad adress:** https://erikjarl.github.io/hemmakompassen/spel/rimforsa/  
**Senast rensad:** 2026-11-21 · **Källa för uppgiftsstatus och arbetsordning:** denna fil.

## Obligatorisk rotation mellan utvecklingspass

**SENAST BEARBETAD HUVUDUPPGIFT: `HUV-05` – förlustsignal kontrolleras även när ett redan öppet spelfönster får fokus (22 november 2026).**

**NÄSTA ROTATIONSPOSITION: `HUV-06` – nästa öppna roterande huvuduppgift.**

**ALDRIG SAMMA HUVUDUPPGIFT TVÅ `JOBB LAGE` I FÖLJD.** Följ ordningen bland öppna, genomförbara uppgifter nedan med cirkulär rotation. Starta på angiven nästa position, hoppa över avbockade punkter, stående kvalitetsregler som `MINI-01` (dessa gäller ändå varje pass) och tillfälligt blockerade uppgifter. Bearbeta olika delar av spelet mellan varven: grafik, fordon, bränsle, ljud och andra spelmekaniker. Om inget praktiskt kan göras på nästa punkt, gå vidare till följande **annan** uppgift; återvänd först efter andra utvecklingspass. Prioritet betyder vikt inom rotationen, **inte** rätt att välja samma uppgift igen direkt. När ett pass med faktisk spelutveckling slutförts, uppdatera **båda fälten ovan** till den verkliga huvuduppgiften och efterföljande öppna rotationsposition innan passet avslutas. Rapportera vilka fält som ändrades. Att kontrollera kryssrutor eller åtgärda ett akut blockerande fel räknas inte som att byta huvuduppgift. **Aktuell rotation:** DRAKE-02 → MYNT-03 → HUV-05 → HUV-06 → KARTA-02 → FORDON-02 → LJUD-02 → LJUD-03 → GRAF-01 (20 nov). BRÄNSLE-02 saknade verifierbar prisuppgift; LJUD-04 kräver hörselprov och GRAF-02 är spärrad som nästa huvudfokus. Nästa position HUV-06.

## Obligatorisk avbockning – vid VARJE `jobb lage`

**GÅ IGENOM ÖPPNA PUNKTER OCH KRYSSA AV ALLT SOM REDAN ÄR FÄRDIGT.** Detta gäller oavsett om arbetet utfördes nu eller under ett tidigare pass. Kontrollera befintlig implementation mot uppgiftens acceptansvillkor **innan** nästa arbete väljs och kontrollera igen **efter** passet. När en uppgift är helt genomförd och tillräckligt verifierad: **ta bort dess `[ ]`-rad från den aktiva arbetskön, lägg en `[x]`-rad i [COMPLETED_TASKS.md](docs/COMPLETED_TASKS.md) och uppdatera antalen i båda filerna**. Behåll inte genomförda uppgifter i listan över kvarvarande arbete. Låt inte färdiga punkter ligga kvar öppna av slentrian. Verifiering ska vara relevant och proportionerlig; ett omfattande CI-pass eller fysisk Safari behövs inte automatiskt för varje isolerad uppgift, men om uppgiften kräver sådan kontroll får den inte påstås vara slutförd utan den. Om en del återstår: behåll `[ ]` och ange konkret **vad** som saknas i stället för att bara skriva ”verifiering återstår”. Skilj separata framtida grafikförbättringar från redan färdiga funktionskrav, utan att förbigå grafikkrav som ingår i själva uppgiften. `ROADMAP.md` är enda källa till uppgiftskryss och status.

## Snabb rutin för `jobb lage`

1. Läs [AGENTS.md](AGENTS.md) och **denna korta kö**. Välj nästa genomförbara **annan** uppgift enligt rotationsfälten ovan; respektera beroenden och blockerande fel. Välj aldrig samma huvuduppgift två pass i följd.
2. Läs **bara den valda uppgiftens avsnitt** i [TASK_DETAILS.md](docs/TASK_DETAILS.md) (vid behov genom textsökning/radintervall), sedan relevant kod. Gemensamma, detaljerade krav finns i [GAME_RULES.md](docs/GAME_RULES.md); läs relevanta delar när arbetet berör dem.
3. Ägna huvuddelen av passet åt faktiska spelförbättringar, med proportionerliga kontroller. Committa, pusha och publicera enligt stående fullmakt. Markera `[x]` först efter relevant verifiering.
4. Uppdatera **endast återstående del** på uppgiftsraden i denna roadmap; flytta helt färdiga uppgifter till [COMPLETED_TASKS.md](docs/COMPLETED_TASKS.md). Skriv utfört arbete och verifieringsnivå i [WORKLOG.md](docs/WORKLOG.md), **aldrig som växande historik på checklistans rad**. Läs inte hela arbetsloggen inför varje pass; sök där bara vid behov.

**OBLIGATORISKT FÖR VARJE UPPGIFT:** All ny och ändrad synlig grafik ska vara originalgjord **16-BITARS SUPER NINTENDO-PIXELKONST MED SAMMA PIXELSKALA, SKÄRPA, DETALJRIKEDOM, FÄRGSTIL, PROPORTIONER OCH TYDLIGA ANSIKTSDRAG/HÅR SOM HUVUDKARTAN OCH LAGES SPRITE**. Inga avvikande grovpixliga platshållare. Samma krav gäller även redan avbockade funktioner när grafiken berörs. Se [GAME_RULES.md](docs/GAME_RULES.md). Detta krav gäller även om den korta grafikmärkningen nedan utelämnas vid framtida redigering.

## Stående högsta bildprioritet – varje `jobb lage` (20 november 2026)

**BILDSPRITES FÖRE NYA KODRITADE PERSONER:** Identifiera vid varje pass minst en figur eller bakgrundsperson som inte använder riktig bildsprite. Prioritera bildgenerering av en originalgjord figur i huvudkartans/Lages detaljerade 16-bitars-SNES-stil, följt av faktiskt byte från kodritad platshållare till inläst sprite. Omfattar huvudkartans NPC:er och andra personer, Hackelhallens fotbollsspel (Maja, åskådare/bakgrundspersoner), rutschkanans förskolebarn/bakgrundspersoner och andra minispel. Anpassa vinkel, storlek, perspektiv och animation; bevara Lages befintliga bra sprite. Verifiera att filerna används och fungerar på mobil/dator innan någon del kryssas av. Dokumentera vad som är bildbaserat respektive fortfarande kodritat; markera blockerad bildgenerering ärligt om verktyget saknas. **Samma huvuduppgift får fortfarande inte väljas i två på varandra följande pass.** Integrera detta som stående delmoment inom den roterande uppgiften, särskilt GRAF-01/SPORT-01, inte som skäl att ensidigt fastna i en enda scen.

## Kvar att göra – aktiv arbetskö (14)

**Översikt 21 november 2026:** 14 öppna uppgifter, 30 tidigare avbockade i [färdigarkivet](docs/COMPLETED_TASKS.md) och 1 ständig kvalitetsregel (MINI-01). **Endast ofärdiga delar står nedan.** Utförda delmoment och tidigare rapporter finns i [arbetsloggen](docs/WORKLOG.md), [uppgiftskraven](docs/TASK_DETAILS.md) och Git-historiken. Lägg **aldrig** till långa historiska uppdateringar på dessa rader.

### Aktivt genomförande och kontroll (10)

- [ ] **GRAF-01 – Enhetlig grafik i alla scener.** · [Krav](docs/TASK_DETAILS.md#graf-01) · **Kvar:** Kontrollera Oliver och Saga i korrigerad 32×48-originalskala på mobil/dator; granska ICA-kunden, återstående kodritade reservpersoner och Majas pizzeriasprite samt ansikten och detaljnivå mellan scener.
- [ ] **SPORT-01 – Fotboll med Maja i Hackelhallen.** · [Krav](docs/TASK_DETAILS.md#sport-01) · **Kvar:** Genomspela en hel match: rörelse, skott, räddningar, mål och återgång med både mobilkontroller och tangentbord; rätta eventuella faktiska fel och grafikavvikelser.
- [ ] **DRAKE-02 – Farlig drake och helikopterträffar.** · [Krav](docs/TASK_DETAILS.md#drake-02) · **Kvar:** Genomspela drakkontakt, eldklot mot Lage/helikopter, skadepaus, avståndsgränsen före macken och att både attacker och helikopterns skadereaktion pausas vid karta, butik, väska och minispel.
- [ ] **MYNT-03 – Minispelsmynt i gemensam plånbok.** · [Krav](docs/TASK_DETAILS.md#mynt-03) · **Kvar:** Återupptagsuppdatering av saldo och öppna butiker är implementerad; genomspela båt, dykning, rutschkana och fotboll med återgång, omladdning och omspelning; kontrollera köp, flerflikssynkronisering, inga dubbla bonusar och nollställning vid förlust.
- [ ] **HUV-05 – Förlora alla mynt när sista hjärtat tar slut.** · [Krav](docs/TASK_DETAILS.md#huv-05) · **Kvar:** Genomspela förlust från drake, bajskorv och båt; kontrollera nollsaldo efter omladdning samt att både aktiva och vilande andra flikar startar om (även på iPhone/Safari).
- [ ] **HUV-06 – Tydligare bajskorvar utan större sprite.** · [Krav](docs/TASK_DETAILS.md#huv-06) · **Kvar:** Bildgranska den förstärkta varningskontrasten mot ljus väg och mörkt gräs i mobil och dator samt spela igenom träff för att kontrollera oförändrad skadeyta.
- [ ] **KARTA-02 – Bredare gångbara vägar och åtkomst.** · [Krav](docs/TASK_DETAILS.md#karta-02) · **Kvar:** Genomspela smala vägar, entréer och Åsundabadet med mobil/tangentbord; kontrollera att vägkantstoleransen hjälper och att destinationer bakom hus, sten och vatten inte felaktigt markeras nådda.
- [ ] **FORDON-02 – Samstämmiga bil- och båtvyer.** · [Krav](docs/TASK_DETAILS.md#fordon-02) · **Kvar:** Bildgranska bilens åtta vyer i ny native 80×60-skala, jämför tak, proportioner och detaljnivå med sidovyn samt båtens åtta riktningar; prova i mobilvy och korrigera upptäckta skillnader.
- [ ] **LJUD-02 – Fungerande ljud på iPhone/Safari.** · [Krav](docs/TASK_DETAILS.md#ljud-02) · **Kvar:** Testa i verklig iPhone/Safari att dubbla återkomsthändelser inte avbryter ljud, att nästa spelgest återstartar en saknad scen samt att på-signal, musik, effekter och tal fungerar vid av/på, app-/flikbyte och scenbyte.
- [ ] **LJUD-03 – Fler och välavvägda händelseljud.** · [Krav](docs/TASK_DETAILS.md#ljud-03) · **Kvar:** Provlyssna nya nekad-köp-signalen i pizzeria, ICA och bensinmack tillsammans med pruttljud, båtens bränslestopp (`boatOutOfFuel`) och övriga effekter; balansera volym och åtgärda faktiska tysta händelser.

### Pausat eller väntar på underlag (3)

- [ ] **GRAF-02 – Trollminispelets grafiska enhetlighet.** · [Krav](docs/TASK_DETAILS.md#graf-02) · **Pausat som huvudfokus enligt rotationsinstruktionen. Kvar:** Jämför befintliga Lage-/troll-/skogssprites i faktiskt spel med huvudkartans 16-bitarsnivå; rätta kvarvarande skillnader utan att ändra fungerande kastmekanik.
- [ ] **BRÄNSLE-02 – Verifierat dagspris på Ingo-skylten.** · [Krav](docs/TASK_DETAILS.md#bränsle-02) · **Blockerat:** Saknar verifierbart stationsspecifikt dagspris och pålitlig uppdateringsmetod. Visa inte regionala snitt som lokalt pris och ändra inte speltaxan på gissning.
- [ ] **LJUD-04 – Bättre pruttljud.** · [Krav](docs/TASK_DETAILS.md#ljud-04) · **Kvar:** Den nya syntetiska effekten finns i kod, men faktiskt hörselprov och kontroll av volymbalans krävs för att bedöma om ljudet uppfyller önskemålet.

### Långsiktigt efter övriga uppgifter (1)

- [ ] **KARTA-01 – Utöka den sammanhängande Rimforsakartan.** · [Krav](docs/TASK_DETAILS.md#karta-01) · **Kvar:** Bygg vidare med geografiskt förankrade, sammanhängande områden, vägar, kollisioner och minikarta. Den existerande Brokindsutflykten räknas som ett delmoment, inte en färdig utbyggd värld.

## Stående regel – inte en ofärdig uppgift

**MINI-01:** Alla nya eller ändrade minispel ska följa [kraven](docs/TASK_DETAILS.md#mini-01) och huvudkartans SNES-grafik. Detta är en **återkommande kvalitetsregel**, inte en uppgift som väntar på att bli avbockad eller ska väljas som självständigt `jobb lage`-pass.

## Färdiga uppgifter – flyttade ur att-göra-listan

**30 tidigare färdigmarkerade uppgifter** finns i [COMPLETED_TASKS.md](docs/COMPLETED_TASKS.md). De ska **inte** återkomma i den aktiva kön såvida ett saknat acceptansvillkor påvisas. Alla 30 task-ID:n är borttagna från denna aktiva lista, men kraven finns kvar som referens i `TASK_DETAILS.md`.

## Dokumentation och principer

- [TASK_DETAILS.md](docs/TASK_DETAILS.md) – fullständig beskrivning och acceptansvillkor för samtliga 45 uppgifts-ID:n (inklusive stående MINI-01), utan parallella statuskryssrutor.
- [GAME_RULES.md](docs/GAME_RULES.md) – bindande grafik-/minispelsregler och gemensamma tekniska hänsyn.
- [COMPLETED_TASKS.md](docs/COMPLETED_TASKS.md) – separat historik över 30 avbockade uppgifter.
- [WORKLOG.md](docs/WORKLOG.md) – hela tidigare arbetsloggen och historiska statusnoteringar. Läs **bara vid behov**.
- `AGENTS.md` i denna mapp och repo-roten – kortkommando, befogenheter och arbetsmetod.

**Långsiktigt:** `KARTA-01` är lågprioriterad tills övriga konkreta uppgifter är klara och är därefter återkommande världsexpansion. `MINI-01` är en stående kvalitetsregel och ligger därför inte bland de 14 öppna uppgifterna.
