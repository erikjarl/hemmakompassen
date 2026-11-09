# FUN-03-SCHYSSTA-RACE-01 – fördröjda regelförslag och dialogstatus

**Datum:** 9 november 2026 · **PR:** [#241](https://github.com/erikjarl/hemmakompassen/pull/241) · **Status:** kodändring och regressionstest i PR; slutlig grön CI inväntas.

## Reproducerat funktionsfel

Schyssta listans tre användarhandlingar `markSchysstaRead`, `withdrawSchysstaRule` och `submitManualSchysstaRule` väntar på asynkrona RPC-svar. Före rättningen ändrades lokal UI-status (`schysstaSaving`, bekräftelsedialogens mål respektive `schysstaSubmitting`) **före** kontrollen av om konto/familjesession fortfarande var densamma.

Detta reproducerades med produktionsfunktionerna i ett isolerat Node/VM-test i [röd CI #42542075405](https://github.com/erikjarl/hemmakompassen/actions/runs/42542075405): **3 fel / 410 godkända av totalt 413 Node-tester**. Två av felen rörde att gamla svar kunde låsa upp en ny sessions pågående handlingar; det tredje stängde nyare regelavslutsdialog.

## Åtgärd

1. Kontrollera **samma användar-ID och sessionsgeneration innan lokal UI-status ändras** när svar återkommer från regelavslut, läsmarkering eller regelförslag.
2. Stäng bara den bekräftelsedialog som hör till den regel som faktiskt avslutades. Om användaren har valt en annan regel medan ett tidigare serveranrop väntade bevaras den nya dialogen.
3. Vid framgångsrik sändning rensas bara ett **oförändrat** utkast med samma edit-mål och idempotensnyckel. Ett nytt utkast som användaren börjat skriva medan föregående regelförslag skickades ska lämnas kvar.

Inga ändringar av Supabase-RPC, databas, serverbehörigheter, sparade svar eller befintliga godkända överenskommelser.

## Testmetod och acceptans

`node --test tests/schyssta-stale-write-ui.test.mjs` använder **samma funktioner ur `live-app.js` som webbklienten kör**, men kontrollerade in-memory RPC-promises, VM-globals och syntetisk användaridentitet. Alla förseningar och kontobyten är deterministiskt styrda; inga riktiga familjekonton kontaktas.

Åtta fall kontrollerar: (1) gammalt avslut efter byte av familjesession, (2) gammal läsmarkering efter nytt kontotillstånd, (3) gammalt regelförslag efter nytt pågående förslag, (4) normalt regelavslut och uppdatering, (5) avvisat förslag med bevarat utkast och återförsöksnyckel, (6) godkänt förslag med tomt utkast, (7) annan avslutsdialog öppnad under pågående avslut, (8) redigerat/nytt utkast under pågående sändning.

Den första röda körningen omfattade sex fall, varav tre avsiktligt reproducerade felen och tre normallägen passerade. Fall 7–8 tillfördes därefter för mer täckning. **Grön CI ska kontrolleras innan merge**, inklusive Node, byggkontroll och syntetisk Chromium. Endast testresultat som faktiskt finns i Actions får redovisas som godkända.

**Begränsningar:** Inga två faktiskt autentiserade konton, ingen live-Supabase-felinjektion, fysisk Safari/VoiceOver eller manuell UX-testning. FUN-03 kvarstår *Pågår* även om syntetiska tester passerar.
