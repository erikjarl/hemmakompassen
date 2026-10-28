-- Disposable pgTAP contract for the separate B-sharing RPC.
-- Synthetic accounts only; never run against production.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(17);

select has_function('public','shared_understanding_cards',array[]::text[],
  'separate B-sharing RPC exists');
select is(has_function_privilege('anon','public.shared_understanding_cards()','execute'),false,
  'anonymous callers cannot execute B-sharing RPC');
select is(has_function_privilege('authenticated','public.shared_understanding_cards()','execute'),true,
  'authenticated paired members may request shared B card IDs');

insert into auth.users(id,email) values
  ('31000000-0000-0000-0000-000000000001','understanding-a-parent@example.invalid'),
  ('31000000-0000-0000-0000-000000000002','understanding-a-teen@example.invalid'),
  ('32000000-0000-0000-0000-000000000001','understanding-b-parent@example.invalid'),
  ('32000000-0000-0000-0000-000000000002','understanding-b-teen@example.invalid'),
  ('33000000-0000-0000-0000-000000000001','understanding-single@example.invalid');

insert into public.families(id) values
  ('ca000000-0000-0000-0000-000000000000'),
  ('cb000000-0000-0000-0000-000000000000'),
  ('cc000000-0000-0000-0000-000000000000');

insert into public.family_members(family_id,user_id,role) values
  ('ca000000-0000-0000-0000-000000000000','31000000-0000-0000-0000-000000000001','parent'),
  ('ca000000-0000-0000-0000-000000000000','31000000-0000-0000-0000-000000000002','teen'),
  ('cb000000-0000-0000-0000-000000000000','32000000-0000-0000-0000-000000000001','parent'),
  ('cb000000-0000-0000-0000-000000000000','32000000-0000-0000-0000-000000000002','teen'),
  ('cc000000-0000-0000-0000-000000000000','33000000-0000-0000-0000-000000000001','parent');

insert into public.swipe_answers(user_id,deck_id,card_id,answer)
values
  ('31000000-0000-0000-0000-000000000002','general','general-02',true),
  ('31000000-0000-0000-0000-000000000002','general','general-03',false),
  ('31000000-0000-0000-0000-000000000002','general','general-04',true),
  ('31000000-0000-0000-0000-000000000002','general','general-99',true),
  ('31000000-0000-0000-0000-000000000002','general','general-01',true),
  ('32000000-0000-0000-0000-000000000002','general','general-05',true)
on conflict(user_id,deck_id,card_id) do update set answer=excluded.answer;

insert into public.swipe_skips(user_id,deck_id,card_id)
values ('31000000-0000-0000-0000-000000000002','general','general-04');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"31000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select results_eq(
  $$select deck_id,card_id from public.shared_understanding_cards()$$,
  $$values ('general'::text,'general-02'::text)$$,
  'parent receives only the paired teen active B YES');
select is_empty($$select * from public.shared_understanding_cards() where card_id='general-03'$$,
  'teen B NO remains private');
select is_empty($$select * from public.shared_understanding_cards() where card_id='general-04'$$,
  'a skip suppresses even a stale B YES defensively');
select is_empty($$select * from public.shared_understanding_cards() where card_id='general-99'$$,
  'unknown card IDs remain private');
select is_empty($$select * from public.shared_understanding_cards() where card_id='general-01'$$,
  'A match cards never enter B sharing');
select is_empty($$select * from public.shared_understanding_cards() where card_id='general-05'$$,
  'another family B YES remains isolated');

select set_config('request.jwt.claims','{"sub":"31000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
select results_eq(
  $$select deck_id,card_id from public.shared_understanding_cards()$$,
  $$values ('general'::text,'general-02'::text)$$,
  'teen sees the same explicitly shared B set');

select set_config('request.jwt.claims','{"sub":"33000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select is_empty($$select * from public.shared_understanding_cards()$$,
  'single-member family receives no B data');

select set_config('request.jwt.claims','{"role":"authenticated"}',true);
select throws_ok($$select * from public.shared_understanding_cards()$$,'42501','authentication required',
  'missing identity is rejected');

reset role;
delete from public.swipe_answers
where user_id='31000000-0000-0000-0000-000000000002' and deck_id='general' and card_id='general-02';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"31000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select is_empty($$select * from public.shared_understanding_cards()$$,
  'revoking teen YES removes B sharing immediately');

reset role;
insert into public.swipe_answers(user_id,deck_id,card_id,answer)
values ('31000000-0000-0000-0000-000000000002','general','general-02',false);
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"31000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select is_empty($$select * from public.shared_understanding_cards()$$,
  'changing teen answer to NO shares nothing');

reset role;
update public.family_members set role='parent'
where user_id='31000000-0000-0000-0000-000000000002';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"31000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select is_empty($$select * from public.shared_understanding_cards()$$,
  'pair without exactly one teen and one parent receives nothing');

reset role;
update public.family_members set role='teen'
where user_id='31000000-0000-0000-0000-000000000002';
insert into public.family_members(family_id,user_id,role)
values ('cc000000-0000-0000-0000-000000000000','31000000-0000-0000-0000-000000000001','parent');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"31000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select is_empty($$select * from public.shared_understanding_cards()$$,
  'caller with ambiguous multiple memberships receives nothing');

select is(
  pg_catalog.pg_get_function_result('public.shared_understanding_cards()'::regprocedure),
  'TABLE(deck_id text, card_id text)',
  'RPC exposes only deck and card IDs'
);

select * from finish();
rollback;
