-- NOT-01B phase 1: server-authored, pair-epoch-bound activity digests.
-- Installed in the Hemmakompassen test Supabase project as 20261107081525_pair_activity_notifications on 2026-11-07.
-- No backfill: old private choices must never create notifications retroactively.
create table public.activity_notification_event_keys (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  parent_id uuid not null references auth.users(id) on delete cascade,
  teen_id uuid not null references auth.users(id) on delete cascade,
  parent_joined_at timestamptz not null,
  teen_joined_at timestamptz not null,
  actor_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  event_kind text not null check (event_kind in ('mutual_match','teen_shared_understanding')),
  deck_id text not null,
  card_id text not null,
  event_date date not null,
  created_at timestamptz not null default pg_catalog.now(),
  constraint activity_event_once_per_pair unique (
    family_id,parent_id,teen_id,parent_joined_at,teen_joined_at,
    recipient_id,event_kind,deck_id,card_id
  )
);

create table public.activity_notifications (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  parent_id uuid not null references auth.users(id) on delete cascade,
  teen_id uuid not null references auth.users(id) on delete cascade,
  parent_joined_at timestamptz not null,
  teen_joined_at timestamptz not null,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  event_kind text not null check (event_kind in ('mutual_match','teen_shared_understanding')),
  deck_id text not null,
  event_date date not null,
  read_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint activity_notifications_unique_digest unique (
    family_id,parent_id,teen_id,parent_joined_at,teen_joined_at,
    recipient_id,event_kind,deck_id,event_date
  )
);
create index activity_notifications_recipient_recent
  on public.activity_notifications (recipient_id,updated_at desc);

-- RPC-only tables: even authenticated clients cannot insert their own event.
alter table public.activity_notification_event_keys enable row level security;
alter table public.activity_notifications enable row level security;
revoke all on public.activity_notification_event_keys,public.activity_notifications
  from public,anon,authenticated;

-- Both branches validate current consent and the exact active two-person pair.
-- This function is *only* called by the two database triggers below.
create or replace function private.record_activity_notification(
  p_kind text,p_deck_id text,p_card_id text,p_actor uuid,p_recipient uuid
)
returns void language plpgsql volatile security definer set search_path='' as $$
declare
  v_family uuid;
  v_parent uuid;
  v_teen uuid;
  v_parent_joined timestamptz;
  v_teen_joined timestamptz;
  v_event_id uuid;
  v_deck_max integer;
  v_day date := (pg_catalog.now() at time zone 'UTC')::date;
begin
  if (select auth.uid()) is null or p_actor is distinct from (select auth.uid())
     or p_actor = p_recipient or p_recipient is null then
    return;
  end if;
  v_family := private.current_exact_pair_family_id();
  if v_family is null then return; end if;
  select p.user_id,t.user_id,p.joined_at,t.joined_at
    into v_parent,v_teen,v_parent_joined,v_teen_joined
  from public.family_members p
  join public.family_members t on t.family_id=p.family_id and t.role='teen'
  where p.family_id=v_family and p.role='parent'
    and (select count(*) from public.family_members m where m.user_id=p.user_id)=1
    and (select count(*) from public.family_members m where m.user_id=t.user_id)=1;
  if v_parent is null or v_teen is null
    or p_actor not in (v_parent,v_teen)
    or p_recipient not in (v_parent,v_teen) then return; end if;

  if p_kind='mutual_match' then
    if p_deck_id is null or not (p_deck_id = any(array[
      'general','samtal','aktiviteter','regler','uppskattning','aterhamtning','forandring'
    ]::text[])) then return; end if;
    -- Check the actual base rows in this VOLATILE trigger. The existing
    -- STABLE shared_swipe_matches RPC does not see changes made by the
    -- statement that is currently firing this AFTER ROW trigger.
    if p_deck_id='general' then
      if p_card_id is null or not (p_card_id=any(array[
        'general-01','general-08','general-10','general-11','general-13',
        'general-16','general-17','general-20','general-21','general-22',
        'general-23','general-24','general-25','general-26','general-28',
        'general-29','general-30','general-31','general-32','general-33','general-34'
      ]::text[])) then return; end if;
    else
      v_deck_max:=case p_deck_id
        when 'samtal' then 104 when 'aktiviteter' then 104
        when 'regler' then 12 when 'uppskattning' then 8
        when 'aterhamtning' then 8 when 'forandring' then 8
        else 0 end;
      if not exists (
        select 1 from pg_catalog.generate_series(1,v_deck_max) as allowed(number)
        where p_card_id=p_deck_id||'-'||
          case when allowed.number<10 then '0' else '' end||allowed.number::text
      ) then return; end if;
    end if;
    -- Concurrent YES submissions may both miss the other's uncommitted row.
    -- Serialize matching checks per family and card; the VOLATILE SELECT
    -- below obtains a fresh snapshot after any competing writer commits.
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtext(v_family::text),
      pg_catalog.hashtext(p_deck_id||':'||p_card_id)
    );
    if (select count(*)
        from public.swipe_answers a
        where a.user_id in (v_parent,v_teen) and a.deck_id=p_deck_id
          and a.card_id=p_card_id and a.answer is true)<>2 then return; end if;
  elsif p_kind='teen_shared_understanding' then
    if p_actor<>v_teen or p_recipient<>v_parent or p_deck_id<>'general' then return; end if;
    if p_card_id is null or not (p_card_id=any(array[
      'general-02','general-03','general-04','general-05','general-06',
      'general-07','general-09','general-12','general-14','general-15',
      'general-18','general-19','general-27'
    ]::text[])) then return; end if;
    if not exists (
      select 1 from public.understanding_card_shares s
      join public.swipe_answers a on a.user_id=s.user_id
        and a.deck_id=s.deck_id and a.card_id=s.card_id
        and a.answer is true
      where s.user_id=v_teen and s.family_id=v_family
        and s.deck_id=p_deck_id and s.card_id=p_card_id
        and not exists (
          select 1 from public.swipe_skips skipped
          where skipped.user_id=s.user_id and skipped.deck_id=s.deck_id
            and skipped.card_id=s.card_id
        )
    ) then return; end if;
  else
    return;
  end if;

  insert into public.activity_notification_event_keys (
    family_id,parent_id,teen_id,parent_joined_at,teen_joined_at,
    actor_id,recipient_id,event_kind,deck_id,card_id,event_date
  ) values (
    v_family,v_parent,v_teen,v_parent_joined,v_teen_joined,
    p_actor,p_recipient,p_kind,p_deck_id,p_card_id,v_day
  )
  on conflict on constraint activity_event_once_per_pair do nothing
  returning id into v_event_id;
  if v_event_id is null then return; end if;

  -- One item per family/recipient/deck/kind/day, even for 100 card matches.
  insert into public.activity_notifications (
    family_id,parent_id,teen_id,parent_joined_at,teen_joined_at,
    recipient_id,event_kind,deck_id,event_date
  ) values (
    v_family,v_parent,v_teen,v_parent_joined,v_teen_joined,
    p_recipient,p_kind,p_deck_id,v_day
  )
  on conflict on constraint activity_notifications_unique_digest
  do update set updated_at=excluded.updated_at,read_at=null;
end
$$;

create or replace function private.on_activity_swipe_answer()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_recipient uuid;
begin
  if tg_op='DELETE' then
    delete from public.activity_notification_event_keys e
      where e.event_kind='mutual_match' and e.deck_id=old.deck_id
        and e.card_id=old.card_id
        and (e.parent_id=old.user_id or e.teen_id=old.user_id);
    return null;
  end if;
  if new.answer is not true then
    delete from public.activity_notification_event_keys e
      where e.event_kind='mutual_match' and e.deck_id=new.deck_id
        and e.card_id=new.card_id
        and (e.parent_id=new.user_id or e.teen_id=new.user_id);
    return null;
  end if;
  if new.user_id is distinct from (select auth.uid()) then return null; end if;
  if tg_op='UPDATE' then
    if old.answer is not distinct from new.answer then return null; end if;
  end if;
  select m.user_id into v_recipient
  from public.family_members me
  join public.family_members m on m.family_id=me.family_id and m.user_id<>me.user_id
  where me.user_id=new.user_id and me.family_id=private.current_exact_pair_family_id()
  limit 1;
  if v_recipient is not null then
    perform private.record_activity_notification(
      'mutual_match',new.deck_id,new.card_id,new.user_id,v_recipient
    );
  end if;
  return null;
end
$$;

create trigger activity_notification_swipe_yes
  after insert or update of answer or delete on public.swipe_answers
  for each row execute function private.on_activity_swipe_answer();

create or replace function private.on_activity_understanding_share()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_parent uuid;
begin
  if new.user_id is distinct from (select auth.uid()) then return null; end if;
  select p.user_id into v_parent
  from public.family_members t
  join public.family_members p on p.family_id=t.family_id and p.role='parent'
  where t.user_id=new.user_id and t.role='teen'
    and t.family_id=private.current_exact_pair_family_id()
  limit 1;
  if v_parent is not null then
    perform private.record_activity_notification(
      'teen_shared_understanding',new.deck_id,new.card_id,new.user_id,v_parent
    );
  end if;
  return null;
end
$$;

create trigger activity_notification_explicit_b_share
  after insert on public.understanding_card_shares
  for each row execute function private.on_activity_understanding_share();

-- Revoke a notification's eligibility when the underlying explicit choice is
-- withdrawn. A new share can then create a genuinely new event.
create or replace function private.on_activity_understanding_revoke()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  delete from public.activity_notification_event_keys e
  where e.event_kind='teen_shared_understanding'
    and e.teen_id=old.user_id and e.deck_id=old.deck_id
    and e.card_id=old.card_id;
  return null;
end
$$;
create trigger activity_notification_b_unshare
  after delete on public.understanding_card_shares
  for each row execute function private.on_activity_understanding_revoke();

-- Remove stale epochs when members leave, join, switch families or their join epoch changes.
create or replace function private.clear_activity_notifications_on_pair_change()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_old uuid;
declare v_new uuid;
begin
  if tg_op<>'INSERT' then v_old:=old.family_id; end if;
  if tg_op<>'DELETE' then v_new:=new.family_id; end if;
  delete from public.activity_notification_event_keys e
    where e.family_id=v_old or e.family_id=v_new;
  delete from public.activity_notifications n
    where n.family_id=v_old or n.family_id=v_new;
  return null;
end
$$;
create trigger clear_activity_notifications_after_membership
  after insert or update or delete on public.family_members
  for each row execute function private.clear_activity_notifications_on_pair_change();

-- Never return card text, private answers or event actors. Recheck current
-- mutual YES or *current explicit* B consent for every underlying event.
create or replace function public.my_activity_notifications()
returns table (
  notification_id uuid,event_kind text,deck_id text,
  read_at timestamptz,updated_at timestamptz
)
language sql stable security definer set search_path='' as $$
  select n.id,n.event_kind,n.deck_id,n.read_at,n.updated_at
  from public.activity_notifications n
  join public.family_members p on p.family_id=n.family_id and p.role='parent'
  join public.family_members t on t.family_id=n.family_id and t.role='teen'
  where (select auth.uid()) is not null
    and n.recipient_id=(select auth.uid())
    and n.family_id=private.current_exact_pair_family_id()
    and p.user_id=n.parent_id and t.user_id=n.teen_id
    and p.joined_at=n.parent_joined_at and t.joined_at=n.teen_joined_at
    and (select count(*) from public.family_members m where m.user_id=p.user_id)=1
    and (select count(*) from public.family_members m where m.user_id=t.user_id)=1
    and exists (
      select 1
      from public.activity_notification_event_keys e
      where e.family_id=n.family_id
        and e.parent_id=n.parent_id and e.teen_id=n.teen_id
        and e.parent_joined_at=n.parent_joined_at
        and e.teen_joined_at=n.teen_joined_at
        and e.recipient_id=n.recipient_id
        and e.event_kind=n.event_kind and e.deck_id=n.deck_id
        and e.event_date=n.event_date
        and (
          (e.event_kind='mutual_match' and exists (
            select 1 from public.shared_swipe_matches(e.deck_id) s
            where s.deck_id=e.deck_id and s.card_id=e.card_id and s.answer is true
          ))
          or
          (e.event_kind='teen_shared_understanding' and exists (
            select 1 from public.shared_understanding_cards() s
            where s.deck_id=e.deck_id and s.card_id=e.card_id
          ))
        )
    )
  order by n.updated_at desc,n.id desc
  limit 30
$$;

create or replace function public.mark_activity_notification_read(p_notification_id uuid)
returns void language plpgsql volatile security definer set search_path='' as $$
begin
  if (select auth.uid()) is null or p_notification_id is null then
    raise exception 'authentication and notification ID required' using errcode='42501';
  end if;
  if not exists (
    select 1 from public.my_activity_notifications() n
    where n.notification_id=p_notification_id
  ) then
    raise exception 'notification unavailable' using errcode='42501';
  end if;
  update public.activity_notifications n
    set read_at=coalesce(n.read_at,pg_catalog.now())
  where n.id=p_notification_id and n.recipient_id=(select auth.uid());
end
$$;

revoke all on function private.record_activity_notification(text,text,text,uuid,uuid)
  from public,anon,authenticated;
revoke all on function private.on_activity_swipe_answer() from public,anon,authenticated;
revoke all on function private.on_activity_understanding_share() from public,anon,authenticated;
revoke all on function private.on_activity_understanding_revoke() from public,anon,authenticated;
revoke all on function private.clear_activity_notifications_on_pair_change()
  from public,anon,authenticated;
revoke all on function public.my_activity_notifications() from public,anon;
revoke all on function public.mark_activity_notification_read(uuid) from public,anon;
grant execute on function public.my_activity_notifications() to authenticated;
grant execute on function public.mark_activity_notification_read(uuid) to authenticated;
comment on function public.my_activity_notifications() is
  'Server-authored activity digests; live pair-epoch and mutual-A/explicit-B eligibility checked again on every read.';
