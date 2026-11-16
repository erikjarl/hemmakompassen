import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Exercise the production unread-state function with synthetic state only.
// No Supabase connection or real family messages are used.
const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const start=app.indexOf('function inboxNavUnreadState(){');
const end=app.indexOf('\nfunction menu(){',start);
assert.ok(start>=0&&end>start,'production unread-state function must exist');
const source=app.slice(start,end);
const names=[
  'user','members','inboxPairEpoch','familyChatUnreadError','familyChatUnread',
  'schysstaListEnabled','schysstaLoading','schysstaError','schysstaUnreadCount',
  'activityNotificationsEnabled','activityNotificationsLoading',
  'activityNotificationsError','activityUnreadCount'
];
const evaluate=new Function(...names,source+'\nreturn inboxNavUnreadState();');
const state=(overrides={})=>{
  const defaults={
    user:{id:'synthetic-viewer'},members:[{role:'parent'},{role:'teen'}],
    inboxPairEpoch:'synthetic-pair',familyChatUnreadError:false,
    familyChatUnread:0,schysstaListEnabled:true,schysstaLoading:false,
    schysstaError:'',schysstaUnreadCount:()=>0,
    activityNotificationsEnabled:true,activityNotificationsLoading:false,
    activityNotificationsError:'',activityUnreadCount:()=>0
  };
  const values={...defaults,...overrides};
  return evaluate(...names.map(name=>values[name]));
};

test('unpaired navigation never shows an inherited unread badge',()=>{
  assert.deepEqual(state({members:[]}),{total:0,unknown:false,parts:[0,0,0]});
  assert.deepEqual(state({inboxPairEpoch:null}),{total:0,unknown:false,parts:[0,0,0]});
});

test('confirmed read receipts clear the unread badge across all three categories',()=>{
  assert.deepEqual(state(),{total:0,unknown:false,parts:[0,0,0]});
  assert.deepEqual(state({
    familyChatUnread:2,schysstaUnreadCount:()=>1,activityUnreadCount:()=>3
  }),{total:6,unknown:false,parts:[2,1,3]});
});

test('a failed chat unread readback is unknown, not falsely zero',()=>{
  assert.deepEqual(state({familyChatUnreadError:true}),{
    total:0,unknown:true,parts:[null,0,0]
  });
});

test('a pending rule or activity refresh never reports a confirmed zero',()=>{
  assert.deepEqual(state({schysstaLoading:true}),{
    total:0,unknown:true,parts:[0,null,0]
  });
  assert.deepEqual(state({activityNotificationsError:'Server unavailable'}),{
    total:0,unknown:true,parts:[0,0,null]
  });
});

test('a known unread category remains visible when another category fails',()=>{
  assert.deepEqual(state({
    familyChatUnread:2,schysstaError:'Could not verify',
    activityUnreadCount:()=>1
  }),{total:3,unknown:true,parts:[2,null,1]});
});

test('disabled categories cannot add misleading unread counts',()=>{
  assert.deepEqual(state({
    schysstaListEnabled:false,activityNotificationsEnabled:false,
    schysstaUnreadCount:()=>7,activityUnreadCount:()=>9
  }),{total:0,unknown:false,parts:[0,0,0]});
});
