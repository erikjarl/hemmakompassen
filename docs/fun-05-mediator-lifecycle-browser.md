# FUN-05 – AI-medlarens sparade samtal: syntetiskt webbläsarflöde

**Datum:** 8 november 2026. **Miljö:** Playwright/Chromium; förälder 390 px och tonåring 320 px. Autentisering och AI-Worker ersätts av syntetiska, separata testfixturer. **Verifiering:** [PR #219](https://github.com/erikjarl/hemmakompassen/pull/219) mergad som [`146a87b3`](https://github.com/erikjarl/hemmakompassen/commit/146a87b3bd21125e13cfeaeca600e51e248c324d); [slutlig grön Chromium/Node/bygg-CI #42498075069](https://github.com/erikjarl/hemmakompassen/actions/runs/42498075069).

## Metod och acceptanskriterier

Testfunktionen `verifyMediatorConversationLifecycle()` i `tests/visual.mjs` använder verkliga klick, formulärinmatningar, en omladdning och bekräftelse av raderingsdialoger i ett lokalt Chromium-fönster. Fake-Workern håller privata chattar och meddelanden i minnet i just det webbläsarkontextet.

För **var och en** av föräldra- och tonårsrollerna prövas följande sex steg:

1. Start utan samtal; första meddelandet skapar privat chatthistorik med ett korrekt lagrat syntetiskt användar-/assistentpar.
2. **Nytt samtal** rensar föregående synlig historik; andra meddelandet skapar ett separat samtal.
3. Temporärt fel vid öppning av ett äldre samtal visar feltext **utan gamla synliga meddelanden**; nytt klick laddar rätt historik.
4. Omladdning hämtar sparad historik från den syntetiska fixturen och återöppnar det senaste samtalet.
5. Fel vid meddelandesändning behåller textutkastet, skapar inget falskt svar och lyckad omförsändning skapar ett enda nytt användar-/assistentpar.
6. **Radera detta samtal** tar först bort valt samtal och visar återstående konversation; efter radering av sista samtalet visas tomt tillstånd.

Varje steg innehåller uttryckliga `assert`-kontroller, och båda mobilbredderna kontrolleras för dokumentöverströmning. Loggfilen `artifacts/fun-05-mediator-lifecycle-synthetic.json` och två skärmbilder publiceras som Actions-artifact.

## Verifieringsbegränsningar

**Ingen riktig Supabase Auth, två inloggade riktiga testkonton, faktisk AI-modell/Worker, D1-beständighet eller fysisk iPhone/Safari har testats.** Att reload fungerar med in-memory fake-Worker bevisar inte att serverlagring överlever en riktig utloggning. Testet gör inga skrivningar i skarp databas och säger inget om AI-svarens kvalitet eller faktiska effekter för familjer.

**Verifieringsstatus:** **12/12 syntetiska roll-/stegscenarier PASS** i slutlig CI, inklusive båda Chromium-vyerna och övrig Node-/byggsvit. Första [röda CI #42497904187](https://github.com/erikjarl/hemmakompassen/actions/runs/42497904187) var ett **fel i testselektorn**: den räknade historiklistans samtalstitel som ett läckt chattmeddelande. Selektorn begränsades till `.mediator-message-user` och hela sviten passerade. Ingen produktionskod ändrades i denna PR.
