# FUN-02 – fullständig webbläsargenomspelning av två 104-kortslekar

**Datum:** 8 november 2026. **Testnivå:** syntetisk Chromium/Playwright med lokal statisk sajt, in-memory Auth och Supabase-mock. **Kod:** `tests/visual.mjs`, funktionen `verifyLongThemeDeckJourneys`.

**Verifiering:** [PR #209](https://github.com/erikjarl/hemmakompassen/pull/209), commit `2904781d4c62f0c0182612bb105e5f5681680945`, [godkänd browser-CI #42487776337](https://github.com/erikjarl/hemmakompassen/actions/runs/42487776337). CI-steget **Browser tests and screenshots** hade slutsats **success**, liksom kontraktstester och byggkontroll.

## Utförd metod och utfall

1. Initiera två separata, **syntetiska** användarsessioner: förälder med 390 px viewport och tonåring med 320 px viewport. Båda är förinställda som parade i en in-memory mock, inte inloggade mot verkliga Auth.
2. Öppna `Samtalsämnen (samtal)` och `Aktiviteter (aktiviteter)`, vardera 104 kort, för respektive roll.
3. Klicka det faktiska synliga JA-/NEJ-reglaget för **varje** kort i ordning, kontrollera att samtliga positioner 1–104 är tillgängliga och att synlig kortetikett uppdateras.
4. På kort 1, 52 och 104 kontrollera sparad användare, kortlek, stabilt kort-ID, JA/NEJ-värde och databaskontraktet `onConflict=user_id,deck_id,card_id`.
5. Kontrollera slutrubriken med **104 sparade kort** och privat svarssammanfattning, frånvaro av horisontell dokumentöverströmning, återgång till kortlekslistans 104/104-status och återöppning av redan färdig lek.
6. Starta om genom `Gå igenom igen`, ändra första svaret från JA till NEJ och kontrollera att den privata sammanfattningen ändrats.

**Observerat:** fyra godkända 104-kortsflöden (2 kortlekar × 2 roller), totalt **416 syntetiska klick på JA/NEJ** i testet. Det genererar `artifacts/fun-02-long-decks-synthetic.json`, med en post per roll/kortlek. Inga faktiska användarsvar i Supabase har ändrats.

## Vad detta inte visar

Det är **inte** test av riktigt inloggade förälder/tonåring, produktionsdatabasens persistens, datasynkronisering mellan två fysiska enheter, faktisk delnings-/samtyckesfunktion, AI-genererat innehåll, Safari eller fysisk mobil. Tidigare utförda tester av åttakortsleken och start/återupptagning för övriga temalekar finns i [FUN-02](fun-02-deck-browser-flows.md). Fortsätt med tvåkontotest och tom-/fel-/insiktslägen utan att ändra äldre testsvar.
