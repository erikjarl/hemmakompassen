-- SEC-02 read-only visibility regression on the connected internal test DB.
-- IMPORTANT: JWT claims are simulated with SET LOCAL, not real signed Supabase Auth.
-- Requires exactly one existing parent/teen pair plus at least two outsiders.
-- No writes to application tables. Every test executes under authenticated role.
BEGIN;
SELECT set_config('sec02.paired_parent',
  (SELECT m.user_id::text FROM public.family_members m
   JOIN (SELECT family_id FROM public.family_members
         GROUP BY family_id HAVING count(*)=2
          AND count(*) FILTER(WHERE role='parent')=1
          AND count(*) FILTER(WHERE role='teen')=1) pair USING(family_id)
   WHERE m.role='parent' LIMIT 1),true);
SELECT set_config('sec02.paired_teen',
  (SELECT m.user_id::text FROM public.family_members m
   JOIN (SELECT family_id FROM public.family_members
         GROUP BY family_id HAVING count(*)=2
          AND count(*) FILTER(WHERE role='parent')=1
          AND count(*) FILTER(WHERE role='teen')=1) pair USING(family_id)
   WHERE m.role='teen' LIMIT 1),true);
SELECT set_config('sec02.outsider_a',
  (SELECT u.id::text FROM auth.users u
   WHERE NOT EXISTS(SELECT 1 FROM public.family_members m WHERE m.user_id=u.id)
   ORDER BY u.created_at,u.id LIMIT 1),true);
SELECT set_config('sec02.outsider_b',
  (SELECT u.id::text FROM auth.users u
   WHERE NOT EXISTS(SELECT 1 FROM public.family_members m WHERE m.user_id=u.id)
   ORDER BY u.created_at,u.id LIMIT 1 OFFSET 1),true);
SET LOCAL ROLE authenticated;
DO $audit$
DECLARE
  label text;
  user_identifier text;
  rpc text;
  rows_returned integer;
  rpc_names text[]:=array[
    'my_family_members',
    'my_schyssta_rules',
    'my_schyssta_rule_history',
    'my_schyssta_replacement_links',
    'my_schyssta_notifications',
    'shared_understanding_cards',
    'my_family_unread_message_count'
  ];
BEGIN
  FOREACH label IN ARRAY array['paired_parent','paired_teen','outsider_a','outsider_b','no_subject'] LOOP
    IF label='no_subject' THEN
      -- Even an authenticated Postgres role cannot read private family rows
      -- without a subject; this remains a claim simulation, not signed JWT.
      PERFORM set_config('request.jwt.claims','{"role":"authenticated"}',true);
    ELSE
      user_identifier:=current_setting('sec02.'||label,true);
      IF user_identifier IS NULL OR user_identifier='' THEN
        RAISE EXCEPTION 'Missing test identity %',label;
      END IF;
      PERFORM set_config('request.jwt.claims',
        pg_catalog.json_build_object('sub',user_identifier,'role','authenticated')::text,true);
    END IF;
    FOREACH rpc IN ARRAY rpc_names LOOP
      -- my_family_unread_message_count returns one scalar even for nonmembers.
      IF rpc='my_family_unread_message_count' THEN
        EXECUTE 'SELECT public.my_family_unread_message_count()' INTO rows_returned;
        IF (label LIKE 'outsider_%' OR label='no_subject') AND rows_returned<>0 THEN
          RAISE EXCEPTION 'FAIL outsider unread count: %',label;
        END IF;
      ELSE
        EXECUTE pg_catalog.format('SELECT count(*) FROM public.%I()',rpc) INTO rows_returned;
        IF (label LIKE 'outsider_%' OR label='no_subject') AND rows_returned<>0 THEN
          RAISE EXCEPTION 'FAIL outsider read %: % rows',rpc,rows_returned;
        END IF;
        IF rpc='my_family_members' AND label LIKE 'paired_%'
           AND rows_returned<>2 THEN
          RAISE EXCEPTION 'FAIL paired membership %: % rows',label,rows_returned;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END $audit$;
RESET ROLE;
SELECT 'PASS: 2 paired, 2 outside, missing-subject; 7 read RPCs; no writes' AS audit;
ROLLBACK;
