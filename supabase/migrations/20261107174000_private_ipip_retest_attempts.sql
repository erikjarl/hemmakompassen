-- PF-01: self-only, separately versioned IPIP-50 retest attempts.
-- Does not modify public.personality_answers or existing sharing RPCs.
-- Never join attempt scores into family aggregates without new, explicit consent.
CREATE TABLE public.personality_test_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instrument_id text NOT NULL DEFAULT 'ipip50-sv-v1'
    CHECK (instrument_id = 'ipip50-sv-v1'),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (user_id,id)
);
CREATE INDEX personality_test_attempts_owner_recent_idx
  ON public.personality_test_attempts (user_id,created_at DESC);

CREATE TABLE public.personality_attempt_answers (
  attempt_id uuid NOT NULL,
  user_id uuid NOT NULL,
  question_id text NOT NULL
    CHECK (question_id ~ '^ipip50-(00[1-9]|0[1-4][0-9]|050)$'),
  answer_value smallint NOT NULL CHECK (answer_value BETWEEN 1 AND 5),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (attempt_id,question_id),
  CONSTRAINT personality_attempt_answers_owner_fk
    FOREIGN KEY (user_id,attempt_id)
    REFERENCES public.personality_test_attempts(user_id,id) ON DELETE CASCADE
);
CREATE INDEX personality_attempt_answers_owner_idx
  ON public.personality_attempt_answers(user_id,attempt_id);

ALTER TABLE public.personality_test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personality_attempt_answers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.personality_test_attempts,public.personality_attempt_answers
  FROM public,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE
  public.personality_test_attempts,public.personality_attempt_answers
  TO authenticated;

CREATE POLICY personality_attempt_select ON public.personality_test_attempts
 FOR SELECT TO authenticated USING (user_id=(SELECT auth.uid()));
CREATE POLICY personality_attempt_insert ON public.personality_test_attempts
 FOR INSERT TO authenticated WITH CHECK (
   user_id=(SELECT auth.uid()) AND completed_at IS NULL
 );
CREATE POLICY personality_attempt_update ON public.personality_test_attempts
 FOR UPDATE TO authenticated
 USING (user_id=(SELECT auth.uid()) AND completed_at IS NULL)
 WITH CHECK (user_id=(SELECT auth.uid()));

CREATE POLICY personality_attempt_answer_select ON public.personality_attempt_answers
 FOR SELECT TO authenticated USING (user_id=(SELECT auth.uid()));
CREATE POLICY personality_attempt_answer_insert ON public.personality_attempt_answers
 FOR INSERT TO authenticated WITH CHECK (
   user_id=(SELECT auth.uid()) AND EXISTS (
     SELECT 1 FROM public.personality_test_attempts t
     WHERE t.id=attempt_id AND t.user_id=user_id AND t.completed_at IS NULL
   )
 );
CREATE POLICY personality_attempt_answer_update ON public.personality_attempt_answers
 FOR UPDATE TO authenticated
 USING (
   user_id=(SELECT auth.uid()) AND EXISTS (
     SELECT 1 FROM public.personality_test_attempts t
     WHERE t.id=attempt_id AND t.user_id=user_id AND t.completed_at IS NULL
   )
 )
 WITH CHECK (
   user_id=(SELECT auth.uid()) AND EXISTS (
     SELECT 1 FROM public.personality_test_attempts t
     WHERE t.id=attempt_id AND t.user_id=user_id AND t.completed_at IS NULL
   )
 );

-- A completed snapshot cannot be re-opened or silently reassigned.
CREATE FUNCTION private.guard_ipip_retest_attempt()
 RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=''
 AS $function$
BEGIN
 IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.user_id IS DISTINCT FROM OLD.user_id
    OR NEW.instrument_id IS DISTINCT FROM OLD.instrument_id
    OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
   RAISE EXCEPTION 'Immutable test identity' USING ERRCODE='42501';
 END IF;
 IF OLD.completed_at IS NOT NULL THEN
   RAISE EXCEPTION 'Completed test is immutable' USING ERRCODE='42501';
 END IF;
 IF NEW.completed_at IS NOT NULL AND (
   SELECT count(*) FROM public.personality_attempt_answers a
   WHERE a.attempt_id=OLD.id AND a.user_id=OLD.user_id
 )<>50 THEN
   RAISE EXCEPTION 'Complete all 50 items before finalizing' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION private.guard_ipip_retest_attempt()
 FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_ipip_retest_attempt
 BEFORE UPDATE ON public.personality_test_attempts
 FOR EACH ROW EXECUTE FUNCTION private.guard_ipip_retest_attempt();

CREATE FUNCTION private.guard_ipip_retest_answer()
 RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=''
 AS $function$
BEGIN
 IF NEW.attempt_id IS DISTINCT FROM OLD.attempt_id
    OR NEW.user_id IS DISTINCT FROM OLD.user_id
    OR NEW.question_id IS DISTINCT FROM OLD.question_id THEN
    RAISE EXCEPTION 'Immutable test-answer identity' USING ERRCODE='42501';
 END IF;
 NEW.updated_at=now();
 RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION private.guard_ipip_retest_answer()
 FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_ipip_retest_answer
 BEFORE UPDATE ON public.personality_attempt_answers
 FOR EACH ROW EXECUTE FUNCTION private.guard_ipip_retest_answer();

COMMENT ON TABLE public.personality_test_attempts IS
 'Self-only IPIP-50 retest attempts; not available to partner sharing or AI RPCs.';
COMMENT ON TABLE public.personality_attempt_answers IS
 'Private 50-item snapshots owned by one user; never expose raw answers to partners.';
