-- SL-14/20: explicit retirement and private current-family rule history.
-- Archived rules remain stored; no swipe answers or historical agreements deleted.
create or replace function public.withdraw_schyssta_rule(p_agreement_id uuid)
returns void language plpgsql volatile security definer set search_path=''
as $$
declare
  v_user uuid := (select auth.uid());
  v_family uuid;
  v_version integer;
begin
  if v_user is null or p_agreement_id is null then
    raise exception 'authentication and agreement required' using errcode='42501';
  end if;
  v_family:=private.current_exact_pair_family_id();
  if v_family is null then raise exception 'exact pairing required' using errcode='42501'; end if;

  select a.agreement_version into v_version
  from public.agreements a
  join public.family_members p on p.family_id=a.family_id and p.role='parent'
  join public.family_members t on t.family_id=a.family_id and t.role='teen'
  where a.id=p_agreement_id and a.family_id=v_family and a.status='accepted'
    and v_user in (p.user_id,t.user_id)
    and a.paired_parent_id=p.user_id and a.paired_teen_id=t.user_id
    and a.paired_parent_joined_at=p.joined_at
    and a.paired_teen_joined_at=t.joined_at
  for update of a;
  if not found then raise exception 'active agreement unavailable' using errcode='42501'; end if;

  -- Record which participant withdrew their consent before archiving.
  update public.agreement_approvals
    set approved=false,decided_at=pg_catalog.now()
  where agreement_id=p_agreement_id and user_id=v_user
    and agreement_version=v_version;

  update public.agreements set status='withdrawn'
  where id=p_agreement_id and family_id=v_family and status='accepted';
end
$$;

create or replace function public.my_schyssta_rule_history()
returns table(agreement_id uuid,body text,created_at timestamptz)
language sql stable security definer set search_path=''
as $$
  select a.id,a.body,a.created_at
  from public.agreements a
  join public.family_members p on p.family_id=a.family_id and p.role='parent'
  join public.family_members t on t.family_id=a.family_id and t.role='teen'
  where (select auth.uid()) is not null
    and a.family_id=private.current_exact_pair_family_id()
    and a.status='withdrawn'
    and a.paired_parent_id=p.user_id and a.paired_teen_id=t.user_id
    and a.paired_parent_joined_at=p.joined_at
    and a.paired_teen_joined_at=t.joined_at
  order by a.created_at desc,a.id desc
  limit 100
$$;

revoke all on function public.withdraw_schyssta_rule(uuid) from public,anon;
revoke all on function public.my_schyssta_rule_history() from public,anon;
grant execute on function public.withdraw_schyssta_rule(uuid) to authenticated;
grant execute on function public.my_schyssta_rule_history() to authenticated;
