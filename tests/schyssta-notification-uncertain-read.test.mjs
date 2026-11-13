import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const id='11111111-1111-4111-8111-111111111111';

// Execute the actual production handler, not a rewritten model of its branches.
async function runCase({receiptRead=false,readbackFails=false}={}){
  const app=await read('live-app.js');
  const start=app.indexOf('async function markSchysstaRead(id){');
  const end=app.indexOf('\nfunction validSchysstaReplacementLinks(',start);
  assert.ok(start>=0&&end>start,'Production notification handler must be found');
  let refreshCalls=0,renderCalls=0;
  const ctx={
    schysstaListEnabled:true,user:{id:'current'},sharedSession:4,
    SCHYSSTA_UUID:/^[a-f0-9-]{36}$/,schysstaSaving:new Set(),
    schysstaNotifications:[{notification_id:id,read_at:null}],
    schysstaError:'',schysstaMessage:'',
    preflightSchysstaWrite:async()=>true,
    db:{rpc:()=>Promise.resolve({error:new Error('lost acknowledgement')})},
    schysstaWriteRpc:async p=>p,
    render:()=>{renderCalls++;},
  };
  ctx.fetchSchysstaList=async()=>{
    refreshCalls++;
    assert.equal(ctx.schysstaSaving.has(id),true,
      'Keep the notice locked until the server status has been checked');
    if(readbackFails){
      ctx.schysstaNotifications=[];
      ctx.schysstaError='Could not fetch notices';
      return false;
    }
    ctx.schysstaNotifications=[{notification_id:id,read_at:receiptRead?'2026-11-13T15:00:00Z':null}];
    return true;
  };
  vm.runInNewContext(app.slice(start,end)+'\nglobalThis.runProductionMarkSchysstaRead=markSchysstaRead;',ctx);
  await ctx.runProductionMarkSchysstaRead(id);
  return {ctx,refreshCalls,renderCalls};
}

test('lost Schyssta read acknowledgement reconciles a server-confirmed read',async()=>{
  const {ctx,refreshCalls,renderCalls}=await runCase({receiptRead:true});
  assert.equal(refreshCalls,1);
  assert.equal(ctx.schysstaSaving.size,0);
  assert.match(ctx.schysstaMessage,/serverkontroll visar att aviseringen är läst/);
  assert.equal(ctx.schysstaNotifications[0].read_at!==null,true);
  assert.equal(renderCalls,1);
});

test('lost Schyssta read acknowledgement keeps a confirmed unread notice unread',async()=>{
  const {ctx,refreshCalls}=await runCase({receiptRead:false});
  assert.equal(refreshCalls,1);
  assert.equal(ctx.schysstaNotifications[0].read_at,null);
  assert.match(ctx.schysstaMessage,/fortfarande är oläst/);
  assert.equal(ctx.schysstaSaving.size,0);
});

test('failed Schyssta readback never presents a stale verified unread count',async()=>{
  const {ctx,refreshCalls}=await runCase({readbackFails:true});
  assert.equal(refreshCalls,1);
  assert.equal(ctx.schysstaNotifications.length,0);
  assert.notEqual(ctx.schysstaError,'');
  assert.match(ctx.schysstaMessage,/kunde inte bekräftas/);
  assert.equal(ctx.schysstaSaving.size,0);
});
