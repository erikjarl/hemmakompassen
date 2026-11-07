-- PF-01: exactly one open retest for each owner and instrument.
-- A partial UNIQUE index handles simultaneous browser tabs atomically at the DB.
-- Completed historic attempts remain unlimited and immutable.
-- No existing answers, attempts or consent rows are changed.
CREATE UNIQUE INDEX personality_one_open_retest_per_owner
ON public.personality_test_attempts(user_id,instrument_id)
WHERE completed_at IS NULL;

COMMENT ON INDEX public.personality_one_open_retest_per_owner IS
 'One unfinished private IPIP test per account and instrument across concurrent tabs.';
