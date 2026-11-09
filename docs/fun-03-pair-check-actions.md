# FUN-03-PAIR-CHECK-COALESCE-01 – parningskontroll under aktiv inkorgsåtgärd

**Datum:** 9 november 2026 · [PR #244](https://github.com/erikjarl/hemmakompassen/pull/244) · **Status:** korrigering och regressionstester i PR; slutlig verifiering inväntas.

## Reproducerat användarflödesfel

En automatisk parningskontroll från inkorgens bakgrundspolling kan använda `recheckInboxPair()` samtidigt som en förälder eller tonåring trycker på **Skicka meddelande**. Den tidigare implementationen returnerade direkt `false` för varje anrop om `inboxPairCheckBusy` redan var sant – även om det var *samma konto och samma familjesession* som bara väntade på samma serversvar.

Konsekvensen i det simulerade scenariot: skickaanropet nådde inte `send_family_message` trots att den pågående serverkontrollen strax därefter bekräftade rätt parning. Inget sändningsförsök gjordes och klicket kunde framstå som verkningslöst. En kontroll från ett äldre konto kunde också blockera en ny sessions egen kontroll tills det gamla nätverksanropet avslutades.

**Reproduktion:** [Röd CI #42546176903](https://github.com/erikjarl/hemmakompassen/actions/runs/42546176903) mot oförändrad produktionskod, **432 PASS och 3 FAIL av 435 Node-tester**. Den första, ogiltigt initierade test-fixturen rättades innan denna referenskörning; det som redovisas här är de tre beteendefelen i en korrekt VM-fixture.

## Avgränsad rättning

`recheckInboxPair()` håller nu ett delat väntande Promise med konto-ID och `sharedSession`.

- Samtidiga anrop i **samma session** ansluter till samma verifiering och får samma slutliga resultat. Därmed kan ett manuellt Skicka invänta redan pågående bakgrundskontroll, utan extra nätverksanrop eller gissat parningsbesked.
- En **ny konto-/familjesession** får starta en egen kontroll även om ett gammalt konto har ett pågående RPC-svar.
- Endast kontrollen som fortfarande äger det aktuella väntande Promise:et får frigöra global väntemarkering. Gamla responser får inte ändra nästa sessions kontrollflöde.
- Tidigare fail-closed-beteende vid serverfel, annullerad eller förändrad parning bevaras. Ingen meddelandetext skickas före ett giltigt parningsbesked.

Inga ändringar görs i Supabase-RPC, autentiseringsregler, befintliga meddelanden eller sparade familje-/regelsvar.

## Testmetod

`node --test tests/inbox-pair-check-coalescing.test.mjs` kör produktionsfunktionerna `recheckInboxPair()` och `sendFamilyChatMessage()` i Node VM med fiktiva konton, meddelandetext och deterministiskt fördröjda RPC-promises. Fyra nya fall kontrollerar:

1. Automatiskt påbörjad verifiering + manuellt Skicka: en parningskontroll, ingen förtida skrivning, slutligen en bekräftad sändning.
2. Två samtidiga förfrågningar för samma session delar samma serverläsning och båda får sant vid giltig familj.
3. En gammal sessions pending-verifiering blockar inte nytt konto, och det gamla svaret frigör inte det nyare kontots väntestatus.
4. Ett serverfel under två samtidiga verifieringar leder till endast en invalidation/omläsning och inga osäkra skrivningar.

Det befintliga `tests/inbox-pairing-guard.test.mjs` uppdateras: det förväntade beteendet är nu att andra anropet **väntar på samma resultat**, inte returnerar falskt utan att kontrollera.

**Verifieringsgräns:** Node/VM och syntetisk Chromium/Pages kan påvisa kodflöde men inte att verkliga tvåkontoinloggningar, fysiska telefoner eller faktiska Supabase-fel beter sig likadant. FUN-03 behåller status **Pågår** tills det har testats.
