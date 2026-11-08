# FUN-02-INVITE-01 – aktivitetsinbjudan vid samtidig familjeuppdatering

**Datum:** 8 november 2026. **Leverans:** [PR #229](https://github.com/erikjarl/hemmakompassen/pull/229), squash-merge `df9f8778fe135fc5b0c3b29ae507d0f89b2d3088`. **Godkänd CI:** [#42513234116](https://github.com/erikjarl/hemmakompassen/actions/runs/42513234116).

## Funktionsfel

Knappen **Föreslå tid i inkorgen** byggs bara på en aktuellt verifierad gemensam aktivitet. Klicket gör en extra kontroll av familjekoppling och servermatchning före skapandet av ett frivilligt inkorgsutkast. När en annan manuell uppdatering redan höll familjekontrollen upptagen returnerade `recheckInboxPair()` genast `false`. Den gamla inbjudningsrutinen hade då redan ritat ett inaktiverat busy-läge, men återställde inte DOM-knappen efter det tidiga avbrottet. Knappen kunde därför se permanent låst ut utan felmeddelande.

## Ändring

1. Innan inbjudningen visar laddningsläge kontrollerar klienten om en familjekontroll redan pågår. I så fall visas ett begripligt, rollneutralt felmeddelande och knappen förblir klickbar. Inget nytt serveranrop, utkast eller meddelande skapas av den åtgärden.
2. Om den påbörjade familjekontrollen kommer tillbaka med `false` men samma konto, parningssession och vy fortfarande visas, återställs busy-läget genom en ny render och meddelandet uppmanar till ny kontroll.
3. Om familjekopplingen verkligen upphört får den befintliga mekanismen för ogiltigförklaring av parningen och vyn fortsätta som tidigare. En giltig koppling följs fortfarande av en ny serververifierad JA+JA-matchning innan ett utkast skapas. Inga meddelanden skickas automatiskt.

## Testmetod och utfall

- **Node:** `tests/activity-invite-pair-recovery.test.mjs` använder produktionens faktiska `prepareActivityMessage` i VM och provar fem scenarier: upptagen kontroll, misslyckad kontroll i oförändrad session, giltig delad matchning, återkallad aktivitet och kontobyte. Befintliga VM-sviter för aktivitet och familjeförhandskontroll fortsätter passera efter att fixturerna uppdaterats.
- **Chromium:** i `tests/visual.mjs` använder ett syntetiskt familjetest den befintliga rollen med verifierad aktivitetsmatchning, håller svaret från `my_family_members` öppet under manuell **Uppdatera insikter**, klickar samtidigt **Föreslå tid i inkorgen**, verifierar ett återförsökbart och tillgängligt CTA-läge utan skapat utkast, släpper den uppskjutna familjekontrollen och verifierar därefter att samma aktivitet öppnar ett frivilligt redigerbart utkast utan sändning.
- **Bevis:** [grön Node, bygge och syntetisk Chromium i GitHub Actions #42513234116](https://github.com/erikjarl/hemmakompassen/actions/runs/42513234116). Browser-fixturen ersätter Supabase Auth/RPC med lokal syntetisk data. Skärmbilder och testsammanställning ligger i Actions-artifact.

## Återstår

Fysisk mobil/Safari, verkliga autentiserade föräldra- och tonårssessioner, samtidiga nätverksfördröjningar mot faktisk Supabase samt kontroll att båda personernas riktiga sammanfattningar och inkorgar uppdateras korrekt. Ingen verklig användardata, databasstruktur eller sparade svar ändrades av denna åtgärd.
