-- A missing boolean must never be interpreted as consent to reveal a private B card.
-- CREATE OR REPLACE preserves existing grants, triggers, rows and explicit choices.
create or replace function public.set_understanding_card_share(p_card_id text,p_share boolean)
returns void language plpgsql security definer set search_path='' as $$
declare caller_id uuid := (select auth.uid());
declare active_family uuid;
begin
  if caller_id is null then raise exception 'authentication required' using errcode='42501'; end if;
  if p_share is null then raise exception 'explicit share choice required' using errcode='22023'; end if;
  if p_card_id is null or not (p_card_id = any(array['general-02','general-03','general-04','general-05','general-06','general-07','general-09','general-12','general-14','general-15','general-18','general-19','general-27'])) then
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
  on conflict(user_id,deck_id,card_id) do update
    set family_id=excluded.family_id, shared_at=pg_catalog.now();
end $$;
