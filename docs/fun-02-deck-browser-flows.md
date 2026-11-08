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
De längre lekarna spelas **inte** igenom i sin helhet; deras fullständiga korträckvidd, svar i olika kategorier och byte mellan olika datorer/enheter kräver fortsatta tester. Gillaswajpens gemensamma resultat bygger på syntetiska RPC-svar här; **ingen verklig förälder/tonåring har loggat in eller godkänt delning**. Mobil Safari, svepgester på fysisk telefon och användarens existerande databasposter har inte testats eller ändrats.

Dokumentera eventuella upptäckta fel med exakta reproduktionssteg i FUN-02 innan produktionskod ändras.
