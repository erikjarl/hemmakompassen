# PF-05 – Särskilj flera privata omtest i historiklistan

**Datum:** 8 november 2026. **Miljö:** Node-kontraktstest av privat IPIP-50-historik med simulerad backend; **CI inväntas**.

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