-- Read-only role-negative check for teen-only B-card skip RPC.
-- Simulates Postgres JWT claims; DOES NOT sign a Supabase Auth session.
BEGIN TRANSACTION READ ONLY;
SELECT set_config('sec02.parent',(SELECT m.user_id::text FROM public.family_members m JOIN
 (SELECT family_id FROM public.family_members GROUP BY family_id HAVING count(*)=2
 AND count(*) FILTER (WHERE role='parent')=1 AND count(*) FILTER (WHERE role='teen')=1)
 pair USING(family_id) WHERE m.role='parent' LIMIT 1),true);
SET LOCAL ROLE authenticated;
DO $audit$
DECLARE denied boolean:=false;
BEGIN
 IF coalesce(current_setting('sec02.parent',true),'')='' THEN
  RAISE EXCEPTION 'No paired parent';
 END IF;
 PERFORM set_config('request.jwt.claims',
  json_build_object('sub',current_setting('sec02.parent'),'role','authenticated')::text,true);
 BEGIN
  PERFORM public.set_understanding_card_state('general-02',null,true);
 EXCEPTION WHEN insufficient_privilege THEN denied:=true;
 END;
 IF NOT denied THEN
  RAISE EXCEPTION 'Parent not denied teen-only skip RPC';
 END IF;
END $audit$;
RESET ROLE;
SELECT 'PASS: parent denied teen-only B-card skip RPC (simulated identity)' AS audit_result;
ROLLBACK;