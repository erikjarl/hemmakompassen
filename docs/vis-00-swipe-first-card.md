# VIS-00-04 – visa Gillaswajpens första kort före sekundära funktioner

## Observation och syfte

Den syntetiska mobilen i `mobile-ai-swipe-result.png` från [Chromium #42612477833](https://github.com/erikjarl/hemmakompassen/actions/runs/42612477833) visar en lång Gillaswajpen-introduktion med exportknapp och utförlig exportförklaring före själva första kortet. På en smal telefon syns kortet bara delvis under den fasta navigeringen. Detta är ett visuellt användbarhetsproblem, **inte bevis för att kortens svarfunktion är trasig**.

Målet är att placera den primära användarhandlingen, **att läsa och svara på ett kort**, högre i första innehållsvyn. Funktionen **Ladda ner mina egna svar** ska vara kvar, utan att hamna mellan rubrik och kort. Exportens beteende, filformat och åtkomst ändras inte.

## Genomförd kodändring

- `live-app.js`: på både allmän kortlek och temakortlek ligger privat export efter `.swipe-stage` och före de privata svarssammanställningarna. Korten och deras knappar, autosparande, filtrering och resultatgenerering ändras inte.
- `live-app.css`: kompaktare intro på mobil, kortare avstånd mellan rubrik och kort, tydligt sekundärt utseende på exportytan efter kortet. Endast `.swipe-play-view` påverkas, så **Gemensamma insikter** och andra sidor behåller egna rubriksättningar.
- `index.html`, `live-app.js` och `personality/ipip50-ui.js`: versionsstyrda huvud- och personlighetsskript uppdaterade konsekvent, utan att ändra IPIP-beräkningar.

## Verifieringsplan och begränsning

Kör verkliga Chromium-renderingar i den existerande syntetiska testsituationen. För 390px-allmän kortlek respektive 320px-temakortlek: börja överst i innehållsvyn, kontrollera att det första kortet har avsevärt synligt utrymme innan bottenmenyn, och att exporten återfinns som syskonelement **efter** kortets scen, inte i rubriken. Kontrollera befintliga tester av export, svar, filtrering och uppspelning av alla lekar. Ta före-/efter-skärmbilder (`mobile-ai-swipe-result.png`, `mobile-general-swipe-first-card-top.png`, `mobile-theme-first-card-top.png`).

En grön Node/Chromium-körning innebär inte att fysisk iOS/Safari, tillgänglighet med 200 % text eller två riktiga inloggade konton är verifierade. Fristående arbete med övriga visuella brister fortsätter i `docs/ACTIVE_ROADMAP.md`.
