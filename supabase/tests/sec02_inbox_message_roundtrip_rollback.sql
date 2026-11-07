-- SEC-02 / INT-03: inbox round trip, idempotency, receipt, and outsider isolation.
-- Real installed RPCs, simulated authenticated claims; NOT signed Supabase Auth.
-- All messages inserted only within BEGIN/ROLLBACK. Older unread messages
-- must not be changed, even temporarily: only mark recipient 'parent' read,
-- which requires zero pre-existing unread messages in this baseline.
BEGIN;
SELECT set_config('audit.parent',(SELECT user_id::text FROM public.family_members WHERE role='parent' LIMIT 1),true);
SELECT set_config('audit.teen',(SELECT user_id::text FROM public.family_members WHERE role='teen' LIMIT 1),true);
SELECT set_config('audit.outside',(SELECT u.id::text FROM auth.users u WHERE NOT EXISTS
 (SELECT 1 FROM public.family_members fm WHERE fm.user_id=u.id)
 ORDER BY u.created_at,u.id LIMIT 1),true);
SELECT set_config('audit.base_messages',(SELECT count(*)::text FROM public.family_direct_messages),true);
SELECT set_config('audit.base_unread',(SELECT count(*)::text FROM public.family_direct_messages WHERE read_at IS NULL),true);
SELECT set_config('audit.base_parent_unread',(SELECT count(*)::text FROM public.family_direct_messages
 WHERE recipient_id=current_setting('audit.parent')::uuid AND read_at IS NULL),true);
DO $test$
BEGIN
 IF current_setting('audit.parent',true) IS NULL OR current_setting('audit.teen',true) IS NULL
  OR current_setting('audit.outside',true) IS NULL THEN RAISE EXCEPTION 'Three valid baseline identities required'; END IF;
 IF current_setting('audit.base_parent_unread')<>'0' THEN
  RAISE EXCEPTION 'Parent has old unread messages; stop rather than touch historical receipts';
 END IF;
END $test$;
SET LOCAL ROLE authenticated;
DO $test$
DECLARE parent_user text:=current_setting('audit.parent');
 teen_user text:=current_setting('audit.teen');
 outside_user text:=current_setting('audit.outside');
 teen_to_parent uuid; parent_to_teen uuid; duplicate_id uuid;
 request_key uuid:=gen_random_uuid(); rejected boolean;
 n integer; unread_before integer; changed integer; p_msg record;
BEGIN
 -- Outside account must not be allowed to send into current family's inbox.
 PERFORM set_config('request.jwt.claims',json_build_object('sub',outside_user,'role','authenticated')::text,true);
 rejected:=false;
 BEGIN PERFORM public.send_family_message('SEC02 unauthorized message',gen_random_uuid());
 EXCEPTION WHEN insufficient_privilege THEN rejected:=true; END;
 IF NOT rejected THEN RAISE EXCEPTION 'FAIL: outside account sent message'; END IF;
 SELECT count(*) INTO n FROM public.my_family_messages();
 IF n<>0 OR public.my_family_unread_message_count()<>0 THEN
  RAISE EXCEPTION 'FAIL: outside account could access private inbox';
 END IF;
 -- Invalid messages are rejected: blank body and oversized body.
 PERFORM set_config('request.jwt.claims',json_build_object('sub',teen_user,'role','authenticated')::text,true);
 rejected:=false;
 BEGIN PERFORM public.send_family_message('   ',gen_random_uuid());
 EXCEPTION WHEN invalid_parameter_value THEN rejected:=true; END;
 IF NOT rejected THEN RAISE EXCEPTION 'FAIL: whitespace-only body accepted'; END IF;
 rejected:=false;
 BEGIN PERFORM public.send_family_message(repeat('X',1501),gen_random_uuid());
 EXCEPTION WHEN invalid_parameter_value THEN rejected:=true; END;
 IF NOT rejected THEN RAISE EXCEPTION 'FAIL: oversized body accepted'; END IF;
 -- Teen -> parent. A repeated request must reuse the same message id.
 PERFORM set_config('request.jwt.claims',json_build_object('sub',teen_user,'role','authenticated')::text,true);
 SELECT public.send_family_message('SEC02 temporary teen to parent',request_key) INTO teen_to_parent;
 SELECT public.send_family_message('SEC02 temporary teen to parent',request_key) INTO duplicate_id;
 IF teen_to_parent IS NULL OR duplicate_id IS DISTINCT FROM teen_to_parent THEN
  RAISE EXCEPTION 'FAIL: retry duplicated message';
 END IF;
 rejected:=false;
 BEGIN PERFORM public.send_family_message('SEC02 altered retry text',request_key);
 EXCEPTION WHEN unique_violation THEN rejected:=true; END;
 IF NOT rejected THEN RAISE EXCEPTION 'FAIL: same request key accepted altered content'; END IF;
 -- Parent sees an incoming unread message and one unread in count.
 PERFORM set_config('request.jwt.claims',json_build_object('sub',parent_user,'role','authenticated')::text,true);
 SELECT count(*) INTO n FROM public.my_family_messages() m
 WHERE m.message_id=teen_to_parent AND NOT m.sent_by_me AND m.read_at IS NULL;
 IF n<>1 OR public.my_family_unread_message_count()<>1 THEN
  RAISE EXCEPTION 'FAIL: new incoming teen message not counted unread for parent';
 END IF;
 SELECT public.mark_family_messages_read() INTO changed;
 IF changed<>1 OR public.my_family_unread_message_count()<>0 THEN
  RAISE EXCEPTION 'FAIL: parent read receipt did not mark exactly new incoming message';
 END IF;
 SELECT count(*) INTO n FROM public.my_family_messages() m
 WHERE m.message_id=teen_to_parent AND m.read_at IS NOT NULL;
 IF n<>1 THEN RAISE EXCEPTION 'FAIL: marked message still appears unread'; END IF;
 -- Teen sees outgoing message as sent and receipt, with historical unread
 -- count unchanged: parent->teen direction is NOT marked read in this test.
 PERFORM set_config('request.jwt.claims',json_build_object('sub',teen_user,'role','authenticated')::text,true);
 SELECT count(*) INTO n FROM public.my_family_messages() m
 WHERE m.message_id=teen_to_parent AND m.sent_by_me AND m.read_at IS NOT NULL;
 IF n<>1 THEN RAISE EXCEPTION 'FAIL: sender cannot see recipient receipt'; END IF;
 -- Parent -> teen, verify reception and unread count increases by exactly one,
 -- but do not call mark_family_messages_read for the teen (older unread exists).
 PERFORM set_config('request.jwt.claims',json_build_object('sub',parent_user,'role','authenticated')::text,true);
 SELECT public.send_family_message('SEC02 temporary parent to teen',gen_random_uuid()) INTO parent_to_teen;
 IF parent_to_teen IS NULL THEN RAISE EXCEPTION 'FAIL: parent message returned null'; END IF;
 PERFORM set_config('request.jwt.claims',json_build_object('sub',teen_user,'role','authenticated')::text,true);
 SELECT count(*) INTO n FROM public.my_family_messages() m
 WHERE m.message_id=parent_to_teen AND NOT m.sent_by_me AND m.read_at IS NULL;
 IF n<>1 THEN RAISE EXCEPTION 'FAIL: parent message absent from teen inbox'; END IF;
 IF public.my_family_unread_message_count()<>(current_setting('audit.base_unread')::integer + 1) THEN
  RAISE EXCEPTION 'FAIL: teen unread total did not increase by exactly one'; END IF;
END $test$;
RESET ROLE;
SELECT 'PASS: outsider blocked, malformed messages rejected, bidirectional send/receive, retry-key idempotency, parent-only read receipt, teen historical unread untouched; full rollback' AS audit;
ROLLBACK;
