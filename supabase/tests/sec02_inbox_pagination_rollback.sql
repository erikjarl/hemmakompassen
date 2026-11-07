-- SEC-02 / INT-03: 50+ paginated inbox, same-timestamp tie breaker.
-- Real installed RPCs, simulated JWT identities, NOT signed Auth.
-- 53 disposable messages inside one transaction. Never mark old messages read.
BEGIN;
SELECT set_config('audit.parent',(SELECT user_id::text FROM public.family_members WHERE role='parent' LIMIT 1),true);
SELECT set_config('audit.teen',(SELECT user_id::text FROM public.family_members WHERE role='teen' LIMIT 1),true);
SELECT set_config('audit.outsider',(SELECT u.id::text FROM auth.users u WHERE NOT EXISTS
 (SELECT 1 FROM public.family_members m WHERE m.user_id=u.id) ORDER BY u.created_at LIMIT 1),true);
SELECT set_config('audit.original',(SELECT count(*)::text FROM public.family_direct_messages),true);
SELECT set_config('audit.unread',(SELECT count(*)::text FROM public.family_direct_messages WHERE read_at IS NULL),true);
DO $pre$
BEGIN
 IF current_setting('audit.parent',true) IS NULL
 OR current_setting('audit.teen',true) IS NULL
 OR current_setting('audit.outsider',true) IS NULL THEN
   RAISE EXCEPTION 'Required test account not present';
 END IF;
 IF current_setting('audit.original')::integer<>2 THEN
   RAISE EXCEPTION 'Baseline changed: review test without touching existing messages';
 END IF;
END $pre$;
SET LOCAL ROLE authenticated;
DO $test$
DECLARE
 parent_user text:=current_setting('audit.parent');
 teen_user text:=current_setting('audit.teen');
 outsider text:=current_setting('audit.outsider');
 i integer;
 first_count integer;
 second_count integer;
 overlap_count integer;
 total_count integer;
 cursor_time timestamptz;
 cursor_id uuid;
 first_ids uuid[];
 second_ids uuid[];
 all_ids uuid[];
 n integer;
BEGIN
 -- Send 53 synthetic messages through the actual secured send RPC.
 -- NOW() in the default created_at is transaction-stable, intentionally
 -- yielding identical timestamps: sorting must use (created_at,id).
 PERFORM set_config('request.jwt.claims',
  pg_catalog.json_build_object('sub',parent_user,'role','authenticated')::text,true);
 FOR i IN 1..53 LOOP
  PERFORM public.send_family_message(
    'SEC02 temporary pagination message '||pg_catalog.lpad(i::text,2,'0'),
    pg_catalog.gen_random_uuid()
  );
 END LOOP;
 -- The newest page is limited to 50 even though 55 messages now exist.
 WITH page AS MATERIALIZED (
   SELECT m.message_id,m.created_at FROM public.my_family_messages() m
 )
 SELECT count(*),array_agg(message_id ORDER BY created_at DESC,message_id DESC)
 INTO first_count,first_ids FROM page;
 IF first_count<>50 OR pg_catalog.array_length(first_ids,1)<>50 THEN
  RAISE EXCEPTION 'First page must have exactly 50 rows, got %',first_count;
 END IF;
 -- Determine cursor from the actual 50th row, including UUID tie breaker.
 SELECT m.created_at,m.message_id INTO cursor_time,cursor_id
 FROM public.my_family_messages() m
 ORDER BY m.created_at DESC,m.message_id DESC OFFSET 49 LIMIT 1;
 IF cursor_time IS NULL OR cursor_id IS NULL THEN RAISE EXCEPTION 'Missing cursor'; END IF;
 WITH page AS MATERIALIZED (
   SELECT m.message_id,m.created_at
   FROM public.my_family_messages(cursor_time,cursor_id) m
 )
 SELECT count(*),array_agg(message_id ORDER BY created_at DESC,message_id DESC)
 INTO second_count,second_ids FROM page;
 IF second_count<>5 THEN
  RAISE EXCEPTION 'Second page expected 5 remaining messages, got %',second_count;
 END IF;
 SELECT count(*) INTO overlap_count
 FROM pg_catalog.unnest(first_ids) f
 JOIN pg_catalog.unnest(second_ids) s ON s=f;
 IF overlap_count<>0 THEN RAISE EXCEPTION 'Page boundary produced duplicate IDs'; END IF;
 all_ids:=first_ids||second_ids;
 SELECT count(DISTINCT x) INTO total_count FROM pg_catalog.unnest(all_ids) x;
 IF total_count<>55 THEN
  RAISE EXCEPTION 'Page boundary lost or duplicated messages: %',total_count;
 END IF;
 -- Pagination after the final item returns an empty page.
 SELECT count(*) INTO n FROM public.my_family_messages(
   (SELECT m.created_at FROM public.my_family_messages(cursor_time,cursor_id) m
     ORDER BY m.created_at,m.message_id LIMIT 1),
   (SELECT m.message_id FROM public.my_family_messages(cursor_time,cursor_id) m
     ORDER BY m.created_at,m.message_id LIMIT 1)
 );
 IF n<>0 THEN RAISE EXCEPTION 'Page after oldest message is not empty'; END IF;
 -- Invalid half cursor must not accidentally return full inbox.
 SELECT count(*) INTO n FROM public.my_family_messages(cursor_time,NULL);
 IF n<>0 THEN RAISE EXCEPTION 'Half cursor leaked newest page'; END IF;
 -- The paired teenager gets the same 55 messages and 50+5 paging.
 PERFORM set_config('request.jwt.claims',
  pg_catalog.json_build_object('sub',teen_user,'role','authenticated')::text,true);
 SELECT count(*) INTO n FROM public.my_family_messages();
 IF n<>50 THEN RAISE EXCEPTION 'Teen first page differs from expected 50'; END IF;
 SELECT count(*) INTO n FROM public.my_family_messages(cursor_time,cursor_id);
 IF n<>5 THEN RAISE EXCEPTION 'Teen second page differs from expected 5'; END IF;
 -- Unpaired outsider cannot enumerate page 1 or a known cursor.
 PERFORM set_config('request.jwt.claims',
  pg_catalog.json_build_object('sub',outsider,'role','authenticated')::text,true);
 SELECT count(*) INTO n FROM public.my_family_messages();
 IF n<>0 THEN RAISE EXCEPTION 'Outsider sees first page'; END IF;
 SELECT count(*) INTO n FROM public.my_family_messages(cursor_time,cursor_id);
 IF n<>0 THEN RAISE EXCEPTION 'Outsider sees second page via cursor'; END IF;
END $test$;
RESET ROLE;
DO $post$
BEGIN
 IF (SELECT count(*) FROM public.family_direct_messages) <> current_setting('audit.original')::int+53 THEN
   RAISE EXCEPTION 'Temporary message count wrong before rollback';
 END IF;
 IF (SELECT count(*) FROM public.family_direct_messages WHERE read_at IS NULL)
   <> current_setting('audit.unread')::int+53 THEN
   RAISE EXCEPTION 'Unexpected read receipt changes';
 END IF;
END $post$;
SELECT 'PASS: 53 temporary messages + 2 originals, 50+5 pages with tied timestamps; no duplicates, cursor exhaustion, half-cursor denied, both paired roles, outsider isolated; rollback' AS audit;
ROLLBACK;
