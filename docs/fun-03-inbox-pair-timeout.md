# FUN-03 – familjekontroll med tidsgräns för inkorgens användarhandlingar

**Datum:** 9 november 2026. **PR:** [#254](https://github.com/erikjarl/hemmakompassen/pull/254).

## Reproducerat funktionsproblem

`recheckInboxPair()` kontrollerar både familjemedlemmar och den aktuella parningsperioden via två asynkrona Supabase-RPC-anrop. Kontrollen samordnas för bakgrundsuppdatering och användarhandlingar, till exempel Skicka i inkorgen och Föreslå tid från Gillaswajpen. Före denna ändring hade `Promise.all` **ingen tidsgräns**. Om ett av anropen aldrig avslutades förblev även det sammanfogade kontrollanropet väntande, och användarhandlingen kunde aldrig komma vidare.

En ny körbar regression `tests/inbox-pair-check-timeout.test.mjs` med avsiktligt ej avslutade, syntetiska RPC-promises gav först **3/3 FAIL** mot oförändrad kod i [röd CI #42562476258](https://github.com/erikjarl/hemmakompassen/actions/runs/42562476258): båda rollernas hängande verifiering samt förväntad timerstädning saknades.

## Ändring och förväntat beteende

- Båda RPC-svaren måste nå fram **inom högst 15 sekunder tillsammans**. Detta matchar befintlig tidsgräns för att läsa och skicka familjemeddelanden.
- Vid timeout behandlas kopplingens status som **okänd**, inte som en verifierad giltig parning. Inga beroende sänd-/åtgärdsanrop startas; nuvarande familjekontext töms av redan befintligt fel-/omparningsflöde, och en konto-/familjeuppdatering begärs.
- Pågående manuella handlingar och återkommande kontroller samordnas fortsatt i samma Promise. Ett försenat positivt svar efter timeout kan inte återuppliva en äldre koppling.
- Timern rensas också när kontrollen lyckas eller misslyckas snabbt. Samma timeout gäller mobil och dator, föräldra-/tonårsvy.

## Verifiering

Den nya regressionen kör de faktiska klientfunktionerna i Node VM med en kontrollerad 15-sekunders timer. Den provar förälderns och tonåringens ej besvarade kontroll tillsammans med ett klick på Skicka, och ett normalt lyckat kontrollsvar. Förväntat: endast en tidsgräns per delad kontroll, inga osäkra sändanrop, låset släpps, exakt en uppdatering, inga gamla svar återkommer efter fördröjning. Befintliga VM-tester för parning och aktivitetsinbjudan använder nu samma faktiska timerfunktioner.

**Begränsningar:** detta är en klientkorrigering och syntetiska tester, inte en simulering av fysisk 15-sekunders väntan i mobil Safari. Verklig Supabase-Auth, tvåkontosynk, trögt nätverk och faktisk användarupplevelse i publicerad miljö återstår att testa. Inga befintliga konton, meddelanden eller databastabeller har ändrats.
