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
    assert.match(entry,new RegExp('<span class="live-nav-count"[^>]*>'+expected.replace('+','\\+')+'</span>'),
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
