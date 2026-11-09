# FUN-03-SCHYSSTA-CARD-RACE-03 – gamla regelsvar påverkar ny användarsession

**Datum:** 9 november 2026 · [PR #243](https://github.com/erikjarl/hemmakompassen/pull/243) · **Status:** PR #243 mergad (`ac8a61b`), syntetiska Node/Chromium-tester och publicerad Pages-kod verifierade; verkliga Auth-sessioner och fysisk Safari återstår.

## Användarflöde och reproduktion

I Schyssta listan finns två kortbaserade användaråtgärder som var kvar efter den tidigare rättningen av manuella förslag/avslut: `proposeSchysstaRule(cardId)` och `decideSchysstaRule(agreementId,approved)`. Båda anropar autentiserade RPC:er och visar väntestatus så länge åtgärden pågår. När nätverkssvaret anlände raderade klienten tidigare `schysstaSaving`-markeringen **innan** den kontrollerade att användare och familjesession var oförändrade.

Det går att reproducera ett fel när användaren byter konto/familj under väntan, ett nytt konto hinner påbörja en liknande åtgärd med samma kort-/regel-ID och det gamla RPC-svaret sedan anländer: den nya åtgärdens väntemarkering försvinner för tidigt. Det kan öppna för ytterligare klick medan den nya åtgärden fortfarande pågår.

**Faktiskt rött bevis:** [CI #42544678516](https://github.com/erikjarl/hemmakompassen/actions/runs/42544678516) med ursprunglig produktionskod och tio nya testfall gav **427 PASS / 4 FAIL av 431**. Fyra scenarier täckte gamla lyckade/misslyckade svar i båda knapparna; sex ordinarie scenarier passerade redan.

## Kodändring

Flytta kontrollen `user?.id===viewer && sharedSession===session` **före** `schysstaSaving.delete(cardId)` respektive `schysstaSaving.delete(agreementId)`. Om kontot/familjesessionen inte längre matchar avbryter klienten hanteringen av det gamla svaret utan att ändra den aktuella vyn, dess tillstånd eller spärrar.

Ändringen rör inte databas-RPC, autentisering, lagrade regler, inställningar eller privata användarsvar.

## Testmetod

`node --test tests/schyssta-card-write-session.test.mjs` kör exakt de två produktionsfunktionerna extraherade ur `live-app.js` i Node VM. Fördröjda RPC-svar returneras från kontrollerade promises och testdata innehåller fiktiva konto- och regel-ID:n. Testfallen täcker, för båda knapparna:

1. Gammalt lyckat svar efter kontobyte när samma ID bearbetas i det nya kontot.
2. Gammalt avvisat svar efter kontobyte med ny sessions laddning aktiv.
3. Normal lyckad handling som frigör spärren och gör en aktuell omläsning.
4. Normalt serverfel som visar fel utan att behålla en felaktig väntemarkering.
5. Dubbelklick under pågående RPC som endast skickar en begäran.

Testet innehåller alltså **tio** fall (två knappar gånger fem scenarier). Full GitHub CI testar även befintliga kontraktskontroller, byggkontroll och syntetisk Chromium när PR:en är klar.

**Begränsningar:** Deterministiskt simulerad responsordning; ingen faktisk inloggning med två verkliga konton, inga riktiga Supabase-/nätverksavbrott, ingen fysisk Safari. FUN-03 förblir **Pågår** trots grön syntetisk testsvit.

## Slutlig verifiering – 9 november 2026

- **Före rättningen:** [röd CI #42544678516](https://github.com/erikjarl/hemmakompassen/actions/runs/42544678516): 427 Node PASS, 4 FAIL av totalt 431.
- **Efter rättningen:** [grön PR-CI #42544854779](https://github.com/erikjarl/hemmakompassen/actions/runs/42544854779): **431/431 Node PASS**, statisk build och syntetisk Chromium PASS, 77 skärmbilder och `visual-audit.json` som Actions-artifact.
- **Merge:** [PR #243](https://github.com/erikjarl/hemmakompassen/pull/243), commit [`ac8a61b`](https://github.com/erikjarl/hemmakompassen/commit/ac8a61b28050b4f79e02277a62a9eb2b7c2170b0).
- **Publicerad fil:** [Pages-deploy #42545299830](https://github.com/erikjarl/hemmakompassen/actions/runs/42545299830) godkänd; [bytekontroll #42545299705](https://github.com/erikjarl/hemmakompassen/actions/runs/42545299705) bekräftade att fyra offentligt serverade filer inklusive `live-app.js` matchar mergecommitten exakt. De första fyra försöken fick äldre `live-app.js` under utrullning; därefter matchade alla fyra.

**Verifieringsgräns:** Ingen riktig tvåkontoinloggning, nätverksfelinjektion mot Supabase eller fysisk Safari/VoiceOver. Dessa acceptanskriterier kvarstår i FUN-03.
