# Hemmakompassen — utvecklingsplan (2026-10-17)

## Arbetsrutin: GitHub-commits och publicering (uppdaterad 22 oktober 2026)

- Ändra aldrig `main` automatiskt. Fortsätt från senaste HEAD på `ai-dev/utveckling`, samla arbetet i samma samlings-PR och invänta uttryckligt godkännande före merge/publicering.
- Använd den anslutna GitHub-tjänsten via `functions.exec`. Kontrollera vid varje körning att skrivfunktionerna faktiskt är anropbara, t.ex. `typeof tools.mcp__GitHub__update_file === "function"`; att en funktion finns i verktygslistan räcker inte som verifiering.
- Om ett anrop ger `TypeError: ... is not a function`, kontrollera tillgängligheten på nytt i en **ny** `functions.exec`-körning och försök igen efter att ha hämtat aktuell fil och blob-SHA. Felet har tidigare varit tillfälligt. Påstå inte att behörigheten saknas utan ett faktiskt GitHub-svar.
- Före ändring: hämta senaste `main`, relevant fil och dess blob-SHA. Gör en liten, avgränsad ändring. Kör tillgängliga lokala tester och syntax-/strukturkontroller. Redovisa tydligt om fullständiga tester inte kunde köras.
- För en enda textfil kan `mcp__GitHub__update_file` användas med `branch:"ai-dev/utveckling"` och aktuell blob-SHA. För flera filer: använd GitHub-träd och commit med aktuell parent och uppdatera endast utvecklingsbranchen med `update_ref`, `expected_sha` och utan force-push. Vid konflikt: läs om branchen, granska diff och testa igen; skriv aldrig över andras ändringar.
- Efter skrivning: verifiera committen på `ai-dev/utveckling`, kontrollera samlings-PR, GitHub Actions och Playwright-artifact. Publicering sker först efter separat godkänd merge.
- Vid kvarstående fel: spara inte påhittad status, skilj verktygsfel från GitHub-behörighetsfel och rapportera exakt vad som fungerade och inte fungerade. Ändra inte säkerhets- eller dataskyddsgränser för att få en push att lyckas.

## 21 oktober 2026 – Utökad allmän kortlek

- [x] Behåll de 14 ursprungliga kortens ordning så att sparade lokala demosvar inte flyttas till fel fråga.
- [x] Lägg till 20 kort om tillit, självständighet, samtal, konflikter, känslor, vardag, digital vardag, gemenskap och uppskattning (34 kort totalt).
- [ ] Användartesta begriplighet, upplevd trygghet, ordval och faktisk tidsåtgång med både tonåringar och föräldrar. Målet 10–15 minuter är ännu inte verifierat.
- [ ] Se över svarsalternativen för påståenden som handlar om önskemål respektive nuläge, och granska resultatlogiken innan liveanvändning.

## 21 oktober 2026 – Mobilnavigering, synlig scrollning

- [x] CSS: visa en diskret horisontell scrollindikator i mobilmenyn i stället för att dölja scrollbaren; förbättra scroll-snap och tillåt etiketter på flera rader.
- [ ] Bekräfta i ny Playwright-körning att mobilmenyn inte kapar etiketter och att scrollindikatorn syns i mobilens verkliga skärmbilder. Justera vid behov efter visuell granskning.

## 19 oktober 2026 – Automatisk testning och bildgranskning

- [x] Bekräftat att Github Actions-artifact med sju Playwright-PNG kan laddas ned via ansluten GitHub-tjänst och öppnas som verkliga bilder i arbetsmiljön.
- [x] Inspekterat mobil och desktop: mörkt responsivt tema fungerar; tidigare skärmbilder visade den fokuserbara "Hoppa till huvudinnehållet"-länken och en tillfällig demoavisering ovanpå innehåll. Det kan vara ett screenshot-tillstånd (fokus/scroll), inte nödvändigtvis ett permanent produktionsfel.
- [x] Förbättrat Playwright för stabila skärmbilder: återställ scroll, släpp tangentbordsfokus, invänta toast; testa att skip-länken är dold utan fokus. Skapa även visual-audit.json i screenshot-artifact.
- [ ] Bekräfta ny GitHub Actions-körning för den här förbättringen, granska nya mobil-/datorbilder och åtgärda eventuella fel.
- [ ] Fortsätt visuell kvalitetsgranskning i de schemalagda utvecklings- och dagsrapportkörningarna. Kontrollera den verkliga bilden, inte bara grön CI-status.
- [x] 2026-10-22: Uppdaterat det föråldrade Playwright-flödet från borttagen demoonboarding till riktig inloggningsvy och syntetiskt, mockat inloggat läge. Ingen riktig användare eller backenddata används i CI.
- [ ] Granska nya PNG-bilder och `visual-audit.json` från samlings-PR:ns första CI-körning; lokal Chromium-installation blockerades av en avhuggen nedladdning.

## Påbörjat 18 oktober 2026 – Fas 1A (utan backend)

- [x] Ny introduktionssida för en besökare utan demoprofil.
- [x] Två valbara demoperspektiv: förälder och tonåring, med egna välkomsttexter.
- [x] Visuellt familjekopplingsflöde med tre steg och preliminär information om datadelning.
- [x] Demonstrationsläge tydligt märkt: inga riktiga konton, familjekoder, fjärrkopplingar eller AI.
- [x] Enkel automatisk testfil med Node.js inbyggda testverktyg.
- [ ] Fortsätt dela upp JavaScript i moduler och förbered separerat mock-/backend-lager.
- [ ] Bygg autentiserings- och familjekopplingsskärmarna med tydliga fel- och väntelägen. 2026-10-23: kontosidan visar nu både inbjudan och kodanslutning för en användare som redan har startat en tom enfamilj; manuell browser- och riktig backendverifiering återstår efter godkänd migration.
- [ ] Finputsning av samtliga roller, skärmar och tillgänglighetskontroller.
- [x] 2026-10-19: Tillgänglighet: tangentbordslänk till huvudinnehållet, fokus till huvudregionen vid navigering och kompletterande Node-/Playwright-tester.
- [ ] Återstår: bredare granskning av skärmläsare, formulär och kontraster.

**Fas 0:** Genomarbetad dataskyddspolicy, validerat testinstrument, användarvillkor och klinisk riskgranskning behövs *före* live-backend med verkliga uppgifter, men blockerar inte frontendutveckling med syntetiska demodata.


**Status:** E-post/lösenordsautentisering och ett första Supabase-schema finns på `main`. Full datalagring, komplett RLS-verifiering, säker datadelning och AI-anslutning återstår.

**Mål:** Ett familjepar (förälder + tonåring) ska kunna skapa två separata konton, kopplas med familjekod, använda swajpen och personlighetstestet, dela överenskomna uppgifter, skicka meddelanden och prata var för sig med en privat AI-medlare som kan använda endast tillåtna, gemensamma uppgifter.

**Arbetssätt:** Följ faserna i ordning. Märkning: **[A] Assistenten** kan göra uppgiften (med GitHubåtkomst och nödvändiga verktyg); **[E] Erik** måste fatta ett beslut, skaffa konto, godkänna något eller ge konfiguration; **[B] Båda**. `BLOCKERAR` markerar ett villkor som måste vara uppfyllt för nästa beroende fas.


## Produktvision och prioriterad funktionskö (20 oktober 2026)

**Ansvar:** Assistenten ansvarar för att skapa innehåll, skriva kod, tester, UI-texter och dokumentation och föra uppgifterna framåt. Projektägaren bidrar med idéer, granskar avgörande psykologiska/produktmässiga vägval och gör endast sådant som kräver dennes behörighet eller beslut. Alla nedanstående punkter är planerade, inte redan implementerade. Frontenddemo med syntetiska data kan byggas före säker backend.

### P1 – Gillaswajpen: gemensamma insikter


#### Produktbeslut: endast ömsesidiga JA delas (24 oktober 2026)

**Bindande regel för all fortsatt utveckling:** Gillaswajpens gemensamma resultat får **enbart visa kort där exakt två sammankopplade familjemedlemmar båda har svarat JA (`answer = true`) på samma kort**.

- **JA + JA:** visas som ett gemensamt bejakat kort och får användas i behöriga, försiktigt formulerade gemensamma sammanfattningar.
- **NEJ + NEJ:** **visas inte** (inte heller i en separat kategori, resultatlista, räknare eller sammanfattning).
- **JA + NEJ, NEJ + JA eller enbart ett svar:** **visas inte**. Inget individuellt svar eller den andras val får avslöjas.
- Den egna privata svarshistoriken förblir synlig och ändringsbar **endast för den inloggade användaren**. Den är inte en gemensam resultatvy.
- Kontrollera båda JA **på serversidan via autentiserad RPC**; frontend filtrerar dessutom defensivt till `answer === true`. Visa inget gammalt eller osäkert resultat om RPC-anropet misslyckas eller session/familj byts.
- Regeln omfattar **allmänna kortleken, samtliga temakortlekar, sparade gemensamma resultat, sammanfattningar, Schyssta listan-förslag och eventuell AI-medlarkontext**. Ett gemensamt JA är fortfarande bara ett förslag/samtalsämne, inte en bindande överenskommelse.
- **Teknisk status 2026-10-24:** JA+JA-klienten och dess granskade SQL-migration mergades i PR #20. Frontendkoden är publicerad och filtrerar defensivt till JA+JA; migrationen är **ännu ej applicerad** i befintlig Supabase-backend. Fram till godkänd migration kan databasen fortfarande returnera `false`, men frontend ignorerar det. Tidigare beslut om att visa två NEJ är **ersatt**; historiska omnämnanden längre ned beskriver en äldre implementation.

#### Nytt bindande produktbeslut – korttyper och delning (24 oktober 2026)

**Två korttyper:** **A Matchningskort** och **B Förståelsekort**. Detta beslut ersätter den tidigare generella regeln att alla delade kort kräver JA+JA: JA+JA gäller fortsatt strikt för **A**, medan **B** delas enbart efter tonåringens eget JA. B-kort ska aldrig räknas som matchningar eller automatiskt bli gemensamma överenskommelser. Inga NEJ eller obesvarade kort delas.

- **A – Matchningskort:** Samma förslag till båda (t.ex. aktiviteter, regler, samtalsämnen). Endast verifierat JA+JA från exakt två parade konton får visas gemensamt. Samma serverkontroll och integritetsspärrar som tidigare.
- **B – Förståelsekort:** Tonåringscentrerade påståenden om upplevelser, behov, känslor och relation. Kortet visas normalt **enbart för tonåringen**; föräldern ska inte behöva ta ställning till om tonåringens upplevelse är sann. **JA betyder både ”det stämmer/jag vill lyfta detta” och uttryckligt godkännande att dela med parad förälder.** Text vid kortlekens start och på kortet måste göra detta mycket tydligt *innan* första JA. **NEJ förblir privat.** En diskret **ofylld knapp ”Vill inte svara just nu”** på varje kort hoppar över utan JA/NEJ eller delning; kortet ska kunna återbesökas senare. Skilj obesvarat/överhoppat från NEJ och från slutfört.
- **Rollanpassad formulering:** Ett B-kort kan ha en tonåringstext och en separat, saklig föräldravisning. Föräldravisningen får inte lägga till tolkningar, behov eller påståenden som tonåringen inte bejakat. Tonåringen ska kunna förhandsgranska vad som delas; ett aktivt JA är delningsbeslutet, inte en extra delningsdialog. Föräldern kan bekräfta att hen läst, men inte rösta om tonåringens upplevelse.
- **Återkallelse:** Tonåringen ska kunna ändra JA till NEJ eller ”vill inte svara”, varpå B-kortet omedelbart tas bort ur framtida delade vyer och genererade sammanfattningar. Historiskt redan läst information kan inte göras ogjord; förklara detta begripligt.
- **Integritet och teknik:** Utöka datamodell/RPC så att A:s JA+JA och B:s tonårings-JA är två *separata, serververifierade* behöriga resultatslag. Kräv aktiv parning, autentisering och korrekt roll, isolera familjer, bevara self-only RLS på privata svar. Servern ska aldrig lämna ut B-NEJ, överhoppade B-kort, motpartens privata svar eller svar från andra familjer. Vid fel, avparning eller sessionsbyte dölj resultat. Ingen extern AI får se privata svar.
- **Sammanfattningar:** Separata föräldra- och tonåringsvyer. Dela upp i ”Det här vill ni båda” (endast A JA+JA) och ”Det här vill tonåringen att föräldern ska förstå” (endast B JA). Föräldravyn ger varsamma samtalsöppningar och lyssnande förhållningssätt utan diagnostiska tolkningar eller att tillskriva tonåringen motiv. Tonåringsvyn återger egna delade behov och gemensamma möjligheter utan att exponera förälderns enskilda svar. Regelbaserad version först; AI först efter särskild integritets- och kvalitetsgranskning.
- **Upplåsning:** Revidera den planerade 34-korts-RPC:n så att B-kort som aktivt hoppats över inte tvingar fram känsliga svar. Definiera ”genomgången” som att användaren gått igenom alla aktuella relevanta kort (besvarat eller hoppat över), utan att röja vad den andre valt. Migrera befintliga svar/ID:n varsamt; installera inte den gamla hårdkodade 34-kortsmigrationen utan ny granskning.

#### Prioriterad implementeringsplan – korttyper A/B

- [ ] **16. Inventera och klassificera befintliga kort.** Granska samtliga 34 allmänna och sex temakortlekar: A eller B, målroll, språk, svarstyp och psykologisk lämplighet. Flytta B-kort från förälderns kortlek. Dokumentera kort som behöver skrivas om, särskilt tvetydiga formuleringar. Behåll stabila ID:n eller skapa kontrollerad mappning utan att gamla JA byter betydelse eller oavsiktligt börjar delas.
  - **Påbörjat 2026-10-25:** En central, versionssatt katalog inventerar nu alla 34 allmänna kort och samtliga 52 befintliga kort i de sex temakortlekarna. Tretton allmänna kort är klassificerade som tonåringsstyrda B-förståelsekort (användargranskade och godkända 2026-10-25: general-02, -03, -04, -05, -06, -07, -09, -12, -14, -15, -18, -19 och -27); övriga allmänna kort och alla nuvarande temakort är A-matchningskort. Befintliga ID:n och ordning är oförändrade, så sparade svar byter inte betydelse. Automatisk testning låser inventeringen. **Inte färdig:** rollfiltrering, överhoppning och delning av B-kort är ännu inte aktiverade; ingen tidigare privat data har omklassificerats eller delats.
  - **Eriks innehållsgranskning klar 2026-10-25:** Samtliga 13 föreslagna B-kort (general-02, -03, -04, -05, -06, -07, -09, -12, -14, -15, -18, -19, -27) godkändes som B utan ändringsönskemål. Befintliga sakliga föräldraformuleringar behålls, inklusive upplevelsebaserat språk där det är relevant. Detta är ett redaktionellt godkännande, inte psykologisk validering eller tillstånd att aktivera delning. **Aktivering av B-delning avvaktar separat säker backend, RLS och testning; inga historiska svar får automatiskt delas.**
- [ ] **17. Fastställ kortmodell och innehåll.** Inför metadata `type: match|understanding`, `audience`, `teenText`, `parentSharedText`, kategori, stabilt ID och versionshantering. Skriv och kvalitetssäkra fler relevanta kort, särskilt aktiviteter och samtalsämnen. Säkerställ att B:s JA-text tydligt anger delning och att föräldratexten inte överdriver eller omtolkar.
  - **Påbörjat 2026-10-25:** `card-catalog.js` inför metadatafälten ovan och liveappen läser samma stabila ID:n och texter via katalogen. B-korten har separata, sakliga föräldraformuleringar; dessa används ännu inte i någon delad vy. Produktionsbygget inkluderar katalogen. **Verifierat:** 23/23 Node-tester samt GitHub Actions/Playwright run 40176865164 är gröna; nio faktiska PNG-bilder och `visual-audit.json` granskades utan ny visuell regression eller browserfel. Den sedan tidigare avhuggna horisontella mobilnavigationen och dess överlappning kvarstår som separat UX-brist. Återstår: slutlig språkgranskning, nya kort och den rollstyrda presentationen i punkt 18.
- [ ] **18. Bygg två swajpflöden med överhoppning.** A: två JA/NEJ-svar. B: tonåringens JA=delas, NEJ=privat, ofylld knapp ”Vill inte svara just nu”=ej besvarat/ej delat. Visa integritetsförklaring före JA; stöd återupptagning, återbesök, ändring och mobil/tangentbord/skärmläsare. Föräldern får inga B-frågor att swajpa på.
  - **Utvecklingspass 2026-10-25:** Den tidigare B-överhoppningshanteraren saknade synlig knapp; en diskret, ofylld ”Vill inte svara just nu”-knapp har nu lagts till endast på tonåringens B-kort. B-kort märks uttryckligen som *ännu inte delade*; historiska svar får aldrig delas automatiskt. Den föräldraspecifika kortpositionen räknas inom 21 synliga A-kort i stället för att felaktigt visa t.ex. 8 av 21 som kort nummer två. Avslutningsvyn skiljer sparade svar från överhoppade kort. Playwright-tester tillagda och godkända i run 40191568526; faktisk mobil-PNG för tonåringens B-kort granskad. Överhoppning är fortfarande sessionslokal och B-delning fortfarande avstängd tills säker backend finns.
  - **Påbörjat 2026-10-25 (utvecklingsbranch):** Liveappen filtrerar B-förståelsekort från förälderns allmänna kortlek och visar dem endast för tonåringsrollen. Tonåringen kan välja ”Vill inte svara just nu” utan att skapa ett JA/NEJ-svar; överhoppning finns bara i sessionens minne och återställs vid omladdning, inte i databasen. Befintliga svar raderas inte. Frontendens gemensamma resultat filtrerar även bort B-kort för att undvika att gamla JA+JA visas som A-matchning. **Inte klart:** klientanslutning till beständig överhoppning, säkra serverkontrollerade B-delningar, produktionsmigration och riktig tvåkontoverifiering. JA på B-kort lagras tills vidare endast som privat svar och får inte delas.
- [ ] **19. Säker backend och datamigration.** Separera svar, överhoppning och delningsbehörighet; skapa/ändra RPC för serverkontrollerade A- och B-resultat, exakt parning och roll, RLS och återkallelse. Revidera upplåsningsvillkoret för blandade A/B och överhoppade kort. Bevara befintliga svar utan automatisk delning vid omklassificering. Säkerhetsgranska och testa SQL; **Behöver Erik – avvaktar:** separat godkännande före installation i befintlig Supabase-databas.
  - **Påbörjat 2026-10-25:** Granskningsbar migration `20261025150000_understanding_card_state.sql` skapar en separat self-only RLS-tabell för privata överhoppningar och en rollkontrollerad, atomär RPC som låter endast tonåringen ersätta eget B-svar med överhoppning eller tvärtom. Den ersätter också det föråldrade 34-svarsvillkoret: båda måste besvara alla 21 A-kort, medan tonåringens 13 B-kort får vara besvarade eller aktivt överhoppade; föräldern behöver aldrig svara på B. Funktionen lämnar endast ut en gemensam boolesk upplåsningsstatus, aldrig svar, överhoppningar, identiteter eller individuell progress. **Inte installerad i produktion och ännu inte ansluten till klienten.**
  - **Behöver Erik – avvaktar efter granskning och gröna SQL-tester:** ge separat uttryckligt godkännande innan `20261025150000_understanding_card_state.sql` installeras i befintlig Supabase. Migrationen ändrar lagring och upplåsningsvillkor men rör inte befintliga svar vid installation.
- [ ] **20. Skapa fullständiga rollanpassade sammanfattningar.** Föräldern: gemensamma A-intressen samt B-upplevelser tonåringen uttryckligen delat, med konkreta, icke-dömande samtalsöppningar. Tonåringen: samma A-matchningar, egna delade B-budskap och förslag på hur samtal kan inledas. Markera tydligt vad som är observation respektive förslag, aldrig diagnostik eller dolda svar. Stöd tomma lägen, ändringar och återkallelser.
- [ ] **21. Integrera med Schyssta listan och framtida AI.** Endast A JA+JA kan föreslå ömsesidiga regler; B-budskap är aldrig överenskommelser. Framtida AI-kontext får enbart innehålla serververifierade A-matchningar och aktuella delade B-budskap efter separat integritetsgranskning.
- [ ] **22. Testa slutprodukten.** Node-/pgTAP-/RLS-/Playwright-tester för A JA+JA, B tonårings-JA, B NEJ, överhoppning, återkallelse, familjeisolering, byte av konto/roll, fel, upplåsning, tillgänglighet och korrekt rollsammanfattning. Granska riktiga skärmbilder och kör därefter manuellt tvåkontotest på publicerad sida efter godkända migreringar. Användartesta begriplighet, frivillighet och risken för oavsiktlig delning med tonåringar och föräldrar.

#### Prioriterad att göra-lista (sparad 24 oktober 2026)

Listan är en samlad arbetsplan för att slutföra Gillaswajpen. Kryssa av först efter verifierad funktion. Ordningen nedan ersätter inte integritets- och säkerhetskraven i övriga ROADMAP.

**Prioritet 1 – Färdigställ grundfunktionen**

- [ ] **1. Verifiera resultaten med två riktiga testkonton.** Testa den publicerade webbsidan med föräldern och tonåringen, att endast deras **3 gemensamma JA** visas utifrån dagens testdata och att de 8 gemensamma NEJ, de 23 olika svaren och alla enskilda svar förblir dolda. Testa också ändrat JA/NEJ, inloggning och utloggning.
  - **Behöver Erik – avvaktar (kontrollerat 2026-10-25):** PR #20 är mergad och frontend publicerad. Ge separat uttryckligt godkännande för att köra SQL-migrationen `20261024130000_shared_swipe_matches_yes_only.sql` i befintligt Supabase-projekt; den behövs för att även backendkontraktet ska sluta returnera gemensamma NEJ. Ingen produktionsmigration körs automatiskt. Den schemalagda webbläsaren kan inte lämna testlösenord genom sitt säkra, interaktiva inloggningsflöde, så efter migrationen behövs antingen ett manuellt resultatprov med båda testkontona eller en separat interaktiv browserkörning. Ändra inte deras sparade svar bara för test utan separat beslut.
  - **Backendstatus 2026-10-25:** Produktionsprojektet listar sex tidigare migrationer, men varken `20261024130000_shared_swipe_matches_yes_only.sql` eller `20261024170000_shared_general_deck_complete.sql`. **Behöver Erik – avvaktar:** separat uttryckligt godkännande efter säkerhetsgranskning för installation av JA+JA-migrationen; den är nödvändig för att också *servern* ska sluta returnera NEJ+NEJ. Tidigare godkännande för upplåsningsmigrationen gäller inte denna migration. Kontrollera därefter båda testkontona i publicerad webbläsare. Ingen produktionsdata ändrad i detta pass.
- [ ] **2. Gör en begriplig gemensam resultatsida – endast JA + JA.** Ta bort avsnittet för gemensamma NEJ och dess antal; gruppera de tillåtna gemensamma JA-korten tematiskt, hantera tomt läge och återläsning, och presentera dem som samtalsöppningar snarare än överenskommelser.
  - **Utvecklingspass 2026-10-25:** Tidigare Playwright-körning 40188404995 föll på föråldrat antagande att föräldern har 34 allmänna kort, trots att 13 B-kort nu är tonåringsspecifika (21 A-kort återstår). Korrigerat förälderns kortnummer och framstegsvy; testet kontrollerar att B-kort hoppas över och att skadligt mockat RPC-svar med B-JA, NEJ och okända ID:n inte visas. **Verifierat:** GitHub Actions run 40191568526 grön (22/22 Node, Playwright grön). Tio faktiska PNG och `visual-audit.json` hämtades och granskades: endast A-JA i resultatvyn, föräldern visas 1/21 och tonåringens ofyllda överhoppningsknapp syns. Ingen browserexception. Den befintliga mobilmenyn kapar fortfarande sista etiketten/har begränsad horisontell navigering. **Detta är mockbaserat test, inte produktionsverifiering.**
  - **Kod klar och syntetiskt testad på `ai-dev/utveckling` (2026-10-24):** `live-app.js` filtrerar defensivt bort allt utom `answer === true`, grupperar tillåtna JA per tema och har bara JA-texter. Den separata RPC-migrationen begränsar resultat på serversidan. **CI grön:** 14/14 pgTAP-assertioner i PostgreSQL 17 (run 40088569225), Node-/Playwright-sviten grön (run 40088569320). Alla sju Playwright-bilder hämtades; `visual-audit.json` har inga browserfel och den faktiska mobila resultatbilden granskades: bara JA-kort visas, temat och uppdateringsknappen är läsbara. Detta är **inte** samma sak som verifierat i produktion; kryssa inte av förrän verklig backend/publicerad sida kontrollerats.
- [ ] **3. Skapa korta, separata sammanfattningar för förälder och tonåring.** Bygg på **enbart gemensamma JA**: identifiera teman, möjliga styrkor, försiktiga hypoteser och konkreta samtalsöppningar. Undvik att påstå något om sådant där svaren är olika eller båda svarat NEJ.
  - **Kod klar och syntetiskt testad på `ai-dev/utveckling` (2026-10-24):** Den inloggades familjeroll väljer en separat föräldra- eller tonåringstext. Observation och samtalsöppning skapas enbart från de redan server- och klientfiltrerade JA+JA-grupperna; inga antaganden görs om övriga svar. Återstår verifiering mot publicerad sida med båda testkontona.
- [ ] **4. Bygg först en tydligt märkt regelbaserad sammanfattning utan AI.** Använd bara ömsesidiga JA och formulera observationer skilt från tolkningar. Inga privata data till en extern modell.
  - **Kod klar och syntetiskt testad på `ai-dev/utveckling` (2026-10-24):** Resultatkortet märks `REGELBASERAD · INTE AI`, skiljer `Observation` från `Samtalsöppning` och anger uttryckligen att NEJ, oenighet och ensidiga svar inte används. Ingen extern modell eller ny datalagring anropas. Återstår riktig tvåkontoverifiering efter merge/publicering.

**Prioritet 2 – Temakortlekar**

- [ ] **5. Lås upp temakortlekar först när båda avslutat allmänna kortleken.** Verifiera bådas slutförande säkert via backend utan att exponera deras svar.
  - **Implementerat på `ai-dev/utveckling` 2026-10-24, CI avvaktas:** Ny additiv SQL-migration `20261024170000_shared_general_deck_complete.sql` returnerar enbart en boolesk upplåsningsstatus för inloggad medlem i en familj med exakt två personer, när båda besvarat samtliga 34 stabila allmänna kort-ID:n. Servern använder inga klientangivna antal, lämnar aldrig ut svar, individuella framsteg eller identiteter och kräver autentisering. Liveklienten visar låsta temakort utan förhandsvisning tills RPC uttryckligen svarar `true`; fel, opålitliga svar och sessionsbyten låser fortsatt. När RPC säger `true` blir de sex temakortens förhandsvisning tillgänglig, men **själva swajpfunktionen återstår (punkt 6)**. PgTAP utökat från 14 till 26 säkerhetstester; Playwright utökat med låst/upplåst/felläge och en ny mobilskärmbild. Verifiera senaste CI innan avbockning.
  - **Behöver Erik – avvaktar:** Efter granskning och merge, godkänn separat att även `20261024170000_shared_general_deck_complete.sql` får köras mot befintlig Supabase-backend. Denna nya migration körs **inte automatiskt** och kan inte antas vara installerad. Förhandsvisning förblir låst tills backend har uppdaterats och verklig tvåkontoverifiering gjorts.

- [ ] **6. Gör alla sex temakortlekar spelbara i liveversionen.** Samtalsämnen, Aktiviteter tillsammans, Regler till Schyssta listan, Sätt att visa uppskattning, Svåra situationer och återhämtning samt Små gemensamma förändringar.
  - **Påbörjat 2026-10-24 i PR #22, syntetiskt testat:** Alla sex kortlekar har fått ett privat JA/NEJ-swajpflöde med samma gester, knappar och tangentbord som den allmänna kortleken. De visas bara efter autentiserad RPC-upplåsning. Historisk förhandsvisning behålls. Ett första försök att uppdatera ett test stoppades av verktygets säkerhetskontroll; därefter anpassades koden för bakåtkompatibilitet och separata Playwright-tester lades till. **CI grön** på commit `d3ae48b` (UI browser smoke tests, run `40119067540`): Node-kontraktstester och Playwright godkända. Testade öppning, JA/NEJ-upsert, stabila kort-id:n, återupptagning och separata kortlekar med syntetisk backend. **Visuellt verifierat:** 9 verkliga PNG från CI hämtade, `visual-audit.json` utan browserfel; mobilens temakortvy granskades och en överlappning mellan bakåtknapp och rubrik korrigerades i `live-app.css`, med ny godkänd körning och granskad bild. **Ej avbockad:** riktig Supabase-verifiering och publicerad tvåkontotest saknas; den serverstyrda upplåsningsmigrationen är ännu inte godkänd/installerad. Inga produktionsdata ändrade.
- [ ] **7. Spara och återuppta varje temakortlek per användare.** Ge möjlighet att fortsätta, ändra egna svar och återvända till tidigare tillåtna resultat.
  - **Påbörjat 2026-10-24, syntetiskt testat:** Temasvar skrivs som separata rader i `swipe_answers` med stabila `deck_id`/`card_id`, återläses privat vid inloggning, kan fortsättas vid första obesvarade kortet och kan granskas/ändras efter genomgång. Playwright verifierar privat JA och NEJ, återupptagning efter återgång till listan samt att en annan temakortlek börjar från första kortet. Återläsning från **verklig** Supabase, ändring efter fullständig genomgång och sessionsbyte kräver ytterligare verifiering. Ingen gemensam temaresulthämtning har införts; JA+JA-kravet är fortsatt absolut.
- [ ] **8. Visa sparade gemensamma resultat och rollanpassade sammanfattningar per kortlek.** Samma **endast JA + JA**-regel ska användas i varje kortlek och vid senare återläsning.

**Prioritet 3 – Koppling till övriga Hemmakompassen**

- [ ] **9. Skapa klickbara Schyssta listan-förslag från ömsesidiga JA.** Regler blir inte överenskommelser förrän **båda uttryckligen har godkänt** dem.
- [ ] **10. Bygg en säker datamodell för AI-medlarens tillåtna kontext.** Endast gemensamma JA och godkända sammanfattningar får användas; privata AI-samtal och övriga swajpsvar får inte läcka mellan konton.
- [ ] **11. Bygg AI-genererade sammanfattningar först efter integritetsgranskning.** Säkerställ dataminimering, behörigheter och kvalitetskontroller; förmedla inga NEJ, oenigheter eller ensidiga svar.

**Prioritet 2 – Innehållsutökning i kortlekarna (tillägg 24 oktober 2026)**

- [ ] **15. Fyll på temakortlekarna med psykologiskt genomtänkta, lättillgängliga kort.** Prioritera särskilt **Aktiviteter tillsammans** och **Samtalsämnen**, med ett stort, varierat urval av konkreta alternativ som både tonåring och vuxen kan säga JA till. Utöka även de fyra övriga temakortlekarna i måttlig omfattning. Assistenten ansvarar för förslag, redaktionell granskning, implementation och tester.
  - **Innehållsprinciper:** Utgå från kunskap om ungdomars autonomi, relationsskapande, ömsesidighet och utvecklingsnivå utan att överdriva evidensen för enskilda kort. Använd vardagligt, icke-terapeutiserande språk som tonåringar förstår; undvik moraliserande, ledande, pinsamma eller alltför privata formuleringar. Erbjud variation i energi, kostnad, tidsåtgång, intressen och social intensitet (inklusive gratis, hemma, ute, digitalt, korta och längre aktiviteter). Samtalsämnen ska rymma både lekfulla, nyfikna och lite djupare frågor med frivillighet och respekt för gränser. JA betyder intresse/förslag, inte löfte eller samtycke till genomförande.
  - **Tekniska krav:** Bevara befintliga stabila kort-ID:n och lagrade svar, tilldela nya unika ID:n, verifiera att alla kort är spelbara och att bara JA+JA kan förekomma i gemensamma resultat, sammanfattningar, Schyssta listan och AI-kontext. Testa begriplighet och rimlig tidsåtgång med faktiska användare innan påståenden om effekt eller användbarhet.
  - **Behöver Erik – avvaktar endast inför verklig användargranskning:** Läs och godkänn slutligt korturval/ton och ordna frivillig återkoppling från tonåring och vuxen innan bredare lansering. Innehållsförslag och kod kan tas fram självständigt dessförinnan.

**Prioritet 4 – Kvalitet och användbarhet**

- [ ] **12. Granska och förbättra de 34 allmänna korten.** Pröva psykologisk relevans, trygghet, begriplighet, rollperspektiv, skillnaden mellan önskemål och nuläge samt om JA/NEJ är ett lämpligt svarssätt.
- [ ] **13. Användartesta tidsåtgång och gränssnitt.** Undersök om 10–15 minuter är realistiskt; testa mobilgester, knappar, tangentbord, reducerad rörelse, tillgänglighet och förståelse av sammanfattningarna.
- [ ] **14. Testa integritet och felhantering.** Flera familjer, avbruten parning, konto-/sessionsbyte, nätverksfel, och att endast kort med verifierade **JA + JA** någonsin visas som gemensamma resultat.

**Nästa logiska genomförandesteg:** Granska CI/Playwright för JA+JA-ändringen, få den granskade migrationen godkänd och verifiera den publicerade resultatvyn med båda testkontona. Fortsätt parallellt med punkt 3–4 (säkra, regelbaserade sammanfattningar) utan att invänta användarens medverkan. Temakortlekarna kommer senare.

- [x] 2026-10-21: Tinder-liknande kortinteraktion i Gillaswajpen: följ fingret/muspekaren, luta kortet, visa svarsstämpel och animera bort kortet; piltangenter, knappar och reducerad rörelse stöds. Återstår verklig mobilgranskning av ny körning.
- [x] 2026-10-23: Den återställda allmänna kortleken laddar och sparar nu den inloggade användarens egna svar i `swipe_answers`, återupptar vid första obesvarade kortet och rensar klientminnet vid konto-/sessionsbyte. Svaren är fortsatt privata via self-only RLS. Gemensam resultatvy återstår och får bara använda den granskade aggregerande RPC:n efter godkänd migration.

- [ ] **[A]** Visa i gemensam resultatvy endast kort där BÅDA har svarat **JA**, enligt det nyare bindande produktbeslutet ovan. Gemensamma NEJ får inte visas. 2026-10-22: förberedd autentiserad RPC-migration som returnerar endast samma val från exakt två familjemedlemmar och aldrig användar-id, oenighet, ensidiga svar eller annan familjs träffar. Ett gemensamt nej returneras uttryckligen som `false` och får inte beskrivas som gemensamt intresse. 2026-10-24: minimal gemensam resultatvy implementerad på utvecklingsbranchen. Den visar endast RPC-resultat, separerar ja och nej, har tydliga vänt-/felläge och möjlighet att uppdatera. 2026-10-24: fristående pgTAP-test i GitHub Actions för verklig PostgreSQL 17 och syntetiskt schema förberett utan avgiftsbelagd Supabase-branch. Vänta på CI-resultat.
- 2026-10-24: Den skyddade matchnings-RPC:n är nu installerad i den befintliga Supabase-databasen. Databaskontroll under autentiserad roll gav 3 gemensamma ja, 8 gemensamma nej och 23 dolda oenigheter för båda testkontona. Totalt 68 sparade svar kvar. Separat migration 20261024094338 återställde PostgREST full-row upsert och ett negativt RLS-test bekräftade att svar inte kan flyttas till annan användare. Browserkontroll mot den publicerade sidan återstår. Återstår: verifiera mot verkligt Supabase-schema, granska och applicera migrationen efter godkännande samt testa med två konton.
- [ ] **[A]** Utforma separata, korta och begripliga resultatsammanfattningar för förälder och tonåring: identifiera återkommande teman, möjliga problemområden, styrkor, samt konkreta samtalsöppningar och gemensamma lösningar. Skilj observationer från hypoteser och undvik överdrivna psykologiska slutsatser.
- [ ] **[A]** Skapa AI-genererad sammanfattning i liveversionen med endast behörig, överenskommen information. Bygg först en tydligt märkt regelbaserad mock-sammanfattning i frontend utan verklig AI eller känsliga data.
- [ ] **[A]** Utöka och redigera allmänna startkortleken med fokus på relation, svårigheter och möjligheter; dimensionera och användartesta för cirka 10–15 minuters effektiv swajpning för vardera personen. Antal kort bestäms efter provning, inte påhittad tidsuppskattning.
- [ ] **[A]** Visa tydliga kort som följer fingret och animeras höger/vänster (Tinder-liknande), med likvärdiga synliga knappar, tangentbordsstöd och stöd för reducerad rörelse.
- [ ] **[A]** Lås upp temakortlekar först när BÅDA avslutat hela första allmänna kortleken. Föreslagna lekar: Samtalsämnen, Aktiviteter tillsammans, Regler till Schyssta listan, Sätt att visa uppskattning, Svåra situationer och återhämtning, Små gemensamma förändringar. Korten ska vara konkreta, respektfulla och relevanta för båda.
- [ ] **[A]** Spara varje kortleks resultat och rollanpassade sammanfattning för senare återläsning; visa status och möjlighet att återvända.
- [ ] **[A]** Definiera datamodell och behörighetskontroller så AI-medlaren kan använda enbart tillåtna gemensamma kortresultat/sammanfattningar som bakgrund i varje privat chatt, utan att den andra personens privata AI-konversation exponeras.
- [ ] **[B]** Granska frågornas psykologiska relevans, trygghet, formuleringar och sammanfattningarnas kvalitet innan verkliga användare.

### P1 – Schyssta listan: förslag och ömsesidighet
- [ ] **[A]** Från kortleken 'Regler till Schyssta listan': visa automatiskt regler som båda gillat som klickbara FÖRSLAG i Schyssta listan. De ska inte bli bindande överenskommelser förrän båda uttryckligen bekräftat.
- [ ] **[A]** Stöd egna fritextförslag, motpartens godkännande/avslag och tydliga statusar; inget förslag får presenteras som ömsesidigt antaget utan bådas accept.
- [ ] **[A]** Innan föräldern skickar regel-/överenskommelseförslag: kort påminnelse om att först prata med tonåringen och gemensamt komma överens om att skapa listan; länk till förälderns MI-information.
- [ ] **[A]** Bygg och testa detta först med syntetiska demodata, senare med säker parvis synkning och behörigheter.

### P1 – Kommunikationsråd för förälder: motiverande samtal (MI)
- [ ] **[A]** Skapa en särskild MI-informationssida i föräldervyn (inte tonårsvyn), nåbar från Kommunikationsråd och förälderns regel-förslagsflöde.
- [ ] **[A]** Skriv kort, källgranskad psykoedukation: öppna frågor, reflektioner/speglingar, bekräftelser, sammanfattningar, autonomistöd, att möta motstånd utan argumentation och att be om lov/bjuda in innan gemensam problemlösning. Beskriv hur föräldern kan adressera problem utan att övergå för snabbt till råd och lösningar.
- [ ] **[A]** Ge ett konkret exempel på samtalssekvens: lyssna och spegla → utforska perspektiv och behov → fråga om lov att ta upp oro → bjud in till gemensam problemlösning. MI ska inte framställas som manipulation, garanti för förändring eller evidens för appens effekt.
- [ ] **[B]** Granska psykologisk precision, tillgängligt språk och vetenskapliga källor innan publicering av pedagogiskt innehåll.

### Genomförandeordning och säkerhetsgränser
1. Först mobilnavigering och befintliga visuella/testrelaterade brister, därefter allmänna swajpkort och resultatlogik.
2. Därefter temakortlekar, Schyssta listan-integration och MI-innehåll.
3. Därefter rollanpassad AI-sammanfattning med säker backend, behörighetsgranskning och systematisk kvalitetstestning.
4. Inga verkliga minderårigdata eller privata samtal i publik demo, CI-artifacts eller externa AI-anrop. Dokumentera produktantaganden och verifiera dem med användartester.

## FAS 0 — Beslut och integritetskrav (före persondata)

- [ ] **[E]** Fastställ målgrupp (13–19 eller 13–20), hur mycket som ska delas och om båda användarna måste godkänna kopplingen.
- [ ] **[E]** Besluta att AI-chattar alltid är privata per konto; separera dem från delat innehåll. Fastställ även om meddelanden mellan användare ska vara direktmeddelanden eller delad brevlåda.
- [ ] **[E]** Välj vilket personlighetstest som ska användas (rätt att använda frågor, korrekt svensk översättning, lämplighet, poängsättning, metodbeskrivning). Använd inte prototypens 15 frågor som ett validerat instrument.
- [ ] **[B]** Datakarta: tabeller, vem som ser vad, hur länge data lagras, konto-/familjeborttagning, backup, export och informationsflöde till unga.
- [ ] **[B]** Bedöm GDPR: rättslig grund, särskilda kategorier personuppgifter, personuppgiftsbiträdesavtal, tredjelandsöverföring och om konsekvensbedömning (DPIA) krävs. Juridisk expertgranskning vid behov.
- [ ] **[B]** Riskanalys för kris, hot/våld, tvång, missbruk av familjekoder och integritetskänsligt innehåll.
- **BLOCKERAR:** Verklig behandling av användaruppgifter och AI med minderåriga. Inte designarbete.

## FAS 1 — Gränssnitt och funktion utan backend (kan göras NU)

- [ ] **[A]** Dela upp nuvarande `app.js` i tydliga moduler, skapa konsekvent routing och datalager med mock-/live-läge.
- [ ] **[A]** Finslipa Midnight Haven på mobil, surfplatta, desktop, inklusive tillgänglighet och tangentbordsnavigering.
- [ ] **[A]** Skapa skärmar för onboarding, profil/roll, familjekod, vänteläge, konto och sekretessinställningar.
- [ ] **[A]** Bygg färdiga vyer för inkorg, Gillaswajpen, jämförelser, personlighetstest, kommunikationsråd, Schyssta listan och AI-medlaren.
- [ ] **[A]** Skapa tydlig markering för privat/delat, radering/export, tomma tillstånd, offline-/felmeddelanden och mobiltest.
- [ ] **[B]** Förbättra texter och övningar; Erik granskar psykologiskt innehåll och ton till förälder respektive tonåring.
- [ ] **[A]** Skriv automatisk testsvit för centrala komponenter och demonstration med syntetiska testdata.

## FAS 2 — Gratis molntjänster (kan ske parallellt med fas 1)

- [ ] **[E]** Skapa personligt projekt på Supabase Free: https://supabase.com/ — välj en EU-region där den erbjuds.
- [ ] **[E]** Skapa gratis Cloudflare-konto: https://dash.cloudflare.com/.
- [ ] **[E]** Koppla GitHub-repot `erikjarl/hemmakompassen` till Cloudflare Pages Free (kostar inget inom kvoterna); behåll GitHub som kodkälla.
- [ ] **[E]** Välj inloggningsalternativ. För en sluten pilot kan Google OAuth vara kostnadsfritt; e-post/lösenord för externa användare kräver normalt egen SMTP-leverantör och en verifierad avsändardomän.
- [ ] **[E]** Om e-post ska användas: skapa Resend Free och verifiera en domän du kontrollerar, eller välj ett annat lämpligt SMTP-alternativ. Anskaffning av en helt ny domän är inte garanterat gratis.
- [ ] **[E]** Dela endast projekt-URL och publik/anon-nyckel vid behov. Lägg hemliga nycklar i serverns secrets, aldrig i chatt eller publik GitHubkod.
- **BLOCKERAR:** Liveintegrationerna i fas 3–5. Inte arbetet i fas 1.

## FAS 3 — Autentisering, familjekoppling och databas

- [x] **[A]** Första Supabase-schemat finns för `profiles`, `families`, `family_members`, `invitations`, `swipe_answers`, `personality_answers`, `messages`, `agreements`, `agreement_approvals` och privata AI-tabeller. Återstår: versionssäkra befintliga produktionsmigrationer i repot och komplettera schemaändringar genom granskade migrationer.
- [ ] **[A]** Skapa Row Level Security (RLS) och minsta möjliga databastillgång. 2026-10-22: förberedd migration på `ai-dev/utveckling` för de sex familjegemensamma tabeller som saknade policies, inklusive borttagning av `anon`-rättigheter och syntetiska isoleringstester. Återstår: kör SQL-integrationstester på en disponibel Supabase-branch, granska advisors och tillämpa först efter godkännande. Två familjer får aldrig se varandras data.
- [x] **[A]** Grundflöde implementerat för två separata användarkonton, säkra sessioner och inbjudningskod med 30 minuters livslängd. 2026-10-23: granskningen visade att tre befintliga konton låg i varsin tom enfamilj och därför inte kunde acceptera kod. En granskningsbar migration låter en användare flytta från en tom enfamilj till en komplementär roll, bevarar profil/privata användardata och stoppar flytten om delad historik finns. Mock-/kontraktstest och disponibelt pgTAP-test tillagda. 2026-10-24: lokal QR-kod/länk till bekräftelseflödet integrerad och täckt av mockat mobiltest; koden ligger endast i URL-fragmentet och ingen extern QR-tjänst används. Återstår: applicera och köra pgTAP i disponibel backend efter godkännande, därefter verifiera hela QR-/kodflödet med de två anvisade testkontona samt testa återkallelse och samtidighetsfall.
- [ ] **[A]** Skilj privat AI-chatt från familjegemensamma tabeller. Inga hemliga API-nycklar i webbläsaren.
- [ ] **[A]** Skriva integrationstester som aktivt försöker läsa/ändra andra familjers data, samt tester för utloggning, avvisad inbjudan, brutet familjepar och radering.
- [ ] **[E]** Utför Supabase-konfiguration som kräver kontots ägarbehörighet; verifiera med två testkonton.
- **KLART NÄR:** Två användare kan logga in från olika enheter och bara nå korrekt data.

## FAS 4 — Alla delade funktioner live

- [ ] **[A]** Bygg inkorg med läskvittenser, skyddade meddelanden och möjlighet att radera.
- [ ] **[A]** Bygg swajpsvar med separat egen historik och jämförelser för paret, inklusive tydliga delningsregler. 2026-10-23: liveklienten sparar och återläser egen historik med stabila kort-id:n och self-only RLS; mockat webbläsartest verifierar upsert och återupptagning. Återstår: applicera och verifiera den förberedda aggregerande RPC-migrationen på disponibel backend, anslut resultatvyn och testa två verkliga testkonton utan att privata eller avvikande svar exponeras.
- [ ] **[A]** Implementera valt Big Five-instrument enligt dess dokumenterade skala och poängsättning; jämförelser utan överdrivna slutsatser.
- [ ] **[A]** Schyssta listan: förslag, redigering, versionshistorik och bekräftelse från båda.
- [ ] **[A]** Kommunikationsråd, exempel och övningar; spara bara sådant användaren uttryckligen vill spara.
- [ ] **[A]** Startsida med nästa aktivitet, vänteläge och olästa meddelanden.
- [ ] **[E]** Godkänn testfrågor, tolkningsnivå och kliniskt språk.
- **KLART NÄR:** Varje funktion kan köras från två separata testkonton/enheter.

## FAS 5 — AI-medlare inom gratisgräns

- [ ] **[B]** Välj en konkret Cloudflare Workers AI-modell som finns i Free och granska språkprestanda, databehandling, eventuell geografisk behandling, villkor och tillämplighet för konfidentiell information.
- [ ] **[A]** Bygg backend-proxy (Cloudflare Worker eller Supabase Edge Function). Verifiera inloggad användare server-side; använd aldrig modell-/API-hemligheter i publik JS.
- [ ] **[A]** Modellkontext begränsas till de personuppgifter användaren har rätt att nyttja; ingen meddelandehistorik eller privat chatt från motparten.
- [ ] **[A]** Skilda privata chattrum och behörighetstest. Serverbaserad kvot per konto och familjepar, token-/längdgräns, timeout och felhantering när gratisgränsen nås.
- [ ] **[B]** Utforma och granska AI:s instruktioner, begränsningar, informationsflöden och hantering av kris, våld, suicidrisk och tveksamma råd.
- [ ] **[A]** Utvärdera på anonymiserade/fiktiva svenska testfall; testa systematiskt svarskvalitet och risk.
- **BLOCKERAR:** Verkliga känsliga samtal får inte skickas förrän leverantörsvillkor, risker och dataskydd har granskats.

## FAS 6 — Produktionsberedskap och ansvar

- [ ] **[B]** Färdigställ användarvillkor, integritetstext för vuxna och förenklad version för ungdomar, datalagringspolicy och kontaktuppgifter.
- [ ] **[A]** UI för dataexport, kontoradering, bortkoppling av familjepar, hantering av samtycken/inställningar och sekretesslogik.
- [ ] **[B]** Kontrollera uppgiftsbiträdesavtal, regioner/överföringar, incidenthantering och eventuell DPIA.
- [ ] **[A]** Säkerhetsgranska RLS, användarinmatning, API-begränsningar, logs och backend, återställningsförmåga och åtkomstkontroller.
- [ ] **[E]** Besluta var och hur backup ska ske. Supabase Free saknar reguljära hanterade produktionsbackuper; verkliga data får inte läggas i offentligt repo.
- [ ] **[B]** Definiera vad tjänsten påstår sig hjälpa med och vad som inte är kliniskt validerat.
- **BLOCKERAR:** Extern pilot med verkliga personuppgifter.

## FAS 7 — Pilot och kvalitetstest

- [ ] **[E]** Rekrytera ett mycket begränsat antal frivilliga testpar efter integritets-/säkerhetsgranskning. Börja helst med syntetiska testkonton och vuxna testare.
- [ ] **[A]** Upprätta manuella testfall och enkel anonymiserad felrapporteringsrutin.
- [ ] **[B]** Testa bland annat två olika mobiler, tappad uppkoppling, lösenordsåterställning, ogiltig familjekod, oönskad delning, radering och AI-krissituationer.
- [ ] **[E]** Utvärdera begriplighet, trygghet, användbarhet och faktisk acceptans med deltagare. Inga obestyrkta effektpåståenden.
- [ ] **[A]** Åtgärda problem innan nästa pilotomgång.
- **KLART NÄR:** Avgränsad pilot kan köras utan kända blockerande säkerhetsfel.

## FAS 8 — Drift och framtida skalning

- [ ] **[A]** Övervakning av fel och användningskvoter utan att logga känsligt innehåll.
- [ ] **[B]** Inför återkommande säkerhetsgranskning, rutin för driftstörningar och uppdateringar.
- [ ] **[B]** Om gratisnivåer inte räcker: byt upp nivåer eller AI-modell med bibehållen kod och datastruktur.
- [ ] **[E]** Besluta om egen domän, varumärke, eventuell betalmodell och fortsatt förvaltning senare.

## Viktiga beslut för projektägaren

1. Målålder: 13–19 eller 13–20?
2. Bekräfta datadelning: swajp, testresultat och gemensamma regler delade; privata AI-chattar ej delade.
3. Vilket korrekt/licensierat instrument ska ersätta 15-frågorsdemon?
4. Ska första piloten använda Google-inloggning, eller ska vi möjliggöra e-post/lösenord från start?
5. Finns redan en domän för verifierad e-postavsändare?
6. Vilket antal samtidiga familjepar och ungefär hur mycket AI-chatt behövs i pilotens första skede?

## Källor att bevaka

- Supabase: https://supabase.com/pricing
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase SMTP: https://supabase.com/docs/guides/auth/auth-smtp
- Cloudflare Pages: https://developers.cloudflare.com/pages/platform/limits/
- Cloudflare Workers AI: https://developers.cloudflare.com/workers-ai/platform/pricing/
- Cloudflare Workers AI databehandling: https://developers.cloudflare.com/workers-ai/platform/data-usage/
- Resend: https://resend.com/pricing
- IMY barns uppgifter: https://www.imy.se/verksamhet/dataskydd/det-har-galler-enligt-gdpr/introduktion-till-gdpr/personuppgifter/personuppgifter-om-barn/
- GitHub Pages-begränsningar: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits


## Testkonton och browsergranskning (22 oktober 2026)

- Inloggningssida: https://erikjarl.github.io/hemmakompassen/konto.html
- TobbeTonåring: tonåring, `erikbertiljarl@gmail.com`.
- FannyFörälder: förälder, `aleriserik@gmail.com`.
- Erik har anvisat dessa konton för webbläsartester av Hemmakompassen. Använd endast fiktivt testinnehåll. Uppgifterna ovan är användarangivna; fungerande inloggning och kontonas roller är ännu inte verifierade i detta dokumentationspass.
- Läs detta avsnitt vid varje schemalagt utvecklingspass och kvalitetsrapport samt när nya uppgifter för projektet schemaläggs.
- Erik har uttryckligen godkänt lagring av följande testlösenord i projektets Markdown och schemalagda uppgifter den 22 oktober 2026. Enligt Erik innehåller kontona endast testdata, inga privata uppgifter, och lösenordet används inte till andra konton.
- Testlösenord för BÅDE TobbeTonåring och FannyFörälder: `Banner12345678`. Använd endast på Hemmakompassens angivna inloggningssida, aldrig för mejlkontona eller andra tjänster. Detta är ett avgränsat undantag för dessa två testkonton; övriga hemligheter ska fortsatt skyddas.
- Inloggningsuppgifterna finns därmed tillgängliga för schemalagda tester, men fungerande inloggning och webbläsaråtkomst måste verifieras vid körningen. Om åtkomst saknas: rapportera hindret och fortsätt med möjliga tester; påstå inte att riktig inloggning har testats.
- Kontrollera inloggning, rätt profil/roll, navigering och beständig lagring med båda rollerna när säker åtkomst finns. Skilj tester mot publicerad GitHub Pages-version från tester av utvecklingsbranchen. Rapportdelen granskar och rapporterar, utan parallella kodändringar.
