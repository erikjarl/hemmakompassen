# INT-01 / SEC-02 – verifiera parningsepok före delade Gillaswajp-vyer

**Datum:** 8 november 2026. **Omfattning:** webbläsarklient, ingen backendmigration eller ändring av existerande svar.

## Risk

Gillaswajpens periodiska uppdatering av gemensamma A-matchningar och insiktssidans gemensamma A-/B-resultat använde backend-kontrollerade RPC:er, men kontrollerade inte **den lokalt lagrade parningsepoken** före varje bakgrundshämtning. Efter avparning eller omparning i en annan flik kunde den tidigare familjens resultat ligga kvar på skärmen i väntan på nästa lyckade hämtning.

## Åtgärd

Den befintliga `recheckInboxPair()` (kontrollerar två aktuella roller/användar-ID:n plus `my_current_inbox_pair_epoch`) anropas nu **före** Gillaswajpens bakgrundspollning och **före** insiktssidans bakgrundsuppdatering vid fokus och tidsintervall. Om den aktiva parningen inte går att verifiera används befintlig fail-closed-väg, kompletterad med omedelbar tömning av `sharedMatches`, `sharedPriorities`, `insightsRows` och `sharedUnderstandingRows`; pågående förfrågningar ogiltigförklaras via begäransräknare. Sedan töms lokalt medlemskap och tidigare privat inkorg samt en fullständig återläsning begärs.

Detta ersätter **inte** serverns RLS och behörighetskontroller. När verifieringen redan pågår kan nästa polling hoppas över. Den normala uppdateringen försöker igen senare.

## Testmetod och begränsningar

- `tests/inbox-pairing-guard.test.mjs` använder existerande VM-regression för oförändrad/ändrad parningsepok, annan part, avparning, RPC-fel och försenade svar. Nya assertioner verifierar att även gemensamma resultat och delade B-kort töms direkt och att bakgrundsflöden kräver en verifierad parning.
- `tests/visual.mjs` kör en **syntetisk** Chromium-session som visar insiktsvyn, simulerar avparning i annan flik och utlöser fokus; insikterna ska då försvinna.

**Kvarstår:** signerade tvåkontotester med faktisk Supabase Auth, verklig samtidighet, omparning och en annan aktiv familj. Den här förbättringen minskar risken att en gammal vy dröjer kvar men bevisar inte fullständig familjeisolering i hela systemet.
