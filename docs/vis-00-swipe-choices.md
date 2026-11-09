# VIS-00-05 och FUN-02 – svarsknappar och nästa kort på mobil

**Problemets källa:** faktiska skärmbilder `mobile-general-swipe-first-card-top.png` och `mobile-theme-first-card-top.png` från [Chromium #42619342604](https://github.com/erikjarl/hemmakompassen/actions/runs/42619342604), tagna efter VIS-00-04, visar att Ja/Nej-knapparna fortfarande ligger långt under den första mobilvyn. Originalets stora kort- och sliderpadding, långa instruktionstext, stora rubrikmarginaler och minsta kortshöjd bidrar. Dessutom återrenderas hela kortleken efter sparat svar. Utan särskild fokus-/scrollhantering kan den användare som tryckt Ja/Nej nere på sidan landa på en delvis dold följdfråga.

## Genomförd ändring

- Enbart `.swipe-play-view` i mobilformat: tätare progressrad, kortmarginaler och kategori, något mindre men fortsatt läsbar kortfråga, kortare instruktion, kompakt privat viktighetspanel och mindre avstånd till Ja/Nej. Den **fulla horisontella slidern**, privata lagringsmodellen och knappstorlek minst 44px bibehålls. Korta och långa svar kan fortfarande behöva scrollas.
- Vid **bekräftat sparat Ja/Nej eller frivilligt överhoppat förståelsekort** återförs fokus till nästa kort (eller färdigläge) och denna ruta scrollas in i `.live-main`. Vid ett misslyckat/osäkert sparande, gammal inloggningssession eller återgång till privat redigeringslista ändras inte fokus på motsvarande sätt.
- Cachetagg och de versionsstyrda IPIP-importerna synkroniserade, utan ändring i själva personlighetsresultatet.

## Verifieringsmetod

Riktig Chromium med simulerad förälder/tonåring och backend: 390px och 320px mobil, bounding-box-avstånd mellan svarsknappar och fasta navigeringen, nytt fokus och synligt nästa kort efter Ja. Befintlig testsvit kontrollerar touch-swipe, privata viktighetsskattningar (både tangentbord och pekning), sparning, rollback/timeout, export och alla sex temakortlekar. Skärmbilder av kompakta svarsknappar tas i `mobile-general-swipe-compact-choices.png` och `mobile-320-theme-choices-compact.png`.

**Begränsningar:** detta är syntetiska autentiserade webbläsarsessioner, inte faktisk inloggad tvåkontodelning eller fysisk iOS/Safari/VoiceOver. Att kortets hela innehåll ryms i *alla* telefonhöjder och textstorlekar är inte ett löfte; 200% textförstoring och landskapsläge behöver separat bedömning. Ändra inte privata svar i live Supabase för denna regression.
