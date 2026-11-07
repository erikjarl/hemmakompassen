# SEC-02 / SW-03 – delade prioriteringar, negativ behörighetskontroll

**Datum:** 8 november 2026. **Databas:** ansluten Supabase för Hemmakompassen.

## Metod och resultat

Testet `supabase/tests/sec02_shared_priorities_readonly.sql` kördes mot installerad `public.shared_swipe_priorities` med `BEGIN TRANSACTION READ ONLY`, `SET LOCAL ROLE authenticated` och **simulerade** `request.jwt.claims`. Befintliga användar-ID identifierades enbart i transaktionen utifrån ett parat föräldra-/tonåringspar och ett utomstående konto; inga ID eller privata svar skrevs ut i rapporten.

Kontrollerade samtliga sju kortlekar: `general`, `samtal`, `aktiviteter`, `regler`, `uppskattning`, `aterhamtning`, `forandring`.

- **PASS:** föräldern och tonåringen fick identiska listor över delade prioriteringar för varje kortlek.
- **PASS:** utomstående konto fick 0 delade prioriteringar i varje kortlek.
- **PASS:** RPC:en avvisade anrop med `authenticated`-roll men utan användar-ID.
- **PASS (men utan positivt testfall):** inga returnerade delade prioriteringar saknade eget JA-svar för de respektive inloggningsrollerna.

**Väsentlig begränsning:** räknade också antalet delade prioriteringar för testparet: **0 i samtliga sju kortlekar**. Därför bevisar körningen inte att en verkligt delad prioritering visas och inte heller att endast samtyckta prioriteringar är synliga när data faktiskt finns. Det egna JA-villkoret blir ett tomt testfall. `eligible_swipe_priorities` har medvetet inte anropats av `authenticated`, eftersom installerade EXECUTE-grants nekar sådan direkt åtkomst.

## Fortsatt blockerande verifiering

1. Riktiga signerade Auth-sessioner för två existerande konton.
2. Positivt, separat samtyckt prioriteringsfall som använder isolerad syntetisk testdata med full rollback, och negativa fall vid återkallelse, avparning, ändrat JA/NEJ eller prioritet. Tidigare testsvar ska bevaras.
3. Test mot ytterligare en **aktiv** familj för familj-till-familj-isolering.
4. UI-kontroll för både förälder och tonåring.

**Status:** SW-03 förblir Pågår och flaggan `enableSharedPriorities:false` får inte ändras baserat på detta test. Det här är ett negativt RPC-test med simulerade JWT-claims, **inte** verkliga signaturer eller en genomförd fullständig säkerhetsgranskning.
