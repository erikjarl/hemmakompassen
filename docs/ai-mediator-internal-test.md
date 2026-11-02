# AI-medlaren – intern testversion (uppdaterad 2 november 2026)

**Status:** Privat AI-chatt och behörig kontext är implementerade och mergade till `main` genom PR #81–82. Cloudflare Worker uppdaterades efter PR #82. **Opt-out-kontrollen ligger i utvecklings-PR #84 och är ännu inte mergad eller driftsatt.** Tills verkliga end-to-end-tester, ungdomsskydd och dataskyddsgranskning är färdiga får bara fiktiva testsamtal användas. En publik Pages-adress gör inte projektet redo för externa användare.

## Arkitektur och behörighet

- GitHub Pages frontend → Cloudflare Worker/Workers AI → serververifierad Supabase JWT via `/auth/v1/user`. Origin låses till `https://erikjarl.github.io`; **origin ersätter aldrig autentisering**.
- Endast de två särskilda interna testkontona får åtkomst via serverbindningen `AI_TEST_USERS` (fail closed utan bindning). Inga service_role-nycklar i Worker eller frontend.
- Cloudflare D1 i EU-omfång lagrar privata chattar och meddelanden; varje SQL-fråga begränsas till inloggad ägare. Det är separerat från familjens gemensamma data.
- Vid aktiverad projektkontext hämtar servern med samma användares JWT **nya behörighetskontrollerade uppgifter inför varje AI-svar**: egna kortsvar och viktighetsskattningar; endast serververifierade gemensamma A JA+JA; egna fem IPIP-50-poäng; endast ömsesidigt samtyckta partnerpoäng; godkända och tydligt märkta föreslagna Schyssta-regler; samt högst fyra korta, åtkomliga inkorgsutdrag. Motpartens enskilda IPIP-svar, privata AI-chattar och ej aktiverad B-delning får inte hämtas.
- Modellen får rollanpassade instruktioner vid aktiverad kontext. Källöversikten anger **datakategorier**, inte råa svar. Skickad kontext begränsas till 9 300 tecken. Historiska AI-svar återanvänds inte som promptkontext eftersom de kan innehålla tidigare delad och sedermera återkallad information.

## Ny integritetskontroll i PR #84 (ej publicerad)

- [x] **Kod:** användaren ser en kryssruta `Använd mina uppgifter från övriga delar av Hemmakompassen när AI:n svarar`.
- [x] **Kod:** gränssnittet skickar ett uttryckligt booleskt `useProjectContext` vid varje meddelande. Med `false` anropas **inga** projektkällor eller roll-RPC. Identitetskontroll och vanliga chatt-/kvotfunktioner fortsätter att fungera.
- [x] **Kod:** när valet är av visas ingen gammal källöversikt, sena svar ignoreras, och valet låses under ett pågående AI-svar. Vid kontobyte återställs det till på. Ingen ny serverlagrad preferens eller ny migration har införts.
- [x] **Automatiska regressionstester skapade** för backend och UI: explicit av, felaktig typ, standard på, läcka av gammal översikt, byte av konto och byte under pågående svar. Dessutom Playwright-mobiltest med simulerad Worker, en ny skärmbild och test av återkallat Big Five-samtycke.
- [ ] **Återstår:** PR #83 är redan mergad; PR #84 behöver granskas och mergas mot `main`. Ny Worker-kod måste driftsättas för att servern i den verkliga testmiljön ska respektera flaggan. Kör därefter manuell verifiering med båda kontona.

### HTTP API

- `GET /api/ai/chats`: lista över egna chattar (max 12).
- `POST /api/ai/chats`: skapa eget samtal.
- `GET /api/ai/chats/{uuid}`: läs egna meddelanden.
- `DELETE /api/ai/chats/{uuid}`: radera eget samtal och meddelanden.
- `GET /api/ai/context`: tillgängliga **källkategorier** från egen tillåten kontext; inga råuppgifter.
- `POST /api/ai/mediate`: exempel: `{"message":"Hej","chatId":"uuid","useProjectContext":false}`. Om fältet saknas används tidigare standard **på**. Endast `true` och `false` accepteras; strängar och `null` ska avvisas. Äldre stateless anrop utan `chatId` stöds fortfarande.
- För ett sparat samtal används högst sex tidigare **egna** meddelanden (max 900 tecken var) i prompten. Tidigare AI-svar spelas inte tillbaka till modellen.

## Kostnadsgränser och risker

- Kvot: tio AI-anrop per konto och UTC-dag, säkrat i D1. Förfrågningar stoppas vid slut på kvot eller kvotfel, inte genom automatisk uppgradering till betald trafik.
- Per meddelande: 2 000 tecken in, max `MAX_COMPLETION_TOKENS=420` ut. Högst 12 sparade chattar/användare och högst 40 sparade meddelanden/chatt.
- Privata meddelanden kan raderas i UI, men automatisk retention, generell kontoradering och export kräver ytterligare arbete.
- En enkel deterministisk riskfrasrutin fångar vissa tydliga omnämnanden av våld eller suicid, men kan både missa risk och larma fel. **Det är inte en kliniskt säker lösning.** AI:n är inte behandling, diagnos, krishjälp eller objektiv domare.
- Allt som hämtas från formulär, meddelanden eller regler behandlas som **data**, aldrig som instruktioner. Detta minskar men eliminerar inte risken för prompt injection eller felaktiga slutsatser. Uteslut verkligt känsligt material tills separat juridisk/klinisk säkerhetsgranskning är klar.

## Verifieringsstatus och checklista

- [x] PR #81: privat Worker/D1-testchatt, backendkvot, interna testkonton och grundläggande kod-/D1-tester.
- [x] PR #82: JWT-baserad, nyinhämtad projektkontext, dataminimering och regressionstester; dokumenterat godkänd AI-/browser-CI och uppdaterad Worker.
- [x] PR #84: opt-out-funktion och automatiska testfall **kodade på utvecklingsbranch**.
- [x] PR #84: full AI- och UI-/browser-CI passerade på kod- och regressionstilläggen (AI-run #41419931803; UI-run #41419931438). 28 skärmbilder inklusive mobil opt-out och `visual-audit.json` genererades.
- [ ] PR #84: manuell granskning och merge.
- [ ] Driftsätt den nya Worker-versionen för opt-out och verifiera verklig Pages-version.
- [ ] Genomför **riktiga** autentiserade tvåkontotester: A JA+JA, endast eget JA/NEJ, partnersamtycke saknas/återkallas, av-/omparning, annan familj, opt-out utan dataläsning, utloggning samt återupptagen/raderad chatt.
- [ ] Klinisk, juridisk och dataskyddsmässig granskning inför verkliga känsliga ungdomssamtal och eventuell extern pilot.

## Tekniska referenser

[Cloudflare Workers AI-priser](https://developers.cloudflare.com/workers-ai/platform/pricing/) · [Cloudflare D1](https://developers.cloudflare.com/d1/) · [Supabase Auth](https://supabase.com/docs/guides/auth/users) · [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
