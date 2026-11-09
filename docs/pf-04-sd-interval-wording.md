# PF-04 – begripliga SD-zoner utan missvisande normaletiketter

**9 november 2026.** Detta är en avgränsad presentationsförändring i personlighetstestets vuxenjämförelse, inte en ny svensk normering eller en ny psykometrisk modell.

## Observerat problem

`referencePosition` och `approximateReferencePercentile` kunde kalla en uppskattad placering kring P≈20 för ”runt genomsnittet” eftersom hela intervallet från ungefär P≈16 till P≈84 motsvarar ±1 SD. Matematiken är inte motsägelsefull, men ordvalet kan förväxlas med att personen ligger nära percentil 50. Den synliga graftexten skiljer redan på två uppgifter: modellens rangskattning och avstånd i SD. Tabellen och underliggande text bör göra samma sak.

## Ändring

- Kategorietiketterna och beskrivningarna använder nu **inom ±1 SD**, **mellan 1 och 2 SD** eller **minst 2 SD** från *vuxenmedelvärdet*, med under/över där det behövs.
- Gränserna är konsekventa med befintlig klassificering: |z| < 1 ligger i mittzonen, 1 ≤ |z| < 2 i nästföljande zon, |z| ≥ 2 i ytterzonen. Ordningen, råpoängen, M, SD, omräkningen till uppskattad percentil och grafernas koordinater är **oförändrade**.
- Mittzonens namn blir tydligt också i det exporterade bandobjektet; bandens numeriska gränser ändras inte.

## Verifiering

`tests/ipip50-reference.test.mjs` innehåller regression för ett giltigt extraversionsresultat 24/50 som motsvarar ungefär P≈20 i vuxenmodellen. Testet kräver att texten explicit anger både lägre placering än ungefär 80 % och **inom ±1 SD**, utan ”runt genomsnittet”. Ytterligare kontroll säkerställer att 10→50 råpoäng alltid ökar modellplaceringen för samtliga fem faktorer.

**Begränsning:** inget verkligt resultat för de två testkontona har lästs eller skrivits; testerna kör syntetiskt på kända referenstal. Ingen ny extern referensdata eller validitetsbedömning har gjorts. Vuxenurvalet är amerikanskt och engelskspråkigt; svenska ungdomsnormer saknas. Den breda resten av PF-04 (kontrast, fysisk mobil, språkgranskning och mänsklig begriplighet) återstår.
