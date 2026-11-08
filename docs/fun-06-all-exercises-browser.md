# FUN-06 – samtliga samtalsövningar och genvägar i syntetisk webbläsare

**Datum:** 8 november 2026. **Status:** testkod incheckad, CI inväntas.

## Syfte och metod

De tre privata formulären hade redan testats, men de **nio expanderbara samtalsövningarna** och deras situationsgenvägar saknade fullständig klick-/tangentbordsverifiering. Nu tillkommer `verifyAllCommunicationExercises()` i `tests/visual.mjs`, med **faktiska Chromium-klick, Enter, navigering och browser back** i en syntetisk föräldrasession (390 px) och tonårssession (320 px).

För vardera roll granskas:

- Alla nio övningars initialt stängda tillstånd, öppning via mus, exakt tre synliga steg och stängning med Enter.
- De sex situationsknapparna: vald övning öppnas, fokus placeras på dess `summary`.
- Alla nio `#kommunikation/<övning>`-rutter: öppnas via direkt URL och väljer rätt övning med synligt fokustillstånd; primärmenyn behåller kommunikationsfliken som aktiv.
- Båda genvägarna till privat spegling och samtalsplan: direkt-URL fokuserar rätt rubrik.
- Browser back återgår från `#kommunikation/kontakt` till `#kommunikation/lyssna` och öppnar rätt övning.
- MI-ingången är synlig för föräldern och inte tonåringen; dokumentet håller sig inom viewportbredden.

Totalt **28 kontroller per roll, 56 scenarier**: 1 inventering + 9 övningar + 6 genvägar + 9 direktlänkar + 2 privata formulärrutter + 1 bakåtnavigering = 28.

Bevis: `artifacts/fun-06-exercises-synthetic.json`, en skärmbild per roll och GitHub Actions-logg.

## Gränser

Simulerad Supabase Auth, endast Chromium. **Inte** inloggade verkliga konton, fysisk Safari/VoiceOver eller användartest av de psykologiska rådens kvalitet. Tester av att en knapp öppnar rätt innehåll säger inte att övningen i sig förbättrar relationer. Inga verkliga användarsvar eller databaser ändras.
