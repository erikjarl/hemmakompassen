# Hemmakompassen – automatiska tester (status 8 november 2026)

Detta är **testmiljön för kod och UI**, inte bevis för att verkliga familjeflöden fungerar. Styrande prioriteringar finns i [ACTIVE_ROADMAP](../docs/ACTIVE_ROADMAP.md). ROADMAP och CURRENT_TASKS är historiska referenser, inte arbetskön.

## GitHub Actions

- `../.github/workflows/ui-tests.yml` kör Node-/kontraktstester, statisk build, Playwright och mobil-/desktopskärmbilder vid PR och push till `main`.
- `../.github/workflows/shared-swipe-db-tests.yml` kör PostgreSQL 17 + pgTAP med **syntetiska familjer och ett disponibelt schema** för Gillaswajpens serverkontrakt och flera migrationskedjor: prioritet, B-delning, Schyssta listan inklusive notiser/versioner/arkiv samt privata familjemeddelanden.

Kör lokalt från projektroten:

```bash
node --test tests/*.test.cjs tests/*.test.mjs
npm run build
npm install --no-save playwright
npx playwright install chromium
node tests/visual.mjs
```

**Observera:** kommandot ovan inkluderar både `.cjs`- och `.mjs`-kontraktstester och motsvarar GitHub Actions före webbläsarstegen.

## Vad testerna täcker

- Gillaswajpen: enskilda svar och status, tillåtna A JA+JA, skydd mot otillåtna/okända svar, familjeisolering och överhoppning.
- Schyssta listan: föreslagna/antagna/avslutade regler, dubbelgodkännande, ändringar, omparning och behöriga regelnotiser.
- Inkorg: syntetiska privata meddelanden i båda riktningar, read/unread, läskvittenser, sessionsbyte och avvisning av felaktig data. Sändningsanrop tidsbegränsas, oförändrat återförsök använder samma idempotensnyckel och ett nytt utkast ska inte raderas av ett äldre serversvar.
- IPIP-50: 50 frågor, poängberäkning, referensbeskrivning, positionsgeometri för P50/P75, privat sparning, samtyckesstyrd tvåprofilvisning, rollanpassade reflektioner och giltiga hänvisningar till befintliga kortlekar.
- Kommunikationsråd: rollstyrd MI-ingång, sex gemensamma samtalsövningar och lokal NVC-byggare med XSS-säkert textinnehåll, rensning och inga serverskrivningar.
- Playwright: mobil 320/390 px samt desktop i Chromium med mockad Supabase-klient; exempel på vyer och bilder för personlighet med en eller två profiler.

Testerna ska **aldrig** skriva i produktionsdatabasen eller ändra verkliga användares svar. Syntetiska fixtures är **inte** en fullständig Supabase-installation. En migrationsfil som ligger i repo eller klarar pgTAP är inte per automatik installerad i den riktiga databasen. Nuvarande installationsuppgifter finns i dokumenterade databasgenomgångar i ROADMAP, men slutlig autentiserad verifiering av två riktiga testkonton återstår för flera delsystem.

## Granskning och bevis

Playwright lägger skärmbilder, `visual-audit.json`, `functional-controls-synthetic.json` och `account-functional-synthetic.json` i `artifacts/` och laddar upp dem som GitHub Actions-artifact. Det nya [FUN-00-testprotokollet](../docs/fun-00-functional-test-matrix.md) dokumenterar 44 flöden, fyra syntetiska roll-/viewport-scenarier, och markerar vilka moment som fortfarande saknar verklig verifiering. [FUN-01-kontoresan](../docs/fun-01-account-browser-audit.md) provar även registrering, reset, QR och parning med in-memory backendmock. **Varje kontroll som upptäcks i DOM är en inventerad kontroll, inte en verifierad funktion.** **Grön CI betyder inte automatiskt godkänd visuell design eller säker extern lansering.** Kontrollera det faktiska utfallet och bilderna, notera exakt commit, testmiljö och vad som inte har kontrollerats.

Den tidigare noteringen om att sista matchningsmigrationen ”inte är installerad” var en äldre status före den dokumenterade 30 oktober-installationen. Utgå från nya, explicit verifierade statusuppgifter i ROADMAP och [CURRENT_TASKS.md](../docs/CURRENT_TASKS.md), och kontrollera riktiga databasen innan nya påståenden om livefunktioner.

- KOM-02 (PR #105): verifierad/okänd familjeroll, MI-länk enbart till förälder, AI-chattsvar med endast tre tillåtna klickbara lokala URL:er, skydd mot HTML-injektion och mobilnavigation från sex andra moduler. Endast syntetiska tester – inte riktiga testkonto-/Worker-samtal. UI/AI-CI för PR #105, main-UI/Pages och faktisk Worker-deploy är granskade, men inte modellens live-svar med autentiserade användare.
