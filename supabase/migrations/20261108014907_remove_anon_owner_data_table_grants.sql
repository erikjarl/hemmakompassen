-- Installed in connected Supabase project, migration 20261108014907.
-- Five owner-data tables require a signed-in user for direct row access.
REVOKE SELECT, INSERT, UPDATE, DELETE
ON TABLE public.profiles, public.personality_answers,
public.private_ai_chats, public.private_ai_messages, public.private_ai_memories
FROM anon;

-- Require explicit opt-in for future postgres-owned anonymous data access.
-- Preserve authenticated / service_role rights, RLS and all user data.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM anon;
