-- Disposable database test for accepting an invite when the recipient already
-- owns an empty one-person family. Uses synthetic users and always rolls back.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(6);

insert into auth.users (id, email)
values
  ('41000000-0000-0000-0000-000000000001', 'inviting-parent@example.invalid'),
  ('42000000-0000-0000-0000-000000000001', 'joining-teen@example.invalid'),
  ('43000000-0000-0000-0000-000000000001', 'blocked-teen@example.invalid');

insert into public.profiles (user_id, display_name)
values
  ('41000000-0000-0000-0000-000000000001', 'Synthetic parent'),
  ('42000000-0000-0000-0000-000000000001', 'Synthetic teen'),
  ('43000000-0000-0000-0000-000000000001', 'Blocked teen');

insert into public.families (id)
values
  ('41000000-0000-0000-0000-000000000000'),
  ('42000000-0000-0000-0000-000000000000'),
  ('43000000-0000-0000-0000-000000000000');

insert into public.family_members (family_id, user_id, role)
values
  ('41000000-0000-0000-0000-000000000000', '41000000-0000-0000-0000-000000000001', 'parent'),
  ('42000000-0000-0000-0000-000000000000', '42000000-0000-0000-0000-000000000001', 'teen'),
  ('43000000-0000-0000-0000-000000000000', '43000000-0000-0000-0000-000000000001', 'teen');

insert into public.invitations (family_id, created_by, token_hash, expires_at)
values
  ('41000000-0000-0000-0000-000000000000', '41000000-0000-0000-0000-000000000001', encode(extensions.digest('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA','sha256'),'hex'), now()+interval '30 minutes'),
  ('41000000-0000-0000-0000-000000000000', '41000000-0000-0000-0000-000000000001', encode(extensions.digest('BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB','sha256'),'hex'), now()+interval '30 minutes');

insert into public.messages (family_id, sender_id, recipient_id, body)
values ('43000000-0000-0000-0000-000000000000', '43000000-0000-0000-0000-000000000001', '43000000-0000-0000-0000-000000000001', 'Synthetic shared history');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"42000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select is(
  public.accept_family_invite('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'),
  '41000000-0000-0000-0000-000000000000'::uuid,
  'an empty singleton joins the inviting family'
);
select results_eq(
  $$select family_id, role from public.family_members where user_id='42000000-0000-0000-0000-000000000001'$$,
  $$values ('41000000-0000-0000-0000-000000000000'::uuid, 'teen'::text)$$,
  'the complementary role is preserved in the target family'
);
select is(
  (select display_name from public.profiles where user_id='42000000-0000-0000-0000-000000000001'),
  'Synthetic teen'::text,
  'the existing profile is preserved'
);
select is(
  (select count(*) from public.family_members where family_id='42000000-0000-0000-0000-000000000000'),
  0::bigint,
  'the old empty family has no remaining membership'
);

select set_config('request.jwt.claims', '{"sub":"43000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select throws_ok(
  $$select public.accept_family_invite('BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB')$$,
  'P0001',
  'Current family contains shared data',
  'shared history blocks a silent family move'
);
select results_eq(
  $$select family_id from public.family_members where user_id='43000000-0000-0000-0000-000000000001'$$,
  $$values ('43000000-0000-0000-0000-000000000000'::uuid)$$,
  'a rejected move keeps the original membership'
);

select * from finish();
rollback;
