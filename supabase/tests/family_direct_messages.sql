-- Disposable pgTAP test of private two-way family messaging.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select plan(24);
insert into auth.users(id,email)values
 ('61000000-0000-0000-0000-000000000001','message-parent-a@example.invalid'),
 ('61000000-0000-0000-0000-000000000002','message-teen-a@example.invalid'),
 ('62000000-0000-0000-0000-000000000001','message-parent-b@example.invalid'),
 ('62000000-0000-0000-0000-000000000002','message-teen-b@example.invalid');
insert into public.families(id)values
 ('f9000000-0000-0000-0000-000000000000'),
 ('fa000000-0000-0000-0000-000000000000');
insert into public.family_members(family_id,user_id,role)values
 ('f9000000-0000-0000-0000-000000000000','61000000-0000-0000-0000-000000000001','parent'),
 ('f9000000-0000-0000-0000-000000000000','61000000-0000-0000-0000-000000000002','teen'),
 ('fa000000-0000-0000-0000-000000000000','62000000-0000-0000-0000-000000000001','parent'),
 ('fa000000-0000-0000-0000-000000000000','62000000-0000-0000-0000-000000000002','teen');

select has_table('public','family_direct_messages','Private messages table exists');
select has_function('public','send_family_message',array['text','uuid'],'Safe send RPC exists');
select has_function('public','my_family_messages',array['timestamp with time zone','uuid'],'Paged messages RPC exists');
select has_function('public','my_family_unread_message_count',array[]::text[],'Unread-count RPC exists');
select has_function('public','mark_family_messages_read',array[]::text[],'Mark read RPC exists');
select is(has_function_privilege('anon','public.send_family_message(text,uuid)','execute'),false,'Anon cannot send');
select is(has_table_privilege('authenticated','public.family_direct_messages','select'),false,'No direct client reads');
select is(has_table_privilege('authenticated','public.family_direct_messages','insert'),false,'No direct client writes');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"61000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select throws_ok(
 $$select public.send_family_message('Hello',null::uuid)$$,
 '22023','message and retry key required','No null request id'
);
select throws_ok(
 $$select public.send_family_message('    ','61000000-0000-0000-0000-000000000011')$$,
 '22023','message must contain 1 to 1500 characters','Blank message prohibited'
);
select lives_ok(
 $$select public.send_family_message('Hej! Hur är det?','61000000-0000-0000-0000-000000000011')$$,
 'Parent can send a private message'
);
select results_eq(
 $$select body,sent_by_me,read_at from public.my_family_messages()$$,
 $$values ('Hej! Hur är det?'::text,true,null::timestamptz)$$,
 'Sender sees own message without read receipt'
);
select is(
 (select message_id from public.my_family_messages()),
 public.send_family_message('Hej! Hur är det?','61000000-0000-0000-0000-000000000011'),
 'Identical retry yields same ID'
);
select throws_ok(
 $$select public.send_family_message('Andra ord','61000000-0000-0000-0000-000000000011')$$,
 '23505','retry key was already used','Same retry key cannot rewrite a message'
);
select is(public.my_family_unread_message_count(),0,'Sender cannot see a received-message count');
select set_config('request.jwt.claims','{"sub":"61000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
select results_eq(
 $$select body,sent_by_me,read_at from public.my_family_messages()$$,
 $$values ('Hej! Hur är det?'::text,false,null::timestamptz)$$,
 'Recipient sees message from the parent as unread'
);
select is(public.my_family_unread_message_count(),1,'Recipient has exactly one unread message');
select is(public.mark_family_messages_read(),1,'Recipient can mark one received message as read');
select is(public.my_family_unread_message_count(),0,'Read message is no longer counted as unread');

select set_config('request.jwt.claims','{"sub":"62000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select is_empty($$select * from public.my_family_messages()$$,'Unrelated family cannot see another family message');
select is(public.mark_family_messages_read(),0,'Unrelated family cannot mark another family message as read');

set local role postgres;
update public.family_members set joined_at=joined_at+interval '1 second'
 where family_id='f9000000-0000-0000-0000-000000000000' and role='teen';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"61000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select is_empty($$select * from public.my_family_messages()$$,'Old pairing messages disappear after membership epoch change');
select throws_ok(
 $$select public.send_family_message('Hej! Hur är det?','61000000-0000-0000-0000-000000000011')$$,
 '23505','retry key was already used','Old retry token cannot resurrect another pairing epoch'
);
select lives_ok(
 $$select public.send_family_message('Nytt parningstillfälle','61000000-0000-0000-0000-000000000012')$$,
 'Re-paired members can create a fresh private message'
);
rollback;
