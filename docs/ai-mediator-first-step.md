# AI-01A: första säkra tekniska grunden (1 november 2026)

## Verifierad molnstatus 2026-11-01
- [x] Cloudflare-kontot har en D1-databas `hemmakompassen-ai-limits` med EU-jurisdiktion, skapad via Cloudflare API.
- [x] `ai_daily_user_usage` har skapats i D1 och tabellens existens verifierats med SELECT från `sqlite_master`.
- [x] Utvecklingsbranchens `workers/ai-mediator/wrangler.jsonc` har nu det faktiska D1-ID:t och saknar fortfarande aktiva AI-anrop från webbplatsen.
- [ ] Faktisk Cloudflare-faktureringsplan kunde inte verifieras via anslutningen: API-anropet för abonnemang ger 403, saknar Billing Read. Ingen Worker har publicerats, och inga AI-inferenser har körts.
- [ ] GitHub Actions-resultat för Worker-testfilen återstår att verifiera. Åtta lokala tester av motsvarande serverlogik passerade.
- [ ] Serverns `SUPABASE_URL` och `SUPABASE_PUBLISHABLE_KEY` behöver konfigureras för den separata Workern inför testdriftsättning.


**Status: endast på utvecklingsbranch, inte driftsatt eller inkopplad på webbplatsen.**

## Detta är implementerat i koden
- Fristående Cloudflare Worker med en enda tillfällig chattförfrågan.
- Kräver Supabase-access-token och verifierar token via Supabase Auth vid varje anrop.
- Tar bara emot ett enskilt meddelande. Andra medlemmars chattar, swajpsvar,
  personlighetssvar och klientens egna påstådda roller skickas inte till modellen.
- Separat modellinstruktion på svenska och skydd mot falsk säkerhet.
- Serverbaserad D1-kvot: högst 10 AI-anrop per konto och UTC-dygn,
  högst 2 000 tecken in och högst 320 genererade tokens. Kvoten kontrolleras
  atomiskt och blockeras när lagringen saknas.
- CORS endast från Hemmakompassens Pages-origin; inga hemliga nycklar i frontend.
- Svar markeras som tillfälliga: chatt/minne sparas INTE i denna version.
- Node-baserade offline-tester finns i tests/ai-mediator-worker.test.mjs.

## Verifierings- och driftsättningssteg (återstår)
1. Kör offline-tester: node --test tests/ai-mediator-worker.test.mjs.
2. Kontrollera att Cloudflare-kontot använder Workers Free och att vald modell
   fortfarande omfattas av gratisnivån. Aktivera ingen betalplan.
3. Skapa separat gratis D1-databas med namnet hemmakompassen-ai-limits.
   Byt ut noll-UUID i workers/ai-mediator/wrangler.jsonc mot det faktiska ID:t.
4. Konfigurera miljövariabler SUPABASE_URL och SUPABASE_PUBLISHABLE_KEY för
   denna Worker i Cloudflare. Detta är publika Supabase-värden, men inga
   hemligheter eller service_role-nycklar får läggas i GitHub.
5. Kör SQL-migrationen från workers/ai-mediator/migrations/0001_daily_quota.sql.
6. Först efter granskning: driftsätt denna separata Worker och testa med
   enbart fiktiv svensk text och testkonton.
7. Nästa AI-01B: UI, privat historik, serverstyrd infogning av AI-svar med
   riktig ägarverifiering, avparning/radering och rollanpassat språk.
8. Därefter serververifierad, uttryckligen delad kontext. AI-genererade
   sammanfattningar i Gillaswajpen och Big Five först efter detta.

## Viktig säkerhetsgräns
Befintliga Supabase-tabeller private_ai_chats, private_ai_messages och
private_ai_memories har RLS. Användare får inte skriva meddelanden som
utger sig för att vara AI. Denna första Worker öppnar inte den behörigheten,
och lagrar ännu inga meddelanden. Senare lagring måste byggas säkert
på serversidan. Origin-kontroll ersätter INTE tokenverifieringen.

## Anrop efter framtida driftsättning
POST /api/ai/mediate med Origin https://erikjarl.github.io, giltig
Supabase Bearer-token och JSON med fältet message.
Svar innehåller reply, remainingToday och ephemeral:true.
Observera att detta ännu inte är en publikt fungerande tjänst.

## Källor
- https://developers.cloudflare.com/workers-ai/models/glm-4.7-flash/
- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://developers.cloudflare.com/d1/platform/pricing/
- https://supabase.com/docs/guides/auth/users
- https://supabase.com/docs/guides/database/postgres/row-level-security
