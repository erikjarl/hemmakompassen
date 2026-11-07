-- SEC-02 / SW-03: read-only negative-authorization audit for shared priorities.
-- Simulated request.jwt.claims are NOT actual signed Supabase Auth sessions.
-- Requires one existing correctly paired parent+teen and one unrelated account.
-- Uses transaction READ ONLY: no existing answers, consents or pairing altered.
BEGIN TRANSACTION READ ONLY;
SELECT set_config('sec02.parent',(SELECT m.user_id::text FROM public.family_members m JOIN
 (SELECT family_id FROM public.family_members GROUP BY family_id HAVING count(*)=2
 AND count(*) FILTER (WHERE role='parent')=1
 AND count(*) FILTER (WHERE role='teen')=1) pair USING(family_id)
 WHERE m.role='parent' LIMIT 1),true);
SELECT set_config('sec02.teen',(SELECT m.user_id::text FROM public.family_members m JOIN
 (SELECT family_id FROM public.family_members GROUP BY family_id HAVING count(*)=2
 AND count(*) FILTER (WHERE role='parent')=1
 AND count(*) FILTER (WHERE role='teen')=1) pair USING(family_id)
 WHERE m.role='teen' LIMIT 1),true);
SELECT set_config('sec02.outsider',(SELECT u.id::text FROM auth.users u WHERE NOT EXISTS
 (SELECT 1 FROM public.family_members m WHERE m.user_id=u.id)
 ORDER BY u.created_at,u.id LIMIT 1),true);
SET LOCAL ROLE authenticated;
DO $audit$
DECLARE deck text; who text; identity text; n integer; missing_own integer;
 parent_cards text[]; teen_cards text[]; total_shared integer:=0;
BEGIN
 IF coalesce(current_setting('sec02.parent',true),'')='' OR
    coalesce(current_setting('sec02.teen',true),'')='' OR
    coalesce(current_setting('sec02.outsider',true),'')='' THEN
  RAISE EXCEPTION 'Required preexisting paired accounts and outsider unavailable';
 END IF;
 FOREACH deck IN ARRAY ARRAY['general','samtal','aktiviteter','regler','uppskattning','aterhamtning','forandring'] LOOP
  FOREACH who IN ARRAY ARRAY['parent','teen','outsider'] LOOP
   identity:=current_setting('sec02.'||who,true);
   PERFORM set_config('request.jwt.claims',
    pg_catalog.json_build_object('sub',identity,'role','authenticated')::text,true);
   IF who='parent' THEN
    SELECT coalesce(array_agg(card_id ORDER BY card_id),ARRAY[]::text[])
     INTO parent_cards FROM public.shared_swipe_priorities(deck);
    total_shared:=total_shared+cardinality(parent_cards);
   ELSIF who='teen' THEN
    SELECT coalesce(array_agg(card_id ORDER BY card_id),ARRAY[]::text[])
     INTO teen_cards FROM public.shared_swipe_priorities(deck);
   ELSE
    SELECT count(*) INTO n FROM public.shared_swipe_priorities(deck);
    IF n<>0 THEN RAISE EXCEPTION 'Outsider could read % entries for deck %',n,deck; END IF;
   END IF;
   IF who IN ('parent','teen') THEN
    SELECT count(*) INTO missing_own FROM public.shared_swipe_priorities(deck) s
    WHERE NOT EXISTS (SELECT 1 FROM public.swipe_answers a
     WHERE a.user_id=identity::uuid AND a.deck_id=s.deck_id
     AND a.card_id=s.card_id AND a.answer IS TRUE);
    IF missing_own<>0 THEN
     RAISE EXCEPTION 'Shared result missing own YES for role % / deck %',who,deck;
    END IF;
   END IF;
  END LOOP;
  IF parent_cards IS DISTINCT FROM teen_cards THEN
    RAISE EXCEPTION 'Parent/teen result mismatch in %',deck;
  END IF;
 END LOOP;
 PERFORM set_config('request.jwt.claims','{"role":"authenticated"}',true);
 BEGIN
  PERFORM * FROM public.shared_swipe_priorities('general');
  RAISE EXCEPTION 'Missing-subject call unexpectedly succeeded';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 RAISE NOTICE 'PASS read-only negative audit; total existing shared entries: %',total_shared;
 IF total_shared=0 THEN
  RAISE NOTICE 'NO POSITIVE COVERAGE: no existing shared priority to verify visibility';
 END IF;
END $audit$;
RESET ROLE;
SELECT 'PASS: 7 decks, paired equality / outsider zero / no subject rejected. Simulated claims only.' AS audit_result;
ROLLBACK;
