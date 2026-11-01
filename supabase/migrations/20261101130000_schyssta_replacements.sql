-- Schyssta listan SL-13/14: non-destructive replacement proposals.
-- The original accepted rule remains in force until BOTH explicitly
-- accept the new manual wording. After acceptance the old rule is archived.
alter table public.agreements
  add column if not exists replaces_agreement_id uuid
    references public.agreements(id) on delete set null;
create unique index if not exists agreements_one_pending_replacement
  on public.agreements(replaces_agreement_id)
  where replaces_agreement_id is not null and status='proposed';

create or replace function public.propose_schyssta_change(
  p_agreement_id uuid,p_body text,p_request_key uuid
)
returns uuid language plpgsql volatile security definer set search_path=''
as $$
declare
  v_user uuid := (select auth.uid());
  v_family uuid;
  v_parent uuid;
  v_teen uuid;
  v_parent_joined timestamptz;
  v_teen_joined timestamptz;
  v_body text;
  v_old public.agreements%rowtype;
  v_existing public.agreements%rowtype;
  v_id uuid;
begin
  if v_user is null then raise exception 'authentication required' using errcode='42501'; end if;
  if p_agreement_id is null or p_request_key is null or p_body is null then
    raise exception 'original, text and request key are required' using errcode='22023';
  end if;
  v_body:=pg_catalog.regexp_replace(pg_catalog.btrim(p_body),'[[:space:]]+',' ','g');
  if pg_catalog.char_length(v_body) not between 5 and 500 then
    raise exception 'rule must contain 5 to 500 characters' using errcode='22023';
  end if;
  v_family:=private.current_exact_pair_family_id();
  if v_family is null then raise exception 'exact pairing required' using errcode='42501'; end if;
  select
    (pg_catalog.array_agg(m.user_id) filter (where m.role='parent'))[1],
    (pg_catalog.array_agg(m.user_id) filter (where m.role='teen'))[1],
    (pg_catalog.array_agg(m.joined_at) filter (where m.role='parent'))[1],
    (pg_catalog.array_agg(m.joined_at) filter (where m.role='teen'))[1]
  into v_parent,v_teen,v_parent_joined,v_teen_joined
  from public.family_members m where m.family_id=v_family;

  -- Idempotent retry must belong to this same pairing and target.
  select * into v_existing from public.agreements
    where proposed_by=v_user and request_key=p_request_key;
  if found then
    if v_existing.family_id=v_family and v_existing.body=v_body
      and v_existing.replaces_agreement_id=p_agreement_id
      and v_existing.paired_parent_id=v_parent
      and v_existing.paired_teen_id=v_teen
      and v_existing.paired_parent_joined_at=v_parent_joined
      and v_existing.paired_teen_joined_at=v_teen_joined
    then return v_existing.id; end if;
    raise exception 'request key already used' using errcode='23505';
  end if;

  select * into v_old from public.agreements a
  where a.id=p_agreement_id and a.family_id=v_family
    and a.status='accepted'
    and a.paired_parent_id=v_parent and a.paired_teen_id=v_teen
    and a.paired_parent_joined_at=v_parent_joined
    and a.paired_teen_joined_at=v_teen_joined
  for update;
  if not found then raise exception 'original accepted rule unavailable' using errcode='42501'; end if;
  if v_old.body=v_body then raise exception 'new wording must differ' using errcode='22023'; end if;
  if exists(select 1 from public.agreements a
    where a.replaces_agreement_id=p_agreement_id and a.status='proposed') then
    raise exception 'a replacement is already pending' using errcode='23505';
  end if;

  insert into public.agreements(
    family_id,proposed_by,body,status,source_deck_id,source_card_id,
    paired_parent_id,paired_teen_id,paired_parent_joined_at,paired_teen_joined_at,
    agreement_version,request_key,replaces_agreement_id
  ) values (
    v_family,v_user,v_body,'proposed',null,null,
    v_parent,v_teen,v_parent_joined,v_teen_joined,
    1,p_request_key,p_agreement_id
  ) returning id into v_id;
  return v_id;
end
$$;

-- After both approvals, retire the old accepted version in the same transaction.
-- Failed retirement rejects acceptance atomically instead of leaving two
-- contradictory, supposedly valid rules.
create or replace function private.schyssta_retire_replaced_rule()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  if new.replaces_agreement_id is null or new.status<>'accepted'
    or old.status='accepted' then return new; end if;
  update public.agreements a set status='withdrawn'
  where a.id=new.replaces_agreement_id and a.family_id=new.family_id
    and a.status='accepted'
    and a.paired_parent_id=new.paired_parent_id
    and a.paired_teen_id=new.paired_teen_id
    and a.paired_parent_joined_at=new.paired_parent_joined_at
    and a.paired_teen_joined_at=new.paired_teen_joined_at;
  if not found then
    raise exception 'original rule no longer current' using errcode='42501';
  end if;
  return new;
end
$$;

drop trigger if exists schyssta_replacement_retire on public.agreements;
create trigger schyssta_replacement_retire
after update of status on public.agreements
for each row execute function private.schyssta_retire_replaced_rule();

-- Return only current-pair references; no other family's IDs or historical
-- private answers are exposed.
create or replace function public.my_schyssta_replacement_links()
returns table(agreement_id uuid,replaces_agreement_id uuid)
language sql stable security definer set search_path=''
as $$
  select new.id,new.replaces_agreement_id
  from public.agreements new
  join public.agreements old on old.id=new.replaces_agreement_id
  join public.family_members p on p.family_id=new.family_id and p.role='parent'
  join public.family_members t on t.family_id=new.family_id and t.role='teen'
  where (select auth.uid()) is not null
    and new.family_id=private.current_exact_pair_family_id()
    and new.source_deck_id is null and new.source_card_id is null
    and new.status<>'withdrawn'
    and old.family_id=new.family_id
    and new.paired_parent_id=p.user_id and new.paired_teen_id=t.user_id
    and new.paired_parent_joined_at=p.joined_at
    and new.paired_teen_joined_at=t.joined_at
  order by new.created_at,new.id
$$;

revoke all on function public.propose_schyssta_change(uuid,text,uuid) from public,anon;
revoke all on function public.my_schyssta_replacement_links() from public,anon;
revoke all on function private.schyssta_retire_replaced_rule() from public,anon,authenticated;
grant execute on function public.propose_schyssta_change(uuid,text,uuid) to authenticated;
grant execute on function public.my_schyssta_replacement_links() to authenticated;
