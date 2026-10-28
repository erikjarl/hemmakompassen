-- Review-only B sharing boundary. Historical private YES is never consent.
create table public.understanding_card_shares(
  user_id uuid not null references auth.users(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  deck_id text not null check(deck_id='general'), card_id text not null,
  shared_at timestamptz not null default now(), primary key(user_id,deck_id,card_id)
);
alter table public.understanding_card_shares enable row level security;
revoke all on public.understanding_card_shares from public,anon,authenticated;
grant select on public.understanding_card_shares to authenticated;
create policy understanding_shares_self_select on public.understanding_card_shares
  for select to authenticated using(user_id=(select auth.uid()));

create function public.set_understanding_card_share(p_card_id text,p_share boolean)
returns void language plpgsql security definer set search_path='' as $$
declare caller_id uuid := (select auth.uid());
declare active_family uuid;
begin
  if caller_id is null then raise exception 'authentication required' using errcode='42501'; end if;
  if p_card_id <> all(array['general-02','general-03','general-04','general-05','general-06','general-07','general-09','general-12','general-14','general-15','general-18','general-19','general-27']) then
    raise exception 'invalid understanding card' using errcode='22023';
  end if;
  if p_share is false then
    delete from public.understanding_card_shares where user_id=caller_id and deck_id='general' and card_id=p_card_id; return;
  end if;
  if not exists(
    select 1 from public.family_members m where m.user_id=caller_id and m.role='teen'
      and (select count(*) from public.family_members where user_id=caller_id)=1
      and (select count(*) from public.family_members where family_id=m.family_id)=2
      and (select count(*) from public.family_members where family_id=m.family_id and role='parent')=1
      and (select count(*) from public.family_members where family_id=m.family_id and role='teen')=1
  ) or not exists(
    select 1 from public.swipe_answers a where a.user_id=caller_id and a.deck_id='general' and a.card_id=p_card_id and a.answer is true
  ) or exists(
    select 1 from public.swipe_skips s where s.user_id=caller_id and s.deck_id='general' and s.card_id=p_card_id
  ) then raise exception 'card is not eligible for sharing' using errcode='42501'; end if;
  select m.family_id into active_family from public.family_members m where m.user_id=caller_id;
  insert into public.understanding_card_shares(user_id,family_id,deck_id,card_id) values(caller_id,active_family,'general',p_card_id)
  on conflict(user_id,deck_id,card_id) do update set shared_at=now();
end $$;

create function public.revoke_understanding_share_on_private_change()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  delete from public.understanding_card_shares
  where user_id=coalesce(old.user_id,new.user_id) and deck_id=coalesce(old.deck_id,new.deck_id) and card_id=coalesce(old.card_id,new.card_id);
  return coalesce(new,old);
end $$;
create trigger revoke_understanding_share_after_answer after update or delete on public.swipe_answers
for each row execute function public.revoke_understanding_share_on_private_change();
create trigger revoke_understanding_share_after_skip after insert or update on public.swipe_skips
for each row execute function public.revoke_understanding_share_on_private_change();

-- A consent belongs to one exact active pair. Any membership topology change
-- invalidates it, so delete/re-pair or a temporary third member cannot revive
-- a consent that was given under an earlier family composition.
create function public.revoke_understanding_shares_on_family_change()
returns trigger language plpgsql security definer set search_path='' as $$
declare old_family uuid;
declare new_family uuid;
begin
  if tg_op <> 'INSERT' then old_family := old.family_id; end if;
  if tg_op <> 'DELETE' then new_family := new.family_id; end if;
  delete from public.understanding_card_shares
  where family_id=old_family or family_id=new_family;
  return coalesce(new,old);
end $$;
create trigger revoke_understanding_shares_after_family_change
after insert or update or delete on public.family_members
for each row execute function public.revoke_understanding_shares_on_family_change();

create function public.shared_understanding_cards()
returns table(deck_id text,card_id text)
language sql stable security definer set search_path='' as $$
  with paired_family as(
    select caller.family_id from public.family_members caller
    where caller.user_id=(select auth.uid())
      and (select count(*) from public.family_members where user_id=(select auth.uid()))=1
      and (select count(*) from public.family_members where family_id=caller.family_id)=2
      and (select count(*) from public.family_members where family_id=caller.family_id and role='parent')=1
      and (select count(*) from public.family_members where family_id=caller.family_id and role='teen')=1
  )
  select share.deck_id,share.card_id from paired_family family
  join public.family_members teen on teen.family_id=family.family_id and teen.role='teen'
  join public.understanding_card_shares share on share.user_id=teen.user_id and share.family_id=family.family_id
  join public.swipe_answers answer on answer.user_id=teen.user_id and answer.deck_id=share.deck_id and answer.card_id=share.card_id and answer.answer is true
  where not exists(select 1 from public.swipe_skips skipped where skipped.user_id=teen.user_id and skipped.deck_id=share.deck_id and skipped.card_id=share.card_id)
    and share.card_id = any(array['general-02','general-03','general-04','general-05','general-06','general-07','general-09','general-12','general-14','general-15','general-18','general-19','general-27'])
  order by share.card_id
$$;
revoke all on function public.set_understanding_card_share(text,boolean) from public,anon;
revoke all on function public.shared_understanding_cards() from public,anon;
revoke all on function public.revoke_understanding_shares_on_family_change() from public,anon,authenticated;
grant execute on function public.set_understanding_card_share(text,boolean),public.shared_understanding_cards() to authenticated;
comment on table public.understanding_card_shares is 'Explicit teen sharing consent only; historical private answers are not copied.';
