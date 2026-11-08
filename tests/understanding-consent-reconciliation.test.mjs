import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const start=source.indexOf('// Read back the CURRENT consent state after a write');
const end=source.indexOf('// Only poll the authenticated, server-verified shared RPC',start);
assert.ok(start>0&&end>start,'Extract the real production consent functions');
const implementation=source.slice(start,end);

function fixture({initial=false,failWriteAfter=false,failWriteBefore=false,failRead=false}={}){
  const server=new Set(initial?['general-02']:[]);
  const counts={write:0,read:0,refresh:0,render:0,invalidate:0};
  let writeAfter=failWriteAfter,writeBefore=failWriteBefore,readFails=failRead;
  const context={
    user:{id:'teen-user'},sharedSession:1,members:[{role:'teen'},{role:'parent'}],
    sharedUnderstandingEnabled:true,understandingSharesAvailable:true,
    understandingShareChecking:false,understandingShareError:'',
    understandingShareSaving:new Set(),
    understandingShares:new Set(initial?['general-02']:[]),
    sharedUnderstandingRows:initial?[{deck_id:'general',card_id:'general-02'}]:[],
    insightsRequest:7,insightsLoading:true,
    GENERAL_CARDS:[{id:'general-02',type:'understanding'}],
    swipeAnswers:new Map([['general-02',true]]),
    aiResults:{invalidate:(kind,scope)=>{assert.equal(kind,'swipe');assert.equal(scope,'all');counts.invalidate++;}},
    viewerRole:()=> 'teen',
    page:()=> 'insikter',
    render:()=>{counts.render++;},
    fetchInsights:async()=>{counts.refresh++;},
    db:{
      async rpc(name,args){
        assert.equal(name,'set_understanding_card_share');
        assert.equal(args.p_card_id,'general-02');
        counts.write++;
        if(writeBefore)return {error:{message:'write denied'}};
        if(args.p_share)server.add(args.p_card_id);else server.delete(args.p_card_id);
        return writeAfter?{error:{message:'acknowledgement lost'}}:{error:null};
      },
      from(table){
        assert.equal(table,'understanding_card_shares');
        return {select(cols){
          assert.equal(cols,'deck_id,card_id');
          return {async eq(column,viewer){
            assert.equal(column,'user_id');
            assert.equal(viewer,'teen-user');
            counts.read++;
            return readFails
              ?{data:null,error:{message:'read unavailable'}}
              :{data:[...server].map(card_id=>({deck_id:'general',card_id})),error:null};
          }};
        }};
      }
    }
  };
  vm.runInNewContext(implementation+'\nthis.flow={setUnderstandingShare,verifyUnderstandingShares,retryUnderstandingShares};',context);
  return {context,counts,server,
    change:({writeAfter:wa,writeBefore:wb,readFails:rf})=>{
      if(wa!==undefined)writeAfter=wa;
      if(wb!==undefined)writeBefore=wb;
      if(rf!==undefined)readFails=rf;
    }
  };
}

test('acknowledged share and revoke both re-read current server state',async()=>{
  const {context:c,counts,server}=fixture();
  await c.flow.setUnderstandingShare('general-02',true,'teen-user',1);
  assert.equal(server.has('general-02'),true);
  assert.equal(c.understandingShares.has('general-02'),true);
  await c.flow.setUnderstandingShare('general-02',false,'teen-user',1);
  assert.equal(server.has('general-02'),false);
  assert.equal(c.understandingShares.has('general-02'),false);
  assert.equal(counts.read,2);
  assert.equal(counts.refresh,2);
  assert.equal(c.understandingShareError,'');
});

test('lost write acknowledgements do not show incorrect consent status',async()=>{
  const {context:c,counts,server}=fixture({failWriteAfter:true});
  await c.flow.setUnderstandingShare('general-02',true,'teen-user',1);
  assert.equal(server.has('general-02'),true);
  assert.equal(c.understandingShares.has('general-02'),true);
  assert.equal(c.understandingShareError,'');
  await c.flow.setUnderstandingShare('general-02',false,'teen-user',1);
  assert.equal(server.has('general-02'),false);
  assert.equal(c.understandingShares.has('general-02'),false);
  assert.equal(c.understandingShareError,'');
  assert.equal(counts.read,2);
});

test('server rejection keeps verified prior choice and shows an actionable error',async()=>{
  const {context:c,counts,server}=fixture({initial:true,failWriteBefore:true});
  await c.flow.setUnderstandingShare('general-02',false,'teen-user',1);
  assert.equal(server.has('general-02'),true);
  assert.equal(c.understandingShares.has('general-02'),true);
  assert.match(c.understandingShareError,/Ändringen kunde inte bekräftas/);
  assert.equal(c.understandingSharesAvailable,true);
  assert.equal(counts.read,1);
});

test('failed post-write verification blocks guesses; retry only reads, never re-sends',async()=>{
  const {context:c,counts,server,change}=fixture({failWriteAfter:true,failRead:true});
  await c.flow.setUnderstandingShare('general-02',true,'teen-user',1);
  assert.equal(server.has('general-02'),true,'Worker saved the private consent choice');
  assert.equal(c.understandingSharesAvailable,false);
  assert.equal(c.understandingShares.has('general-02'),false,'stale local toggle is removed');
  assert.equal(c.sharedUnderstandingRows.length,0,'stale B result is hidden');
  assert.equal(c.insightsRequest,8,'any older in-flight insights response is invalidated');
  assert.equal(c.insightsLoading,false,'blocked request cannot leave a loading spinner');
  assert.match(c.understandingShareError,/går inte att veta om ditt val/);
  assert.equal(counts.invalidate,1);
  const writes=counts.write;
  change({readFails:false,writeAfter:false});
  await c.flow.retryUnderstandingShares('teen-user',1);
  assert.equal(counts.write,writes,'retry must be a read-only action');
  assert.equal(c.understandingSharesAvailable,true);
  assert.equal(c.understandingShares.has('general-02'),true);
  assert.equal(c.understandingShareError,'');
  assert.equal(counts.refresh,1);
});

test('outdated asynchronous acknowledgement after account switch cannot rewrite new account UI',async()=>{
  const {context:c,counts}=fixture();
  c.db.rpc=async()=>{c.user={id:'other'};c.sharedSession=2;return {error:null};};
  await c.flow.setUnderstandingShare('general-02',true,'teen-user',1);
  assert.equal(counts.read,0,'no consent query after session switch');
  assert.equal(c.understandingShares.has('general-02'),false);
  assert.equal(counts.refresh,0);
});
