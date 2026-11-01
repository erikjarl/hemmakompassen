-- Disposable, authenticated-user pgTAP regression for transaction-linked inbox events.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select plan(17);
insert into auth.users(id,email) values
 ('55000000-0000-0000-0000-000000000001','notify-parent-a@example.invalid'),
 ('55000000-0000-0000-0000-000000000002','notify-teen-a@example.invalid'),
 ('56000000-0000-0000-0000-000000000001','notify-parent-b@example.invalid'),
 ('56000000-0000-0000-0000-000000000002','notify-teen-b@example.invalid');
insert into public.families(id) values
 ('f5000000-0000-0000-0000-000000000000'),
 ('f6000000-0000-0000-0000-000000000000');
insert into public.family_members(family_id,user_id,role) values
 ('f5000000-0000-0000-0000-000000000000','55000000-0000-0000-0000-000000000001','parent'),
 ('f5000000-0000-0000-0000-000000000000','55000000-0000-0000-0000-000000000002','teen'),
 ('f6000000-0000-0000-0000-000000000000','56000000-0000-0000-0000-000000000001','parent'),
 ('f6000000-0000-0000-0000-000000000000','56000000-0000-0000-0000-000000000002','teen');

select has_table('public','schyssta_notifications','event table exists');
select has_function('public','my_schyssta_notifications',array[]::text[],'inbox RPC exists');
select has_function('public','mark_schyssta_notification_read',array['uuid'],'read receipt RPC exists');
select is(has_table_privilege('authenticated','public.schyssta_notifications','select'),false,'no browser table reads');
select is(has_function_privilege('anon','public.my_schyssta_notifications()','execute'),false,'anonymous inbox disabled');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"55000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select lives_ok(
 $$select public.propose_manual_schyssta_rule('Vi frågar innan vi lånar saker.','55000000-0000-0000-0000-000000000011')$$,
 'parent can create rule and transactional event');
select is_empty($$select * from public.my_schyssta_notifications()$$,
 'author does not receive own proposal as an incoming message');

set local role postgres;
select set_config('test.notify_id',(select n.id::text from public.schyssta_notifications n limit 1),true);
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"55000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
select results_eq(
 $$select kind,body,read_at from public.my_schyssta_notifications()$$,
 $$values ('rule_proposed'::text,'Vi frågar innan vi lånar saker.'::text,null::timestamptz)$$,
 'teen has one unread proposal event with no private IDs in payload');
select lives_ok(
 $$select public.mark_schyssta_notification_read(current_setting('test.notify_id')::uuid)$$,
 'recipient can mark own notification as read');
select is(
 (select count(*)::integer from public.my_schyssta_notifications() where read_at is not null),
 1,'read receipt is recipient-specific and saved');

select set_config('request.jwt.claims','{"sub":"56000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select is_empty($$select * from public.my_schyssta_notifications()$$,
 'unrelated family cannot see notification');
select throws_ok(
 $$select public.mark_schyssta_notification_read(current_setting('test.notify_id')::uuid)$$,
 '42501','notification unavailable','unrelated family cannot mark notification');

select set_config('request.jwt.claims','{"sub":"55000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select throws_ok(
 $$select public.mark_schyssta_notification_read(current_setting('test.notify_id')::uuid)$$,
 '42501','notification unavailable','sender cannot mark recipient read status');
select lives_ok(
 $$select public.set_schyssta_rule_decision((select agreement_id from public.my_manual_schyssta_rules()),true)$$,
 'sender explicitly approves without message side effects');
select set_config('request.jwt.claims','{"sub":"55000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
select lives_ok(
 $$select public.set_schyssta_rule_decision((select agreement_id from public.my_manual_schyssta_rules()),true)$$,
 'second YES accepts rule and sends event');
select set_config('request.jwt.claims','{"sub":"55000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select is(
 (select count(*)::integer from public.my_schyssta_notifications() where kind='rule_accepted'),
 1,'the second approval delivers a new event to counterpart');

set local role postgres;
update public.family_members set joined_at=joined_at+interval '1 second'
 where family_id='f5000000-0000-0000-0000-000000000000' and role='teen';
set local role authenticated;
select is_empty($$select * from public.my_schyssta_notifications()$$,
 'old notification history is hidden after re-pairing');
rollback;
