# DES-01A – källinventering och riskkarta (14 november 2026)

**Status:** Källkodsinventering genomförd. Visuell testbaslinje och autentiserade skärmbilder **inte** genomförda. Detta dokument ersätter inte DES-01H-verifiering. Källa: `main` efter merge av PR #474.

## Källor granskade

| Källa | Omfattning vid granskning | Roll i dagens styling |
| --- | ---: | --- |
| `styles.css` | 27 222 tecken, 175 hex-färgträffar, 11 media-regler | Globala `:root`-variabler, typografi, knappar, formulär, huvudlayout, vissa swipes |
| `live-app.css` | 74 715 tecken, 416 hex-färgträffar, 46 media-regler | Live-lägets rollvyer, Gillaswajpen, inkorg/regler, mobilnavigation och specialtillstånd |
| `index.html` | 15 021 tecken, 84 hex-färgträffar, 8 media-regler | Inbäddad CSS med flera överstyrningar, särskilt mobilmeny och swipe |
| `konto.html` | 9 316 tecken, 5 hex-färgträffar, 2 media-regler | Inbäddade kontospecifika formulär-/responsivitetsregler |
| `feedback.css` | 3 506 tecken, 21 hex-färgträffar, 2 media-regler | Rapportknapp, dialog, fokus, mobil dockning |
| `personality/ipip50-ui.js` | 35 979 tecken, 12 hex-färgträffar | JS-driven personlighetspresentation; kräver separat inventering av genererad DOM |

Siffrorna är **textbaserade sökträffar**, inte antal unika färger, CSS-selektorer eller kvalitetsmått. Alla filer hämtades från GitHub, men ingen renderad skärmbild togs vid denna inventering.

## Säkra implementationsgränser inför DES-01B–G

1. `styles.css` definierar nu mörk palett i `:root` (`--bg`, `--card`, `--text`, `--accent`, `color-scheme:dark`). `index.html` definierar dessutom en andra mörk `:root` och direkta färger på `.live-*`. Ändring av enbart första tokenkartan skulle lämna motsägande mörka paneler/ljusa textstilar. Kartlägg prioritetsordningen i verklig DOM innan globala värden byts.
2. `live-app.css` använder direktkodade mörka färger för `.home-hero`, `.swipe-results`, `.swipe-match-list`, `.swipe-summary-overview`, `.swipe-priority-share` m.fl. Byt dessa i små, granskbara komponentgrupper. Behåll färgskillnad för JA/NEJ utöver textetiketter.
3. `index.html` och `live-app.css` innehåller båda mobila navigationsregler. `#live-mobile-nav` måste förbli **horisontellt svepbar**, inklusive rapportknappens reserverade plats, fokusmarkering och safe-area. Referensmontagets förenklade ikonrad får inte ersätta funktionell navigering.
4. `feedback.css` sätter både flytande rapportknapp och separat mobil dockning på appvyn. Undvik kollision med personlighetens grafer och dolt fokus när färger, skuggor eller placering ändras.
5. `konto.html` använder gemensamma `styles.css` men egna inbäddade regler. Registrering, inloggning, återställning, tvåkontoparning och statusmeddelanden måste förbli användbara i ljust tema.
6. Personlighetsvyn genereras delvis i JS och ska testas med **faktiskt resultat, ofullständigt resultat och delningsbegränsningar**; ersätt aldrig resultatvärden med montagets exempelvärden.
7. Befintlig `prefers-reduced-motion` och `:focus-visible` får inte försvinna i visuella omskrivningar. Fel, laddning, ej parat, ej samtyckt, avaktiverad knapp och okänt olästläge behöver separata kontrastkontroller.

## DES-01A återstår före implementation på bred front

- [ ] Spara **före**-skärmbilder av riktiga appvyer för förälder och tonåring vid 320, 390, 768 och 1280 px; skilj syntetisk Chromium från inloggad tvåkontoverifiering.
- [ ] Samla computed styles och kontrastprov för body, länkar, knappar, fält, dialoger och status-/feltexter i båda rollerna.
- [ ] Inventera alla text-/klassöverstyrningar i `index.html`, `live-app.js` och personlighetens renderare innan nya globala tokens kopplas in.
- [ ] För varje nästa design-PR: kör full CI, 320/390-svepbar mobilmeny, rapportknapp, tangentbordsfokus, konto och Gillaswajpen; utför separat Pages-kontroll efter merge.
- [ ] Verifiera manuell Safari/iPhone och autentiserade tvåkontoflöden – **inte verifierade** i detta pass.

## Nästa isolerade kodändring

DES-01B i första liten PR: skapa central semantisk palett, kartlägg gamla tokens mot nya och anpassa endast **globala bakgrunder, text och neutrala paneler** efter att deras överstyrningar identifierats. Lägg till uttryckliga kontrasttester för ljus palett. Behåll funktionell JS, lagring och API oförändrade. Ändra inte den verkliga mobilnavigationens geometri i samma PR.
