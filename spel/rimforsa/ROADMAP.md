# Lage i Rimforsa – att-göra-lista och arbetsordning

**Projekt:** `erikjarl/hemmakompassen`  
**Spel:** `spel/rimforsa/index.html`  
**Publicerad adress:** https://erikjarl.github.io/hemmakompassen/spel/rimforsa/  
**Senast uppdaterad:** 2026-11-19  
**Status:** Väskan och den animerade draken är implementerade på main med tester. Drakens senaste Pages-distribution och webbläsartester kontrolleras separat i GitHub Actions. Övriga minispel är öppna.

## Stående instruktion – kommandot `jobb lage`

När användaren skriver **`jobb lage`**:

1. Läs alltid denna fil och `spel/rimforsa/AGENTS.md`, och kontrollera aktuell spelkod och status på GitHub innan arbetet.
2. Gå igenom hela att-göra-listan, välj nästa genomförbara uppgifter och genomför ett sammanhängande, självständigt utvecklingspass. Börja med fel som blockerar spelet och fortsätt med funktioner enligt beroenden och listordning.
3. **Full behörighet är uttryckligen given för detta spel:** gör kodändringar, skapa/ändra resurser, kör tester, committa, pusha och publicera till samma GitHub Pages-sida utan att fråga användaren igen inför varje `jobb lage`. Detta gäller också att läsa och uppdatera denna instruktion och att-göra-lista vid varje pass. Gäller tills användaren ändrar fullmakten, inom faktiska verktygsbehörigheter och överordnade säkerhetskrav.
4. Kontrollera att tidigare funktioner är kvar; testa särskilt mobil-/pekstyrning, bild- och ljudladdning, spelprogression, hjärtan, mynt och återstart. Kontrollera CI/Pages-status där det går.
5. Markera genomförda uppgifter med `[x]` först efter verifiering, och dokumentera eventuella begränsningar, kända fel och vad som återstår. Vid utebliven publicering ska det stå tydligt.
6. Håll utvecklingen avgränsad till spelet `spel/rimforsa/` och dess relevanta tester; `Jobb hk` är ett separat kommando för resten av Hemmakompassen.

## Att göra – Kinda båtklubb

- [x] **BÅT-01: Vattenambience.** Lägg till bakgrundsljud med **vågskvalp och fiskmåsar** när man befinner sig i båtminispelet.
- [x] **BÅT-02: Motorljud.** Lägg till **båtmotorljud när motorbåten kör**. Ljudet ska följa körningen, och stanna när båten stannar eller minispelet lämnas.

## Att göra – huvudkartan

- [x] **HUV-01: Myntljud.** Spela ett tydligt **pengaljud när ett mynt samlas in**.
- [x] **HUV-02: Musik.** Lägg till **mysig bakgrundsmusik** på huvudkartan.
- [x] **HUV-03: Vit bil vid hemmet.** Lägg till **en vit bil vid Hem/Ulrikavägen**. Lage ska kunna välja att köra den. När bilen kör ska den ha **motorljud**, och bilen ska kunna köra **över alla terränger utom vatten**.
- [x] **HUV-04: Bajskorvar.** Lägg till **bajskorvar** som hinder. Lage **förlorar ett hjärta** när han kommer i kontakt med en bajskorv.
- [x] **HUV-05: Hjärtan och omstart.** När **alla hjärtan försvinner** ska spelet **börja om**, och spelaren ska **förlora alla insamlade mynt**.

## Nya förbättringar – huvudspel och spelvärld (2026-11-18)

- [x] **BIL-01: Finare vit bil.** Ersätt bilens nuvarande förenklade pixelgrafik med en mer detaljerad, välgjord **16-bitarsbil i samma grafiska stil som motorbåten**. Visa Lage i bilen, bevara styrning, motorljud, möjlighet att kliva in och ur och regeln att bilen inte får köra i vatten. Kontrollera utseende i rörelse och på mobil.

- [x] **MYNT-01: Fler mynt på kartan.** **Öka antalet insamlingsbara mynt** på huvudkartan och sprid ut dem på ett lekfullt sätt. Se till att alla kan nås, att HUD/räknare visar rätt totalantal och att insamlade mynt kan användas i framtida butiker. Undvik att pengar försvinner oavsiktligt vid byte till minispel.

- [x] **MYNT-02: Grattis när alla mynt hittats.** När Lage samlat **alla mynt** ska spelet ge en tydlig och festlig belöning, exempelvis texten **”Grattis! Du har samlat alla mynt!”** med en enkel animation och ett passande ljud. Den ska bara utlösas när målet är uppnått, gå att stänga och fungera på mobil. Anpassa till framtida köp och mynt som tillkommer vid kartutbyggnad.

- [x] **NPC-01: Vandrande karaktärer och samtal.** Skapa **andra karaktärer i samma pixelgrafik som Lage** som går omkring på gator och stigar, utan att blockera spelaren. Lage ska kunna gå fram och **prata med dem** via en lättbegriplig samtalsruta. Ge figurerna egna repliker och bevara stöd för mobilstyrning.

- [x] **INV-01: Föremål och väska.** Inför möjlighet att **samla in, förvara och spara föremål** i en enkel inventarievy/väska som kan öppnas igen efter att spelet stängts. Börja med lokal lagring på samma enhet (om den är tillåten), med tydlig återställningsfunktion. Planera föremål så att de kan återanvändas i framtida minispel och inköp. Myntsaldo och inventarieobjekt ska skiljas åt.

- [x] **DRAKE-01: Drake i skogen.** Skapa en **animerad drake i samma 16-bitarsstil** som rör sig bland skogspartier på huvudkartan och **sprutar eld med animation**. När draken är nära ska den vanliga musiken växla till **läskig/spännande musik**, och växla tillbaka när Lage lämnar området. Eldanimation och rörelse ska fungera även på mobil. Eventuella skador eller ytterligare spelregler bestäms senare; de ingår inte som uttryckligt krav här.

## Trollet vid stenen nordväst om rondellen

- [x] **TROLL-01: Placering och interaktion.** Lägg ett troll på den befintliga stenen nordväst om rondellen, med transparent pixelgrafik från den godkända referensbilden. Trollet ska vara lite större än Lage, synas i huvudkartan och gå att hälsa på till fots; placeringen ska inte ändra den befintliga gång- eller bilkollisionen.
- [ ] **TROLL-02: Bajskastnings-minispel.** Bygg ett separat minispel där Lage kastar bajs på trollet. Återanvänd trollets fasta världspunkt och ingången `window.RimforsaTrollMinigame.start({troll,player,returnToMap})`. Kaststyrning, poäng, grafik, ljud och återgång till huvudkartan är **ännu inte implementerade**. Behåll dessa som ett eget framtida utvecklingsarbete.

## Att göra – nya minispel

### ICA-affären
- [ ] **ICA-01: Glassköp.** Använd insamlade pengar för att **köpa glass av en ICA-personal**. Spelaren ska kunna välja mellan **päronglass** och **vaniljglass**.

### Pizzeria / Bella Donna
- [ ] **PIZ-01: Pizza.** Låt spelaren **köpa en pizzaslice med ananas på**, betald med insamlade pengar.

### Förskolan
- [ ] **FÖR-01: Rutschkana.** Skapa ett rutschkane-minispel där Lage **åker nerför rutschkanan**. **Ju längre spelaren håller knappen nedtryckt, desto längre flyger Lage**.
- [ ] **FÖR-02: Andra barn.** Lägg till **andra barn** i förskolemiljön.
- [ ] **FÖR-03: Utomhusljud.** Lägg till **barnambient ljud** i förskolans utomhusmiljö.

### Åsundabadet
- [ ] **BAD-01: Simning och dykning.** Lägg till ett **2D-simspel med sidovy där man ser ner i vattendjupet**. Spelaren ska kunna **trycka på en knapp för att simma nedåt** och **hitta pengar på botten**.
- [ ] **BAD-02: Hajar.** Lägg till **hajar som simmar förbi**. Om Lage **nuddar en haj förlorar han ett hjärta**.
- [ ] **BAD-03: Vågskvalp.** Lägg till **vågskvalpsljud i bakgrunden** vid Åsundabadet.

## Långsiktig, återkommande världsexpansion – efter övriga uppgifter

- [ ] **KARTA-01: Utöka Rimforsakartan till mer av Kindabygden.** **Sök och jämför verkliga kartor över Rimforsa och närområdet i Kinda** för att skapa en allt större, geografiskt igenkännbar pixelvärld med orter, vägar, skog, sjöar, broar, byggnader och utflyktsmål som ansluter till den nuvarande kartan. Dokumentera vilka geografiska detaljer som är bekräftade från kartkällor och vilka som är fria speltolkningar. Bevara samma 16-bitarsgrafik, spelkänsla och befintliga platser.

  **Arbetsprincip:** Denna punkt är **lågprioriterad tills övriga konkreta uppgifter är klara**. Därefter är den ett **öppet, nästan obegränsat fortsättningsarbete** för kommande `jobb lage`-pass: utöka en sammanhängande region åt gången, återkom till punkten upprepade gånger och markera den inte slutligt färdig bara för att en enskild utbyggnad publicerats. Planera kartladdning, gångbarhet, bilens vattenmask, minikarta, NPC-rutter och myntplacering så att världens storlek kan växa utan att befintliga sparade framsteg förstörs. Använd geografiska källor som får användas och dokumentera källor/licenser innan kartmaterial anpassas.

## Gemensamma tekniska hänsyn (förslag för genomförandet, inte ytterligare användarkrav)

- **Ekonomi:** Låt myntplånboken som används till ICA och pizzerian ha en tydlig koppling till insamlade mynt. Samordna avdrag och återställning av mynt när hjärtan tar slut; undvik att räkna samma mynt två gånger.
- **Ljud i webbläsaren:** Mobilwebbläsare kräver normalt en användargest innan ljud får starta. Starta ljud efter en faktisk spel-/knappinteraktion, och stoppa eller byt ljud vid miljöbyte. Använd originalskapade eller rättighetsklarerade ljud och musik.
- **Kollisioner:** Bevara hinderreglerna i gångläget, förutom den uttryckliga förändringen för bilen (alla terränger utom vatten). Se till att en kollision inte tar flera hjärtan omedelbart genom samma kontakt.
- **Trygg och begriplig barnupplevelse:** Gör köp, hjärtförlust, myntförlust och omstart tydliga och lätta att förstå. Håll styrning och ljudnivå lämpliga för mobil.
- **Verifiering:** Lägg till tester för respektive uppgift, spela igenom huvudflödet och kontrollera samma publicerade URL. Redovisa separat om fysisk iPhone/Safari inte har testats.

## Arbetslogg
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
