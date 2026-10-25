-- Persist teen-only understanding-card skips without exposing private answers.
-- This migration is review-only until Erik explicitly approves production use.

create table public.swipe_skips (
  user_id uuid not null references auth.users(id) on delete cascade,
  deck_id text not null,
  card_id text not null,
  skipped_at timestamptz not null default now(),
  primary key (user_id, deck_id, card_id)
);

alter table public.swipe_skips enable row level security;
revoke all privileges on public.swipe_skips from anon, authenticated;
grant select on public.swipe_skips to authenticated;

create policy swipe_skips_self_select
on public.swipe_skips for select to authenticated
using (user_id = (select auth.uid()));

create or replace function public.set_understanding_card_state(
  p_card_id text,
  p_answer boolean default null,
  p_skipped boolean default false
)
returns void
language plpgsql
volatile
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
  if p_card_id is null or not (p_card_id = any(understanding_ids)) then
    raise exception 'unsupported understanding card' using errcode = '22023';
  end if;
  if (p_skipped and p_answer is not null) or (not p_skipped and p_answer is null) then
    raise exception 'choose exactly one answer or skip state' using errcode = '22023';
  end if;
  if (select count(*) from public.family_members where user_id = caller_id) <> 1
     or not exists (
       select 1 from public.family_members
       where user_id = caller_id and role = 'teen'
     ) then
    raise exception 'teen role required' using errcode = '42501';
  end if;

  if p_skipped then
    delete from public.swipe_answers
    where user_id = caller_id and deck_id = 'general' and card_id = p_card_id;
    insert into public.swipe_skips (user_id, deck_id, card_id, skipped_at)
    values (caller_id, 'general', p_card_id, pg_catalog.now())
    on conflict (user_id, deck_id, card_id)
    do update set skipped_at = excluded.skipped_at;
  else
    delete from public.swipe_skips
    where user_id = caller_id and deck_id = 'general' and card_id = p_card_id;
    insert into public.swipe_answers (user_id, deck_id, card_id, answer, updated_at)
    values (caller_id, 'general', p_card_id, p_answer, pg_catalog.now())
    on conflict (user_id, deck_id, card_id)
    do update set answer = excluded.answer, updated_at = excluded.updated_at;
  end if;
end
$$;

revoke all on function public.set_understanding_card_state(text, boolean, boolean) from public, anon;
grant execute on function public.set_understanding_card_state(text, boolean, boolean) to authenticated;

comment on function public.set_understanding_card_state(text, boolean, boolean) is
  'Atomically stores a teen understanding-card answer or private skip; never returns answer data.';

-- Replace the obsolete all-34-answers gate. Both people must answer every A
-- match card. The teen must additionally answer or skip every B understanding
-- card; the parent is never required to answer B cards.
create or replace function public.shared_general_deck_complete()
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  completed boolean;
  match_ids constant text[] := array[
    'general-01','general-08','general-10','general-11','general-13',
    'general-16','general-17','general-20','general-21','general-22',
    'general-23','general-24','general-25','general-26','general-28',
    'general-29','general-30','general-31','general-32','general-33','general-34'
  ];
  understanding_ids constant text[] := array[
    'general-02','general-03','general-04','general-05','general-06',
    'general-07','general-09','general-12','general-14','general-15',
    'general-18','general-19','general-27'
  ];
begin
  if caller_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select exists (
    select 1
    from public.family_members as caller
    where caller.user_id = caller_id
      and (select count(*) from public.family_members where user_id = caller_id) = 1
      and (select count(*) from public.family_members where family_id = caller.family_id) = 2
      and (select count(distinct role) from public.family_members where family_id = caller.family_id and role in ('parent','teen')) = 2
      and not exists (
        select 1
        from public.family_members as member
        cross join pg_catalog.unnest(match_ids) as card(id)
        where member.family_id = caller.family_id
          and not exists (
            select 1 from public.swipe_answers as answer
            where answer.user_id = member.user_id
              and answer.deck_id = 'general' and answer.card_id = card.id
          )
      )
      and not exists (
        select 1
        from public.family_members as teen
        cross join pg_catalog.unnest(understanding_ids) as card(id)
        where teen.family_id = caller.family_id and teen.role = 'teen'
          and not exists (
            select 1 from public.swipe_answers as answer
            where answer.user_id = teen.user_id
              and answer.deck_id = 'general' and answer.card_id = card.id
          )
          and not exists (
            select 1 from public.swipe_skips as skipped
            where skipped.user_id = teen.user_id
              and skipped.deck_id = 'general' and skipped.card_id = card.id
          )
      )
  ) into completed;

  return completed;
end
$$;

revoke all on function public.shared_general_deck_complete() from public, anon;
grant execute on function public.shared_general_deck_complete() to authenticated;

comment on function public.shared_general_deck_complete() is
  'True only for an exact parent/teen pair after both answered all A cards and the teen answered or privately skipped every B card; returns no identities, answers or progress.';
