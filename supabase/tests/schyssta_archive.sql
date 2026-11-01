-- pgTAP: a parent or teen may end an accepted rule, never another family's rule.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select plan(14);
insert into auth.users(id,email) values
 ('59000000-0000-0000-0000-000000000001','archive-parent-a@example.invalid'),
 ('59000000-0000-0000-0000-000000000002','archive-teen-a@example.invalid'),
 ('60000000-0000-0000-0000-000000000001','archive-parent-b@example.invalid'),
 ('60000000-0000-0000-0000-000000000002','archive-teen-b@example.invalid');
insert into public.families(id) values
 ('f9000000-0000-0000-0000-000000000000'),
 ('fa000000-0000-0000-0000-000000000000');
insert into public.family_members(family_id,user_id,role) values
 ('f9000000-0000-0000-0000-000000000000','59000000-0000-0000-0000-000000000001','parent'),
 ('f9000000-0000-0000-0000-000000000000','59000000-0000-0000-0000-000000000002','teen'),
 ('fa000000-0000-0000-0000-000000000000','60000000-0000-0000-0000-000000000001','parent'),
 ('fa000000-0000-0000-0000-000000000000','60000000-0000-0000-0000-000000000002','teen');
select has_function('public','withdraw_schyssta_rule',array['uuid'],'withdraw RPC installed');
select has_function('public','my_schyssta_rule_history',array[]::text[],'history RPC installed');
select is(has_function_privilege('anon','public.my_schyssta_rule_history()','execute'),false,'no anonymous access to history');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"59000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select lives_ok(
 $$select public.propose_manual_schyssta_rule('Vi frågar innan vi lånar saker.','59000000-0000-0000-0000-000000000011')$$,
 'parent can propose rule');
select lives_ok(
 $$select public.set_schyssta_rule_decision((select agreement_id from public.my_manual_schyssta_rules()),true)$$,
 'parent approves');
select set_config('request.jwt.claims','{"sub":"59000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
select lives_ok(
 $$select public.set_schyssta_rule_decision((select agreement_id from public.my_manual_schyssta_rules()),true)$$,
 'teen approves');
select is(
 (select count(*)::integer from public.my_manual_schyssta_rules() where status='accepted'),
 1,'rule was active');
set local role postgres;
select set_config('test.archive_id',(select id::text from public.agreements where request_key='59000000-0000-0000-0000-000000000011'),true);
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"59000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
select lives_ok(
 $$select public.withdraw_schyssta_rule(current_setting('test.archive_id')::uuid)$$,
 'teen can explicitly end rule');
select is_empty($$select * from public.my_manual_schyssta_rules()$$,
 'withdrawn rule no longer treated as current');
select results_eq(
 $$select body from public.my_schyssta_rule_history()$$,
 $$values ('Vi frågar innan vi lånar saker.'::text)$$,
 'the former rule is preserved in pair-only history');
select set_config('request.jwt.claims','{"sub":"59000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select is(
 (select count(*)::integer from public.my_schyssta_notifications() where kind='rule_withdrawn'),
 1,'other person is notified about withdrawal');
select set_config('request.jwt.claims','{"sub":"60000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select is_empty($$select * from public.my_schyssta_rule_history()$$,'other family cannot inspect history');
select throws_ok(
 $$select public.withdraw_schyssta_rule(current_setting('test.archive_id')::uuid)$$,
 '42501','active agreement unavailable','other family cannot end original');
set local role postgres;
update public.family_members set joined_at=joined_at+interval '1 second'
 where family_id='f9000000-0000-0000-0000-000000000000' and role='teen';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"59000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select is_empty($$select * from public.my_schyssta_rule_history()$$,'re-pairing hides previous history');
rollback;
