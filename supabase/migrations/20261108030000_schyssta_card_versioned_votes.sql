-- INT-02 / SEC-02: Card-based Schyssta rules must display decisions only
-- for the agreement's currently active version, just like manual rules.
-- Retain exact-pair/epoch isolation and the existing public RPC signature.
CREATE OR REPLACE FUNCTION public.my_schyssta_rules()
RETURNS TABLE(agreement_id uuid, source_card_id text, body text, status text,
              proposed_by_me boolean, own_decision boolean,
              parent_decision boolean, teen_decision boolean,
              created_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  select
    agreement.id,
    agreement.source_card_id,
    agreement.body,
    case
      when parent_vote.approved is false or teen_vote.approved is false then 'rejected'
      when parent_vote.approved is true and teen_vote.approved is true then 'accepted'
      else 'proposed'
    end as status,
    agreement.proposed_by = (select auth.uid()),
    own_vote.approved,
    parent_vote.approved,
    teen_vote.approved,
    agreement.created_at
  from public.agreements as agreement
  left join public.agreement_approvals as own_vote
    on own_vote.agreement_id = agreement.id
   and own_vote.user_id = (select auth.uid())
   and own_vote.agreement_version = agreement.agreement_version
  left join public.family_members as parent_member
    on parent_member.family_id = agreement.family_id and parent_member.role = 'parent'
  left join public.agreement_approvals as parent_vote
    on parent_vote.agreement_id = agreement.id
   and parent_vote.user_id = parent_member.user_id
   and parent_vote.agreement_version = agreement.agreement_version
  left join public.family_members as teen_member
    on teen_member.family_id = agreement.family_id and teen_member.role = 'teen'
  left join public.agreement_approvals as teen_vote
    on teen_vote.agreement_id = agreement.id
   and teen_vote.user_id = teen_member.user_id
   and teen_vote.agreement_version = agreement.agreement_version
  where (select auth.uid()) is not null
    and agreement.family_id = private.current_exact_pair_family_id()
    and agreement.source_deck_id = 'regler'
    and agreement.source_card_id is not null
    and agreement.status <> 'withdrawn'
    and agreement.paired_parent_id = parent_member.user_id
    and agreement.paired_teen_id = teen_member.user_id
    and agreement.paired_parent_joined_at = parent_member.joined_at
    and agreement.paired_teen_joined_at = teen_member.joined_at
  order by agreement.created_at, agreement.id
$function$;
