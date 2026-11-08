# SEC-02 – Schyssta listans skrivåtgärder kräver aktuell parning

**Datum:** 8 november 2026. **Verifieringsnivå:** Kod-/kontraktstest + syntetisk webbläsare. Äkta signerade tvåkontotester återstår.

## Bakgrund
Klientens Schyssta-funktioner kontrollerade tidigare `user.id` och `sharedSession` *efter* skriv-RPC:n, men inte nödvändigtvis en ny familjekontroll *före* anropet. En annan flik eller enhet kan under tiden ha avparat familjemedlemmarna eller bytt parningsepok. Serverns existerande auktorisering är fortfarande det avgörande skyddet, men klienten ska inte sända gamla åtgärder utan att först kontrollera aktuell parning.

## Ändring
`preflightSchysstaWrite(viewer, session)` kör `recheckInboxPair()` före alla fem användarinitierade skrivtyper:
- `mark_schyssta_notification_read`
- `withdraw_schyssta_rule`
- `propose_manual_schyssta_rule` och, i samma användarflöde, `propose_schyssta_change`
- `propose_schyssta_rule`
- `set_schyssta_rule_decision`

Samma användare, generationsnummer (`sharedSession`) och exakt giltig familjeparning med parningsepok krävs fortfarande efter det asynkrona steget. Vid avparning eller okänd parning rensar redan existerande `recheckInboxPair()` även gamla Schyssta-listvyer och utkast enligt fail-closed-regeln. Ett utkast som redigeras medan kontrollen körs får inte skickas med en gammal kopia. Vid fokus och återkomst till Schyssta-sidan kontrolleras också parningen innan automatisk hämtning.

## Testmetod
- `tests/schyssta-active-pair-preflight.test.mjs` exekverar de riktiga funktionerna isolerat i Node-VM: negativt svar, byte av session under kontroll, positivt svar och en ändrad privat utkaststext.
- `tests/visual.mjs` har ett separat syntetiskt Chromium-scenario: avparning från annan flik simuleras precis innan ett godkännandeklick, och testet kontrollerar att skriv-RPC inte skickas och gamla familjens regel försvinner.
- Den ordinarie CI-körningen testar också bygg, inloggnings-/delningskontrakt och mobilflöde.

## Avgränsningar
Detta är **inte** en verifiering med två verkligt signerade Supabase Auth-sessioner eller fysisk iOS/Safari. Inga gamla användarsvar, samtycken, regler, migrationsfiler eller RLS-policyer ändras. Det är ett klientskydd ovanpå de befintliga serverkontrollerna, inte en ersättning för serverauktorisering. Fördelarna vid verklig samtidig omparning kräver autentiserad regression i pilotmiljön.
