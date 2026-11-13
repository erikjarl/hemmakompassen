import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const homeFunction=source.match(/function home\(\)\{[\s\S]*?(?=\nconst SCHYSSTA_UUID=)/)?.[0];
assert.ok(homeFunction,'Exercise the actual home view markup');

function homeFor(members){
  const state={
    profile:{display_name:'Provförälder'},members,
    schysstaListEnabled:false,schysstaLoading:false,schysstaError:'',
    activityNotificationsEnabled:false,activityNotificationsError:'',
    familyChatUnreadError:false,familyChatUnread:0,
    card:html=>'<section class="live-card">'+html+'</section>',
    esc:value=>String(value??''),
    nav:[['hem','Hem'],['inkorg','Inkorg'],['swipe','Gillaswajpen'],
      ['personlighet','Min personlighet'],['kommunikation','Kommunikationsråd'],
      ['regler','Schyssta listan'],['medlare','AI-medlaren']],
    HOME_MODULE_INTROS:{inkorg:'Inkorg',swipe:'Gillaswajpen',
      personlighet:'Personlighet',kommunikation:'Kommunikation',
      regler:'Schyssta listan',medlare:'AI-medlaren'}
  };
  vm.runInNewContext(homeFunction+'\nthis.homeView=home;',state);
  return state.homeView();
}

test('NOT-02/UX-04: singleton family invitation appears before the long welcome hero',()=>{
  const html=homeFor([{role:'parent',display_name:'Provförälder'}]);
  const invitation=html.indexOf('<h2>Din familj</h2>');
  const hero=html.indexOf('<section class="home-hero">');
  assert.ok(invitation>=0&&hero>=0,'Both family action and established visual identity must remain');
  assert.ok(invitation<hero,'The next action, handling family invitation, should be above the welcome hero');
  assert.match(html,/href="\.\/konto\.html">Bjud in den andra familjemedlemmen<\/a>/);
  assert.match(html,/href="#swipe">Utforska Gillaswajpen/);
});

test('NOT-02/UX-04: accounts without any family also get the pairing CTA first',()=>{
  const html=homeFor([]);
  assert.ok(html.indexOf('<h2>Din familj</h2>')<html.indexOf('<section class="home-hero">'));
  assert.match(html,/Ingen familj är kopplad ännu/);
  assert.match(html,/Koppla ditt konto till en familj/);
});

test('NOT-02/UX-04: a completed pair keeps the welcome hero first and family summary after',()=>{
  const html=homeFor([{role:'parent',display_name:'Provförälder'},{role:'teen',display_name:'Provtonåring'}]);
  assert.ok(html.indexOf('<section class="home-hero">')<html.indexOf('<h2>Din familj</h2>'));
  assert.match(html,/ERT GEMENSAMMA RUM/);
  assert.match(html,/Provtonåring/);
  assert.doesNotMatch(html,/Den andra familjemedlemmen har ännu inte anslutit/);
});
