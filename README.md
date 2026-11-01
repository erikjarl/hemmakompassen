# Hemmakompassen

**Aktuell status: intern testversion, 1 november 2026.** Hemmakompassen är en responsiv webbapp för förälder och tonåring med fokus på dialog, ömsesidig förståelse och gemensamma överenskommelser. GitHub Pages är tillgänglig på internet, men projektet är ännu inte granskat eller lanserat för externa verkliga familjer.

- **Vad som gjordes under helgen / återstående arbete:** [Aktuell utvecklingskö](docs/CURRENT_TASKS.md).
- **Hela produktvisionen och historiken:** [ROADMAP.md](ROADMAP.md).
- **Metod för IPIP-50 och dess begränsningar:** [docs/ipip50-sv-method.md](docs/ipip50-sv-method.md).

## Öppna webbappen

**Intern online-testmiljö:** https://erikjarl.github.io/hemmakompassen/

Inloggning sker i `konto.html` och vidare i `index.html`/`live-app.js`, med Supabase-autentisering och familjekoppling. Två separata konton med rollerna förälder/tonåring kan bilda ett familjepar. Delade data får inte hämtas direkt från den andras privata svar.

Det finns även äldre lokala demofiler `app.js`/`styles.css`, men de är **inte** det aktuella inloggade familjeflödet. Tolka inte deras påhittade exempel som produktionsdata eller samma funktioner som liveappen.

## Implementerat i den interna testversionen

- **Gillaswajpen:** 34 allmänna A/B-kort, sex temakortlekar, stora kataloger (104 aktiviteter och 104 samtalsämnen), privata svar, återupptagning och serverbaserad grund för A-matchningar. **Inte alla gemensamma funktioner är aktiverade** (se nedan).
- **Inkorg:** privata familjemeddelanden i båda riktningar, historik, meddelandestatus och olästa regelaviseringar. Backend har familje- och parningskontroller. Verkligt heltäckande tvåkontotest är kvarstående.
- **Schyssta listan:** familjeavgränsade förslag från regelkort och fritext, separata godkännanden, förfrågningsstatus, ändringar, omprövning/återkallelse, arkiv, sök- och filterfunktion samt inkorgskoppling. `enableSchysstaList=true` i intern testversion.
- **Min personlighet:** versionssatt svenskspråkigt IPIP-50 (50 frågor) med privata svar, fem summaskalor, frivillig delning av endast fem sammanfattande poäng efter bådas aktiva samtycke, fem horisontella jämförelsestaplar och förskrivna rollanpassade reflektionsråd. Beräknade `P≈` utgår från en normalmodell och en icke-representativ amerikansk vuxenreferens, **inte** svenska normpercentiler.
- **Kommunikationsråd:** befintliga allmänna råd; särskild MI-sida för förälder kvarstår.

## Kvarvarande begränsningar – läs innan extern testning

- Konfigurationen i `backend-config.js` håller `enableSharedPriorities`, `enableSharedPolling`, `enableSharedInsights` och `enableSharedUnderstanding` **avstängda**. Att migrationsfiler eller frontendkod finns betyder inte att dessa funktioner är aktiva.
- **AI-medlaren är inte färdig:** den är fortfarande en utvecklingsvy, inte en fungerande privat AI-medlingschatt.
- IPIP-50-översättningens psykometriska egenskaper och jämförbarhet mellan svenska ungdomar och vuxna är inte fastställda; tolkningsråd och godtyckliga råpoängströsklar är redaktionella samtalshjälpmedel, inte kliniska gränser.
- Simulerade Node-/PostgreSQL-/Playwright-tester bevisar **inte** att hela flödet fungerar med två verkligt autentiserade konton, särskilt vid omparning, fel och samtyckesåterkallelse. Följ testkön i [CURRENT_TASKS.md](docs/CURRENT_TASKS.md).
- Krav på dataportabilitet/radering, informationsflöden för minderåriga, juridisk bedömning, säkerhets- och användbarhetsgranskning återstår inför en extern pilot.

## Testning och publicering

UI-test och grundläggande kontraktstest körs i `.github/workflows/ui-tests.yml`, även med mobil- och desktop-skärmbilder. PostgreSQL/pgTAP för bland annat Gillaswajpen, Schyssta listan och privata familjemeddelanden körs i `.github/workflows/shared-swipe-db-tests.yml`.

Kör den samlade Node-/webbläsarkontrollen enligt [tests/README.md](tests/README.md). En statisk tillgångsbuild kan köras med `npm run build`; `scripts/build-static.mjs` kopierar uttryckligen tillåtna tillgångar till `dist/` och ska **inte** publicera databasmigrationer, hemligheter eller interna dokument.

**Koppla inte in verkliga externa familjer förrän återstående säkerhets-, datalivscykel- och innehållsgranskning är slutförd.** Bevara alla redan sparade testkontosvar vid utveckling och utför migrationer först efter avgränsad granskning.
