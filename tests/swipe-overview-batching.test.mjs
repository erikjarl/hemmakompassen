import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Exercise the actual production functions without connecting to Supabase
// or writing to existing test users' saved answers.
const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const start=app.indexOf('function scheduleSwipeOverviewRefresh(){');
const end=app.indexOf('function insightsEntry(){',start);
assert.ok(start>=0&&end>start,'locate production overview functions');
const production=app.slice(start,end);

function setup(){
  const timers=new Map();
  let timerId=0,rpcCount=0,renderCount=0,route='swipe';
  let deferred=null;
  const factory=new Function('env',`
    let user={id:'parent'},sharedSession=1,swipeOverviewRows=[{card_id:'old'}],
      swipeOverviewUnderstandingRows=[],swipeOverviewError='',swipeOverviewLoading=false,swipeOverviewRequest=0,
      swipeOverviewRefreshTimer=null;
    const members=[{user_id:'parent',role:'parent'},{user_id:'teen',role:'teen'}];
    const sharedInsightsEnabled=true,sharedUnderstandingEnabled=false;
    const safeSharedUnderstanding=()=>[];
    const INSIGHT_DECK_IDS=['general','one','two','three','four','five','six'];
    const page=()=>env.route();
    const renderKeepingGeneralReview=()=>env.render();
    const setTimeout=env.setTimeout,clearTimeout=env.clearTimeout;
    const db={rpc:(method,args)=>env.rpc(args.p_deck_id)};
    const safeInsightMatches=(deck,rows)=>rows.filter(r=>r.answer===true)
      .map(r=>({deck_id:deck,card_id:r.card_id,answer:true}));
    ${production}
    return {
      schedule:scheduleSwipeOverviewRefresh,
      fetch:fetchSwipeOverview,
      state:()=>({rows:swipeOverviewRows,loading:swipeOverviewLoading,
        request:swipeOverviewRequest,error:swipeOverviewError}),
      changeSession:()=>{sharedSession++},
      changeUser:id=>{user={id}},
    };
  `);
  const api=factory({
    route:()=>route,render:()=>renderCount++,
    setTimeout:(fn,ms)=>{const id=++timerId;timers.set(id,{fn,ms});return id},
    clearTimeout:id=>timers.delete(id),
    rpc:deck=>{
      rpcCount++;
      if(deferred)return deferred(deck);
      return Promise.resolve({data:[{card_id:'shared',answer:true}]});
    },
  });
  const fire=()=>{const entries=[...timers.values()];timers.clear();entries.forEach(x=>x.fn());};
  const flush=()=>new Promise(resolve=>setImmediate(resolve));
  return {api,timers,fire,flush,get rpcCount(){return rpcCount},
    get renderCount(){return renderCount},
    setDeferred:fn=>{deferred=fn},setRoute:value=>{route=value}};
}

test('three fast saved answers become one seven-deck request',async()=>{
  const s=setup();
  s.api.schedule();s.api.schedule();s.api.schedule();
  assert.equal(s.timers.size,1);
  assert.equal([...s.timers.values()][0].ms,350);
  assert.equal(s.rpcCount,0);
  assert.deepEqual(s.api.state().rows,[]);
  s.fire();
  await s.flush();
  assert.equal(s.rpcCount,7);
  assert.equal(s.api.state().rows.length,7);
  assert.equal(s.api.state().loading,false);
});

test('a superseded in-flight server snapshot cannot restore revoked results',async()=>{
  const s=setup(),pending=[];
  s.setDeferred(deck=>new Promise(resolve=>pending.push({deck,resolve})));
  void s.api.fetch();
  assert.equal(s.rpcCount,7);
  s.api.schedule();
  assert.equal(s.api.state().rows.length,0);
  pending.splice(0).forEach(p=>p.resolve({data:[{card_id:'revoked',answer:true}]}));
  await s.flush();
  assert.deepEqual(s.api.state().rows,[]);
  s.fire();
  assert.equal(s.rpcCount,14);
  pending.splice(0).forEach(p=>p.resolve({data:[]}));
  await s.flush();
  assert.deepEqual(s.api.state().rows,[]);
  assert.equal(s.api.state().loading,false);
});

test('a session change prevents a pending batch from fetching',async()=>{
  const s=setup();
  s.api.schedule();
  s.api.changeSession();
  s.fire();
  await s.flush();
  assert.equal(s.rpcCount,0);
});

test('a failed deck RPC hides the whole shared snapshot',async()=>{
  const s=setup();
  s.setDeferred(deck=>Promise.resolve(deck==='three'
    ?{error:{message:'offline'}}:{data:[{card_id:'shared',answer:true}]}));
  await s.api.fetch();
  assert.equal(s.api.state().rows.length,0);
  assert.match(s.api.state().error,/kunde inte kontrolleras/i);
  assert.equal(s.api.state().loading,false);
});
