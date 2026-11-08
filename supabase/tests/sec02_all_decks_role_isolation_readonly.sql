-- SEC-02 / INT-01 / SW-03: real Supabase RPC reads under simulated parent,
-- teen and unpaired identities. NO signed Auth, no writes, full rollback.
BEGIN;
SELECT set_config('audit.parent',(SELECT m.user_id::text FROM public.family_members m
  WHERE m.role='parent' AND (SELECT count(*) FROM public.family_members x WHERE x.family_id=m.family_id)=2 LIMIT 1),true);
SELECT set_config('audit.teen',(SELECT t.user_id::text FROM public.family_members t
  JOIN public.family_members p ON p.family_id=t.family_id AND p.role='parent'
  WHERE t.role='teen' AND p.user_id::text=current_setting('audit.parent',true) LIMIT 1),true);
SELECT set_config('audit.outsider',(SELECT u.id::text FROM auth.users u
  WHERE NOT EXISTS(SELECT 1 FROM public.family_members m WHERE m.user_id=u.id)
  ORDER BY u.created_at LIMIT 1),true);
SET LOCAL ROLE authenticated;
DO $audit$
DECLARE
 parent_id text:=current_setting('audit.parent',true);
 teen_id text:=current_setting('audit.teen',true);
 outsider_id text:=current_setting('audit.outsider',true);
 deck text; matched_pairs integer:=0;
 parent_matches jsonb; teen_matches jsonb; outsider_matches jsonb;
 parent_priorities jsonb; teen_priorities jsonb; outsider_priorities jsonb;
 parent_b jsonb; teen_b jsonb; outsider_b jsonb;
BEGIN
 IF parent_id IS NULL OR teen_id IS NULL OR outsider_id IS NULL
 THEN RAISE EXCEPTION 'Paired and unpaired test identities required'; END IF;
 FOREACH deck IN ARRAY ARRAY['general','samtal','aktiviteter','regler','uppskattning','aterhamtning','forandring'] LOOP
  PERFORM set_config('request.jwt.claims',pg_catalog.json_build_object('sub',parent_id,'role','authenticated')::text,true);
  SELECT coalesce(pg_catalog.jsonb_agg(s.card_id ORDER BY s.card_id),'[]'::jsonb)
    INTO parent_matches FROM public.shared_swipe_matches(deck) s;
  SELECT coalesce(pg_catalog.jsonb_agg(s.card_id ORDER BY s.card_id),'[]'::jsonb)
    INTO parent_priorities FROM public.shared_swipe_priorities(deck) s;
  PERFORM set_config('request.jwt.claims',pg_catalog.json_build_object('sub',teen_id,'role','authenticated')::text,true);
  SELECT coalesce(pg_catalog.jsonb_agg(s.card_id ORDER BY s.card_id),'[]'::jsonb)
    INTO teen_matches FROM public.shared_swipe_matches(deck) s;
  SELECT coalesce(pg_catalog.jsonb_agg(s.card_id ORDER BY s.card_id),'[]'::jsonb)
    INTO teen_priorities FROM public.shared_swipe_priorities(deck) s;
  PERFORM set_config('request.jwt.claims',pg_catalog.json_build_object('sub',outsider_id,'role','authenticated')::text,true);
  SELECT coalesce(pg_catalog.jsonb_agg(s.card_id ORDER BY s.card_id),'[]'::jsonb)
    INTO outsider_matches FROM public.shared_swipe_matches(deck) s;
  SELECT coalesce(pg_catalog.jsonb_agg(s.card_id ORDER BY s.card_id),'[]'::jsonb)
    INTO outsider_priorities FROM public.shared_swipe_priorities(deck) s;
  IF parent_matches IS DISTINCT FROM teen_matches OR parent_priorities IS DISTINCT FROM teen_priorities
  THEN RAISE EXCEPTION 'Paired roles disagree on %',deck; END IF;
  IF outsider_matches <> '[]'::jsonb OR outsider_priorities <> '[]'::jsonb
  THEN RAISE EXCEPTION 'Unpaired user saw results for %',deck; END IF;
  matched_pairs:=matched_pairs+pg_catalog.jsonb_array_length(parent_matches);
 END LOOP;
 IF matched_pairs<1 THEN RAISE EXCEPTION 'No positive matched cards: this regression must exercise nonempty data'; END IF;
 PERFORM set_config('request.jwt.claims',pg_catalog.json_build_object('sub',parent_id,'role','authenticated')::text,true);
 SELECT coalesce(pg_catalog.jsonb_agg(s.card_id ORDER BY s.card_id),'[]'::jsonb)
   INTO parent_b FROM public.shared_understanding_cards() s;
 PERFORM set_config('request.jwt.claims',pg_catalog.json_build_object('sub',teen_id,'role','authenticated')::text,true);
 SELECT coalesce(pg_catalog.jsonb_agg(s.card_id ORDER BY s.card_id),'[]'::jsonb)
   INTO teen_b FROM public.shared_understanding_cards() s;
 PERFORM set_config('request.jwt.claims',pg_catalog.json_build_object('sub',outsider_id,'role','authenticated')::text,true);
 SELECT coalesce(pg_catalog.jsonb_agg(s.card_id ORDER BY s.card_id),'[]'::jsonb)
   INTO outsider_b FROM public.shared_understanding_cards() s;
 IF parent_b IS DISTINCT FROM teen_b OR outsider_b <> '[]'::jsonb
 THEN RAISE EXCEPTION 'B-card share isolation failed'; END IF;
 RAISE NOTICE 'PASS: % positive mutual YES matches across all decks; outsider sees zero',matched_pairs;
END $audit$;
RESET ROLE;
SELECT 'PASS: 7-deck match/priority RPC isolation and B-share RPC role parity; read-only full rollback' AS audit;
ROLLBACK;
