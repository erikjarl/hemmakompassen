-- Private, user-owned importance ratings for Gillaswajpen cards.
-- Review-only migration: do not apply to production without explicit approval.

create table public.swipe_importance (
  user_id uuid not null references auth.users(id) on delete cascade,
  deck_id text not null,
  card_id text not null,
  importance smallint not null default 0 check (importance in (-1, 0, 1)),
  updated_at timestamptz not null default now(),
  primary key (user_id, deck_id, card_id)
);

alter table public.swipe_importance enable row level security;
revoke all privileges on public.swipe_importance from public, anon, authenticated;
grant select, delete on public.swipe_importance to authenticated;
grant insert (user_id, deck_id, card_id, importance, updated_at)
  on public.swipe_importance to authenticated;
-- PostgREST upsert includes conflict-key columns in the update statement.
-- RLS still prevents changing ownership or moving a row to another key.
grant update (user_id, deck_id, card_id, importance, updated_at)
  on public.swipe_importance to authenticated;

create policy swipe_importance_self_select
on public.swipe_importance for select to authenticated
using ((select auth.uid()) = user_id);

create policy swipe_importance_self_insert
on public.swipe_importance for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy swipe_importance_self_update
on public.swipe_importance for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy swipe_importance_self_delete
on public.swipe_importance for delete to authenticated
using ((select auth.uid()) = user_id);

comment on table public.swipe_importance is
  'Private self-only Gillaswajpen importance. Never a match, consent, or shared result.';
