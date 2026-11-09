# FUN-03 – undvik falskt ”Inkorgen är uppdaterad” vid pågående bakgrundshämtning

**Datum:** 9 november 2026. **PR:** [#259](https://github.com/erikjarl/hemmakompassen/pull/259).

## Reproducerat användarfel

Knappen **Uppdatera hela inkorgen** samlar flera olika läsningar av privata meddelanden, antal olästa, Schyssta listan och aktivitetsaviseringar. Innan korrigeringen skippade `refreshWholeInbox()` en del av de läsningarna när `familyChatLoading`, `familyChatLoadingOlder`, `schysstaLoading` eller `activityNotificationsLoading` redan var sanna. Men när de läsningar som **inte skippats** blev klara visade gränssnittet ändå `Inkorgen är uppdaterad.`. Det innebar att användaren inte kunde veta om exempelvis nya regelförslag fortfarande höll på att hämtas.

I `tests/inbox-refresh-inflight-status.test.mjs` körs den **faktiska produktionsfunktionen** med deterministiska, mockade bakgrundsladdningar. Testet täcker **två roller × fyra in-flight-tillstånd = åtta scenarier**, samt en bakgrundsladdning där en separat kontroll verkligen har misslyckats och en helt lyckad uppdatering. Före kodändringen gav [CI #42567913670](https://github.com/erikjarl/hemmakompassen/actions/runs/42567913670) avsiktligt FAIL.

## Förändrat användarbeteende

- Redan pågående läsningar startas **inte en gång till** bara för att användaren trycker på **Uppdatera hela inkorgen**.
- Klienten dokumenterar vilka delar som skippades: `meddelanden`, `regelförfrågningar`, `aktivitetsaviseringar`.
- Så länge någon del skippats visas **inte** generellt `Inkorgen är uppdaterad`, utan en kort förklaring att delar redan hämtades i bakgrunden och kan behöva uppdateras igen.
- Om den faktiskt genomförda läsningen ger ett fel prioriteras den befintliga felstatusen.
- När användaren senare klickar igen och alla delhämtningar kan genomföras syns normalt `Inkorgen är uppdaterad.`.
- Privata oskickade textutkast och tangentbordsfokus påverkas inte av ändringen; inga kvittenser eller ändrade serverdata skapas.

## Verifieringsnivå

Node/VM-testet kontrollerar att statusen följer faktisk inkluderad hämtning i klientkoden. Dessutom kör `tests/visual.mjs` ett **verkligt klickflöde i syntetisk mobil-Chromium**: en mockad meddelandehämtning startas uttryckligen via `Uppdatera konversationen` och hålls obesvarad medan användaren trycker `Uppdatera hela inkorgen`; testet kontrollerar att statusen namnger meddelanden, att ingen dubblett-RPC startas, att knappen låses upp, att oskickat meddelandeutkast bevaras, och att efter ett senare serversvar går nästa tryck igenom med fullständig bekräftelse. Testet använder ett **in-memory-RPC**, inte autentiserad Supabase. Full Node-, bygg-, Chromium- och publiceringskontroll redovisas när CI är avslutad. Ingen ändring görs i Supabase, Cloudflare Worker, databastabeller eller användarsparad information.

**Kvar:** verkliga inloggade tvåkontotester och fysisk mobil/Safari. Testet simulerar `Loading`-flaggorna och kan inte ensamt visa hur ofta samtidig bakgrundshämtning uppstår på en verklig telefon.
