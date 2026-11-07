-- SEC-02 / SW-03: positive priority-sharing lifecycle in a rollback transaction.
-- Simulated PostgreSQL JWT claims; NOT signed Supabase Auth sessions.
-- Strictly abort if either existing paired user has data on the selected test card.
-- Entire transaction is rolled back; never update or delete historical answers.
BEGIN;
DO $pre$
DECLARE p uuid; t uuid; f uuid; n integer;
BEGIN
 SELECT family_id INTO f FROM public.family_members GROUP BY family_id
 HAVING count(*)=2 AND count(*) FILTER(WHERE role='parent')=1
 AND count(*) FILTER(WHERE role='teen')=1 LIMIT 1;
 SELECT user_id INTO p FROM public.family_members WHERE family_id=f AND role='parent';
 SELECT user_id INTO t FROM public.family_members WHERE family_id=f AND role='teen';
 IF p IS NULL OR t IS NULL THEN RAISE EXCEPTION 'Required pair absent'; END IF;
 SELECT count(*) INTO n FROM (
  SELECT user_id FROM public.swipe_answers WHERE deck_id='aterhamtning' AND card_id='aterhamtning-01'
  UNION ALL SELECT user_id FROM public.swipe_importance WHERE deck_id='aterhamtning' AND card_id='aterhamtning-01'
  UNION ALL SELECT user_id FROM public.swipe_priority_shares WHERE deck_id='aterhamtning' AND card_id='aterhamtning-01'
  UNION ALL SELECT user_id FROM public.swipe_skips WHERE deck_id='aterhamtning' AND card_id='aterhamtning-01'
 ) x WHERE user_id IN(p,t);
 IF n<>0 THEN RAISE EXCEPTION 'Preexisting data, refusing to modify'; END IF;
 PERFORM set_config('sec02.parent',p::text,true);
 PERFORM set_config('sec02.teen',t::text,true);
END $pre$;
SET LOCAL ROLE authenticated;
DO $audit$
DECLARE n integer; uid text;
BEGIN
 uid:=current_setting('sec02.parent');
 PERFORM set_config('request.jwt.claims',pg_catalog.json_build_object('sub',uid,'role','authenticated')::text,true);
 INSERT INTO public.swipe_answers(user_id,deck_id,card_id,answer)
 VALUES(uid::uuid,'aterhamtning','aterhamtning-01',true);
 SELECT count(*) INTO n FROM public.shared_swipe_priorities('aterhamtning') WHERE card_id='aterhamtning-01';
 IF n<>0 THEN RAISE EXCEPTION 'Visible with only one JA'; END IF;
 uid:=current_setting('sec02.teen');
 PERFORM set_config('request.jwt.claims',pg_catalog.json_build_object('sub',uid,'role','authenticated')::text,true);
 INSERT INTO public.swipe_answers(user_id,deck_id,card_id,answer)
 VALUES(uid::uuid,'aterhamtning','aterhamtning-01',true);
 INSERT INTO public.swipe_importance(user_id,deck_id,card_id,importance)
 VALUES(uid::uuid,'aterhamtning','aterhamtning-01',1);
 SELECT count(*) INTO n FROM public.shared_swipe_priorities('aterhamtning') WHERE card_id='aterhamtning-01';
 IF n<>0 THEN RAISE EXCEPTION 'Visible without consent'; END IF;
 PERFORM public.set_swipe_priority_share('aterhamtning','aterhamtning-01',true);
 SELECT count(*) INTO n FROM public.shared_swipe_priorities('aterhamtning') WHERE card_id='aterhamtning-01';
 IF n<>1 THEN RAISE EXCEPTION 'Teen does not see shared priority'; END IF;
 uid:=current_setting('sec02.parent');
 PERFORM set_config('request.jwt.claims',pg_catalog.json_build_object('sub',uid,'role','authenticated')::text,true);
 SELECT count(*) INTO n FROM public.shared_swipe_priorities('aterhamtning') WHERE card_id='aterhamtning-01';
 IF n<>1 THEN RAISE EXCEPTION 'Parent does not see shared priority'; END IF;
 -- Parent may call revoke(false) for own account but must not remove teen's consent.
 PERFORM public.set_swipe_priority_share('aterhamtning','aterhamtning-01',false);
 SELECT count(*) INTO n FROM public.shared_swipe_priorities('aterhamtning') WHERE card_id='aterhamtning-01';
 IF n<>1 THEN RAISE EXCEPTION 'Parent action affected teen share'; END IF;
 uid:=current_setting('sec02.teen');
 PERFORM set_config('request.jwt.claims',pg_catalog.json_build_object('sub',uid,'role','authenticated')::text,true);
 PERFORM public.set_swipe_priority_share('aterhamtning','aterhamtning-01',false);
 SELECT count(*) INTO n FROM public.shared_swipe_priorities('aterhamtning') WHERE card_id='aterhamtning-01';
 IF n<>0 THEN RAISE EXCEPTION 'Revoked priority still visible'; END IF;
 PERFORM public.set_swipe_priority_share('aterhamtning','aterhamtning-01',true);
 UPDATE public.swipe_importance SET importance=0 WHERE user_id=uid::uuid
 AND deck_id='aterhamtning' AND card_id='aterhamtning-01';
 SELECT count(*) INTO n FROM public.shared_swipe_priorities('aterhamtning') WHERE card_id='aterhamtning-01';
 IF n<>0 THEN RAISE EXCEPTION 'Priority reduction did not hide result'; END IF;
 RAISE NOTICE 'PASS: mutual YES, explicit share, parent visibility, parent cannot revoke, teen revocation, priority reduction';
END $audit$;
RESET ROLE;
SELECT 'PASS: positive and negative priority consent checks, transaction rollback' AS result;
ROLLBACK;
