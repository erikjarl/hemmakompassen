# SEC-02 – befintliga konton, simulerad JWT på databasnivå

**Datum:** 2026-11-07  
**Miljö:** anslutet Supabase-testprojekt Hemmakompassen  
**Metod:** läsfrågor i `BEGIN READ ONLY` / `ROLLBACK`, med `SET LOCAL ROLE authenticated` och `set_config('request.jwt.claims', '{"sub":"<existing-user-id>","role":"authenticated"}', true)`. Kontonas UUID hämtades internt från `auth.users` och skickades inte till GitHub. Testet **validerar inte riktiga inloggningar, signerade JWT eller HTTP Data API**.

## Testpopulation och resultat

Existerande testdata: fyra autentiseringskonton; två aktuella `family_members` (förälder och tonåring) och två konton utan aktuell familjeparning.

| Konto (anonymiserat) | Medlemmar via RPC | Familjemeddelanden | Regler | Gillaswajp JA+JA i general | Delade prioriteringar | Förståelsekort | Delad IPIP-profil |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Para: förälder | 2 | 2 | 2 | 12 | 0 | 0 | Synlig |
| Para: tonåring | 2 | 2 | 2 | 12 | 0 | 0 | Synlig |
| Oparat konto A | 0 | 0 | 0 | 0 | 0 | 0 | Ej synlig |
| Oparat konto B | 0 | 0 | 0 | 0 | 0 | 0 | Ej synlig |

`my_activity_notifications()` gav noll poster i samtliga fyra testfall. Därför kan detta test **inte** bekräfta en positiv kvittens av äldre notis. Resultatet med noll delade prioriteringar innebär också att separat samtyckesflöde och återkallelse för SW-03 **inte** har verifierats.

Ägarstyrda tabeller under samma kontosimulation:

| Konto | Egna profiler | Egna IPIP-items | Egna swajpsvar | Egna prioriteringar | Rader där `user_id != auth.uid()` i sju testade ägartabeller |
| --- | ---: | ---: | ---: | ---: | ---: |
| Para: förälder | 1 | 50 | 66 | 12 | 0 |
| Para: tonåring | 1 | 50 | 80 | 9 | 0 |
| Oparat konto A | 1 | 0 | 0 | 0 | 0 |
| Oparat konto B | 1 | 0 | 21 | 4 | 0 |

De sju ägartabellerna: `profiles`, `personality_answers`, `private_ai_chats`, `private_ai_memories`, `swipe_answers`, `swipe_importance`, `swipe_skips`. `private_ai_messages` ingick i första tabellantalstestet (noll rader för alla), men inte i kontrollen med `user_id` eftersom tabellen inte har den kolumnen; indirekt ägarisolering genom chattrelation återstår. Ingen förändring av användardata gjordes.

## Återanvändbart frågemönster (ett konto i taget)

Följande körs med **ett av testkontonas UUID som lokal parameter** i betrodd klient. Sätt aldrig UUID eller signerade tokens i repo, loggar eller CI-artefakter.

```sql
BEGIN READ ONLY;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',
  '{"sub":"REPLACE_WITH_EXISTING_TEST_USER_UUID","role":"authenticated"}', true);
SELECT
  (SELECT count(*) FROM public.my_family_members()) AS family_members,
  (SELECT count(*) FROM public.my_family_messages()) AS family_messages,
  (SELECT count(*) FROM public.shared_swipe_matches('general')) AS mutual_matches,
  (SELECT count(*) FROM public.shared_swipe_priorities('general')) AS shared_priorities,
  (SELECT public.my_ipip50_shared_profiles() IS NOT NULL) AS shared_ipip_visible,
  (SELECT count(*) FROM public.swipe_answers WHERE user_id <> (SELECT auth.uid())) AS foreign_swipe_answers,
  (SELECT count(*) FROM public.personality_answers WHERE user_id <> (SELECT auth.uid())) AS foreign_personality_answers;
ROLLBACK;
```

## Slutsatser och begränsningar

- Observerat: båda nu parade kontona har tillgång till samma delade familjedata i granskade RPC:er; två oparade konton kan inte läsa dessa familjeresultat. Inga främmande `user_id`-rader syntes i de sju kontrollerade ägartabellerna.
- **Inte bevisat:** autentisk Supabase Auth/JWT-session i webbläsare, signaturvalidering, andra familjers isolering när båda är aktiva, HTTP-beteende, positivt samtycke/återkallelse, separat tvåkontoflöde eller komplett P0-acceptans.
- Verkliga tvåkontotester med aktiva inloggningar kvarstår för INT-01, INT-02, INT-03, INT-04. Inga gamla svar eller meddelanden har skrivits över.
