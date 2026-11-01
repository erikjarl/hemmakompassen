# Deploy och miljöer – avstämning 1 november 2026

## Liveåtkomlig intern testmiljö

- **GitHub Pages:** https://erikjarl.github.io/hemmakompassen/ använder `main`. Den är åtkomlig på internet men utvecklingsprojektet är tänkt att testas enbart internt.
- **GitHub Actions:** `UI browser smoke tests` på PR/`main` testar gränssnitt, privata data-kontrakt och syntetiska familjeflöden. `pages build and deployment` indikerar bygg- och publiceringsstatus för Pages. Skilj alltid mellan **grön CI** och **verifierat faktiskt test med två riktiga inloggade konton**.
- **Cloudflare Workers:** Projektet innehåller `wrangler.jsonc` och en allowlistad byggprocess för `dist/`. Historiska Cloudflare/Workers-inställningar kan fortfarande finnas, men den här dokumentationen intygar **inte** att en Cloudflare-distribution är live eller identisk med Pages.

## Tillgångar och säkerhet

`npm run build` anropar `scripts/build-static.mjs`, som bygger `dist/` från en explicit lista med bland annat `index.html`, liveappen, backend-konfiguration, kortkatalog, IPIP-moduler och visuella tillgångar. Den tidigare uppgiften om ”endast sex filer” är föråldrad; kontrollera listan i själva byggskriptet. Testfiler, `ROADMAP.md`, SQL, `.git` och hemliga servernycklar ska **inte** publiceras.

`npm run deploy` bygger och försöker sedan köra `wrangler deploy`. Kontrollera Cloudflare-kontots faktiska konfiguration, domän och release-loggar separat innan du hävdar att en Workers-URL fungerar.

## Aktiverade/avstängda funktioner

Aktuell `backend-config.js`:
- `enableSchysstaList: true`
- `enablePersonalitySharing: true`
- `enableSharedPriorities: false`
- `enableSharedPolling: false`
- `enableSharedInsights: false`
- `enableSharedUnderstanding: false`
- `liveModeEnabled: false` (äldre flagga; **dra inte** slutsatsen att inloggade livevyer är demo enbart från denna flagga).

**Release-kriterium:** Kontrollera GitHub Actions, källkod och verklig konfiguration innan nytt funktionspåstående. Registrera kvarstående autentiserade integrationstester i [aktuell utvecklingskö](docs/CURRENT_TASKS.md), även om ett mocktest är grönt. Ändra inte gamla testsvar för att nå ett väntat utfall.
