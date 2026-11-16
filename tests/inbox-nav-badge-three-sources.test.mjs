import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const helper=source.match(/function inboxNavUnreadState\(\)\{[\s\S]*?\n\}(?=\nfunction menu\()/)?.[0];
assert.ok(helper,'Unread navigation aggregator must remain available');

function badge({chat=0,rules=0,cards=0,chatError=false,rulesError='',cardsError='',rulesLoading=false,cardsLoading=false,paired=true,rulesEnabled=true,cardsEnabled=true}={}){
  const state={
    user:paired?{id:'viewer'}:null,
    members:paired?[{user_id:'viewer'},{user_id:'other'}]:[],
    inboxPairEpoch:paired?'verified-pair':null,
    familyChatUnread:chat,familyChatUnreadError:chatError,
    schysstaListEnabled:rulesEnabled,schysstaLoading:rulesLoading,schysstaError:rulesError,
    activityNotificationsEnabled:cardsEnabled,activityNotificationsLoading:cardsLoading,
    activityNotificationsError:cardsError,
    schysstaUnreadCount:()=>rules,activityUnreadCount:()=>cards
  };
  vm.runInNewContext(helper+'\nthis.readBadge=inboxNavUnreadState;',state);
  return JSON.parse(JSON.stringify(state.readBadge()));
}

test('inbox badge sums three independent unread categories',()=>{
  assert.deepEqual(badge({chat:2,rules:3,cards:4}),{total:9,unknown:false,parts:[2,3,4]});
  assert.deepEqual(badge(),{total:0,unknown:false,parts:[0,0,0]});
});

test('reading private messages must not erase unread rules or shared cards',()=>{
  assert.deepEqual(badge({chat:0,rules:2,cards:1}),{total:3,unknown:false,parts:[0,2,1]});
});

test('failed and pending category reads remain explicitly unknown, not verified zero',()=>{
  assert.deepEqual(badge({chatError:true,rules:2}),{total:2,unknown:true,parts:[null,2,0]});
  assert.deepEqual(badge({rulesLoading:true,cardsError:'Network error'}),{total:0,unknown:true,parts:[0,null,null]});
  assert.deepEqual(badge({cardsLoading:true,chat:1}),{total:1,unknown:true,parts:[1,0,null]});
});

test('disabled categories are zero; unverified pairing exposes no old counts',()=>{
  assert.deepEqual(badge({chat:1,rules:4,cards:3,rulesEnabled:false,cardsEnabled:false}),{total:1,unknown:false,parts:[1,0,0]});
  assert.deepEqual(badge({paired:false,chat:10,rules:5,cards:2}),{total:0,unknown:false,parts:[0,0,0]});
});
