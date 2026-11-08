# FUN-02 – sex temakortlekar: klick, spara, återuppta och slutföra

**Datum:** 8 november 2026. **Testmiljö:** Chromium med lokal statisk app och avskild Supabase-mock. Inga verkliga användarsvar skrivs.

## Metod
I `tests/visual.mjs` öppnar en syntetisk förälder (390 px) och en syntetisk tonåring (320 px) samtliga sex kortlekar direkt via deras verkliga knappar. För varje lek kontrolleras antalet kort, att den privata svarsöversikten börjar tom, att ett verkligt klick på JA/NEJ ger precis rätt `deck_id`, första stabila `card_id`, `user_id` och `onConflict`, samt att nästa kort öppnas. Testet går tillbaka till leklistan, granskar separata framsteg per lek och återvänder till första obesvarade kort. Dokumentöverströmning undersöks för varje aktiv kortlek.

| Kortlek | Antal kort | Testade roller | Kontroll |
| --- | ---: | --- | --- |
| Samtalsämnen (`samtal`) | 104 | Förälder, tonåring | Start, första svar, privat sparning, återupptagning |
| Aktiviteter (`aktiviteter`) | 104 | Förälder, tonåring | Samma |
| Regler (`regler`) | 12 | Förälder, tonåring | Samma |
| Uppskattning (`uppskattning`) | 8 | Förälder, tonåring | Samma |
| Återhämtning (`aterhamtning`) | 8 | Förälder, tonåring | Samma |
| Förändring (`forandring`) | 8 | Förälder, tonåring | Samma **plus alla 8 svar, färdigläge, starta om och ändra första sparade svaret** |

Resultat genereras i `artifacts/fun-02-all-decks-synthetic.json`. Varje kontroll i JSON är ett faktiskt klick i mockad Chromium, inte en statisk kodgranskning.

## Begränsningar
I detta ursprungliga start-/återupptagningstest spelas de längre lekarna inte igenom i sin helhet. **Separat** fullföljning av båda 104-kortslekarna i båda rollerna finns numera i [FUN-02-långleksrapporten](fun-02-long-deck-browser-flows.md). Olika fysiska enheter och riktig persistens kräver fortsatta tester. Gillaswajpens gemensamma resultat bygger på syntetiska RPC-svar här; **ingen verklig förälder/tonåring har loggat in eller godkänt delning**. Mobil Safari, svepgester på fysisk telefon och användarens existerande databasposter har inte testats eller ändrats.

Dokumentera eventuella upptäckta fel med exakta reproduktionssteg i FUN-02 innan produktionskod ändras.

## Tillägg 8 november: fullföljda kortlekar med 8–12 kort

[PR #210](https://github.com/erikjarl/hemmakompassen/pull/210), commit `3e58e7b976ce29ba97fcde85f375bbedd11ce172`, [grön Chromium-CI #42488320005](https://github.com/erikjarl/hemmakompassen/actions/runs/42488320005).

I både förälderns 390px och tonåringens 320px syntetiska session spelas nu även **Regler (12 kort), Uppskattning (8 kort) och Återhämtning (8 kort)** hela vägen från ett redan sparat första svar. Efter varje sista svar kontrolleras korrekt färdigmeddelande, privat lista med samtliga svar, mobil överströmning, återstart och korrigerad första privata post. Tillsammans med tidigare verifierad Förändring (8 kort) ger detta **8 fullständiga kortleksgenomspelningar för de fyra kortare temakortlekarna** (4 lekar × 2 roller). De två längre lekarna har ytterligare 4 hela genomspelningar enligt separat rapport: totalt **12 hela kortleksgenomspelningar i syntetisk Chromium**.

Det nya tillägget ger **50 nya svarsklick** i resterande korta lekar utöver deras redan sparade första svar, samt sex omstartskorrigeringar. De gamla 8-kortstesterna och långleksflödena finns kvar. Ingen produktionsanvändare, verklig Auth eller live Supabase/Worker har testats; befintliga svar i databasen ändrades inte.
