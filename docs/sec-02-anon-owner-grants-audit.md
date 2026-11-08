# SEC-02: minsta privilegier för anonyma klienter – privat användardata

**Datum:** 8 november 2026. **Databas:** ansluten Supabase `bwrcgrbbpumyjfvznlbf`.

## Före åtgärden

`anon` hade effektiva `SELECT`, `INSERT`, `UPDATE`, `DELETE`-privilegier på fem privata tabeller: `profiles`, `personality_answers`, `private_ai_chats`, `private_ai_messages`, `private_ai_memories`. Det motsvarar **20 onödiga direkta tabellprivilegier**. Samtliga hade RLS aktivt och endast autentiserade ägarpolicyer; det är därför **inte bevis för att faktiska privata rader varit åtkomliga för anonyma besökare**. Att ta bort tabellprivilegierna skapar ett självständigt skydd om en policy senare ändras felaktigt.

Postgres-ägda framtida tabellers standard-ACL gav även `anon` dessa fyra DML-privilegier.

## Installation och efterkontroll

Supabase-migration `20261108014907_remove_anon_owner_data_table_grants` installerad. Migrationsfilen finns i [projektets migrationsmapp](../supabase/migrations/20261108014907_remove_anon_owner_data_table_grants.sql).

- Alla fem identifierade privata tabeller: **0/20** kvarvarande effektiva `anon`-DML-rättigheter.
- `authenticated`: **20/20** motsvarande SELECT/INSERT/UPDATE/DELETE-rättigheter kvar.
- Alla fem tabeller har fortsatt RLS aktiverat.
- `postgres` standard-ACL för framtida publika tabeller: **0** kvarvarande `anon`-DML-rättigheter.
- [Läsbaserad assert-SQL](../supabase/tests/sec02_private_anon_dml_readonly.sql) körd mot ansluten Supabase och passerad. SQL rapporterar kvarvarande `supabase_admin`-ägda standard-ACL utan att förändra dessa.
- Node-kontrakt `tests/sec02-anon-owner-acl.test.mjs` skyddar migrationens avgränsning.

Ingen användardata, inga inloggningar, RLS-policyer, RPC-funktioner, `authenticated`- eller `service_role`-rättigheter ändrades. Anonym inloggning via Supabase Auth API är en separat mekanism och har inte verifierats i denna audit.

## Kvarvarande risk

Den plattformsägda rollen `supabase_admin` har fortfarande en **egen** standard-ACL i `public` som inkluderar sju privilegier (SELECT, INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES) för `anon`, och motsvarande klientspecifika grants kan förekomma för `authenticated`. Vår anslutna `postgres`-roll saknar behörighet att ändra en annan rollägares default ACL. **Nya tabeller skapade av `supabase_admin` kan därför få bredare rättigheter**. Detta ska granskas av behörig administratör och efter varje ny migration.

Riktiga signerade tvåkontoflöden, byte av familjeparning och faktisk användarsession i webbläsare återstår.

**Metodkälla:** Supabase, [Securing your API](https://supabase.com/docs/guides/api/securing-your-api) – `GRANT` och RLS är separata skyddslager.
