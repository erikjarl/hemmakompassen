-- Read/write audit only inside a rolled-back transaction.
-- Existing legacy answers must not change.
BEGIN;
SELECT set_config('audit.old_answers',(SELECT count(*)::text FROM public.personality_answers),true);
SELECT set_config('audit.old_attempts',(SELECT count(*)::text FROM public.personality_test_attempts),true);
SELECT set_config('audit.old_retest_answers',(SELECT count(*)::text FROM public.personality_attempt_answers),true);
SELECT set_config('audit.owner',(SELECT id::text FROM auth.users ORDER BY created_at LIMIT 1),true);
SELECT set_config('audit.other',(SELECT id::text FROM auth.users ORDER BY created_at LIMIT 1 OFFSET 1),true);
SELECT set_config('request.jwt.claims',json_build_object('sub',current_setting('audit.owner'),'role','authenticated')::text,true);
SET LOCAL ROLE authenticated;
WITH created AS (
 INSERT INTO public.personality_test_attempts(user_id,instrument_id)
 VALUES (auth.uid(),'ipip50-sv-v1') RETURNING id
)
SELECT set_config('audit.draft',id::text,true) FROM created;
DO $test$
BEGIN
  BEGIN
    INSERT INTO public.personality_test_attempts(user_id,instrument_id)
    VALUES (auth.uid(),'ipip50-sv-v1');
    RAISE EXCEPTION 'FAIL: allowed two unfinished tests for same account';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
END $test$;
SELECT set_config('request.jwt.claims',json_build_object('sub',current_setting('audit.other'),'role','authenticated')::text,true);
WITH created AS (
 INSERT INTO public.personality_test_attempts(user_id,instrument_id)
 VALUES (auth.uid(),'ipip50-sv-v1') RETURNING id
)
SELECT set_config('audit.other_draft',id::text,true) FROM created;
SELECT set_config('request.jwt.claims',json_build_object('sub',current_setting('audit.owner'),'role','authenticated')::text,true);
INSERT INTO public.personality_attempt_answers (user_id,attempt_id,question_id,answer_value)
SELECT auth.uid(),current_setting('audit.draft')::uuid,
 'ipip50-'||lpad(i::text,3,'0'),3 FROM generate_series(1,50) AS i;
UPDATE public.personality_test_attempts
 SET completed_at=now() WHERE id=current_setting('audit.draft')::uuid;
WITH created AS (
 INSERT INTO public.personality_test_attempts(user_id,instrument_id)
 VALUES (auth.uid(),'ipip50-sv-v1') RETURNING id
)
SELECT set_config('audit.new_draft',id::text,true) FROM created;
DO $test$
BEGIN
 IF (SELECT count(*) FROM public.personality_test_attempts
   WHERE user_id=auth.uid() AND completed_at IS NULL)<>1
 THEN RAISE EXCEPTION 'FAIL: expected one current unfinished test'; END IF;
 IF (SELECT count(*) FROM public.personality_test_attempts
   WHERE user_id=auth.uid() AND completed_at IS NOT NULL)<>1
 THEN RAISE EXCEPTION 'FAIL: old completed test missing'; END IF;
END $test$;
RESET ROLE;
DO $test$
BEGIN
 IF (SELECT count(*)::text FROM public.personality_answers)<>current_setting('audit.old_answers') THEN
 RAISE EXCEPTION 'FAIL: legacy responses changed'; END IF;
END $test$;
SELECT 'PASS: same owner duplicate rejected, other owner allowed, completed preserved, new draft allowed' AS audit;
ROLLBACK;
