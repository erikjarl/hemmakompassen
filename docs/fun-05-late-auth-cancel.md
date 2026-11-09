# FUN-05 – sen inloggningskontroll ska inte starta föråldrad AI-analys

**Datum:** 9 november 2026. **Omfattning:** `ai-result-ui.js`, automatiska resultatreflektioner för Gillaswajpen och personlighetstestet.

## Observerat felutrymme

`createAiResultExperience().ensure()` avbryter redan en pågående `AbortController` vid utloggning, invalidering eller ändrat underlag. Men `db.auth.getSession()` är asynkront och använder inte denna signal. Om den kontrollen dröjer tills efter avbrottet, fortsatte den äldre körningen till `fetchImpl('/api/ai/analyze', ...)` trots att dess resultat inte längre fick renderas. Vanlig `fetch` kan själv neka en avbruten signal, men det garanterar inte att ingen gammal Worker-begäran påbörjas under alla implementationer. Den risken finns oberoende av att den föråldrade texten senare ignoreras.

## Ändring

Direkt efter `await db.auth.getSession()` kontrolleras samma aktiva konto, request-epoch, aktuell request-controller och abortstatus. Om begäran blivit inaktuell avbryts flödet **innan** Worker-anropet, utan ny kvotbelastning och utan att skriva ett fel i den nya vyn. Den befintliga slutsynkroniseringen och senare resultatvalideringen behålls.

## Regressionstester

`tests/ai-result-late-session.test.mjs` testar verklig exporterad UI-logik mot kontrollerade syntetiska, uppskjutna session-Promises:

1. Utloggning/kontobyte medan `getSession` väntar: den äldre sessionen får svara, men inga föråldrade Worker-anrop görs.
2. Nytt resultatunderlag medan gammal `getSession` väntar: endast senaste versionen anropar Worker, och den gamla texten kan inte ersätta resultatet.
3. Explicit invalidering medan sessionkontrollen väntar: inget Worker-anrop eller återupplivat resultat.

**Verifieringsgräns:** detta är Node-regression med simulerad Auth/Worker. Ingen verklig Supabase-session, nätverksfördröjning mot Cloudflare, modellkostnad eller fysisk mobil är provad. Inga verkliga konton, svar eller inställningar ändras. Grön CI ska rapporteras separat efter körning.
