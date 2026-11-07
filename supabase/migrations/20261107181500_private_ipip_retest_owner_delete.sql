-- PF-01: let a signed-in account remove only its own private IPIP retest
-- attempts. The FK ON DELETE CASCADE deletes that attempt's item responses.
-- Legacy public.personality_answers and all shared IPIP aggregates are untouched.
GRANT DELETE ON TABLE public.personality_test_attempts TO authenticated;

CREATE POLICY personality_attempt_delete
ON public.personality_test_attempts
FOR DELETE TO authenticated
USING (user_id = (SELECT auth.uid()));

-- No direct DELETE grant for personality_attempt_answers: the database handles
-- complete per-attempt deletion atomically through the ownership-protected parent.
COMMENT ON POLICY personality_attempt_delete ON public.personality_test_attempts IS
  'Only the owner can delete a private retest. Its answers cascade; legacy answers and shared summaries remain unchanged.';
