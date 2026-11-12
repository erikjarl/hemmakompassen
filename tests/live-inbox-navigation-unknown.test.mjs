import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const script=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const start=script.indexOf('function inboxNavUnreadState(){');
const end=script.indexOf('function menu(){',start);
assert.ok(start>=0&&end>start,'Unread badge helper can be exercised independently');
const code=script.slice(start,end)+';this.read=inboxNavUnreadState;';
const state={
  user:{id:'viewer'},members:[{user_id:'viewer'},{user_id:'counterpart'}],
  inboxPairEpoch:'pair',familyChatUnreadError:false,familyChatUnread:0,
  schysstaListEnabled:true,schysstaLoading:false,schysstaError:'',
  activityNotificationsEnabled:true,activityNotificationsLoading:false,
  activityNotificationsError:'',
  schysstaUnreadCount:()=>0,activityUnreadCount:()=>0
};
vm.runInNewContext(code,state);
const snapshot=()=>JSON.parse(JSON.stringify(state.read()));
assert.deepEqual(snapshot(),{total:0,unknown:false,parts:[0,0,0]},
  'All three verified zeroes mean no badge');
state.familyChatUnread=2;state.schysstaUnreadCount=()=>1;state.activityUnreadCount=()=>3;
assert.deepEqual(snapshot(),{total:6,unknown:false,parts:[2,1,3]},
  'Three known unread categories are additive');
state.schysstaLoading=true;
assert.deepEqual(snapshot(),{total:5,unknown:true,parts:[2,null,3]},
  'Pending rules are unknown, never zero');
state.schysstaLoading=false;state.schysstaError='Could not load';
assert.deepEqual(snapshot(),{total:5,unknown:true,parts:[2,null,3]},
  'Failed rules are unknown, never zero');
state.schysstaError='';state.familyChatUnreadError=true;state.activityNotificationsError='Could not load';
assert.deepEqual(snapshot(),{total:1,unknown:true,parts:[null,1,null]},
  'Known unread total remains a lower bound if other categories fail');
state.schysstaUnreadCount=()=>0;
assert.deepEqual(snapshot(),{total:0,unknown:true,parts:[null,0,null]},
  'Unknown totals may not be represented as empty badges');
state.user=null;
assert.deepEqual(snapshot(),{total:0,unknown:false,parts:[0,0,0]},
  'Unpaired or signed-out sessions never reveal stale badge counts');

const menu=script.slice(end,script.indexOf("const card=html=>",end));
assert.match(menu,/const unreadState=inboxNavUnreadState\(\)/);
assert.match(menu,/const unknown=isInbox&&unreadState\.unknown/);
assert.match(menu,/count\+'\+'\):'\?'\)/);
assert.match(menu,/aria-label/);
assert.match(menu,/const html=nav\.map\(navItem\)\.join\(''\)/);
assert.match(menu,/desktop\.innerHTML=html/);
assert.match(menu,/mobile\.innerHTML=html/);
console.log('PASS: inbox unread navigation handles known, unknown and partial counts');
