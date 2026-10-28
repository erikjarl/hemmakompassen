-- Separate server boundary for teen-authorised B understanding cards.
-- Review-only: do not apply to production without explicit approval and
-- authenticated two-account verification.

create or replace function public.shared_understanding_cards()
returns table (
  deck_id text,
  card_id text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  understanding_ids constant text[] := array[
    'general-02','general-03','general-04','general-05','general-06',
    'general-07','general-09','general-12','general-14','general-15',
    'general-18','general-19','general-27'
  ];
begin
  if caller_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  return query
  with paired_family as (
    select caller.family_id
    from public.family_members as caller
    where caller.user_id = caller_id
      and (select count(*) from public.family_members where user_id = caller_id) = 1
      and (select count(*) from public.family_members where family_id = caller.family_id) = 2
      and (select count(*) from public.family_members where family_id = caller.family_id and role = 'parent') = 1
      and (select count(*) from public.family_members where family_id = caller.family_id and role = 'teen') = 1
  )
  select answer.deck_id, answer.card_id
  from paired_family as family
  join public.family_members as teen
    on teen.family_id = family.family_id and teen.role = 'teen'
  join public.swipe_answers as answer
    on answer.user_id = teen.user_id
  where answer.deck_id = 'general'
    and answer.card_id = any(understanding_ids)
    and answer.answer is true
    and not exists (
      select 1
      from public.swipe_skips as skipped
      where skipped.user_id = teen.user_id
        and skipped.deck_id = answer.deck_id
        and skipped.card_id = answer.card_id
    )
  order by answer.card_id;
end
$$;

revoke all on function public.shared_understanding_cards() from public, anon;
grant execute on function public.shared_understanding_cards() to authenticated;

comment on function public.shared_understanding_cards() is
  'Returns only allowlisted B card IDs actively answered YES by the teen in an exact parent/teen pair; never returns NO, skips, identities, raw answers or A matches.';
