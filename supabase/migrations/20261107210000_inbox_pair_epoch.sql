-- Exact current-pair epoch for private inbox cache invalidation.
-- Additive, read-only and intentionally not a token or authentication secret.
-- A re-pair with the same two users changes joined_at and therefore changes the value.
create or replace function public.my_current_inbox_pair_epoch()
returns text language sql stable security definer set search_path to ''
as $$
 select p.family_id::text || ':' || p.user_id::text || ':' || t.user_id::text
   || ':' || p.joined_at::text || ':' || t.joined_at::text
 from public.family_members p
 join public.family_members t on t.family_id=p.family_id and t.role='teen'
 where p.role='parent'
   and p.family_id=private.current_exact_pair_family_id()
   and (select auth.uid()) in (p.user_id,t.user_id)
   and p.joined_at is not null and t.joined_at is not null
$$;
revoke all on function public.my_current_inbox_pair_epoch() from public,anon;
grant execute on function public.my_current_inbox_pair_epoch() to authenticated;
comment on function public.my_current_inbox_pair_epoch() is
 'Read-only exact family pair epoch for private inbox cache isolation. Null when not a valid current parent/teen pair; not a credential.';
