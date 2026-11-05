# Hemmakompassen — aktuell utvecklingskö

**Gällande Jobb hk-fullmakt (5 november 2026):** se [AGENTS.md](../AGENTS.md). Commit, push, PR, merge, publicering och motsvarande projektändringar i GitHub, Supabase och Cloudflare är uttryckligen godkända. Detta ersätter äldre krav på separat merge-/publiceringsgodkännande.

## 5 november 2026 – KOM-05A/B: direkta länkar till samtalsövningar

- [x] **Implementerat på `feat/communication-deep-links-20261105`:** nio fasta övningsadresser (`#kommunikation/<övning>`) öppnar rätt övning; sex moduler har relevanta direktlänkar. Mobilmenyn behåller Kommunikationsråd som aktiv flik. Enbart fasta redaktionella ID:n används, inga användarsvar i adressen och ingen ny databasåtkomst.
- [x] **Robust routing och tangentbord:** felkodade hashvärden kraschar inte sidvisningen; okända övningar visar översikten. Direktnavigering flyttar fokus till övningen medan omritning inte aktivt flyttar fokus. Situationernas befintliga knappar använder samma kontrollerade öppningsfunktion.
- [x] **Lokala kontroller:** 205 Node-tester och statiskt bygge godkända. UI-workflow upptäcker nu samtliga `*.test.cjs` och `*.test.mjs`, inklusive situations- och direktlänkstester.
- [ ] **Browser/release:** Playwright-fall tillagda för modullänk, bakåt/framåt, omladdning och okända/felkodade adresser. Lokal Chromium-start nekas av miljön (`socket() failed: Operation not permitted`); körning i GitHub Actions och visuell granskning återstår före release. Push av den separata utvecklingsgrenen stoppades två gånger av automatisk godkännandegranskning, även efter kontroll av tidigare Jobb hk-fullmakt. Ingen ny PR, GitHub Actions-körning, merge eller publicering har skapats i detta pass; Erik gav därefter uttryckligt push-/merge-/publiceringsgodkännande den 5 november; releasearbetet återupptas.
- [ ] **KOM-05C:** lägg till de verifierade övningsadresserna i AI-medlarens tillåtna svarslänkar och Worker-prompt, med roll-/riskkontroller och separat driftsättning. AI:ns befintliga generella länkar är oförändrade.
- [ ] Verkliga tvåkontotester och fysisk iOS/VoiceOver återstår som tidigare. Detta pass ändrar inga befintliga användarsvar eller delningsflaggor.


## 4 november 2026 – KOM-03: situationsstyrt kommunikationsstöd (PR #106 – mergad och publicerad)

- [x] **KOM-03A – mergad till main:** sex situationsval öppnar direkt rätt befintlig eller ny samtalsövning. Tangentbordsfokus flyttas till öppnad övning. Ingen ny hash-route, familjedata, databasförändring eller lagring.
- [x] **KOM-03B – innehåll mergat:** tre nya redaktionella övningar om validering utan medhåll, konkreta frivilliga önskemål och respektfull gränssättning. Den sista har olika råd för förälder respektive tonåring och tydliggör vuxenansvar och säkerhet.
- [x] **KOM-03C – regressionstester verifierade:** kontrakt för målövningar, rollanpassning, säker interaktion och frånvaro av lagring, samt Chromium/Playwright-övningsval på mobil med både pek- och tangentbordsstyrning.
- [x] **KOM-03D – release verifierad 4 november 2026:** PR #106 mergad som `c70cf497184067106a676ab169448ed317711f4a`. PR UI/Node/Playwright **#41826421254 godkänd**, main UI **#41826651841 godkänd** och GitHub Pages **#41826649578 godkänd**. Syntetiska tester är inte verkliga tvåkontotester.
- [ ] **KOM-03E – verklig QA:** prova med båda autentiserade testkontona på fysisk iOS Safari och med skärmläsare, även större tecken; kontrollera fokus, begriplighet och att valen aldrig skapar meddelanden eller delning.
- [ ] **KOM-04 – metod- och språkgranskning:** bedöm NVC-övningar, MI-överföring till föräldraskap och tillkommande verktyg kritiskt utifrån källor, målgrupp, maktasymmetri och risksituationer. Undvik behandlings- eller effektanspråk utan stöd.
- [ ] **KOM-05 – nästa integrationssteg:** utvärdera direkta säkra länkar till specifika övningar från AI-medlaren och Gillaswajpen, men bygg först en testad ankarmekanism som inte bryter SPA-navigation eller exponerar privata svar.

## 4 november 2026 – KOM-02: samtalsverktyg i hela appen och AI-medlarens länkar (PR #105)

- [x] **KOM-02A – mergad navigation:** Gillaswajpen, Gemensamma insikter, Min personlighet, Schyssta listan, Inkorgen och AI-medlaren får kontextuella genvägar till `#kommunikation` och `#nvc`. Endast föräldravyn har dessutom `#mi-foralder`. Inga privata svar förs med i länkarna och navigering skickar inga meddelanden.
- [x] **KOM-02B – AI-systemprompt och chatt-UI driftsatta:** Worker-systemprompten har de verkliga absoluta Pages-adresserna `https://erikjarl.github.io/hemmakompassen/#kommunikation` och `#nvc`; förälderns särskilda MI-adress läggs bara till vid verifierad föräldraroll, aldrig vid tonåringsroll, okänd roll eller valt bort projektkontext. Chatt-UI gör enbart de tre exakt tillåtna adresserna klickbara i AI-svar efter HTML-escaping. Övriga adresser och användar-/säkerhetsmeddelanden förblir ren text.
- [x] **KOM-02C – tester skapade:** Node- och Worker-kontroller för tillåtna länkar, XSS, verifierad roll och projektkontext av/på samt Playwright-kontroll av klickbar navigation för båda rollerna i mobilen. AI-reflektioner har även generella övningslänkar utan tolkning av privat profil.
- [x] **KOM-02D – teknisk release och Worker-driftsättning verifierad 4 november 2026:** PR #105 mergad till `main` som `5e55e0e55d8daeb800646e7fd04d8776cee0daf7`. Slutlig PR-CI för AI **#41792070496** och UI/Playwright **#41792070332** godkända. Main-UI **#41792217065** och Pages **#41792216243** godkända. Cloudflare Worker-version **`6ed65aba-94b2-463a-94a7-d6b766674a49`** (version 11) uppladdad som komplett femmodulspaket med strikt ärvda bindningar och aktiverad för **100 % trafik**; sex tidigare bindningar kontrollerades kvar, inklusive AI, D1-kvot, Origin, Supabase och två interna testkonton. Inga databas-/kortsvar ändrade. Gröna tester visar kodkontrakt, inte att modellen alltid väljer att länka.
- [ ] **KOM-02E – verklig QA:** verifiera med två autentiserade testkonton att chatten länkar korrekt vid relevant fråga, MI inte föreslås till tonåring, avstängd projektkontext inte läser data och att inga länkar ges vid risksamtal. Fysiskt iOS-/skärmläsartest saknas.


## 4 november 2026 – KOM-01: utökad kommunikationsverktygslåda (PR #104)

- [x] **KOM-01A – kod mergad till main:** Kommunikationsråd har fått en rollanpassad startsida med tydliga ingångar: MI för förälder, NVC för båda samt sex praktiska övningar (spegling, paus med återkomst, reparation, gemensam problemlösning, kravlös kontakt och svåra samtal). Förälderns redan befintliga MI-guide kompletteras med övningar i att fråga om lov och utforska ambivalens, med uttrycklig gräns mot övertalning och förälders fortsatt vuxenansvar.
- [x] **KOM-01B – privat NVC-övning implementerad:** separat sida med observation, känsla, behov, konkret önskemål och lokal formulering i webbläsaren. Utkast läggs enbart med `textContent`, kan nollställas och skickas inte till Supabase, AI eller partner. Ingen migration, inga nya delningsflaggor eller ändrade användarsvar.
- [x] **KOM-01C – automatiska tester i PR #104:** Node-kontrakt för rollvyer, metodkällor, NVC-validering och injektionssäker text; syntetisk Playwright-Chromium i 390px för förälder/tonåring, NVC-formulering, reset, synlig navigation och MI-spärr. Anpassad CI-kommandorad och statisk build.
- [x] **KOM-01D – teknisk release 4 november 2026 verifierad:** PR #104 mergad till `main` som `9174dd53ce98062907747f67ca250f32174f955e`. Slutlig PR-CI **#41787467096**, main UI/Node/Playwright **#41787606895** och GitHub Pages **#41787606278** godkända. Även syntetiska mobilkontroller i **320 och 390 px** passerade. Ingen databasändring eller sparad familjedata påverkades.
- [ ] **KOM-01E – faktisk användbarhets- och metodgranskning kvar:** autentiserad tvårollskontroll, fysisk iOS Safari, VoiceOver, stora tecken, tonåringars begriplighet och språk-/metodgranskning före extern pilot. NVC- och MI-delarna är redaktionellt anpassade samtalsverktyg, **inte** en kliniskt utvärderad familjebehandling.


## 3 november 2026 – UX-01C: tangentbordsfokus, mobilmeny och säkra piltangenter (PR #103)

- [x] **UX-01C – implementerat på utvecklingsgrenen:** en tangentbordssynlig länk ”Hoppa till huvudinnehållet” i den inloggade appen flyttar fokus till `#live-app` utan att ändra SPA-routens hash. Vid riktigt sidbyte flyttas fokus till nytt huvudinnehåll. Identiska bakgrundsuppdateringar bygger inte längre om redan fokuserade menylänkar; en meny som måste uppdateras återställer länken och horisontell skroll.
- [x] **UX-01C – mobil och Gillaswajpen:** aktiv mobilflik flyttas fram i den horisontella menyn vid sidbyte. Undersidan Gemensamma insikter markerar Gillaswajpen som aktuell primär flik. Globala kortgenvägar med vänster-/högerpil sparar inte ett oavsiktligt JA/NEJ om fokus ligger på länkar, knappar, formulärkontroller eller andra interaktiva element, och inte heller med modifieringstangenter.
- [x] **Automatisk verifiering på branch, PR #103:** GitHub Actions UI/browser-test **#41726616629 godkänd** efter rättad MI-guide-kontraktsassertion. Inkluderar Node-kontrakttest, statiskt bygge och syntetiska Chromium/Playwright-prov med tangentbordsfokus, genväg till main, aktiv sista mobilflik, insiktsflik och inget oavsiktligt swajpsvar från fokuserad menylänk. Versionssträngen har höjts konsekvent i HTML och importkedja.
- [x] **UX-01C release verifierad 3 november 2026:** PR #103 är mergad i `main` som `57c54c3b2092b28d71666380e2b447f4594123bb`. Slutlig PR-CI **#41726909258**, main UI/Node/Playwright **#41727106770** och Pages **#41727105396** är alla **godkända**. Endast kod, tester och dokumentation – inga databasskrivningar eller förändrade delningsflaggor.
- [ ] **UX-01C verklig QA återstår:** två riktiga autentiserade testkonton, fysisk iOS Safari med VoiceOver, skärmläsare, 320/390 px och stora tecken är **inte** verifierade genom syntetiskt Chromium. Fortsätt UX-01 före extern pilot.


**Granskad:** onsdag 4 november 2026, efter mergade och publicerade PR #90–#106, samt separat verifierad Supabase-migration #95.  
**Källa:** kod på `main` inklusive PR #90–#106, `backend-config.js`, kontrollerade GitHub Actions/UI/Pages-körningar, Supabase-migrationer och read-only SQL efter installation. Detta är **inte** ett påstående om genomförda verkliga tvåkontotester.  
**Syfte:** En enda kort, uppdaterad handlingslista för manuellt och schemalagt utvecklingsarbete. `ROADMAP.md` bevarar detaljerna och äldre beslut.

## 3 november 2026 – SW-03A: egen viktigast-översikt och fortsatt privat prioritering

- [x] **SW-03A mergad och publicerad PR #100:** tonåringen har en egen, tydligt privat lista över redan serververifierade gemensamma A JA+JA där hen själv valt Mycket viktigt. Förälderns vy visar inte listan; B, NEJ och neutrala nivåer filtreras. Texten informerar om att AI-medlaren kan använda egna prioriteringar när projektkontext är på. PR-UI #41680382345, main UI #41680605178 och Pages #41680603854 **godkända**; merge `3e96a5ea8ea96b4082a982f120c522fe50a729a5`. Ingen databasändring eller förändring av sparade svar.
- [x] **Regressionstester verifierade:** syntetisk selektering av egna viktiga A JA+JA, föräldervy utan privata markeringar, fel i lagringshämtning, kontroll av AI-information samt framtida shared-mode utan dubbletter. Godkända i PR #100 UI-CI #41680382345.
- [ ] **SW-03B – blockering före delning:** i verkliga Supabase saknas RPC `public.shared_swipe_priorities(text)` trots att förberedd SQL och syntetiska tester finns i GitHub. Den tidigare UI-texten lovar att viktighetsskattningar sparas privat. Publicera därför **inte** automatiskt tidigare privata höga tonåringsmarkeringar via en ny RPC utan begripligt aktivt delningsval, nya kontrakttester och autentiserad tvåkontoverifiering. Flaggan `enableSharedPriorities:false` lämnas orörd.

- [x] **SW-03A mobilbrowser-QA mergad och publicerad (PR #101):** syntetisk Chromium/Playwright-kontroll med tonårings- och föräldervy, endast serververifierade A JA+JA och tonåringens egen prioritet, skydd mot B/NEJ/neutrala värden samt avstängd prioritets-RPC. Ny 390 px-mobilbild `mobile-teen-private-priority-preview.png` har öppnats och granskats utan uppenbar klippning i själva listan. PR UI **#41680969356**, main UI **#41681186915** och Pages **#41681184672** godkända; merge `18c4bde1daed599ae456ec33270f831f1f729ad1`. Autentiserade tvåkontotester är fortfarande öppna.
- [ ] **SW-03A verklig QA återstår:** autentiserade tvåkontosessioner, iOS Safari och framtida uttryckligt prioritetssamtycke.

## INT-01/03/04 – read-only positiva rollprov i verkliga Supabase (3 november 2026)

- [x] **Rollbaserad SQL-kontroll utan dataändringar:** befintligt förälder–tonåringpar kördes med `BEGIN READ ONLY`, lokalt `authenticated` och simulerat `request.jwt.claim.sub` i två separata transaktioner med `ROLLBACK`. Båda fick 2 familjemedlemmar, 12 gemensamma A-JA i general, 5 i aktiviteter, 0 delade B, 2 meddelanden och en tillgänglig delad IPIP-profil; oläst: 0 förälder, 1 tonåring. Ingen rå text, identitet, privata svar eller meddelandeinnehåll återges i planen.
- [ ] **Begränsning:** dessa är riktiga, körda, behörighetsstyrda DB-RPC:er men **inte** signerade inloggningar eller två webbläsarsessioner. Fulla INT-01/02/03/04, återkallelse och Worker-test kvarstår.

## AI-01H – resultatanalys med tidsgräns och avbrutna gamla anrop (3 november 2026)

- [x] **AI-01H merged/publicerad PR #99:** 25-sekunders timeout och abort av föråldrade AI-anrop ingår på `main` via merge `f64e0c681f9d26579279e3f3c1487b1fed17129c`. PR-CI AI #41679064612 och UI #41679064432 godkända, main UI #41679759399 och Pages #41679758227 godkända. Ändringen påverkar bara klienten, inte Worker-kontrakt eller sparade svar.
- [ ] **AI-01H återstår:** verkligt tvåkontotest av återkallelse/konto- och sessionsbyte; UI-avbrott bevisar inte att redan påbörjat serveranrop slutar konsumera AI-kvot.

## 3 november 2026 – UX-02A: ikonöversikt även med aktiva AI-reflektioner

- [x] **PR #98 mergad och publicerad – kod och tester:** ai-dev/compact-mutual-yes-20261103 visar en kort, ämnesgrupperad ikonöversikt från **enbart serververifierade A JA+JA** i både den enskilda kortlekens resultat och samlade insikter. AI-reflektionen finns kvar på samma sida utan återgång till förskrivna råd. Översikten innehåller rollanpassad text och antal gemensamma svar, aldrig enskilda B-/NEJ-/okända kort eller privat viktighet. Node-/kontraktstester, byggkontroll och syntetiskt Playwright-UI är **gröna i GitHub Actions #41671120244 (3 nov)**. 35 screenshots producerades, desktop- och mobilbilder av gemensamma insikter samt mobil AI-swipe har öppnats och granskats. Detta är inte en autentiserad tvåkontoverifiering.
- [x] **PR #98 release:** merge 5c91abb76d3a5dd78e8565546edf0b6ec6b3532b, main UI #41678506279 och Pages #41678505271 godkända den 3 november 2026. Tidigare dokumenterad PR-CI gäller branchkod, nu är även main och distribution verifierade.
- [ ] **UX-02A återstår:** riktiga tvåkonton med återkallelse och breda kortlekar samt iOS Safari. Funktionen UX-02/SW-02 är inte fullständigt slutförd.

## 3 november 2026 – INT-03C/UX-01: tyst bakgrundsuppdatering av Inkorgen

- [x] **INT-03C – mergad, testad och publicerad PR #97:** oförändrade meddelanden och oförändrat antal olästa ska inte rita om Inkorgen var femtonde sekund; regelbunden serverkontroll fortsätter. Vid ny data uppdateras vyn, vid fel rensas osäkert tidigare innehåll som förut. En manuell uppdatering med redan inlästa meddelanden döljer inte konversationen i väntan på servern. Mobilens huvudskroll bevaras vid omritning. Node-regression och Playwright på mobil finns på `main` via **PR #97**. Även konkurrerande hämtning av äldre meddelanden skyddas mot bakgrundspolling. PR-CI **#41628025008**, main UI **#41628216811** och Pages **#41628215427** är godkända, merge `5f9d445fc88dc4974b57c493a265942a64362cd4`.
- [ ] **INT-03C verklig QA:** autentiserat tvåkontotest, iOS-Safari, skärmläsare och långa konversationer återstår. Teknisk CI, merge och Pages är genomförda.

## 3 november 2026 – ytterligare read-only negativtest av verkliga RPC:er

- [x] **INT-01/03N – obehörig, icke-existerande identitet (SQL i realdatabasen):** under `BEGIN READ ONLY` med lokal `authenticated`-roll och en syntetisk UUID som inte är kopplad till en familj gav `my_family_members()`, `shared_swipe_matches('general')`, `shared_understanding_cards()`, `my_family_messages()` och `my_family_unread_message_count()` alla **0**. Transaktionen återställdes med `ROLLBACK`. Ingen faktisk inloggning skedde; provet bevisar **inte** tvåkontotest eller JWT-signaturvalidering.
- [ ] **INT-01/03N komplettering:** autentiserade riktiga testkonton med både delad och privat data samt browser/Worker-beteende återstår.

## 3 november 2026 – INT-03A: ärliga läskvittenser i Inkorgen

- [x] **INT-03A – explicit läsmarkering (mergad, testad och publicerad PR #96):** öppning av Inkorgen och automatiska konversationsuppdateringar markerar inte längre alla familjemeddelanden som lästa. Användaren får en separat knapp **Markera alla meddelanden som lästa** när olästa finns och ser tydligt att även meddelanden på äldre sidor ingår. Vid serverfel bevaras oläst antal och inget läskvitto påstås vara sparat. Ändringen använder samma redan behörighetskontrollerade RPC, utan migrationskrav. Node- och mobil-Playwrightfall täcker misslyckat/successfullt försök, kontobyte och skydd mot dubbla anrop. PR #96 CI **#41626412219**, main UI **#41626593652** och Pages **#41626592863** godkända; merge commit `f009f1cff2b9ff3ae81ab9651ef6efecee4c0643`.
- [ ] **INT-03B – återstår:** verkligt autentiserat tvåkontotest med förälder/tonåring, paginering, utloggning/omparning, radering/retention och iOS-Safari. PR #96:s automatiska tester innebär inte att hela INT-03 är validerat.

## 3 november 2026 – SEC-02A: verifierat databasskydd och minimerade gamla behörigheter

- [x] **SEC-02A granskat i verkliga Supabase, read-only:** åtta RLS-tabeller utan policy identifierade via Advisor. Fyra (agreements, agreement_approvals, family_direct_messages, schyssta_notifications) saknar redan direkt SELECT/INSERT/UPDATE/DELETE för `anon` och `authenticated`. Fyra äldre (families, family_members, invitations, messages) hade däremot breda databasrättigheter men inga RLS-policyer. Ingen privat data lästes. Databasens 27 autentiserade SECURITY DEFINER-varningar har `search_path=''` och refererar `auth.uid()`; detta räcker inte för att bevisa att varje funktion är korrekt behörighetskontrollerad.
- [x] **SEC-02B – minsta möjliga rättighetsreduktion (mergad PR #95 och installerad):** ny REVOKE-migration som tar bort direkt `PUBLIC`/`anon`/`authenticated` åtkomst från fyra äldre familjetabeller. Samtidigt stängs `EXECUTE` av för det avvecklade `shared_general_deck_complete()`-RPC:t, inte för aktuella parnings-, svep-, meddelande- eller samtyckes-RPC:er. Endast grants ändras. Ny PostgreSQL-regression och Node-kontrakt är godkända via PR #95; migrationen `revoke_legacy_family_table_grants` har tillämpats i verkliga Supabase som **20261103111142**. SQL efter installationen verifierade nekad direkt SELECT/INSERT/UPDATE/DELETE på samtliga fyra tabeller, att avvecklat RPC nekas och att fyra aktiva RPC:er har `EXECUTE=true`. Ingen användardata ändrades.
- [x] **SEC-02C – teknisk release verifierad:** PR #95 är mergad, UI-CI **#41625212255** och PostgreSQL-CI **#41625212349** godkända. Verklig migration **20261103111142** installerad och kontrollerad med SQL. Advisor-varningar för autentiserade SECURITY DEFINER minskade **27 → 26**; 8 RLS-tabeller utan policy kvarstår men inga av de åtta ger direkt Data API-grants för vanliga klientroller enligt read-only kontroll.
- [ ] **SEC-02D – kvar:** fullständig granskning av de 26 avsiktligt exponerade RPC:ernas behörighetsvillkor, lösenordsskyddet, API/Data API-inställningar och riktiga tvåkontotester. RLS-linterns INFO kan vara avsiktlig för RPC-only tabeller.

## 3 november 2026 – IPIP egen dataexport, mergad PR #94

- [x] **PF-01A – exportera egna IPIP-svar (kod och tester):** lokal JSON-export av giltiga besvarade frågor med svensk frågetext, instrument-ID, version, datum och information om preliminär översättning. Fungerar även vid ofullständigt test, utan att skriva något i Supabase. Ingen familjeidentitet, partnerprofil, delningsstatus eller AI-text ingår i filen. Playwright testar faktiskt nedladdad fil och Node testar partiellt/färdigt test. **PR #94 mergad och publicerad:** PR-CI **#41620136382**, main UI **#41620395476** och GitHub Pages **#41620394681** godkända. Merge commit `8377fa96e2d7e3f2e9261a8c3a50297c229d4ffc`. Inga användarsvar ändrade.
- [ ] **PF-01B – kvar:** genomför verklig Safari-/iOS-kontroll, versionssäkra nya testomgångar, historik och export/radering av samtliga kontodata. PR #94:s gröna CI/merge/Pages innebär **inte** att fullständig GDPR-datahantering är färdig.

## 3 november 2026 – startsida och aviseringar, PR #93 mergad

- [x] **NOT-01A – synliga fel vid okänt antal olästa (kod och tester):** startsidan skiljer nu misslyckade serverkontroller från ett känt nollvärde, visar ”minst X olästa” när en källa saknas och erbjuder en knapp för nytt försök. Inga meddelandetexter eller privata svar exponeras i felstatus. Testkod mergad via PR #93, PR-CI **#41619480644**, main UI **#41619633238** och Pages **#41619631482** godkända.
- [x] **UX-03A – korrekta startsidebeskrivningar (kod):** ersatt felaktiga generiska platshållare med konkret information om Inkorg, Gillaswajpen, Big Five, Kommunikationsråd, Schyssta listan och AI-medlaren; upplysning om parningskrav för Inkorg/regler.
- [ ] **NOT-01B – framtida aviseringar och riktig verifiering:** kontrollera återanslutning med två autentiserade konton. Nya aviseringar för aktivitetskort och resultat är inte implementerade.

## 3 november 2026 – SW-04 + SW-01, mergad PR #92

- [x] **SW-04A – obesvarade förståelsekort (kod och test):** skilj överhoppade från färdiga svar. Slutvyn beskriver nu hur många som är obesvarade, och tonåringen kan öppna **bara** dessa kort utan att gå om hela kortleken. Nytt val att hoppa över igen behåller kortet obesvarat; ett faktiskt JA/NEJ tar bort överhoppningen. Mergat via PR #92 till `main` med godkänd PR-CI **#41618370067**, main UI **#41618537342** och Pages **#41618536211**. Mobila Playwright- och sessionsregressioner tillagda.
- [x] **SW-01C – upptäck extern B-återkallelse (kod och test):** när insiktsvyn är öppen återhämtas de sju serververifierade A-resultaten och de uttryckligen delade B-korten vid återkomst till fliken och som högst en gång per minut i förgrunden. Oförändrad datamängd ger ingen omrendering eller ny AI-reflektion. Vid fel rensas A+B tillsammans i stället för att behålla en gammal sammanställning. Mottagarens gamla redan genererade AI-text kan dock finnas kvar fram till nästa lyckade kontroll.
- [ ] **SW-01D – autentiserat tvåkontotest:** verklig Supabase/Worker-verifiering av B-delningsåterkallelse i två sessioner, inkl. konto- och familjebyten, är fortfarande inte genomförd. De nya testen använder syntetiska konton.

## 3 november 2026 – genomförda och verifierade leveranser

- [x] **PR #90 mergad, kod- och UI-testad och publicerad:** förälders MI-inspirerade guide med källor, korrekt förklaring av separat B-samtycke i kortleken, borttagen dubblerad polling-fokuslyssnare och rättad dokumentation. PR-CI **#41612247828**, main UI **#41612435895**, Pages **#41612433986** godkända; merge commit `c20bd52b918ffb27a3c53db09dcbe2ee679f74e2`. Inget verkligt autentiserat tvåkontotest.
- [x] **SEC-01 – begränsad intern triggerfunktion (#91):** Advisor identifierade `public.revoke_understanding_share_on_private_change()` som `SECURITY DEFINER` exekverbar av `anon`/`authenticated`. Granskade triggerkopplingarna. PR #91 mergades med godkända UI-/Node- och syntetiska PostgreSQL-tester (**#41612814260**, **#41612814569**). Migration `20261103094113` är installerad i verklig Supabase. **Verifierat direkt i SQL:** `anon_execute=false`, `authenticated_execute=false`, `active_trigger_count=2`. Den anonyma SECURITY DEFINER-varningen försvann från Advisor. Ingen familjedata ändrades.
- [ ] **SEC-02 – övrig säkerhetsuppföljning:** Advisor har fortsatt 26 varningar för autentiserade `SECURITY DEFINER`-RPC:er, som kan vara avsiktliga och inte får stängas av generellt; åtta RLS-tabeller saknar policy (kan vara avsiktligt om bara säkra RPC:er ska användas). Advisor rapporterar också att skyddet mot läckta lösenord är avstängt. Granska före extern pilot: [Supabase säkerhetsrådgivning](https://supabase.com/docs/guides/observability/advisors?lint=0029_authenticated_security_definer_function_executable).
- [ ] **Fortfarande öppet:** riktiga autentiserade tvåkontotester för B-samtycke/återkallelse, AI-kontext, MI-sidans begriplighet och säkerhet.

## Delade uppgifter = samma uppgifter för AI och användare (2 november 2026)

- [x] Kod för att visa gemensamma insikter och uttryckligen delade förståelsekort i testwebbplatsen, med befintlig server-RPC. Ingen andra AI-samtyckesknapp.
- [x] Kod för att AI-medlaren och swajp-analysen använder samma behörighetsstyrda delade B-kort som den inloggade föräldern/tonåringen ser.
- [x] Tester skapade för roller, ogiltiga B-ID:n, odelade kort och återkallelse.
- [x] **PR #88 driftsatt:** merge till main, båda testkedjorna och Pages-publicering godkända. Ny Worker-version `bf3f49d3-30b5-45fc-aeb4-8fa2866c5067` aktiv till 100 %, med testkonto-allowlist och befintliga bindningar bevarade.
- [ ] **Verklig tvåkontojämförelse:** tonåring delar/återkallar B-kort, förälder och tonåring ser samma delade innehåll i respektive vy, AI använder samma tillåtna data vid ny analys. Kontrollera också att privat B-svar inte går till den andra.

## Statusregler
- **[x] Implementerat och automatiskt testat** = kod på `main`, med verifierat kontrakt/CI. Det betyder **inte** att riktig tvåläsarsession, användbarhet eller klinisk effekt har validerats.
- **[ ] Kräver arbete/verifiering** = kvarstående funktion, integration, uppföljning eller verkligt test. Punkten kan ha fungerande delkod.
- **Avstängt** = kod kan finnas och migrationsfil kan vara installerad, men aktuell feature flag är `false`. Det är inte en aktiv användarfunktion.
- **Historisk text** i den omfattande ROADMAP ska inte läsas som nulägesstatus; dessa uppgifter gäller om de motsäger tidigare anteckningar.

## Genomfört under helgen

### Schyssta listan och inkorg (PR #56–#69)
- [x] Felaktiga eller manipulerade backend-payloads avvisas utan partiell visning (#56).
- [x] Förslags-/röstflöde för A-matchade regelkort med separat aktivt godkännande av båda, samt parningsisolering och backend-kontrakt (#57–#59 samt tidigare grund).
- [x] Manuella förslag från båda rollerna, förfrågningsstatus, ändringsförslag, versionshantering och särskild åtgärdsvy (#59, #61, #65).
- [x] Regelnotiser i inkorgen, oläst/läststatus, startsidesuppmaningar och navigationsmärken (#60, #64–#67).
- [x] Återkallelse, avslut och behörigt arkiv/versionshistorik (#62–#64).
- [x] Sökning, filter, neutral ”Inte nu”, återupptagning, tillgänglighets- och timeoutförbättringar (#66–#67).
- [x] Privata tvåvägsmeddelanden mellan nuvarande familjepar med skilda läskvittenser, historia och serverbaserat säkerhetskontrakt (#68–#69).
- [x] `enableSchysstaList: true` på den interna webbplatsen. Aktuella RPC-migrationer anges som installerade i tidigare ROADMAP; verkligt heltäckande tvåkontotest **inte dokumenterat som klart**.

### Big Five/personlighetstest (PR #70–#78)
- [x] Versionssatt svenskspråkigt IPIP-50 med 50 frågor, omvänd kodning, 5 skalor, egna sparade svar och återupptagning (#71–#73).
- [x] Serverkontrollerad delning **enbart av fem skalpoäng** efter två aktiva samtycken, med möjlighet att återkalla (#72–#73).
- [x] Visuell svarsmarkering och redovisning av amerikanskt vuxenreferensurval, M/SD (#74).
- [x] Fem horisontella jämförelsestaplar i en **linjär uppskattad percentilskala**, med korrekt P50/P75-position och normalmodellbaserade SD-zoner (#75).
- [x] Versionssäker cache-uppdatering så att Safari hämtar den nya profilen (#76).
- [x] Regelstyrda likheter/skillnader med redaktionella gränser och riktade råd (#77).
- [x] Fördjupade, separat skrivna texter för förälder och tonåring, alla fem skalor, vardagsexempel, frågor och relevanta länkar till verkligt existerande funktioner (#78).
- [x] Automatiska poäng-/integritets-/UI-tester och mobilskärmbilder för ovanstående. Frågornas svenska ungdomsvaliditet och referensens generaliserbarhet är **inte** fastställda.

### Tidigare Gillaswajpen-arbete som behöver skiljas från release
- [x] Stabil kortmodell med A (matchning) och B (förståelse), versionssatta ID:n, 34 allmänna kort och omfattande temakortlekar (inklusive **104 Aktiviteter** och **104 Samtalsämnen**); redaktionell riskgranskning dokumenterad.
- [x] Egen svarssparning, återupptagning, defensiv JA+JA-filtrering och automatiska integritetstester finns i koden.
- [x] A-only-servervitlistan och separat B-delning finns dokumenterade som installerade per 30 oktober. Detta är **inte** samma sak som att samtliga delningsvyer är aktiverade eller slutverifierade.
- [x] `enableSharedInsights:true` och `enableSharedUnderstanding:true` är kodade, mergade och driftsatta för interna konton genom PR #88; B-delning kräver ett uttryckligt aktivt tonåringsval per kort. **Ingen verklig tvåkontoverifiering är dokumenterad.**
- [ ] `enableSharedPriorities:false` och `enableSharedPolling:false` är fortfarande avstängda. Aktivera först efter relevanta negativa tester och autentiserad end-to-end-kontroll.

## Prioriterad nästa arbetskö

### P0 – riktiga integrations-/samtyckestester
- [ ] **INT-01: Fullt Gillaswajpen-test med två autentiserade testkonton.** JA+JA, NEJ, olika svar, B-delning + återkallelse, alla sju kortlekar, gamla historiska svar, oparad/omparad användare och annan familj. Ändra inte befintliga testsvar. Dokumentera exakta steg, utslag och eventuella blockeringar. Därefter kan relevant feature flag prövas.
- [ ] **INT-02: Schyssta listans fulla tvåkontoflöde.** Båda rollerna: manuellt förslag → separat eget beslut → inkorg och oläststatus → två ja → ändringsförslag → återkallelse → historik → omparning; kontrollera i riktiga servern och i två webbläsarsessioner. Automatisk pgTAP/Playwright är bra grund men ersätter inte detta.
- [ ] **INT-03: Inkorgen med riktiga parade konton.** Skicka/läs i båda riktningar, läskvittenser, paginering, återanslutning, isolering efter avparning, XSS-risken och mobilens skroll/fokus. Utred uttryckligen hantering av meddelanderadering och retention före pilot.
- [ ] **INT-04: Big Five i två riktiga sessioner.** Prova återupptagning, svarsversion, dubbelsamtycke, återkallelse, utloggning/omparning, korrekta rolltexter och samma poäng i tabell/graf. Begränsa testdata och ändra inte tidigare testsvar.

### P1 – funktioner som ännu inte är klara/aktiverade
- [ ] **SW-01: Verifiera och färdigställ B-förståelsedelning** som redan är aktiverad internt (`enableSharedUnderstanding:true` via #88): realtidsavstämning, uttryckligt samtycke, nej/överhoppning, återkallelse, rollanpassad sammanfattning och tvåkontotest. Aktivering i kod är inte lika med färdig användarvalidering.
- [ ] **SW-02: Slutverifiera den aktiva gemensamma insiktsytan** (`enableSharedInsights:true` via #88) för alla kortlekar: serververifierat A JA+JA, separat behörig B-information, ”Möjligt att utforska” och ”Så här funkar jag/min tonåring”, kvalitativa råd och meningsfull prioritering. Riktiga tvåkontotester och sluten prioriteringsfunktion återstår.
- [ ] **SW-03: Koppla privat viktighetsskattning (tre lägen)** till faktisk gemensam prioritetsordning för godkända resultat. Behåll integritet och tydlig skillnad mellan individuell prioritet och gemensamt beslut; därefter `enableSharedPriorities`.
- [ ] **SW-04: Validera överhoppning och live-matchningar** över stora kortlekar, inklusive ofullständig kortlek, återbesök, lås-/upplåsningslogik och ändrade kortversioner. Rätta eventuella kvarvarande synkfel innan polling aktiveras.
- [x] **MI-01A – mergad och publicerad 3 nov (#90):** separat MI-inspirerad föräldraguide under Kommunikationsråd, med vardagsexempel, autonomi, vuxenansvar och länkar till tre svenska kunskapskällor. Länk i Schyssta listan, rollbegränsad vy, mobil- och Node-tester. PR-CI #41612247828, main UI #41612435895 och Pages #41612433986 gröna. Verklig rollkontroll med två autentiserade konton återstår.
- [ ] **MI-01B – granska och följa upp:** CI/Pages passerade för #90. Verifiera med faktiskt förälder-/tonåringskonto samt språk, källornas relevans och användbarhet i mobilen. Bedöm inte detta som en validerad MI-behandling.
- [x] **SW-01A – korrekt B-information mergad och publicerad (#90):** texten som felaktigt sade att delning var avstängd är ersatt. Förklarar att varje förståelsekort förblir privat tills tonåringen uttryckligen delar och länkar till Gemensamma insikter. Kod-, mobil- och build-tester passerade 3 november.
- [ ] **SW-01B – autentiserad B-verifiering:** testa delning, återkallelse, äldre kortsvar, omparning samt exakt samma serverdata hos båda roller och AI innan den bredare SW-01-punkten kan markeras färdig.
- [ ] **PF-01: Versionssäkra testomgångar och full datahantering.** Egen IPIP-JSON-export är kodad separat i PF-01A. Ny omtestningssession, datum/version, historik och självständig radering/export av all användardata utan att tyst skriva över svar återstår.
- [ ] **PF-02: Fullfölj metodgranskning.** Översättningens begriplighet/validitet för ungdomar, mätinvarians mellan tonåring och vuxen, den amerikanska vuxenreferensens begränsningar samt lämpligheten av normalmodellerade percentiler.
- [ ] **PF-03: Textkvalitet och återkoppling.** Testa råpoängsgränsernas begriplighet, att hypoteser inte uppfattas som diagnoser, textlängd och praktiskt värde från både föräldra- och tonårsperspektiv. Separera sorteringsgränser från psykometrisk säkerhet.
- [ ] **UX-01: Gör slutlig mobil- och tillgänglighetsgenomgång.** Granska den tidigare rapporterade avklippta nedersta menyn, bredder 320/390 px, stora tecken, skärmläsare, tangentbord, fokus, felmeddelanden och scrollbar.
- [ ] **UX-02: Fullfölj ikonbaserad och kortfattad Gillaswajpen-sammanfattning**, inklusive strukturerade råd, prioriterade kort och tillgängliga alternativa texter.
- [ ] **NOT-01: Samla behöriga aviseringar på startsidan** från kortaktiviteter, inkorg, regler och nya resultat utan att avslöja privata svar eller skapa störande påminnelser.

### P1 – AI-medlaren i intern testutveckling (2026-11-01)
- [x] **AI-01A: Driftsatt separat Worker, Workers Free, autentisering, verklig D1-kvot och svensk fiktiv modellprovsvar.** Ingen publik webbplatsmerge.
- [x] **AI-01B: Privat D1-chatt med skapande, lista, historik, radering, serverstyrd ägarisolering och rollstyrt stöd (parent/teen via verifierad RPC).** En ren AI-featurebranch mergades via PR #81 till `main` och chattgränssnittet ingår i webbplatsens källkod; live-test på Pages återstår.
- [x] **AI-01C: Fiktiva databas- och V8-kodkontroller.** 28 automatiserade testfall från GitHub-koden passerade i simulerad körning; verklig D1 bekräftar ägarfilter, kaskadradering och stabil meddelandeordning. AI- och UI-workflow har senare passerat för PR #82; detta ersätter den äldre uppgiften om ej verifierad CI.
- [ ] **AI-01D: Verifiera två verkligt autentiserade testkonton, webbläsare/mobil och reella Worker-anrop** innan aktivering på GitHub Pages. Kontrollera även att säkerhetsmeddelanden och konto-/sessionsbyte fungerar som avsett.
- [ ] **AI-01E: Granska barn-/ungdomsskydd, kliniska risker, säkerhet och dataskydd.** Endast fiktiva samtal hittills; enkel riskfrasmatchning är INTE en klinisk säkerhetslösning.
- [ ] **AI-02/03: Kvalitetsverifiera redan aktiva automatiska Gillaswajp-/personlighetsanalyser** (Worker och intern `enableAiResultAnalyses:true` via #86). Granska faktiska modelltexter, behörig kontext, språk, rollasymmetri och korrekt uppdatering efter återkallat samtycke. Tvåkontotest saknas.

- [x] **AI-01G – valbar projektkontext (implementerad kod på PR #84):** kryssruta för att använda/inte använda projektuppgifter inför svar. När av hoppar Worker över samtliga projekt-/roll-RPC:er; ogiltig flagga nekas. Node- och Playwright-mobiltest (simulerad Worker) för opt-out/återställning och serverkontroll, plus regression för återkallat Big Five-samtycke. **PR #84 är nu mergad till `main`; faktisk Cloudflare Worker-release och tvåkontotester återstår.** 
- [x] **AI-01G – automatisk CI:** AI-backend, Node, bygget och UI/Playwright passerade efter senaste kodändringen; 28 screenshots inklusive mobil opt-out genererade (GitHub Actions run #41419931438, AI run #41419931803).
- [ ] **AI-01G – återstår till färdig leverans:** faktisk verifiering av distribution av uppdaterad Cloudflare Worker och manuell verifiering med båda riktiga testkontona. Testa återkallat samtycke i den verkliga miljön separat.

- [x] **AI-01F: Ge medlaren behörig kontext från Hemmakompassens andra sidor.** PR #82 mergad till main, uppdaterad Worker på Cloudflare, godkänd AI-/browser-CI. Implementerat: egna Gillaswajpen-svar och prioriteringar, servergodkända gemensamma ja-ja, egna Big Five-faktorer, endast samtyckt delad profil, godkända regler/förslag och högst fyra korta inkorgsutdrag. Underlaget hämtas om inför varje svar, med stark roll- och sekretessprompt. **Återstår:** manuell test med båda interna konton samt kontroll att återkallat samtycke slår igenom i AI-svaren.
### P2 – framtida tjänstekvalitet
- [ ] **AI-01: Produktionsklar AI-medlare** återstår trots driftsatt intern testserver och kod för privat chatthistorik. Följ AI-01D/E samt ROADMAP FAS 5; markera inte som färdig före verklig tvåkontotestning och skyddsgranskning.
- [ ] **DATA-01: Datahantering och juridik för pilot.** Radering/export/retention, rättslig grund, information till ungdomar, incidenthantering och eventuell DPIA. Genomför innan externa verkliga användare.
- [ ] **PILOT-01: Genomför verklig användbarhets- och etisk granskning** med föräldrar/ungdomar innan offentlig lansering. Mät förståelse och upplevd press; inga påståenden om behandlingseffekt utan evidens.

### Intern driftsättning av AI-reflektioner – 2 november 2026
- [x] PR #85 mergad till main med godkänd CI.
- [x] Ny Cloudflare Worker driftsatt till 100 %, sex ursprungliga bindningar kvar, allowlist med två testkonton.
- [x] Frontendaktivering mergad och publicerad i PR #86 med synkroniserade cacheversioner. Servern begränsar fortsatt åtkomsten till de två interna AI-testkontona.
- [x] Release-PR #86: mergad, UI-/Playwright-CI #41430090229 och GitHub Pages-deployment #41430089630 godkända. Riktig inloggad genomgång står kvar som egen uppgift.
- [ ] Två verkliga autentiserade testkonton, återkallat samtycke, AI-textgranskning och återupptagning kräver ytterligare test. B-förståelsekort fortsatt avstängda.
- [x] **QA-protokoll skapad:** `docs/ai-reflections-two-account-qa.md` med konkreta fall för egna/samtyckta profiler, JA+JA, B-förståelsekort, kvot och kontobyte. Dokumentet är en testplan, inte genomförda autentiserade tester.

### AI-02/03 – automatiska analyser i resultatvyerna (2 november 2026)
- [x] **AI-02/03 konfliktlösning:** `main` inklusive mergade PR #84 och kod för PR #85 sammanförda i merge-commit `acb1f48d79a95e68597e832ef115cd4b2fd606fd`; GitHub markerar #85 som mergebar. CI för kombinationen ska verifieras innan eventuell merge.
- [x] **AI-02/03 kod på PR #85:** separat AI-analysendpoint med serverberäknade fem IPIP-poäng, endast ömsesidigt servergodkända A JA+JA, frivilligt delade partnerfaktorer samt rollanpassad analys. Inga klientinskickade poäng eller svar accepterade.
- [x] **UI-kod på PR #85:** generera automatiskt vid färdigt personlighetstest och hämtade swajpmatchningar, visa analys på samma sida med laddstatus, felhantering och manuell omgenerering. Förskrivna tolkningsråd döljs när AI aktiveras; faktiska grafer och resultat finns kvar.
- [x] **Testkod på PR #85:** autentisering, negativa klientsvar, serverkontrollerade delningsgränser, avbrutet test, kvot, XSS-escaping och återanvändning per resultatsession.
- [x] **AI-02/03 automatisk CI/Playwright:** GitHub Actions AI #41424425020 samt UI #41424425062 gröna med syntetiskt mobiltest, 29 skärmbilder och verifierat statiskt bygge.
- [ ] **AI-02/03 verklig kvalitet:** två autentiserade testkonton, språk/rollasymmetri, manuellt granskade mobilbilder, återkallelse och faktisk kvotförbrukning återstår.
- [x] **AI-02/03 teknisk intern release:** Cloudflare Worker `/api/ai/analyze` och `enableAiResultAnalyses:true` är driftsatta via #86. Behörig B-delning genom #88 tillåter bara uttryckligen delade förståelsekort. Verkliga tvåkontotester, återkallelse och granskning av faktiska modelltextsvar återstår.

## Arbetsregel för följande utvecklingspass
**Obligatoriskt enligt ROADMAP 2026-11-02:** kryssa av varje genomförd förändring i samma utvecklingspass, dela upp delvis färdiga uppgifter och ange PR/commit samt verifieringsnivå. `[x]` för branchkod betyder inte publicering eller riktig tvåkontoverifiering.

1. Börja med högst prioriterade oavslutade `INT-*` / `SW-*` uppgifter och korrigera dokumenterade blockerare; om autentiserat test blockeras, fortsätt med en kod- eller UX-uppgift som går att genomföra utan extern hjälp.
2. Spara i `ROADMAP.md` eller här: PR/commit, exakta kontroller, vad som är **implementerat**, **verifierat med mock/CI**, **verifierat i verkligt tvåkontoflöde** samt vad som inte är känt.
3. Dra inte slutsatsen att en migrationsfil i GitHub är installerad eller att en flagga är på. Verifiera via rätt källa.
4. Bevara befintliga svar, samtyckeskrav och serveravgränsningen. Publicerad Pages-URL är fortfarande en internetåtkomlig sida, även om projektet är avsett för intern testning.
