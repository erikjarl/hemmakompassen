# FUN-03 – Kopiering av Schyssta listans godkända regler när urklipp nekas

**Datum:** 8 november 2026. **Verifierat:** [PR #222](https://github.com/erikjarl/hemmakompassen/pull/222) mergad till `main` (`baae91a`), [grön fullständig Node/bygg/Chromium-CI #42501825362](https://github.com/erikjarl/hemmakompassen/actions/runs/42501825362). Testsviten passerade och sparade **69 skärmbilder**, inklusive två nya skärmbilder från förälderns och tonåringens kopieringsfallback.

## Upptäckt funktionslucka

När `navigator.clipboard.writeText()` nekas av webbläsaren visade Schyssta listan tidigare endast ett textmeddelande som bad användaren kopiera manuellt. Det fanns ingen tydligt avgränsad kopierbar textruta att använda. Vanlig export till textfil och framgångsrik automatiserad kopiering var redan testade.

## Ändring

Vid ett misslyckat kopieringsförsök visas nu en märkbar, skrivskyddad textruta med **enbart de aktuella godkända överenskommelserna**. Innehållet kodas som text vid HTML-rendering och fokuseras/markeras för manuell kopiering. En **Markera texten igen**-knapp finns om urvalet försvinner. Vid nästa lyckade kopiering försvinner reservrutan.

Textrutan återanvänder samma verifierade, aktuella innehåll som exportfunktionen. Förslag utan två godkännanden och avslutade regler ska inte förekomma. Ingen serverförändring eller ny lagring introduceras.

## Testmetod

Utökat `tests/visual.mjs` med verkliga DOM-klick i Playwright Chromium, men **simulerad Supabase och injicerat nekande urklipp**:

- Förälder, 390 px: börja med lyckad `writeText`, simulera nekad urklippsbehörighet, visa skrivskyddad textruta, kontrollera endast godkända regler, kontrollera initial helmarkering, återmarkera med knappen, verifiera ingen horisontell overflow och slutligen lyckad retry som tar bort reservrutan.
- Tonåring, 320 px: efter att två parter syntetiskt godkänt en reviderad regel, simulera urklippsfel och kontrollera att den nuvarande ersättningsregeln (men inte föregående arkiverade texten) visas markerad i reservrutan och ryms på mobilen.
- Befintliga nedladdningstester körs fortsatt för båda scenarierna.
- Bevis: GitHub Actions-logg, skärmbilder `fun-03-clipboard-fallback-parent.png` och `fun-03-clipboard-fallback-teen.png`.

## Avgränsningar

Detta bevisar att den **syntetiska browser-UI:n** visar och markerar rätt text i Chromium med fejkad urklippsbehörighet. Det visar inte att en faktisk användare lyckas kopiera till systemets urklipp i Safari/iOS eller med annan behörighetsmodell. Inga befintliga användarkonton eller sparade svar rörs.
