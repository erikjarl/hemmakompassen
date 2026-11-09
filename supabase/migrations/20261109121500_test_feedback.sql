-- Permanent internal-test feedback: all authenticated users can file a bug,
-- content correction or improvement. No family pairing or feature flag needed.
-- Reports are ADMIN-ONLY to read; never visible to another family member.
create table if not exists public.test_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('bug','content','suggestion')),
  page_context text not null check (char_length(page_context) between 1 and 240),
  description text not null check (char_length(btrim(description)) between 10 and 2500),
  expected_result text check (expected_result is null or char_length(expected_result) <= 1000),
  status text not null default 'new' check (status in ('new','reviewing','planned','resolved','closed'))
);
comment on table public.test_feedback is 'Internal tester reports. Private to project administrators; not shared with paired users.';
create index if not exists test_feedback_created_at_idx on public.test_feedback(created_at desc);
alter table public.test_feedback enable row level security;
revoke all on table public.test_feedback from public, anon, authenticated;
grant insert (user_id,category,page_context,description,expected_result)
  on table public.test_feedback to authenticated;
create policy "Any signed-in tester can submit own report"
  on public.test_feedback for insert to authenticated
  with check ((select auth.uid()) = user_id and status = 'new');
-- No SELECT/UPDATE/DELETE policies or grants to browser roles.
