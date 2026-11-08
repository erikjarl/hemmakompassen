-- INT-02 SEC-02 versioned card rules, isolated temporary agreement. All writes rollback.
-- Uses simulated request.jwt.claims with authenticated SQL role, NOT signed JWT.
BEGIN;
SELECT set_config('audit.parent',(SELECT m.user_id::text FROM public.family_members m
  WHERE m.role='parent' AND (SELECT count(*) FROM public.family_members f WHERE f.family_id=m.family_id)=2
  ORDER BY m.joined_at LIMIT 1),true);
SELECT set_config('audit.teen',(SELECT t.user_id::text FROM public.family_members t
  JOIN public.family_members p ON p.family_id=t.family_id AND p.role='parent'
  WHERE t.role='teen' AND p.user_id::text=current_setting('audit.parent',true)
  LIMIT 1),true);
DO $setup$
DECLARE aid uuid;
BEGIN
 IF current_setting('audit.parent',true) IS NULL OR current_setting('audit.teen',true) IS NULL
 THEN RAISE EXCEPTION 'No paired parent/teen test identities available'; END IF;
 INSERT INTO public.agreements(family_id,proposed_by,body,status,source_deck_id,source_card_id,
   paired_parent_id,paired_teen_id,paired_parent_joined_at,paired_teen_joined_at,agreement_version)
 SELECT p.family_id,p.user_id,'SEC-02 temporary versioned card consent check','proposed',
   'regler','sec02-ephemeral-version-audit',p.user_id,t.user_id,p.joined_at,t.joined_at,1
 FROM public.family_members p JOIN public.family_members t ON p.family_id=t.family_id
 WHERE p.user_id=current_setting('audit.parent')::uuid
   AND t.user_id=current_setting('audit.teen')::uuid
 RETURNING id INTO aid;
 IF aid IS NULL THEN RAISE EXCEPTION 'Temporary agreement creation failed'; END IF;
 PERFORM set_config('audit.agreement',aid::text,true);
END $setup$;
SET LOCAL ROLE authenticated;
DO $verify$
DECLARE aid uuid:=current_setting('audit.agreement')::uuid;
  pa text:=current_setting('audit.parent');te text:=current_setting('audit.teen');
  row_state record;
BEGIN
 PERFORM set_config('request.jwt.claims',pg_catalog.json_build_object('sub',pa,'role','authenticated')::text,true);
 PERFORM public.set_schyssta_rule_decision(aid,true);
 PERFORM set_config('request.jwt.claims',pg_catalog.json_build_object('sub',te,'role','authenticated')::text,true);
 PERFORM public.set_schyssta_rule_decision(aid,true);
 SELECT r.status,r.parent_decision,r.teen_decision INTO row_state
 FROM public.my_schyssta_rules() r WHERE r.agreement_id=aid;
 IF row_state.status IS DISTINCT FROM 'accepted'
   OR row_state.parent_decision IS DISTINCT FROM true OR row_state.teen_decision IS DISTINCT FROM true
 THEN RAISE EXCEPTION 'Expected current-version 1 YES+YES'; END IF;
END $verify$;
RESET ROLE;
-- Only change the newly created test agreement. Never existing rules/answers.
UPDATE public.agreements SET agreement_version=2,status='proposed'
 WHERE id=current_setting('audit.agreement')::uuid;
SET LOCAL ROLE authenticated;
DO $verify$
DECLARE aid uuid:=current_setting('audit.agreement')::uuid;
  pa text:=current_setting('audit.parent');te text:=current_setting('audit.teen');
  row_state record; role_user text;
BEGIN
 FOREACH role_user IN ARRAY array[pa,te] LOOP
  PERFORM set_config('request.jwt.claims',pg_catalog.json_build_object('sub',role_user,'role','authenticated')::text,true);
  SELECT r.status,r.own_decision,r.parent_decision,r.teen_decision INTO row_state
  FROM public.my_schyssta_rules() r WHERE r.agreement_id=aid;
  IF row_state.status IS DISTINCT FROM 'proposed'
    OR row_state.own_decision IS NOT NULL
    OR row_state.parent_decision IS NOT NULL OR row_state.teen_decision IS NOT NULL
  THEN RAISE EXCEPTION 'Stale version 1 votes visible to %: %,%,%,%',
   role_user,row_state.status,row_state.own_decision,row_state.parent_decision,row_state.teen_decision; END IF;
 END LOOP;
 PERFORM set_config('request.jwt.claims',pg_catalog.json_build_object('sub',pa,'role','authenticated')::text,true);
 PERFORM public.set_schyssta_rule_decision(aid,true);
 SELECT r.status,r.parent_decision,r.teen_decision INTO row_state
 FROM public.my_schyssta_rules() r WHERE r.agreement_id=aid;
 IF row_state.status IS DISTINCT FROM 'proposed'
    OR row_state.parent_decision IS DISTINCT FROM true OR row_state.teen_decision IS NOT NULL
 THEN RAISE EXCEPTION 'One new-version yes must show only parent yes'; END IF;
 PERFORM set_config('request.jwt.claims',pg_catalog.json_build_object('sub',te,'role','authenticated')::text,true);
 PERFORM public.set_schyssta_rule_decision(aid,false);
 SELECT r.status,r.parent_decision,r.teen_decision INTO row_state
 FROM public.my_schyssta_rules() r WHERE r.agreement_id=aid;
 IF row_state.status IS DISTINCT FROM 'rejected'
   OR row_state.parent_decision IS DISTINCT FROM true OR row_state.teen_decision IS DISTINCT FROM false
 THEN RAISE EXCEPTION 'A current-version no must reject, with only current votes displayed'; END IF;
END $verify$;
RESET ROLE;
SELECT 'PASS: Schyssta card votes scoped to active version in both roles; temporary data rolled back' audit;
ROLLBACK;
