-- SEC-02: read-only regression for browser-role table ACLs.
-- Execute on the connected Supabase database. No DML, DDL or test-account mutation.
-- Fail if anon/authenticated can TRUNCATE, create triggers, or add REFERENCES
-- to any present public table; RLS cannot mitigate these privileges.
DO $audit$
DECLARE
  v_exposed integer;
  v_bad_defaults integer;
BEGIN
  SELECT count(*) INTO v_exposed
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  CROSS JOIN (VALUES ('anon'),('authenticated')) role_name(name)
  CROSS JOIN (VALUES ('TRUNCATE'),('TRIGGER'),('REFERENCES')) perm(name)
  WHERE n.nspname='public' AND c.relkind IN ('r','p')
    AND has_table_privilege(role_name.name,c.oid,perm.name);
  IF v_exposed <> 0 THEN
    RAISE EXCEPTION 'SEC-02 failed: % unnecessary browser-role table ACL(s)',v_exposed;
  END IF;

  SELECT count(*) INTO v_bad_defaults
  FROM pg_default_acl d
  JOIN pg_roles owner ON owner.oid=d.defaclrole
  JOIN pg_namespace n ON n.oid=d.defaclnamespace
  CROSS JOIN LATERAL aclexplode(d.defaclacl) x
  JOIN pg_roles grantee ON grantee.oid=x.grantee
  WHERE n.nspname='public' AND d.defaclobjtype='r'
    AND owner.rolname='postgres'
    AND grantee.rolname IN ('anon','authenticated')
    AND x.privilege_type IN ('TRUNCATE','TRIGGER','REFERENCES');
  IF v_bad_defaults <> 0 THEN
    RAISE EXCEPTION 'SEC-02 failed: postgres default table ACL still has % unnecessary grants',v_bad_defaults;
  END IF;

  IF (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relname IN
        ('profiles','personality_answers','private_ai_chats','private_ai_messages','private_ai_memories')
      AND c.relrowsecurity
      AND has_table_privilege('authenticated',c.oid,'SELECT')
      AND has_table_privilege('authenticated',c.oid,'INSERT')
      AND has_table_privilege('authenticated',c.oid,'UPDATE'))<>5 THEN
    RAISE EXCEPTION 'SEC-02 failed: owner-data RLS or ordinary authenticated privileges changed';
  END IF;
END
$audit$;

-- Positive guard: ordinary owner-data operations remain granted where needed,
-- and row-level security still governs whose rows can be touched.
SELECT c.relname AS table_name,c.relrowsecurity AS rls_enabled,
  has_table_privilege('authenticated',c.oid,'SELECT') AS authenticated_select,
  has_table_privilege('authenticated',c.oid,'INSERT') AS authenticated_insert,
  has_table_privilege('authenticated',c.oid,'UPDATE') AS authenticated_update
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public'
  AND c.relname IN ('profiles','personality_answers','private_ai_chats','private_ai_messages','private_ai_memories')
ORDER BY 1;

-- Known residual: separate supabase_admin default grants cannot be revoked
-- by the postgres role in this project; list them for a later admin-led change.
SELECT owner.rolname owner,grantee.rolname grantee,x.privilege_type
FROM pg_default_acl d
JOIN pg_roles owner ON owner.oid=d.defaclrole
JOIN pg_namespace n ON n.oid=d.defaclnamespace
CROSS JOIN LATERAL aclexplode(d.defaclacl) x
JOIN pg_roles grantee ON grantee.oid=x.grantee
WHERE n.nspname='public' AND d.defaclobjtype='r'
  AND owner.rolname='supabase_admin'
  AND grantee.rolname IN ('anon','authenticated')
  AND x.privilege_type IN ('TRUNCATE','TRIGGER','REFERENCES')
ORDER BY 2,3;
