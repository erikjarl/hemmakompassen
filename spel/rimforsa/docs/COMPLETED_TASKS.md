# Lage i Rimforsa – färdiga uppgifter (arkiv)

**Statuskälla:** [ROADMAP.md](../ROADMAP.md). Detta arkiv innehåller **50 avbockade uppgifter** som har tagits bort ur den aktiva att-göra-listan (senast 27 november 2026). Här behålls de som historik, inte som nya arbetsuppgifter.

**Viktig avgränsning:** En del punkter är avbockade efter kodgranskning, inte fysiska mobiltester. Om ett dokumenterat acceptansvillkor visar sig saknas öppnas uppgiften på nytt i `ROADMAP.md`. Grafikstandard och separat kvalitetsarbete gäller fortfarande.

## Avslutade uppgifter (50)

- [x] **NPC-BOBA – Boba på avskild blomsteräng.** · 2026-11-27 – NPC-BOBA: bildbaserad tvåvingad Boba på 44×44 px (samma som Lage), avskild väster om väg 23. Minst 190 kartpixlar från samtliga listade event, vandring, svävning och ofarliga isbollar. 6 000 simulerade uppdateringar och 600 renderingsanrop godkända med testmask; riktig kartbild och mask granskade, ingen visuell spelning. Pages ej bekräftad. Aktiv kö tom efter kodleverans.

- [x] **NPC-SLOBIDO – Slobido vid Åsundabadet.** · 2026-11-27: Bildbaserade 16-bitars bildrutor från genererat karaktärsblad. Vandrar på tillåtna kartpixlar 180–310 px från dykpunkten; inget samtals- eller skadehinder. 88 px bildhöjd jämfört med Lages 44 px. Växlar mellan hopp och laserögon med 10–20 s pauser. 6 000 simulerade uppdateringar och 600 renderingsanrop med testmask; verklig gångbarhetsmask kontrollerad vid startpunkten; visuell webbläsarkarta ej verifierad.

- [x] **DRAKE-03 – Drakstridens ljud och säkra eldbollar (nya kraven 26 november).** · [Krav](TASK_DETAILS.md#drake-03--drakstridens-ljud-och-säkra-eldbollar) · Isbollsljud, träffljud och närhetsmusik integrerade. Flygande helikopter kan beskjutas och träffas nära draken; synlig rök före nödlandning. Kartbaserad bilvägsgeometri med marginal skyddas utöver tidigare kartgranskad polygon. Isolerade modul- och nödlandningstester godkända; ingen ny fysisk webbläsarspelning.

- [x] **SKATT-01 – Växande skatt vid hemmet.** · [Krav](TASK_DETAILS.md#skatt-01--växande-skatt-vid-hemmet) · 2026-11-26: gemensamt HUD-saldo, individuella första mynt, växande hög och myntförankrat glitter; flyttad från väg/huskant till gräsyta norr om bilen med stöd av användarens skärmbild. Renderingsfunktion och saldouppdatering testade med simulerade plånbokssaldon 0–1000 inklusive köp och återställning. Ingen ny livebild eller fysisk mobiltestning.

- [x] **DRAKE-03 – Drakens avgränsade farozon i sydväst.** · [Krav](TASK_DETAILS.md#drake-03--drakens-avgränsade-farozon-i-sydväst) · 2026-11-26: tidigare kartgranskad skogspolygon; marginal vid avfyrning och hela projektilbanan, kontroll av stillastående och rörliga mål. 7 200 simulerade uppdateringar, 1 333 projektilpositioner, 392 träffprov inom skogen och inga träffar på testade skyddade målpunkter. Visuell webbläsarkontroll ej utförd.

- [x] **SPORT-02 – Fotboll: förhindra fastnad rörelseriktning.** · [Krav](TASK_DETAILS.md#sport-02--fotboll-förhindra-fastnad-rörelseriktning) · 2026-11-26: individuella pek- och tangentidentiteter, globala släpp/avbrott och återställning vid fokusförlust, döljning och omstart; 2 000 simulerade styrsekvenser godkända. Faktisk mobiltestning ej utförd.

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


- [x] **HUV-06 – Tydligare bajskorvar utan större sprite.** · [Detaljer](TASK_DETAILS.md#huv-06) · 25 november: befintlig kontrastgrafik verifierad genom kodgranskning och 16 simulerade renderingsfall med olika avstånd, faser och rörelseinställningar; 23×26 px och 19 px skaderadie kvar. Fysisk visuell kontroll ej utförd.
- [x] **NPC-02 – Bildbaserade Saga och Oliver.** · [Detaljer](TASK_DETAILS.md#npc-02) · 25 november: separat bildgenererat 96×96 PNG-ark, två rader med tre 32×48-riktningar, laddning före NPC-modul och faktisk drawImage-integration inklusive speglad sidovy verifierade i källkod. Mobil bildgranskning kvar i GRAF-01.


### Kodrevision 25 november 2026

- [x] **SPORT-01 – Fotboll med Maja i Hackelhallen.** · [Krav](docs/TASK_DETAILS.md#sport-01) · Spelbar hall, Maja som målvakt, boll, riktade skott, mål/poäng, pek- och tangentstyrning samt återgång verifierade i källkod. Bonusarnas sparfel hanteras separat i MYNT-03.
- [x] **DRAKE-02 – Farlig drake och helikopterträffar.** · [Krav](docs/TASK_DETAILS.md#drake-02) · Kontakt, riktade eldklot, helikopterträffar och skadepaus verifierade i källkod; simulerad drakkontakt och projektilträff på båda mål godkända. Mackgräns och avbruten varning kontrollerade tidigare.
- [x] **HUV-05 – Förlora alla mynt när sista hjärtat tar slut.** · [Krav](docs/TASK_DETAILS.md#huv-05) · Samtliga tre myntkällor nollställs vid sista hjärtat, sparresultat kontrolleras, ny omgång startas och andra flikar signaleras. Kodgranskning och tidigare isolerade återbetalningstester; exceptionella lagrings-/samtidighetsproblem hanteras i MYNT-03.
- [x] **KARTA-02 – Bredare gångbara vägar och åtkomst.** · [Krav](docs/TASK_DETAILS.md#karta-02) · Smalare fotprover, vägkantsstyrning, hinderkontrollerad rutt och gångkorridor vid Åsundabadet verifierade i kod; ingen generell öppning av hinder.
- [x] **LJUD-03 – Fler och välavvägda händelseljud.** · [Krav](docs/TASK_DETAILS.md#ljud-03) · Många originalsyntetiserade effekter för spelhändelser, inklusive bränsle, köp, fotboll och scenbyte, verifierade i kod.
- [x] **HELI-01 – Bildbaserad helikopter.** · Originalbilden 92×54 är inbäddad i GitHub-koden, laddas och används i drawImage med speglad riktning; flyganimation och ytterligare riktningar hanteras i HELI-02.
- [x] **NPC-03 – Personer på avstånd från affärer och minispel.** · 85 px skyddszon används vid placering och rörelse; 25 000 simulerade steg med syntetiskt gångbar terräng och fem omstarter godkända, minsta avstånd 85,0009 px.
- [x] **GRAF-02 – Trollminispelets grafiska enhetlighet.** · [Krav](docs/TASK_DETAILS.md#graf-02) · Trollscenen använder gemensamma Lage- och trollbilder, detaljerad skog och träffeffekter med bevarad kastmekanik och styrning. Kodgranskad, ytterligare grafisk harmonisering ingår i GRAF-01.
- [x] **LJUD-04 – Bättre pruttljud.** · [Krav](docs/TASK_DETAILS.md#ljud-04) · Separat 0,44 sekunder lång syntetiserad prutteffekt med fallande sågtandsfrekvens, filtrerat brus och rytmisk amplitud, kopplad till bajskorvsträff. Källkodsbedömning, ej fysisk hörselkontroll.

- [x] **HUV-07 – Hoppa över bajskorvar och mindre hinder.** · [Detaljer](TASK_DETAILS.md#huv-07) · Hoppknapp/mellanslag, hoppbåge, luftfasens skydd mot bajskorvar, återhämtning och ordinarie terrängmask. Syntax och isolerad hoppcykel verifierade; fysisk mobiltestning ej utförd.

- [x] **KARTA-03 – Fri gångpassage öster om macken.** · [Detaljer](TASK_DETAILS.md#karta-03) · Kartbild och binär gångmask visuellt granskade; smal korridor från parkeringen till väg 23 tillagd i gemensam gångmask. Syntaxkontroll godkänd; fysisk genomspelning ej utförd.

- [x] **FORDON-03 – Bilen bara på bilvägarna.** · [Detaljer](TASK_DETAILS.md#fordon-03) · Kartbildsbaserade körkorridorer med vägkantstolerans, infarter, parkeringszoner och oförändrad vattenkontroll. Isolerade väg-, terräng-, rörelse- och vattentester godkända. Fysisk genomspelning ej utförd.

- [x] **FORDON-02 – Samstämmiga bil- och båtvyer.** · [Detaljer](TASK_DETAILS.md#fordon-02) · Faktiskt 640×60-bilbildark visuellt granskat sida vid sida: åtta vyer med samstämmig vit kaross, tak, mörka rutor och ljus; ingen tydlig tidigare rapporterad modellskillnad kvar. Bilens rendering väljer samma ark i åtta riktningar; båtens åtta separat cachade canvasvyer bygger på samma skrov och palett. Fysisk mobilvisning och ny bildgenerering ej utförda; båtens vyer är kodritade bildytor, inte nya externa sprites.

- [x] **LJUD-SAFARI** – WebKit touch, framåtgående ljudklocka, återställning efter avbrott, sparat mute godkända i [CI 46006401346](https://github.com/erikjarl/hemmakompassen/actions/runs/46006401346). Fysisk iOS separat; stående ljudgrind kvar.
