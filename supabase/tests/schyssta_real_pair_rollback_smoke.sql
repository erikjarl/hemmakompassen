-- Read this before use.
-- Live database INTEGRATION SMOKE TEST using the current test pairing's UUIDs.
-- It simulates auth.uid() via request.jwt.claims and authenticated SQL role;
-- it does NOT prove a real web browser can sign in to either account.
-- Entire procedure runs inside BEGIN ... ROLLBACK; no swajpsvar or
-- existing proposals/agreements are edited. Do not remove ROLLBACK.
-- Requires exactly two family_members (one parent + one teen in same family).
BEGIN;
SELECT set_config('test.parent',(SELECT user_id::text FROM public.family_members WHERE role='parent' LIMIT 1),true);
SELECT set_config('test.teen',(SELECT user_id::text FROM public.family_members WHERE role='teen' LIMIT 1),true);
DO $$
BEGIN
  IF (SELECT count(*) FROM public.family_members)<>2 OR
    (SELECT count(distinct family_id) FROM public.family_members)<>1 THEN
    RAISE EXCEPTION 'Expected one existing two-person test pairing';
  END IF;
END $$;
SELECT set_config('request.jwt.claims',format('{"sub":"%s","role":"authenticated"}',current_setting('test.parent')),true);
SET LOCAL ROLE authenticated;
SELECT set_config('test.newrule',public.propose_manual_schyssta_rule('Tillfällig testregel - återställs via ROLLBACK',gen_random_uuid())::text,true);
DO $$ BEGIN
  IF (SELECT count(*) FROM public.my_manual_schyssta_rules()
    WHERE agreement_id=current_setting('test.newrule')::uuid
      AND status='proposed' AND own_decision IS NULL)<>1 THEN
    RAISE EXCEPTION 'Proposal was already approved or unavailable';
  END IF;
END $$;
SET LOCAL ROLE postgres;
SELECT set_config('request.jwt.claims',format('{"sub":"%s","role":"authenticated"}',current_setting('test.teen')),true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  IF (SELECT count(*) FROM public.my_schyssta_notifications()
    WHERE agreement_id=current_setting('test.newrule')::uuid
      AND kind='rule_proposed' AND read_at IS NULL)<>1 THEN
    RAISE EXCEPTION 'Recipient has no unread proposal notification';
  END IF;
END $$;
SELECT public.mark_schyssta_notification_read((SELECT notification_id FROM public.my_schyssta_notifications()
  WHERE agreement_id=current_setting('test.newrule')::uuid));
SELECT public.set_schyssta_rule_decision(current_setting('test.newrule')::uuid,true);
DO $$ BEGIN
  IF (SELECT count(*) FROM public.my_manual_schyssta_rules()
    WHERE agreement_id=current_setting('test.newrule')::uuid AND status='proposed')<>1 THEN
    RAISE EXCEPTION 'One YES improperly accepted a rule';
  END IF;
END $$;
SET LOCAL ROLE postgres;
SELECT set_config('request.jwt.claims',format('{"sub":"%s","role":"authenticated"}',current_setting('test.parent')),true);
SET LOCAL ROLE authenticated;
SELECT public.set_schyssta_rule_decision(current_setting('test.newrule')::uuid,true);
DO $$ BEGIN
  IF (SELECT count(*) FROM public.my_manual_schyssta_rules()
    WHERE agreement_id=current_setting('test.newrule')::uuid AND status='accepted')<>1 THEN
    RAISE EXCEPTION 'Two YES votes did not accept the rule';
  END IF;
END $$;
SELECT set_config('test.change',public.propose_schyssta_change(current_setting('test.newrule')::uuid,
  'Ändrad tillfällig testregel - båda behöver säga ja',gen_random_uuid())::text,true);
DO $$ BEGIN
  IF (SELECT count(*) FROM public.my_manual_schyssta_rules()
    WHERE agreement_id=current_setting('test.newrule')::uuid AND status='accepted')<>1 THEN
    RAISE EXCEPTION 'Old agreement was prematurely replaced';
  END IF;
END $$;
SELECT public.set_schyssta_rule_decision(current_setting('test.change')::uuid,true);
SET LOCAL ROLE postgres;
SELECT set_config('request.jwt.claims',format('{"sub":"%s","role":"authenticated"}',current_setting('test.teen')),true);
SET LOCAL ROLE authenticated;
SELECT public.set_schyssta_rule_decision(current_setting('test.change')::uuid,true);
DO $$ BEGIN
  IF (SELECT count(*) FROM public.my_manual_schyssta_rules()
    WHERE agreement_id=current_setting('test.change')::uuid AND status='accepted')<>1 THEN
    RAISE EXCEPTION 'Change did not receive both approvals';
  END IF;
END $$;
SELECT public.withdraw_schyssta_rule(current_setting('test.change')::uuid);
DO $$ BEGIN
  IF (SELECT count(*) FROM public.my_schyssta_rule_history()
    WHERE agreement_id=current_setting('test.change')::uuid)<>1 THEN
    RAISE EXCEPTION 'Withdrawn agreement not present in history';
  END IF;
END $$;
ROLLBACK;
SELECT 'SUCCESS: rollback integration test passed; no test changes persisted' AS result;
