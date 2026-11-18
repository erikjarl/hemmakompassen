# Lage i Rimforsa – att-göra-lista och arbetsordning

**Projekt:** `erikjarl/hemmakompassen`  
**Spel:** `spel/rimforsa/index.html`  
**Publicerad adress:** https://erikjarl.github.io/hemmakompassen/spel/rimforsa/  
**Senast uppdaterad:** 2026-11-18  
**Status:** Fem uppgifter är implementerade och verifierade med automatiserade tester: fyra ljuduppgifter och den vita bilen. Övriga önskemål är öppna; markera bara av punkter när funktionen är implementerad och testad.

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
- [ ] **HUV-04: Bajskorvar.** Lägg till **bajskorvar** som hinder. Lage **förlorar ett hjärta** när han kommer i kontakt med en bajskorv.
- [ ] **HUV-05: Hjärtan och omstart.** När **alla hjärtan försvinner** ska spelet **börja om**, och spelaren ska **förlora alla insamlade mynt**.

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

## Gemensamma tekniska hänsyn (förslag för genomförandet, inte ytterligare användarkrav)

- **Ekonomi:** Låt myntplånboken som används till ICA och pizzerian ha en tydlig koppling till insamlade mynt. Samordna avdrag och återställning av mynt när hjärtan tar slut; undvik att räkna samma mynt två gånger.
- **Ljud i webbläsaren:** Mobilwebbläsare kräver normalt en användargest innan ljud får starta. Starta ljud efter en faktisk spel-/knappinteraktion, och stoppa eller byt ljud vid miljöbyte. Använd originalskapade eller rättighetsklarerade ljud och musik.
- **Kollisioner:** Bevara hinderreglerna i gångläget, förutom den uttryckliga förändringen för bilen (alla terränger utom vatten). Se till att en kollision inte tar flera hjärtan omedelbart genom samma kontakt.
- **Trygg och begriplig barnupplevelse:** Gör köp, hjärtförlust, myntförlust och omstart tydliga och lätta att förstå. Håll styrning och ljudnivå lämpliga för mobil.
- **Verifiering:** Lägg till tester för respektive uppgift, spela igenom huvudflödet och kontrollera samma publicerade URL. Redovisa separat om fysisk iPhone/Safari inte har testats.

## Arbetslogg

- **2026-11-18 – Jobb lage / HUV-03 vit bil vid Hem:** Implementerat i `spel/rimforsa/index.html`, `spel/rimforsa/car.js`, `spel/rimforsa/car-water-mask.png` och `spel/rimforsa/audio.js`: parkerad vit bil vid Ulrikavägen, **Kör bilen**-knapp vid bilen, Lage synlig i bilen, styrning via samma pilar/WASD, körning över alla landytor med särskild bildbaserad vattenmask som stoppar sjön, **Gå ur bilen** när en gångbar yta finns i närheten, separat hastighetsstyrt motorljud som respekterar ljudinställningen, samt återställning vid ny omgång. Avstigning från helt otillgänglig terräng visar instruktion att hitta en väg. GitHub-commit [8ae4c4a](https://github.com/erikjarl/hemmakompassen/commit/8ae4c4a243fee842a213390cfa6d14b9f46b01b3) och rättning [c7687da](https://github.com/erikjarl/hemmakompassen/commit/c7687da7f5a910463a9c2eee0029f2aac9b2b534). **Verifierat:** funktionella Node-tester om kollisionsmask, diagonal rörelse, förflyttning mot vattenkant, ljudlogik och kodintegration godkända i GitHub Actions; assetkontroll på Pages godkänd. **Återstår att kontrollera:** fullständig Chromium-browser smoke-körning och slutlig Pages-byggstatus (pågående vid loggskrivning), körkänsla, faktisk interaktion och ljud på fysisk iPhone/Safari. Nästa öppna uppgifter HUV-04 (bajskorvar) och HUV-05 (hjärtan/omstart).

- **2026-11-18 – Jobb lage / ljudpass:** Implementerat **BÅT-01, BÅT-02, HUV-01 och HUV-02** i `spel/rimforsa/audio.js` och kopplat till spelet. Ljuden är originalsyntetiserade i Web Audio API: mjukt vågbrus, syntetiserade fiskmåsläten, båtmotor med hastighetsberoende pitch/volym, myntklirr och egenkomponerad lugn 16-bitarsmelodi. Ljud startar först när spelaren aktiverar **Ljud på** (även tillgängligt i båtspelet); ljuden byts när man går in i/ut ur båtminispelet, stoppas när ljudet stängs av och pausas när sidan döljs. Versionsstyrd fil `audio.js?v=1`. Kod-commit: [`3737cbb`](https://github.com/erikjarl/hemmakompassen/commit/3737cbb4d9e25155f49510e3d822490851ed808a). **Verifierat:** GitHub Actions funktionella och backendtester slutförda med success; Pages-build och kontroll av serverade resurser rapporterade success. Full Chromium-smoketest var fortfarande under körning när denna arbetslogg uppdaterades. **Ej verifierat:** faktiskt ljud på fysisk iPhone/Safari, hur naturtroget fågel- och vågljudet upplevs eller den estetiska kvaliteten på musiken. Nästa uppgifter: HUV-03 (vit bil), HUV-04 (bajskorvar) och HUV-05 (hjärtan/omstart).

- **2026-11-18:** Att-göra-listan och `jobb lage`-fullmakten dokumenterades i projektet. Ingen av ovanstående nya funktioner markeras som implementerad enbart för att listan skapats.
