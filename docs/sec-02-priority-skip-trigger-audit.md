# SEC-02 / SW-03 – delade prioriteringar och överhoppade kort

**8 november 2026.** Verifierad mot installerade Supabase-tabeller och triggers.

## Reproducerbart test

[`supabase/tests/sec02_swipe_priority_skip_trigger_rollback.sql`](../supabase/tests/sec02_swipe_priority_skip_trigger_rollback.sql) kördes som en enda transaktion med `ROLLBACK`. En förkontroll krävde att det parade testkontoparet saknade samtliga tidigare sparade svar, prioriteringar, delningar och överhoppningar för `aterhamtning-01`. Ett JA från vardera parten, tonåringens högsta prioritet och explicit delning skapades tillfälligt med simulerade JWT-claims och gav ett synligt delat resultat.

Sedan lades en **administrativ temporär** rad in i `swipe_skips` för tonåringen, vilket aktiverade installerad `revoke_swipe_priority_share_on_skip_change`-trigger. Testet verifierade följande:

- **PASS:** tonåringens tidigare samtyckesrad för prioriteringen togs bort.
- **PASS:** den överhoppade prioriteringen var inte synlig för tonåringen.
- **PASS:** den överhoppade prioriteringen var inte synlig för föräldern.
- **PASS:** när den tillfälliga överhoppningen togs bort, återkom inte samtycket automatiskt.

Efter transaktionen verifierades **0 kvarvarande testposter** i `swipe_answers`, `swipe_importance`, `swipe_priority_shares` och `swipe_skips`.

## Begränsning

Detta är ett **databastriggertest**, inte ett fullständigt överhoppsflöde för en inloggad användare. `authenticated` har ingen direkt `INSERT` eller `UPDATE`-behörighet på `swipe_skips`; därför användes en administrativ insertion bara för att testa hur triggern reagerar. Koden i `live-app.js` använder dock den existerande autentiserat körbara `set_understanding_card_state(p_card_id, p_answer, p_skipped)` för tonåringens **B-förståelsekort**; installerad RPC är `SECURITY DEFINER` och skriver till `swipe_skips` på serversidan. Att `authenticated` saknar direkt INSERT/UPDATE till tabellen är därför **inte ett konstaterat fel**. **Det här testet använder ett annat, vanligt kort (`aterhamtning-01`) och en administrativ insättning för att testa triggern isolerat.** Det verifierar varken att `set_understanding_card_state` fungerar i praktiken med signerad Auth eller ett end-to-end-flöde i gränssnittet. De befintliga 13 B-korten hos testparets tonåring hade redan svar och ändrades inte för denna granskning.

Identiteterna var simulerade via PostgreSQL `request.jwt.claims`, inte signerade Supabase Auth-tokens. Även tester av omparning, andra aktiva familjer och verkligt UI återstår.


Ytterligare en negativ kontroll kördes i en **read-only** transaktion: när ett befintligt föräldrakonto simulerades med rollen `authenticated` avvisade `set_understanding_card_state('general-02',null,true)` med behörighetsfel. **PASS**; reproducerbar [SQL](../supabase/tests/sec02_understanding_skip_parent_denied_readonly.sql). Detta testar inte tonåringens positiva skrivväg eller signerad Auth.

**Beslut:** SW-03 förblir `Pågår`. `enableSharedPriorities:false` ändras inte. Verifiera separat det befintliga B-kortsflödet via `set_understanding_card_state`, signerad Auth och UI med isolerad data utan att ändra äldre svar.
