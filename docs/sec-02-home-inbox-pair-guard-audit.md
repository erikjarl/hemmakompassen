# INT-03 / SEC-02 – verifiera aktiv parning före inkorgsavisering på startsidan

**Datum:** 8 november 2026. **Omfattning:** befintlig JavaScript-klient och automatiska tester, inga ändringar i Supabase-schema eller användardata.

## Problem

Inkorgsvyn kontrollerade redan serverns aktuella exakta familjeparning och parningsepok innan interaktiv meddelandehantering och vid 15-sekunderspollning. Startsidan (`#hem`) hämtade däremot olästa privata meddelanden via `my_family_unread_message_count` utan att samtidigt uppdatera sin lokala parningsuppfattning. Server-RPC:n filtrerar korrekt mot nuvarande parning, men klienten kunde förbli baserad på gamla medlemsuppgifter efter en avparning/omparning i annan flik.

## Ändring

Vid **fokus** på startsidan samt dess **15-sekunderskontroll** körs nu befintliga `recheckInboxPair()` först. Den hämtar både `my_family_members` och `my_current_inbox_pair_epoch`; endast när samma två roller, användar-ID:n och parningsepok fortfarande är giltiga får `fetchFamilyChatUnread()` köras. Vid fjärravparning, omparning eller oklar status töms tidigare privat meddelandeläge, medlemmar och badges och full omläsning utlöses enligt den redan existerande fail-closed-logiken.

Koden påverkar inte serverns auktorisering. En överlappande redan pågående parningskontroll kan leda till utebliven badgeuppdatering i just det försöket; nästa fokus/pollning kan försöka igen. Inga användarsvar, meddelanden eller markeringar skrivs om.

## Regressioner och gränser

- `tests/inbox-pairing-guard.test.mjs`: befintliga tester för annan familjemedlem, ändrad parningsepok, obehörighet, nätverksfel och sena svar; nya kontrollpunkter kräver att **både fokus och intervall på startsidan** kontrollerar parningen före unread-RPC.
- `tests/visual.mjs`: syntetisk Chromium-webbläsare med aktiv parning och en oläst privat avisering på startsidan; simulera fjärravparning, skicka fokus och verifiera att det gamla inkorgslarmet och dess badge inte blir kvar.

**Avgränsning:** webbläsartestet simulerar serverdata. Fullt tvåkontotest med signerade Supabase Auth-sessioner, faktisk fjärromparning och samtidiga flikar återstår för INT-03/SEC-02.
