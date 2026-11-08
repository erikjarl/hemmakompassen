# SEC-02 – granskning och härdning av publika tabellrättigheter

**Datum:** 8 november 2026. **Miljö:** ansluten Supabase-projektinstans `bwrcgrbbpumyjfvznlbf`. **Metod:** läsbaserad granskning av `pg_class`, `aclexplode`, `pg_default_acl`, `has_table_privilege`, därefter avgränsad `REVOKE`-migration och samma efterkontroll. Inga användarrader ändrades.

## Upptäckt

Före ändringen hade både `anon` och `authenticated` de explicita tabellprivilegierna `TRUNCATE`, `TRIGGER` och `REFERENCES` på fem publika tabeller: `profiles`, `personality_answers`, `private_ai_chats`, `private_ai_messages`, `private_ai_memories` (**5 × 2 × 3 = 30 onödiga behörighetskombinationer**).

Dessa rättigheter behövs inte för webbläsarens normala INSERT/SELECT/UPDATE/DELETE. `TRUNCATE` regleras inte av RLS. Detta är en behörighetsbrist och onödig risk, **inte** ett bevis på att en besökare kunde anropa TRUNCATE genom PostgREST eller exploatera projektet. Inget destruktivt anrop utfördes.

Projektets `postgres`-ägda standard-ACL för nya tabeller i `public` innehöll dessutom samma tre privilegier till båda klientrollerna.

## Installerad ändring

Supabase-migration **`20261108013523_revoke_destructive_table_grants_browser_roles`** är installerad. Reproducerad i [SQL-filen](../supabase/migrations/20261108013523_revoke_destructive_table_grants_browser_roles.sql). Den tar bort `TRUNCATE`, `TRIGGER`, `REFERENCES` från `anon`/`authenticated` på befintliga tabeller i `public` och från framtida `postgres`-ägda standardprivilegier. Inga RPC:er, RLS-policyer, vanliga DML-rättigheter eller lagrade svar ändras.

## Verifiering mot ansluten databas

- **23** publika tabeller med `relkind='r'` kontrollerades, **138** kombinationer (23 tabeller × 2 roller × 3 privilegier): **0** återstående otillåtna effektiva privilegier.
- `postgres` standard-ACL för de tre rättigheterna och två klientrollerna: **0** återstående.
- På alla fem tidigare berörda tabeller har `authenticated` fortfarande `SELECT`, `INSERT`, `UPDATE`, och RLS är fortsatt aktiverat. Detta bekräftar privilegier och RLS-flaggor, **inte** att varje UI-flöde eller RLS-policy fungerar korrekt.
- Återanvändbar [läsbaserad SQL-regression](../supabase/tests/sec02_browser_table_acl_readonly.sql) kördes mot databasen och passerade med explicita `RAISE EXCEPTION`-assertioner. Även ett enkelt Node-kontrakt skyddar migrations- och testfilernas avgränsning i CI.

## Kvarstående begränsningar

**Viktig kvarstående standardkonfiguration:** `supabase_admin` har en **separat** standard-ACL med **sex** kombinationer för `TRUNCATE`/`TRIGGER`/`REFERENCES` till `anon`/`authenticated`. Den anslutna `postgres`-rollen är **inte medlem** i `supabase_admin`, och därför gjordes ingen otillåten `ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin`. De befintliga 23 tabellerna är härdade, men nya tabeller som skapas av `supabase_admin` kan få de bredare rättigheterna igen. Ändra detta genom separat behörig administratörsoperation eller verifiera en alternativ plattformsstödd väg; återkör SQL-regressionen efter nya migrationer.

Signerade tvåkontoinloggningar, full auktorisationsgranskning av alla SECURITY DEFINER-RPC:er, omparning och familjeisolering återstår. Vanliga nät-/PostgREST-anrop eller attacker har **inte** simulerats som om de var signerade sessioner.

**Dokumentation:** Supabase [Securing your API](https://supabase.com/docs/guides/api/securing-your-api) – `GRANT` och RLS är två separata skyddslager.
