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

Detta är ett **databastriggertest**, inte ett fullständigt överhoppsflöde för en inloggad användare. `authenticated` har ingen direkt `INSERT` eller `UPDATE`-behörighet på `swipe_skips`; därför användes en administrativ insertion bara för att testa hur triggern reagerar. Testet bevisar inte att användargränssnittet faktiskt kan spara överhoppade kort.

Identiteterna var simulerade via PostgreSQL `request.jwt.claims`, inte signerade Supabase Auth-tokens. Även tester av omparning, andra aktiva familjer och verkligt UI återstår.

**Beslut:** SW-03 förblir `Pågår`. `enableSharedPriorities:false` ändras inte. Utred separat hur en användare kan skapa en överhoppning och om det finns en avsiktlig serverfunktion för det.
