-- pgTAP: an agreed rule stays current until both accept its replacement.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select plan(18);

insert into auth.users(id,email) values
 ('57000000-0000-0000-0000-000000000001','replacement-parent-a@example.invalid'),
 ('57000000-0000-0000-0000-000000000002','replacement-teen-a@example.invalid'),
 ('58000000-0000-0000-0000-000000000001','replacement-parent-b@example.invalid'),
 ('58000000-0000-0000-0000-000000000002','replacement-teen-b@example.invalid');
insert into public.families(id) values
 ('f7000000-0000-0000-0000-000000000000'),
 ('f8000000-0000-0000-0000-000000000000');
insert into public.family_members(family_id,user_id,role) values
 ('f7000000-0000-0000-0000-000000000000','57000000-0000-0000-0000-000000000001','parent'),
 ('f7000000-0000-0000-0000-000000000000','57000000-0000-0000-0000-000000000002','teen'),
 ('f8000000-0000-0000-0000-000000000000','58000000-0000-0000-0000-000000000001','parent'),
 ('f8000000-0000-0000-0000-000000000000','58000000-0000-0000-0000-000000000002','teen');

select has_function('public','propose_schyssta_change',array['uuid','text','uuid'],'change proposal RPC');
select has_function('public','my_schyssta_replacement_links',array[]::text[],'change link RPC');
select is(has_function_privilege('anon','public.propose_schyssta_change(uuid,text,uuid)','execute'),false,'anonymous user cannot edit');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"57000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select lives_ok(
 $$select public.propose_manual_schyssta_rule('Vi knackar innan vi går in.','57000000-0000-0000-0000-000000000011')$$,
 'parent proposes original');
select lives_ok(
 $$select public.set_schyssta_rule_decision(
   (select agreement_id from public.my_manual_schyssta_rules()),true)$$,
 'parent approves original');

select set_config('request.jwt.claims','{"sub":"57000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
select lives_ok(
 $$select public.set_schyssta_rule_decision(
   (select agreement_id from public.my_manual_schyssta_rules()),true)$$,
 'teen approves original');
select is(
 (select count(*)::integer from public.my_manual_schyssta_rules() where status='accepted'),
 1,'original rule is now agreed');
select lives_ok(
 $$select public.propose_schyssta_change(
  (select agreement_id from public.my_manual_schyssta_rules() where status='accepted'),
  'Vi knackar och frågar innan vi går in.',
  '57000000-0000-0000-0000-000000000012')$$,
 'teen proposes an amendment with a separate pending agreement');
select is(
 (select count(*)::integer from public.my_manual_schyssta_rules() where status='accepted'),
 1,'original remains accepted while change pending');
select is(
 (select count(*)::integer from public.my_schyssta_replacement_links()),
 1,'server returns one family-safe replacement link');
select is(
 (select count(*)::integer from public.my_manual_schyssta_rules() where status='proposed' and own_decision is null),
 1,'amendment is not implicitly approved');
select throws_ok(
 $$select public.propose_schyssta_change(
  (select agreement_id from public.my_manual_schyssta_rules() where status='accepted'),
  'Ett annat konkurrerande ändringsförslag',
  '57000000-0000-0000-0000-000000000013')$$,
 '23505','a replacement is already pending','duplicate simultaneous replacement blocked');

set local role postgres;
select set_config('test.original_id',
  (select id::text from public.agreements where request_key='57000000-0000-0000-0000-000000000011'),true);
select set_config('test.replacement_id',
  (select id::text from public.agreements where request_key='57000000-0000-0000-0000-000000000012'),true);
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"58000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select is_empty($$select * from public.my_schyssta_replacement_links()$$,
 'other family cannot see replacement link');
select throws_ok(
 $$select public.propose_schyssta_change(
  current_setting('test.original_id')::uuid,
  'En otillåten ändring från en annan familj',
  '58000000-0000-0000-0000-000000000011')$$,
 '42501','original accepted rule unavailable','other family cannot propose changes');

select set_config('request.jwt.claims','{"sub":"57000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select lives_ok(
 $$select public.set_schyssta_rule_decision(current_setting('test.replacement_id')::uuid,true)$$,
 'parent approves new wording');
select is(
 (select count(*)::integer from public.my_manual_schyssta_rules() where status='accepted'),
 1,'one vote on replacement does not supersede original');

select set_config('request.jwt.claims','{"sub":"57000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
select lives_ok(
 $$select public.set_schyssta_rule_decision(current_setting('test.replacement_id')::uuid,true)$$,
 'teen approves new wording');
select results_eq(
 $$select body from public.my_manual_schyssta_rules() where status='accepted'$$,
 $$values ('Vi knackar och frågar innan vi går in.'::text)$$,
 'new wording is only accepted rule, old version retired');
rollback;
