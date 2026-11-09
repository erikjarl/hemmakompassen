# FUN-04 – begränsad väntetid för frivillig profildelning

**Datum:** 9 november 2026. **Kod:** `personality/ipip50-ui.js`. **PR:** [#262](https://github.com/erikjarl/hemmakompassen/pull/262).

## Reproducerat användarfel

Tre användarflöden kunde fastna på Supabase-Promises utan deadline:

1. Skrivning av `set_my_ipip50_share` vid aktivering eller återkallelse av delning: knappen kunde fortsätta visa **Sparar…** och förbli låst.
2. Kontrolläsning av `personality_share_preferences` efter användarens val: samma låsta tillstånd vid uteblivet serversvar.
3. Periodisk tyst serverkontroll av delningsstatus i `refreshShared()`: föråldrad information kunde stå kvar utan en avklarad statuskontroll.

Den avsiktligt oförändrade koden testades i syntetisk Node-CI: [röd baslinje #42575283240](https://github.com/erikjarl/hemmakompassen/actions/runs/42575283240), **501 PASS och 3 FAIL av 504**. De enda misslyckade fallen var ovanstående tre nya tester.

## Korrigering

Alla tre anrop återanvänder den redan införda `withinDeadline()`-mekanismen med normalgränsen **15 sekunder**. Skrivning och kontrolläsning är separata steg. Om skrivkvittot saknas kontrolleras serverns delningsstatus en gång, men det görs ingen automatisk omsändning. Om en kontrolläsning också är otillgänglig visar gränssnittet tydligt att status är **okänd**; den gemensamma jämförelsen döljs och användaren kan välja **Kontrollera delningen igen**. En återkallelse får aldrig bekräftas enbart utifrån ett utgånget nätverksanrop.

## Tester

`tests/ipip50-consent-timeout.test.mjs` använder falska Auth-sessioner och kontrollerade, obesvarade Promise-resultat. Tre scenarier körs både som syntetisk förälder och som tonåring, med explicit omförsök och verifiering att ett osäkert skrivresultat aldrig skapar dubbla skrivningar. Hela befintliga testsviten och syntetiska Chromium-skärmbilder måste också passera före merge.

## Begränsningar

Inga riktiga Supabase-konton, personlighetssvar eller delningsinställningar har förändrats i dessa tester. Ingen fysisk iOS/Safari-verifiering eller verklig förälder–tonåring-session ingår. Det är fortfarande nödvändigt att verifiera riktiga tvåkontoflöden innan funktionen klassas som fullständigt testad. Delningskontrollernas serverregler har inte ändrats.
