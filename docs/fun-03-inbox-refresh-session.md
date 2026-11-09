# FUN-03-INBOX-RACE-02 – föråldrad uppdatering av hela inkorgen

**Datum:** 9 november 2026 · **PR:** [#242](https://github.com/erikjarl/hemmakompassen/pull/242) · **Status:** kodfix i PR, slutlig verifiering inväntas.

## Reproducerat användarflödesfel

Den befintliga `refreshWholeInbox()` används av inkorgens gemensamma Uppdatera-knapp och samordnar privat chatt, olästa meddelanden, Schyssta-regler och aktivitetsnotiser. Vid en konto-/familjeväxling nollställer `clearFamilyChat()` den gamla laddningsflaggan. Den nya sessionen kan då starta en ny uppdatering. När den äldre uppdateringen senare avslutas körde den ändå `finally { inboxRefreshing=false; ... }` trots att den tillhörde fel session. Det ger ett tidsfönster där en extra klickning kan starta ytterligare en begäran medan den nya fortfarande laddar.

[Röd CI #42543285903](https://github.com/erikjarl/hemmakompassen/actions/runs/42543285903) med **oförändrad produktionskod**: 419 av 421 Node-tester godkända och två fel i nya scenarier: (a) gammal lyckad/avvisad parningskontroll återställde ny sessions busy-flagga och (b) gammalt fel gjorde samma sak. Fyra nya kontrollfall för vanliga uppdateringar, dubbelklick, fel och navigation passerade redan.

## Ändring

`finally` får bara ändra `inboxRefreshing`, rita om inkorgen och återställa tangentbordsfokus **om både användar-ID och `sharedSession` fortfarande matchar** den begäran som startade uppdateringen. Detta bevarar statusen för den nya sessionens ännu pågående uppdatering och lämnar inbyggd fel-/statushantering för den aktuella sessionen oförändrad.

Inga ändringar i Supabase, kontoidentiteter, sparade privata meddelanden eller regler.

## Reproducerbar testmetod

`node --test tests/inbox-refresh-session-race.test.mjs` extraherar produktionsfunktionen ur `live-app.js` och kör den i Node VM med kontrollerade asynkrona parningssvar, fiktiva konton och DOM-fokusmock. Sex fall testar:

1. Gammal begäran slutar efter att ett annat konto startat en ny – den nya uppdateringen förblir låst och slutförs normalt.
2. Samma sessions samtidiga dubbelklick startar inte två uppdateringar.
3. Misslyckad kontroll av parning lämnar tydligt fel och frigör pågående status.
4. Ett fel i en inkorgssektion ger inte falsk kvittens om att allt uppdaterats.
5. Navigation bort från inkorgen under laddning varken hämtar meddelanden eller stjäl fokus.
6. Fördröjt fel från gammalt konto får inte uppdatera den nya sessionens status.

**Begränsningar:** deterministiska syntetiska promises/DOM, inte verkligt nätverksfel, inloggning med två verkliga testkonton, fysisk Safari eller tillgänglighetstest med skärmläsare. Ett grönt Node-/Chromium-test räcker inte för status *Färdig och verifierad* för FUN-03.
