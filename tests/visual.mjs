import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import {chromium} from "playwright";
const port=47231;
const base="http://127.0.0.1:"+port+"/";
const output=path.resolve("artifacts");
const server=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1"],{stdio:"ignore"});
let browser;
const errors=[];
const captureRecords=[];
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function waitForServer(){
  for(let i=0;i<50;i++){
    try{const r=await fetch(base);if(r.ok)return;}catch{}
    await sleep(200);
  }
  throw new Error("Local HTTP server did not start");
}
async function checkOverflow(page,label){
  const widths=await page.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth,visual:window.visualViewport?.width}));
  assert.ok(widths.document<=widths.viewport+2,label+": horizontal overflow "+JSON.stringify(widths));
}
async function checkMobileNavigation(page,label){
  const result=await page.evaluate(async()=>{
    const nav=document.querySelector('#live-mobile-nav');
    if(!(nav instanceof HTMLElement))throw new Error('Mobile navigation is missing');
    const links=[...nav.querySelectorAll('a')];
    const failures=[];
    const positions=[];
    for(const link of links){
      link.scrollIntoView({block:'nearest',inline:'center'});
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      const navBox=nav.getBoundingClientRect();
      const linkBox=link.getBoundingClientRect();
      const range=document.createRange();
      range.selectNodeContents(link);
      const textBox=range.getBoundingClientRect();
      const style=getComputedStyle(link);
      const labelText=link.textContent.trim();
      positions.push({label:labelText,left:linkBox.left,right:linkBox.right,textHeight:textBox.height});
      if(linkBox.left<navBox.left-1||linkBox.right>navBox.right+1)failures.push(labelText+' is clipped');
      if(textBox.left<linkBox.left-1||textBox.right>linkBox.right+1)failures.push(labelText+' text exceeds its item');
      if(textBox.height>Number.parseFloat(style.lineHeight)*2+1)failures.push(labelText+' exceeds two text rows');
    }
    links[3]?.focus();
    await new Promise(resolve=>requestAnimationFrame(resolve));
    const focusStyle=links[3]?getComputedStyle(links[3]):null;
    return {
      count:links.length,
      scrollable:nav.scrollWidth>nav.clientWidth,
      focusVisible:!!focusStyle&&focusStyle.outlineStyle!=='none'&&Number.parseFloat(focusStyle.outlineWidth)>=2,
      failures,
      positions
    };
  });
  assert.equal(result.count,8,label+': all navigation items render');
  assert.ok(result.scrollable,label+': navigation remains horizontally scrollable');
  assert.ok(result.focusVisible,label+': keyboard focus is visible');
  assert.deepEqual(result.failures,[],label+': '+JSON.stringify(result.positions));
}
async function capture(page,name){
  // Standardize screenshots, and fail if transient UI obscures the layout.
  await page.evaluate(()=>{
    if(document.activeElement instanceof HTMLElement)document.activeElement.blur();
    window.scrollTo({top:0,behavior:"instant"});
  });
  await page.waitForFunction(()=>!document.querySelector("#toast")?.classList.contains("show"),null,{timeout:8000});
  const overlays=await page.evaluate(()=>{
    const skip=document.querySelector(".skip-link");
    const toast=document.querySelector("#toast");
    const box=skip?.getBoundingClientRect();
    return {skipVisible:!!box&&box.bottom>0,toastVisible:!!toast?.classList.contains("show"),scrollY:window.scrollY};
  });
  assert.ok(!overlays.skipVisible,name+": unfocused skip-link appears onscreen");
  assert.ok(!overlays.toastVisible,name+": transient toast remains visible");
  assert.ok(overlays.scrollY<=1,name+": screenshot is not at top of page");
  await page.screenshot({path:path.join(output,name),fullPage:true,animations:"disabled"});
  captureRecords.push({file:name,viewport:page.viewportSize(),...overlays});
}
async function freshContext(options,{authenticated=false,paired=false,role="parent",unlocked=false,unlockUnavailable=false,priorityUnavailable=false,preansweredGeneral=false,emptySchyssta=false}={}){
  const context=await browser.newContext({...options,locale:"sv-SE",reducedMotion:"reduce"});
  await context.addInitScript(value=>{window.__HK_TEST_USER__=value.user;window.__HK_TEST_PAIRED__=value.paired;window.__HK_TEST_ROLE__=value.role;window.__HK_TEST_UNLOCKED__=value.unlocked;window.__HK_UNLOCK_RPC_UNAVAILABLE__=value.unlockUnavailable;window.__HK_PRIORITY_RPC_UNAVAILABLE__=value.priorityUnavailable;window.__HK_PREANSWERED_GENERAL__=value.preansweredGeneral;window.__HK_SCHYSSTA_EMPTY__=value.emptySchyssta;},{emptySchyssta,preansweredGeneral,user:authenticated?{id:role==="teen"?"10000000-0000-0000-0000-000000000002":"10000000-0000-0000-0000-000000000001",email:"synthetic@example.invalid"}:null,paired,role,unlocked,unlockUnavailable,priorityUnavailable});
  await context.route(base+"backend-config.js",route=>route.fulfill({
    contentType:"application/javascript",
    body:"window.HEMMAKOMPASSEN_BACKEND=Object.freeze({supabaseUrl:'https://synthetic.invalid',supabasePublishableKey:'synthetic',enableSharedPriorities:true,enableSharedPolling:true,enableSharedInsights:true,enableSharedUnderstanding:true,enableSchysstaList:true});"
  }));
  await context.route("https://esm.sh/**",route=>route.fulfill({
    contentType:"application/javascript",
    body:`
      export function createClient(){
        const current=()=>window.__HK_TEST_USER__;
        const answers=new Map(window.__HK_PREANSWERED_GENERAL__?Array.from({length:34},(_,i)=>{const id='general-'+String(i+1).padStart(2,'0');return [id,{deck_id:'general',card_id:id,answer:true}]}):window.__HK_TEST_PAIRED__?[['general-01',{deck_id:'general',card_id:'general-01',answer:true}],['general-02',{deck_id:'general',card_id:'general-02',answer:false}]]:[]);
        const skips=new Map();
        const importance=new Map();
        const understandingShares=new Set(window.__HK_TEST_PAIRED__?['general-02']:[]);
        let schysstaSuggestions=[
          {card_id:'regler-01',body:'Vi knackar innan vi går in i varandras rum.'},
          {card_id:'regler-02',body:'Falsk text som aldrig får visas.'},
          {card_id:'regler-99',body:'Okänd privat uppgift'}
        ];
        let schysstaReplacementLinks=[];
        let schysstaHistory=[];
        let chatMessages=window.__HK_TEST_PAIRED__?[{message_id:'71000000-0000-4000-8000-000000000001',body:'Hej, ska vi prata senare?',sent_by_me:false,created_at:'2026-11-01T10:00:00Z',read_at:null}]:[];
        const chatTokens=new Map();
        let schysstaNotifications=[{notification_id:'40000000-0000-4000-8000-000000000001',agreement_id:'30000000-0000-4000-8000-000000000001',kind:'rule_proposed',body:'Vi pratar om hur vi delar på sysslorna.',read_at:null,created_at:'2026-10-30T12:00:01Z'}];
        let schysstaManualRules=[{agreement_id:'30000000-0000-4000-8000-000000000001',body:'Vi pratar om hur vi delar på sysslorna.',status:'proposed',agreement_version:1,proposed_by_me:false,own_decision:null,parent_decision:null,teen_decision:null,created_at:'2026-10-30T12:00:00Z'}];
        schysstaManualRules.push({agreement_id:'30000000-0000-4000-8000-000000000003',body:'Vi frågar innan vi lånar saker.',status:'accepted',agreement_version:1,proposed_by_me:false,own_decision:true,parent_decision:true,teen_decision:true,created_at:'2026-10-30T12:00:00Z'});
        let schysstaRules=[{agreement_id:'20000000-0000-4000-8000-000000000001',source_card_id:'regler-03',body:'Vi får pausa gräl och bestämmer när vi pratar vidare.',status:'proposed',proposed_by_me:false,own_decision:null,parent_decision:null,teen_decision:true,created_at:'2026-10-30T12:00:00Z'}];
        return {
          auth:{
            async getUser(){return {data:{user:current()},error:current()?null:{name:'AuthSessionMissingError'}}},
            onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},
            async signInWithPassword(){return {error:null}}
          },
          from(table){
            if(table==='profiles')return {select(){return {eq(){return {async maybeSingle(){return {data:current()?{display_name:window.__HK_TEST_ROLE__==='teen'?'Provtonåring':'Provförälder'}:null,error:null}}}}}}};
            if(table==='swipe_answers')return {
              select(){return {async eq(){return {data:[...answers.values()],error:null}}}},
              async upsert(row,options){answers.set(row.card_id,row);window.__HK_SAVED_SWIPE__={row,options};return {error:null}}
            };
            if(table==='swipe_skips')return {select(){return {async eq(){return {data:[...skips.values()],error:null}}}}};
            if(table==='swipe_importance')return {
              select(){return {async eq(){return {data:[...importance.values()],error:null}}}},
              async upsert(row,options){importance.set(row.deck_id+':'+row.card_id,row);window.__HK_SAVED_IMPORTANCE__={row,options};return {error:null}}
            };
            if(table==='understanding_card_shares')return {select(){return {async eq(){return {data:window.__HK_TEST_ROLE__==='teen'?[...understandingShares].map(card_id=>({deck_id:'general',card_id})):[],error:null}}}}};
            throw new Error('Unexpected table '+table);
          },
          async rpc(name,args){
            if(window.__HK_SCHYSSTA_EMPTY__===true&&['shared_schyssta_rule_suggestions','my_schyssta_rules','my_manual_schyssta_rules','my_schyssta_notifications','my_schyssta_replacement_links','my_schyssta_rule_history'].includes(name))return {data:[],error:null};
            if(name==='my_family_members')return {data:current()?(window.__HK_TEST_PAIRED__?[{user_id:'10000000-0000-0000-0000-000000000001',role:'parent',display_name:'Provförälder'},{user_id:'10000000-0000-0000-0000-000000000002',role:'teen',display_name:'Provtonåring'}]:[{user_id:current().id,role:window.__HK_TEST_ROLE__,display_name:window.__HK_TEST_ROLE__==='teen'?'Provtonåring':'Provförälder'}]):[],error:null};
             if(name==='shared_swipe_matches'){
               window.__HK_MATCH_RPC_CALLS__=(window.__HK_MATCH_RPC_CALLS__||0)+1;
               window.__HK_MATCH_RPC_ARGS__=[...(window.__HK_MATCH_RPC_ARGS__||[]),args];
               if(window.__HK_RPC_UNAVAILABLE__)return {data:null,error:{message:'synthetic unavailable'}};
               if(!window.__HK_TEST_PAIRED__)return {data:[],error:null};
               if(Array.isArray(window.__HK_TEST_SHARED_MATCHES__))return {data:window.__HK_TEST_SHARED_MATCHES__,error:null};
               if(args.p_deck_id==='samtal')return {data:[{deck_id:'samtal',card_id:'samtal-01',answer:true},{deck_id:'samtal',card_id:'samtal-02',answer:false},{deck_id:'aktiviteter',card_id:'aktiviteter-01',answer:true},{deck_id:'samtal',card_id:'samtal-999',answer:true}],error:null};
               return {data:[{deck_id:'general',card_id:'general-01',answer:true},{deck_id:'general',card_id:'general-10',answer:true},{deck_id:'general',card_id:'general-02',answer:true},{deck_id:'general',card_id:'general-03',answer:false},{deck_id:'general',card_id:'general-99',answer:true}],error:null};
             }
            if(name==='shared_swipe_priorities'){
              window.__HK_PRIORITY_RPC_CALLS__=(window.__HK_PRIORITY_RPC_CALLS__||0)+1;
              if(window.__HK_PRIORITY_RPC_UNAVAILABLE__)return {data:null,error:{message:'synthetic unavailable'}};
              if(!window.__HK_TEST_PAIRED__)return {data:[],error:null};
              if(args.p_deck_id==='samtal')return {data:[{deck_id:'samtal',card_id:'samtal-01'},{deck_id:'samtal',card_id:'samtal-02'},{deck_id:'aktiviteter',card_id:'aktiviteter-01'}],error:null};
              return {data:[{deck_id:'general',card_id:'general-10'},{deck_id:'general',card_id:'general-02'},{deck_id:'general',card_id:'general-03'},{deck_id:'general',card_id:'general-99'}],error:null};
            }
            if(name==='shared_general_deck_complete'){
              window.__HK_UNLOCK_RPC_CALLS__=(window.__HK_UNLOCK_RPC_CALLS__||0)+1;
              if(window.__HK_UNLOCK_RPC_UNAVAILABLE__)return {data:null,error:{message:'synthetic unavailable'}};
              return {data:!!(window.__HK_TEST_PAIRED__&&window.__HK_TEST_UNLOCKED__),error:null};
            }
            if(name==='set_understanding_card_state'){
              window.__HK_UNDERSTANDING_STATE__={name,args};
              if(args.p_skipped){answers.delete(args.p_card_id);skips.set(args.p_card_id,{deck_id:'general',card_id:args.p_card_id});}
              else {skips.delete(args.p_card_id);answers.set(args.p_card_id,{deck_id:'general',card_id:args.p_card_id,answer:args.p_answer});}
              return {data:null,error:null};
            }
            if(name==='shared_understanding_cards')return {data:[...understandingShares].map(card_id=>({deck_id:'general',card_id})),error:null};
            if(name==='set_understanding_card_share'){
              window.__HK_UNDERSTANDING_SHARE__={name,args};
              if(args.p_share)understandingShares.add(args.p_card_id);else understandingShares.delete(args.p_card_id);
              return {data:null,error:null};
            }
            if(name==='shared_schyssta_rule_suggestions')return {data:window.__HK_TEST_PAIRED__?(window.__HK_SCHYSSTA_CLEAN_RPC__===true?schysstaSuggestions.filter(row=>row.card_id==='regler-01'):schysstaSuggestions):[],error:null};
            if(name==='my_schyssta_rules')return {data:window.__HK_TEST_PAIRED__?schysstaRules:[],error:null};
            if(name==='my_schyssta_rule_history')return {data:window.__HK_TEST_PAIRED__?schysstaHistory:[],error:null};
            if(name==='withdraw_schyssta_rule'){
              window.__HK_WITHDRAW_RULE__={name,args};
              const old=schysstaManualRules.find(row=>row.agreement_id===args.p_agreement_id&&row.status==='accepted');
              if(!old)return {data:null,error:{message:'not accepted'}};
              schysstaManualRules=schysstaManualRules.filter(row=>row.agreement_id!==args.p_agreement_id);
              schysstaHistory.push({agreement_id:old.agreement_id,body:old.body,created_at:old.created_at});
              return {data:null,error:null};
            }
            if(name==='my_schyssta_replacement_links')return {data:window.__HK_TEST_PAIRED__?schysstaReplacementLinks:[],error:null};
            if(name==='propose_schyssta_change'){
              window.__HK_CHANGE_PROPOSE__={name,args};
              if(!window.__HK_TEST_PAIRED__||!schysstaManualRules.some(row=>row.agreement_id===args.p_agreement_id&&row.status==='accepted'))return {data:null,error:{message:'not accepted'}};
              const id='30000000-0000-4000-8000-000000000004';
              schysstaManualRules.push({agreement_id:id,body:args.p_body,status:'proposed',agreement_version:1,proposed_by_me:true,own_decision:null,parent_decision:null,teen_decision:null,created_at:'2026-11-01T10:12:00Z'});
              schysstaReplacementLinks.push({agreement_id:id,replaces_agreement_id:args.p_agreement_id});
              return {data:id,error:null};
            }
            if(name==='my_family_messages'){
              if(!window.__HK_TEST_PAIRED__)return {data:[],error:null};
              let rows=chatMessages.slice().sort((a,b)=>b.created_at.localeCompare(a.created_at)||b.message_id.localeCompare(a.message_id));
              if(args?.p_before_created_at&&args?.p_before_id)rows=rows.filter(row=>
                row.created_at<args.p_before_created_at||(row.created_at===args.p_before_created_at&&row.message_id<args.p_before_id));
              if(window.__HK_BAD_CHAT_RESPONSE__)return {data:[{message_id:'wrong',body:'untrusted',sent_by_me:false,created_at:'?',read_at:null}],error:null};
              return {data:rows.slice(0,50),error:null};
            }
            if(name==='my_family_unread_message_count')
              return {data:window.__HK_TEST_PAIRED__?chatMessages.filter(row=>!row.sent_by_me&&row.read_at===null).length:0,error:null};
            if(name==='mark_family_messages_read'){
              window.__HK_MARK_CHAT_READ__=(window.__HK_MARK_CHAT_READ__||0)+1;
              const unread=chatMessages.filter(row=>!row.sent_by_me&&row.read_at===null).length;
              chatMessages=chatMessages.map(row=>row.sent_by_me?row:{...row,read_at:row.read_at||'2026-11-01T11:00:00Z'});
              return {data:unread,error:null};
            }
            if(name==='send_family_message'){
              window.__HK_CHAT_SEND__={name,args};
              if(!window.__HK_TEST_PAIRED__||!args.p_body?.trim()||!args.p_request_key)return {data:null,error:{message:'invalid message'}};
              const existing=chatTokens.get(args.p_request_key);
              if(existing)return {data:existing.message_id,error:existing.body===args.p_body?null:{message:'request key mismatch'}};
              const id='71000000-0000-4000-8000-'+String(chatTokens.size+2).padStart(12,'0');
              const row={message_id:id,body:args.p_body,sent_by_me:true,created_at:'2026-11-01T12:00:00Z',read_at:null};
              chatTokens.set(args.p_request_key,row);chatMessages.push(row);
              return {data:id,error:null};
            }
            if(name==='my_schyssta_notifications')return {data:window.__HK_TEST_PAIRED__?schysstaNotifications:[],error:null};
            if(name==='mark_schyssta_notification_read'){
              window.__HK_READ_NOTICE__={name,args};
              schysstaNotifications=schysstaNotifications.map(n=>n.notification_id===args.p_notification_id?{...n,read_at:'2026-11-01T10:00:00Z'}:n);
              return {data:null,error:null};
            }
            if(name==='my_manual_schyssta_rules')return {data:window.__HK_TEST_PAIRED__?schysstaManualRules.map(({request_key,...row})=>row):[],error:null};
            if(name==='propose_manual_schyssta_rule'){
              window.__HK_MANUAL_PROPOSE__={name,args};
              if(!window.__HK_TEST_PAIRED__||!args.p_body||!args.p_request_key)return {data:null,error:{message:'invalid manual rule'}};
              const existing=schysstaManualRules.find(row=>row.request_key===args.p_request_key);
              if(existing)return {data:existing.agreement_id,error:null};
              const row={agreement_id:'30000000-0000-4000-8000-000000000002',
                body:args.p_body,status:'proposed',agreement_version:1,proposed_by_me:true,
                own_decision:null,parent_decision:null,teen_decision:null,created_at:'2026-10-30T12:02:00Z'};
              schysstaManualRules.push({...row,request_key:args.p_request_key});
              return {data:row.agreement_id,error:null};
            }
            if(name==='propose_schyssta_rule'){
              window.__HK_SCHYSSTA_PROPOSE__={name,args};
              const body={'regler-01':'Vi knackar innan vi går in i varandras rum.'}[args.p_card_id];
              if(!body)return {data:null,error:{message:'not allowed'}};
              schysstaSuggestions=schysstaSuggestions.filter(row=>row.card_id!==args.p_card_id);
              schysstaRules.push({agreement_id:'20000000-0000-4000-8000-000000000002',source_card_id:args.p_card_id,body,status:'proposed',proposed_by_me:true,own_decision:null,parent_decision:null,teen_decision:null,created_at:'2026-10-30T12:01:00Z'});
              return {data:'20000000-0000-4000-8000-000000000002',error:null};
            }
            if(name==='set_schyssta_rule_decision'){
              window.__HK_SCHYSSTA_DECISION__={name,args};
              schysstaRules=schysstaRules.map(row=>row.agreement_id===args.p_agreement_id?{...row,own_decision:args.p_approved,parent_decision:args.p_approved,status:args.p_approved&&row.teen_decision===true?'accepted':args.p_approved?'proposed':'rejected'}:row);
              return {data:null,error:null};
            }
            if(name==='create_family_invite')return {data:'2030-01-01T12:00:00.000Z',error:null};
            throw new Error('Unexpected RPC '+name);
          }
        };
      }
    `
  }));
  const page=await context.newPage();
  page.on("pageerror",e=>errors.push(e.message));
  // Ignore external font/network warnings; JavaScript exceptions are checked via pageerror.
  await page.goto(base+"#hem",{waitUntil:"load"});
  return {context,page};
}
try{
  await fs.mkdir(output,{recursive:true});
  await waitForServer();
  browser=await chromium.launch({headless:true});
  const login=await freshContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  await login.page.locator("#live-login").waitFor();
  assert.match(await login.page.locator("#live-app").innerText(),/Logga in/i,"First visit must show real sign-in");
  await checkOverflow(login.page,"Mobile sign-in");
  await capture(login.page,"mobile-login.png");
  await login.context.close();
  const m=await freshContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},{authenticated:true});
  await m.page.getByRole("heading",{name:/Hej[ ,]+Provförälder/}).waitFor();
  assert.match(await m.page.locator("#live-app").innerText(),/Din familj/i);
  await checkOverflow(m.page,"Mobile homepage");
  await capture(m.page,"mobile-home.png");
  await checkMobileNavigation(m.page,'390px mobile navigation');
  await m.page.goto(base+"#swipe",{waitUntil:"load"});
  await m.page.getByRole("heading",{name:"Gillaswajpen"}).waitFor();
  assert.match(await m.page.locator("#live-app").innerText(),/sparas privat i ditt konto/i);
   assert.equal(await m.page.evaluate(()=>window.__HK_MATCH_RPC_CALLS__||0),0,'Unpaired member must not request aggregate matches');
  assert.equal(await m.page.evaluate(()=>window.__HK_UNLOCK_RPC_CALLS__||0),0,'Unpaired member must not request theme unlock status');
  assert.match(await m.page.locator("#swipe-card").getAttribute("aria-label"),/Kort 1 av 21/);
  assert.equal(await m.page.locator('#swipe-skip').count(),0,'Parent must never see a teen-only skip control');
  const importance= m.page.locator('[data-importance]');
  assert.ok(await importance.isEnabled(),'Importance is enabled when the private table is available');
  const importanceBox=await importance.boundingBox();
  const cardBox=await m.page.locator('#swipe-card').boundingBox();
  const headingBox=await m.page.locator('#swipe-card h2').boundingBox();
  assert.ok(importanceBox.width>importanceBox.height*4,'Importance range must be horizontal on a 390px mobile screen');
  assert.ok(importanceBox.x>=cardBox.x-2 && importanceBox.x+importanceBox.width<=cardBox.x+cardBox.width+2,'Importance range remains within the card bounds');
  assert.ok(importanceBox.y>=headingBox.y+headingBox.height,'Importance control must be below the heading');
  assert.equal(await importance.getAttribute('aria-valuetext'),'Neutral, inte prioriterad');
  await importance.focus();
  await importance.press('ArrowDown');
  await m.page.waitForFunction(()=>window.__HK_SAVED_IMPORTANCE__?.row.importance===-1);
  assert.equal(await importance.getAttribute('aria-valuetext'),'Mindre viktigt');
  await importance.press('ArrowUp');
  await m.page.waitForFunction(()=>window.__HK_SAVED_IMPORTANCE__?.row.importance===0);
  assert.equal(await importance.getAttribute('aria-valuetext'),'Neutral, inte prioriterad');
  await importance.press('ArrowUp');
  await m.page.waitForFunction(()=>window.__HK_SAVED_IMPORTANCE__?.row.importance===1);
  const savedImportance=await m.page.evaluate(()=>window.__HK_SAVED_IMPORTANCE__);
  assert.equal(savedImportance.row.card_id,'general-01');
  assert.equal(savedImportance.row.deck_id,'general');
  assert.equal(savedImportance.row.user_id,'10000000-0000-0000-0000-000000000001');
  assert.equal(savedImportance.options.onConflict,'user_id,deck_id,card_id');
  assert.equal(await importance.getAttribute('aria-valuetext'),'Mycket viktigt');
  const mobileNav=await m.page.locator('#live-mobile-nav').boundingBox();
  const mobileMain=await m.page.locator('.live-main').boundingBox();
  assert.ok(mobileNav&&mobileMain,'Mobile navigation and content region must be measurable');
  assert.ok(mobileMain.y+mobileMain.height<=mobileNav.y+1,'Mobile navigation must occupy its own layout row, never overlay the scrollable content region');
  const activeNav=await m.page.locator('#live-mobile-nav a[aria-current="page"]').boundingBox();
  assert.ok(activeNav.x>=mobileNav.x&&activeNav.x+activeNav.width<=mobileNav.x+mobileNav.width,'Active mobile navigation label must be fully visible');
  const lastNavLink=m.page.locator('#live-mobile-nav a').last();
  await lastNavLink.scrollIntoViewIfNeeded();
  const lastNavBox=await lastNavLink.boundingBox();
  assert.ok(lastNavBox.x>=mobileNav.x&&lastNavBox.x+lastNavBox.width<=mobileNav.x+mobileNav.width,'The last mobile navigation label must be fully reachable without clipping');
  await m.page.locator('#live-mobile-nav a[aria-current="page"]').scrollIntoViewIfNeeded();
  // Simulate a phone tap on both ends. It must change the value, not swipe the card.
  await importance.scrollIntoViewIfNeeded();
  const tapBox=await importance.boundingBox();
  await m.page.touchscreen.tap(tapBox.x+16,tapBox.y+tapBox.height/2);
  await m.page.waitForFunction(()=>window.__HK_SAVED_IMPORTANCE__?.row.importance===-1);
  await m.page.touchscreen.tap(tapBox.x+tapBox.width-16,tapBox.y+tapBox.height/2);
  await m.page.waitForFunction(()=>window.__HK_SAVED_IMPORTANCE__?.row.importance===1);
  assert.match(await m.page.locator('#swipe-card').getAttribute('aria-label'),/Kort 1 av 21/,'Rating taps must never trigger a swipe');
  await checkOverflow(m.page,"Mobile swipe");
  await capture(m.page,"mobile-swipe-importance.png");
  await m.page.getByRole("button",{name:"Ja"}).click();
  await m.page.locator("#swipe-card[aria-label^='Kort 2 av 21']").waitFor();
  assert.match(await m.page.locator('#swipe-card').innerText(),/Jag tycker det är viktigt att vi har gemensamma aktiviteter/,'Parent skips teen-only understanding cards without corrupting ordinal position');
  const saved=await m.page.evaluate(()=>window.__HK_SAVED_SWIPE__);
  assert.equal(saved.row.user_id,"10000000-0000-0000-0000-000000000001");
  assert.equal(saved.row.deck_id,"general");
  assert.equal(saved.row.card_id,"general-01");
  assert.equal(saved.row.answer,true);
  assert.equal(saved.options.onConflict,"user_id,deck_id,card_id");
  await m.page.getByRole("button",{name:"Ja"}).click();
  await m.page.locator("#swipe-card[aria-label^='Kort 3 av 21']").waitFor();
  assert.match(await m.page.locator('#swipe-card').innerText(),/Jag vill bli bättre på att visa uppskattning och fråga hur den tas emot/,'Parent card uses reviewed adult-responsibility wording');
  assert.doesNotMatch(await m.page.locator('#swipe-card').innerText(),/Jag vill att vi visar uppskattning på sätt som känns bra för båda/,'Parent card does not reuse teen wording');
  await capture(m.page,"mobile-parent-role-card.png");
  await m.page.goto(base+"konto.html",{waitUntil:"load"});
  await m.page.getByRole("heading",{name:"Använd en familjekod"}).waitFor();
  assert.ok(await m.page.locator("#join-family").isVisible(),"A singleton account must be able to enter a family code");
  assert.ok(await m.page.locator("#waiting").isVisible(),"A singleton account must be able to create an invite");
  await m.page.getByRole("button",{name:"Skapa ny inbjudningskod"}).click();
  await m.page.locator("#invite-qr:not(.hidden)").waitFor();
  const qrSource=await m.page.locator("#invite-qr-image").getAttribute("src");
  const inviteHref=await m.page.locator("#invite-link").getAttribute("href");
  assert.match(qrSource,/^data:image\/svg\+xml/,'QR code must be generated locally as an SVG data URL');
  assert.match(inviteHref,/konto\.html#invite=[A-F0-9]{36}$/,'Invitation link must contain the generated code in a URL fragment');
  assert.equal(new URL(inviteHref).origin,new URL(base).origin,'QR invitation must not use an external service');
  await checkOverflow(m.page,"Mobile family pairing");
  await capture(m.page,"mobile-pairing.png");
  await m.page.goto(base+"#hem",{waitUntil:"load"});
  await m.page.locator("#live-mobile-nav a[href='#inkorg']").click();
  await m.page.getByRole("heading",{name:"Inkorg"}).waitFor();
  await checkOverflow(m.page,"Mobile authenticated section");
  await capture(m.page,"mobile-inbox.png");
  await m.context.close();
  const narrow=await freshContext({viewport:{width:320,height:700},deviceScaleFactor:2,isMobile:true,hasTouch:true},{authenticated:true});
  await narrow.page.getByRole("heading",{name:/Hej[ ,]+Provförälder/}).waitFor();
  await checkMobileNavigation(narrow.page,'320px mobile navigation');
  await checkOverflow(narrow.page,'320px mobile homepage');
  await narrow.page.locator('#live-mobile-nav a[href="#kommunikation"]').scrollIntoViewIfNeeded();
  await capture(narrow.page,'mobile-320-navigation.png');
  await narrow.context.close();
  const soloTeen=await freshContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},{authenticated:true,role:'teen'});
  await soloTeen.page.goto(base+'#swipe',{waitUntil:'load'});
  await soloTeen.page.locator("#swipe-card[aria-label^='Kort 1 av 34']").waitFor();
  await soloTeen.page.getByRole('button',{name:'Ja'}).click();
  await soloTeen.page.locator("#swipe-card[aria-label^='Kort 2 av 34']").waitFor();
  assert.match(await soloTeen.page.locator('#swipe-card').innerText(),/Jag vill helst prata färdigt/,'Understanding card is visible to teen');
  assert.match(await soloTeen.page.locator('.swipe-understanding-notice').innerText(),/Delning med förälder är ännu inte aktiverad/,'Teen is not misled about sharing status');
  const beforeSkip=await soloTeen.page.evaluate(()=>window.__HK_SAVED_SWIPE__.row.card_id);
  await soloTeen.page.getByRole('button',{name:'Vill inte svara just nu'}).click();
  await soloTeen.page.locator("#swipe-card[aria-label^='Kort 3 av 34']").waitFor();
  assert.equal(await soloTeen.page.evaluate(()=>window.__HK_SAVED_SWIPE__.row.card_id),beforeSkip,'Skip must not write a yes/no answer');
  assert.deepEqual(await soloTeen.page.evaluate(()=>window.__HK_UNDERSTANDING_STATE__.args),{p_card_id:'general-02',p_answer:null,p_skipped:true},'Skip is persisted through the atomic private-state RPC');
  await checkOverflow(soloTeen.page,'Mobile teen understanding skip');
  await capture(soloTeen.page,'mobile-teen-understanding.png');
  await soloTeen.context.close();
  // Regression: reviewing a fully answered teen deck must NOT finish after skipping B card #2.
  // The synthetic backend preloads all 34 answers, including a historical private B answer.
  const teenReview=await freshContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},{authenticated:true,role:'teen',preansweredGeneral:true});
  await teenReview.page.goto(base+'#swipe',{waitUntil:'load'});
  await teenReview.page.locator('#swipe-restart').waitFor();
  assert.match(await teenReview.page.locator('.swipe-finished').innerText(),/34 svar/,'All answers are loaded before review');
  await teenReview.page.locator('#swipe-restart').click();
  await teenReview.page.locator("#swipe-card[aria-label^='Kort 1 av 34']").waitFor();
  await teenReview.page.getByRole('button',{name:'Ja'}).click();
  await teenReview.page.locator("#swipe-card[aria-label^='Kort 2 av 34']").waitFor();
  const savedBeforeReviewSkip=await teenReview.page.evaluate(()=>window.__HK_SAVED_SWIPE__.row.card_id);
  await teenReview.page.getByRole('button',{name:'Vill inte svara just nu'}).click();
  await teenReview.page.locator("#swipe-card[aria-label^='Kort 3 av 34']").waitFor();
  assert.equal(await teenReview.page.locator('.swipe-finished').count(),0,'Skipping during review must not end a previously answered deck');
  assert.equal(await teenReview.page.evaluate(()=>window.__HK_SAVED_SWIPE__.row.card_id),savedBeforeReviewSkip,'Review skip must not create a replacement yes/no upsert');
  assert.deepEqual(await teenReview.page.evaluate(()=>window.__HK_UNDERSTANDING_STATE__.args),{p_card_id:'general-02',p_answer:null,p_skipped:true},'Review skip atomically revokes the old B answer');
  await checkOverflow(teenReview.page,'Mobile teen review after understanding skip');
  await capture(teenReview.page,'mobile-teen-review-after-skip.png');
  await teenReview.context.close();
  const paired=await freshContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},{authenticated:true,paired:true});
  await paired.page.goto(base+"#swipe",{waitUntil:"load"});
  await paired.page.getByRole("heading",{name:"Era gemensamma svar"}).waitFor();
  await paired.page.getByRole("heading",{name:"Det ni båda svarat ja till"}).waitFor();
  await paired.page.locator(".swipe-match-group h4").filter({hasText:"Relationer"}).waitFor();
  assert.equal(await paired.page.locator(".swipe-match-list li").count(),2,"Only catalogued mutual YES cards appear; malicious RPC NO, B and unknown cards are discarded");
  const sharedText=await paired.page.locator(".swipe-results").innerText();
  assert.match(sharedText,/Jag uppskattar när vi gör saker tillsammans utan mobiltelefoner/,"The mutual YES is displayed");
  assert.match(sharedText,/Jag vill bli bättre på att visa uppskattning och fråga hur den tas emot/,"Parent result and summary use the reviewed parent wording");
  assert.doesNotMatch(sharedText,/Jag vill att vi visar uppskattning på sätt som känns bra för båda/,"Parent result does not leak the teen role wording");
  assert.match(sharedText,/REDAKTIONELLA RÅD · INTE AI/,"The editorial advice is clearly labelled");
  assert.match(sharedText,/Gemensamma möjligheter – förälder/,"The parent sees parent-specific wording");
  assert.match(await paired.page.locator('.swipe-summary-details').textContent(),/Fråga gärna tonåringen vad hen vill börja med/,"The expanded parent prompt is derived from mutual YES only");
  assert.match(sharedText,/Bestäm en kort stund då mobilerna får vila/,"The matched A card renders its own reviewed editorial advice");
  assert.match(sharedText,/Viktigast att fokusera på/,"Server-verified teen-high mutual A card gets the separate priority heading");
  assert.match(sharedText,/tonåringen har markerat detta som särskilt viktigt/,"Parent sees teen-first priority wording");
  assert.equal(await paired.page.locator(".swipe-priority-theme").count(),1,"B, NO and unknown priority rows cannot create priority content");
  assert.ok((await paired.page.evaluate(()=>window.__HK_PRIORITY_RPC_CALLS__))>0,"Paired account requests the gated priority aggregate");
  assert.doesNotMatch(sharedText,/Jag vill helst prata färdigt innan någon kommer med råd/,"The mutual NO is never displayed");
  assert.doesNotMatch(sharedText,/Det ni båda svarat nej till|Två nej/,"No mutual NO headings or counts");
  assert.ok((await paired.page.evaluate(()=>window.__HK_MATCH_RPC_CALLS__))>0,"Paired account requests the aggregate RPC");
  // Simulate a second account changing the server's aggregate result while this
  // client's tab remains open. The client must refresh without reading private answers.
  await paired.page.evaluate(()=>{
    window.__HK_TEST_SHARED_MATCHES__=[
      {deck_id:'general',card_id:'general-01',answer:true},
      {deck_id:'general',card_id:'general-02',answer:true},
      {deck_id:'general',card_id:'general-03',answer:false}
    ];
    window.dispatchEvent(new Event('focus'));
  });
  await paired.page.waitForFunction(()=>document.querySelectorAll('.swipe-match-list li').length===1);
  assert.doesNotMatch(await paired.page.locator('.swipe-results').innerText(),/Jag vill helst prata färdigt innan någon kommer med råd/,'Automatic refresh must not expose B or NO');
  await paired.page.locator('.swipe-results').scrollIntoViewIfNeeded();
  await capture(paired.page,'mobile-auto-shared-match.png');
  await paired.page.evaluate(()=>{window.__HK_TEST_SHARED_MATCHES__=[];window.dispatchEvent(new Event('focus'));});
  await paired.page.waitForFunction(()=>document.querySelector('.swipe-results')?.textContent?.includes('Inga gemensamma ja-svar'));
  assert.equal(await paired.page.locator('.swipe-match-list li').count(),0,'Automatic refresh must remove a revoked match');
  await paired.page.locator('.swipe-results').scrollIntoViewIfNeeded();
  await capture(paired.page,'mobile-auto-revoked-match.png');
  await paired.page.evaluate(()=>{delete window.__HK_TEST_SHARED_MATCHES__;window.dispatchEvent(new Event('focus'));});
  await paired.page.waitForFunction(()=>document.querySelectorAll('.swipe-match-list li').length===2);

  // All-deck insights use seven independent, server-verified A-only RPC reads.
  // The mock includes historical B YES, mutual NO, unknown and wrong-deck rows.
  await paired.page.locator('a[href="#insikter"]').click();
  await paired.page.getByRole('heading',{name:'Möjligt att utforska'}).waitFor();
  assert.ok((await paired.page.locator('.live-main').evaluate(el=>el.scrollTop))<=1,'Insights navigation resets the mobile content scroller to its heading');
  await paired.page.locator('.insights-deck').first().waitFor();
  assert.equal(await paired.page.locator('.insights-deck').count(),2,'Only decks with permitted A JA+JA appear');
  assert.equal(await paired.page.locator('.insights-deck .swipe-match-list li').count(),3,'Two general and one conversation A match, no other rows');
  const insightText=await paired.page.locator('.insights-view').innerText();
  assert.match(insightText,/Så här funkar min tonåring/,'B section is clearly separate');
  assert.match(insightText,/Tonåringen vill få prata färdigt innan du kommer med råd/,'Parent sees only the reviewed role-specific text from explicit B consent');
  assert.doesNotMatch(insightText,/Jag vill helst prata färdigt innan någon kommer med råd/,'Parent never receives the teen-private wording');
  assert.doesNotMatch(insightText,/Jag känner mig lyssnad på när vi är oense/,'A NO cannot leak');
  await checkOverflow(paired.page,'Mobile all-deck insights');
  await capture(paired.page,'mobile-shared-insights.png');
  await paired.page.locator('.live-main').evaluate(el=>{el.scrollTop=el.scrollHeight;});
  await capture(paired.page,'mobile-shared-insights-bottom.png');
  await paired.page.evaluate(()=>{window.__HK_RPC_UNAVAILABLE__=true;});
  await paired.page.locator('#insights-retry').click();
  await paired.page.getByRole('alert').waitFor();
  assert.equal(await paired.page.locator('.insights-deck').count(),0,'One failed deck RPC clears all previous shared insights');
  await paired.page.evaluate(()=>{window.__HK_RPC_UNAVAILABLE__=false;});
  await paired.page.locator('#insights-retry').click();
  await paired.page.locator('.insights-deck').first().waitFor();
  await paired.page.locator('[data-insight-open="samtal"]').click();
  await paired.page.locator("#swipe-card[aria-label^='Temakort 1 av 104']").waitFor();
  await paired.page.locator('#theme-back').click();
  await paired.page.getByRole('heading',{name:'Era gemensamma svar'}).waitFor();

  const teenInsights=await freshContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},{authenticated:true,paired:true,role:'teen',unlocked:true,preansweredGeneral:true});
  await teenInsights.page.evaluate(()=>{location.hash='insikter';});
  await teenInsights.page.getByRole('heading',{name:'Du bestämmer vad som delas'}).waitFor();
  const activeShare=teenInsights.page.locator('[data-understanding-share="general-02"]');
  assert.equal(await activeShare.getAttribute('aria-pressed'),'true','Teen sees their own current explicit consent');
  assert.match(await activeShare.innerText(),/Återkalla delning/,'Revocation is directly available');
  await activeShare.click();
  await teenInsights.page.waitForFunction(()=>window.__HK_UNDERSTANDING_SHARE__?.args?.p_share===false);
  await teenInsights.page.waitForFunction(()=>document.querySelector('[data-understanding-share="general-02"]')?.getAttribute('aria-pressed')==='false');
  assert.match(await teenInsights.page.locator('.insights-view').innerText(),/Inga förståelsekort är aktivt delade/,'Revocation immediately removes the shared B message');
  assert.match(await activeShare.innerText(),/Dela med min förälder/,'Teen can actively consent again after revocation');
  await checkOverflow(teenInsights.page,'Mobile teen B consent and revocation');
  await capture(teenInsights.page,'mobile-teen-understanding-consent.png');

  assert.equal(await paired.page.locator(".swipe-themes details").count(),6,"A paired family can explore all six theme decks without completing general cards");
  assert.equal(await paired.page.evaluate(()=>window.__HK_UNLOCK_RPC_CALLS__||0),0,"Theme access never requests the obsolete completion RPC");
  // Partial completion is sufficient: the paired parent has only a few saved
  // general answers but may already explore a theme and see only mutual YES.
  await paired.page.locator('[data-theme-open="samtal"]').click();
  await paired.page.locator("#swipe-card[aria-label^='Temakort 1 av 104']").waitFor();
  await paired.page.locator(".swipe-match-list li").first().waitFor();
  assert.equal(await paired.page.locator(".swipe-match-list li").count(),1,"An unfinished theme shows only its verified mutual YES, not NO or other-deck answers");
  await paired.page.locator("#theme-back").click();
  await paired.page.locator(".swipe-match-list li").first().waitFor();
  assert.ok((await paired.page.locator('.swipe-summary-overview li').count())>=1,'Authorized A advice renders a compact icon overview');
  assert.equal(await paired.page.locator('.swipe-summary-overview svg[aria-hidden="true"]').count(),await paired.page.locator('.swipe-summary-overview li').count(),'Every overview topic has one decorative SVG and a text heading');
  const hiddenIconLabel=paired.page.locator('.swipe-summary-icon-label').first();
  assert.deepEqual(await hiddenIconLabel.evaluate(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})),{width:1,height:1},'The assistive icon label must not create a visible duplicate text row');
  const summaryDetails=paired.page.locator('.swipe-summary-details');
  await paired.page.keyboard.press('Tab');
  await summaryDetails.locator('summary').focus();
  assert.ok(await summaryDetails.locator('summary').evaluate(el=>getComputedStyle(el).outlineStyle!=='none'),'The expandable detail control has visible keyboard focus');
  await summaryDetails.locator('summary').press('Enter');
  assert.ok(await summaryDetails.evaluate(el=>el.open),'Keyboard can expand the full card-specific advice');
  assert.doesNotMatch(await summaryDetails.innerText(),/Jag vill helst prata färdigt innan någon kommer med råd/,'Expanded advice still excludes B and NO rows');
  await checkOverflow(paired.page,"Mobile matched swipes");
  await paired.page.locator('.swipe-results').scrollIntoViewIfNeeded();
  await capture(paired.page,"mobile-shared-swipes.png");
  await paired.page.locator('#live-mobile-nav a[href="#regler"]').click();
  // The initial synthetic server response deliberately includes a known card
  // with forged text and a completely unknown card. Never display even its
  // valid rows as a partial result; recover only after a clean RPC retry.
  await paired.page.getByRole('heading',{name:'Kunde inte visa listan'}).waitFor();
  assert.equal(await paired.page.locator('.schyssta-list li').count(),0,'A malformed RPC snapshot cannot display a partial list');
  assert.doesNotMatch(await paired.page.locator('.live-main').innerText(),/Falsk text|Okänd privat uppgift/,'Unexpected server rows are never rendered');
  await paired.page.evaluate(()=>{window.__HK_SCHYSSTA_CLEAN_RPC__=true;});
  await paired.page.locator('#schyssta-retry').click();
  await paired.page.getByRole('heading',{name:'Gemensamma förslag'}).waitFor();
  const schysstaText=await paired.page.locator('.schyssta-view').innerText();
  assert.match(schysstaText,/Vi knackar innan vi går in i varandras rum/,'One allowlisted server suggestion is visible');
  assert.match(schysstaText,/Vi får pausa gräl/,'Existing family proposal is visible');
  assert.doesNotMatch(schysstaText,/Falsk text|Okänd privat uppgift/,'Malformed and unknown server rows fail closed');
  assert.match(schysstaText,/Ett förslag är inte ett godkännande/,'Proposal and approval remain visibly separate');
  await paired.page.getByRole('button',{name:'Föreslå',exact:true}).click();
  await paired.page.waitForFunction(()=>window.__HK_SCHYSSTA_PROPOSE__?.args?.p_card_id==='regler-01');
  assert.deepEqual(await paired.page.evaluate(()=>window.__HK_SCHYSSTA_PROPOSE__.args),{p_card_id:'regler-01'},'Proposal sends only the allowlisted card id');
  const newProposal=paired.page.locator('.schyssta-list li').filter({hasText:'Vi knackar innan vi går in i varandras rum'});
  assert.match(await newProposal.innerText(),/Ditt val: inte lämnat/,'Creating a proposal never records implicit approval');
  await newProposal.getByRole('button',{name:'Jag godkänner'}).click();
  await paired.page.waitForFunction(()=>window.__HK_SCHYSSTA_DECISION__?.args?.p_approved===true);
  assert.deepEqual(await paired.page.evaluate(()=>window.__HK_SCHYSSTA_DECISION__.args),{p_agreement_id:'20000000-0000-4000-8000-000000000002',p_approved:true},'Decision is a separate explicit RPC');
  // A test parent can compose and submit a manual rule without auto-approval.
  const schysstaSections=await paired.page.locator('.schyssta-view h2').allTextContents();
  assert.ok(schysstaSections.findIndex(t=>t.startsWith('Behöver ditt svar'))<
    schysstaSections.findIndex(t=>t==='Skriv ett eget förslag'),'Incoming requests are above compose');
  assert.equal(await paired.page.locator('#schyssta-rule-30000000-0000-4000-8000-000000000003 [data-schyssta-decision]').count(),0,
    'An accepted rule does not offer misleading approval or rejection buttons');
  const review=paired.page.locator('#schyssta-rule-30000000-0000-4000-8000-000000000003 .schyssta-review');
  assert.equal(await review.count(),1,'Agreed rules have an optional discussion guide');
  await review.locator('summary').click();
  assert.match(await review.innerText(),/Vad har fungerat bra för oss/,'Guide uses open questions, not compliance points');
  await paired.page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{
    writeText:async text=>{window.__HK_COPIED_RULES__=text;}
  }}));
  await paired.page.getByRole('button',{name:'Kopiera aktuella regler'}).click();
  await paired.page.waitForFunction(()=>typeof window.__HK_COPIED_RULES__==='string');
  const exported=await paired.page.evaluate(()=>window.__HK_COPIED_RULES__);
  assert.match(exported,/Vi frågar innan vi lånar saker/,'Copy includes accepted rules');
  assert.doesNotMatch(exported,/Vi får pausa gräl|Vi pratar om hur vi delar på sysslorna/,'Copy excludes proposals without two approvals');
  assert.equal(await paired.page.getByRole('button',{name:'Uppdatera listan'}).count(),1,
    'A paired test user can explicitly reload the list');
  assert.equal(await paired.page.locator('#live-mobile-nav a[href="#inkorg"] .live-nav-count').innerText(),'1','Inbox has unobtrusive unread count');
  assert.equal(await paired.page.locator('#live-mobile-nav a[href="#regler"] .live-nav-count').innerText(),'2','Rule tab shows only requests awaiting the current viewer');
  assert.match(await paired.page.locator('#live-mobile-nav a[href="#regler"]').getAttribute('aria-label'),/2 obesvarade regelförslag/,'Navigation text announces the meaning of the count');
  // Search and status filters never hide incoming requests requiring the user's answer.
  const search=paired.page.locator('#schyssta-search');
  await search.fill('LÅNAR');
  assert.equal(await paired.page.locator('[data-schyssta-filter-group="approved"] .schyssta-list>li:visible').count(),1,
    'Accent/case-aware local search includes the accepted rule');
  assert.equal(await paired.page.locator('[data-schyssta-filter-group="ongoing"] .schyssta-list>li:visible').count(),0,
    'Search hides unrelated ongoing proposals without altering server results');
  assert.equal(await paired.page.locator('#schyssta-rule-30000000-0000-4000-8000-000000000001').isVisible(),true,
    'Incoming action cards stay visible while the rules are filtered');
  assert.match(await paired.page.locator('#schyssta-filter-summary').innerText(),/Visar 1 av/,'Search announces visible result count');
  await search.fill('ord-som-inte-finns');
  assert.equal(await paired.page.locator('.schyssta-no-results:visible').count(),2,'No-match feedback is visible without fabricated rows');
  await search.fill('');
  await paired.page.locator('#schyssta-status-filter').selectOption('approved');
  assert.equal(await paired.page.locator('[data-schyssta-filter-group="ongoing"]').isVisible(),false,'Status filter hides ongoing proposals');
  assert.equal(await paired.page.locator('[data-schyssta-filter-group="approved"]').isVisible(),true,'Status filter retains agreed rules');
  await paired.page.locator('#schyssta-status-filter').selectOption('all');
  assert.equal(await paired.page.locator('[data-schyssta-filter-group="ongoing"]').isVisible(),true,'All-status restores the ongoing section');
  // "Inte nu" is a session-only postponement, not a saved rejection.
  await paired.page.locator('[data-schyssta-pause="30000000-0000-4000-8000-000000000001"]').click();
  assert.equal(await paired.page.locator('#schyssta-rule-30000000-0000-4000-8000-000000000001').isVisible(),true,
    'Paused request remains accessible under ongoing proposals');
  assert.equal(await paired.page.locator('#live-mobile-nav a[href="#regler"] .live-nav-count').innerText(),'1',
    'Pausing a request decreases only the local pending-action count');
  assert.equal(await paired.page.evaluate(()=>window.__HK_SCHYSSTA_DECISION__?.args?.p_agreement_id==='30000000-0000-4000-8000-000000000001'),false,
    'Pausing does not send any approval or rejection decision');
  assert.match(await paired.page.locator('.schyssta-view').innerText(),/Inget beslut har sparats/);
  await paired.page.locator('[data-schyssta-resume="30000000-0000-4000-8000-000000000001"]').click();
  assert.equal(await paired.page.locator('#live-mobile-nav a[href="#regler"] .live-nav-count').innerText(),'2',
    'A deferred proposal can be returned to the actionable list without any backend change');
  await paired.page.getByRole('button',{name:'+ Föreslå en regel'}).click();
  const prompts=paired.page.locator('.schyssta-tips');
  assert.equal(await prompts.count(),1,'Composing a rule offers optional, collapsed conversation prompts');
  assert.equal(await prompts.locator('summary').innerText(),'Tips för en tydlig och rättvis överenskommelse');
  await prompts.locator('summary').click();
  assert.match(await prompts.innerText(),/Vuxnas ansvar för trygghet och omsorg/, 'Prompts retain parent responsibility');
  assert.equal(await prompts.getByRole('link',{name:'Öppna kommunikationsråden'}).count(),1,
    'Parent can open conversation support without requiring teen compliance');
  await paired.page.locator('#schyssta-body').fill('Vi planerar veckans sysslor på söndag.');
  assert.equal(await paired.page.locator('#schyssta-preview-text').innerText(),'Vi planerar veckans sysslor på söndag.','Live preview uses the typed text');
  assert.match(await paired.page.locator('.schyssta-preview').innerText(),/Från: Provförälder/,'Preview identifies the current author');
  assert.match(await paired.page.locator('#schyssta-length').innerText(),/ av 500 tecken/,'Visible length counter updates');
  await paired.page.getByRole('button',{name:'Skicka regelförslag'}).click();
  await paired.page.waitForFunction(()=>window.__HK_MANUAL_PROPOSE__?.args?.p_body==='Vi planerar veckans sysslor på söndag.');
  const manualRequest=await paired.page.evaluate(()=>window.__HK_MANUAL_PROPOSE__.args);
  assert.match(manualRequest.p_request_key,/^[0-9a-f-]{36}$/i,'Manual proposals send an idempotency token');
  const manualRule=paired.page.locator('.schyssta-list li').filter({hasText:'Vi planerar veckans sysslor på söndag.'});
  await manualRule.waitFor();
  assert.match(await manualRule.innerText(),/Väntar på bådas beslut/,'Manual proposal remains pending');
  assert.match(await manualRule.innerText(),/Ditt val: inte lämnat/,'Submitting never approves own manual proposal');
  await paired.page.getByRole('button',{name:'Föreslå ändring'}).first().click();
  assert.equal(await paired.page.locator('#schyssta-body').inputValue(),'Vi frågar innan vi lånar saker.','Approved text is copied to change editor');
  await paired.page.locator('#schyssta-body').fill('Vi frågar varandra innan vi lånar något.');
  await paired.page.getByRole('button',{name:'Skicka ändringsförslag'}).click();
  await paired.page.waitForFunction(()=>window.__HK_CHANGE_PROPOSE__?.args?.p_body==='Vi frågar varandra innan vi lånar något.');
  assert.deepEqual(await paired.page.evaluate(()=>Object.keys(window.__HK_CHANGE_PROPOSE__.args).sort()),['p_agreement_id','p_body','p_request_key'],'Only approved source and changed text sent');
  assert.match(await paired.page.locator('.schyssta-view').innerText(),/Den tidigare överenskommelsen gäller tills ni båda har godkänt/,'Previous rule stays current until new agreement');
  await paired.page.getByRole('button',{name:'Avsluta överenskommelsen'}).first().click();
  assert.match(await paired.page.locator('.schyssta-confirm').innerText(),/Om du avslutar gäller regeln inte längre/,'Ending is a two-step action');
  await paired.page.getByRole('button',{name:'Ja, avsluta'}).click();
  await paired.page.waitForFunction(()=>window.__HK_WITHDRAW_RULE__?.args?.p_agreement_id==='30000000-0000-4000-8000-000000000003');
  await paired.page.locator('.schyssta-history summary').click();
  assert.match(await paired.page.locator('.schyssta-history').innerText(),/Vi frågar innan vi lånar saker/,'Withdrawn rule remains in accessible history');
  await paired.page.goto(base+'#inkorg',{waitUntil:'load'});
  await paired.page.getByRole('heading',{name:'Inkorg',exact:true}).waitFor();
  await paired.page.getByRole('heading',{name:'Privata meddelanden med Provtonåring'}).waitFor();
  await paired.page.locator('.family-chat-bubble').filter({hasText:'Hej, ska vi prata senare?'}).waitFor();
  assert.equal(await paired.page.locator('.family-chat-bubble.family-chat-theirs').count(),1,
    'Received chat message is rendered as coming from counterpart');
  await paired.page.waitForFunction(()=>window.__HK_MARK_CHAT_READ__>0);
  await paired.page.locator('#family-chat-body').fill('Hej tillbaka! Vi kan prata efter maten.');
  await paired.page.getByRole('button',{name:'Skicka meddelande'}).click();
  await paired.page.waitForFunction(()=>window.__HK_CHAT_SEND__?.args?.p_body==='Hej tillbaka! Vi kan prata efter maten.');
  assert.match(await paired.page.locator('.family-chat-mine').innerText(),/Hej tillbaka/,'Sent message appears in conversation');
  assert.match(await paired.page.locator('.family-chat-mine .family-chat-receipt').innerText(),/Skickat/,'Read receipt distinguishes sent from read');
  assert.equal(await paired.page.locator('#family-chat-body').inputValue(),'','Successful send clears composer');
  await paired.page.locator('#family-chat-body').fill('<img src=x onerror=alert(1)>');
  await paired.page.getByRole('button',{name:'Skicka meddelande'}).click();
  await paired.page.locator('.family-chat-mine').filter({hasText:'<img src=x onerror=alert(1)>'}).waitFor();
  assert.equal(await paired.page.locator('.family-chat-text img').count(),0,'Message content never runs HTML');
  const inboxText=await paired.page.locator('#live-app').innerText();
  assert.match(inboxText,/Vi pratar om hur vi delar på sysslorna/,'Inbox shows other member pending manual request');
  assert.doesNotMatch(inboxText,/Vi planerar veckans sysslor på söndag/,'Inbox does not present sender own proposal as incoming');
  assert.match(inboxText,/Meddelanden · 1 olästa/,'Server inbox shows persisted unread count');
  assert.equal(await paired.page.locator('.schyssta-unread time[datetime]').count(),1,'Notifications display a timestamp from the server');
  assert.match(await paired.page.locator('.schyssta-unread').innerText(),/Från: Provtonåring/,'Inbox identifies only the authorized counterpart');
  // The home screen surfaces the latest personal inbox alert ahead of general family information.
  await paired.page.goto(base+'#hem',{waitUntil:'load'});
  await paired.page.getByRole('heading',{name:'Inkorgen · 1 olästa'}).waitFor();
  const homeSections=await paired.page.locator('#live-app h2').allTextContents();
  assert.ok(homeSections.findIndex(t=>t.startsWith('Inkorgen'))<homeSections.indexOf('Din familj'),
    'Personal inbox alerts are placed above the family overview');
  await paired.page.getByRole('link',{name:'Visa inkorgen'}).click();
  await paired.page.getByRole('heading',{name:'Inkorg',exact:true}).waitFor();
  await paired.page.getByRole('button',{name:'Markera som läst'}).click();
  await paired.page.waitForFunction(()=>window.__HK_READ_NOTICE__?.args?.p_notification_id==='40000000-0000-4000-8000-000000000001');
  await paired.page.waitForFunction(()=>document.querySelector('#live-app')?.textContent?.includes('Meddelanden'));
  assert.equal(await paired.page.getByRole('button',{name:'Markera som läst'}).count(),0,'Read receipt removes unread action without approving the rule');

  await paired.page.getByRole('button',{name:'Se och svara i Schyssta listan'}).first().click();
  await paired.page.getByRole('heading',{name:'Schyssta listan'}).waitFor();
  await paired.page.locator('#schyssta-rule-30000000-0000-4000-8000-000000000001').waitFor();
  await checkOverflow(paired.page,'Mobile Schyssta listan');
  await capture(paired.page,'mobile-schyssta-list.png');
  await paired.page.goto(base+'#swipe',{waitUntil:'load'});
  await paired.page.getByRole('heading',{name:'Era gemensamma svar'}).waitFor();
  await paired.page.evaluate(()=>{window.__HK_RPC_UNAVAILABLE__=true;});
  await paired.page.getByRole("button",{name:"Uppdatera gemensamma svar"}).click();
  await paired.page.locator(".swipe-results [role='alert']").waitFor();
  assert.equal(await paired.page.locator(".swipe-match-list li").count(),0,"RPC failure must clear previous matches");
  await paired.context.close();
  const freshRules=await freshContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},{authenticated:true,paired:true,emptySchyssta:true});
  await freshRules.page.goto(base+'#regler',{waitUntil:'load'});
  await freshRules.page.getByRole('heading',{name:'Kom igång tillsammans'}).waitFor();
  assert.match(await freshRules.page.locator('.schyssta-view').innerText(),/Ni har inte gjort någon gemensam överenskommelse än/,'Empty paired family has useful onboarding rather than sample data');
  assert.equal(await freshRules.page.locator('.schyssta-view .schyssta-list li').count(),0,'Empty family does not show invented rules');
  await freshRules.page.locator('[data-schyssta-start]').click();
  await freshRules.page.locator('#schyssta-body').waitFor();
  assert.ok(await freshRules.page.locator('#schyssta-body').evaluate(el=>document.activeElement===el),'Start action moves focus into the editor');
  await freshRules.page.locator('#schyssta-body').fill('<img src=x onerror=alert(1)>');
  assert.equal(await freshRules.page.locator('#schyssta-preview-text').innerText(),'<img src=x onerror=alert(1)>','Preview renders user input as literal text');
  assert.equal(await freshRules.page.locator('#schyssta-preview-text img').count(),0,'Manual proposal preview never interprets HTML');
  await freshRules.context.close();
  const pairedTeen=await freshContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},{authenticated:true,paired:true,role:"teen"});
  await pairedTeen.page.goto(base+"#swipe",{waitUntil:"load"});
  const teenSummary=await pairedTeen.page.locator(".swipe-results").innerText();
  assert.match(teenSummary,/Gemensamma möjligheter – tonåring/,"The teen sees teen-specific wording");
  assert.match(await pairedTeen.page.locator('.swipe-summary-details').textContent(),/Välj gärna själv vad du vill börja prata om/,"The expanded teen prompt is derived from mutual YES only");
  assert.match(teenSummary,/Jag vill att vi visar uppskattning på sätt som känns bra för båda/,"Teen result uses the reviewed teen wording");
  assert.doesNotMatch(teenSummary,/Jag vill bli bättre på att visa uppskattning och fråga hur den tas emot/,"Teen result does not receive the parent wording");
  assert.match(teenSummary,/Du har markerat .* som särskilt viktigt/,"Teen gets autonomous priority wording");
  assert.doesNotMatch(teenSummary,/Jag vill helst prata färdigt innan någon kommer med råd/,"The teen summary cannot include a mutual NO");
  await pairedTeen.context.close();
  const unlocked=await freshContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},{authenticated:true,paired:true,unlocked:true});
  await unlocked.page.goto(base+"#swipe",{waitUntil:"load"});
  await unlocked.page.locator(".swipe-themes details").first().waitFor();
  assert.equal(await unlocked.page.locator(".swipe-themes details").count(),6,"All six theme decks are available to the paired family");
  assert.match(await unlocked.page.locator(".swipe-themes").innerText(),/Gemensamma ja kan visas direkt/i);
  await checkOverflow(unlocked.page,"Mobile unlocked theme previews");
  await unlocked.page.locator(".swipe-themes").scrollIntoViewIfNeeded();
  await capture(unlocked.page,"mobile-themes-unlocked.png");
  assert.equal(await unlocked.page.locator('[data-theme-open]').count(),6,"All six decks offer private swipe actions after unlock");
  await unlocked.page.locator('[data-theme-open="samtal"]').click();
  await unlocked.page.locator("#swipe-card[aria-label^='Temakort 1 av 104']").waitFor();
  const categoryFilter=unlocked.page.getByLabel('Välj kategori');
  assert.equal(await categoryFilter.count(),1,'Large theme decks expose one labelled category filter');
  assert.ok(await categoryFilter.isEnabled(),'Category filter is keyboard reachable');
  await categoryFilter.selectOption({label:'Framtid och möjligheter (8)'});
  await unlocked.page.locator("#swipe-card[aria-label*='i Framtid och möjligheter']").waitFor();
  assert.match(await unlocked.page.locator('#theme-category-status').innerText(),/^0 av 8 kort sparade i Framtid och möjligheter\.$/,'Filter reports only the signed-in user’s private progress for the selected category');
  assert.match(await unlocked.page.locator('#swipe-card').innerText(),/Prata om en plats vi vill besöka någon gång/,'Filter starts at the first unanswered card in the selected category');
  await unlocked.page.locator('.swipe-category-filter').scrollIntoViewIfNeeded();
  await capture(unlocked.page,'mobile-theme-category-filter.png');
  await categoryFilter.selectOption('all');
  await unlocked.page.locator("#swipe-card[aria-label^='Temakort 1 av 104']").waitFor();
  await unlocked.page.locator("#swipe-card").scrollIntoViewIfNeeded();
  await capture(unlocked.page,"mobile-theme-card.png");
  assert.match(await unlocked.page.locator("#swipe-card").innerText(),/Vad som varit roligt den senaste veckan/);
  await unlocked.page.getByRole('heading',{name:'Era gemensamma svar · Samtalsämnen'}).waitFor();
  const themeSharedText=await unlocked.page.locator('.swipe-results').innerText();
  assert.match(themeSharedText,/Vad som varit roligt den senaste veckan/,'Mutual theme YES is displayed inside its deck');
  assert.match(themeSharedText,/Viktigast att fokusera på/,'Theme priority uses the same server-gated section');
  assert.doesNotMatch(themeSharedText,/Hur vi har det i skolan eller på jobbet|Laga mat tillsammans/,'Theme NO and rows from another deck remain private');
  assert.deepEqual((await unlocked.page.evaluate(()=>window.__HK_MATCH_RPC_ARGS__)).at(-1),{p_deck_id:'samtal'},'Theme results use the reviewed aggregate RPC with the exact deck id');
  await checkOverflow(unlocked.page,"Mobile active theme deck");
  await unlocked.page.locator('.swipe-results').scrollIntoViewIfNeeded();
  await capture(unlocked.page,"mobile-theme-swipe.png");
  await unlocked.page.getByRole("button",{name:"Ja"}).click();
  await unlocked.page.locator("#swipe-card[aria-label^='Temakort 2 av 104']").waitFor();
  const themeSaved=await unlocked.page.evaluate(()=>window.__HK_SAVED_SWIPE__);
  assert.equal(themeSaved.row.deck_id,"samtal","Theme answer must use its own deck id");
  assert.equal(themeSaved.row.card_id,"samtal-01","Theme answer must use a stable card id");
  assert.equal(themeSaved.row.answer,true);
  assert.equal(themeSaved.row.user_id,"10000000-0000-0000-0000-000000000001");
  assert.equal(themeSaved.options.onConflict,"user_id,deck_id,card_id");
  await unlocked.page.locator("#theme-back").click();
  await unlocked.page.locator('[data-theme-open="samtal"]').click();
  assert.match(await unlocked.page.locator("#swipe-card").getAttribute("aria-label"),/Temakort 2 av 104/,"Theme resumes at first unanswered card");
  await unlocked.page.getByRole("button",{name:"Nej"}).click();
  await unlocked.page.locator("#swipe-card[aria-label^='Temakort 3 av 104']").waitFor();
  assert.equal((await unlocked.page.evaluate(()=>window.__HK_SAVED_SWIPE__)).row.answer,false,"Private NO is saved but not shared");
  await unlocked.page.locator("#theme-back").click();
  await unlocked.page.locator('[data-theme-open="aktiviteter"]').click();
  assert.match(await unlocked.page.locator("#swipe-card").getAttribute("aria-label"),/Temakort 1 av 104/,"Another deck starts independently");
  await unlocked.page.locator("#theme-back").click();
  await unlocked.context.close();
  const unavailable=await freshContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},{authenticated:true,paired:true,unlockUnavailable:true});
  await unavailable.page.goto(base+"#swipe",{waitUntil:"load"});
  await unavailable.page.locator(".swipe-themes details").first().waitFor();
  assert.equal(await unavailable.page.locator(".swipe-themes details").count(),6,"An obsolete completion RPC outage cannot block private theme exploration");
  assert.equal(await unavailable.page.evaluate(()=>window.__HK_UNLOCK_RPC_CALLS__||0),0,"Completion RPC is not called even when mocked as unavailable");
  await unavailable.context.close();
  const desktopInsights=await freshContext({viewport:{width:1440,height:900},deviceScaleFactor:1},{authenticated:true,paired:true});
  await desktopInsights.page.goto(base+'#insikter',{waitUntil:'load'});
  await desktopInsights.page.locator('.insights-deck').first().waitFor();
  assert.equal(await desktopInsights.page.locator('.insights-deck').count(),2,'Desktop insights also show only permitted A decks');
  await checkOverflow(desktopInsights.page,'Desktop all-deck insights');
  await capture(desktopInsights.page,'desktop-shared-insights.png');
  await desktopInsights.page.goto(base+'#regler',{waitUntil:'load'});
  await desktopInsights.page.getByRole('heading',{name:'Kunde inte visa listan'}).waitFor();
  assert.equal(await desktopInsights.page.locator('.schyssta-list li').count(),0,'Desktop also rejects the entire malformed Schyssta payload');
  await desktopInsights.page.evaluate(()=>{window.__HK_SCHYSSTA_CLEAN_RPC__=true;});
  await desktopInsights.page.locator('#schyssta-retry').click();
  await desktopInsights.page.getByRole('heading',{name:'Gemensamma förslag'}).waitFor();
  await checkOverflow(desktopInsights.page,'Desktop Schyssta listan');
  await capture(desktopInsights.page,'desktop-schyssta-list.png');
  await desktopInsights.context.close();
  const d=await freshContext({viewport:{width:1440,height:900},deviceScaleFactor:1},{authenticated:true});
  await d.page.getByRole("heading",{name:/Hej[ ,]+Provförälder/}).waitFor();
  assert.equal(await d.page.locator("#live-desktop-nav a").count(),8);
  await checkOverflow(d.page,"Desktop homepage");
  await capture(d.page,"desktop-home.png");
  await d.context.close();
  assert.deepEqual(errors,[],"Browser errors: "+errors.join("; "));
  await fs.writeFile(path.join(output,"visual-audit.json"),JSON.stringify({
    purpose:"Playwright responsive visual review",
    commit:process.env.GITHUB_SHA||"local",
    generatedAt:new Date().toISOString(),
    screens:captureRecords,
    browserErrors:errors,
    note:"Automated checks passed; screenshots still require actual visual review."
  },null,2)+"\n");
  console.log("Browser smoke tests passed. "+captureRecords.length+" screenshots and visual-audit.json saved.");
}catch(error){console.error(error);process.exitCode=1;}
finally{if(browser)await browser.close();server.kill();}
