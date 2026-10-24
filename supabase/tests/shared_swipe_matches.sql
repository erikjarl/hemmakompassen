-- Run only against a disposable local/branch database after all migrations.
-- Synthetic fixtures are rolled back and never contact production users.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(26);

insert into auth.users (id, email)
values
  ('31000000-0000-0000-0000-000000000001', 'swipe-a-parent@example.invalid'),
  ('31000000-0000-0000-0000-000000000002', 'swipe-a-teen@example.invalid'),
  ('32000000-0000-0000-0000-000000000001', 'swipe-b-parent@example.invalid'),
  ('32000000-0000-0000-0000-000000000002', 'swipe-b-teen@example.invalid'),
  ('33000000-0000-0000-0000-000000000001', 'swipe-single@example.invalid');

insert into public.families (id)
values
  ('ca000000-0000-0000-0000-000000000000'),
  ('cb000000-0000-0000-0000-000000000000'),
  ('cc000000-0000-0000-0000-000000000000');

insert into public.family_members (family_id, user_id, role)
values
  ('ca000000-0000-0000-0000-000000000000', '31000000-0000-0000-0000-000000000001', 'parent'),
  ('ca000000-0000-0000-0000-000000000000', '31000000-0000-0000-0000-000000000002', 'teen'),
  ('cb000000-0000-0000-0000-000000000000', '32000000-0000-0000-0000-000000000001', 'parent'),
  ('cb000000-0000-0000-0000-000000000000', '32000000-0000-0000-0000-000000000002', 'teen'),
  ('cc000000-0000-0000-0000-000000000000', '33000000-0000-0000-0000-000000000001', 'parent');

insert into public.swipe_answers (user_id, deck_id, card_id, answer)
values
  ('31000000-0000-0000-0000-000000000001', 'general', 'same-no', false),
  ('31000000-0000-0000-0000-000000000002', 'general', 'same-no', false),
  ('31000000-0000-0000-0000-000000000001', 'general', 'same-yes', true),
  ('31000000-0000-0000-0000-000000000002', 'general', 'same-yes', true),
  ('31000000-0000-0000-0000-000000000001', 'general', 'disagree', true),
  ('31000000-0000-0000-0000-000000000002', 'general', 'disagree', false),
  ('31000000-0000-0000-0000-000000000001', 'general', 'unilateral', true),
  ('32000000-0000-0000-0000-000000000001', 'general', 'family-b-only', true),
  ('32000000-0000-0000-0000-000000000002', 'general', 'family-b-only', true),
  ('33000000-0000-0000-0000-000000000001', 'general', 'single-member', true);

select has_function(
  'public',
  'shared_swipe_matches',
  array['text'],
  'shared match RPC exists'
);
select is(
  has_function_privilege('anon', 'public.shared_swipe_matches(text)', 'execute'),
  false,
  'anonymous users cannot execute the RPC'
);
select is(
  has_column_privilege('authenticated', 'public.swipe_answers', 'updated_at', 'insert'),
  true,
  'signed-in users can insert updated_at as required by live swipe upsert'
);
select is(
  has_column_privilege('authenticated', 'public.swipe_answers', 'user_id', 'update'),
  true,
  'full-row upsert may update conflict columns but RLS enforces self-only ownership'
);
select is(
  has_function_privilege('authenticated', 'public.shared_swipe_matches(text)', 'execute'),
  true,
  'signed-in users can execute the reviewed RPC'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"31000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select lives_ok(
  $$insert into public.swipe_answers(user_id,deck_id,card_id,answer,updated_at)
    select user_id,deck_id,card_id,answer,now() from public.swipe_answers
    where user_id=auth.uid() order by card_id limit 1
    on conflict(user_id,deck_id,card_id) do update set
      user_id=excluded.user_id,deck_id=excluded.deck_id,card_id=excluded.card_id,
      answer=excluded.answer,updated_at=excluded.updated_at$$,
  'existing own answer writable with full-row upsert; test rolls back'
);
select results_eq(
  $$select deck_id, card_id, answer from public.shared_swipe_matches('general')$$,
  $$values ('general'::text, 'same-yes'::text, true)$$,
  'family A sees only its mutual YES'
);
select is_empty(
  $$select * from public.shared_swipe_matches('general') where card_id = 'same-no'$$,
  'two NO votes are never returned by the authenticated RPC'
);
select is_empty(
  $$select * from public.shared_swipe_matches('general') where card_id = 'disagree'$$,
  'a disagreement is never exposed'
);
select is_empty(
  $$select * from public.shared_swipe_matches('general') where card_id = 'unilateral'$$,
  'a unilateral answer is never exposed'
);
select is_empty(
  $$select * from public.shared_swipe_matches('general') where card_id = 'family-b-only'$$,
  'another family match is never exposed'
);
select results_eq(
  $$select count(*) from public.swipe_answers$$,
  array[4::bigint],
  'self-only RLS still reveals only the caller answers'
);
select throws_ok(
  $$select * from public.shared_swipe_matches('')$$,
  '22023',
  'deck id must contain 1 to 80 characters',
  'invalid deck ids are rejected'
);

select set_config('request.jwt.claims', '{"sub":"32000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select results_eq(
  $$select deck_id, card_id, answer from public.shared_swipe_matches('general')$$,
  $$values ('general'::text, 'family-b-only'::text, true)$$,
  'family B sees only its own match'
);


-- Secure two-person unlock gate: no answer values or per-person progress returned.
reset role;
select has_function('public', 'shared_general_deck_complete', array[]::text[],
  'server-only theme unlock RPC exists');
select is(has_function_privilege('anon', 'public.shared_general_deck_complete()', 'execute'), false,
  'anonymous callers cannot check theme unlock');
select is(has_function_privilege('authenticated', 'public.shared_general_deck_complete()', 'execute'), true,
  'authenticated callers may check theme unlock');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"31000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select is(public.shared_general_deck_complete(), false, 'family A starts with incomplete general deck');
select set_config('request.jwt.claims', '{"sub":"32000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select is(public.shared_general_deck_complete(), false, 'family B cannot unlock from family A progress');
select set_config('request.jwt.claims', '{"sub":"33000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select is(public.shared_general_deck_complete(), false, 'single member never unlocks theme decks');

reset role;
insert into public.swipe_answers (user_id, deck_id, card_id, answer)
select member.user_id, 'general',
       'general-' || pg_catalog.lpad(card.number::text, 2, '0'),
       (card.number % 2 = 0)
from public.family_members as member
cross join pg_catalog.generate_series(1, 34) as card(number)
where member.family_id = 'ca000000-0000-0000-0000-000000000000'
on conflict do nothing;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"31000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select is(public.shared_general_deck_complete(), true, 'both complete all 34 valid IDs; mixed private YES and NO still count');
select set_config('request.jwt.claims', '{"sub":"31000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select is(public.shared_general_deck_complete(), true, 'teen sees the same aggregate unlock result');
select set_config('request.jwt.claims', '{"sub":"32000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select is(public.shared_general_deck_complete(), false, 'completion in another family does not unlock this family');

reset role;
delete from public.swipe_answers
where user_id = '31000000-0000-0000-0000-000000000002'
  and deck_id = 'general' and card_id = 'general-34';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"31000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select is(public.shared_general_deck_complete(), false, 'missing just one of 34 answers relocks both members');

reset role;
insert into public.swipe_answers (user_id, deck_id, card_id, answer)
values ('31000000-0000-0000-0000-000000000002', 'general', 'general-34', false);
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"31000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select is(public.shared_general_deck_complete(), true, 'restoring the missing answer unlocks again');

select set_config('request.jwt.claims', '{"role":"authenticated"}', true);
select throws_ok($select public.shared_general_deck_complete()$, '42501',
  'authentication required', 'missing auth identity cannot check unlock');

select * from finish();
rollback;
