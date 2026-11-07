# SEC-02 / INT-04 – IPIP-50: återkallelse och medlemskapstid

**Datum:** 2026-11-07. **Miljö:** anslutna Supabase-testprojektet. Underlag: installerad `public.my_ipip50_shared_profiles()` och `public.personality_share_preferences`.

## Syfte

Pröva att **båda parterna** förlorar åtkomst till delade personlighetsresultat om endera parten återkallar sitt uttryckliga samtycke eller om samtycket är knutet till en annan familjemedlemskapsepok. Inga råa IPIP-svar får nå delningssvaret.

## Metod och verifierad evidens

`supabase/tests/sec02_ipip50_revocation_rollback.sql` körs i en enda `BEGIN`/`ROLLBACK`-transaktion. Två verkliga, redan parade testkontons UUID hämtas **inom databasen**. Deras tidigare svar (50 vardera) och samtycken bevaras. `SET LOCAL ROLE authenticated` plus simulerade `request.jwt.claims` används för att anropa RPC:n som respektive användare; **inga riktiga signerade access-tokenvalideringar** sker.

- **Positiv baslinje:** Två giltigt samtyckande testkonton får varsin vy som innehåller exakt två rollidentifierade profiler, fem numeriska skalor för varje roll och inga råa frågesvar eller användar-ID:n. Testet förutsätter att båda har sina 50 gamla svar och två aktiva samtycken.
- **Förälderns återkallelse:** `share_enabled=false` sätts tillfälligt i transaktionen. Bådas RPC-resultat måste bli `NULL`.
- **Tonåringens återkallelse:** Samma test med tonåringens samtycke. Bådas RPC-resultat måste bli `NULL`.
- **Gammal parnings-/medlemskapsepok:** Tonåringens samtyckesrad får tillfälligt ett `joined_at` som är en dag för gammalt. Bådas RPC-resultat måste bli `NULL`.
- **Riktig samtyckes-RPC med simulerad identitet:** Både föräldern och tonåringen anropade i turordning `set_my_ipip50_share(false)` och därefter `set_my_ipip50_share(true)` inom rollback-transaktionen. Efter återkallelsen fick **båda** `NULL` från delnings-RPC:n; efter återsamtycket fick båda åter varsin tvåprofilersvy. Även dessa operationer återställdes.
- **Återställning:** `ROLLBACK TO SAVEPOINT` följer varje scenario och hela transaktionen avslutas med `ROLLBACK`. Därefter kördes separat kontrollfråga i Supabase.

Rapporterat SQL-resultat:

```text
PASS: 2 positive profiles (five sums only), 2 revocations each hidden from both, old epoch denied; 2 owner RPC revoke/re-consent cycles; rollback restores consent
```

Separat efterkontroll visade **100** ursprungliga IPIP-svar, **2** samtyckesrader varav **2** aktiva, **0** privata omtest och **0** omtestsvar. Samma antal fanns vid förkontroll.

## Avgränsningar

Testet visar nu även att `set_my_ipip50_share` kan återkalla och återaktivera delningen med **simulerade identiteter**. Det visar **inte** att inloggnings-/webbläsarflödet fungerar korrekt med riktiga signerade kontosessioner. Det bekräftar inte signerad JWT, fysisk mobil, omparningsoperationen, caching/annan flik eller realtidsuppdatering i klienten. Tidigare syntetiska tester av klientens återkallelse ligger kvar i PR #142 och #143. Två autentiserade parallella kontosessioner och faktisk Pages/Worker-trafik återstår för full P0.

**Ingen databas-migration har körts och ingen bestående ändring av tidigare användaruppgifter har gjorts.**
