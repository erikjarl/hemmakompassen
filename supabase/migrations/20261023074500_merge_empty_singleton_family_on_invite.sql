-- Let an authenticated user who already started an otherwise empty one-person
-- family accept an invite from the complementary role. Profiles and private
-- per-user data stay attached to auth.users; only the family membership moves.
create or replace function public.accept_family_invite(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_uid uuid := auth.uid();
  v_inv public.invitations%rowtype;
  v_other_role text;
  v_my_role text;
  v_source_family uuid;
  v_source_role text;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  if p_code !~ '^[A-Z0-9]{32,64}$' then
    raise exception 'Invalid invite code';
  end if;

  select *
  into v_inv
  from public.invitations
  where token_hash = encode(extensions.digest(p_code, 'sha256'), 'hex')
    and expires_at > now()
    and accepted_at is null
    and revoked_at is null;

  if not found then
    raise exception 'Invalid or expired invite';
  end if;

  select family_id, role
  into v_source_family, v_source_role
  from public.family_members
  where user_id = v_uid;

  if v_source_family = v_inv.family_id then
    raise exception 'Already a member of this family';
  end if;

  -- Lock both family shells in a stable order before checking or moving a
  -- membership. This prevents two concurrent accept attempts from crossing.
  perform 1
  from public.families
  where id = v_inv.family_id or id = v_source_family
  order by id
  for update;

  -- Revalidate and lock the invite only after the family locks. Keeping this
  -- lock order prevents two cross-invites from deadlocking each other.
  select *
  into v_inv
  from public.invitations as invitation
  where invitation.id = v_inv.id
    and invitation.expires_at > now()
    and invitation.accepted_at is null
    and invitation.revoked_at is null
  for update;

  if not found then
    raise exception 'Invalid or expired invite';
  end if;

  if v_inv.created_by = v_uid then
    raise exception 'Cannot pair with yourself';
  end if;

  if (select count(*) from public.family_members where family_id = v_inv.family_id) <> 1 then
    raise exception 'Family already paired';
  end if;

  select role
  into v_other_role
  from public.family_members
  where family_id = v_inv.family_id;

  v_my_role := case when v_other_role = 'teen' then 'parent' else 'teen' end;

  if v_source_family is not null then
    if (select count(*) from public.family_members where family_id = v_source_family) <> 1 then
      raise exception 'Already paired';
    end if;

    if v_source_role <> v_my_role then
      raise exception 'Invite requires the complementary family role';
    end if;

    -- Do not silently detach shared history. A singleton family with shared
    -- records needs an explicit future migration/UX instead of data loss.
    if exists (select 1 from public.messages where family_id = v_source_family)
      or exists (select 1 from public.agreements where family_id = v_source_family) then
      raise exception 'Current family contains shared data';
    end if;

    update public.invitations
    set revoked_at = now()
    where family_id = v_source_family
      and accepted_at is null
      and revoked_at is null;

    delete from public.family_members
    where family_id = v_source_family
      and user_id = v_uid;
  end if;

  insert into public.family_members (family_id, user_id, role)
  values (v_inv.family_id, v_uid, v_my_role);

  update public.invitations
  set accepted_by = v_uid,
      accepted_at = now()
  where id = v_inv.id;

  return v_inv.family_id;
end
$function$;

revoke all on function public.accept_family_invite(text) from public, anon;
grant execute on function public.accept_family_invite(text) to authenticated;

comment on function public.accept_family_invite(text) is
  'Accepts a valid invite and may move the caller from an empty singleton family; preserves profiles/private user data and refuses to detach shared family history.';
