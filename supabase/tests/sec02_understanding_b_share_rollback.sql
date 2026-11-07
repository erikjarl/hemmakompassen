-- SEC-02 / INT-01: B understanding-card opt-in and revocation.
-- Live database, SIMULATED authenticated JWT claims, NOT real signed sessions.
-- Uses existing true/false answers; no swipe answer is changed.
-- All mutations are rolled back, including explicit teenage opt-in.
BEGIN;
SELECT set_config('audit.teen',(SELECT m.user_id::text FROM public.family_members m
 WHERE m.role='teen' AND (SELECT count(*) FROM public.family_members x WHERE x.family_id=m.family_id)=2 LIMIT 1),true);
SELECT set_config('audit.parent',(SELECT m.user_id::text FROM public.family_members m
 WHERE m.role='parent' AND (SELECT count(*) FROM public.family_members x WHERE x.family_id=m.family_id)=2 LIMIT 1),true);
SELECT set_config('audit.outsider',(SELECT u.id::text FROM auth.users u
 WHERE NOT EXISTS (SELECT 1 FROM public.family_members m WHERE m.user_id=u.id)
 ORDER BY u.created_at LIMIT 1),true);
SELECT set_config('audit.answers_before',(SELECT count(*)::text FROM public.swipe_answers),true);
SELECT set_config('audit.skips_before',(SELECT count(*)::text FROM public.swipe_skips),true);
SELECT set_config('audit.shares_before',(SELECT count(*)::text FROM public.understanding_card_shares),true);
DO $test$
BEGIN
 IF current_setting('audit.teen',true) IS NULL
   OR current_setting('audit.parent',true) IS NULL
   OR current_setting('audit.outsider',true) IS NULL
 THEN RAISE EXCEPTION 'Missing baseline accounts'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.swipe_answers
   WHERE user_id=current_setting('audit.teen')::uuid AND deck_id='general'
     AND card_id='general-03' AND answer IS TRUE)
 OR NOT EXISTS(SELECT 1 FROM public.swipe_answers
   WHERE user_id=current_setting('audit.teen')::uuid AND deck_id='general'
     AND card_id='general-02' AND answer IS FALSE)
 THEN RAISE EXCEPTION 'Required existing B-card answer baseline not present'; END IF;
 IF EXISTS(SELECT 1 FROM public.understanding_card_shares
   WHERE user_id=current_setting('audit.teen')::uuid
   AND deck_id='general' AND card_id IN ('general-03','general-02'))
 THEN RAISE EXCEPTION 'Expected no existing share on audit cards'; END IF;
END $test$;
SAVEPOINT before_share;
SET LOCAL ROLE authenticated;
DO $test$
DECLARE caller text; n integer; was_denied boolean;
BEGIN
 -- Without explicit opt-in, both paired users must see zero B cards.
 FOREACH caller IN ARRAY array[current_setting('audit.parent'),current_setting('audit.teen')] LOOP
  PERFORM set_config('request.jwt.claims',
    pg_catalog.json_build_object('sub',caller,'role','authenticated')::text,true);
  SELECT count(*) INTO n FROM public.shared_understanding_cards()
    WHERE card_id='general-03';
  IF n<>0 THEN RAISE EXCEPTION 'FAIL: B card appears before teen consent'; END IF;
 END LOOP;
 -- The parent cannot grant consent on a teenage B card.
 PERFORM set_config('request.jwt.claims',
   pg_catalog.json_build_object('sub',current_setting('audit.parent'),'role','authenticated')::text,true);
 was_denied:=false;
 BEGIN
  PERFORM public.set_understanding_card_share('general-03',true);
 EXCEPTION WHEN insufficient_privilege THEN was_denied:=true;
 END;
 IF NOT was_denied THEN RAISE EXCEPTION 'FAIL: parent can grant teen B consent'; END IF;
 -- A false teenage answer is ineligible for sharing.
 PERFORM set_config('request.jwt.claims',
   pg_catalog.json_build_object('sub',current_setting('audit.teen'),'role','authenticated')::text,true);
 was_denied:=false;
 BEGIN
  PERFORM public.set_understanding_card_share('general-02',true);
 EXCEPTION WHEN insufficient_privilege THEN was_denied:=true;
 END;
 IF NOT was_denied THEN RAISE EXCEPTION 'FAIL: false B answer can be shared'; END IF;
 -- Explicit opt-in by teenage owner: both paired users now see this B card.
 PERFORM public.set_understanding_card_share('general-03',true);
 FOREACH caller IN ARRAY array[current_setting('audit.parent'),current_setting('audit.teen')] LOOP
  PERFORM set_config('request.jwt.claims',
    pg_catalog.json_build_object('sub',caller,'role','authenticated')::text,true);
  SELECT count(*) INTO n FROM public.shared_understanding_cards()
    WHERE deck_id='general' AND card_id='general-03';
  IF n<>1 THEN RAISE EXCEPTION 'FAIL: authorized B share not visible to paired user'; END IF;
 END LOOP;
 -- Outside family cannot read the teenager's B card.
 PERFORM set_config('request.jwt.claims',
   pg_catalog.json_build_object('sub',current_setting('audit.outsider'),'role','authenticated')::text,true);
 SELECT count(*) INTO n FROM public.shared_understanding_cards()
    WHERE card_id='general-03';
 IF n<>0 THEN RAISE EXCEPTION 'FAIL: B share leaks to outsider'; END IF;
 -- Parent cannot revoke consent on behalf of teenager.
 PERFORM set_config('request.jwt.claims',
   pg_catalog.json_build_object('sub',current_setting('audit.parent'),'role','authenticated')::text,true);
 PERFORM public.set_understanding_card_share('general-03',false);
 SELECT count(*) INTO n FROM public.shared_understanding_cards()
    WHERE card_id='general-03';
 IF n<>1 THEN RAISE EXCEPTION 'FAIL: parent removed teenage share'; END IF;
 -- Teen alone can revoke; both lose visibility instantly in RPC.
 PERFORM set_config('request.jwt.claims',
   pg_catalog.json_build_object('sub',current_setting('audit.teen'),'role','authenticated')::text,true);
 PERFORM public.set_understanding_card_share('general-03',false);
 FOREACH caller IN ARRAY array[current_setting('audit.parent'),current_setting('audit.teen')] LOOP
  PERFORM set_config('request.jwt.claims',
    pg_catalog.json_build_object('sub',caller,'role','authenticated')::text,true);
  SELECT count(*) INTO n FROM public.shared_understanding_cards()
    WHERE card_id='general-03';
  IF n<>0 THEN RAISE EXCEPTION 'FAIL: revoked B card still visible'; END IF;
 END LOOP;
END $test$;
RESET ROLE;
ROLLBACK TO SAVEPOINT before_share;
DO $test$
BEGIN
 IF (SELECT count(*)::text FROM public.swipe_answers) <> current_setting('audit.answers_before')
 OR (SELECT count(*)::text FROM public.swipe_skips) <> current_setting('audit.skips_before')
 OR (SELECT count(*)::text FROM public.understanding_card_shares) <> current_setting('audit.shares_before')
 THEN RAISE EXCEPTION 'FAIL: test left modified application counts'; END IF;
END $test$;
SELECT 'PASS: B sharing requires teen true answer and explicit opt-in; paired see, outsider denied, parent cannot revoke, teen revocation hides; rollback' AS audit;
ROLLBACK;
