# AI-02/AI-03 – automatisk resultatreflektion: verifiering och release

**Status:** Koden finns i PR #85. Den är ännu inte mergad eller driftsatt. Feature flag `enableAiResultAnalyses` är **false** tills Worker och behörighetskontroller verkligen fungerar. Endast de två interna testkontona och syntetiska uppgifter får användas under utveckling.

## Hur funktionen fungerar

1. **Personlighetstest:** Efter att det sista IPIP-50-svaret sparats färdigställs de fem skalorna. Resultatvyn ber automatiskt om en AI-reflektion. Workern räknar poängen från de 50 egna RLS-skyddade svaren och läser partnerprofilen endast genom `my_ipip50_shared_profiles`. Utan två aktiva samtycken används enbart egen profil. Inga frågesvar skickas som prompt.
2. **Gillaswajpen:** När serververifierade gemensamma A JA+JA visas i en kortlek startar en reflektion om möjligheter, förhållningssätt och samtalsfrågor. Samlad insiktsvy kan använda samtliga kortlekar när den säkra insiktsvyn är aktiverad. Privata NEJ eller ensidiga A-JA skickas aldrig.
3. **Förståelsekort (B):** Hanteras endast av `shared_understanding_cards` och endast om både det riktiga, autentiserade B-samtyckeflödet är aktiverat och Workerns separata serverflagga `ENABLE_SHARED_UNDERSTANDING_AI` är satt till `true`. Allt annat är avstängt. Föräldern får då reflektioner om hur tonåringens uttryckliga budskap kan bemötas utan att anta motiv eller lägga ansvar på barnet.
4. Servern läser aktuell användaridentitet och familjeroll, hämtar enbart denna typ av tillåtet resultat, verifierar datan, använder samma kvot som AI-chatten och ber Workers AI skriva en reflektion. Svaret visas på samma resultatsida. **Ingen genererad reflektion lagras i D1.** Om kvoten är slut eller modellen misslyckas visas ett tydligt fel och användaren kan försöka på nytt.
5. UI kan deduplicera samma resultat inom en öppen inloggad session. Vid nytt resultat/samtycke/byte av konto blir föregående text inte automatiskt gällande för den nya sammanställningen. **Det är inte en kontinuerlig, garanterad återkallelsebevakning över samtliga öppna webbläsare.**

## Exakt releaseordning

- [x] Serverkod och klientkod med automatiska säkerhets-/Playwrighttester i PR #85. Se Actions #41424425020 och #41424425062.
- [x] PR #84 är mergad till `main`; dess opt-out-kod, regressionsfall och AI-02/03 från PR #85 har integrerats i merge-commit `acb1f48d79a95e68597e832ef115cd4b2fd606fd` utan force-push. GitHub visar PR #85 som mergebar. Testa hela kombinationen och säkerställ att opt-out fortfarande blockerar siduppgiftsläsning.
- [ ] **Cloudflare Worker:** publicera ny version av `workers/ai-mediator/src/index.mjs`, `analysis.mjs`, `context.mjs`, `catalog.mjs` och historikmoduler med rätt modulimporter och bevarade AI-/D1-/Supabase-bindningar. Säkerställ att den **server-only testkonto-allowlisten** verkligen finns efter deployment. `wrangler.jsonc` innehåller en medvetet tom `AI_TEST_USERS`-platshållare: kör inte en blind deploy som råkar ersätta den riktiga testkonto-allowlisten med en tom sträng.
- [ ] Verifiera autentiserat API-anrop till `POST /api/ai/analyze` med `{"kind":"personality","scope":"own"}` från ett testkonto och motsvarande Gillaswajp-anrop med `{"kind":"swipe","scope":"general"}`. Klienten ska inte skicka några profiler, familje-ID eller kortsvar. Testa ogiltig JWT, tredje användare, falska poängfält, ofullständigt test och tomma matchningar.
- [ ] Verifiera att kvoten på tio AI-anrop per konto och UTC-dag delas med AI-medlarens chatt utan extra kostnad eller automatisk betald trafik.
- [ ] När Worker är live och båda kontonas isolering och samtyckesåterkallelse testats: sätt `enableAiResultAnalyses:true` i `backend-config.js`, uppdatera cacheversion och merga till intern testsida enligt godkänd rutin. Kontrollera faktisk Pages-distribution och mobilvyer.
- [ ] Granska två roller med realistiska **fiktiva** profiler: ensam profil, likheter, stora skillnader, ett gemensamt aktivitetskort, flera matchningar, B-förståelsekort efter separat samtycke, och återkallelse medan sidan är öppen. Dokumentera begriplighet, utfall, falsk säkerhet och kostnader.
- [ ] För extern pilot: separat prövning av dataskydd, information om **automatisk** AI-bearbetning, ungdomars förståelse och eventuell möjlighet att avstå, kliniska risker samt hur en riskfylld eller oriktig AI-text kan rapporteras.

## Automatiska tester och begränsningar

Nya tester täcker endast syntetiska Supabase/Cloudflare-svar samt UI via Playwright i Chromium. De kontrollerar att modellen inte kan få klientförfalskade poäng eller privata svar, att partnerpoäng kräver server-RPC, att B inte aktiveras av browsern och att UI automatiskt byter ut redaktionella tolkningsråd när flaggan är på. De **bevisar inte** psykologisk giltighet, allmän säkerhet, språkmodellens faktiska svenska kvalitet eller en verkligt autentiserad tvåkontointegration.

Fakta och diagram från IPIP och matchningskort finns kvar utan AI. Genererade reflektioner är hypoteser och samtalsstöd, inte diagnoser eller kausala slutsatser.
