-- Run only in the disposable CI database after the actual migration.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(15);

select has_table('public','swipe_importance','private importance table exists');
select has_column('public','swipe_importance','importance','importance column exists');
select is(has_table_privilege('anon','public.swipe_importance','select'),false,'anonymous users cannot read importance');
select is(has_table_privilege('authenticated','public.swipe_importance','select'),true,'authenticated users can read through RLS');
select is(has_column_privilege('authenticated','public.swipe_importance','user_id','update'),true,'PostgREST upsert may address conflict-key columns');

insert into auth.users(id,email) values
  ('41000000-0000-0000-0000-000000000001','importance-a@example.invalid'),
  ('41000000-0000-0000-0000-000000000002','importance-b@example.invalid');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"41000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select lives_ok(
  $$insert into public.swipe_importance(user_id,deck_id,card_id,importance) values ('41000000-0000-0000-0000-000000000001','general','general-01',1)$$,
  'user can insert own importance');
select is((select importance from public.swipe_importance where card_id='general-01'),1::smallint,'user can read own importance');
select throws_ok(
  $$insert into public.swipe_importance(user_id,deck_id,card_id,importance) values ('41000000-0000-0000-0000-000000000002','general','general-01',1)$$,
  '42501',null,'user cannot insert importance for another account');
select throws_ok(
  $$insert into public.swipe_importance(user_id,deck_id,card_id,importance) values ('41000000-0000-0000-0000-000000000001','general','general-02',2)$$,
  '23514',null,'importance is restricted to exactly three levels');
select lives_ok(
  $$update public.swipe_importance set importance=0 where user_id='41000000-0000-0000-0000-000000000001' and card_id='general-01'$$,
  'user can reset own importance to neutral');
select throws_ok(
  $$update public.swipe_importance set user_id='41000000-0000-0000-0000-000000000002' where user_id='41000000-0000-0000-0000-000000000001' and card_id='general-01'$$,
  '42501',null,'RLS prevents reassigning an owned row despite upsert-compatible grants');

reset role;
insert into public.swipe_importance(user_id,deck_id,card_id,importance)
values ('41000000-0000-0000-0000-000000000002','general','general-02',-1);
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"41000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select is((select count(*) from public.swipe_importance),1::bigint,'RLS hides another user row');
select is_empty(
  $$update public.swipe_importance set importance=1 where card_id='general-02' returning 1$$,
  'RLS prevents updating another user row');
select is_empty(
  $$delete from public.swipe_importance where card_id='general-02' returning 1$$,
  'RLS prevents deleting another user row');
select lives_ok(
  $$delete from public.swipe_importance where user_id='41000000-0000-0000-0000-000000000001' and card_id='general-01'$$,
  'user can delete own importance');

select * from finish();
rollback;
