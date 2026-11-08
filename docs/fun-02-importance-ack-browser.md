# FUN-02 – webbläsarverifiering av privat viktighet efter tappad skrivkvittens

**Datum:** 8 november 2026. **Ändring:** [PR #234](https://github.com/erikjarl/hemmakompassen/pull/234), merge `c890d3b36409d835028f360810b1d1d84bd65146`.
**Verifierad PR-CI:** [GitHub Actions #42529721991](https://github.com/erikjarl/hemmakompassen/actions/runs/42529721991): 369/369 Node-tester, statiskt bygge, full syntetisk Chromium-svit och 77 skärmbilder.

## Syfte och testmetod

Förra ändringen [PR #233](https://github.com/erikjarl/hemmakompassen/pull/233) lade till serveråterläsning vid en tappad skrivkvittens för `swipe_importance`, men detta var då bara testat på Node-nivå. Detta pass kompletterar verifieringen med riktiga `input`- och `change`-händelser på själva HTML-reglaget i Chromium. Det är **inte** en ny produktionskodändring.

`tests/visual.mjs` använder två självständiga **syntetiska roller**: förälder i 390px och tonåring i 320px. För båda provas allmänna kortleken och temakortleken Förändring. `freshContext` simulerar Auth och Supabase med ett separat in-memory-datalager för varje fall. Testet fyller reglaget, väntar på UI-status och jämför faktiska skriv- och läsoperationer, sparad användare, lek, kort, betydelsenivå och att kortet inte går vidare av sig självt.

## Genomförda scenarier

| Scenario | Antal | Förväntat och observerat i syntetisk Chromium |
| --- | ---: | --- |
| Skriven nivå har sparats men kvittot försvinner | 4 | Exakt en kontrolläsning bekräftar servervärdet; reglaget behåller nivå +1; ingen dubblettskrivning |
| Skrivningen avvisas innan lagring | 4 | Serveråterläsning visar att nivån saknas; UI visar senaste bekräftade nivå och begriplig feltext; användaren kan försöka igen |
| Kontrolläsningen misslyckas | 4 | UI beskriver resultatet som okänt i stället för att påstå att något inte sparats; ett aktivt nytt val går att spara |
| Nyare nivå väljs medan äldre skrivning väntar och tappar kvitto | 4 | Den senare, uttryckligen valda +1-nivån sparas efter det äldre försöket och försvinner inte ur kön |

**Summa: 16/16 syntetiska scenarier godkända.** Testet verifierar även att privat betydelse inte ändrar Ja/Nej-svaret automatiskt och att läsning knyts till exakt konto/lek/kort. Råfall sparas i GitHub Actions-artifact `fun-02-importance-write-ack-browser-synthetic.json`; den breda körningen sparar även skärmbilder.

Den första röda [CI-körningen #42529532428](https://github.com/erikjarl/hemmakompassen/actions/runs/42529532428) stannade på ett äldre, orelaterat prioritetstest: en syntetiskt förladdad post saknade `user_id` och sorterades korrekt bort av den förbättrade databasmocken. Efter att testfixturens tre rader fick rätt ägarfält gick hela sviten igenom. **Detta är inte en reproducerad bugg i produktionskoden.**

## Begränsningar och nästa steg

Alla 16 scenarier använder **mockad Auth och simulerad databas**, inte riktiga två signerade testkonton eller faktisk avbruten Supabase-nätverkstrafik. Ingen fysisk iPhone, Safari eller VoiceOver testades. Ingen verklig sparad användardata ändrades. FUN-02 är därför fortsatt **Pågår**, inte färdig och verifierad.

Nästa verifiering bör utföras i den publicerade webbappen med två riktiga testkonton: ändra nivå, lämna/återvänd, ladda om och logga in på nytt; kontrollera serversparad beständighet och synk mellan två sessioner utan att skriva över tidigare testkontosvar. Simulera förlorat nätverkskvitto först i en tillåten separat testmiljö med disponibla data.
