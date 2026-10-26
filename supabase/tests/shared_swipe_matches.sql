-- Run only against a disposable local/branch database after all migrations.
-- Synthetic fixtures are rolled back and never contact production users.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(44);

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
  ('31000000-0000-0000-0000-000000000001', 'general', 'general-10', false),
  ('31000000-0000-0000-0000-000000000002', 'general', 'general-10', false),
  ('31000000-0000-0000-0000-000000000001', 'general', 'general-01', true),
  ('31000000-0000-0000-0000-000000000002', 'general', 'general-01', true),
  -- Historic B answers on both accounts must not be returned by the shared RPC.
  ('31000000-0000-0000-0000-000000000001', 'general', 'general-02', true),
  ('31000000-0000-0000-0000-000000000002', 'general', 'general-02', true),
  ('31000000-0000-0000-0000-000000000001', 'general', 'general-11', true),
  ('31000000-0000-0000-0000-000000000002', 'general', 'general-11', false),
  ('31000000-0000-0000-0000-000000000001', 'general', 'general-13', true),
  ('32000000-0000-0000-0000-000000000001', 'general', 'general-08', true),
  ('32000000-0000-0000-0000-000000000002', 'general', 'general-08', true),
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
  $$values ('general'::text, 'general-01'::text, true)$$,
  'family A sees only its mutual YES'
);
select is_empty(
  $$select * from public.shared_swipe_matches('general') where card_id = 'general-02'$$,
  'historical mutual YES on a B understanding card must not be returned'
);
select is_empty(
  $$select * from public.shared_swipe_matches('general') where card_id = 'general-10'$$,
  'two NO votes are never returned by the authenticated RPC'
);
select is_empty(
  $$select * from public.shared_swipe_matches('general') where card_id = 'general-11'$$,
  'a disagreement is never exposed'
);
select is_empty(
  $$select * from public.shared_swipe_matches('general') where card_id = 'general-13'$$,
  'a unilateral answer is never exposed'
);
select is_empty(
  $$select * from public.shared_swipe_matches('general') where card_id = 'general-08'$$,
  'another family match is never exposed'
);
select results_eq(
  $$select count(*) from public.swipe_answers$$,
  array[5::bigint],
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
  $$values ('general'::text, 'general-08'::text, true)$$,
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
select has_table('public', 'swipe_skips', 'private understanding-card skip table exists');
select has_function('public', 'set_understanding_card_state', array['text','boolean','boolean'],
  'atomic teen understanding-card state RPC exists');
select is(has_function_privilege('anon', 'public.set_understanding_card_state(text,boolean,boolean)', 'execute'), false,
  'anonymous callers cannot store understanding-card state');
select is(has_function_privilege('authenticated', 'public.set_understanding_card_state(text,boolean,boolean)', 'execute'), true,
  'authenticated callers may store their own understanding-card state');

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
select throws_ok('select public.shared_general_deck_complete()', '42501',
  'authentication required', 'missing auth identity cannot check unlock');

-- A/B completion: parents answer only A cards; teens may privately skip B cards.
reset role;
delete from public.swipe_answers
where user_id = '31000000-0000-0000-0000-000000000002'
  and deck_id = 'general' and card_id = 'general-02';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"31000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select is(public.shared_general_deck_complete(), false,
  'an unfinished teen B card keeps the pair locked');

select set_config('request.jwt.claims', '{"sub":"31000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select lives_ok(
  $$select public.set_understanding_card_state('general-02', null, true)$$,
  'teen can privately skip a reviewed B card'
);
select is_empty(
  $$select 1 from public.swipe_answers where card_id = 'general-02'$$,
  'skipping removes the teen private answer atomically'
);
select results_eq(
  $$select count(*) from public.swipe_skips where card_id = 'general-02'$$,
  array[1::bigint],
  'teen can read only the persisted private skip'
);
select is(public.shared_general_deck_complete(), true,
  'a persisted teen B skip counts as reviewed without inventing an answer');

select set_config('request.jwt.claims', '{"sub":"31000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select results_eq(
  $$select count(*) from public.swipe_skips$$,
  array[0::bigint],
  'parent cannot read the teen private skip through RLS'
);
select throws_ok(
  $$select public.set_understanding_card_state('general-02', null, true)$$,
  '42501', 'teen role required',
  'parent cannot store a teen understanding-card state'
);

select set_config('request.jwt.claims', '{"sub":"31000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select throws_ok(
  $$select public.set_understanding_card_state('general-01', null, true)$$,
  '22023', 'unsupported understanding card',
  'match cards cannot be converted into private skips'
);
select throws_ok(
  $$select public.set_understanding_card_state('general-02', true, true)$$,
  '22023', 'choose exactly one answer or skip state',
  'answer and skip cannot be stored simultaneously'
);
select lives_ok(
  $$select public.set_understanding_card_state('general-02', true, false)$$,
  'teen can replace a skip with a private answer atomically'
);
select is_empty(
  $$select 1 from public.swipe_skips where card_id = 'general-02'$$,
  'saving an answer removes the stale skip'
);
select results_eq(
  $$select answer from public.swipe_answers where card_id = 'general-02'$$,
  array[true],
  'replacement B answer remains private and belongs to the teen'
);
select is(public.shared_general_deck_complete(), true,
  'restoring the B answer keeps the aggregate pair unlock true');

select * from finish();
rollback;
