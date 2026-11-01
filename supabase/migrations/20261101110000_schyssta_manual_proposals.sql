-- SL-02/SL-03: Versioned manual proposals, without implicit approval.
-- After 20261030180000_schyssta_list_server_contract.sql.
-- Drafts stay private in the client until explicitly submitted.
-- No existing agreement, family-membership or swipe-answer rows are rewritten.

alter table public.agreements
  add column if not exists agreement_version integer not null default 1
    check (agreement_version >= 1),
  add column if not exists request_key uuid;
alter table public.agreement_approvals
  add column if not exists agreement_version integer not null default 1
    check (agreement_version >= 1);

-- A retry token belongs to one author, never to another family or another body.
create unique index if not exists agreements_author_request_unique
  on public.agreements (proposed_by, request_key)
  where request_key is not null;

-- Keep RLS enabled and no direct browser reads/writes. RPCs below enforce
-- the current exact parent+teen pairing and the membership joining epochs.
alter table public.agreements enable row level security;
alter table public.agreement_approvals enable row level security;
revoke all on public.agreements, public.agreement_approvals
  from public, anon, authenticated;

create or replace function public.propose_manual_schyssta_rule(
  p_body text,
  p_request_key uuid
)
returns uuid
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_family uuid;
  v_parent uuid;
  v_teen uuid;
  v_parent_joined timestamptz;
  v_teen_joined timestamptz;
  v_body text;
  v_id uuid;
  v_existing public.agreements%rowtype;
begin
  if v_user is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_request_key is null or p_body is null then
    raise exception 'body and request key are required' using errcode = '22023';
  end if;
  v_body := pg_catalog.regexp_replace(pg_catalog.btrim(p_body), '[[:space:]]+', ' ', 'g');
  if pg_catalog.char_length(v_body) not between 5 and 500 then
    raise exception 'rule must contain 5 to 500 characters' using errcode = '22023';
  end if;

  v_family := private.current_exact_pair_family_id();
  if v_family is null then
    raise exception 'an exact parent and teen pair is required' using errcode = '42501';
  end if;

  select
    (pg_catalog.array_agg(m.user_id) filter (where m.role='parent'))[1],
    (pg_catalog.array_agg(m.user_id) filter (where m.role='teen'))[1],
    (pg_catalog.array_agg(m.joined_at) filter (where m.role='parent'))[1],
    (pg_catalog.array_agg(m.joined_at) filter (where m.role='teen'))[1]
  into v_parent,v_teen,v_parent_joined,v_teen_joined
  from public.family_members m where m.family_id = v_family;

  if v_parent is null or v_teen is null or v_parent_joined is null or v_teen_joined is null then
    raise exception 'pairing is unavailable' using errcode='42501';
  end if;

  -- RETURN existing ID only for an identical, still current, same-author retry.
  select * into v_existing from public.agreements
    where proposed_by=v_user and request_key=p_request_key;
  if found then
    if v_existing.family_id=v_family
      and v_existing.body=v_body
      and v_existing.source_deck_id is null and v_existing.source_card_id is null
      and v_existing.paired_parent_id=v_parent and v_existing.paired_teen_id=v_teen
      and v_existing.paired_parent_joined_at=v_parent_joined
      and v_existing.paired_teen_joined_at=v_teen_joined
    then return v_existing.id;
    end if;
    raise exception 'request key was already used' using errcode='23505';
  end if;

  insert into public.agreements (
    family_id,proposed_by,body,status,source_deck_id,source_card_id,
    paired_parent_id,paired_teen_id,paired_parent_joined_at,paired_teen_joined_at,
    agreement_version,request_key
  ) values (
    v_family,v_user,v_body,'proposed',null,null,
    v_parent,v_teen,v_parent_joined,v_teen_joined,1,p_request_key
  )
  on conflict (proposed_by,request_key) where request_key is not null do nothing
  returning id into v_id;

  if v_id is not null then return v_id; end if;

  -- Handle a simultaneous repeat of the same request idempotently.
  select * into v_existing from public.agreements
    where proposed_by=v_user and request_key=p_request_key;
  if found and v_existing.family_id=v_family and v_existing.body=v_body
    and v_existing.source_deck_id is null and v_existing.source_card_id is null
    and v_existing.paired_parent_id=v_parent and v_existing.paired_teen_id=v_teen
    and v_existing.paired_parent_joined_at=v_parent_joined
    and v_existing.paired_teen_joined_at=v_teen_joined
  then return v_existing.id; end if;
  raise exception 'request key was already used' using errcode='23505';
end
$$;

-- Separate read surface for manual rules so existing Gillaswajpen card
-- response shape remains unchanged. Never return member user identifiers.
create or replace function public.my_manual_schyssta_rules()
returns table (
  agreement_id uuid,body text,status text,agreement_version integer,
  proposed_by_me boolean,own_decision boolean,
  parent_decision boolean,teen_decision boolean,created_at timestamptz
)
language sql stable security definer
set search_path = ''
as $$
  select a.id,a.body,
    case
      when pv.approved is false or tv.approved is false then 'rejected'
      when pv.approved is true and tv.approved is true then 'accepted'
      else 'proposed'
    end,
    a.agreement_version,a.proposed_by=(select auth.uid()),ov.approved,
    pv.approved,tv.approved,a.created_at
  from public.agreements a
  join public.family_members pm
    on pm.family_id=a.family_id and pm.role='parent'
  join public.family_members tm
    on tm.family_id=a.family_id and tm.role='teen'
  left join public.agreement_approvals ov
    on ov.agreement_id=a.id and ov.user_id=(select auth.uid())
      and ov.agreement_version=a.agreement_version
  left join public.agreement_approvals pv
    on pv.agreement_id=a.id and pv.user_id=pm.user_id
      and pv.agreement_version=a.agreement_version
  left join public.agreement_approvals tv
    on tv.agreement_id=a.id and tv.user_id=tm.user_id
      and tv.agreement_version=a.agreement_version
  where (select auth.uid()) is not null
    and a.family_id=private.current_exact_pair_family_id()
    and a.source_deck_id is null and a.source_card_id is null
    and a.status <> 'withdrawn'
    and a.paired_parent_id=pm.user_id and a.paired_teen_id=tm.user_id
    and a.paired_parent_joined_at=pm.joined_at
    and a.paired_teen_joined_at=tm.joined_at
  order by a.created_at,a.id
$$;

-- Allow separately approving manual and matched-card proposals, only
-- for the same exact active pairing and matching agreement version.
create or replace function public.set_schyssta_rule_decision(
  p_agreement_id uuid,p_approved boolean
)
returns void
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_family uuid;
  v_parent uuid;
  v_teen uuid;
  v_parent_joined timestamptz;
  v_teen_joined timestamptz;
  v_version integer;
begin
  if v_user is null then
    raise exception 'authentication required' using errcode='42501';
  end if;
  if p_agreement_id is null or p_approved is null then
    raise exception 'agreement and explicit decision are required' using errcode='22023';
  end if;
  v_family := private.current_exact_pair_family_id();
  if v_family is null then
    raise exception 'an exact pair is required' using errcode='42501';
  end if;
  select
    (pg_catalog.array_agg(m.user_id) filter (where m.role='parent'))[1],
    (pg_catalog.array_agg(m.user_id) filter (where m.role='teen'))[1],
    (pg_catalog.array_agg(m.joined_at) filter (where m.role='parent'))[1],
    (pg_catalog.array_agg(m.joined_at) filter (where m.role='teen'))[1]
  into v_parent,v_teen,v_parent_joined,v_teen_joined
  from public.family_members m where m.family_id=v_family;

  select a.agreement_version into v_version
  from public.agreements a
  where a.id=p_agreement_id and a.family_id=v_family
    and (a.source_deck_id='regler' or
      (a.source_deck_id is null and a.source_card_id is null))
    and a.status <> 'withdrawn'
    and a.paired_parent_id=v_parent and a.paired_teen_id=v_teen
    and a.paired_parent_joined_at=v_parent_joined
    and a.paired_teen_joined_at=v_teen_joined
  for update;
  if not found then
    raise exception 'agreement not available for this pairing' using errcode='42501';
  end if;

  insert into public.agreement_approvals
    (agreement_id,user_id,approved,decided_at,agreement_version)
  values (p_agreement_id,v_user,p_approved,pg_catalog.now(),v_version)
  on conflict (agreement_id,user_id) do update
    set approved=excluded.approved,
        decided_at=excluded.decided_at,
        agreement_version=excluded.agreement_version;

  update public.agreements a
  set status=case
    when exists(
      select 1 from public.agreement_approvals v
      where v.agreement_id=a.id and v.agreement_version=v_version
        and v.user_id in (v_parent,v_teen) and v.approved is false
    ) then 'rejected'
    when (
      select count(*) from public.agreement_approvals v
      where v.agreement_id=a.id and v.agreement_version=v_version
        and v.user_id in (v_parent,v_teen) and v.approved is true
    )=2 then 'accepted'
    else 'proposed'
  end
  where a.id=p_agreement_id and a.family_id=v_family;
end
$$;

-- Revoke PUBLIC as well as anon; PUBLIC privilege otherwise bypasses anon REVOKE.
revoke all on function public.propose_manual_schyssta_rule(text,uuid) from public,anon;
revoke all on function public.my_manual_schyssta_rules() from public,anon;
revoke all on function public.set_schyssta_rule_decision(uuid,boolean) from public,anon;
grant execute on function public.propose_manual_schyssta_rule(text,uuid) to authenticated;
grant execute on function public.my_manual_schyssta_rules() to authenticated;
grant execute on function public.set_schyssta_rule_decision(uuid,boolean) to authenticated;

comment on function public.propose_manual_schyssta_rule(text,uuid) is
  'Create a non-binding, versioned manual rule suggestion for current parent+teen pair, idempotent by author request token.';
comment on function public.my_manual_schyssta_rules() is
  'Read current family pairing manual proposals without exposing member IDs or private swipe answers.';
comment on function public.set_schyssta_rule_decision(uuid,boolean) is
  'One explicit per-version decision per current family member; only two current YES accept any rule.';
