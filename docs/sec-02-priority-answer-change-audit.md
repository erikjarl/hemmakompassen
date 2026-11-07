# SEC-02 / SW-03 – återkallelse vid ändrat swajpsvar

**Datum:** 8 november 2026  
**Testad miljö:** ansluten Supabase (installerade RPC:er och triggers)  
**Reproducerbart test:** [`sec02_swipe_priority_answer_change_rollback.sql`](../supabase/tests/sec02_swipe_priority_answer_change_rollback.sql).

## Metod

En redan parad förälder och tonåring samt en utomstående befintlig identitet väljs från databasen. En strikt förkontroll avbryter om någon av de parade användarna har tidigare svar, prioritet, delning eller överhoppning för testkortet `aterhamtning-01`. Enbart detta sedan tidigare obesvarade kort används. `SET LOCAL ROLE authenticated` och simulerade `request.jwt.claims` används; detta är **inte signerad Supabase Auth/JWT**.

Alla tillfälliga skrivningar ligger i en databastransaktion som avslutas med `ROLLBACK`. Den sparade SQL-filen kördes mot installerad databas och returnerade **PASS**.

## Resultat

- Förälder och tonåring svarade JA, tonåringen satte hög prioritet och gav uttryckligt samtycke: kortet syntes för den delande parten.
- Medan kortet var giltigt delat returnerade RPC:en **0** för utomstående.
- När **tonåringen ändrade JA till NEJ** blev resultatet osynligt och tidigare samtyckesrad för kortet raderades.
- När tonåringen åter ändrade NEJ till JA dök ingen delning upp automatiskt. Nytt uttryckligt samtycke krävdes. Efter nytt samtycke såg även föräldern delningen.
- När **föräldern ändrade JA till NEJ** blev prioriteringen osynlig. Återgång till JA återställde inte tidigare delning. Ett nytt samtycke från tonåringen gav åter synlighet.

Efter att transaktionen rullats tillbaka gjordes en separat läskontroll: **0** testposter återstod för det berörda kortet och paret i `swipe_answers`, `swipe_importance` och `swipe_priority_shares`.

## Avgränsningar

Testet verifierar just svarsförändringar på ett positivt delat kort med simulerade användarclaims, inte riktiga signerade tvåkontosessioner, UI, faktisk samtidig användning eller omparning. Det finns ingen andra **aktiv parad** familj för ett fullvärdigt familj-mot-familj-test. Effekten av `swipe_skips` har inte testats här. Därför kvarstår status **Pågår** och `enableSharedPriorities:false`.
