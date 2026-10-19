# Automatiserade visuella tester

GitHub Actions kör grundläggande funktions- och webbläsartester vid en push till main eller en pull request.

Kör lokalt:

    node --test tests/smoke.test.cjs
    npm install --no-save playwright
    npx playwright install chromium
    node tests/visual.mjs

Playwright öppnar en lokal webbserver och testar mobil (390 px) och dator (1440 px). Skärmbilder för båda formaten sparas i artifacts/ och som GitHub Actions-artifact.

Testerna använder endast påhittade testprofiler. Bilderna innehåller inte riktiga användaruppgifter.

Viktigt: automatiska tester verifierar funktion och vissa layoutmått. Bilderna måste också granskas visuellt – skärmbildernas existens garanterar inte god formgivning.

Webbläsartesterna återställer scrollposition, släpper tangentbordsfokus och väntar ut tillfälliga aviseringar innan skärmbilder tas. En ofokuserad tangentbordslänk får inte ligga över innehållet. Artifact innehåller också `visual-audit.json` (commit, bildnamn, viewport och automatiska layoutkontroller). En grön körning innebär inte automatisk visuell AI-granskning; den schemalagda uppgiften ska ladda ned ZIP och verkligen granska PNG-bilderna.
