# FUN-04 – IPIP-50: hela användarflödet i båda rollerna

**Datum:** 2026-11-08. **Miljö:** syntetisk Chromium/Playwright, lokalt serverad app, simulerad in-memory Supabase och Auth. Inga verkliga testkonton eller databassvar ändrade.

**Bevis:** [PR #212](https://github.com/erikjarl/hemmakompassen/pull/212), commit `66c031deef15654417e7cd64c50838326dcdcc24`, [godkänd GitHub Actions Chromium-/Node-/bygg-CI #42489531933](https://github.com/erikjarl/hemmakompassen/actions/runs/42489531933). Testfunktion: `verifyFullPersonalitySurvey()` i `tests/visual.mjs`. Strukturerad utdata: `artifacts/fun-04-ipip50-complete-synthetic.json`, skärmbilder `fun-04-ipip50-complete-{parent,teen}.png` i Actions-artifact.

## Metod och observerat resultat

Två isolerade syntetiska webbläsarsessioner: förälder 390 px och tonåring 320 px.

För vardera rollen kontrollerade Chromium dessa faktiska UI-handlingar och DOM-tillstånd:

1. Öppna `#personlighet` från ett konto utan påbörjad enkät, klicka Börja testet och välj alternativ på fråga 1. Verifiera stabilt item-ID `ipip50-001` och det valda numeriska värdet i anropet till mockad lagring.
2. Klicka **Spara och avsluta för nu** vid 1/50 och kontrollera översikten. Navigera till Hem och tillbaka till Personlighet utan ny inloggning, klicka Fortsätt testet och kontrollera att fråga 2 öppnas.
3. Gå bakåt till fråga 1, verifiera det sparade alternativet, ändra från 4 till 2 och kontrollera att den ändrade posten sparas.
4. Besvara fråga 2–50 med faktiska radiokontroller. Kontrollera stabilt ID och lagrat svar för poster 2, 25, 49 och 50. När fråga 50 sparats, kontrollera att formuläret avslutas, resultatvyn `Din profil` visas och att fem faktorskalor och fem resultattabellrader finns.
5. Klicka **Exportera mina egna svar (JSON)**, öppna den faktiska webbläsarnedladdningen och kontrollera `answered_count=50`, exakt 50 item-svar och att ingen `partner`-nyckel finns.
6. Klicka **Granska eller ändra mina svar**, verifiera att fråga 1 fortfarande är markerad med det korrigerade alternativet, avsluta tillbaka till resultatet och kontrollera dokumentöverströmning på respektive viewport.

**Resultat:** 2/2 kompletta rollflöden godkända i syntetisk Chromium. Totalt 100 **unika frågepositioner** besvarade (50 per roll), dessutom två ändringar av tidigare sparat svar. Motsvarande data är **inte** lagrade i den riktiga Supabase-databasen.

## Avgränsningar

Grönt test visar korrekt simulerat UI-beteende, **inte** verklig Supabase-persistens mellan enheter, riktiga Auth-sessioner, bådas samtycke till personlighetsdelning, korrekthet/validitet hos de svenska formuleringarna eller klinisk relevans. Separata kontrakttester täcker andra delar. Behåll FUN-04 som *pågår/implementerad men ej verifierad i verklig miljö*. Nästa steg: verklig, intern tvåkontotest utan att skriva över befintliga svar, felhantering vid avbruten lagring, privat omtest till 50/50 och fysisk mobil/Safari.
