# FUN-06 – kommunikationsformulär: funktionella webbläsartester

**Datum:** 8 november 2026. **Miljö:** syntetisk Chromium/Playwright med mockad Supabase/Auth och två separata roller, förälder 390 px och tonåring 320 px.

**Kod/leverans:** `verifyCommunicationForms()` i `tests/visual.mjs`, [PR #214](https://github.com/erikjarl/hemmakompassen/pull/214), merge-commit [`180bd2d9`](https://github.com/erikjarl/hemmakompassen/commit/180bd2d952d448e69089b4b7e2314dfd6dceba10), [grön CI #42491161264](https://github.com/erikjarl/hemmakompassen/actions/runs/42491161264). JSON-rapport `artifacts/fun-06-communication-forms-synthetic.json` i Actions-artifact.

## Testmetod

För var och en av de två syntetiska rollerna utförs **tre konkreta UI-formulärflöden**:

1. **Spegling:** gå till `#kommunikation`, kontrollera att HTML-formulär med tre obligatoriska texter initialt är ogiltigt, fyll i tre fält, skicka formuläret och kontrollera att den genererade speglingen innehåller den egna texten. Klicka **Töm speglingen**, verifiera tomt inmatningsfält och återställt output samt tangentbordsfokus på första fältet.
2. **Samtalsplan:** kontrollera native required-validering av fyra fält, fyll i problembeskrivning, öppen fråga, eget experiment och uppföljning, generera en plan med rätt text och frivillighetsmarkering. Klicka **Töm fälten** och kontrollera att förhandsgranskning, inmatning och fokus återställs.
3. **NVC/jag-budskap:** gå till `#nvc`, kontrollera obligatoriska fyra fält, ange observation, känsla, behov och önskemål. Generera och kontrollera att den synliga meningen motsvarar fälten. Klicka **Töm fälten**, kontrollera tomt utkast och fokus. Fyll i ytterligare ett privat utkast, navigera till `#kommunikation` och tillbaka och verifiera att utkastet inte bevaras.

**Observerat:** 6/6 roll-/formulärflöden gick igenom i syntetisk Chromium. Testet kontrollerar också frånvaro av horisontell dokumentöverströmning vid 320/390 px. Samtliga Node-, bygg- och Browser CI-steg passerade.

## Begränsningar

Ingen riktig Auth, fysisk mobil, annan webbläsarmotor, klinisk kvalitetstestning eller verkliga användare har provats. Tester av formulärens textproduktion bekräftar bara att det angivna innehållet sammanfogas på avsett sätt; de **bevisar inte att råden förbättrar relationer**. Kopiera-/klistra-in-flöden och alla nio separata övningar är inte fullständigt prövade här. Ingen Supabase-data ändrades.
