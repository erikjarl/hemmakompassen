# FUN-04 – kontroll av privata omtestsvar efter tappad serverkvittens

**Datum:** 8 november 2026. **Kod:** [PR #236](https://github.com/erikjarl/hemmakompassen/pull/236), mergad som `abe4074bcebcc164ba1d03488183d0591aa434b7`. **Slutlig verifierad PR-CI:** [GitHub Actions #42533644783](https://github.com/erikjarl/hemmakompassen/actions/runs/42533644783).

## Funktion och skäl

I den befintliga omtestfunktionen behandlades ett fel från `personality_attempt_answers.upsert` som ett misslyckat sparande. Detta är inte tillräckligt när nätverket tappar bekräftelsen **efter** att Supabase kan ha lagrat svaret. Det fanns ingen särskild väg för att kontrollera om ett omtestsvar faktiskt sparats utan att skicka det igen. Felet med förlorad bekräftelse var en identifierad kodlucka, **inte reproducerat på verkliga pilotkonton**.

Vid saknad/felaktig kvittens läser klienten nu samma autentiserade kontos **aktuella privata omtest** (tabellen `personality_attempt_answers`, filtrerat på `user_id` och `attempt_id`) och jämför exakt `question_id` och valt numeriskt svar. Detta ändrar varken den ursprungliga IPIP-profilen eller någon familjemedlems svar.

- Identiskt verifierat servervärde: formuläret fortsätter till nästa fråga utan ytterligare skrivning.
- Saknat eller annat värde: formuläret står kvar och berättar att svaret inte kunde bekräftas. Användaren kan göra ett nytt uttryckligt val.
- Misslyckad/ogiltig kontrolläsning: resultatet markeras **okänt**, och **Kontrollera sparat svar** hämtar om det aktuella omtestets serverdata utan att skicka ett nytt svar.
- Efter ett snabbt misslyckat/okänt skrivförsök behålls sparlåset ytterligare 650 ms för att minska risken att två händelser från ett klick orsakar oavsiktliga dubbelskrivningar. Lyckade normala sparningar fördröjs inte.

Hela versionskedjan i `index.html`, `live-app.js` och personlighetstestets importer uppdaterades till `20261108-retest-ack1` så att cachade JavaScript-moduler ersätts. Första försökets röda cacheversions-CI åtgärdades genom konsekvent märkning av samtliga moduler; testet omfattar nu även `ipip50-retest.js`.

## Testmetod och resultat

[**Grön CI #42533644783**](https://github.com/erikjarl/hemmakompassen/actions/runs/42533644783) innehåller **385/385 Node-tester**, godkänd byggkontroll och full Chromium-svit med **77 testskärmbilder**.

**Sex tillagda Node-regressionstester** täcker förlorad kvittens efter verklig lagring i ett in-memory-datalager; kastad transportexception; helt saknad kvittens; avvisad skrivning och explicit återförsök inklusive upprepat snabb-event; avvikande äldre servervärde; otillgänglig kontrolläsning och återhämtning via serverladdning; samt kontobyte utan gammal felknapp.

**Sex nya syntetiska Chromium-scenarier**: förälder 390 px och tonåring 320 px × tre skriv-/läsutfall (lagrat men kvittens förlorad, avvisad före lagring, kontrolläsning otillgänglig). Riktiga radioklick mot den renderade omtestsvyn och en **mockad** Supabase-klient kontrollerar servervärde, exakt ägar-/omtest-/fråge-ID, antal skrivningar/läsningar, aktuell frågenavigering samt synlig återkoppling. Rålogg finns som Actions-artifact `fun-04-retest-ack-browser-synthetic.json`.

Den första kompletta [körningen #42533304946](https://github.com/erikjarl/hemmakompassen/actions/runs/42533304946) var också grön innan de slutliga versionsändringarna. Versionsändringarnas mellanliggande körningar var röda på en testad versionsinkonsekvens, inte ett visat funktionsfel; slutlig PR-körning blev helt grön.

## Vad som fortfarande saknas

Varken riktiga inloggade testkonton, verkliga avbrutna Supabase-kvittenssvar, två autentiserade användarsessioner, faktisk långsiktig serverbeständighet eller fysisk iOS/Safari har verifierats här. Läsbaserad kontroll av tabellernas kolumner och autentiserade läsbehörigheter är inte ett live-sparningstest. **Ingen befintlig användardata ändrades under utvecklingen.**

FUN-04 är därför fortfarande **Pågår**. Fortsätt med verkliga signerade pilotflöden med disponibla testdata och explicit bevis för spara → navigera bort → ny session → kontrolläsning; injicera nätverksfel endast i avskild testmiljö.
