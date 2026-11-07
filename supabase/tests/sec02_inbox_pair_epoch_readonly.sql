-- SEC-02 / INT-03: after migration, verify current exact pairing epoch.
-- Simulated database JWT identities, no signed Supabase Auth.
-- No user data writes, fully rolled back.
BEGIN;
SELECT set_config('audit.parent',(SELECT user_id::text FROM public.family_members WHERE role='parent' LIMIT 1),true);
SELECT set_config('audit.teen',(SELECT user_id::text FROM public.family_members WHERE role='teen' LIMIT 1),true);
SELECT set_config('audit.outside',(SELECT u.id::text FROM auth.users u WHERE NOT EXISTS (SELECT 1 FROM public.family_members m WHERE m.user_id=u.id) LIMIT 1),true);
DO $check$
BEGIN
 IF current_setting('audit.parent',true) IS NULL OR current_setting('audit.teen',true) IS NULL
   OR current_setting('audit.outside',true) IS NULL THEN
   RAISE EXCEPTION 'Two paired identities and one unpaired account required';
 END IF;
 IF has_function_privilege('anon','public.my_current_inbox_pair_epoch()','EXECUTE')
   OR NOT has_function_privilege('authenticated','public.my_current_inbox_pair_epoch()','EXECUTE')
 THEN RAISE EXCEPTION 'Bad RPC execute privileges'; END IF;
END $check$;
SET LOCAL ROLE authenticated;
DO $check$
DECLARE one_epoch text;two_epoch text;outsider_epoch text;
BEGIN
 PERFORM set_config('request.jwt.claims',json_build_object('sub',current_setting('audit.parent'),'role','authenticated')::text,true);
 SELECT public.my_current_inbox_pair_epoch() INTO one_epoch;
 PERFORM set_config('request.jwt.claims',json_build_object('sub',current_setting('audit.teen'),'role','authenticated')::text,true);
 SELECT public.my_current_inbox_pair_epoch() INTO two_epoch;
 PERFORM set_config('request.jwt.claims',json_build_object('sub',current_setting('audit.outside'),'role','authenticated')::text,true);
 SELECT public.my_current_inbox_pair_epoch() INTO outsider_epoch;
 IF one_epoch IS NULL OR two_epoch IS DISTINCT FROM one_epoch THEN
   RAISE EXCEPTION 'Paired parent and teen must get same non-null epoch'; END IF;
 IF outsider_epoch IS NOT NULL THEN RAISE EXCEPTION 'Outsider must not get current pair epoch'; END IF;
END $check$;
RESET ROLE;
SELECT 'PASS: current parent and teen have same epoch; outsider NULL; anon denied; no data writes' AS audit;
ROLLBACK;
