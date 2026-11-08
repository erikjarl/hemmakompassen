# FUN-05 – Kontroll av klickbara övningslänkar i AI-förslag

**Datum:** 8 november 2026  
**Område:** AI-genererade reflektionsförslag för personlighetstest och Gillaswajp.  
**PR:** [#226](https://github.com/erikjarl/hemmakompassen/pull/226) (mergad, commit `5d6f136`).

## Konkret funktionsbrist

Serverns `enforceActionableAnalysis()` godtog ett giltigt *prefix* av en länk, exempelvis `#kommunikation/kontakt2`, `#kommunikation/kontakt_more` och `#kommunikation/kontakt-extra`. Klientens `renderAiAnalysisReply()` gör däremot inte sådana ogiltiga adresser klickbara. Ett AI-förslag kunde därför passera serverkontrollen, men presenteras utan fungerande övningslänk.

## Ändring

Den serverstyrda kontrollen kräver nu en fullständig, allowlistad `#kommunikation/...`-adress **i slutet av varje föreslagen handling**. Andra hash-adresser, extra suffix, frågetecken eller externa URL:er gör att det gamla deterministiska reservinnehållet visas. Befintliga godkända förslag bevaras. Inga nya datakällor, behörigheter eller lagringar införs.

## Verifieringsnivå A – kod, Node och Chromium

- `tests/ai-result-analysis.test.mjs` utökades med två kontrakttester: nio ogiltiga suffix-/extra-adressvarianter × båda AI-resultattyperna, samt ett positivt fall där två korrekta länkar bevaras.
- [AI-worker-körning #42507962054](https://github.com/erikjarl/hemmakompassen/actions/runs/42507962054): **success**.
- [UI/Chromium-körning #42507962015](https://github.com/erikjarl/hemmakompassen/actions/runs/42507962015): **success**, inklusive Node-kontrakt, byggsteg och browser-screenshots. Cloudflare Workers Builds för statiska `hemmakompassen` passerade också PR-kontrollen.
- Efter gröna kontroller mergades PR #226 till `main`.

## Verifieringsnivå B – faktisk Worker-publicering

Före publicering jämfördes samtliga fem driftsatta AI-worker-moduler (`analysis.mjs`, `catalog.mjs`, `context.mjs`, `history.mjs`, `index.mjs`) mot GitHub-baslinjen; de överensstämde. Den nya versionen publicerades den **8 november 2026 kl. 18:09 UTC** via Cloudflare API med strikt arv av samtliga sex befintliga bindningar.

- Cloudflare Worker: `hemmakompassen-ai-medlare`.
- Deployment-id: `9755056a-a83f-489f-81dc-29eef3e2b75f`.
- Version: `81153e04-aa57-470a-8880-2d7395259738`, **100 % trafik enligt Cloudflares deployment-API**.
- Förnyad kontroll av driftsatt script via Cloudflare API bekräftar `ROUTE_END_RE` och att tidigare `ROUTE_RE` saknas; bindningarna AI, AI_TEST_USERS, APP_ORIGIN, LIMITS, SUPABASE_PUBLISHABLE_KEY och SUPABASE_URL är fortsatt registrerade med rätt bindningstyper.

**Begränsning:** Det finns *ingen* verifierad livegenerering med ett riktigt inloggat förälder-/tonårskonto efter deployment. Cloudflares API-verifiering bevisar publicerad kod och registrerade bindningar, men inte AI-modellens svarskvalitet, faktisk JWT-/Supabase-integration eller klickbarhet på fysisk iPhone. Inga sparade familjesvar har ändrats i dessa tester.

## Återstående funktionsprov

Med två uttryckligen auktoriserade testkonton: skapa en faktisk AI-reflektion för personlighet och Gillaswajp; kontrollera att båda har två eller tre konkreta förslag utan frågor, att samtliga länkar öppnar rätt övning och att tom-/fel-/omförsökslägen förblir begripliga. Registrera utfall och miljö i FUN-00-matrisen.
