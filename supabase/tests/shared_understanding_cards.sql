-- Disposable synthetic pgTAP contract; never run against production.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select plan(20);
select has_function('public','shared_understanding_cards',array[]::text[],'shared B RPC exists');
select has_function('public','set_understanding_card_share',array['text','boolean'],'explicit consent RPC exists');
select is(has_function_privilege('anon','public.shared_understanding_cards()','execute'),false,'anon cannot read');
select is(has_function_privilege('anon','public.set_understanding_card_share(text,boolean)','execute'),false,'anon cannot consent');

insert into auth.users(id,email) values
 ('31000000-0000-0000-0000-000000000001','a-parent@example.invalid'),
 ('31000000-0000-0000-0000-000000000002','a-teen@example.invalid'),
 ('32000000-0000-0000-0000-000000000001','b-parent@example.invalid'),
 ('32000000-0000-0000-0000-000000000002','b-teen@example.invalid'),
 ('33000000-0000-0000-0000-000000000001','single@example.invalid');
insert into public.families(id) values
 ('ca000000-0000-0000-0000-000000000000'),('cb000000-0000-0000-0000-000000000000'),('cc000000-0000-0000-0000-000000000000');
insert into public.family_members(family_id,user_id,role) values
 ('ca000000-0000-0000-0000-000000000000','31000000-0000-0000-0000-000000000001','parent'),
 ('ca000000-0000-0000-0000-000000000000','31000000-0000-0000-0000-000000000002','teen'),
 ('cb000000-0000-0000-0000-000000000000','32000000-0000-0000-0000-000000000001','parent'),
 ('cb000000-0000-0000-0000-000000000000','32000000-0000-0000-0000-000000000002','teen'),
 ('cc000000-0000-0000-0000-000000000000','33000000-0000-0000-0000-000000000001','parent');
insert into public.swipe_answers(user_id,deck_id,card_id,answer) values
 ('31000000-0000-0000-0000-000000000002','general','general-02',true),
 ('31000000-0000-0000-0000-000000000002','general','general-03',false),
 ('32000000-0000-0000-0000-000000000002','general','general-05',true);

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"31000000-0000-0000-0000-000000000001"}',true);
select is_empty($$select * from public.shared_understanding_cards()$$,'historical private YES is not shared');
select throws_ok($$select public.set_understanding_card_share('general-02',true)$$,'42501','card is not eligible for sharing','parent cannot create teen consent');
select set_config('request.jwt.claims','{"sub":"31000000-0000-0000-0000-000000000002"}',true);
select lives_ok($$select public.set_understanding_card_share('general-02',true)$$,'teen can actively share own eligible YES');
select is((select count(*) from public.understanding_card_shares where deck_id='general' and card_id='general-02'),1::bigint,'teen sees own consent only');
select set_config('request.jwt.claims','{"sub":"31000000-0000-0000-0000-000000000001"}',true);
select is((select deck_id||'/'||card_id from public.shared_understanding_cards()),'general/general-02','parent receives explicitly shared B YES');
select is_empty($$select * from public.shared_understanding_cards() where card_id='general-03'$$,'B NO stays private');
select set_config('request.jwt.claims','{"sub":"31000000-0000-0000-0000-000000000002"}',true);
select throws_ok($$select public.set_understanding_card_share('general-99',true)$$,'22023','invalid understanding card','unknown card rejected');
select throws_ok($$select public.set_understanding_card_share('general-01',true)$$,'22023','invalid understanding card','A card rejected');
select set_config('request.jwt.claims','{"sub":"31000000-0000-0000-0000-000000000001"}',true);
select is_empty($$select * from public.shared_understanding_cards() where card_id='general-05'$$,'other family stays isolated');
select set_config('request.jwt.claims','{"sub":"31000000-0000-0000-0000-000000000002"}',true);
select lives_ok($$select public.set_understanding_card_share('general-02',false)$$,'teen can revoke sharing');
select is_empty($$select * from public.understanding_card_shares$$,'revocation deletes consent');
select public.set_understanding_card_share('general-02',true);
reset role;
update public.swipe_answers set answer=false where user_id='31000000-0000-0000-0000-000000000002' and card_id='general-02';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"31000000-0000-0000-0000-000000000002"}',true);
select is_empty($$select * from public.understanding_card_shares$$,'answer change automatically revokes consent');
reset role;
update public.swipe_answers set answer=true where user_id='31000000-0000-0000-0000-000000000002' and card_id='general-02';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"31000000-0000-0000-0000-000000000001"}',true);
select is_empty($$select * from public.shared_understanding_cards()$$,'later YES does not reactivate old consent');
select set_config('request.jwt.claims','{"sub":"31000000-0000-0000-0000-000000000002"}',true);
select public.set_understanding_card_share('general-02',true);
reset role;
insert into public.swipe_skips(user_id,deck_id,card_id) values('31000000-0000-0000-0000-000000000002','general','general-02');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"31000000-0000-0000-0000-000000000002"}',true);
select is_empty($$select * from public.understanding_card_shares$$,'skip automatically revokes consent');
select set_config('request.jwt.claims','{"sub":"33000000-0000-0000-0000-000000000001"}',true);
select is_empty($$select * from public.shared_understanding_cards()$$,'single member sees nothing');
select throws_ok($$select public.set_understanding_card_share('general-02',true)$$,'42501','card is not eligible for sharing','non-teen cannot consent');
select is(pg_catalog.pg_get_function_result('public.shared_understanding_cards()'::regprocedure),'TABLE(deck_id text, card_id text)','shared RPC exposes IDs only');
select * from finish();
rollback;
