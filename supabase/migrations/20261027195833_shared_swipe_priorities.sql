-- SECURITY: expose only the existence of teen-prioritised, already shareable
-- A matches. Raw importance values and every non-shareable card stay private.
-- Review-only migration: do not apply to production automatically.
create or replace function public.shared_swipe_priorities(p_deck_id text)
returns table (
  deck_id text,
  card_id text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_deck_id is null or not (p_deck_id = any(array[
    'general','samtal','aktiviteter','regler','uppskattning','aterhamtning','forandring'
  ]::text[])) then
    raise exception 'unsupported deck id' using errcode = '22023';
  end if;

  if (select auth.uid()) is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  return query
  with allowed_cards(allowed_deck_id, allowed_card_id) as (
    values
      ('general','general-01'),('general','general-08'),('general','general-10'),
      ('general','general-11'),('general','general-13'),('general','general-16'),
      ('general','general-17'),('general','general-20'),('general','general-21'),
      ('general','general-22'),('general','general-23'),('general','general-24'),
      ('general','general-25'),('general','general-26'),('general','general-28'),
      ('general','general-29'),('general','general-30'),('general','general-31'),
      ('general','general-32'),('general','general-33'),('general','general-34'),
      ('samtal','samtal-01'),('samtal','samtal-02'),('samtal','samtal-03'),
      ('samtal','samtal-04'),('samtal','samtal-05'),('samtal','samtal-06'),
      ('samtal','samtal-07'),('samtal','samtal-08'),
      ('aktiviteter','aktiviteter-01'),('aktiviteter','aktiviteter-02'),
      ('aktiviteter','aktiviteter-03'),('aktiviteter','aktiviteter-04'),
      ('aktiviteter','aktiviteter-05'),('aktiviteter','aktiviteter-06'),
      ('aktiviteter','aktiviteter-07'),('aktiviteter','aktiviteter-08'),
      ('regler','regler-01'),('regler','regler-02'),('regler','regler-03'),
      ('regler','regler-04'),('regler','regler-05'),('regler','regler-06'),
      ('regler','regler-07'),('regler','regler-08'),('regler','regler-09'),
      ('regler','regler-10'),('regler','regler-11'),('regler','regler-12'),
      ('uppskattning','uppskattning-01'),('uppskattning','uppskattning-02'),
      ('uppskattning','uppskattning-03'),('uppskattning','uppskattning-04'),
      ('uppskattning','uppskattning-05'),('uppskattning','uppskattning-06'),
      ('uppskattning','uppskattning-07'),('uppskattning','uppskattning-08'),
      ('aterhamtning','aterhamtning-01'),('aterhamtning','aterhamtning-02'),
      ('aterhamtning','aterhamtning-03'),('aterhamtning','aterhamtning-04'),
      ('aterhamtning','aterhamtning-05'),('aterhamtning','aterhamtning-06'),
      ('aterhamtning','aterhamtning-07'),('aterhamtning','aterhamtning-08'),
      ('forandring','forandring-01'),('forandring','forandring-02'),
      ('forandring','forandring-03'),('forandring','forandring-04'),
      ('forandring','forandring-05'),('forandring','forandring-06'),
      ('forandring','forandring-07'),('forandring','forandring-08')
  ),
  paired_family as (
    select
      caller.family_id,
      (array_agg(member.user_id) filter (where member.role = 'teen'))[1] as teen_user_id,
      (array_agg(member.user_id) filter (where member.role = 'parent'))[1] as parent_user_id
    from public.family_members as caller
    join public.family_members as member on member.family_id = caller.family_id
    where caller.user_id = (select auth.uid())
      and (
        select count(*) from public.family_members as caller_membership
        where caller_membership.user_id = (select auth.uid())
      ) = 1
    group by caller.family_id
    having count(*) = 2
       and count(*) filter (where member.role = 'teen') = 1
       and count(*) filter (where member.role = 'parent') = 1
  )
  select allowed.allowed_deck_id, allowed.allowed_card_id
  from paired_family as family
  join allowed_cards as allowed on allowed.allowed_deck_id = p_deck_id
  join public.swipe_answers as teen_answer
    on teen_answer.user_id = family.teen_user_id
   and teen_answer.deck_id = allowed.allowed_deck_id
   and teen_answer.card_id = allowed.allowed_card_id
   and teen_answer.answer is true
  join public.swipe_answers as parent_answer
    on parent_answer.user_id = family.parent_user_id
   and parent_answer.deck_id = allowed.allowed_deck_id
   and parent_answer.card_id = allowed.allowed_card_id
   and parent_answer.answer is true
  join public.swipe_importance as teen_priority
    on teen_priority.user_id = family.teen_user_id
   and teen_priority.deck_id = allowed.allowed_deck_id
   and teen_priority.card_id = allowed.allowed_card_id
   and teen_priority.importance = 1
  order by allowed.allowed_card_id;
end
$$;

revoke all on function public.shared_swipe_priorities(text) from public, anon;
grant execute on function public.shared_swipe_priorities(text) to authenticated;

comment on function public.shared_swipe_priorities(text) is
  'Returns only catalogued A cards with exact parent+teen mutual YES and teen importance +1; never returns raw importance, NO, disagreement, unilateral answers, B cards, skips, or other-family data.';
