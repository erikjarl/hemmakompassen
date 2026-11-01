-- Private IPIP-50 response validation and explicitly consensual pairwise SCORE sharing.
-- Existing personality_answers data and self-only RLS remain untouched.
-- Not a clinical test; Swedish translation has no youth norms.
create or replace function public.validate_ipip50_answer_v1()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if new.instrument_id <> 'ipip50-sv-v1' then return new; end if;
  if new.question_id !~ '^ipip50-(00[1-9]|0[1-4][0-9]|050)$'
     or pg_catalog.jsonb_typeof(new.answer->'value') is distinct from 'number'
     or (new.answer->>'value') !~ '^[1-5]$'
     or new.answer <> pg_catalog.jsonb_build_object('value',new.answer->'value') then
    raise exception 'invalid IPIP50 item or response' using errcode='22023';
  end if;
  return new;
end;
$$;
drop trigger if exists validate_ipip50_answer_v1 on public.personality_answers;
create trigger validate_ipip50_answer_v1 before insert or update on public.personality_answers
for each row execute function public.validate_ipip50_answer_v1();
revoke all on function public.validate_ipip50_answer_v1() from public,anon,authenticated;

create table if not exists public.personality_share_preferences (
 user_id uuid not null references auth.users(id) on delete cascade,
 instrument_id text not null check (instrument_id = 'ipip50-sv-v1'),
 family_id uuid not null references public.families(id) on delete cascade,
 joined_at timestamptz not null,
 share_enabled boolean not null default true,
 updated_at timestamptz not null default pg_catalog.now(),
 primary key (user_id,instrument_id)
);
alter table public.personality_share_preferences enable row level security;
revoke all on public.personality_share_preferences from public,anon,authenticated;
grant select (user_id,instrument_id,share_enabled) on public.personality_share_preferences to authenticated;
drop policy if exists personality_self_share_status on public.personality_share_preferences;
create policy personality_self_share_status on public.personality_share_preferences
for select to authenticated using (user_id = (select auth.uid()));

-- No direct user writes to consent table: authenticated RPC performs all checks.
create or replace function public.set_my_ipip50_share(p_share boolean)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare
 v_user uuid := (select auth.uid());
 v_family uuid;
 v_joined timestamptz;
 v_member_count integer;
 v_parent_count integer;
 v_teen_count integer;
 v_valid integer;
begin
 if v_user is null or p_share is null then raise exception 'not authenticated or invalid choice' using errcode='42501'; end if;
 if p_share = false then
   delete from public.personality_share_preferences where user_id = v_user and instrument_id='ipip50-sv-v1';
   return false;
 end if;
 select fm.family_id,fm.joined_at into v_family,v_joined
 from public.family_members fm where fm.user_id=v_user;
 if v_family is null then raise exception 'pair required' using errcode='42501'; end if;
 select count(*),count(*) filter (where role='parent'),count(*) filter (where role='teen')
 into v_member_count,v_parent_count,v_teen_count
 from public.family_members where family_id=v_family;
 if v_member_count<>2 or v_parent_count<>1 or v_teen_count<>1
 then raise exception 'exact parent teen pair required' using errcode='42501'; end if;
 select count(*) into v_valid
 from public.personality_answers a
 join (
 values
    ('ipip50-001', 'extraversion', false),
    ('ipip50-002', 'agreeableness', true),
    ('ipip50-003', 'conscientiousness', false),
    ('ipip50-004', 'emotional_stability', true),
    ('ipip50-005', 'intellect_imagination', false),
    ('ipip50-006', 'extraversion', true),
    ('ipip50-007', 'agreeableness', false),
    ('ipip50-008', 'conscientiousness', true),
    ('ipip50-009', 'emotional_stability', false),
    ('ipip50-010', 'intellect_imagination', true),
    ('ipip50-011', 'extraversion', false),
    ('ipip50-012', 'agreeableness', true),
    ('ipip50-013', 'conscientiousness', false),
    ('ipip50-014', 'emotional_stability', true),
    ('ipip50-015', 'intellect_imagination', false),
    ('ipip50-016', 'extraversion', true),
    ('ipip50-017', 'agreeableness', false),
    ('ipip50-018', 'conscientiousness', true),
    ('ipip50-019', 'emotional_stability', false),
    ('ipip50-020', 'intellect_imagination', true),
    ('ipip50-021', 'extraversion', false),
    ('ipip50-022', 'agreeableness', true),
    ('ipip50-023', 'conscientiousness', false),
    ('ipip50-024', 'emotional_stability', true),
    ('ipip50-025', 'intellect_imagination', false),
    ('ipip50-026', 'extraversion', true),
    ('ipip50-027', 'agreeableness', false),
    ('ipip50-028', 'conscientiousness', true),
    ('ipip50-029', 'emotional_stability', true),
    ('ipip50-030', 'intellect_imagination', true),
    ('ipip50-031', 'extraversion', false),
    ('ipip50-032', 'agreeableness', true),
    ('ipip50-033', 'conscientiousness', false),
    ('ipip50-034', 'emotional_stability', true),
    ('ipip50-035', 'intellect_imagination', false),
    ('ipip50-036', 'extraversion', true),
    ('ipip50-037', 'agreeableness', false),
    ('ipip50-038', 'conscientiousness', true),
    ('ipip50-039', 'emotional_stability', true),
    ('ipip50-040', 'intellect_imagination', false),
    ('ipip50-041', 'extraversion', false),
    ('ipip50-042', 'agreeableness', false),
    ('ipip50-043', 'conscientiousness', false),
    ('ipip50-044', 'emotional_stability', true),
    ('ipip50-045', 'intellect_imagination', false),
    ('ipip50-046', 'extraversion', true),
    ('ipip50-047', 'agreeableness', false),
    ('ipip50-048', 'conscientiousness', false),
    ('ipip50-049', 'emotional_stability', true),
    ('ipip50-050', 'intellect_imagination', false)
 ) as key(question_id,factor_id,is_reverse) on a.question_id=key.question_id
 where a.user_id=v_user and a.instrument_id='ipip50-sv-v1'
   and pg_catalog.jsonb_typeof(a.answer->'value')='number'
   and (a.answer->>'value') ~ '^[1-5]$'
   and a.answer=pg_catalog.jsonb_build_object('value',(a.answer->>'value')::integer);
 if v_valid<>50 then raise exception 'full valid IPIP-50 questionnaire required' using errcode='22023'; end if;
 insert into public.personality_share_preferences
   (user_id,instrument_id,family_id,joined_at,share_enabled,updated_at)
 values(v_user,'ipip50-sv-v1',v_family,v_joined,true,pg_catalog.now())
 on conflict(user_id,instrument_id) do update set
   family_id=excluded.family_id,joined_at=excluded.joined_at,
   share_enabled=true,updated_at=pg_catalog.now();
 return true;
end;
$$;
revoke all on function public.set_my_ipip50_share(boolean) from public,anon;
grant execute on function public.set_my_ipip50_share(boolean) to authenticated;

create or replace function public.my_ipip50_shared_profiles()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
 v_user uuid := (select auth.uid());
 v_family uuid;
 v_role text;
 v_member_count integer;
 v_parent_count integer;
 v_teen_count integer;
 v_consent_count integer;
 v_profiles jsonb;
begin
 if v_user is null then return null; end if;
 select family_id, role into v_family,v_role from public.family_members where user_id=v_user;
 if v_family is null then return null; end if;
 select count(*),count(*) filter (where role='parent'),count(*) filter (where role='teen')
 into v_member_count,v_parent_count,v_teen_count
 from public.family_members where family_id=v_family;
 if v_member_count<>2 or v_parent_count<>1 or v_teen_count<>1 then return null; end if;

 -- Consent is scoped to the CURRENT family membership, not historical pairing.
 select count(*) into v_consent_count
 from public.family_members m join public.personality_share_preferences p
 on p.user_id=m.user_id and p.family_id=m.family_id
 and p.joined_at=m.joined_at and p.instrument_id='ipip50-sv-v1' and p.share_enabled=true
 where m.family_id=v_family;
 if v_consent_count<>2 then return null; end if;

 -- Return only FIVE server-calculated scores per user, NEVER raw item answers.
 select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('role',profiles.role,'scores',profiles.scores)
                             order by profiles.role)
 into v_profiles
 from (
   select m.role,
   (
     select pg_catalog.jsonb_object_agg(by_factor.factor_id,by_factor.sum_score)
     from (
       select key.factor_id,
         sum(case when key.is_reverse then 6-(a.answer->>'value')::integer
                  else (a.answer->>'value')::integer end)::integer as sum_score
       from (
         values
    ('ipip50-001', 'extraversion', false),
    ('ipip50-002', 'agreeableness', true),
    ('ipip50-003', 'conscientiousness', false),
    ('ipip50-004', 'emotional_stability', true),
    ('ipip50-005', 'intellect_imagination', false),
    ('ipip50-006', 'extraversion', true),
    ('ipip50-007', 'agreeableness', false),
    ('ipip50-008', 'conscientiousness', true),
    ('ipip50-009', 'emotional_stability', false),
    ('ipip50-010', 'intellect_imagination', true),
    ('ipip50-011', 'extraversion', false),
    ('ipip50-012', 'agreeableness', true),
    ('ipip50-013', 'conscientiousness', false),
    ('ipip50-014', 'emotional_stability', true),
    ('ipip50-015', 'intellect_imagination', false),
    ('ipip50-016', 'extraversion', true),
    ('ipip50-017', 'agreeableness', false),
    ('ipip50-018', 'conscientiousness', true),
    ('ipip50-019', 'emotional_stability', false),
    ('ipip50-020', 'intellect_imagination', true),
    ('ipip50-021', 'extraversion', false),
    ('ipip50-022', 'agreeableness', true),
    ('ipip50-023', 'conscientiousness', false),
    ('ipip50-024', 'emotional_stability', true),
    ('ipip50-025', 'intellect_imagination', false),
    ('ipip50-026', 'extraversion', true),
    ('ipip50-027', 'agreeableness', false),
    ('ipip50-028', 'conscientiousness', true),
    ('ipip50-029', 'emotional_stability', true),
    ('ipip50-030', 'intellect_imagination', true),
    ('ipip50-031', 'extraversion', false),
    ('ipip50-032', 'agreeableness', true),
    ('ipip50-033', 'conscientiousness', false),
    ('ipip50-034', 'emotional_stability', true),
    ('ipip50-035', 'intellect_imagination', false),
    ('ipip50-036', 'extraversion', true),
    ('ipip50-037', 'agreeableness', false),
    ('ipip50-038', 'conscientiousness', true),
    ('ipip50-039', 'emotional_stability', true),
    ('ipip50-040', 'intellect_imagination', false),
    ('ipip50-041', 'extraversion', false),
    ('ipip50-042', 'agreeableness', false),
    ('ipip50-043', 'conscientiousness', false),
    ('ipip50-044', 'emotional_stability', true),
    ('ipip50-045', 'intellect_imagination', false),
    ('ipip50-046', 'extraversion', true),
    ('ipip50-047', 'agreeableness', false),
    ('ipip50-048', 'conscientiousness', false),
    ('ipip50-049', 'emotional_stability', true),
    ('ipip50-050', 'intellect_imagination', false)
       ) as key(question_id,factor_id,is_reverse)
       join public.personality_answers a
       on a.user_id=m.user_id and a.instrument_id='ipip50-sv-v1'
       and a.question_id=key.question_id
       and pg_catalog.jsonb_typeof(a.answer->'value')='number'
       and (a.answer->>'value') ~ '^[1-5]$'
       and a.answer=pg_catalog.jsonb_build_object('value',(a.answer->>'value')::integer)
       group by key.factor_id
       having count(*)=10
     ) by_factor
     having count(*)=5
   ) as scores
   from public.family_members m where m.family_id=v_family
 ) profiles
 where profiles.scores is not null;
 if v_profiles is null or pg_catalog.jsonb_array_length(v_profiles)<>2 then return null; end if;
 return pg_catalog.jsonb_build_object(
   'instrument_id','ipip50-sv-v1','viewer_role',v_role,'profiles',v_profiles);
end;
$$;
revoke all on function public.my_ipip50_shared_profiles() from public,anon;
grant execute on function public.my_ipip50_shared_profiles() to authenticated;
comment on function public.my_ipip50_shared_profiles() is 'Private five-sum comparisons only for an exact current parent+teen pair with two current explicit consents; does not expose single item responses.';
