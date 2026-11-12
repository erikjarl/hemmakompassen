import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const script=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const start=script.indexOf('function inboxNavUnreadState(){');
const end=script.indexOf('const card=html=>',start);
assert.ok(start>=0&&end>start,'Real navigation source can be tested');

const desktop={
  innerHTML:'',contains:()=>false,querySelector:()=>null
};
const mobile={
  innerHTML:'',scrollLeft:0,contains:()=>false,
  querySelector:()=>null,addEventListener:()=>{}
};
const state={
  user:{id:'parent'},
  members:[{user_id:'parent',role:'parent'},{user_id:'teen',role:'teen'}],
  inboxPairEpoch:'pair-1',
  familyChatUnread:0,familyChatUnreadError:false,
  schysstaListEnabled:true,schysstaLoading:false,schysstaError:'',
  activityNotificationsEnabled:true,
  activityNotificationsLoading:false,activityNotificationsError:'',
  schysstaUnreadCount:()=>0,activityUnreadCount:()=>0,
  schysstaNeedsAnswer:()=>[],
  previousMenuRoute:'inkorg',mobileNavUserBrowsing:true,
  mobileNavEventsInstalled:true,
  nav:[['hem','Hem'],['inkorg','Inkorg'],['regler','Schyssta listan']],
  page:()=> 'inkorg',
  document:{activeElement:null},
  $:id=>id==='live-desktop-nav'?desktop:mobile,
  esc:value=>String(value).replace(/[&<>"']/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char])),
  requestAnimationFrame:fn=>fn()
};
vm.runInNewContext(script.slice(start,end)+';this.showMenu=menu;',state);

function checkBadge(expected,expectedLabel){
  state.showMenu();
  assert.equal(desktop.innerHTML,mobile.innerHTML,
    'Desktop and mobile receive identical navigation HTML');
  const entry=desktop.innerHTML.match(/<a href="#inkorg"[^>]*>.*?<\/a>/)?.[0];
  assert.ok(entry,'Inbox tab must exist');
  if(expected===null){
    assert.doesNotMatch(entry,/live-nav-count/,'Known zero must hide unread badge');
    assert.doesNotMatch(entry,/aria-label=/,'Known zero should not claim unread messages');
  }else{
    assert.ok(entry.includes('>'+expected+'</span>'),
      'Unread badge displays expected symbol');
    assert.ok(entry.includes(expectedLabel),'Accessible label explains read confidence');
  }
}

checkBadge(null);
state.familyChatUnread=2;
checkBadge('2','2 olästa totalt');
state.schysstaLoading=true;
checkBadge('2+','minst 2 olästa');
assert.match(desktop.innerHTML,/okänt antal regelhändelser/,
  'Pending rule category is named unknown');
state.familyChatUnread=0;
checkBadge('?','okänt antal olästa');
state.schysstaLoading=false;state.activityNotificationsError='Serverfel';
checkBadge('?','okänt antal olästa');
state.activityNotificationsError='';
state.user=null;
checkBadge(null);
console.log('PASS: real desktop and mobile menu render known, partial and unknown unread badges');


// FBK-02-04: after an explicit refresh, an unchanged nonempty activity result
// still has to redraw the completed (known) unread state. A previous early
// return left the navigation at '?' following the foreground loading render.
{
  const start=script.indexOf('async function fetchActivityNotifications(');
  const end=script.indexOf('async function markActivityNotificationRead(',start);
  assert.ok(start>=0&&end>start,'Real notification refresh source is available');
  const notices=[{notification_id:'unchanged',read_at:null}];
  const calls={render:0,menu:0};
  let route='inkorg',draft='';
  const env={
    activityNotificationsRequest:0,
    user:{id:'parent'},sharedSession:5,
    activityPairSignature:()=> 'pair-5',
    activityNotificationsEnabled:true,
    members:[{user_id:'parent'},{user_id:'teen'}],
    activityNotifications:notices,
    activityNotificationsError:'',
    activityNotificationsLoading:false,
    activityFeedback:'',
    familyChatDraft:'',
    page:()=>route,
    render:()=>{calls.render++;},
    menu:()=>{calls.menu++;},
    validActivityNotifications:rows=>Array.isArray(rows),
    db:{rpc:async()=>({data:notices,error:null})},
    setTimeout,clearTimeout
  };
  vm.runInNewContext(script.slice(start,end)+';this.refresh=fetchActivityNotifications;',env);
  await env.refresh({quiet:false});
  assert.equal(env.activityNotificationsLoading,false,'Foreground refresh has completed');
  assert.equal(calls.render,0,
    'Existing notices do not flash an unknown badge for an unchanged foreground refresh');
  await env.refresh({quiet:false,forceRender:true});
  assert.equal(calls.render,2,
    'An explicit refresh shows progress and then restores the known unchanged count');
  calls.render=0;calls.menu=0;
  route='hem';
  await env.refresh({quiet:false});
  assert.equal(calls.render,1,'Home badge settles after unchanged activity result');
  calls.render=0;calls.menu=0;
  route='inkorg';
  await env.refresh({quiet:true});
  assert.equal(calls.render,0,'Quiet background refresh does not disturb chat focus');
  assert.equal(calls.menu,0,'Quiet background refresh does not redraw navigation');
  calls.render=0;calls.menu=0;
  env.familyChatDraft='Ett oskickat utkast';
  await env.refresh({quiet:false});
  assert.equal(calls.render,0,'Foreground refresh preserves an unsent message draft');
  assert.equal(calls.menu,0,'An unchanged result leaves the draft and known badge untouched');
}
console.log('PASS: unchanged activity notifications clear transient unknown badge without disturbing drafts');
