# FUN-03 – synlig kvittens när en regelavisering markeras som läst i inkorgen

**Datum:** 9 november 2026 · **PR:** [#258](https://github.com/erikjarl/hemmakompassen/pull/258).

## Reproducerat användarproblem

I inkorgen finns knappen **Markera som läst** vid notiser från Schyssta listan. Handlingen anropar `markSchysstaRead()`, som vid avsaknad av säker kvittens sätter `schysstaMessage` till en förklarande feltext och anropar `render()`. Den faktiska `inboxView()` visade dock **inte** denna status. Fältet renderades endast på den separata sidan Schyssta listan. Resultatet var att användaren kunde se en notis och klicka på knappen, men inte förstå varför den inte markerats som läst.

Vid en senare lyckad läsmarkering rensade funktionen heller inte det tidigare felmeddelandet.

## Regression och åtgärd

Ett nytt Node/VM-test i `tests/inbox-schyssta-read-feedback.test.mjs` kör exakt de faktiska produktionsfunktionerna `markSchysstaRead()` **och** `inboxView()`, för båda syntetiska rollerna. Det kontrollerar att en felande notifierings-RPC ger synlig `role="status"` nära notiserna, att ingen lyckad läsning felaktigt redovisas, samt att ett privat oskickat chattutkast bevaras. Ett tredje fall kontrollerar att lyckat manuellt försök rensar gammal feltext. Testet gav initialt **FAIL i [CI #42566755577](https://github.com/erikjarl/hemmakompassen/actions/runs/42566755577)** mot oförändrad produktionskod.

Korrigeringen är begränsad till:
- visa `schysstaMessage` under **Händelser från Schyssta listan** i själva inkorgen, med samma stilmall och statusmarkering som på rulesidan;
- rensa tidigare osäker status först efter ett **bekräftat lyckat** svar;
- synkronisera befintliga `?v=`-parametrar så att den publicerade webbläsaren faktiskt laddar den nya koden.

Ingen databas, parningslogik, meddelandesändning eller AI-tjänst har ändrats.

## Verifiering och begränsningar

Nya regressioner är Node/VM-kontroller av verklig klientlogik och genererad HTML med mockade RPC-svar. Fulla Node-, bygg- och Chromium-test, Pages-publicering samt filbyteskontroll redovisas först efter avslutade körningar.

**Inte verifierat:** faktisk inloggning med två konton, fysisk mobil/Safari, riktiga läsmarkeringar mot Supabase, skärmläsarens uppläsning av live-regionen. Ingen befintlig användardata har ändrats.
