-- SEC-02 / SW-03: positive teen-only priority opt-in/revocation against live Supabase.
-- SIMULATED authenticated claims, not signed Supabase Auth. No existing answers/ratings modified.
BEGIN;
SELECT set_config('audit.parent',(SELECT m.user_id::text FROM public.family_members m WHERE m.role='parent'
  AND (SELECT count(*) FROM public.family_members x WHERE x.family_id=m.family_id)=2 LIMIT 1),true);
SELECT set_config('audit.teen',(SELECT m.user_id::text FROM public.family_members m WHERE m.role='teen'
  AND (SELECT count(*) FROM public.family_members x WHERE x.family_id=m.family_id)=2 LIMIT 1),true);
SELECT set_config('audit.outsider',(SELECT u.id::text FROM auth.users u
  WHERE NOT EXISTS (SELECT 1 FROM public.family_members m WHERE m.user_id=u.id)
  ORDER BY u.created_at LIMIT 1),true);
SELECT set_config('audit.shares_before',(SELECT count(*)::text FROM public.swipe_priority_shares),true);
DO $baseline$
DECLARE teen_id uuid:=current_setting('audit.teen',true)::uuid;
  parent_id uuid:=current_setting('audit.parent',true)::uuid;
BEGIN
 IF teen_id IS NULL OR parent_id IS NULL OR current_setting('audit.outsider',true) IS NULL
 THEN RAISE EXCEPTION 'Paired and unpaired accounts required'; END IF;
 IF NOT EXISTS(
  SELECT 1 FROM public.swipe_importance i
  JOIN public.swipe_answers teen ON teen.user_id=i.user_id AND teen.deck_id=i.deck_id AND teen.card_id=i.card_id
  JOIN public.swipe_answers parent ON parent.user_id=parent_id AND parent.deck_id=i.deck_id AND parent.card_id=i.card_id
  WHERE i.user_id=teen_id AND i.deck_id='general' AND i.card_id='general-08'
    AND i.importance=1 AND teen.answer IS TRUE AND parent.answer IS TRUE
 ) THEN RAISE EXCEPTION 'Required existing eligible JA+JA importance=1 baseline missing'; END IF;
 IF EXISTS(SELECT 1 FROM public.swipe_priority_shares
  WHERE user_id=teen_id AND deck_id='general' AND card_id='general-08')
 THEN RAISE EXCEPTION 'Test would modify an existing consent; abort'; END IF;
END $baseline$;
SET LOCAL ROLE authenticated;
DO $audit$
DECLARE pa text:=current_setting('audit.parent'); te text:=current_setting('audit.teen');
 outsider text:=current_setting('audit.outsider'); caller text;
 count_rows integer; denied boolean;
BEGIN
 -- No opt-in => private rating must not appear to either paired account.
 FOREACH caller IN ARRAY array[pa,te] LOOP
  PERFORM set_config('request.jwt.claims',pg_catalog.json_build_object('sub',caller,'role','authenticated')::text,true);
  SELECT count(*) INTO count_rows FROM public.shared_swipe_priorities('general')
   WHERE card_id='general-08';
  IF count_rows<>0 THEN RAISE EXCEPTION 'FAIL: private rating leaked before explicit teen opt-in'; END IF;
 END LOOP;
 -- Parent and stranger cannot grant teenager's opt-in.
 FOREACH caller IN ARRAY array[pa,outsider] LOOP
  PERFORM set_config('request.jwt.claims',pg_catalog.json_build_object('sub',caller,'role','authenticated')::text,true);
  denied:=false;
  BEGIN PERFORM public.set_swipe_priority_share('general','general-08',true);
  EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'FAIL: non-teen user granted priority consent'; END IF;
 END LOOP;
 PERFORM set_config('request.jwt.claims',pg_catalog.json_build_object('sub',te,'role','authenticated')::text,true);
 PERFORM public.set_swipe_priority_share('general','general-08',true);
 FOREACH caller IN ARRAY array[pa,te] LOOP
  PERFORM set_config('request.jwt.claims',pg_catalog.json_build_object('sub',caller,'role','authenticated')::text,true);
  SELECT count(*) INTO count_rows FROM public.shared_swipe_priorities('general')
   WHERE card_id='general-08';
  IF count_rows<>1 THEN RAISE EXCEPTION 'FAIL: explicit consent missing for paired user'; END IF;
 END LOOP;
 PERFORM set_config('request.jwt.claims',pg_catalog.json_build_object('sub',outsider,'role','authenticated')::text,true);
 SELECT count(*) INTO count_rows FROM public.shared_swipe_priorities('general')
   WHERE card_id='general-08';
 IF count_rows<>0 THEN RAISE EXCEPTION 'FAIL: outsider saw priority'; END IF;
 -- Parent may call revocation, but must not revoke teen-owned consent.
 PERFORM set_config('request.jwt.claims',pg_catalog.json_build_object('sub',pa,'role','authenticated')::text,true);
 PERFORM public.set_swipe_priority_share('general','general-08',false);
 SELECT count(*) INTO count_rows FROM public.shared_swipe_priorities('general')
   WHERE card_id='general-08';
 IF count_rows<>1 THEN RAISE EXCEPTION 'FAIL: parent revoked teenager consent'; END IF;
 -- Teen revocation must hide the previously shared priority for both.
 PERFORM set_config('request.jwt.claims',pg_catalog.json_build_object('sub',te,'role','authenticated')::text,true);
 PERFORM public.set_swipe_priority_share('general','general-08',false);
 FOREACH caller IN ARRAY array[pa,te] LOOP
  PERFORM set_config('request.jwt.claims',pg_catalog.json_build_object('sub',caller,'role','authenticated')::text,true);
  SELECT count(*) INTO count_rows FROM public.shared_swipe_priorities('general')
   WHERE card_id='general-08';
  IF count_rows<>0 THEN RAISE EXCEPTION 'FAIL: revoked priority still visible'; END IF;
 END LOOP;
END $audit$;
RESET ROLE;
DO $finish$
BEGIN
 IF (SELECT count(*) FROM public.swipe_priority_shares)<>current_setting('audit.shares_before')::integer
 THEN RAISE EXCEPTION 'FAIL: consent row count changed'; END IF;
END $finish$;
SELECT 'PASS: teen-only priority opt-in, paired visibility, outsider denied, parent cannot revoke, teen revocation; full rollback' AS audit;
ROLLBACK;
