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
- [ ] Bygg autentiserings- och familjekopplingsskärmarna med tydliga fel- och väntelägen.
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
- [x] 2026-10-21: Tinder-liknande kortinteraktion i Gillaswajpen: följ fingret/muspekaren, luta kortet, visa svarsstämpel och animera bort kortet; piltangenter, knappar och reducerad rörelse stöds. Återstår verklig mobilgranskning av ny körning.

- [ ] **[A]** Visa i gemensam resultatvy endast kort där BÅDA har svarat och valt samma alternativ. 2026-10-22: förberedd autentiserad RPC-migration som returnerar endast samma val från exakt två familjemedlemmar och aldrig användar-id, oenighet, ensidiga svar eller annan familjs träffar. Ett gemensamt nej returneras uttryckligen som `false` och får inte beskrivas som gemensamt intresse. Återstår: kör pgTAP på disponibel backend och anslut resultatvyn.
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
- [x] **[A]** Grundflöde implementerat för två separata användarkonton, säkra sessioner och inbjudningskod med 30 minuters livslängd. Återstår: verifiera ömsesidig accept, avvisning/återkallelse och samtidighetsfall med två syntetiska testkonton.
- [ ] **[A]** Skilj privat AI-chatt från familjegemensamma tabeller. Inga hemliga API-nycklar i webbläsaren.
- [ ] **[A]** Skriva integrationstester som aktivt försöker läsa/ändra andra familjers data, samt tester för utloggning, avvisad inbjudan, brutet familjepar och radering.
- [ ] **[E]** Utför Supabase-konfiguration som kräver kontots ägarbehörighet; verifiera med två testkonton.
- **KLART NÄR:** Två användare kan logga in från olika enheter och bara nå korrekt data.

## FAS 4 — Alla delade funktioner live

- [ ] **[A]** Bygg inkorg med läskvittenser, skyddade meddelanden och möjlighet att radera.
- [ ] **[A]** Bygg swajpsvar med separat egen historik och jämförelser för paret, inklusive tydliga delningsregler. 2026-10-22: egen historik är fortsatt self-only via RLS och granskningsbar migration för aggregerade gemensamma svar är förberedd; liveklient och disponibel SQL-verifiering återstår.
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
