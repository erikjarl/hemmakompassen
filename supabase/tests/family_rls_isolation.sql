-- Integration tests for a disposable local/branch database after applying the
-- migration. These tests intentionally use synthetic UUIDs and roll back.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(10);

insert into auth.users (id, email)
values
  ('10000000-0000-0000-0000-000000000001', 'family-a-parent@example.invalid'),
  ('10000000-0000-0000-0000-000000000002', 'family-a-teen@example.invalid'),
  ('20000000-0000-0000-0000-000000000001', 'family-b-parent@example.invalid');

insert into public.families (id)
values
  ('aaaaaaaa-0000-0000-0000-000000000000'),
  ('bbbbbbbb-0000-0000-0000-000000000000');

insert into public.family_members (family_id, user_id, role)
values
  ('aaaaaaaa-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001', 'parent'),
  ('aaaaaaaa-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000002', 'teen'),
  ('bbbbbbbb-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000001', 'parent');

insert into public.messages (id, family_id, sender_id, recipient_id, body)
values
  ('a0000000-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Family A'),
  ('b0000000-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Family B fixture');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select results_eq(
  $$select id from public.families order by id$$,
  $$values ('aaaaaaaa-0000-0000-0000-000000000000'::uuid)$$,
  'family A cannot read family B'
);
select results_eq(
  $$select user_id from public.family_members order by user_id$$,
  $$values ('10000000-0000-0000-0000-000000000001'::uuid), ('10000000-0000-0000-0000-000000000002'::uuid)$$,
  'family A sees only its two members'
);
select results_eq(
  $$select body from public.messages$$,
  $$values ('Family A'::text)$$,
  'family A cannot read family B messages'
);
select throws_ok(
  $$insert into public.messages (family_id, sender_id, recipient_id, body) values ('bbbbbbbb-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'cross family')$$,
  '42501',
  'new row violates row-level security policy for table "messages"',
  'family A cannot insert into family B'
);
select throws_ok(
  $$insert into public.messages (family_id, sender_id, recipient_id, body) values ('aaaaaaaa-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'forged sender')$$,
  '42501',
  'new row violates row-level security policy for table "messages"',
  'a user cannot forge the sender id'
);
select lives_ok(
  $$insert into public.agreements (family_id, proposed_by, body) values ('aaaaaaaa-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001', 'Synthetic proposal')$$,
  'a member can propose an agreement in their family'
);
select throws_ok(
  $$insert into public.agreements (family_id, proposed_by, body) values ('bbbbbbbb-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001', 'cross family')$$,
  '42501',
  'new row violates row-level security policy for table "agreements"',
  'a member cannot propose an agreement in another family'
);
select results_eq(
  $$select count(*) from public.invitations$$,
  array[0::bigint],
  'another family invite is not exposed'
);
select throws_ok(
  $$update public.messages set body = 'tampered' where id = 'a0000000-0000-0000-0000-000000000001'$$,
  '42501',
  'permission denied for table messages',
  'message body cannot be edited'
);
select throws_ok(
  $$truncate public.messages$$,
  '42501',
  'permission denied for table messages',
  'authenticated users cannot truncate messages'
);

select * from finish();
rollback;

