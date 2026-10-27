-- Disposable synthetic pgTAP contract for teen-first shared priorities.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(18);

insert into auth.users(id,email) values
  ('41000000-0000-0000-0000-000000000001','priority-a-parent@example.invalid'),
  ('41000000-0000-0000-0000-000000000002','priority-a-teen@example.invalid'),
  ('42000000-0000-0000-0000-000000000001','priority-b-parent@example.invalid'),
  ('42000000-0000-0000-0000-000000000002','priority-b-teen@example.invalid'),
  ('43000000-0000-0000-0000-000000000001','priority-single@example.invalid');

insert into public.families(id) values
  ('da000000-0000-0000-0000-000000000000'),
  ('db000000-0000-0000-0000-000000000000'),
  ('dc000000-0000-0000-0000-000000000000');

insert into public.family_members(family_id,user_id,role) values
  ('da000000-0000-0000-0000-000000000000','41000000-0000-0000-0000-000000000001','parent'),
  ('da000000-0000-0000-0000-000000000000','41000000-0000-0000-0000-000000000002','teen'),
  ('db000000-0000-0000-0000-000000000000','42000000-0000-0000-0000-000000000001','parent'),
  ('db000000-0000-0000-0000-000000000000','42000000-0000-0000-0000-000000000002','teen'),
  ('dc000000-0000-0000-0000-000000000000','43000000-0000-0000-0000-000000000001','parent');

insert into public.swipe_answers(user_id,deck_id,card_id,answer) values
  ('41000000-0000-0000-0000-000000000001','general','general-01',true),
  ('41000000-0000-0000-0000-000000000002','general','general-01',true),
  ('41000000-0000-0000-0000-000000000001','general','general-02',true),
  ('41000000-0000-0000-0000-000000000002','general','general-02',true),
  ('41000000-0000-0000-0000-000000000001','general','general-08',true),
  ('41000000-0000-0000-0000-000000000002','general','general-08',true),
  ('41000000-0000-0000-0000-000000000001','general','general-10',false),
  ('41000000-0000-0000-0000-000000000002','general','general-10',false),
  ('41000000-0000-0000-0000-000000000001','general','general-11',false),
  ('41000000-0000-0000-0000-000000000002','general','general-11',true),
  ('41000000-0000-0000-0000-000000000002','general','general-13',true),
  ('41000000-0000-0000-0000-000000000001','general','general-99',true),
  ('41000000-0000-0000-0000-000000000002','general','general-99',true),
  ('41000000-0000-0000-0000-000000000001','aktiviteter','aktiviteter-01',true),
  ('41000000-0000-0000-0000-000000000002','aktiviteter','aktiviteter-01',true),
  ('42000000-0000-0000-0000-000000000001','general','general-01',true),
  ('42000000-0000-0000-0000-000000000002','general','general-01',true);

insert into public.swipe_importance(user_id,deck_id,card_id,importance) values
  ('41000000-0000-0000-0000-000000000002','general','general-01',1),
  ('41000000-0000-0000-0000-000000000002','general','general-02',1),
  ('41000000-0000-0000-0000-000000000001','general','general-08',1),
  ('41000000-0000-0000-0000-000000000002','general','general-08',0),
  ('41000000-0000-0000-0000-000000000002','general','general-10',1),
  ('41000000-0000-0000-0000-000000000002','general','general-11',1),
  ('41000000-0000-0000-0000-000000000002','general','general-13',1),
  ('41000000-0000-0000-0000-000000000002','general','general-99',1),
  ('41000000-0000-0000-0000-000000000002','aktiviteter','aktiviteter-01',1),
  ('42000000-0000-0000-0000-000000000002','general','general-01',1);

select has_function('public','shared_swipe_priorities',array['text'],'priority RPC exists');
select is(has_function_privilege('anon','public.shared_swipe_priorities(text)','execute'),false,'anonymous callers cannot execute priority RPC');
select is(has_function_privilege('authenticated','public.shared_swipe_priorities(text)','execute'),true,'authenticated callers may request aggregate priorities');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"41000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select results_eq(
  $$select deck_id,card_id from public.shared_swipe_priorities('general')$$,
  $$values ('general'::text,'general-01'::text)$$,
  'parent sees only teen-high mutual A YES');
select is_empty($$select * from public.shared_swipe_priorities('general') where card_id='general-02'$$,'B mutual YES is never prioritised');
select is_empty($$select * from public.shared_swipe_priorities('general') where card_id='general-10'$$,'mutual NO is never prioritised');
select is_empty($$select * from public.shared_swipe_priorities('general') where card_id='general-11'$$,'disagreement is never prioritised');
select is_empty($$select * from public.shared_swipe_priorities('general') where card_id='general-13'$$,'unilateral answer is never prioritised');
select is_empty($$select * from public.shared_swipe_priorities('general') where card_id='general-08'$$,'parent high cannot prioritise a neutral teen card');
select is_empty($$select * from public.shared_swipe_priorities('general') where card_id='general-99'$$,'unknown card is never prioritised');
select is_empty($$select * from public.shared_swipe_priorities('general') where card_id not in ('general-01')$$,'no raw private level or unrelated card leaks');
select results_eq(
  $$select deck_id,card_id from public.shared_swipe_priorities('aktiviteter')$$,
  $$values ('aktiviteter'::text,'aktiviteter-01'::text)$$,
  'catalogued theme A works with the same privacy rule');
select throws_ok($$select * from public.shared_swipe_priorities('unknown')$$,'22023','unsupported deck id','unsupported deck is rejected');

select set_config('request.jwt.claims','{"sub":"42000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select results_eq(
  $$select deck_id,card_id from public.shared_swipe_priorities('general')$$,
  $$values ('general'::text,'general-01'::text)$$,
  'another family sees only its own eligible priority');
select set_config('request.jwt.claims','{"sub":"43000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select is_empty($$select * from public.shared_swipe_priorities('general')$$,'single-member family receives nothing');

reset role;
update public.swipe_importance set importance=0
where user_id='41000000-0000-0000-0000-000000000002' and deck_id='general' and card_id='general-01';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"41000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select is_empty($$select * from public.shared_swipe_priorities('general')$$,'lowering teen priority removes shared priority immediately');

reset role;
update public.swipe_importance set importance=1
where user_id='41000000-0000-0000-0000-000000000002' and deck_id='general' and card_id='general-01';
delete from public.swipe_answers
where user_id='41000000-0000-0000-0000-000000000001' and deck_id='general' and card_id='general-01';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"41000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
select is_empty($$select * from public.shared_swipe_priorities('general')$$,'revoking either A YES removes shared priority immediately');

select set_config('request.jwt.claims','{"role":"authenticated"}',true);
select throws_ok($$select * from public.shared_swipe_priorities('general')$$,'42501','authentication required','missing identity is rejected');

select * from finish();
rollback;
