# AI-01A/B — säker testproxy och första privata chattvy (1 november 2026)

## Verifierat nuläge

**Cloudflare-servern är uppladdad och dess workers.dev-subdomän är aktiverad.**
Hemmakompassens ordinarie GitHub Pages (`main`) är **inte uppdaterad**.
Det första chattgränssnittet och dess påslag finns bara på utvecklingsbranchen
`ai-dev/utveckling` och i [utkast-PR #80](https://github.com/erikjarl/hemmakompassen/pull/80).
Det har ännu inte gjorts ett autentiserat end-to-end-test från den publicerade
webbplatsen eller två riktiga webbläsarsessioner. CI-status för GitHub Actions
är ännu inte verifierad.

### Genomfört
- [x] Användaren har verifierat Cloudflare **Workers Free $0/månad** i dashboard.
- [x] En separat Worker `hemmakompassen-ai-medlare` med Workers AI och
  autentiserad Supabase Auth-token-kontroll har driftsatts med Cloudflare API.
- [x] Worker-bindningarna **AI**, **LIMITS** (D1), **APP_ORIGIN**,
  **SUPABASE_URL** och **SUPABASE_PUBLISHABLE_KEY** finns verifierat
  registrerade på Cloudflare. Inga service_role-nycklar i frontend eller GitHub.
- [x] Den separata D1-databasen `hemmakompassen-ai-limits` skapades
  med EU-jurisdiktion. SQL-tabellen installerades och verifierades.
- [x] En verklig D1-kvottest med 12 försök gav 10 lyckade och 2 blockerade
  enligt den atomiska kvotregeln. Testposten raderades.
- [x] AI-modeller testades med fiktiv svensk text. GLM-4.7-Flash
  gav resonemang men ingen visbar svarstext inom kort genereringsgräns.
  Llama 3.1 8B (`@cf/meta/llama-3.1-8b-instruct-fp8-fast`)
  gav en visbar svensk samtalsöppning på gratisplanen.
- [x] Workern använder nu Llama-modellen, parametern `max_tokens`, strikt
  CORS, verifierad användartoken via Supabase Auth och `no-store` för svar.
  Den accepterar endast det aktuella användarmeddelandet.
- [x] Hämtad, exakt GitHub-källkod för Worker testades i en isolerad V8-miljö
  med simulerade Fetch/Request/Response/D1/AI-komponenter. Kontrollerna
  omfattade fel ursprung (403), fel token (401), ogiltigt/tomt/långt
  meddelande (400), godkänt svar (200), falsk roll och historik från
  klienten som ignoreras, samt kvotstopp (429) efter 10.
- [x] Separat `ai-mediator-ui.js` finns på utvecklingsbranchen:
  användaren kan skriva, skicka, se och rensa en **ephemeral** testchatt.
  Kontobyte/radering aborterar gamla anrop och rensar minnet; inga
  meddelanden sparas i LocalStorage/Supabase. Modulen är kopplad till
  `live-app.js` och ingår i den statiska byggfilens asset-lista.
- [x] Hämtad exakt UI-modulkod testades i isolerad V8-miljö mot
  simulerade Supabase-sessioner och AI-svar: felaktig användare avvisas,
  endast användartext skickas, HTML-escape görs, kontobyte ignorerar
  väntande svar, rensning fungerar, okänd Worker-URL stängs av.
- [x] Node-testfiler samt en separat GitHub Actions-workflow har lagts till.
  **Det är inte samma sak som ett godkänt GitHub Actions-resultat.**

### Återstår inför ett färdigt första användartest
- [ ] Kontrollera GitHub Actions/Node/bygget och verklig CORS+Auth från
  separat testklient. Cloudflare-anslutningens fetch-egress blockerade
  direktanrop till den egna workers.dev-domänen; dessa 403-respons var
  från verktygets nätverksbegränsning och bevisar **inte** Workers
  autentiseringsskydd.
- [ ] Testa med båda befintliga autentiserade testkontona mot faktisk
  Worker, inklusive kvot, utloggning, kontobyte, återkoppling och mobilvy.
- [ ] Implementera riktiga privata chattsessioner och serverstyrd
  persistens av AI-svar. Nuvarande chatt är avsiktligt **stateless**;
  modellen ser inte tidigare meddelanden i samma session.
- [ ] Låt AI-medlaren få serververifierad, samtyckesstyrd delad
  Gillaswajp-/Big Five-/Schyssta-listan-kontext, först efter
  behörighetsgranskning och fungerande återkallelse.
- [ ] Testa kvalitet och riskhantering med större uppsättning fiktiva
  svenska fall innan användning med verkligt känsligt material.
- [ ] Synkronisera utvecklingsbranchen med nyare `main`-commits
  och få uttryckligt godkännande innan merge/publicering.
- [ ] AI-genererade frivilliga sammanfattningar i Gillaswajpen och
  personlighetstestet byggs efter att AI-01 är behörighetstestat.

## Fiktiv kvalitetsgranskning och skydd för tydliga riskfraser

Fyra frivilliga och fiktiva svenska förälder–tonåring-scenarier prövades direkt mot Llama 3.1 8B: mobilkonflikt, vuxen som höjer rösten, hot om våld från förälder och tonåring med självmordstankar. Modellen gav rimliga små samtalsförslag för vardagsexemplen men **olämpliga eller otillräckliga svar i risksituationerna**: bland annat föreslog den direkt samtal med den hotande föräldern. Suicidexemplet gav ett generellt svar och klipptes mitt i texten.

**Riskbegränsning införd:** `safetyResponse(message)` på Workersidan känner igen vissa tydliga svenska fraser om suicid/självskada och våld/hot. Då skickas meddelandet **inte** till AI-modellen. I stället returneras särskilt förskriven text om mänsklig hjälp och säkerhet. UI markerar detta **Säkerhetsinformation**, inte AI-svar. Hänvisningar: 112 vid akut fara, 1177 för vårdvägledning, och Bris 116 111/bris.se dygnet runt för personer under 18 år. Dessa uppgifter kontrollerades mot Bris och 1177 2026-11-01.

**Begränsning:** Enkel regelmatchning kan missa farliga situationer, tolka ett citat fel eller ge generiska hänvisningar. Det är inte en tillförlitlig suicid-/våldsbedömning och ersätter inte kliniska rutiner. **Fortsatt förbättring och granskning före verklig användning är obligatorisk.** Ej underlag för att aktivera AI-stöd till externa ungdomar.

Källor:
- https://www.bris.se/om-bris/press-och-opinion/hanvisa-till-bris/hanvisa-till-bris/
- https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/sjalvmordstankar/till-dig-som-har-sjalvmordstankar/

## Säkerhetskontrakt

Denna testversion tar **ett** frivilligt meddelande åt gången och
sparar inga chattar. Den är inte terapi eller krishjälp. Endast
kontots aktuella Supabase-token och meddelandet skickas; ingen familjeflagga,
rollen som klienten uppger, privat chatt, inkorgshistorik, enskilda IPIP-svar
eller Gillaswajp-NEJ skickas till modellen.

Kostnadsgräns: max **10 förfrågningar per användare och UTC-dag**, med D1
som atomisk spärr, max **2 000 tecken** i frågan och max **320 output-tokens**.
Utan fungerande D1/AI/korrekt autentisering stoppas inferensen. Ovanför
Cloudflares gratisgräns skall ingen betalplan aktiveras automatiskt.

**Server-endpoint (API, inte en sida att besöka):**
`https://hemmakompassen-ai-medlare.erikbertiljarl.workers.dev/api/ai/mediate`

## Källor
- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://developers.cloudflare.com/workers-ai/models/llama-3.1-8b-instruct-fp8-fast/
- https://developers.cloudflare.com/d1/platform/pricing/
- https://supabase.com/docs/guides/auth/users
- https://supabase.com/docs/guides/database/postgres/row-level-security
