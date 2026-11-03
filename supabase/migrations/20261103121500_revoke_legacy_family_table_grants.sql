-- SEC-02A: defense in depth for four family tables with RLS enabled and
-- no policies. These legacy rows are accessed through explicit, authenticated
-- SECURITY DEFINER RPCs, never through unrestricted direct table access.
-- Revoke broad leftover Data API privileges from inherited PUBLIC too.
-- No rows, RLS state, policies, functions or triggers are changed here.
revoke all privileges on table
  public.families,
  public.family_members,
  public.invitations,
  public.messages
from public, anon, authenticated;

-- This RPC was superseded when deck access stopped depending on completion.
-- It has no current frontend callers. Restrict it without dropping its code,
-- to keep migrations and historical tests reproducible.
revoke all on function public.shared_general_deck_complete()
from public, anon, authenticated;
