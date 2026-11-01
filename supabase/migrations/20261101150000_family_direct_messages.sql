-- Hemmakompassen: private 1:1 inbox conversation for the CURRENT exact parent/teen pairing.
-- Deliberately separate from Schyssta listan's agreement notifications.
-- The sender cannot pick family_id or recipient_id. Pair membership epochs protect re-pairing.
-- No previous messages, swipe answers, or approvals are changed.

create table if not exists public.family_direct_messages(
  id uuid primary key default pg_catalog.gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid not null references auth.users(id),
  teen_id uuid not null references auth.users(id),
  parent_joined_at timestamptz not null,
  teen_joined_at timestamptz not null,
  request_key uuid not null,
  body text not null check(pg_catalog.char_length(body) between 1 and 1500),
  created_at timestamptz not null default pg_catalog.now(),
  read_at timestamptz,
  constraint family_direct_messages_distinct check(sender_id<>recipient_id),
  constraint family_direct_messages_pair check(
    (sender_id=parent_id and recipient_id=teen_id) or
    (sender_id=teen_id and recipient_id=parent_id)
  ),
  constraint family_direct_messages_retry unique(sender_id,request_key)
);

create index if not exists family_direct_messages_pair_order
  on public.family_direct_messages(family_id,created_at desc,id desc);
create index if not exists family_direct_messages_recipient_unread
  on public.family_direct_messages(recipient_id,created_at desc)
  where read_at is null;
alter table public.family_direct_messages enable row level security;
revoke all on public.family_direct_messages from public,anon,authenticated;

-- Narrow RPC: no arbitrary recipient IDs, no implicit read receipts, no direct table grants.
create or replace function public.send_family_message(p_body text,p_request_key uuid)
returns uuid language plpgsql volatile security definer set search_path=''
as $$
declare
  v_sender uuid := (select auth.uid());
  v_family uuid;
  v_parent uuid;
  v_teen uuid;
  v_parent_epoch timestamptz;
  v_teen_epoch timestamptz;
  v_recipient uuid;
  v_body text;
  v_existing public.family_direct_messages%rowtype;
  v_id uuid;
begin
  if v_sender is null then raise exception 'authentication required' using errcode='42501'; end if;
  if p_body is null or p_request_key is null then
    raise exception 'message and retry key required' using errcode='22023'; end if;
  v_body:=pg_catalog.btrim(p_body);
  if pg_catalog.char_length(v_body) not between 1 and 1500 then
    raise exception 'message must contain 1 to 1500 characters' using errcode='22023'; end if;
  v_family:=private.current_exact_pair_family_id();
  if v_family is null then raise exception 'exact pair required' using errcode='42501'; end if;
  select
    (pg_catalog.array_agg(m.user_id) filter(where m.role='parent'))[1],
    (pg_catalog.array_agg(m.user_id) filter(where m.role='teen'))[1],
    (pg_catalog.array_agg(m.joined_at) filter(where m.role='parent'))[1],
    (pg_catalog.array_agg(m.joined_at) filter(where m.role='teen'))[1]
  into v_parent,v_teen,v_parent_epoch,v_teen_epoch
  from public.family_members m where m.family_id=v_family;

  if v_parent is null or v_teen is null or v_parent_epoch is null or v_teen_epoch is null
    or v_sender not in(v_parent,v_teen) then
    raise exception 'current pair unavailable' using errcode='42501'; end if;
  v_recipient:=case when v_sender=v_parent then v_teen else v_parent end;

  -- Idempotent submission is scoped to the SAME sender, body, partner and epoch.
  select * into v_existing from public.family_direct_messages
  where sender_id=v_sender and request_key=p_request_key;
  if found then
    if v_existing.family_id=v_family
      and v_existing.recipient_id=v_recipient and v_existing.body=v_body
      and v_existing.parent_id=v_parent and v_existing.teen_id=v_teen
      and v_existing.parent_joined_at=v_parent_epoch and v_existing.teen_joined_at=v_teen_epoch
    then return v_existing.id; end if;
    raise exception 'retry key was already used' using errcode='23505';
  end if;

  insert into public.family_direct_messages(
    family_id,sender_id,recipient_id,parent_id,teen_id,
    parent_joined_at,teen_joined_at,request_key,body
  )values(
    v_family,v_sender,v_recipient,v_parent,v_teen,
    v_parent_epoch,v_teen_epoch,p_request_key,v_body
  )
  on conflict(sender_id,request_key) do nothing
  returning id into v_id;
  if v_id is not null then return v_id; end if;

  -- Same-token race: return only if the committed record is identical.
  select * into v_existing from public.family_direct_messages
  where sender_id=v_sender and request_key=p_request_key;
  if found and v_existing.family_id=v_family
    and v_existing.recipient_id=v_recipient and v_existing.body=v_body
    and v_existing.parent_id=v_parent and v_existing.teen_id=v_teen
    and v_existing.parent_joined_at=v_parent_epoch and v_existing.teen_joined_at=v_teen_epoch
  then return v_existing.id; end if;
  raise exception 'retry key was already used' using errcode='23505';
end
$$;

-- Keyset pages: latest 50 messages first, no names/UUIDs of the other account.
create or replace function public.my_family_messages(
  p_before_created_at timestamptz default null,p_before_id uuid default null
)
returns table(message_id uuid,body text,sent_by_me boolean,created_at timestamptz,read_at timestamptz)
language sql stable security definer set search_path=''
as $$
  select m.id,m.body,m.sender_id=(select auth.uid()),m.created_at,m.read_at
  from public.family_direct_messages m
  join public.family_members p on p.family_id=m.family_id and p.role='parent'
  join public.family_members t on t.family_id=m.family_id and t.role='teen'
  where (select auth.uid()) is not null
    and m.family_id=private.current_exact_pair_family_id()
    and (select auth.uid()) in(p.user_id,t.user_id)
    and m.parent_id=p.user_id and m.teen_id=t.user_id
    and m.parent_joined_at=p.joined_at and m.teen_joined_at=t.joined_at
    and ((p_before_created_at is null and p_before_id is null)
         or (p_before_created_at is not null and p_before_id is not null
             and (m.created_at,m.id)<(p_before_created_at,p_before_id)))
  order by m.created_at desc,m.id desc
  limit 50
$$;

create or replace function public.my_family_unread_message_count()
returns integer language sql stable security definer set search_path=''
as $$
  select pg_catalog.count(*)::integer
  from public.family_direct_messages m
  join public.family_members p on p.family_id=m.family_id and p.role='parent'
  join public.family_members t on t.family_id=m.family_id and t.role='teen'
  where (select auth.uid()) is not null
    and m.recipient_id=(select auth.uid())
    and m.read_at is null
    and m.family_id=private.current_exact_pair_family_id()
    and m.parent_id=p.user_id and m.teen_id=t.user_id
    and m.parent_joined_at=p.joined_at and m.teen_joined_at=t.joined_at
$$;

-- Mark only the *recipient's* messages from the exact active pairing.
create or replace function public.mark_family_messages_read()
returns integer language plpgsql volatile security definer set search_path=''
as $$
declare
  v_user uuid:=(select auth.uid());
  v_family uuid;
  v_changed integer;
begin
  if v_user is null then raise exception 'authentication required' using errcode='42501'; end if;
  v_family:=private.current_exact_pair_family_id();
  if v_family is null then raise exception 'exact pair required' using errcode='42501'; end if;
  update public.family_direct_messages m
  set read_at=pg_catalog.now()
  from public.family_members p,public.family_members t
  where m.family_id=v_family and m.recipient_id=v_user and m.read_at is null
    and p.family_id=m.family_id and p.role='parent'
    and t.family_id=m.family_id and t.role='teen'
    and m.parent_id=p.user_id and m.teen_id=t.user_id
    and m.parent_joined_at=p.joined_at and m.teen_joined_at=t.joined_at;
  get diagnostics v_changed=row_count;
  return v_changed;
end
$$;

revoke all on function public.send_family_message(text,uuid) from public,anon;
revoke all on function public.my_family_messages(timestamptz,uuid) from public,anon;
revoke all on function public.my_family_unread_message_count() from public,anon;
revoke all on function public.mark_family_messages_read() from public,anon;
grant execute on function public.send_family_message(text,uuid) to authenticated;
grant execute on function public.my_family_messages(timestamptz,uuid) to authenticated;
grant execute on function public.my_family_unread_message_count() to authenticated;
grant execute on function public.mark_family_messages_read() to authenticated;
comment on table public.family_direct_messages is
'Private exact-parent-teen messages. Only four authenticated, current-pair-checked RPCs can access them.';
