-- Schyssta listan SL-06/12: one canonical agreement and private inbox events.
-- Internal online-test environment. No existing agreements or swipe responses altered.
create table if not exists public.schyssta_notifications (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  agreement_id uuid not null references public.agreements(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('rule_proposed','rule_accepted','rule_declined','rule_withdrawn')),
  agreement_version integer not null check (agreement_version>=1),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (agreement_id,recipient_id,kind,agreement_version)
);
create index if not exists schyssta_notifications_recipient_time
  on public.schyssta_notifications(recipient_id,created_at desc);
alter table public.schyssta_notifications enable row level security;
revoke all on public.schyssta_notifications from public,anon,authenticated;

-- All events originate from a real agreement write inside the same database
-- transaction. Never fabricate notifications from the browser.
create or replace function private.on_schyssta_agreement_change()
returns trigger
language plpgsql security definer
set search_path=''
as $$
declare
  v_caller uuid := (select auth.uid());
  v_recipient uuid;
  v_kind text;
begin
  if v_caller is null
    or v_caller not in (new.paired_parent_id,new.paired_teen_id)
    or new.paired_parent_id is null or new.paired_teen_id is null
    or not exists (
      select 1 from public.family_members as p
      join public.family_members as t on t.family_id=p.family_id
      where p.family_id=new.family_id and p.role='parent' and t.role='teen'
        and p.user_id=new.paired_parent_id and t.user_id=new.paired_teen_id
        and p.joined_at=new.paired_parent_joined_at
        and t.joined_at=new.paired_teen_joined_at
        and (select count(*) from public.family_members fm where fm.family_id=p.family_id)=2
    )
  then return new;
  end if;

  if tg_op='INSERT' then
    v_kind:='rule_proposed';
  elsif tg_op='UPDATE' and new.status is distinct from old.status then
    v_kind:=case new.status
      when 'accepted' then 'rule_accepted'
      when 'rejected' then 'rule_declined'
      when 'withdrawn' then 'rule_withdrawn'
      else null end;
  else
    return new;
  end if;

  if v_kind is null then return new; end if;
  v_recipient:=case when v_caller=new.paired_parent_id
    then new.paired_teen_id else new.paired_parent_id end;

  insert into public.schyssta_notifications
    (agreement_id,family_id,recipient_id,kind,agreement_version)
  values (new.id,new.family_id,v_recipient,v_kind,new.agreement_version)
  on conflict (agreement_id,recipient_id,kind,agreement_version) do nothing;
  return new;
end
$$;

revoke all on function private.on_schyssta_agreement_change() from public,anon,authenticated;
drop trigger if exists schyssta_agreement_notify on public.agreements;
create trigger schyssta_agreement_notify
after insert or update of status on public.agreements
for each row execute function private.on_schyssta_agreement_change();

create or replace function public.my_schyssta_notifications()
returns table (
  notification_id uuid,agreement_id uuid,kind text,body text,
  read_at timestamptz,created_at timestamptz
)
language sql stable security definer
set search_path=''
as $$
  select n.id,n.agreement_id,n.kind,a.body,n.read_at,n.created_at
  from public.schyssta_notifications n
  join public.agreements a on a.id=n.agreement_id and a.family_id=n.family_id
  join public.family_members p on p.family_id=a.family_id and p.role='parent'
  join public.family_members t on t.family_id=a.family_id and t.role='teen'
  where (select auth.uid()) is not null
    and n.recipient_id=(select auth.uid())
    and a.family_id=private.current_exact_pair_family_id()
    and a.paired_parent_id=p.user_id and a.paired_teen_id=t.user_id
    and a.paired_parent_joined_at=p.joined_at
    and a.paired_teen_joined_at=t.joined_at
  order by n.created_at desc,n.id desc
  limit 100
$$;

create or replace function public.mark_schyssta_notification_read(p_notification_id uuid)
returns void
language plpgsql volatile security definer
set search_path=''
as $$
begin
  if (select auth.uid()) is null or p_notification_id is null then
    raise exception 'authentication and notification ID required' using errcode='42501';
  end if;
  update public.schyssta_notifications n
    set read_at=coalesce(n.read_at,pg_catalog.now())
  from public.agreements a
  join public.family_members p on p.family_id=a.family_id and p.role='parent'
  join public.family_members t on t.family_id=a.family_id and t.role='teen'
  where n.id=p_notification_id
    and n.recipient_id=(select auth.uid())
    and a.id=n.agreement_id and a.family_id=n.family_id
    and a.family_id=private.current_exact_pair_family_id()
    and a.paired_parent_id=p.user_id and a.paired_teen_id=t.user_id
    and a.paired_parent_joined_at=p.joined_at
    and a.paired_teen_joined_at=t.joined_at;
  if not found then
    raise exception 'notification unavailable' using errcode='42501';
  end if;
end
$$;

revoke all on function public.my_schyssta_notifications() from public,anon;
revoke all on function public.mark_schyssta_notification_read(uuid) from public,anon;
grant execute on function public.my_schyssta_notifications() to authenticated;
grant execute on function public.mark_schyssta_notification_read(uuid) to authenticated;
comment on table public.schyssta_notifications is
'Private per-recipient agreement events, never approval votes. Only narrow authenticated RPCs can read or mark them.';
