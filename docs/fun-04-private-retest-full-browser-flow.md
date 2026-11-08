# FUN-04 – privata IPIP-50-omtest: två hela syntetiska användarflöden

**Datum:** 8 november 2026. **Verifieringsnivå:** Playwright/Chromium med mockad Auth, Supabase och två isolerade användarsessioner; ingen verklig användardata ändrad.

**Kod:** `verifyFullPrivateRetest()` i `tests/visual.mjs`, introducerad i [PR #213](https://github.com/erikjarl/hemmakompassen/pull/213), mergad som [`1c23791d`](https://github.com/erikjarl/hemmakompassen/commit/1c23791d0919e53cf39eebd250138d3df8849865). **Slutlig grön CI:** [#42490647310](https://github.com/erikjarl/hemmakompassen/actions/runs/42490647310).

## Genomförd metod

Förälder med 390 px och tonåring med 320 px körs i separata syntetiska webbläsarkontexter. Ursprungligt IPIP-50-test simuleras redan färdigt; det nya omtestet startas via den riktiga knappen.

1. Starta ny privat testomgång; svara på första påståendet. Kontrollera att fråga 2 visas och att en privat sparad post finns.
2. Klicka **Spara och pausa**, lämna Personlighet för Hem, återvänd och välj **Fortsätt privat omtest**. Kontrollera att fråga 2 återkommer. Gå tillbaka till fråga 1, verifiera sparat svar och korrigera från 4 till 2.
3. Svara på återstående 49 frågor via vanliga klick på radioknappar. Kontrollera att exakt 50 privata omtestsvar lagrats i in-memory-mocken och att ursprungsprofilens resultat fortfarande visas.
4. Klicka **Avsluta omgången och spara resultat**. Kontrollera historik, återöppna den avslutade omgångens resultat och ladda ned en riktig JSON-fil med 50 enskilda omtestsvar. Kontrollera att första svaret är den reviderade siffran 2 och att exporten saknar `partner` och `user_id`.
5. Kontrollera att ingen horisontell dokumentöverströmning uppstår i respektive mobilviewport; spara skärmbilder och resultatfil.

**Observerat:** 2/2 hela rollflöden passerade i [slutlig Chromium-CI #42490647310](https://github.com/erikjarl/hemmakompassen/actions/runs/42490647310), totalt 100 unika omtestfrågor (50 per roll), plus revideringar av fråga 1. Resultat i Actions-artifact `fun-04-private-retests-complete-synthetic.json` och skärmbilder `fun-04-private-retest-complete-parent.png`, `fun-04-private-retest-complete-teen.png`.

## Reproducerat testfel och åtgärd

Den första CI-körningen [#42490302911](https://github.com/erikjarl/hemmakompassen/actions/runs/42490302911) var **röd** eftersom Playwrights `locator.check()` väntade på att det gamla radioelementet skulle förbli markerat efter att sidan omrenderats av en lyckad klickhändelse. Testet stannade på fråga 1. Testskriptet ändrades till `locator.click()`, följt av kontroll av nästa UI-tillstånd, i commit `eed6ec33`. Ingen produktionskod modifierades. Hela testsviten passerade därefter.

## Begränsningar och nästa steg

Detta är **inte** verklig databasbeständighet, verkligt användarsamtycke, signerat tvåkontotest, fysisk iOS/Safari eller en klinisk validering av IPIP-50. Testet bekräftar UI-flöde och simulerade skriv-/läsanrop. Nästa steg för FUN-04: verifiera riktig Supabase-persistens/återupptagning, fel-/konkurrenslägen med riktiga testkonton och radering av omtest i verklig miljö **utan att röra befintliga gamla svar**.
