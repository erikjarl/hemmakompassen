# FUN-04 – kontrolläsning av IPIP-50-svar när skrivkvittens saknas

**Datum:** 8 november 2026. **PR:** [#235](https://github.com/erikjarl/hemmakompassen/pull/235), mergad som `4996949`. **Grön PR-CI:** [GitHub Actions #42532139365](https://github.com/erikjarl/hemmakompassen/actions/runs/42532139365).

## Funktionsfel och ändring

Före ändringen betraktade `saveMyIPIP50Answer` varje avbrutet Supabase-svar som ett misslyckat sparande. Det är inte korrekt om servern redan hann spara frågesvaret. Vid en felaktig eller utebliven kvittens använder klienten nu en kontrolläsning av **just det inloggade kontots** `user_id`, instrument `ipip50-sv-v1` och aktuell `question_id`.

- Ett serverbekräftat identiskt värde tillåter normal fortsättning till nästa fråga, **utan extra skrivning**.
- Ett avvisat/saknat/annat sparat värde håller kvar samma fråga och visar att svaret inte kunde bekräftas.
- Fel eller ett oläsbart/ogiltigt kontrolläsningssvar markeras **okänt**. Knappen **Kontrollera sparat svar** laddar om de aktuella egna svaren utan att göra en ny skrivning.
- Ett snabbt avvisat skrivförsök ledde i den syntetiska Chromium-testmiljön till två skrivningar från ett och samma testklick: felhanteringen i den tidigare `Promise.all` frigjorde formuläret före dess avsedda minsta väntetid. `Promise.allSettled` behåller nu samma minst 650 ms låsning även när sparningen misslyckas. Detta minskar risken för dubbelhantering av snabba/upprepade UI-händelser och håller den synliga sparstatusen konsekvent.

Ingen databasdefinition eller befintlig sparad data ändrades.

## Verifiering

**Node: 379/379 godkända tester i hela sviten.** Tio nya enhetstestfall täcker förlorad kvittens efter lyckad lagring, kastat nätverksfel, saknad kvittens, avvisning före lagring, gammalt avvikande värde, fel/ogiltigt kontrolläsningssvar samt komponentens fortsättning, återförsök, uttryckliga omläsning och skydd mot dubbelhändelser.

**Chromium: 6/6 nya syntetiska scenarier godkända**, två roller (förälder 390px, tonåring 320px) gånger tre skrivutfall. Varje fall använder verklig klickning på IPIP-50-radioknappen i Chromium och mockad, användarspecifik Supabase-datalagring. Kontrollerar feltext, att nästa fråga inte öppnas förrän svaret bekräftats, serverkontroll och möjligheten att läsa tillbaka svaret utan ny skrivning. Rålogg: Actions-artifact `fun-04-ipip50-answer-ack-browser-synthetic.json`. Samma gröna workflow körde statisk byggkontroll och den fulla Chromium-sviten med **77 skärmbilder**.

Tidiga röda testkörningar: en ny Node-fixtur saknade obligatorisk `onRender` (testfel); därefter avslöjade webbläsartestet dubbelsparande vid snabba fel (åtgärdat ovan). En efterföljande felaktig textlocator korrigerades. Samtliga nya och befintliga tester passerade i slutlig PR-körning.

## Gränser för slutsatsen

Detta är inte ett verifierat flöde med två **riktigt autentiserade** förälder-/tonårskonton, verkligt avbrutet nätverk på Supabase eller en fysisk iPhone/Safari. Läsbaserad Supabase-kontroll visade att tabellen `personality_answers` har de nödvändiga kolumnerna och autentiserade kolumnbehörigheterna; det är **inte** ett bevis för live-persistens. Inga användarsvar ändrades i detta pass. FUN-04 kvarstår därför som **Pågår**.

Nästa FUN-04-åtgärd: verifiera med tillåtna riktiga testkonton att första IPIP-50-svaret, en ändring och återöppning efter ny inloggning finns kvar. Genomför felinjicering mot verklig tjänst bara i avskild testmiljö med disponibla uppgifter.
