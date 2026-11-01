# AI-medlaren – intern testversion med privata sparade samtal

**Status 2026-11-01:** Cloudflare Worker är driftsatt på Workers Free; användargränssnittet finns på `feature/ai-medlare-privat-test-20261101`, **inte** på `main` eller på den ordinarie publicerade GitHub Pages-sidan. Det är fortfarande en utvecklingsversion; använd enbart fiktiva testsamtal.

## Arkitektur
- GitHub Pages statisk frontend → separat Cloudflare Worker → verifierar Supabase Auth-token via `/auth/v1/user`.
- Cloudflare Worker har AI-binding för `@cf/meta/llama-3.1-8b-instruct-fp8-fast` (fiktiva svenska API-testanrop har givit läsbara svar).
- **Endast två interna testkonton** (Fannyförälder och Tobbetonåring) är tillåtna i Cloudflare-serverns separata `AI_TEST_USERS`-bindning. Kontonas UUID:n är inte inlagda i GitHub. Utan bindningen nekas alla AI-anrop (fail closed). Övriga inloggade konton får HTTP 403. Detta är en extra begränsning vid sidan av den obligatoriska verifieringen av varje Supabase Auth-token.
- Workern läser enbart **den inloggades roll** (`parent` eller `teen`) genom befintliga Supabase-RPC:n `my_family_members`; övriga familjemedlemmars namn eller roller skickas inte till modellen. När anropet misslyckas används en neutral instruktion.
- Samma Worker använder EU-jurisdiktionens Cloudflare D1 med migrationsfiler 0001/0002/0003.
- **D1 håller privata chattsessioner och meddelanden, inte delad familjekontext.** Varje SQL-fråga begränsas till det verifierade Supabase-användar-ID:t, inklusive skapande, lista, läsning, meddelandesparning och radering.
- Ingen Supabase service_role-nyckel används. Inga chattar eller IPIP/Gillaswajp-resultat läses från Supabase. Befintliga `private_ai_*`-tabeller i Supabase ändras inte och används ännu inte av AI-medlaren.

## Test-API
- `GET /api/ai/chats`: egna chattsessioner.
- `POST /api/ai/chats`: nytt eget samtal (max 12).
- `GET /api/ai/chats/{uuid}`: egna meddelanden (max 40).
- `DELETE /api/ai/chats/{uuid}`: tar bort eget samtal och dess meddelanden.
- `POST /api/ai/mediate`: `{"message":"...","chatId":"uuid"}`; servern hämtar de 10 senaste egna meddelandena som AI-kontext, sparar två nya meddelanden atomiskt och svarar med `{"reply":"...","ephemeral":false,"chatId":"..."}`. Utan `chatId` kan en gammal stateless request fortfarande ge `ephemeral:true` för tidigare kompatibilitet.

Klienten begär autentisering vid varje anrop; Workern verifierar token **på servern varje gång**. Ett manipulerat `chatId` från en annan familjemedlem ger 404, även om ID:t finns. Förfrågningar från annat origin än `https://erikjarl.github.io` nekas. Det är inte ett substitut för autentisering eller fullständiga säkerhetstester.

## Dataminimering och kostnad
- Hård gräns 10 AI-anrop per Supabase-konto och UTC-dag, max 2000 tecken in, max 320 genererade tokens. D1-kvoten är testad mot riktig databas med 10 lyckade och 2 blockerade testanrop.
- Högst 12 privata samtal per användare, högst 40 sparade meddelanden per samtal. Två meddelanden per utbyte: ett eget och ett serverskrivet AI-/säkerhetssvar.
- Meddelanden sparas endast efter framgångsrikt AI-svar. Både meddelandena sparas i samma D1-batch.
- Meddelanden sorteras med `sort_order` och inte enbart tidsstämpel. Verifierat i faktisk D1 att utbytesföljden är 1, 2, 3, 4 även med lika tidsstämpel.
- Vid kontobyte eller utloggning rensar klienten sina lokala data och avbryter pågående anrop. Chattar på servern sparas tills de raderas. **Automatisk retention/export, dataskyddsanalys och kontoradering är ännu inte implementerade.**
- Det här är intern testning; om användare senare får använda verkliga känsliga data krävs fullständig integritets-/juridisk/klinisk granskning.

## Riskhantering och kända begränsningar
- Vid vissa tydliga ord om hot/våld eller suicidrisk ger Workern deterministisk säkerhetsinformation istället för att låta modellen besvara frågan. Även fortsättningen av ett sådant samtal styrs till säkerhetstext inom den hämtade kontexten.
- Detta skydd är *bristfälligt* och kan missa risker. Fiktiva testsamtal visade att modellen ibland gav olämpliga råd i vålds-/suicidsituationer. Verkliga riskärenden får inte användas som underlag för att påstå tjänsten är säker.
- AI:n är inte psykoterapi, diagnos, krishjälp eller objektiv skiljedomare; det finns ingen validerad behandlingseffekt.
- Familjemedlemmars enskilda svar, privata chattar och inkorgsmeddelanden skickas inte till modellen. AI-02/AI-03 (frivilliga sammanfattningar av behörigt delade data) är senare steg.

## Faktisk verifiering hittills
- [x] Workers Free $0/månad bekräftat av användaren i Cloudflare-dashboard.
- [x] Worker uppladdad på separat `workers.dev`, AI- och D1-bindningar verifierade.
- [x] Riktig D1 SQL-test för kontoisolering, kaskadradering, lagring och stabil följd; syntetiska testposter raderade.
- [x] Samtliga 28 tester från GitHub-kodfiler genomkörda i V8 med simulerade Request/Response, Supabase Auth, D1 och AI och **alla passerade**.
- [x] Separata modellförfrågningar med påhittade svenska frågor har givit svar på gratisplanen.
- [x] GitHub Actions **AI-mediator backend safety tests** har klarat Node-tester, syntaxkontroller och statiskt bygge på den renodlade PR-branchen. Den ordinarie webbplatsens UI-browser-workflow har också passerat efter att testharnessen uppdaterades för medlarens reset.
- [ ] Verkliga autentiserade tvåkontotester och browser→Worker→Auth→AI-end-to-end-test **inte verifierade**. Direkta egna workers.dev-anrop blockerades tidigare av Cloudflare-verktygets egress; detta bevisar inte tjänstens svarskod.
- [ ] Featurebranchen måste granskas och mergas före den vanliga GitHub Pages-sidan visar chatten. Inga förändringar är ännu mergade till `main`.

## Länkar
- [Cloudflare Workers AI-priser](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Supabase Auth](https://supabase.com/docs/guides/auth/users)
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
