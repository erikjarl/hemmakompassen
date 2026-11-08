# FUN-02 – Gillaswajpens gemensamma insikter: båda roller och tillstånd

**Datum:** 8 november 2026. **Omfattning:** verkliga klick i syntetisk Chromium/Playwright med in-memory-simulering av Auth, Supabase och delnings-RPC. Ingen produktionsdata ändrad.

**Bevis:** [PR #211](https://github.com/erikjarl/hemmakompassen/pull/211), [godkänd Chromium-/Node-/bygg-CI #42489002605](https://github.com/erikjarl/hemmakompassen/actions/runs/42489002605). Testkod: `verifyInsightsTwoRolesAndStates()` i `tests/visual.mjs`, genererad rapport `artifacts/fun-02-insights-role-states-synthetic.json` (Actions-artifact).

## Metod

Varje scenario utförs i två separata syntetiska webbläsarsessioner, förälder med viewport 390 px och tonåring med viewport 320 px. För vardera rollen:

1. Öppna faktisk `#insikter`-vy med parade mock-användare. Kontrollera att 3 server-simulerade gemensamma A JA+JA på 2 kortlekar syns, medan B/NEJ/okända och fel kortleks-ID inte blandas in. B-sektionen har rätt förälder-/tonårstext och visar inte motpartsversionen.
2. Simulera återkallelse av samtliga A/B-delningar, klicka på synliga Uppdatera och kontrollera tomtillstånd utan kvarliggande delad text.
3. Returnera ett blandat RPC-svar med en giltig aktivitetsmatch, NEJ, okänt kort och B-typ i fel kanal samt en separat tillåten B-post. Klicka Uppdatera. Kontrollera exakt en aktivitetsrad och en förslagsknapp samt B-information enbart i förståelsedelen.
4. Simulera serverfel på kortleks-RPC, klicka Uppdatera. Kontrollera synligt fel och att både A/B-resultat rensas. Återställ RPC, klicka Försök igen och kontrollera aktuell, giltig aktivitet utan kvarliggande fel.

**Observerat:** 4 × 2 = **8 godkända roll-/tillståndsfall**, med funktionella Chromium-klick och DOM-assertioner. Även horisontell dokumentöverströmning kontrolleras vid 320/390 px.

## Kvarvarande verifieringsluckor

Testet demonstrerar **inte** två signerade Supabase-Auth-sessioner, verklig server-RPC, fysiskt samtycke eller återkallelse från en annan inloggad enhet, fysisk telefon/Safari, AI-genererade sammanfattningars kvalitet eller att två familjemedlemmars verkliga sparade svar stämmer överens. Det är ett UI-/mock-flödestest, inte ett positivt live-bevis på samtyckeslogik. Bekräfta sådant separat med interna testkonton utan att skriva över gamla svar.
