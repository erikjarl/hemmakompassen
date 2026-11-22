# Lage i Rimforsa – historisk arbetslogg
### 2026-11-22 – Jobb lage / LJUD-03
- `index.html`: befintlig, kort nekad-köp-signal används nu även när pizzan/glassen redan ägs och när `bag.addPurchase` misslyckas. Gäller både klick på själva butiksscenen och direkta köpknappar; ett enskilt försök ger bara en signal i den aktuella hanteraren.
- Kodändring sparad i GitHub-commit `aeb0836f`. Kontroll av befintliga ljudanrop och avgränsad källkod gjord; ingen faktisk provlyssning på mobil/dator eller volymbalansering. LJUD-03 hålls öppen.
- Stående spriteprioritet: ingen ny bildsprite integrerades. Kvarvarande kodritade reservpersoner återstår inom GRAF-01.
- Rotation LJUD-03 → GRAF-01.

### 2026-11-22 – Jobb lage / LJUD-02
- `audio.js`: när Safari rapporterar `suspended`/`interrupted`/`closed` via WebAudio-statechange avbryts nu också pågående talsyntes och musikvolymen återställs. Nytt tal startar bara om AudioContext är `running`. Ljudupplåsning sker fortfarande endast efter användargest.
- `index.html`: ljudskriptets cacheversion ändrad från 39 till 40 så ny kod laddas vid nästa besök.
- GitHub-kodcommits `5027ec25`, `b93f7d27`. Kodens förutsättningar granskade, men varken faktisk iPhone/Safari, hörselprov eller scenövergångar har provspelats. LJUD-02 förblir öppen.
- Stående spriteprioritet: ingen ny bildsprite integrerad; kvarvarande kodritade reservpersoner finns i GRAF-01.
- Rotation LJUD-02 → LJUD-03.

### 2026-11-22 – Jobb lage / FORDON-02
- `car.js`: bilens fallback-sidobild i 88×55 ritas i oförändrad källpixelskala (tidigare 90×56). Även felaktig kommentar om kupéns 96×72-pixelskala rättad till riktningsbildens faktiska 80×60. Huvudarket med åtta bildriktningar och bilens styrning/kollision är oförändrade.
- Kodändring committad (`2980247d`); källkod och befintlig båtriktning granskade. Ingen visuell sida-vid-sida-granskning av bilens åtta riktningar, båtvyer eller mobilskärm; FORDON-02 hålls öppen.
- Stående spriteprioritet inventerad: fotbollsspelets åskådare har bildsprites, men kodritade reservpersoner återstår i andra scener. Ingen ny bildsprite skapad/integrerad i detta pass.
- Rotation FORDON-02 → LJUD-02.

### 2026-11-22 – Jobb lage / KARTA-02
- `index.html`: ny `walkableEndpoint` letar efter närliggande rutnätsceller vars hela sista väg till spelarens pekklick är gångbar. `pathTo` använder denna slutcell i stället för att välja närmaste rutcell även bakom hus, sten eller vatten. Originalmask, väggkollisioner och kartbild är oförändrade.
- Kodändring committad (`4d94f915`) och ankare kontrollerade vid uppdatering. Ingen faktisk genomspelning i mobil/dator av entréer, smala vägar eller Åsundabadet. KARTA-02 lämnas öppen.
- Stående bildprioritet: inga nya bildsprites skapade eller integrerade under detta navigationspass; kodritade reservpersoner återstår i GRAF-01.
- Rotation KARTA-02 → FORDON-02.

### 2026-11-22 – Jobb lage / HUV-06
- `index.html`: fast mörk kontur i bajskorvens övre och nedre silhuett och tydligare permanenta varma högdagrar; alla ändringar inom samma 23×26-pixelområde. Ingen ändring i `checkPoops`, dess 19-pixelträffradie eller hjärtförlust.
- Källkodens placering och avgränsade ändring kontrollerade; commit `b422097f`. Ingen visuell webbläsargranskning av gräs och väg på mobil/dator eller spelgenomgång; HUV-06 behålls öppen.
- Stående spriteprioritet: kvarvarande kodritade personer behöver fortfarande bildsprites; ingen ny personbild skapad eller integrerad under detta pass.
- Rotation HUV-06 → KARTA-02.

### 2026-11-22 – Jobb lage / HUV-05
- `index.html`: förlust- och myntsynkronisering kontrolleras nu även vid `window.focus`. Redan synliga spelfönster som återfår fokus kan upptäcka nollställning efter förlust i en annan flik, även utan `pageshow` eller `visibilitychange`.
- Befintlig funktion kontrollerad i källkod: förlust från drake, bajskorv och båt går till `restartAfterGameOver`; nollställning försöker rensa minispels-/odlingsmynt och signalerar andra flikar efter verifierad lagring. Ny kod committad (`2b7b2437`). Ingen verklig genomspelning, flerflikstest eller Safari-test; HUV-05 lämnas därför öppen.
- Stående sprites: ingen ny bildsprite genererad eller integrerad i detta pass; kvarvarande kodritade reservpersoner finns fortsatt under GRAF-01.
- Rotation HUV-05 → HUV-06.

### 2026-11-22 – Jobb lage / MYNT-03
- `index.html`: minispelsplånbokens `award`, `spend` och `refund` rapporterar inte längre en lyckad ändring om localStorage-sparning kastar undantag; lokala tillståndet återställs vid fel. `clear` rapporterar om sparningen lyckades. Förhindrar falska besked om sparade belöningar vid blockerad lagring.
- Källkod jämförd före ändring och GitHub-commit bekräftad (`50694137`). Ingen faktisk genomspelning i mobil/Safari eller flerflikstest; MYNT-03 kvarstår öppen. Övriga öppna uppgifter kan ännu inte avbockas med tillgänglig verifiering.
- Stående grafikgranskning: fotbollsspelets åskådare använder redan bildsprites; kvarvarande kodritade figurer i övriga scener kräver separat bildgenerering och integrering, ej utförd i detta pass.
- Rotation MYNT-03 → HUV-05.

### 2026-11-22 – Jobb lage / DRAKE-02
- `dragon.js`: nära-draken-varning och faroljud aktiveras inte när Lage sitter i bilen och är skyddad från attacker. Helikopter som mål, eldklotens räckvidd och skadesystem lämnas oförändrade.
- Källkoden granskad och den isolerade ändringen committad (`4aafa49f`). Ingen verklig spelgenomgång eller mobilverifiering utförd: DRAKE-02 hålls öppen enligt kvarvarande acceptansvillkor.
- Stående spriteprioritet inventerad: draken och helikoptern är fortfarande kodritade; inga nya bildsprites genererade eller integrerade i detta pass.
- Rotation DRAKE-02 → MYNT-03.

### 2026-11-22 – Jobb lage / GRAF-01
- `npc.js`: Oliver och Saga är sedan tidigare bildbaserade genom `RimforsaFriendSprites` med källrutor 32×48. Både normal och horisontellt speglad rendering har korrigerats från utsträckt 38×48 till originalets 32×48, centrerat kring samma markposition. Kodritade reservfigurer behålls om bilden inte laddats. `index.html` uppdaterat till `npc.js?v=5`.
- Källkodskontroll av bilddimensioner och ritkoordinater. Ingen visuell webbläsargranskning av mobil/dator och ingen faktisk bildgenerering eller integration av nya sprites denna gång; GRAF-01 kvarstår öppen för resterande NPC-/butiksfigurer och visuell jämförelse.
- Rotation GRAF-01 → DRAKE-02. Kodcommits `2abfb85b`, `ecbe6770`.

### 2026-11-22 – Jobb lage / LJUD-03
- Ny originalsyntetiserad låg dubbelsignal `purchaseDenied()` i `audio.js`, endast när ljud är på och AudioContext kör. Kopplad till nekade köp på pizzerian, ICA och bensinmacken; köpfunktioner och myntdragning oförändrade.
- `index.html` laddar `audio.js?v=39`. Kodkontroll av samtliga sex felköpsgrenar och exporterad ljudfunktion genomförd. Ingen ljuduppspelning/hörseltest eller faktisk mobilgenomspelning verifierad; LJUD-03 kvarstår öppen.
- Stående spriteprioritet: inga nya originalpersonsprites bildgenererade eller integrerade under detta ljudpass. GRAF-01 har ännu öppna reservpersoner.
- Rotation LJUD-03 → GRAF-01. Kodcommits `49b7923c` och `72cf4ac6`.

### 2026-11-22 – Jobb lage / LJUD-02
- `audio.js`: `setVisible()` gör inte längre en full stop/start av ljudlooparna när `pageshow` och `visibilitychange` skickar samma synlighetsläge. Om ljudscenen trots det saknas när kontexten kör startas den igen. `status()` exponerar `sceneStarted`.
- `index.html`: befintlig användargesthantering anropar `resumeFromGesture()` också när AudioContext är `running` men scenen inte startad; scriptcache `audio.js?v=38`. Ingen automatiserad Safari-upplåsning eller bypass av användargestkrav.
- Kontroll av källkodsförekomst och anrop genomförd. Ingen körning i faktisk iPhone/Safari, inga hörselprov eller syntakstester genomförda; därför fortsatt öppen LJUD-02.
- Bildprioritet: inga nya bildbaserade personsprites skapades/integrerades i detta ljudpass, öppna GRAF-01-krav kvarstår. Rotation LJUD-02 → LJUD-03. Kodcommits `98b84a6c`, `ae7e0010`.

### 2026-11-22 – Jobb lage / FORDON-02
- Bilens riktningsbilder i `car.js` ändrade till exakt 80×60 kartpixlar från källarkets 80×60 rutor, i stället för icke-heltalig skalning till 96×72. Det undviker ojämn pixelbredd i de åtta riktningsvyerna; spelpositionens mittpunkt, körning, bränsle och vattenkollisioner har inte ändrats. Cacheversionen för `car.js` höjd i `index.html`.
- Källkodskontroll av dimensioner och renderingsanrop genomförd. Ingen faktisk visuell jämförelse i browser/mobil, och båtens åtta vyer har inte visuellt verifierats. FORDON-02 lämnas öppen.
- Spriteprioriteten kvarstår: inga nya personbilder genererade eller installerade i detta pass; öppna reservpersoner hör fortfarande till GRAF-01.
- Rotation: FORDON-02 → LJUD-02. Kodcommit `f4e2ea33`.

### 2026-11-22 – Jobb lage / KARTA-02
- Förbättrade `routeFromMap()` i `spel/rimforsa/index.html`: om `pathTo()` inte hittar någon gångbar rutt får spelaren inte längre godkänt destinationsval endast genom att vara inom 65 px från målet. Kräver nu att ett gångbart snäppmål finns inom 8 px och kan nås längs helt fri gånglinje; annars visas vägledning att välja en öppen stig. Hindermasken, vägkonsten och styrningen är oförändrade.
- Källkodskontroll av `safeTapTarget()`, `canWalkStraight()`, `pathTo()` och den nya fallback-grenen. Ingen verklig karta/entré-/Åsundabadet-genomspelning eller mobil-/tangentbordsverifiering genomfördes. KARTA-02 är därför fortsatt öppen.
- Stående grafikprioritet: inga nya personsprites genererade eller implementerade inom detta navigationspass; öppna reservpersoner kvarstår i GRAF-01.
- Rotation KARTA-02 → FORDON-02. Kodcommit `af9b3a77`.

### 2026-11-22 – Jobb lage / HUV-06
- Förstärkte varningskontrast i bajskorvarnas befintliga `drawPoops()`: orange kinder växlar färg vid närhet och två 1×1-pixlars ljusglimtar visas under den redan existerande nära-animationens ljusa fas. Samtliga tillägg ritas inom originalfiguren. Position, `scatterPoops()`, `checkPoops()`, radie <19 och hjärtmekanik har inte ändrats.
- Källkodskontroll: nya rektanglarna ligger på samma befintliga kindkoordinater; inga spelmekanikändringar. Ingen bildgranskning på riktig skärm, mobil eller genomspelning utförd. Därför förblir HUV-06 öppen.
- Bildspriteinventering: inga nya personsprites skapade eller implementerade detta pass; GRAF-01:s återstående reservpersoner ligger kvar. Rotation HUV-06 → KARTA-02. Kodcommit `44e2ac65`.

### 2026-11-22 – Jobb lage / HUV-05
- `spel/rimforsa/index.html`: sparar senaste observerade `rimforsa-loss-reset-v1` per flik, och jämför den vid `pageshow` och när fliken återkommer från dolt läge. Om game over inträffat i en annan flik laddas den gamla spelomgången om, även när ett tidigare `storage`-event missats på mobil. Vid förlust uppdateras markören i samma flik så den inte triggar egen omladdning.
- Avgränsad källkodskontroll: funktioner och anropsplatser finns i den uppdaterade filen. Ingen faktisk flerflikskörning eller iPhone/Safari-genomspelning utförd, varför HUV-05 fortfarande är öppen.
- Stående spriteinventering: inga nya bildsprites skapade eller kopplade till renderingen under detta spelmekanikpass. GRAF-01 behåller öppna reservpersoner.
- Rotation: HUV-05 → HUV-06. Kodcommit `581bce5a`.


### 2026-11-22 – Jobb lage / MYNT-03
- Implementerade `refreshSharedCoinViews()` i `spel/rimforsa/index.html`: vid `pageshow`, återgång från dold flik samt lagringshändelser synkas plånbok och potatismynt, kartans myntvisning och eventuella öppna ICA-/pizzeriavyers priser. Befintlig `payCoins`-kontroll vid köp behålls.
- Kodgranskning: uppdateringsfunktionen och de anropade butiksfunktionerna finns på main. Ingen genomspelning i mobil/Safari eller dubbel-flikstest utfördes; MYNT-03 är därför fortfarande öppen. Inga nya bildsprites genererades; återstående kodritade personer hanteras av GRAF-01.
- Rotation: MYNT-03 → HUV-05. Commit: `ef156a0a`.

### 2026-11-21 – Städning av Lages att-göra-listor (utan nytt utvecklingspass)
- Gick igenom den aktiva `ROADMAP.md` och de 45 specificerade uppgifts-ID:na. Totalt **30 redan avbockade uppgifter** flyttades ur roadmapen till `docs/COMPLETED_TASKS.md`; inga nya uppgifter markerades färdiga enbart på antaganden. **14 ofärdiga** uppgifter behölls med konkret kvarvarande arbete. `MINI-01` flyttades ur checklistan till stående kvalitetspolicy, eftersom den inte är ett avslutningsbart utvecklingsärende.
- Tog bort gamla datumstämplade implementationstexter från de aktiva checklistans rader; historiska delsteg finns kvar i denna logg och i Git-historiken. De detaljerade kraven bytte vilseledande \"Att göra\"-rubriker till \"Kravbeskrivningar\" och förklarar nu att filen inte har uppgiftsstatus. Uppdaterade `spel/rimforsa/AGENTS.md` för att förebygga att listan växer med gammal historik igen.
- Behöll senaste/nästa-rotation i `ROADMAP.md` oförändrade (LJUD-02 → LJUD-03). Inga nya spelmekaniker implementerades och ingen mobilgenomspelning genomfördes. Uppgifternas status bedömdes försiktigt utifrån kod-/uppgiftsbeskrivningar och tidigare dokumenterade verifieringsbegränsningar.


### 2026-11-21 – Jobb lage, MYNT-03 (saldo vid återgång från minispel)
- `index.html`: `closeBoatGame()` uppdaterar nu huvudkartans gemensamma mynt-HUD när spelaren lämnar båtspelet, även om spelaren lämnar i förtid. Båda ingångarna till Potatislandet uppdaterar samma HUD direkt efter minispelsscenen avslutats. Fotboll/rutschkana/dykning gjorde redan detta.
- Ändrat endast visningsuppdateringen: intjänade och sparade bonusmynt, unika bonus-ID, köpordning, sparformat och game-over-nollställning är oförändrade. Kodcommit `c0c0288`, roadmapcommit `0173b8a`.
- Kodkopplingar kontrollerade på main, men verklig båt-/odlingsgenomspelning och mobil-/datorrendering inte verifierad. MYNT-03 fortsatt öppen. Nästa rotation HUV-05.


### 2026-11-21 – Jobb lage, DRAKE-02 (helikoptern inom räckvidd)
- Granskning av `dragon.js` och `helicopter.js` visade att helikoptern vid (365,310) låg längre än 300 världspixlar från drakens patrullområde kring (115,780). Tidigare kunde därför inga skott riktas mot helikoptern, trots att ritning och träffreaktion var implementerade.
- Draken tilldelar nu skott mot helikoptern max 600 pixlar och skott mot Lage max 300 pixlar. Varningen låser fortfarande målpunkten före skott; båda skotttyperna klipps vid x=394 vid macken och spelkartans gränser. Inga ändringar av grafiken, kontaktskada eller skadepaus. Kodcommits `4efa524` och `0c39ff8`; roadmapcommit `9e92e89`.
- Källkoden verifierad på main. Ingen faktisk träff-/lyssnings-/mobil- eller desktopgenomspelning genomfördes, därför DRAKE-02 öppen. Nästa rotation MYNT-03.


### 2026-11-21 – Jobb lage, GRAF-01 (bildbaserad pizzabagare)
- Skapade en originalbildgenererad pizzabagare i SNES-inspirerad pixelstil med fyra riktningar, efterbehandlad till kompakt transparent 160×56 PNG (40×56 per riktning). Lagt upp `pizza-chef-spritesheet.png` på main via Git-blob och commit `7a6e634`.
- `pizza-scene.js` ritar nu framåtvyn med `drawImage` utan utjämning och använder den gamla kodritade figuren endast när bildresursen inte kan läsas. Bildens `onload` ritar om senaste scenen. `index.html` använder `pizza-scene.js?v=4`. Kodcommits `0e1aee4` och `aec933a`, roadmapcommit `7bbbd73`.
- Bekräftat på main att PNG-filen går att hämta och att JavaScript-filen och sidans cachekoppling är sparade. Ej verifierat i fysisk mobil/dator eller faktisk Pages, så skala och SNES-enhetlighet är inte slutbedömda. GRAF-01 fortsatt öppen; nästa rotation DRAKE-02.

- Efter granskning av den lokala spritebilden korrigerades den första för hårt beskurna exporten till fullkroppsvyer och färgkvantiserad 160×56 PNG (`9ef6e63`). Cacheversioner höjdes till chef-v2/scen-v5 (`1ae93f8`, `8392c1b`). Bilden har ännu inte kontrollerats visuellt i faktiskt spel; kanter/transparens och skalenhet behöver särskilt granskas. Roadmap uppdaterad (`411c4d9`).

### 2026-11-21 – Jobb lage, LJUD-03 (samtalssignal)
- Lade till den korta, egenkomponerade tvåtonssignalen `npcTalk()` i `audio.js` för lyckade samtal med huvudkartans NPC:er. Den används i `index.html` innan det redan befintliga upplästa talet och fungerar även utan installerad svensk talröst. Respekterar ljudknapp, dold sida och krav på aktiv WebAudio-kontext. Inga nya ljudfiler eller ändrade samtalsrepliker.
- Kodcommits `58ca730` och `c812cf7`; roadmapcommit `0ae65ae`. Källkoppling sparad på main; fysisk Safari-/mobil- eller datoravlyssning och ljudbalans har inte verifierats. LJUD-03 öppen, nästa rotation GRAF-01.


### 2026-11-21 – Jobb lage, LJUD-02 (Safari WebAudio-resume)
- `audio.js`: återställer `resumeStartedAt` till noll när det aktuella `resume()`-anropet är klart, både vid lyckat och avvisat Promise, samt vid synkront avslut/fel. Tidigare tidsstämpel kunde göra att ett senare normalt avbrott behandlades som ett 2,5-sekunders fastnat försök. Fastnade försök som faktiskt väntar skyddas fortfarande av samma tröskel och nästa användargest.
- Huvudsidan laddar nu `audio.js?v=31`. Kodcommits: `951c15a`, `677749d`. Roadmapcommit: `f68c3e3`.
- Källfilerna kontrolleras på main, men ingen fysisk iPhone-/Safari-avlyssning eller verifierad Pages-rendering. LJUD-02 fortsatt öppen. Nästa rotation: LJUD-03.


### 2026-11-21 – Jobb lage, FORDON-02 (kupéfönster i åtta riktningar)
- `car.js`: Begränsade den befintliga kodritade Lage-detaljen med `ctx.clip()` till fönsterytan för sidovy och övriga bilriktningar. Tak och kaross täcks därmed inte av förarens hår/ansikte/tröja när riktningsbilden används. Bilspritesheet, färdriktningar, fart och kollisionsregler oförändrade.
- Kodcommit `6f6444f`; roadmapcommit `656d72a`. Verifierat genom återläsning av källfilen på main, inte med faktisk Canvas-rendering, mobil/Safari eller jämförelse mellan åtta vyer. Båtens riktningsvyer återstår. FORDON-02 fortsatt öppen. Nästa rotation LJUD-02.


### 2026-11-21 – Jobb lage, KARTA-02 (gångruttens A*-sökning)
- Ändrat A*-sökningens stoppvillkor så att endast unika undersökta kartceller, inte inaktuella dubbletter i prioritetskön, räknas mot MAX. Det minskar risken för att gångrutter avbryts för tidigt på svårare kartsträckor.
- Gångmask, diagonalspärrar, hinder, vägarnas synliga grafik och styrning har inte ändrats. Ändringen är sparad på main i kodcommit `4e8bde9` och dokumenterad i roadmapcommit `4c0c120`.
- Ingen faktisk gångprovning i mobil/dator eller på GitHub Pages under detta pass. KARTA-02 hålls öppen, nästa rotation FORDON-02.


### 2026-11-21 – Jobb lage, HUV-06 (igenkännbar hinderfigur)
- Lade till två ljusa 3×3-pixelögon, mörka pupiller och en liten mundetalj i `drawPoops()`. Samtliga nya rektanglar ryms inom oförändrad spriteyta 23×26 px. Kollision, position, antal och hjärtskada är orörda.
- Kontrollerat direkt på `main` att kod och roadmap sparats (kodcommit `5bcef5e`, roadmapcommit `2aa39c8`). Ingen faktisk webbläsar-/mobilgenomspelning eller visuell jämförelse utförd; HUV-06 kvarstår öppen. Nästa rotation: KARTA-02.


- **2026-11-20 – LJUD-02 / mobil-Safari:** Ljudmotorn frigör numera avstängd eller fastnad AudioContext, inklusive schemalagda spel-loopar, och kan skapa ny motor från nästa faktiska användargest. Ljud av/på startar om ljudmotorn och sena Promise-svar från en gammal kontext ignoreras. `audio.js?v=29` samt riktat regressionstest tillagda på arbetsgren. Fysisk iPhone-lyssning, scenbyten och Pages-drift ej verifierade; LJUD-02 kvarstår öppen. Nästa rotation LJUD-03.

- **2026-11-20 – Jobb lage / KARTA-02:** Förbättrade kartans pekstyrda ruttföljning med `canWalkStraight()` i `index.html`. Ruttens mellanpunkter kan hoppas över när hela segmentet ligger inom samma giltiga gångmask, provat var 2 px och med högst 90 px genväg. Vägar, vatten, byggnader, kollisioner, manuell styrning och kartgrafik är oförändrade. Uppdaterade roadmapens rotation till FORDON-02. Filerna är sparade på `main`; verklig genomspelning vid viktiga vägpassager på mobil och dator återstår, så KARTA-02 är fortsatt öppen.

- **2026-11-20 – Jobb lage / HUV-06:** Lade till tio pixelrektanglar för tydligare ljus vänster-/överkant, mörk höger-/underkant och veck på bajskorvarnas sprite i `index.html`. Alla nytillkomna pixlar ryms inom ursprungliga 23×26 px; placering, antal, kollisionsradie och hjärtskada är oförändrade. Sparat på `main`; ingen visuell granskning mot gräs och väg i verklig mobil- eller datorwebbläsare har genomförts. Uppgiften förblir öppen; nästa KARTA-02.

- **2026-11-20 – Jobb lage / HUV-05:** Ny fokuserad förlustdialog i `index.html` visar förlorat myntantal och nollställt saldo efter sista hjärtat, och låter spelaren återuppta med en tydlig knapp. Spelstyrning pausas medan dialogen är öppen. Befintliga reset-anrop för huvudkartan, minispelsmynt och potatismynt samt bibehållen väska/skörd är oförändrade. Ändringen committad på `main`, men webbläsartest och omladdningstest återstår; därför fortsatt öppen. Nästa rotation HUV-06.

- **2026-11-20 – Jobb lage / MYNT-03:** Hackelhallens fotbollsminispel visar nu huvudkartans delade myntsaldo genom en `getWalletBalance`-callback från `index.html`, som använder befintliga `totalMoney()`. Visningen uppdateras när minispel öppnas och efter mål, utan att ändra bonus-ID, målberäkning eller myntsparande. `football-minigame.js?v=5`. Koden sparad på `main`; full webbläsargenomspelning och fysisk mobil/Safari ännu inte verifierade. MYNT-03 fortsatt öppen, nästa HUV-05.

- **2026-11-20 – Jobb lage / DRAKE-02:** Uppdaterade `dragon.js` så eldklotens kollisionskontroll mäter avstånd till hela rörelsesegmentet mellan två bildrutor i stället för enbart slutpositionen. Både spelaren och helikoptern använder samma kontroll; målet är att undvika att projektiler missar vid lägre bildfrekvens. Cacheversion höjd till `dragon.js?v=4`. Koden committad till `main` och återläst från GitHub. Faktisk spelning, visuellt test och fysisk mobil/Safari samt publicerad Pages-version inte verifierade. DRAKE-02 fortfarande öppen; nästa MYNT-03.

- **2026-11-20 – Jobb lage / GRAF-01:** Hackelhallen har fått en ny originalritad 16-bitarsinspirerad resultattavla med hallens namn, dynamisk visning av Lages mål och två dekorativa väggvimplar. `football-minigame.js` ändrades och cacheversionen höjdes till `v=4` i `index.html`. Källfilerna och rotationsfälten återlästes efter commit; ingen visuell mobil-/datorgenomspelning, full CI eller Pages-servering verifierad. Fysik, mynt och kontroller oförändrade. GRAF-01 fortsatt öppen; nästa DRAKE-02.

- **2026-11-20 – Jobb lage / LJUD-03:** Tre korta originalsyntetiserade ljud har införts för öppning av väskan (`bagOpen`), stora kartan (`mapOpen`) och start av båtäventyr (`boatLaunch`). `audio.js` och `index.html` uppdaterades, cacheversion `v=18`. Återläsning från `main` bekräftade funktionsnamn, export, händelsekopplingar och roadmaprotation; ingen fysisk avlyssning, webbläsargenomspelning eller Pages-servering verifierad. LJUD-03 öppen; nästa GRAF-01.

- **2026-11-19 – Jobb lage / SPORT-01:** LJUD-04 lämnades orörd eftersom syntetiserat ljud redan är implementerat men måste avlyssnas; KARTA-01 är långsiktigt lågprioriterad, GRAF-02 är fortsatt spärrad enligt spel-AGENTS. I stället byggdes `football-minigame.js`: spelbar pixelritad fotbollshall i Hackelhallen med huvudkartans Lage-sprite, egen pixelritad Maja som rörlig målvakt, bollfysik, skott, räddningar, mål/skottstatus, mobilknappar/WASD/pilar/mellanslag och retur till huvudkartan. Kopplades i `index.html` till Hackelhallen och huvudkartans interaktionsknapp; huvudkartan pausas under minispel. Koden i nya modulen och inline-scriptet i huvudfilen klarade JavaScript-syntaxkontroll; centrala integrationsankare kontrollerade. **Inte kontrollerat:** faktisk spelning, målbarhet, pekstyrning i riktig mobil eller Pages-servering. SPORT-01 fortfarande öppen, nästa rotation DRAKE-02.

- **2026-11-19 – Jobb lage / LJUD-03:** Skapade tre separata originalsyntetiserade ljudeffekter i `audio.js`: köpbekräftelse (`purchase`), tankning (`fuelFill`) och grundstötning i båt (`boatGrounding`). Kopplade dessa i `index.html` till lyckat köp hos ICA/pizzerian, lyckad tankning av bil/båt samt båtgrundstötning; fallback till tidigare `coin`/`hit` om den nya API:n saknas. Cacheversion `audio.js?v=13`. Kod från GitHub kunde parsas som JavaScript för båda berörda filerna, integrationsankare verifierade. Fysisk avlyssning, Safari/mobil och Pages-servering ej kontrollerade; LJUD-03 fortsatt öppen. Rotation LJUD-04.

- **2026-11-19 – Jobb lage / LJUD-02:** BRÄNSLE-02 bedömdes fortsatt blockerad: INGO:s officiella Rimforsasida och bensinpriser.nu:s länslista visar inte aktuellt verifierbart pris för Rimforsa; befintlig PRIS OKÄNT och fiktiv tankkostnad behölls. Vidare till LJUD-02 enligt rotation. `audio.js` bevakar nu WebAudio-kontextens tillstånd, startar inte scenloopar medan kontexten är pausad, och återbygger scenlooparna när den verkligen börjar köras igen. `index.html` låter aktiv touch-/tangentgest återuppta ljudet och visar ”Återuppta ljud” när ljudkontexten är pausad; cacheversion `audio.js?v=12`. Båda skripten klarade JavaScript-syntaxkontroll. **Ingen fysisk iPhone/Safari-testning eller bekräftad Pages-drift**; LJUD-02 och BRÄNSLE-02 förblir öppna. Nästa rotation LJUD-03.

- **2026-11-19 – Jobb lage / FORDON-02:** Lade till `boat-direction-art.js` med åtta cachade, originalpixelritade riktningsvyer av samma vita motorbåt (skrov, motor, vindruta, säten, Lage), och kopplade båtminispelets färdriktningsvinkel till dessa i `index.html`. Ursprunglig båtbild finns kvar som fallback. JavaScript-syntax godkänd i ny modul och inline-script; visuell körning och mobiltest ej utförda. FORDON-02 kvarstår öppen, bland annat på grund av rapporterade avvikande front-/bakvyer på bilen. Nästa rotation BRÄNSLE-02, eller följande öppna genomförbara uppgift om aktuell verifierbar lokal prisdata saknas.

- **2026-11-19 – Jobb lage / GRAF-01:** Förskolans rutschkanespel fick originalritad 16-bitarsinspirerad skogs- och förskolegårdsbakgrund med flera träd-/färglager, moln i pixelblock, trästaket, gräs, små blommor och sandig landningszon. Befintlig Lage-sprite, flygmekanik, poäng, ljud och knappar bevarades. `slide-minigame.js` och `index.html` syntaxkontrollerades, cacheversion uppdaterad till v5. Ingen faktisk visuell webbläsar- eller Safari-granskning gjord; GRAF-01 är fortsatt öppen. GRAF-02 hoppades över eftersom spel-AGENTS uttryckligen spärrar trollgrafiken som nästa uppgift. Rotation flyttades till FORDON-02.

- **2026-11-19 – Jobb lage / KARTA-01 (utflykt norrut):** Skapade `brokind-trail.js`, en separat spelbar SNES-pixelritad region som nås via knappen ”Utforska norrut mot Brokind” på den stora Rimforsakartan. Piltangenter/WASD och mobilknappar, hinder för stenar och sjö, Lage från huvudkartans spritesheet, tre egna vägskyltar att hitta samt återvänd till huvudkartan. Separat utflyktsprogress; befintliga mynt, fordonsbränsle, vattenmask och huvudsparning ändras inte. Brokinds geografiska relation norr om Rimforsa är kartförankrad, medan stigen och föremålen är fri speltolkning. Kontrollerat: JavaScript-syntax för nya modulen och indexsidans inline-script samt grundläggande källintegrationsankare. **Inte verifierat:** genomspelning i webbläsare/Safari eller faktiskt serverad Pages-version. KARTA-01 lämnas öppen: inte en sömlöst utökad huvudkarta. Rotation går vidare till GRAF-02.

- **2026-11-19 – Jobb lage / LJUD-04:** Den befintliga originalsyntetiserade `poop()`-effekten i `audio.js` har fått fallande baston med ojämna pulser och ett separat lågpassfiltrerat bruslager för luftpuffar. Ljudet är ca 0,45 s och respekterar befintlig ljudknapp/dold flik. Trollspelets kod och grafik ändrades inte. `index.html` pekar på `audio.js?v=11`. GitHub bekräftade kod- och roadmapcommits; LJUD-04 kvarstår öppen tills faktisk avlyssning/volymbedömning genomförts. Nästa huvuduppgift KARTA-01. Pages/Safari ej verifierat.

- **2026-11-19 – Jobb lage / LJUD-03:** Lade till tre nya originalsyntetiserade spelhändelseljud i `audio.js`: rutschkanans avstamp (`slideLaunch`), landning (`slideLand`) och hajkollision (`sharkBump`). Kopplade händelser i `slide-minigame.js` och `swim-minigame.js` och höjde cacheversioner i `index.html`. GitHub bekräftade ändringarna och roadmapens rotationsfält har flyttats till LJUD-04. Inte verifierat genom avlyssning, faktisk Safari/webbläsare eller GitHub Pages; LJUD-03 kvarstår öppen.

**Arkiv:** Här ligger de tidigare utvecklingsnoteringarna, med deras ursprungliga ordalydelse och eventuella dåtida verifieringsstatus. **Detta är inte en arbetskö.** Läs bara relevanta datum eller uppgifts-ID:n när du behöver historik. Arbetskön och dess status finns i [ROADMAP.md](../ROADMAP.md).

## Historisk statusrad vid uppdelningen, 19 november 2026

**Status:** ICA, pizzeria och förskolans rutschkana finns i spelet med tester. Tidigare pizzaversion är bekräftad genom godkänd Pages-publicering, resurskontroll och fullständigt UI-test. Rutschkans senaste publicering och UI-test behöver slutverifieras. Tre barn och syntetiserade förskoleljud är kodade, men slutverifiering av tester, renderingen och Pages återstår. BAD-01 har nu kodats och kopplats till kartan, men testkörning och Pages-publicering återstår; BAD-02 och BAD-03 återstår.

## Arbetslogg
- **2026-11-19 – Jobb lage / GRAF-01, BUTIK-01 och BUTIK-02 (gemensam Lage-sprite i butiker):** Tidigare ritades Lage som en enklare lokal Canvas-figur i både ICA- och pizzeriascenerna, trots kravet på konsekvent huvudkartsgrafik. Båda scenmodulerna använder nu huvudkartans original `lage-sprites.png`, 56×56-källruta utan bildutjämning, när resursen laddats. Scenen renderas om vid bildladdning; äldre enkla figuren är endast fallback om bilden saknas. Den befintliga kassapersonen/pizzabagaren, varorna, butiksinteraktionerna och myntflödet har inte ändrats. Cacheversionerna har höjts till `ica-scene.js?v=4` och `pizza-scene.js?v=3`. **Verifierat:** GitHub accepterade commits `dd0ca36`, `9476dea`, `c0b13ce`; kod i båda scenmodulerna passerade JavaScript-syntaxkontroll. **Ej verifierat:** slutlig spriteinpassning, mobil-/desktop-rendering, köpflöde i webbläsare och senaste Pages-publicering. Uppgifterna GRAF-01/BUTIK-01/BUTIK-02 hålls därför öppna för visuell granskning och ytterligare harmonisering.


- **2026-11-19 – Jobb lage / BRÄNSLE-01 (bil och båt anslutna):** Förlängde `fuel.js` med separat lokalt sparad båttank (0–100 %), bevarade bilens befintliga API och sparnyckel för kompatibilitet, och införde båtförbrukning utifrån faktisk förflyttad sträcka. Båtminispelet spärrar framdrivning med tom tank och bogserar automatiskt en båt med bensinstopp till bryggan. Bensinmackens tidigare pixelritade tankningsscen har två separata köpknappar, en för bil och en för båt, med påhittat spelpris 2 mynt per tank. Fast bränsleindikator för båda fordonen på huvudkartan och en nivå i båtens HUD. Bilens utstigning har fått kostnadsfri bärgning hem när närliggande mark inte är gångbar, så spelaren inte låses fast. `fuel.js?v=2` i HTML. **Bekräftat:** GitHub accepterade commits `6a6d10c` och `3c33768`; JavaScript-syntaxkontroller passerade. Isolerat funktionsprov bekräftade separata tomma starttankar, full tank, exakt 10 % förbrukning med vald teststräcka, fortsatt värde efter ny inläsning samt återställning av båttank. **Återstår:** riktig webbläsar-/mobilkontroll av tankning, köp och nödbärgning, spelets regressionstester, granskning av grafisk kvalitet samt verifiering av Pages-publicering. BRÄNSLE-01 är kodad för båda fordonen men hålls öppen till dessa kontroller. BRÄNSLE-02 (verifierat aktuellt pumppris) är fortfarande orörd och inga faktiska pumppriser påstås visas.


- **2026-11-19 – Jobb lage / BRÄNSLE-01 (första spelbara etappen: bil):** Implementerade ny `fuel.js` med lokalt sparad biltank som börjar på 0 %, full tank 100 %, körsträckebaserad förbrukning och säker återläsning efter omladdning. Bilens påstigning och körning kräver nu bensin. Vid bensinmacken finns en egen Canvas-ritad SNES-inspirerad inomhus-/pumpmiljö, med pump, skärmtak, tankmätare och knapp för att tanka fullt för **2 spelmynt** (uttalat påhittat spelpris, inte dagens Ingo-pris). Köpet använder befintlig myntbetalning (`payCoins`), även odlingsmynt. Världens rörelse pausas i tankningsfönstret och tidigare mynt-/bilfunktioner är avsedda att bestå. **Verifierat:** GitHub godtog kodcommits `5fb3aca`, `9599f86` och `67c4a7a`; inbäddad JS i `index.html` samt `fuel.js` passerade JavaScript-syntaxkontroll. Isolerat funktionsprov bekräftade tom starttank, full tank, förbrukning, återläsning och återställning. **Inte verifierat:** faktisk webb-/mobilrendering, biltankning i körande spelet, regressionssvit eller senaste Pages-publicering. **Återstår för BRÄNSLE-01:** bränsleförbrukning och tankningsmöjlighet för båten, tydligare permanent bränsle-HUD och säkert nödförfarande om bilen blir stående långt från gångväg. Därför är punkten fortsatt öppen.


- **2026-11-19 – Jobb lage / LJUD-01 (svensk uppläsning av NPC-repliker implementerad):** Dialog med Maja, Oliver och Saga läser nu upp den visade repliken via webbläsarens `speechSynthesis` efter spelarens klick på interaktionsknappen, om spelljud är aktiverat. Språket sätts till `sv-SE`, svensk röst väljs om den finns, och tidigare uppläsning avbryts vid ny replik, ljud av, byte av spelmiljö eller dold flik. Dialogtexten visas som tidigare även där talsyntes saknas. Endast `audio.js` och `index.html` ändrades; ingen grafik eller spelprogression berördes. Cacheversion `audio.js?v=8`. **GitHub accepterade commits** `339b50a` och `44372a2`. **Inte verifierat:** faktisk svensk röst på mobil/Safari, ljudnivå och timing tillsammans med musik, fullständig testsvit och Pages-publicering. LJUD-01 lämnas öppen för webbläsarkontroll.


- **2026-11-19 – Jobb lage / LJUD-04 (ny prutteffekt):** En kort originalsyntetiserad prutteffekt har implementerats i `audio.js` med fallande baston, lågpassfilter och pulserad amplitud. Trollminispelet anropar nu `RimforsaAudio.poop()` vid varje lyckat kastkommando, medan träff-/missljud och spelets kast-/poänglogik bevaras. Effekten lyder gemensam ljudknapp och dold-sida-regel. Cacheversionerna höjdes till `audio.js?v=7` och `troll-minigame.js?v=4`. **GitHub-commits bekräftade:** `bf06c16`, `023c136`, `8db9bc0`. **Återstår:** syntax- och webbläsartest, lyssning på ljudet i riktig webbläsare/iPhone samt verifiering av senaste GitHub Pages-publicering. LJUD-04 är implementerad men lämnas öppen för ljudmässig QA. Ingen spelgrafik ändrades i detta pass.


- **2026-11-19 – Jobb lage / badets grafiska harmonisering:** Åsundabadets minispel använder nu samma `lage-sprites.png` som huvudkartan i stället för enbart en förenklad rektangelfigur; om bilden inte laddas behålls den gamla reservfiguren. Sjöbottnen har fått pixelritade stenar, vass och luftbubblor. Versionsparametern i `index.html` är ändrad till `swim-minigame.js?v=4` för att webbläsaren ska hämta uppdateringen. **GitHub bekräftar commits** `f7a681f` och `fa17592`. **Ej verifierat:** faktiskt spritesheet-utsnitt i webbläsare, mobilrendering, fullständiga tester och publicerad Pages-version. GRAF-01 samt BAD-01/02/03 förblir öppna till slutlig visuell och funktionell kontroll.

- **2026-11-19 – Jobb lage / INV-02 (tydligare föremålsbilder):** Byggde `spel/rimforsa/item-art.js` med sju egna 16-bitarsinspirerade 16×16-pixelbilder, renderade skarpt i Canvas i väskan: fotboll, färgkritor, snäcka, nyckelring, päronglass, vaniljglass och ananaspizza. Nyckelringen får ett tydligt silverfärgat ring-/nyckelskaft. Väskan använder nu klickbara föremålsrader med pixelgrafik, föremålsnamn och en beskrivning som visas när Lage väljer ett föremål. Befintlig inventariesparning, fynd- och inköpslogik ändrades inte. **Kontrollerat:** huvudsideskriptets JavaScript-syntax och fristående ritkontroll av samtliga sju bildmönster. **Ej verifierat:** faktisk mobil- och webbläsarrendering, full testsvit och senaste Pages-publicering. GitHub bekräftade commits `9552265` och `421a74b`. Nästa pass: fortsätt med ännu öppna konkreta spelmoment såsom bränsle och ljud, med testarbete sekundärt.

- **2026-11-19 – Jobb lage / ODLING-02 (potatisförsäljning på ICA):** Tre skördade potatisar kan nu säljas på ICA för sex särskilda potatismynt. ICA-scenen har en egen pixelritad potatishörna som kan tryckas på; även separat säljknapp finns. Förråd, sålda potatisar, intjänade och spenderade potatismynt sparas under den befintliga odlingens localStorage-nyckel, medan skattjaktens funna mynt och mål fortsatt ligger i `gameplay.js` och inte ökas av försäljning. Potatismynt kan också användas till glass och pizza, inklusive delbetalning från de två saldona. HUD och butikssaldo visar skillnaden. Försäljningsflaggan rättades så upprepade tryck utan tre potatisar inte ger extramynt. **Kontrollerat:** syntax för de ändrade modulerna och huvudsidan, samt en simulerad plantering/skörd/försäljning där första försäljningen lyckades, andra blockerades, fyra mynt spenderades och två kvarstod efter omladdning. **Inte kontrollerat:** fysisk webbläsar-/mobilrendering, full CI och senaste Pages-publicering. ODLING-02 är implementerad och markerad klar i kod; skarp visuell QA kvarstår. Nästa fokus enligt roadmap: fler faktiska spelmoment, exempelvis föremålsbilder, ljud eller bränsle.

- **2026-11-19 – Jobb lage / ODLING-01 (nytt potatisland):** Implementerade `spel/rimforsa/farm.js` som fristående, pixelritat odlingsminispel med jordfåror, flera växtstadier, planterings- och skördeknappar, tre potatisar per skörd samt nedräkning på **fem minuter verklig tid**. Planteringstid och ackumulerad skörd sparas i `localStorage` när webbläsaren tillåter det; återöppning räknar på faktisk tidsstämpel i stället för antal animeringsrutor. Huvudkartan har fått `Potatislandet` som plats med egen skylt, interaktionsknapp och genväg på den stora kartan; huvudspelets rörelse pausas medan odlingsfönstret är öppet. Resursen laddas som `farm.js?v=1`. **Kontrollerat:** separat JavaScript-syntaxkontroll och simulerad femminutersomgång visade plantering, nästan färdig gröda, återladdning, färdig gröda, skörd av tre potatisar och sparad mängd. GitHub bekräftade commits `306fdb0`, `5d9fee3` och `a8d2b94`. **Inte kontrollerat:** färdig rendering och gångbarhet till själva åkern i verklig webbläsare, fysisk mobil och Pages-publicering. ODLING-02 (försäljning till ICA med separat intäkt från skattjaktsmynt) är fortfarande öppen och prioriteras i följande pass.

- **2026-11-19 – Jobb lage / NPC-02 (nya karaktärer):** Oliver och Saga har fått helt separat, originalritad pixelgrafik direkt i `npc.js` i huvudkartans 44×44-pixelskala i stället för enbart färgfilter på Lages sprite. Oliver har röd keps, rufsigt hår, blå jacka, ryggsäck och gröna byxor; Saga har flätor, gul klänning, lila väst och stövlar. Benrörelsen återanvänder figurernas gångfaser och profilerna har fram-/bak-/sidodetaljer. Vandring, kollision, namn och pratlogik ändrades inte. `index.html` laddar `npc.js?v=2`. **Verifierat:** GitHub accepterade commits `e0b1487` och `75af80e`; JavaScript-syntax för uppdaterad NPC-modul och inbäddad huvudsida har kontrollerats. **Ej verifierat:** visuell rendering i webbläsare och Pages-publicering. Användarens nya arbetsprioritering finns också i `AGENTS.md`: genomför primärt att-göra-punkter; håll tester sekundära. Nästa pass: fortsätt med nya spelmoment, exempelvis odling, eller fordon enligt roadmap.

- **2026-11-19 – Jobb lage / kartnavigering till Åsundabadet:** Den stora kartvyn i `spel/rimforsa/index.html` har fått en tydlig **Gå till Åsundabadet**-knapp och möjlighet att peka på en plats i kartan för att starta den befintliga A*-gångvägsberäkningen. Koordinater översätts från visad kartstorlek till världskartan; tryck nära kända platser snäpper till platsens koordinat. Om väg inte hittas stannar kartan öppen och visar begriplig feltext; den aktiva vägen sätts bara när `pathTo` faktiskt ger vägsegment. Uppdaterade regressionstestet i `tests/rimforsa-beach-access.test.mjs` med integrationskontroller. **Verifierat:** GitHub bekräftade commits `eb2f8be` och `76d08af`; den inbäddade spelkoden passerade JavaScript-syntaxkontroll. **Inte verifierat:** att gångrutten till badet verkligen hittas i körande spel, fullständig Node-/webbläsartestsvit, pekstyrning på fysisk mobil, senaste Pages-publicering. Kodad funktion är inte samma sak som ett godkänt end-to-end-test; badvägen kvarstår som öppen QA-punkt. Därefter fortsätt med GRAF-02 och butiker.

- **2026-11-19 – Jobb lage / synlig gångstig till Åsundabadet:** Tidigare korridor fanns endast i gångbarhetsmasken. I `spel/rimforsa/index.html` har den nu fått ett synligt jord-/grusspår i pixelstil på huvudkartan, minikartan och kartöversikten. `traceBeachAccess(g)` delas mellan kollisionsritning och visuell ritning för att undvika olika vägsträckningar. Regressionstestet i `tests/rimforsa-beach-access.test.mjs` är uppdaterat för den delade geometrin och för att kontrollera att båda kartvyerna använder den. **Verifierat:** GitHub bekräftade koden och testcommits `13ec4d5` och `0b73ee6`; huvudsidans inbäddade JavaScript klarade syntaktisk kontroll. **Inte verifierat:** hela Node-testsviten, faktisk Canvas- och mobilrendering, att Lage når badets interaktionspunkt i körande spel samt aktuell GitHub Pages-driftsättning (publik URL gick inte att hämta i webbsökverktyget). Badvägen förblir en öppen QA-punkt tills detta kan kontrolleras. Därefter fokus på GRAF-02 och BUTIK-01/02.

- **2026-11-19 – Jobb lage / GRAF-02 förfinad skogsmiljö:** Förbättrade trollminispelets befintliga pixelritade skog med tätare vegetation, blommor, stensplitter, ljus/skugga på trollstenen och diskreta animerade eldflugor. Lages och trollets delade originalsprites, styrning, kastgräns och poänglogik ändrades inte. Tillagt regressionstest i `tests/rimforsa-troll-minigame.test.mjs`. **Verifierat:** GitHub bekräftar kod- och testcommits (`3a8b11f`, `886e68b`); den uppdaterade JS-koden har dessutom kompilerats och körts med en isolerad spelomgång som gav en träff och nio kvarvarande kast efter ett kast. **Återstår:** full Node-testsvit, faktisk Canvas-rendering/visuell jämförelse med huvudkartan, mobil/Safari samt publiceringsstatus för GitHub Pages. GRAF-02 kvarstår öppen i väntan på dessa verifieringar.

- **2026-11-19 – Jobb lage / gångväg till Åsundabadet (regressionstest tillagt):** Föregående rättning i `index.html` (commit `9c6f232`) kompletterar den befintliga gångbarhetsmasken med en smal förbindelse från vägen öster om Bella Donna till stranden. I detta pass lades `tests/rimforsa-beach-access.test.mjs` till: testet läser den faktiska PNG-maskens gråvärden, återger den nya förbindelsen och kontrollerar med rutnätsbaserad sökning att Lages startpunkt kan nå badets interaktionsradie samt att sjön i öster förblir blockerad. **Verifierat:** GitHub har godkänt commit av testfilen; kartans kollisionsändring finns på main. **Ej verifierat:** automatisk Node-körning av detta nya test, en verklig promenad i webbläsare, mobilpekstyrning och aktuell Pages-publicering. Gångvägen ska inte markeras slutverifierad förrän dessa kontroller har genomförts. Fortsätt därefter med GRAF-02 och bad-/butiksmiljöernas visuella QA.

- **2026-11-19 – Jobb lage / BAD-03 (vågskvalp implementerat, mobiltest återstår):** Åsundabadet använder nu en särskild `swim`-scen i `audio.js` som återanvänder de originalsyntetiserade mjuka vågorna, men inte båtmotor eller fiskmåsar. Badets `swim-minigame.js` växlar till vågor vid öppning och tillbaka till `land` vid stängning. En egen tillgänglig **Ljud på/av**-knapp har lagts till i badets panel, med status som följer den gemensamma ljudmotorn. Ljudet startar inte automatiskt, utan först efter användaraktivering, och stoppas vid inaktivering eller när sidan döljs. Versionsparametrar uppdaterades i `index.html` till `audio.js?v=6` och `swim-minigame.js?v=3`. Regressionstester för livscykel, motorfri vågscen och versionsnummer lades till; två äldre versionstest som låg kvar på v1/v2 rättades till v3. **Verifierat:** GitHub bekräftade commits på main; audio, badminispel och sidans inbäddade JavaScript klarade syntaxkontroll. En fristående simulerad Web Audio-motor bekräftade sju kontroller: ingen autoplay, bara vågor i badet, tyst vid dold sida, ljud åter efter synlighet, tyst efter avstängning, ljud åter efter påslag och återgång till huvudkartans musik. **Inte verifierat:** riktig ljuduppspelning på iPhone/Safari, fullständig Node-/Chromiumsvit, senaste Pages-publicering och subjektiv ljudkvalitet. BAD-03 lämnas öppen tills faktisk lyssning och visuell QA är utförd. Nästa steg är gemensam visuell och funktionell kvalitetssäkring av GRAF-02, BUTIK-01/02 och BAD-01/02/03.

- **2026-11-19 – Jobb lage / BAD-02 (hajar implementerade, fullständig QA återstår):** Åsundabadets dykspel har nu två pixelritade hajar som patrullerar på olika djup, en egen räknare med tre badhjärtan, tydligt meddelande när hjärtan tar slut, kort skadeimmunitet på 1,4 sekunder efter kollision och omstart som återställer både hajar, hjärtan och mynt. Hajarnas hjärtan och sjömynt är separata från huvudkartans spelmotor; befintlig femmyntsdykning finns kvar. Uppdaterade `swim-minigame.js`, dess cacheversion till `v=2` och regressionstest för rörelse, kollision, immunitet, game over och omstart. **Verifierat:** GitHub-commits bekräftade; JavaScript-syntax klarade separat kontroll, simulerad femmyntsomgång gav fem mynt och tre hjärtan, och automatisk hajföljningssimulation gav exakt tre skilda hjärtförluster (2, 1, 0) och game over, därefter lyckad omstart. **Inte verifierat:** fullständig Node-/Chromiumsvit, faktisk Canvas-rendering och mobilpekning samt senaste Pages-publicering. BAD-02 kvarstår öppen till sluttest. Nästa prioritet: badets vågskvalp (BAD-03) och visuell QA i förhållande till SNES-huvudkartan.

- **2026-11-19 – Jobb lage / kvalitetssäkring av BUTIK-01 och BUTIK-02:** Granskade ICA:s och Bella Donnas Canvas-scener och kopplingen till `index.html`. Åtgärdade ett konkret pekstyrningsfel: tryck direkt på en glass eller pizza gav tidigare ingen respons när den bakomliggande köpknappen var inaktiverad på grund av **för få mynt** eller ett **redan ägt föremål**. Nu ges ett tydligt meddelande om vad som saknas/att varan redan finns i väskan, utan att dubbelköp eller ogiltiga betalningar genomförs. Kassapersonalens träffytor täcker nu även huvud och kockmössa, och ICA:s skärmomräkning har skydd för nollstor Canvas. Höjde cacheversioner för `ica-scene.js` och `pizza-scene.js` till `v=2`, rättade tester och lade till regressionstester för scenklick, statusmeddelanden och uppdaterade filversioner. **Verifierat:** båda scenernas JavaScript och huvudsideskriptets syntax godkänd i separat JS-kontroll, syntetisk Canvas-ritning utförd (213 ICA- och 283 pizzeriarektanglar), träffytor för figurer och varor samt statisk integration med betalningslogik verifierade. GitHub bekräftade commits till main. **Ej verifierat:** faktiska Node-testsuites/Chromium och pekstyrning i telefon, visuell kvalitet och Pages-publicering. GitHub-API:ets kombinerade commitstatus gav `statuses: []`, och det tillgängliga verktyget för workflow-runs rapporterade inga PR-runs; dessa besked bekräftar inte att CI har passerat. Pages-adresserna kunde inte hämtas med webbläsningsverktyget. GRAF-02, BUTIK-01 och BUTIK-02 förblir öppna tills visuell och funktionell kontroll på riktig webbläsare har genomförts.

- **2026-11-19 – Jobb lage / BUTIK-02 (interaktiv pizzeria kodad, sluttest återstår):** Bella Donna har kompletterats med en egen originalritad 480×288-pixelscen i samma SNES-inspirerade stil: stenugn med eld, tegelytor, hyllor, arbetsbänk, ananaspizza, pizzabagare med kockmössa, Lage och kassadisk. Scenen är interaktiv: klick/pek på pizzan använder den befintliga knappen `buyPizza` för köp, på pizzabagaren visas dialog och på ugnen visas en beskrivning. Den tillgängliga separata köpknappen finns kvar. Existerande pris **5 mynt**, `game.spend(PIZZA_PRICE)`, `bag.addPurchase('ananaspizza')`, återbetalning vid lagerfel, skydd mot dubbelköp och återgång till huvudkartan bevaras. Nya filer: `spel/rimforsa/pizza-scene.js` och `tests/rimforsa-pizza-scene.test.mjs`; `index.html` kopplar in scenen med versionsparameter. **Verifierat:** GitHub-commits bekräftade, syntaktisk JavaScript-kontroll av scen och huvudsideskript godkänd, scenritningen producerade 283 pixelrektanglar i syntetiskt Canvas-test, zonerna för ugn/pizza/bagare kontrollerades och kodkopplingen till ekonomilogiken stämdes av. **Inte verifierat:** GitHub Actions fulla Node-/Chromiumsvit, verklig mobil-/desktop-rendering, visuell matchning mot huvudkartan eller aktuell Pages-publicering. BUTIK-02 lämnas öppen tills dessa kontroller genomförts. Prioritera därefter regressions- och visuell slutverifiering av GRAF-02, BUTIK-01 och BUTIK-02.

- **2026-11-19 – Jobb lage / BUTIK-01 (interaktiv butiksscen implementerad, visuell verifiering återstår):** Den tidigare dialogbaserade ICA-vyn har fått en originalritad 480×288-pixelbutik med varuhyllor, varupaket, kassadisk, kassapersonal, Lage och en glassfrys för päron- och vaniljglass, i SNES-inspirerad stil. Spelaren kan trycka på glassorterna **i scenen** för att använda redan existerande köpknappar, eller trycka på kassapersonalen för en replik. De vanliga knapparna finns kvar som tillgängligt alternativ. Samma `game.spend(cost)`, `bag.addPurchase(id)`, balans, inköpsspärrar, sparning och återgång används utan att förändra ekonomimotorn. Tillagt `spel/rimforsa/ica-scene.js`, en scen-/hitTest-testfil och uppdaterad `index.html` med cacheversion. **Verifierat:** GitHub bekräftade commits; fristående JS-syntax, inbäddat sidskript, kassörs-/glassytor och Canvas-renderarens 213 rektangeloperationer kontrollerades i en syntetisk JavaScript-körning. **Inte verifierat:** fullständig Node-/Chromiumsvit, verklig mobilinteraktion, grafisk likhet med huvudkartan eller GitHub Pages-publicering; lokal git-kloning misslyckades på grund av DNS. BUTIK-01 kvarstår öppen till sluttest. Fortsätt därefter med BUTIK-02 (Bella Donna).

- **2026-11-19 – Jobb lage / GRAF-02 (första grafiska omarbetningen implementerad):** Trollminispelets tidigare enkla färgfält, emoji-reservtroll och emoji-bajs i spelplanen har ersatts med en flerskiktad originalritad pixelmiljö i skogsgrönt och stenbrunt, detaljerade träd, klippan med mosskanter, jordstig, pixelritad Lage och bajsprojektil samt kort partikelanimation vid träff. Det befintliga bildbaserade trollet behålls för konsekvens med huvudkartan. Spelmekanik, tio kast, fem träffar, dialog, ljud, pekstyrning och återgång är avsedda att vara oförändrade. Versionsparametern i `index.html` har ändrats till `troll-minigame.js?v=2`; regressionstest för grafiska egenskaper har lagts till och gammal cacheversionsförväntan rättats. **Verifierat:** GitHub bekräftade commits för kod, test och HTML; JavaScript-syntaxen kontrollerades separat och kodstrukturella kontroller passerade. **Inte verifierat:** full Node-testsvit, visuell mobil-/desktop-rendering, bildmässig likhet med huvudkartan och Pages-publicering. Lokal GitHub-kloning misslyckades på grund av DNS. GRAF-02 förblir öppen tills visuell QA och regressionstest har genomförts. Därefter fortsätt med BUTIK-01 och BUTIK-02.

- **2026-11-19 – Designkrav och butiksutveckling:** På användarens begäran har högprioriterade öppna uppgifter GRAF-01, GRAF-02, BUTIK-01, BUTIK-02 och MINI-01 lagts in tillsammans med två övergripande regler: all grafik ska följa huvudkartans SNES-inspirerade 16-bitarsstil, och butiker/framtida minispel ska vara detaljerade visuella spelmiljöer i stället för enkla dialogrutor. Trollspelet ska prioriteras särskilt. Detta är **planering, ingen implementerad eller verifierad kodändring**.

- **2026-11-19 – Jobb lage / BAD-01 (kodad, ej slutverifierad):** Ett fristående sim-/dykminispel i sidovy har lagts till under `spel/rimforsa/swim-minigame.js`, kopplat till Åsundabadets befintliga världspunkt och en kontextknapp `Dyk efter mynt 🤿`. Spelaren simmar med skärmknappar eller pilar/WASD, dyker mot sandbotten, kan samla fem synliga sjömynt och får en gratulation när alla hittats. Återstart, avbryt och Escape finns. Huvudkartans rörelse stoppas medan badet är öppet, och NPC-interaktion har lägre prioritet nära badet. Sjömynten är separata från huvudkartans saldo och skattjaktsmål så att redan fungerande ekonomi inte påverkas. Regressionstester har lagts till i `tests/rimforsa-swim-minigame.test.mjs`. **Verifierat:** GitHub bekräftar commits för ny modul, testfil och kartintegration (senaste kodcommit `97d522a`). **Inte verifierat:** automatisk Node-testkörning, Chromium/mobilvy och senaste Pages-publicering. Försök till lokal git-kloning misslyckades på grund av DNS-upplösning för github.com. BAD-01 lämnas öppen tills dessa kontroller är gjorda. Därefter BAD-02 (hajar), BAD-03 (vågor).

- **2026-11-19 – Jobb lage / FÖR-03 (kod klar, verifiering återstår):** En egen originalsyntetiserad lekfull förskoleljudkuliss (korta tonsekvenser, inte inspelade barnröster) har lagts till som separat `preschool`-scen i `audio.js`. Ljuden aktiveras när rutschkanans dialog öppnas och stängs när den lämnas; befintlig ljudknapp och sidans synlighetsstatus styr uppspelningen. `slide-minigame.js` och versionsparametrar i `index.html` uppdaterade. Regressionstest har lagts till för scenväxling, avstängning och återgång. **Verifierat:** GitHub har bekräftat fyra filcommits på main (senaste `4b2e4b5`). **Ej verifierat:** Node-testkörning, fullständig Chromium-/mobilrendering eller ny GitHub Pages-publicering; GitHub API:s commitstatus saknar rapporterade checks och tillgängliga PR-filtrerade workflow runs var tomma. Lokal kloning blockerades av nätverks-DNS. FÖR-02 och FÖR-03 lämnas därför öppna. Nästa fokus: verifiera och därefter BAD-01.

- **2026-11-19 – Jobb lage / FÖR-02 (kod klar, verifiering återstår):** Tre originalritade pixelbarn i olika kläder och hårfärger har lagts till i bakgrunden av rutschkane-minispelets förskolegård. Ett barn vinkar. De är dekorativa och saknar kollisioner, så ingen påverkan av spelstyrning, hjärtan, mynt eller flygmekanik är avsedd. Regressionstest för antalet barn och spelstatus har lagts till i `tests/rimforsa-slide-minigame.test.mjs`. Kodcommit `b8d0545`, testcommit `6251b0c`. **Verifiering:** filändringarna är bekräftade av GitHub, men automatisk testkörning, faktisk rendering i mobilwebbläsare och GitHub Pages-publicering har ännu inte verifierats. Därför är FÖR-02 fortfarande öppen tills verifieringen är gjord. Nästa uppgift därefter: FÖR-03 (förskolans ambientljud).

- **2026-11-19 – Jobb lage / FÖR-01:** Skapade `spel/rimforsa/slide-minigame.js` som eget mobilanpassat rutschkanespel kopplat till den redan befintliga platsen **Förskolan Hackel**. Knappen **HÅLL INNE FÖR FART!** laddar upp kraft under högst 2,5 sekunder; när den släpps flyger Lage enligt en enkel gravitationsmodell. Längre knapptryck ger högre fart och betydligt längre flygsträcka. Egen Canvas-scen med pixelrutschkana, kraftmätare, flyganimation, landning, distans, rekord och omspel. Fungerar med pekknapp och tangentbordets mellanslag. Rutschkanan ändrar inte spelhjärtan eller skattjaktens mynt. Under spelet stoppas huvudkartans rörelse och karta återupptas med Tillbaka, Escape eller tryck utanför dialogen. Förskoleinteraktionen har företräde framför Oliver när Lage står nära själva förskolan så minispelsknappen inte göms. Nya kontraktstester i `tests/rimforsa-slide-minigame.test.mjs` täcker kort/lång laddning, maxkraft, landning, rekord, omspel och integration. **Verifiering vid loggning:** funktionella tester godkända på commit 95718cc4, kontroll av serverade Pages-filer godkänd; senaste fullständiga UI-test/Pages-publicering ännu pågick efter integrationen och NPC-justeringen. Faktisk iPhone/Safari ej testad. Nästa prioritet **FÖR-02** (egna barn på förskolegården).

- **2026-11-19 – Jobb lage / PIZ-01:** Lagt till en mobilanpassad pizzeriadialog hos **Bella Donna** på kartans befintliga koordinat. Lage kan köpa **en pizzaslice med ananas för fem spelmynt**; summan dras från samma saldo som ICA-glassen utan att minska antalet mynt som räknas mot skattjaktsmålet. Pizzan lagras i väskan som föremålet `ananaspizza`, men kan inte plockas upp gratis genom enbart platsbesök; återköp av redan ägd pizza blockeras. Dialogen kan stängas med knapp, Escape eller tryck utanför, och hindrar huvudkartans rörelse under köp. Väsktotalen är nu sju objekt och cache-versionen för inventariemodulen har höjts. Nya regressionstester för pizza, saldobetalning, sparning och platsintegration. **Verifierat vid loggskrivningen:** GitHub Actions funktionella tester godkända på kodcommit 4f93b539, kontroll av serverade Pages-resurser godkänd och Pages-bygget pågick. Fullständig Chromium-smoketest och fysisk iPhone/Safari ännu inte bekräftade. Nästa ordinarie minispel: **FÖR-01**.

- **2026-11-19 – Jobb lage / ICA-01:** ICA Melkers har fått en mobilanpassad butik med ICA-personal, **päronglass för 3 spelmynt** och **vaniljglass för 4 spelmynt**. Myntmotorn skiljer insamlad mängd från disponibelt saldo, så köp påverkar inte grattis när samtliga kartmynt hittats. Köpta glassar sparas i väskan och kan inte plockas upp gratis vid ett ICA-besök. Dubbelköp stoppas om samma glass redan ägs. Pengarna återställs vid ny spelomgång, men redan sparade föremål stannar i väskan tills den töms. Regressionstester har lagts till. Även alla nya uppgifter från inkorgssektionen har sorterats och behållits som öppna punkter. **Verifieringsnivå:** committat till main; CI/Pages-kontrollen för senaste commit pågick vid dokumentationen, fysisk mobil Safari är inte verifierad. Nästa ordinarie minispel: **PIZ-01**.

- **2026-11-19 – Jobb lage / TROLL-02:** Ny fristående `troll-minigame.js` ansluten genom befintlig `window.RimforsaTrollMinigame.start({troll,player,returnToMap})`. När Lage går till trollet till fots kan han välja **Kasta bajs på trollet 💩** och få ett eget mobilanpassat Canvas-minispel med samma trollsprite, rörligt mål, riktning via skärmknappar/tangentbord/tryck på spelplanen, tio kast, träffräkning, seger vid fem träffar, omspel och återgång. Träff/miss använder befintliga användaraktiverade ljud, och huvudkartans rörelse stoppas under spelet. Inga hjärtan eller mynt ändras. Testerna i `tests/rimforsa-troll-minigame.test.mjs` och de äldre trollregressionstesterna har uppdaterats. **Verifieringsstatus vid loggskrivning:** kod och tester finns på main; kontrollen av serverade Pages-resurser har rapporterat success för kodversion c181cda0, medan GitHub Actions funktionella tester/UI och Pages-publicering ännu pågick. Fysisk iPhone/Safari ej testad. Nästa uppgift **ICA-01**.\n\n
- **2026-11-19 – Jobb lage / DRAKE-01:** Originalritad grön drake i `dragon.js` patrullerar runt spelvärldspunkt cirka (510, 820) i ett avgränsat område, flaxar med vingarna och sprutar cykliskt animerad eld. Draken visas på huvudkartan och som markör i minikartan. Nytt originalkomponerat molltema i `audio.js` väljs inom cirka 235 världspixlar från draken och ersätts av vanliga musiken på avstånd; ljud startar endast efter aktivt ljudval i spelet och stannar i båtminispelet. Draken orsakar ingen skada, ger inga föremål och ändrar inte kollisioner. `tests/rimforsa-dragon.test.mjs` tillagt för rörelse, närhet och Canvas-ritning. **Verifiering:** Koden committad till main och Pages asset-kontrollen var godkänd för integrationscommiten; senaste Pages-bygg och UI-smoketest pågick vid loggskrivningen, så de är inte verifierade ännu. Fysisk iPhone/Safari och faktisk musikalisk upplevelse ej verifierad. Nästa prioritet **TROLL-02** och därefter köpmiljöerna.

- **2026-11-19 – Jobb lage / INV-01:** Lagt till knappen **🎒 Väska** och fyra unika föremål: fotboll vid Hackelhallen, färgkritor vid Förskolan Hackel, snäcka vid Åsundabadet och nyckelring vid Bensinmacken. Föremål erhålls vid första besök och sparas separat från mynt och hjärtan i webbläsarens lokala lagring. Samma fynd kan inte samlas flera gånger; väska kan öppnas, stängas och tömmas efter bekräftelse. Om lokal lagring saknas visas ett tydligt besked. Skapade `inventory.js` och `tests/rimforsa-inventory.test.mjs`. **Verifieringsläge vid loggskrivning:** commits finns på main; GitHub Actions för Pages och webbläsartester pågår, testresultat är ännu inte bekräftade. Fysisk iPhone/Safari ej testad. Nästa uppgift **DRAKE-01**, därefter trollminispelet och övriga minispel.

- **2026-11-18 – Jobb lage / NPC-01 (vandrande pratbara personer):** Tre personer **Maja, Oliver och Saga** har lagts till nära Hackelhallen, Förskolan Hackel respektive ICA. De delar Lages befintliga animerade 16-bitars spritesheet med färgvariationer och namn ovanför sig, promenerar långsamt inom cirka 82 världspixlar från sina ursprungspunkter och använder spelkartans `canStand`-regler så att de inte kan gå genom vatten eller byggnader. De blockerar inte spelaren. När Lage kommer nära till fots kan han trycka **Prata med [namn]** och få olika korta repliker som växlar vid nästa samtal. Talet visas i spelets vanliga meddelanderuta, och figuren står still en stund efter samtalet. En NPC kan inte väljas medan Lage kör bil, och befintlig troll-/bil-/båtinteraktion har kvar företräde. Testerna täcker antal personer, repliker, gångbar rörelse, spritesheet-ritning och befintlig spelkod. **Verifierat:** GitHub Actions funktionella tester godkända, GitHub Pages-bygg och kontroll av serverade resurser godkända; startpunkterna har separat kontrollerats mot gångbarhetsmasken. **Ej verifierat:** hur repliker och figurer ser ut på verklig iPhone/Safari; fulla Chromium-webbläsartestet pågick vid loggskrivningen. [Kodcommit 798a5ee](https://github.com/erikjarl/hemmakompassen/commit/798a5ee0a86eec82285c11a2256388bf37dd31eb). Nästa prioritet: **INV-01** (väska och föremål) samt resterande minispel. Kartutbyggnaden kommer efter dessa.

- **2026-11-18 – Jobb lage / BIL-01 (bilens grafik):** Den gamla enklare rektangelbilen har ersatts med ett originalframtaget **16-bitars spritesheet** i `spel/rimforsa/car-spritesheet.png` med två bildrutor: **parkerad vit kombi** och **samma bil med Lage i förarsätet**. Bilden har takräcken, fönsterglans, synliga hjul och strålkastare; respektive bildruta är 88 × 55 pixlar och ritas i spelkartan pixelperfekt (utan mjuk bildinterpolering). Bilden är större än tidigare så bilen parkerades några steg längre åt höger vid Hem, fortfarande inom påstigningsavstånd från startpositionen. `car.js` laddar bilden, använder rätt bildruta vid på-/avstigning och har tidigare pixelritning som fallback om bilden inte går att ladda. **Oförändrat:** bilens körning, vattenmask, motorljud, instigning, avstigning, mynt och båtminispelet. **Verifierat:** GitHub Actions funktionella tester godkända, inklusive PNG-dimensioner och rätt bildruta för parkerad/upptagen bil; GitHub Pages-bygg och kontroll av serverade filer godkända. **Inte verifierat:** om bilden upplevs tillräckligt snygg i verklig iPhone/Safari, och fullständigt Chromium-UI-test pågick vid loggskrivning. [Kodcommit 93197ad](https://github.com/erikjarl/hemmakompassen/commit/93197ad71e2b2ec5d7e1f1b33142bebe6d323567). Nästa öppna uppgifter: NPC-01 (vandrande pratbara figurer), INV-01 (sparade föremål) och andra minispel; geografisk kartutbyggnad fortsatt lågprioriterad sist.

- **2026-11-18 – Jobb lage / HUV-04, HUV-05, MYNT-01, MYNT-02:** Ett sammanhängande poäng- och hjärtsystem byggdes in på huvudkartan. De ursprungliga **12** mynten har ökats till **20** med bredare regionspridning, och den faktiska uppnåeliga myntmängden styr målet om färre än 20 platser kan placeras. **Sju** bajskorvar försöker placeras på nåbara stigar med avstånd till hemmet, bilen, trollet och mynten. Lage förlorar **ett av tre hjärtan** vid kontakt med en bajskorv till fots, men samma bajskorv skadar inte igen förrän han lämnat den; en kort skadepaus skyddar mot snabbt upprepade träffar. När hjärtana tar slut startar en ny omgång automatiskt vid hemmet med **0 mynt** och alla hjärtan återställda. När det sista myntet hittas visas en festlig, stängbar **grattisruta** med originalkomponerad fanfar som respekterar ljudknappen. Båtminispelets hjärtsystem är separat och oförändrat; för bilåkning gäller fortfarande den befintliga vattenmasken. Ändrade filer: `spel/rimforsa/index.html`, `gameplay.js`, `audio.js` och motsvarande tester. Kodcommit: [cde377e](https://github.com/erikjarl/hemmakompassen/commit/cde377ef5ac688e72b07422d051cfb995322ecb9), testjustering: [a11a4a3](https://github.com/erikjarl/hemmakompassen/commit/a11a4a3408dc2502f5bc30a868dc100fe82852f5). **Verifierat:** GitHub Actions funktionella tester godkända, Pages-publicering och verifiering av serverade resurser godkända. **Ej ännu verifierat:** full Chromium-smoketest (pågående vid loggskrivningen), praktiskt spel på fysisk iPhone/Safari och den exakta visuella upplevelsen av hinder och grattisrutan. Nästa öppna uppgifter: **BIL-01** (förbättra bilgrafik), sedan andra funktioner som NPC/inventarie, trollminispel och nya miljöer. KARTA-01 kvarstår som långsiktig sistahandsuppgift.

- **2026-11-18 – Nya önskemål dokumenterade (ingen spelkod ändrad):** Sju öppna punkter har lagts till: **BIL-01** (finare bil i båtens grafik), **MYNT-01** (fler mynt), **MYNT-02** (grattis vid alla mynt), **NPC-01** (vandrande pratbara figurer), **INV-01** (sparade föremål), **DRAKE-01** (eldsprutande drake med läskig musik) och **KARTA-01** (långsiktig geografiskt förankrad expansion av Kindabygden). KARTA-01 ska **inte** konkurrera med övriga prioriterade uppgifter utan fungera som en återkommande expansion efter dessa. Inget av detta är ännu implementerat eller testat.


- **2026-11-18 – Troll vid stenen (TROLL-01):** Godkänd trollreferens omvandlades till en egen transparent spritesbild `spel/rimforsa/troll-sprite.png` (56×92 pixlar), placerad på befintliga stenen nordväst om rondellen vid världspunkt **(464, 454)**. Trollet ritas i huvudkartan och visas som liten markör i kartöversikten. När Lage närmar sig till fots finns knappen **Hälsa på trollet**. En stabil framtida integrationspunkt `window.RimforsaTrollMinigame.start({troll,player,returnToMap})` finns; tills minispelsmodulen skapats visas en ärlig 'kommer senare'-text. **TROLL-02 är inte genomförd.** Kod och figur: [bc67a11](https://github.com/erikjarl/hemmakompassen/commit/bc67a11a3ac9d85e66715a7db2170a12ae6affd0), testkorrigering: [d4bde10](https://github.com/erikjarl/hemmakompassen/commit/d4bde10558b4ff15133d6864db819be2d66bd36e). **Verifierat:** automatiska funktionella tester godkända och GitHub Pages-kontroll av serverade assets godkänd. **Ej verifierat:** verklig iPhone/Safari, estetisk positionsbedömning i spel på fysisk enhet; fulla browser smoke tests pågick när loggen skrevs.


- **2026-11-18 – Jobb lage / HUV-03 vit bil vid Hem:** Implementerat i `spel/rimforsa/index.html`, `spel/rimforsa/car.js`, `spel/rimforsa/car-water-mask.png` och `spel/rimforsa/audio.js`: parkerad vit bil vid Ulrikavägen, **Kör bilen**-knapp vid bilen, Lage synlig i bilen, styrning via samma pilar/WASD, körning över alla landytor med särskild bildbaserad vattenmask som stoppar sjön, **Gå ur bilen** när en gångbar yta finns i närheten, separat hastighetsstyrt motorljud som respekterar ljudinställningen, samt återställning vid ny omgång. Avstigning från helt otillgänglig terräng visar instruktion att hitta en väg. GitHub-commit [8ae4c4a](https://github.com/erikjarl/hemmakompassen/commit/8ae4c4a243fee842a213390cfa6d14b9f46b01b3) och rättning [c7687da](https://github.com/erikjarl/hemmakompassen/commit/c7687da7f5a910463a9c2eee0029f2aac9b2b534). **Verifierat:** funktionella Node-tester om kollisionsmask, diagonal rörelse, förflyttning mot vattenkant, ljudlogik och kodintegration godkända i GitHub Actions; assetkontroll på Pages godkänd. **Återstår att kontrollera:** fullständig Chromium-browser smoke-körning och slutlig Pages-byggstatus (pågående vid loggskrivning), körkänsla, faktisk interaktion och ljud på fysisk iPhone/Safari. Nästa öppna uppgifter HUV-04 (bajskorvar) och HUV-05 (hjärtan/omstart).

- **2026-11-18 – Jobb lage / ljudpass:** Implementerat **BÅT-01, BÅT-02, HUV-01 och HUV-02** i `spel/rimforsa/audio.js` och kopplat till spelet. Ljuden är originalsyntetiserade i Web Audio API: mjukt vågbrus, syntetiserade fiskmåsläten, båtmotor med hastighetsberoende pitch/volym, myntklirr och egenkomponerad lugn 16-bitarsmelodi. Ljud startar först när spelaren aktiverar **Ljud på** (även tillgängligt i båtspelet); ljuden byts när man går in i/ut ur båtminispelet, stoppas när ljudet stängs av och pausas när sidan döljs. Versionsstyrd fil `audio.js?v=1`. Kod-commit: [`3737cbb`](https://github.com/erikjarl/hemmakompassen/commit/3737cbb4d9e25155f49510e3d822490851ed808a). **Verifierat:** GitHub Actions funktionella och backendtester slutförda med success; Pages-build och kontroll av serverade resurser rapporterade success. Full Chromium-smoketest var fortfarande under körning när denna arbetslogg uppdaterades. **Ej verifierat:** faktiskt ljud på fysisk iPhone/Safari, hur naturtroget fågel- och vågljudet upplevs eller den estetiska kvaliteten på musiken. Nästa uppgifter: HUV-03 (vit bil), HUV-04 (bajskorvar) och HUV-05 (hjärtan/omstart).

- **2026-11-18:** Att-göra-listan och `jobb lage`-fullmakten dokumenterades i projektet. Ingen av ovanstående nya funktioner markeras som implementerad enbart för att listan skapats.

- **2026-11-19 – GRAF-02 / identiska figurer i karta och trollminispel (kodad, slutverifiering pågår):** Trollminispelet använder nu **samma `lage-sprites.png` och samma 56×56-rutnät/44×44-ritning som huvudkartan**, med uppåtvänd spelare i kastscenen. En ny **originalritad genomskinlig `troll-pixel.svg`** med skarpa pixelblock, jordfärger, skuggning och synliga detaljer ersätter den tidigare utskurna trollbilden **både på huvudkartan och i minispelet**. Skog, sten och moln har fått kompletterande 16-bitarsdetaljer. Spellogik (10 kast, 5 träffar), ljudval, pek- och tangentbordsstyrning och återgång avses vara oförändrade. Regressionstester har uppdaterats för att kontrollera identiska grafiktillgångar. **Kvar att verifiera:** fullständig CI-körning, rendering i Chromium/mobil och GitHub Pages; fysisk Safari/iPhone har inte testats. GRAF-02 markeras inte som slutförd innan dessa kontroller är gjorda. Den godkända mockupen är en visuell riktlinje, inte ett inklistrat spelplansfoto.


 - **2026-11-19 – Jobb lage, GRAF-02:** Trollminispelet har fått flerskiktad pixelvegetation framför trollfötterna, markskugga bakom huvudkartans befintliga trollsprit, en kort träffreaktion med förskjutning/ögoneffekt, tydligare bajsprojektil med fartstreck och ett elvadelat pixelpartikelsprut vid träff. Samma Lage-spritesheet, kastfysik, poäng, pruttljud och mobilkontroller har behållits. JavaScript-syntax kontrollerad; GitHub-commits `ae8351f`, `e0f0444`, `427707b`. Visuell rendering, riktig touchstyrning och Pages-status är ännu inte verifierade; GRAF-02 står kvar öppen.

- **2026-11-19 – Jobb lage / GRAF-02:** Den befintliga och gemensamma filen `troll-pixel.svg` för huvudkartan och trollminispelet har förbättrats med 45 nya originalritade pixelrektanglar som ger tydligare hårtofsar, ögonblänk, ögonbryn, mun/tänder, hudrynkor, pälsnyanser och fläckvis mossa. Samma asset återanvänds i båda vyer med cacheversion `troll-pixel.svg?v=2`; `troll-minigame.js?v=6` har uppdaterats. Spelregler, kast och poäng har inte ändrats. GitHub accepterade commits `a5e04c2`, `a15aaf6`, `5f61b97`, `4a6bd20`. Endast strukturell SVG-kontroll har gjorts; visuell spelkontroll och Pages-publicering är inte verifierade. GRAF-02 är fortsatt öppen.

## 2026-11-19 – Jobb lage: retroaktiv avbockning och Lages sprite i rutschkanan

Kodgranskning av `ica-scene.js`, `pizza-scene.js`, `index.html`, `slide-minigame.js`, `audio.js` och `swim-minigame.js` visar att BUTIK-01/02, FÖR-02/03 och BAD-01/02/03 har implementerade huvudfunktioner. Dessa sju poster flyttades till `[x]` i den enda aktiva kön `ROADMAP.md` (11 öppna, 29 avbockade). Källkodsverifiering innebär inte en full visuell eller fysisk mobiltestning. Rutschkanans hårdkodade Lage-figur ersattes av huvudkartans `lage-sprites.png`, renderad med avstängd interpolation och uppdaterad skriptcache i `index.html`. Detta är ett genomfört GRAF-01-delmoment; GRAF-01 lämnas öppen. GitHub-commits `04ffcd3`, `72c9e6f`, `e8422b3`. Ändrade filer återlästa på `main`; webbvisuell kontroll och Pages-servering ej verifierade.

## 2026-11-19 – Jobb lage: trollminispelets ansikte och träffreaktion

GRAF-02: bytte Lages visning i trollminispelet från ryggspriten (rad 3) till huvudkartans framsprite (rad 0), i samma skarpa 56×56-källa skalad till 44×44 som tidigare. Figuren använder vilobild när han står stilla och en kort armgest under kastet. Trollets blinkning och träffskimmer placeras vid ögonen i den gemensamma trollbildens koordinater. Poäng, träffzon, kastfysik, ljud och mobilknappar är oförändrade. Skriptets cacheversion ökade till `v=8`. Vid rutinmässig statusavstämning identifierades inga ytterligare öppna uppgifter som säkert uppfyller alla sina acceptansvillkor; fortsatt 11 öppna och 29 avbockade. GitHub accepterade commits `019efd6`, `831c030`, `56b1c1a`. Kontroll av källfiler på `main` görs separat; faktisk webbläsar-/Pages-visning är ännu inte verifierad.

## 2026-11-19 – Jobb lage: rotation GRAF-01, Åsundabadets grafik

Föregående fokus var GRAF-02 (troll), därför valdes enligt nya rotationsregeln GRAF-01 med en helt annan scen, Åsundabadets dykminispel. `swim-minigame.js` har fått en originalritad strand-/skogshorisont, skarpa pixelljusstråk, växter och bottenstenar, små bakgrundsfiskar och mer detaljerade hajsilhuetter med ögon och käklinjer. Ingen ändring gjordes i rörelsefysik, kollisionslogik, hajarnas hastighet, mynt eller hjärtan. `index.html` uppdaterades till `swim-minigame.js?v=5`. Efter statusavstämning kvarstår 11 öppna / 29 avbockade: GRAF-01 omfattar fler miljöer och skärmbildsjämförelser som ännu inte utförts. Rotation i ROADMAP uppdaterad: senast `GRAF-01`, härnäst `FORDON-02`. GitHub-commits `d211eb0`, `aab89d9`, `9255941`. Kontrollera webbläsarupplevelse och Pages-publicering separat; dessa är inte verifierade här.

## 2026-11-19 – Jobb lage: FORDON-02, nya bilriktningar och rotation

Huvuduppgiften roterade från GRAF-01 till FORDON-02. I `car.js` ritades nya pixelvyer för körning uppåt, nedåt samt de fyra diagonalerna med synligt tak, vindrutor, hjul och lampor, utan att sidobildens tak vrids. Höger/vänster använder fortsatt befintlig detaljerad bilsprit. I `index.html` styr diagonal inmatning nu bilens riktning (`up-left`, `up-right`, `down-left`, `down-right`) och cacheversionen uppdaterades till `car.js?v=3`. `move()` och bränsle-/kollisionsregler ändrades inte. Kodändringarna levererade ett delmoment; båten saknar ännu särskilda 8-riktningsbilder och faktisk visuell mobil-/webbläsarkontroll återstår, så FORDON-02 hålls öppen. Övriga öppna uppgifter uppfyller inte verifierat alla acceptansvillkor; fortsatt 11 öppna/29 avbockade. Rotation uppdaterad: senast FORDON-02, nästa BRÄNSLE-01. Commits `aed5475`, `8939d44`, `1b74341`. GitHub-källor kontrolleras efter skrivning; Pages-driftsättning inte verifierad.

## 2026-11-19 – Jobb lage: BRÄNSLE-01 färdig, bränslemätare och rotation

Statusavstämning mot `fuel.js` och `index.html` visar att bil och båt startar med tom tank om inget tidigare sparat värde finns, har separata sparade tankar, förbrukar bensin vid förflyttning och fylls vid macken genom spelmyntsbetalning. Bilen hindras från att starta när tanken är tom och båten bogseras till bryggan vid bränslestopp. `index.html` har nu kompakta segmentmätare med procent, tom/låg tank-varningar och tydligare hjälptext vid bensinmacken när båda tankarna är tomma eller mynten inte räcker. BRÄNSLE-01 kryssades av på kodverifierad nivå; fysisk mobil-/webbläsarkontroll och Pages-servering har inte bekräftats. ROADMAP: 10 öppna, 30 avbockade; senast BRÄNSLE-01, näst BRÄNSLE-02. Commits `faca7fc`, `18fc117`.

## 2026-11-19 – Jobb lage: BRÄNSLE-02, lokal INGO-skylt utan fabricerat pris

Rotation: BRÄNSLE-01 → BRÄNSLE-02. Källkontroll av INGO:s officiella stationssida (https://www.ingo.se/station/ingo-rimforsa) och prisfilosofi (https://www.ingo.se/v%C3%A5ra-l%C3%A5ga-priser/v%C3%A5ra-l%C3%A5ga-priser) visade att stationen finns på Ulrikavägen 1 och att lokala priser hänvisas till stationsskylt; ingen verifierad publicerad dagsprissiffra hittades för just Rimforsa. Därför har `index.html` nu en 16-bitarsliknande INGO-skylt på huvudkartan och i tankningsscenen med 'PRIS OKÄNT', plus tydlig länk till officiell stationssida och upplysning att 2 spelmynt är påhittat och inte härlett från literpris. Inga påståenden om dagens verkliga bensinpris eller automatisk prisuppdatering. BRÄNSLE-02 förblir öppen tills verifierbar lokal dagspriskälla och säker uppdatering finns. Roadmapen kvar på 10 öppna och 30 färdiga; rotation till LJUD-01. Commit `c3b1e27`, `279368a`. Faktisk visuell webbläsar-/mobilkontroll och Pages-publicering ej verifierade.

## 2026-11-19 – Jobb lage: LJUD-01 talprofiler och sänkt musik under dialog

Rotation: BRÄNSLE-02 → LJUD-01. Källkodskontroll visade att `audio.speak` redan anropades från NPC-samtal efter spelarklick, respekterade ljudreglaget och alltid lämnade repliken i text. I `audio.js` infördes individuellt taltempo och tonhöjd för Maja, Oliver och Saga, samt dämpning av musik till 20 % under aktiv speechSynthesis-uppläsning och återställning vid slut, avbrott eller ny replik. `index.html` skickar NPC-id för rätt talprofil; ljudskriptet cacheversion v=9. Ingen ändring gjordes i NPC-repliker, rörelse, spelgrafik eller andra minispel. LJUD-01 avbockat efter inspektion av källkodens kravuppfyllelse (31 av 40 klara, 9 öppna). Fysiska iPhone/Safari-resultat och verklig röstupplevelse är inte verifierade och hör till LJUD-02. Rotationens nästa genomförbara punkt LJUD-03, eftersom LJUD-02 kräver fysisk iPhone-testning. Commits `a33420b`, `f9e170a`, `f4c39a2`.


## 2026-11-19 · Jobb Lage KARTA-02

- Ändrade bara huvudkartans osynliga gång-hitbox (`canStand`) och motsvarande vägkantsavstånd (`edgeClearance`) i `index.html`: x ±5 → ±2 px, övre marginal 8 → 4 px, central maskpunkt fortsatt obligatorisk.
- Inga ändringar av bildresurser, vägarnas visuella bredd eller själva binära land-/vattenmasken.
- Kontroll: kodjämförelse mot maskvillkor och matchande punkter. Ingen faktisk mobil-/tangentbordsgenomspelning genomförd; gångbarhet vid vägar, entréer, byggnader, stenar och vatten kvar att verifiera.
- Status öppen enligt roadmap; nästa rotationsuppgift FORDON-02.


## 2026-11-19 · Jobb Lage FORDON-02

- `car.js`: ändrat så att såväl parkerad som körande bil använder samma `car-directions.png` med åtta riktningsvyer när bildarket laddats. Fallback till gammal sidobild behålls vid laddningsfel.
- Detta avlägsnar en faktisk modellväxling mellan parkerings-/körläge, men påstår inte att samtliga ritade fram-/bakvyer är visuellt korrigerade. Båtens redan existerande åttavysfunktion är orörd.
- Kodgranskning: källa och ritvillkor kontrollerade. Ingen visuell genomspelning på fysisk mobil/dator eller särskild bildgranskning utförd; uppgiften kvarstår öppen.
- Nästa rotationsposition BRÄNSLE-02, alternativt nästa praktiskt genomförbara uppgift enligt roadmapen.


## 2026-11-19 · Jobb Lage LJUD-02

- BRÄNSLE-02 hoppades över eftersom dagsaktuellt stationspris för INGO Rimforsa inte kunde verifieras: kedjornas listpriser är inte lokala pumppriser. Skylten med okänt pris lämnades oförändrad.
- `audio.js`: `AudioContext.onstatechange` meddelar huvudvyn så ljudknappen får rätt status när Safari asynkront återupptagit ljud; `enable()` återställer mastervolymen efter tidigare avstängning.
- `index.html`: kompletterat gesthantering med passiv `touchstart` för äldre iOS-varianter och lyssnare för AudioContext-statushändelse. Användargesten respekteras fortsatt.
- Kontroll: genomgång av eventflöden och bevarade ljudknappsvillkor; ingen faktisk iPhone/Safari-lyssning eller driftverifiering utförd. LJUD-02 är därför fortsatt öppen. Nästa huvuduppgift LJUD-03.


## 2026-11-20 · Jobb Lage LJUD-03

- Lade till fyra korta, originalsyntetiserade effekter i `audio.js`: fotbollsspark, målvaktsräddning, mål och komplett båtmyntsamling. Samtliga respekterar på/av, flikstatus och `AudioContext.state === 'running'`.
- Anslöt ljuden till `football-minigame.js` respektive båtens segergren i `index.html`; versionsnummer på båda berörda skript uppdaterade för att motverka cache av äldre JavaScript.
- Filer och anropsställen kontrollerade i kod; ingen faktisk webbläsaravlyssning eller mobilgenomspelning. LJUD-03 fortsatt öppen; nästa rotation LJUD-04 eller efterföljande praktiskt genomförbar uppgift.

### 2026-11-20 · Jobb Lage · DRAKE-02

- Hoppade över LJUD-04 (kräver faktisk avlyssning) och KARTA-01 (långsiktigt lägre prioritet), roterade från LJUD-03 till DRAKE-02.
- Lade till `helicopter.js` med parkerad, pixelritad helikopter vid hemmet och kort visuell reaktion vid träff. Kopplade `index.html` till renderingen och `dragon.js` till att rikta eldklot även mot helikoptern. Eldklot ritas även när draken befinner sig utanför bild.
- Syntaxkontroll via JavaScript-kompilering av de två modulerna och inline-skriptet i huvudsidan: godkänd. Ingen riktig webbläsar-/mobilgenomspelning, visuell bedömning eller hörselkontroll utförd. Helikoptern saknar fortfarande flygning, bränsle och eget motorljud; DRAKE-02 står kvar öppen. Nästa rotation: MYNT-03.

### 2026-11-20 · Jobb Lage · MYNT-03

- Rotationssteg från DRAKE-02 till MYNT-03. Hackelhallen ger nu upp till tre engångsmynt för mål 1–3, `football-0`–`football-2`, till den delade minispelsplånboken via callback vid mål. Belöningar som redan hämtats betalas inte ut igen vid omspelning eller efter omladdning så länge localStorage finns kvar. Belöningsgränsen och om mynt tilldelades visas i fotbollsspelet.
- Huvudsidan godtar nu `football-*` i både inläsning från localStorage och när en belöning tilldelas. Redan befintligt gemensamt saldo för båt/dyk och utgifter återanvänds. Inga grafikändringar; måltextens missvisande +1 togs bort när inga nya mynt ges.
- JavaScript-syntax kontrollerad i fotbollsmodul och huvudsidans inline-skript. Kopplingen mellan callback och plånbok källgranskad. Ingen riktig spelgenomgång i mobil/webbläsare, inga faktiska återladdnings-, köp- eller hjärtförlusttester utförda. MYNT-03 och HUV-05 förblir öppna. Nästa rotation HUV-05.

### 2026-11-20 · Jobb Lage · HUV-05

- Rotationspass efter MYNT-03. Två dödsvägar (drake och bajskorv) anropar nu samma `restartAfterGameOver(cause)` i huvudfilen. Den läser tidigare gemensamt saldo, återställer mynten genom befintligt `reset({clearMoney:true})`, uppdaterar HUD och visar förlorat antal samt att nästa omgång startar på 0.
- Återställningen rensar kartmynt, minispelsbelöningar inklusive fotbollen och sparade potatisintäkter, men inte inventariet, potatisskörd eller växttid. Enstaka hjärtförlust följer fortsatt annan väg utan myntnollställning.
- Syntaxkontroll av inline-JavaScript godkänd; källgranskning visar två spel-slut-anrop till gemensam rutin och inga äldre dödsvägar som direkt anropar `reset()`. Saknar riktig genomspelning och omladdningskontroll i webbläsare, därför är HUV-05 fortsatt öppen. Nästa rotationsuppgift HUV-06.

### 2026-11-20 · Jobb Lage · HUV-06

- Rotationspass efter HUV-05. Förbättrade `drawPoops()` med varma kantpixlar, högdager och mörka skuggor i redan befintliga figurer, med huvudsakligt fokus på läsbarhet mot gräs och ljusa vägar. Ändrade inte kartbild, placering eller händelselogik.
- Kontrollerade 37 pixelrektanglar: x=-11…11 och y=-15…10 (23×26 pixlar), samma som tidigare. Kollisionen har fortsatt radie 19. Inline-JavaScript syntaxkompilerat utan fel. Riktig visuell genomspelning på mobil/dator saknas; uppgiften förblir därför öppen.
- Nästa rotationspunkt KARTA-02.

### 2026-11-20 · Jobb Lage · KARTA-02

- Rotationspass efter HUV-06. Minskade den osynliga fotkollisionens sidoprover från ±2 till ±1 pixel och den översta kontrollpunkten från -4 till -3 pixel. Kravet på giltig markmask för alla fem fotpunkter kvarstår och styrassistansens `edgeClearance` använder samma prover.
- Finare A*-ruttnät (6 i stället för 8 kartpixlar) avsett att hitta smala gångbara passager oftare, utan förändring av ritad karta, maskbild eller vatten-/byggnadsregler.
- Syntaxkontroll av huvudsidans inline-JavaScript godkänd; verifierat att samma gångprover används i kollisions- och kantfunktionerna samt att bild-/maskreferenser inte ändrats. Ej faktiskt genomspelat på mobil/tangentbord; passageframkomlighet, vattengränser och ruttprestanda behöver testas, så KARTA-02 förblir öppen. Nästa rotationsuppgift FORDON-02.

### 2026-11-20 · Jobb Lage · FORDON-02

- Rotationspass efter KARTA-02. För bilens åtta riktningar behålls den etablerade spritearkssidan för vänster/höger. Sex fram-/bak-/diagonalvyer använder nu omarbetad egen pixelritning i `car.js`, med gemensamma karossproportioner, fyra hjul, tak-/fönsterdetaljer, lyktor och Lage bakom vindrutan. Den gamla bildens inkonsekventa front/bak används därmed inte längre.
- Höjde cacheversion till `car.js?v=5`. JavaScript-syntaxen i bilmodulen och huvudsidan godkänd, och bilens `draw()` körd i åtta riktningar med simulerad canvas utan fel. Ingen faktisk sidvidsida-visuell bedömning i webbläsare, mobil eller jämförelse med referensgrafik. Båtens grafik oförändrad. FORDON-02 kvar som öppen.
- Nästa rotation BRÄNSLE-02 om verifierbar lokal prisdatakälla finns, annars LJUD-02.

### 2026-11-20 · Jobb Lage · LJUD-02 (BRÄNSLE-02 blockerad)

- Började vid BRÄNSLE-02. Officiella INGO-stationssidan och Bensinpriser.nu saknar verifierbart aktuellt stationsspecifikt Rimforsapris. Ingen siffra påhittad; skylt med PRIS OKÄNT och separat fiktiv speltaxa bevarade. Därför rotation vidare till LJUD-02.
- I `audio.js` spårar `sceneStarted` om en ljudscen redan är igång så att både enable, statechange och återupptagen Promise inte startar dubbla loopar/oscillatorer; `stopScene()` återställer markeringen. Tonfunktionen avstår från att köa toner när kontexten inte kör. `resumeFromGesture` håller reda på en pågående asynkron återupptagning och aviserar knappens status efter svar.
- Huvudsidans `pageshow` hanterar återkomst från Safaris back/forward-cache genom `setVisible` och UI-uppdatering; inget automatiskt `resume()` utan användargest. Version `audio.js?v=15`.
- JavaScript-syntax i audio.js och inline HTML kontrollerad, plus kodvillkor för ljudscensskydd/cacheversion. Faktiska iPhone/Safari-tester saknas, så LJUD-02 står kvar öppen. Nästa rotation LJUD-03.

### 2026-11-20 · Jobb Lage · LJUD-03

- Tre nya, korta originalsyntetiserade ljudeffekter i `audio.js`: `carEnter`, `itemFound`, `helicopterHit`. Integrerade vid bilinsteg, första fyndet av föremål i väskan och drakeldens träff på helikoptern. Effekter kräver aktiv, synlig, upplåst WebAudio-kontext. `audio.js?v=16`.
- Åtgärdade separat liten tidsbugg i helikopterns träffanimation (`helicopter.js?v=2`): skadeindikatorn använder 1,1 sekunders nedräkning i stället för absolut tidsstämpel. Isolerad körning visade aktiv efter 0,5 s och inaktiv efter 1,11 s.
- Syntaxkontroll utan fel i ljudmotor, helikoptermodul och inline-JavaScript. Ingen faktisk avlyssning eller spelgenomgång på mobil; LJUD-03 fortsatt öppen. Nästa rotation LJUD-04 om hörselprov är möjligt, annars GRAF-02. Inga nya kryss utan relevant verifiering.

### 2026-11-20 – Jobb lage, GRAF-01
- Rutschkanans förskolemiljö kompletterad med klätterställning, sandlåda, spade och hink i skarp pixelgrafik. Oförändrad spelmekanik, återanvänd Lage-sprite och samma canvas.
- Ändrad `slide-minigame.js`, därefter uppdaterad `ROADMAP.md` (senast GRAF-01, nästa SPORT-01). Ingen öppen uppgift markerades färdig eftersom de återstående acceptansvillkoren inte är verifierade.
- Källkodsändringen inskickad till main via GitHub. Faktisk mobil-/datorrendering, avlyssning och publicerad Pages-version är inte verifierade.

### 2026-11-20 – Jobb lage, SPORT-01
- Hackelhallen: spelaren kan nu välja riktat skott mot övre eller nedre målhörnet via mobilknappar eller tangenterna 1/2. Mellanslag och standardknappen skjuter fortfarande i Lages rörelseriktning. Målvakten Majas förflyttning justerades till 52 px/s för mer spelbar balans.
- GitHub-kod sparad: `football-minigame.js`; ROADMAP-rotation SPORT-01 → DRAKE-02 och statusnotering uppdaterad. Ingen ny avbockning: fullständig webbläsar-/mobilgenomspelning och grafikbedömning återstår.
- Källkod kontrollerad efter commit, men faktiskt målskytte, tangent-/touchkontroller, ljud och Pages-serverad version är inte verifierade.

### 2026-11-20 – Jobb lage, DRAKE-02 (eldklotsvarning)
- `dragon.js`: pixelritad blinkande laddningsflamma och streckad varningslinje de sista 0,65 sekunderna före skott; projektilerna har riktningsberoende tredelad elds­vans. Samma målval (Lage/helikopter), kontakt, skada, träffkonsumtion och existerande lägen bevaras. Tidssteget klampas till högst 0,1 s vid flikpauser.
- `index.html` hämtar `dragon.js?v=3`. `ROADMAP.md` uppdaterad med senast DRAKE-02 och nästa MYNT-03. Ingen ny avbockning eftersom återstående mobil-/datorgenomspelning, visuell kontroll och skade-/helikopterträff ännu inte verifierats.
- Ändringar har sparats på GitHub main. Faktisk publicerad Pages-version och fysik/animation i webbläsare ej verifierade.

### 2026-11-20 – Jobb lage, MYNT-03 (båtmynt och gemensamt saldo)
- `index.html`: båtspelets myntmätare visar även huvudkartans gemensamma plånbok. Vid myntupptag skiljer statusen på ny belöning (+1) och mynt vars bonus redan hämtats vid tidigare spelning; slutmeddelandet visar totalt saldo. Unika belönings-ID, localStorage, köp och game-over-nollställning ändrades inte.
- `ROADMAP.md`: senast MYNT-03, nästa HUV-05. Ingen avbockning: verklig båtkörning, köp, omladdning och sista-hjärtat-nollställning har inte verifierats i webbläsare.
- GitHub main uppdaterad; källkodskontroll utförd men publicerad Pages-version och fysisk mobilspelning ej verifierade.

### 2026-11-20 – Jobb lage, HUV-05 (båten förlorar sista hjärtat)
- Hittade ett konkret glapp: `boatCrash()` hade separat game-over utan huvudkartans coin-reset. Nu stänger båtens tredje grundstötning båtspelet och anropar gemensamma `restartAfterGameOver('båten')`. Uppdaterad orsakstext visar båtolyckan, exakt förlorat saldo och 0 i ny omgång. Delvis båtskada nollställer inte mynt.
- Extra vakt i `updateBoat` hindrar myntupptag efter game-over i samma renderingssteg. Myntbonusarnas localStorage och potatisförsäljning rensas genom befintlig gemensam reset; väskan och skördad potatis behålls.
- ROADMAP: senast HUV-05, nästa HUV-06; ej avbockad eftersom verklig båt-/mobilgenomspelning, omladdning och saldon efter omstart ännu inte verifierats. Källkod finns på main; Pages-status ej kontrollerad.

### 2026-11-20 – Jobb lage, HUV-06 (kontrast i bajskorvar)
- `index.html`: förbättrade befintliga pixelritade bajskorvars struktur med 15 extra mycket små ljus-/skuggrektanglar. Mer läsbar trappad spiral, särskilt vid kontrast mot gräs och väg. Alla nya pixlar ligger inom befintlig spriteyta x=-11…11, y=-15…10 (23×26 px); kollision och skada är helt oförändrade.
- `ROADMAP.md`: senast HUV-06, nästa KARTA-02. Ingen ny avbockning: verklig visuell bedömning av läsbarhet på gräs/väg i mobil och dator har inte gjorts.
- Sparat på GitHub main och källkod återläst; publicerad Pages-version och praktisk spelkontroll inte verifierade.

### 2026-11-20 – Jobb lage, KARTA-02 (gångbarhet vid vägkant)
- `index.html`/`slideMove()`: vid blockerad direkt rörelse och misslyckad vanlig kantglidning provas ett litet sidosteg (0,75, 1,5 eller 2,25 px). Vardera delsteg samt efterföljande rörelse godkänns mot befintlig `canStand()`-mask. Avsikten är att passera små ojämnheter utan att släppa igenom förbjuden mark.
- Ingen förändring av vägarnas utseende, gångbarhetsmask, NPC-rutter eller fart. ROADMAP senast KARTA-02, nästa FORDON-02. Status fortsatt öppen; faktisk genomspelning vid vatten, byggnader, vägkanter och entréer krävs för att bekräfta beteendet.
- Ändringar sparade på GitHub main och textmässigt kontrollerade. Pages och mobilfunktion ej verifierade.

### 2026-11-20 – Jobb lage, FORDON-02 (motorbåtens åtta riktningsvyer)
- `boat-direction-art.js`: originalritade, konsekventa relingskanter och skuggfogar på båda sidor, små fästen, tydligare vindruteram samt röda/gröna navigationsljus som följer båtens lokala riktning i samtliga åtta genererade vinklar. Befintlig motor, kaross, Lage-sprite, rörelsefysik och vattenkollision oförändrade.
- `index.html` använder `boat-direction-art.js?v=2` för att inte fastna på äldre cachad kod. `ROADMAP.md`: senast FORDON-02, nästa LJUD-02.
- Källkoden sparades på GitHub main och kontrollerades efter uppdatering; verklig visuell jämförelse av alla åtta vyerna i mobil/dator och GitHub Pages-servad version ännu inte verifierade. FORDON-02 kvarstår öppen, inga uppgifter avbockade.

### 2026-11-20 – Jobb lage, FORDON-02 (gemensamma detaljer på bilens riktningar)
- `car.js`: sex kodritade fram-/bak-/diagonalvyer fick genomgående sidofönster, dörrskarvar, ljus taklist, takräckens detaljer och tydligare sidokant i diagonalvyerna. Sidobilder, motor, körfysik och kollisioner har inte ändrats.
- `index.html` laddar `car.js?v=6`. ROADMAP-rotationen är FORDON-02 → LJUD-02. Alla 15 öppna punkter förblir öppna: inga nya acceptansvillkor kan betraktas som helt verifierade med den tillgängliga källkodskontrollen.
- Ändringen sparad på GitHub main. Visuell jämförelse av de åtta riktningarna och mobil-/datorspelning samt Pages-leverans har inte verifierats.

### 2026-11-20 – Jobb lage, LJUD-02 (Safari-återupptagning)
- `audio.js`: blockerar gamla kontexters `statechange` och försenade `resume()`-löften från att påverka en ny ljudkontext. Om aktivt ljud saknar kontext kan nästa användargest skapa en. Bilens motoroscillator skapas bara när kontexten är `running`.
- `index.html` laddar `audio.js?v=19`. Roadmapens rotation är LJUD-02 → LJUD-03. Ingen punkt avbockades: ljudtest i fysisk iPhone/Safari saknas fortsatt.
- Källkod sparad på main. Ingen faktisk avlyssning, Safari-körning eller Pages-distribution har verifierats.

### 2026-11-20 – Jobb lage, LJUD-03 (försäljning, bilutstigning och väska)
- `audio.js`: tre korta originalsyntetiserade toner/ljudsignaler för lyckad potatisförsäljning, att kliva ur/bärga bilen samt bekräftad tömning av väskan. Respekterar aktiv ljudknapp, synlig sida och körande AudioContext.
- `index.html`: effekterna kopplade endast till genomförda handlingar, `audio.js?v=20`. Misslyckad försäljning eller avbruten tömning ska inte ge motsvarande ljud.
- ROADMAP uppdaterad: LJUD-03 → GRAF-01. Inga nya avbockningar eftersom avlyssning och webbläsargenomspelning fortfarande saknas. Sparat på GitHub main; Pages-servering inte verifierad.

### 2026-11-20 – Jobb lage, GRAF-01 (potatislandets pixelmiljö)
- `farm.js`: förstärkt 480×288-bakgrunden med flera nyanser i träd, stammar och blad, gräspixlar, stenar och små jordkorn. Fårorna och potatisens fyra växtstadier ligger kvar över jordlagret. Inga ändringar i skörd, timer eller localStorage.
- `index.html` laddar `farm.js?v=3`. ROADMAP roterad GRAF-01 → DRAKE-02. Ingen punkt avbockad; GRAF-01 omfattar fler scener och mobil-/datorskärmbilder kvarstår.
- Commit sparad på main. Renderad visuell kontroll och faktisk GitHub Pages-leverans inte verifierade.

### 2026-11-20 – Jobb lage, DRAKE-02 (eldklotens sikte)
- `dragon.js`: projektilernas riktning beräknas nu från mynningens faktiska koordinater (x+28, y−7), samma position som eldkloten skapas vid och varningslinjen ritas från. Före detta pass riktades hastigheten från drakens mitt, vilket kunde ge sned bana till målet.
- `index.html`: uppdaterat till `dragon.js?v=5`. Ingen ändring av skaderadie, skadepaus, drakens patrull, helikopter eller världskollisioner.
- ROADMAP uppdaterad DRAKE-02 → MYNT-03. Ingen avbockning: faktisk spelning och visuell/skademässig kontroll i mobil och dator saknas. Ändringar sparade på main; Pages leverans ej kontrollerad.

### 2026-11-20 – Jobb lage, MYNT-03 (dykspelets plånbok)
- `swim-minigame.js`: visar huvudkartans totala spelmynt direkt inne i dykspelet, uppdaterar summan vid uppplockade sjömynt och berättar om fyndet är ett nytt bonusmynt eller redan har tilldelats vid ett tidigare försök. Spela om återställer bara dykomgångens lokala fynd, inte global bonusplånbok.
- `index.html`: båda ingångarna till Åsundabadet skickar `getWalletBalance:totalMoney`, cacheversion `swim-minigame.js?v=7`.
- ROADMAP roterad MYNT-03 → HUV-05. Källkodsankare kontrollerade, men faktisk simulering/genomspelning av mynt, köp, omladdning och sista hjärtat saknas, alltså fortsatt öppen. GitHub main sparad, Pages-leverans ej verifierad.

### 2026-11-20 – Jobb lage, HUV-05 (förlustdialog och kvarhållna knappar)
- `index.html`: drakens och bajskorvarnas skadehantering ignorerar spelaren medan förlustdialogen är öppen. Vid sista hjärtat släpps alla hållna gång-/båtknappar och planerad gångrutt avbryts före befintlig gemensam återställning av kart-/minispels-/potatismynt.
- Myntregler, föremål, skörd och ljud/grafik är oförändrade. ROADMAP roterad HUV-05 → HUV-06. Inga nya avbockningar, eftersom verklig genomspelning och verifiering efter omladdning fortfarande saknas.
- Sparat på GitHub main; mobil/dator och Pages-leverans ej kontrollerade.

### 2026-11-20 – Jobb lage, HUV-06 (bajskorvarnas kontrast)
- `index.html` / `drawPoops()`: mörkare ytterkontur, tydligare brun färgseparation och ljusa kontrastpixlar inom befintliga gränser x=−11…11, y=−15…10. Ingen förstoring, flytt, ny kollision eller ändrad hjärtskada.
- `ROADMAP.md`: huvuduppgift HUV-06, nästa KARTA-02. Ingen avbockning eftersom visuell jämförelse mot väg/gräs och mobil/datorrendering ännu saknas.
- Sparat på GitHub main. Verklig grafisk rendering och GitHub Pages-leverans ej verifierade.

- **2026-11-20 – Jobb lage / KARTA-02:** Huvudkartans fotkollision använder nu tre kompakt placerade maskprover (mittpunkt och två sidoprover) i stället för fem. Ingen maskdilatering görs och ingen bildgrafik ändras; hus/vatten ska fortsatt vara blockerade enligt masken. Källa kodgranskad, faktisk spelning på mobil och dator samt väg- och entrékontroller återstår. Stående spriteprioritet granskad: ett transparent spritesheet med fyra förskolebarn (fyra vinklar vardera) genererades under passet som lokal arbetsresurs. PNG-filen är ännu inte överförd till GitHub eller integrerad i rutschkanespelet; befintliga kodritade barn visas fortfarande. Rotation framflyttad till FORDON-02.

- **2026-11-20 – Jobb lage / FORDON-02:** Den bildbaserade vita bilens vänster- och högervyer visar nu Lage i sidorutan när occupied=true, men inte när bilen är parkerad. Huvudsidans cacheversion höjd till `car.js?v=7`. Inga ändringar av körfysik, kollisionsmask eller andra bilvyer. Syntax och faktisk bildrendering behöver fortfarande kontrolleras i webbläsare. Det tidigare genererade PNG-spritesheetet med förskolebarn finns ännu bara som lokalt bildmaterial och har inte integrerats. Roadmap roterad FORDON-02 → LJUD-02.

- **2026-11-20 – Jobb lage / LJUD-02:** Säkrare WebAudio vid Safari-avbrott: måssång och förskoleljud kräver nu körande AudioContext; `setScene()` kan återstarta samma vald scen om den inte redan är igång. Cacheversion `audio.js?v=21`. Förskolebarnen i `slide-minigame.js` är fortfarande kodritade: PNG-spritesheetet som genererades i tidigare pass finns som lokal resurs men är inte publicerat i GitHub. Ingen faktisk iPhone-/Safari-avlyssning har gjorts; LJUD-02 förblir öppen. Rotation ändrad till LJUD-03.

- **2026-11-20 – Jobb lage / LJUD-03:** Lade till tre korta originalsyntetiserade ljud i `audio.js`: gameOver (sista hjärtat), shopEnter (ICA/pizzerian) och mapClose (stora kartan stängs). Kopplade till `index.html`; cache `audio.js?v=22`. Kod sparad via GitHub main. Ingen faktisk avlyssning, webbläsargenomspe­lning eller mobil-/Safari-verifiering; LJUD-03 står kvar öppen. De tidigare genererade förskolebarnen är ännu bara en lokal PNG-fil och inte publicerade bildsprites i spelet. Stående grafikprioritet kvarstår. Rotation LJUD-03 → GRAF-01.

- **2026-11-20 – användarstyrd drakjustering / DRAKE-02:** Drakens eldklot begränsas till högst 300 världspixlar och får inte passera bensinmackens x=394 österut. Mål längre bort genererar inte skott eller varning; pågående skott tas bort vid gränsen. Även tidigare helikopterriktade långskott begränsas. Cache `dragon.js?v=6`. Särskild ändring på användarens begäran; huvudrotationens nästa position GRAF-01 lämnas oförändrad. Ingen verklig webbläsargenomspe­lning har genomförts.

- **2026-11-20 – Jobb lage / GRAF-01:** Fyra förskolebarn är nu bildbaserade i rutschkanespelet. Härledning från användarens tidigare genererade transparenta spritesheet: fyra framåtriktade motiv, pixeloptimerad till 32×32 per ruta (128×32 transparent PNG, inbäddad som data-URL i `preschool-friends-sprites.js`). `slide-minigame.js` använder `drawImage` i första hand, med kodritad fallback vid laddningsfel. `index.html` laddar sprite-resursen före spelet och höjer cacheversionen till v6. Oförändrad fysik, poäng och Lages originalsprite. GitHub main uppdaterad och källfilernas koppling granskad; faktisk visuell webbläsarkontroll på mobil/dator återstår. Fortsatt GRAF-01 öppen för andra figurer/scener och fler riktningar. Rotation GRAF-01 → DRAKE-02.

- **2026-11-20 – Jobb lage / DRAKE-02:** Rättade målväljningen efter senaste avståndsbegränsningen: helikoptern får bara väljas om den är inom 300 världspixlar och väster om mackens x=394. Om den inte är det kan draken skjuta mot Lage när han är inom samma räckvidd. Tidigare kunde `shotId=0` och utomräckhållshelikopter leda till att draken aldrig avfyrade något alls. Begränsningen vid macken och den maximala flygsträckan är kvar. `dragon.js?v=7`; ingen faktisk mobil- eller datorgenomspelning, uppgiften öppen. Kontrollerade att fyra bildbaserade förskolebarn redan laddas från `preschool-friends-sprites.js` i rutschkanespelet; visuellt test återstår. Rotation DRAKE-02 → MYNT-03.

- **2026-11-20 – Jobb lage / MYNT-03:** Lade till engångsbelöningen `slide-0` vid första landningen i förskolans rutschkanespel. Båda huvudkartingångarna skickar `onLandingCoin` och `getWalletBalance` till minispelsmodulen. Gemensam localStorage-plånbok accepterar nu `slide-`-ID; dess befintliga köpsystem och game-over-nollställning inkluderar därmed myntet. Minispelsvyn visar totalt saldo och skillnad mellan nytt och redan hämtat landningsmynt. `slide-minigame.js?v=7`. Bildbaserade förskolebarn kvar från tidigare pass, ej nya sprites detta pass. Kodankare kontrollerade, men faktisk mobil-/datorgenomspelning, omladdning och köp kvarstår. Rotation MYNT-03 → HUV-05.

- **2026-11-20 – Jobb lage / HUV-05:** Skydd mot dubbel game-over: `restartAfterGameOver()` returnerar om förlustdialogen redan är öppen. Förlustmeddelandet använder det beräknade `remainingCoins` efter reset i stället för ett hårdkodat nollvärde. Verifierat i källkoden att nya rutschkanemyntet `slide-0` ingår i samma `rewardWallet.clear()` som båt-, dyk- och fotbollsbonusar. Inga nya bildsprites genererade under detta pass; bildbaserade förskolebarn är redan inkopplade, andra kodritade personer återstår. Koden sparad på GitHub main; inte verifierad genom faktisk genomspelning eller sidomladdning. Rotation HUV-05 → HUV-06.


### 2026-11-20 – Jobb Lage / FORDON-02
- Uppdaterade `boat-direction-art.js`: Lages ansikte/hår följer åtta båt-riktningar (framifrån, bakifrån och sidoprofil), med ratt och vindruteram. `index.html` laddar `boat-direction-art.js?v=3`.
- Commitkod: `fade7cc1`, `a16e5f9`. Ett bildgenererat bil-åttavysark har skapats separat men **inte** uppladdats till eller aktiverats i spelet.
- Verifieringsnivå: källkod och version finns på `main`; verklig mobil-/desktoprendering av alla åtta vyer och Pages-leverans ej verifierade. `FORDON-02` fortfarande öppen. Nästa huvuduppgift `LJUD-02`.


### 2026-11-20 – Jobb Lage / LJUD-02 + bildbaserad bilrendering
- `audio.js`: ny användargest kan påbörja ett nytt resume-försök om Safari fortfarande håller ett äldre resume-Promise efter 2,5 sekunder; sena Promise-svar identifieras med försökstoken. `audio.js?v=23`. Ingen fysisk Safari-lyssning genomförd.
- `car.js`: befintliga `car-directions.png` renderas nu i alla åtta riktningar och kodritning är reserv. `car.js?v=8`. Nytt genererat bilark finns som separat lokal bildfil men har inte laddats upp till repot eller kopplats in; FORDON-02 fortfarande öppen.
- GitHub-commits: `bacf0ad`, `33233ad`, `4aacf7e`, `2302c9d`; roadmap har ändrats till senaste `LJUD-02` och nästa `LJUD-03`. Källfiler verifierade på main, inte faktisk Pages-/mobilrendering.


### 2026-11-20 – Jobb Lage / LJUD-03
- Tre korta originalsyntetiserade effekter i `audio.js`: `boatReturn` (återkomst från båtspelet utan game-over), `shopExit` (lämna ICA/pizzerian) och `routeSelected` (giltigt gångvägsval). `index.html` kopplar dem till händelser, undviker dubblat kartstängningsljud vid vägval och behåller stängknappens ljud; `audio.js?v=24`.
- Kod sparad i commits `3202c13`, `a55979e`, `f883644`; roadmap `adea4c4`. Källkoden kontrollerad på `main`, ingen faktisk mobil-/datoravlyssning eller Pages-kontroll. LJUD-03 förblir öppen. Nästa huvuduppgift GRAF-01.
- Den senast genererade bilbilden är fortfarande inte uppladdad/inkopplad; den befintliga 8-riktningsbilden används sedan föregående pass. Grafikprioriteten kvarstår.


### 2026-11-20 – Jobb Lage / GRAF-01: fyra bildbaserade åskådare i Hackelhallen
- I fotbollsspelets bakre läktare visas nu fyra unika tidigare bildgenererade barnsprites, hämtade ur befintliga `preschool-friends-sprites.js` (transparent PNG, 128×32). `football-minigame.js` använder bildens fyra 32×32-utsnitt och ritar med `drawImage`, med tillfällig kodfallback medan PNG laddas. Bildresursen laddas före fotbollsspelet; cacheversion `football-minigame.js?v=6`.
- Inga ändringar i Maja/målvaktens logik, fotbollsfysik, poäng eller mynt. Bildsprites är återanvända från förskolegården, inte en ny separat bildgenerering denna gång. Maja och flera andra kodritade karaktärer återstår.
- Källintegrationen verifierad på `main` (fyra bildrutor, laddningsordning, ritning och cacheversion); ingen visuell mobil-/datorskärmbild eller publicerad Pages-rendering verifierad. Kodcommits `5240e4b`, `87de58b`; roadmap `05c9222`. GRAF-01 är fortsatt öppen, nästa rotation DRAKE-02.

- 2026-11-20 – Jobb lage, GRAF-01: Bildgenererat Maja-spritesheet (4 riktningar) inbäddat som transparent PNG i `maja-sprites.js`; fotbollsrendringen använder bilden med kodritad fallback. `index.html` laddar modulen före `football-minigame.js?v=7`. Kodgranskning utförd, inget verkligt visuellt genomspelningstest. Rotation -> SPORT-01. Inga ytterligare öppna uppgifter avbockade utan full verifiering.

- 2026-11-20 – Jobb lage, SPORT-01: Lade till bollföring vid fotkontakt i `football-minigame.js` (endast låg bollhastighet) och tydligare spelinstruktion. GitHub main uppdaterad, men mobil-/datorgenomspelning, faktisk bildvisning samt målvakts- och myntbeteende ej verifierade. GRAF-01:s bildinventering kvarstår; bildbaserade Maja och fyra åskådare finns kopplade enligt kod, övriga NPC är delvis kodritade. Rotation -> DRAKE-02. Inga nya uppgifter avbockade.

- 2026-11-20 – Jobb lage, DRAKE-02: Varningen låser nu målets världspunkt när den börjar (upp till 0,65 s före avfyrning) och eldklotet skjuts därefter mot samma plats. Lage kan därmed väja; helikopter kvarstår som möjligt mål. `dragon.js?v=9` i index. Gränserna max 300 px och x=394 bibehålls. GitHub-kod och skriptkoppling läsgranskade men ingen verklig webbläsar-/mobilgenomspelning. Bildinventering: draken ritas ännu med kodpolygoner, inte genererad sprite; GRAF-01:s bildarbete återstår. Inga ytterligare avbockningar. Rotation -> MYNT-03.

- 2026-11-20 – Jobb lage, MYNT-03: Båda huvudkartans ingångar till Åsundabadets dykminispel anropar nu `updateCoinScore()` vid återgång, utöver `updateMessage()`. Gemensam plånbok, unika ID och myntreset är oförändrade. Kodkontroll gjord; faktisk dykning, köp, omladdning och sista-hjärtat-förlust på mobil/dator återstår. Grafiknotis: draken är fortsatt kodritad; bildbaserade NPC i andra scener återstår i GRAF-01. Ingen uppgift avbockad utan genomspelning. Rotation -> HUV-05.

- 2026-11-20 – Jobb lage, HUV-05: Förlustdialogen redovisar nu separata antal tappade kartmynt, minispelsmynt och potatismynt baserat på saldon före reset; det verkliga saldot efter nollställning visas fortfarande. Inga förändringar av reset, inventarium eller potatisskörd. Ändringen är källkodskontrollerad, men faktisk genomspelning och persistenskontroll i webbläsare saknas. Inventering: kodritade NPC/karaktärer återstår för bildsprites under GRAF-01; inga nya bildfiler genererade i detta pass. Inga nya uppgifter avbockade. Rotation -> HUV-06.

- 2026-11-20 – Jobb lage, HUV-06: `drawPoops()` använder nu en lugn 650 ms färgväxling i tre redan befintliga högdagrar vid avstånd <112 världs-px; tidigare tre små blinkpixlar är synkroniserade med samma fas. Oförändrad mörk ytterkontur, spritegräns 23×26 px, position, 19 px kollisionsradie och skadelogik. Ändring i index.html committad på main och kodgranskad men faktisk visuell gräs-/vägjämförelse på mobil och dator återstår. Bildsprite-inventering: huvudkartans Oliver/Saga samt draken är ännu kodritade; GRAF-01 fortsätter vara öppen. Ingen ny bildgenerering eller avbockning i detta pass. Rotation -> KARTA-02.

- 2026-11-20 – Jobb lage, KARTA-02: Automatisk gång markeras som framme vid vägpunkt först inom 3 världspixlar (tidigare 9), för att inte avsluta vägsegment för tidigt nära entréer. Ingen ändring av gångmask, grafik, manuell kollision eller navigeringssökning. Koden och roadmapen sparade på main; verklig mobil-/tangentbordsgenomspelning och förbättrad tillgänglighet har ännu inte testats. Bildinventering: huvudkartans NPC och draken är fortfarande delvis kodritade, arbetet med bildsprites ligger kvar på GRAF-01. Inga nya uppgifter avbockade. Rotation -> FORDON-02.

- 2026-11-20 – Jobb lage, FORDON-02: `boat-direction-art.js` orienterar nu förarens axlar och tröjpartier i båtens färdriktning; ansiktsdetaljer får förskjutning i diagonala vinklar. `index.html` laddar `boat-direction-art.js?v=4`. Åtta färdriktningar och befintlig båt-/bilfysik, kollisioner och belöningar oförändrade. GitHub-implementationen kodgranskad, men visuellt prov av åtta riktningar i mobil/dator saknas. Bildspriteinventering: båtföraren är alltjämt kodritad; fler genererade bildsprites behövs och återstår enligt GRAF-01. Ingen ny bildgenerering i detta pass och ingen ny avbockning. Rotation -> LJUD-02.

### 2026-11-20 – LJUD-03: rutschkaneljud

- Skapade två originalsyntetiserade WebAudio-effekter: `slideCharge` vid lyckad start av sats, `slideLongJump` när 200-metersbonusmyntet delas ut första gången.
- Långhoppsljudet ersätter det normala landningsljudet just vid bonusutdelningen; upprepade långhopp får vanligt landningsljud. Inga ändringar i avståndsberäkning, myntlogik eller sprites.
- Uppdaterade `audio.js?v=28` och `slide-minigame.js?v=9` i `index.html`; källkopplingar kontrollerade på `main`. Verklig Safari-/mobilavlyssning och visuell speltest inte utförda.
- Roadmap: LJUD-03 fortfarande öppen, nästa rotation GRAF-01. Bildbaserade åskådare och Maja finns i fotbollsspelet, fyra barn i rutschkanan; ytterligare kodritade figurer behöver inventeras och ersättas vid GRAF-01.

### 2026-11-20 – två Jobb Lage-pass: GRAF-01 och DRAKE-02

- **GRAF-01:** Tidigare genererade Oliver/Saga-figurer bearbetades till transparent 96×96 PNG (2 rader × 3 riktningar, ruta 32×48) och bäddades in i nya `friend-sprites.js`. `npc.js` ritar Oliver och Saga med bildsprites för framåt, vänster/höger och bakåt, med kvarvarande kodritad reserv. `index.html` laddar sprites före `npc.js?v=3`. Bilden är kodinkopplad men ännu inte granskad i verklig mobil-/datorrendering; inget avbockat.
- **DRAKE-02:** Varningslinjen kompletterades med blinkande pixelmarkerad, låst målpunktsposition för eldklot. Spelhändelser, skadepaus, bränslemackens x-gräns, eldklotsräckvidd och helikopterträff bevaras. `dragon.js?v=10` laddas. Verkligt mobil- och tangentbordsprov återstår; inget avbockat.
- **Rotation efter andra passet:** senast DRAKE-02, nästa MYNT-03. Fortsatt bildinventering: butikernas kassapersonal och pizzerians bagare kodritade, flera andra figurer återstår att konvertera. Kodkontroller är inte liktydiga med slutanvändartest eller bekräftad GitHub Pages-publicering.

### 2026-11-20 – MYNT-03: gemensamma minispelsmynt mellan flikar

- Ändrade bonusplånboken i `index.html`: före tilldelning, köp och återbetalning läses lagrat saldo/bonus-ID på nytt. Detta minskar risken för överskrivning när en äldre öppen flik gör nya transaktioner. Giltiga ID kontrolleras, och lagrade avdrag begränsas till antalet intjänade mynt.
- `storage`-händelser från andra flikar gör att huvudkartans mynt-HUD uppdateras. Befintliga bonusvillkor, betalningsordning, spelregler och förluståterställning är oförändrade. Skyddar inte mot exakt samtidiga läs/skriv-race mellan flikar och garanterar inte sparning om webbläsaren blockerar lagring.
- Källa kontrolleras på GitHub main; verklig tvåfliks-, köp-, mobil- och omladdningsprovning kvarstår. MYNT-03 öppen. Nästa rotation HUV-05.
- Stående bildinventering: ICA-personal och Bella Donna-bagaren är fortsatt kodritade, bör ersättas med bildgenererade pixelartfigurer vid nästa GRAF-01-pass.

### 2026-11-20 – HUV-05: beständig nollställning vid sista hjärtat

- Ändrade `rewardWallet.clear()` så att en uttryckligt tom bonusplånbok sparas i localStorage i stället för att bonusnyckeln raderas. Andra flikar kan därmed se ett konkret nollsaldo via befintlig `storage`-lyssnare. Ingen garanti för exakt samtidiga flikskrivningar eller spärrad lokal lagring.
- `restartAfterGameOver()` uppdaterar bonusplånboken från sparat läge precis före förlustredovisningen, så sent inkomna bonusmynt inte missas i visad redovisning. Den existerande `stop()`-funktionen visade sig redan rensa både gång-/båtknapparnas held-klasser; ingen dubbel ändring gjordes.
- Kartmynt, bonusmynt och potatisinkomster nollställs fortsatt med tidigare mekanik; sparade föremål, skörd och växande potatis lämnas oförändrade. Källkod inspekterad, men faktisk död, omladdning, mobil-/datorprov och tvåflikstester återstår. HUV-05 fortsatt öppen. Nästa rotation HUV-06.
- Bildinventering: butikspersonal och pizzabagare är fortsatt kodritade; bildspritearbete återkommer i nästa GRAF-01-pass.

### 2026-11-20 – HUV-06: tydligare spiralveck i bajskorvar

- Sex små pixelrektanglar ger tre spiralnivåer tydligare ljus-/mörkseparation. Samtliga ligger innanför ursprunglig 23×26 px-yta; ingen ändrad storlek, kollisionsradie, hinderplacering eller hjärtskada.
- `index.html` ändrad på main; källa och kontrastpositioner kodgranskade. Bildjämförelse på gräs/väg i verklig mobil och dator återstår. HUV-06 öppen; nästa rotationsposition KARTA-02.
- Stående spriteinventering: ICA:s kassapersonal och pizzerians bagare återstår fortfarande som kodritade figurer. Inga nya bildgenererade figurer integrerades i detta pass.

### 2026-11-21 – Jobb lage, HUV-05 (potatismynt i flera öppna flikar)
- Synkroniserar sparad potatisplånbok före farmens ändringar som annars kunde skriva tillbaka gammalt myntsaldo efter sista-hjärtat-nollställning i en annan flik. Exponerar `syncCoins` och `key` till huvudkartans storage-lyssnare och uppdaterar kartans mynt-HUD vid ändrade potatismynt.
- Förlustkontrollen verifierar dessutom att kartans aktuella saldo och hela gemensamma saldot är noll. Endast källkod och kopplingar granskade; inget autentiskt tvåfliks-/mobilspeltest genomfört. HUV-05 fortsatt öppen; nästa HUV-06. Inga nya bildsprites genererades eller integrerades i detta pass.

### 2026-11-21 – Jobb lage, HUV-06 (varningsansikte på små hinder)
- Bajskorvarna har nu markerade ögonbryn och ett varningsuttryck på nära håll. Ögonen varierar mellan ljusgult och orange i den redan befintliga kontrastfasen. Alla nya pixelrektanglar ligger inom samma 23×26-pixelgränser och ändrar inte kollisions-/skadelogik.
- Källkoden återläst på main och kollisionsankare kontrollerat. Ingen riktig mobil-/datorgenomspelning eller bildjämförelse på gräs/väg; HUV-06 kvarstår öppen. Bildsprite-prioriteten inventerad men ingen ytterligare person konverterades i detta pass. Nästa rotationsposition KARTA-02.

### 2026-11-21 – Jobb lage, KARTA-02 (bredare gångmarginal)
- Bytte huvudkartans gångkontroll från tre fotprover (`[0,0],[-1,-1],[1,-1]`) till två centrala prover (`[0,0],[0,-1]`). Det minskar osynlig bredd runt Lages fötter, vilket ger cirka en världspixel extra utrymme per sida längs smala gångbara vägar. Både punkterna kräver fortfarande giltig originalmask; varken bakgrundsbilder eller gångmask ändrades.
- Inline-JavaScript syntaxkontrollerat före commit; återstår faktisk provgång på vägar, vid viktiga minispelsentréer och på hus-/sten-/vattenkanter i mobil och dator. Ingen bildgenererad person integrerad i detta pass; återstående kodritade reservfigurer och NPC:er är en del av öppna GRAF-01. KARTA-02 fortsatt öppen; nästa FORDON-02.

### 2026-11-21 – Jobb lage, FORDON-02 (riktat kölvatten)
- Lade till `drawWake` i båtens redan existerande åttariktade sprite-modul: skarpa vita/turkosa pixelrader placeras bakom aktern i båtens aktuella kvantiserade riktning. Stillastående båt får inget kölvatten; rörelsehastighet styr 2–4 rader. Huvudscenen skickar befintlig fartvektor till ritningen; cacheversion för båtmodulen höjd till 5.
- Javascript-syntax och källkoppling har kontrollerats efter commit. Ingen faktisk visuell mobil-/datorprovning eller live-Pages-kontroll, ingen ny bildgenererad figur integrerad. Bilens vyer och åttariktat bildbaserat båtark behöver fortfarande granskas; FORDON-02 hålls öppen. Nästa rotationsposition LJUD-02.

### 2026-11-21 – Jobb lage, LJUD-02 (Safari AudioContext efter avslutat men tyst resume)
- `resumeFromGesture()` markerar nu en avvisad eller avslutad men fortsatt pausad/interrupted AudioContext som misslyckad. Vid nästa faktiska användargest stängs den och en ny WebAudio-kontext skapas; om ljudet redan hunnit bli `running` behålls befintlig motor. Återupptagningsförsökens identitets- och ordningsvakter gäller fortsatt. Ny cacheversion `audio.js?v=33` i index.
- Källkoden återläst från main och JavaScript-syntax verifierad. Verklig iPhone/Safari-lyssning, mobilens musik/effekter/tal och upplevd stabilitet ej testade. Inga bildgenererade figurer integrerades; kvarstående GRAF-01-figurer återstår. LJUD-02 öppen; nästa LJUD-03.

### 2026-11-21 – Jobb lage, LJUD-03 (väska och bensinmack)
- Två nya korta, egenkomponerade WebAudio-signaler: `bagClose` vid verklig stängning av väskan och `fuelStationEnter` vid öppning av bensinmackens fönster. Båda respekterar ljudknappen, den synliga fliken och AudioContext `running`. Ljudfilens cacheversion höjd till 34.
- Kod syntaktiskt kontrollerad och återläst från main. Ingen faktisk avlyssning på iPhone/Safari eller desktop; nivåbalansen och användarupplevelsen är inte verifierade. Inga nya bildgenererade NPC-resurser integrerade i detta pass. Nästa rotationsposition GRAF-01.

### 2026-11-21 – Jobb lage, GRAF-01 (Maja som samma bildfigur i två scener)
- Huvudkartans Maja använder nu det befintliga originalbildgenererade transparenta fyrariktade Maja-arket från Hackelhallen, inte den tidigare hue-filtrerade Lage-bilden. `npc.js` väljer fram/vänster/bak/höger efter gångriktning och läser bildmodulen vid teckning, eftersom `maja-sprites.js` laddas senare än `npc.js`. Små skarpa gångstudsar bevarar den redan befintliga rörelsen.
- JavaScript-syntax och källkoppling återlästa och verifierade på main. Ingen ny genererad bildfil eller ändrad spelmekanik; faktiskt mobil-/datorrendering och skärmbildsjämförelse återstår. GRAF-01 öppen, nästa DRAKE-02.

### 2026-11-21 – Jobb lage, DRAKE-02 (målval vid bilkörning)
- Draken väljer inte längre Lage som nytt eldklotsmål när han sitter i bilen eller båtspelet är aktivt. En låst men ännu ej avfyrad varning riktad mot Lage upphör då, medan målval mot helikoptern och redan avfyrade projektiler lämnas oförändrade. `index.html` överför spelarens sårbarhet till `dragon.update`; `dragon.js?v=13` används.
- Källfiler kontrollerade på main. JavaScript-syntax godkänd; liten direkt funktionskontroll verifierade frånvaro av varning mot bil-Lage och att befintlig varning mot gående Lage avbryts vid växling till bil. Full genomspelning och visualisering i Safari/mobil/dator saknas; DRAKE-02 fortsatt öppen, nästa MYNT-03. Inga nya bildgenererade NPC-resurser integrerades detta pass.

### 2026-11-21 – Jobb lage, HUV-05 (färska potatismynt vid sista hjärtat)
- `restartAfterGameOver()` anropar nu både `rewardWallet.sync()` och `farm.syncCoins()` innan förlustsaldot beräknas. Detta minskar risken att ett potatisförsäljningssaldo från en annan öppen flik saknas i förlustsammanställningen.
- Ingen ändring av gemensamma nollställningen, sparformat, grödor, föremål eller grafik. Kodkoppling återläst på `main`; verkligt tvåflikstest, mobil och omladdning saknas. HUV-05 fortsatt öppen, nästa HUV-06. Bildbaserade personer tillkom inte under detta pass.

### 2026-11-21 – Jobb lage, HUV-06 (kontrast på befintliga bajskorvar)
- `drawPoops()` har fått två tunna, ljus-/mörkseparerade veck på nederdelen och två små kindpixlar som tydligare visar fara när Lage är nära. Originalets 23×26-pixelgräns, placering, 19-pixelskollision och hjärtförlust är oförändrade.
- GitHub-kod sparad och återläst; inga nya bildbaserade sprites genererade i detta pass. Faktisk visuell kontroll på gräs/väg i mobil och dator krävs fortfarande. HUV-06 öppen; nästa huvuduppgift KARTA-02.

### 2026-11-21 – Jobb lage, KARTA-02 (pekmål på smala vägkanter)
- `safeTapTarget()` prövar nu först om en tillåten punkt intill pekningen är direkt nåbar på högst 90 världspixlar med hela rörelsesträckan kontrollerad av `canWalkStraight()`. Kandidater som inte kan nås direkt används bara som fallback till befintlig A*-rutt. Den maximala snäppradien är fortsatt 18 pixlar.
- Kartbild, gångmask, hus-, sten- och vattenhinder samt manuell styrning är oförändrade. Koden finns på main och har återlästs; riktig touch-/tangentbordstest vid entréer saknas. KARTA-02 hålls öppen, nästa FORDON-02. Ingen ny bildsprite tillkom i detta pass.

### 2026-11-21 – Jobb lage, FORDON-02 (riktad turbulens bakom båten)
- I `boat-direction-art.js` har kölvattnet kompletterats med 2–4 små originalritade pixelstråk från propellern, som följer båtens åtta riktningar och syns enbart under färd. `index.html` hämtar nu `boat-direction-art.js?v=7`.
- Ingen ändring i bränsle, båtens fysik, kollisioner eller mynt. Källfiler sparade på main. Faktiskt båttest på mobil/dator och visuell jämförelse med bilens vyer återstår, så FORDON-02 är fortfarande öppen. Inga nya bildgenererade resurser tillkom i detta pass. Nästa rotationsuppgift LJUD-02.

### 2026-11-21 – Jobb lage, LJUD-02 (ljudknapp vid Safari-avbrott)
- Huvudsidans ljudknapp är åter en konsekvent av/på-knapp även om WebAudio-kontexten är `suspended` eller `interrupted`. Tidigare blev knappen i dessa lägen enbart "Återuppta ljud" och gick inte att använda för att stänga av.
- Återupptagning via nästa användargest i spelet finns kvar och inga ljudfiler eller WebAudio-motorregler ändrades. Källkod sparad på main och återläst; faktiskt iPhone/Safari-test av av/på, bakgrundsmusik, effekter, tal och appbyte återstår. LJUD-02 öppen, nästa LJUD-03. Ingen ny bildsprite integrerades i detta pass.

### 2026-11-21 – Jobb lage, LJUD-03 (båten får en egen tom-tank-signal)
- Nytt kort originalsyntetiserat tretonsljud `boatOutOfFuel()` i `audio.js`, aktiverat bara när ljudmotorn är igång och sidan synlig. Båtens spel-loop jämför nivån före och efter förbrukning så signalen spelas en gång vid övergång till tom tank, inte i varje bildruta vid bryggan. `index.html` laddar nu `audio.js?v=36`.
- Ingen ändring av bränsleförbrukning, bogsering, rörelse, kollisioner eller belöningsregler. Källkoppling sparad till main; fysisk ljudavlyssning och spelning med bränslestopp återstår. LJUD-03 öppet, nästa GRAF-01. Bildinventering: koden ritar fortfarande bl.a. vissa bakgrundsfigurer; inga nya bildsprites integrerades i detta ljudpass.

### 2026-11-21 – Jobb lage, GRAF-01 (Maja som bildfigur i Bella Donna)
- Pizzerian `pizza-scene.js` återanvänder nu originalbildgenererade fyrvinklade Maja-spriten som redan används i Hackelhallen och på huvudkartan. Maja är en icke-interaktiv besökare på den fria golvytan till vänster; spritebilden visas bara om den laddats och har förväntad storlek 192×56. Laddningshändelsen ritar om scenen. `index.html` använder `pizza-scene.js?v=6`.
- Befintlig pizzabagare och Lage är oförändrade. Ingen ändring av zoner, köp, mynt eller spelregler. Kodkoppling sparad på main och återläsning utförs; faktisk visuell bedömning av pizzerian på mobil/dator återstår. Ingen nygenererad spritefil tillkom: den etablerade Majabilden återanvänds. GRAF-01 öppen, nästa DRAKE-02.

### 2026-11-21 – Jobb lage, DRAKE-02 (pausa eldstrid vid scenbyte)
- Huvudkartans befintliga spelvillkor lyfts till `worldPlaying`, som styr både spelarrörelse och drakens uppdatering/träffar. När karta, väska, butik, minispel eller förlustdialog visas fryser drakens eldklot och nya varningar/attacker startar inte. Drakens närvaroljud stängs under pausen och återgår när kartan spelas igen.
- Drakens maxavstånd (300 världspixlar mot Lage, 600 mot helikoptern), östra gräns vid macken, skadeintervall och helikoptereffekter är oförändrade. Inline-JavaScript syntaxkontrollerat utan fel efter commit; verklig genomspelning, mobil och visuell/hörbar kontroll återstår. DRAKE-02 hålls öppen, nästa MYNT-03. Inga nya bildsprites integrerades i detta pass.

### 2026-11-21 – Jobb lage, MYNT-03 (färskt potatissaldo i gemensam plånbok)
- `totalMoney()` hämtar nu aktuella potatismynt med `farm.syncCoins()` innan kartmynt, minispelsbonus och potatismynt summeras. Detta gäller både köp och saldo som visas på huvudkartan och i minispelen. Minispelsbonus lästes redan om vid varje `rewardWallet.balance()`.
- Koden är sparad på main; syntax- och källkontroll genomförs. Faktiska tvåfliksfall, omladdning, omspelning, köp och game over återstår att genomspela. MYNT-03 hålls öppen. Ingen ny bildsprite har integrerats under detta pass. Nästa rotationsuppgift HUV-05.

### 2026-11-21 – Jobb lage, HUV-05 (game over i flera flikar)
- Efter att sista hjärtat förlorats och kart-, minispels- och potatismyntens nollställning verifierats i sparminnet, skriver `restartAfterGameOver()` en separat `rimforsa-loss-reset-v1`-signal. Andra öppna flikar får `storage`-event och laddar om spelet, så deras lokalt insamlade kartmynt och pågående minispelsomgång inte kan fortsätta på gamla saldon. Den förlorande fliken laddas inte om. En vanlig myntuppdatering utlöser inte omladdning.
- JavaScript-syntax och relevanta kopplingar kontrolleras i repositoryt. Faktiskt flerflikstest, omladdning och full genomspelning med båt, drake och bajskorvar återstår; HUV-05 hålls öppen. Ingen ny bildsprite integrerad under detta pass. Nästa rotation HUV-06.

### 2026-11-21 – Jobb lage, HUV-06 (spiralveck med oförändrad storlek)
- Förstärkt de tre synliga spiralnivåerna på huvudkartans bajskorvar med sex små ljusa/mörka rektanglar inom samma 23×26-pixelyta. Inga ändringar av koordinater, vägars gångbarhet, kollisionsradie, hjärtskada eller figurernas spawn.
- JavaScript-syntax och källkoppling kontrolleras. Faktisk visuell jämförelse mot ljus väg och mörkt gräs på dator/mobil återstår. HUV-06 öppen, nästa KARTA-02. Inga nya bildsprites integrerades under detta pass.

### 2026-11-21 – Jobb lage, KARTA-02 (pekstyrning vid vägkanter)
- `safeTapTarget()` prioriterar nu en godkänd punkt nära det faktiska fingertrycket i stället för att inom en samplingsring föredra punkten närmast Lage. Direkt nåbara mål används för korta sträckor; i övrigt gör befintlig A* samma gångmaskkontroll som tidigare. Den osynliga pektoleransen är fortsatt högst 18 världspixlar; ändringen ändrar inte kartbild, faktisk gångmask, hus-, sten- eller vattenkollision.
- Koden sparad till main; syntaxkontroll och källkontroll görs. Faktisk mobil-/datorprovning av entréer, Åsundabadet och vägkanter återstår. Ingen ny bildsprite integrerades. KARTA-02 öppen; nästa rotationsuppgift FORDON-02.

### 2026-11-22 – Jobb lage, FORDON-02 (åtta vyer med samstämmig båtmotor)
- `boat-direction-art.js`: aktermotorn har fått samma pixelritade mörka motorhuv, metalliska ventiler, liten ljusreflex och tydlig akterspegel i samtliga åtta riktningar. Delarna byggs i båtens lokala längd-/sidokoordinater, vilket behåller proportioner och placering även diagonalt. `index.html` hämtar `boat-direction-art.js?v=8`.
- Ingen ändring av båtens fysik, kollisionsyta, bränsle eller spelregler. Bilens befintliga åttavinkelark lämnades oförändrat eftersom faktisk jämförelse av bilderna saknas. Syntax och kodkoppling kontrolleras; mobil-/visuell verifiering återstår. FORDON-02 kvarstår som öppen. Nästa huvuduppgift LJUD-02. Ingen ny bildgenererad spritefil tillkom.

### 2026-11-22 – Jobb lage, LJUD-02 (hörbar bekräftelse på aktiverat ljud)
- `audio.js` spelar en kort, originalsyntetiserad tvåtonsbekräftelse en gång efter att spelaren själv slagit på ljud och WebAudio-kontexten faktiskt är i tillståndet `running`. Ett avbrutet/asynkront Safari-`resume()` hanteras både vid `statechange`, avslutat resume-löfte och direkt running, med gemensam engångsflagga så ljudet inte dubbleras. Flaggan nollställs vid ljud av och aktiveras inte av `pageshow`/`visibilitychange`; inga autostartregler kringgås.
- `index.html` läser `audio.js?v=37`. Faktisk lyssning i Safari/iPhone, appbyte, tal och musik kvarstår. Ingen ny bildsprite integrerad under detta pass; uppgift LJUD-02 öppen, nästa LJUD-03.

### 2026-11-22 – Jobb lage, LJUD-03 (ljud för bajskorvsträff)
- Huvudkartans `checkPoops()` anropar nu det redan originalsyntetiserade `audio.poop()` (med `audio.hit()` som fallback) i stället för enbart generellt skadeljud, men bara när `game.touchHazard()` bekräftat verklig hjärtskada. Detta undviker två samtidiga effekter och bevarar skadepaus, skaderäknare och nollställning vid sista hjärtat. Andra faror använder fortsatt det vanliga skadeljudet.
- JavaScript-syntax/källkoppling kontrolleras; ingen faktisk ljudprovning på iPhone/Safari utförd. LJUD-03 kvarstår som öppen för provlyssning och balans; nästa GRAF-01. Ingen ny bildsprite integrerades under detta pass.

### 2026-11-22 – Jobb lage, GRAF-01 (bildbaserad ICA-kund)
- ICA-miljön (`ica-scene.js`) visar nu en extra kund från befintliga originalgenererade `RimforsaPreschoolFriendsSprite` (andra rutan i 128×32-arket), identiskt bildmaterial som redan används som publik i Hackelhallen. Bilden placeras vid kassagången och ritningen görs om när den laddats. Ingen ny kodritad person används för kunden.
- `index.html` laddar `ica-scene.js?v=6`. Kundens bild påverkar inte glassar, kassaklick, myntsaldo eller priser. Inga nygenererade bildfiler tillkom. Syntax- och källkontroll genomförs, men faktisk visuell jämförelse på mobil och dator återstår. GRAF-01 kvarstår öppen; nästa DRAKE-02.

### 2026-11-22 – Jobb lage, DRAKE-02 (pausad helikopterreaktion)
- `index.html`: flyttat `helicopter.update(dt)` in i samma `worldPlaying`-villkor som `dragon.update()`, skottkollisioner och skadekontroll. När karta, butik, inventarium eller minispel pausar huvudvärlden ligger även helikopterns tidsbegränsade träffrök/gnistor kvar i sin reaktion i stället för att ta slut bakom dialogen. Efter återgång räknas reaktionstiden ned igen.
- Inga ändringar av drakens räckvidd, skadevärden, träffytor eller spritegrafik. Kodsyntax och källkoppling kontrolleras, men verklig genomspelning med eldklot och pauser återstår. DRAKE-02 hålls öppen; nästa MYNT-03. Ingen ny bildsprite integrerades.

### 2026-11-22 – Jobb Lage: GRAF-01, pixeltrogen karaktärsrendering

- `npc.js`: Majas 48×56-sprite ritas nu i ursprunglig 48×56-storlek i huvudkartan i stället för 44×51, med oförändrat riktningsval och rörelse. Namnetiketter för bildbaserade figurer placeras ovanför håret i stället för över sprites.
- `ica-scene.js`: den befintliga bildbaserade ICA-besökaren ritas i 32×32 utan ojämn förstoring till 36×36; klickytor, köp och butikspersonal oförändrade.
- `index.html`: skriptversionerna för `npc.js` och `ica-scene.js` höjdes för cacheuppdatering. Kontrollerat genom GitHub-filskrivning; faktisk visuell mobil-/datorgranskning och GitHub Pages-distribution är inte verifierade. Inga uppgifter avbockade; 14 öppna/30 arkiverade. Nästa rotation SPORT-01.

### 2026-11-22 – Jobb Lage: SPORT-01, målvaktsräddning och publik

- `football-minigame.js`: målvaktsträff kontrollerar nu om bollen korsar x=390 och interpolerar y vid passagen, i stället för att enbart testa om bollen råkar ligga inom ett smalt x-intervall efter uppdateringen. Minskar risken att snabba skott passerar utan räddningskontroll. Befintlig räddningsrekyl, ljud, mål- och myntlogik bevarade.
- Fyra befintliga bildbaserade åskådare ritas nu i originalstorleken 32×32 (tidigare 34×34), utan ojämn pixeluppskalning. De är bildbaserade, medan den kodritade tillfälliga fallbacken finns kvar om bilden inte laddas; ingen ny bildfil genererades under detta pass.
- `index.html`: cacheversionen för fotbollsmodulen höjd till v8. Ändringar sparade på GitHub main. Kodens nya villkor har granskats men fullständig spelgenomgång på mobil/dator, renderingsgranskning och bekräftad Pages-distribution har inte genomförts. SPORT-01 hålls öppen. 14 öppna uppgifter, 30 färdigmarkerade. Nästa huvuduppgift DRAKE-02.

### 2026-11-22 – Jobb Lage: DRAKE-02, räckviddskontroll vid avfyrning

- `dragon.js`: drakens varningsmål låses fortfarande i förväg, men räckvidd och östra gräns kontrolleras på nytt från den aktuella mynningen i avfyrningsögonblicket. När draken hinner flytta sig för långt sedan målet låstes skapas inget omöjligt skott. Befintliga gränser på 300/600 världspixlar, mackgränsen x=394, projektilkollisioner och pauslogik är oförändrade.
- `index.html`: cacheversionen för drakmodulen höjd från v13 till v14.
- Koden sparad i GitHub main. Ingen faktisk spelgenomgång på mobil/dator eller bekräftad Pages-driftsättning; DRAKE-02 förblir öppen med uttryckliga återstående kontroller. Inga nya sprites genererades i detta pass; draken är fortfarande kodritad och bör inventeras i framtida grafikpass. Rotation: senast DRAKE-02, nästa MYNT-03. Fortfarande 14 öppna och 30 arkiverade.

### 2026-11-22 – Jobb Lage: MYNT-03, uppdatering av minispelens gemensamma saldo

- `swim-minigame.js`, `slide-minigame.js` och `football-minigame.js` exponerar nu en `refreshWallet`-funktion som uppdaterar saldovisningen om respektive minispel är öppet. Simning och fotboll uppdaterar etiketten; rutschkanan anropar sin befintliga rendering som redan bygger etiketten från aktuell plånbok.
- `index.html`: befintlig `refreshSharedCoinViews()` anropar alla tre spelens `refreshWallet` vid storage-händelser, pageshow, synlig flik och fönsterfokus. Samma rutin uppdaterar sedan huvudkartans HUD och öppna butiker. Skriptversioner höjda för simning, rutschkana och fotboll.
- Inga nya mynt, bonus-ID:n, köpprioriteringar eller regler för nollställning ändrades. Ingen ny bildsprite genererades; tidigare bildbaserade publiksprites i fotboll är kvar, medan kodritade fallbackfigurer återstår i flera scener.
- Ändringar inskrivna på GitHub main; återläsning av kod är möjlig men flerflikstest, faktiskt mobil-/datorspeltest, race mellan samtidiga skrivningar och GitHub Pages-driftsättning är **inte** verifierade. Uppgiften MYNT-03 är därför fortfarande öppen. Status 14 öppna, 30 arkiverade. Nästa rotation HUV-05.

### 2026-11-22 – Jobb Lage: HUV-05, blockera fördröjda transaktioner efter förlust i annan flik

- `index.html`: `awardMinigameCoin` kontrollerar nu förlustsignalen genom `reloadAfterOtherTabLoss()` precis före belöning. `payCoins` gör samma kontroll före butiksköp. Om den äldre fliken upptäcker en game-over-signal från en annan flik begär den omladdning och skriver inte sin gamla bonus eller sitt gamla köp till lagringen.
- Ändringen tar sikte på fördröjda `storage`-event i särskilt sovande flikar. Den gör inte lokala `localStorage`-transaktioner atomiska och är ingen fullständig lösning på samtidiga skrivningar.
- Befintlig nollställning av kartmynt, minispelsbonusar och potatisintäkter ändrades inte. Ingen ny bildfil skapades; kodritade fallbackfigurer kvarstår som grafiskt arbete.
- Koden är sparad på GitHub main. Kodåterläsning är gjord, men faktisk spelgenomgång, test av flera flikar/iPhone och Pages-publicering har inte bekräftats. HUV-05 är fortsatt öppen. 14 öppna och 30 arkiverade uppgifter; nästa rotation HUV-06.

### 2026-11-22 – Jobb Lage: HUV-06, tydligare bajskorvskanter

- `index.html` / `drawPoops()`: förstärkte befintliga ljusa kantpixlar mot mörkt gräs och mörka kantpixlar mot ljus väg, inklusive tvåtonade kantdetaljer inom exakt den tidigare 23×26-pixelrektangeln. Inga förändringar av positioner, spridning, `checkPoops()` eller skadeavståndet 19 pixlar.
- Befintliga ansikten, närhetsblinkning och SNES-inspirerad pixelritning behölls. Ingen ny bildsprite genererades under detta pass; övriga kodritade figurer återstår för grafikrotationen.
- Kodändring och ROADMAP-rotation sparade på GitHub main. Verklig rendering mot både gräs/väg på mobil och dator samt faktisk träffprovning saknas. HUV-06 förblir öppen; 14 öppna, 30 arkiverade. Nästa uppgift KARTA-02.

### 2026-11-22 – Jobb Lage: KARTA-02, säkrare rutt över smala hörn

- `index.html` / `pathTo()`: A*-sökningen kräver nu `canWalkStraight` mellan varje par av intilliggande rutcentra innan steget accepteras. Tidigare kunde två godkända rutcentra ändå ha en blockerad pixelsträcka mellan sig, särskilt vid diagonala hushörn eller smala sten-/vattenkanter. Förhindrar att planerade rutter väljer just sådana blockerade segment. Oförändrad 6-pixelsruttgrid, gångmask, strandstig, originalgrafik och handstyrning.
- Behållit originalmask och `safeTapTarget()`-kontroll; ändringen öppnar inga nya passager genom hus, vatten eller sten. Detta är en kodgranskad förbättring, inte ett verifierat spelresultat. Faktisk provgång med mobil/tangentbord och tillgänglighet till entréer samt Åsundabadet återstår. Prestanda vid långa A*-sökningar bör även bedömas i webbläsare.
- Ingen ny bildfil genererades. Trollfallbacken i `drawTroll()` är fortfarande kodritad när spritesheet inte laddas; normalt används befintlig bildsprite. 14 öppna och 30 arkiverade uppgifter. Nästa huvuduppgift FORDON-02.

### 2026-11-22 – Jobb Lage: FORDON-02, gemensamma sidodetaljer på båten

- `boat-direction-art.js`: lagt till en diskret röd skrovmarkering och ljus pixelaccent på båda sidor. Markeringen definieras i båtens lokala skrovkoordinater och ritas med samma form i alla åtta riktningar, utan att rotera bitmappar eller påverka båtens fysik.
- `index.html`: höjt cacheversionen för `boat-direction-art.js` från v8 till v9.
- Bilens befintliga `car-directions.png` i åtta native 80×60-vyer och Lages befintliga spelkaraktär behölls oförändrade. Ingen ny bildfil har genererats; båtens vyer är fortfarande procedurgenererade canvasbilder, inte en extern sprite-PNG. Kodritade reservpersoner finns fortfarande i flera scener.
- Ändringar sparade på GitHub main; mobil-/datorspeltest, visuell jämförelse av samtliga fordonsvyer och bekräftad Pages-publicering återstår. FORDON-02 behålls öppen. 14 öppna, 30 arkiverade, nästa rotation LJUD-02.
