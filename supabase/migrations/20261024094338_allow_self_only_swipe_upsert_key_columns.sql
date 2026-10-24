-- PostgREST full-row upsert updates conflict-key columns on UPDATE.
-- Existing RLS enforces OLD and NEW user_id = auth.uid().
grant update (user_id, deck_id, card_id) on public.swipe_answers to authenticated;
