-- SEC-02 / SW-03: Verify priority-share trigger on a skipped card.
-- Simulated JWT claims, administrative skip INSERT only (NOT a user-level skip flow).
-- The selected card must be unused by both members. ROLLBACK always.
BEGIN;
DO $pre$
DECLARE p uuid; t uuid; f uuid; n int;
BEGIN
 SELECT family_id INTO f FROM public.family_members GROUP BY family_id
 HAVING count(*)=2 AND count(*) FILTER (WHERE role='parent')=1
 AND count(*) FILTER (WHERE role='teen')=1 LIMIT 1;
 SELECT user_id INTO p FROM public.family_members WHERE family_id=f AND role='parent';
 SELECT user_id INTO t FROM public.family_members WHERE family_id=f AND role='teen';
 IF p IS NULL OR t IS NULL THEN RAISE EXCEPTION 'No paired test accounts'; END IF;
 SELECT count(*) INTO n FROM (
  SELECT user_id FROM public.swipe_answers WHERE deck_id='aterhamtning' AND card_id='aterhamtning-01'
  UNION ALL SELECT user_id FROM public.swipe_importance WHERE deck_id='aterhamtning' AND card_id='aterhamtning-01'
  UNION ALL SELECT user_id FROM public.swipe_priority_shares WHERE deck_id='aterhamtning' AND card_id='aterhamtning-01'
  UNION ALL SELECT user_id FROM public.swipe_skips WHERE deck_id='aterhamtning' AND card_id='aterhamtning-01'
 ) existing WHERE user_id IN (p,t);
 IF n<>0 THEN RAISE EXCEPTION 'Fixture card already has saved data; refusing write'; END IF;
 PERFORM set_config('audit.parent',p::text,true);
 PERFORM set_config('audit.teen',t::text,true);
END $pre$;
SET LOCAL ROLE authenticated;
DO $seed$
DECLARE p uuid:=current_setting('audit.parent')::uuid;
 t uuid:=current_setting('audit.teen')::uuid; n int;
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
 IF n<>1 THEN RAISE EXCEPTION 'Could not establish positive test share'; END IF;
END $seed$;
RESET ROLE;
-- Administrative fixture simulates skip-table event; normal authenticated role has no INSERT grant.
INSERT INTO public.swipe_skips(user_id,deck_id,card_id)
 VALUES (current_setting('audit.teen')::uuid,'aterhamtning','aterhamtning-01');
DO $check$
DECLARE n int;
BEGIN
 SELECT count(*) INTO n FROM public.swipe_priority_shares
 WHERE user_id=current_setting('audit.teen')::uuid
 AND deck_id='aterhamtning' AND card_id='aterhamtning-01';
 IF n<>0 THEN RAISE EXCEPTION 'Skip failed to remove stored consent'; END IF;
END $check$;
SET LOCAL ROLE authenticated;
DO $hidden$
DECLARE who uuid; n int;
BEGIN
 FOREACH who IN ARRAY ARRAY[current_setting('audit.teen')::uuid,current_setting('audit.parent')::uuid] LOOP
  PERFORM set_config('request.jwt.claims',json_build_object('sub',who,'role','authenticated')::text,true);
  SELECT count(*) INTO n FROM public.shared_swipe_priorities('aterhamtning')
  WHERE card_id='aterhamtning-01';
  IF n<>0 THEN RAISE EXCEPTION 'Skipped priority visible to family role'; END IF;
 END LOOP;
END $hidden$;
RESET ROLE;
DELETE FROM public.swipe_skips WHERE user_id=current_setting('audit.teen')::uuid
 AND deck_id='aterhamtning' AND card_id='aterhamtning-01';
SET LOCAL ROLE authenticated;
DO $noresurrection$
DECLARE n int;
BEGIN
 PERFORM set_config('request.jwt.claims',json_build_object(
 'sub',current_setting('audit.teen'),'role','authenticated')::text,true);
 SELECT count(*) INTO n FROM public.shared_swipe_priorities('aterhamtning')
 WHERE card_id='aterhamtning-01';
 IF n<>0 THEN RAISE EXCEPTION 'Removing skip resurrected old consent'; END IF;
END $noresurrection$;
RESET ROLE;
SELECT 'PASS: skip trigger removes consent; neither family role sees it; unskip stays private' audit_result;
ROLLBACK;