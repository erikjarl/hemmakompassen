# SEC-02: live read-only security audit

Run `supabase/tests/live_readonly_security_audit.sql` via a trusted SQL client with read-only access to the *intended project*. It does not create or edit accounts, answers or policies, and rolls back the read-only transaction.

Results must be checked manually:
- All three metadata counts should be **0** (public tables without RLS, anonymously executable SECURITY DEFINER RPCs, and policyless RLS tables directly selectable by a client role).
- All eight visible-row counts should be **0** for both arbitrary non-existent synthetic JWT subjects.
- This is a **catalog + synthetic identity check**, not real authentication, not proof of family pairing isolation, and not a complete SECURITY DEFINER body audit.
- The metadata query can flag intentional RPC permissions for investigation; never revoke production functions merely to silence a linter. Inspect each function's authorization before altering it.

Verified against the connected test Supabase on 2026-11-07: all three catalog counts were **0**. Eight owner-only table counts and seven authorised shared-RPC row counts were **0** for synthetic A and synthetic B in read-only transactions. The full SQL script was executed successfully (the connector displayed the final B result); A was also independently checked in a read-only transaction. Actual authentication with two separate real accounts and review of 30 authenticated SECURITY DEFINER functions remain outstanding.

Related docs: https://supabase.com/docs/guides/database/postgres/row-level-security and https://supabase.com/docs/guides/database/database-linter
