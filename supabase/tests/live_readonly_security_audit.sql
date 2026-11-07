-- SEC-02: READ-ONLY live Supabase audit; does not need or read real user data.
-- Execute ONLY with authorised project access. Review every FAIL manually.
-- This is not a replacement for two authenticated account/device tests.
BEGIN TRANSACTION READ ONLY;

-- Exposed table and privileged-RPC metadata, not user rows.
SELECT
  (SELECT count(*)
   FROM pg_catalog.pg_class AS c
   JOIN pg_catalog.pg_namespace AS n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relkind IN ('r','p') AND NOT c.relrowsecurity
  ) AS public_tables_without_rls,
  (SELECT count(*)
   FROM pg_catalog.pg_proc AS p
   JOIN pg_catalog.pg_namespace AS n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.prosecdef
     AND pg_catalog.has_function_privilege('anon',p.oid,'EXECUTE')
  ) AS anon_executable_security_definer_rpcs,
  (SELECT count(*)
   FROM pg_catalog.pg_class AS c
   JOIN pg_catalog.pg_namespace AS n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relkind IN ('r','p')
     AND c.relrowsecurity
     AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_policy AS p WHERE p.polrelid=c.oid)
     AND (
       pg_catalog.has_table_privilege('anon',c.oid,'SELECT') OR
       pg_catalog.has_table_privilege('authenticated',c.oid,'SELECT')
     )
  ) AS no_policy_tables_with_select_grants;

-- These two IDs must NEVER exist as real users. They are not created here.
-- Read-only identity simulation proves only that an unknown JWT subject
-- cannot read owner-only rows; it does not prove real pair/RPC correctness.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',
  '{"sub":"d0000000-aaaa-4aaa-8aaa-000000000001","role":"authenticated"}',true);
SELECT 'synthetic_unknown_user_a' AS test,
  (SELECT count(*) FROM public.profiles) AS profiles_visible,
  (SELECT count(*) FROM public.personality_answers) AS personality_visible,
  (SELECT count(*) FROM public.private_ai_chats) AS private_chats_visible,
  (SELECT count(*) FROM public.private_ai_messages) AS private_messages_visible,
  (SELECT count(*) FROM public.private_ai_memories) AS private_memories_visible,
  (SELECT count(*) FROM public.swipe_answers) AS swipe_answers_visible,
  (SELECT count(*) FROM public.swipe_importance) AS swipe_importance_visible,
  (SELECT count(*) FROM public.swipe_skips) AS swipe_skips_visible;

SELECT set_config('request.jwt.claims',
  '{"sub":"d0000000-aaaa-4aaa-8aaa-000000000002","role":"authenticated"}',true);
SELECT 'synthetic_unknown_user_b' AS test,
  (SELECT count(*) FROM public.profiles) AS profiles_visible,
  (SELECT count(*) FROM public.personality_answers) AS personality_visible,
  (SELECT count(*) FROM public.private_ai_chats) AS private_chats_visible,
  (SELECT count(*) FROM public.private_ai_messages) AS private_messages_visible,
  (SELECT count(*) FROM public.private_ai_memories) AS private_memories_visible,
  (SELECT count(*) FROM public.swipe_answers) AS swipe_answers_visible,
  (SELECT count(*) FROM public.swipe_importance) AS swipe_importance_visible,
  (SELECT count(*) FROM public.swipe_skips) AS swipe_skips_visible;
ROLLBACK;
