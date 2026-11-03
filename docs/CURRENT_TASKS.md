# Hemmakompassen — aktuell utvecklingskö

**Granskad:** tisdag 3 november 2026, efter mergad PR #90; en separat säkerhetsbranch är under CI.  
**Källa:** kod på `main` inklusive PR #90, `backend-config.js`, GitHub Actions/UI/Pages, skrivskyddad Supabase Advisor/RPC-granskning och separat testbranch. Detta är **inte** ett påstående om genomförda verkliga tvåkontotester.  
**Syfte:** En enda kort, uppdaterad handlingslista för manuellt och schemalagt utvecklingsarbete. `ROADMAP.md` bevarar detaljerna och äldre beslut.

## 3 november 2026 – denna utvecklingsbranch

- [x] **PR #90 mergad, kod- och UI-testad och publicerad:** förälders MI-inspirerade guide med källor, korrekt förklaring av separat B-samtycke i kortleken, borttagen dubblerad polling-fokuslyssnare och rättad dokumentation. PR-CI **#41612247828**, main UI **#41612435895**, Pages **#41612433986** godkända; merge commit `c20bd52b918ffb27a3c53db09dcbe2ee679f74e2`. Inget verkligt autentiserat tvåkontotest.
- [x] **SEC-01A – granskad begränsning på utvecklingsbranch:** Supabase Advisor på den riktiga databasen rapporterade 3 november att intern `revoke_understanding_share_on_private_change()` (triggerfunktion `SECURITY DEFINER`) var direkt exekverbar av `anon`, `authenticated` och `PUBLIC`. Läst funktionsdefinition och båda anslutna databas-triggers. En minimal SQL-migration med endast riktad `REVOKE` och Node/pgTAP-liknande verkligt PostgreSQL-baserad syntetisk kontroll har skrivits på `fix/limit-b-trigger-function-execute-20261103`.
- [ ] **SEC-01B – CI, merge och installation:** kontrollera PostgreSQL-/UI-CI, merga säkerhets-PR om tester är gröna, applicera migrationen i verklig Supabase och verifiera med SQL + ny Advisor att direkt-EXECUTE är avstängt medan triggers finns kvar. Lagra inte privata testsvar i loggar.
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
- [ ] **SW-01: Slutför säker B-förståelsedelning** i UI och backend, inklusive tonåringens separata JA, nej/överhoppning, återkallelse, rollanpassad sammanfattning och kontrollerad aktivering av `enableSharedUnderstanding`.
- [ ] **SW-02: Slutför den gemensamma insiktsytan** för alla kortlekar: endast serververifierat A JA+JA, separat behörig B-information, ”Möjligt att utforska” och ”Så här funkar jag/min tonåring”, korta förskrivna råd och meningsfull prioritering; därefter `enableSharedInsights`.
- [ ] **SW-03: Koppla privat viktighetsskattning (tre lägen)** till faktisk gemensam prioritetsordning för godkända resultat. Behåll integritet och tydlig skillnad mellan individuell prioritet och gemensamt beslut; därefter `enableSharedPriorities`.
- [ ] **SW-04: Validera överhoppning och live-matchningar** över stora kortlekar, inklusive ofullständig kortlek, återbesök, lås-/upplåsningslogik och ändrade kortversioner. Rätta eventuella kvarvarande synkfel innan polling aktiveras.
- [x] **MI-01A – mergad och publicerad 3 nov (#90):** separat MI-inspirerad föräldraguide under Kommunikationsråd, med vardagsexempel, autonomi, vuxenansvar och länkar till tre svenska kunskapskällor. Länk i Schyssta listan, rollbegränsad vy, mobil- och Node-tester. PR-CI #41612247828, main UI #41612435895 och Pages #41612433986 gröna. Verklig rollkontroll med två autentiserade konton återstår.
- [ ] **MI-01B – granska och följa upp:** kör CI/Pages och verifiera faktiskt förälder-/tonåringskonto samt språk och användbarhet i mobilen. Bedöm inte detta som en validerad MI-behandling.
- [x] **SW-01A – korrekt B-information mergad och publicerad (#90):** texten som felaktigt sade att delning var avstängd är ersatt. Förklarar att varje förståelsekort förblir privat tills tonåringen uttryckligen delar och länkar till Gemensamma insikter. Kod-, mobil- och build-tester passerade 3 november.
- [ ] **SW-01B – autentiserad B-verifiering:** testa delning, återkallelse, äldre kortsvar, omparning samt exakt samma serverdata hos båda roller och AI innan den bredare SW-01-punkten kan markeras färdig.
- [ ] **PF-01: Gör testomgångar versionssäkra.** Ny omtestningssession, datum, aktiv version, historik och självständig radering/export utan att tyst skriva över svar.
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
- [ ] **AI-02/03: Driftsätt och kvalitetsverifiera automatiska, rollanpassade Gillaswajp-/personlighetsanalyser** efter att endpointen finns i Cloudflare och rätt samtycken verifierats. Kod och testfall ligger i PR #85; förskrivna råd ersätts först efter aktivering.

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
- [x] **AI-02/03 teknisk intern release:** Cloudflare Workern med `/api/ai/analyze` är driftsatt till 100 %, `enableAiResultAnalyses:true` är publicerad genom PR #86. B-förståelsekort är fortsatt avstängda. Verkliga tvåkontotester och faktiska modelltextsvar återstår.

## Arbetsregel för följande utvecklingspass
**Obligatoriskt enligt ROADMAP 2026-11-02:** kryssa av varje genomförd förändring i samma utvecklingspass, dela upp delvis färdiga uppgifter och ange PR/commit samt verifieringsnivå. `[x]` för branchkod betyder inte publicering eller riktig tvåkontoverifiering.

1. Börja med högst prioriterade oavslutade `INT-*` / `SW-*` uppgifter och korrigera dokumenterade blockerare; om autentiserat test blockeras, fortsätt med en kod- eller UX-uppgift som går att genomföra utan extern hjälp.
2. Spara i `ROADMAP.md` eller här: PR/commit, exakta kontroller, vad som är **implementerat**, **verifierat med mock/CI**, **verifierat i verkligt tvåkontoflöde** samt vad som inte är känt.
3. Dra inte slutsatsen att en migrationsfil i GitHub är installerad eller att en flagga är på. Verifiera via rätt källa.
4. Bevara befintliga svar, samtyckeskrav och serveravgränsningen. Publicerad Pages-URL är fortfarande en internetåtkomlig sida, även om projektet är avsett för intern testning.
