-- Lock all family-scoped records to the signed-in user's own family.
-- This migration is intentionally prepared for review only; it must be tested
-- against a disposable Supabase branch before it is applied to production.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.current_family_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select fm.family_id
  from public.family_members as fm
  where fm.user_id = (select auth.uid())
  limit 1
$$;

revoke all on function private.current_family_id() from public, anon;
grant execute on function private.current_family_id() to authenticated;

-- The browser never needs anonymous table access. Authenticated users receive
-- only the operations and columns used by the reviewed policies below.
revoke all privileges on
  public.families,
  public.family_members,
  public.invitations,
  public.messages,
  public.agreements,
  public.agreement_approvals
from anon, authenticated;

grant select on public.families, public.family_members, public.invitations to authenticated;
grant select, delete on public.messages, public.agreements, public.agreement_approvals to authenticated;
grant insert (family_id, sender_id, recipient_id, body) on public.messages to authenticated;
grant insert (family_id, proposed_by, body) on public.agreements to authenticated;
grant insert (agreement_id, user_id, approved) on public.agreement_approvals to authenticated;
grant update (read_at) on public.messages to authenticated;
grant update (approved) on public.agreement_approvals to authenticated;

-- Pairing mutations remain available only through the existing authenticated
-- RPCs, which validate auth.uid(), roles, invite expiry and family capacity.
revoke all on function public.start_family(text) from public, anon;
revoke all on function public.create_family_invite(text) from public, anon;
revoke all on function public.accept_family_invite(text) from public, anon;
revoke all on function public.my_family_members() from public, anon;
grant execute on function public.start_family(text) to authenticated;
grant execute on function public.create_family_invite(text) to authenticated;
grant execute on function public.accept_family_invite(text) to authenticated;
grant execute on function public.my_family_members() to authenticated;

drop policy if exists families_member_select on public.families;
create policy families_member_select
on public.families for select
to authenticated
using (
  (select auth.uid()) is not null
  and id = (select private.current_family_id())
);

drop policy if exists family_members_same_family_select on public.family_members;
create policy family_members_same_family_select
on public.family_members for select
to authenticated
using (
  (select auth.uid()) is not null
  and family_id = (select private.current_family_id())
);

drop policy if exists invitations_creator_select on public.invitations;
create policy invitations_creator_select
on public.invitations for select
to authenticated
using (
  (select auth.uid()) is not null
  and created_by = (select auth.uid())
  and family_id = (select private.current_family_id())
);

drop policy if exists messages_participant_select on public.messages;
create policy messages_participant_select
on public.messages for select
to authenticated
using (
  family_id = (select private.current_family_id())
  and (sender_id = (select auth.uid()) or recipient_id = (select auth.uid()))
);

drop policy if exists messages_sender_insert on public.messages;
create policy messages_sender_insert
on public.messages for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and family_id = (select private.current_family_id())
  and sender_id = (select auth.uid())
  and recipient_id <> (select auth.uid())
  and exists (
    select 1
    from public.family_members as recipient
    where recipient.family_id = messages.family_id
      and recipient.user_id = messages.recipient_id
  )
);

drop policy if exists messages_recipient_mark_read on public.messages;
create policy messages_recipient_mark_read
on public.messages for update
to authenticated
using (
  family_id = (select private.current_family_id())
  and recipient_id = (select auth.uid())
)
with check (
  family_id = (select private.current_family_id())
  and recipient_id = (select auth.uid())
);

drop policy if exists messages_participant_delete on public.messages;
create policy messages_participant_delete
on public.messages for delete
to authenticated
using (
  family_id = (select private.current_family_id())
  and (sender_id = (select auth.uid()) or recipient_id = (select auth.uid()))
);

drop policy if exists agreements_family_select on public.agreements;
create policy agreements_family_select
on public.agreements for select
to authenticated
using (family_id = (select private.current_family_id()));

drop policy if exists agreements_member_insert on public.agreements;
create policy agreements_member_insert
on public.agreements for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and proposed_by = (select auth.uid())
  and family_id = (select private.current_family_id())
  and status = 'proposed'
);

drop policy if exists agreements_proposer_delete on public.agreements;
create policy agreements_proposer_delete
on public.agreements for delete
to authenticated
using (
  family_id = (select private.current_family_id())
  and proposed_by = (select auth.uid())
  and status = 'proposed'
);

drop policy if exists agreement_approvals_family_select on public.agreement_approvals;
create policy agreement_approvals_family_select
on public.agreement_approvals for select
to authenticated
using (
  exists (
    select 1
    from public.agreements as agreement
    where agreement.id = agreement_approvals.agreement_id
      and agreement.family_id = (select private.current_family_id())
  )
);

drop policy if exists agreement_approvals_self_insert on public.agreement_approvals;
create policy agreement_approvals_self_insert
on public.agreement_approvals for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and exists (
    select 1
    from public.agreements as agreement
    where agreement.id = agreement_approvals.agreement_id
      and agreement.family_id = (select private.current_family_id())
  )
);

drop policy if exists agreement_approvals_self_update on public.agreement_approvals;
create policy agreement_approvals_self_update
on public.agreement_approvals for update
to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.agreements as agreement
    where agreement.id = agreement_approvals.agreement_id
      and agreement.family_id = (select private.current_family_id())
  )
);

drop policy if exists agreement_approvals_self_delete on public.agreement_approvals;
create policy agreement_approvals_self_delete
on public.agreement_approvals for delete
to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.agreements as agreement
    where agreement.id = agreement_approvals.agreement_id
      and agreement.family_id = (select private.current_family_id())
  )
);

comment on function private.current_family_id() is
  'RLS helper: returns only the signed-in user''s family id; kept outside exposed schemas.';

