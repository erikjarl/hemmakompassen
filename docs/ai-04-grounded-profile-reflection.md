# AI-04 – försiktig personlighetstolkning i AI-reflektionen

**Datum:** 9 november 2026 · **Prioritet:** P1, funktions-/innehållskvalitet. Detta är inte en fristående säkerhets- eller GDPR-granskning.

## Problem och begränsning

En tidigare skärmbild visade ett AI-genererat inledande tack och uttrycket **”stark tendens”** kopplat till en personlighetsprofil utan tillräckligt underlag. `analysisInstructions()` sade redan åt modellen att undvika sådana slutsatser, men `enforceActionableAnalysis()` kontrollerade tidigare främst att **Förslag** hade 2–3 konkreta handlingar och giltiga länkar. Den fria **Reflektion**-delen kunde därmed ändå återge påståenden om personlighetsdrag, percentiler eller orsaker till familjeproblem.

## Ändring

1. Worker-prompten förbjuder nu uttryckligen opåkallat beröm, färdigbestämda `du är`-etiketter, ogrundad orsakstolkning och påhittade percentiler. Samtliga fem råpoäng är **självskattade skalpoäng 10–50**, inte normpercentiler.
2. En begränsad deterministisk kvalitetskontroll söker efter **tydliga överdrifter** i just personlighetstexten. Vid träff ersätts bara Reflektion-delen med en neutral, kort text. De fem **egna** skalpoängen hämtas från Workerns serververifierade `loadResultAnalysisInput`, valideras mot den fasta femskalekatalogen och redovisas utan att gissa personlighet, diagnos eller problemorsak. Om kontrollen inte kan verifiera skalsummornas format blir reservtexten generisk i stället för att använda gissade tal.
3. Frivillig tvåprofiljämförelse omnämns endast om Worker-input faktiskt anger `shared === true`. En obehörigt/inte längre delad motpartsprofil blir aldrig innehåll i reservtexten. Befintlig fråga-/länkkontroll av **Förslag** är oförändrad.
4. Neutral, icke-kategorisk modelltext behålls. Den nya kontrollen är en **heuristik**, inte en automatisk faktagranskare; den kan ha både falska positiva och falska negativa.

## Testmetod och ärliga begränsningar

`tests/ai-profile-grounded-reflection.test.mjs` provar direkt mot produktionsfunktionen i Node med simulerad AI-text: uppmuntrande tack, `stark tendens` vid 31/50, kategoriska påståenden vid råpoängen 10, 20, 30, 32, 45, 50, påstådd orsaksförklaring, felaktig percentil, förälder/tonåring, både delad och odelad partnerprofil samt bevarande av neutral reflektion.

`tests/ai-result-analysis.test.mjs` kompletterar med ett verkligt HTTP-anrop till den importerade Worker-handlern i en **syntetisk Node-miljö** med mockad Supabase/Auth, Worker-AI och kvotlagring. Kontrollerar att överdriven modelltext inte blir API-resultatet, att egna fem skalpoäng finns med och att ingen odelad partnerpoäng tillkommer.

**Reproduktion:** [röd CI #42554172435](https://github.com/erikjarl/hemmakompassen/actions/runs/42554172435), fem fel i 452 Node-tester före kodfix. En mellanliggande [röd CI #42554497493](https://github.com/erikjarl/hemmakompassen/actions/runs/42554497493) hade ett kvarvarande fel i Workerns anropskoppling (451 PASS, 1 FAIL), som rättades i efterföljande commit.

**Slutligt utfall 9/11:** [PR #249](https://github.com/erikjarl/hemmakompassen/pull/249) **mergad** som [`9fef057`](https://github.com/erikjarl/hemmakompassen/commit/9fef057ca25b7fa44d09a347825ebd91257e7503). [Grön UI-/Node-CI #42555034249](https://github.com/erikjarl/hemmakompassen/actions/runs/42555034249): **453/453 Node-tester, statiskt bygge och syntetisk Chromium godkända (77 skärmbilder)**. [AI-backend-CI #42555034303](https://github.com/erikjarl/hemmakompassen/actions/runs/42555034303) också grön, inklusive nya regressionsfall. **Cloudflare Worker faktiskt driftsatt** 9 november 2026 03:16 UTC: deployment `b0929f39-e1ee-4a5d-9625-d529821e2e00`, version `55080057-0d83-4e1d-ba13-bbcea83a5c42` med **100 % trafik** enligt Cloudflare. Kontrollerad uppladdad kod: `index.mjs` hash `ea2d4f99`, `analysis.mjs` hash `54e5d87d`; övriga tre moduler oförändrade jämfört med repo och före deployment. Alla **sex befintliga bindings** (AI, LIMITS, AI_TEST_USERS, APP_ORIGIN, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) finns kvar. Detta verifierar distribution och konfiguration, **inte** faktisk modelltext i inloggat UI.

**Återstår:** faktiska modellutdata på Cloudflare Workers AI med testkonto, verklig signerad förälder/tonåring, klinisk/psykometrisk språkgranskning och fysisk mobil-/Safari-verifiering. Ingen användares sparade svar har ändrats. **Lokal testsuccé eller GitHub-merge är inte samma sak som driftsatt Cloudflare Worker**. Dokumentera separat exakt vilken Worker-version som körs efter eventuell deployment.
