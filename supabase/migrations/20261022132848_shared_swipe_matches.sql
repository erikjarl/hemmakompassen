-- Expose only an aggregate of two matching answers in the signed-in user's
-- two-person family. Individual answers remain protected by the self-only RLS
-- policies on swipe_answers.

revoke all privileges on public.swipe_answers from anon, authenticated;
grant select, delete on public.swipe_answers to authenticated;
-- The live upsert writes updated_at on INSERT as well as on UPDATE.
grant insert (user_id, deck_id, card_id, answer, updated_at) on public.swipe_answers to authenticated;
grant update (answer, updated_at) on public.swipe_answers to authenticated;

create or replace function public.shared_swipe_matches(p_deck_id text)
returns table (
  deck_id text,
  card_id text,
  answer boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_deck_id is null or btrim(p_deck_id) = '' or length(p_deck_id) > 80 then
    raise exception 'deck id must contain 1 to 80 characters'
      using errcode = '22023';
  end if;

  if (select auth.uid()) is null then
    raise exception 'authentication required'
      using errcode = '42501';
  end if;

  return query
  with paired_family as (
    select fm.family_id
    from public.family_members as fm
    where fm.user_id = (select auth.uid())
      and (
        select count(*)
        from public.family_members as caller_membership
        where caller_membership.user_id = (select auth.uid())
      ) = 1
      and (
        select count(*)
        from public.family_members as member_count
        where member_count.family_id = fm.family_id
      ) = 2
  ),
  family_answers as (
    select sa.deck_id, sa.card_id, sa.answer, sa.user_id
    from paired_family as family
    join public.family_members as member
      on member.family_id = family.family_id
    join public.swipe_answers as sa
      on sa.user_id = member.user_id
    where sa.deck_id = p_deck_id
  )
  select
    family_answers.deck_id,
    family_answers.card_id,
    bool_and(family_answers.answer) as answer
  from family_answers
  group by family_answers.deck_id, family_answers.card_id
  having count(distinct family_answers.user_id) = 2
     and count(distinct family_answers.answer) = 1
  order by family_answers.card_id;
end
$$;

revoke all on function public.shared_swipe_matches(text) from public, anon;
grant execute on function public.shared_swipe_matches(text) to authenticated;

comment on function public.shared_swipe_matches(text) is
  'Returns only same-choice cards answered by both members of the caller''s two-person family. A false answer means both declined and is not a shared interest.';
