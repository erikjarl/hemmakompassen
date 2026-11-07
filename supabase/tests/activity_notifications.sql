-- NOT-01B backend-only safety and consent tests, synthetic users/transaction.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select plan(31);

insert into auth.users (id,email) values
 ('57000000-0000-0000-0000-000000000001','activity-parent-a@example.invalid'),
 ('57000000-0000-0000-0000-000000000002','activity-teen-a@example.invalid'),
 ('58000000-0000-0000-0000-000000000001','activity-parent-b@example.invalid'),
 ('58000000-0000-0000-0000-000000000002','activity-teen-b@example.invalid');
insert into public.families(id) values
 ('f7000000-0000-0000-0000-000000000000'),
 ('f8000000-0000-0000-0000-000000000000');
insert into public.family_members(family_id,user_id,role) values
 ('f7000000-0000-0000-0000-000000000000','57000000-0000-0000-0000-000000000001','parent'),
 ('f7000000-0000-0000-0000-000000000000','57000000-0000-0000-0000-000000000002','teen'),
 ('f8000000-0000-0000-0000-000000000000','58000000-0000-0000-0000-000000000001','parent'),
 ('f8000000-0000-0000-0000-000000000000','58000000-0000-0000-0000-000000000002','teen');

select has_table('public','activity_notifications','grouped notification table exists');
select has_table('public','activity_notification_event_keys','one-time event keys exist');
select has_function('public','my_activity_notifications',array[]::text[],'recipient-only read RPC exists');
select has_function('public','mark_activity_notification_read',array['uuid'],'read receipt RPC exists');
select is(has_table_privilege('authenticated','public.activity_notifications','SELECT'),false,'no direct authenticated notification SELECT');
select is(has_table_privilege('authenticated','public.activity_notification_event_keys','INSERT'),false,'no client event injection');
select is(has_function_privilege('anon','public.my_activity_notifications()','EXECUTE'),false,'anonymous read blocked');
select is(has_function_privilege('authenticated','private.record_activity_notification(text,text,text,uuid,uuid)','EXECUTE'),false,'internal creation RPC not public');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"57000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
insert into public.swipe_answers(user_id,deck_id,card_id,answer) values
 ('57000000-0000-0000-0000-000000000001','aktiviteter','aktiviteter-01',true);
select is_empty($$select * from public.my_activity_notifications()$$,'unilateral parent YES sends no alert');

select set_config('request.jwt.claims','{"sub":"57000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
insert into public.swipe_answers(user_id,deck_id,card_id,answer) values
 ('57000000-0000-0000-0000-000000000002','aktiviteter','aktiviteter-01',true);
select is_empty($$select * from public.my_activity_notifications()$$,'last respondent does not receive own alert');
select set_config('request.jwt.claims','{"sub":"57000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select results_eq(
 $$select event_kind,deck_id from public.my_activity_notifications()$$,
 $$values ('mutual_match'::text,'aktiviteter'::text)$$,
 'other member sees only allowed mutual A event');
select set_config('test.activity_id',(
  select notification_id::text from public.my_activity_notifications() limit 1
),true);
select lives_ok(
 $$select public.mark_activity_notification_read(current_setting('test.activity_id')::uuid)$$,
 'authorized recipient may mark as read');
select is(
 (select count(*)::integer from public.my_activity_notifications() where read_at is not null),1,
 'read receipt persists');

select set_config('request.jwt.claims','{"sub":"57000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
update public.swipe_answers set answer=true
 where user_id='57000000-0000-0000-0000-000000000002'
   and deck_id='aktiviteter' and card_id='aktiviteter-01';
select set_config('request.jwt.claims','{"sub":"57000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select is(
 (select count(*)::integer from public.my_activity_notifications() where read_at is not null),1,
 'same answer upsert does not create another alert');

insert into public.swipe_answers(user_id,deck_id,card_id,answer) values
 ('57000000-0000-0000-0000-000000000001','aktiviteter','aktiviteter-02',true);
select set_config('request.jwt.claims','{"sub":"57000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
insert into public.swipe_answers(user_id,deck_id,card_id,answer) values
 ('57000000-0000-0000-0000-000000000002','aktiviteter','aktiviteter-02',true);
select set_config('request.jwt.claims','{"sub":"57000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select is(
 (select count(*)::integer from public.my_activity_notifications()),1,
 'two mutual cards group into one daily digest');
select is(
 (select count(*)::integer from public.my_activity_notifications() where read_at is null),1,
 'new card reopens the single digest instead of sending a second row');

set local role postgres;
select is(
 (select count(*)::integer from public.activity_notification_event_keys
   where family_id='f7000000-0000-0000-0000-000000000000'),2,
 'event keys retain two distinct eligible card events');
set local role authenticated;

select set_config('request.jwt.claims','{"sub":"58000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select is_empty($$select * from public.my_activity_notifications()$$,
 'another family cannot see the first family alerts');
select throws_ok(
 $$select public.mark_activity_notification_read(current_setting('test.activity_id')::uuid)$$,
 '42501','notification unavailable','unrelated family cannot mark a foreign alert');

-- Unknown cards and NO are not valid matches even if stored in the private table.
select set_config('request.jwt.claims','{"sub":"57000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
insert into public.swipe_answers(user_id,deck_id,card_id,answer) values
 ('57000000-0000-0000-0000-000000000001','aktiviteter','aktiviteter-999',true),
 ('57000000-0000-0000-0000-000000000001','aktiviteter','aktiviteter-03',true);
select set_config('request.jwt.claims','{"sub":"57000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
insert into public.swipe_answers(user_id,deck_id,card_id,answer) values
 ('57000000-0000-0000-0000-000000000002','aktiviteter','aktiviteter-999',true),
 ('57000000-0000-0000-0000-000000000002','aktiviteter','aktiviteter-03',false);
set local role postgres;
select is(
 (select count(*)::integer from public.activity_notification_event_keys
   where family_id='f7000000-0000-0000-0000-000000000000'),2,
 'unknown A card and dissent do not generate event keys');
select is(
 (select count(*)::integer from public.activity_notifications
   where family_id='f7000000-0000-0000-0000-000000000000'),1,
 'unknown A card and NO do not produce a new digest');
set local role authenticated;

-- A B-card answer remains private until the teen explicitly opts in.
select set_config('request.jwt.claims','{"sub":"57000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
insert into public.swipe_answers(user_id,deck_id,card_id,answer) values
 ('57000000-0000-0000-0000-000000000002','general','general-02',true);
set local role postgres;
select is(
 (select count(*)::integer from public.activity_notification_event_keys
   where event_kind='teen_shared_understanding'),0,
 'private B YES does not generate an event');
set local role authenticated;
select lives_ok(
 $$select public.set_understanding_card_share('general-02',true)$$,
 'explicit teen B consent is accepted');
select set_config('request.jwt.claims','{"sub":"57000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select is(
 (select count(*)::integer from public.my_activity_notifications()
    where event_kind='teen_shared_understanding'),1,
 'parent sees explicit shared B consent as a separate neutral event');

select set_config('request.jwt.claims','{"sub":"57000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
select lives_ok(
 $$select public.set_understanding_card_share('general-02',false)$$,
 'teen can revoke B consent');
select set_config('request.jwt.claims','{"sub":"57000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select is(
 (select count(*)::integer from public.my_activity_notifications()
    where event_kind='teen_shared_understanding'),0,
 'withdrawn B sharing disappears immediately');

select set_config('request.jwt.claims','{"sub":"57000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
update public.swipe_answers set answer=false
 where user_id='57000000-0000-0000-0000-000000000002'
   and deck_id='aktiviteter' and card_id='aktiviteter-01';
select set_config('request.jwt.claims','{"sub":"57000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select is(
 (select count(*)::integer from public.my_activity_notifications()
   where event_kind='mutual_match'),1,
 'other matching card keeps an active digest');
select set_config('request.jwt.claims','{"sub":"57000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
update public.swipe_answers set answer=false
 where user_id='57000000-0000-0000-0000-000000000002'
   and deck_id='aktiviteter' and card_id='aktiviteter-02';
select set_config('request.jwt.claims','{"sub":"57000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select is_empty($$select * from public.my_activity_notifications()$$,
 'when every mutual match is withdrawn the digest is hidden');

select set_config('request.jwt.claims','{"sub":"57000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
update public.swipe_answers set answer=true
 where user_id='57000000-0000-0000-0000-000000000002'
   and deck_id='aktiviteter' and card_id='aktiviteter-01';
select set_config('request.jwt.claims','{"sub":"57000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select is(
 (select count(*)::integer from public.my_activity_notifications()
   where event_kind='mutual_match'),1,
 'a newly re-established match is eligible again');
set local role postgres;
update public.family_members set joined_at=joined_at+interval '1 second'
 where family_id='f7000000-0000-0000-0000-000000000000' and role='teen';
set local role authenticated;
select is_empty($$select * from public.my_activity_notifications()$$,
 'pair epoch change makes old notifications unavailable');

select throws_ok(
 $$insert into public.activity_notifications(
    family_id,parent_id,teen_id,parent_joined_at,teen_joined_at,
    recipient_id,event_kind,deck_id,event_date
  ) values (
    'f7000000-0000-0000-0000-000000000000',
    '57000000-0000-0000-0000-000000000001',
    '57000000-0000-0000-0000-000000000002',
    now(),now(),'57000000-0000-0000-0000-000000000001',
    'mutual_match','aktiviteter',current_date
  )$$,
 '42501','permission denied for table activity_notifications',
 'authenticated clients cannot fabricate an activity notification');
select * from finish();
rollback;
