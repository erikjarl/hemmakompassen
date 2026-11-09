# FUN-04 – begränsade väntetider för privata IPIP-50-svar

**Datum:** 9 november 2026. **Berörd funktion:** första IPIP-50-testet i `personality/ipip50-ui.js`, förälder och tonåring. Omtesthistorikens egna serveranrop ingår inte i denna åtgärd.

## Reproducerat funktionellt problem

`loadMyIPIP50Answers()` och `saveMyIPIP50Answer()` anropades utan en övre väntetid. Om Supabase-klientens Promise aldrig besvarades kunde förstasidan stå kvar på **Hämtar dina svar…** eller svarsalternativet bli låst under en pågående sparning utan möjlighet till en begriplig återhämtning.

I [PR #261](https://github.com/erikjarl/hemmakompassen/pull/261) infördes två tester med kontrollerade, obesvarade nätverks-Promises. Efter att en initial syntaxmiss i testfixturen rättats gav den oförändrade produktionskoden **499 PASS och 2 FAIL av 501 tester** i [röd baslinje-CI #42574082071](https://github.com/erikjarl/hemmakompassen/actions/runs/42574082071). Felen var att privat svarsläsning respektive sparning inte avslutades ens efter testets väntetid. Den första röda körningen #42573928944 gällde enbart fixturens syntax och är inte evidens för produktfelet.

## Ändring och återhämtning

- Lägger en defaultdeadline på **15 sekunder** kring den privata svarsläsningen, den initiala delningsstatusläsningen, hämtning av serververifierad profiljämförelse och den samlade svarssparningen inklusive eventuell kontrolläsning.
- Vid utebliven läskvittens visas ett fel och knappen **Försök igen**; inga saknade svar antas vara sparade.
- Vid utebliven skrivkvittens markeras utfallet som **okänt** och den befintliga kontrollen **Kontrollera sparat svar** visas. Appen flyttar inte till nästa fråga, skickar inte om svaret automatiskt och kan läsa den faktiskt sparade serverstatusen på nytt.
- Den befintliga spärren på minst 650 ms för radiohändelsen gäller fortfarande vid såväl fel som framgång. Den tillåtna tidsgränsen kan sättas kort i en isolerad testfixtur.
- Ny klientcacheversion `20261109-ipip50-deadline1` synkroniseras mellan HTML, `live-app.js` och personlighetsmodulen.

## Testmetod och begränsningar

`tests/ipip50-ui-timeout.test.mjs` provar **(1)** hängande privat hämtning och lyckad manuell återhämtning och **(2)** hängande skrivning i två syntetiska rollscenarier, med oförändrad frågeposition, ett enda skrivförsök och bekräftad serveråterläsning. Alla tester använder falsk Auth och syntetisk lagring. Node-/Chromium-CI och publicerade bytes redovisas separat i den aktiva roadmapen efter körning.

**Inte verifierat:** verkligt Supabase-nätverksavbrott, autentiserade förälder/tonåring-sessioner, Safari/iPhone eller omtestmodulens separata skrivflöden. Inga befintliga testsvar har ändrats.
