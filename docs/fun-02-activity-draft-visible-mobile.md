# FUN-02-ACTIVITY-DRAFT-VISIBLE-01 – föreslaget meddelande synligt efter klick

**Datum:** 9 november 2026 · [PR #247](https://github.com/erikjarl/hemmakompassen/pull/247) · **Omfattning:** mobilens syntetiska Chromium-gränssnitt, inte verklig autentisering eller fysisk Safari.

## Observation före ändring

Stickprovsgranskning av Playwright-artifact `hemmakompassen-ui-screenshots` från [grön PR #246-CI #42549883135](https://github.com/erikjarl/hemmakompassen/actions/runs/42549883135) visade att skärmbilderna `mobile-activity-invite-draft.png` och `mobile-activity-invite-from-deck.png` efter klicket **Föreslå tid i inkorgen** visade Inbox-rubriken och början av historiken, men inte den skapade meddelandetexten. I `visual-audit.json`: viewport 390×844; `.live-main` scrollTop **0** efter båda klickvägarna, medan innehållet var **1935 px** högt och dess synliga scrollport endast **751 px** hög.

Detta är ett användbarhetsproblem, inte bevis för förlorad data: ett tidigare Chromium-test kontrollerade redan att det oskickade utkastet fanns i `#family-chat-body`. Produktionsfunktionen fokuserade med `focus({preventScroll:true})`, vilket inte rullar det långa Inbox-innehållet till utkastet. Navigeringen till Inkorgen scrollar först till toppen.

## Ändring och regressionskontroll

I `live-app.js` fokuseras samma textarea utan `preventScroll`, så webbläsaren får rulla scrollbehållaren till inmatningsfältet. Inga ändringar i själva texten, JA+JA-verifieringen, server-API eller meddelandesändning.

I `tests/visual.mjs` läggs två webbläsarassertioner efter verkligt klick och sparat oskickat utkast: från dels **Gemensamma insikter**, dels en **färdig aktivitetstemalek**. Båda kräver att inmatningsfältets `getBoundingClientRect()` överlappar den synliga `.live-main`-porten och att `scrollTop>0`. Samma befintliga Playwright-flöde kontrollerar att inget meddelande skickas automatiskt och fångar nya skärmbilder.

## Begränsningar

Detta är en syntetisk Chromium-körning med mockad familj och server. En faktisk mobil-webbläsare, skärmtangentbord, fysisk iOS/Safari samt två inloggade konton har **inte** verifierats. Bedömningen om detta är en verklig användarobserverad brist bygger på skärmbild + DOM/scroll-data; inga externa användartester har genomförts.
