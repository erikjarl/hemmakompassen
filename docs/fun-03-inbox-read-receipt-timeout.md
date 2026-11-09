# FUN-03 – read receipt-knappar får en tidsgräns och ärliga felstatusar

**Datum:** 9 november 2026. **PR:** [#255](https://github.com/erikjarl/hemmakompassen/pull/255). Denna uppgift avser två användarstyrda handlingar i inkorgen – inte en fristående säkerhetsgranskning.

## Reproducerat funktionsproblem

Knappen **Markera alla meddelanden som lästa** (`markAllFamilyChatRead()`) och aktiviteten **Markera som läst** (`markActivityNotificationRead()`) väntade utan bortre gräns om respektive Supabase-RPC aldrig besvarades. Under väntan förblev kontrollerna låsta. I första testrevisionen använde `tests/inbox-read-receipt-timeout.test.mjs` uppskjutna serverlöften och en kontrollerad 15-sekundersklocka; den första [röda CI-körningen #42563342386](https://github.com/erikjarl/hemmakompassen/actions/runs/42563342386) uppvisade tre misslyckade tester när timrarna ännu inte fanns.

## Genomförd funktionell korrigering

- Båda läskvittense-RPC:erna får **högst 15 sekunders väntan**, i linje med inkorgens meddelandehämtning och familjekontroll. Timern rensas vid svar, fel och tidsgräns.
- Ett timeout-svar är **okänd kvittens**, inte ett fastställt misslyckande eller en bekräftad markering. Privata meddelandens senast säkert kända olästa antal behålls; status uppmanar användaren att försöka igen.
- En aktivitet där kvittensen är okänd rensar den osäkra listan och visar ett begripligt fel, så nästa uppdatering behöver läsa serverns faktiska status. Ingen automatisk upprepning av skriv-RPC görs.
- Efter ett senare lyckat manuellt försök kan ett sent svar från ett äldre anrop inte återställa den tidigare UI-statusen.
- Klientens versionskedja samordnas med startsida och IPIP-modul, utan ändringar i deras funktioner.

## Testmetod och begränsningar

Tre syntetiska VM-regressioner kör de faktiska produktionsfunktionerna: förälder och tonåring med hängande meddelandekvittens, därefter lyckat nytt försök och sent gammalt RPC-svar; samt en aktivitet där läskvittensen aldrig kommer. Befintliga regressioner får explicit tillgång till tidsfunktioner för att testa samma klientkod. Node/bygg/Chromium, publicering och filbytes ska rapporteras först när respektive körning är avslutad.

**Inte testat:** verklig inloggning, faktisk störning i Supabase, fysisk iPhone/Safari, två kontons synk och verkliga läskvittenser. Ingen produktionsdata, meddelandetext eller kontoinställning ändrades av testerna.
