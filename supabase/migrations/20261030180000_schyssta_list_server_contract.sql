-- Schyssta listan: secure, family-isolated server contract for suggestions
-- derived from mutual A matches and separate explicit decisions by both users.
-- Review-only migration: do not apply to production automatically.

create schema if not exists private;
revoke all on schema private from public;

create or replace function private.schyssta_rule_catalog()
returns table (card_id text, body text)
language sql
immutable
security invoker
set search_path = ''
as $$
  values
    ('regler-01','Vi knackar innan vi går in i varandras rum.'),
    ('regler-02','Vi lyssnar färdigt innan vi svarar.'),
    ('regler-03','Vi får pausa gräl och bestämmer när vi pratar vidare.'),
    ('regler-04','Vi frågar innan vi lånar varandras saker.'),
    ('regler-05','Vi pratar om hur sysslorna ska fördelas.'),
    ('regler-06','Vi berättar när planer som berör andra ändras.'),
    ('regler-07','Vi kommer överens om tider för sömn och hemkomst.'),
    ('regler-08','Vi kan ompröva regler som inte fungerar.'),
    ('regler-09','Vi bestämmer gemensamma mobilfria stunder.'),
    ('regler-10','Vi försöker prata utan att höja rösten.'),
    ('regler-11','Vi får säga till när något känns orättvist.'),
    ('regler-12','Vi försöker reda ut saker efter ett bråk.')
$$;

create or replace function private.current_exact_pair_family_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select caller.family_id
  from public.family_members as caller
  join public.family_members as member on member.family_id = caller.family_id
  where caller.user_id = (select auth.uid())
    and (
      select count(*)
      from public.family_members as membership
      where membership.user_id = (select auth.uid())
    ) = 1
  group by caller.family_id
  having count(*) = 2
     and count(*) filter (where member.role = 'parent') = 1
     and count(*) filter (where member.role = 'teen') = 1
$$;

revoke all on function private.schyssta_rule_catalog() from public, anon, authenticated;
revoke all on function private.current_exact_pair_family_id() from public, anon, authenticated;

alter table public.agreements
  add column if not exists source_deck_id text,
  add column if not exists source_card_id text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.agreements'::regclass
      and conname = 'agreements_source_pair_check'
  ) then
    alter table public.agreements
      add constraint agreements_source_pair_check check (
        (source_deck_id is null and source_card_id is null)
        or (source_deck_id = 'regler' and source_card_id is not null)
      );
  end if;
end
$$;

create unique index if not exists agreements_family_source_unique
  on public.agreements (family_id,source_deck_id,source_card_id)
  where source_deck_id is not null and source_card_id is not null;

alter table public.agreements enable row level security;
alter table public.agreement_approvals enable row level security;
revoke all privileges on public.agreements, public.agreement_approvals
  from public, anon, authenticated;

create or replace function public.shared_schyssta_rule_suggestions()
returns table (card_id text, body text)
language sql
stable
security definer
set search_path = ''
as $$
  with pair as (
    select
      family_id,
      (array_agg(user_id) filter (where role = 'parent'))[1] as parent_id,
      (array_agg(user_id) filter (where role = 'teen'))[1] as teen_id
    from public.family_members
    where family_id = private.current_exact_pair_family_id()
    group by family_id
  )
  select catalog.card_id, catalog.body
  from pair
  cross join private.schyssta_rule_catalog() as catalog
  join public.swipe_answers as parent_answer
    on parent_answer.user_id = pair.parent_id
   and parent_answer.deck_id = 'regler'
   and parent_answer.card_id = catalog.card_id
   and parent_answer.answer is true
  join public.swipe_answers as teen_answer
    on teen_answer.user_id = pair.teen_id
   and teen_answer.deck_id = 'regler'
   and teen_answer.card_id = catalog.card_id
   and teen_answer.answer is true
  where (select auth.uid()) is not null
    and not exists (
      select 1 from public.agreements as existing
      where existing.family_id = pair.family_id
        and existing.source_deck_id = 'regler'
        and existing.source_card_id = catalog.card_id
    )
  order by catalog.card_id
$$;

create or replace function public.propose_schyssta_rule(p_card_id text)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_family_id uuid;
  v_body text;
  v_parent_id uuid;
  v_teen_id uuid;
  v_agreement_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  v_family_id := private.current_exact_pair_family_id();
  if v_family_id is null then
    raise exception 'an exact parent and teen pair is required' using errcode = '42501';
  end if;

  select catalog.body into v_body
  from private.schyssta_rule_catalog() as catalog
  where catalog.card_id = p_card_id;
  if v_body is null then
    raise exception 'unsupported rule card' using errcode = '22023';
  end if;

  select
    (array_agg(member.user_id) filter (where member.role = 'parent'))[1],
    (array_agg(member.user_id) filter (where member.role = 'teen'))[1]
  into v_parent_id, v_teen_id
  from public.family_members as member
  where member.family_id = v_family_id;

  if not exists (
    select 1
    from public.swipe_answers as parent_answer
    join public.swipe_answers as teen_answer
      on teen_answer.user_id = v_teen_id
     and teen_answer.deck_id = 'regler'
     and teen_answer.card_id = p_card_id
     and teen_answer.answer is true
    where parent_answer.user_id = v_parent_id
      and parent_answer.deck_id = 'regler'
      and parent_answer.card_id = p_card_id
      and parent_answer.answer is true
  ) then
    raise exception 'rule is not a current mutual match' using errcode = '42501';
  end if;

  insert into public.agreements (
    family_id, proposed_by, body, status, source_deck_id, source_card_id
  ) values (
    v_family_id, v_user_id, v_body, 'proposed', 'regler', p_card_id
  )
  returning id into v_agreement_id;

  return v_agreement_id;
exception
  when unique_violation then
    raise exception 'this matched rule already has a proposal' using errcode = '23505';
end
$$;

create or replace function public.my_schyssta_rules()
returns table (
  agreement_id uuid,
  source_card_id text,
  body text,
  status text,
  proposed_by_me boolean,
  own_decision boolean,
  parent_decision boolean,
  teen_decision boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    agreement.id,
    agreement.source_card_id,
    agreement.body,
    agreement.status,
    agreement.proposed_by = (select auth.uid()),
    own_vote.approved,
    parent_vote.approved,
    teen_vote.approved,
    agreement.created_at
  from public.agreements as agreement
  left join public.agreement_approvals as own_vote
    on own_vote.agreement_id = agreement.id
   and own_vote.user_id = (select auth.uid())
  left join public.family_members as parent_member
    on parent_member.family_id = agreement.family_id and parent_member.role = 'parent'
  left join public.agreement_approvals as parent_vote
    on parent_vote.agreement_id = agreement.id and parent_vote.user_id = parent_member.user_id
  left join public.family_members as teen_member
    on teen_member.family_id = agreement.family_id and teen_member.role = 'teen'
  left join public.agreement_approvals as teen_vote
    on teen_vote.agreement_id = agreement.id and teen_vote.user_id = teen_member.user_id
  where (select auth.uid()) is not null
    and agreement.family_id = private.current_exact_pair_family_id()
    and agreement.source_deck_id = 'regler'
    and agreement.source_card_id is not null
  order by agreement.created_at, agreement.id
$$;

create or replace function public.set_schyssta_rule_decision(
  p_agreement_id uuid,
  p_approved boolean
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_family_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  v_family_id := private.current_exact_pair_family_id();
  if v_family_id is null or not exists (
    select 1 from public.agreements as agreement
    where agreement.id = p_agreement_id
      and agreement.family_id = v_family_id
      and agreement.source_deck_id = 'regler'
  ) then
    raise exception 'agreement is not available to this family pair' using errcode = '42501';
  end if;

  insert into public.agreement_approvals (agreement_id,user_id,approved,decided_at)
  values (p_agreement_id,v_user_id,p_approved,pg_catalog.now())
  on conflict (agreement_id,user_id) do update
  set approved = excluded.approved, decided_at = excluded.decided_at;

  update public.agreements as agreement
  set status = case
    when exists (
      select 1 from public.agreement_approvals as vote
      where vote.agreement_id = p_agreement_id and vote.approved is false
    ) then 'rejected'
    when (
      select count(*)
      from public.agreement_approvals as vote
      join public.family_members as member
        on member.user_id = vote.user_id and member.family_id = v_family_id
      where vote.agreement_id = p_agreement_id and vote.approved is true
    ) = 2 then 'accepted'
    else 'proposed'
  end
  where agreement.id = p_agreement_id and agreement.family_id = v_family_id;
end
$$;

revoke all on function public.shared_schyssta_rule_suggestions() from public, anon;
revoke all on function public.propose_schyssta_rule(text) from public, anon;
revoke all on function public.my_schyssta_rules() from public, anon;
revoke all on function public.set_schyssta_rule_decision(uuid,boolean) from public, anon;
grant execute on function public.shared_schyssta_rule_suggestions() to authenticated;
grant execute on function public.propose_schyssta_rule(text) to authenticated;
grant execute on function public.my_schyssta_rules() to authenticated;
grant execute on function public.set_schyssta_rule_decision(uuid,boolean) to authenticated;

comment on function public.shared_schyssta_rule_suggestions() is
  'Returns only unproposed allowlisted rule cards with exact parent+teen mutual YES; never private answers, NO, disagreement, B or other-family data.';
comment on function public.propose_schyssta_rule(text) is
  'Creates a non-binding Schyssta listan proposal only from a current server-verified mutual rule match; no approval is implied.';
comment on function public.my_schyssta_rules() is
  'Returns only the caller pair shared rule proposals and role decisions without user identifiers.';
comment on function public.set_schyssta_rule_decision(uuid,boolean) is
  'Stores only the caller own explicit decision; accepted requires two current family-member approvals.';
