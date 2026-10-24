-- Secure, aggregate-only unlock gate for the six Gillaswajpen theme decks.
-- Apply only after explicit review; no production migration is run by this commit.
-- The general deck currently contains exactly 34 stable IDs (general-01..general-34).
-- If the published deck changes, update this server-side contract and its tests.
-- Never accept a caller-provided card count or a client-side completion flag.

create or replace function public.shared_general_deck_complete()
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  completed boolean;
begin
  if (select auth.uid()) is null then
    raise exception 'authentication required'
      using errcode = '42501';
  end if;

  select exists (
    select 1
    from public.family_members as caller
    where caller.user_id = (select auth.uid())
      and (
        select count(*)
        from public.family_members as memberships
        where memberships.user_id = (select auth.uid())
      ) = 1
      and (
        select count(*)
        from public.family_members as pair
        where pair.family_id = caller.family_id
      ) = 2
      and not exists (
        select 1
        from public.family_members as member
        cross join pg_catalog.generate_series(1, 34) as card(number)
        where member.family_id = caller.family_id
          and not exists (
            select 1
            from public.swipe_answers as answer
            where answer.user_id = member.user_id
              and answer.deck_id = 'general'
              and answer.card_id = 'general-' || pg_catalog.lpad(card.number::text, 2, '0')
          )
      )
  ) into completed;

  return completed;
end
$$;

revoke all on function public.shared_general_deck_complete() from public, anon;
grant execute on function public.shared_general_deck_complete() to authenticated;

comment on function public.shared_general_deck_complete() is
  'True only when both members of the caller''s exact two-person family answered all 34 general cards; returns no answer values, counts, identities or progress.';
