-- SEC-02/INT-04: real database, simulated authenticated identity.
-- Rollback-only test: no permanent change to saved answers or consent.
-- Requires exactly one current parent/teen pair, completed IPIP-50 on both
-- and both sharing preferences currently enabled.
BEGIN;
SELECT set_config('sec02.parent_id',
 (SELECT user_id::text FROM public.family_members WHERE role='parent'
 AND family_id IN (SELECT family_id FROM public.family_members
   GROUP BY family_id HAVING count(*)=2
   AND count(*) FILTER(WHERE role='parent')=1
   AND count(*) FILTER(WHERE role='teen')=1) LIMIT 1),true);
SELECT set_config('sec02.teen_id',
 (SELECT user_id::text FROM public.family_members WHERE role='teen'
 AND family_id IN (SELECT family_id FROM public.family_members
   GROUP BY family_id HAVING count(*)=2
   AND count(*) FILTER(WHERE role='parent')=1
   AND count(*) FILTER(WHERE role='teen')=1) LIMIT 1),true);
SELECT set_config('sec02.legacy_answers',
 (SELECT count(*)::text FROM public.personality_answers),true);
DO $audit$
DECLARE uid text; n integer;
BEGIN
 FOREACH uid IN ARRAY array[current_setting('sec02.parent_id',true),
                          current_setting('sec02.teen_id',true)] LOOP
  IF uid IS NULL OR uid='' THEN RAISE EXCEPTION 'Missing paired account'; END IF;
  SELECT count(*) INTO n FROM public.personality_share_preferences
   WHERE user_id=uid::uuid AND instrument_id='ipip50-sv-v1'
    AND share_enabled IS TRUE;
  IF n<>1 THEN RAISE EXCEPTION 'Baseline requires verified opt-in for both accounts'; END IF;
  SELECT count(*) INTO n FROM public.personality_answers
   WHERE user_id=uid::uuid AND instrument_id='ipip50-sv-v1';
  IF n<>50 THEN RAISE EXCEPTION 'Baseline needs 50 saved items per account'; END IF;
 END LOOP;
END $audit$;
SAVEPOINT before_revocation;

-- Baseline: both roles may read exactly five factor sums per person, no raw
-- item values or member IDs. This is *not* a signed Supabase Auth session.
SET LOCAL ROLE authenticated;
DO $audit$
DECLARE uid text; body jsonb; p jsonb; scores jsonb; score_key text;
BEGIN
 FOREACH uid IN ARRAY array[current_setting('sec02.parent_id'),current_setting('sec02.teen_id')] LOOP
  PERFORM set_config('request.jwt.claims',
   pg_catalog.json_build_object('sub',uid,'role','authenticated')::text,true);
  SELECT public.my_ipip50_shared_profiles() INTO body;
  IF body IS NULL OR body->>'instrument_id'<>'ipip50-sv-v1'
     OR pg_catalog.jsonb_array_length(body->'profiles')<>2 THEN
   RAISE EXCEPTION 'Missing complete positive shared IPIP payload';
  END IF;
  IF (SELECT count(*) FROM pg_catalog.jsonb_object_keys(body) AS key)<>3 THEN
   RAISE EXCEPTION 'Unexpected shared payload field';
  END IF;
  IF body::text ~* '(question_id|ipip50-001|user_id|answer_value|raw_answers)' THEN
   RAISE EXCEPTION 'Raw or identifiable field in shared payload';
  END IF;
  FOR p IN SELECT value FROM pg_catalog.jsonb_array_elements(body->'profiles') LOOP
   IF (SELECT count(*) FROM pg_catalog.jsonb_object_keys(p) AS key)<>2
      OR p->>'role' NOT IN ('teen','parent') THEN
     RAISE EXCEPTION 'Unexpected public profile structure';
   END IF;
   scores:=p->'scores';
   IF (SELECT count(*) FROM pg_catalog.jsonb_object_keys(scores) AS key)<>5 THEN
     RAISE EXCEPTION 'Expected five scales only';
   END IF;
   FOREACH score_key IN ARRAY array['extraversion','agreeableness','conscientiousness',
      'emotional_stability','intellect_imagination'] LOOP
     IF pg_catalog.jsonb_typeof(scores->score_key)<>'number' OR
       (scores->>score_key)::integer NOT BETWEEN 10 AND 50 THEN
       RAISE EXCEPTION 'Missing or invalid score %',score_key;
     END IF;
   END LOOP;
  END LOOP;
 END LOOP;
END $audit$;
RESET ROLE;

-- Simulate parent revocation. This UPDATE and all consequences are rolled back.
UPDATE public.personality_share_preferences
 SET share_enabled=false
 WHERE user_id=current_setting('sec02.parent_id')::uuid
   AND instrument_id='ipip50-sv-v1';
SET LOCAL ROLE authenticated;
DO $audit$
DECLARE uid text; payload jsonb;
BEGIN
 FOREACH uid IN ARRAY array[current_setting('sec02.parent_id'),current_setting('sec02.teen_id')] LOOP
  PERFORM set_config('request.jwt.claims',
    pg_catalog.json_build_object('sub',uid,'role','authenticated')::text,true);
  SELECT public.my_ipip50_shared_profiles() INTO payload;
  IF payload IS NOT NULL THEN
   RAISE EXCEPTION 'FAIL: shared scores visible after parent revocation';
  END IF;
 END LOOP;
END $audit$;
RESET ROLE;
ROLLBACK TO SAVEPOINT before_revocation;

-- Same check for teenager revocation: neither person may see scales.
UPDATE public.personality_share_preferences
 SET share_enabled=false
 WHERE user_id=current_setting('sec02.teen_id')::uuid
   AND instrument_id='ipip50-sv-v1';
SET LOCAL ROLE authenticated;
DO $audit$
DECLARE uid text; payload jsonb;
BEGIN
 FOREACH uid IN ARRAY array[current_setting('sec02.parent_id'),current_setting('sec02.teen_id')] LOOP
  PERFORM set_config('request.jwt.claims',
    pg_catalog.json_build_object('sub',uid,'role','authenticated')::text,true);
  SELECT public.my_ipip50_shared_profiles() INTO payload;
  IF payload IS NOT NULL THEN
   RAISE EXCEPTION 'FAIL: shared scores visible after teenager revocation';
  END IF;
 END LOOP;
END $audit$;
RESET ROLE;
ROLLBACK TO SAVEPOINT before_revocation;

-- Membership-epoch scoping: old opt-in cannot authorize current pair.
UPDATE public.personality_share_preferences
 SET joined_at=joined_at-interval '1 day'
 WHERE user_id=current_setting('sec02.teen_id')::uuid
   AND instrument_id='ipip50-sv-v1';
SET LOCAL ROLE authenticated;
DO $audit$
DECLARE uid text; payload jsonb;
BEGIN
 FOREACH uid IN ARRAY array[current_setting('sec02.parent_id'),current_setting('sec02.teen_id')] LOOP
  PERFORM set_config('request.jwt.claims',
    pg_catalog.json_build_object('sub',uid,'role','authenticated')::text,true);
  SELECT public.my_ipip50_shared_profiles() INTO payload;
  IF payload IS NOT NULL THEN
   RAISE EXCEPTION 'FAIL: old membership epoch made scores visible';
  END IF;
 END LOOP;
END $audit$;
RESET ROLE;
ROLLBACK TO SAVEPOINT before_revocation;

-- Exercise the real consent-change RPC, not just a simulated direct UPDATE.
-- False deletes the caller's own consent row, true recreates current-epoch
-- consent after validating all 50 previously saved items.
SET LOCAL ROLE authenticated;
DO $audit$
DECLARE role_label text; caller text; viewer text; consent_result boolean; payload jsonb;
BEGIN
 FOREACH role_label IN ARRAY array['parent_id','teen_id'] LOOP
   caller:=current_setting('sec02.'||role_label);
   PERFORM set_config('request.jwt.claims',
     pg_catalog.json_build_object('sub',caller,'role','authenticated')::text,true);
   SELECT public.set_my_ipip50_share(false) INTO consent_result;
   IF consent_result IS DISTINCT FROM FALSE THEN
     RAISE EXCEPTION 'FAIL: % revoke RPC returned unexpected value',role_label;
   END IF;
   FOREACH viewer IN ARRAY array[current_setting('sec02.parent_id'),current_setting('sec02.teen_id')] LOOP
     PERFORM set_config('request.jwt.claims',
       pg_catalog.json_build_object('sub',viewer,'role','authenticated')::text,true);
     SELECT public.my_ipip50_shared_profiles() INTO payload;
     IF payload IS NOT NULL THEN
       RAISE EXCEPTION 'FAIL: shared data still visible after % RPC revoke',role_label;
     END IF;
   END LOOP;
   PERFORM set_config('request.jwt.claims',
     pg_catalog.json_build_object('sub',caller,'role','authenticated')::text,true);
   SELECT public.set_my_ipip50_share(true) INTO consent_result;
   IF consent_result IS DISTINCT FROM TRUE THEN
     RAISE EXCEPTION 'FAIL: % re-consent RPC did not succeed',role_label;
   END IF;
   FOREACH viewer IN ARRAY array[current_setting('sec02.parent_id'),current_setting('sec02.teen_id')] LOOP
     PERFORM set_config('request.jwt.claims',
       pg_catalog.json_build_object('sub',viewer,'role','authenticated')::text,true);
     SELECT public.my_ipip50_shared_profiles() INTO payload;
     IF payload IS NULL OR pg_catalog.jsonb_array_length(payload->'profiles')<>2 THEN
       RAISE EXCEPTION 'FAIL: shared data not restored after % RPC re-consent',role_label;
     END IF;
   END LOOP;
 END LOOP;
END $audit$;
RESET ROLE;
ROLLBACK TO SAVEPOINT before_revocation;

-- The nested rollbacks restore original consent in the *current transaction*.
DO $audit$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM public.personality_share_preferences
 WHERE instrument_id='ipip50-sv-v1'
 AND user_id IN (current_setting('sec02.parent_id')::uuid,current_setting('sec02.teen_id')::uuid)
 AND share_enabled IS TRUE;
 IF n<>2 THEN RAISE EXCEPTION 'Original opt-ins were not restored'; END IF;
 IF (SELECT count(*)::text FROM public.personality_answers)
    <>current_setting('sec02.legacy_answers') THEN
    RAISE EXCEPTION 'Existing item-answer count changed';
 END IF;
END $audit$;
SELECT 'PASS: 2 positive profiles (five sums only), 2 revocations each hidden from both, old epoch denied; 2 owner RPC revoke/re-consent cycles; rollback restores consent' AS audit;
ROLLBACK;
