# FUN-05 – AI-reflektion: omförsök och fungerande övningslänkar

**Datum:** 8 november 2026. **Miljö:** syntetisk Chromium/Playwright, föräldraroll 390 px och tonårsroll 320 px, mockad Supabase Auth och simulerad AI-Worker.

## Funktionslucka och ändring

Vid kodgranskning hittades att `renderAiAnalysisReply()` tidigare kunde förvandla **prefixet** på en ogiltig AI-genererad route, exempelvis `#kommunikation/losning-extra`, till en klickbar länk till `#kommunikation/losning`. Det kan leda användaren till en annan övning än AI-texten anger. Den ordagranna ogiltiga routen ska i stället förbli oklickbar.

Klientens route-avgränsning har skärpts, och `tests/ai-result-exercise-links.test.mjs` täcker både ogiltiga suffix (bindestreck, extra segment, query, understreck, nummer och svenska bokstäver) och giltiga rutter med naturlig interpunktion.

## Webbläsarmetod

`verifyAiReflectionRetryAndRoutes()` i `tests/visual.mjs` genomför **åtta syntetiska steg för vardera roll (16 sammanlagt)** med verkliga klick och navigering i DOM:

1. Personlighetsreflektion visas från en fake Worker med rätt `kind=personality, scope=own` och endast två klickbara, existerande övningslänkar; en avsiktligt felaktig route är synlig men oklickbar.
2. Simulerat HTTP 503 vid **Generera ny reflektion** visar feltext utan kvarstående länkar från ett gammalt AI-svar.
3. Nytt klick återhämtar analysen, och tre Worker-försök verifieras.
4. Klick på föreslagen `#kommunikation/lyssna` öppnar rätt faktisk övning.
5. Gillaswajpens AI-resultat visas och begär endast `kind=swipe, scope=general`.
6. Simulerat HTTP 503 döljer gamla AI-länkar.
7. Retry återställer resultatet; tre Worker-försök verifieras.
8. Klick på `#kommunikation/kontakt` öppnar rätt faktisk övning.

Dessutom kontrolleras dokumentets bredd på 320/390 px och skärmbilder samt JSON-rapport sparas som GitHub Actions-artifacts. Tester i `tests/visual.mjs` använder **simulerat testinnehåll, inte verkliga AI-svar**.

## Begränsningar

Detta är ett funktionellt klienttest med fake-Worker, inte verifiering av verklig Supabase Auth, Workers AI, modellkvalitet, nätverks-/serverpersistens eller fysisk Safari/mobil. Inga befintliga testkontons svar eller produktionsdatabaser ändras. **Verifiering:** [PR #220](https://github.com/erikjarl/hemmakompassen/pull/220) är mergad till `main` (`0940ffbf`). [Slutlig grön UI/Node/Chromium-CI #42499191429](https://github.com/erikjarl/hemmakompassen/actions/runs/42499191429) körde **16/16 syntetiska roll-/stegkontroller godkända**, och hela UI-sviten sparade **65 skärmbilder**. Separat backend-CI för samma PR var också grön. Detta bekräftar klientflöden med simulerad Auth/Worker, **inte** verkliga modellutdata.
