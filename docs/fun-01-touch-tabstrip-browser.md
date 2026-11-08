# FUN-01 / UX-03 – Horisontell mobilmeny med fingersvep

**Datum:** 8 november 2026. **Verifierat:** [PR #223](https://github.com/erikjarl/hemmakompassen/pull/223) mergad (`3358956`), [grön Node/bygg/Chromium-CI #42503079341](https://github.com/erikjarl/hemmakompassen/actions/runs/42503079341), **18/18 syntetiska roll-/viewportkontroller godkända**. Den fullständiga testsviten sparade **75 skärmbilder**.

## Motiv och testmetod

Den återställda åttafliksmenyn hade tidigare verifierats med `element.scrollTo()` och länk-/fokuskontroller, men inte med en verklig följd av **touchStart → touchMove → touchEnd** mot navigationslisten. Sådan programmerad scrollning bevisar inte att mobilen kan hantera en fingergest.

`verifyTouchMobileTabStrip()` i `tests/visual.mjs` använder Chrome DevTools Protocol `Input.dispatchTouchEvent` mot faktisk `#live-mobile-nav` i Playwright Chromium med `isMobile:true, hasTouch:true`. Varken programmatiskt `scrollTo` eller sättning av `scrollLeft` används i den nya testfunktionen.

Testet kör **båda användarrollerna** (förälder och tonåring), vardera med 320, 390 och 430 px viewport. För varje kombination kontrolleras:

1. En touch-svepgest åt vänster flyttar den horisontella listen minst 45 px utan att navigera oavsiktligt.
2. Upprepade verkliga touch-svep når den sista fliken *Inställningar* utan att öppna en oönskad annan vy. Hela dokumentet ska sakna horisontell overflow.
3. Ett separat faktiskt `touchscreen.tap` på sista fliken öppnar inställningarna och håller aktiva fliken inom synlig menybredd.
4. Från Inställningar sveper man åt motsatt håll tills *Hem* är synlig, trycker på Hem och laddar därefter om. Sidan ska fortfarande visa Hem som aktiv och synlig flik.

Det ger **3 spårade sammanhängande scenarier × 2 roller × 3 bredder = 18 kontroller**. CI-artifact: `fun-01-native-touch-tabstrip-synthetic.json`, sex skärmbilder, plus befintliga browser-smoketester.

## Verifieringsgränser

Detta är **syntetisk Chromium-touch-emulering** med fake Auth och fake familjedata, inte fysisk iPhone/iOS Safari eller VoiceOver. Resultatet bekräftar touchhändelsernas klientbeteende i emulerad Chromium men inte den faktiska upplevelsen med fingrar på verklig hårdvara. Ingen befintlig användardata ändras.

## Uppföljning efter röd CI på `main` (8 november 2026)

[PR #223:s gröna testkörning #42503079341](https://github.com/erikjarl/hemmakompassen/actions/runs/42503079341) klarade 18/18, men [efterföljande UI-körning på `main` #42503561352](https://github.com/erikjarl/hemmakompassen/actions/runs/42503561352) **misslyckades** vid kontrollen `Right end is reachable again after route reload`. De två körningarna använder samma testkod; grön PR-CI ska därför inte beskrivas som stabil grön `main`.

**Rotorsak misstänkt, inte bevisad:** testet gjorde en full omladdning till Hem från Inställningar och krävde sedan att en ny serie touchgester åter skulle ta listen till Inställningar *innan* återvägen testades. Den sekvensen blandade reload/layout/snap med omvänd gest och gav en intermittent assertion. Den reviderade testdesignen sveper tillbaka direkt från den bevisat synliga Inställningar-fliken, trycker på Hem och testar omladdning med Hem aktivt **separat**. På så sätt mäter testet två verkliga användarflöden i rätt ordning utan att återinitiera orelaterad touchscroll före tillbakagesten. Utredningen har **inte** bevisat ett produktionsfel i menyn.

Status för omkörning noteras i detta dokument när CI avslutats. Ingen förändring i produktions-JavaScript eller CSS ingår i testkorrigeringen.
