-- Installed in Supabase as migration 20261108013523.
-- Browser roles must not hold destructive or DDL table privileges.
-- RLS does not restrict TRUNCATE and does not replace these privilege checks.
-- Preserve existing SELECT / INSERT / UPDATE / DELETE grants and all RLS policies.
REVOKE TRUNCATE, TRIGGER, REFERENCES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

-- Protect future tables created by the project's postgres role.
-- supabase_admin's separate default ACL cannot be changed by postgres here.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLES FROM anon, authenticated;
