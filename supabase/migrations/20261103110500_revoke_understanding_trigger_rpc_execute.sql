-- Internal trigger helper only: this must never be an independently callable RPC.
-- `PUBLIC` is the PostgreSQL default grant; revoking only anon is insufficient.
-- Existing triggers on swipe_answers and swipe_skips continue to invoke this
-- function; this migration does not change trigger definitions or saved data.
revoke all on function public.revoke_understanding_share_on_private_change()
from public, anon, authenticated;
