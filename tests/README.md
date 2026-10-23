# Automatiserade visuella tester

GitHub Actions kör grundläggande funktions- och webbläsartester vid en push till main eller en pull request.

Kör lokalt:

    node --test tests/smoke.test.cjs tests/password-auth.test.mjs tests/family-pairing.test.cjs tests/family-rls-migration.test.cjs tests/shared-swipe-migration.test.cjs
    npm install --no-save playwright
    npx playwright install chromium
    node tests/visual.mjs

Playwright öppnar en lokal webbserver och testar mobil (390 px) och dator (1440 px). Skärmbilder för båda formaten sparas i artifacts/ och som GitHub Actions-artifact.

Testerna använder endast syntetiska testprofiler. Den inloggade Playwright-vyn använder en mockad Supabase-klient och kontaktar inte den riktiga databasen. Bilderna innehåller inte riktiga användaruppgifter.

`supabase/tests/family_rls_isolation.sql`, `supabase/tests/shared_swipe_matches.sql` och `supabase/tests/merge_empty_singleton_family.sql` är pgTAP-integrationstester som ska köras först på en disponibel lokal databas eller Supabase-branch efter att migrationerna har applicerats. Testerna använder endast syntetiska familjer för att kontrollera isolering, oenighet, ensidiga svar och säker sammanslagning av två tomma enfamiljer. De får inte köras direkt mot produktionsprojektet.

Viktigt: automatiska tester verifierar funktion och vissa layoutmått. Bilderna måste också granskas visuellt – skärmbildernas existens garanterar inte god formgivning.

Webbläsartesterna återställer scrollposition, släpper tangentbordsfokus och väntar ut tillfälliga aviseringar innan skärmbilder tas. En ofokuserad tangentbordslänk får inte ligga över innehållet. Artifact innehåller också `visual-audit.json` (commit, bildnamn, viewport och automatiska layoutkontroller). En grön körning innebär inte automatisk visuell AI-granskning; den schemalagda uppgiften ska ladda ned ZIP och verkligen granska PNG-bilderna.
