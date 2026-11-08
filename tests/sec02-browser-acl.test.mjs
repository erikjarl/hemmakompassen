import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const migration=readFileSync(new URL('../supabase/migrations/20261108013523_revoke_destructive_table_grants_browser_roles.sql',import.meta.url),'utf8');
const audit=readFileSync(new URL('../supabase/tests/sec02_browser_table_acl_readonly.sql',import.meta.url),'utf8');

assert.match(migration,/REVOKE TRUNCATE, TRIGGER, REFERENCES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;/,
  'Browser SQL roles cannot truncate or define triggers/FKs in the exposed schema');
assert.match(migration,/ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public[\s\S]*?REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLES FROM anon, authenticated;/,
  'New tables owned by postgres must not regain unsafe privileges');
assert.doesNotMatch(migration,/\b(DROP|DELETE|TRUNCATE TABLE|UPDATE|INSERT INTO|REVOKE ALL|REVOKE SELECT|REVOKE INSERT|REVOKE UPDATE|REVOKE DELETE)\b/i,
  'Hardening must not remove normal application privileges or mutate old data');
assert.match(audit,/has_table_privilege\(role_name\.name,c\.oid,perm\.name\)/);
assert.match(audit,/RAISE EXCEPTION 'SEC-02 failed: % unnecessary browser-role table ACL/);
assert.match(audit,/owner\.rolname='postgres'/);
assert.match(audit,/has_table_privilege\('authenticated',c\.oid,'SELECT'\)/);
assert.match(audit,/has_table_privilege\('authenticated',c\.oid,'INSERT'\)/);
assert.match(audit,/has_table_privilege\('authenticated',c\.oid,'UPDATE'\)/);
assert.match(audit,/owner\.rolname='supabase_admin'/,
  'Known residual admin-owned table defaults remain explicitly visible');
console.log('PASS: SEC-02 browser table ACL migration limits scope and has reproducible live audit');
