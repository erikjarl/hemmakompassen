import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const readFn=source.match(/function mergeFamilyChatPage\([\s\S]*?(?=\nasync function markAllFamilyChatRead\()/)?.[0];
const countFn=source.match(/async function fetchFamilyChatUnread\(\)\{[\s\S]*?(?=\nfunction mergeFamilyChatPage\()/)?.[0];
assert.ok(readFn&&countFn,'Test the production quiet read and unread count functions');

const message=(id,body)=>({message_id:id,body,sent_by_me:false,created_at:'2026-11-03T11:00:00Z',read_at:null});
const sample=message('71000000-0000-4000-8000-000000000001','Hej');

function harness(){
  let remote=[sample],failed=false;
  const counts={render:0,menu:0,read:0,unread:0};
  const state={
    user:{id:'current'},members:[{},{}],sharedSession:5, familyChatRequest:0,inboxPairEpoch:'epoch-1',
    familyChatMessages:[sample],familyChatHasMore:false,familyChatHistoryVerified:true,familyChatError:'',
    familyChatStatus:'',familyChatDraft:'',familyChatLoading:false,familyChatLoadingOlder:false,
    familyChatUnread:1,familyChatUnreadError:false,familyChatCountRequest:0,
    page:()=> 'inkorg',render:()=>counts.render++,menu:()=>counts.menu++,
    validFamilyChatRows:r=>Array.isArray(r),
    fetchFamilyChatUnread:async()=>{counts.unread++;},
    db:{rpc:async name=>{assert.equal(name,'my_family_messages');counts.read++;
      return failed?{data:null,error:{message:'offline'}}:{data:remote,error:null};}},
    setTimeout,clearTimeout,Promise
  };
  vm.runInNewContext(readFn+'\nthis.poll=fetchFamilyChat;',state);
  return {state,counts,setRemote:next=>remote=next,setFailed:val=>failed=val};
}

test('identical quiet reply does not rerender and still refreshes unread metadata',async()=>{
  const h=harness();
  await h.state.poll(false,{quiet:true});
  assert.equal(h.counts.render,0);
  assert.equal(h.counts.menu,0);
  assert.equal(h.counts.unread,1);
});

test('a changed message is rendered once and a failed RPC clears the old snapshot',async()=>{
  const h=harness();
  h.setRemote([message('71000000-0000-4000-8000-000000000002','Nytt'),sample]);
  await h.state.poll(false,{quiet:true});
  assert.equal(h.counts.render,1);
  assert.equal(h.state.familyChatMessages.length,2);
  h.setFailed(true);
  await h.state.poll(false,{quiet:true});
  assert.equal(h.counts.render,2,'A failed RPC must show the error rather than stale messages');
  assert.equal(h.state.familyChatMessages.length,0);
  assert.match(h.state.familyChatError,/inte hämta/);
  assert.equal(h.state.familyChatUnread,0);
  assert.equal(h.state.familyChatUnreadError,true,
    'Unread count must be explicitly unknown when message reload fails');
});

test('quiet checks preserve any existing form status and account boundaries',async()=>{
  const h=harness();
  h.state.familyChatStatus='Försök igen';
  await h.state.poll(false,{quiet:true});
  assert.equal(h.state.familyChatStatus,'Försök igen');
  const before=h.counts.render;
  h.state.user={id:'other'};
  await h.state.poll(false,{quiet:true});
  assert.equal(h.counts.render,before);
});

test('background refresh never races a pending older-page retrieval',async()=>{
  const h=harness();
  h.state.familyChatLoadingOlder=true;
  await h.state.poll(false,{quiet:true});
  assert.equal(h.counts.read,0);
  assert.equal(h.state.familyChatRequest,0);
  h.state.familyChatLoadingOlder=false;
  await h.state.poll(false,{quiet:true});
  assert.equal(h.counts.read,1);
});

test('unchanged unread count never rerenders inbox, change or unavailable state does',async()=>{
  let result={data:1,error:null};
  const h=harness();
  h.state.db.rpc=async name=>{assert.equal(name,'my_family_unread_message_count');return result;};
  vm.runInNewContext(countFn+'\nthis.countUnread=fetchFamilyChatUnread;',h.state);
  await h.state.countUnread();
  assert.equal(h.counts.render,0);
  result={data:2,error:null};
  await h.state.countUnread();
  assert.equal(h.counts.render,1);
  result={data:null,error:{message:'offline'}};
  await h.state.countUnread();
  assert.equal(h.counts.render,2);
  assert.equal(h.state.familyChatUnreadError,true);
});

test('visible 15-second polling uses quiet mode and mobile scroll is preserved on rerender',()=>{
  assert.match(source,/fetchFamilyChat\(false,\{quiet:true\}\)/);
  assert.match(source,/const mainScroll=\(page\(\)==='inkorg'\|\|priorityFocus\|\|focusedSwipeCard\|\|themeFilterFocus\?\.target\|\|focusedPrivateReview\)\s*\?/,
    'Inbox scroll stays preserved while active swipe-card, theme-category and private-review controls retain their position');
  assert.match(source,/main\.scrollTop=Math\.min\(mainScroll/);
});
