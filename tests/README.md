# Hemmakompassen – automatiska tester (status 1 november 2026)

Detta är **testmiljön för kod och UI**, inte bevis för att verkliga familjeflöden fungerar. Se [aktuell utvecklingskö](../docs/CURRENT_TASKS.md) och [ROADMAP](../ROADMAP.md).

## GitHub Actions

- `../.github/workflows/ui-tests.yml` kör Node-/kontraktstester, statisk build, Playwright och mobil-/desktopskärmbilder vid PR och push till `main`.
- `../.github/workflows/shared-swipe-db-tests.yml` kör PostgreSQL 17 + pgTAP med **syntetiska familjer och ett disponibelt schema** för Gillaswajpens serverkontrakt och flera migrationskedjor: prioritet, B-delning, Schyssta listan inklusive notiser/versioner/arkiv samt privata familjemeddelanden.

Kör lokalt från projektroten:

```bash
node --test tests/*.test.mjs
npm run build
npm install --no-save playwright
npx playwright install chromium
node tests/visual.mjs
```

**Observera:** vissa andra automatiska tester använder `.cjs` och ingår i GitHub-arbetsflödets explicita testkommando; den lokala genvägen ovan täcker inte nödvändigtvis varje test. Följ arbetsflödets kommandorad för exakt full svit.

## Vad testerna täcker

- Gillaswajpen: enskilda svar och status, tillåtna A JA+JA, skydd mot otillåtna/okända svar, familjeisolering och överhoppning.
- Schyssta listan: föreslagna/antagna/avslutade regler, dubbelgodkännande, ändringar, omparning och behöriga regelnotiser.
- Inkorg: syntetiska privata meddelanden i båda riktningar, read/unread, läskvittenser, sessionsbyte och avvisning av felaktig data.
- IPIP-50: 50 frågor, poängberäkning, referensbeskrivning, positionsgeometri för P50/P75, privat sparning, samtyckesstyrd tvåprofilvisning, rollanpassade reflektioner och giltiga hänvisningar till befintliga kortlekar.
- Playwright: mobil 320/390 px samt desktop i Chromium med mockad Supabase-klient; exempel på vyer och bilder för personlighet med en eller två profiler.

Testerna ska **aldrig** skriva i produktionsdatabasen eller ändra verkliga användares svar. Syntetiska fixtures är **inte** en fullständig Supabase-installation. En migrationsfil som ligger i repo eller klarar pgTAP är inte per automatik installerad i den riktiga databasen. Nuvarande installationsuppgifter finns i dokumenterade databasgenomgångar i ROADMAP, men slutlig autentiserad verifiering av två riktiga testkonton återstår för flera delsystem.

## Granskning och bevis

Playwright lägger skärmbilder och `visual-audit.json` i `artifacts/` och laddar upp dem som GitHub Actions-artifact. **Grön CI betyder inte automatiskt godkänd visuell design eller säker extern lansering.** Kontrollera det faktiska utfallet och bilderna, notera exakt commit, testmiljö och vad som inte har kontrollerats.

Den tidigare noteringen om att sista matchningsmigrationen ”inte är installerad” var en äldre status före den dokumenterade 30 oktober-installationen. Utgå från nya, explicit verifierade statusuppgifter i ROADMAP och [CURRENT_TASKS.md](../docs/CURRENT_TASKS.md), och kontrollera riktiga databasen innan nya påståenden om livefunktioner.
