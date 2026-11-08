-- SEC-02: read-only live regression. Never changes user data.
DO $audit$
DECLARE v_count integer; v_anon integer; v_signed integer; v_unprotected integer; v_defaults integer;
BEGIN
 WITH sensitive AS (
   SELECT c.oid,c.relname,c.relrowsecurity
   FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public'
   AND c.relname IN ('profiles','personality_answers','private_ai_chats',
                     'private_ai_messages','private_ai_memories')
 ), permissions AS (
   SELECT s.relname,s.relrowsecurity,
      has_table_privilege('anon',s.oid,p.privilege) anon_allowed,
      has_table_privilege('authenticated',s.oid,p.privilege) signed_allowed
   FROM sensitive s
   CROSS JOIN (VALUES('SELECT'),('INSERT'),('UPDATE'),('DELETE')) p(privilege)
 )
 SELECT count(DISTINCT relname),
        count(*) FILTER (WHERE anon_allowed),
        count(*) FILTER (WHERE signed_allowed),
        count(DISTINCT relname) FILTER (WHERE NOT relrowsecurity)
 INTO v_count,v_anon,v_signed,v_unprotected FROM permissions;

 SELECT count(*) INTO v_defaults
 FROM pg_default_acl d JOIN pg_roles o ON o.oid=d.defaclrole
 JOIN pg_namespace n ON n.oid=d.defaclnamespace
 CROSS JOIN LATERAL aclexplode(d.defaclacl) x
 JOIN pg_roles g ON g.oid=x.grantee
 WHERE o.rolname='postgres' AND n.nspname='public'
 AND d.defaclobjtype='r' AND g.rolname='anon'
 AND x.privilege_type IN ('SELECT','INSERT','UPDATE','DELETE');
 IF v_count<>5 OR v_anon<>0 OR v_signed<>20 OR v_unprotected<>0 OR v_defaults<>0 THEN
   RAISE EXCEPTION 'SEC-02 anonymous owner-data ACL failure: tables=%, anon=%, authenticated=%, no_rls=%, defaults=%',
     v_count,v_anon,v_signed,v_unprotected,v_defaults;
 END IF;
END
$audit$;

-- Remaining platform-admin defaults need separate admin permission.
SELECT o.rolname owner,g.rolname grantee,x.privilege_type
FROM pg_default_acl d JOIN pg_roles o ON o.oid=d.defaclrole
JOIN pg_namespace n ON n.oid=d.defaclnamespace
CROSS JOIN LATERAL aclexplode(d.defaclacl) x
JOIN pg_roles g ON g.oid=x.grantee
WHERE o.rolname='supabase_admin' AND n.nspname='public'
AND d.defaclobjtype='r' AND g.rolname='anon'
AND x.privilege_type IN ('SELECT','INSERT','UPDATE','DELETE','TRUNCATE','TRIGGER','REFERENCES')
ORDER BY 3;
