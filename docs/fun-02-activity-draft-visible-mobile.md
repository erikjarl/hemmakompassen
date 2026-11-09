# FUN-02-ACTIVITY-DRAFT-VISIBLE-01 – föreslaget meddelande synligt efter klick

**Datum:** 9 november 2026 · [PR #247](https://github.com/erikjarl/hemmakompassen/pull/247) · **Omfattning:** mobilens syntetiska Chromium-gränssnitt, inte verklig autentisering eller fysisk Safari.

## Observation före ändring

Stickprovsgranskning av Playwright-artifact `hemmakompassen-ui-screenshots` från [grön PR #246-CI #42549883135](https://github.com/erikjarl/hemmakompassen/actions/runs/42549883135) visade att skärmbilderna `mobile-activity-invite-draft.png` och `mobile-activity-invite-from-deck.png` efter klicket **Föreslå tid i inkorgen** visade Inbox-rubriken och början av historiken, men inte den skapade meddelandetexten. I `visual-audit.json`: viewport 390×844; `.live-main` scrollTop **0** efter båda klickvägarna, medan innehållet var **1935 px** högt och dess synliga scrollport endast **751 px** hög.

Detta är ett användbarhetsproblem, inte bevis för förlorad data: ett tidigare Chromium-test kontrollerade redan att det oskickade utkastet fanns i `#family-chat-body`. Produktionsfunktionen fokuserade med `focus({preventScroll:true})`, vilket inte rullar det långa Inbox-innehållet till utkastet. Navigeringen till Inkorgen scrollar först till toppen.

## Ändring och regressionskontroll

**Röd UI-CI #42550943961:** en första minimal ändring till vanlig `focus()` misslyckades på det nya Chromium-kravet (`page.waitForFunction`, timeout), trots gröna Node-tester: hashändringshanteraren renderar Inbox och återställer `.live-main` till toppen. Därför gör den slutliga rättningen ett **engångsmarkerat hopp i hashchange-hanteraren efter `render();scrollLiveMainTop()`**. Den fokuserar samma textarea utan att aktivera dubbel-scroll och använder `scrollIntoView({block:'center'})` först när den nya Inbox-vyn har renderats. Markeraren är knuten till samma kontos ID och `sharedSession`, och rensas vid nästa hashändring. Inga ändringar i själva texten, JA+JA-verifieringen, server-API eller meddelandesändning.

I `tests/visual.mjs` läggs två webbläsarassertioner efter verkligt klick och sparat oskickat utkast: från dels **Gemensamma insikter**, dels en **färdig aktivitetstemalek**. Båda kräver att inmatningsfältets `getBoundingClientRect()` överlappar den synliga `.live-main`-porten och att `scrollTop>0`. Samma befintliga Playwright-flöde kontrollerar att inget meddelande skickas automatiskt och fångar nya skärmbilder.

## Verifiering efter rättningen

- [Grön UI/Chromium-CI #42551222690](https://github.com/erikjarl/hemmakompassen/actions/runs/42551222690) på produktionsrättningen; [grön slutlig PR-CI #42551264121](https://github.com/erikjarl/hemmakompassen/actions/runs/42551264121) efter dokumentationsändringen.
- De två faktiska syntetiska klickvägarna (Gemensamma insikter respektive färdig aktivitetskortlek) uppfyller nu kravet att textfältet överlappar synlig `.live-main`-viewport efter navigation, med positiv scrollposition.
- De nya skärmbilderna `mobile-activity-invite-draft.png` och `mobile-activity-invite-from-deck.png` i CI-artifact har granskats. De visar både redigerbart textfält och **Skicka meddelande** utan att ytterligare manuell scroll behövs; det tidigare toppvyläget är åtgärdat i denna emulerade mobilmiljö.
- [PR #247](https://github.com/erikjarl/hemmakompassen/pull/247) mergad som [`f0b1f889`](https://github.com/erikjarl/hemmakompassen/commit/f0b1f88992b2400cece1fd5f9c2871f71a76a740). [Pages-deploy #42551717757](https://github.com/erikjarl/hemmakompassen/actions/runs/42551717757) och [filbyteskontroll #42551718317](https://github.com/erikjarl/hemmakompassen/actions/runs/42551718317) godkända. Ny `main`-Chromium-CI är separat och kan ge ytterligare regressionssignal.

## Begränsningar

Detta är en syntetisk Chromium-körning med mockad familj och server. En faktisk mobil-webbläsare, skärmtangentbord, fysisk iOS/Safari samt två inloggade konton har **inte** verifierats. Bedömningen om detta är en verklig användarobserverad brist bygger på skärmbild + DOM/scroll-data; inga externa användartester har genomförts.
