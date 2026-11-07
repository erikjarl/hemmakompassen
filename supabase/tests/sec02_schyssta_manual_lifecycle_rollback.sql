-- SEC-02 / INT-02: live Schyssta manual agreement lifecycle. Entire transaction rolls back.
-- Uses existing paired identities, but SIMULATED JWT claims (not signed Auth).
-- Never changes existing agreement records or votes. Inserts only an isolated
-- disposable agreement via RPC, and edits only that new ID within transaction.
BEGIN;
SELECT set_config('audit.parent',
 (SELECT m.user_id::text FROM public.family_members m WHERE m.role='parent'
  AND (SELECT count(*) FROM public.family_members fm WHERE fm.family_id=m.family_id)=2 LIMIT 1),true);
SELECT set_config('audit.teen',
 (SELECT m.user_id::text FROM public.family_members m WHERE m.role='teen'
  AND (SELECT count(*) FROM public.family_members fm WHERE fm.family_id=m.family_id)=2 LIMIT 1),true);
SELECT set_config('audit.outsider',
 (SELECT u.id::text FROM auth.users u WHERE NOT EXISTS
  (SELECT 1 FROM public.family_members m WHERE m.user_id=u.id)
  ORDER BY u.created_at,u.id LIMIT 1),true);
SELECT set_config('audit.agreements_before',(SELECT count(*)::text FROM public.agreements),true);
SELECT set_config('audit.approvals_before',(SELECT count(*)::text FROM public.agreement_approvals),true);
SELECT set_config('audit.notifications_before',(SELECT count(*)::text FROM public.schyssta_notifications),true);
SET LOCAL ROLE authenticated;
DO $audit$
DECLARE parent_id text:=current_setting('audit.parent',true);
 teen_id text:=current_setting('audit.teen',true);
 outsider_id text:=current_setting('audit.outsider',true);
 agreement_id uuid; same_id uuid; retry_key uuid:=pg_catalog.gen_random_uuid();
 state text; version integer; votes integer; count_rows integer;
 denied boolean; role_user text; is_owner boolean;
BEGIN
 IF parent_id IS NULL OR teen_id IS NULL OR outsider_id IS NULL
 THEN RAISE EXCEPTION 'Missing required paired and outsider identities'; END IF;
 PERFORM set_config('request.jwt.claims',pg_catalog.json_build_object('sub',parent_id,'role','authenticated')::text,true);
 SELECT public.propose_manual_schyssta_rule('SEC02 transaction-only shared test rule',retry_key) INTO agreement_id;
 IF agreement_id IS NULL THEN RAISE EXCEPTION 'FAIL: proposal returned null'; END IF;
 PERFORM set_config('audit.test_agreement',agreement_id::text,true);
 SELECT r.status,r.agreement_version INTO state,version FROM public.my_manual_schyssta_rules() r WHERE r.agreement_id=current_setting('audit.test_agreement')::uuid;
 IF state<>'proposed' OR version<>1 THEN RAISE EXCEPTION 'FAIL: new proposal state % %',state,version; END IF;
 SELECT public.propose_manual_schyssta_rule('SEC02 transaction-only shared test rule',retry_key) INTO same_id;
 IF same_id<>agreement_id THEN RAISE EXCEPTION 'FAIL: identical retry produced second rule'; END IF;
 denied:=false;
 BEGIN
  PERFORM public.propose_manual_schyssta_rule('SEC02 changed body cannot reuse key',retry_key);
 EXCEPTION WHEN unique_violation THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'FAIL: same key reused with different body'; END IF;
 -- An outsider cannot vote on a family's new rule.
 PERFORM set_config('request.jwt.claims',pg_catalog.json_build_object('sub',outsider_id,'role','authenticated')::text,true);
 denied:=false;
 BEGIN PERFORM public.set_schyssta_rule_decision(agreement_id,true);
 EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'FAIL: outsider vote permitted'; END IF;
 SELECT count(*) INTO count_rows FROM public.my_manual_schyssta_rules() a WHERE a.agreement_id=current_setting('audit.test_agreement')::uuid;
 IF count_rows<>0 THEN RAISE EXCEPTION 'FAIL: outsider sees private rule'; END IF;
 -- One yes is NOT enough: first teen approval, then parent approval.
 PERFORM set_config('request.jwt.claims',pg_catalog.json_build_object('sub',teen_id,'role','authenticated')::text,true);
 PERFORM public.set_schyssta_rule_decision(agreement_id,true);
 SELECT r.status INTO state FROM public.my_manual_schyssta_rules() r WHERE r.agreement_id=current_setting('audit.test_agreement')::uuid;
 IF state<>'proposed' THEN RAISE EXCEPTION 'FAIL: one approval accepted rule'; END IF;
 PERFORM set_config('request.jwt.claims',pg_catalog.json_build_object('sub',parent_id,'role','authenticated')::text,true);
 PERFORM public.set_schyssta_rule_decision(agreement_id,true);
 SELECT r.status INTO state FROM public.my_manual_schyssta_rules() r WHERE r.agreement_id=current_setting('audit.test_agreement')::uuid;
 IF state<>'accepted' THEN RAISE EXCEPTION 'FAIL: two explicit approvals not accepted'; END IF;

END $audit$;
RESET ROLE;
-- Admin-only edit to the newly inserted, disposable test agreement.
UPDATE public.agreements SET agreement_version=2,status='proposed'
 WHERE id=current_setting('audit.test_agreement')::uuid;
SET LOCAL ROLE authenticated;
DO $audit$
DECLARE parent_id text:=current_setting('audit.parent');
 teen_id text:=current_setting('audit.teen');
 outsider_id text:=current_setting('audit.outsider');
 agreement_id uuid:=current_setting('audit.test_agreement')::uuid;
 state text; count_rows integer; denied boolean; role_user text;
BEGIN
 FOREACH role_user IN ARRAY array[parent_id,teen_id] LOOP
  PERFORM set_config('request.jwt.claims',pg_catalog.json_build_object('sub',role_user,'role','authenticated')::text,true);
  SELECT status INTO state FROM public.my_manual_schyssta_rules() r WHERE r.agreement_id=current_setting('audit.test_agreement')::uuid;
  IF state<>'proposed' THEN RAISE EXCEPTION 'FAIL: stale approvals accepted version 2'; END IF;
 END LOOP;
 PERFORM set_config('request.jwt.claims',pg_catalog.json_build_object('sub',teen_id,'role','authenticated')::text,true);
 PERFORM public.set_schyssta_rule_decision(agreement_id,true);
 SELECT r.status INTO state FROM public.my_manual_schyssta_rules() r WHERE r.agreement_id=current_setting('audit.test_agreement')::uuid;
 IF state<>'proposed' THEN RAISE EXCEPTION 'FAIL: one current-version yes accepted'; END IF;
 PERFORM set_config('request.jwt.claims',pg_catalog.json_build_object('sub',parent_id,'role','authenticated')::text,true);
 PERFORM public.set_schyssta_rule_decision(agreement_id,false);
 SELECT r.status INTO state FROM public.my_manual_schyssta_rules() r WHERE r.agreement_id=current_setting('audit.test_agreement')::uuid;
 IF state<>'rejected' THEN RAISE EXCEPTION 'FAIL: explicit NO not rejected'; END IF;
 -- Replace parent's NO with YES; all votes are now for version 2.
 PERFORM public.set_schyssta_rule_decision(agreement_id,true);
 SELECT r.status INTO state FROM public.my_manual_schyssta_rules() r WHERE r.agreement_id=current_setting('audit.test_agreement')::uuid;
 IF state<>'accepted' THEN RAISE EXCEPTION 'FAIL: parent YES did not accept current version'; END IF;
 -- Withdrawing an accepted rule archives it; should no longer be active.
 PERFORM public.withdraw_schyssta_rule(agreement_id);
 -- The active read RPC deliberately excludes withdrawn rules; verify below
 -- through its absence and the dedicated history RPC, then admin status check.
 SELECT count(*) INTO count_rows FROM public.my_manual_schyssta_rules() a WHERE a.agreement_id=current_setting('audit.test_agreement')::uuid;
 IF count_rows<>0 THEN RAISE EXCEPTION 'FAIL: withdrawn rule appears active'; END IF;
 SELECT count(*) INTO count_rows FROM public.my_schyssta_rule_history() a WHERE a.agreement_id=current_setting('audit.test_agreement')::uuid;
 IF count_rows<>1 THEN RAISE EXCEPTION 'FAIL: withdrawn rule absent from history'; END IF;
 -- Attempted second decision on withdrawn agreement must be rejected.
 denied:=false;
 BEGIN PERFORM public.set_schyssta_rule_decision(agreement_id,true);
 EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'FAIL: withdrawn rule accepts a new vote'; END IF;
END $audit$;
RESET ROLE;
DO $audit$
BEGIN
 IF (SELECT count(*) FROM public.agreements)<=(current_setting('audit.agreements_before'))::integer THEN
  RAISE EXCEPTION 'FAIL: disposable proposal missing before rollback'; END IF;
 IF (SELECT count(*) FROM public.agreement_approvals WHERE agreement_id=current_setting('audit.test_agreement')::uuid AND agreement_version=2)<>2 THEN RAISE EXCEPTION 'FAIL: expected 2 current-version votes'; END IF;
 IF (SELECT status FROM public.agreements WHERE id=current_setting('audit.test_agreement')::uuid)<>'withdrawn' THEN RAISE EXCEPTION 'FAIL: direct admin check not withdrawn'; END IF;
 IF (SELECT count(*) FROM public.schyssta_notifications)<(current_setting('audit.notifications_before'))::integer THEN
  RAISE EXCEPTION 'FAIL: notification count decreased'; END IF;
END $audit$;
SELECT 'PASS: proposal retry, outsider denied, two YES, new version resets, NO rejects, YES recovers, withdraw archives; full rollback' AS audit;
ROLLBACK;
