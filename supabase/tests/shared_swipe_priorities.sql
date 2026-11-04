-- Disposable synthetic pgTAP contract for explicit teen-shared priorities.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(25);

insert into auth.users(id,email) values
 ('41000000-0000-0000-0000-000000000001','a-parent@example.invalid'),
 ('41000000-0000-0000-0000-000000000002','a-teen@example.invalid'),
 ('42000000-0000-0000-0000-000000000001','b-parent@example.invalid'),
 ('42000000-0000-0000-0000-000000000002','b-teen@example.invalid'),
 ('43000000-0000-0000-0000-000000000001','single@example.invalid');
insert into public.families(id) values
 ('da000000-0000-0000-0000-000000000000'),
 ('db000000-0000-0000-0000-000000000000'),
 ('dc000000-0000-0000-0000-000000000000');
insert into public.family_members(family_id,user_id,role) values
 ('da000000-0000-0000-0000-000000000000','41000000-0000-0000-0000-000000000001','parent'),
 ('da000000-0000-0000-0000-000000000000','41000000-0000-0000-0000-000000000002','teen'),
 ('db000000-0000-0000-0000-000000000000','42000000-0000-0000-0000-000000000001','parent'),
 ('db000000-0000-0000-0000-000000000000','42000000-0000-0000-0000-000000000002','teen'),
 ('dc000000-0000-0000-0000-000000000000','43000000-0000-0000-0000-000000000001','parent');
insert into public.swipe_answers(user_id,deck_id,card_id,answer) values
 ('41000000-0000-0000-0000-000000000001','general','general-01',true),
 ('41000000-0000-0000-0000-000000000002','general','general-01',true),
 ('41000000-0000-0000-0000-000000000001','general','general-02',true),
 ('41000000-0000-0000-0000-000000000002','general','general-02',true),
 ('41000000-0000-0000-0000-000000000001','general','general-10',false),
 ('41000000-0000-0000-0000-000000000002','general','general-10',false),
 ('41000000-0000-0000-0000-000000000001','general','general-11',false),
 ('41000000-0000-0000-0000-000000000002','general','general-11',true),
 ('41000000-0000-0000-0000-000000000002','general','general-13',true),
 ('41000000-0000-0000-0000-000000000001','aktiviteter','aktiviteter-01',true),
 ('41000000-0000-0000-0000-000000000002','aktiviteter','aktiviteter-01',true),
 ('42000000-0000-0000-0000-000000000001','general','general-01',true),
 ('42000000-0000-0000-0000-000000000002','general','general-01',true);
insert into public.swipe_importance(user_id,deck_id,card_id,importance) values
 ('41000000-0000-0000-0000-000000000002','general','general-01',1),
 ('41000000-0000-0000-0000-000000000002','general','general-02',1),
 ('41000000-0000-0000-0000-000000000002','general','general-10',1),
 ('41000000-0000-0000-0000-000000000002','general','general-11',1),
 ('41000000-0000-0000-0000-000000000002','general','general-13',1),
 ('41000000-0000-0000-0000-000000000002','aktiviteter','aktiviteter-01',1),
 ('42000000-0000-0000-0000-000000000002','general','general-01',1);

select has_table('public','swipe_priority_shares','explicit priority consent table exists');
select has_function('public','set_swipe_priority_share',array['text','text','boolean'],'priority consent setter exists');
select has_function('public','shared_swipe_priorities',array['text'],'priority aggregate RPC exists');
select is(has_function_privilege('anon','public.set_swipe_priority_share(text,text,boolean)','execute'),false,'anon cannot set consent');
select is(has_function_privilege('authenticated','public.eligible_swipe_priorities(text)','execute'),false,'eligibility RPC is internal only');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"41000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select is_empty($$select * from public.shared_swipe_priorities('general')$$,'historical private +1 is not consent');
select throws_ok($$select public.set_swipe_priority_share('general','general-01',true)$$,'42501','card is not eligible for priority sharing','parent cannot grant teen consent');

select set_config('request.jwt.claims','{"sub":"41000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
select throws_ok($$select public.set_swipe_priority_share('general','general-02',true)$$,'42501','card is not eligible for priority sharing','B card cannot become A priority');
select throws_ok($$select public.set_swipe_priority_share('unknown','general-01',true)$$,'22023','unsupported swipe card','unknown deck is rejected');
select lives_ok($$select public.set_swipe_priority_share('general','general-01',true)$$,'teen can share eligible mutual A +1');
select lives_ok($$select public.set_swipe_priority_share('aktiviteter','aktiviteter-01',true)$$,'teen can share eligible theme A +1');

select set_config('request.jwt.claims','{"sub":"41000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select is_empty($$select * from public.swipe_priority_shares$$,'parent cannot read teen consent table');
select results_eq($$select deck_id,card_id from public.shared_swipe_priorities('general')$$,$$values ('general'::text,'general-01'::text)$$,'parent sees consented A only');
select results_eq($$select deck_id,card_id from public.shared_swipe_priorities('aktiviteter')$$,$$values ('aktiviteter'::text,'aktiviteter-01'::text)$$,'theme A uses same boundary');
select is_empty($$select * from public.shared_swipe_priorities('general') where card_id in ('general-02','general-10','general-11','general-13')$$,'B, NO, disagreement and unilateral answers stay hidden');

select set_config('request.jwt.claims','{"sub":"42000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
select lives_ok($$select public.set_swipe_priority_share('general','general-01',true)$$,'second family teen consents independently');
select set_config('request.jwt.claims','{"sub":"42000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select results_eq($$select deck_id,card_id from public.shared_swipe_priorities('general')$$,$$values ('general'::text,'general-01'::text)$$,'family isolation holds');
select set_config('request.jwt.claims','{"sub":"43000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select is_empty($$select * from public.shared_swipe_priorities('general')$$,'single-member family sees nothing');

reset role;
update public.swipe_importance set importance=0 where user_id='41000000-0000-0000-0000-000000000002' and deck_id='general' and card_id='general-01';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"41000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select is_empty($$select * from public.shared_swipe_priorities('general')$$,'lowering importance revokes share immediately');

reset role;
update public.swipe_importance set importance=1 where user_id='41000000-0000-0000-0000-000000000002' and deck_id='general' and card_id='general-01';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"41000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
select lives_ok($$select public.set_swipe_priority_share('general','general-01',true)$$,'teen can consent again');
reset role;
delete from public.swipe_answers where user_id='41000000-0000-0000-0000-000000000001' and deck_id='general' and card_id='general-01';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"41000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
select is_empty($$select * from public.shared_swipe_priorities('general')$$,'revoking either A YES removes priority');

reset role;
insert into public.swipe_answers(user_id,deck_id,card_id,answer) values('41000000-0000-0000-0000-000000000001','general','general-01',true);
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"41000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
select lives_ok($$select public.set_swipe_priority_share('general','general-01',true)$$,'fresh consent can be granted');
select lives_ok($$select public.set_swipe_priority_share('general','general-01',false)$$,'teen can actively revoke consent');
select is_empty($$select * from public.shared_swipe_priorities('general')$$,'active revocation removes priority');
select set_config('request.jwt.claims','{"role":"authenticated"}',true);
select throws_ok($$select * from public.shared_swipe_priorities('general')$$,'42501','authentication required','missing identity is rejected');

select * from finish();
rollback;
