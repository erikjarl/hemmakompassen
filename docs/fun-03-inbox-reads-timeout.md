# FUN-03 – Uppdatera hela inkorgen även om läsning av aviseringar eller olästa antal fastnar

**Datum:** 9 november 2026. **PR:** [#257](https://github.com/erikjarl/hemmakompassen/pull/257).

## Reproducerat användarproblem

`refreshWholeInbox()` samordnar aktuella meddelanden, olästa antal, regelförslag och aktivitetsaviseringar. Hämtning av meddelandetext och Schyssta listan hade redan en tidsgräns. Men `fetchFamilyChatUnread()` och `fetchActivityNotifications()` kunde vänta obegränsat på servern. Ett enda uteblivet svar kunde därför blockera hela användarens **Uppdatera hela inkorgen**, utan fungerande status eller nytt försök.

Ett nytt regressionstest `tests/inbox-reads-timeout.test.mjs` använder de **faktiska** produktionsfunktionerna för båda läsningarna och hela inkorgens samlade uppdatering, körda i Node VM med två avsiktligt ej besvarade mockade Supabase-RPC. Det kräver att det finns **en 15-sekundersgräns per läsning**, att hela uppdateringsknappen frigörs och att sen inkomna svar inte kan återskapa gammal data. Ursprunglig kod gav [röd CI #42565972140](https://github.com/erikjarl/hemmakompassen/actions/runs/42565972140).

## Korrigering och användarbeteende

- `my_family_unread_message_count` och `my_activity_notifications` får vardera **maximalt 15 sekunders väntan**; båda timrarna frigörs vid svar eller fel.
- Vid timeout markeras antalet olästa privata meddelanden som **okänt**, inte som en bekräftad nolla. Gamla aktivitetsaviseringar ersätts av tydligt felmeddelande i stället för att visas som färska.
- Den samordnade inkorgsuppdateringen kan därefter slutföras med partiellt felbesked och låsa upp **Uppdatera hela inkorgen**. Användaren kan försöka igen.
- Ett oskickat privat meddelandeutkast bevaras; varken hämtning eller omförsök sänder en text eller markerar något som läst.
- När servern åter svarar kan ett uttryckligt nytt klick återställa status och korrekt antal. Sena gamla svar får inte skriva över nyare resultat.

## Testnivå och begränsningar

Regressionen testar förälder och tonåring var för sig med gemensam deterministisk klocka, simulerade RPC, en privat text som inte får ändras, samlat fel och lyckad senare kontroll. Den inkluderar separat test av aktivitetsaviseringens laddningsläge. Befintliga testhöljen använder nu samma timers som i webbläsare. Bygg och syntetisk Chromium/Pages ska redovisas efter CI.

**Ej testat:** verkliga inloggade testkonton, fysisk iPhone/Safari, verklig nätverkstimeout hos Supabase eller faktisk tvåpersoners synk. Inga produktionsdata, befintliga svar eller användarens privata meddelanden har modifierats.
