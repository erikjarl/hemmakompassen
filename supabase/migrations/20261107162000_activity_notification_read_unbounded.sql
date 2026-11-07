-- Preserve visibility checks while allowing older eligible notifications to be marked read.
-- Verified syntax in a rolled-back transaction against the connected test Supabase.
create or replace function public.mark_activity_notification_read(p_notification_id uuid)
returns void language plpgsql security definer set search_path to ''
as $function$
declare
  caller_id uuid := (select auth.uid());
begin
  if caller_id is null or p_notification_id is null then
    raise exception 'authentication and notification ID required' using errcode='42501';
  end if;
  -- The 30-row feed is for display, not for authorization of older items.
  update public.activity_notifications n
  set read_at=coalesce(n.read_at,pg_catalog.now())
  where n.id=p_notification_id
    and n.recipient_id=caller_id
    and n.family_id=private.current_exact_pair_family_id()
    and exists (
      select 1 from public.family_members p
      join public.family_members t on t.family_id=p.family_id and t.role='teen'
      where p.family_id=n.family_id and p.role='parent'
        and p.user_id=n.parent_id and t.user_id=n.teen_id
        and p.joined_at=n.parent_joined_at and t.joined_at=n.teen_joined_at
        and (select count(*) from public.family_members m where m.user_id=p.user_id)=1
        and (select count(*) from public.family_members m where m.user_id=t.user_id)=1
    )
    and exists (
      select 1 from public.activity_notification_event_keys e
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
    );
  if not found then
    raise exception 'notification unavailable' using errcode='42501';
  end if;
end
$function$;
