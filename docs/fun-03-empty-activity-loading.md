# FUN-03 – tom aktivitetsinkorg lämnar laddningsläge

**Identifierare:** FUN-03-ACTIVITY-EMPTY-LOADING-01 · **Datum:** 9 november 2026

## Reproducerat fel

När den inloggade användaren öppnar Inkorg med en verifierad familjeparning och inga aktivitetsaviseringar finns, startar `fetchActivityNotifications()` med `activityNotificationsLoading=true`. Då renderas texten **Hämtar aviseringar…**. Om `my_activity_notifications` returnerar den giltiga, oförändrade tomma listan `[]`, motsvarar resultatet föregående snapshot. Den gamla koden returnerade då utan render, trots att `activityNotificationsLoading` hade blivit `false`. Den redan renderade texten kunde därför ligga kvar fram till en annan omrendering. Ett uttryckligt återförsök med ett oskickat meddelandeutkast hade samma fel.

## Verifieringsmetod och resultat

`tests/activity-notifications-empty-loading.test.mjs` extraherar den verkliga produktionsfunktionen ur `live-app.js` och kör den i Node-VM med simulerad RPC och renderingsspårning.

1. **Tom inkorg:** rendering av laddningsläge ska följas av rendering utan laddningsläge även vid oförändrat tomt resultat.
2. **Utkast och uttryckligt återförsök:** samma övergång ska ske utan att utkastet ändras.
3. **Tyst bakgrundskontroll:** oförändrat svar ska *inte* orsaka omrendering, så fokus och scroll förblir opåverkade.
4. **Serverfel:** befintlig felåterkoppling och omrendering ska fortsätta fungera.

[Röd CI #42552871411](https://github.com/erikjarl/hemmakompassen/actions/runs/42552871411) reproducerade **två underkända av 445 tester** (443 PASS) i fall 1 och 2, innan produktionsfixen. Fixen kompletterar den oförändrade snapshot-vägen med enbart den nödvändiga förgrundsomrenderingen; tysta bakgrundshämtningar förblir orörda.

**Begränsning:** Node-VM med simulerade tjänstesvar är inte en verklig inloggning eller fysisk Safari-verifiering. Ingen riktig användardata eller konto ändrades. Slutlig grön PR-/main-CI och driftsättning redovisas separat när faktiskt bekräftade.
