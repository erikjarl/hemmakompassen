# PF-05 – Särskilj flera privata omtest i historiklistan

**Datum:** 8 november 2026. **Verifierat:** [PR #225](https://github.com/erikjarl/hemmakompassen/pull/225) mergad till `main` (`df12174`); **två fullständiga gröna Node/Chromium-körningar** [#42506006233](https://github.com/erikjarl/hemmakompassen/actions/runs/42506006233) och [#42506034968](https://github.com/erikjarl/hemmakompassen/actions/runs/42506034968), med **8/8 nya syntetiska Chromium-kontroller** och **77 skärmbilder** i hela UI-sviten.

## Problemet

När en användare har flera avslutade omtest samma dag renderades varje rad som enbart datumet. Flera identiska knappar med namnen **Visa mitt resultat**, **Exportera omgången (JSON)** och **Radera omgången** saknade omgångsspecifika namn. Det är svårt att förstå vilket resultat en rad avser och särskilt problematiskt med skärmläsare.

## Ändring

- Varje historikrad visar `Omtest 1 av N` (senaste överst) samt svenskt datum **och klockslag**. Nummer är listposition, inte ett permanent databas-ID.
- Varje kontrolls tillgänglighetsnamn kopplas till rätt omgång och datum/tid utan att visa databas-ID:n.
- När ett tidigare resultat öppnas visas samma omgångsnummer i resultatets rubrik. Efter borttagning räknas listan om.
- Befintliga inloggningar, lagring och ursprungliga personlighetstest påverkas inte.

## Testmetod och scenarier

I `tests/ipip50-retest-ui.test.mjs` används riktig `createPrivateIpipRetests`-logik och en in-memory fake backend. Testet genomför två fullständiga privata 50-frågeomgångar som avslutas samma dag (100 syntetiska svar), kontrollerar de separata historikraderna och deras tillgänglighetsnamn, visar båda individuella resultaten, exporterar den andra omgången, raderar enbart den första, laddar historiken igen och byter därefter användare för att verifiera tomt läge. Ett separat test simulerar fel vid historikläsning, visar enbart **Försök igen** och hämtar därefter tillbaka historiken med två omgångar.

**Begränsning:** Tester körs i Node med mockad databas, inte genom verkligt signerad Supabase Auth, en fysisk mobil eller praktisk skärmläsare. Funktionell UI-verifiering i Chromium och användartest på iOS återstår. Inga befintliga testsvar har ändrats.
## Kompletterande Chromium-verifiering (före CI)

`verifyDistinctPrivateRetestHistory()` i `tests/visual.mjs` använder riktiga webbläsarklick i två syntetiska roller (förälder 390 px, tonåring 320 px) med två förifyllda och redan avslutade omtest samma dag. För varje roll verifieras: två separata synliga rader och tillgängliga knappetiketter, val av äldre respektive nyare resultat, JSON-export av just den äldre omgångens svar samt radering av den nyare omgången utan att det äldre testet försvinner. Sista steget kontrollerar att återstående historik får etiketten `Omtest 1 av 1` och att layouten inte överskrider viewportbredden. **Totalt 8 syntetiska roll-/stegkontroller**; två skärmbilder och JSON-rapport sparas som CI-artifact.

Chromiums backend är en simulerad in-memory-tabell, så detta testar inte serverpersistens över full omladdning, Supabase Auth eller fysisk iPhone. Testerna introducerar inga ändringar i verkliga svar.

## Testuppföljning

Tidiga [CI #42505539973](https://github.com/erikjarl/hemmakompassen/actions/runs/42505539973) misslyckades eftersom ett äldre browsertest sökte på det generiska tillgänglighetsnamnet för **Exportera omgången (JSON)**. Det hade bytts ut mot det nya omgångsspecifika namnet. Äldre Playwright-selektorn uppdaterades utan att exportfunktionen ändrades. Efter den ändringen är den fullständiga browserkörningen grön i två efterföljande CI-körningar. Det röda utfallet var alltså ett testsökningsfel, inte ett verifierat fel i exportfunktionen.

Serverpersistens, signerade användare och fysisk Safari/VoiceOver är fortsatt **inte testade**.
