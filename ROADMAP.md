# Hemmakompassen — utvecklingsplan (2026-10-17)

## Påbörjat 18 oktober 2026 – Fas 1A (utan backend)

- [x] Ny introduktionssida för en besökare utan demoprofil.
- [x] Två valbara demoperspektiv: förälder och tonåring, med egna välkomsttexter.
- [x] Visuellt familjekopplingsflöde med tre steg och preliminär information om datadelning.
- [x] Demonstrationsläge tydligt märkt: inga riktiga konton, familjekoder, fjärrkopplingar eller AI.
- [x] Enkel automatisk testfil med Node.js inbyggda testverktyg.
- [ ] Fortsätt dela upp JavaScript i moduler och förbered separerat mock-/backend-lager.
- [ ] Bygg autentiserings- och familjekopplingsskärmarna med tydliga fel- och väntelägen.
- [ ] Finputsning av samtliga roller, skärmar och tillgänglighetskontroller.

**Fas 0:** Genomarbetad dataskyddspolicy, validerat testinstrument, användarvillkor och klinisk riskgranskning behövs *före* live-backend med verkliga uppgifter, men blockerar inte frontendutveckling med syntetiska demodata.


**Status:** Design- och funktionsprototyp ligger på `main`. Ingen riktig autentisering, datadelning, säker backend eller AI-anslutning finns ännu.

**Mål:** Ett familjepar (förälder + tonåring) ska kunna skapa två separata konton, kopplas med familjekod, använda swajpen och personlighetstestet, dela överenskomna uppgifter, skicka meddelanden och prata var för sig med en privat AI-medlare som kan använda endast tillåtna, gemensamma uppgifter.

**Arbetssätt:** Följ faserna i ordning. Märkning: **[A] Assistenten** kan göra uppgiften (med GitHubåtkomst och nödvändiga verktyg); **[E] Erik** måste fatta ett beslut, skaffa konto, godkänna något eller ge konfiguration; **[B] Båda**. `BLOCKERAR` markerar ett villkor som måste vara uppfyllt för nästa beroende fas.

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

- [ ] **[A]** Skapa SQL-migrationer för `profiles`, `families`, `family_members`, `invitations`, `swipe_answers`, `personality_answers`, `messages`, `agreements`, `agreement_approvals` och `private_ai_chats`.
- [ ] **[A]** Skapa Row Level Security (RLS) och minsta möjliga databastillgång. Två familjer får aldrig se varandras data.
- [ ] **[A]** Implementera två separata användarkonton, säkra sessioner, invitationskod med livslängd och ömsesidig accept.
- [ ] **[A]** Skilj privat AI-chatt från familjegemensamma tabeller. Inga hemliga API-nycklar i webbläsaren.
- [ ] **[A]** Skriva integrationstester som aktivt försöker läsa/ändra andra familjers data, samt tester för utloggning, avvisad inbjudan, brutet familjepar och radering.
- [ ] **[E]** Utför Supabase-konfiguration som kräver kontots ägarbehörighet; verifiera med två testkonton.
- **KLART NÄR:** Två användare kan logga in från olika enheter och bara nå korrekt data.

## FAS 4 — Alla delade funktioner live

- [ ] **[A]** Bygg inkorg med läskvittenser, skyddade meddelanden och möjlighet att radera.
- [ ] **[A]** Bygg swajpsvar med separat egen historik och jämförelser för paret, inklusive tydliga delningsregler.
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
