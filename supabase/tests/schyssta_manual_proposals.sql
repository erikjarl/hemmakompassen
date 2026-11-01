-- Disposable pgTAP checks: manual proposals, two approvals, versions, family isolation.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select plan(21);
insert into auth.users(id,email) values
 ('53000000-0000-0000-0000-000000000001','manual-parent-a@example.invalid'),
 ('53000000-0000-0000-0000-000000000002','manual-teen-a@example.invalid'),
 ('54000000-0000-0000-0000-000000000001','manual-parent-b@example.invalid'),
 ('54000000-0000-0000-0000-000000000002','manual-teen-b@example.invalid');
insert into public.families(id) values
 ('f3000000-0000-0000-0000-000000000000'),
 ('f4000000-0000-0000-0000-000000000000');
insert into public.family_members(family_id,user_id,role) values
 ('f3000000-0000-0000-0000-000000000000','53000000-0000-0000-0000-000000000001','parent'),
 ('f3000000-0000-0000-0000-000000000000','53000000-0000-0000-0000-000000000002','teen'),
 ('f4000000-0000-0000-0000-000000000000','54000000-0000-0000-0000-000000000001','parent'),
 ('f4000000-0000-0000-0000-000000000000','54000000-0000-0000-0000-000000000002','teen');
select has_function('public','propose_manual_schyssta_rule',array['text','uuid'],'manual proposal RPC exists');
select is(has_function_privilege('anon','public.propose_manual_schyssta_rule(text,uuid)','execute'),false,'anon cannot propose');
select is(has_function_privilege('authenticated','public.propose_manual_schyssta_rule(text,uuid)','execute'),true,'signed-in account may use RPC');
select is(has_table_privilege('authenticated','public.agreements','insert'),false,'clients have no direct insert');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"53000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select throws_ok(
 $$select public.propose_manual_schyssta_rule('hej','53000000-0000-0000-0000-000000000011')$$,
 '22023','rule must contain 5 to 500 characters','short rule rejected');
select throws_ok(
 $$select public.propose_manual_schyssta_rule('Vi knackar innan vi går in.',null::uuid)$$,
 '22023','body and request key are required','null retry key rejected');
select lives_ok(
 $$select public.propose_manual_schyssta_rule('  Vi   knackar innan vi går in.  ','53000000-0000-0000-0000-000000000011')$$,
 'parent can submit manual proposal');
select results_eq(
 $$select body,status,agreement_version,proposed_by_me,own_decision from public.my_manual_schyssta_rules()$$,
 $$values ('Vi knackar innan vi går in.'::text,'proposed'::text,1,true,null::boolean)$$,
 'normalization and no automatic approval');
select is(
 (select agreement_id from public.my_manual_schyssta_rules()),
 public.propose_manual_schyssta_rule('Vi knackar innan vi går in.','53000000-0000-0000-0000-000000000011'),
 'identical retry returns same ID');
select throws_ok(
 $$select public.propose_manual_schyssta_rule('Andra ord i regeln','53000000-0000-0000-0000-000000000011')$$,
 '23505','request key was already used','retry token cannot change meaning');
select lives_ok(
 $$select public.set_schyssta_rule_decision((select agreement_id from public.my_manual_schyssta_rules()),true)$$,
 'parent explicit approval');
select results_eq(
 $$select status,parent_decision,teen_decision from public.my_manual_schyssta_rules()$$,
 $$values ('proposed'::text,true,null::boolean)$$,
 'one approval cannot accept');
select set_config('request.jwt.claims','{"sub":"53000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
select lives_ok(
 $$select public.set_schyssta_rule_decision((select agreement_id from public.my_manual_schyssta_rules()),true)$$,
 'teen explicit approval');
select results_eq(
 $$select status,parent_decision,teen_decision from public.my_manual_schyssta_rules()$$,
 $$values ('accepted'::text,true,true)$$,
 'two explicit approvals are required');
select lives_ok(
 $$select public.set_schyssta_rule_decision((select agreement_id from public.my_manual_schyssta_rules()),false)$$,
 'teen can revoke');
select results_eq(
 $$select status,parent_decision,teen_decision from public.my_manual_schyssta_rules()$$,
 $$values ('rejected'::text,true,false)$$,
 'revocation instantly removes accepted');
set local role postgres;
select set_config('test.manual_id',(select id::text from public.agreements where request_key='53000000-0000-0000-0000-000000000011'),true);
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"54000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select is_empty($$select * from public.my_manual_schyssta_rules()$$,'second family cannot read first family');
select throws_ok(
 $$select public.set_schyssta_rule_decision(current_setting('test.manual_id')::uuid,true)$$,
 '42501','agreement not available for this pairing','second family cannot approve first family');
set local role postgres;
update public.agreements set agreement_version=2,status='proposed'
 where request_key='53000000-0000-0000-0000-000000000011';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"53000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select results_eq(
 $$select status,parent_decision,teen_decision from public.my_manual_schyssta_rules()$$,
 $$values ('proposed'::text,null::boolean,null::boolean)$$,
 'version bump hides all previous votes');
set local role postgres;
update public.family_members set joined_at=joined_at+interval '1 second'
 where family_id='f3000000-0000-0000-0000-000000000000' and role='teen';
set local role authenticated;
select is_empty($$select * from public.my_manual_schyssta_rules()$$,'new pairing cannot inherit old proposal');
select lives_ok(
 $$select public.propose_manual_schyssta_rule('Vi frågar innan vi lånar saker.','53000000-0000-0000-0000-000000000012')$$,
 'same pair with new epoch may propose afresh');
rollback;
