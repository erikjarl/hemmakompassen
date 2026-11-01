import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {IPIP50_V1} from '../personality/ipip50-v1.js';

const sql=fs.readFileSync(new URL('../supabase/migrations/20261101170000_personality_ipip50_pair_sharing.sql',import.meta.url),'utf8');
test('server contract uses exact, versioned 50-item canonical key for both sharing and scores',()=>{
  assert.match(sql,/instrument_id='ipip50-sv-v1'/);
  for(const item of IPIP50_V1.items){
    const term="('"+item.id+"', '"+item.factorId+"', "+String(item.reverse)+")";
    assert.equal(sql.split(term).length-1,2,'missing item or wrong factor/reverse: '+item.id);
  }
  assert.match(sql,/having count\(\*\)=10/);
  assert.match(sql,/having count\(\*\)=5/);
  assert.match(sql,/v_valid<>50/);
  assert.match(sql,/v_profiles is null or .*<>2/);
});

test('explicit opt-in scoped to current exactly two members; revoke before reading',()=>{
  assert.match(sql,/v_member_count<>2 or v_parent_count<>1 or v_teen_count<>1/);
  assert.match(sql,/v_consent_count<>2 then return null/);
  assert.match(sql,/p\.joined_at=m\.joined_at/);
  assert.match(sql,/p\.family_id=m\.family_id/);
  assert.match(sql,/if p_share = false then[\s\S]*?delete from public\.personality_share_preferences/);
  assert.match(sql,/return pg_catalog\.jsonb_build_object\([\s\S]*?'instrument_id'/);
  assert.doesNotMatch(sql,/jsonb_agg\(a\.answer/,'never return item answers');
});

test('no unauthenticated functions, no direct consent writes and RLS enabled',()=>{
  assert.match(sql,/alter table public\.personality_share_preferences enable row level security/);
  assert.match(sql,/revoke all on public\.personality_share_preferences from public,anon,authenticated/);
  assert.match(sql,/grant select \(user_id,instrument_id,share_enabled\)/);
  assert.match(sql,/revoke all on function public\.set_my_ipip50_share\(boolean\) from public,anon/);
  assert.match(sql,/revoke all on function public\.my_ipip50_shared_profiles\(\) from public,anon/);
  assert.match(sql,/v_user uuid := \(select auth\.uid\(\)\)/);
});
