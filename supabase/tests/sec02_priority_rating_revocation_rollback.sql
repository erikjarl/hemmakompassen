-- SEC-02 / SW-03: revocation when an explicitly shared teen priority changes.
-- Existing answers, ratings and shares are NEVER overwritten: general-11
-- must have existing mutual JA+JA but no teen rating/share. All temporary writes
-- inside BEGIN/ROLLBACK. Claims are simulated; NOT signed Supabase Auth.
BEGIN;
SELECT set_config('audit.teen',(SELECT user_id::text FROM public.family_members WHERE role='teen' LIMIT 1),true);
SELECT set_config('audit.parent',(SELECT user_id::text FROM public.family_members WHERE role='parent' LIMIT 1),true);
SELECT set_config('audit.outsider',(SELECT u.id::text FROM auth.users u
 WHERE NOT EXISTS(SELECT 1 FROM public.family_members m WHERE m.user_id=u.id) LIMIT 1),true);
DO $pre$
BEGIN
 IF current_setting('audit.teen',true) IS NULL OR current_setting('audit.parent',true) IS NULL
 OR current_setting('audit.outsider',true) IS NULL THEN RAISE EXCEPTION 'No baseline identities'; END IF;
 IF EXISTS(SELECT 1 FROM public.swipe_importance
  WHERE user_id=current_setting('audit.teen')::uuid AND deck_id='general' AND card_id='general-11')
 OR EXISTS(SELECT 1 FROM public.swipe_priority_shares
  WHERE user_id=current_setting('audit.teen')::uuid AND deck_id='general' AND card_id='general-11')
 THEN RAISE EXCEPTION 'Refuse to alter existing importance or sharing'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.swipe_answers a
  JOIN public.swipe_answers b ON b.deck_id=a.deck_id AND b.card_id=a.card_id
  WHERE a.user_id=current_setting('audit.teen')::uuid AND b.user_id=current_setting('audit.parent')::uuid
  AND a.deck_id='general' AND a.card_id='general-11'
  AND a.answer IS TRUE AND b.answer IS TRUE)
 THEN RAISE EXCEPTION 'Mutual true answer baseline not present'; END IF;
END $pre$;

-- Create a *new*, disposable rating; existing answers are read-only.
INSERT INTO public.swipe_importance(user_id,deck_id,card_id,importance)
VALUES(current_setting('audit.teen')::uuid,'general','general-11',1);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',pg_catalog.json_build_object(
 'sub',current_setting('audit.teen'),'role','authenticated')::text,true);
SELECT public.set_swipe_priority_share('general','general-11',true);
DO $check$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.shared_swipe_priorities('general') WHERE card_id='general-11')
 THEN RAISE EXCEPTION 'Explicit teen share not visible'; END IF;
END $check$;

-- The real DB trigger must delete consent when rating drops from 1 to 0.
RESET ROLE;
UPDATE public.swipe_importance SET importance=0
WHERE user_id=current_setting('audit.teen')::uuid AND deck_id='general' AND card_id='general-11';
SET LOCAL ROLE authenticated;
DO $check$
BEGIN
 IF EXISTS(SELECT 1 FROM public.shared_swipe_priorities('general') WHERE card_id='general-11')
 THEN RAISE EXCEPTION 'Priority persisted after importance change'; END IF;
END $check$;

-- Returning to important must NOT silently recreate withdrawn consent.
RESET ROLE;
UPDATE public.swipe_importance SET importance=1
WHERE user_id=current_setting('audit.teen')::uuid AND deck_id='general' AND card_id='general-11';
SET LOCAL ROLE authenticated;
DO $check$
BEGIN
 IF EXISTS(SELECT 1 FROM public.shared_swipe_priorities('general') WHERE card_id='general-11')
 THEN RAISE EXCEPTION 'Consent resurrected automatically after importance restored'; END IF;
END $check$;

-- Explicit new teen opt-in works; deleting the temporary rating revokes again.
SELECT public.set_swipe_priority_share('general','general-11',true);
RESET ROLE;
DELETE FROM public.swipe_importance
WHERE user_id=current_setting('audit.teen')::uuid AND deck_id='general' AND card_id='general-11';
SET LOCAL ROLE authenticated;
DO $check$
BEGIN
 IF EXISTS(SELECT 1 FROM public.shared_swipe_priorities('general') WHERE card_id='general-11')
 THEN RAISE EXCEPTION 'Priority visible after rating removed'; END IF;
END $check$;
RESET ROLE;
SELECT 'PASS: temporary rating share; 1->0 auto-revokes, 0->1 does not resurrect, explicit re-opt-in required, DELETE revokes; full rollback' AS audit;
ROLLBACK;
