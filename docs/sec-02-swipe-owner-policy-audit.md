# SEC-02 / INT-01: ägarpolicies för Gillaswajpens privata tabeller

**Datum:** 2026-11-07  
**Miljö:** ansluten Supabase, projekt Hemmakompassen  
**Metod:** read-only SELECT mot PostgreSQL-katalogerna `pg_class`, `pg_namespace`, `pg_policy` samt `has_table_privilege`. Ingen användardata lästes eller ändrades.

## Resultat

| Tabell | RLS | Anonym SELECT | Autentiserad SELECT | Ägarbundna policies | Resultat |
| --- | --- | --- | --- | --- | --- |
| `swipe_answers` | Ja | Nej | Ja | 4 av 4, inklusive UPDATE WITH CHECK | PASS (katalogkontroll) |
| `swipe_importance` | Ja | Nej | Ja | 4 av 4, inklusive UPDATE WITH CHECK | PASS (katalogkontroll) |
| `family_members` | Ja | Nej | Nej | 0 direkta policies | PASS för direkt SELECT-restriktion |

**Reproducerbart SQL:** [`supabase/tests/sec02_swipe_owner_policy_readonly.sql`](../supabase/tests/sec02_swipe_owner_policy_readonly.sql). Frågan kördes mot ansluten databas och gav samtliga tre PASS i metadata-kontrollen.

### Avgränsning

Kontrollen jämför förekomst av `auth.uid()` och `user_id` i policyuttrycken och bekräftar tabellprivilegier. Den är **inte** ett fullständigt bevis för korrekt policylogik, RPC-behörighet, signerad JWT, säkra delningsregler, omparning eller behörig UI-användning. `family_members` nås via särskilda RPC:er som måste granskas separat.

**Nästa verifiering:** två riktiga signerade konton med faktiska positiva och negativa läs-/delningsfall och omparning, utan att ändra historiska svar. Ingen funktionsstatus höjs till färdig av detta katalogprov.
