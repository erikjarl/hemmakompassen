# SEC-02 / SW-03 – positivt samtyckestest för delad prioritering

**Datum:** 8 november 2026. **Miljö:** ansluten Supabase-testdatabas. **Verifieringsnivå:** faktisk installerad backend med simulerad PostgreSQL-identitet, **inte** signerad Supabase Auth.

## Varför

Tidigare tvärrollstest av sju Gillaswajp-lekar gav förväntat tomma resultat för delade prioriteringar, men testdatabasen innehöll inga aktiva prioriteringsdelningar. Det kunde därför inte verifiera att en **explicit** tonårsdelning gör ett prioriterat kort synligt för paret och att återkallelse omedelbart döljer det.

## Metod

Det reproducerbara testet `supabase/tests/sec02_swipe_priority_positive_consent_rollback.sql` väljer befintliga parade föräldra- och tonårskonton och ett befintligt oparat konto utan att skriva deras ID till koden. Befintlig, privat baslinje kontrolleras innan testet: `general-08` har tonåringens viktighetsskattning **mycket viktigt** (`importance=1`), och båda har redan ett **JA** på samma kort. Testet avbryts om det redan finns samtycke för kortet.

Efter `SET LOCAL ROLE authenticated` och **simulerade** `request.jwt.claims` görs verkliga anrop mot de installerade funktionerna `public.set_swipe_priority_share` och `public.shared_swipe_priorities`:

| Testfall | Verifierat |
| --- | --- |
| Ingen uttrycklig delning | Varken förälder eller tonåring ser det prioriterade kortet |
| Förälder försöker ge tonåringens samtycke | Nekas |
| Oparat konto försöker ge samtycke | Nekas |
| Tonåringen delar ett behörigt gemensamt JA+JA-kort | Kortet blir synligt för båda i paret |
| Oparat konto försöker läsa efter delning | Får noll resultat |
| Förälder försöker återkalla tonåringens delning | Tonåringens samtycke och parets vy förblir intakta |
| Tonåringen återkallar | Kortet försvinner ur bådas delade prioriteringsvy |

Den **exakta incheckade SQL-filen** kördes på ansluten Supabase och gav:

```text
PASS: teen-only priority opt-in, paired visibility, outsider denied, parent cannot revoke, teen revocation; full rollback
```

Testet körs helt i `BEGIN … ROLLBACK`. Endast en temporär samtyckesrad skapas och återkallas via de publika behörighetsstyrda RPC:erna. **Inga tidigare användarsvar eller viktighetsskattningar skrivs om**, och ingen ny samtyckesrad blir kvar. Node-kontraktstestet `tests/sec02-swipe-priority-positive-consent.test.mjs` skyddar testets grundstruktur.

## Begränsningar

Detta är ett **positivt och negativt backendtest** för just ett tidigare behörigt kort med simulerade anspråk. Det är inte ett test med riktiga signerade Auth-sessioner eller webbgränssnittet, och testar inte faktisk omparning, en annan aktiv familj, automatisk delningsåterkallelse efter ett ändrat svar/skattning eller samtidiga enheter. Den befintliga funktionen `eligible_swipe_priorities` är korrekt inte direkt körbar för `authenticated`; dess kontroll används indirekt via den behöriga `SECURITY DEFINER`-RPC:n. **Flaggan `enableSharedPriorities` ska fortsatt förbli `false`** tills de återstående P0-kontrollerna är genomförda.
