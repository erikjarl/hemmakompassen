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
      ('samtal','samtal-09'),('samtal','samtal-10'),('samtal','samtal-11'),
      ('samtal','samtal-12'),('samtal','samtal-13'),('samtal','samtal-14'),
      ('samtal','samtal-15'),('samtal','samtal-16'),('samtal','samtal-17'),
      ('samtal','samtal-18'),('samtal','samtal-19'),('samtal','samtal-20'),
      ('samtal','samtal-21'),('samtal','samtal-22'),('samtal','samtal-23'),
      ('samtal','samtal-24'),('samtal','samtal-25'),('samtal','samtal-26'),
      ('samtal','samtal-27'),('samtal','samtal-28'),('samtal','samtal-29'),
      ('samtal','samtal-30'),('samtal','samtal-31'),('samtal','samtal-32'),
      ('samtal','samtal-33'),('samtal','samtal-34'),('samtal','samtal-35'),
      ('samtal','samtal-36'),('samtal','samtal-37'),('samtal','samtal-38'),
      ('samtal','samtal-39'),('samtal','samtal-40'),('samtal','samtal-41'),
      ('samtal','samtal-42'),('samtal','samtal-43'),('samtal','samtal-44'),
      ('samtal','samtal-45'),('samtal','samtal-46'),('samtal','samtal-47'),
      ('samtal','samtal-48'),('samtal','samtal-49'),('samtal','samtal-50'),
      ('samtal','samtal-51'),('samtal','samtal-52'),('samtal','samtal-53'),
      ('samtal','samtal-54'),('samtal','samtal-55'),('samtal','samtal-56'),
      ('samtal','samtal-57'),('samtal','samtal-58'),('samtal','samtal-59'),
      ('samtal','samtal-60'),('samtal','samtal-61'),('samtal','samtal-62'),
      ('samtal','samtal-63'),('samtal','samtal-64'),('samtal','samtal-65'),
      ('samtal','samtal-66'),('samtal','samtal-67'),('samtal','samtal-68'),
      ('samtal','samtal-69'),('samtal','samtal-70'),('samtal','samtal-71'),
      ('samtal','samtal-72'),('samtal','samtal-73'),('samtal','samtal-74'),
      ('samtal','samtal-75'),('samtal','samtal-76'),('samtal','samtal-77'),
      ('samtal','samtal-78'),('samtal','samtal-79'),('samtal','samtal-80'),
      ('samtal','samtal-81'),('samtal','samtal-82'),('samtal','samtal-83'),
      ('samtal','samtal-84'),('samtal','samtal-85'),('samtal','samtal-86'),
      ('samtal','samtal-87'),('samtal','samtal-88'),('samtal','samtal-89'),
      ('samtal','samtal-90'),('samtal','samtal-91'),('samtal','samtal-92'),
      ('samtal','samtal-93'),('samtal','samtal-94'),('samtal','samtal-95'),
      ('samtal','samtal-96'),('samtal','samtal-97'),('samtal','samtal-98'),
      ('samtal','samtal-99'),('samtal','samtal-100'),('samtal','samtal-101'),
      ('samtal','samtal-102'),('samtal','samtal-103'),('samtal','samtal-104'),
      ('aktiviteter','aktiviteter-01'),('aktiviteter','aktiviteter-02'),
      ('aktiviteter','aktiviteter-03'),('aktiviteter','aktiviteter-04'),
      ('aktiviteter','aktiviteter-05'),('aktiviteter','aktiviteter-06'),
      ('aktiviteter','aktiviteter-07'),('aktiviteter','aktiviteter-08'),
      ('aktiviteter','aktiviteter-09'),('aktiviteter','aktiviteter-10'),('aktiviteter','aktiviteter-11'),
      ('aktiviteter','aktiviteter-12'),('aktiviteter','aktiviteter-13'),('aktiviteter','aktiviteter-14'),
      ('aktiviteter','aktiviteter-15'),('aktiviteter','aktiviteter-16'),('aktiviteter','aktiviteter-17'),
      ('aktiviteter','aktiviteter-18'),('aktiviteter','aktiviteter-19'),('aktiviteter','aktiviteter-20'),
      ('aktiviteter','aktiviteter-21'),('aktiviteter','aktiviteter-22'),('aktiviteter','aktiviteter-23'),
      ('aktiviteter','aktiviteter-24'),('aktiviteter','aktiviteter-25'),('aktiviteter','aktiviteter-26'),
      ('aktiviteter','aktiviteter-27'),('aktiviteter','aktiviteter-28'),('aktiviteter','aktiviteter-29'),
      ('aktiviteter','aktiviteter-30'),('aktiviteter','aktiviteter-31'),('aktiviteter','aktiviteter-32'),
      ('aktiviteter','aktiviteter-33'),('aktiviteter','aktiviteter-34'),('aktiviteter','aktiviteter-35'),
      ('aktiviteter','aktiviteter-36'),('aktiviteter','aktiviteter-37'),('aktiviteter','aktiviteter-38'),
      ('aktiviteter','aktiviteter-39'),('aktiviteter','aktiviteter-40'),('aktiviteter','aktiviteter-41'),
      ('aktiviteter','aktiviteter-42'),('aktiviteter','aktiviteter-43'),('aktiviteter','aktiviteter-44'),
      ('aktiviteter','aktiviteter-45'),('aktiviteter','aktiviteter-46'),('aktiviteter','aktiviteter-47'),
      ('aktiviteter','aktiviteter-48'),('aktiviteter','aktiviteter-49'),('aktiviteter','aktiviteter-50'),
      ('aktiviteter','aktiviteter-51'),('aktiviteter','aktiviteter-52'),('aktiviteter','aktiviteter-53'),
      ('aktiviteter','aktiviteter-54'),('aktiviteter','aktiviteter-55'),('aktiviteter','aktiviteter-56'),
      ('aktiviteter','aktiviteter-57'),('aktiviteter','aktiviteter-58'),('aktiviteter','aktiviteter-59'),
      ('aktiviteter','aktiviteter-60'),('aktiviteter','aktiviteter-61'),('aktiviteter','aktiviteter-62'),
      ('aktiviteter','aktiviteter-63'),('aktiviteter','aktiviteter-64'),('aktiviteter','aktiviteter-65'),
      ('aktiviteter','aktiviteter-66'),('aktiviteter','aktiviteter-67'),('aktiviteter','aktiviteter-68'),
      ('aktiviteter','aktiviteter-69'),('aktiviteter','aktiviteter-70'),('aktiviteter','aktiviteter-71'),
      ('aktiviteter','aktiviteter-72'),('aktiviteter','aktiviteter-73'),('aktiviteter','aktiviteter-74'),
      ('aktiviteter','aktiviteter-75'),('aktiviteter','aktiviteter-76'),('aktiviteter','aktiviteter-77'),
      ('aktiviteter','aktiviteter-78'),('aktiviteter','aktiviteter-79'),('aktiviteter','aktiviteter-80'),
      ('aktiviteter','aktiviteter-81'),('aktiviteter','aktiviteter-82'),('aktiviteter','aktiviteter-83'),
      ('aktiviteter','aktiviteter-84'),('aktiviteter','aktiviteter-85'),('aktiviteter','aktiviteter-86'),
      ('aktiviteter','aktiviteter-87'),('aktiviteter','aktiviteter-88'),('aktiviteter','aktiviteter-89'),
      ('aktiviteter','aktiviteter-90'),('aktiviteter','aktiviteter-91'),('aktiviteter','aktiviteter-92'),
      ('aktiviteter','aktiviteter-93'),('aktiviteter','aktiviteter-94'),('aktiviteter','aktiviteter-95'),
      ('aktiviteter','aktiviteter-96'),('aktiviteter','aktiviteter-97'),('aktiviteter','aktiviteter-98'),
      ('aktiviteter','aktiviteter-99'),('aktiviteter','aktiviteter-100'),('aktiviteter','aktiviteter-101'),
      ('aktiviteter','aktiviteter-102'),('aktiviteter','aktiviteter-103'),('aktiviteter','aktiviteter-104'),
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
