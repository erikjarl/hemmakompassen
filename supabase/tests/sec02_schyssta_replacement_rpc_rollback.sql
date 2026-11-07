-- SEC-02 / INT-02: real Schyssta replacement RPC + retirement trigger.
-- No permanent changes: ONE transaction, all new synthetic agreements rolled back.
-- Uses existing users only with simulated request.jwt.claims, not signed Auth.
BEGIN;
SELECT set_config('audit.parent',(SELECT user_id::text FROM public.family_members WHERE role='parent' LIMIT 1),true);
SELECT set_config('audit.teen',(SELECT user_id::text FROM public.family_members WHERE role='teen' LIMIT 1),true);
SELECT set_config('audit.outsider',(SELECT id::text FROM auth.users u WHERE NOT EXISTS
 (SELECT 1 FROM public.family_members m WHERE m.user_id=u.id) ORDER BY created_at LIMIT 1),true);
SELECT set_config('audit.base_rules',(SELECT count(*)::text FROM public.agreements),true);
SELECT set_config('audit.base_votes',(SELECT count(*)::text FROM public.agreement_approvals),true);
SELECT set_config('audit.base_notices',(SELECT count(*)::text FROM public.schyssta_notifications),true);
SET LOCAL ROLE authenticated;
DO $test$
DECLARE
 parent_user text:=current_setting('audit.parent');
 teen_user text:=current_setting('audit.teen');
 outsider_user text:=current_setting('audit.outsider');
 original uuid; replacement uuid; duplicate uuid; abandoned uuid; second_original uuid;
 req_key uuid:=gen_random_uuid(); rejected boolean; status_value text; n integer; caller text;
BEGIN
 IF parent_user IS NULL OR teen_user IS NULL OR outsider_user IS NULL THEN
   RAISE EXCEPTION 'Three test identities required';
 END IF;
 -- Parent creates a temporary rule, both approve using actual RPCs.
 PERFORM set_config('request.jwt.claims',json_build_object('sub',parent_user,'role','authenticated')::text,true);
 SELECT public.propose_manual_schyssta_rule('SEC02 temporary original house rule',gen_random_uuid()) INTO original;
 PERFORM public.set_schyssta_rule_decision(original,true);
 PERFORM set_config('request.jwt.claims',json_build_object('sub',teen_user,'role','authenticated')::text,true);
 PERFORM public.set_schyssta_rule_decision(original,true);
 SELECT a.status INTO status_value FROM public.my_manual_schyssta_rules() a WHERE a.agreement_id=original;
 IF status_value IS DISTINCT FROM 'accepted' THEN RAISE EXCEPTION 'Original did not reach accepted'; END IF;
 -- A pending replacement is NOT accepted; original must remain accepted.
 SELECT public.propose_schyssta_change(original,'SEC02 revised house rule requires separate consent',req_key) INTO replacement;
 SELECT public.propose_schyssta_change(original,'SEC02 revised house rule requires separate consent',req_key) INTO duplicate;
 IF replacement IS NULL OR replacement<>duplicate THEN RAISE EXCEPTION 'Idempotency failed'; END IF;
 rejected:=false;
 BEGIN
   PERFORM public.propose_schyssta_change(original,'SEC02 changed body on reused request key',req_key);
 EXCEPTION WHEN unique_violation THEN rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'Changed body reused request key'; END IF;
 rejected:=false;
 BEGIN
   PERFORM public.propose_schyssta_change(original,'SEC02 another simultaneous replacement',gen_random_uuid());
 EXCEPTION WHEN unique_violation THEN rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'Second pending replacement allowed'; END IF;
 SELECT a.status INTO status_value FROM public.my_manual_schyssta_rules() a WHERE a.agreement_id=original;
 IF status_value IS DISTINCT FROM 'accepted' THEN RAISE EXCEPTION 'Pending change retired original'; END IF;
 -- Each member sees only the replacement link for this temporary rule.
 FOREACH caller IN ARRAY array[parent_user,teen_user] LOOP
   PERFORM set_config('request.jwt.claims',json_build_object('sub',caller,'role','authenticated')::text,true);
   SELECT count(*) INTO n FROM public.my_schyssta_replacement_links() l
    WHERE l.agreement_id=replacement AND l.replaces_agreement_id=original;
   IF n<>1 THEN RAISE EXCEPTION 'Replacement link invisible to paired member'; END IF;
 END LOOP;
 -- Outsider sees neither rule/link and cannot approve.
 PERFORM set_config('request.jwt.claims',json_build_object('sub',outsider_user,'role','authenticated')::text,true);
 SELECT count(*) INTO n FROM public.my_schyssta_replacement_links() l WHERE l.agreement_id=replacement;
 IF n<>0 THEN RAISE EXCEPTION 'Replacement link leaks outside pairing'; END IF;
 rejected:=false;
 BEGIN PERFORM public.set_schyssta_rule_decision(replacement,true);
 EXCEPTION WHEN insufficient_privilege THEN rejected:=true; END;
 IF NOT rejected THEN RAISE EXCEPTION 'Outsider approved replacement'; END IF;
 -- Teen alone approves pending change: still proposed; original still accepted.
 PERFORM set_config('request.jwt.claims',json_build_object('sub',teen_user,'role','authenticated')::text,true);
 PERFORM public.set_schyssta_rule_decision(replacement,true);
 SELECT a.status INTO status_value FROM public.my_manual_schyssta_rules() a WHERE a.agreement_id=replacement;
 IF status_value IS DISTINCT FROM 'proposed' THEN RAISE EXCEPTION 'One vote accepted revised wording'; END IF;
 SELECT a.status INTO status_value FROM public.my_manual_schyssta_rules() a WHERE a.agreement_id=original;
 IF status_value IS DISTINCT FROM 'accepted' THEN RAISE EXCEPTION 'One revised vote retired original'; END IF;
 -- Parent approves: trigger retires original and history retains it.
 PERFORM set_config('request.jwt.claims',json_build_object('sub',parent_user,'role','authenticated')::text,true);
 PERFORM public.set_schyssta_rule_decision(replacement,true);
 SELECT a.status INTO status_value FROM public.my_manual_schyssta_rules() a WHERE a.agreement_id=replacement;
 IF status_value IS DISTINCT FROM 'accepted' THEN RAISE EXCEPTION 'Double approval did not accept revised wording'; END IF;
 SELECT count(*) INTO n FROM public.my_manual_schyssta_rules() a WHERE a.agreement_id=original;
 IF n<>0 THEN RAISE EXCEPTION 'Original still active after replacement'; END IF;
 SELECT count(*) INTO n FROM public.my_schyssta_rule_history() h WHERE h.agreement_id=original;
 IF n<>1 THEN RAISE EXCEPTION 'Replaced original not in history'; END IF;
 -- Additional scenario: declined replacement cannot archive original.
 SELECT public.propose_manual_schyssta_rule('SEC02 temporary original decline rule',gen_random_uuid()) INTO second_original;
 PERFORM public.set_schyssta_rule_decision(second_original,true);
 PERFORM set_config('request.jwt.claims',json_build_object('sub',teen_user,'role','authenticated')::text,true);
 PERFORM public.set_schyssta_rule_decision(second_original,true);
 SELECT public.propose_schyssta_change(second_original,'SEC02 declined replacement stays inactive',gen_random_uuid()) INTO abandoned;
 PERFORM public.set_schyssta_rule_decision(abandoned,false);
 SELECT a.status INTO status_value FROM public.my_manual_schyssta_rules() a WHERE a.agreement_id=abandoned;
 IF status_value IS DISTINCT FROM 'rejected' THEN RAISE EXCEPTION 'Declined replacement not rejected'; END IF;
 SELECT a.status INTO status_value FROM public.my_manual_schyssta_rules() a WHERE a.agreement_id=second_original;
 IF status_value IS DISTINCT FROM 'accepted' THEN RAISE EXCEPTION 'Rejected change retired original'; END IF;
END $test$;
RESET ROLE;
SELECT 'PASS: real replacement RPC, idempotency, one-vote pending, two-vote replacement retirement, outsider denial, rejection preserves old; ROLLBACK' AS audit;
ROLLBACK;
