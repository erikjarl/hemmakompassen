-- Disposable pgTAP contract for Schyssta listan. Synthetic data only.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(22);

insert into auth.users (id,email) values
  ('41000000-0000-0000-0000-000000000001','rule-a-parent@example.invalid'),
  ('41000000-0000-0000-0000-000000000002','rule-a-teen@example.invalid'),
  ('42000000-0000-0000-0000-000000000001','rule-b-parent@example.invalid'),
  ('42000000-0000-0000-0000-000000000002','rule-b-teen@example.invalid'),
  ('41000000-0000-0000-0000-000000000003','rule-a-third@example.invalid');
insert into public.families (id) values
  ('da000000-0000-0000-0000-000000000000'),
  ('db000000-0000-0000-0000-000000000000');
insert into public.family_members (family_id,user_id,role) values
  ('da000000-0000-0000-0000-000000000000','41000000-0000-0000-0000-000000000001','parent'),
  ('da000000-0000-0000-0000-000000000000','41000000-0000-0000-0000-000000000002','teen'),
  ('db000000-0000-0000-0000-000000000000','42000000-0000-0000-0000-000000000001','parent'),
  ('db000000-0000-0000-0000-000000000000','42000000-0000-0000-0000-000000000002','teen');
insert into public.swipe_answers (user_id,deck_id,card_id,answer) values
  ('41000000-0000-0000-0000-000000000001','regler','regler-01',true),
  ('41000000-0000-0000-0000-000000000002','regler','regler-01',true),
  ('41000000-0000-0000-0000-000000000001','regler','regler-02',false),
  ('41000000-0000-0000-0000-000000000002','regler','regler-02',false),
  ('41000000-0000-0000-0000-000000000001','regler','regler-03',true),
  ('41000000-0000-0000-0000-000000000002','regler','regler-03',false),
  ('41000000-0000-0000-0000-000000000001','regler','regler-04',true),
  ('41000000-0000-0000-0000-000000000001','general','regler-05',true),
  ('41000000-0000-0000-0000-000000000002','general','regler-05',true),
  ('41000000-0000-0000-0000-000000000001','regler','regler-99',true),
  ('41000000-0000-0000-0000-000000000002','regler','regler-99',true),
  ('42000000-0000-0000-0000-000000000001','regler','regler-05',true),
  ('42000000-0000-0000-0000-000000000002','regler','regler-05',true);

select has_function('public','shared_schyssta_rule_suggestions',array[]::text[],'suggestion RPC exists');
select has_function('public','propose_schyssta_rule',array['text'],'proposal RPC exists');
select has_function('public','my_schyssta_rules',array[]::text[],'shared list RPC exists');
select has_function('public','set_schyssta_rule_decision',array['uuid','boolean'],'decision RPC exists');
select is(has_function_privilege('anon','public.shared_schyssta_rule_suggestions()','execute'),false,'anon cannot read suggestions');
select is(has_function_privilege('authenticated','public.shared_schyssta_rule_suggestions()','execute'),true,'authenticated may call reviewed RPC');
select is(has_table_privilege('authenticated','public.agreements','select'),false,'browser has no direct agreements access');
select is(has_table_privilege('authenticated','public.agreement_approvals','select'),false,'browser has no direct approval access');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"41000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select results_eq(
  $$select card_id from public.shared_schyssta_rule_suggestions()$$,
  $$values ('regler-01'::text)$$,
  'only allowlisted mutual YES is suggested'
);
select is_empty(
  $$select * from public.shared_schyssta_rule_suggestions() where card_id in ('regler-02','regler-03','regler-04','regler-05','regler-99')$$,
  'NO, disagreement, unilateral, wrong-deck and unknown rows never leak'
);
select throws_ok(
  $$select public.propose_schyssta_rule('regler-02')$$,
  '42501','rule is not a current mutual match','non-match cannot become a proposal'
);
select lives_ok(
  $$select public.propose_schyssta_rule('regler-01')$$,
  'mutual match can become a non-binding proposal'
);
select is_empty(
  $$select * from public.shared_schyssta_rule_suggestions()$$,
  'already proposed match is removed from suggestions'
);
select results_eq(
  $$select status,proposed_by_me,own_decision,parent_decision,teen_decision from public.my_schyssta_rules()$$,
  $$values ('proposed'::text,true,null::boolean,null::boolean,null::boolean)$$,
  'proposal starts without implied approval'
);
select lives_ok(
  $$select public.set_schyssta_rule_decision((select agreement_id from public.my_schyssta_rules()),true)$$,
  'parent can explicitly approve'
);
select results_eq(
  $$select status,parent_decision,teen_decision from public.my_schyssta_rules()$$,
  $$values ('proposed'::text,true,null::boolean)$$,
  'one approval remains only a proposal'
);

select set_config('request.jwt.claims','{"sub":"41000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
select lives_ok(
  $$select public.set_schyssta_rule_decision((select agreement_id from public.my_schyssta_rules()),true)$$,
  'teen can separately approve'
);
select results_eq(
  $$select status,parent_decision,teen_decision from public.my_schyssta_rules()$$,
  $$values ('accepted'::text,true,true)$$,
  'two explicit approvals create an accepted agreement'
);
select lives_ok(
  $$select public.set_schyssta_rule_decision((select agreement_id from public.my_schyssta_rules()),false)$$,
  'teen can revoke approval'
);
select results_eq(
  $$select status,parent_decision,teen_decision from public.my_schyssta_rules()$$,
  $$values ('rejected'::text,true,false)$$,
  'a negative decision immediately removes accepted status'
);

select set_config('request.jwt.claims','{"sub":"42000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select results_eq(
  $$select card_id from public.shared_schyssta_rule_suggestions()$$,
  $$values ('regler-05'::text)$$,
  'other family sees only its own mutual match'
);
select is_empty($$select * from public.my_schyssta_rules()$$,'other family cannot read family A proposal');

rollback;
