# INT-01 / INT-03 / SEC-02 – parningskontroll före manuella delade åtgärder

**Datum:** 8 november 2026. **Omfattning:** klientens klickhanterare och testsimulering. Ingen databas- eller Workers-ändring.

## Identifierad lucka

PR #188 införde kontroll av exakt familjeparning och parningsepok före *bakgrunds*uppdatering av Gillaswajpen och Gemensamma insikter. Motsvarande kontroll saknades dock i tre *manuella* uppdateringsvägar och vid skapande av ett aktivitetsmeddelandeutkast. Även om serverns `shared_swipe_matches` filtrerar den aktuella åtkomsten kunde det lokala gränssnittet återanvända gammal parningsstatus.

## Åtgärd

- Knappar för **uppdatera gemensamma matchningar** och **uppdatera gemensamma insikter** kräver nu `recheckInboxPair()` innan respektive läs-RPC startar.
- Knappen **Föreslå tid i inkorgen** kräver samma kontroll av faktisk familjesammansättning och parningsepok **före** den existerande extra kontrollen av JA+JA-matchningen. Om parningen återkallas eller en ny session inträffar under kontrollen skapas inget utkast. Inget meddelande skickas automatiskt.
- **Försök kontrollera igen** för startsidans aviseringar kontrollerar samma parning före inläsning av privata meddelande- och familjenotiser.

Vid avparning, omparning, felaktig eller okänd parning använder dessa vägar den redan implementerade fail-closed-återställningen, som rensar lokala privata och delade uppgifter och begär en ny konto-/familjeläsning.

## Kontroll och återstående begränsningar

`tests/shared-manual-pair-preflight.test.mjs` testar verklig JavaScript-funktion i en isolerad Node-VM med syntetisk Supabase-RPC: spärrat samtycke, session som ändras under kontroll, samt godkänd parning med ett aktuellt gemensamt JA-kort. Testet skyddar även klickvägarnas ordning.

Detta är **syntetiska klienttester**, inte test med signerade förälder- och tonåringskonton eller faktisk omparning på servern. Serverns RLS, användarsvar och produktflaggan `enableSharedPriorities:false` lämnas oförändrade.
