-- SECURITY: prevent historical teen understanding (B) answers from being returned
-- by the general-deck RPC even if both accounts previously answered YES.
-- Only 21 reviewed A match IDs are shareable; theme decks still use JA+JA.
-- Review-only: do not apply to production without explicit approval.
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
declare
  allowed_general_match_ids constant text[] := array[
    'general-01','general-08','general-10','general-11','general-13',
    'general-16','general-17','general-20','general-21','general-22',
    'general-23','general-24','general-25','general-26','general-28',
    'general-29','general-30','general-31','general-32','general-33','general-34'
  ];
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
      and (
        select count(distinct roles.role) from public.family_members as roles
        where roles.family_id = fm.family_id and roles.role in ('parent','teen')
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
      and (p_deck_id <> 'general' or sa.card_id = any(allowed_general_match_ids))
  )
  select
    family_answers.deck_id,
    family_answers.card_id,
    bool_and(family_answers.answer) as answer
  from family_answers
  group by family_answers.deck_id, family_answers.card_id
  having count(distinct family_answers.user_id) = 2
     and count(distinct family_answers.answer) = 1
     and bool_and(family_answers.answer) is true
  order by family_answers.card_id;
end
$$;


revoke all on function public.shared_swipe_matches(text) from public, anon;
grant execute on function public.shared_swipe_matches(text) to authenticated;

comment on function public.shared_swipe_matches(text) is
  'Returns only mutual YES for an exact parent/teen pair; the general deck exposes only reviewed A match cards, never B understanding cards or unknown IDs.';
