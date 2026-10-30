-- SECURITY: replace the partial general-deck allowlist with the complete,
-- versioned A-card catalogue for every currently supported deck.
-- Review-only migration: do not apply to production automatically.
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
  if p_deck_id is null or pg_catalog.char_length(p_deck_id) not between 1 and 80 then
    raise exception 'deck id must contain 1 to 80 characters' using errcode = '22023';
  end if;

  if not (p_deck_id = any(array[
    'general','samtal','aktiviteter','regler','uppskattning','aterhamtning','forandring'
  ]::text[])) then
    raise exception 'unsupported deck id' using errcode = '22023';
  end if;

  if (select auth.uid()) is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  return query
  with allowed_cards(allowed_deck_id, allowed_card_id) as (
    select 'general'::text, id
    from pg_catalog.unnest(array[
      'general-01','general-08','general-10','general-11','general-13',
      'general-16','general-17','general-20','general-21','general-22',
      'general-23','general-24','general-25','general-26','general-28',
      'general-29','general-30','general-31','general-32','general-33','general-34'
    ]::text[]) as id
    union all
    select 'samtal', 'samtal-' || case when number < 10 then '0' else '' end || number::text
    from pg_catalog.generate_series(1,104) as generated(number)
    union all
    select 'aktiviteter', 'aktiviteter-' || case when number < 10 then '0' else '' end || number::text
    from pg_catalog.generate_series(1,104) as generated(number)
    union all
    select 'regler', 'regler-' || case when number < 10 then '0' else '' end || number::text
    from pg_catalog.generate_series(1,12) as generated(number)
    union all
    select 'uppskattning', 'uppskattning-' || case when number < 10 then '0' else '' end || number::text
    from pg_catalog.generate_series(1,8) as generated(number)
    union all
    select 'aterhamtning', 'aterhamtning-' || case when number < 10 then '0' else '' end || number::text
    from pg_catalog.generate_series(1,8) as generated(number)
    union all
    select 'forandring', 'forandring-' || case when number < 10 then '0' else '' end || number::text
    from pg_catalog.generate_series(1,8) as generated(number)
  ),
  paired_family as (
    select caller.family_id
    from public.family_members as caller
    join public.family_members as member on member.family_id = caller.family_id
    where caller.user_id = (select auth.uid())
      and (
        select count(*) from public.family_members as caller_membership
        where caller_membership.user_id = (select auth.uid())
      ) = 1
    group by caller.family_id
    having count(*) = 2
       and count(*) filter (where member.role = 'parent') = 1
       and count(*) filter (where member.role = 'teen') = 1
  )
  select allowed.allowed_deck_id, allowed.allowed_card_id, true
  from paired_family as family
  join allowed_cards as allowed on allowed.allowed_deck_id = p_deck_id
  join public.family_members as first_member on first_member.family_id = family.family_id
  join public.family_members as second_member
    on second_member.family_id = family.family_id
   and second_member.user_id <> first_member.user_id
  join public.swipe_answers as first_answer
    on first_answer.user_id = first_member.user_id
   and first_answer.deck_id = allowed.allowed_deck_id
   and first_answer.card_id = allowed.allowed_card_id
   and first_answer.answer is true
  join public.swipe_answers as second_answer
    on second_answer.user_id = second_member.user_id
   and second_answer.deck_id = allowed.allowed_deck_id
   and second_answer.card_id = allowed.allowed_card_id
   and second_answer.answer is true
  where first_member.user_id < second_member.user_id
  order by allowed.allowed_card_id;
end
$$;

revoke all on function public.shared_swipe_matches(text) from public, anon;
grant execute on function public.shared_swipe_matches(text) to authenticated;

comment on function public.shared_swipe_matches(text) is
  'Returns only catalogued A cards with mutual YES from exactly one active parent and one active teen; never returns B, NO, disagreement, unilateral, unknown, cross-deck, or other-family data.';
