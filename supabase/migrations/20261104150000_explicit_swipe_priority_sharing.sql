-- Explicit, revocable teen consent for sharing an already eligible +1 priority.
-- Historical private importance rows are never treated as consent.

create table public.swipe_priority_shares (
  user_id uuid not null references auth.users(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  deck_id text not null,
  card_id text not null,
  shared_at timestamptz not null default now(),
  primary key (user_id, deck_id, card_id)
);

alter table public.swipe_priority_shares enable row level security;
revoke all on public.swipe_priority_shares from public, anon, authenticated;
grant select on public.swipe_priority_shares to authenticated;

create policy swipe_priority_shares_self_select
on public.swipe_priority_shares for select to authenticated
using (user_id = (select auth.uid()));

-- Preserve the reviewed A catalogue and exact-pair checks from the earlier
-- migration behind an internal-only function. It deliberately has no API grant.
alter function public.shared_swipe_priorities(text)
  rename to eligible_swipe_priorities;
revoke all on function public.eligible_swipe_priorities(text)
  from public, anon, authenticated;

create function public.set_swipe_priority_share(
  p_deck_id text,
  p_card_id text,
  p_share boolean
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  active_family uuid;
begin
  if caller_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_share is null then
    raise exception 'share choice is required' using errcode = '22023';
  end if;
  if p_deck_id is null or not (p_deck_id = any(array[
    'general','samtal','aktiviteter','regler','uppskattning','aterhamtning','forandring'
  ]::text[])) or p_card_id is null or pg_catalog.btrim(p_card_id) = '' then
    raise exception 'unsupported swipe card' using errcode = '22023';
  end if;

  -- Revocation remains available after an answer, importance or pairing change.
  if p_share is false then
    delete from public.swipe_priority_shares
    where user_id = caller_id and deck_id = p_deck_id and card_id = p_card_id;
    return;
  end if;

  select member.family_id into active_family
  from public.family_members as member
  where member.user_id = caller_id
    and member.role = 'teen'
    and (select count(*) from public.family_members where user_id = caller_id) = 1
    and (select count(*) from public.family_members where family_id = member.family_id) = 2
    and (select count(*) from public.family_members where family_id = member.family_id and role = 'teen') = 1
    and (select count(*) from public.family_members where family_id = member.family_id and role = 'parent') = 1;

  if active_family is null
     or not exists (
       select 1 from public.swipe_importance as importance
       where importance.user_id = caller_id
         and importance.deck_id = p_deck_id
         and importance.card_id = p_card_id
         and importance.importance = 1
     )
     or not exists (
       select 1 from public.eligible_swipe_priorities(p_deck_id) as eligible
       where eligible.deck_id = p_deck_id and eligible.card_id = p_card_id
     ) then
    raise exception 'card is not eligible for priority sharing' using errcode = '42501';
  end if;

  insert into public.swipe_priority_shares(user_id, family_id, deck_id, card_id, shared_at)
  values(caller_id, active_family, p_deck_id, p_card_id, pg_catalog.now())
  on conflict(user_id, deck_id, card_id)
  do update set family_id = excluded.family_id, shared_at = excluded.shared_at;
end
$$;

create function public.shared_swipe_priorities(p_deck_id text)
returns table(deck_id text, card_id text)
language sql
stable
security definer
set search_path = ''
as $$
  select eligible.deck_id, eligible.card_id
  from public.eligible_swipe_priorities(p_deck_id) as eligible
  join public.family_members as caller
    on caller.user_id = (select auth.uid())
  join public.family_members as teen
    on teen.family_id = caller.family_id and teen.role = 'teen'
  join public.swipe_priority_shares as consent
    on consent.user_id = teen.user_id
   and consent.family_id = caller.family_id
   and consent.deck_id = eligible.deck_id
   and consent.card_id = eligible.card_id
  where (select count(*) from public.family_members where user_id = (select auth.uid())) = 1
    and (select count(*) from public.family_members where family_id = caller.family_id) = 2
    and not exists (
      select 1 from public.swipe_skips as skipped
      where skipped.user_id = teen.user_id
        and skipped.deck_id = eligible.deck_id
        and skipped.card_id = eligible.card_id
    )
  order by eligible.card_id
$$;

create function public.revoke_swipe_priority_share_on_importance_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' or new.importance <> 1 then
    delete from public.swipe_priority_shares
    where user_id = old.user_id and deck_id = old.deck_id and card_id = old.card_id;
  end if;
  return coalesce(new, old);
end
$$;

create trigger revoke_priority_share_after_importance_change
after update or delete on public.swipe_importance
for each row execute function public.revoke_swipe_priority_share_on_importance_change();

create function public.revoke_swipe_priority_share_on_answer_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.swipe_priority_shares as consent
  where consent.deck_id = old.deck_id
    and consent.card_id = old.card_id
    and consent.family_id in (
      select member.family_id from public.family_members as member
      where member.user_id = old.user_id
    );
  return coalesce(new, old);
end
$$;

create trigger revoke_priority_share_after_answer_change
after update or delete on public.swipe_answers
for each row execute function public.revoke_swipe_priority_share_on_answer_change();

create function public.revoke_swipe_priority_share_on_skip_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.swipe_priority_shares
  where user_id = new.user_id and deck_id = new.deck_id and card_id = new.card_id;
  return new;
end
$$;

create trigger revoke_priority_share_after_skip_change
after insert or update on public.swipe_skips
for each row execute function public.revoke_swipe_priority_share_on_skip_change();

create function public.revoke_swipe_priority_shares_on_family_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_family uuid;
  new_family uuid;
begin
  if tg_op <> 'INSERT' then old_family := old.family_id; end if;
  if tg_op <> 'DELETE' then new_family := new.family_id; end if;
  delete from public.swipe_priority_shares
  where family_id = old_family or family_id = new_family;
  return coalesce(new, old);
end
$$;

create trigger revoke_priority_shares_after_family_change
after insert or update or delete on public.family_members
for each row execute function public.revoke_swipe_priority_shares_on_family_change();

revoke all on function public.set_swipe_priority_share(text, text, boolean) from public, anon;
revoke all on function public.shared_swipe_priorities(text) from public, anon;
revoke all on function public.revoke_swipe_priority_share_on_importance_change() from public, anon, authenticated;
revoke all on function public.revoke_swipe_priority_share_on_answer_change() from public, anon, authenticated;
revoke all on function public.revoke_swipe_priority_share_on_skip_change() from public, anon, authenticated;
revoke all on function public.revoke_swipe_priority_shares_on_family_change() from public, anon, authenticated;
grant execute on function public.set_swipe_priority_share(text, text, boolean) to authenticated;
grant execute on function public.shared_swipe_priorities(text) to authenticated;

comment on table public.swipe_priority_shares is
  'Explicit, pair-bound teen consent for sharing an eligible +1 priority; historical private importance is never copied.';
comment on function public.shared_swipe_priorities(text) is
  'Returns only explicitly teen-shared, catalogued A cards with exact parent+teen mutual YES and current teen importance +1; never returns raw levels or absence.';
