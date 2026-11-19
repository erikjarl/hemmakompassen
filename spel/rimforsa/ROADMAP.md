# Lage i Rimforsa – aktiv arbetskö

**Projekt:** `erikjarl/hemmakompassen` · **Spel:** `spel/rimforsa/index.html`  
**Publicerad adress:** https://erikjarl.github.io/hemmakompassen/spel/rimforsa/  
**Omstrukturerad:** 2026-11-19 · **Källa för uppgiftsstatus och arbetsordning:** denna fil.

## Obligatorisk rotation mellan utvecklingspass

**SENAST BEARBETAD HUVUDUPPGIFT: `FORDON-02` – åtta riktningsvyer för motorbåten (19 november 2026).**

**NÄSTA ROTATIONSPOSITION: `BRÄNSLE-02` – uppföljning av verifierbar lokal prisdata; hoppa vidare till `LJUD-02` eller annan genomförbar öppen uppgift om verifierad datakälla saknas.**

**ALDRIG SAMMA HUVUDUPPGIFT TVÅ `JOBB LAGE` I FÖLJD.** Följ ordningen bland öppna, genomförbara uppgifter nedan med cirkulär rotation. Starta på angiven nästa position, hoppa över avbockade punkter, stående kvalitetsregler som `MINI-01` (dessa gäller ändå varje pass) och tillfälligt blockerade uppgifter. Bearbeta olika delar av spelet mellan varven: grafik, fordon, bränsle, ljud och andra spelmekaniker. Om inget praktiskt kan göras på nästa punkt, gå vidare till följande **annan** uppgift; återvänd först efter andra utvecklingspass. Prioritet betyder vikt inom rotationen, **inte** rätt att välja samma uppgift igen direkt. När ett pass med faktisk spelutveckling slutförts, uppdatera **båda fälten ovan** till den verkliga huvuduppgiften och efterföljande öppna rotationsposition innan passet avslutas. Rapportera vilka fält som ändrades. Att kontrollera kryssrutor eller åtgärda ett akut blockerande fel räknas inte som att byta huvuduppgift. **Nästa `jobb lage` ska gå vidare från `FORDON-02` till `BRÄNSLE-02` eller nästa genomförbara öppna uppgift enligt rotationen, inte upprepa fordonsgrafiken direkt. `LJUD-02` förblir öppet tills faktisk Safari-mobiltestning kan utföras.**

## Obligatorisk avbockning – vid VARJE `jobb lage`

**GÅ IGENOM ÖPPNA PUNKTER OCH KRYSSA AV ALLT SOM REDAN ÄR FÄRDIGT.** Detta gäller oavsett om arbetet utfördes nu eller under ett tidigare pass. Kontrollera befintlig implementation mot uppgiftens acceptansvillkor **innan** nästa arbete väljs och kontrollera igen **efter** passet. När en uppgift är helt genomförd och tillräckligt verifierad: byt `[ ]` till `[x]`, flytta raden till **Tidigare avbockade uppgifter** och uppdatera antalen i rubrikerna. Låt inte färdiga punkter ligga kvar öppna av slentrian. Verifiering ska vara relevant och proportionerlig; ett omfattande CI-pass eller fysisk Safari behövs inte automatiskt för varje isolerad uppgift, men om uppgiften kräver sådan kontroll får den inte påstås vara slutförd utan den. Om en del återstår: behåll `[ ]` och ange konkret **vad** som saknas i stället för att bara skriva ”verifiering återstår”. Skilj separata framtida grafikförbättringar från redan färdiga funktionskrav, utan att förbigå grafikkrav som ingår i själva uppgiften. `ROADMAP.md` är enda källa till uppgiftskryss och status.

## Snabb rutin för `jobb lage`

1. Läs [AGENTS.md](AGENTS.md) och **denna korta kö**. Välj nästa genomförbara **annan** uppgift enligt rotationsfälten ovan; respektera beroenden och blockerande fel. Välj aldrig samma huvuduppgift två pass i följd.
2. Läs **bara den valda uppgiftens avsnitt** i [TASK_DETAILS.md](docs/TASK_DETAILS.md) (vid behov genom textsökning/radintervall), sedan relevant kod. Gemensamma, detaljerade krav finns i [GAME_RULES.md](docs/GAME_RULES.md); läs relevanta delar när arbetet berör dem.
3. Ägna huvuddelen av passet åt faktiska spelförbättringar, med proportionerliga kontroller. Committa, pusha och publicera enligt stående fullmakt. Markera `[x]` först efter relevant verifiering.
4. Uppdatera **status endast i denna roadmap** och skriv ett kort, sakligt resultat i [WORKLOG.md](docs/WORKLOG.md). **Läs inte hela historiken inför varje pass**; sök där endast om tidigare beslut eller verifiering behöver kontrolleras.

**OBLIGATORISKT FÖR VARJE UPPGIFT:** All ny och ändrad synlig grafik ska vara originalgjord **16-BITARS SUPER NINTENDO-PIXELKONST MED SAMMA PIXELSKALA, SKÄRPA, DETALJRIKEDOM, FÄRGSTIL, PROPORTIONER OCH TYDLIGA ANSIKTSDRAG/HÅR SOM HUVUDKARTAN OCH LAGES SPRITE**. Inga avvikande grovpixliga platshållare. Samma krav gäller även redan avbockade funktioner när grafiken berörs. Se [GAME_RULES.md](docs/GAME_RULES.md). Detta krav gäller även om den korta grafikmärkningen nedan utelämnas vid framtida redigering.

## Öppna uppgifter – arbetskö (15)

- [ ] **GRAF-02 – Prioritet hög: Bygg om trollminispelets grafik.** · [Detaljer](docs/TASK_DETAILS.md#graf-02) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.** _Pågående: gemensamma trollspriten, skog, vegetation och träffanimation finns. 19 nov: Lage visas nu med huvudkartans ansikte och hår framifrån, en pixelerad kaströrelse tillkommer och trollets blink-/träffeffekter riktas mot rätt ögonposition. Kodgranskat; faktisk visuell genomspelning på mobil och dator återstår, därför fortsatt öppen._
- [ ] **GRAF-01 – Prioritet hög: Harmonisering av alla scener.** · [Detaljer](docs/TASK_DETAILS.md#graf-01) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.** _19 nov: rutschkanans Lage-figur använder originalspriten. Dykminispelet har skogskant, strand, ljusstråk, sjöbottenväxter, småfisk och mer detaljerade hajsprites. Nu har även rutschkanans bakgrund fått flera skogslager, skuggade trädkronor, pixelritat förskolestaket, gräs och sand runt landningszonen. Minispel och huvudsida har genomgått syntaxkontroll; andra scener samt faktisk visuell granskning på mobil och dator återstår. Fortsatt öppen._
- [ ] **MINI-01 – Stående kontroll av framtida minispel.** · [Detaljer](docs/TASK_DETAILS.md#mini-01) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.**
- [ ] **SPORT-01 – Hackelhallen: fotbollsminispel med Maja.** · [Detaljer](docs/TASK_DETAILS.md#sport-01) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.** _Spelbar detaljerad fotbollshall med Maja, mobilstyrning, mål/poäng och återgång till huvudkartan._
- [ ] **DRAKE-02 – Draken längst till vänster: farlig vid beröring, skjuter eldklot.** · [Detaljer](docs/TASK_DETAILS.md#drake-02) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.** _Draken ska vara i skogen längst ut till vänster, ta hjärtan vid kontakt och skjuta eldklot mot både Lage och helikoptern._
- [ ] **MYNT-03 – Mynt som samlas i minispel följer med till huvudkartan.** · [Detaljer](docs/TASK_DETAILS.md#mynt-03) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.** _Minispelsmynt läggs i och sparas i gemensamma plånboken utan dubbelräkning._
- [ ] **HUV-05 – Bugg: alla insamlade mynt försvinner när sista hjärtat förloras.** · [Detaljer](docs/TASK_DETAILS.md#huv-05) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.** _Återöppnad efter användarrapport 19 nov; tidigare avbockad men mynt försvinner inte som avsett. Återställ även sparad myntstatus._
- [ ] **HUV-06 – Bajskorvarna ska synas tydligare men inte vara större.** · [Detaljer](docs/TASK_DETAILS.md#huv-06) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.** _Förbättra kontrast, form och skuggning inom samma spriteyta. Behåll placering och kollision._
- [ ] **KARTA-02 – Gör vägarnas gångbara yta bredare, utan grafisk förändring.** · [Detaljer](docs/TASK_DETAILS.md#karta-02) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.** _Öka den osynliga gångbara ytan vid vägar/stigar, men gå fortfarande inte genom hus, stenar eller vatten._
- [ ] **FORDON-02 – Riktningsanpassad grafik för bil och båt.** · [Detaljer](docs/TASK_DETAILS.md#fordon-02) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.** _19 nov: bilens fyra kardinala och fyra diagonala vyer finns, men användaren har rapporterat att bilens fram-/bakvyer inte ser ut som samma modell som sidovyn. Nytt: `boat-direction-art.js` genererar åtta särskilda pixelytor för båtens riktningar med samma skrov, vindruta, motor och Lage; dessa används nu av båtminispelet, med gamla spriten som fallback. Både modul och huvudscript klarar syntaxkontroll. Kvar: faktiskt visuell genomspelning på mobil och dator, bedömning av båtens samtliga vinklar samt korrigering av bilens varierande utseende._
- [ ] **BRÄNSLE-02 – Aktuellt Ingo-pris på skylt.** · [Detaljer](docs/TASK_DETAILS.md#bränsle-02) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.** _19 nov: källkontroll hos INGO visar att lokalt verifierbart dagspris för Rimforsa inte publiceras öppet. Pixelritad skylt i huvudkartan och macken visar därför PRIS OKÄNT; dialogen länkar till stationens officiella sida och förklarar att 2 spelmynt är ett fiktivt, fristående pris. Kvar: tillförlitlig verifierad lokal dagspriskälla samt uppdateringsmekanism och korrekt koppling till tankkostnaden; får inte avbockas utan detta._
- [ ] **LJUD-02 – Åtgärda ljud i Safari på mobil.** · [Detaljer](docs/TASK_DETAILS.md#ljud-02) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.** _Återrapporterat 19 nov: ljudet fungerar inte helt i mobilvyn. Felsök upprepad tystnad, ljudknapp, scenbyte och återupptagning; kontroll i riktig mobil krävs före avbockning._
- [ ] **LJUD-03 – Fler effekter för spelhändelser.** · [Detaljer](docs/TASK_DETAILS.md#ljud-03) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.** _19 nov: originalsyntetiserade ljudeffekter för rutschkans avstamp, landning och hajkollision har kopplats till respektive spelhändelse. Kodgranskat men ljuden är ännu inte avlyssnade i riktig webbläsare och fler händelser kan få egna ljud; kvarstår öppen._
- [ ] **LJUD-04 – Pruttigare bajsljud.** · [Detaljer](docs/TASK_DETAILS.md#ljud-04) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.** _19 nov: den befintliga syntetiska prutteffekten har fått oregelbunden puls, fallande bas och ett extra filtrerat luftbruslager i ljudmotorn; befintlig spelhändelse anropar redan `poop()`. Kodgranskad integration, men faktiskt hörselprov och volymbalans i webbläsare återstår. Lämnas öppen tills detta kontrollerats._
- [ ] **KARTA-01 – Utöka Rimforsakartan till mer av Kindabygden.** · [Detaljer](docs/TASK_DETAILS.md#karta-01) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.** _19 nov: ny spelbar, pixelritad utflyktsregion `brokind-trail.js` öppnas från den stora kartan och återvänder till oförändrad Rimforsakarta. Den har styrning för mobil/tangentbord, stenar/vatten som hinder, Lages originalsprite och tre samlarbara vägskyltar i separat utflykt (inga ändringar av huvudkartans mynt/sparning). Brokind ligger norr om Rimforsa enligt kommunal planering och kartunderlag; själva stigen och föremålsplacering är **fri speltolkning, inte skalenlig geografisk återgivning**. Källor: Kinda kommuns översiktsplan (kinda.se, antagandeversion 2024), Länsstyrelsen Östergötlands sida om Brokinds naturreservat och OpenStreetMap-baserad ruttinformation. JavaScript-syntax i huvudfil och modul kontrollerad, faktisk spelning, mobilutseende och Pages-servering ej verifierade. Kvar: en faktiskt sömlöst utökad sammanhängande huvudkarta med förankrade vägar, skalbara kollisioner, minikarta och förvaringskompatibilitet; kartuppgiften förblir långsiktigt öppen._

## Tidigare avbockade uppgifter (30)

- [x] **LJUD-01 – Läs upp karaktärernas repliker.** · [Detaljer](docs/TASK_DETAILS.md#ljud-01) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.** _Källkodsverifierad integration: dialogen visas alltid i text; användarens samtalsklick anropar speechSynthesis via ljudmotorn, enbart med ljudknappen på; avstängning, flikdöljning och miljöbyte stoppar talet. 19 nov: individuella talprofiler och sänkt bakgrundsmusik under repliker. Fysisk ljudtest i mobil/Safari ingår separat i LJUD-02._

- [x] **BRÄNSLE-01 – Tankmätare, bensinförbrukning och inköp.** · [Detaljer](docs/TASK_DETAILS.md#bränsle-01) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.** _Verifierad kod: båda tankar börjar tomma utan tidigare sparning, sparas var för sig, förbrukar bränsle vid förflyttning, fylls med spelmynt på macken; bil spärrad och båt bogseras vid tom tank. 19 nov tydligare HUD-mätare, lågvarningar och hjälp vid tom tank. Fysisk webbläsartestning ej utförd._

- [x] **BUTIK-01 – Prioritet hög: ICA som riktigt inomhusminispel.** · [Detaljer](docs/TASK_DETAILS.md#butik-01) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.**
- [x] **BUTIK-02 – Prioritet hög: Pizzerian som riktigt inomhusminispel.** · [Detaljer](docs/TASK_DETAILS.md#butik-02) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.**
- [x] **FÖR-02 – Andra barn.** · [Detaljer](docs/TASK_DETAILS.md#för-02) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.**
- [x] **FÖR-03 – Utomhusljud.** · [Detaljer](docs/TASK_DETAILS.md#för-03) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.**
- [x] **BAD-01 – Simning och dykning.** · [Detaljer](docs/TASK_DETAILS.md#bad-01) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.**
- [x] **BAD-02 – Hajar.** · [Detaljer](docs/TASK_DETAILS.md#bad-02) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.**
- [x] **BAD-03 – Vågskvalp.** · [Detaljer](docs/TASK_DETAILS.md#bad-03) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.**

Den 19 november 2026 avbockades sju äldre öppna uppgifter efter kodgranskning av butiksscener, interaktionshantering, förskolebarn, ljudmotor och badspel. Det är **verifierad implementation i källkod**, inte ett genomspelningstest i fysisk mobil. Separata grafik-/UX-förbättringar i GRAF-01 fortsätter. Övriga kryss kommer från tidigare roadmap. Flytta tillbaka en punkt till öppna om dess verkliga acceptansvillkor visar sig ofullständiga.

- [x] **NPC-02 – Unika utseenden för Oliver och Saga.** · [Detaljer](docs/TASK_DETAILS.md#npc-02) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.**
- [x] **INV-02 – Tydligare bilder av föremål.** · [Detaljer](docs/TASK_DETAILS.md#inv-02) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.**
- [x] **ODLING-01 – Odla potatis på ett av fälten.** · [Detaljer](docs/TASK_DETAILS.md#odling-01) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.**
- [x] **ODLING-02 – Sälj potatis till ICA-handlaren.** · [Detaljer](docs/TASK_DETAILS.md#odling-02) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.**
- [x] **BÅT-01 – Vattenambience.** · [Detaljer](docs/TASK_DETAILS.md#båt-01) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.**
- [x] **BÅT-02 – Motorljud.** · [Detaljer](docs/TASK_DETAILS.md#båt-02) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.**
- [x] **HUV-01 – Myntljud.** · [Detaljer](docs/TASK_DETAILS.md#huv-01) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.**
- [x] **HUV-02 – Musik.** · [Detaljer](docs/TASK_DETAILS.md#huv-02) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.**
- [x] **HUV-03 – Vit bil vid hemmet.** · [Detaljer](docs/TASK_DETAILS.md#huv-03) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.**
- [x] **HUV-04 – Bajskorvar.** · [Detaljer](docs/TASK_DETAILS.md#huv-04) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.**
- [x] **BIL-01 – Finare vit bil.** · [Detaljer](docs/TASK_DETAILS.md#bil-01) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.**
- [x] **MYNT-01 – Fler mynt på kartan.** · [Detaljer](docs/TASK_DETAILS.md#mynt-01) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.**
- [x] **MYNT-02 – Grattis när alla mynt hittats.** · [Detaljer](docs/TASK_DETAILS.md#mynt-02) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.**
- [x] **NPC-01 – Vandrande karaktärer och samtal.** · [Detaljer](docs/TASK_DETAILS.md#npc-01) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.**
- [x] **INV-01 – Föremål och väska.** · [Detaljer](docs/TASK_DETAILS.md#inv-01) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.**
- [x] **DRAKE-01 – Drake i skogen.** · [Detaljer](docs/TASK_DETAILS.md#drake-01) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.**
- [x] **TROLL-01 – Placering och interaktion.** · [Detaljer](docs/TASK_DETAILS.md#troll-01) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.**
- [x] **TROLL-02 – Bajskastnings-minispel.** · [Detaljer](docs/TASK_DETAILS.md#troll-02) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.**
- [x] **ICA-01 – Glassköp.** · [Detaljer](docs/TASK_DETAILS.md#ica-01) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.**
- [x] **PIZ-01 – Pizza.** · [Detaljer](docs/TASK_DETAILS.md#piz-01) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.**
- [x] **FÖR-01 – Rutschkana.** · [Detaljer](docs/TASK_DETAILS.md#för-01) · **16-BITARS SNES: MATCHA HUVUDKARTAN OCH LAGES ANSIKTE/HÅR.**

## Dokumentation och principer

- [TASK_DETAILS.md](docs/TASK_DETAILS.md) – fullständig beskrivning och acceptansvillkor för samtliga 40 uppgifter, utan parallella statuskryssrutor.
- [GAME_RULES.md](docs/GAME_RULES.md) – bindande grafik-/minispelsregler och gemensamma tekniska hänsyn.
- [WORKLOG.md](docs/WORKLOG.md) – hela tidigare arbetsloggen och historiska statusnoteringar. Läs **bara vid behov**.
- `AGENTS.md` i denna mapp och repo-roten – kortkommando, befogenheter och arbetsmetod.

**Långsiktigt:** `KARTA-01` är lågprioriterad tills övriga konkreta uppgifter är klara och är därefter återkommande världsexpansion. `MINI-01` är en stående kvalitetssäkring som ska tillämpas när minispel skapas/ändras, inte ett självständigt pass med enbart tester.
