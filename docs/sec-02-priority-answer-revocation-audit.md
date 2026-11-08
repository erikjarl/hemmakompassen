# SEC-02 / SW-03 – frivillig prioritering återkallas när någon ändrar Ja till Nej

**Datum:** 8 november 2026. **Verifiering:** ansluten Supabase med simulerade PostgreSQL-JWT-claims, inte signerad Auth.

## Metod

Regressionen `supabase/tests/sec02_priority_answer_revocation_rollback.sql` väljer den redan parade föräldern och tonåringen plus ett oparat konto från den anslutna testdatabasen. Den kontrollerar innan skrivning att **inget** tidigare svar, skattning eller delningssamtycke finns på det avsatta kortet `aktiviteter-104` för dessa användare.

Under en enda `BEGIN … ROLLBACK` skapas **nya och endast tillfälliga** Ja-svar för båda parter, tonåringens viktighetsskattning `importance=1` och tonåringens uttryckliga delning via `set_swipe_priority_share`. De verkliga installerade triggerfunktionerna och läs-RPC:n `shared_swipe_priorities` prövas genom att ändra **endast de nyss skapade** svaren.

| Scenario | Live-resultat |
| --- | --- |
| JA+JA och tonåringens explicita opt-in | Prioritering synlig för båda parade rollerna |
| Oparat konto försöker läsa | Inga prioriteringar |
| Tonåringens JA blir NEJ | Prioriteringen försvinner för båda |
| Tonåringens NEJ blir JA igen | Gammalt samtycke återupplivas inte |
| Nytt aktivt tonårsmedgivande | Prioritering kan delas igen |
| Förälderns JA blir NEJ | Prioriteringen försvinner för båda |
| Förälderns NEJ blir JA igen | Gammalt samtycke återupplivas inte |

Den **exakt incheckade SQL-filen** kördes mot den anslutna databasen och returnerade:

```text
PASS: temporary YES+YES, teen NO and parent NO revoke shared priority, YES cannot resurrect revoked consent, outsider denied, full rollback
```

Inga befintliga svar eller viktighetsskattningar ändrades, och alla nya temporära poster återställdes med slutlig ROLLBACK. Node-kontraktstestet `tests/sec02-priority-answer-revocation.test.mjs` skyddar SQL-testets förutsättningar.

## Begränsningar

Identiteterna var simulerade med `SET LOCAL ROLE authenticated` och `request.jwt.claims`: **inte riktiga signerade tvåkontoinloggningar**. Testet kontrollerar inte omparning, två samtidigt aktiva familjer, verkligt användargränssnitt eller samtidig ändring från flera enheter. `enableSharedPriorities:false` lämnas orörd tills återstående P0-kriterier verifierats.
