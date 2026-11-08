-- P0 SW-03: positive priority sharing and withdrawal of EITHER partner's YES.
-- SIMULATED JWT claims, NOT real Auth. Every test row is disposable (ROLLBACK).
BEGIN;
SELECT set_config('audit.parent',(SELECT user_id::text FROM public.family_members WHERE role='parent' LIMIT 1),true);
SELECT set_config('audit.teen',(SELECT user_id::text FROM public.family_members WHERE role='teen' LIMIT 1),true);
SELECT set_config('audit.outsider',(SELECT u.id::text FROM auth.users u
 WHERE NOT EXISTS(SELECT 1 FROM public.family_members m WHERE m.user_id=u.id) LIMIT 1),true);
DO $pre$
DECLARE p uuid:=current_setting('audit.parent',true)::uuid;
 t uuid:=current_setting('audit.teen',true)::uuid;
BEGIN
 IF p IS NULL OR t IS NULL OR current_setting('audit.outsider',true) IS NULL
 OR NOT EXISTS(SELECT 1 FROM public.family_members a JOIN public.family_members b
  ON a.family_id=b.family_id WHERE a.user_id=p AND b.user_id=t)
 THEN RAISE EXCEPTION 'Exact pair and outsider required'; END IF;
 IF EXISTS(SELECT 1 FROM public.swipe_answers WHERE deck_id='aktiviteter'
  AND card_id='aktiviteter-104' AND user_id IN(p,t))
 OR EXISTS(SELECT 1 FROM public.swipe_importance WHERE deck_id='aktiviteter'
  AND card_id='aktiviteter-104' AND user_id IN(p,t))
 OR EXISTS(SELECT 1 FROM public.swipe_priority_shares WHERE deck_id='aktiviteter'
  AND card_id='aktiviteter-104' AND user_id IN(p,t))
 THEN RAISE EXCEPTION 'Existing audit card content must never be changed'; END IF;
END $pre$;
INSERT INTO public.swipe_answers(user_id,deck_id,card_id,answer)
VALUES(current_setting('audit.parent')::uuid,'aktiviteter','aktiviteter-104',true),
      (current_setting('audit.teen')::uuid,'aktiviteter','aktiviteter-104',true);
INSERT INTO public.swipe_importance(user_id,deck_id,card_id,importance)
VALUES(current_setting('audit.teen')::uuid,'aktiviteter','aktiviteter-104',1);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',pg_catalog.json_build_object('sub',current_setting('audit.teen'),'role','authenticated')::text,true);
SELECT public.set_swipe_priority_share('aktiviteter','aktiviteter-104',true);
DO $assert$
DECLARE identity_id text; n integer;
BEGIN
 FOREACH identity_id IN ARRAY array[current_setting('audit.parent'),current_setting('audit.teen')] LOOP
  PERFORM set_config('request.jwt.claims',pg_catalog.json_build_object('sub',identity_id,'role','authenticated')::text,true);
  SELECT count(*) INTO n FROM public.shared_swipe_priorities('aktiviteter') WHERE card_id='aktiviteter-104';
  IF n<>1 THEN RAISE EXCEPTION 'Shared priority not visible to both consenting pair roles'; END IF;
 END LOOP;
 PERFORM set_config('request.jwt.claims',pg_catalog.json_build_object('sub',current_setting('audit.outsider'),'role','authenticated')::text,true);
 IF EXISTS(SELECT 1 FROM public.shared_swipe_priorities('aktiviteter') WHERE card_id='aktiviteter-104')
 THEN RAISE EXCEPTION 'Outsider saw priority'; END IF;
END $assert$;
RESET ROLE;
UPDATE public.swipe_answers SET answer=false WHERE user_id=current_setting('audit.teen')::uuid
 AND deck_id='aktiviteter' AND card_id='aktiviteter-104';
SET LOCAL ROLE authenticated;
DO $assert$
DECLARE identity_id text;
BEGIN
 FOREACH identity_id IN ARRAY array[current_setting('audit.parent'),current_setting('audit.teen')] LOOP
  PERFORM set_config('request.jwt.claims',pg_catalog.json_build_object('sub',identity_id,'role','authenticated')::text,true);
  IF EXISTS(SELECT 1 FROM public.shared_swipe_priorities('aktiviteter') WHERE card_id='aktiviteter-104')
  THEN RAISE EXCEPTION 'Teen NO did not revoke priority'; END IF;
 END LOOP;
END $assert$;
RESET ROLE;
UPDATE public.swipe_answers SET answer=true WHERE user_id=current_setting('audit.teen')::uuid
 AND deck_id='aktiviteter' AND card_id='aktiviteter-104';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',pg_catalog.json_build_object('sub',current_setting('audit.teen'),'role','authenticated')::text,true);
DO $assert$
BEGIN
 IF EXISTS(SELECT 1 FROM public.shared_swipe_priorities('aktiviteter') WHERE card_id='aktiviteter-104')
 THEN RAISE EXCEPTION 'Teen YES restored revoked consent'; END IF;
END $assert$;
SELECT public.set_swipe_priority_share('aktiviteter','aktiviteter-104',true);
RESET ROLE;
UPDATE public.swipe_answers SET answer=false WHERE user_id=current_setting('audit.parent')::uuid
 AND deck_id='aktiviteter' AND card_id='aktiviteter-104';
SET LOCAL ROLE authenticated;
DO $assert$
DECLARE identity_id text;
BEGIN
 FOREACH identity_id IN ARRAY array[current_setting('audit.parent'),current_setting('audit.teen')] LOOP
  PERFORM set_config('request.jwt.claims',pg_catalog.json_build_object('sub',identity_id,'role','authenticated')::text,true);
  IF EXISTS(SELECT 1 FROM public.shared_swipe_priorities('aktiviteter') WHERE card_id='aktiviteter-104')
  THEN RAISE EXCEPTION 'Parent NO did not revoke priority'; END IF;
 END LOOP;
END $assert$;
RESET ROLE;
UPDATE public.swipe_answers SET answer=true WHERE user_id=current_setting('audit.parent')::uuid
 AND deck_id='aktiviteter' AND card_id='aktiviteter-104';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',pg_catalog.json_build_object('sub',current_setting('audit.teen'),'role','authenticated')::text,true);
DO $assert$
BEGIN
 IF EXISTS(SELECT 1 FROM public.shared_swipe_priorities('aktiviteter') WHERE card_id='aktiviteter-104')
 THEN RAISE EXCEPTION 'Parent YES restored revoked consent'; END IF;
END $assert$;
RESET ROLE;
SELECT 'PASS: temporary YES+YES, teen NO and parent NO revoke shared priority, YES cannot resurrect revoked consent, outsider denied, full rollback' AS audit;
ROLLBACK;