-- SEC-02 / SW-03: answer-change revokes prior sharing; explicit new consent required.
-- Uses simulated JWT claims (NOT signed Supabase Auth), and ROLLBACK.
-- Aborts if selected card contains any saved test-pair data.
BEGIN;
DO $pre$
DECLARE f uuid; p uuid; t uuid; n integer;
BEGIN
 SELECT family_id INTO f FROM public.family_members GROUP BY family_id
 HAVING count(*)=2 AND count(*) FILTER(WHERE role='parent')=1
 AND count(*) FILTER(WHERE role='teen')=1 LIMIT 1;
 SELECT user_id INTO p FROM public.family_members WHERE family_id=f AND role='parent';
 SELECT user_id INTO t FROM public.family_members WHERE family_id=f AND role='teen';
 IF p IS NULL OR t IS NULL THEN RAISE EXCEPTION 'No existing paired parent/teen'; END IF;
 SELECT count(*) INTO n FROM (
  SELECT user_id FROM public.swipe_answers WHERE deck_id='aterhamtning' AND card_id='aterhamtning-01'
  UNION ALL SELECT user_id FROM public.swipe_importance WHERE deck_id='aterhamtning' AND card_id='aterhamtning-01'
  UNION ALL SELECT user_id FROM public.swipe_priority_shares WHERE deck_id='aterhamtning' AND card_id='aterhamtning-01'
  UNION ALL SELECT user_id FROM public.swipe_skips WHERE deck_id='aterhamtning' AND card_id='aterhamtning-01'
 ) prior WHERE prior.user_id IN(p,t);
 IF n<>0 THEN RAISE EXCEPTION 'Existing saved data on fixture card; abort'; END IF;
 PERFORM set_config('sec02.parent',p::text,true);
 PERFORM set_config('sec02.teen',t::text,true);
 PERFORM set_config('sec02.outsider',(SELECT u.id::text FROM auth.users u
   WHERE NOT EXISTS (SELECT 1 FROM public.family_members m WHERE m.user_id=u.id)
   ORDER BY u.created_at,u.id LIMIT 1),true);
 IF coalesce(current_setting('sec02.outsider',true),'')='' THEN
   RAISE EXCEPTION 'Required outsider account absent'; END IF;
END $pre$;
SET LOCAL ROLE authenticated;
DO $audit$
DECLARE n integer; p uuid:=current_setting('sec02.parent')::uuid;
 t uuid:=current_setting('sec02.teen')::uuid;
BEGIN
 PERFORM set_config('request.jwt.claims',json_build_object('sub',p,'role','authenticated')::text,true);
 INSERT INTO public.swipe_answers(user_id,deck_id,card_id,answer)
 VALUES (p,'aterhamtning','aterhamtning-01',true);
 PERFORM set_config('request.jwt.claims',json_build_object('sub',t,'role','authenticated')::text,true);
 INSERT INTO public.swipe_answers(user_id,deck_id,card_id,answer)
 VALUES (t,'aterhamtning','aterhamtning-01',true);
 INSERT INTO public.swipe_importance(user_id,deck_id,card_id,importance)
 VALUES (t,'aterhamtning','aterhamtning-01',1);
 PERFORM public.set_swipe_priority_share('aterhamtning','aterhamtning-01',true);
 SELECT count(*) INTO n FROM public.shared_swipe_priorities('aterhamtning')
 WHERE card_id='aterhamtning-01';
 IF n<>1 THEN RAISE EXCEPTION 'Initial explicitly shared fixture not visible'; END IF;
 PERFORM set_config('request.jwt.claims',json_build_object(
   'sub',current_setting('sec02.outsider'),'role','authenticated')::text,true);
 SELECT count(*) INTO n FROM public.shared_swipe_priorities('aterhamtning')
 WHERE card_id='aterhamtning-01';
 IF n<>0 THEN RAISE EXCEPTION 'Outsider saw shared priority'; END IF;
 PERFORM set_config('request.jwt.claims',json_build_object('sub',t,'role','authenticated')::text,true);
 UPDATE public.swipe_answers SET answer=false
 WHERE user_id=t AND deck_id='aterhamtning' AND card_id='aterhamtning-01';
 SELECT count(*) INTO n FROM public.shared_swipe_priorities('aterhamtning')
 WHERE card_id='aterhamtning-01';
 IF n<>0 THEN RAISE EXCEPTION 'Answer NO did not hide priority'; END IF;
 SELECT count(*) INTO n FROM public.swipe_priority_shares
 WHERE user_id=t AND deck_id='aterhamtning' AND card_id='aterhamtning-01';
 IF n<>0 THEN RAISE EXCEPTION 'Old sharing consent still persisted'; END IF;
 UPDATE public.swipe_answers SET answer=true
 WHERE user_id=t AND deck_id='aterhamtning' AND card_id='aterhamtning-01';
 SELECT count(*) INTO n FROM public.shared_swipe_priorities('aterhamtning')
 WHERE card_id='aterhamtning-01';
 IF n<>0 THEN RAISE EXCEPTION 'Changing back to YES resurrected consent'; END IF;
 PERFORM public.set_swipe_priority_share('aterhamtning','aterhamtning-01',true);
 SELECT count(*) INTO n FROM public.shared_swipe_priorities('aterhamtning')
 WHERE card_id='aterhamtning-01';
 IF n<>1 THEN RAISE EXCEPTION 'Explicit renewed consent failed'; END IF;
 PERFORM set_config('request.jwt.claims',json_build_object('sub',p,'role','authenticated')::text,true);
 SELECT count(*) INTO n FROM public.shared_swipe_priorities('aterhamtning')
 WHERE card_id='aterhamtning-01';
 IF n<>1 THEN RAISE EXCEPTION 'Parent cannot see renewed consent'; END IF;
 -- Parent's private answer changing to NO must revoke shared visibility for both.
 UPDATE public.swipe_answers SET answer=false
 WHERE user_id=p AND deck_id='aterhamtning' AND card_id='aterhamtning-01';
 SELECT count(*) INTO n FROM public.shared_swipe_priorities('aterhamtning')
 WHERE card_id='aterhamtning-01';
 IF n<>0 THEN RAISE EXCEPTION 'Parent NO did not hide priority'; END IF;
 UPDATE public.swipe_answers SET answer=true
 WHERE user_id=p AND deck_id='aterhamtning' AND card_id='aterhamtning-01';
 SELECT count(*) INTO n FROM public.shared_swipe_priorities('aterhamtning')
 WHERE card_id='aterhamtning-01';
 IF n<>0 THEN RAISE EXCEPTION 'Parent YES resurrected old consent'; END IF;
 PERFORM set_config('request.jwt.claims',json_build_object('sub',t,'role','authenticated')::text,true);
 PERFORM public.set_swipe_priority_share('aterhamtning','aterhamtning-01',true);
 SELECT count(*) INTO n FROM public.shared_swipe_priorities('aterhamtning')
 WHERE card_id='aterhamtning-01';
 IF n<>1 THEN RAISE EXCEPTION 'Explicit reconsent after parent answer failed'; END IF;
 RAISE NOTICE 'PASS: teen and parent answer NO each revoke share; YES alone stays private; explicit consent restores';
END $audit$;
RESET ROLE;
SELECT 'PASS: priority answer-change revocation with synthetic claims and rollback' AS audit_result;
ROLLBACK;
