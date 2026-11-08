# FUN-01 / UX-03 – Horisontell mobilmeny med fingersvep

**Datum:** 8 november 2026. **Status:** ny syntetisk browserregression, CI inväntas.

## Motiv och testmetod

Den återställda åttafliksmenyn hade tidigare verifierats med `element.scrollTo()` och länk-/fokuskontroller, men inte med en verklig följd av **touchStart → touchMove → touchEnd** mot navigationslisten. Sådan programmerad scrollning bevisar inte att mobilen kan hantera en fingergest.

`verifyTouchMobileTabStrip()` i `tests/visual.mjs` använder Chrome DevTools Protocol `Input.dispatchTouchEvent` mot faktisk `#live-mobile-nav` i Playwright Chromium med `isMobile:true, hasTouch:true`. Varken programmatiskt `scrollTo` eller sättning av `scrollLeft` används i den nya testfunktionen.

Testet kör **båda användarrollerna** (förälder och tonåring), vardera med 320, 390 och 430 px viewport. För varje kombination kontrolleras:

1. En touch-svepgest åt vänster flyttar den horisontella listen minst 45 px utan att navigera oavsiktligt.
2. Upprepade verkliga touch-svep når den sista fliken *Inställningar* utan att öppna en oönskad annan vy. Hela dokumentet ska sakna horisontell overflow.
3. Ett separat faktiskt `touchscreen.tap` på sista fliken öppnar inställningarna och håller aktiva fliken inom synlig menybredd.
4. Efter återladdning kan fingersvep nå den sista fliken igen, och svep i motsatt riktning når första fliken *Hem* utan oavsiktlig navigation.

Det ger **3 spårade sammanhängande scenarier × 2 roller × 3 bredder = 18 kontroller**. CI-artifact: `fun-01-native-touch-tabstrip-synthetic.json`, sex skärmbilder, plus befintliga browser-smoketester.

## Verifieringsgränser

Detta är **syntetisk Chromium-touch-emulering** med fake Auth och fake familjedata, inte fysisk iPhone/iOS Safari eller VoiceOver. Resultatet bekräftar touchhändelsernas klientbeteende i emulerad Chromium men inte den faktiska upplevelsen med fingrar på verklig hårdvara. Ingen befintlig användardata ändras.
