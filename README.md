# Hemmakompassen

**Aktuell status: intern testversion, 4 november 2026.** Hemmakompassen är en responsiv webbapp för förälder och tonåring med fokus på dialog, ömsesidig förståelse och gemensamma överenskommelser. GitHub Pages är tillgänglig på internet, men projektet är ännu inte granskat eller lanserat för externa verkliga familjer.

- **Vad som gjordes under helgen / återstående arbete:** [Aktuell utvecklingskö](docs/CURRENT_TASKS.md).
- **Hela produktvisionen och historiken:** [ROADMAP.md](ROADMAP.md).
- **Metod för IPIP-50 och dess begränsningar:** [docs/ipip50-sv-method.md](docs/ipip50-sv-method.md).

## Öppna webbappen

**Intern online-testmiljö:** https://erikjarl.github.io/hemmakompassen/

Inloggning sker i `konto.html` och vidare i `index.html`/`live-app.js`, med Supabase-autentisering och familjekoppling. Två separata konton med rollerna förälder/tonåring kan bilda ett familjepar. Delade data får inte hämtas direkt från den andras privata svar.

Det finns även äldre lokala demofiler `app.js`/`styles.css`, men de är **inte** det aktuella inloggade familjeflödet. Tolka inte deras påhittade exempel som produktionsdata eller samma funktioner som liveappen.

## Implementerat i den interna testversionen

- **Gillaswajpen:** 34 allmänna A/B-kort, sex temakortlekar, 104 aktiviteter och 104 samtalsämnen, privata svar, återupptagning och serverbaserad A-matchning. Gemensam insiktsvy och frivillig separat B-delning är aktiva för interna testkonton. Tonåringen ser nu en **privat** översikt över egna mycket viktiga A-kort där båda sagt ja (PR #100–#101); detta delas ännu inte med föräldern. Tvåkontotest av återkallelse/isolering återstår.
- **Inkorg:** privata familjemeddelanden i båda riktningar, historik, meddelandestatus och olästa regelaviseringar. Backend har familje- och parningskontroller. Verkligt heltäckande tvåkontotest är kvarstående.
- **Schyssta listan:** familjeavgränsade förslag från regelkort och fritext, separata godkännanden, förfrågningsstatus, ändringar, omprövning/återkallelse, arkiv, sök- och filterfunktion samt inkorgskoppling. `enableSchysstaList=true` i intern testversion.
- **Min personlighet:** versionssatt svenskspråkigt IPIP-50 (50 frågor) med privata svar, fem summaskalor, frivillig delning av endast fem sammanfattande poäng efter bådas aktiva samtycke, fem horisontella jämförelsestaplar och automatiska AI-reflektioner i intern testmiljö. Beräknade `P≈` utgår från en normalmodell och en icke-representativ amerikansk vuxenreferens, **inte** svenska normpercentiler.
- **Kommunikationsråd:** gemensamma övningar för spegling, konflikter och problemlösning, NVC:s fyra steg med lokal, osparad samtalsbyggare samt MI/OARS-föräldraguiden med övningar om lov och ambivalens (mergad och publicerad PR #104, grön CI). Metodbeskrivningarna är inte belägg för klinisk behandlingseffekt i familjer.
- **Mobilmeny och tangentbord:** hopp till huvudinnehållet, fokus vid sidbyten, aktiv flik som hålls synlig och skydd mot oavsiktliga ja/nej när piltangenter används på länkar/knappar (PR #103, grön main-CI och Pages). Riktig iOS-/skärmläsar-QA återstår.

## Kvarvarande begränsningar – läs innan extern testning

- Konfigurationen håller **`enableSharedPriorities` och `enableSharedPolling` avstängda**, men **`enableSharedInsights` och `enableSharedUnderstanding` aktiverade för intern testning**. Delning av B-kort är fortfarande frivillig per kort och återkallelig, inte automatisk. Verklig tvåkontoverifiering saknas fortfarande.
- **AI-medlaren och automatiska AI-reflektioner finns i den interna testversionen:** Cloudflare Worker och resultatvyerna är kodade, distribuerade och begränsade till två tillåtna testkonton. Fullständiga autentiserade tvåkontotester, säkerhets- och innehållsgranskning återstår. Inte produktionsklart.
- IPIP-50-översättningens psykometriska egenskaper och jämförbarhet mellan svenska ungdomar och vuxna är inte fastställda; tolkningsråd och godtyckliga råpoängströsklar är redaktionella samtalshjälpmedel, inte kliniska gränser.
- Simulerade Node-/PostgreSQL-/Playwright-tester bevisar **inte** att hela flödet fungerar med två verkligt autentiserade konton, särskilt vid omparning, fel och samtyckesåterkallelse. Följ testkön i [CURRENT_TASKS.md](docs/CURRENT_TASKS.md).
- Krav på dataportabilitet/radering, informationsflöden för minderåriga, juridisk bedömning, säkerhets- och användbarhetsgranskning återstår inför en extern pilot.

## Testning och publicering

UI-test och grundläggande kontraktstest körs i `.github/workflows/ui-tests.yml`, även med mobil- och desktop-skärmbilder. PostgreSQL/pgTAP för bland annat Gillaswajpen, Schyssta listan och privata familjemeddelanden körs i `.github/workflows/shared-swipe-db-tests.yml`.

Kör den samlade Node-/webbläsarkontrollen enligt [tests/README.md](tests/README.md). En statisk tillgångsbuild kan köras med `npm run build`; `scripts/build-static.mjs` kopierar uttryckligen tillåtna tillgångar till `dist/` och ska **inte** publicera databasmigrationer, hemligheter eller interna dokument.

**Koppla inte in verkliga externa familjer förrän återstående säkerhets-, datalivscykel- och innehållsgranskning är slutförd.** Bevara alla redan sparade testkontosvar vid utveckling och utför migrationer först efter avgränsad granskning.
