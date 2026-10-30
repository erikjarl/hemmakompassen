# Automatiserade visuella tester

GitHub Actions kör grundläggande funktions- och webbläsartester vid en push till main eller en pull request.

Kör lokalt:

    node --test tests/smoke.test.cjs tests/password-auth.test.mjs tests/family-pairing.test.cjs tests/family-rls-migration.test.cjs tests/shared-swipe-migration.test.cjs tests/live-swipe-persistence.test.mjs
    npm install --no-save playwright
    npx playwright install chromium
    node tests/visual.mjs

Playwright öppnar en lokal webbserver och testar mobil (390 px) och dator (1440 px). Skärmbilder för båda formaten sparas i artifacts/ och som GitHub Actions-artifact.

Testerna använder endast syntetiska testprofiler. Den inloggade Playwright-vyn använder en mockad Supabase-klient och kontaktar inte den riktiga databasen. Gillaswajpens webbläsartest kontrollerar dessutom att ett syntetiskt svar skickas som en upsert med stabilt kort-id. Ett separat syntetiskt par verifierar att **endast gemensamma ja** visas, även om ett felaktigt RPC-svar innehåller gemensamma nej; okända kort ignoreras och gamla matchningar döljs vid RPC-fel. Bilderna innehåller inte riktiga användaruppgifter.

`supabase/tests/shared_swipe_matches.sql` körs automatiskt som 52 pgTAP-assertioner i en tillfällig PostgreSQL 17-miljö via `.github/workflows/shared-swipe-db-tests.yml` utan Supabase-kostnad. Migrationskedjan slutar med `20261030090000_shared_swipe_all_a_only.sql`, som kräver JA+JA från ett exakt förälder–tonåringspar och servervitlistar dagens 265 A-kort i alla sju kortlekar; B, NEJ, oenighet, ensidiga svar, okända/felplacerade kort och andra familjer ska aldrig returneras. Migrationen är inte automatiskt applicerad på produktion. Migration `20261024094338_allow_self_only_swipe_upsert_key_columns.sql` reparerar full-row upsert utan att ändra self-only RLS; en kontroll uppdaterar en syntetisk rad inom en transaktion som rullas tillbaka. Den syntetiska fixturefilen `supabase/tests/fixtures/shared_swipe_contract_schema.sql` efterliknar bara tabeller och auth som denna RPC behöver; den är inte en fullständig Supabase-miljö eller en verifiering av produktionsschemat. Övriga pgTAP-tester (`family_rls_isolation.sql` och `merge_empty_singleton_family.sql`) måste fortfarande köras i en komplett testmiljö. Kör aldrig testfixture mot produktionsprojektet. Testerna använder endast syntetiska familjer för att kontrollera isolering, oenighet, ensidiga svar och säker sammanslagning av två tomma enfamiljer. De får inte köras direkt mot produktionsprojektet.

Viktigt: automatiska tester verifierar funktion och vissa layoutmått. Bilderna måste också granskas visuellt – skärmbildernas existens garanterar inte god formgivning.

Webbläsartesterna återställer scrollposition, släpper tangentbordsfokus och väntar ut tillfälliga aviseringar innan skärmbilder tas. En ofokuserad tangentbordslänk får inte ligga över innehållet. Artifact innehåller också `visual-audit.json` (commit, bildnamn, viewport och automatiska layoutkontroller). En grön körning innebär inte automatisk visuell AI-granskning; den schemalagda uppgiften ska ladda ned ZIP och verkligen granska PNG-bilderna.
