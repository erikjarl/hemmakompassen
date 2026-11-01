-- Disposable PostgreSQL fixture for testing Gillaswajpen only.
-- Synthetic tables and an auth.uid() simulation, never real user data.
-- This is NOT a full Supabase schema dump.
create schema auth;
create schema extensions;
create role anon nologin;
create role authenticated nologin;
grant usage on schema auth, extensions to authenticated;

create table auth.users (id uuid primary key, email text not null unique);
create function auth.uid() returns uuid
language sql stable security invoker set search_path = ''
as $$
  select (nullif(pg_catalog.current_setting('request.jwt.claims',true),'')::jsonb ->> 'sub')::uuid
$$;
grant execute on function auth.uid() to authenticated;

create table public.families (id uuid primary key);
create table public.family_members (
  family_id uuid not null references public.families(id),
  user_id uuid not null references auth.users(id),
  role text not null check (role in ('parent','teen')),
  joined_at timestamptz not null default now(),
  primary key (family_id,user_id)
);
create table public.swipe_answers (
  user_id uuid not null references auth.users(id),
  deck_id text not null,
  card_id text not null,
  answer boolean not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, deck_id, card_id)
);
alter table public.swipe_answers enable row level security;
create policy swipe_self_select on public.swipe_answers for select to authenticated
  using (user_id = (select auth.uid()));
create policy swipe_self_insert on public.swipe_answers for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy swipe_self_update on public.swipe_answers for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy swipe_self_delete on public.swipe_answers for delete to authenticated
  using (user_id = (select auth.uid()));
-- Start with broad table grants: tested migration must tighten them.
grant all privileges on public.swipe_answers to anon, authenticated;

-- Schyssta listan contract tables from the production schema. The reviewed
-- migration below must remove these broad synthetic grants and expose only its
-- authenticated RPC surface.
create table public.agreements (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  proposed_by uuid not null references auth.users(id),
  body text not null check (length(body) between 1 and 2000),
  status text not null default 'proposed'
    check (status in ('proposed','accepted','rejected','withdrawn')),
  created_at timestamptz not null default now()
);
create table public.agreement_approvals (
  agreement_id uuid not null references public.agreements(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  approved boolean not null,
  decided_at timestamptz not null default now(),
  primary key (agreement_id,user_id)
);
grant all privileges on public.agreements, public.agreement_approvals to anon, authenticated;
