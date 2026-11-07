-- Read-only SEC-02 catalog audit. No user data is selected or changed.
WITH t AS (
 SELECT c.oid, c.relname, c.relrowsecurity
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relkind='r'
 AND c.relname IN ('swipe_answers','swipe_importance','family_members')
), policies AS (
 SELECT t.relname,p.polcmd,
 pg_get_expr(p.polqual,p.polrelid) AS using_sql,
 pg_get_expr(p.polwithcheck,p.polrelid) AS check_sql
 FROM t JOIN pg_policy p ON p.polrelid=t.oid
), checks AS (
 SELECT t.relname AS table_name,t.relrowsecurity AS rls_enabled,
 has_table_privilege('anon',t.oid,'SELECT') AS anon_select_grant,
 has_table_privilege('authenticated',t.oid,'SELECT') AS authenticated_select_grant,
 count(p.polcmd) AS policies,
 count(p.polcmd) FILTER (WHERE
   (p.polcmd IN ('r','d','w') AND p.using_sql LIKE '%auth.uid()%' AND p.using_sql LIKE '%user_id%')
   OR (p.polcmd='a' AND p.check_sql LIKE '%auth.uid()%' AND p.check_sql LIKE '%user_id%')
 ) AS owner_bound_policies,
 count(p.polcmd) FILTER (WHERE p.polcmd='w' AND p.check_sql LIKE '%auth.uid()%' AND p.check_sql LIKE '%user_id%') AS owner_bound_update_checks
 FROM t LEFT JOIN policies p ON p.relname=t.relname
 GROUP BY t.oid,t.relname,t.relrowsecurity
)
SELECT *, CASE WHEN table_name IN ('swipe_answers','swipe_importance') AND
 rls_enabled AND NOT anon_select_grant AND authenticated_select_grant
 AND policies=4 AND owner_bound_policies=4 AND owner_bound_update_checks=1 THEN 'PASS'
 WHEN table_name='family_members' AND rls_enabled
 AND NOT anon_select_grant AND NOT authenticated_select_grant
 THEN 'PASS (direct SELECT only; RPC not audited)'
 ELSE 'REVIEW' END AS metadata_check FROM checks ORDER BY table_name;
