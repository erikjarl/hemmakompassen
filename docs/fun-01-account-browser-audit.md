# FUN-01 – kontosidans syntetiska webbläsarflöde och åtgärdad återkoppling

**Datum:** 8 november 2026. **PR:** [#205](https://github.com/erikjarl/hemmakompassen/pull/205).

## Reproducerat funktionsfel – FUN-01-BUG-01

**Symtom:** När en användare öppnade konto.html med `#invite=<36 hex-tecken>` och gjorde en giltig registrering, visades inte bekräftelsen om att kontrollera e-post. Den ersattes direkt av den generiska texten om att en familjeinbjudan hittats. Samma kodväg kunde skriva över meddelandet efter en begäran om lösenordsåterställning.

**Reproduktion:** I [CI #42483703848](https://github.com/erikjarl/hemmakompassen/actions/runs/42483703848) med oförändrad produktionskod klickade Chromium i kontoformulären med syntetiska API-svar. Testet misslyckades: förväntad text `Kontrollera din e-post för att bekräfta kontot`, faktiskt synlig text `Familjeinbjudan hittad. Logga in på ditt eget konto för att använda den.`. Det bekräftade ett användarsynligt presentationsfel, inte att registrerings-API:t misslyckades.

**Orsak:** `refresh()` i konto.js anropades efter registrering/återställning och skrev över det gemensamma statusfältet `#status` med inbjudningsinformation. Åtgärden gav ingen egen plats för både permanent inbjudningsinformation och formulärets kvittens.

**Ändring:** konto.html har ett separat `#invite-notice` som styrs av den inloggade statusen och inbjudningskoden. konto.js använder inte längre `#status` för den permanenta inbjudningsinformationen. Formulärens framgångs-/felkvittens lämnas synlig efter `refresh()`. Ingen autentisering, serverfunktion, RLS, samtycke eller kontodata ändras.

## Provningsmetod

`tests/visual.mjs` öppnar den **verkliga HTML- och JS-koden** i Chromium, men fångar upp Supabase-anrop med en isolerad stand-in. Testet genomför:

1. Öppna konto.html via en giltigt formaterad QR-inbjudningslänk utloggad.
2. Kontrollera separat synlig inbjudningsbanner och att åtgärdsstatus är tom.
3. Försök registrera med olika lösenord; ingen registreringsbegäran ska skickas.
4. Registrera syntetiskt giltigt och kontrollera att e-postkvittensen överlever uppdateringen.
5. Begär syntetisk lösenordsåterställning och kontrollera att även denna kvittens överlever.
6. Logga in på eget konto med bevarad inbjudningskod och utan oväntad omdirigering.
7. Skapa familj; generera lokal QR-kod med samma inbjudningskod som i länken.
8. Acceptera inbjudan; båda rollerna visas i den syntetiska medlemsvyn och gammal hash rensas.
9. Ändra namn och lösenord i inloggat läge via UI.
10. Logga ut; inloggade kontroller döljs.

**Bevis:** `artifacts/account-functional-synthetic.json`, `mobile-account-invite-loggedout.png`, `mobile-account-invite-paired.png` från PR:ens GitHub Actions-artifact. Ett kompletterande VM-test i `tests/family-pairing.test.cjs` verifierar att inbjudningsnotisen och åtgärdsstatus är separata.

## Begränsningar

Allt testdata är syntetiskt; inget verkligt mejl skickas, inga verkliga lösenord används, ingen produktionsdatabas kontaktas och ingen fysisk QR-skanning eller tvåkontoinloggning har genomförts. Testet gäller främst föräldrarollen med en simulerad tonåringsmedlem, inte en verklig andra enhet. Mobil Safari/VoiceOver, e-postleverans och verklig kontoparning måste fortfarande testas innan funktionsnivån kan markeras verifierad. Ändringen är liten och klientbaserad, men ett grönt syntetiskt test är inte en garanti för alla användarmiljöer.
