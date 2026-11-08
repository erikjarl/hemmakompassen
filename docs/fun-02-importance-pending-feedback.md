# FUN-02-IMPORTANCE-01 – svarsknappar vid pågående viktighetssparning

**Datum:** 8 november 2026. **PR:** [#230](https://github.com/erikjarl/hemmakompassen/pull/230), merge-commit `6dbf53b2c4ab87868a8c33552dfb88a1aff3f5e2`. **Verifierad PR-CI:** [#42514663289](https://github.com/erikjarl/hemmakompassen/actions/runs/42514663289) (Node, statiskt bygge, syntetisk Chromium).

## Reproducerat användarproblem

När privat viktighetsskattning sparas i Gillaswajpen spärras Ja-/Nej-svep tills begäran är klar. Tidigare avbröt `advanceSwipe` och `advanceThemeSwipe` handlingen utan ett meddelande till användaren. En snabb tryckning såg därmed ut att ignoreras, vilket var särskilt vilseledande vid fördröjd anslutning.

## Åtgärd

- En spärrad Ja-/Nej-handling skriver **Vänta tills viktighetsskattningen har sparats ...** i den befintliga `role=status`-texten under kortet. Den blockerade handlingen skapar inte ett sparat kortsvar och försöker inte automatiskt igen.
- När sista utestående viktighetsskrivningen slutförs och samma konto/session fortfarande är aktiv, ersätts väntestatus med **Viktigheten är sparad. Nu kan du välja Ja eller Nej.** Vid skrivfel visas ett begripligt meddelande som beskriver nytt försök.
- Ändringen påverkar inte vilken viktighetsnivå eller vilket Ja/Nej som lagras; befintliga data, Supabase-migrationer och delningsfunktioner lämnas oförändrade.

## Testmetod och resultat

- `tests/visual.mjs` utökar den syntetiska databasanpassningen med en **avsiktligt fördröjd** `swipe_importance.upsert`. Testet skapar ett nytt föräldrafönster (390 px) och ett tonårsfönster (320 px), öppnar dels allmänna kortleken, dels temakortleken Förändring, ändrar reglaget med faktiska `input`/`change`-event och försöker svara medan lagringen är pausad.
- Assert: kortet står kvar; Ja-svar är inte sparat under väntan; ett förklarande meddelande finns. När fixture släpper skrivningen får användaren klartext och kan själv välja Ja. Testet verifierar sedan faktisk sparad kortidentitet och förflyttning till följande kort.
- Tonåringens allmänna kort kan vara ett **B-/förståelsekort**, som sparas med `set_understanding_card_state` i stället för den vanliga `swipe_answers.upsert`. Första röda CI [#42514408150](https://github.com/erikjarl/hemmakompassen/actions/runs/42514408150) berodde på testets felaktiga antagande att bara den vanliga skrivvägen används. Kontroll av båda faktiska klientvägar infördes och hela [CI #42514663289](https://github.com/erikjarl/hemmakompassen/actions/runs/42514663289) passerade.
- `tests/swipe-importance.test.mjs` kontrollerar att väntan har ett explicit användarmeddelande och att utfallet inte förblir markerat som pågående efter att den sista skrivningen slutförts.

**Begränsningar:** mockad Auth och lagring i Chromium. Ingen faktisk användardata, Supabase-skrivning, fysisk Safari/iOS, uppläsning med VoiceOver eller verklig tvåkontosynk testad. Testet verifierar att meddelandet finns i en `role=status`-region, inte att varje skärmläsare faktiskt läser upp det.
