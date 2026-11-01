import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {IPIP50_V1} from '../personality/ipip50-v1.js';
import {createPersonalityExperience} from '../personality/ipip50-ui.js';

const itemIds=IPIP50_V1.items.map(item=>item.id);
function fakeClient(initial=new Map()){
  const values=new Map(initial),writes=[];
  let user={id:'teen-id'},shared=false,partner=null;
  const db={
    auth:{async getUser(){return {data:{user},error:null};}},
    from(name){
      if(name==='personality_answers')return {
        select(){return {eq(){return {async eq(){return {data:[...values].map(([id,value])=>({question_id:id,answer:{value}})),error:null};}}}};},
        async upsert(row,options){assert.equal(row.user_id,user.id);writes.push({row,options});values.set(row.question_id,row.answer.value);return {error:null};}
      };
      if(name==='personality_share_preferences')return {
        select(){return {eq(){return {eq(){return {async maybeSingle(){return {data:shared?{share_enabled:true}:null,error:null};}}}}}};}
      };
      throw Error('Unexpected table '+name);
    },
    async rpc(name,args){
      if(name==='set_my_ipip50_share'){shared=args.p_share;return {data:shared,error:null};}
      if(name==='my_ipip50_shared_profiles')return {data:partner,error:null};
      throw Error(name);
    }
  };
  return {db,values,writes,setUser:u=>user=u,setPartner:p=>partner=p};
}
const btn=action=>({closest:selector=>selector==='[data-pf-action]'?{dataset:{pfAction:action}}:null});
const radio=(id,val)=>({matches:sel=>sel==='input[data-pf-answer]',dataset:{pfAnswer:id},value:String(val)});

test('real translated 50-item form advances only after a successful private save',async()=>{
  const mock=fakeClient();
  let renders=0;
  const ui=createPersonalityExperience({db:mock.db,onRender:()=>renders++});
  ui.reset('teen-id');await ui.load('teen-id');
  assert.match(ui.render(),/50 påståenden/);
  await ui.handleClick(btn('start'));
  assert.ok(ui.render().includes(IPIP50_V1.items[0].sv));
  assert.match(ui.render(),/Fråga 1 av 50/);
  const saving=ui.handleChange(radio('ipip50-001',4));
  const during=ui.render();
  assert.match(during,/class="pf-option is-selected"/,'Selected answer gets an immediate visible state');
  assert.match(during,/Valt alternativ: Stämmer ganska bra/);
  assert.match(during,/Fråga 1 av 50/,'Answer stays visible while saving');
  await saving;
  assert.equal(mock.writes.length,1);
  assert.deepEqual(mock.writes[0].row.answer,{value:4});
  assert.match(ui.render(),/Fråga 2 av 50/);
  assert.ok(renders>0);
  await ui.handleClick(btn('overview'));
  assert.match(ui.render(),/1 av 50/);
  assert.doesNotMatch(ui.render(),/Skalpoäng från 10 till 50/);
});

test('answers resume at the first unanswered item after session reset',async()=>{
  const mock=fakeClient(new Map([['ipip50-001',5],['ipip50-002',2]]));
  const ui=createPersonalityExperience({db:mock.db,onRender:()=>{}});
  ui.reset('teen-id');await ui.load('teen-id');
  await ui.handleClick(btn('start'));
  assert.match(ui.render(),/Fråga 3 av 50/);
  ui.reset('teen-id');await ui.load('teen-id');
  await ui.handleClick(btn('start'));
  assert.match(ui.render(),/Fråga 3 av 50/);
});

test('50 answers show individual normal-model percentile bars and accessible table, no partner or consent',async()=>{
  const mock=fakeClient(new Map(itemIds.map(id=>[id,3])));
  const ui=createPersonalityExperience({db:mock.db,onRender:()=>{}});
  ui.reset('teen-id');await ui.load('teen-id');
  const html=ui.render({viewerRole:'teen'});
  assert.match(html,/Din profil/);
  assert.match(html,/class="pf-percentile-chart"/);
  assert.doesNotMatch(html,/class="pf-radar"/);
  assert.match(html,/<table/);
  assert.match(html,/Samvetsgrannhet/);
  assert.match(html,/Vuxna M/);
  assert.match(html,/Vuxna SD/);
  assert.match(html,/class="pf-band-key"/);
  assert.match(html,/style="left:50%"/);
  assert.match(html,/style="left:75%"/);
  assert.match(html,/klassad som|P≈/);
  assert.match(html,/pf-reference-caveat/);
  assert.match(html,/−1 till \+1 SD/);
  assert.match(html,/Mycket under genomsnittet.*amerikanska vuxenurvalets/);
  assert.doesNotMatch(html,/Våra profiler/);
  assert.doesNotMatch(html,/Den andras profil/);
  assert.doesNotMatch(html,/data-pf-action="share"/);
});

test('two consents allow summary comparison and consent withdrawal hides it',async()=>{
  const mock=fakeClient(new Map(itemIds.map(id=>[id,3])));
  const sums=Object.fromEntries(IPIP50_V1.factors.map(f=>[f.id,30]));
  mock.setPartner({instrument_id:IPIP50_V1.id,viewer_role:'teen',profiles:[
    {role:'parent',scores:sums},{role:'teen',scores:sums}
  ]});
  const ui=createPersonalityExperience({db:mock.db,onRender:()=>{},isSharingEnabled:true});
  ui.reset('teen-id');await ui.load('teen-id');
  assert.doesNotMatch(ui.render({isPaired:true,viewerRole:'teen'}),/Våra profiler/);
  await ui.handleClick(btn('share'),{isPaired:true});
  let html=ui.render({isPaired:true,viewerRole:'teen'});
  assert.match(html,/Våra profiler/);
  assert.match(html,/Den andras profil/);
  assert.match(html,/class="pf-score-dot pf-score-other"/);
  assert.match(html,/beräknade under antagande om normalfördelning/);
  assert.match(html,/Den andras resultat jämfört med vuxenreferensen/);
  assert.match(html,/amerikanska vuxenurvalets|amerikanska vuxnas/);
  assert.doesNotMatch(html,/Am the life of the party/);
  await ui.handleClick(btn('withdraw'),{isPaired:true});
  html=ui.render({isPaired:true,viewerRole:'teen'});
  assert.doesNotMatch(html,/Våra profiler/);
});

test('malformed RPC payload is always rejected',async()=>{
  const mock=fakeClient(new Map(itemIds.map(id=>[id,3])));
  mock.setPartner({instrument_id:IPIP50_V1.id,viewer_role:'teen',profiles:[
    {role:'parent',scores:{extraversion:1000}},{role:'teen',scores:{extraversion:22}}
  ]});
  const ui=createPersonalityExperience({db:mock.db,onRender:()=>{},isSharingEnabled:true});
  ui.reset('teen-id');await ui.load('teen-id');
  await ui.handleClick(btn('share'),{isPaired:true});
  assert.doesNotMatch(ui.render({isPaired:true}),/Våra profiler/);
});

test('two-person markers preserve independent x percentages when raw scores match',async()=>{
  const mock=fakeClient(new Map(itemIds.map(id=>[id,3])));
  const sums=Object.fromEntries(IPIP50_V1.factors.map(f=>[f.id,30]));
  mock.setPartner({instrument_id:IPIP50_V1.id,viewer_role:'teen',profiles:[
    {role:'parent',scores:sums},{role:'teen',scores:sums}
  ]});
  const ui=createPersonalityExperience({db:mock.db,onRender:()=>{},isSharingEnabled:true});
  ui.reset('teen-id');await ui.load('teen-id');
  await ui.handleClick(btn('share'),{isPaired:true});
  const html=ui.render({isPaired:true});
  const segments=(html.match(/class="pf-scale-track"/g)||[]).length;
  assert.equal(segments,10,'Both own and comparison have five scale bars');
  assert.match(html,/pf-score-own/);
  assert.match(html,/pf-score-other/);
  assert.match(html,/Normalmodell|normalmodell|normalfördelning/);
  assert.match(html,/50 ligger exakt i mitten och 75 vid tre fjärdedelar/);
});

test('public entry and nested personality modules share a cache-busting release version',async()=>{
  const read=filename=>readFile(new URL('../'+filename,import.meta.url),'utf8');
  const [html,app,personality]=await Promise.all([
    read('index.html'),read('live-app.js'),read('personality/ipip50-ui.js')
  ]);
  const tag=html.match(/<meta name="hk-ui-version" content="([^"]+)">/);
  assert.ok(tag,'Expected explicit app version metadata for cache troubleshooting');
  const version=tag[1];
  assert.match(version,/^[0-9]{8}-percentile-cachefix[0-9]+$/);
  assert.ok(html.includes('./live-app.css?v='+version));
  assert.ok(html.includes('./live-app.js?v='+version));
  assert.ok(app.includes("./personality/ipip50-ui.js?v="+version));
  assert.ok(personality.includes("./ipip50-reference.js?v="+version));
  assert.ok(personality.includes('percentileChart(own,other)'));
  assert.ok(personality.includes('percentileChart(own)'));
});
