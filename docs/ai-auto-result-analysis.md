# AI-02/AI-03 – automatisk resultatreflektion: verifiering och release

## Driftsatt informationsprincip – 2 november 2026

PR #88 har mergats till main och Pages-deployment har passerat. Worker-version `bf3f49d3-30b5-45fc-aeb4-8fa2866c5067` är distribuerad till 100 % med tidigare kontobegränsningar intakta. Kod- och Playwrighttester passerade. **Autentiserad tvåkontoverifiering av faktisk delning/återkallelse återstår.**

## Ny informationsprincip – samma delade data som är synliga för användaren

AI-resultatanalysen och AI-medlaren får använda samma redan delade förståelsekort som förälder respektive tonåring ser. Läsning går **enbart** via den befintliga autentiserade `shared_understanding_cards()`-funktionen med samma JWT som användaren, inte genom extra AI-samtycke. Privata B-svar går inte till den andra användarens AI. Om tonåringen återkallar delning ska kommande AI-analyser använda den nya servervyn. AI-medlarens egen opt-out för projektkontext gäller fortfarande.

## Aktuell releaseuppdatering – 2 november 2026

- [x] PR #85 är mergad till main.
- [x] Analysmodulen är driftsatt i Cloudflare: version `b39fbdf4-2571-4295-b7d4-0dc243823ab2`, deployment `061f9d1d-2d0c-49ea-ab7b-bdfb5a2d5532`. De ursprungliga sex bindningarna är kvar, även testkonto-allowlisten.
- [x] Frontendflaggan `enableAiResultAnalyses:true` och cacheversion `20261102-ai-result-live1` mergade via PR #86 till `main`, med godkänd GitHub Pages-publicering.
- [x] Release-CI, merge och Pages-deployment godkända: PR #86, Actions #41430090229 och #41430089630. Inget verkligt JWT-baserat tvåkontotest är genomfört.
- [ ] Fullständig autentiserad tvåkontoverifiering, faktisk språkmodellskvalitet och återkallelse. B-förståelsekort fortsatt av.

Tidigare instruktioner nedan avser den tidigare fasen före merge och Worker-driftsättning.



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
- [x] Workern är driftsatt och frontendflaggan aktiverad på den interna testsidan via PR #86. Återstående tester: verkliga tvåkontosessioner, delningsåterkallelse, AI-svarens kvalitet och manuell mobilverifiering.
- [ ] Granska två roller med realistiska **fiktiva** profiler: ensam profil, likheter, stora skillnader, ett gemensamt aktivitetskort, flera matchningar, B-förståelsekort efter separat samtycke, och återkallelse medan sidan är öppen. Dokumentera begriplighet, utfall, falsk säkerhet och kostnader.
- [ ] För extern pilot: separat prövning av dataskydd, information om **automatisk** AI-bearbetning, ungdomars förståelse och eventuell möjlighet att avstå, kliniska risker samt hur en riskfylld eller oriktig AI-text kan rapporteras.

## Automatiska tester och begränsningar

Nya tester täcker endast syntetiska Supabase/Cloudflare-svar samt UI via Playwright i Chromium. De kontrollerar att modellen inte kan få klientförfalskade poäng eller privata svar, att partnerpoäng kräver server-RPC, att B inte aktiveras av browsern och att UI automatiskt byter ut redaktionella tolkningsråd när flaggan är på. De **bevisar inte** psykologisk giltighet, allmän säkerhet, språkmodellens faktiska svenska kvalitet eller en verkligt autentiserad tvåkontointegration.

Fakta och diagram från IPIP och matchningskort finns kvar utan AI. Genererade reflektioner är hypoteser och samtalsstöd, inte diagnoser eller kausala slutsatser.
