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
// Legacy per-deck results are optional when a confirmed cross-deck summary exists.
// Open them deliberately for browser checks of the older advice and controls.
async function revealSwipeSecondary(page){
  const details=page.locator('.swipe-secondary-results');
  if(await details.count()&&!(await details.evaluate(el=>el.open)))
    await details.locator(':scope > summary').click();
}
async function waitForServer(){
  for(let i=0;i<50;i++){
    try{const r=await fetch(base);if(r.ok)return;}catch{}
    await sleep(200);
  }
  throw new Error("Local HTTP server did not start");
}
// FBK-02-03: measure actual rendered wordmark text, not just its CSS box.
// FBK-02-02: exercise the real NVC UI, opt-in AI request and local fallback.
async function verifyNvcDraftAi(){
  for(const role of ['parent','teen']){
    const {context,page,mediatorCalls,mediatorFixture}=await freshContext(
      {viewport:{width:role==='parent'?390:320,height:844},isMobile:true,hasTouch:true},
      {authenticated:true,paired:true,role,aiMediator:true});
    try{
      await page.goto(base+'#nvc',{waitUntil:'load'});
      await page.locator('#comm-nvc-form').waitFor();
      const aiButton=page.locator('#comm-nvc-ai');
      assert.equal(await aiButton.isDisabled(),true,role+': AI unavailable before local preview');
      await page.locator('#comm-observation').fill('Han lyssnade inte när jag pratade');
      await page.locator('#comm-feeling').fill('Trött och irriterad');
      await page.locator('#comm-need').fill('Att han visar att han lyssnar');
      await page.locator('#comm-request').fill('Lyssna på mig i två minuter');
      await page.getByRole('button',{name:'Visa mina fyra delar'}).click();
      assert.match(await page.locator('#comm-nvc-output').innerText(),/^Det jag lade märke till:/);
      assert.equal(mediatorCalls.filter(x=>x.pathname==='/api/ai/mediate').length,0,
        role+': local preview must make no AI request');
      await capture(page,'fbk-02-02-nvc-local-'+role+'.png');
      assert.equal(await aiButton.isEnabled(),true);
      await aiButton.click();
      await page.waitForFunction(()=>document.querySelector('#comm-nvc-ai-status')?.textContent?.includes('AI-förslag klart'));
      assert.match(await page.locator('#comm-nvc-output').innerText(),/^När jag blir avbruten/);
      const calls=mediatorCalls.filter(x=>x.pathname==='/api/ai/mediate');
      assert.equal(calls.length,1);
      assert.equal(calls[0].body.useProjectContext,false);
      assert.equal(Object.hasOwn(calls[0].body,'chatId'),false);
      assert.match(calls[0].body.message,/Observation: Han lyssnade inte/);
      assert.equal(mediatorFixture.chats.length,0,'No persisted chat is created by NVC AI');
      await capture(page,'fbk-02-02-nvc-ai-'+role+'.png');
      // Editing invalidates the displayed AI output and disables copying until regenerated.
      await page.locator('#comm-feeling').fill('Lite ledsen');
      assert.equal(await page.locator('#comm-nvc-ai').isDisabled(),true);
      assert.equal(await page.locator('[data-comm-copy="nvc"]').isDisabled(),true);
      await page.getByRole('button',{name:'Visa mina fyra delar'}).click();
      const original=await page.locator('#comm-nvc-output').innerText();
      mediatorFixture.failNextSend=true;
      await aiButton.click();
      await page.waitForFunction(()=>document.querySelector('#comm-nvc-ai-status')?.textContent?.includes('Tillfälligt fel'));
      assert.equal(await page.locator('#comm-nvc-output').innerText(),original,
        role+': AI error retains the local draft');
      assert.equal(await aiButton.isEnabled(),true);
      await page.locator('[data-comm-reset]').click();
      assert.equal(await aiButton.isDisabled(),true);
      assert.equal(await page.locator('[data-comm-copy="nvc"]').isDisabled(),true);
      await checkOverflow(page,'FBK-02-02 NVC '+role);
    }finally{await context.close();}
  }
}
async function verifyDesktopSidebarBrand(){
  for(const width of [821,1024,1440]){
    const {context,page}=await freshContext({viewport:{width,height:900}},{authenticated:true,paired:true});
    try{
      await page.goto(base+"#kommunikation",{waitUntil:"load"});
      await page.locator(".live-sidebar .live-brand").waitFor({state:"visible"});
      const bounds=await page.evaluate(()=>{
        const aside=document.querySelector(".live-sidebar");
        const brand=aside?.querySelector(".live-brand");
        if(!aside||!brand)return null;
        const a=aside.getBoundingClientRect();
        const s=getComputedStyle(aside);
        const range=document.createRange();
        range.selectNodeContents(brand);
        const text=range.getBoundingClientRect();
        return {textLeft:text.left,textRight:text.right,
          contentLeft:a.left+parseFloat(s.paddingLeft),
          contentRight:a.right-parseFloat(s.paddingRight)-parseFloat(s.borderRightWidth),
          textLines:[...range.getClientRects()].filter(r=>r.width>0).length};
      });
      assert.ok(bounds,"Desktop sidebar wordmark exists at "+width+"px");
      assert.ok(bounds.textLeft>=bounds.contentLeft-1,
        "Brand begins outside sidebar content at "+width+"px: "+JSON.stringify(bounds));
      assert.ok(bounds.textRight<=bounds.contentRight+1,
        "Brand crosses sidebar divider at "+width+"px: "+JSON.stringify(bounds));
      assert.equal(bounds.textLines,1,"Wordmark should stay on one line at "+width+"px");
      // VIS-00/FBK-02-03: the earlier overflow fix switched the brand from
      // flex to block; the compass circle is a ::before pseudo-element whose
      // dimensions depend on being a flex item. Verify the real computed
      // layout, not only the wordmark's text bounding rectangle.
      const compass=await page.locator(".live-sidebar .live-brand").evaluate(el=>{
        const brandStyle=getComputedStyle(el),icon=getComputedStyle(el,"::before");
        return {containerDisplay:brandStyle.display,iconDisplay:icon.display,
          iconWidth:parseFloat(icon.width),iconHeight:parseFloat(icon.height),
          content:icon.content};
      });
      assert.equal(compass.containerDisplay,"flex",
        "Desktop brand must preserve its circular compass icon: "+JSON.stringify(compass));
      assert.equal(compass.iconDisplay,"block",
        "The compass pseudo-element must be a sized flex item, not an inline zero-size shape");
      assert.ok(compass.iconWidth>=30&&compass.iconHeight>=30,
        "The compass must retain its intended visible dimensions: "+JSON.stringify(compass));
      // Text enlargement is independent of CSS-pixel viewport size. At
      // larger text, wrap within the sidebar rather than overlap the divider.
      if(width===821){
        await page.locator(".live-sidebar .live-brand").evaluate(el=>{el.style.fontSize="34px";});
        const large=await page.evaluate(()=>{
          const aside=document.querySelector(".live-sidebar"),brand=aside.querySelector(".live-brand");
          const side=aside.getBoundingClientRect(),s=getComputedStyle(aside),range=document.createRange();
          range.selectNodeContents(brand);
          const rect=range.getBoundingClientRect();
          return {right:rect.right,limit:side.right-parseFloat(s.paddingRight)-parseFloat(s.borderRightWidth),
            lines:[...range.getClientRects()].filter(r=>r.width>0).length};
        });
        assert.ok(large.right<=large.limit+1,
          "Zoomed 34px wordmark must stay in desktop sidebar: "+JSON.stringify(large));
        assert.ok(large.lines>=2,"Enlarged desktop title should wrap visibly: "+JSON.stringify(large));
        await page.screenshot({path:path.join(output,"desktop-sidebar-brand-zoom-"+width+".png"),animations:"disabled"});
      }
      await page.screenshot({path:path.join(output,"desktop-sidebar-brand-"+width+".png"),animations:"disabled"});
    }finally{await context.close();}
  }
}
// FBK-02-01: agreed rules come first; pending requests remain accessible below them.
async function verifySchysstaMobileHierarchy(){
  for(const role of ['parent','teen']){
    for(const width of [320,390]){
      const {context,page}=await freshContext(
        {viewport:{width,height:844},isMobile:true,hasTouch:true},
        {authenticated:true,paired:true,role});
      try{
        await page.goto(base+'#regler',{waitUntil:'load'});
        // This fixture deliberately returns a forged rule until a controlled retry.
        await page.getByRole('heading',{name:'Kunde inte visa listan'}).waitFor();
        await page.evaluate(()=>{window.__HK_SCHYSSTA_CLEAN_RPC__=true;});
        await page.locator('#schyssta-retry').click();
        const approved=page.locator('[data-schyssta-filter-group="approved"]');
        await approved.locator('.schyssta-list>li').first().waitFor();
        const geometry=await page.evaluate(()=>{
          const root=document.querySelector('.schyssta-view');
          const approved=root?.querySelector('[data-schyssta-filter-group="approved"]');
          const compose=root?.querySelector('.schyssta-compose-panel');
          const search=root?.querySelector('.schyssta-filter-toolbar');
          const pending=[...root.querySelectorAll('.live-panel h2')].find(h=>h.textContent.startsWith('Behöver ditt svar'));
          return {approvedY:approved?.getBoundingClientRect().top,
            composeY:compose?.getBoundingClientRect().top,
            searchY:search?.getBoundingClientRect().top,
            pendingY:pending?.getBoundingClientRect().top,
            composeClosed:!compose?.open,
            approvedCount:approved?.querySelectorAll('.schyssta-list>li').length,
            acceptedText:approved?.querySelector('.schyssta-list>li')?.textContent||''};
        });
        assert.ok(geometry.approvedY<geometry.composeY&&geometry.approvedY<geometry.searchY,
          role+' '+width+'px: agreed rules must precede optional writing/filtering: '+JSON.stringify(geometry));
        assert.ok(geometry.approvedY<geometry.pendingY,
          role+' '+width+'px: shared agreements precede pending proposals without hiding them');
        assert.ok(geometry.composeClosed,role+' '+width+'px: optional form collapsed initially');
        assert.ok(geometry.approvedCount>=1,role+' '+width+'px: approved rules still accessible');
        // UX-SL-02: verify the actual browser layout rather than relying on CSS source.
        const approvedRow=approved.locator('.schyssta-approved-item').first();
        const rowStyle=await approvedRow.evaluate(el=>{
          const css=getComputedStyle(el);
          const panel=getComputedStyle(el.closest('.live-panel'));
          return {background:css.backgroundColor,panelBackground:panel.backgroundColor,
            borderTop:css.borderTopWidth,borderLeft:css.borderLeftWidth,
            borderRight:css.borderRightWidth,borderRadius:css.borderTopLeftRadius};
        });
        assert.equal(rowStyle.background,'rgba(0, 0, 0, 0)',
          role+' '+width+'px: approved row should not be another filled card');
        assert.equal(rowStyle.borderLeft,'0px',
          role+' '+width+'px: approved row should not have a nested left frame');
        assert.equal(rowStyle.borderRight,'0px',
          role+' '+width+'px: approved row should not have a nested right frame');
        assert.equal(rowStyle.borderRadius,'0px',
          role+' '+width+'px: approved row should not have a card radius');
        const disclosure=approvedRow.locator('details.schyssta-approved-details');
        assert.equal(await disclosure.getAttribute('open'),null,
          role+' '+width+'px: rule administration initially collapsed');
        assert.equal(await approvedRow.getByRole('button',{name:'Föreslå ändring'}).isVisible(),false,
          role+' '+width+'px: change control should be hidden until expansion');
        await disclosure.locator(':scope > summary').click();
        assert.equal(await approvedRow.getByRole('button',{name:'Föreslå ändring'}).isVisible(),true,
          role+' '+width+'px: rule administration accessible after expansion');
        await disclosure.locator(':scope > summary').click();
        // UX-03: loading a deep-linked page may set the active tab before
        // asynchronous family data makes the nav visible. It must end fully
        // inside the unobscured tab strip, not beneath the feedback button.
        await page.waitForFunction(()=>{
          const nav=document.querySelector('#live-mobile-nav');
          const tab=nav?.querySelector('a[aria-current="page"]');
          if(!nav||!tab)return false;
          const n=nav.getBoundingClientRect(),t=tab.getBoundingClientRect();
          return n.width>0&&t.left>=n.left-1&&t.right<=n.right+1;
        },null,{timeout:2500}).catch(async()=>{
          const bounds=await page.evaluate(()=>{
            const nav=document.querySelector('#live-mobile-nav');
            const tab=nav?.querySelector('a[aria-current="page"]');
            const n=nav?.getBoundingClientRect(),t=tab?.getBoundingClientRect();
            return {route:location.hash,navLeft:n?.left,navRight:n?.right,
              tabLeft:t?.left,tabRight:t?.right,scrollLeft:nav?.scrollLeft,
              scrollWidth:nav?.scrollWidth,clientWidth:nav?.clientWidth};
          });
          throw new Error(role+' '+width+'px active tab clipped after load: '+JSON.stringify(bounds));
        });
        const navBounds=await page.evaluate(()=>{
          const n=document.querySelector('#live-mobile-nav').getBoundingClientRect();
          const t=document.querySelector('#live-mobile-nav a[aria-current="page"]').getBoundingClientRect();
          const b=document.querySelector('#hk-feedback-open')?.getBoundingClientRect();
          return {navRight:n.right,tabRight:t.right,tabLeft:t.left,reportLeft:b?.left,reportTop:b?.top,tabBottom:t.bottom};
        });
        assert.ok(navBounds.tabRight<=navBounds.navRight+1,
          role+' '+width+'px: active tab is clipped: '+JSON.stringify(navBounds));
        assert.ok(!navBounds.reportLeft||navBounds.tabRight<=navBounds.reportLeft+1
          ||navBounds.tabBottom<=navBounds.reportTop,
          role+' '+width+'px: active tab is behind the report button: '+JSON.stringify(navBounds));
        const jump=page.getByRole('button',{name:'Visa väntande förslag'});
        assert.equal(await jump.count(),1,role+' '+width+'px: a visible pending-action jump exists');
        await jump.click();
        const reached=await page.evaluate(()=>{
          const heading=document.getElementById('schyssta-needs-answer');
          const scroller=document.querySelector('.live-main');
          if(!heading||!scroller)return false;
          const rect=heading.getBoundingClientRect(),view=scroller.getBoundingClientRect();
          return document.activeElement===heading
            &&rect.top>=view.top-2&&rect.top<view.bottom-20;
        });
        assert.ok(reached,role+' '+width+'px: pending heading is focused and scrolled into view');
        await page.locator('.schyssta-quick-actions [data-schyssta-start]').click();
        await page.locator('#schyssta-body').waitFor({state:'visible'});
        assert.equal(await page.locator('.schyssta-compose-panel').getAttribute('open'),'',
          role+' '+width+'px: explicit compose action reveals editor');
        await page.locator('#schyssta-compose').click();
        assert.equal(await page.locator('.schyssta-compose-panel').getAttribute('open'),null,
          role+' '+width+'px: close action restores compact view');
        await checkOverflow(page,'FBK-02-01 '+role+' '+width+'px');
        // The scrolling surface is .live-main on mobile; reset it for the screenshot.
        await page.locator('.live-main').evaluate(el=>{el.scrollTop=0;});
        await capture(page,'fbk-02-01-'+role+'-'+width+'.png');
      }finally{await context.close();}
    }
  }
  const {context,page}=await freshContext(
    {viewport:{width:320,height:844},isMobile:true,hasTouch:true},
    {authenticated:true,paired:true,emptySchyssta:true});
  try{
    await page.goto(base+'#regler',{waitUntil:'load'});
    await page.locator('[data-schyssta-filter-group="approved"]').waitFor();
    assert.match(await page.locator('[data-schyssta-filter-group="approved"]').innerText(),
      /Ni har ännu inga regler som båda godkänt/);
    assert.equal(await page.getByRole('heading',{name:/^Behöver ditt svar/}).count(),0,
      'No empty decision card when nothing needs an answer');
    await checkOverflow(page,'FBK-02-01 empty 320px');
    await capture(page,'fbk-02-01-empty-320.png');
  }finally{await context.close();}
}
async function checkOverflow(page,label){
  const widths=await page.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth,visual:window.visualViewport?.width}));
  assert.ok(widths.document<=widths.viewport+2,label+": horizontal overflow "+JSON.stringify(widths));
}
async function checkMobileNavigation(page,label){
  const result=await page.evaluate(async()=>{
    const nav=document.querySelector('#live-mobile-nav');
    if(!(nav instanceof HTMLElement))throw new Error('Mobile navigation is missing');
    const links=[...nav.querySelectorAll(':scope > a')];
    const failures=[];
    if(links.length!==8)failures.push('Expected all eight modules as direct tabs');
    if(nav.querySelector('details,summary'))failures.push('Unexpected More drawer');
    if(nav.scrollWidth<=nav.clientWidth+100)failures.push('Navigation is not horizontally scrollable');
    if(getComputedStyle(nav).overflowX!=='auto')failures.push('Horizontal swipe overflow is disabled');
    if(nav.scrollHeight>nav.clientHeight+3)failures.push('Navigation unexpectedly scrolls vertically');
    for(const link of links){
      const box=link.getBoundingClientRect(),styles=getComputedStyle(link);
      if(box.width<75||box.height<44)failures.push(link.textContent+' small tap target');
      if(styles.flexDirection!=='column')failures.push(link.textContent+' unexpected tab layout');
      if(styles.overflowWrap!=='normal'||styles.wordBreak!=='normal')
        failures.push(link.textContent+' may break a word inside the tab');
      // Count the rendered boxes for each actual word in the text node.
      // A word split across two rows yields two rects even when the whole
      // page has no document-level horizontal overflow.
      const textNode=[...link.childNodes].find(node=>node.nodeType===Node.TEXT_NODE);
      if(!textNode||!textNode.textContent?.trim()){
        failures.push(link.textContent+' missing visible label');
      }else{
        for(const match of textNode.textContent.matchAll(/\S+/gu)){
          const range=document.createRange();
          range.setStart(textNode,match.index);
          range.setEnd(textNode,match.index+match[0].length);
          const parts=[...range.getClientRects()].filter(rect=>rect.width>0.5);
          if(parts.length!==1){
            failures.push(link.textContent+' splits word '+match[0]+' into '+parts.length+' lines');
          }else if(parts[0].left<box.left-2||parts[0].right>box.right+2){
            failures.push(link.textContent+' word '+match[0]+' exceeds its tab');
          }
        }
      }
    }
    // A physical horizontal swipe can reach both ends of the strip.
    nav.scrollTo({left:nav.scrollWidth,behavior:'instant'});
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const last=links.at(-1),lastVisible=last?.getBoundingClientRect();
    const strip=nav.getBoundingClientRect();
    if(!lastVisible||lastVisible.left<strip.left-3||lastVisible.right>strip.right+3)
      failures.push('Last tab not reachable by horizontal scroll');
    nav.scrollTo({left:0,behavior:'instant'});
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const firstVisible=links[0]?.getBoundingClientRect();
    if(!firstVisible||firstVisible.left<strip.left-3||firstVisible.right>strip.right+3)
      failures.push('First tab not reachable by horizontal scroll');
    const first=links[0];
    first.focus();
    await new Promise(resolve=>requestAnimationFrame(resolve));
    const style=getComputedStyle(first);
    const focusVisible=style.outlineStyle!=='none'&&parseFloat(style.outlineWidth)>=2;
    return {count:links.length,scrollable:nav.scrollWidth>nav.clientWidth+100,focusVisible,failures};
  });
  assert.equal(result.count,8,label+': all eight modules directly accessible');
  assert.ok(result.scrollable,label+': horizontal navigation is swipeable');
  assert.ok(result.focusVisible,label+': keyboard focus is visible');
  assert.deepEqual(result.failures,[],label+': direct tab visibility and tap sizes');
}

async function capture(page,name){
  // Standardize screenshots, and fail if transient UI obscures the layout.
  await page.evaluate(()=>{
    if(document.activeElement instanceof HTMLElement)document.activeElement.blur();
    window.scrollTo({top:0,behavior:"instant"});
  });
  await page.waitForFunction(()=>!document.querySelector("#toast")?.classList.contains("show"),null,{timeout:8000});
  const overlays=await page.evaluate(()=>{
    const skip=document.querySelector(".live-skip-link, .skip-link");
    const toast=document.querySelector("#toast");
    const box=skip?.getBoundingClientRect();
    const main=document.querySelector('.live-main');
    const nav=document.querySelector('#live-mobile-nav');
    const mainBox=main?.getBoundingClientRect();
    const navBox=nav?.getBoundingClientRect();
    const navVisible=!!navBox&&navBox.height>0;
    return {
      skipVisible:!!box&&box.bottom>0,
      toastVisible:!!toast?.classList.contains("show"),
      scrollY:window.scrollY,
      contentScrollTop:main?.scrollTop??0,
      contentScrollHeight:main?.scrollHeight??0,
      contentViewportHeight:main?.clientHeight??0,
      mobileNavOverlapsContent:navVisible&&!!mainBox&&mainBox.bottom>navBox.top+1
    };
  });
  assert.ok(!overlays.skipVisible,name+": unfocused skip-link appears onscreen");
  assert.ok(!overlays.toastVisible,name+": transient toast remains visible");
  assert.ok(overlays.scrollY<=1,name+": document is not at top of page");
  assert.ok(!overlays.mobileNavOverlapsContent,name+": mobile navigation overlaps the content scroller");
  await page.screenshot({path:path.join(output,name),fullPage:true,animations:"disabled"});
  captureRecords.push({file:name,viewport:page.viewportSize(),...overlays});
}
// FUN-00: this is a SYNTHETIC UI inventory, not a claim that each control works
// with real Auth, a live database, or a physical device. Real actions are tested
// separately; every discovered control retains its untested status in the report.
const FUNCTION_AUDIT_ROUTES=Object.freeze([
  'hem','inkorg','swipe','insikter','personlighet','kommunikation',
  'nvc','mi-foralder','regler','medlare','installningar'
]);
const FUNCTION_AUDIT_PRIMARY=Object.freeze([
  'hem','inkorg','swipe','personlighet','kommunikation','regler','medlare','installningar'
]);
// FUN-01: exercise the actual account page's DOM handlers with an in-memory
// Supabase stand-in. This never signs in, writes to Supabase, or sends mail.
async function testAccountBrowserJourney(){
  const steps=[];
  const context=await browser.newContext({viewport:{width:390,height:844},
    locale:'sv-SE',reducedMotion:'reduce',deviceScaleFactor:2,isMobile:true,hasTouch:true});
  await context.route(base+'backend-config.js*',route=>route.fulfill({
    contentType:'application/javascript',
    body:"window.HEMMAKOMPASSEN_BACKEND={supabaseUrl:'https://synthetic.invalid',supabasePublishableKey:'synthetic'};"
  }));
  const accountMock=[
    'export function createClient(){',
    '  const state={user:null,members:[],name:""};',
    '  const calls=window.__HK_ACCOUNT_CALLS__=[];',
    '  const record=name=>calls.push(name);',
    '  const auth={',
    '    async getUser(){return {data:{user:state.user},error:null};},',
    '    async signInWithPassword(){record("login");state.user={id:"synthetic-parent",email:"test@example.invalid"};return {error:null};},',
    '    async signUp(){record("signup");return {data:{session:null},error:null};},',
    '    async resetPasswordForEmail(){record("reset");return {error:null};},',
    '    async updateUser(){record("password-update");return {error:null};},',
    '    async signOut(){record("logout");state.user=null;return {error:null};},',
    '    onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}};}',
    '  };',
    '  const from=()=>({',
    '    select:()=>({eq:()=>({maybeSingle:async()=>({data:{display_name:state.name},error:null})})}),',
    '    upsert:async row=>{record("name-update");state.name=row.display_name;return {error:null};}',
    '  });',
    '  const rpc=async name=>{record(name);',
    '    if(name==="my_family_members"){',
    '      if(window.__HK_ACCOUNT_FAIL_MEMBERS__)return {data:null,error:{message:"Simulerat fel vid familjeläsning"}};',
    '      if(window.__HK_ACCOUNT_INVALID_MEMBERS__)return {data:null,error:null};',
    '      return {data:state.members,error:null};',
    '    }',
    '    if(name==="start_family"){state.members=[{user_id:"synthetic-parent",role:"parent",display_name:"Provförälder"}];return {data:null,error:null};}',
    '    if(name==="create_family_invite")return {data:"2030-01-01T12:00:00Z",error:null};',
    '    if(name==="accept_family_invite"){state.members.push({user_id:"synthetic-teen",role:"teen",display_name:"Provtonåring"});return {data:null,error:null};}',
    '    throw Error("Unmocked account RPC "+name);',
    '  };',
    '  return {auth,from,rpc};',
    '}'
  ].join('\n');
  await context.route('https://esm.sh/**',route=>route.fulfill({
    contentType:'application/javascript',body:accountMock
  }));
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  const invitation='A'.repeat(36);
  await page.goto(base+'konto.html#invite='+invitation,{waitUntil:'load'});
  await page.locator('#logged-out:not(.hidden)').waitFor();
  await page.locator('#invite-notice:not(.hidden)').waitFor();
  assert.match(await page.locator('#invite-notice').innerText(),/Familjeinbjudan hittad/);
  assert.equal((await page.locator('#status').innerText()).trim(),'','The invitation is not a transient form result');
  assert.equal(await page.locator('#logged-in:not(.hidden)').count(),0);
  await checkOverflow(page,'FUN-01 account logged out');
  // VIS-00: make the first actual sign-in controls visible on a mobile screen.
  // This is a real layout measurement, but still a synthetic Auth session.
  const firstFold=await page.evaluate(()=>{
    const email=document.querySelector('#email').getBoundingClientRect();
    const login=document.querySelector('#email-form button[type="submit"]').getBoundingClientRect();
    const heading=document.querySelector('main > h1').getBoundingClientRect();
    return {emailTop:email.top,loginBottom:login.bottom,headingBottom:heading.bottom};
  });
  assert.ok(firstFold.emailTop<510,
    'At 390px the e-mail field should no longer be pushed down by the heading and spacing');
  assert.ok(firstFold.loginBottom<735,
    'At 390px the primary sign-in action should be visible in the initial 844px viewport');
  await page.setViewportSize({width:320,height:700});
  await checkOverflow(page,'VIS-00 account narrow login');
  assert.ok(await page.locator('#email').isVisible(),
    'The first account input remains visible and accessible at 320px');
  await page.setViewportSize({width:390,height:844});
  steps.push('account logged-out invitation banner and compact first sign-in viewport');
  await capture(page,'mobile-account-invite-loggedout.png');

  await page.locator('#register summary').click();
  await page.locator('#signup-email').fill('test@example.invalid');
  await page.locator('#signup-password').fill('abcdefghijklmnop');
  await page.locator('#signup-confirm').fill('otherlongpassword');
  await page.locator('#signup-form').evaluate(el=>el.requestSubmit());
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('Lösenorden stämmer inte'));
  assert.equal((await page.evaluate(()=>window.__HK_ACCOUNT_CALLS__)).filter(x=>x==='signup').length,0,
    'FUN-01 mismatch must not call registration API');
  steps.push('invalid signup rejected before API');
  await page.locator('#signup-confirm').fill('abcdefghijklmnop');
  await page.locator('#signup-form').evaluate(el=>el.requestSubmit());
  await page.waitForFunction(()=>(window.__HK_ACCOUNT_CALLS__||[]).includes('signup'));
  await page.waitForFunction(()=>!document.querySelector('#signup-form button')?.disabled);
  assert.match(await page.locator('#status').innerText(),/Kontrollera din e-post för att bekräfta kontot/,
    'FUN-01: signup feedback must remain visible even when invite URL is present');
  assert.equal(await page.locator('#invite-notice:not(.hidden)').count(),1,'Invite notice remains accessible after signup');
  steps.push('signup confirmation survives account refresh');

  await page.locator('#reset summary').click();
  await page.locator('#reset-email').fill('test@example.invalid');
  await page.locator('#reset-form').evaluate(el=>el.requestSubmit());
  await page.waitForFunction(()=>(window.__HK_ACCOUNT_CALLS__||[]).includes('reset'));
  await page.waitForFunction(()=>!document.querySelector('#reset-form button')?.disabled);
  assert.match(await page.locator('#status').innerText(),/Om adressen har ett konto får du ett mejl/,
    'FUN-01: password-reset confirmation must survive invite refresh');
  assert.equal(await page.locator('#invite-notice:not(.hidden)').count(),1,'Invite notice remains accessible after password reset');
  steps.push('password reset confirmation survives refresh');

  await page.locator('#email').fill('test@example.invalid');
  await page.locator('#password').fill('synthetic-password');
  await page.locator('#email-form').evaluate(el=>el.requestSubmit());
  await page.locator('#logged-in:not(.hidden)').waitFor();
  await page.locator('#unpaired:not(.hidden)').waitFor();
  assert.equal(await page.locator('#invite-code').inputValue(),invitation,
    'FUN-01: invitation token is preserved across login');
  assert.equal(new URL(page.url()).pathname.endsWith('/konto.html'),true);
  steps.push('login preserves invitation code in account UI');

  await page.locator('#role').selectOption('parent');
  await page.locator('#create-family').click();
  await page.locator('#waiting:not(.hidden)').waitFor();
  steps.push('parent starts family');
  await page.locator('#make-invite').click();
  await page.locator('#invite-qr:not(.hidden)').waitFor();
  const href=await page.locator('#invite-link').getAttribute('href');
  const code=new URL(href).hash.match(/^#invite=([A-F0-9]{36})$/)?.[1];
  assert.ok(code,'FUN-01 QR link must contain a 36-digit hex invitation fragment');
  assert.match(await page.locator('#invite-qr-image').getAttribute('src'),/^data:image\/svg\+xml/,
    'FUN-01 QR is displayed as a local SVG, not remote tracking');
  assert.match(await page.locator('#new-invite').innerText(),new RegExp(code));
  steps.push('QR code and invite link refer to same generated token');

  await page.locator('#invite-code').fill(code);
  await page.locator('#accept-form').evaluate(el=>el.requestSubmit());
  await page.locator('#family:not(.hidden)').waitFor();
  assert.equal(await page.locator('#waiting:not(.hidden)').count(),0);
  assert.equal(new URL(page.url()).hash,'','FUN-01 consumed invitation hash is removed');
  assert.match(await page.locator('#members').innerText(),/Förälder.*Tonåring/);
  steps.push('in-memory invite acceptance displays both family roles');

  // FUN-01: a real account refresh must not display the last-known family as
  // verified, or report success, if the current family RPC fails.
  await page.evaluate(()=>{window.__HK_ACCOUNT_FAIL_MEMBERS__=true;});
  await page.locator('#refresh-account').click();
  await page.locator('#refresh-account-status').getByText('Simulerat fel vid familjeläsning').waitFor();
  for(const id of ['family','waiting','unpaired','join-family']){
    assert.equal(await page.locator('#'+id+':not(.hidden)').count(),0,
      'Unverified family response may not leave '+id+' visible');
  }
  assert.equal((await page.locator('#members').innerText()).trim(),'');
  assert.doesNotMatch(await page.locator('#refresh-account-status').innerText(),/Kontot har uppdaterats/);
  await checkOverflow(page,'FUN-01 unknown family after failed refresh');
  // VIS-00-12: the status is immediately below the action, not after the
  // password, name, pairing and logout forms, even on a narrow phone.
  for(const width of [320,390]){
    await page.setViewportSize({width,height:844});
    await page.evaluate(()=>window.scrollTo(0,0));
    const button=await page.locator('#refresh-account').boundingBox();
    const feedback=await page.locator('#refresh-account-status').boundingBox();
    assert.ok(button && feedback,`VIS-00-12: refresh action and live status visible at ${width}px`);
    assert.ok(feedback.y >= button.y+button.height-2 && feedback.y <= button.y+button.height+35,
      `VIS-00-12: refresh status must follow button closely at ${width}px`);
    assert.ok(feedback.y+feedback.height<=844,
      `VIS-00-12: refresh error should appear within first screen at ${width}px`);
    assert.equal((await page.locator('#status').innerText()).trim(),'','Other forms must not duplicate account refresh status');
    await checkOverflow(page,`VIS-00-12 inline account status ${width}px`);
  }
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>window.scrollTo(0,0));
  await capture(page,'mobile-account-family-unverified.png');
  steps.push('family RPC failure hides previously verified family and preserves error');

  await page.evaluate(()=>{
    window.__HK_ACCOUNT_FAIL_MEMBERS__=false;
    window.__HK_ACCOUNT_INVALID_MEMBERS__=true;
  });
  await page.locator('#refresh-account').click();
  await page.locator('#refresh-account-status').getByText(/kunde inte bekräftas/).waitFor();
  assert.equal(await page.locator('#unpaired:not(.hidden)').count(),0,
    'Null RPC payload must not be interpreted as a verified unpaired family');
  steps.push('null family response cannot falsely show unpaired state');

  await page.evaluate(()=>{window.__HK_ACCOUNT_INVALID_MEMBERS__=false;});
  await page.locator('#refresh-account').click();
  await page.locator('#family:not(.hidden)').waitFor();
  await page.locator('#refresh-account-status').getByText('Kontot har uppdaterats.').waitFor();
  assert.match(await page.locator('#members').innerText(),/Förälder.*Tonåring/);
  steps.push('explicit successful retry restores family controls');

  // FUN-01: automatic account/profile reads must not erase edits typed into
  // the real DOM input before the user explicitly presses Save.
  await page.locator('#display-name').fill('Osparat namn under pågående uppdatering');
  await page.locator('#refresh-account').click();
  await page.locator('#refresh-account-status').getByText('Kontot har uppdaterats.').waitFor();
  assert.equal(await page.locator('#display-name').inputValue(),
    'Osparat namn under pågående uppdatering',
    'Manual refresh must preserve the unsaved name field');
  await page.evaluate(()=>window.scrollTo(0,0));
  await checkOverflow(page,'FUN-01 account name draft retained');
  await capture(page,'mobile-account-name-draft.png');
  steps.push('unsaved display name survives a verified account refresh');

  await page.locator('#display-name').fill('Nytt syntetiskt namn');
  await page.locator('#name-form').evaluate(el=>el.requestSubmit());
  await page.waitForFunction(()=>(window.__HK_ACCOUNT_CALLS__||[]).includes('name-update'));
  steps.push('name update call');
  await page.locator('#new-password').fill('abcdefghijklmno');
  await page.locator('#confirm-password').fill('abcdefghijklmno');
  await page.locator('#password-form').evaluate(el=>el.requestSubmit());
  await page.waitForFunction(()=>(window.__HK_ACCOUNT_CALLS__||[]).includes('password-update'));
  steps.push('password update call');
  await checkOverflow(page,'FUN-01 account paired');
  await capture(page,'mobile-account-invite-paired.png');

  await page.locator('#logout').click();
  await page.locator('#logged-out:not(.hidden)').waitFor();
  assert.equal(await page.locator('#logged-in:not(.hidden)').count(),0);
  steps.push('logout hides signed-in account controls');

  await fs.writeFile(path.join(output,'account-functional-synthetic.json'),
    JSON.stringify({inventory:'FUN-01',commit:process.env.GITHUB_SHA||'local',
      evidence:'Actual browser account handlers with an in-memory API stand-in',
      limitations:'No real authentication, email, external QR scan, or Supabase write',
      passedSyntheticSteps:steps},null,2)+'\n');
  await context.close();
  console.log('FUN-01 account page: '+steps.length+' synthetic browser checkpoints passed.');
}

async function captureFunctionalInventory(){
  const entries=[],navigation=[];
  const cases=[
    {name:'parent-mobile-320',role:'parent',width:320,height:720,paired:true},
    {name:'teen-mobile-390',role:'teen',width:390,height:844,paired:true},
    {name:'parent-desktop-1440',role:'parent',width:1440,height:900,paired:true},
    {name:'parent-unpaired-390',role:'parent',width:390,height:844,paired:false}
  ];
  for(const item of cases){
    const {context,page}=await freshContext(
      {viewport:{width:item.width,height:item.height},deviceScaleFactor:1,
        isMobile:item.width<500,hasTouch:item.width<500},
      {authenticated:true,paired:item.paired,role:item.role,aiMediator:true,
        personalityComplete:true,personalitySharing:true,privateRetests:true,aiAnalyses:true}
    );
    for(const route of FUNCTION_AUDIT_ROUTES){
      await page.goto(base+'#'+route,{waitUntil:'load'});
      await page.waitForFunction(()=>!!document.querySelector('#live-app')?.textContent?.trim());
      // Give the local asynchronous fixtures time to settle before the sample.
      await page.waitForTimeout(180);
      // The baseline fixture deliberately returns a forged rule first. Inventory
      // both the retry behavior and the REAL UI after a successful synthetic reload,
      // rather than incorrectly counting only the error screen's controls.
      const recoveredRules=route==='regler'&&item.paired;
      if(recoveredRules){
        await page.getByRole('heading',{name:'Kunde inte visa listan'}).waitFor();
        await page.evaluate(()=>{window.__HK_SCHYSSTA_CLEAN_RPC__=true;});
        await page.locator('#schyssta-retry').click();
        await page.getByRole('heading',{name:'Våra överenskommelser'}).waitFor();
        assert.equal(await page.locator('.schyssta-quick-actions [data-schyssta-start]').count(),1,
          'FUN-03: recovered rule view exposes its normal compose action');
      }
      const result=await page.evaluate(({route})=>{
        const root=document.querySelector('#live-app');
        const controls=[...root.querySelectorAll('a[href],button,input,select,textarea,summary')];
        const visible=el=>{
          const s=getComputedStyle(el);
          return !!el.getClientRects().length&&s.display!=='none'&&s.visibility!=='hidden';
        };
        // Inventory text is NOT a complete accessible-name computation. Record
        // its provenance so placeholder-only or missing names can be reviewed
        // without falsely accusing correctly labelled HTML form controls.
        const controlName=el=>{
          const normalize=value=>String(value??'').replace(/\s+/g,' ').trim();
          const tag=el.tagName.toLowerCase();
          const refs=(el.getAttribute('aria-labelledby')||'').split(/\s+/)
            .filter(Boolean).map(id=>document.getElementById(id)?.textContent||'').join(' ');
          const htmlLabels=[...(el.labels||[])].map(label=>label.textContent).join(' ');
          const candidates=[
            ['aria-labelledby',refs],
            ['aria-label',el.getAttribute('aria-label')],
            ['html-label',htmlLabels],
            ['visible-text',['button','a','summary'].includes(tag)?el.textContent:null],
            ['input-value',tag==='input'&&['submit','button','reset'].includes(el.type)?el.value:null],
            ['alt',el.getAttribute('alt')],
            ['title',el.getAttribute('title')],
            ['placeholder-hint',el.getAttribute('placeholder')]
          ];
          const selected=candidates.map(([source,value])=>({source,label:normalize(value)}))
            .find(candidate=>candidate.label);
          const nameSource=selected?.source||'missing';
          return {
            label:selected?.label.slice(0,100)||null,
            nameSource,
            needsManualNameReview:['missing','placeholder-hint','title'].includes(nameSource)
          };
        };
        const fields=controls.filter(visible).map(el=>{
          const attrs={};
          for(const {name,value} of el.attributes){
            if(name.startsWith('data-')&&(name.includes('action')||name.includes('schyssta')||
              name.includes('swipe')||name.includes('pf-')||name.includes('mediator')||
              name.includes('chat')||name.includes('insights')||name.includes('theme')))
              attrs[name]=value.slice(0,80);
          }
          return {tag:el.tagName.toLowerCase(),id:el.id||null,
            ...controlName(el),href:el.getAttribute('href')||null,
            type:el.getAttribute('type')||null,disabled:el.disabled===true,
            form:el.closest('form')?.id||null,data:attrs};
        });
        // Real Chromium DOM probes catch regressions in HTML label association,
        // ARIA references and the distinction between hints and actual names.
        // They are removed before snapshots and never count as app controls.
        const nameProbe=route==='hem'?(()=>{
          const fixture=document.createElement('div');
          fixture.innerHTML='<label for="hk-audit-explicit">Explicit etikett</label>'+
            '<input id="hk-audit-explicit">'+
            '<label>Implicit etikett <textarea></textarea></label>'+
            '<span id="hk-audit-aria">ARIA-referens</span>'+
            '<input id="hk-audit-aria-input" aria-labelledby="hk-audit-aria">'+
            '<input id="hk-audit-hint" placeholder="Enbart platshållare">'+
            '<input id="hk-audit-unnamed">'+
            '<button id="hk-audit-icon" aria-label="Beskrivande knappnamn">✎</button>';
          root.appendChild(fixture);
          const get=selector=>controlName(fixture.querySelector(selector));
          const result={
            explicit:get('#hk-audit-explicit'),
            implicit:get('textarea'),
            aria:get('#hk-audit-aria-input'),
            placeholder:get('#hk-audit-hint'),
            missing:get('#hk-audit-unnamed'),
            button:get('#hk-audit-icon')
          };
          fixture.remove();
          return result;
        })():null;
        const active=[...document.querySelectorAll(
          '#live-mobile-nav a[aria-current="page"],#live-desktop-nav a[aria-current="page"]'
        )].map(x=>x.getAttribute('href'));
        const expected=['insikter'].includes(route)?'#swipe':
          ['nvc','mi-foralder'].includes(route)?'#kommunikation':'#'+route;
        const h1=root.querySelector('h1')?.textContent?.trim()||null;
        return {route,expectedActive:expected,active:[...new Set(active)],heading:h1,
          controls:fields,nameProbe,formIds:[...root.querySelectorAll('form[id]')].map(el=>el.id),
          pageWidth:document.documentElement.scrollWidth,
          viewportWidth:document.documentElement.clientWidth,
          controlCount:fields.length};
      },{route});
      assert.ok(result.heading,'FUN-00 '+item.name+' '+route+' has a page heading');
      assert.ok(result.controlCount>0,'FUN-00 '+item.name+' '+route+' exposes an action/link');
      if(recoveredRules)assert.ok(result.controlCount>=15,
        'FUN-03: normal Schyssta controls must be included, not only an error retry');
      assert.deepEqual(result.active,[result.expectedActive],
        'FUN-01 '+item.name+' '+route+' shows the right active primary navigation');
      assert.ok(result.pageWidth<=result.viewportWidth+2,
        'FUN-01 '+item.name+' '+route+' has no document overflow');
      if(item.role==='teen'&&route==='mi-foralder'){
        assert.match(await page.locator('#live-app').innerText(),/skriven för föräldrar/,
          'FUN-06: teenager sees role-gated explanatory alternative');
        assert.equal(await page.locator('.mi-parent-guide').count(),0,
          'FUN-06: teen cannot see parent-only MI guide');
      }
      if(route==='hem'){
        assert.deepEqual(result.nameProbe,{
          explicit:{label:'Explicit etikett',nameSource:'html-label',needsManualNameReview:false},
          implicit:{label:'Implicit etikett',nameSource:'html-label',needsManualNameReview:false},
          aria:{label:'ARIA-referens',nameSource:'aria-labelledby',needsManualNameReview:false},
          placeholder:{label:'Enbart platshållare',nameSource:'placeholder-hint',needsManualNameReview:true},
          missing:{label:null,nameSource:'missing',needsManualNameReview:true},
          button:{label:'Beskrivande knappnamn',nameSource:'aria-label',needsManualNameReview:false}
        },'FUN-00 name extraction distinguishes HTML labels, ARIA and review-only hints');
      }
      const {nameProbe,...snapshot}=result;
      entries.push({scenario:item.name,role:item.role,paired:item.paired,
        viewportWidth:item.width,environment:'local mocked Chromium',
        evidence:'tests/visual.mjs captureFunctionalInventory',...snapshot,
        ruleRetryRecovered:recoveredRules,
        controlsStatus:'discovered-not-individually-tested'});
    }
    const nav=item.width<500?'#live-mobile-nav':'#live-desktop-nav';
    await page.goto(base+'#hem',{waitUntil:'load'});
    await page.waitForFunction(()=>document.querySelector('#live-app h1'));
    for(const route of FUNCTION_AUDIT_PRIMARY){
      const link=page.locator(nav+' a[href="#'+route+'"]');
      await link.click();
      await page.waitForFunction(expected=>location.hash==='#'+expected,route);
      await page.waitForFunction(expected=>
        !!document.querySelector('#live-app')?.textContent?.trim()&&
        !!document.querySelector('#live-desktop-nav a[href="#'+expected+'"][aria-current="page"]'),
      route);
      navigation.push({scenario:item.name,route,method:'actual synthetic browser click',
        result:'pass'});
    }
    await context.close();
  }
  // Count render occurrences, not distinct controls or verified actions.
  // A placeholder is useful context but is not proof of an accessible name.
  const controls=entries.flatMap(entry=>entry.controls);
  const nameSourceOccurrences={};
  for(const control of controls)
    nameSourceOccurrences[control.nameSource]=(nameSourceOccurrences[control.nameSource]||0)+1;
  const nameReviewCandidates=entries.flatMap(entry=>entry.controls
    .filter(control=>control.needsManualNameReview)
    .map(({id,tag,type,label,nameSource})=>({
      scenario:entry.scenario,route:entry.route,id,tag,type,label,nameSource
    })));
  const summary={
    routeScenarioSnapshots:entries.length,
    visibleControlOccurrences:controls.length,
    primaryNavigationClicks:navigation.length,
    nameSourceOccurrences,
    manualNameReviewOccurrences:nameReviewCandidates.length,
    nameReviewCandidates
  };
  // No private names, messages, or real credentials are collected: all data is mocked.
  const outputPath=path.join(output,'functional-controls-synthetic.json');
  await fs.writeFile(outputPath,JSON.stringify({
    inventory:'FUN-00',commit:process.env.GITHUB_SHA||'local',
    generatedAt:new Date().toISOString(),
    method:'Chromium route rendering, DOM control enumeration, HTML label/ARIA name hints and actual primary-tab clicks',
    caveat:'SYNTHETIC ONLY. Counts are render occurrences across scenarios, NOT unique controls or individually passed functional tests. Name hints are NOT a complete accessible-name/VoiceOver audit; title and placeholder alone need manual review. Real sign-in, API, two-person consent and mobile Safari remain UNTESTED.',
    summary,navigation,entries
  },null,2)+'\n');
  console.log('FUN-00 synthetic inventory: '+entries.length+' route/role/viewport snapshots, '+
    entries.reduce((n,row)=>n+row.controlCount,0)+' visible control occurrences, '+
    navigation.length+' primary navigation clicks.');
}

// FUN-01: real Chromium history navigation with synthetic sessions for both roles.
// Unlike DOM inventory, every item below is clicked, reversed or reloaded.
// FUN-01 / UX-03: CDP dispatches real Chromium touch events, not JS scrollTo.
// These tests are still synthetic emulated-phone tests, not physical iOS Safari.
async function dragMobileTabStrip(page,fromFraction,toFraction){
  const bounds=await page.locator('#live-mobile-nav').boundingBox();
  assert.ok(bounds&&bounds.width>200,'Mobile navigation has a touchable viewport');
  const y=Math.round(bounds.y+bounds.height*.5);
  const startX=Math.round(bounds.x+bounds.width*fromFraction);
  const endX=Math.round(bounds.x+bounds.width*toFraction);
  const client=await page.context().newCDPSession(page);
  try{
    const touch=(x)=>[{x,y,id:1,radiusX:3,radiusY:3,force:1}];
    await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:touch(startX)});
    for(let step=1;step<=14;step++){
      const x=Math.round(startX+(endX-startX)*step/14);
      await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:touch(x)});
      await sleep(16);
    }
    await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }finally{
    await client.detach();
  }
  // Allow native momentum/snap settling. No application scroll position is set.
  await sleep(220);
}
async function verifyTouchMobileTabStrip(){
  const records=[];
  for(const role of ['parent','teen']){
    for(const width of [320,390,430]){
      const m=await freshContext(
        {viewport:{width,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},
        {authenticated:true,paired:true,role}
      );
      try{
        const page=m.page;
        await page.goto(base+'#hem',{waitUntil:'load'});
        await page.locator('#live-mobile-nav a').first().waitFor();
        const state=()=>page.locator('#live-mobile-nav').evaluate(nav=>{
          const tabs=[...nav.querySelectorAll(':scope > a')];
          const navRect=nav.getBoundingClientRect();
          const first=tabs[0].getBoundingClientRect(),last=tabs.at(-1).getBoundingClientRect();
          return {
            left:nav.scrollLeft,max:nav.scrollWidth-nav.clientWidth,
            firstVisible:first.left>=navRect.left-4&&first.right<=navRect.right+4,
            lastVisible:last.left>=navRect.left-4&&last.right<=navRect.right+4,
            tabCount:tabs.length,route:location.hash
          };
        });
        const initial=await state();
        assert.equal(initial.tabCount,8);
        assert.ok(initial.max>250,'All tabs require a meaningful horizontal swipe distance');
        assert.ok(initial.firstVisible,'First tab is visible before swiping');
        assert.equal(initial.route,'#hem');
        await dragMobileTabStrip(page,.83,.17);
        const afterOne=await state();
        assert.ok(afterOne.left>initial.left+45,
          'A real Chromium touch swipe should move the tab strip: '+JSON.stringify({role,width,initial,afterOne}));
        assert.equal(afterOne.route,'#hem','A scroll gesture must not accidentally activate a tab');
        for(let i=0;i<5&&!((await state()).lastVisible);i++)
          await dragMobileTabStrip(page,.83,.17);
        const end=await state();
        assert.ok(end.lastVisible,'Settings tab must be reachable by finger swipe: '+JSON.stringify({role,width,end}));
        await checkOverflow(page,'Native mobile tab strip swiped right '+role+' '+width+'px');
        await capture(page,'fun-01-touch-nav-last-'+role+'-'+width+'.png');
        records.push({role,width,step:'finger swipe right reaches last tab without route change',status:'PASS'});
        const last=await page.locator('#live-mobile-nav a[href="#installningar"]').boundingBox();
        assert.ok(last,'Last tab has a visible tap region');
        await page.touchscreen.tap(last.x+last.width*.5,last.y+last.height*.5);
        await page.getByRole('heading',{name:'Inställningar'}).waitFor();
        assert.equal(await page.locator('#live-mobile-nav a[href="#installningar"]').getAttribute('aria-current'),'page');
        assert.equal((await state()).lastVisible,true,'Active tab remains in view after tapping it');
        records.push({role,width,step:'last tab native touch tap opens settings and stays in view',status:'PASS'});
        // Reverse directly from the actual end position after opening Settings.
        // Reloading Home first is a different user action: it can reset the
        // tab strip while native scroll snap is still settling, making this
        // gesture test intermittent even when the ordinary swipe works.
        for(let i=0;i<7&&!((await state()).firstVisible);i++)
          await dragMobileTabStrip(page,.17,.83);
        const reverse=await state();
        assert.equal(reverse.firstVisible,true,
          'Reverse touch gesture must reach the Home tab: '+JSON.stringify({role,width,reverse}));
        assert.equal(reverse.route,'#installningar',
          'Reverse gesture scrolls the strip without accidentally navigating');
        const home=await page.locator('#live-mobile-nav a[href="#hem"]').boundingBox();
        assert.ok(home,'Home is visible and touchable after reversing the strip');
        await page.touchscreen.tap(home.x+home.width*.5,home.y+home.height*.5);
        await page.waitForURL(/#hem$/);
        await page.locator('#live-mobile-nav a[href="#hem"][aria-current="page"]').waitFor();
        await page.reload({waitUntil:'load'});
        await page.locator('#live-mobile-nav a[href="#hem"][aria-current="page"]').waitFor();
        await page.waitForFunction(()=>{
          const nav=document.querySelector('#live-mobile-nav');
          const home=nav?.querySelector('a[href="#hem"]');
          if(!home)return false;
          const bounds=nav.getBoundingClientRect(),tab=home.getBoundingClientRect();
          return tab.left>=bounds.left-4&&tab.right<=bounds.right+4;
        });
        const reloaded=await state();
        assert.equal(reloaded.route,'#hem','Reload remains on Home');
        assert.equal(reloaded.firstVisible,true,'Reload shows the active Home tab');
        records.push({role,width,step:'reverse touch swipe, Home tap and reload preserve navigation',status:'PASS'});
      }finally{
        await m.context.close();
      }
    }
  }
  await fs.writeFile(path.join(output,'fun-01-native-touch-tabstrip-synthetic.json'),
    JSON.stringify({
      method:'Native Chromium CDP Input.dispatchTouchEvent plus touchscreen.tap on emulated mobile contexts',
      limitations:'Synthetic Chromium touch emulation. Not physical iOS Safari, VoiceOver, or real signed-in users.',
      records
    },null,2)+'\n');
  console.log('FUN-01 native touch tabstrip: '+records.length+' synthetic role/viewport checks passed.');
}

async function verifyBrowserHistory(){
  const records=[];
  for(const item of [
    {role:'parent',width:320,height:720,label:'parent-320'},
    {role:'teen',width:390,height:844,label:'teen-390'},
    {role:'parent',width:1440,height:900,label:'parent-desktop'}
  ]){
    const {context,page}=await freshContext({
      viewport:{width:item.width,height:item.height},deviceScaleFactor:1,
      isMobile:item.width<500,hasTouch:item.width<500
    },{authenticated:true,paired:true,role:item.role});
    const nav=item.width<500?'#live-mobile-nav':'#live-desktop-nav';
    const assertState=async(hash,selected)=>{
      await page.waitForFunction(({hash,selected})=>{
        const tabs=[...document.querySelectorAll('#live-desktop-nav a[aria-current="page"]')];
        return window.location.hash===hash&&tabs.length===1&&tabs[0].getAttribute('href')==='#'+selected
          &&!!document.querySelector('#live-app h1')?.textContent?.trim();
      },{hash,selected});
      assert.equal(await page.locator(nav+' a[aria-current="page"]').getAttribute('href'),'#'+selected);
      await checkOverflow(page,'FUN-01 history '+item.label+' '+hash);
      records.push({case:item.label,hash,active:selected,status:'synthetic Chromium PASS'});
    };
    await assertState('#hem','hem');
    for(const route of ['swipe','personlighet','kommunikation']){
      await page.locator(nav+' a[href="#'+route+'"]').click();
      await assertState('#'+route,route);
    }
    await page.goBack();
    await assertState('#personlighet','personlighet');
    await page.goBack();
    await assertState('#swipe','swipe');
    await page.goForward();
    await assertState('#personlighet','personlighet');
    await page.reload({waitUntil:'load'});
    await assertState('#personlighet','personlighet');

    await page.goto(base+'#kommunikation/pausa',{waitUntil:'load'});
    await assertState('#kommunikation/pausa','kommunikation');
    await page.locator('[data-comm-skill="pausa"][open]').waitFor();
    await page.goto(base+'#nvc',{waitUntil:'load'});
    await assertState('#nvc','kommunikation');
    await page.goBack();
    await assertState('#kommunikation/pausa','kommunikation');
    await page.locator('[data-comm-skill="pausa"][open]').waitFor();
    await page.reload({waitUntil:'load'});
    await page.locator('[data-comm-skill="pausa"][open]').waitFor();

    // Opening an unknown hash must not unlock arbitrary hidden routes.
    await page.goto(base+'#kommunikation/does-not-exist',{waitUntil:'load'});
    await assertState('#kommunikation/does-not-exist','kommunikation');
    assert.equal(await page.locator('.comm-exercise[open]').count(),0,
      'FUN-01 unknown skill route cannot select a non-existent exercise');
    await page.goto(base+'#%E0%A4%A',{waitUntil:'load'});
    await assertState('#%E0%A4%A','hem');
    await context.close();
  }
  await fs.writeFile(path.join(output,'fun-01-browser-history-synthetic.json'),
    JSON.stringify({method:'browser click, history back/forward, reload and deep links',
      limitations:'Synthetic browser sessions. Not authenticated production users or Safari.',
      records},null,2)+'\n');
  console.log('FUN-01 history: '+records.length+
    ' role/viewport history-route assertions passed in synthetic Chromium.');
}

// FUN-02: the teen's understanding-card RPC atomically switches between
// an answer and a private skip. A lost acknowledgement must be reconciled
// using BOTH private tables, with no invented confirmation or extra writes.
async function verifyUnderstandingStateWriteRecheck(){
 const records=[];
 for(const width of [320,390]){
  for(const action of ['answer','skip']){
   for(const scenario of ['ack-lost-after-write','write-rejected','readback-unavailable']){
    const m=await freshContext(
     {viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true},
     {authenticated:true,paired:false,role:'teen'}
    );
    try{
     const page=m.page;
     await page.goto(base+'#swipe',{waitUntil:'load'});
     await page.locator('#swipe-card[aria-label^="Kort 1 av 34"]').waitFor();
     // A-card 1 is answered normally. The next card is B/general-02.
     await page.locator('.swipe-actions [data-swipe="yes"]').click();
     await page.locator('#swipe-card[aria-label^="Kort 2 av 34"]').waitFor();
     assert.equal(await page.locator('[data-importance]').getAttribute('data-card-id'),'general-02');
     assert.equal(await page.locator('#swipe-skip').count(),1);
     await page.evaluate(scenario=>{
      window.__HK_B_STATE_WRITES__=0;
      window.__HK_B_SKIP_READBACKS__=0;
      window.__HK_SWIPE_READBACK_COUNT__=0;
      window.__HK_TEST_B_FAIL_BEFORE_WRITE__=scenario==='write-rejected';
      window.__HK_TEST_B_FAIL_AFTER_WRITE__=scenario!=='write-rejected';
      window.__HK_TEST_B_SKIP_RECHECK_FAIL__=scenario==='readback-unavailable';
     },scenario);
     const click=async()=>{
      if(action==='skip')await page.locator('#swipe-skip').click();
      else await page.locator('.swipe-actions [data-swipe="no"]').click();
     };
     await click();
     if(scenario==='ack-lost-after-write'){
      await page.locator('#swipe-card[aria-label^="Kort 3 av 34"]').waitFor();
      assert.equal(await page.evaluate(()=>window.__HK_B_STATE_WRITES__),1,
       'Lost B acknowledgement cannot trigger a duplicate write');
      assert.equal(await page.evaluate(()=>window.__HK_B_SKIP_READBACKS__),1,
       'B outcome must include one explicit skip readback');
      assert.equal(await page.evaluate(()=>window.__HK_SWIPE_READBACK_COUNT__),1,
       'B outcome must include one explicit answer readback');
     }else{
      await page.locator('#swipe-save-status').getByText(
       scenario==='readback-unavailable'
       ?/går inte att kontrollera om (din överhoppning|ditt svar) sparades/
       :/kunde inte bekräftas som (sparad|sparat)/
      ).waitFor();
      assert.match(await page.locator('#swipe-card').getAttribute('aria-label'),/^Kort 2 av 34/,
       'Unconfirmed B state must not automatically advance');
      assert.equal(await page.evaluate(()=>window.__HK_B_STATE_WRITES__),1);
      assert.equal(await page.evaluate(()=>window.__HK_B_SKIP_READBACKS__),1);
      assert.equal(await page.evaluate(()=>window.__HK_SWIPE_READBACK_COUNT__),1);
      // The person chooses again; the application cannot choose on their behalf.
      await click();
      await page.locator('#swipe-card[aria-label^="Kort 3 av 34"]').waitFor();
      assert.equal(await page.evaluate(()=>window.__HK_B_STATE_WRITES__),2);
     }
     const saved=await page.evaluate(()=>window.__HK_UNDERSTANDING_STATE__?.args);
     assert.equal(saved?.p_card_id,'general-02');
     assert.equal(saved?.p_skipped,action==='skip');
     if(action==='answer')assert.equal(saved?.p_answer,false);
     else assert.equal(saved?.p_answer,null);
     records.push({role:'teen',width,action,scenario,passed:true});
    }finally{await m.context.close();}
   }
  }
 }
 await fs.writeFile(path.join(output,'fun-02-b-state-ack-recheck-synthetic.json'),
  JSON.stringify({method:'Chromium B-card answer/skip clicks with simulated RPC write and per-table private readbacks',
   limitations:'Synthetic Supabase/Auth. Neither real signed-in users nor physical Safari tested.',records},null,2)+'\n');
 console.log('FUN-02 B-state readback: '+records.length+' synthetic Chromium action/viewport/error cases passed.');
}

// FUN-02: the browser may lose a write acknowledgement after the real answer
// was saved. Exercise the production readback path with role/deck-specific clicks.
async function verifySwipeAnswerWriteRecheck(){
 const records=[];
 for(const role of ['parent','teen']){
  const width=role==='parent'?390:320;
  for(const deck of ['general','forandring']){
   for(const scenario of ['ack-lost-after-write','write-rejected','readback-unavailable']){
    const m=await freshContext(
     {viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true},
     {authenticated:true,paired:deck!=='general',unlocked:deck!=='general',role}
    );
    try{
     const page=m.page;
     await page.goto(base+'#swipe',{waitUntil:'load'});
     if(deck!=='general'){
      await page.locator('[data-theme-open="forandring"]').click();
      await page.locator('#swipe-card[aria-label^="Temakort 1 av 8"]').waitFor();
     }
     const card=page.locator('#swipe-card');
     await card.waitFor();
     const original=await card.getAttribute('aria-label');
     const cardId=await page.locator('[data-importance]').getAttribute('data-card-id');
     assert.equal(cardId,deck==='general'?'general-01':'forandring-01',
      'Each case starts with a fresh ordinary A card');
     await page.evaluate(scenario=>{
      window.__HK_SWIPE_UPSERT_CALLS__=0;window.__HK_SWIPE_READBACK_COUNT__=0;
      window.__HK_TEST_SWIPE_FAIL_AFTER_WRITE__=scenario!=='write-rejected';
      window.__HK_TEST_SWIPE_FAIL_BEFORE_WRITE__=scenario==='write-rejected';
      window.__HK_TEST_SWIPE_RECHECK_READ_FAIL__=scenario==='readback-unavailable';
     },scenario);
     await page.locator('.swipe-actions [data-swipe="yes"]').click();
     if(scenario==='ack-lost-after-write'){
      await page.waitForFunction(before=>document.querySelector('#swipe-card')?.getAttribute('aria-label')!==before,original);
      assert.equal(await page.evaluate(()=>window.__HK_SWIPE_READBACK_COUNT__),1,
       'Lost write acknowledgement gets exactly one own-answer readback');
      assert.equal(await page.evaluate(()=>window.__HK_SWIPE_UPSERT_CALLS__),1,
       'Acknowledgement loss does not cause a duplicate write');
     }else{
      await page.locator('#swipe-save-status').getByText(scenario==='write-rejected'
       ?/kunde inte bekräftas som sparat med ditt val/
       :/går inte att kontrollera om ditt svar sparats/).waitFor();
      assert.equal(await card.getAttribute('aria-label'),original,
       'Unconfirmed write must not advance the card');
      assert.equal(await page.evaluate(()=>window.__HK_SWIPE_READBACK_COUNT__),1);
      // A voluntary second click after checking the result may retry safely.
      await page.locator('.swipe-actions [data-swipe="yes"]').click();
      await page.waitForFunction(before=>document.querySelector('#swipe-card')?.getAttribute('aria-label')!==before,original);
      assert.equal(await page.evaluate(()=>window.__HK_SWIPE_UPSERT_CALLS__),2);
     }
     const stored=await page.evaluate(id=>window.__HK_SAVED_SWIPE__?.row?.card_id===id&&window.__HK_SAVED_SWIPE__?.row?.answer===true,cardId);
     assert.equal(stored,true,'Final stored record belongs to the intended A card');
     if(deck!=='general')assert.match(await card.getAttribute('aria-label'),/^Temakort 2 av 8/);
     records.push({role,deck,scenario,passed:true});
    }finally{await m.context.close();}
   }
  }
 }
 await fs.writeFile(path.join(output,'fun-02-answer-write-recheck-synthetic.json'),
  JSON.stringify({method:'Chromium click journeys with one-shot simulated Supabase write acknowledgement loss and exact answer readback',
   limitations:'Mock Auth/RPC and ephemeral in-memory answers, no live Supabase or physical Safari',records},null,2)+'\n');
 console.log('FUN-02 answer readback: '+records.length+' synthetic Chromium role/deck/error cases passed.');
}

// FUN-02: an in-progress private importance write blocks an answer without
// swallowing the click silently. Both the general and a theme deck are tested.
async function verifyImportancePendingAnswerFeedback(){
 const records=[];
 for(const role of ['parent','teen']){
  const width=role==='parent'?390:320;
  const {page,context}=await freshContext(
   {viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true},
   {authenticated:true,paired:true,unlocked:true,role}
  );
  try{
   await page.goto(base+'#swipe',{waitUntil:'load'});
   await page.locator('#swipe-card [data-importance]').waitFor();
   for(const deck of ['general','forandring']){
    if(deck!=='general'){
     await page.locator('[data-theme-open="forandring"]').click();
     await page.locator('#swipe-card[aria-label^="Temakort 1 av 8"]').waitFor();
    }
    const cardBefore=await page.locator('#swipe-card').getAttribute('aria-label');
    const cardId=await page.locator('#swipe-card [data-importance]').getAttribute('data-card-id');
    await page.evaluate(()=>{window.__HK_TEST_BLOCK_IMPORTANCE__=true;});
    await page.locator('#swipe-card [data-importance]').evaluate(el=>{
     el.value='1';el.dispatchEvent(new Event('input',{bubbles:true}));
     el.dispatchEvent(new Event('change',{bubbles:true}));
    });
    await page.waitForFunction(()=>typeof window.__HK_TEST_RELEASE_IMPORTANCE__==='function');
    await page.locator('.swipe-actions [data-swipe="yes"]').click();
    assert.equal(await page.locator('#swipe-card').getAttribute('aria-label'),cardBefore,
     'A card remains while its importance rating is being saved');
    assert.match(await page.locator('#swipe-save-status').innerText(),/Vänta tills viktighetsskattningen har sparats/);
    assert.equal(await page.evaluate(()=>window.__HK_SAVED_SWIPE__?.row?.deck_id=== 'forandring'&&window.__HK_SAVED_SWIPE__?.row?.answer===true),false,
     'An unanswered card cannot be saved by a click during a pending rating');
    await page.evaluate(()=>window.__HK_TEST_RELEASE_IMPORTANCE__());
    await page.locator('#swipe-save-status').getByText(/Viktigheten är sparad/).waitFor();
    assert.equal(await page.locator('#swipe-card').getAttribute('aria-label'),cardBefore);
    await page.locator('.swipe-actions [data-swipe="yes"]').click();
    await page.waitForFunction(({deck,cardId})=>{
      const row=window.__HK_SAVED_SWIPE__?.row,understanding=window.__HK_UNDERSTANDING_STATE__?.args;
      return (row?.deck_id===deck&&row?.card_id===cardId&&row.answer===true)
        ||(deck==='general'&&understanding?.p_card_id===cardId&&understanding.p_answer===true);
    },{deck,cardId});
    await page.waitForFunction(previous=>{
      const next=document.querySelector('#swipe-card')?.getAttribute('aria-label');
      return !!next&&next!==previous;
    },cardBefore);
    if(deck==='forandring')assert.match(await page.locator('#swipe-card').getAttribute('aria-label'),/^Temakort 2 av 8/);
    records.push({role,deck,blockedClickExplained:true,lateSaveRecovery:true});
   }
   await checkOverflow(page,'Pending importance answer '+role+' '+width+'px');
  }finally{await context.close();}
 }
 await fs.writeFile(path.join(output,'fun-02-importance-pending-feedback-synthetic.json'),
  JSON.stringify({method:'Chromium real range change and answer clicks with deliberately delayed synthetic Supabase upsert',
   limitations:'Mock Auth/RPC; real networking and physical devices unverified.',records},null,2)+'\n');
 console.log('FUN-02: '+records.length+' pending-importance UI cases passed in synthetic Chromium.');
}

// FUN-02-IMPORTANCE-ACK-02: exercise the production importance readback
// from real range change events, not just the isolated Node helper.
async function verifyImportanceWriteAckBrowser(){
 const records=[];
 const setRating=async(page,value)=>{
   await page.locator('#swipe-card [data-importance]').evaluate((el,next)=>{
     el.value=String(next);
     el.dispatchEvent(new Event('input',{bubbles:true}));
     el.dispatchEvent(new Event('change',{bubbles:true}));
   },value);
 };
 for(const role of ['parent','teen']){
  const width=role==='parent'?390:320;
  for(const deck of ['general','forandring']){
   for(const scenario of ['ack-lost-after-write','write-rejected','readback-unavailable']){
    const m=await freshContext(
     {viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true},
     {authenticated:true,paired:deck!=='general',unlocked:deck!=='general',role}
    );
    try{
     const page=m.page;
     await page.goto(base+'#swipe',{waitUntil:'load'});
     if(deck==='forandring'){
       await page.locator('[data-theme-open="forandring"]').click();
       await page.locator('#swipe-card[aria-label^="Temakort 1 av 8"]').waitFor();
     }
     const slider=page.locator('#swipe-card [data-importance]');
     await slider.waitFor();
     assert.equal(await slider.getAttribute('data-card-id'),
       deck==='general'?'general-01':'forandring-01');
     assert.equal(await slider.inputValue(),'0');
     const before=await page.locator('#swipe-card').getAttribute('aria-label');
     await page.evaluate(scenario=>{
       window.__HK_IMPORTANCE_WRITE_COUNT__=0;
       window.__HK_IMPORTANCE_ACK_READBACKS__=0;
       window.__HK_TEST_IMPORTANCE_FAIL_AFTER_WRITE__=scenario!=='write-rejected';
       window.__HK_TEST_IMPORTANCE_FAIL_BEFORE_WRITE__=scenario==='write-rejected';
       window.__HK_TEST_IMPORTANCE_READBACK_FAIL__=scenario==='readback-unavailable';
     },scenario);
     await setRating(page,1);
     if(scenario==='ack-lost-after-write'){
       await page.locator('[data-importance-status]').getByText(/Viktighet sparad privat/).waitFor();
       assert.equal(await slider.inputValue(),'1');
       assert.equal(await slider.getAttribute('aria-valuetext'),'Mycket viktigt');
     }else{
       await page.locator('[data-importance-status]').getByText(scenario==='write-rejected'
         ?/kunde inte bekräftas som sparad/i
         :/går inte att kontrollera om viktigheten sparades/i).waitFor();
       assert.equal(await slider.inputValue(),'0','Unconfirmed choice shows last locally confirmed rating');
       assert.equal(await slider.getAttribute('aria-valuetext'),'Neutral, inte prioriterad');
       await setRating(page,1);
       await page.locator('[data-importance-status]').getByText(/Viktighet sparad privat/).waitFor();
       assert.equal(await slider.inputValue(),'1','Manual retry can be saved');
     }
     assert.equal(await page.locator('#swipe-card').getAttribute('aria-label'),before,
       'Saving an importance rating alone never answers or advances a card');
     assert.equal(await page.evaluate(()=>window.__HK_IMPORTANCE_ACK_READBACKS__),1,
       'One exact own-rating readback must follow a lost write acknowledgement');
     assert.equal(await page.evaluate(()=>window.__HK_IMPORTANCE_WRITE_COUNT__),
       scenario==='ack-lost-after-write'?1:2,'No duplicate write on confirmed readback');
     const stored=await page.evaluate(()=>window.__HK_SAVED_IMPORTANCE__?.row);
     assert.equal(stored?.deck_id,deck);
     assert.equal(stored?.card_id,deck==='general'?'general-01':'forandring-01');
     assert.equal(stored?.importance,1);
     assert.equal(stored?.user_id,role==='teen'
       ?'10000000-0000-0000-0000-000000000002'
       :'10000000-0000-0000-0000-000000000001');
     records.push({role,width,deck,scenario,writeCount:scenario==='ack-lost-after-write'?1:2,
       readbacks:1,passed:true});
    }finally{await m.context.close();}
   }
   // A newer slider choice must not be thrown away if the older write loses its ACK.
   const m=await freshContext(
    {viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true},
    {authenticated:true,paired:deck!=='general',unlocked:deck!=='general',role}
   );
   try{
    const page=m.page;
    await page.goto(base+'#swipe',{waitUntil:'load'});
    if(deck==='forandring'){
      await page.locator('[data-theme-open="forandring"]').click();
      await page.locator('#swipe-card[aria-label^="Temakort 1 av 8"]').waitFor();
    }
    await page.locator('#swipe-card [data-importance]').waitFor();
    await page.evaluate(()=>{
      window.__HK_IMPORTANCE_WRITE_COUNT__=0;
      window.__HK_IMPORTANCE_ACK_READBACKS__=0;
      window.__HK_TEST_BLOCK_IMPORTANCE__=true;
      window.__HK_TEST_IMPORTANCE_FAIL_AFTER_WRITE__=true;
    });
    await setRating(page,-1);
    await page.waitForFunction(()=>typeof window.__HK_TEST_RELEASE_IMPORTANCE__==='function');
    await setRating(page,1);
    await page.evaluate(()=>window.__HK_TEST_RELEASE_IMPORTANCE__());
    await page.locator('[data-importance-status]').getByText(/Viktighet sparad privat/).waitFor();
    assert.equal(await page.locator('#swipe-card [data-importance]').inputValue(),'1');
    assert.equal(await page.evaluate(()=>window.__HK_SAVED_IMPORTANCE__?.row?.importance),1);
    assert.equal(await page.evaluate(()=>window.__HK_IMPORTANCE_WRITE_COUNT__),2);
    assert.equal(await page.evaluate(()=>window.__HK_IMPORTANCE_ACK_READBACKS__),1);
    records.push({role,width,deck,scenario:'queued-newer-choice-survives-lost-ack',
      writeCount:2,readbacks:1,passed:true});
   }finally{await m.context.close();}
  }
 }
 await fs.writeFile(path.join(output,'fun-02-importance-write-ack-browser-synthetic.json'),
  JSON.stringify({method:'Real Chromium range input/change events and intercepted in-memory Supabase write/readback',
   limitations:'Synthetic Auth and in-memory mock database; not live Supabase, authenticated users or physical iOS.',
   records},null,2)+'\n');
 console.log('FUN-02 importance ACK: '+records.length+' synthetic Chromium role/deck/error/queue cases passed.');
}

// FUN-02: actually open, answer and resume EVERY theme deck for both synthetic
// roles. Finishes one short deck to exercise completion and revisiting saved cards.
// This never requests or writes live Supabase data.
async function verifyAllThemeDeckJourneys(){
  const decks=[
    {id:'samtal',length:104},{id:'aktiviteter',length:104},
    {id:'regler',length:12},{id:'uppskattning',length:8},
    {id:'aterhamtning',length:8},{id:'forandring',length:8}
  ];
  const records=[];
  for(const role of ['parent','teen']){
    const width=role==='parent'?390:320;
    const {page,context}=await freshContext(
      {viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true},
      {authenticated:true,paired:true,role,unlocked:true}
    );
    await page.goto(base+'#swipe',{waitUntil:'load'});
    await page.locator('[data-theme-open="samtal"]').waitFor();
    assert.equal(await page.locator('[data-theme-open]').count(),6,
      'FUN-02: all six named decks can be opened with a valid paired synthetic session');
    const currentId=role==='parent'
      ?'10000000-0000-0000-0000-000000000001'
      :'10000000-0000-0000-0000-000000000002';
    for(const [index,deck] of decks.entries()){
      const button=page.locator('[data-theme-open="'+deck.id+'"]');
      await button.click();
      const first=page.locator('#swipe-card[aria-label^="Temakort 1 av '+deck.length+'"]');
      await first.waitFor();
      assert.equal(await page.locator('.swipe-private-review').count(),0,
        'FUN-02 new deck must not inherit a different deck private answer history');
      const choice=index%2===0?'yes':'no';
      await page.locator('[data-swipe="'+choice+'"]').click();
      await page.locator('#swipe-card[aria-label^="Temakort 2 av '+deck.length+'"]').waitFor();
      const saved=await page.evaluate(()=>window.__HK_SAVED_SWIPE__);
      assert.equal(saved.row.deck_id,deck.id,'FUN-02 write uses current theme deck ID');
      assert.equal(saved.row.card_id,deck.id+'-01','FUN-02 first answer uses canonical card ID');
      assert.equal(saved.row.answer,choice==='yes','FUN-02 persists YES or NO literally');
      assert.equal(saved.row.user_id,currentId,'FUN-02 stores answer for current signed-in role');
      assert.equal(saved.options.onConflict,'user_id,deck_id,card_id');
      await page.locator('#theme-back').click();
      assert.match(await page.locator('[data-theme-open="'+deck.id+'"]').locator('..').innerText(),
        new RegExp('Din privata status: 1 / '+deck.length),
        'FUN-02 status is per deck after saving one answer');
      await page.locator('[data-theme-open="'+deck.id+'"]').click();
      await page.locator('#swipe-card[aria-label^="Temakort 2 av '+deck.length+'"]').waitFor();
      await checkOverflow(page,'FUN-02 '+role+' '+deck.id+' first answer and resume');
      records.push({role,deck:deck.id,cards:deck.length,
        firstAnswer:choice,firstCardSaved:true,nextCardResumed:true,
        environment:'synthetic Chromium'});
      await page.locator('#theme-back').click();
    }
    // The last deck has eight cards. Complete it to cover the finished,
    // restart and edit paths without skipping untested cards.
    await page.locator('[data-theme-open="forandring"]').click();
    await page.locator('#swipe-card[aria-label^="Temakort 2 av 8"]').waitFor();
    for(let n=2;n<=8;n++){
      await page.locator('#swipe-card[aria-label^="Temakort '+n+' av 8"]').waitFor();
      await page.locator('[data-swipe="'+(n%2===0?'yes':'no')+'"]').click();
    }
    await page.locator('.swipe-finished').getByText('Alla 8 kort i Alla kategorier är sparade').waitFor();
    assert.match(await page.locator('.swipe-private-review summary').innerText(),
      /Visa mina 8 besvarade kort/,'FUN-02 completed deck retains eight private saved answers');
    await page.locator('.swipe-finished summary').click();
       await page.locator('#theme-restart').click();
    await page.locator('#swipe-card[aria-label^="Temakort 1 av 8"]').waitFor();
    await page.locator('[data-swipe="yes"]').click(); // previously NO for deck #6
    await page.waitForFunction(()=>window.__HK_SAVED_SWIPE__?.row?.card_id==='forandring-01'
      &&window.__HK_SAVED_SWIPE__?.row?.answer===true);
    const updatedFirst=page.locator('.swipe-private-review [data-theme-review-index="0"]').locator('..');
    assert.equal(await updatedFirst.getAttribute('data-private-theme-answer'),'yes',
      'FUN-02 restarting and editing a completed deck changes only its own first answer');
    assert.match(await updatedFirst.textContent(),/Ditt svar: Ja/);
    records.push({role,deck:'forandring',step:'all-eight-complete-restart-and-edit',
      passed:true,environment:'synthetic Chromium'});
    // FUN-02: also finish the other three short decks, which already have one
    // saved answer from the opening/resume checks above.
    for(const deck of [
      {id:'regler',length:12,initialFirst:'yes'},
      {id:'uppskattning',length:8,initialFirst:'no'},
      {id:'aterhamtning',length:8,initialFirst:'yes'}
    ]){
      await page.locator('#theme-back').click();
      await page.locator('[data-theme-open="'+deck.id+'"]').click();
      await page.locator('#swipe-card[aria-label^="Temakort 2 av '+deck.length+'"]').waitFor();
      for(let n=2;n<=deck.length;n++){
        await page.locator('#swipe-card[aria-label^="Temakort '+n+' av '+deck.length+'"]').waitFor();
        await page.locator('[data-swipe="'+(n%2===0?'yes':'no')+'"]').click();
      }
      await page.locator('.swipe-finished').getByText('Alla '+deck.length+' kort i Alla kategorier är sparade').waitFor();
      assert.match(await page.locator('.swipe-private-review summary').innerText(),
        new RegExp('Visa mina '+deck.length+' besvarade kort'),
        'FUN-02 completed short deck lists every saved private answer');
      await checkOverflow(page,'FUN-02 '+role+' '+deck.id+' completed');
      await page.locator('.swipe-finished summary').click();
       await page.locator('#theme-restart').click();
      await page.locator('#swipe-card[aria-label^="Temakort 1 av '+deck.length+'"]').waitFor();
      const changed=deck.initialFirst==='yes'?'no':'yes';
      await page.locator('[data-swipe="'+changed+'"]').click();
      await page.locator('#swipe-card[aria-label^="Temakort 2 av '+deck.length+'"]').waitFor();
      const saved=await page.evaluate(()=>window.__HK_SAVED_SWIPE__);
      assert.equal(saved.row.deck_id,deck.id,'FUN-02 short-deck edit uses same deck');
      assert.equal(saved.row.card_id,deck.id+'-01','FUN-02 short-deck edit uses first card');
      assert.equal(saved.row.answer,changed==='yes','FUN-02 short-deck edit replaces earlier answer');
      const changedFirst=page.locator('.swipe-private-review [data-theme-review-index="0"]').locator('..');
      assert.equal(await changedFirst.getAttribute('data-private-theme-answer'),changed,
        'FUN-02 edited answer appears in private review');
      records.push({role,deck:deck.id,step:'all-'+deck.length+'-complete-restart-and-edit',
        passed:true,environment:'synthetic Chromium'});
    }
    await context.close();
  }
  await fs.writeFile(path.join(output,'fun-02-all-decks-synthetic.json'),
    JSON.stringify({method:'Real Chromium clicks through all six decks for two mocked roles',
      limitations:'Short decks fully clicked for both roles; long decks are exercised in fun-02-long-decks-synthetic.json. No real Supabase or second signed-in account.',
      records},null,2)+'\n');
  console.log('FUN-02 all-decks: '+records.length+
    ' role/deck test records passed (12 open/save/resume plus 8 short-deck completions).');
}


// FUN-02: fully play through the two 104-card theme decks as both synthetic
// roles. Assert every stable card ID, 104 private writes, completion, re-entry,
// and restart/edit without contacting a real account or Supabase.
async function verifyLongThemeDeckJourneys(){
  const decks=['samtal','aktiviteter'];
  const records=[];
  for(const role of ['parent','teen']){
    const width=role==='parent'?390:320;
    const currentId=role==='parent'
      ?'10000000-0000-0000-0000-000000000001'
      :'10000000-0000-0000-0000-000000000002';
    const {page,context}=await freshContext(
      {viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true},
      {authenticated:true,paired:true,role,unlocked:true}
    );
    try{
      await page.goto(base+'#swipe',{waitUntil:'load'});
      await page.locator('[data-theme-open="samtal"]').waitFor();
      for(const deck of decks){
        await page.locator('[data-theme-open="'+deck+'"]').click();
        for(let n=1;n<=104;n++){
          const cardId=deck+'-'+String(n).padStart(2,'0');
          await page.locator('#swipe-card[aria-label^="Temakort '+n+' av 104"]').waitFor();
          const answer=n%2===0?'no':'yes';
          await page.locator('[data-swipe="'+answer+'"]').click();
          if(n===1||n===52||n===104){
            const saved=await page.evaluate(()=>window.__HK_SAVED_SWIPE__);
            assert.equal(saved.row.user_id,currentId,'FUN-02 long deck saves the correct role');
            assert.equal(saved.row.deck_id,deck,'FUN-02 long deck saves the current deck');
            assert.equal(saved.row.card_id,cardId,'FUN-02 stable ID for card '+n);
            assert.equal(saved.row.answer,answer==='yes','FUN-02 saved answer for card '+n);
            assert.equal(saved.options.onConflict,'user_id,deck_id,card_id');
          }
        }
        await page.locator('.swipe-finished').getByText('Alla 104 kort i Alla kategorier är sparade').waitFor();
        assert.match(await page.locator('.swipe-private-review summary').innerText(),
          /Visa mina 104 besvarade kort/,'FUN-02 finished long deck shows all saved private answers');
        await checkOverflow(page,'FUN-02 '+role+' '+deck+' completed 104 cards');
        await page.locator('#theme-back').click();
        assert.match(await page.locator('[data-theme-open="'+deck+'"]').locator('..').innerText(),
          /Din privata status: 104 \/ 104/,'FUN-02 long-deck progress survives leaving the deck');
        await page.locator('[data-theme-open="'+deck+'"]').click();
        await page.locator('.swipe-finished').getByText('Alla 104 kort i Alla kategorier är sparade').waitFor();
        await page.locator('.swipe-finished summary').click();
       await page.locator('#theme-restart').click();
        await page.locator('#swipe-card[aria-label^="Temakort 1 av 104"]').waitFor();
        await page.locator('[data-swipe="no"]').click(); // initially YES
        await page.waitForFunction(expected=>window.__HK_SAVED_SWIPE__?.row?.card_id===expected
          &&window.__HK_SAVED_SWIPE__?.row?.answer===false,cardIdForDeck(deck));
        const edited=page.locator('.swipe-private-review [data-theme-review-index="0"]').locator('..');
        assert.equal(await edited.getAttribute('data-private-theme-answer'),'no',
          'FUN-02 restart edits the first previously completed card');
        records.push({role,deck,totalCards:104,answered:104,
          checkpoints:[1,52,104],completion:true,reopen:true,restartAndEdit:true,
          environment:'synthetic Chromium',liveAuth:false});
        await page.locator('#theme-back').click();
      }
    }finally{
      await context.close();
    }
  }
  await fs.writeFile(path.join(output,'fun-02-long-decks-synthetic.json'),
    JSON.stringify({method:'Actual UI clicks for all 104 cards in two decks and two mocked roles',
      limitations:'In-memory mocked Supabase and Auth; not a real shared family, device or live Worker.',
      records},null,2)+'\n');
  console.log('FUN-02 long decks: '+records.length+
    ' complete 104-card role/deck journeys passed in synthetic Chromium.');
}
function cardIdForDeck(deck){return deck+'-01';}


// FUN-02.05: two-role shared-insights UI paths, including revoked, malformed,
// error and retry states. Uses mocked RPCs only, never real family responses.
async function verifyInsightsTwoRolesAndStates(){
  const records=[];
  for(const role of ['parent','teen']){
    const width=role==='parent'?390:320;
    const {page,context}=await freshContext(
      {viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true},
      {authenticated:true,paired:true,role,unlocked:true}
    );
    try{
      await page.goto(base+'#insikter',{waitUntil:'load'});
      await page.waitForFunction(()=>document.querySelectorAll('.insights-deck .swipe-match-list li').length===3);
      assert.equal(await page.locator('.insights-deck').count(),2);
      // VIS-00-03: real shared content appears early, while the precise sharing
      // explanation remains reachable by keyboard instead of dominating mobile.
      const insightsHeader=await page.locator('.insights-heading').boundingBox();
      const firstFact=await page.locator('.insights-view .swipe-fact-summary').boundingBox();
      const viewportHeight=page.viewportSize().height;
      assert.ok(insightsHeader&&insightsHeader.height<230,
        'Shared-insights heading must fit a compact first mobile screen: '+role);
      assert.ok(firstFact&&firstFact.y<viewportHeight*.76,
        'First server-verified insight overview must begin in the upper viewport: '+role);
      const disclosure=page.locator('.insights-method');
      assert.equal(await disclosure.getAttribute('open'),null,
        'Detailed server/messaging explanation starts collapsed');
      assert.equal(await disclosure.locator('p').isVisible(),false,
        'No detailed method paragraph crowds out the first results');
      await disclosure.locator('summary').focus();
      await page.keyboard.press('Enter');
      assert.equal(await disclosure.locator('p').isVisible(),true,
        'Keyboard expands exact server-verification and voluntary-draft explanation');
      assert.match(await disclosure.locator('p').innerText(),/serververifierade JA\+JA/);
      assert.match(await disclosure.locator('p').innerText(),/utan att något skickas automatiskt/);
      await page.keyboard.press('Enter');
      assert.equal(await disclosure.locator('p').isVisible(),false);
      await capture(page,'mobile-'+width+'-insights-first-screen.png');
      const b=await page.locator('#insights-understanding').innerText();
      if(role==='teen'){
        assert.match(b,/Jag vill helst prata färdigt innan någon kommer med råd/);
        assert.doesNotMatch(b,/Tonåringen vill få prata färdigt innan du kommer med råd/);
      }else{
        assert.match(b,/Tonåringen vill få prata färdigt innan du kommer med råd/);
        assert.doesNotMatch(b,/Jag vill helst prata färdigt innan någon kommer med råd/);
      }
      await checkOverflow(page,'FUN-02 insights '+role+' initial');
      records.push({role,case:'matched-A-and-role-specific-B',passed:true});

      // A and B shares both withdrawn from simulated RPC results.
      await page.evaluate(()=>{
        window.__HK_TEST_SHARED_MATCHES__=[];
        window.__HK_TEST_SET_SHARED_B__([]);
      });
      await page.locator('#insights-retry').click();
      await page.waitForFunction(()=>document.querySelector('.insights-view')?.textContent?.includes('Inga gemensamma ja-svar att visa ännu'));
      assert.equal(await page.locator('.insights-deck').count(),0);
      assert.match(await page.locator('#insights-understanding').innerText(),/Inga förståelsekort är aktivt delade/);
      records.push({role,case:'zero-A-and-revoked-B-empty-state',passed:true});

      // Mixed rows include wrong deck, NO and an obsolete ID. None are shown.
      await page.evaluate(()=>{
        window.__HK_TEST_SHARED_MATCHES__=[
          {deck_id:'aktiviteter',card_id:'aktiviteter-01',answer:true},
          {deck_id:'aktiviteter',card_id:'aktiviteter-02',answer:false},
          {deck_id:'general',card_id:'general-02',answer:true},
          {deck_id:'samtal',card_id:'samtal-999',answer:true}
        ];
        window.__HK_TEST_SET_SHARED_B__(['general-02']);
      });
      await page.locator('#insights-retry').click();
      await page.locator('#insights-deck-aktiviteter').waitFor();
      assert.equal(await page.locator('.insights-deck').count(),1);
      assert.equal(await page.locator('.insights-deck .swipe-match-list li').count(),1);
      assert.equal(await page.locator('[data-insight-activity]').count(),1);
      assert.match(await page.locator('#insights-understanding').innerText(),/prata färdigt/);
      records.push({role,case:'allowlisted-A-and-independent-B',passed:true});

      // A failing RPC must erase both current A and B, and retry must recover.
      await page.evaluate(()=>{window.__HK_RPC_UNAVAILABLE__=true;});
      await page.locator('#insights-retry').click();
      await page.locator('.insights-view [role="alert"]').waitFor();
      assert.equal(await page.locator('.insights-deck').count(),0);
      assert.equal(await page.locator('#insights-understanding').count(),0);
      await page.evaluate(()=>{window.__HK_RPC_UNAVAILABLE__=false;});
      await page.locator('#insights-retry').click();
      await page.locator('#insights-deck-aktiviteter').waitFor();
      assert.equal(await page.locator('.insights-deck .swipe-match-list li').count(),1);
      await checkOverflow(page,'FUN-02 insights '+role+' after retry');
      records.push({role,case:'failed-RPC-clears-and-retry-reloads',passed:true});
    }finally{
      await context.close();
    }
  }
  await fs.writeFile(path.join(output,'fun-02-insights-role-states-synthetic.json'),
    JSON.stringify({method:'actual Chromium controls and mocked all-deck RPCs',
      limitations:'Not real Auth, real consent changes, live Supabase or a physical phone.',
      records},null,2)+'\n');
  console.log('FUN-02 insights: '+records.length+' synthetic role/state cases passed.');
}


// FUN-04: exercise actual IPIP radio clicks when a response is lost or rejected.
// These sessions use mock Supabase; never touch the real pilot accounts.
async function verifyIpip50WriteAckBrowser(){
 const records=[];
 for(const role of ['parent','teen']){
  const width=role==='parent'?390:320;
  for(const scenario of ['ack-lost-after-commit','rejected-before-commit','readback-unavailable']){
   const m=await freshContext({viewport:{width,height:844},deviceScaleFactor:1,
     isMobile:true,hasTouch:true},{authenticated:true,paired:false,role});
   try{
    const page=m.page;
    await page.goto(base+'#personlighet',{waitUntil:'load'});
    await page.getByRole('button',{name:'Börja testet'}).click();
    await page.getByText('Fråga 1 av 50').waitFor();
    await page.evaluate(scenario=>{
      window.__HK_PERSONALITY_WRITE_COUNT__=0;
      window.__HK_PERSONALITY_READBACK_COUNT__=0;
      window.__HK_TEST_PF_FAIL_AFTER_WRITE__=scenario!=='rejected-before-commit';
      window.__HK_TEST_PF_FAIL_BEFORE_WRITE__=scenario==='rejected-before-commit';
      window.__HK_TEST_PF_RECHECK_READ_FAIL__=scenario==='readback-unavailable';
    },scenario);
    await page.locator('input[data-pf-answer="ipip50-001"][value="4"]').check();
    if(scenario==='ack-lost-after-commit'){
      await page.getByText('Fråga 2 av 50').waitFor();
      assert.equal(await page.locator('[data-pf-action="verify-save"]').count(),0);
    }else if(scenario==='rejected-before-commit'){
      await page.waitForTimeout(1150);
      const state=await page.evaluate(()=>({
        status:document.querySelector('.pf-status')?.innerText||null,
        question:document.querySelector('.pf-counter')?.innerText||null,
        writes:window.__HK_PERSONALITY_WRITE_COUNT__,
        readbacks:window.__HK_PERSONALITY_READBACK_COUNT__,
        failBefore:window.__HK_TEST_PF_FAIL_BEFORE_WRITE__,
        savedRow:window.__HK_PERSONALITY_SAVE__?.row||null
      }));
      console.log('FUN-04 rejected-write diagnostic:',JSON.stringify({role,...state}));
      await page.locator('.pf-status').filter({hasText:/kunde inte bekräftas som sparat/i}).waitFor();
      assert.match(await page.locator('.pf-survey').innerText(),/Fråga 1 av 50/);
      assert.equal(await page.locator('[data-pf-action="verify-save"]').count(),0);
      await page.locator('input[data-pf-answer="ipip50-001"][value="3"]').check();
      await page.getByText('Fråga 2 av 50').waitFor();
      assert.equal(await page.evaluate(()=>window.__HK_PERSONALITY_SAVE__?.row?.answer?.value),3);
    }else{
      await page.locator('.pf-status').filter({hasText:/går inte att kontrollera om svaret sparades/i}).waitFor();
      await page.getByRole('button',{name:'Kontrollera sparat svar'}).click();
      await page.getByRole('button',{name:'Fortsätt testet'}).waitFor();
      assert.match(await page.locator('.pf-overview').innerText(),/1 av 50/);
      await page.getByRole('button',{name:'Fortsätt testet'}).click();
      await page.getByText('Fråga 2 av 50').waitFor();
    }
    assert.equal(await page.evaluate(()=>window.__HK_PERSONALITY_READBACK_COUNT__),1);
    assert.equal(await page.evaluate(()=>window.__HK_PERSONALITY_WRITE_COUNT__),
      scenario==='rejected-before-commit'?2:1);
    const row=await page.evaluate(()=>window.__HK_PERSONALITY_SAVE__?.row);
    assert.equal(row?.user_id,role==='teen'
      ?'10000000-0000-0000-0000-000000000002'
      :'10000000-0000-0000-0000-000000000001');
    assert.equal(row?.instrument_id,'ipip50-sv-v1');
    assert.equal(row?.question_id,'ipip50-001');
    assert.equal(row?.answer?.value,scenario==='rejected-before-commit'?3:4);
    await checkOverflow(page,'FUN-04 write ACK '+role+' '+scenario);
    records.push({role,width,scenario,passed:true});
   }finally{await m.context.close();}
  }
 }
 await fs.writeFile(path.join(output,'fun-04-ipip50-answer-ack-browser-synthetic.json'),
   JSON.stringify({method:'Chromium IPIP-50 radio clicks with intercepted private answer writes and owner-scoped readback',
     limitations:'Only mocked Auth/Supabase; not two real authenticated accounts or physical Safari',records},null,2)+'\n');
 console.log('FUN-04 IPIP-50 ACK: '+records.length+' synthetic Chromium cases passed.');
}

// FUN-04: complete the actual IPIP-50 survey UI for both mocked roles;
// pause, navigate away, resume, revise a saved answer, finish, export and
// reopen. All answers are stored only in the in-memory Chromium stand-in.
async function verifyFullPersonalitySurvey(){
  const records=[];
  for(const role of ['parent','teen']){
    const width=role==='parent'?390:320;
    const {page,context}=await freshContext(
      {viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true},
      {authenticated:true,paired:false,role}
    );
    try{
      await page.goto(base+'#personlighet',{waitUntil:'load'});
      await page.getByRole('button',{name:'Börja testet'}).waitFor();
      await page.getByRole('button',{name:'Börja testet'}).click();
      await page.getByText('Fråga 1 av 50').waitFor();
      await page.locator('input[data-pf-answer="ipip50-001"][value="4"]').check();
      await page.getByText('Fråga 2 av 50').waitFor();
      const initial=await page.evaluate(()=>window.__HK_PERSONALITY_SAVE__);
      assert.equal(initial.row.question_id,'ipip50-001','FUN-04: first stable item ID is saved');
      assert.equal(initial.row.answer.value,4,'FUN-04: first answer is persisted privately in the mock');
      await page.getByRole('button',{name:'Spara och avsluta för nu'}).click();
      assert.match(await page.locator('.pf-overview').innerText(),/1 av 50/);
      // Navigation away and back should not reset the current private account
      // or restart the form from the beginning.
      await page.evaluate(()=>{location.hash='hem';});
      await page.getByRole('heading',{name:/Hej[ ,]+Prov/}).waitFor();
      await page.evaluate(()=>{location.hash='personlighet';});
      await page.getByRole('button',{name:'Fortsätt testet'}).waitFor();
      await page.getByRole('button',{name:'Fortsätt testet'}).click();
      await page.getByText('Fråga 2 av 50').waitFor();
      await page.getByRole('button',{name:'Föregående'}).click();
      await page.getByText('Fråga 1 av 50').waitFor();
      assert.equal(await page.locator('input[data-pf-answer="ipip50-001"][value="4"]').isChecked(),true,
        'FUN-04: resuming and returning to question one recovers the saved answer');
      await page.locator('input[data-pf-answer="ipip50-001"][value="2"]').check();
      await page.getByText('Fråga 2 av 50').waitFor();
      const revised=await page.evaluate(()=>window.__HK_PERSONALITY_SAVE__);
      assert.equal(revised.row.question_id,'ipip50-001');
      assert.equal(revised.row.answer.value,2,'FUN-04: revising the first saved answer works');

      for(let n=2;n<=50;n++){
        const id='ipip50-'+String(n).padStart(3,'0');
        await page.getByText('Fråga '+n+' av 50').waitFor();
        await page.locator('input[data-pf-answer="'+id+'"][value="4"]').check();
        if([2,25,49,50].includes(n)){
          const saved=await page.evaluate(()=>window.__HK_PERSONALITY_SAVE__);
          assert.equal(saved.row.question_id,id,'FUN-04: persisted stable item '+n);
          assert.equal(saved.row.answer.value,4,'FUN-04: persisted choice on item '+n);
        }
      }
      await page.getByRole('heading',{name:'Din profil'}).waitFor();
      assert.equal(await page.locator('.pf-scale-row').count(),5,
        'FUN-04: five scales are shown after the 50th answer');
      assert.equal(await page.locator('.pf-table tbody tr').count(),5);
      assert.equal(await page.locator('input[data-pf-answer]').count(),0,
        'FUN-04: final question exits survey mode');
      const download=page.waitForEvent('download');
      await page.getByRole('button',{name:'Exportera mina egna svar (JSON)'}).click();
      const exportFile=await download;
      const payload=JSON.parse(await fs.readFile(await exportFile.path(),'utf8'));
      assert.equal(payload.answered_count,50,'FUN-04: export includes all 50 answers');
      assert.equal(payload.responses.length,50);
      assert.equal(Object.hasOwn(payload,'partner'),false,
        'FUN-04: export does not silently include another person');
      await page.getByRole('button',{name:'Granska eller ändra mina svar'}).click();
      await page.getByText('Fråga 1 av 50').waitFor();
      assert.equal(await page.locator('input[data-pf-answer="ipip50-001"][value="2"]').isChecked(),true,
        'FUN-04: review mode displays the revised answer, not the original choice');
      await page.getByRole('button',{name:'Spara och avsluta för nu'}).click();
      await page.getByRole('heading',{name:'Din profil'}).waitFor();
      await checkOverflow(page,'FUN-04 '+role+' complete profile '+width+'px');
      await capture(page,'fun-04-ipip50-complete-'+role+'.png');
      records.push({role,viewport:width,answered:50,paused:true,resumedAfterNavigation:true,
        firstAnswerRevised:true,profileVisible:true,exportedItems:50,reviewed:true,
        environment:'synthetic Chromium',liveAuth:false});
    }finally{
      await context.close();
    }
  }
  await fs.writeFile(path.join(output,'fun-04-ipip50-complete-synthetic.json'),
    JSON.stringify({method:'Actual UI selection and save for all 50 IPIP items per mocked role',
      limitations:'Auth and database are mocked; no two real users, physical mobile or real Supabase writes.',
      records},null,2)+'\n');
  console.log('FUN-04 IPIP-50: '+records.length+' complete synthetic role journeys passed.');
}


// PF-05: two server-like completed attempts on one day, actual browser actions.
// A synthetic in-memory backend is seeded; no real user's answers are accessed.
async function verifyDistinctPrivateRetestHistory(){
  const records=[];
  for(const role of ['parent','teen']){
    const width=role==='parent'?390:320;
    const m=await freshContext(
      {viewport:{width,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},
      {authenticated:true,paired:false,role,personalityComplete:true,
        privateRetests:true,preloadedRetestHistory:true}
    );
    try{
      const page=m.page;
      await page.goto(base+'#personlighet',{waitUntil:'load'});
      const rows=page.locator('.pf-retest-list > li');
      await page.waitForFunction(()=>document.querySelectorAll('.pf-retest-list > li').length===2);
      assert.match(await rows.nth(0).innerText(),/Omtest 1 av 2/);
      assert.match(await rows.nth(1).innerText(),/Omtest 2 av 2/);
      assert.match(await rows.nth(0).locator('[data-ipip-retest="view"]').getAttribute('aria-label'),
        /Visa mitt resultat för Omtest 1 av 2/);
      assert.match(await rows.nth(1).locator('[data-ipip-retest="delete"]').getAttribute('aria-label'),
        /Radera omgången för Omtest 2 av 2/);
      records.push({role,step:'same-day history has distinct visible and accessible actions',passed:true});
      await rows.nth(1).locator('[data-ipip-retest="view"]').click();
      await page.locator('.pf-retest-history h3').filter({hasText:/Omtest 2 av 2/}).waitFor();
      await rows.nth(0).locator('[data-ipip-retest="view"]').click();
      await page.locator('.pf-retest-history h3').filter({hasText:/Omtest 1 av 2/}).waitFor();
      records.push({role,step:'opens older then newer private result by row',passed:true});
      const downloadPromise=page.waitForEvent('download');
      await rows.nth(1).locator('[data-ipip-retest="export"]').click();
      const file=await downloadPromise;
      const payload=JSON.parse(await fs.readFile(await file.path(),'utf8'));
      assert.equal(payload.answered_count,50);
      assert.equal(payload.responses[0].value,2,'Older attempt export is not the newer attempt');
      assert.equal(Object.hasOwn(payload,'user_id'),false);
      assert.equal(Object.hasOwn(payload,'attempt_id'),false);
      records.push({role,step:'exports only selected older attempt',passed:true});
      page.once('dialog',dialog=>dialog.accept());
      await rows.nth(0).locator('[data-ipip-retest="delete"]').click();
      await page.waitForFunction(()=>document.querySelectorAll('.pf-retest-list > li').length===1);
      assert.match(await rows.first().innerText(),/Omtest 1 av 1/);
      assert.equal(await page.locator('.pf-retest-empty').count(),0);
      assert.equal(await page.locator('[data-ipip-retest="view"]').count(),1);
      await checkOverflow(page,'PF-05 multiple retests '+role+' '+width+'px');
      await capture(page,'pf-05-distinct-retest-history-'+role+'.png');
      records.push({role,step:'delete newest leaves older retest and relabels history',passed:true});
    }finally{
      await m.context.close();
    }
  }
  await fs.writeFile(path.join(output,'pf-05-distinct-retest-history-synthetic.json'),
    JSON.stringify({
      method:'Real Chromium clicks in parent 390px and teen 320px, preloaded synthetic private attempt table',
      limitations:'Mocked Auth/database; no verified signed-in accounts, physical Safari or screen reader.',
      cases:records
    },null,2)+'\n');
  console.log('PF-05 distinct retest history: '+records.length+' synthetic role/step checks passed.');
}

// FUN-04-RETEST-ACK: real Chromium clicks against a synthetic, owner-scoped
// retest table. Never modify the live Supabase pilot accounts.
async function verifyRetestAnswerAcknowledgements(){
 const records=[];
 for(const role of ['parent','teen']){
  const width=role==='parent'?390:320;
  for(const scenario of ['committed-lost-ack','rejected-before-write','unavailable-readback']){
   const m=await freshContext({viewport:{width,height:844},deviceScaleFactor:1,
     isMobile:true,hasTouch:true},{authenticated:true,paired:false,role,
       personalityComplete:true,privateRetests:true});
   try{
    const page=m.page;
    await page.goto(base+'#personlighet',{waitUntil:'load'});
    await page.getByRole('button',{name:'Starta en ny privat testomgång'}).click();
    await page.getByText('Fråga 1 av 50').last().waitFor();
    await page.evaluate(mode=>{
      window.__HK_RETEST_ACK_WRITES__=0;
      window.__HK_RETEST_ACK_READS__=0;
      window.__HK_TEST_RETEST_LOST_ACK__=mode!=='rejected-before-write';
      window.__HK_TEST_RETEST_REJECT_WRITE__=mode==='rejected-before-write';
      window.__HK_TEST_RETEST_READ_FAIL__=mode==='unavailable-readback';
    },scenario);
    await page.locator('[data-ipip-retest-answer="ipip50-001"][value="4"]').click();
    if(scenario==='committed-lost-ack'){
      await page.locator('.pf-retest').getByText('Fråga 2 av 50').waitFor();
      assert.equal(await page.locator('[data-ipip-retest="verify-save"]').count(),0);
    }else if(scenario==='rejected-before-write'){
      await page.locator('.pf-retest [role="status"]')
        .filter({hasText:/kunde inte bekräftas som sparat/i}).waitFor();
      assert.match(await page.locator('.pf-retest').innerText(),/Fråga 1 av 50/);
      assert.equal(await page.locator('[data-ipip-retest="verify-save"]').count(),0);
      await page.locator('[data-ipip-retest-answer="ipip50-001"][value="3"]').click();
      await page.locator('.pf-retest').getByText('Fråga 2 av 50').waitFor();
    }else{
      await page.locator('.pf-retest [role="status"]')
        .filter({hasText:/går inte att kontrollera om svaret sparades/i}).waitFor();
      await page.getByRole('button',{name:'Kontrollera sparat svar'}).click();
      await page.getByRole('button',{name:'Fortsätt privat omtest'}).waitFor();
      assert.match(await page.locator('.pf-retest').innerText(),/1 av 50 svar/);
      await page.getByRole('button',{name:'Fortsätt privat omtest'}).click();
      await page.locator('.pf-retest').getByText('Fråga 2 av 50').waitFor();
    }
    assert.equal(await page.evaluate(()=>window.__HK_RETEST_ACK_WRITES__),
      scenario==='rejected-before-write'?2:1);
    assert.equal(await page.evaluate(()=>window.__HK_RETEST_ACK_READS__),
      scenario==='unavailable-readback'?2:1);
    const row=await page.evaluate(()=>window.__HK_RETEST_LAST_WRITE__);
    assert.equal(row?.user_id,role==='teen'
      ?'10000000-0000-0000-0000-000000000002'
      :'10000000-0000-0000-0000-000000000001');
    assert.equal(row?.attempt_id,'90000000-0000-4000-8000-000000000001');
    assert.equal(row?.question_id,'ipip50-001');
    assert.equal(row?.answer_value,scenario==='rejected-before-write'?3:4);
    await checkOverflow(page,'FUN-04 retest ACK '+role+' '+scenario);
    records.push({role,width,scenario,passed:true});
   }finally{await m.context.close();}
  }
 }
 await fs.writeFile(path.join(output,'fun-04-retest-ack-browser-synthetic.json'),
  JSON.stringify({method:'Chromium retest radio clicks and synthetic Supabase write/readback failures',
  limitation:'Mocked Auth/Supabase only; no signed pilot accounts, live database writes or physical Safari',
  records},null,2)+'\n');
 console.log('FUN-04 private retest ACK: '+records.length+' synthetic Chromium scenarios passed.');
}

// FUN-04: confirm start/finish against the currently authenticated viewer's
// synthetic attempts table after lost receipts; test actual browser buttons.
async function verifyRetestLifecycleAckBrowser(){
 const records=[];
 for(const role of ['parent','teen']){
  const width=role==='parent'?390:320;
  for(const scenario of ['lost-start-and-completion','rejected-start']){
   const m=await freshContext(
     {viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true},
     {authenticated:true,paired:false,role,personalityComplete:true,privateRetests:true}
   );
   try{
    const page=m.page;
    await page.goto(base+'#personlighet',{waitUntil:'load'});
    const panel=page.locator('.pf-retest');
    await page.getByRole('button',{name:'Starta en ny privat testomgång'}).waitFor();
    await page.evaluate(scenario=>{
      window.__HK_RETEST_START_WRITES__=0;
      window.__HK_RETEST_COMPLETE_WRITES__=0;
      window.__HK_RETEST_LIFECYCLE_READBACKS__=0;
      window.__HK_TEST_RETEST_START_LOST_ACK__=scenario==='lost-start-and-completion';
      window.__HK_TEST_RETEST_START_REJECT__=scenario==='rejected-start';
    },scenario);
    await page.getByRole('button',{name:'Starta en ny privat testomgång'}).click();
    if(scenario==='rejected-start'){
      await panel.getByText(/Servern visar ingen påbörjad omgång/).waitFor();
      assert.equal(await page.evaluate(()=>window.__HK_RETEST_START_WRITES__),1);
      assert.equal(await page.locator('[data-ipip-retest-answer]').count(),0);
      await page.getByRole('button',{name:'Starta en ny privat testomgång'}).click();
      await panel.getByText('Fråga 1 av 50').waitFor();
      assert.equal(await page.evaluate(()=>window.__HK_RETEST_START_WRITES__),2);
      records.push({role,scenario,phase:'start-rejected-then-manual-retry',passed:true});
      continue;
    }
    await panel.getByText(/Servern visar en påbörjad omgång trots att startbekräftelsen saknades/).waitFor();
    assert.equal(await page.evaluate(()=>window.__HK_RETEST_START_WRITES__),1);
    await page.getByRole('button',{name:'Fortsätt privat omtest'}).click();
    await panel.getByText('Fråga 1 av 50').waitFor();
    for(let n=1;n<=50;n++){
      const item='ipip50-'+String(n).padStart(3,'0');
      await panel.getByText('Fråga '+n+' av 50').waitFor();
      await panel.locator('[data-ipip-retest-answer="'+item+'"][value="3"]').click();
    }
    await panel.getByText(/Alla 50 svar är sparade/).waitFor();
    await page.evaluate(()=>{window.__HK_TEST_RETEST_COMPLETE_LOST_ACK__=true;});
    await page.getByRole('button',{name:'Avsluta omgången och spara resultat'}).click();
    await panel.getByText(/Servern bekräftar att omgången avslutades trots ett kommunikationsfel/).waitFor();
    assert.equal(await page.evaluate(()=>window.__HK_RETEST_COMPLETE_WRITES__),1);
    assert.equal(await page.evaluate(()=>window.__HK_RETEST_LIFECYCLE_READBACKS__),1);
    assert.equal(await page.locator('.pf-retest-history').count(),1);
    assert.equal(await panel.locator('[data-ipip-retest="verify-attempts"]').count(),0);
    assert.equal(await page.locator('.pf-results').count(),1,
      'Completing a private retest leaves the original profile untouched');
    await checkOverflow(page,'FUN-04 retest lifecycle '+role);
    records.push({role,scenario,phase:'start-lost-ack',answers:50,passed:true});
    records.push({role,scenario,phase:'completion-lost-ack',answers:50,passed:true});
   }finally{await m.context.close();}
  }
 }
 await fs.writeFile(path.join(output,'fun-04-retest-lifecycle-ack-browser-synthetic.json'),
   JSON.stringify({method:'Real Chromium buttons and private 50-item retest controls with in-memory Supabase start/completion failures',
    limits:'Mocked Auth and DB, not signed test accounts, network faults against production or physical Safari',records},null,2)+'\n');
 console.log('FUN-04 retest lifecycle ACK: '+records.length+' synthetic Chromium role/transition cases passed.');
}

// FUN-04: verify irreversible retest deletion feedback in the actual UI with
// a synthetic private server. Never delete responses in live test accounts.
async function verifyRetestDeletionAckBrowser(){
 const records=[];
 for(const role of ['parent','teen']){
  const width=role==='parent'?390:320;
  for(const scenario of ['deleted-but-ack-lost','delete-rejected','delete-readback-unavailable']){
   const m=await freshContext(
    {viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true},
    {authenticated:true,paired:false,role,personalityComplete:true,
      privateRetests:true,preloadedRetestHistory:true}
   );
   try{
    const page=m.page;
    await page.goto(base+'#personlighet',{waitUntil:'load'});
    const panel=page.locator('.pf-retest');
    await page.getByRole('heading',{name:'Min omtestningshistorik'}).waitFor();
    assert.equal(await panel.locator('[data-ipip-retest="delete"]').count(),2);
    await page.evaluate(scenario=>{
      window.__HK_RETEST_DELETE_WRITES__=0;
      window.__HK_RETEST_LIFECYCLE_READBACKS__=0;
      window.__HK_TEST_RETEST_DELETE_LOST_ACK__=scenario!=='delete-rejected';
      window.__HK_TEST_RETEST_DELETE_REJECT__=scenario==='delete-rejected';
      window.__HK_TEST_RETEST_LIFECYCLE_READ_FAIL__=scenario==='delete-readback-unavailable';
    },scenario);
    const clickDelete=async()=>{
      page.once('dialog',dialog=>dialog.accept());
      await panel.locator('[data-ipip-retest="delete"]').first().click();
    };
    await clickDelete();
    if(scenario==='deleted-but-ack-lost'){
      await panel.getByText(/Servern bekräftar att omtestet är raderat trots ett kommunikationsfel/).waitFor();
      assert.equal(await panel.locator('[data-ipip-retest="delete"]').count(),1);
      assert.match(await panel.innerText(),/Omtest 1 av 1/);
    }else if(scenario==='delete-rejected'){
      await panel.getByText(/Servern visar att omtestet fortfarande finns/).waitFor();
      assert.equal(await panel.locator('[data-ipip-retest="delete"]').count(),2);
      await clickDelete();
      await panel.getByText(/Den privata omgången och dess svar har raderats/).waitFor();
      assert.equal(await panel.locator('[data-ipip-retest="delete"]').count(),1);
    }else{
      await panel.getByText(/Raderingen kunde inte bekräftas/).waitFor();
      await page.getByRole('button',{name:'Kontrollera omtestets status'}).click();
      await panel.getByText(/Omtest 1 av 1/).waitFor();
      assert.equal(await panel.locator('[data-ipip-retest="delete"]').count(),1);
      assert.equal(await panel.locator('[data-ipip-retest="verify-attempts"]').count(),0);
    }
    assert.equal(await page.evaluate(()=>window.__HK_RETEST_DELETE_WRITES__),
      scenario==='delete-rejected'?2:1,
      'Unknown or confirmed deletion must not issue a duplicate destructive write');
    assert.equal(await page.evaluate(()=>window.__HK_RETEST_LIFECYCLE_READBACKS__),1);
    assert.equal(await panel.locator('[data-ipip-retest="delete"]').count(),1);
    assert.equal(await page.locator('.pf-results').count(),1,
      'The initial IPIP profile is unaffected by private retest deletion');
    await checkOverflow(page,'FUN-04 private deletion '+role+' '+scenario);
    records.push({role,width,scenario,deletedOneOfTwo:true,originalProfileKept:true,
      readbacks:1,deleteAttempts:scenario==='delete-rejected'?2:1,passed:true});
   }finally{await m.context.close();}
  }
 }
 await fs.writeFile(path.join(output,'fun-04-retest-deletion-ack-browser-synthetic.json'),
   JSON.stringify({method:'Chromium private retest history buttons, accepted deletion dialog and in-memory owner-scoped server with fault injection',
     limitations:'Mocked authentication and Supabase; no real deletion or physical mobile browser.',
     records},null,2)+'\n');
 console.log('FUN-04 deletion ACK: '+records.length+' synthetic Chromium cases passed.');
}

// FUN-04.05: finish a fresh private 50-item retest through real browser controls,
// open its saved history, and export the completed JSON. Only in-memory mock data
// is changed; the original IPIP-50 responses are not modified.
async function verifyFullPrivateRetest(){
  const records=[];
  for(const role of ['parent','teen']){
    const width=role==='parent'?390:320;
    const {page,context}=await freshContext(
      {viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true},
      {authenticated:true,paired:false,role,personalityComplete:true,privateRetests:true}
    );
    try{
      await page.goto(base+'#personlighet',{waitUntil:'load'});
      await page.getByRole('heading',{name:'Din profil'}).waitFor();
      await page.getByRole('button',{name:'Starta en ny privat testomgång'}).waitFor();
      await page.getByRole('button',{name:'Starta en ny privat testomgång'}).click();
      await page.locator('[data-ipip-retest-answer="ipip50-001"]').first().waitFor();
      await page.locator('[data-ipip-retest-answer="ipip50-001"][value="4"]').click();
      await page.getByText('Fråga 2 av 50').waitFor();
      await page.getByRole('button',{name:'Spara och pausa'}).click();
      await page.getByRole('button',{name:'Fortsätt privat omtest'}).waitFor();
      assert.match(await page.locator('.pf-retest').innerText(),/1 av 50 svar/);
      await page.evaluate(()=>{location.hash='hem';});
      await page.getByRole('heading',{name:/Hej[ ,]+Prov/}).waitFor();
      await page.evaluate(()=>{location.hash='personlighet';});
      await page.getByRole('button',{name:'Fortsätt privat omtest'}).waitFor();
      await page.getByRole('button',{name:'Fortsätt privat omtest'}).click();
      await page.getByText('Fråga 2 av 50').waitFor();
      await page.getByRole('button',{name:'Föregående'}).last().click();
      await page.getByText('Fråga 1 av 50').waitFor();
      assert.equal(await page.locator('[data-ipip-retest-answer="ipip50-001"][value="4"]').isChecked(),true,
        'FUN-04 private retest restores its first stored response after navigating away');
      await page.locator('[data-ipip-retest-answer="ipip50-001"][value="2"]').click();
      await page.getByText('Fråga 2 av 50').waitFor();
      for(let n=2;n<=50;n++){
        await page.getByText('Fråga '+n+' av 50').waitFor();
        const id='ipip50-'+String(n).padStart(3,'0');
        await page.locator('[data-ipip-retest-answer="'+id+'"][value="3"]').click();
      }
      await page.getByText('Alla 50 svar är sparade.').waitFor();
      assert.equal(await page.evaluate(()=>window.__HK_PRIVATE_RETEST_ANSWERS__),50,
        'FUN-04 all 50 retest responses are saved to the mocked private table');
      assert.equal(await page.locator('.pf-results').count(),1,
        'FUN-04 the original completed profile is still visible during the private retest');
      await page.getByRole('button',{name:'Avsluta omgången och spara resultat'}).click();
      await page.locator('.pf-retest-history').waitFor();
      assert.equal(await page.locator('.pf-retest button[data-ipip-retest="view"]').count(),1);
      assert.match(await page.locator('.pf-retest').innerText(),/Den privata omgången har avslutats och sparats/);
      assert.equal(await page.locator('.pf-results').count(),1,
        'FUN-04 finishing a private retest does not overwrite the original profile');
      await page.getByRole('button',{name:'Visa mitt resultat'}).click();
      await page.locator('.pf-retest-history').waitFor();
      const download=page.waitForEvent('download');
      await page.getByRole('button',{name:/Exportera omgången som JSON för Omtest 1 av 1/}).click();
      const file=await download;
      const payload=JSON.parse(await fs.readFile(await file.path(),'utf8'));
      assert.equal(payload.answered_count,50);
      assert.equal(payload.complete,true);
      assert.equal(payload.responses.length,50);
      assert.equal(payload.responses[0].value,2,
        'FUN-04 retest export records the revised first answer');
      assert.equal(Object.hasOwn(payload,'partner'),false);
      assert.equal(Object.hasOwn(payload,'user_id'),false);
      await checkOverflow(page,'FUN-04 full private retest '+role+' '+width+'px');
      await capture(page,'fun-04-private-retest-complete-'+role+'.png');
      records.push({role,viewport:width,answers:50,paused:true,resumedAcrossRoutes:true,
        firstAnswerRevised:true,historyViewed:true,exportCount:50,
        originalProfileRetained:true,environment:'synthetic Chromium',liveAuth:false});
    }finally{
      await context.close();
    }
  }
  await fs.writeFile(path.join(output,'fun-04-private-retests-complete-synthetic.json'),
    JSON.stringify({method:'real Chromium controls for complete 50-item private retest in both mock roles',
      limitations:'Mocked storage/Auth and browser only; not live Supabase or real users.',
      records},null,2)+'\n');
  console.log('FUN-04 private retest: '+records.length+' full synthetic browser journeys passed.');
}


// FUN-06: interact with all three practical communication forms and their
// native validation, generated texts, reset buttons, keyboard focus and
// route-local draft lifetime in both role-specific synthetic browser sessions.
async function verifyCommunicationForms(){
  const records=[];
  for(const role of ['parent','teen']){
    const width=role==='parent'?390:320;
    const {page,context}=await freshContext(
      {viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true},
      {authenticated:true,paired:false,role}
    );
    try{
      await page.goto(base+'#kommunikation',{waitUntil:'load'});
      await page.locator('#comm-reflection-form').waitFor();
      await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{
        writeText:async text=>{window.__HK_COMM_COPIED__=text;}
      }}));
      assert.equal(await page.locator('[data-comm-copy="reflection"]').isDisabled(),true,'No copy before generating a reflection');
      assert.equal(await page.locator('#comm-reflection-form').evaluate(form=>form.checkValidity()),false,
        'FUN-06 reflection requires its three fields');
      await page.locator('#comm-reflection-heard').fill('Jag vill få prata klart');
      // A noun phrase was previously spliced after "att:", yielding a
      // broken Swedish sentence. Verify actual form submission in both roles.
      await page.locator('#comm-reflection-meaning').fill('lugn och privat tid');
      await page.locator('#comm-reflection-check').fill('Har jag förstått dig rätt');
      await page.locator('#comm-reflection-form button[type="submit"]').click();
      const reflection=await page.locator('#comm-reflection-output').innerText();
      assert.match(reflection,/Det jag hörde: Jag vill få prata klart/);
      assert.match(reflection,/Min försiktiga gissning om vad som kan vara viktigt: lugn och privat tid/);
      assert.match(reflection,/Min fråga för att kontrollera om jag förstått: Har jag förstått dig rätt/);
      assert.doesNotMatch(reflection,/viktigt för dig att:|Jag skulle kunna fråga:/,
        'The local reflection must not pretend the user-entered noun phrase is a complete sentence');
      await page.locator('[data-comm-copy="reflection"]').click();
      await page.waitForFunction(()=>typeof window.__HK_COMM_COPIED__==='string');
      assert.equal(await page.evaluate(()=>window.__HK_COMM_COPIED__),reflection,'Copies only the generated private reflection');
      assert.match(await page.locator('#comm-reflection-copy-status').innerText(),/har kopierats/);
      await page.locator('#comm-reflection-heard').fill('En ändrad spegling');
      assert.equal(await page.locator('[data-comm-copy="reflection"]').isDisabled(),true,'An edited form invalidates old preview');
      assert.match(await page.locator('#comm-reflection-output').innerText(),/Förhandsgranska igen/);
      await page.locator('#comm-reflection-form button[type="submit"]').click();
      assert.equal(await page.locator('[data-comm-copy="reflection"]').isEnabled(),true);
      await page.locator('[data-comm-reflection-reset]').click();
      assert.equal(await page.locator('[data-comm-copy="reflection"]').isDisabled(),true,'Reset blocks old copy');
      assert.equal(await page.locator('#comm-reflection-heard').inputValue(),'');
      assert.match(await page.locator('#comm-reflection-output').innerText(),/Din privata spegling visas här/);
      assert.equal(await page.locator('#comm-reflection-heard').evaluate(el=>document.activeElement===el),true,
        'FUN-06 reset returns focus to reflection editor');
      records.push({role,form:'reflection',validates:true,preview:true,resetAndFocus:true});

      assert.equal(await page.locator('#comm-solution-form').evaluate(form=>form.checkValidity()),false,
        'FUN-06 solution planner requires all four fields');
      await page.locator('#comm-solution-problem').fill('Vi vill planera en gemensam utflykt');
      await page.locator('#comm-solution-question').fill('Vad skulle passa dig bäst');
      await page.locator('#comm-solution-experiment').fill('Vi provar en kort promenad');
      await page.locator('#comm-solution-followup').fill('Vi stämmer av på söndag');
      await page.locator('#comm-solution-form button[type="submit"]').click();
      const plan=await page.locator('#comm-solution-output').innerText();
      assert.match(plan,/Jag vill prata om: Vi vill planera en gemensam utflykt/);
      assert.match(plan,/Mitt förslag att diskutera: Vi provar en kort promenad/);
      assert.match(plan,/Detta är bara mitt utkast/);
      await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{
        writeText:async()=>{throw Error('Synthetic clipboard permission denied');}
      }}));
      await page.locator('[data-comm-copy="solution"]').click();
      const fallback=page.locator('#comm-solution-copy-fallback');
      await fallback.waitFor({state:'visible'});
      assert.equal(await fallback.inputValue(),plan,'Denied clipboard exposes exact current plan as manual fallback');
      assert.equal(await fallback.getAttribute('readonly'),'','Fallback is read only');
      assert.equal(await fallback.evaluate(el=>document.activeElement===el&&el.selectionStart===0&&el.selectionEnd===el.value.length),true,'Fallback text is focused and selected');
      await fallback.press('ArrowRight');
      await page.locator('[data-comm-select-copy="solution"]').click();
      assert.equal(await fallback.evaluate(el=>el.selectionStart===0&&el.selectionEnd===el.value.length),true,'Select again restores whole-text selection');
      await page.locator('#comm-solution-problem').fill('Nytt samtalsämne');
      assert.equal(await page.locator('[data-comm-copy="solution"]').isDisabled(),true);
      assert.equal(await page.locator('#comm-solution-copy-manual').isHidden(),true,'Editing clears outdated fallback');
      await page.locator('[data-comm-solution-reset]').click();
      assert.equal(await page.locator('[data-comm-copy="solution"]').isDisabled(),true);
      assert.equal(await page.locator('#comm-solution-problem').inputValue(),'');
      assert.match(await page.locator('#comm-solution-output').innerText(),/Din privata samtalsplan visas här/);
      assert.equal(await page.locator('#comm-solution-problem').evaluate(el=>document.activeElement===el),true);
      records.push({role,form:'solution',validates:true,preview:true,resetAndFocus:true});

      await page.goto(base+'#nvc',{waitUntil:'load'});
      await page.locator('#comm-nvc-form').waitFor();
      assert.equal(await page.locator('#comm-nvc-form').evaluate(form=>form.checkValidity()),false,
        'FUN-06 NVC sentence requires four parts');
      await page.locator('#comm-observation').fill('vi börjar prata samtidigt');
      await page.locator('#comm-feeling').fill('mig stressad');
      await page.locator('#comm-need').fill('lugn och tydlighet');
      await page.locator('#comm-request').fill('prata senare ikväll');
      await page.locator('#comm-nvc-form button[type="submit"]').click();
      const sentence=await page.locator('#comm-nvc-output').innerText();
      assert.match(sentence,/Det jag lade märke till: vi börjar prata samtidigt/);
      assert.match(sentence,/Mitt behov: lugn och tydlighet/);
      assert.match(sentence,/Mitt önskemål: prata senare ikväll/);
      await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{
        writeText:async text=>{window.__HK_COMM_COPIED__=text;}
      }}));
      await page.locator('[data-comm-copy="nvc"]').click();
      await page.waitForFunction(text=>window.__HK_COMM_COPIED__===text,sentence);
      assert.equal(await page.locator('#comm-nvc-copy-manual').isHidden(),true);
      await page.locator('[data-comm-reset]').click();
      assert.equal(await page.locator('[data-comm-copy="nvc"]').isDisabled(),true);
      assert.equal(await page.locator('#comm-observation').inputValue(),'');
      assert.match(await page.locator('#comm-nvc-output').innerText(),/Din formulering visas här när du är redo/);
      assert.equal(await page.locator('#comm-observation').evaluate(el=>document.activeElement===el),true);
      await page.locator('#comm-observation').fill('ett privat utkast');
      await page.goto(base+'#kommunikation',{waitUntil:'load'});
      await page.goto(base+'#nvc',{waitUntil:'load'});
      assert.equal(await page.locator('#comm-observation').inputValue(),'',
        'FUN-06 local-only NVC text must not silently survive navigation');
      await checkOverflow(page,'FUN-06 communication forms '+role+' '+width+'px');
      records.push({role,form:'nvc',validates:true,preview:true,resetAndFocus:true,draftNotPersisted:true});
    }finally{
      await context.close();
    }
  }
  await fs.writeFile(path.join(output,'fun-06-communication-forms-synthetic.json'),
    JSON.stringify({method:'Real Chromium form fill, submit, copy success/denial, manual select, edit invalidation, reset, focus and route change in two mock roles',
      limitations:'No live Auth, backend, real device or human assessment of advice quality.',
      records},null,2)+'\n');
  console.log('FUN-06: '+records.length+' communication form/role cases passed in synthetic Chromium.');
}

// FUN-03: both browser roles share one SYNTHETIC in-memory pair fixture.
// This exercises the real DOM and frontend workflow across two independent
// Chromium contexts. No Supabase credentials, production replies or live users.
function makeTwoRoleFamilyFixture(){
  const messages=[],tokens=new Map(),rules=[],notices=[],activityNotices=[],replacementLinks=[],ruleHistory=[],calls=[];
  let failedSendAcknowledgement=false,failedOlderPage=false,failedActivityRead=false,failedRuleNoticeRead=false,nextRuleId=200;
  let holdRuleReadRole=null,heldRuleRead=null,failRuleReadRole=null;
  let holdMessageReadRole=null,heldMessageRead=null;
  const other=role=>role==='parent'?'teen':'parent';
  const ok=data=>({data,error:null});
  const createdAt=n=>'2026-11-01T12:'+String(Math.floor(n/50)).padStart(2,'0')+':'+String(n%50).padStart(2,'0')+'Z';
  function rpc(role,name,args={}){
    calls.push({role,name,args});
    if(name==='my_family_messages'){
      if(holdMessageReadRole===role){
        holdMessageReadRole=null;
        return new Promise(resolve=>{heldMessageRead=resolve;});
      }
      if(args?.p_before_created_at&&failedOlderPage){failedOlderPage=false;return {data:null,error:{message:'synthetic older page unavailable'}};}
      let visible=messages.map(m=>({
        message_id:m.id,body:m.body,sent_by_me:m.sender===role,
        created_at:m.created_at,read_at:m.read_at
      })).sort((a,b)=>b.created_at.localeCompare(a.created_at)||b.message_id.localeCompare(a.message_id));
      if(args?.p_before_created_at&&args?.p_before_id)
        visible=visible.filter(m=>m.created_at<args.p_before_created_at||
          (m.created_at===args.p_before_created_at&&m.message_id<args.p_before_id));
      return ok(visible.slice(0,50));
    }
    if(name==='my_activity_notifications')
      return ok(activityNotices.filter(n=>n.recipient===role).map(({recipient,...rest})=>({...rest})));
    if(name==='mark_activity_notification_read'){
      if(failedActivityRead){failedActivityRead=false;return {data:null,error:{message:'synthetic activity receipt unavailable'}};}
      const n=activityNotices.find(n=>n.recipient===role&&n.notification_id===args.p_notification_id);
      if(!n)return {data:null,error:{message:'unknown synthetic activity notice'}};
      n.read_at='2026-11-01T13:03:00Z';return ok(null);
    }
    if(name==='my_family_unread_message_count')
      return ok(messages.filter(m=>m.sender!==role&&m.read_at===null).length);
    if(name==='send_family_message'){
      const body=String(args.p_body||''),token=String(args.p_request_key||'');
      if(!body.trim()||!token)return {data:null,error:{message:'invalid synthetic message'}};
      const key=role+':'+token,existing=tokens.get(key);
      if(existing)return ok(existing.id===undefined?null:existing.id);
      const seq=messages.length+1;
      const row={id:'71000000-0000-4000-8000-'+String(200+seq).padStart(12,'0'),
        body,sender:role,created_at:createdAt(seq),read_at:null};
      tokens.set(key,row);messages.push(row);
      if(failedSendAcknowledgement){
        failedSendAcknowledgement=false;
        return {data:null,error:{message:'synthetic response lost after write'}};
      }
      return ok(row.id);
    }
    if(name==='mark_family_messages_read'){
      const rows=messages.filter(m=>m.sender!==role&&m.read_at===null);
      for(const m of rows)m.read_at='2026-11-01T13:00:00Z';
      return ok(rows.length);
    }
    if(name==='my_schyssta_rules'&&failRuleReadRole===role){
      failRuleReadRole=null;
      return {data:null,error:{message:'Synthetic rule list read unavailable'}};
    }
    if(name==='my_schyssta_rules'&&holdRuleReadRole===role){
      holdRuleReadRole=null;
      return new Promise(resolve=>{heldRuleRead=resolve;});
    }
    if(name==='shared_schyssta_rule_suggestions'||name==='my_schyssta_rules')return ok([]);
    if(name==='my_schyssta_replacement_links')return ok(replacementLinks.map(row=>({...row})));
    if(name==='my_schyssta_rule_history')return ok(ruleHistory.map(row=>({...row})));
    if(name==='my_manual_schyssta_rules'){
      return ok(rules.map(r=>({
        agreement_id:r.id,body:r.body,status:r.status,agreement_version:1,
        proposed_by_me:r.proposer===role,own_decision:r.decisions[role],
        parent_decision:r.decisions.parent,teen_decision:r.decisions.teen,
        created_at:r.created_at
      })));
    }
    if(name==='my_schyssta_notifications')
      return ok(notices.filter(n=>n.recipient===role).map(({recipient,...n})=>({...n})));
    if(name==='propose_manual_schyssta_rule'){
      if(!String(args.p_body||'').trim()||!args.p_request_key)
        return {data:null,error:{message:'invalid proposal'}};
      const existing=rules.find(r=>r.proposer===role&&r.token===args.p_request_key);
      if(existing)return ok(existing.id);
      const seq=++nextRuleId-200,id='30000000-0000-4000-8000-'+String(200+seq).padStart(12,'0'),
        created_at=createdAt(seq+10);
      rules.push({id,body:args.p_body,proposer:role,token:args.p_request_key,
        status:'proposed',created_at,decisions:{parent:null,teen:null}});
      notices.push({notification_id:'40000000-0000-4000-8000-'+String(200+seq).padStart(12,'0'),
        agreement_id:id,kind:'rule_proposed',body:args.p_body,
        read_at:null,created_at,recipient:other(role)});
      return ok(id);
    }
    if(name==='propose_schyssta_change'){
      const original=rules.find(r=>r.id===args.p_agreement_id&&r.status==='accepted');
      if(!original||!String(args.p_body||'').trim()||!args.p_request_key)
        return {data:null,error:{message:'invalid change proposal'}};
      const existing=rules.find(r=>r.proposer===role&&r.token===args.p_request_key);
      if(existing)return ok(existing.id);
      const seq=++nextRuleId-200,id='30000000-0000-4000-8000-'+String(200+seq).padStart(12,'0'),
        created_at=createdAt(seq+10);
      rules.push({id,body:args.p_body,proposer:role,token:args.p_request_key,
        status:'proposed',created_at,decisions:{parent:null,teen:null}});
      replacementLinks.push({agreement_id:id,replaces_agreement_id:original.id});
      notices.push({notification_id:'40000000-0000-4000-8000-'+String(200+seq).padStart(12,'0'),
        agreement_id:id,kind:'rule_proposed',body:args.p_body,
        read_at:null,created_at,recipient:other(role)});
      return ok(id);
    }
    if(name==='withdraw_schyssta_rule'){
      const index=rules.findIndex(r=>r.id===args.p_agreement_id&&r.status==='accepted');
      if(index<0)return {data:null,error:{message:'not a mutually accepted agreement'}};
      const [archived]=rules.splice(index,1);
      ruleHistory.push({agreement_id:archived.id,body:archived.body,created_at:archived.created_at});
      const linkIndex=replacementLinks.findIndex(link=>link.agreement_id===archived.id);
      if(linkIndex>=0)replacementLinks.splice(linkIndex,1);
      return ok(null);
    }
    if(name==='set_schyssta_rule_decision'){
      const row=rules.find(r=>r.id===args.p_agreement_id);
      if(!row)return {data:null,error:{message:'missing synthetic rule'}};
      row.decisions[role]=args.p_approved===true;
      row.status=row.decisions.parent===true&&row.decisions.teen===true?'accepted'
        :row.decisions.parent===false||row.decisions.teen===false?'rejected':'proposed';
      if(row.status==='accepted'){
        const link=replacementLinks.find(link=>link.agreement_id===row.id);
        const oldIndex=link?rules.findIndex(r=>r.id===link.replaces_agreement_id):-1;
        if(oldIndex>=0){
          const [archived]=rules.splice(oldIndex,1);
          ruleHistory.push({agreement_id:archived.id,body:archived.body,created_at:archived.created_at});
        }
      }
      return ok(null);
    }
    if(name==='mark_schyssta_notification_read'){
      if(failedRuleNoticeRead){failedRuleNoticeRead=false;return {data:null,error:{message:'synthetic rule receipt unavailable'}};}
      const notice=notices.find(n=>n.recipient===role&&n.notification_id===args.p_notification_id);
      if(!notice)return {data:null,error:{message:'unknown synthetic notice'}};
      notice.read_at='2026-11-01T13:01:00Z';return ok(null);
    }
    throw new Error('Unexpected linked pair RPC: '+name);
  }
  return {rpc,messages,rules,notices,activityNotices,replacementLinks,ruleHistory,calls,
    loseNextSendAcknowledgement(){failedSendAcknowledgement=true;},
    failNextOlderPage(){failedOlderPage=true;},
    failNextActivityRead(){failedActivityRead=true;},
    failNextRuleNoticeRead(){failedRuleNoticeRead=true;},
    failNextRuleRead(role){failRuleReadRole=role;},
    holdNextRuleRead(role){holdRuleReadRole=role;},
    releaseHeldRuleRead(){if(!heldRuleRead)throw new Error('No held synthetic rule fetch');heldRuleRead(ok([]));heldRuleRead=null;},
    get isHoldingRuleRead(){return !!heldRuleRead;},
    holdNextMessageRead(role){holdMessageReadRole=role;},
    releaseHeldMessageRead(){if(!heldMessageRead)throw new Error('No held synthetic message fetch');heldMessageRead(ok([]));heldMessageRead=null;},
    get isHoldingMessageRead(){return !!heldMessageRead;}};
}
const FUN03_LINKED_RPCS=Object.freeze([
  'my_family_messages','my_family_unread_message_count','send_family_message','mark_family_messages_read',
  'shared_schyssta_rule_suggestions','my_schyssta_rules','my_manual_schyssta_rules',
  'my_schyssta_notifications','my_schyssta_replacement_links','my_schyssta_rule_history',
  'propose_manual_schyssta_rule','propose_schyssta_change','withdraw_schyssta_rule',
  'set_schyssta_rule_decision','mark_schyssta_notification_read',
  'my_activity_notifications','mark_activity_notification_read'
]);

async function verifyWholeInboxBackgroundLoadStatus(){
  // Start a delayed read deliberately with the REAL conversation refresh
  // button. It is less timing-sensitive than holding an RPC during page boot.
  const fixture=makeTwoRoleFamilyFixture();
  const teen=await freshContext(
    {viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true},
    {authenticated:true,paired:true,role:'teen',pairFixture:fixture,activityNotifications:true}
  );
  try{
    await teen.page.goto(base+'#inkorg',{waitUntil:'load'});
    await teen.page.locator('.family-chat-history').waitFor();
    await teen.page.locator('#inbox-refresh-all').waitFor();
    await teen.page.locator('#family-chat-body').fill('Ett oskickat utkast under hämtningen');
    fixture.holdNextMessageRead('teen');
    await teen.page.locator('[data-family-chat-refresh]').click();
    for(let i=0;i<60&&!fixture.isHoldingMessageRead;i++)await sleep(50);
    assert.equal(fixture.isHoldingMessageRead,true,
      'Explicit conversation refresh must start the delayed mock message read; calls: '+
      fixture.calls.filter(x=>x.role==='teen').map(x=>x.name).slice(-18).join(', '));
    const before=fixture.calls.filter(x=>x.role==='teen'&&x.name==='my_family_messages').length;
    await teen.page.locator('#inbox-refresh-all').click();
    const status=teen.page.locator('.inbox-refresh-actions [role="status"]');
    await teen.page.getByText(/Vissa delar hämtades redan i bakgrunden/).waitFor();
    assert.match(await status.innerText(),/meddelanden/,
      'Skipped ongoing message read is named in actual inbox DOM');
    assert.equal(fixture.calls.filter(x=>x.role==='teen'&&x.name==='my_family_messages').length,
      before,'Whole inbox refresh never duplicates an already-loading message RPC');
    assert.equal(await teen.page.locator('#family-chat-body').inputValue(),
      'Ett oskickat utkast under hämtningen','Partial refresh preserves private unsent draft');
    assert.equal(await teen.page.locator('#inbox-refresh-all').isEnabled(),true,
      'A partial update must release the whole-inbox button');
    fixture.releaseHeldMessageRead();
    // The finished private message fetch may choose a render-free completion
    // while a draft is active; permit its Promise continuation to settle.
    await teen.page.waitForTimeout(150);
    await teen.page.locator('#inbox-refresh-all').click();
    await teen.page.getByText('Inkorgen är uppdaterad.',{exact:true}).waitFor();
    assert.equal(await teen.page.locator('#family-chat-body').inputValue(),
      'Ett oskickat utkast under hämtningen','Successful explicit retry preserves draft');
    assert.equal(fixture.calls.filter(x=>x.role==='teen'&&x.name==='my_family_messages').length,
      before+1,'Fresh retry includes previously skipped message read');
    console.log('FUN-03 full inbox overlapping-load browser test passed.');
  }finally{
    if(fixture.isHoldingMessageRead)fixture.releaseHeldMessageRead();
    await teen.context.close();
  }
}

async function verifyPairedTwoRoleExchange(){
  const fixture=makeTwoRoleFamilyFixture();
  const options={viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true};
  const parent=await freshContext(options,{authenticated:true,paired:true,role:'parent',pairFixture:fixture});
  const teen=await freshContext({...options,viewport:{width:320,height:700}},
    {authenticated:true,paired:true,role:'teen',pairFixture:fixture,activityNotifications:true});
  const record=[];
  try{
    await Promise.all([
      parent.page.goto(base+'#inkorg',{waitUntil:'load'}),
      teen.page.goto(base+'#inkorg',{waitUntil:'load'})
    ]);
    await Promise.all([
      parent.page.locator('#family-chat-body').waitFor(),
      teen.page.locator('#family-chat-body').waitFor()
    ]);
    assert.equal(await teen.page.locator('.family-chat-bubble').count(),0,
      'FUN-03: synthetic shared pair begins without an invented conversation');
    assert.equal(await parent.page.locator('.family-chat-bubble').count(),0);

    // Server saved the first send but lost its acknowledgement. Retrying with
    // the same composer text and idempotency key must not duplicate messages.
    fixture.loseNextSendAcknowledgement();
    await parent.page.locator('#family-chat-body').fill('Kan vi bestämma tid för en promenad?');
    await parent.page.getByRole('button',{name:'Skicka meddelande'}).click();
    await parent.page.getByText(/Vi kunde inte bekräfta om meddelandet skickades/).waitFor();
    assert.equal(fixture.messages.length,1,'Unacknowledged write exists exactly once in shared fixture');
    assert.equal(await parent.page.locator('#family-chat-body').inputValue(),
      'Kan vi bestämma tid för en promenad?','Uncertain send retains editable draft');
    await parent.page.getByRole('button',{name:'Skicka meddelande'}).click();
    await parent.page.locator('.family-chat-mine').filter({hasText:'Kan vi bestämma tid för en promenad?'}).waitFor();
    assert.equal(fixture.messages.length,1,'Retry reuses idempotency key and never duplicates message');
    record.push({case:'lost-acknowledgement-retry',passed:true});

    await teen.page.locator('[data-family-chat-refresh]').click();
    await teen.page.locator('.family-chat-theirs').filter({hasText:'Kan vi bestämma tid för en promenad?'}).waitFor();
    assert.equal(await teen.page.locator('.family-chat-mine').count(),0);
    assert.equal(await teen.page.locator('[data-family-chat-mark-all-read]').count(),1,
      'Teen must explicitly mark received message as read');
    assert.equal(fixture.messages[0].read_at,null,'Viewing does not mark read');
    await teen.page.locator('[data-family-chat-mark-all-read]').click();
    await teen.page.getByText('Alla meddelanden har markerats som lästa.').waitFor();
    assert.ok(fixture.messages[0].read_at,'A deliberate teen action marks the shared fixture message read');
    await parent.page.locator('[data-family-chat-refresh]').click();
    await parent.page.locator('.family-chat-mine .family-chat-receipt').getByText('Läst').waitFor();
    record.push({case:'parent-send-teen-receive-read-parent-receipt',passed:true});

    await teen.page.locator('#family-chat-body').fill('Ja, jag vill gärna gå en sväng.');
    await teen.page.locator('#family-chat-form button[type="submit"]').click();
    await teen.page.locator('.family-chat-mine').filter({hasText:'Ja, jag vill gärna gå en sväng.'}).waitFor();
    await parent.page.locator('[data-family-chat-refresh]').click();
    await parent.page.locator('.family-chat-theirs').filter({hasText:'Ja, jag vill gärna gå en sväng.'}).waitFor();
    assert.equal(fixture.messages.length,2,'Both directions share the same synthetic conversation');
    record.push({case:'teen-reply-parent-receive',passed:true});

    await parent.page.goto(base+'#regler',{waitUntil:'load'});
    await parent.page.locator('[data-schyssta-start]').waitFor();
    await parent.page.locator('[data-schyssta-start]').click();
    await parent.page.locator('#schyssta-body').fill('Vi frågar om någon vill följa med på promenad.');
    await parent.page.getByRole('button',{name:'Skicka regelförslag'}).click();
    await parent.page.locator('.schyssta-list li').filter({hasText:'Vi frågar om någon vill följa med på promenad.'}).waitFor();
    assert.equal(fixture.rules.length,1);
    assert.equal(fixture.rules[0].status,'proposed');
    assert.deepEqual(fixture.rules[0].decisions,{parent:null,teen:null},
      'Submitting a manual proposal does not silently approve it for either member');

    // Both kinds of notifications must reach an already-open inbox without
    // a page reload, while leaving the unsent draft intact.
    fixture.activityNotices.push({
      notification_id:'57000000-0000-4000-8000-000000000201',
      event_kind:'mutual_match',deck_id:'aktiviteter',read_at:null,
      updated_at:'2026-11-01T13:02:00Z',recipient:'teen'
    });
    await teen.page.locator('#family-chat-body').fill('Det här utkastet får inte skickas.');
    assert.equal(await teen.page.getByText('Nytt regelförslag').count(),0,
      'FUN-03: existing inbox has not received the latest rule yet');
    const beforeReads=fixture.calls.filter(x=>x.role==='teen'&&
      ['mark_schyssta_notification_read','mark_activity_notification_read','mark_family_messages_read'].includes(x.name)).length;
    await teen.page.locator('#inbox-refresh-all').click();
    await teen.page.getByText('Inkorgen är uppdaterad.').waitFor();
    assert.equal(await teen.page.locator('#family-chat-body').inputValue(),
      'Det här utkastet får inte skickas.','FUN-03: whole-inbox refresh preserves unsent chat draft');
    assert.equal(fixture.messages.length,2,'FUN-03: refreshing never sends a draft');
    try{
      await teen.page.getByText('Nytt regelförslag').waitFor({timeout:10000});
    }catch(error){
      const visible=await teen.page.locator('#live-app').innerText().catch(()=>'(no app)');
      throw new Error('FUN-03 linked notice missing: '+JSON.stringify({
        notices:fixture.notices,teenCalls:fixture.calls.filter(x=>x.role==='teen').slice(-25),
        visible:visible.slice(0,3500)
      }));
    }
    await teen.page.getByText(/Nytt gemensamt JA · Aktiviteter/).waitFor();
    // FBK-02-04: private messages may be read while rule/event notifications
    // still legitimately contribute to the combined mobile Inkorg badge.
    await teen.page.waitForFunction(()=>{
      const box=document.querySelector('.inbox-unread-summary');
      return box?.textContent?.includes('Oläst i inkorgen · 2');
    });
    const breakdown=teen.page.locator('.inbox-unread-summary');
    assert.match(await breakdown.innerText(),/Privata meddelanden · 0/);
    assert.match(await breakdown.innerText(),/Regelhändelser · 1/);
    assert.match(await breakdown.innerText(),/Gemensamma kort · 1/);
    assert.equal(await teen.page.locator('#live-mobile-nav a[href="#inkorg"] .live-nav-count').innerText(),'2',
      'Mobile badge shows combined unread rule and activity events, not a stale private message');
    await breakdown.locator('[data-inbox-unread-jump="rules"]').click();
    assert.equal(await teen.page.locator('#inbox-rules-heading').evaluate(el=>document.activeElement===el),true,
      'Unread rule shortcut focuses its actual inbox section');
    assert.equal(fixture.notices[0].read_at,null,'Jumping to rule events does not silently mark them read');
    await breakdown.locator('[data-inbox-unread-jump="activities"]').click();
    assert.equal(await teen.page.locator('#inbox-activities-heading').evaluate(el=>document.activeElement===el),true);
    assert.equal(await teen.page.locator('#family-chat-body').inputValue(),
      'Det här utkastet får inte skickas.','Unread shortcuts preserve the unsent chat draft');
    record.push({case:'badge-categories-split-and-focus-shortcuts',passed:true});
    assert.equal(fixture.activityNotices[0].read_at,null,
      'FUN-03: fresh activity notice does not automatically become read');
    assert.equal(fixture.calls.filter(x=>x.role==='teen'&&
      ['mark_schyssta_notification_read','mark_activity_notification_read','mark_family_messages_read'].includes(x.name)).length,
      beforeReads,'FUN-03: whole-inbox refresh never creates a receipt or rule decision');
    // An explicit read that fails must show a recoverable error while a draft
    // remains open. Retry fetch is also an explicit UI action.
    fixture.failNextActivityRead();
    await teen.page.locator('[data-activity-read]').click();
    await teen.page.getByRole('alert').filter({hasText:'Det gick inte att bekräfta läsmarkeringen'}).waitFor();
    assert.equal(fixture.activityNotices[0].read_at,null,
      'FUN-03: failed receipt never invents a read acknowledgement');
    assert.equal(await teen.page.locator('#family-chat-body').inputValue(),
      'Det här utkastet får inte skickas.','FUN-03: explicit read error preserves unsent draft');
    await teen.page.locator('[data-activity-refresh]').click();
    await teen.page.locator('[data-activity-read]').waitFor();
    assert.equal(await teen.page.locator('#family-chat-body').inputValue(),
      'Det här utkastet får inte skickas.','FUN-03: explicit notice retry preserves unsent draft');
    await teen.page.locator('[data-activity-read]').click();
    await teen.page.waitForFunction(()=>!document.querySelector('[data-activity-read]'));
    assert.ok(fixture.activityNotices[0].read_at,
      'FUN-03: activity notification is marked read only after explicit click');
    assert.equal(await teen.page.locator('#family-chat-body').inputValue(),
      'Det här utkastet får inte skickas.','FUN-03: completed explicit receipt preserves unsent draft');
    record.push({case:'failed-activity-read-visible-retry-and-success-with-unsent-draft',passed:true});
    assert.equal(fixture.notices[0].read_at,null,'Opening inbox does not silently mark rule notice read');
    // Verify actual DOM feedback after the rule-notice read fails, not merely
    // the internal message state or the separate Schyssta page.
    fixture.failNextRuleNoticeRead();
    await teen.page.locator('[data-schyssta-read]').click();
    await teen.page.getByRole('status').filter({
      hasText:'Det gick inte att bekräfta läsmarkeringen'
    }).waitFor();
    assert.equal(fixture.notices[0].read_at,null,
      'FUN-03: an unacknowledged rule notice cannot be treated as read');
    assert.equal(await teen.page.locator('#family-chat-body').inputValue(),
      'Det här utkastet får inte skickas.','Rule notice feedback must preserve the chat draft');
    assert.equal(await teen.page.locator('[data-schyssta-read]').count(),1,
      'Failed rule notice is still available for a deliberate retry');
    await teen.page.locator('[data-schyssta-read]').click();
    await teen.page.waitForFunction(()=>!document.querySelector('[data-schyssta-read]'));
    assert.ok(fixture.notices[0].read_at,'Teen explicitly reads their own notification');
    await teen.page.waitForFunction(()=>!document.querySelector('#live-mobile-nav a[href="#inkorg"] .live-nav-count'),
      null,{timeout:2500});
    assert.equal(await teen.page.locator('.inbox-unread-summary').count(),0,
      'After confirmed read receipts for all three sources, both badge and explanation disappear');
    assert.equal(await teen.page.getByText('Det gick inte att bekräfta läsmarkeringen').count(),0,
      'Confirmed successful retry removes the obsolete read-receipt warning');
    record.push({case:'rule-notice-read-failure-visible-in-inbox-and-retry-clears',passed:true});
    await teen.page.locator('[data-schyssta-open]').first().click();
    await teen.page.getByRole('heading',{name:'Schyssta listan'}).waitFor();
    const incoming=teen.page.locator('#schyssta-rule-'+fixture.rules[0].id);
    await incoming.waitFor();
    assert.match(await incoming.innerText(),/Ditt val: inte lämnat/);
    record.push({case:'parent-propose-teen-whole-inbox-refresh-including-activity-draft-preserved',passed:true});

    await incoming.locator('[data-schyssta-pause]').click();
    assert.deepEqual(fixture.rules[0].decisions,{parent:null,teen:null},
      'Not now is a local postponement and does not send a decision');
    await teen.page.locator('[data-schyssta-resume]').click();
    await incoming.getByRole('button',{name:'Jag godkänner'}).click();
    await teen.page.waitForFunction(()=>document.querySelector('.schyssta-view')?.textContent?.includes('Ditt val: ja'));
    assert.equal(fixture.rules[0].status,'proposed','Teen approval alone cannot mark a shared rule accepted');
    assert.deepEqual(fixture.rules[0].decisions,{parent:null,teen:true});
    await parent.page.goto(base+'#hem',{waitUntil:'load'});
    await parent.page.goto(base+'#regler',{waitUntil:'load'});
    const outgoing=parent.page.locator('#schyssta-rule-'+fixture.rules[0].id);
    await outgoing.waitFor();
    assert.match(await outgoing.innerText(),/Ditt val: inte lämnat/,
      'Parent sees their original proposal still awaiting their own explicit vote');
    await outgoing.getByRole('button',{name:'Jag godkänner'}).click();
    await parent.page.waitForFunction(()=>document.querySelector('.schyssta-view')?.textContent?.includes('Godkänd av båda'));
    assert.equal(fixture.rules[0].status,'accepted');
    await teen.page.goto(base+'#hem',{waitUntil:'load'});
    await teen.page.goto(base+'#regler',{waitUntil:'load'});
    await teen.page.locator('#schyssta-rule-'+fixture.rules[0].id).waitFor();
    assert.equal(await teen.page.locator('#schyssta-rule-'+fixture.rules[0].id+' .schyssta-approved-details > summary').isVisible(),true,
      'An accepted agreement is visible to the other role even while details are collapsed');
    assert.equal(await teen.page.locator('.schyssta-quick-counts').count(),1);
    record.push({case:'not-now-resume-teen-approve-parent-approve-both-see-accepted',passed:true});
    await checkOverflow(parent.page,'FUN-03 linked parent 390px');
    await checkOverflow(teen.page,'FUN-03 linked teen 320px');
  }finally{
    await Promise.all([parent.context.close(),teen.context.close()]);
  }
  await fs.writeFile(path.join(output,'fun-03-linked-two-role-synthetic.json'),
    JSON.stringify({
      method:'Two separate Chromium contexts with one synchronous shared in-memory pair RPC fixture',
      evidence:'Real browser clicks, independent role-specific UI reads/writes and server-like fixture reconciliation',
      limitations:'Auth, server permissions, Supabase/Worker persistence and physical mobile are entirely mocked.',
      scenarios:record,messages:fixture.messages.length,rules:fixture.rules.length
    },null,2)+'\n');
  console.log('FUN-03 linked two-role journey: '+record.length+' browser scenarios passed.');
}

// FUN-03: exercise the real paginated inbox UI against a single shared
// synthetic family timeline with >50 messages and a recoverable older-page
// RPC error. Two role-specific contexts confirm read status propagation.
async function verifyLinkedInboxOlderPages(){
  const fixture=makeTwoRoleFamilyFixture();
  for(let i=1;i<=57;i++){
    const stamp=i===7?8:i; // same-timestamp boundary, distinguish by message UUID
    fixture.messages.push({
      id:'71000000-0000-4000-8000-'+String(500+i).padStart(12,'0'),
      sender:'parent',body:'Historiskt meddelande '+String(i).padStart(2,'0'),
      created_at:'2026-11-01T12:00:'+String(stamp).padStart(2,'0')+'Z',
      read_at:null
    });
  }
  const teen=await freshContext(
    {viewport:{width:320,height:700},deviceScaleFactor:1,isMobile:true,hasTouch:true},
    {authenticated:true,paired:true,role:'teen',pairFixture:fixture}
  );
  const parent=await freshContext(
    {viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true},
    {authenticated:true,paired:true,role:'parent',pairFixture:fixture}
  );
  const records=[];
  try{
    await Promise.all([
      teen.page.goto(base+'#inkorg',{waitUntil:'load'}),
      parent.page.goto(base+'#inkorg',{waitUntil:'load'})
    ]);
    await teen.page.waitForFunction(()=>document.querySelectorAll('.family-chat-bubble').length===50);
    assert.equal(await teen.page.locator('[data-family-chat-more]').count(),1,
      'FUN-03: exactly fifty most recent messages trigger older-page action');
    assert.equal(await teen.page.locator('.family-chat-theirs').count(),50);
    assert.equal(await teen.page.getByText('Historiskt meddelande 01').count(),0,
      'FUN-03: oldest item not loaded in the first page');
    assert.equal(fixture.messages.filter(m=>m.read_at!==null).length,0,
      'Opening the paginated conversation does not silently mark any message read');
    records.push({case:'first-fifty-and-explicit-older-action',passed:true});

    fixture.failNextOlderPage();
    await teen.page.locator('[data-family-chat-more]').click();
    await teen.page.getByRole('alert').filter({hasText:'Kunde inte hämta meddelandena'}).waitFor();
    assert.equal(await teen.page.locator('.family-chat-bubble').count(),50,
      'FUN-03: a failed older-page read retains previously verified messages');
    assert.equal(await teen.page.locator('[data-family-chat-more]').count(),1,
      'FUN-03: failure preserves retry control');
    assert.equal(await teen.page.getByText('Historiskt meddelande 01').count(),0);
    records.push({case:'failed-older-page-retains-current-history-and-retry',passed:true});

    await teen.page.locator('[data-family-chat-more]').click();
    await teen.page.waitForFunction(()=>document.querySelectorAll('.family-chat-bubble').length===57);
    assert.equal(await teen.page.locator('[data-family-chat-more]').count(),0,
      'FUN-03: fetching seven remaining older messages clears pagination CTA');
    const textRows=await teen.page.locator('.family-chat-text').allTextContents();
    assert.equal(textRows.length,57);
    assert.equal(new Set(textRows).size,57,'FUN-03: two pages contain no duplicated messages');
    assert.ok(textRows.includes('Historiskt meddelande 01'));
    assert.ok(textRows.includes('Historiskt meddelande 57'));
    const olderCalls=fixture.calls.filter(call=>call.role==='teen'&&call.name==='my_family_messages'
      &&call.args?.p_before_id);
    assert.equal(olderCalls.length,2,'FUN-03: first older request failed and second retried');
    const cursor='71000000-0000-4000-8000-'+String(508).padStart(12,'0');
    assert.ok(olderCalls.every(call=>call.args.p_before_id===cursor),
      'FUN-03: retry uses the same stable oldest-message cursor');
    assert.equal(fixture.messages.filter(m=>m.read_at!==null).length,0,
      'FUN-03: loading older pages is not an implicit read receipt');
    records.push({case:'retry-merges-seven-older-messages-with-timestamp-tie-no-duplicates',passed:true});

    await teen.page.getByRole('button',{name:'Markera alla meddelanden som lästa'}).click();
    await teen.page.getByText('Alla meddelanden har markerats som lästa.').waitFor();
    assert.equal(fixture.messages.filter(m=>m.read_at!==null).length,57,
      'FUN-03: explicit mark-all applies to the whole simulated incoming conversation');
    await parent.page.locator('[data-family-chat-refresh]').click();
    await parent.page.waitForFunction(()=>
      [...document.querySelectorAll('.family-chat-mine .family-chat-receipt')].length===50
      &&[...document.querySelectorAll('.family-chat-mine .family-chat-receipt')].every(el=>el.textContent?.includes('Läst')));
    await checkOverflow(teen.page,'FUN-03 57 messages teen 320px');
    await checkOverflow(parent.page,'FUN-03 read receipts parent 390px');
    records.push({case:'explicit-read-of-paged-thread-updates-sender-receipts',passed:true});
  }finally{
    await Promise.all([teen.context.close(),parent.context.close()]);
  }
  await fs.writeFile(path.join(output,'fun-03-paginated-inbox-synthetic.json'),
    JSON.stringify({method:'Two independent Chromium contexts; 57 mocked family messages in one shared in-memory fixture',
      limitations:'No real Auth, Supabase persistence, physical mobile or server permissions.',
      records,uniqueMessages:fixture.messages.length},null,2)+'\n');
  console.log('FUN-03 inbox pagination: '+records.length+' synthetic browser scenarios passed.');
}


// FUN-03.03: a complete two-role rule lifecycle: create, dual approve, propose
// replacement, preserve prior rule until dual approval, archive the old rule,
// cancel end, confirm end, inspect history and export current agreements.
async function verifyPairedRuleRevisionAndHistory(){
  const fixture=makeTwoRoleFamilyFixture();
  const parent=await freshContext(
    {viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true},
    {authenticated:true,paired:true,role:'parent',pairFixture:fixture}
  );
  const teen=await freshContext(
    {viewport:{width:320,height:700},deviceScaleFactor:1,isMobile:true,hasTouch:true},
    {authenticated:true,paired:true,role:'teen',pairFixture:fixture}
  );
  const records=[];
  async function revisit(page){
    await page.goto(base+'#hem',{waitUntil:'load'});
    await page.goto(base+'#regler',{waitUntil:'load'});
    await page.locator('.schyssta-view').waitFor();
  }
  const original='Vi promenerar tillsammans när båda vill.';
  const revised='Vi försöker promenera tillsammans på söndagar.';
  try{
    await parent.page.goto(base+'#regler',{waitUntil:'load'});
    await teen.page.goto(base+'#regler',{waitUntil:'load'});
    await parent.page.locator('[data-schyssta-start]').click();
    await parent.page.locator('#schyssta-body').fill(original);
    await parent.page.getByRole('button',{name:'Skicka regelförslag'}).click();
    await parent.page.locator('.schyssta-list li').filter({hasText:original}).waitFor();
    const originalId=fixture.rules[0].id;
    assert.equal(fixture.rules[0].status,'proposed');
    assert.deepEqual(fixture.rules[0].decisions,{parent:null,teen:null});
    await revisit(teen.page);
    // FBK-02-04: the shared synthetic RPC fixture survives a document reload.
    // A received rule notice must not be counted as unread again after reading.
    assert.equal(fixture.notices.filter(n=>n.recipient==='teen'&&n.read_at===null).length,1,
      'FBK-02-04: teen receives exactly one unread rule notice');
    await teen.page.goto(base+'#inkorg',{waitUntil:'load'});
    await teen.page.locator('[data-schyssta-read]').click();
    await teen.page.waitForFunction(()=>!document.querySelector('#live-mobile-nav a[href="#inkorg"] .live-nav-count'));
    assert.equal(await teen.page.locator('#live-desktop-nav a[href="#inkorg"] .live-nav-count').count(),0,
      'FBK-02-04: desktop badge disappears after rule notice is marked read');
    assert.ok(fixture.notices.every(n=>n.recipient!=='teen'||n.read_at!==null),
      'FBK-02-04: shared fixture stores the explicit read receipt');
    await teen.page.reload({waitUntil:'load'});
    await teen.page.getByRole('heading',{name:'Inkorg',exact:true}).waitFor();
    await teen.page.waitForFunction(()=>!document.querySelector('#live-mobile-nav a[href="#inkorg"] .live-nav-count'));
    assert.equal(await teen.page.locator('#live-desktop-nav a[href="#inkorg"] .live-nav-count').count(),0,
      'FBK-02-04: desktop badge stays clear after a full reload');
    assert.equal(await teen.page.locator('#live-mobile-nav a[href="#inkorg"] .live-nav-count').count(),0,
      'FBK-02-04: mobile badge stays clear after a full reload');
    records.push({case:'rule-notification-badge-stays-read-across-reload',passed:true});
    await revisit(teen.page);
    await teen.page.locator('#schyssta-rule-'+originalId)
      .getByRole('button',{name:'Jag godkänner'}).click();
    await teen.page.waitForFunction(()=>document.querySelector('.schyssta-view')?.textContent?.includes('Ditt val: ja'));
    assert.equal(fixture.rules[0].status,'proposed',
      'FUN-03: one signature is not a mutually accepted agreement');
    // FBK-02-05: simulate a stale click from a previously rendered button.
    // A confirmed YES must not issue a second decision RPC for the same rule.
    const votesBeforeRepeat=fixture.calls.filter(call=>
      call.role==='teen'&&call.name==='set_schyssta_rule_decision').length;
    await teen.page.evaluate(id=>{
      const stale=document.createElement('button');
      stale.type='button';
      stale.dataset.schysstaDecision=id;
      stale.dataset.approved='true';
      document.body.appendChild(stale);
      stale.click();
      stale.remove();
    },originalId);
    await teen.page.waitForTimeout(350);
    assert.equal(fixture.calls.filter(call=>
      call.role==='teen'&&call.name==='set_schyssta_rule_decision').length,
      votesBeforeRepeat,'FBK-02-05: stale duplicate YES must not reach the RPC');
    records.push({case:'repeated-stale-yes-does-not-resubmit-vote',passed:true});
    await revisit(parent.page);
    await parent.page.locator('#schyssta-rule-'+originalId)
      .getByRole('button',{name:'Jag godkänner'}).click();
    await parent.page.locator('#schyssta-rule-'+originalId+' .schyssta-approved-details > summary').waitFor();
    assert.match(await parent.page.locator('.schyssta-view [role="status"]').allTextContents().then(a=>a.join(' ')),/Sparat: ni har båda godkänt regeln/);
    assert.equal(fixture.rules[0].status,'accepted');
    records.push({case:'initial-rule-acceptance-requires-two-votes',passed:true});

    // FBK-02-05: both roles must retain the accepted rule after a real
    // document reload; it must not return to the pending approval list.
    for(const [role,member] of [['parent',parent],['teen',teen]]){
      await member.page.reload({waitUntil:'load'});
      const acceptedRule=member.page.locator(
        '[data-schyssta-filter-group="approved"] #schyssta-rule-'+originalId);
      await acceptedRule.waitFor({state:'visible'});
      assert.equal(await acceptedRule.locator('[data-schyssta-decision]').count(),0,
        'FBK-02-05: '+role+' does not see a second decision prompt for an accepted rule');
      assert.equal(await member.page.locator('#schyssta-needs-answer').count(),0,
        'FBK-02-05: '+role+' has no repeated approval request after both votes');
      assert.equal(fixture.rules.find(rule=>rule.id===originalId)?.status,'accepted',
        'FBK-02-05: reload never changes the shared accepted fixture state');
    }
    records.push({case:'accepted-rule-persists-after-both-role-document-reloads',passed:true});

    await parent.page.locator('#schyssta-rule-'+originalId+' .schyssta-approved-details > summary').click();
    await parent.page.locator('#schyssta-rule-'+originalId).locator('[data-schyssta-edit]').click();
    const draft=parent.page.locator('#schyssta-body');
    await draft.waitFor();
    assert.equal(await draft.inputValue(),original,
      'FUN-03: edit begins with the exact previously accepted rule, not an empty draft');
    await draft.fill(revised);
    await parent.page.getByRole('button',{name:'Skicka ändringsförslag'}).click();
    await parent.page.locator('.schyssta-list li').filter({hasText:revised}).waitFor();
    const proposal=fixture.rules.find(row=>row.body===revised),proposalId=proposal?.id;
    assert.ok(proposalId);
    assert.equal(proposal.status,'proposed');
    assert.equal(fixture.rules.find(row=>row.id===originalId)?.status,'accepted',
      'FUN-03: original stays active while replacement is awaiting votes');
    assert.equal(fixture.replacementLinks.length,1);
    await parent.page.locator('#schyssta-rule-'+proposalId)
      .getByText('Den tidigare överenskommelsen gäller tills ni båda har godkänt den nya formuleringen.').waitFor();
    records.push({case:'replacement-proposal-keeps-old-rule-active',passed:true});

    await revisit(teen.page);
    await teen.page.locator('#schyssta-rule-'+proposalId).waitFor();
    assert.equal(await teen.page.locator('#schyssta-rule-'+originalId).count(),1,
      'FUN-03: teen still sees the old accepted rule while replacement is pending');
    await teen.page.locator('#schyssta-rule-'+proposalId)
      .getByRole('button',{name:'Jag godkänner'}).click();
    await teen.page.waitForFunction(()=>document.querySelector('.schyssta-view')?.textContent?.includes('Ditt val: ja'));
    assert.equal(proposal.status,'proposed',
      'FUN-03: one person approving revised text cannot replace old rule');
    assert.equal(fixture.ruleHistory.length,0);
    await revisit(parent.page);
    await parent.page.locator('#schyssta-rule-'+proposalId)
      .getByRole('button',{name:'Jag godkänner'}).click();
    await parent.page.locator('#schyssta-rule-'+proposalId+' .schyssta-approved-details > summary').waitFor();
    assert.equal(proposal.status,'accepted');
    assert.equal(fixture.rules.some(row=>row.id===originalId),false,
      'FUN-03: original no longer active once replacement is accepted by both');
    assert.equal(fixture.ruleHistory.length,1);
    assert.equal(fixture.ruleHistory[0].body,original);
    await revisit(teen.page);
    assert.equal(await teen.page.locator('.schyssta-filter-group #schyssta-rule-'+originalId).count(),0,
      'FUN-03: old rule no longer exists in active lists; the archived history entry remains');
    await teen.page.locator('#schyssta-rule-'+proposalId+' .schyssta-approved-details > summary').waitFor();
    const archive=teen.page.locator('#schyssta-history');
    await archive.waitFor();
    await archive.locator('summary').click();
    await archive.getByText(original).waitFor();
    records.push({case:'two-votes-replace-original-and-archive-old-text',passed:true});

    // Clipboard denial must show a readable, selectable current rule in teen role too.
    // Export is deliberately collapsed so the accepted rule remains primary.
    const teenExportPanel=teen.page.locator('.schyssta-export-panel');
    assert.equal(await teenExportPanel.count(),1,'Teen sees one optional export control');
    assert.equal(await teenExportPanel.evaluate(el=>el.open),false,
      'Teen export starts collapsed after reloading the updated agreements');
    await teenExportPanel.locator('summary').click();
    assert.equal(await teenExportPanel.evaluate(el=>el.open),true,
      'Teen can explicitly reveal clipboard and download actions');
    await teen.page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{
      writeText:async()=>{throw Error('Synthetic denied clipboard');}
    }}));
    await teen.page.getByRole('button',{name:'Kopiera aktuella regler'}).click();
    const teenFallback=teen.page.locator('#schyssta-copy-fallback');
    await teenFallback.waitFor();
    assert.ok((await teenFallback.inputValue()).includes(revised));
    assert.ok(!(await teenFallback.inputValue()).includes(original),
      'Teen fallback includes only the replacement accepted by both');
    assert.equal(await teenFallback.evaluate(el=>document.activeElement===el
      &&el.selectionStart===0&&el.selectionEnd===el.value.length),true);
    await checkOverflow(teen.page,'FUN-03 clipboard denial 320px');
    await capture(teen.page,'fun-03-clipboard-fallback-teen.png');
    records.push({case:'teen-clipboard-denial-selectable-current-rule',passed:true});

    // The clipboard fallback re-renders this view and may collapse optional
    // export tools again. Reopen them as a user would before downloading.
    const exportPanelAfterFallback=teen.page.locator('.schyssta-export-panel');
    await exportPanelAfterFallback.waitFor();
    if(!(await exportPanelAfterFallback.evaluate(el=>el.open))){
      await exportPanelAfterFallback.locator('summary').click();
    }
    assert.equal(await exportPanelAfterFallback.evaluate(el=>el.open),true,
      'Teen can access download after clipboard fallback redraw');
    // Export should contain only the CURRENT accepted replacement.
    const download=teen.page.waitForEvent('download');
    await teen.page.getByRole('button',{name:'Ladda ner som textfil'}).click();
    const file=await download;
    const exported=await fs.readFile(await file.path(),'utf8');
    assert.match(exported,/Våra gemensamma överenskommelser/);
    assert.ok(exported.includes(revised));
    assert.ok(!exported.includes(original));
    records.push({case:'export-excludes-superseded-rule',passed:true});

    // Cancel is local only; confirm archives the current rule and removes
    // it from the other account's active list on refresh.
    await teen.page.locator('#schyssta-rule-'+proposalId+' .schyssta-approved-details > summary').click();
    await teen.page.locator('#schyssta-rule-'+proposalId).locator('[data-schyssta-end]').click();
    await teen.page.getByRole('group',{name:'Bekräfta avslut'}).waitFor();
    await teen.page.getByRole('button',{name:'Avbryt'}).click();
    assert.equal(fixture.rules.some(row=>row.id===proposalId),true);
    assert.equal(fixture.ruleHistory.length,1);
    await teen.page.locator('#schyssta-rule-'+proposalId).locator('[data-schyssta-end]').click();
    await teen.page.getByRole('button',{name:'Ja, avsluta'}).click();
    await teen.page.getByText('Överenskommelsen är avslutad och finns kvar i historiken.').waitFor();
    assert.equal(fixture.rules.length,0);
    assert.equal(fixture.ruleHistory.length,2);
    assert.equal(fixture.replacementLinks.length,0);
    await revisit(parent.page);
    assert.equal(await parent.page.locator('[data-schyssta-edit]').count(),0);
    assert.equal(await parent.page.locator('[data-schyssta-download]').count(),0,
      'FUN-03: no current approved rule can be exported after ending last agreement');
    await parent.page.locator('#schyssta-history summary').click();
    await parent.page.locator('#schyssta-history').getByText(original).waitFor();
    await parent.page.locator('#schyssta-history').getByText(revised).waitFor();
    await checkOverflow(parent.page,'FUN-03 rule history parent 390px');
    await checkOverflow(teen.page,'FUN-03 rule history teen 320px');
    records.push({case:'end-cancel-then-explicit-confirm-shows-both-history-rows',passed:true});
  }finally{
    await Promise.all([parent.context.close(),teen.context.close()]);
  }
  await fs.writeFile(path.join(output,'fun-03-rule-replacement-history-synthetic.json'),
    JSON.stringify({
      method:'Two independent Chromium roles with shared in-memory rule RPC fixture',
      limitations:'Rule replacement/archive behavior is simulated; real RPC permissions and Auth not tested.',
      records,history:fixture.ruleHistory.map(x=>({id:x.agreement_id,body:x.body}))
    },null,2)+'\n');
  console.log('FUN-03 rule replacement/history: '+records.length+' two-role synthetic scenarios passed.');
}

async function freshContext(options,{authenticated=false,paired=false,role="parent",unlocked=false,unlockUnavailable=false,priorityUnavailable=false,priorityFeature=true,privateImportance=false,importanceReadFailure=false,preansweredGeneral=false,preansweredSkipped=false,emptySchyssta=false,homeUnreadFailure=false,personalityComplete=false,personalitySharing=false,personalityPartnerShared=false,privateRetests=false,aiMediator=false,aiAnalyses=false,activityNotifications=false,preloadedRetestHistory=false,pairFixture=null}={}){
  if(pairFixture && typeof pairFixture.rpc!=='function')throw new Error('Invalid linked fixture');
  const context=await browser.newContext({...options,locale:"sv-SE",reducedMotion:"reduce"});
  if(pairFixture)await context.exposeBinding('__HK_TEST_PAIR_RPC__',(_source,name,args)=>pairFixture.rpc(role,name,args));
  await context.addInitScript(value=>{window.__HK_TEST_USER__=value.user;window.__HK_TEST_PAIRED__=value.paired;window.__HK_TEST_ROLE__=value.role;window.__HK_TEST_UNLOCKED__=value.unlocked;window.__HK_UNLOCK_RPC_UNAVAILABLE__=value.unlockUnavailable;window.__HK_PRIORITY_RPC_UNAVAILABLE__=value.priorityUnavailable;window.__HK_PRIORITISED_TEEN__=value.privateImportance;window.__HK_IMPORTANCE_READ_FAIL__=value.importanceReadFailure;window.__HK_PREANSWERED_GENERAL__=value.preansweredGeneral;window.__HK_PREANSWERED_SKIPPED__=value.preansweredSkipped;window.__HK_SCHYSSTA_EMPTY__=value.emptySchyssta;window.__HK_HOME_UNREAD_FAILURE__=value.homeUnreadFailure;window.__HK_TEST_PERSONALITY_DONE__=value.personalityComplete;window.__HK_TEST_PERSONALITY_PARTNER_SHARED__=value.personalityPartnerShared;window.__HK_TEST_RETEST_HISTORY_TWO__=value.preloadedRetestHistory;},{preloadedRetestHistory,personalityPartnerShared,personalityComplete,emptySchyssta,homeUnreadFailure,preansweredGeneral,preansweredSkipped,user:authenticated?{id:role==="teen"?"10000000-0000-0000-0000-000000000002":"10000000-0000-0000-0000-000000000001",email:"synthetic@example.invalid"}:null,paired,role,unlocked,unlockUnavailable,priorityUnavailable,privateImportance,importanceReadFailure});
  await context.route(base+"backend-config.js*",route=>route.fulfill({
    contentType:"application/javascript",
    body:"window.HEMMAKOMPASSEN_BACKEND=Object.freeze({supabaseUrl:'https://synthetic.invalid',supabasePublishableKey:'synthetic',enableSharedPriorities:"+String(priorityFeature)+",enableSharedPolling:true,enableSharedInsights:true,enableSharedUnderstanding:true,enableSchysstaList:true,enableActivityNotifications:"+String(activityNotifications)+",enablePersonalitySharing:"+String(personalitySharing)+",enablePrivateRetests:"+String(privateRetests)+",enableAiMediator:"+String(aiMediator||aiAnalyses)+",enableAiHistory:"+String(aiMediator||aiAnalyses)+",enableAiResultAnalyses:"+String(aiAnalyses)+",aiMediatorUrl:'https://hemmakompassen-ai-medlare.erikbertiljarl.workers.dev/api/ai/mediate'});"
  }));
  await context.route("https://esm.sh/**",route=>route.fulfill({
    contentType:"application/javascript",
    body:`
      export function createClient(){
        const current=()=>window.__HK_TEST_USER__;
        const answers=new Map(window.__HK_PREANSWERED_GENERAL__?Array.from({length:34},(_,i)=>{const id='general-'+String(i+1).padStart(2,'0');return [id,{deck_id:'general',card_id:id,answer:true}]}):window.__HK_TEST_PAIRED__?[['general-01',{deck_id:'general',card_id:'general-01',answer:true}],['general-02',{deck_id:'general',card_id:'general-02',answer:false}]]:[]);
        const personalityAnswers=new Map(window.__HK_TEST_PERSONALITY_DONE__?Array.from({length:50},(_,i)=>['ipip50-'+String(i+1).padStart(3,'0'),3]):[]);
        let personalityConsent=false;
        const retestAttempts=window.__HK_TEST_RETEST_HISTORY_TWO__?[
          {id:'90000000-0000-4000-8000-000000000022',user_id:current().id,
            created_at:'2026-11-07T12:00:00Z',completed_at:'2026-11-07T13:00:00Z'},
          {id:'90000000-0000-4000-8000-000000000021',user_id:current().id,
            created_at:'2026-11-07T09:00:00Z',completed_at:'2026-11-07T10:00:00Z'}
        ]:[];
        const retestAnswers=window.__HK_TEST_RETEST_HISTORY_TWO__?
          retestAttempts.flatMap((attempt,index)=>Array.from({length:50},(_,i)=>({
            attempt_id:attempt.id,user_id:attempt.user_id,
            question_id:'ipip50-'+String(i+1).padStart(3,'0'),answer_value:index===0?4:2
          }))):[];
        const skips=new Map();
        if(window.__HK_PREANSWERED_SKIPPED__){answers.delete('general-02');skips.set('general-02',{deck_id:'general',card_id:'general-02'});}
        const importance=new Map(window.__HK_PRIORITISED_TEEN__?[
          ['general:general-01',{user_id:current().id,deck_id:'general',card_id:'general-01',importance:1}],
          ['general:general-02',{user_id:current().id,deck_id:'general',card_id:'general-02',importance:1}],
          ['general:general-10',{user_id:current().id,deck_id:'general',card_id:'general-10',importance:0}]
        ]:[]);
        const understandingShares=new Set(window.__HK_TEST_PAIRED__?['general-02']:[]);
        const priorityShares=new Set();
        window.__HK_TEST_SET_SHARED_B__=ids=>{understandingShares.clear();for(const id of ids)understandingShares.add(id);};
        let schysstaSuggestions=[
          {card_id:'regler-01',body:'Vi knackar innan vi går in i varandras rum.'},
          {card_id:'regler-02',body:'Falsk text som aldrig får visas.'},
          {card_id:'regler-99',body:'Okänd privat uppgift'}
        ];
        let schysstaReplacementLinks=[];
        let schysstaHistory=[];
        let chatMessages=window.__HK_TEST_PAIRED__?[{message_id:'71000000-0000-4000-8000-000000000001',body:'Hej, ska vi prata senare?',sent_by_me:false,created_at:'2026-11-01T10:00:00Z',read_at:null}]:[];
        const chatTokens=new Map();
        let activityNotices=[{notification_id:'57000000-0000-4000-8000-000000000001',
          event_kind:'mutual_match',deck_id:'aktiviteter',read_at:null,updated_at:'2026-11-07T09:00:00Z'}];
        let schysstaNotifications=[{notification_id:'40000000-0000-4000-8000-000000000001',agreement_id:'30000000-0000-4000-8000-000000000001',kind:'rule_proposed',body:'Vi pratar om hur vi delar på sysslorna.',read_at:null,created_at:'2026-10-30T12:00:01Z'}];
        let schysstaManualRules=[{agreement_id:'30000000-0000-4000-8000-000000000001',body:'Vi pratar om hur vi delar på sysslorna.',status:'proposed',agreement_version:1,proposed_by_me:false,own_decision:null,parent_decision:null,teen_decision:null,created_at:'2026-10-30T12:00:00Z'}];
        schysstaManualRules.push({agreement_id:'30000000-0000-4000-8000-000000000003',body:'Vi frågar innan vi lånar saker.',status:'accepted',agreement_version:1,proposed_by_me:false,own_decision:true,parent_decision:true,teen_decision:true,created_at:'2026-10-30T12:00:00Z'});
        let schysstaRules=[{agreement_id:'20000000-0000-4000-8000-000000000001',source_card_id:'regler-03',body:'Vi får pausa gräl och bestämmer när vi pratar vidare.',status:'proposed',proposed_by_me:false,own_decision:null,parent_decision:null,teen_decision:true,created_at:'2026-10-30T12:00:00Z'}];
        return {
          auth:{
            async getUser(){return {data:{user:current()},error:current()?null:{name:'AuthSessionMissingError'}}},
            async getSession(){return {data:{session:current()?{user:current(),access_token:'synthetic-jwt'}:null},error:null}},
            onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},
            async signInWithPassword(){return {error:null}}
          },
          from(table){
            if(table==='personality_test_attempts'||table==='personality_attempt_answers'){
              const list=table==='personality_test_attempts'?retestAttempts:retestAnswers;
              function chain(operation='read',payload=null){
                const filters={};
                const run=()=>{
                  if(operation==='insert'){
                    window.__HK_RETEST_START_WRITES__=(window.__HK_RETEST_START_WRITES__||0)+1;
                    if(window.__HK_TEST_RETEST_START_REJECT__){
                      window.__HK_TEST_RETEST_START_REJECT__=false;
                      return {data:null,error:{message:'Synthetic creation rejected'}};
                    }
                    const row={id:'90000000-0000-4000-8000-000000000001',...payload,
                      created_at:'2026-11-07T10:00:00Z',completed_at:null};
                    list.push(row);
                    if(window.__HK_TEST_RETEST_START_LOST_ACK__){
                      window.__HK_TEST_RETEST_START_LOST_ACK__=false;
                      return {data:null,error:{message:'Synthetic creation ACK lost'}};
                    }
                    return {data:{...row},error:null};
                  }
                  if(operation==='delete'){
                    window.__HK_RETEST_DELETE_WRITES__=(window.__HK_RETEST_DELETE_WRITES__||0)+1;
                    if(window.__HK_TEST_RETEST_DELETE_REJECT__){
                      window.__HK_TEST_RETEST_DELETE_REJECT__=false;
                      return {data:null,error:{message:'Synthetic private attempt delete rejected'}};
                    }
                    const index=list.findIndex(a=>Object.entries(filters).every(([k,v])=>a[k]===v));
                    if(index<0)return {data:null,error:{message:'missing attempt'}};
                    const [deleted]=list.splice(index,1);
                    for(let n=retestAnswers.length-1;n>=0;n--)
                      if(retestAnswers[n].attempt_id===deleted.id)retestAnswers.splice(n,1);
                    if(window.__HK_TEST_RETEST_DELETE_LOST_ACK__){
                      window.__HK_TEST_RETEST_DELETE_LOST_ACK__=false;
                      return {data:null,error:{message:'Synthetic private attempt deletion ACK lost'}};
                    }
                    return {data:{id:deleted.id},error:null};
                  }
                  if(operation==='update'){
                    window.__HK_RETEST_COMPLETE_WRITES__=(window.__HK_RETEST_COMPLETE_WRITES__||0)+1;
                    if(window.__HK_TEST_RETEST_COMPLETE_REJECT__){
                      window.__HK_TEST_RETEST_COMPLETE_REJECT__=false;
                      return {data:null,error:{message:'Synthetic completion rejected'}};
                    }
                    const row=list.find(a=>Object.entries(filters).every(([k,v])=>a[k]===v));
                    if(!row)return {data:null,error:{message:'missing row'}};
                    if(retestAnswers.length!==50)return {data:null,error:{message:'incomplete'}};
                    Object.assign(row,payload);
                    if(window.__HK_TEST_RETEST_COMPLETE_LOST_ACK__){
                      window.__HK_TEST_RETEST_COMPLETE_LOST_ACK__=false;
                      return {data:null,error:{message:'Synthetic completion ACK lost'}};
                    }
                    return {data:{...row},error:null};
                  }
                  if(table==='personality_test_attempts'&&operation==='read'){
                    if(window.__HK_TEST_RETEST_LIFECYCLE_READ_FAIL__){
                      window.__HK_TEST_RETEST_LIFECYCLE_READ_FAIL__=false;
                      return {data:null,error:{message:'Synthetic attempts list unreadable'}};
                    }
                  }
                  if(table==='personality_attempt_answers'&&operation==='read'){
                    window.__HK_RETEST_ACK_READS__=(window.__HK_RETEST_ACK_READS__||0)+1;
                    if(window.__HK_TEST_RETEST_READ_FAIL__){
                      window.__HK_TEST_RETEST_READ_FAIL__=false;
                      return {data:null,error:{message:'Synthetic private retest readback failed'}};
                    }
                  }
                  return {data:list.filter(a=>Object.entries(filters).every(([k,v])=>a[k]===v))
                    .map(a=>({...a})),error:null};
                };
                const q={
                  select(){return q;},
                  eq(k,v){filters[k]=v;return q;},
                  order(){return Promise.resolve(run());},
                  single(){return Promise.resolve(run());},
                  maybeSingle(){
                    const result=run();
                    window.__HK_RETEST_LIFECYCLE_READBACKS__=(window.__HK_RETEST_LIFECYCLE_READBACKS__||0)+1;
                    return Promise.resolve(result.error?result:{...result,data:Array.isArray(result.data)?result.data[0]||null:result.data});
                  },
                  then(resolve,reject){return Promise.resolve(run()).then(resolve,reject);}
                };
                return q;
              }
              return {
                select(){return chain();},
                insert(row){return chain('insert',row);},
                update(row){return chain('update',row);},
                delete(){return chain('delete');},
                async upsert(row){
                  window.__HK_RETEST_ACK_WRITES__=(window.__HK_RETEST_ACK_WRITES__||0)+1;
                  if(window.__HK_TEST_RETEST_REJECT_WRITE__){
                    window.__HK_TEST_RETEST_REJECT_WRITE__=false;
                    return {error:{message:'Synthetic private retest write rejected'}};
                  }
                  const found=retestAnswers.find(a=>a.attempt_id===row.attempt_id&&a.question_id===row.question_id);
                  if(found)found.answer_value=row.answer_value;else retestAnswers.push({...row});
                  window.__HK_PRIVATE_RETEST_ANSWERS__=retestAnswers.length;
                  window.__HK_RETEST_LAST_WRITE__={...row};
                  if(window.__HK_TEST_RETEST_LOST_ACK__){
                    window.__HK_TEST_RETEST_LOST_ACK__=false;
                    return {error:{message:'Synthetic private retest ACK lost after commit'}};
                  }
                  return {error:null};
                }
              };
            }
            if(table==='personality_share_preferences')return {
              select(){return {eq(){return {eq(){return {async maybeSingle(){return {data:personalityConsent?{share_enabled:true}:null,error:null};}}}}}};}
            };
            if(table==='personality_answers')return {
              select(columns){
                const filters={};
                const matching=()=>[...personalityAnswers].map(([id,value])=>({
                  question_id:id,answer:{value}
                })).filter(row=>!filters.question_id||row.question_id===filters.question_id);
                const query={
                  eq(key,value){filters[key]=value;return query;},
                  async maybeSingle(){
                    window.__HK_PERSONALITY_READBACK_COUNT__=(window.__HK_PERSONALITY_READBACK_COUNT__||0)+1;
                    if(columns!=='question_id,answer'||filters.user_id!==current()?.id||
                      filters.instrument_id!=='ipip50-sv-v1'||!filters.question_id)
                      return {data:null,error:{message:'Invalid own-answer readback'}};
                    if(window.__HK_TEST_PF_RECHECK_READ_FAIL__){
                      window.__HK_TEST_PF_RECHECK_READ_FAIL__=false;
                      return {data:null,error:{message:'Synthetic IPIP-50 readback offline'}};
                    }
                    return {data:matching()[0]||null,error:null};
                  },
                  then(resolve,reject){
                    return Promise.resolve({data:matching(),error:null}).then(resolve,reject);
                  }
                };
                return query;
              },
              async upsert(row,options){
                window.__HK_PERSONALITY_WRITE_COUNT__=(window.__HK_PERSONALITY_WRITE_COUNT__||0)+1;
                if(window.__HK_TEST_PF_FAIL_BEFORE_WRITE__){
                  window.__HK_TEST_PF_FAIL_BEFORE_WRITE__=false;
                  return {error:{message:'Synthetic IPIP-50 write rejected'}};
                }
                personalityAnswers.set(row.question_id,row.answer.value);
                window.__HK_PERSONALITY_SAVE__={row,options};
                if(window.__HK_TEST_PF_FAIL_AFTER_WRITE__){
                  window.__HK_TEST_PF_FAIL_AFTER_WRITE__=false;
                  return {error:{message:'Synthetic IPIP-50 acknowledgement lost'}};
                }
                return {error:null};
              }
            };
            if(table==='profiles')return {select(){return {eq(){return {async maybeSingle(){return {data:current()?{display_name:window.__HK_TEST_ROLE__==='teen'?'Provtonåring':'Provförälder'}:null,error:null}}}}}}};
            if(table==='swipe_answers')return {
              select(){
                const filters={};
                const values=()=>[...answers.values()].filter(row=>Object.entries(filters).every(([key,value])=>
                  (key==='user_id'&&!row.user_id)||row[key]===value));
                const query={
                  eq(key,value){filters[key]=value;return query;},
                  async maybeSingle(){
                    window.__HK_SWIPE_READBACK_COUNT__=(window.__HK_SWIPE_READBACK_COUNT__||0)+1;
                    if(window.__HK_TEST_SWIPE_RECHECK_READ_FAIL__){
                      window.__HK_TEST_SWIPE_RECHECK_READ_FAIL__=false;
                      return {data:null,error:{message:'Synthetic answer readback unavailable'}};
                    }
                    return {data:values()[0]||null,error:null};
                  },
                  then(resolve,reject){return Promise.resolve({data:values(),error:null}).then(resolve,reject);}
                };
                return query;
              },
              async upsert(row,options){
                window.__HK_SWIPE_UPSERT_CALLS__=(window.__HK_SWIPE_UPSERT_CALLS__||0)+1;
                if(window.__HK_TEST_SWIPE_FAIL_BEFORE_WRITE__){
                  window.__HK_TEST_SWIPE_FAIL_BEFORE_WRITE__=false;
                  return {error:{message:'Synthetic write rejected'}};
                }
                answers.set(row.card_id,row);
                window.__HK_SAVED_SWIPE__={row,options};
                if(window.__HK_TEST_SWIPE_FAIL_AFTER_WRITE__){
                  window.__HK_TEST_SWIPE_FAIL_AFTER_WRITE__=false;
                  return {error:{message:'Synthetic acknowledgement lost'}};
                }
                return {error:null};
              }
            };
            if(table==='swipe_skips')return {
              select(){
                const filters={};
                const values=()=>[...skips.values()].filter(row=>Object.entries(filters).every(([key,value])=>
                  (key==='user_id'&&!row.user_id)||row[key]===value));
                const query={
                  eq(key,value){filters[key]=value;return query;},
                  async maybeSingle(){
                    window.__HK_B_SKIP_READBACKS__=(window.__HK_B_SKIP_READBACKS__||0)+1;
                    if(window.__HK_TEST_B_SKIP_RECHECK_FAIL__){
                      window.__HK_TEST_B_SKIP_RECHECK_FAIL__=false;
                      return {data:null,error:{message:'Synthetic B-skip readback failed'}};
                    }
                    return {data:values()[0]||null,error:null};
                  },
                  then(resolve,reject){return Promise.resolve({data:values(),error:null}).then(resolve,reject);}
                };
                return query;
              }
            };
            if(table==='swipe_importance')return {
              select(columns){
                const filters={};
                const values=()=>[...importance.values()].filter(row=>
                  Object.entries(filters).every(([key,value])=>row[key]===value));
                const query={
                  eq(key,value){filters[key]=value;return query;},
                  async maybeSingle(){
                    window.__HK_IMPORTANCE_ACK_READBACKS__=(window.__HK_IMPORTANCE_ACK_READBACKS__||0)+1;
                    if(window.__HK_TEST_IMPORTANCE_READBACK_FAIL__){
                      window.__HK_TEST_IMPORTANCE_READBACK_FAIL__=false;
                      return {data:null,error:{message:'Synthetic importance readback failed'}};
                    }
                    return {data:values()[0]||null,error:null};
                  },
                  then(resolve,reject){
                    const result=window.__HK_IMPORTANCE_READ_FAIL__
                      ?{data:null,error:{message:'Synthetic private importance read failed'}}
                      :{data:values(),error:null};
                    return Promise.resolve(result).then(resolve,reject);
                  }
                };
                return query;
              },
              async upsert(row,options){
                window.__HK_IMPORTANCE_WRITE_COUNT__=(window.__HK_IMPORTANCE_WRITE_COUNT__||0)+1;
                if(window.__HK_TEST_BLOCK_IMPORTANCE__){
                  window.__HK_TEST_BLOCK_IMPORTANCE__=false;
                  await new Promise(resolve=>{window.__HK_TEST_RELEASE_IMPORTANCE__=()=>{
                    window.__HK_TEST_RELEASE_IMPORTANCE__=null;resolve();};});
                  if(window.__HK_TEST_FAIL_IMPORTANCE_ON_RELEASE__){
                    window.__HK_TEST_FAIL_IMPORTANCE_ON_RELEASE__=false;
                    return {error:{message:'Synthetic importance write failed'}};
                  }
                }
                if(window.__HK_TEST_IMPORTANCE_FAIL_BEFORE_WRITE__){
                  window.__HK_TEST_IMPORTANCE_FAIL_BEFORE_WRITE__=false;
                  return {error:{message:'Synthetic rating rejected before commit'}};
                }
                importance.set(row.deck_id+':'+row.card_id,row);
                window.__HK_SAVED_IMPORTANCE__={row,options};
                if(window.__HK_TEST_IMPORTANCE_FAIL_AFTER_WRITE__){
                  window.__HK_TEST_IMPORTANCE_FAIL_AFTER_WRITE__=false;
                  return {error:{message:'Synthetic rating ACK lost after commit'}};
                }
                return {error:null};
              }
            };
            if(table==='swipe_priority_shares')return {select(){return {async eq(){return window.__HK_PRIORITY_READ_FAIL__
              ?{data:null,error:{message:'Synthetic consent read failed'}}
              :{data:window.__HK_TEST_ROLE__==='teen'?[...priorityShares].map(key=>{const [deck_id,card_id]=key.split(':');return {deck_id,card_id};}):[],error:null};}}}};
            if(table==='understanding_card_shares')return {select(){return {async eq(){return window.__HK_UNDERSTANDING_SHARE_READ_FAIL__?{data:null,error:{message:'Synthetic consent read failed'}}:{data:window.__HK_TEST_ROLE__==='teen'?[...understandingShares].map(card_id=>({deck_id:'general',card_id})):[],error:null}}}}};
            throw new Error('Unexpected table '+table);
          },
          async rpc(name,args){
            if(typeof window.__HK_TEST_PAIR_RPC__==='function'&&['my_family_messages','my_family_unread_message_count','send_family_message','mark_family_messages_read','shared_schyssta_rule_suggestions','my_schyssta_rules','my_manual_schyssta_rules','my_schyssta_notifications','my_schyssta_replacement_links','my_schyssta_rule_history','propose_manual_schyssta_rule','propose_schyssta_change','withdraw_schyssta_rule','set_schyssta_rule_decision','mark_schyssta_notification_read','my_activity_notifications','mark_activity_notification_read'].includes(name))return window.__HK_TEST_PAIR_RPC__(name,args);
            if(name==='set_my_ipip50_share'){personalityConsent=args.p_share===true;window.__HK_PERSONALITY_SHARE__=personalityConsent;return {data:personalityConsent,error:null};}
            if(name==='my_ipip50_shared_profiles'){
              const scores={extraversion:30,agreeableness:30,conscientiousness:30,emotional_stability:30,intellect_imagination:30};
              const teenScores={...scores,conscientiousness:45,agreeableness:40}; // Synthetic differences; extraversion remains equal for geometry tests.
              return {data:personalityConsent&&window.__HK_TEST_PERSONALITY_PARTNER_SHARED__?{instrument_id:'ipip50-sv-v1',viewer_role:window.__HK_TEST_ROLE__,profiles:[{role:'parent',scores},{role:'teen',scores:teenScores}]}:null,error:null};
            }
            if(window.__HK_HOME_UNREAD_FAILURE__===true&&['my_family_unread_message_count','my_schyssta_notifications'].includes(name))return {data:null,error:{message:'Synthetic notification source unavailable'}};
            if(window.__HK_SCHYSSTA_EMPTY__===true&&['shared_schyssta_rule_suggestions','my_schyssta_rules','my_manual_schyssta_rules','my_schyssta_notifications','my_schyssta_replacement_links','my_schyssta_rule_history'].includes(name))return {data:[],error:null};
            if(name==='my_activity_notifications')return {data:window.__HK_TEST_PAIRED__?activityNotices:[],error:null};
            if(name==='mark_activity_notification_read'){
              window.__HK_ACTIVITY_MARK_COUNT__=(window.__HK_ACTIVITY_MARK_COUNT__||0)+1;
              activityNotices=activityNotices.map(n=>n.notification_id===args.p_notification_id
                ?{...n,read_at:'2026-11-07T09:01:00Z'}:n);
              return {data:null,error:null};
            }
            if(name==='my_current_inbox_pair_epoch')return {data:window.__HK_TEST_PAIRED__?'test-family:parent:teen:parent-joined:teen-joined':null,error:null};
            if(name==='my_family_members'){
              const data=current()?(window.__HK_TEST_PAIRED__?[{user_id:'10000000-0000-0000-0000-000000000001',role:'parent',display_name:'Provförälder'},{user_id:'10000000-0000-0000-0000-000000000002',role:'teen',display_name:'Provtonåring'}]:[{user_id:current().id,role:window.__HK_TEST_ROLE__,display_name:window.__HK_TEST_ROLE__==='teen'?'Provtonåring':'Provförälder'}]):[];
              if(window.__HK_TEST_HOLD_NEXT_PAIR_READ__){
                window.__HK_TEST_HOLD_NEXT_PAIR_READ__=false;
                return await new Promise(resolve=>{window.__HK_TEST_RELEASE_PAIR_READ__=()=>{
                  window.__HK_TEST_RELEASE_PAIR_READ__=null;resolve({data,error:null});};});
              }
              return {data,error:null};
            }
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
              return {data:[{deck_id:'general',card_id:'general-10'},...[...priorityShares].map(key=>{const [deck_id,card_id]=key.split(':');return {deck_id,card_id};}),{deck_id:'general',card_id:'general-02'},{deck_id:'general',card_id:'general-03'},{deck_id:'general',card_id:'general-99'}],error:null};
            }
            if(name==='set_swipe_priority_share'){
              window.__HK_PRIORITY_SHARE__={name,args};
              if(window.__HK_PRIORITY_RPC_FAIL_NO_WRITE__)return {data:null,error:{message:'Synthetic write rejected'}};
              const key=args.p_deck_id+':'+args.p_card_id;
              if(args.p_share)priorityShares.add(key);else priorityShares.delete(key);
              if(window.__HK_PRIORITY_RPC_FAIL_AFTER_WRITE__)return {data:null,error:{message:'Synthetic acknowledgement lost'}};
              return {data:null,error:null};
            }
            if(name==='shared_general_deck_complete'){
              window.__HK_UNLOCK_RPC_CALLS__=(window.__HK_UNLOCK_RPC_CALLS__||0)+1;
              if(window.__HK_UNLOCK_RPC_UNAVAILABLE__)return {data:null,error:{message:'synthetic unavailable'}};
              return {data:!!(window.__HK_TEST_PAIRED__&&window.__HK_TEST_UNLOCKED__),error:null};
            }
            if(name==='set_understanding_card_state'){
              window.__HK_B_STATE_WRITES__=(window.__HK_B_STATE_WRITES__||0)+1;
              if(window.__HK_TEST_B_FAIL_BEFORE_WRITE__){
                window.__HK_TEST_B_FAIL_BEFORE_WRITE__=false;
                return {data:null,error:{message:'Synthetic B state rejected'}};
              }
              window.__HK_UNDERSTANDING_STATE__={name,args};
              if(args.p_skipped){answers.delete(args.p_card_id);skips.set(args.p_card_id,{deck_id:'general',card_id:args.p_card_id});}
              else {skips.delete(args.p_card_id);answers.set(args.p_card_id,{deck_id:'general',card_id:args.p_card_id,answer:args.p_answer});}
              if(window.__HK_TEST_B_FAIL_AFTER_WRITE__){
                window.__HK_TEST_B_FAIL_AFTER_WRITE__=false;
                return {data:null,error:{message:'Synthetic B acknowledgement lost'}};
              }
              return {data:null,error:null};
            }
            if(name==='shared_understanding_cards')return {data:[...understandingShares].map(card_id=>({deck_id:'general',card_id})),error:null};
            if(name==='set_understanding_card_share'){
              window.__HK_UNDERSTANDING_SHARE__={name,args};
              window.__HK_UNDERSTANDING_WRITES__=(window.__HK_UNDERSTANDING_WRITES__||0)+1;
              if(window.__HK_UNDERSTANDING_RPC_FAIL_BEFORE_WRITE__)return {data:null,error:{message:'Synthetic write rejected'}};
              if(args.p_share)understandingShares.add(args.p_card_id);else understandingShares.delete(args.p_card_id);
              if(window.__HK_UNDERSTANDING_RPC_FAIL_AFTER_WRITE__)return {data:null,error:{message:'Synthetic acknowledgement lost'}};
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
              window.__HK_CHAT_FETCHES__=(window.__HK_CHAT_FETCHES__||0)+1;
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
              if(window.__HK_MARK_READ_FAIL__===true)return {data:null,error:{message:'simulated read receipt failure'}};
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
  const mediatorCalls=[];
  // This fixture is deliberately isolated per browser context: two roles are
  // separate synthetic sessions, never real Supabase users or saved messages.
  const mediatorFixture={
    chats:[], messages:new Map(), nextChat:0, failNextOpen:false, failNextSend:false,
    holdNextOpen:false, releaseOpen:null, holdNextDelete:false, releaseDelete:null
  };
  if(aiMediator){
    await context.route('https://hemmakompassen-ai-medlare.erikbertiljarl.workers.dev/api/ai/**',async route=>{
      const req=route.request(),method=req.method(),pathname=new URL(req.url()).pathname;
      const body=method==='POST' ? req.postDataJSON() : null;
      mediatorCalls.push({pathname,method,body});
      let result,status=200;
      if(pathname==='/api/ai/context'&&method==='GET'){
        result={sections:['Gillaswajpen – egna svar'],unavailableCount:0};
      }else if(pathname==='/api/ai/chats'&&method==='GET'){
        result={chats:mediatorFixture.chats.map(chat=>({...chat}))};
      }else if(pathname==='/api/ai/chats'&&method==='POST'){
        status=201;
        const id='00000000-0000-4000-8000-'+String(++mediatorFixture.nextChat).padStart(12,'0');
        const chat={id,title:'Nytt samtal'};
        mediatorFixture.chats.unshift(chat);
        mediatorFixture.messages.set(id,[]);
        result={chat};
      }else if(pathname.startsWith('/api/ai/chats/')&&method==='GET'){
        const id=pathname.slice('/api/ai/chats/'.length);
        if(mediatorFixture.holdNextOpen){
          mediatorFixture.holdNextOpen=false;
          await new Promise(resolve=>{mediatorFixture.releaseOpen=resolve;});
          mediatorFixture.releaseOpen=null;
        }
        if(mediatorFixture.failNextOpen){
          mediatorFixture.failNextOpen=false;status=503;
          result={error:'Tillfälligt fel vid läsning av samtalet.'};
        }else if(!mediatorFixture.messages.has(id)){
          status=404;result={error:'Samtalet finns inte.'};
        }else{
          result={chat:mediatorFixture.chats.find(chat=>chat.id===id),
            messages:mediatorFixture.messages.get(id).map(message=>({...message}))};
        }
      }else if(pathname.startsWith('/api/ai/chats/')&&method==='DELETE'){
        const id=pathname.slice('/api/ai/chats/'.length);
        if(mediatorFixture.holdNextDelete){
          mediatorFixture.holdNextDelete=false;
          await new Promise(resolve=>{mediatorFixture.releaseDelete=resolve;});
          mediatorFixture.releaseDelete=null;
        }
        if(!mediatorFixture.messages.has(id)){
          status=404;result={error:'Samtalet finns inte.'};
        }else{
          mediatorFixture.chats=mediatorFixture.chats.filter(chat=>chat.id!==id);
          mediatorFixture.messages.delete(id);
          result={deleted:true};
        }
      }else if(pathname==='/api/ai/mediate'&&method==='POST'){
        if(mediatorFixture.failNextSend){
          mediatorFixture.failNextSend=false;status=503;
          result={error:'Tillfälligt fel vid svar.'};
        }else if(body?.chatId===undefined&&body?.useProjectContext===false){
          // NVC opt-in uses the existing Worker in ephemeral (not D1 chat) mode.
          result={reply:'När jag blir avbruten känner jag mig frustrerad. Jag behöver få tala till punkt. Vill du lyssna tills jag har sagt klart?',chatId:null,ephemeral:true,remainingToday:9};
        }else if(!mediatorFixture.messages.has(body?.chatId)){
          status=404;result={error:'Okänt samtal.'};
        }else{
          const reply='Vi kan utforska detta steg för steg.';
          mediatorFixture.messages.get(body.chatId).push(
            {role:'user',body:body.message},{role:'assistant',body:reply}
          );
          const chat=mediatorFixture.chats.find(item=>item.id===body.chatId);
          if(chat?.title==='Nytt samtal')chat.title=body.message.slice(0,70);
          result={reply,chatId:body.chatId,ephemeral:false,remainingToday:9};
        }
      }else{
        status=404;result={error:'Unexpected synthetic AI endpoint'};
      }
      await route.fulfill({status,contentType:'application/json',body:JSON.stringify(result)});
    });
  }
  const aiRequests=[];
  const aiFixture={failNext:false,holdNext:false,release:null};
  if(aiAnalyses){
    await context.route('https://hemmakompassen-ai-medlare.erikbertiljarl.workers.dev/api/ai/analyze',async route=>{
      const body=route.request().postDataJSON();
      aiRequests.push(body);
      if(aiFixture.holdNext){
        aiFixture.holdNext=false;
        await new Promise(resolve=>{aiFixture.release=resolve;});
        aiFixture.release=null;
      }
      if(aiFixture.failNext){
        aiFixture.failNext=false;
        await route.fulfill({status:503,contentType:'application/json',
          body:JSON.stringify({error:'Tillfälligt fel vid AI-analys.'})});
      }else{
        await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
          kind:body.kind,scope:body.scope,
          reply:'Ert resultat kan vara en bra samtalsstart.\n\nReflektion: En påhittad adress #kommunikation/losning-extra ska inte länkas.\n\nFörslag:\n1. Prova att lyssna en stund. #kommunikation/lyssna\n2. Ta en liten gemensam kontaktstund. #kommunikation/kontakt',
          basis:'Enbart serververifierade resultat; syntetisk testsituation.'
        })});
      }
    });
  }
  const page=await context.newPage();
  page.on("pageerror",e=>errors.push(e.message));
  // Ignore external font/network warnings; JavaScript exceptions are checked via pageerror.
  await page.goto(base+"#hem",{waitUntil:"load"});
  return {context,page,mediatorCalls,mediatorFixture,aiRequests,aiFixture};
}
// FUN-05: real DOM interactions against an isolated, stateful fake Worker.
// The test does not authenticate any real account or invoke a live model.
// FUN-06: all nine guidance exercises, six situational shortcuts, and
// direct-link/back navigation are tested through the actual page DOM.
async function verifyAllCommunicationExercises(){
  const exercises=['lyssna','pausa','reparera','losning','kontakt','svaart','validera','onskemal','grans'];
  const situationIds=['lyssna','pausa','reparera','losning','validera','grans'];
  const records=[];
  for(const role of ['parent','teen']){
    const width=role==='parent'?390:320;
    const m=await freshContext(
      {viewport:{width,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},
      {authenticated:true,paired:true,role}
    );
    try{
      const page=m.page;
      await page.goto(base+'#kommunikation',{waitUntil:'load'});
      await page.locator('.comm-exercise').first().waitFor();
      assert.equal(await page.locator('.comm-exercise').count(),9,'Exactly nine exercises must be available');
      assert.equal(await page.locator('[data-comm-open]').count(),6,'Exactly six situational shortcuts must be available');
      assert.equal(await page.locator('a[href="#mi-foralder"]').count(),role==='parent'?1:0,
        'MI entry must be visible only for the parent');
      records.push({role,step:'role visibility and exercise inventory',status:'PASS'});
      for(const id of exercises){
        const detail=page.locator('.comm-exercise[data-comm-skill="'+id+'"]');
        const summary=detail.locator('summary');
        assert.equal(await detail.evaluate(node=>node.open),false,'Exercise initially closed: '+id);
        await summary.click();
        assert.equal(await detail.evaluate(node=>node.open),true,'Mouse opens '+id);
        assert.equal(await detail.locator('.comm-exercise-content li').count(),3,
          'Every exercise has three concrete steps: '+id);
        await summary.press('Enter');
        assert.equal(await detail.evaluate(node=>node.open),false,'Keyboard Enter closes '+id);
        records.push({role,step:'mouse and keyboard open/close '+id,status:'PASS'});
      }
      for(const id of situationIds){
        const button=page.locator('[data-comm-open="'+id+'"]');
        await button.click();
        const detail=page.locator('.comm-exercise[data-comm-skill="'+id+'"]');
        assert.equal(await detail.evaluate(node=>node.open),true,'Situational button opens '+id);
        assert.equal(await detail.locator('summary').evaluate(node=>document.activeElement===node),true,
          'Situational button focuses selected exercise summary: '+id);
        records.push({role,step:'situation button opens and focuses '+id,status:'PASS'});
      }
      // Direct links should work after reload, including all nine exercise routes.
      for(const id of exercises){
        await page.goto(base+'#kommunikation/'+id,{waitUntil:'load'});
        const detail=page.locator('.comm-exercise[data-comm-skill="'+id+'"]');
        await detail.waitFor();
        await page.waitForFunction(skill=>{
          const el=document.querySelector('.comm-exercise[data-comm-skill="'+skill+'"]');
          return el?.open&&document.activeElement===el.querySelector('summary');
        },id);
        assert.equal(await page.locator('#live-mobile-nav a[href="#kommunikation"]').getAttribute('aria-current'),
          'page','Subroute retains correct primary navigation: '+id);
        records.push({role,step:'direct link opens and focuses '+id,status:'PASS'});
      }
      for(const id of ['spegla','plan']){
        await page.goto(base+'#kommunikation/'+id,{waitUntil:'load'});
        const selector=id==='spegla'?'#comm-reflection-practice h2':'#comm-solution-planner h2';
        await page.waitForFunction(sel=>document.activeElement===document.querySelector(sel),selector);
        records.push({role,step:'private form deeplink focuses '+id,status:'PASS'});
      }
      // Browser history should restore the previous exercise rather than trapping the user.
      await page.goto(base+'#kommunikation/lyssna',{waitUntil:'load'});
      await page.goto(base+'#kommunikation/kontakt',{waitUntil:'load'});
      await page.goBack({waitUntil:'load'});
      await page.waitForURL(/#kommunikation\/lyssna$/);
      await page.waitForFunction(()=>{
        const detail=document.querySelector('.comm-exercise[data-comm-skill="lyssna"]');
        return detail?.open&&document.activeElement===detail.querySelector('summary');
      });
      records.push({role,step:'browser back restores previous exercise',status:'PASS'});
      await checkOverflow(page,'FUN-06 guidance '+role+' '+width+'px');
      await capture(page,'fun-06-exercises-'+role+'.png');
    }finally{
      await m.context.close();
    }
  }
  await fs.writeFile(path.join(output,'fun-06-exercises-synthetic.json'),
    JSON.stringify({
      kind:'synthetic-browser-functional-test',
      environment:'Playwright Chromium, parent 390px and teen 320px, mocked Supabase Auth',
      authenticAccounts:false,physicalMobile:false,
      checkedExerciseIds:exercises,
      checkedSituationIds:situationIds,
      records
    },null,2)+'\n');
  console.log('FUN-06 exercise browser flows: '+records.length+' synthetic role/step checks passed.');
}

// FUN-05 AI-result UX: both synthetic roles use real DOM and intercepted Worker.
async function verifyAiReflectionRetryAndRoutes(){
  const records=[];
  for(const role of ['parent','teen']){
    const width=role==='parent'?390:320;
    const m=await freshContext(
      {viewport:{width,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},
      {authenticated:true,paired:true,role,personalityComplete:true,aiAnalyses:true}
    );
    try{
      await m.page.goto(base+'#personlighet',{waitUntil:'load'});
      const personality=m.page.locator('.pf-results .ai-result-panel');
      await personality.locator('.ai-result-prose').waitFor();
      assert.equal(await personality.locator('.ai-result-prose a').count(),2,
        'Only two valid model-suggested exercise routes should be links');
      assert.match(await personality.locator('.ai-result-prose').innerText(),
        /#kommunikation\/losning-extra/,'Malformed route remains visible as plain text');
      assert.equal(await personality.locator('.ai-result-prose a[href="#kommunikation/losning"]').count(),0,
        'Malformed route must not be partially linked');
      assert.deepEqual(Object.keys(m.aiRequests.at(-1)).sort(),['kind','scope']);
      assert.deepEqual(m.aiRequests.at(-1),{kind:'personality',scope:'own'});
      records.push({role,step:'personality: links and minimal Worker payload',status:'PASS'});
      m.aiFixture.failNext=true;
      await personality.locator('[data-ai-analysis-retry="personality:own"]').click();
      await personality.getByRole('alert').getByText('Tillfälligt fel vid AI-analys.').waitFor();
      assert.equal(await personality.locator('.ai-result-prose a').count(),0,
        'Error must not leave obsolete personalized links visible');
      records.push({role,step:'personality: error removes stale links',status:'PASS'});
      await personality.locator('[data-ai-analysis-retry="personality:own"]').click();
      await personality.locator('.ai-result-prose a[href="#kommunikation/lyssna"]').waitFor();
      assert.equal(m.aiRequests.filter(x=>x.kind==='personality'&&x.scope==='own').length,3);
      await checkOverflow(m.page,'FUN-05 personality AI '+role+' '+width+'px');
      await capture(m.page,'fun-05-ai-personality-retry-'+role+'.png');
      records.push({role,step:'personality: successful retry',status:'PASS'});
      await personality.locator('.ai-result-prose a[href="#kommunikation/lyssna"]').click();
      await m.page.waitForURL(/#kommunikation\/lyssna$/);
      const listening=m.page.locator('.comm-exercise[data-comm-skill="lyssna"]');
      await listening.waitFor();
      assert.equal(await listening.evaluate(node=>node.open),true,
        'Model link opens the intended existing listening exercise');
      records.push({role,step:'personality: listening exercise deeplink',status:'PASS'});
      await m.page.goto(base+'#swipe',{waitUntil:'load'});
      await m.page.locator('.swipe-secondary-results').waitFor();
      await revealSwipeSecondary(m.page);
      const swipe=m.page.locator('.swipe-results .ai-result-panel');
      await swipe.locator('.ai-result-prose').waitFor();
      assert.deepEqual(m.aiRequests.at(-1),{kind:'swipe',scope:'general'});
      assert.equal(await swipe.locator('.ai-result-prose a').count(),2);
      records.push({role,step:'swipe: legitimate links in summary',status:'PASS'});
      m.aiFixture.failNext=true;
      await swipe.locator('[data-ai-analysis-retry="swipe:general"]').click();
      await swipe.getByRole('alert').getByText('Tillfälligt fel vid AI-analys.').waitFor();
      assert.equal(await swipe.locator('.ai-result-prose a').count(),0);
      records.push({role,step:'swipe: error removes obsolete links',status:'PASS'});
      await swipe.locator('[data-ai-analysis-retry="swipe:general"]').click();
      await swipe.locator('.ai-result-prose a[href="#kommunikation/kontakt"]').waitFor();
      assert.equal(m.aiRequests.filter(x=>x.kind==='swipe'&&x.scope==='general').length,3);
      await checkOverflow(m.page,'FUN-05 swipe AI '+role+' '+width+'px');
      await capture(m.page,'fun-05-ai-swipe-retry-'+role+'.png');
      records.push({role,step:'swipe: retry restores result',status:'PASS'});

      // FUN-02: AI completion is a separate async rerender, not a new card
      // action. A private saved-answer search entered while it runs must survive.
      const review=m.page.locator('#swipe-general-review');
      await review.locator('details > summary').click();
      const reviewSearch=review.locator('#swipe-general-review-search');
      const reviewFilter=review.locator('#swipe-general-review-answer');
      m.aiFixture.holdNext=true;
      const previousAiCalls=m.aiRequests.length;
      await swipe.locator('[data-ai-analysis-retry="swipe:general"]').click();
      for(let attempt=0;attempt<60&&typeof m.aiFixture.release!=='function';attempt++)
        await sleep(25);
      assert.equal(m.aiRequests.length,previousAiCalls+1,
        'FUN-02: real AI retry must reach the mocked Worker before completing');
      assert.equal(typeof m.aiFixture.release,'function',
        'FUN-02: AI response is deliberately held while user searches private answers');
      await reviewFilter.selectOption('no');
      await reviewSearch.fill('mitt-pågående-sökord');
      const scrollBefore=await m.page.evaluate(()=>{
        const main=document.querySelector('.live-main');
        main.scrollTop=Math.min(120,main.scrollHeight-main.clientHeight);
        const input=document.querySelector('#swipe-general-review-search');
        input.focus({preventScroll:true});
        return main.scrollTop;
      });
      m.aiFixture.release();
      await swipe.locator('.ai-result-prose a[href="#kommunikation/kontakt"]').waitFor();
      assert.equal(await review.locator('details').evaluate(el=>el.open),true,
        'FUN-02: returning AI text must not collapse the private saved-answer list');
      assert.equal(await reviewSearch.inputValue(),'mitt-pågående-sökord',
        'FUN-02: returning AI text must not discard the private search draft');
      assert.equal(await reviewFilter.inputValue(),'no',
        'FUN-02: returning AI text keeps the selected private answer filter');
      assert.equal(await reviewSearch.evaluate(el=>el===document.activeElement),true,
        'FUN-02: returning AI text keeps keyboard focus in private search');
      const scrollAfter=await m.page.locator('.live-main').evaluate(el=>el.scrollTop);
      assert.ok(Math.abs(scrollAfter-scrollBefore)<=3,
        'FUN-02: AI refresh must not jump the mobile scroller: '+
          JSON.stringify({scrollBefore,scrollAfter}));
      records.push({role,step:'swipe: async AI reply preserves private answer search/filter/focus',
        status:'PASS'});

      await swipe.locator('.ai-result-prose a[href="#kommunikation/kontakt"]').click();
      await m.page.waitForURL(/#kommunikation\/kontakt$/);
      const contact=m.page.locator('.comm-exercise[data-comm-skill="kontakt"]');
      await contact.waitFor();
      assert.equal(await contact.evaluate(node=>node.open),true);
      records.push({role,step:'swipe: contact exercise deeplink',status:'PASS'});

      // FUN-02/FUN-05: an AI retry in an actual theme deck can finish while
      // the viewer is using their own saved-answer list. The existing
      // shared-results refresh protection must also apply to this path.
      await m.page.goto(base+'#swipe',{waitUntil:'load'});
      await m.page.locator('[data-theme-open="samtal"]').click();
      await m.page.locator('#swipe-card').waitFor();
      await m.page.locator('[data-swipe="yes"]').click();
      const themeReview=m.page.locator('#swipe-private-review');
      await themeReview.locator('details > summary').waitFor();
      await m.page.locator('.swipe-secondary-results').waitFor();
      await revealSwipeSecondary(m.page);
      const themePanel=m.page.locator('.swipe-results .ai-result-panel');
      await themePanel.locator('.ai-result-prose').waitFor();
      assert.ok(m.aiRequests.some(request=>request.kind==='swipe'&&request.scope==='samtal'),
        'FUN-02: an actual theme results panel requests analysis of only its own scope');

      // A keyboard user can be focused on an expanded details summary, not
      // only the search input. Previously this focused summary was replaced.
      m.aiFixture.holdNext=true;
      await themePanel.locator('[data-ai-analysis-retry="swipe:samtal"]').click();
      for(let i=0;i<80&&typeof m.aiFixture.release!=='function';i++)await sleep(25);
      assert.equal(typeof m.aiFixture.release,'function',
        'FUN-02: intercepted theme Worker call must be held for summary-focus test');
      await themeReview.locator('details > summary').click();
      await themeReview.locator('details > summary').focus();
      const beforeSummary=await m.page.evaluate(()=>{
        const main=document.querySelector('.live-main');
        main.scrollTop=Math.min(150,Math.max(0,main.scrollHeight-main.clientHeight));
        document.querySelector('#swipe-private-review details > summary').focus({preventScroll:true});
        return main.scrollTop;
      });
      m.aiFixture.release();
      await themePanel.locator('.ai-result-prose').waitFor();
      assert.equal(await themeReview.locator('details').evaluate(el=>el.open),true,
        'FUN-02: theme private review remains expanded when a delayed AI reply arrives');
      assert.equal(await themeReview.locator('details > summary').evaluate(el=>document.activeElement===el),true,
        'FUN-02: delayed AI reply preserves focus on the expanded theme review summary');
      assert.ok(Math.abs((await m.page.locator('.live-main').evaluate(el=>el.scrollTop))-beforeSummary)<=3,
        'FUN-02: delayed AI reply preserves theme review summary scroll position');
      records.push({role,step:'theme: delayed AI reply preserves focused summary',status:'PASS'});

      // Repeat with a search and answer filter; a typical ongoing review
      // must not lose its unsubmitted search when the remote analysis lands.
      m.aiFixture.holdNext=true;
      await themePanel.locator('[data-ai-analysis-retry="swipe:samtal"]').click();
      for(let i=0;i<80&&typeof m.aiFixture.release!=='function';i++)await sleep(25);
      assert.equal(typeof m.aiFixture.release,'function',
        'FUN-02: intercepted Worker call must be held for themed search-focus test');
      const themeSearch=themeReview.locator('#private-theme-review-search');
      const themeAnswerFilter=themeReview.locator('#private-theme-review-answer');
      await themeAnswerFilter.selectOption('yes');
      await themeSearch.fill('veckan');
      const beforeSearch=await m.page.evaluate(()=>{
        const main=document.querySelector('.live-main');
        main.scrollTop=Math.min(150,Math.max(0,main.scrollHeight-main.clientHeight));
        document.querySelector('#private-theme-review-search').focus({preventScroll:true});
        return main.scrollTop;
      });
      m.aiFixture.release();
      await themePanel.locator('.ai-result-prose').waitFor();
      assert.equal(await themeReview.locator('details').evaluate(el=>el.open),true);
      assert.equal(await themeSearch.inputValue(),'veckan');
      assert.equal(await themeAnswerFilter.inputValue(),'yes');
      assert.equal(await themeSearch.evaluate(el=>document.activeElement===el),true);
      assert.ok(Math.abs((await m.page.locator('.live-main').evaluate(el=>el.scrollTop))-beforeSearch)<=3,
        'FUN-02: delayed theme AI reply preserves private search scroll position');
      assert.match(await themeReview.locator('#private-theme-review-count').innerText(),/Visar 1 av 1/,
        'FUN-02: the saved answer search remains filtered after AI completion');
      await themeReview.scrollIntoViewIfNeeded();
      await capture(m.page,'fun-02-ai-theme-private-review-'+role+'.png');
      records.push({role,step:'theme: delayed AI reply preserves private search/filter/focus',status:'PASS'});
    }finally{
      await m.context.close();
    }
  }
  await fs.writeFile(path.join(output,'fun-05-ai-reflection-retry-synthetic.json'),
    JSON.stringify({kind:'synthetic-browser-functional-test',
      environment:'Chromium 320px/390px with mock Auth and intercepted fake AI Worker',
      authenticAccounts:false,realAi:false,physicalMobile:false,scenarios:records},null,2)+'\n');
  console.log('FUN-05 analysis retry/routes: '+records.length+' synthetic role/step checks passed.');
}

async function verifyMediatorConversationLifecycle(){
  const rows=[];
  for(const role of ['parent','teen']){
    const width=role==='parent'?390:320;
    const m=await freshContext(
      {viewport:{width,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},
      {authenticated:true,paired:true,role,aiMediator:true}
    );
    try{
      await m.page.goto(base+'#medlare',{waitUntil:'load'});
      await m.page.locator('#mediator-new').waitFor();
      const submit=m.page.locator('#mediator-form button[type="submit"]');
      const input=m.page.locator('#mediator-input');
      const first='Fiktivt första samtal – '+role;
      const second='Fiktivt andra samtal – '+role;
      const retry='Fiktivt omförsök efter fel – '+role;
      assert.equal(m.mediatorFixture.chats.length,0,'Fresh fixture has no saved conversations');
      await input.fill(first);
      await submit.click();
      await m.page.locator('.mediator-message-user').getByText(first).waitFor();
      await m.page.locator('.mediator-message-assistant').first().waitFor();
      assert.equal(m.mediatorFixture.chats.length,1,'First send creates a server-side conversation');
      const firstId=m.mediatorFixture.chats[0].id;
      assert.deepEqual(m.mediatorFixture.messages.get(firstId).map(x=>x.role),['user','assistant']);
      rows.push({role,step:'create and send first message',status:'PASS'});
      await m.page.locator('#mediator-new').click();
      await m.page.locator('.mediator-empty').waitFor();
      assert.equal(await m.page.locator('.mediator-message-user').count(),0,
        'New conversation does not display old transcript');
      await input.fill(second);
      await submit.click();
      await m.page.locator('.mediator-message-user').getByText(second).waitFor();
      const secondId=m.mediatorFixture.chats[0].id;
      assert.notEqual(secondId,firstId,'Separate conversation has another id');
      assert.equal(await m.page.locator('[data-mediator-open]').count(),2);
      rows.push({role,step:'new conversation and isolated transcript',status:'PASS'});
      // A failed GET must not continue showing a different private transcript.
      const failedReadDraft='Oskickat utkast under läsfel – '+role;
      await input.fill(failedReadDraft);
      m.mediatorFixture.failNextOpen=true;
      await m.page.locator('[data-mediator-open="'+firstId+'"]').click();
      await m.page.getByText('Tillfälligt fel vid läsning av samtalet.').waitFor();
      assert.match(await m.page.locator('.mediator-empty').innerText(),
        /Samtalshistoriken kunde inte laddas/,'Failed history read must not claim chat is empty');
      await capture(m.page,'fun-05-mediator-read-error-'+role+'.png');
      assert.equal(await input.inputValue(),failedReadDraft,
        'A failed chat read must not discard an unsent draft');
      assert.equal(await submit.isDisabled(),true,
        'Sending stays disabled after a failed history read, even with a non-empty draft');
      const sendsBeforeReadRetry=m.mediatorCalls.filter(c=>c.pathname==='/api/ai/mediate').length;
      await m.page.evaluate(()=>document.querySelector('#mediator-form')
        ?.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
      assert.equal(m.mediatorCalls.filter(c=>c.pathname==='/api/ai/mediate').length,
        sendsBeforeReadRetry,'Programmatic submit also refuses an unverified transcript');
      assert.equal(await m.page.locator('.mediator-message-user').count(),0,
        'History failure clears the previous transcript');
      await m.page.locator('[data-mediator-open="'+firstId+'"]').click();
      await m.page.locator('.mediator-message-user').getByText(first).waitFor();
      assert.equal(await m.page.locator('.mediator-message-user').getByText(second,{exact:true}).count(),0,
        'Opening first conversation does not show second message');
      assert.equal(await input.inputValue(),failedReadDraft,
        'Successful explicit read retry keeps the draft');
      assert.equal(await submit.isEnabled(),true,'Verified transcript re-enables sending');
      rows.push({role,step:'failed history read blocks submit and explicit retry preserves draft',status:'PASS'});
      // A deliberately delayed GET must not race with a POST to its chat.
      const pendingDraft='Utkast medan historik hämtas – '+role;
      await input.fill(pendingDraft);
      m.mediatorFixture.holdNextOpen=true;
      const sendsBeforePendingRead=m.mediatorCalls.filter(c=>c.pathname==='/api/ai/mediate').length;
      await m.page.locator('[data-mediator-open="'+secondId+'"]').click();
      for(let attempt=0;attempt<100&&typeof m.mediatorFixture.releaseOpen!=='function';attempt++)
        await sleep(25);
      assert.equal(typeof m.mediatorFixture.releaseOpen,'function',
        'Synthetic Worker GET is held before response');
      assert.equal(await submit.isDisabled(),true,
        'Send is disabled while the selected chat history is pending');
      assert.match(await m.page.locator('.mediator-empty').innerText(),
        /Hämtar samtalshistoriken/,'Pending history read must not claim chat is empty');
      assert.equal(await input.inputValue(),pendingDraft,
        'Draft remains in the textarea while history is loading');
      await m.page.evaluate(()=>document.querySelector('#mediator-form')
        ?.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
      assert.equal(m.mediatorCalls.filter(c=>c.pathname==='/api/ai/mediate').length,
        sendsBeforePendingRead,'No POST when a GET is pending');
      await checkOverflow(m.page,'FUN-05 pending read '+role+' '+width+'px');
      await capture(m.page,'fun-05-mediator-loading-'+role+'.png');
      m.mediatorFixture.releaseOpen();
      await m.page.locator('.mediator-message-user').getByText(second).waitFor();
      assert.equal(await submit.isEnabled(),true,'Successful read re-enables sending');
      assert.equal(await input.inputValue(),pendingDraft,'A delayed read does not erase the draft');
      rows.push({role,step:'pending history GET blocks submit and retains draft',status:'PASS'});
      // A reload reads the in-memory fixture as a fake persisted server.
      await m.page.reload({waitUntil:'load'});
      await m.page.locator('.mediator-message-user').getByText(second).waitFor();
      assert.equal(await m.page.locator('[data-mediator-open]').count(),2);
      rows.push({role,step:'reload restores saved history',status:'PASS'});
      m.mediatorFixture.failNextSend=true;
      await m.page.locator('#mediator-input').fill(retry);
      await m.page.locator('#mediator-form button[type="submit"]').click();
      await m.page.locator('#mediator-status').getByText('Tillfälligt fel vid svar.').waitFor();
      assert.equal(await m.page.locator('#mediator-input').inputValue(),retry,
        'Message remains as draft after temporary Worker error');
      assert.equal(m.mediatorFixture.messages.get(secondId).length,2,
        'Failed send does not add a fabricated reply');
      await m.page.locator('#mediator-form button[type="submit"]').click();
      await m.page.locator('.mediator-message-user').getByText(retry).waitFor();
      assert.equal(m.mediatorFixture.messages.get(secondId).length,4);
      rows.push({role,step:'failed send keeps draft; retry sends once',status:'PASS'});
      // A pending DELETE must not accept a second deletion or chat switching.
      m.mediatorFixture.holdNextDelete=true;
      const deletesBefore=m.mediatorCalls.filter(c=>c.method==='DELETE').length;
      m.page.once('dialog',dialog=>dialog.accept());
      await m.page.locator('#mediator-delete').click();
      for(let attempt=0;attempt<100&&typeof m.mediatorFixture.releaseDelete!=='function';attempt++)
        await sleep(25);
      assert.equal(typeof m.mediatorFixture.releaseDelete,'function',
        'Synthetic Worker DELETE is held before completion');
      await m.page.getByRole('status').getByText('Raderar samtalet…').waitFor();
      assert.equal(await m.page.locator('#mediator-delete').isDisabled(),true);
      assert.equal(await m.page.locator('#mediator-new').isDisabled(),true);
      assert.equal(await m.page.locator('[data-mediator-open="'+firstId+'"]').isDisabled(),true);
      assert.equal(await input.isDisabled(),true);
      await m.page.evaluate(()=>{
        document.querySelector('#mediator-delete')?.click();
        document.querySelector('[data-mediator-open]')?.click();
      });
      assert.equal(m.mediatorCalls.filter(c=>c.method==='DELETE').length,
        deletesBefore+1,'Repeated clicks cannot send duplicate DELETE');
      m.mediatorFixture.releaseDelete();
      await m.page.locator('.mediator-message-user').getByText(first).waitFor();
      assert.equal(m.mediatorFixture.chats.length,1);
      assert.equal(m.mediatorFixture.messages.has(secondId),false);
      assert.equal(await m.page.locator('.mediator-message-user').getByText(second,{exact:true}).count(),0);
      rows.push({role,step:'in-flight DELETE locks controls and selects remaining chat',status:'PASS'});
      m.page.once('dialog',dialog=>dialog.accept());
      await m.page.locator('#mediator-delete').click();
      await m.page.locator('.mediator-empty').waitFor();
      assert.equal(m.mediatorFixture.chats.length,0);
      assert.equal(m.mediatorFixture.messages.size,0);
      assert.equal(await m.page.locator('[data-mediator-open]').count(),0);
      await checkOverflow(m.page,'FUN-05 '+role+' '+width+'px');
      await capture(m.page,'fun-05-mediator-empty-'+role+'.png');
      rows.push({role,step:'delete final conversation and empty state',status:'PASS'});
    }finally{
      await m.context.close();
    }
  }
  await fs.writeFile(path.join(output,'fun-05-mediator-lifecycle-synthetic.json'),JSON.stringify({
    kind:'synthetic-browser-functional-test',environment:'Chromium, intercepted fake Worker and mocked Auth',
    authenticAccounts:false,realWorker:false,physicalMobile:false,scenarios:rows
  },null,2)+'\n');
  console.log('FUN-05 mediator lifecycle: '+rows.length+' synthetic role/step checks passed.');
}
try{
  await fs.mkdir(output,{recursive:true});
  await waitForServer();
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
  await verifyNvcDraftAi();
  await verifySchysstaMobileHierarchy();
  await verifyDesktopSidebarBrand();
  const login=await freshContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  await login.page.locator("#live-login").waitFor();
  assert.match(await login.page.locator("#live-app").innerText(),/Logga in/i,"First visit must show real sign-in");
  await checkOverflow(login.page,"Mobile sign-in");
  await capture(login.page,"mobile-login.png");
  await login.context.close();
  const activity=await freshContext(
    {viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},
    {authenticated:true,paired:true,activityNotifications:true}
  );
  await activity.page.waitForFunction(()=>document.querySelector('#live-app')?.textContent.includes(
    '1 nya gemensamma kort- eller aktivitetsaviseringar'));
  assert.equal(await activity.page.evaluate(()=>window.__HK_ACTIVITY_MARK_COUNT__||0),0,
    'A fresh activity event is not automatically marked as read on the homepage');
  await activity.page.goto(base+'#inkorg',{waitUntil:'load'});
  await activity.page.locator('[data-activity-read]').waitFor();
  assert.match(await activity.page.locator('#live-app').innerText(),/Nytt gemensamt JA · Aktiviteter/,
    'Activity inbox shows an allowed deck but no private answer text');
  assert.equal(await activity.page.evaluate(()=>window.__HK_ACTIVITY_MARK_COUNT__||0),0,
    'Opening the inbox does not generate a read receipt');
  await activity.page.locator('[data-activity-read]').click();
  await activity.page.waitForFunction(()=>document.querySelector('[data-activity-read]')===null);
  assert.equal(await activity.page.evaluate(()=>window.__HK_ACTIVITY_MARK_COUNT__||0),1,
    'Explicit click marks one activity digest read via the RPC');
  assert.equal(await activity.page.locator('[data-activity-read]').count(),0,
    'Activity notification is visibly read after explicit server roundtrip');
  await checkOverflow(activity.page,'Activity inbox mobile');
  // The notification must open its exact, freshly verified deck, not private answers.
  await activity.page.evaluate(()=>{window.__HK_TEST_SHARED_MATCHES__=[
    {deck_id:'aktiviteter',card_id:'aktiviteter-01',answer:true}
  ];});
  await activity.page.locator('a[href="#insikter/aktiviteter"]').click();
  await activity.page.locator('#insights-deck-aktiviteter').waitFor();
  await activity.page.waitForFunction(()=>document.activeElement?.id==='insights-deck-aktiviteter');
  assert.equal(await activity.page.evaluate(()=>window.__HK_ACTIVITY_MARK_COUNT__||0),1,
    'Opening the deck does not mark any additional notification read');
  // A withdrawn match is never resurrected by an old inbox link.
  await activity.page.evaluate(()=>{window.__HK_TEST_SHARED_MATCHES__=[];});
  await activity.page.goto(base+'#inkorg',{waitUntil:'load'});
  await activity.page.locator('a[href="#insikter/aktiviteter"]').click();
  await activity.page.locator('#insights-target-unavailable').waitFor();
  await activity.page.waitForFunction(()=>document.activeElement?.id==='insights-target-unavailable');
  assert.doesNotMatch(await activity.page.locator('#live-app').innerText(),/aktiviteter-01/,
    'Revoked card IDs are not shown as insight content');
  await activity.context.close();
  const m=await freshContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},{authenticated:true});
  await m.page.getByRole("heading",{name:/Hej[ ,]+Provförälder/}).waitFor();
  assert.match(await m.page.locator("#live-app").innerText(),/Din familj/i);
  const invitationBox=await m.page.getByRole("link",{name:"Hantera familj och inbjudningar"}).boundingBox();
  const familyHeadingBox=await m.page.getByRole("heading",{name:"Din familj"}).boundingBox();
  const welcomeBox=await m.page.locator(".home-hero").boundingBox();
  assert.ok(invitationBox&&familyHeadingBox&&welcomeBox&&familyHeadingBox.y<welcomeBox.y,
    "NOT-02: unpaired family invitation must be above the decorative welcome hero");
  assert.ok(invitationBox.y+invitationBox.height<740,
    "NOT-02: family invitation stays above the fixed mobile navigation without scrolling");
  assert.equal(await m.page.getByRole("link",{name:"Hantera familj och inbjudningar"}).getAttribute("href"),"./konto.html");
  await checkOverflow(m.page,"Mobile homepage");
  assert.equal(await m.page.locator('.home-next-actions').count(),0,
    'NOT-02: no empty action overview when there is nothing verified to do');
  const heroMetrics=await m.page.locator('.home-hero').evaluate(el=>{
    const box=el.getBoundingClientRect(),title=el.querySelector('h1').getBoundingClientRect();
    return {height:box.height,titleFits:title.left>=box.left&&title.right<=box.right,
      actionHeight:el.querySelector('.home-hero-link').getBoundingClientRect().height};
  });
  assert.ok(heroMetrics.height<300,'UX-04: welcome hero should be compact on 390px: '+JSON.stringify(heroMetrics));
  assert.ok(heroMetrics.titleFits&&heroMetrics.actionHeight>=40,'UX-04: title and hero action remain accessible');
  await capture(m.page,"mobile-home.png");
  await checkMobileNavigation(m.page,'390px mobile navigation');
  // UX-01: verify keyboard navigation and actual browser focus.
  const skipHash=new URL(m.page.url()).hash;
  await m.page.locator('#live-skip-to-main').focus();
  const skipVisible=await m.page.locator('#live-skip-to-main').evaluate(el=>{
    const rect=el.getBoundingClientRect();
    return rect.top>=0&&rect.left>=0&&rect.bottom<=window.innerHeight;
  });
  assert.ok(skipVisible,'Skip link becomes visible when focused');
  await m.page.keyboard.press('Enter');
  assert.equal(await m.page.evaluate(()=>document.activeElement?.id),'live-app','Skip link focuses the main landmark');
  assert.equal(new URL(m.page.url()).hash,skipHash,'Skip link must not change the SPA route');
  const settingsLink=m.page.locator('#live-mobile-nav a[href="#installningar"]');
  await settingsLink.focus();
  await m.page.keyboard.press('Enter');
  await m.page.getByRole('heading',{name:'Inställningar'}).waitFor();
  assert.equal(await m.page.evaluate(()=>document.activeElement?.id),'live-app',
    'The direct settings tab activates by keyboard and focuses new content');
  await m.page.goto(base+'#insikter',{waitUntil:'load'});
  assert.equal(await m.page.locator('#live-mobile-nav a[href="#swipe"]').getAttribute('aria-current'),'page',
    'The insights subpage keeps Gillaswajpen marked as the active primary tab');
  await m.page.goto(base+'#hem',{waitUntil:'load'});
  for(const route of ['swipe','personlighet','insikter','regler','inkorg','medlare']){
    await m.page.goto(base+'#'+route,{waitUntil:'load'});
    await m.page.locator('.comm-crosslink a[href="#kommunikation"]').waitFor();
    assert.equal(await m.page.locator('.comm-crosslink a[href="#nvc"]').count(),1,'NVC is available from '+route);
    assert.equal(await m.page.locator('.comm-crosslink a[href="#mi-foralder"]').count(),1,'Parent MI is available from '+route);
  }
  await m.page.goto(base+'#regler',{waitUntil:'load'});
  await m.page.locator('.comm-crosslink a[href="#nvc"]').click();
  await m.page.getByRole('heading',{name:'Nonviolent Communication',exact:true}).waitFor();
  assert.equal(await m.page.locator('#live-mobile-nav a[href="#kommunikation"]').getAttribute('aria-current'),'page',
    'Cross-module NVC links select the communication tab');
  await m.page.goto(base+'#regler',{waitUntil:'load'});
  await m.page.locator('.comm-crosslink a[href="#kommunikation/losning"]').click();
  await m.page.waitForFunction(()=>document.activeElement?.closest('.comm-exercise')?.dataset.commSkill==='losning');
  assert.equal(await m.page.locator('[data-comm-skill="losning"]').evaluate(el=>el.open),true);
  assert.equal(await m.page.locator('#live-mobile-nav a[href="#kommunikation"]').getAttribute('aria-current'),'page');
  await capture(m.page,'mobile-communication-direct-solution.png');
  await m.page.goBack();
  await m.page.locator('.comm-crosslink a[href="#kommunikation/losning"]').waitFor();
  await m.page.goForward();
  await m.page.waitForFunction(()=>document.activeElement?.closest('.comm-exercise')?.dataset.commSkill==='losning');
  await m.page.reload({waitUntil:'load'});
  await m.page.locator('[data-comm-skill="losning"][open]').waitFor();
  for(const hash of ['#kommunikation/unknown','#kommunikation/%22%3E%3Cscript%3E']){
    await m.page.goto(base+hash,{waitUntil:'load'});
    await m.page.getByRole('heading',{name:'Verktyg för bättre samtal'}).waitFor();
    assert.equal(await m.page.locator('.comm-exercise[open]').count(),0);
  }
  await m.page.goto(base+'#%E0%A4%A',{waitUntil:'load'});
  await m.page.locator('.home-module-grid, .home-modules, #live-app h1').first().waitFor();
  await m.page.goto(base+'#kommunikation',{waitUntil:'load'});
  await m.page.getByRole('heading',{name:'Verktyg för bättre samtal'}).waitFor();
  assert.equal(await m.page.locator('.comm-exercise').count(),9,'Nine shared communication techniques are available');
  assert.equal(await m.page.getByRole('link',{name:'Öppna MI-övningarna'}).count(),1,'Only parents see MI entry');
  await m.page.locator('[data-comm-open="validera"]').click();
  assert.equal(await m.page.locator('.comm-exercise[data-comm-skill="validera"]').evaluate(el=>el.open),true,'Situation opens matching skill');
  assert.equal(await m.page.evaluate(()=>document.activeElement?.closest('.comm-exercise')?.dataset.commSkill),'validera','Keyboard focus follows opened skill');
  assert.equal(new URL(m.page.url()).hash,'#kommunikation','Situation does not change SPA route');
  await checkOverflow(m.page,'Communication toolkit 390px parent');
  await capture(m.page,'mobile-communication-parent.png');
  await m.page.getByRole('link',{name:'Bygg ett jag-budskap'}).click();
  await m.page.getByRole('heading',{name:'Nonviolent Communication',exact:true}).waitFor();
  await m.page.locator('#comm-observation').fill('vi pratar över varandra');
  await m.page.locator('#comm-feeling').fill('mig ledsen');
  await m.page.locator('#comm-need').fill('lugn');
  await m.page.locator('#comm-request').fill('prata efter maten');
  await m.page.getByRole('button',{name:'Visa mina fyra delar'}).click();
  assert.equal(await m.page.locator('#comm-nvc-output').innerText(),
    'Det jag lade märke till: vi pratar över varandra\nMin känsla: mig ledsen\nMitt behov: lugn\nMitt önskemål: prata efter maten');
  assert.equal(await m.page.evaluate(()=>document.activeElement?.id),'comm-nvc-output','Preview is keyboard focusable');
  await m.page.locator('#comm-observation').fill('<img src=x onerror=alert(1)>');
  await m.page.getByRole('button',{name:'Visa mina fyra delar'}).click();
  assert.match(await m.page.locator('#comm-nvc-output').innerText(),/<img src=x onerror=alert\(1\)>/,'Untrusted draft is shown literally');
  assert.equal(await m.page.locator('#comm-nvc-output img').count(),0,'Draft markup cannot execute');
  await m.page.getByRole('button',{name:'Töm fälten'}).click();
  assert.equal(await m.page.locator('#comm-observation').inputValue(),'','Reset removes transient draft');
  assert.match(await m.page.locator('#comm-nvc-output').innerText(),/Din formulering visas här/);
  assert.equal(await m.page.evaluate(()=>window.__HK_CHAT_SEND__??null),null,'Draft is not sent as a family message');
  await checkOverflow(m.page,'NVC builder 390px parent');
  await capture(m.page,'mobile-nvc-parent.png');
  await m.page.goto(base+'#kommunikation',{waitUntil:'load'});
  await m.page.getByRole('link',{name:'Öppna MI-övningarna'}).click();
  await m.page.getByRole('heading',{name:'Lyssna innan du föreslår'}).waitFor();
  assert.equal(await m.page.locator('.mi-parent-guide a[href="#regler"]').count(),1,'MI guide links to mutual agreements');
  assert.equal(await m.page.locator('#live-mobile-nav a[href="#kommunikation"]').getAttribute('aria-current'),'page','MI subpage retains communication tab');
  await checkOverflow(m.page,'390px parent MI guide');
  await capture(m.page,'mobile-mi-parent-guide.png');
  await m.page.goto(base+"#personlighet",{waitUntil:"load"});
  await m.page.getByRole('button',{name:'Börja testet'}).waitFor();
  await m.page.getByRole('button',{name:'Börja testet'}).click();
  assert.match(await m.page.locator('.pf-question').innerText(),/Jag brukar vara den som får igång stämningen/);
  await m.page.locator('label.pf-option').nth(3).click();
  await m.page.locator('.pf-option.is-selected').waitFor();
  const selectedAppearance=await m.page.locator('.pf-option.is-selected').evaluate(el=>{
    const cs=getComputedStyle(el);
    return {bg:cs.backgroundColor,border:cs.borderColor,text:el.textContent};
  });
  assert.ok(selectedAppearance.bg!=='rgb(38, 44, 64)' && selectedAppearance.border!=='rgb(73, 81, 104)',
    'Selected option must have an unmistakably different background and border');
  assert.match(selectedAppearance.text,/Stämmer ganska bra/);
  assert.match(await m.page.locator('.pf-status').innerText(),/Sparar svaret/);
  await m.page.getByText('Fråga 2 av 50').waitFor();
  const pfSaved=await m.page.evaluate(()=>window.__HK_PERSONALITY_SAVE__);
  assert.equal(pfSaved.row.instrument_id,'ipip50-sv-v1');
  assert.equal(pfSaved.row.question_id,'ipip50-001');
  assert.deepEqual(pfSaved.row.answer,{value:4});
  await checkOverflow(m.page,'Personality questionnaire 390px');
  await capture(m.page,'mobile-personality-question.png');
  await m.page.getByRole('button',{name:'Spara och avsluta för nu'}).click();
  await m.page.getByRole('button',{name:'Fortsätt testet'}).waitFor();
  await m.page.getByRole('button',{name:'Fortsätt testet'}).click();
  await m.page.getByText('Fråga 2 av 50').waitFor();
  await m.page.goto(base+"#hem",{waitUntil:"load"});
  await m.page.goto(base+"#swipe",{waitUntil:"load"});
  await m.page.getByRole("heading",{name:"Gillaswajpen"}).waitFor();
  assert.match(await m.page.locator("#live-app").innerText(),/sparas privat i ditt konto/i);
   assert.equal(await m.page.evaluate(()=>window.__HK_MATCH_RPC_CALLS__||0),0,'Unpaired member must not request aggregate matches');
  assert.equal(await m.page.evaluate(()=>window.__HK_UNLOCK_RPC_CALLS__||0),0,'Unpaired member must not request theme unlock status');
  assert.match(await m.page.locator("#swipe-card").getAttribute("aria-label"),/Kort 1 av 21/);
  // ArrowRight on a focused navigation link must NOT save a private swipe answer.
  await m.page.locator('#live-mobile-nav a[href="#regler"]').focus();
  await m.page.keyboard.press('ArrowRight');
  await m.page.waitForTimeout(300);
  assert.match(await m.page.locator('#swipe-card').getAttribute('aria-label'),/Kort 1 av 21/,
    'Focused navigation arrow must not advance the private swipe deck');
  assert.equal(await m.page.evaluate(()=>window.__HK_SAVED_SWIPE__??null),null,
    'Focused navigation arrow must not write a swipe answer');
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
  const activeTab=m.page.locator('#live-mobile-nav a[aria-current="page"]');
  await activeTab.scrollIntoViewIfNeeded();
  const activeNav=await activeTab.boundingBox();
  assert.ok(activeNav.x>=mobileNav.x-2&&activeNav.x+activeNav.width<=mobileNav.x+mobileNav.width+2,
    'Selected tab must be reachable within the horizontal navigation strip');
  await m.page.locator('#live-mobile-nav a[href="#installningar"]').scrollIntoViewIfNeeded();
  const lastBox=await m.page.locator('#live-mobile-nav a[href="#installningar"]').boundingBox();
  assert.ok(lastBox.x>=mobileNav.x-2&&lastBox.x+lastBox.width<=mobileNav.x+mobileNav.width+2,
    'Last destination is reachable by horizontal swipe');
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
  await m.page.waitForFunction(()=>document.activeElement?.id==='swipe-card');
  const nextCardRect=await m.page.locator('#swipe-card').boundingBox();
  const nextNavRect=await m.page.locator('#live-mobile-nav').boundingBox();
  await capture(m.page,'mobile-general-next-card-focus.png');
  assert.ok(nextCardRect && nextNavRect && nextCardRect.y>=-2 && nextCardRect.y+80<nextNavRect.y,
    'Confirmed general answer restores focus to the new question at a visible scroll position: '+
      JSON.stringify({card:nextCardRect,nav:nextNavRect,scroll:await m.page.locator('.live-main').evaluate(el=>({top:el.scrollTop,height:el.clientHeight}))}));
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
  // Regression: arrows on page chrome must never silently change a private answer.
  const keyboardSwipe=await freshContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},
    {authenticated:true});
  await keyboardSwipe.page.goto(base+'#swipe',{waitUntil:'load'});
  await keyboardSwipe.page.locator('#swipe-card').waitFor();
  await keyboardSwipe.page.getByRole('heading',{name:'Gillaswajpen'}).focus();
  await keyboardSwipe.page.keyboard.press('ArrowRight');
  await keyboardSwipe.page.waitForTimeout(300);
  assert.equal(await keyboardSwipe.page.evaluate(()=>window.__HK_SAVED_SWIPE__??null),null,
    'Arrow on page heading must not save a private answer');
  assert.match(await keyboardSwipe.page.locator('#swipe-card').getAttribute('aria-label'),/Kort 1 av 21/);
  await keyboardSwipe.page.locator('#swipe-card').focus();
  await keyboardSwipe.page.keyboard.press('ArrowRight');
  await keyboardSwipe.page.waitForFunction(()=>window.__HK_SAVED_SWIPE__?.row.card_id==='general-01'
    &&window.__HK_SAVED_SWIPE__.row.answer===true);
  await keyboardSwipe.page.locator('#swipe-card[aria-label^="Kort 2"]').waitFor();
  assert.match(await keyboardSwipe.page.locator('#swipe-card').innerText(),/Med tangentbordet: ← eller →/,
    'The card describes keyboard controls');
  await keyboardSwipe.context.close();
  // A remote unpair while HOME is visible must revoke cached pairing state
  // before a badge refresh. Simulate browser focus rather than waiting 15s.
  const homeUnpaired=await freshContext(
    {viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},
    {authenticated:true,paired:true}
  );
  await homeUnpaired.page.goto(base+'#hem',{waitUntil:'load'});
  await homeUnpaired.page.getByRole('heading',{name:/^Inkorgen · (?:minst )?\d+ olästa$/}).waitFor();
  await homeUnpaired.page.evaluate(()=>{
    window.__HK_TEST_PAIRED__=false;
    window.dispatchEvent(new Event('focus'));
  });
  await homeUnpaired.page.waitForFunction(()=>!Array.from(document.querySelectorAll('#live-app h2')).some(h=>h.textContent?.startsWith('Inkorgen · ')));
  assert.equal(await homeUnpaired.page.locator('#live-mobile-nav a[href="#inkorg"] .live-nav-count').count(),0,
    'Remote unpair must remove old private unread badge on home focus');
  assert.equal(await homeUnpaired.page.getByRole('heading',{name:/^Inkorgen · /}).count(),0,
    'Home cannot keep old family inbox alert after remote unpair');
  assert.equal(await homeUnpaired.page.getByRole('heading',{name:/^Behöver ditt svar/}).count(),0,
    'Remote unpair must also clear cached pending rule proposals from the home page');
  await homeUnpaired.page.goto(base+'#regler',{waitUntil:'load'});
  await homeUnpaired.page.getByRole('heading',{name:'Koppla först en familjemedlem'}).waitFor();
  assert.equal(await homeUnpaired.page.locator('[data-schyssta-decision]').count(),0,
    'Old shared agreements must not remain actionable after remote unpair');
  await homeUnpaired.context.close();

  // Shared insights are also bound to the current pairing epoch. A remote
  // unpair must hide an already rendered match summary on the next focus.
  const revokedInsights=await freshContext(
    {viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},
    {authenticated:true,paired:true}
  );
  await revokedInsights.page.goto(base+'#insikter',{waitUntil:'load'});
  await revokedInsights.page.getByRole('heading',{name:'Era gemensamma insikter'}).waitFor();
  await revokedInsights.page.getByRole('heading',{name:'Möjligt att utforska'}).waitFor();
  await revokedInsights.page.evaluate(()=>{
    window.__HK_TEST_PAIRED__=false;
    window.dispatchEvent(new Event('focus'));
  });
  await revokedInsights.page.getByText('Koppla ihop en förälder och en tonåring för att se sådant ni båda aktivt har valt.').waitFor();
  assert.equal(await revokedInsights.page.locator('#insights-a-heading').count(),0,
    'Remote unpair must hide stale shared YES matches and private insights immediately');
  await revokedInsights.context.close();

  // NOT-01: failed unread RPCs must not silently look like an empty inbox.
  const unavailableHome=await freshContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},
    {authenticated:true,paired:true,homeUnreadFailure:true});
  await unavailableHome.page.goto(base+'#hem',{waitUntil:'load'});
  await unavailableHome.page.locator('#home-refresh-notices').waitFor();
  assert.equal(await unavailableHome.page.locator('.home-next-actions #home-refresh-notices').count(),1,
    'NOT-02: failed unread checks remain actionable above the hero rather than appearing empty');
  assert.match(await unavailableHome.page.getByRole('alert').innerText(),/Noll betyder därför inte säkert att inkorgen är tom/);
  assert.equal(await unavailableHome.page.locator('.live-cards .live-panel').count(),6,'All actual feature cards remain available');
  assert.match(await unavailableHome.page.locator('.live-cards').innerText(),/50 frågor/,'Home reflects the real personality feature');
  assert.doesNotMatch(await unavailableHome.page.locator('.live-cards').innerText(),/ansluts stegvis/,'No false generic status remains');
  await checkOverflow(unavailableHome.page,'Home with failed notification checks');
  await capture(unavailableHome.page,'mobile-home-unread-error.png');
  await unavailableHome.page.evaluate(()=>{window.__HK_HOME_UNREAD_FAILURE__=false;window.__HK_SCHYSSTA_CLEAN_RPC__=true;});
  await unavailableHome.page.locator('#home-refresh-notices').click();
  await unavailableHome.page.locator('#home-refresh-notices').waitFor({state:'detached'});
  await unavailableHome.page.getByRole('heading',{name:/Inkorgen · 2 olästa/}).waitFor();
  await checkOverflow(unavailableHome.page,'Home after notification retry');
  await capture(unavailableHome.page,'mobile-home-unread-recovered.png');
  await unavailableHome.context.close();

  const completedPersonality=await freshContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},{authenticated:true,personalityComplete:true,role:'teen'});
  await completedPersonality.page.goto(base+'#personlighet',{waitUntil:'load'});
  await completedPersonality.page.getByRole('heading',{name:'Din profil'}).waitFor();
  assert.equal(await completedPersonality.page.locator('.pf-scale-track').count(),5);
  assert.equal(await completedPersonality.page.locator('.pf-band').count(),25);
  assert.equal(await completedPersonality.page.locator('.pf-table tbody tr').count(),5);
  assert.equal(await completedPersonality.page.locator('.pf-band-key').count(),1);
  assert.match(await completedPersonality.page.locator('.pf-results > p:first-of-type').innerText(),
    /amerikansk vuxenreferens, inte svenska normer/,
    'UX-04: visible result introduction must retain adult reference caution');
  assert.equal(await completedPersonality.page.locator('.pf-chart-short-note').count(),0,
    'UX-04: avoid duplicating the adult-reference caveat immediately before the scale');
  assert.match(await completedPersonality.page.locator('.pf-chart-help .pf-chart-description').textContent(),
    /P≈20.*80 %.*±1 SD.*inte svensk eller tonårsvaliderad norm/,
    'PF-04: full P20/SD explanation remains available in the expandable method help');
  assert.equal(await completedPersonality.page.locator('.pf-scale-summary').count(),5);
  assert.ok((await completedPersonality.page.locator('.pf-scale-summary').first().innerText()).includes('modellerade vuxenfördelningen'),
    'PF-04: percentiles describe modeled adult ranking rather than generic average labels');
  assert.equal(await completedPersonality.page.locator('.pf-chart-help').evaluate(el=>el.open),false,
    'UX-04: detailed zone explanation is initially collapsed');
  assert.ok(await completedPersonality.page.locator('.pf-percentile-chart').evaluate(el=>{
    const first=el.querySelector('.pf-scale-row'),key=el.querySelector('.pf-band-key');
    return first&&key&&first.compareDocumentPosition(key)&Node.DOCUMENT_POSITION_FOLLOWING;
  }),'UX-04: the five profile scales precede the optional legend');
  await completedPersonality.page.locator('.pf-chart-help summary').first().click();
  assert.equal(await completedPersonality.page.locator('.pf-band-key').isVisible(),true,
    'UX-04: scale color legend remains accessible after expanding the help');
  assert.match(await completedPersonality.page.locator('.pf-table').innerText(),/Vuxna M/);
  assert.match(await completedPersonality.page.locator('.pf-table').innerText(),/Vuxna SD/);
  assert.match(await completedPersonality.page.locator('.pf-reference-feedback').innerText(),/amerikanska vuxenurvalets/);
  assert.match(await completedPersonality.page.locator('.pf-reference-caveat').innerText(),/svenska översättning/);
  assert.equal(await completedPersonality.page.getByText('Våra profiler').count(),0,'No fabricated second profile');
  // PF-01A: click the REAL UI export and inspect the downloaded local JSON.
  const localDownload=completedPersonality.page.waitForEvent('download');
  await completedPersonality.page.getByRole('button',{name:'Exportera mina egna svar (JSON)'}).click();
  const savedExport=await localDownload;
  assert.match(savedExport.suggestedFilename(),/^hemmakompassen-ipip50-egna-svar-\d{4}-\d{2}-\d{2}\.json$/);
  const downloaded=JSON.parse(await fs.readFile(await savedExport.path(),'utf8'));
  assert.equal(downloaded.instrument_id,'ipip50-sv-v1');
  assert.equal(downloaded.answered_count,50);
  assert.equal(downloaded.responses.length,50);
  assert.equal(downloaded.responses[0].statement_sv.length>5,true);
  assert.ok(!JSON.stringify(downloaded).includes('10000000-0000-0000'),'Downloaded self-answers contain no family identifiers');
  assert.equal(Object.hasOwn(downloaded,'partner'),false,'Downloaded self-answers never contain partner profile');
  assert.match(await completedPersonality.page.locator('.pf-export').innerText(),/Filen innehåller bara dina egna sparade svar/);

  await checkOverflow(completedPersonality.page,'Private personality profile 390px');
  await capture(completedPersonality.page,'mobile-personality-profile.png');
  await completedPersonality.page.locator('.pf-percentile-chart').screenshot({path:path.join(output,'mobile-personality-bars.png'),animations:'disabled'});
  await completedPersonality.context.close();
  const narrowPersonality=await freshContext({viewport:{width:320,height:700},deviceScaleFactor:2,isMobile:true,hasTouch:true},{authenticated:true,personalityComplete:true});
  await narrowPersonality.page.goto(base+'#personlighet',{waitUntil:'load'});
  await narrowPersonality.page.locator('.pf-scale-row').first().waitFor();
  const firstScalePosition=await narrowPersonality.page.evaluate(()=>{
    const main=document.querySelector('.live-main');
    const first=document.querySelector('.pf-results .pf-scale-track');
    const mainBox=main?.getBoundingClientRect(),firstBox=first?.getBoundingClientRect();
    return {mainTop:mainBox?.top,mainBottom:mainBox?.bottom,
      firstTrackTop:firstBox?.top,firstTrackBottom:firstBox?.bottom,
      chartHelpOpen:document.querySelector('.pf-results .pf-chart-help')?.open,
      introText:document.querySelector('.pf-intro')?.innerText};
  });
  assert.ok(firstScalePosition.firstTrackTop>=firstScalePosition.mainTop&&
    firstScalePosition.firstTrackBottom<=firstScalePosition.mainBottom,
    'UX-04: first actual personality scale must be visible without scrolling at 320x700 '+JSON.stringify(firstScalePosition));
  assert.equal(firstScalePosition.chartHelpOpen,false,
    'UX-04: long reference explanation is collapsed by default');
  assert.doesNotMatch(firstScalePosition.introText,/Utforska fem sidor/,
    'UX-04: finished profile does not repeat questionnaire onboarding');
  await checkOverflow(narrowPersonality.page,'Private personality profile 320px');
  // VIS-00-07: a persistent report shortcut must never hide graph labels.
  // Its dedicated right-hand slot belongs to the bottom nav, outside main.
  const reportDock=await narrowPersonality.page.evaluate(()=>{
    const report=document.querySelector('#hk-feedback-open')?.getBoundingClientRect();
    const nav=document.querySelector('#live-mobile-nav')?.getBoundingClientRect();
    const main=document.querySelector('.live-main')?.getBoundingClientRect();
    return report&&nav&&main?{
      report:{left:report.left,top:report.top,right:report.right,bottom:report.bottom},
      nav:{left:nav.left,top:nav.top,right:nav.right,bottom:nav.bottom},
      main:{top:main.top,bottom:main.bottom},
      viewport:document.documentElement.clientWidth
    }:null;
  });
  assert.ok(reportDock &&
    reportDock.report.left >= reportDock.nav.right + 4 &&
    reportDock.report.right <= reportDock.viewport + 1 &&
    reportDock.report.top >= reportDock.main.bottom - 2 &&
    reportDock.report.bottom <= reportDock.nav.bottom + 2,
    'VIS-00-07: the mobile report shortcut is docked beside the swipe tabs, entirely below personality content: '+JSON.stringify(reportDock));
  await capture(narrowPersonality.page,'mobile-320-personality-percentiles.png');
  await narrowPersonality.page.locator('.pf-percentile-chart').screenshot({path:path.join(output,'mobile-320-personality-bars.png'),animations:'disabled'});
  await narrowPersonality.context.close();
  const consentPair=await freshContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},{authenticated:true,paired:true,personalityComplete:true,personalitySharing:true,personalityPartnerShared:true});
  await consentPair.page.goto(base+'#personlighet',{waitUntil:'load'});
  await consentPair.page.getByRole('button',{name:'Jag vill dela mina fem skalpoäng'}).waitFor();
  assert.equal(await consentPair.page.getByRole('heading',{name:'Våra profiler'}).count(),0,'No comparison before own consent');
  await consentPair.page.getByRole('button',{name:'Jag vill dela mina fem skalpoäng'}).click();
  await consentPair.page.getByRole('heading',{name:'Våra profiler'}).waitFor();
  assert.equal(await consentPair.page.locator('.pf-comparison .pf-table tbody tr').count(),5);
  assert.equal(await consentPair.page.locator('.pf-family-reflections').count(),1);
  assert.match(await consentPair.page.locator('.pf-family-reflections').innerText(),/Att förstå era likheter och olikheter/);
  assert.match(await consentPair.page.locator('.pf-family-reflections').innerText(),/Likheter som kan hjälpa er/);
  assert.match(await consentPair.page.locator('.pf-family-reflections').innerText(),/Skillnader som kan vara värda att prata om/);
  assert.match(await consentPair.page.locator('.pf-family-reflections').innerText(),/Tonåringen kanske uppskattar tydliga planer mer än du själv gör/);
  assert.match(await consentPair.page.locator('.pf-family-reflections').innerText(),/Extraversion/);
  assert.match(await consentPair.page.locator('.pf-family-reflections').innerText(),/För dig som förälder/);
  assert.equal(await consentPair.page.locator('.pf-insight-resource a[href="#regler"]').count(),1);
  assert.ok(await consentPair.page.locator('.pf-insight-resource a[href="#swipe"]').count()>=1);
  assert.equal(await consentPair.page.locator('.pf-family-reflections .pf-insight-card').count(),5);
  assert.equal(await consentPair.page.locator('.pf-comparison .pf-scale-track').count(),5);
  const pctGeometry=await consentPair.page.locator('.pf-comparison .pf-scale-row').first().evaluate(row=>{
    const bar=row.querySelector('.pf-scale-track').getBoundingClientRect();
    const axis=row.querySelector('.pf-pct-axis');
    const center=axis.children[2].getBoundingClientRect();
    const threeQuarters=axis.children[3].getBoundingClientRect();
    const own=row.querySelector('.pf-score-own').getBoundingClientRect();
    const partner=row.querySelector('.pf-score-other').getBoundingClientRect();
    return {meanError:Math.abs(center.left+center.width/2-(bar.left+.5*bar.width)),
      p75Error:Math.abs(threeQuarters.left+threeQuarters.width/2-(bar.left+.75*bar.width)),
      partnerDx:Math.abs((own.left+own.width/2)-(partner.left+partner.width/2)),
      partnerDy:Math.abs((own.top+own.height/2)-(partner.top+partner.height/2))};
  });
  assert.ok(pctGeometry.meanError<1&&pctGeometry.p75Error<1,'P50 and P75 ticks align mathematically with the bar');
  assert.ok(pctGeometry.partnerDx<1&&pctGeometry.partnerDy>4,'Same-percentile profile dots have same x but remain distinguishable');
  await checkOverflow(consentPair.page,'Two consenting personality profiles 390px');
  await capture(consentPair.page,'mobile-personality-two-consents.png');
  await consentPair.page.locator('.pf-comparison .pf-percentile-chart').screenshot({path:path.join(output,'mobile-personality-bars-comparison.png'),animations:'disabled'});
  await consentPair.page.locator('.pf-family-reflections h3').scrollIntoViewIfNeeded();
  await consentPair.page.screenshot({path:path.join(output,'mobile-personality-family-reflections-viewport.png'),animations:'disabled'});
  await consentPair.page.locator('.pf-insight-group').last().scrollIntoViewIfNeeded();
  await consentPair.page.screenshot({path:path.join(output,'mobile-personality-family-similarities-viewport.png'),animations:'disabled'});
  await consentPair.page.getByRole('button',{name:'Sluta dela min profil'}).click();
  await consentPair.page.getByRole('heading',{name:'Våra profiler'}).waitFor({state:'detached'});
  assert.equal(await consentPair.page.locator('.pf-family-reflections').count(),0,'Withdrawal hides the entire narrative');
  assert.equal(await consentPair.page.evaluate(()=>window.__HK_PERSONALITY_SHARE__),false);
  await consentPair.context.close();
  const retestScreen=await freshContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},
    {authenticated:true,personalityComplete:true,privateRetests:true});
  await retestScreen.page.goto(base+'#personlighet',{waitUntil:'load'});
  await retestScreen.page.getByRole('heading',{name:'Gör testet igen – helt privat'}).waitFor();
  assert.match(await retestScreen.page.locator('.pf-retest').innerText(),/de delas inte med din familjemedlem eller AI-medlaren/);
  assert.match(await retestScreen.page.locator('.pf-retest-empty').innerText(),/Ingen avslutad omgång ännu/);
  assert.equal(await retestScreen.page.locator('.pf-retest button[data-ipip-retest="new"]').count(),1);
  assert.equal(await retestScreen.page.locator('.pf-retest button[data-ipip-retest="refresh"]').count(),0);
  await retestScreen.page.getByRole('button',{name:'Starta en ny privat testomgång'}).click();
  await retestScreen.page.locator('input[data-ipip-retest-answer="ipip50-001"][value="4"]').focus();
  await retestScreen.page.keyboard.press('Space');
  await retestScreen.page.waitForTimeout(350);
  const retestCheck=await retestScreen.page.evaluate(()=>({
    saved:window.__HK_PRIVATE_RETEST_ANSWERS__??null,
    text:document.querySelector('.pf-retest')?.textContent?.slice(0,450)??null
  }));
  assert.equal(retestCheck.saved,1,'Private answer must be saved: '+JSON.stringify(retestCheck));
  await retestScreen.page.getByText('Fråga 2 av 50').waitFor();
  assert.equal(await retestScreen.page.getByRole('button',{name:'Uppdatera mina omtest'}).count(),0,
    'PF-05: manual refresh does not compete with continuing an in-progress private retest');
  await retestScreen.page.getByRole('button',{name:'Spara och pausa'}).click();
  await retestScreen.page.getByRole('button',{name:'Fortsätt privat omtest'}).click();
  await retestScreen.page.getByText('Fråga 2 av 50').waitFor();

  const downloadPromise=retestScreen.page.waitForEvent('download');
  await retestScreen.page.getByRole('button',{name:'Exportera min påbörjade omgång (JSON)'}).click();
  const privateFile=await downloadPromise;
  assert.match(privateFile.suggestedFilename(),/^hemmakompassen-ipip50-omtest-.*\.json$/);
  retestScreen.page.once('dialog',dialog=>dialog.dismiss());
  await retestScreen.page.getByRole('button',{name:'Radera påbörjad omgång'}).click();
  await retestScreen.page.getByText('Fråga 2 av 50').waitFor();
  assert.equal(await retestScreen.page.getByRole('button',{name:'Radera påbörjad omgång'}).count(),1,
    'Dismissing the deletion confirmation retains the private draft');
  assert.equal(await retestScreen.page.getByRole('heading',{name:'Våra profiler'}).count(),0,
    'Private retest does not share scores or create partner comparison');
  await checkOverflow(retestScreen.page,'Private IPIP retest 390px');
  await retestScreen.page.locator('.pf-retest').scrollIntoViewIfNeeded();
  await capture(retestScreen.page,'mobile-ipip-private-retest.png');
  await retestScreen.context.close();
  const teenReflection=await freshContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},
    {authenticated:true,paired:true,role:'teen',personalityComplete:true,personalitySharing:true,personalityPartnerShared:true});
  await teenReflection.page.goto(base+'#personlighet',{waitUntil:'load'});
  await teenReflection.page.getByRole('button',{name:'Jag vill dela mina fem skalpoäng'}).click();
  await teenReflection.page.locator('.pf-family-reflections').waitFor();
  assert.match(await teenReflection.page.locator('.pf-family-reflections').innerText(),/För dig som tonåring/);
  assert.match(await teenReflection.page.locator('.pf-family-reflections').innerText(),/Det kan vara skönt när ni ungefär känner igen varandras sätt att vara med människor/);
  await checkOverflow(teenReflection.page,'Teen-specific reflections 390px');
  await teenReflection.page.locator('.pf-family-reflections h3').scrollIntoViewIfNeeded();
  await teenReflection.page.screenshot({path:path.join(output,'mobile-personality-teen-reflections.png'),animations:'disabled'});
  await teenReflection.context.close();
  // The general deck exposes only the current user's saved answers and teen-only skips.
  const generalReview=await freshContext(
    {viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},
    {authenticated:true,paired:true,role:'teen',preansweredSkipped:true}
  );
  await generalReview.page.goto(base+'#swipe',{waitUntil:'load'});
  await generalReview.page.locator('#swipe-general-review summary').click();
  assert.equal(await generalReview.page.locator('#swipe-general-review [data-general-review-kind="skipped"]').count(),1);
  assert.equal(await generalReview.page.locator('#swipe-general-review [data-general-review-kind="yes"]').count(),1);
  await generalReview.page.locator('#swipe-general-review-answer').selectOption('skipped');
  await generalReview.page.locator('#swipe-general-review-count').getByText('Visar 1 av 2 kort.').waitFor();
  await generalReview.page.locator('#swipe-general-review [data-general-review-index="1"]').click();
  await generalReview.page.waitForFunction(()=>document.activeElement?.id==='swipe-card');
  assert.equal(await generalReview.page.locator('#swipe-card').getAttribute('aria-label'),'Kort 2 av 34. Svep höger för ja eller vänster för nej.');
  await generalReview.page.locator('#swipe-general-review-back').click();
  assert.equal(await generalReview.page.locator('#swipe-general-review-answer').inputValue(),'skipped');
  await generalReview.page.waitForFunction(()=>document.activeElement?.matches('[data-general-review-index="1"]'));
  await generalReview.page.locator('#swipe-general-review-answer').selectOption('no');
  await generalReview.page.locator('#swipe-general-review-count').getByText('Visar 0 av 2 kort.').waitFor();
  await generalReview.page.locator('#swipe-general-review-reset').click();
  await generalReview.page.waitForFunction(()=>document.activeElement?.id==='swipe-general-review-search');
  await generalReview.page.locator('#swipe-general-review [data-general-review-index="0"]').click();
  await generalReview.page.waitForFunction(()=>document.activeElement?.id==='swipe-card');
  await generalReview.page.locator('.swipe-actions [data-swipe="no"]').click();
  await generalReview.page.waitForFunction(()=>window.__HK_SAVED_SWIPE__?.row.card_id==='general-01'&&window.__HK_SAVED_SWIPE__?.row.answer===false);
  await generalReview.page.waitForFunction(()=>document.activeElement?.matches('[data-general-review-index="0"]'));
  assert.equal(await generalReview.page.locator('#swipe-general-review details').evaluate(el=>el.open),true,
    'Private review remains expanded after saving the selected answer');
  assert.equal(await generalReview.page.locator('#swipe-general-review [data-general-review-index="0"]').locator('..').getAttribute('data-general-review-kind'),'no');
  assert.equal(await generalReview.page.locator('#swipe-general-review-answer').inputValue(),'all');
  await checkOverflow(generalReview.page,'General saved-answer review at 390px');
  await capture(generalReview.page,'mobile-390-private-general-review.png');
  const ownExportPromise=generalReview.page.waitForEvent('download');
  await generalReview.page.locator('#swipe-export-private').click();
  const ownDownload=await ownExportPromise;
  assert.equal(ownDownload.suggestedFilename(),'mina-gillaswajp-svar.txt');
  const ownBytes=await fs.readFile(await ownDownload.path());
  assert.deepEqual([...ownBytes.subarray(0,3)],[239,187,191],'Own Swedish text file is UTF-8 with BOM');
  const ownText=ownBytes.toString('utf8');
  assert.match(ownText,/Mina privata svar i Gillaswajpen/);
  assert.match(ownText,/Allmänna kortleken/);
  assert.match(ownText,/Mitt svar: Nej/,'The changed private answer is exported');
  assert.match(ownText,/Mitt svar: Överhoppat/,'The teen-only skipped B card is exported as skipped');
  assert.doesNotMatch(ownText,/user_id|family_id|pair_id|synthetic@example\.invalid|Gemensamma möjligheter/,
    'Export does not include account identifiers or shared results');
  await generalReview.page.locator('#swipe-export-status').getByText(/privata textfil/).waitFor();
  // If private importance read failed, never create an incomplete export that looks authoritative.
  const failedImportance=await freshContext(
    {viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},
    {authenticated:true,paired:true,role:'teen',preansweredSkipped:true,importanceReadFailure:true}
  );
  await failedImportance.page.goto(base+'#swipe',{waitUntil:'load'});
  await failedImportance.page.locator('#swipe-export-private').waitFor();
  await failedImportance.page.locator('#swipe-export-private').click();
  assert.match(await failedImportance.page.locator('#swipe-export-status').innerText(),/kunde inte hämtas/,
    'Export explains that private importance could not be loaded');
  assert.equal(await failedImportance.page.evaluate(()=>document.querySelector('#swipe-export-status')?.textContent?.includes('förberetts')),false,
    'A failed private importance read must not claim a successful export');
  await failedImportance.context.close();
  await generalReview.context.close();
  // UX-04: user-increased text size and short landscape viewport must retain every mobile destination.
  for(const [width,height,label] of [[430,932,'large-text'],[700,360,'landscape']]){
    const scaled=await freshContext({viewport:{width,height},deviceScaleFactor:2,isMobile:true,hasTouch:true},{authenticated:true,paired:true});
    await scaled.page.getByRole('heading',{name:/Hej[ ,]+Provförälder/}).waitFor();
    await scaled.page.addStyleTag({content:'html{font-size:125%!important}'});
    await checkOverflow(scaled.page,'UX-04 '+label+' home');
    await checkMobileNavigation(scaled.page,'UX-04 '+label+' mobile menu');
    const navSize=await scaled.page.locator('#live-mobile-nav > a').first().evaluate(el=>({
      fontSize:parseFloat(getComputedStyle(el).fontSize),
      height:el.getBoundingClientRect().height
    }));
    assert.ok(navSize.fontSize>=15&&navSize.height>=44,
      'UX-04 '+label+': enlarged labels and usable navigation targets '+JSON.stringify(navSize));
    await scaled.page.goto(base+'#kommunikation',{waitUntil:'load'});
    await scaled.page.getByRole('heading',{name:'Verktyg för bättre samtal'}).waitFor();
    await scaled.page.addStyleTag({content:'html{font-size:125%!important}'});
    await checkOverflow(scaled.page,'UX-04 '+label+' communication guidance');
    if(label==='landscape'){
      const firstTool=scaled.page.locator('.comm-feature-grid .comm-feature').first();
      const firstRect=await firstTool.boundingBox();
      const navRect=await scaled.page.locator('#live-mobile-nav').boundingBox();
      const titleRect=await scaled.page.getByRole('heading',{name:'Verktyg för bättre samtal'}).boundingBox();
      assert.ok(firstRect&&navRect&&titleRect,
        'Landscape communication should expose the hero, first tool and navigation');
      const firstHeading=await firstTool.locator('h2').boundingBox();
      assert.ok(firstHeading&&firstHeading.y+firstHeading.height<=navRect.y-5,
        'On 700x360 landscape with 125% text, the first tool heading must be fully readable above the bottom nav: '+
          JSON.stringify({heading:firstHeading,tool:firstRect,nav:navRect,title:titleRect}));
      assert.ok(titleRect.y+titleRect.height<=firstRect.y,
        'Compact landscape communication keeps heading readable before the tool list');
    }
    await capture(scaled.page,'mobile-'+label+'-communication.png');
    await scaled.context.close();
  }
  const narrow=await freshContext({viewport:{width:320,height:700},deviceScaleFactor:2,isMobile:true,hasTouch:true},{authenticated:true});
  await narrow.page.getByRole("heading",{name:/Hej[ ,]+Provförälder/}).waitFor();
  await checkMobileNavigation(narrow.page,'320px mobile navigation');
  await checkOverflow(narrow.page,'320px mobile homepage');
  await narrow.page.locator('#account-link').waitFor();
  const headerAudit=await narrow.page.evaluate(()=>{
    const brand=document.querySelector('.live-top .live-brand');
    const account=document.querySelector('.live-top #account-link');
    const b=brand?.getBoundingClientRect();
    const a=account?.getBoundingClientRect();
    const styles=account?getComputedStyle(account):null;
    return {brandRight:b?.right,accountLeft:a?.left,
      singleLine:!!styles&&styles.whiteSpace==='nowrap',
      visible:!!a&&a.left>=0&&a.right<=document.documentElement.clientWidth};
  });
  assert.ok(headerAudit.brandRight+3<=headerAudit.accountLeft,
    '320px mobile header brand and account link must not overlap');
  assert.ok(headerAudit.singleLine&&headerAudit.visible,
    '320px account link must remain one line fully inside the viewport');

  await narrow.page.locator('#live-mobile-nav a[href="#kommunikation"]').scrollIntoViewIfNeeded();
  assert.equal(await narrow.page.locator('#live-mobile-nav a[href="#kommunikation"]').isVisible(),true,
    'Communication guidance is directly accessible by swipe at 320px');
  await capture(narrow.page,'mobile-320-navigation.png');
  await narrow.page.goto(base+'#kommunikation',{waitUntil:'load'});
  await narrow.page.getByRole('heading',{name:'Verktyg för bättre samtal'}).waitFor();
  await checkOverflow(narrow.page,'Communication toolkit 320px');
  // Local reflective-listening rehearsal works at 320px; reset clears the draft and restores focus.
  await narrow.page.locator('#comm-reflection-form textarea[name="heard"]').fill('Jag vill bli lyssnad på');
  await narrow.page.locator('#comm-reflection-form textarea[name="meaning"]').fill('att få prata klart');
  await narrow.page.locator('#comm-reflection-form textarea[name="check"]').fill('Stämmer det att du vill ha mer tid?');
  await narrow.page.locator('#comm-reflection-form button[type="submit"]').click();
  assert.match(await narrow.page.locator('#comm-reflection-output').innerText(),/Det jag hörde: Jag vill bli lyssnad på/);
  assert.match(await narrow.page.locator('#comm-reflection-output').innerText(),/Den andra kan rätta min gissning/);
  await checkOverflow(narrow.page,'Private reflective listening 320px');
  await capture(narrow.page,'mobile-320-communication-reflection.png');
  await narrow.page.goto(base+'#kommunikation/spegla',{waitUntil:'load'});
  await narrow.page.waitForFunction(()=>document.activeElement?.matches('#comm-reflection-practice h2'));
  await narrow.page.locator('[data-comm-reflection-reset]').click();
  assert.equal(await narrow.page.locator('#comm-reflection-form textarea[name="heard"]').inputValue(),'');
  assert.match(await narrow.page.locator('#comm-reflection-output').innerText(),/Din privata spegling visas här/);
  await narrow.page.waitForFunction(()=>document.activeElement?.id==='comm-reflection-heard');
  // No draft is saved or carried along when this local-only module is reopened.
  await narrow.page.goto(base+'#nvc',{waitUntil:'load'});
  await narrow.page.goto(base+'#kommunikation',{waitUntil:'load'});
  assert.equal(await narrow.page.locator('#comm-reflection-form textarea[name="meaning"]').inputValue(),'');
  // The collaborative plan is local-only: it generates a text preview without sending.
  await narrow.page.locator('#comm-solution-form textarea[name="problem"]').fill('Vi avbryter varandra');
  await narrow.page.locator('#comm-solution-form textarea[name="question"]').fill('Hur upplever du våra samtal?');
  await narrow.page.locator('#comm-solution-form textarea[name="experiment"]').fill('Lyssna färdigt fem minuter');
  await narrow.page.locator('#comm-solution-form textarea[name="followup"]').fill('Efter helgen');
  await narrow.page.locator('#comm-solution-form button[type="submit"]').click();
  await narrow.page.locator('#comm-solution-output').getByText(/Jag vill prata om: Vi avbryter varandra/).waitFor();
  assert.match(await narrow.page.locator('#comm-solution-output').innerText(),/Den andra får säga nej/);
  await checkOverflow(narrow.page,'Private solution planner 320px');
  await capture(narrow.page,'mobile-320-communication-plan.png');
  await narrow.page.goto(base+'#kommunikation/plan',{waitUntil:'load'});
  await narrow.page.locator('#comm-solution-planner h2').waitFor();
  await narrow.page.waitForFunction(()=>document.activeElement?.matches('#comm-solution-planner h2'));
  await checkOverflow(narrow.page,'Deep-linked private planner 320px');

  await narrow.page.locator('[data-comm-solution-reset]').click();
  assert.equal(await narrow.page.locator('#comm-solution-form textarea[name="problem"]').inputValue(),'');
  assert.match(await narrow.page.locator('#comm-solution-output').innerText(),/Din privata samtalsplan visas här/);
  await capture(narrow.page,'mobile-320-communication.png');
  await narrow.page.goto(base+'#nvc',{waitUntil:'load'});
  await narrow.page.getByRole('heading',{name:'Nonviolent Communication',exact:true}).waitFor();
  await checkOverflow(narrow.page,'NVC builder 320px');
  await capture(narrow.page,'mobile-320-nvc.png');
  await narrow.context.close();
  const soloTeen=await freshContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},{authenticated:true,role:'teen'});
  await soloTeen.page.goto(base+'#inkorg',{waitUntil:'load'});
  assert.equal(await soloTeen.page.locator('.comm-crosslink a[href="#nvc"]').count(),1,'Teen may navigate to NVC from inbox');
  assert.equal(await soloTeen.page.locator('.comm-crosslink a[href="#mi-foralder"]').count(),0,'Teen does not see parent MI cross-links');
  await soloTeen.page.locator('.comm-crosslink a[href="#nvc"]').click();
  await soloTeen.page.getByRole('heading',{name:'Nonviolent Communication',exact:true}).waitFor();
  await soloTeen.page.goto(base+'#kommunikation',{waitUntil:'load'});
  assert.equal(await soloTeen.page.getByRole('link',{name:'Öppna MI-övningarna'}).count(),0,'Teen does not see parent MI entry');
  assert.match(await soloTeen.page.locator('.comm-feature-grid').innerText(),/Din röst är viktig/);
  assert.equal(await soloTeen.page.locator('.comm-exercise').count(),9,'Teen gets all common exercises');
  await soloTeen.page.locator('[data-comm-open="grans"]').focus();
  await soloTeen.page.keyboard.press('Enter');
  assert.equal(await soloTeen.page.locator('.comm-exercise[data-comm-skill="grans"]').evaluate(el=>el.open),true,'Teen can open boundary exercise by keyboard');
  assert.match(await soloTeen.page.locator('.comm-exercise[data-comm-skill="grans"]').innerText(),/sök hjälp hos en trygg vuxen/);
  await soloTeen.page.getByRole('link',{name:'Träna på att uttrycka dig'}).click();
  await soloTeen.page.getByRole('heading',{name:'Nonviolent Communication',exact:true}).waitFor();
  assert.match(await soloTeen.page.locator('.comm-example').first().innerText(),/ger råd innan jag har berättat färdigt/);
  await checkOverflow(soloTeen.page,'Teen NVC builder 390px');
  await capture(soloTeen.page,'mobile-nvc-teen.png');
  await soloTeen.page.goto(base+'#mi-foralder',{waitUntil:'load'});
  await soloTeen.page.getByRole('heading',{name:'Samtalsstöd för föräldrar'}).waitFor();
  assert.equal(await soloTeen.page.locator('.mi-parent-guide').count(),0,'Direct route cannot render parent MI content for a teen');
  await soloTeen.page.goto(base+'#swipe',{waitUntil:'load'});
  await soloTeen.page.locator("#swipe-card[aria-label^='Kort 1 av 34']").waitFor();
  await soloTeen.page.getByRole('button',{name:'Ja'}).click();
  await soloTeen.page.locator("#swipe-card[aria-label^='Kort 2 av 34']").waitFor();
  assert.match(await soloTeen.page.locator('#swipe-card').innerText(),/Jag vill helst prata färdigt/,'Understanding card is visible to teen');
  assert.match(await soloTeen.page.locator('.swipe-understanding-notice').innerText(),/privat tills du själv väljer att dela ett ja-svar/,'Teen is told that B sharing needs a separate action');
  assert.equal(await soloTeen.page.locator('.swipe-understanding-notice a[href="#insikter"]').count(),1,'Teen has a direct path to voluntary sharing');
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
  await teenReview.page.locator('.swipe-finished summary').waitFor();
   const moreDecks=teenReview.page.locator('.swipe-themes > details.swipe-more-decks');
   await moreDecks.locator('summary').waitFor();
   assert.equal(await moreDecks.evaluate(el=>el.open),false,'UX-SW-03 extra decks stay collapsed after completing general cards');
   const deckChoice=moreDecks.locator(':scope > summary');
   const deckChoiceAppearance=await deckChoice.evaluate(el=>{
     const css=getComputedStyle(el),chevron=getComputedStyle(el,'::after');
     const box=el.getBoundingClientRect();
     return {height:box.height,fontSize:parseFloat(css.fontSize),minHeight:parseFloat(css.minHeight),
       cursor:css.cursor,chevron:chevron.content,color:css.color};
   });
   assert.ok(deckChoiceAppearance.height>=52&&deckChoiceAppearance.fontSize>=17,
     'FBK-02-06: next-deck disclosure is a readable, touch-sized mobile option: '+JSON.stringify(deckChoiceAppearance));
   assert.equal(deckChoiceAppearance.cursor,'pointer','FBK-02-06: disclosure signals interactivity');
   assert.match(deckChoiceAppearance.chevron,/▸/,'FBK-02-06: closed deck choice has a visible chevron');
   await deckChoice.focus();
   assert.equal(await deckChoice.evaluate(el=>document.activeElement===el),true,
     'FBK-02-06: deck-choice disclosure remains keyboard-focusable');
   await checkOverflow(teenReview.page,'FBK-02-06 completed swipe extra decks 390px');
   await capture(teenReview.page,'mobile-swipe-extra-decks-collapsed.png');
   assert.equal(await moreDecks.evaluate(el=>el.open),false,'FBK-02-06: visual emphasis does not open extra decks by default');
   assert.equal(await moreDecks.locator('h3').count(),6,'All six locked deck previews remain in the DOM for an unpaired teen');
   assert.equal(await moreDecks.locator('h3:visible').count(),0,'Extra deck previews do not compete with completed results');
   await moreDecks.locator('summary').click();
   assert.equal(await moreDecks.locator('h3:visible').count(),6,'All six locked deck previews become visible on user request');
  assert.match(await teenReview.page.locator('.swipe-finished').innerText(),/34 sparade svar/,'All answers are loaded before review');
  await teenReview.page.locator('.swipe-finished summary').click();
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
  // SW-04: an unanswered/overhopped B card is not a finished response.
  // Revisit only the skipped card without forcing a review of all 34.
  const skipAgain=await freshContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},
    {authenticated:true,role:'teen',preansweredGeneral:true,preansweredSkipped:true});
  await skipAgain.page.goto(base+'#swipe',{waitUntil:'load'});
  await skipAgain.page.locator('.swipe-finished summary').waitFor();
   await skipAgain.page.locator('.swipe-finished summary').click();
   await skipAgain.page.locator('#swipe-review-skipped').waitFor();
  assert.match(await skipAgain.page.locator('.swipe-finished').innerText(),/1 kort återstår/,'Skipped cards are not described as fully answered');
  await skipAgain.page.locator('#swipe-review-skipped').click();
  await skipAgain.page.locator("#swipe-card[aria-label^='Kort 2 av 34']").waitFor();
  assert.equal(await skipAgain.page.locator('.swipe-finished').count(),0);
  await skipAgain.page.locator('#swipe-skip').click();
  await skipAgain.page.locator('.swipe-finished summary').waitFor();
   await skipAgain.page.locator('.swipe-finished summary').click();
   await skipAgain.page.locator('#swipe-review-skipped').waitFor();
  assert.match(await skipAgain.page.locator('.swipe-finished').innerText(),/1 kort återstår/,'Skipping again leaves the card pending');
  await skipAgain.page.locator('#swipe-review-skipped').click();
  await skipAgain.page.locator("#swipe-card[aria-label^='Kort 2 av 34']").waitFor();
  await skipAgain.page.getByRole('button',{name:'Ja'}).click();
  await skipAgain.page.locator('.swipe-finished').getByText(/Allmänna kortleken genomgången · 34 sparade svar/).waitFor();
  assert.equal(await skipAgain.page.locator('#swipe-review-skipped').count(),0,'Completed B card leaves the skipped queue');
  await checkOverflow(skipAgain.page,'Mobile skipped-card revisit');
  await capture(skipAgain.page,'mobile-teen-skipped-revisit.png');
  await skipAgain.context.close();
  const paired=await freshContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},{authenticated:true,paired:true});
  await paired.page.goto(base+"#swipe",{waitUntil:"load"});
  await paired.page.locator(".swipe-unified-overview .swipe-unified-list > li").first().waitFor();
  await paired.page.locator('.swipe-secondary-results').waitFor();
  await revealSwipeSecondary(paired.page);
  assert.match(await paired.page.locator(".swipe-unified-overview").innerText(),/3 gemensamma ja-svar/,
    "FUN-SW-02: consolidated result counts only two valid general A matches and one theme A match");
  assert.equal(await paired.page.locator(".swipe-unified-overview .swipe-unified-list > li").count(),2,
    "FUN-SW-02: result groups by category across decks without separate deck cards");
  assert.equal(await paired.page.locator('.swipe-unified-overview .swipe-unified-next-step').count(),0,
    'FUN-SW-02: conversation and general YES matches must not produce an invented activity invitation');
  // Positive complement: an explicitly server-confirmed activity JA+JA must
  // produce an activity invitation, not just a generic conversation match.
  // Only synthetic RPC fixture data is changed; no real test answers are written.
  const pairedActivity=await freshContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},
    {authenticated:true,paired:true});
  await pairedActivity.page.evaluate(()=>{
    window.__HK_TEST_SHARED_MATCHES__=[
      {deck_id:'aktiviteter',card_id:'aktiviteter-01',answer:true},
      {deck_id:'samtal',card_id:'samtal-01',answer:true},
      {deck_id:'aktiviteter',card_id:'aktiviteter-02',answer:false},
      {deck_id:'general',card_id:'general-02',answer:true}
    ];
  });
  await pairedActivity.page.goto(base+'#swipe',{waitUntil:'load'});
  await pairedActivity.page.locator('.swipe-unified-next-step').waitFor();
  assert.match(await pairedActivity.page.locator('.swipe-unified-next-step').innerText(),/Att göra tillsammans:/,
    'FUN-SW-02: a confirmed activity match produces an explicit shared-activity suggestion');
  assert.equal(await pairedActivity.page.locator('.swipe-unified-overview .swipe-unified-next-step').count(),1,
    'FUN-SW-02: unrelated YES and private B/NO rows must not duplicate the activity invitation');
  assert.equal(await pairedActivity.page.locator('.swipe-unified-next-step a[href="#inkorg"]').count(),1,
    'FUN-SW-02: the activity invitation links to a concrete next step');
  await checkOverflow(pairedActivity.page,'FUN-SW-02 shared activity invitation 390px');
  await capture(pairedActivity.page,'mobile-swipe-activity-invitation.png');
  // A revoked mutual activity must disappear on the next authoritative
  // snapshot, while an unrelated confirmed conversation match remains.
  await pairedActivity.page.evaluate(()=>{
    window.__HK_TEST_SHARED_MATCHES__=[
      {deck_id:'aktiviteter',card_id:'aktiviteter-01',answer:false},
      {deck_id:'samtal',card_id:'samtal-01',answer:true}
    ];
  });
  await pairedActivity.page.goto(base+'#hem',{waitUntil:'load'});
  await pairedActivity.page.goto(base+'#swipe',{waitUntil:'load'});
  await pairedActivity.page.locator('.swipe-unified-list > li').first().waitFor();
  assert.equal(await pairedActivity.page.locator('.swipe-unified-next-step').count(),0,
    'FUN-SW-02: revoked activity JA+JA must remove the shared invitation');
  assert.match(await pairedActivity.page.locator('.swipe-unified-overview').innerText(),/1 gemensamma ja-svar/,
    'FUN-SW-02: revocation keeps only the remaining server-confirmed conversation match');
  assert.equal(await pairedActivity.page.locator('.swipe-unified-statements > li').count(),1,
    'FUN-SW-02: revocation removes stale activity text from the unified list');
  // If the authoritative RPC fails after a valid result, the UI must fail
  // closed instead of showing the previously suggested activity again.
  await pairedActivity.page.evaluate(()=>{window.__HK_RPC_UNAVAILABLE__=true;});
  await pairedActivity.page.goto(base+'#hem',{waitUntil:'load'});
  await pairedActivity.page.goto(base+'#swipe',{waitUntil:'load'});
  await pairedActivity.page.locator('.swipe-unified-overview [role="alert"]').waitFor();
  assert.equal(await pairedActivity.page.locator('.swipe-unified-next-step, .swipe-unified-list > li').count(),0,
    'FUN-SW-02: RPC failure must not retain stale invitations or shared statements');
  await checkOverflow(pairedActivity.page,'FUN-SW-02 revoked activity and failed RPC 390px');
  await pairedActivity.context.close();
  assert.equal(await paired.page.locator(".swipe-unified-overview a[href='#insikter']").count(),1,
    "FUN-SW-02: expressly shared understanding remains on its own consent-controlled route");
  await paired.page.getByRole("heading",{name:"Det ni båda svarat ja till"}).waitFor();
  await paired.page.locator(".swipe-match-group h4").filter({hasText:"Relationer"}).waitFor();
  assert.equal(await paired.page.locator(".swipe-results .swipe-match-list li").count(),2,"Only catalogued mutual YES cards appear; malicious RPC NO, B and unknown cards are discarded");
  // An editorial category filter must only narrow already-verified JA+JA rows.
  await paired.page.evaluate(()=>{
    window.__HK_TEST_SHARED_MATCHES__=[
      {deck_id:'general',card_id:'general-01',answer:true},
      {deck_id:'general',card_id:'general-08',answer:true},
      {deck_id:'general',card_id:'general-02',answer:true}, // teen-only B, never visible here
      {deck_id:'general',card_id:'general-03',answer:false},
      {deck_id:'general',card_id:'general-99',answer:true}
    ];
  });
  await paired.page.locator('[data-refresh-matches="general"]').click();
  await paired.page.waitForFunction(()=>document.querySelectorAll('.swipe-match-group .swipe-match-list li').length===2
    &&document.querySelectorAll('[data-shared-match-filter]').length===3);
  await paired.page.locator('[data-shared-match-filter="Fritid"]').click();
  assert.equal(await paired.page.locator('.swipe-match-group .swipe-match-list li').count(),1,
    'Only the selected verified category is shown');
  assert.equal(await paired.page.locator('[data-shared-match-filter="Fritid"]').getAttribute('aria-pressed'),'true');
  assert.equal(await paired.page.locator('[data-shared-match-filter="Fritid"]').evaluate(el=>document.activeElement===el),true,
    'Keyboard focus remains on selected filter after rerender');
  await checkOverflow(paired.page,'Shared-match category filter 390px');
  await capture(paired.page,'mobile-shared-match-category-filter.png');
  await paired.page.locator('[data-shared-match-filter="all"]').click();
  assert.equal(await paired.page.locator('.swipe-match-group .swipe-match-list li').count(),2);
  await paired.page.evaluate(()=>{delete window.__HK_TEST_SHARED_MATCHES__;});
  await paired.page.locator('[data-refresh-matches="general"]').click();
  await paired.page.waitForFunction(()=>document.querySelectorAll('.swipe-match-group .swipe-match-list li').length===2
    &&document.querySelector('.swipe-match-group')?.textContent.includes('Jag vill bli bättre på att visa uppskattning'));

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
  // A refresh of shared priorities can fail while ordinary JA+JA matches still
  // succeed. Do not keep stale priority content from an earlier consent state.
  await paired.page.evaluate(()=>{window.__HK_PRIORITY_RPC_UNAVAILABLE__=true;});
  await paired.page.locator('[data-refresh-matches="general"]').click();
  await paired.page.getByRole('alert').filter({hasText:'Delade prioriteringar kunde inte kontrolleras'}).waitFor();
  assert.equal(await paired.page.locator('.swipe-priority-theme').count(),0,
    'Old shared priority content is cleared when the priority RPC fails');
  assert.match(await paired.page.locator('.swipe-match-group').innerText(),/Jag uppskattar när vi gör saker tillsammans/,
    'Ordinary server-verified mutual matches remain visible during priority failures');
  await paired.page.evaluate(()=>{window.__HK_PRIORITY_RPC_UNAVAILABLE__=false;});
  await paired.page.locator('[data-refresh-matches="general"]').click();
  await paired.page.locator('.swipe-priority-theme').waitFor();
  assert.equal(await paired.page.getByRole('alert').filter({hasText:'Delade prioriteringar kunde inte kontrolleras'}).count(),0,
    'Successful refresh clears the transient priority warning');

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
  await paired.page.waitForFunction(()=>document.querySelectorAll('.swipe-results .swipe-match-list li').length===1);
  assert.doesNotMatch(await paired.page.locator('.swipe-results').innerText(),/Jag vill helst prata färdigt innan någon kommer med råd/,'Automatic refresh must not expose B or NO');
  await paired.page.locator('.swipe-results').scrollIntoViewIfNeeded();
  await capture(paired.page,'mobile-auto-shared-match.png');
  await paired.page.evaluate(()=>{window.__HK_TEST_SHARED_MATCHES__=[];window.dispatchEvent(new Event('focus'));});
  await paired.page.waitForFunction(()=>document.querySelector('.swipe-results')?.textContent?.includes('Inga gemensamma ja-svar'));
  assert.equal(await paired.page.locator('.swipe-results .swipe-match-list li').count(),0,'Automatic refresh must remove a revoked match');
  await paired.page.waitForFunction(()=>document.querySelector('.swipe-unified-overview')?.textContent?.includes('Inga gemensamma ja-svar'));
  assert.equal(await paired.page.locator('.swipe-unified-overview .swipe-unified-list > li').count(),0,
    'FUN-SW-02: all-deck summary removes revoked matches on focus without displaying stale results');
  await paired.page.locator('.swipe-results').scrollIntoViewIfNeeded();
  await capture(paired.page,'mobile-auto-revoked-match.png');
  await paired.page.evaluate(()=>{delete window.__HK_TEST_SHARED_MATCHES__;window.dispatchEvent(new Event('focus'));});
  await paired.page.waitForFunction(()=>document.querySelectorAll('.swipe-results .swipe-match-list li').length===2);

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

  // NOT-01C: a server-verified mutual activity can be suggested through the
  // existing private inbox, but no message is sent without a separate action.
  await paired.page.evaluate(()=>{
    window.__HK_TEST_SHARED_MATCHES__=[
      {deck_id:'aktiviteter',card_id:'aktiviteter-01',answer:true},
      {deck_id:'aktiviteter',card_id:'aktiviteter-02',answer:false},
      {deck_id:'general',card_id:'general-02',answer:true}
    ];
  });
  await paired.page.locator('#insights-retry').click();
  await paired.page.locator('[data-insight-activity="aktiviteter-01"]').waitFor();
  assert.equal(await paired.page.locator('[data-insight-activity]').count(),1,
    'Only the server-verified mutual YES activity gets an invitation action');
  // FUN-02/03-ACTIVITY-PAIR-JOIN-01: an insight refresh may have already
  // started the same pair/epoch check. A deliberate activity CTA joins that
  // pending result rather than forcing a second click or a second pair RPC.
  await paired.page.evaluate(()=>{window.__HK_TEST_HOLD_NEXT_PAIR_READ__=true;});
  await paired.page.locator('#insights-retry').click();
  await paired.page.waitForFunction(()=>typeof window.__HK_TEST_RELEASE_PAIR_READ__==='function');
  const raceCta=paired.page.locator('[data-insight-activity="aktiviteter-01"]');
  const sentBefore=await paired.page.evaluate(()=>window.__HK_CHAT_SEND__||null);
  await raceCta.click();
  await paired.page.waitForFunction(()=>
    document.querySelector('[data-insight-activity="aktiviteter-01"]')?.disabled===true);
  assert.equal(await raceCta.isEnabled(),false,
    'Invitation remains locked while awaiting a concurrent family check');
  assert.equal(await paired.page.locator('#family-chat-body').count(),0,
    'No inbox draft exists before the family epoch is confirmed');
  assert.deepEqual(await paired.page.evaluate(()=>window.__HK_CHAT_SEND__||null),sentBefore,
    'A pending invitation must never send a message');
  await paired.page.evaluate(()=>window.__HK_TEST_RELEASE_PAIR_READ__());
  // Once the shared check succeeds, the same click creates an editable DRAFT.
  // No second click is needed, and no send RPC runs.
  await paired.page.locator('#family-chat-body').waitFor();
  assert.match(await paired.page.locator('#family-chat-body').inputValue(),
    /Laga mat tillsammans.*bestämmer en dag/s,'Activity invitation is an editable inbox draft');
  assert.deepEqual(await paired.page.evaluate(()=>window.__HK_CHAT_SEND__||null),sentBefore,
    'Clicking the activity must not call the send message RPC');
  assert.match(await paired.page.locator('#family-chat-help').innerText(),
    /Skickas bara när du väljer Skicka/);
  await checkOverflow(paired.page,'Mobile voluntary activity invitation draft');
  await paired.page.waitForFunction(()=>{
    const draft=document.querySelector('#family-chat-body');
    const main=document.querySelector('.live-main');
    if(!draft||!main)return false;
    const field=draft.getBoundingClientRect(),viewport=main.getBoundingClientRect();
    return field.top<viewport.bottom-32&&field.bottom>viewport.top+32;
  },null,{timeout:4000});
  assert.ok(await paired.page.evaluate(()=>document.querySelector('.live-main')?.scrollTop>0),
    'Activity CTA must bring the unsent draft into the visible mobile inbox viewport');
  await capture(paired.page,'mobile-activity-invite-draft.png');
  await paired.page.locator('#family-chat-body').fill('');
  // NOT-01D: same verified activity CTA is directly reachable in its own
  // finished themed-deck results, not only from the all-deck insights screen.
  await paired.page.evaluate(()=>{location.hash='insikter';});
  await paired.page.locator('[data-insight-open="aktiviteter"]').waitFor();
  await paired.page.locator('[data-insight-open="aktiviteter"]').click();
  await paired.page.locator('.swipe-secondary-results').waitFor();
  await revealSwipeSecondary(paired.page);
  await paired.page.locator('.swipe-results [data-insight-activity="aktiviteter-01"]').waitFor();
  assert.equal(await paired.page.locator('.swipe-results [data-insight-activity]').count(),1,
    'No NO or B card in the activity deck may create a shared invitation button');
  await paired.page.locator('.swipe-results [data-insight-activity="aktiviteter-01"]').click();
  await paired.page.locator('#family-chat-body').waitFor();
  assert.match(await paired.page.locator('#family-chat-body').inputValue(),
    /Laga mat tillsammans.*bestämmer en dag/s);
  assert.deepEqual(await paired.page.evaluate(()=>window.__HK_CHAT_SEND__||null),sentBefore,
    'The direct deck path must never send an activity invitation automatically');
  await paired.page.waitForFunction(()=>{
    const draft=document.querySelector('#family-chat-body');
    const main=document.querySelector('.live-main');
    if(!draft||!main)return false;
    const field=draft.getBoundingClientRect(),viewport=main.getBoundingClientRect();
    return field.top<viewport.bottom-32&&field.bottom>viewport.top+32;
  },null,{timeout:4000});
  assert.ok(await paired.page.evaluate(()=>document.querySelector('.live-main')?.scrollTop>0),
    'Activity deck CTA must bring the unsent draft into the visible mobile inbox viewport');
  await capture(paired.page,'mobile-activity-invite-from-deck.png');
  await paired.page.locator('#family-chat-body').fill('');
  await paired.page.evaluate(()=>{delete window.__HK_TEST_SHARED_MATCHES__;location.hash='insikter';});
  await paired.page.locator('.insights-deck').first().waitFor();
  assert.equal(await paired.page.locator('.insights-deck').count(),2,
    'Returning to normal server matches restores the same permitted cross-deck insights');

  // Cross-tab consent change: the same viewer's current shared RPC must
  // replace the old B-only message, while keeping mutual A results intact.
  const beforeRevoke=await paired.page.locator('.insights-deck .swipe-match-list li').count();
  await paired.page.evaluate(()=>{window.__HK_TEST_SET_SHARED_B__([]);window.dispatchEvent(new Event('focus'));});
  await paired.page.waitForFunction(()=>document.querySelector('.insights-view')?.textContent?.includes('Inga förståelsekort är aktivt delade'));
  assert.doesNotMatch(await paired.page.locator('.insights-view').innerText(),/Tonåringen vill få prata färdigt innan du kommer med råd/,'Remote B revocation clears text on viewer focus');
  assert.equal(await paired.page.locator('.insights-deck .swipe-match-list li').count(),beforeRevoke,'Remote B revocation does not erase authorized mutual A');
  await paired.page.evaluate(()=>{window.__HK_TEST_SET_SHARED_B__(['general-02']);window.dispatchEvent(new Event('focus'));});
  await paired.page.getByText('Tonåringen vill få prata färdigt innan du kommer med råd').waitFor();
  await capture(paired.page,'mobile-insights-remote-consent-refresh.png');
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
  await paired.page.locator('.swipe-secondary-results').waitFor();
  await revealSwipeSecondary(paired.page);

  // SW-03A: the teenager alone sees own high-ranked, server-verifiable A YES.
  // Keep the future shared priority feature off: no private importance may
  // become automatically visible to the parent or be read via priority RPC.
  const teenPriority=await freshContext(
    {viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},
    {authenticated:true,paired:true,role:'teen',privateImportance:true,priorityFeature:false}
  );
  await teenPriority.page.goto(base+'#swipe',{waitUntil:'load'});
  await teenPriority.page.locator('.swipe-private-priority').waitFor();
  const privatePreview=await teenPriority.page.locator('.swipe-private-priority').innerText();
  assert.match(privatePreview,/Mina viktigaste gemensamma ja-svar/);
  assert.match(privatePreview,/ENDAST FÖR DIG · INTE DELAT/);
  assert.match(privatePreview,/AI-medlaren kan använda dina egna skattningar/,'Disclose permitted personal AI context accurately');
  assert.equal(await teenPriority.page.locator('.swipe-private-priority .swipe-match-list li').count(),1,
    'Only teen-high, mutual A YES appears, not private B or neutral A');
  assert.equal(await teenPriority.page.evaluate(()=>window.__HK_PRIORITY_RPC_CALLS__||0),0,
    'Preview uses only self-owned importance and already approved A matches, not a priority RPC');
  await checkOverflow(teenPriority.page,'Teen private mutual-YES priority preview 390px');
  await teenPriority.page.locator('.swipe-private-priority').scrollIntoViewIfNeeded();
  await capture(teenPriority.page,'mobile-teen-private-priority-preview.png');
  await teenPriority.context.close();

  const teenPriorityConsent=await freshContext(
    {viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},
    {authenticated:true,paired:true,role:'teen',privateImportance:true,priorityFeature:true}
  );
  await teenPriorityConsent.page.goto(base+'#swipe',{waitUntil:'load'});
  const sharePriority=teenPriorityConsent.page.locator('[data-priority-share][data-card-id="general-01"]');
  await sharePriority.waitFor();
  assert.equal(await sharePriority.getAttribute('aria-pressed'),'false','Private +1 starts unshared without explicit consent');
  assert.match(await teenPriorityConsent.page.locator('.swipe-private-priority').innerText(),/privat tills du själv väljer/i,'Teen sees informed privacy copy before consent');
  await sharePriority.click();
  await teenPriorityConsent.page.waitForFunction(()=>window.__HK_PRIORITY_SHARE__?.args?.p_share===true);
  await teenPriorityConsent.page.waitForFunction(()=>document.querySelector('[data-priority-share][data-card-id="general-01"]')?.getAttribute('aria-pressed')==='true');
  assert.match(await sharePriority.innerText(),/Återkalla delning/,'Active consent offers immediate revocation');
  assert.match(await teenPriorityConsent.page.locator('.swipe-results').innerText(),/Delat som gemensamt fokus/,'Successful consent is acknowledged');
  await checkOverflow(teenPriorityConsent.page,'Teen A priority consent 390px');
  await teenPriorityConsent.page.locator('.swipe-private-priority').scrollIntoViewIfNeeded();
  await capture(teenPriorityConsent.page,'mobile-teen-priority-consent.png');
  await sharePriority.click();
  await teenPriorityConsent.page.waitForFunction(()=>window.__HK_PRIORITY_SHARE__?.args?.p_share===false);
  await teenPriorityConsent.page.waitForFunction(()=>document.querySelector('[data-priority-share][data-card-id="general-01"]')?.getAttribute('aria-pressed')==='false');
  assert.match(await teenPriorityConsent.page.locator('.swipe-results').innerText(),/Delningen är återkallad/,'Revocation updates the UI immediately');
  // The network can lose the acknowledgement *after* a successful server write.
  await teenPriorityConsent.page.evaluate(()=>window.__HK_PRIORITY_RPC_FAIL_AFTER_WRITE__=true);
  await sharePriority.click();
  await teenPriorityConsent.page.waitForFunction(()=>document.querySelector('.swipe-priority-share-status')?.textContent.includes('trots ett kommunikationsfel'));
  assert.equal(await sharePriority.getAttribute('aria-pressed'),'true','An acknowledged-by-read share stays visible despite an RPC error');
  assert.equal(await sharePriority.evaluate(el=>el===document.activeElement),true,'Consent retains keyboard focus through rerenders');
  await teenPriorityConsent.page.evaluate(()=>{window.__HK_PRIORITY_RPC_FAIL_AFTER_WRITE__=false;window.__HK_PRIORITY_RPC_FAIL_NO_WRITE__=true;});
  await sharePriority.click();
  await teenPriorityConsent.page.waitForFunction(()=>document.querySelector('.swipe-priority-share-status')?.textContent.includes('fortfarande delat'));
  assert.equal(await sharePriority.getAttribute('aria-pressed'),'true','A failed revocation never claims the share was removed');
  await teenPriorityConsent.page.evaluate(()=>{window.__HK_PRIORITY_RPC_FAIL_NO_WRITE__=false;window.__HK_PRIORITY_READ_FAIL__=true;});
  await sharePriority.click();
  await teenPriorityConsent.page.locator('[data-priority-retry]').waitFor();
  assert.equal(await sharePriority.getAttribute('aria-disabled'),'true','Unknown status disables consent actions');
  assert.match(await teenPriorityConsent.page.locator('.swipe-priority-share-status').innerText(),/går inte att veta/);
  await teenPriorityConsent.page.evaluate(()=>window.__HK_PRIORITY_READ_FAIL__=false);
  await teenPriorityConsent.page.locator('[data-priority-retry]').click();
  await teenPriorityConsent.page.waitForFunction(()=>document.querySelector('[data-priority-share][data-card-id="general-01"]')?.getAttribute('aria-pressed')==='false');
  assert.equal(await sharePriority.getAttribute('aria-disabled'),'false','A fresh server read restores verified controls');
  await teenPriorityConsent.context.close();

  const parentPriority=await freshContext(
    {viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},
    {authenticated:true,paired:true,role:'parent',privateImportance:true,priorityFeature:true}
  );
  await parentPriority.page.goto(base+'#swipe',{waitUntil:'load'});
  await parentPriority.page.locator('.swipe-secondary-results').waitFor();
  await revealSwipeSecondary(parentPriority.page);
  await parentPriority.page.locator('.swipe-results .swipe-match-list li').first().waitFor();
  assert.equal(await parentPriority.page.locator('.swipe-private-priority').count(),0,
    'Private teen priorities never appear in parent results even when staging flag is on');
  assert.equal(await parentPriority.page.locator('[data-priority-share]').count(),0,'Parent never receives teen-only consent controls');
  assert.ok(await parentPriority.page.evaluate(()=>window.__HK_PRIORITY_RPC_CALLS__||0)>0,'Parent reads only the server-verified shared priority RPC');
  await parentPriority.context.close();

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
  // FUN-02.02: a server write may succeed even when its acknowledgement is lost.
  await teenInsights.page.evaluate(()=>{window.__HK_UNDERSTANDING_RPC_FAIL_AFTER_WRITE__=true;});
  await activeShare.click();
  await teenInsights.page.waitForFunction(()=>document.querySelector('[data-understanding-share="general-02"]')?.getAttribute('aria-pressed')==='true');
  assert.match(await activeShare.innerText(),/Återkalla delning/,'Lost share acknowledgement is reconciled with persisted state');
  await teenInsights.page.locator('#insights-understanding .swipe-match-list').first().locator('li').first().waitFor();
  await activeShare.click();
  await teenInsights.page.waitForFunction(()=>document.querySelector('[data-understanding-share="general-02"]')?.getAttribute('aria-pressed')==='false');
  assert.match(await teenInsights.page.locator('.insights-view').innerText(),/Inga förståelsekort är aktivt delade/,'Lost revoke acknowledgement removes old shared B');
  // A failed verification must not pretend the request was rejected or
  // expose an actionable toggle with an unknown server consent status.
  await teenInsights.page.evaluate(()=>{
    window.__HK_UNDERSTANDING_SHARE_READ_FAIL__=true;
  });
  await activeShare.click();
  await teenInsights.page.locator('[data-understanding-retry]').waitFor();
  assert.equal(await activeShare.isDisabled(),true,'Unknown share status disables further consent writes');
  assert.equal(await activeShare.getAttribute('aria-pressed'),null,'An unknown server choice must not be labelled as an explicit no');
  assert.match(await teenInsights.page.locator('#insights-understanding').innerText(),/Det går inte att kontrollera vilka förståelsekort/);
  assert.match(await teenInsights.page.getByRole('alert').last().innerText(),/går inte att veta om ditt val/);
  const writesBeforeRetry=await teenInsights.page.evaluate(()=>window.__HK_UNDERSTANDING_WRITES__);
  await teenInsights.page.evaluate(()=>{
    window.__HK_UNDERSTANDING_RPC_FAIL_AFTER_WRITE__=false;
    window.__HK_UNDERSTANDING_SHARE_READ_FAIL__=false;
  });
  await teenInsights.page.locator('[data-understanding-retry]').click();
  await teenInsights.page.waitForFunction(()=>document.querySelector('[data-understanding-share="general-02"]')?.getAttribute('aria-pressed')==='true');
  assert.equal(await teenInsights.page.evaluate(()=>window.__HK_UNDERSTANDING_WRITES__),writesBeforeRetry,'Retry only reads server status, never resends a consent write');
  assert.equal(await teenInsights.page.locator('[data-understanding-retry]').count(),0);
  await checkOverflow(teenInsights.page,'Mobile teen B consent and lost acknowledgement');
  await capture(teenInsights.page,'mobile-teen-understanding-consent.png');

  assert.equal(await paired.page.locator(".swipe-themes details").count(),6,"A paired family can explore all six theme decks without completing general cards");
  assert.equal(await paired.page.evaluate(()=>window.__HK_UNLOCK_RPC_CALLS__||0),0,"Theme access never requests the obsolete completion RPC");
  // Partial completion is sufficient: the paired parent has only a few saved
  // general answers but may already explore a theme and see only mutual YES.
  await paired.page.locator('[data-theme-open="samtal"]').click();
  await paired.page.locator("#swipe-card[aria-label^='Temakort 1 av 104']").waitFor();
  await paired.page.locator('.swipe-secondary-results').waitFor();
  await revealSwipeSecondary(paired.page);
  await paired.page.locator(".swipe-results .swipe-match-list li").first().waitFor();
  assert.equal(await paired.page.locator(".swipe-results .swipe-match-list li").count(),1,"An unfinished theme shows only its verified mutual YES, not NO or other-deck answers");
  await paired.page.locator("#theme-back").click();
  await paired.page.locator('.swipe-secondary-results').waitFor();
  await revealSwipeSecondary(paired.page);
  await paired.page.locator(".swipe-results .swipe-match-list li").first().waitFor();
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
  assert.equal(await paired.page.locator('.schyssta-quick-actions').count(),0,'An RPC error cannot display a false empty/pending summary');
  assert.doesNotMatch(await paired.page.locator('.live-main').innerText(),/Falsk text|Okänd privat uppgift/,'Unexpected server rows are never rendered');
  await paired.page.evaluate(()=>{window.__HK_SCHYSSTA_CLEAN_RPC__=true;});
  await paired.page.locator('#schyssta-retry').click();
  await paired.page.getByRole('heading',{name:'Våra överenskommelser'}).waitFor();
   await paired.page.locator('.schyssta-extra-panel > summary').click();
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
  const acceptedSummary=paired.page.locator('#schyssta-rule-30000000-0000-4000-8000-000000000003 .schyssta-approved-details > summary');
  assert.equal(await review.locator('summary').isVisible(),false,'Review tools remain hidden until agreed rule is expanded');
  await acceptedSummary.click();
  await review.locator('summary').click();
  assert.match(await review.innerText(),/Vad har fungerat bra för oss/,'Guide uses open questions, not compliance points');
  // Secondary exports stay collapsed until intentionally requested, even after rerenders.
  const exportPanel=paired.page.locator('.schyssta-export-panel');
  assert.equal(await exportPanel.count(),1,'Agreed rules expose one optional export control');
  assert.equal(await exportPanel.evaluate(el=>el.open),false,'Copy/download tools start collapsed');
  assert.equal(await exportPanel.getByRole('button',{name:'Kopiera aktuella regler'}).isVisible(),false,
    'Copy does not compete visually with agreed rules before expansion');
  const openExport=async()=>{
    if(!(await exportPanel.evaluate(el=>el.open)))await exportPanel.locator('summary').click();
  };
  await paired.page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{
    writeText:async text=>{window.__HK_COPIED_RULES__=text;}
  }}));
  await openExport();
  await paired.page.getByRole('button',{name:'Kopiera aktuella regler'}).click();
  await paired.page.waitForFunction(()=>typeof window.__HK_COPIED_RULES__==='string');
  const exported=await paired.page.evaluate(()=>window.__HK_COPIED_RULES__);
  assert.match(exported,/Vi frågar innan vi lånar saker/,'Copy includes accepted rules');
  assert.doesNotMatch(exported,/Vi får pausa gräl|Vi pratar om hur vi delar på sysslorna/,'Copy excludes proposals without two approvals');
  // FUN-03 clipboard fallback: browser permissions may deny writeText.
  await paired.page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{
    writeText:async()=>{throw Error('Synthetic clipboard permission denied');}
  }}));
  await openExport();
  await paired.page.getByRole('button',{name:'Kopiera aktuella regler'}).click();
  const fallback=paired.page.locator('#schyssta-copy-fallback');
  await fallback.waitFor();
  assert.equal(await fallback.getAttribute('readonly'),'','Fallback is read-only');
  assert.match(await fallback.inputValue(),/Vi frågar innan vi lånar saker/);
  assert.doesNotMatch(await fallback.inputValue(),/Vi får pausa gräl|Vi pratar om hur vi delar på sysslorna/,
    'Manual fallback excludes unapproved proposals');
  assert.equal(await fallback.evaluate(el=>document.activeElement===el
    &&el.selectionStart===0&&el.selectionEnd===el.value.length),true,
    'Fallback text is focused and selected for manual copy');
  await fallback.press('ArrowRight');
  await paired.page.getByRole('button',{name:'Markera texten igen'}).click();
  assert.equal(await fallback.evaluate(el=>el.selectionStart===0&&el.selectionEnd===el.value.length),true,
    'Reselect button restores whole-text selection');
  await checkOverflow(paired.page,'FUN-03 clipboard failure fallback 390px');
  await capture(paired.page,'fun-03-clipboard-fallback-parent.png');
  await paired.page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{
    writeText:async text=>{window.__HK_RETRY_COPIED_RULES__=text;}
  }}));
  await openExport();
  await paired.page.getByRole('button',{name:'Kopiera aktuella regler'}).click();
  await paired.page.waitForFunction(()=>typeof window.__HK_RETRY_COPIED_RULES__==='string');
  assert.equal(await paired.page.locator('#schyssta-copy-fallback').count(),0,
    'Manual fallback disappears after successful clipboard retry');
  assert.match(await paired.page.locator('[data-schyssta-filter-group="approved"] .schyssta-feedback').innerText(),/kopierats/);
  const schysstaDownloadPromise=paired.page.waitForEvent('download');
  await openExport();
  await paired.page.getByRole('button',{name:'Ladda ner som textfil'}).click();
  const schysstaDownload=await schysstaDownloadPromise;
  assert.equal(schysstaDownload.suggestedFilename(),'schyssta-listan-overenskommelser.txt');
  const bytes=await fs.readFile(await schysstaDownload.path());
  assert.equal(bytes[0],0xef,'Downloaded Swedish UTF-8 text has BOM for spreadsheet/notepad compatibility');
  assert.equal(bytes[1],0xbb);
  assert.equal(bytes[2],0xbf);
  const text=bytes.toString('utf8');
  assert.match(text,/Våra gemensamma överenskommelser/);
  assert.match(text,/Vi frågar innan vi lånar saker/);
  assert.doesNotMatch(text,/Vi får pausa gräl|Vi pratar om hur vi delar på sysslorna/,'Unapproved proposals are excluded from local file');
  assert.doesNotMatch(text,/10000000-0000-0000-0000|synthetic@example.invalid|agreement_id|user_id/,'No IDs, emails or internal keys in file');

  assert.equal(await paired.page.locator('.schyssta-page-help button[data-schyssta-refresh]').count(),1,
    'A paired test user can explicitly reload the list through expandable help');
  assert.equal(await paired.page.locator('#live-mobile-nav a[href="#inkorg"] .live-nav-count').innerText(),'2','Inbox counts both one private chat message and one rule event');
  await paired.page.waitForFunction(()=>document.querySelector('#live-mobile-nav a[href="#regler"] .live-nav-count')?.textContent==='2',
    null,{timeout:8000});
  assert.equal(await paired.page.locator('#live-mobile-nav a[href="#regler"] .live-nav-count').textContent(),'2','Rule tab shows only requests awaiting the current viewer');
  assert.equal(await paired.page.locator('#live-mobile-nav details').count(),0,
    'All badges belong to their direct tabs; no More menu remains');
  assert.match(await paired.page.locator('#live-mobile-nav a[href="#regler"]').getAttribute('aria-label'),/2 obesvarade regelförslag/,'Navigation text announces the meaning of the count');
  // Search and status filters never hide incoming requests requiring the user's answer.
  await paired.page.locator('.schyssta-search-panel > summary').click();
  const search=paired.page.locator('#schyssta-search');
  await search.fill('LÅNAR');
  assert.equal(await paired.page.locator('[data-schyssta-filter-group="approved"] .schyssta-list>li:visible').count(),1,
    'Accent/case-aware local search includes the accepted rule');
  assert.equal(await paired.page.locator('[data-schyssta-filter-group="ongoing"] .schyssta-list>li:visible').count(),0,
    'Search hides unrelated ongoing proposals without altering server results');
  assert.equal(await paired.page.locator('#schyssta-rule-30000000-0000-4000-8000-000000000001').isVisible(),true,
    'Incoming action cards stay visible while the rules are filtered');
  assert.match(await paired.page.locator('#schyssta-filter-summary').innerText(),/Visar 1 av.*Förslag som behöver ditt svar visas separat/,'Search counts only filterable lists, not unfiltered pending decisions');
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
  assert.equal(await paired.page.locator('#live-mobile-nav a[href="#regler"] .live-nav-count').textContent(),'1',
    'Pausing a request decreases only the local pending-action count');
  assert.equal(await paired.page.evaluate(()=>window.__HK_SCHYSSTA_DECISION__?.args?.p_agreement_id==='30000000-0000-4000-8000-000000000001'),false,
    'Pausing does not send any approval or rejection decision');
  assert.match(await paired.page.locator('.schyssta-view').innerText(),/Inget beslut har sparats/);
  await paired.page.locator('[data-schyssta-resume="30000000-0000-4000-8000-000000000001"]').click();
  assert.equal(await paired.page.locator('#live-mobile-nav a[href="#regler"] .live-nav-count').textContent(),'2',
    'A deferred proposal can be returned to the actionable list without any backend change');
  await paired.page.getByRole('button',{name:'+ Föreslå en regel'}).click();
  const prompts=paired.page.locator('.schyssta-tips');
  assert.equal(await prompts.count(),1,'Composing a rule offers optional, collapsed conversation prompts');
  assert.equal(await prompts.locator('summary').innerText(),'Tips för en tydlig och rättvis överenskommelse');
  await prompts.locator('summary').click();
  assert.match(await prompts.innerText(),/Vuxnas ansvar för trygghet och omsorg/, 'Prompts retain parent responsibility');
  assert.equal(await prompts.getByRole('link',{name:'Läs guiden om att lyssna före förslag'}).count(),1,
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
  await paired.page.getByRole('heading',{name:/^Behöver ditt svar/}).locator('..').locator('#schyssta-rule-30000000-0000-4000-8000-000000000002').waitFor();
  assert.match(await paired.page.getByRole('heading',{name:/^Behöver ditt svar/}).innerText(),/\([2-9]\)/,
    'An own proposal with no decision joins the pending queue along with the incoming proposal');
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
  assert.equal(await paired.page.evaluate(()=>window.__HK_MARK_CHAT_READ__||0),0,'Opening the inbox must never create a read receipt');
  await paired.page.getByRole('button',{name:'Markera alla meddelanden som lästa'}).waitFor();
  assert.match(await paired.page.locator('.family-chat-read-controls').innerText(),/De markeras inte som lästa bara för att du öppnar inkorgen/);
  await paired.page.evaluate(()=>{window.__HK_MARK_READ_FAIL__=true;});
  await paired.page.getByRole('button',{name:'Markera alla meddelanden som lästa'}).click();
  await paired.page.getByText(/Inga läskvittenser har bekräftats/).waitFor();
  assert.equal(await paired.page.evaluate(()=>window.__HK_MARK_CHAT_READ__||0),0,'A failed mark-all must not invent a read receipt');
  assert.equal(await paired.page.getByRole('button',{name:'Markera alla meddelanden som lästa'}).count(),1,'Read retry remains possible');
  await paired.page.evaluate(()=>{window.__HK_MARK_READ_FAIL__=false;});
  await paired.page.getByRole('button',{name:'Markera alla meddelanden som lästa'}).click();
  await paired.page.waitForFunction(()=>window.__HK_MARK_CHAT_READ__>0);
  await paired.page.getByText('Alla meddelanden har markerats som lästa.').waitFor();
  assert.equal(await paired.page.getByRole('button',{name:'Markera alla meddelanden som lästa'}).count(),0,'Acknowledged read receipt clears the action');
  await paired.page.locator('#family-chat-body').fill('Hej tillbaka! Vi kan prata efter maten.');
  await paired.page.getByRole('button',{name:'Skicka meddelande'}).click();
  await paired.page.waitForFunction(()=>window.__HK_CHAT_SEND__?.args?.p_body==='Hej tillbaka! Vi kan prata efter maten.');
  assert.match(await paired.page.locator('.family-chat-mine').innerText(),/Hej tillbaka/,'Sent message appears in conversation');
  assert.match(await paired.page.locator('.family-chat-mine .family-chat-receipt').innerText(),/Skickat/,'Read receipt distinguishes sent from read');
  await paired.page.locator('.family-chat .schyssta-feedback').getByText('Meddelandet har skickats.',{exact:true}).waitFor();
  assert.equal(await paired.page.locator('#family-chat-body').inputValue(),'','Successful send clears composer');
  await paired.page.locator('#family-chat-body').fill('<img src=x onerror=alert(1)>');
  await paired.page.getByRole('button',{name:'Skicka meddelande'}).click();
  await paired.page.locator('.family-chat-mine').filter({hasText:'<img src=x onerror=alert(1)>'}).waitFor();
  assert.equal(await paired.page.locator('.family-chat-text img').count(),0,'Message content never runs HTML');
  // A manual refresh after the thread has loaded must not clear its height
  // and reset mobile scroll. The same protection covers background polling.
  const refreshChat=paired.page.locator('[data-family-chat-refresh]');
  await refreshChat.scrollIntoViewIfNeeded();
  const scrollBefore=await paired.page.locator('.live-main').evaluate(el=>el.scrollTop);
  const fetchCount=await paired.page.evaluate(()=>window.__HK_CHAT_FETCHES__||0);
  await refreshChat.click();
  await paired.page.waitForFunction(n=>(window.__HK_CHAT_FETCHES__||0)>n,fetchCount);
  await paired.page.waitForTimeout(120);
  const scrollAfter=await paired.page.locator('.live-main').evaluate(el=>el.scrollTop);
  assert.ok(Math.abs(scrollAfter-scrollBefore)<=9,'Inbox refresh preserves mobile scroll position; before '+scrollBefore+', after '+scrollAfter);
  assert.match(await paired.page.locator('.family-chat-history').innerText(),/Hej tillbaka/,'Message history remains intact after refresh');
  assert.equal(await paired.page.locator('.family-chat .schyssta-feedback').count(),0,
    'A deliberate inbox refresh clears the previous send confirmation');

  const inboxText=await paired.page.locator('#live-app').innerText();
  assert.match(inboxText,/Vi pratar om hur vi delar på sysslorna/,'Inbox shows other member pending manual request');
  assert.match(inboxText,/Vi planerar veckans sysslor på söndag/,'An unanswered own proposal also needs a decision and is listed among pending requests');
  assert.doesNotMatch((await paired.page.locator('.schyssta-unread').allInnerTexts()).join(' '),/Vi planerar veckans sysslor på söndag/,'An own pending proposal is not misrepresented as an unread incoming notification');
  assert.match(inboxText,/Händelser från Schyssta listan · 1 olästa/,'Server inbox shows persisted unread count');
  assert.equal(await paired.page.locator('.schyssta-unread time[datetime]').count(),1,'Notifications display a timestamp from the server');
  assert.match(await paired.page.locator('.schyssta-unread').innerText(),/Från: Provtonåring/,'Inbox identifies only the authorized counterpart');
  // The home screen surfaces the latest personal inbox alert ahead of general family information.
  await paired.page.goto(base+'#hem',{waitUntil:'load'});
  await paired.page.getByRole('heading',{name:'Inkorgen · 1 olästa'}).waitFor();
  assert.ok(await paired.page.locator('#live-app').evaluate(el=>{
    const actions=el.querySelector('.home-next-actions'),hero=el.querySelector('.home-hero');
    return !!actions&&!!hero&&!!(actions.compareDocumentPosition(hero)&Node.DOCUMENT_POSITION_FOLLOWING);
  }),'NOT-02: unread notices and pending decisions appear before the welcome hero');
  const homeSections=await paired.page.locator('#live-app h2').allTextContents();
  assert.ok(homeSections.findIndex(t=>t.startsWith('Inkorgen'))<homeSections.indexOf('Din familj'),
    'Personal inbox alerts are placed above the family overview');
  await paired.page.getByRole('link',{name:'Visa inkorgen'}).click();
  await paired.page.getByRole('heading',{name:'Inkorg',exact:true}).waitFor();
  await paired.page.getByRole('button',{name:'Markera som läst'}).click();
  await paired.page.waitForFunction(()=>window.__HK_READ_NOTICE__?.args?.p_notification_id==='40000000-0000-4000-8000-000000000001');
  await paired.page.waitForFunction(()=>document.querySelector('#live-app')?.textContent?.includes('Händelser från Schyssta listan'));
  assert.equal(await paired.page.getByRole('button',{name:'Markera som läst'}).count(),0,'Read receipt removes unread action without approving the rule');
  // FBK-02-04: a confirmed rule-notification read receipt must also clear
  // both navigation badges, not merely hide the button in the inbox.
  await paired.page.waitForFunction(()=>!document.querySelector('#live-mobile-nav a[href="#inkorg"] .live-nav-count'));
  assert.equal(await paired.page.locator('#live-desktop-nav a[href="#inkorg"] .live-nav-count').count(),0,
    'FBK-02-04: desktop inbox badge clears with the confirmed receipt');
  assert.equal(await paired.page.locator('#live-mobile-nav a[href="#inkorg"] .live-nav-count').count(),0,
    'FBK-02-04: mobile bottom navigation badge clears with the confirmed receipt');
  // The generic inbox fixture lives in the page and resets on reload.
  // Persistence across reload is covered below by the shared two-role fixture.

  await paired.page.getByRole('button',{name:'Se och svara i Schyssta listan'}).first().click();
  await paired.page.getByRole('heading',{name:'Schyssta listan'}).waitFor();
  await paired.page.locator('#schyssta-rule-30000000-0000-4000-8000-000000000001').waitFor();
  const loadedRuleHeading=await paired.page.getByRole('heading',{name:/^Behöver ditt svar/}).innerText();
  const loadedRuleCount=Number(loadedRuleHeading.match(/\((\d+)\)/)?.[1]||0);
  await paired.page.goto(base+'#hem',{waitUntil:'load'});
  await paired.page.getByRole('heading',{name:/^Hej /}).waitFor();
  await paired.page.waitForFunction(()=>!document.querySelector('#live-app')?.textContent?.includes('Kontrollerar väntande regelförslag'));
  const loadedHomeHeadings=await paired.page.getByRole('heading',{name:/^Behöver ditt svar/}).allTextContents();
  const loadedHomeCount=Number(loadedHomeHeadings[0]?.match(/(\d+) förslag/)?.[1]||0);
  assert.equal(loadedHomeCount,loadedRuleCount,'NOT-02: home and Schyssta rule view have the same pending count');
  const loadedNavCount=await paired.page.locator('#live-mobile-nav a[href="#regler"] .live-nav-count').textContent();
  assert.equal(Number(loadedNavCount),loadedRuleCount,'NOT-02: mobile rule badge agrees with both views');
  await paired.page.goto(base+'#regler',{waitUntil:'load'});
  await paired.page.locator('#schyssta-rule-30000000-0000-4000-8000-000000000001').waitFor();
  await checkOverflow(paired.page,'Mobile Schyssta listan');
  const schysstaOrder=await paired.page.locator('.schyssta-view').evaluate(root=>{
    const heading=root.querySelector('.schyssta-page-intro h1');
    const pending=[...root.querySelectorAll('h2')].find(el=>el.textContent?.startsWith('Behöver ditt svar'));
    const help=root.querySelector('.schyssta-page-help');
    const h=heading?.getBoundingClientRect(),p=pending?.getBoundingClientRect();
    return {headingSize:h?.height,pendingBeforeHelp:!!pending&&!!help&&!!(pending.compareDocumentPosition(help)&Node.DOCUMENT_POSITION_FOLLOWING),
      helpClosed:help?.open===false,headingText:heading?.textContent};
  });
  assert.equal(schysstaOrder.headingText,'Schyssta listan');
  assert.ok(schysstaOrder.headingSize<75,'UX-04: compact Schyssta mobile title');
  assert.ok(schysstaOrder.pendingBeforeHelp&&schysstaOrder.helpClosed,'UX-04: decisions precede optional help');
  const quickState=paired.page.locator('.schyssta-quick-actions');
  const approvedCount=await paired.page.locator('[data-schyssta-filter-group="approved"] .schyssta-list li').count();
  assert.equal(await quickState.evaluate(el=>el.classList.contains('schyssta-quick-actions--secondary')),approvedCount>0,
    'UX-SL-02: secondary styling applies exactly when approved agreements exist');
  if(approvedCount>0){
    const subduedStyles=await quickState.evaluate(el=>({background:getComputedStyle(el).backgroundColor,shadow:getComputedStyle(el).boxShadow}));
    assert.equal(subduedStyles.background,'rgba(0, 0, 0, 0)',
      'UX-SL-02: secondary action panel has no competing filled background');
    assert.equal(subduedStyles.shadow,'none',
      'UX-SL-02: secondary action panel has no competing shadow');
  }
  assert.equal(await quickState.locator('[data-schyssta-start]').evaluate(el=>getComputedStyle(el).minHeight), '44px',
    'UX-SL-02: compact secondary action keeps its touch-sized minimum height');
  assert.equal(await quickState.locator('strong').innerText(),loadedRuleCount+' förslag behöver ditt svar',
    'SL-UX-01: first-screen status equals the server-validated pending count');
  assert.equal(await quickState.locator('[data-schyssta-start]').isVisible(),true,
    'SL-UX-01: proposing a rule does not require opening the help panel');
  const quickLayout=await paired.page.locator('.schyssta-view').evaluate(root=>{
    const overview=root.querySelector('.schyssta-quick-actions');
    const pending=[...root.querySelectorAll('h2')].find(x=>x.textContent.startsWith('Behöver ditt svar'));
    const help=root.querySelector('.schyssta-page-help');
    const button=overview?.querySelector('button');
    return {abovePending:overview?.compareDocumentPosition(pending)&Node.DOCUMENT_POSITION_FOLLOWING,
      aboveHelp:overview?.compareDocumentPosition(help)&Node.DOCUMENT_POSITION_FOLLOWING,
      buttonHeight:button?.getBoundingClientRect().height,
      overflow:root.scrollWidth>root.clientWidth+1};
  });
  assert.ok(quickLayout.abovePending&&quickLayout.aboveHelp,'Action overview is before the rule list and guidance');
  assert.ok(quickLayout.buttonHeight>=44&&!quickLayout.overflow,'Primary action stays touch-sized without horizontal overflow');

  await paired.page.locator('.schyssta-page-help summary').click();
  assert.equal(await paired.page.getByRole('button',{name:'Uppdatera listan'}).isVisible(),true,
    'UX-04: refresh remains available after expanding the help');
  await capture(paired.page,'mobile-schyssta-list.png');
  await paired.page.goto(base+'#swipe',{waitUntil:'load'});
  await paired.page.locator('.swipe-secondary-results').waitFor();
  await revealSwipeSecondary(paired.page);
  await paired.page.evaluate(()=>{window.__HK_RPC_UNAVAILABLE__=true;});
  await paired.page.getByRole("button",{name:"Uppdatera gemensamma svar"}).click();
  await paired.page.locator(".swipe-results [role='alert']").waitFor();
  assert.equal(await paired.page.locator(".swipe-results .swipe-match-list li").count(),0,"RPC failure must clear previous matches");
  await paired.context.close();
  // SEC-02: a stale rule card may be visible just before a remote unpair.
  // A deliberate approval must verify both identities and the pair epoch,
  // fail closed, and never send a write for the former family.
  const revokedRules=await freshContext(
    {viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},
    {authenticated:true,paired:true}
  );
  await revokedRules.page.goto(base+'#regler',{waitUntil:'load'});
  await revokedRules.page.getByRole('heading',{name:'Kunde inte visa listan'}).waitFor();
  await revokedRules.page.evaluate(()=>{window.__HK_SCHYSSTA_CLEAN_RPC__=true;});
  await revokedRules.page.locator('#schyssta-retry').click();
  const oldRule=revokedRules.page.locator('#schyssta-rule-30000000-0000-4000-8000-000000000001');
  await oldRule.waitFor();
  await revokedRules.page.evaluate(()=>{window.__HK_TEST_PAIRED__=false;});
  await oldRule.locator('[data-schyssta-decision][data-approved="true"]').click();
  await revokedRules.page.waitForFunction(()=>
    !document.querySelector('#schyssta-rule-30000000-0000-4000-8000-000000000001'));
  assert.equal(await revokedRules.page.evaluate(()=>window.__HK_SCHYSSTA_DECISION__??null),null,
    'SEC-02: revoked family cannot issue a stale rule approval from its previous UI');
  await revokedRules.context.close();
  const freshRules=await freshContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},{authenticated:true,paired:true,emptySchyssta:true});
  await freshRules.page.goto(base+'#regler',{waitUntil:'load'});
  await freshRules.page.getByRole('heading',{name:'Kom igång tillsammans'}).waitFor();
  assert.match(await freshRules.page.locator('.schyssta-view').innerText(),/Ni har inte gjort någon gemensam överenskommelse än/,'Empty paired family has useful onboarding rather than sample data');
  assert.equal(await freshRules.page.locator('.schyssta-quick-actions strong').innerText(),'Inget väntar just nu',
    'SL-UX-01: an empty authorized snapshot has a truthful primary status');
  assert.match(await freshRules.page.locator('.schyssta-quick-counts').innerText(),/0 gemensamma överenskommelser.*0 andra förslag.*0 avslutade regler/,
    'SL-UX-01: counts do not invent rules or propose implicit agreements');

  assert.equal(await freshRules.page.locator('.schyssta-view .schyssta-list li').count(),0,'Empty family does not show invented rules');
  await freshRules.page.locator('[data-schyssta-start]').click();
  await freshRules.page.locator('#schyssta-body').waitFor();
  assert.ok(await freshRules.page.locator('#schyssta-body').evaluate(el=>document.activeElement===el),'Start action moves focus into the editor');
  await freshRules.page.locator('#schyssta-body').fill('<img src=x onerror=alert(1)>');
  assert.equal(await freshRules.page.locator('#schyssta-preview-text').innerText(),'<img src=x onerror=alert(1)>','Preview renders user input as literal text');
  assert.equal(await freshRules.page.locator('#schyssta-preview-text img').count(),0,'Manual proposal preview never interprets HTML');
  await freshRules.page.locator('[data-schyssta-compose-jump]').click();
  assert.equal(await freshRules.page.locator('#schyssta-body').inputValue(),'<img src=x onerror=alert(1)>',
    'SL-UX-01: returning to a draft cannot erase unsent private text');
  assert.ok(await freshRules.page.locator('#schyssta-body').evaluate(el=>document.activeElement===el),
    'SL-UX-01: primary button moves focus back to the existing draft');
  assert.equal(await freshRules.page.locator('.schyssta-quick-actions [data-schyssta-start]').count(),0,
    'SL-UX-01: opening a draft replaces rather than duplicates the create action');

  await freshRules.context.close();
  const teenInbox=await freshContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},{authenticated:true,paired:true,role:'teen'});
  await teenInbox.page.goto(base+'#inkorg',{waitUntil:'load'});
  await teenInbox.page.getByRole('heading',{name:'Privata meddelanden med Provförälder'}).waitFor();
  await teenInbox.page.locator('#family-chat-body').fill('Hej från tonåringen');
  await teenInbox.page.locator('#family-chat-form').evaluate(form=>form.requestSubmit());
  await teenInbox.page.waitForFunction(()=>window.__HK_CHAT_SEND__?.args?.p_body==='Hej från tonåringen');
  assert.match(await teenInbox.page.locator('.family-chat-mine').innerText(),/Hej från tonåringen/,'Teen can send from their own paired account');
  await checkOverflow(teenInbox.page,'Private message inbox on teen mobile view');
  await teenInbox.context.close();
  // Live server pair membership might change in another tab before the next poll.
  // A deliberate send must perform a fresh pair check and clear stale private UI.
  const sendRevoked=await freshContext(
    {viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},
    {authenticated:true,paired:true}
  );
  await sendRevoked.page.goto(base+'#inkorg',{waitUntil:'load'});
  await sendRevoked.page.locator('#family-chat-body').fill('Text som inte får skickas efter avparning');
  await sendRevoked.page.evaluate(()=>{window.__HK_TEST_PAIRED__=false;});
  await sendRevoked.page.locator('#family-chat-form').evaluate(form=>form.requestSubmit());
  await sendRevoked.page.getByRole('heading',{name:'Para ihop era konton'}).waitFor();
  assert.equal(await sendRevoked.page.evaluate(()=>window.__HK_CHAT_SEND__??null),null,
    'Revoked pairing must never invoke private send RPC from the old conversation');
  assert.equal(await sendRevoked.page.locator('.family-chat-bubble').count(),0,
    'Revoked pairing must clear old private messages');
  assert.equal(await sendRevoked.page.locator('#family-chat-body').count(),0,
    'Revoked pairing must hide previous draft and composer');
  await sendRevoked.context.close();

  // Deliberate mark-all must not acknowledge incoming messages after unpairing.
  const readRevoked=await freshContext(
    {viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},
    {authenticated:true,paired:true}
  );
  await readRevoked.page.goto(base+'#inkorg',{waitUntil:'load'});
  await readRevoked.page.getByRole('button',{name:'Markera alla meddelanden som lästa'}).waitFor();
  await readRevoked.page.evaluate(()=>{window.__HK_TEST_PAIRED__=false;});
  await readRevoked.page.getByRole('button',{name:'Markera alla meddelanden som lästa'}).click();
  await readRevoked.page.getByRole('heading',{name:'Para ihop era konton'}).waitFor();
  assert.equal(await readRevoked.page.evaluate(()=>window.__HK_MARK_CHAT_READ__||0),0,
    'Revoked pairing cannot invoke read-receipt RPC');
  assert.equal(await readRevoked.page.locator('.family-chat-bubble').count(),0,
    'Revoked pairing hides previously loaded private text');
  await readRevoked.context.close();

  const unpairedInbox=await freshContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},{authenticated:true,paired:false});
  await unpairedInbox.page.goto(base+'#inkorg',{waitUntil:'load'});
  await unpairedInbox.page.getByRole('heading',{name:'Para ihop era konton'}).waitFor();
  assert.equal(await unpairedInbox.page.locator('#family-chat-body').count(),0,'Unpaired users cannot compose messages');
  await unpairedInbox.context.close();
  const pairedTeen=await freshContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},{authenticated:true,paired:true,role:"teen"});
  await pairedTeen.page.goto(base+"#swipe",{waitUntil:"load"});
  await pairedTeen.page.locator('.swipe-secondary-results').waitFor();
  await revealSwipeSecondary(pairedTeen.page);
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
  // VIS-00-04: exporting is optional, not a screenful before the first card.
  await unlocked.page.locator('.live-main').evaluate(el=>{el.scrollTop=0;});
  assert.equal(await unlocked.page.locator('.swipe-theme-play > .swipe-heading #swipe-export-private').count(),0,
    'Theme export no longer dominates the card intro');
  assert.equal(await unlocked.page.locator('.swipe-theme-play > .swipe-private-export').count(),1,
    'Private export remains accessible below the active theme card');
  assert.equal(await unlocked.page.locator('.swipe-theme-play > .swipe-unified-overview + .swipe-private-export').count(),1,
    'Shared all-deck results come before private export within a theme');
  const themeCardRect=await unlocked.page.locator('#swipe-card').boundingBox();
  const themeNavRect=await unlocked.page.locator('#live-mobile-nav').boundingBox();
  assert.ok(themeCardRect && themeNavRect && themeCardRect.y + 100 < themeNavRect.y,
    'The first theme card starts visibly above the mobile navigation');
  // VIS-00-05: on 390px and 320px phones a real Ja/Nej button can be
  // reached without scrolling past a full-screen introduction.
  const categoryDisclosure=unlocked.page.locator('.swipe-theme-play .swipe-category-filter');
  assert.equal(await categoryDisclosure.count(),1,'Large theme decks have a discoverable category disclosure');
  assert.equal(await categoryDisclosure.evaluate(el=>el.open),false,
    'The category chooser starts collapsed on mobile so the first question appears sooner');
  assert.match(await categoryDisclosure.locator('summary').innerText(),/Välj kategori: Alla kategorier/,
    'The collapsed chooser still names the current category');
  const themeActions=await unlocked.page.locator('.swipe-actions').boundingBox();
  assert.ok(themeActions&&themeActions.y < themeNavRect.y+140,
    '390px theme-choice row should start near the first viewport');
  await unlocked.page.setViewportSize({width:320,height:700});
  await unlocked.page.locator('.live-main').evaluate(el=>{el.scrollTop=0;});
  const narrowActions=await unlocked.page.locator('.swipe-actions').boundingBox();
  const narrowNav=await unlocked.page.locator('#live-mobile-nav').boundingBox();
  // VIS-00-13: category and deck titles were displayed three times on 320px.
  // Only the redundant badge disappears; a distinct subcategory remains labelled.
  assert.equal(await unlocked.page.locator('.swipe-theme-play .swipe-stage-top > span:first-child').isVisible(),false,
    'Narrow theme cards do not repeat the deck title in the progress row');
  assert.equal(await unlocked.page.locator('.swipe-theme-play .swipe-playing-card .swipe-category-duplicate').isVisible(),false,
    'Narrow theme cards do not repeat the same category in the question');
  assert.match(await unlocked.page.locator('.swipe-theme-play>.swipe-heading>p').innerText(),/privata.*inga överenskommelser/,
    'Shortened intro still explains private answers and non-binding cards');
  const narrowRange=await unlocked.page.locator('.swipe-theme-play [data-importance]').boundingBox();
  const narrowButtons=await unlocked.page.locator('.swipe-theme-play .swipe-choice').all();
  assert.ok(narrowRange&&narrowRange.width>=140&&narrowRange.height>=24,
    'The private importance control remains usable in the narrow card');
  for(const button of narrowButtons){const rect=await button.boundingBox();assert.ok(rect&&rect.height>=44&&rect.width>=105,
    'Ja/Nej retains at least a 44px high, 105px wide touch target');}
  assert.ok(narrowActions&&narrowNav&&narrowActions.y<narrowNav.y+130,
    'Deduplicated narrow theme cards reduce scrolling to Ja/Nej: '+JSON.stringify({actions:narrowActions,nav:narrowNav}));
  const compactBack=unlocked.page.locator('.swipe-theme-back');
  const compactBackStyle=await compactBack.evaluate(el=>({
    height:el.getBoundingClientRect().height,
    background:getComputedStyle(el).backgroundColor,
    color:getComputedStyle(el).color,
    decoration:getComputedStyle(el).textDecorationLine
  }));
  assert.ok(compactBackStyle.height>=44&&compactBackStyle.height<=50,
    '320px theme back navigation retains an accessible 44px target without a tall primary button: '+JSON.stringify(compactBackStyle));
  assert.match(compactBackStyle.decoration,/underline/,
    'Compact theme back control remains visibly identifiable as navigation');
  assert.equal(await unlocked.page.locator('.swipe-theme-play>.swipe-heading>.swipe-eyebrow').isVisible(),false,
    'The redundant theme eyebrow is removed on phones; the heading and privacy explanation remain visible');
  assert.ok(narrowActions&&narrowNav&&narrowActions.y+narrowActions.height<=narrowNav.y-4,
    '320x700px theme Ja/Nej must be fully above the fixed bottom navigation, without scrolling: '+
      JSON.stringify({actions:narrowActions,nav:narrowNav}));
  assert.equal(await unlocked.page.locator('.swipe-theme-play .swipe-importance-status-idle').count(),1,
    'The idle private-save explanation is kept in the DOM');
  const ratingAccessibility=await unlocked.page.locator('.swipe-theme-play [data-importance]').evaluate(el=>({
    hasName:!!el.labels?.length,visible:getComputedStyle(el).display!=='none'
  }));
  assert.ok(ratingAccessibility.hasName&&ratingAccessibility.visible,
    'Importance slider is still labelled and rendered on compact themes');
  await capture(unlocked.page,'mobile-320-theme-choices-compact.png');
  await unlocked.page.setViewportSize({width:390,height:844});
  await unlocked.page.locator('.live-main').evaluate(el=>{el.scrollTop=0;});
  await capture(unlocked.page,'mobile-theme-first-card-top.png');
  const categoryFilter=unlocked.page.getByLabel('Välj kategori');
  assert.equal(await categoryFilter.count(),1,'Large theme decks expose one labelled category filter');
  assert.equal(await categoryDisclosure.evaluate(el=>el.open),false,
    'A resize between phone widths does not unexpectedly expand a secondary control');
  await categoryDisclosure.locator('summary').click();
  assert.ok(await categoryFilter.isEnabled(),'Category filter is keyboard reachable after expansion');
  await categoryFilter.selectOption({label:'Framtid och möjligheter (8)'});
  await unlocked.page.locator("#swipe-card[aria-label*='i Framtid och möjligheter']").waitFor();
  assert.equal(await categoryDisclosure.evaluate(el=>el.open),true,
    'Choosing a category must not collapse the control during a rerender');
  assert.equal(await categoryFilter.evaluate(el=>document.activeElement===el),true,
    'After choosing a category the keyboard focus remains on its selector');
  assert.match(await categoryDisclosure.locator('summary').innerText(),/Framtid och möjligheter/,
    'The current category is stated even when the filter is collapsed');
  assert.match(await unlocked.page.locator('#theme-category-status').innerText(),/^0 av 8 kort sparade i Framtid och möjligheter\.$/,'Filter reports only the signed-in user’s private progress for the selected category');
  assert.match(await unlocked.page.locator('#swipe-card').innerText(),/Prata om en plats vi vill besöka någon gång/,'Filter starts at the first unanswered card in the selected category');
  await unlocked.page.locator('.swipe-category-filter').scrollIntoViewIfNeeded();
  await capture(unlocked.page,'mobile-theme-category-filter.png');
  await categoryFilter.selectOption('all');
  await unlocked.page.locator("#swipe-card[aria-label^='Temakort 1 av 104']").waitFor();
  await unlocked.page.locator("#swipe-card").scrollIntoViewIfNeeded();
  await capture(unlocked.page,"mobile-theme-card.png");
  assert.match(await unlocked.page.locator("#swipe-card").innerText(),/Vad som varit roligt den senaste veckan/);
  await unlocked.page.locator('.swipe-secondary-results').waitFor();
  await revealSwipeSecondary(unlocked.page);
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
  await unlocked.page.waitForFunction(()=>document.activeElement?.id==='swipe-card');
  const nextTheme=await unlocked.page.locator('#swipe-card').boundingBox();
  const nextThemeNav=await unlocked.page.locator('#live-mobile-nav').boundingBox();
  await capture(unlocked.page,'mobile-theme-next-card-focus.png');
  assert.ok(nextTheme && nextThemeNav && nextTheme.y >= -2 && nextTheme.y+80 < nextThemeNav.y,
    'Confirmed theme response focuses the next card and reveals its question: '+
      JSON.stringify({card:nextTheme,nav:nextThemeNav,scroll:await unlocked.page.locator('.live-main').evaluate(el=>({top:el.scrollTop,height:el.clientHeight}))}));
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

  // FUN-02: a genuine Chromium rerender after a mocked background match
  // refresh must not displace the teen's keyboard from the category picker.
  const filterRefresh=await freshContext(
    {viewport:{width:320,height:700},deviceScaleFactor:2,isMobile:true,hasTouch:true},
    {authenticated:true,paired:true,unlocked:true,role:'teen'});
  await filterRefresh.page.goto(base+'#swipe',{waitUntil:'load'});
  await filterRefresh.page.locator('[data-theme-open="samtal"]').click();
  await filterRefresh.page.locator('#swipe-card').waitFor();
  await filterRefresh.page.waitForFunction(()=>
    document.querySelector('.swipe-results')?.textContent?.includes('Vad som varit roligt den senaste veckan'));
  await filterRefresh.page.locator('.swipe-category-filter summary').click();
  await filterRefresh.page.locator('#theme-category').focus();
  const pollBaseline=await filterRefresh.page.evaluate(()=>{
    document.querySelector('.live-main').scrollTop=60;
    const select=document.querySelector('#theme-category');
    select.focus({preventScroll:true});
    window.__HK_FILTER_OLD_NODE__=select;
    const before={scroll:document.querySelector('.live-main').scrollTop,
      calls:window.__HK_MATCH_RPC_CALLS__||0,selected:select.value};
    window.__HK_TEST_SHARED_MATCHES__=[];
    window.__HK_TEST_FILTER_MIN_CALLS__=before.calls;
    window.dispatchEvent(new Event('focus'));
    return before;
  });
  await filterRefresh.page.waitForFunction(()=>
    (window.__HK_MATCH_RPC_CALLS__||0)>window.__HK_TEST_FILTER_MIN_CALLS__ &&
    document.querySelector('#theme-category')!==window.__HK_FILTER_OLD_NODE__,
    null,{timeout:10000});
  const refreshFocusState=await filterRefresh.page.evaluate(()=>({
    active:document.activeElement?.id,
    open:document.querySelector('.swipe-category-filter')?.open,
    selected:document.querySelector('#theme-category')?.value,
    scroll:document.querySelector('.live-main')?.scrollTop
  }));
  assert.equal(refreshFocusState.active,'theme-category',
    'FUN-02: background refresh preserves keyboard focus on the theme category selector');
  assert.equal(refreshFocusState.open,true,
    'FUN-02: background refresh keeps the category selector expanded');
  assert.equal(refreshFocusState.selected,pollBaseline.selected,
    'FUN-02: background refresh must not change the selected category');
  assert.ok(Math.abs(refreshFocusState.scroll-pollBaseline.scroll)<=3,
    'FUN-02: background refresh should not jump the mobile scroller: '+
      JSON.stringify({pollBaseline,refreshFocusState}));
  await filterRefresh.context.close();

  // Separate browser context: this correction scenario must not mutate the
  // saved-answer fixture used by the existing swipe progression tests.
  const savedReview=await freshContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},
    {authenticated:true,paired:true,unlocked:true});
  await savedReview.page.goto(base+'#swipe',{waitUntil:'load'});
  await savedReview.page.locator('[data-theme-open="samtal"]').click();
  await savedReview.page.locator('#swipe-card').waitFor();
  assert.equal(await savedReview.page.locator('.swipe-private-review').count(),0,'An empty personal history is not rendered');
  await savedReview.page.locator('[data-swipe="yes"]').click();
  await savedReview.page.locator('.swipe-private-review summary').waitFor();
  await savedReview.page.locator('.swipe-private-review summary').click();
  assert.match(await savedReview.page.locator('.swipe-private-review').innerText(),/Ditt svar: Ja/);
  assert.equal(await savedReview.page.locator('.swipe-private-review [data-theme-review-index]').count(),1);
  const privateAnswerSearch=savedReview.page.locator('#private-theme-review-search');
  const privateAnswerFilter=savedReview.page.locator('#private-theme-review-answer');
  await privateAnswerSearch.fill('veckan');
  assert.equal(await savedReview.page.locator('.swipe-private-review [data-private-theme-answer]:visible').count(),1,
    'Private search finds its saved card text');
  await privateAnswerSearch.fill('inget-kort-har-detta-ord');
  assert.equal(await savedReview.page.locator('.swipe-private-review [data-private-theme-answer]:visible').count(),0,
    'Unknown search cannot create new private results');
  await savedReview.page.locator('#private-theme-review-empty:visible').waitFor();
  assert.match(await savedReview.page.locator('#private-theme-review-count').innerText(),/Visar 0 av 1/);
  await privateAnswerFilter.selectOption('no');
  await savedReview.page.getByRole('button',{name:'Rensa sökning och filter'}).click();
  assert.equal(await privateAnswerSearch.inputValue(),'','Reset clears private text search');
  assert.equal(await privateAnswerFilter.inputValue(),'all','Reset restores all-answer filter');
  assert.equal(await savedReview.page.locator('.swipe-private-review [data-private-theme-answer]:visible').count(),1,
    'Reset reveals own saved answers without changing the stored answer');
  assert.equal(await privateAnswerSearch.evaluate(el=>document.activeElement===el),true,
    'Reset returns keyboard focus to private search');
  await privateAnswerSearch.fill('');
  await privateAnswerFilter.selectOption('no');
  assert.equal(await savedReview.page.locator('.swipe-private-review [data-private-theme-answer]:visible').count(),0,
    'No-only filter hides the current yes answer');
  await privateAnswerFilter.selectOption('yes');
  assert.equal(await savedReview.page.locator('.swipe-private-review [data-private-theme-answer]:visible').count(),1);
  await privateAnswerFilter.selectOption('all');
  await privateAnswerSearch.fill('veckan');
  await savedReview.page.locator('.swipe-private-review [data-theme-review-index="0"]').click();
  assert.match(await savedReview.page.locator('#swipe-card').innerText(),/Vad som varit roligt den senaste veckan/,
    'A saved theme answer can be opened directly without swiping past 100 cards');
  assert.equal(await savedReview.page.locator('#swipe-card').evaluate(el=>document.activeElement===el),true,
    'Focus moves to the selected saved card');
  await savedReview.page.locator('#theme-review-back').click();
  await savedReview.page.waitForFunction(()=>document.activeElement?.matches('[data-theme-review-index="0"]'));
  assert.equal(await savedReview.page.locator('#private-theme-review-search').inputValue(),'veckan',
    'Cancel returns to the search without changing stored answers');
  assert.equal(await savedReview.page.locator('.swipe-private-review [data-theme-review-index="0"]').locator('..').getAttribute('data-private-theme-answer'),'yes');
  await savedReview.page.locator('.swipe-private-review [data-theme-review-index="0"]').click();
  await savedReview.page.locator('[data-swipe="no"]').click();
  await savedReview.page.waitForFunction(()=>document.activeElement?.matches('[data-theme-review-index="0"]'));
  assert.equal(await savedReview.page.locator('.swipe-private-review details').evaluate(el=>el.open),true,
    'Saved answer review stays open after correction');
  assert.equal(await savedReview.page.locator('#private-theme-review-search').inputValue(),'veckan');
  assert.match(await savedReview.page.locator('.swipe-private-review').innerText(),/Ditt svar: Nej/,
    'The private review reflects the updated answer');
  await savedReview.page.locator('#private-theme-review-answer').selectOption('no');
  assert.equal(await savedReview.page.locator('.swipe-private-review [data-private-theme-answer]:visible').count(),1,
    'After correction, the saved NO is found by the private filter');
  await checkOverflow(savedReview.page,'Private saved-answer review 390px');
  await savedReview.page.locator('.swipe-private-review').scrollIntoViewIfNeeded();
  await capture(savedReview.page,'mobile-theme-private-answer-review.png');

  await savedReview.context.close();
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
  await desktopInsights.page.getByRole('heading',{name:'Våra överenskommelser'}).waitFor();
  await checkOverflow(desktopInsights.page,'Desktop Schyssta listan');
  await capture(desktopInsights.page,'desktop-schyssta-list.png');
  await desktopInsights.context.close();
  // AI-01G: simulate the real page event handler and verify the outgoing opt-out,
  // not just the isolated component method. All data are synthetic.
  const mediatorMobile=await freshContext(
    {viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},
    {authenticated:true,paired:true,aiMediator:true}
  );
  await mediatorMobile.page.goto(base+'#medlare',{waitUntil:'load'});
  const contextCheckbox=mediatorMobile.page.locator('#mediator-use-context');
  await contextCheckbox.waitFor();
  assert.equal(await contextCheckbox.isChecked(),true,'Context defaults on for internal test accounts');
  await contextCheckbox.uncheck();
  assert.equal(await contextCheckbox.isChecked(),false,'Checkbox changes the actual page state');
  assert.match(await mediatorMobile.page.locator('.mediator-context').innerText(),/Avstängt/);
  assert.equal(await mediatorMobile.page.locator('#mediator-refresh-context').count(),0);
  await checkOverflow(mediatorMobile.page,'Mobile AI project-context opt-out');
  await capture(mediatorMobile.page,'mobile-ai-context-optout.png');
  await mediatorMobile.page.locator('#mediator-input').fill('Ett fiktivt samtal utan siduppgifter');
  await mediatorMobile.page.locator('#mediator-form button[type="submit"]').click();
  await mediatorMobile.page.getByText('Vi kan utforska detta steg för steg.').waitFor();
  const sentOff=mediatorMobile.mediatorCalls.filter(c=>c.pathname==='/api/ai/mediate');
  assert.equal(sentOff.length,1,'One AI reply from the simulated Worker');
  assert.equal(sentOff[0].body.useProjectContext,false,'OFF is sent to the real mediator endpoint');
  await contextCheckbox.check();
  await mediatorMobile.page.locator('#mediator-input').fill('Ett andra fiktivt samtal');
  await mediatorMobile.page.locator('#mediator-form button[type="submit"]').click();
  await mediatorMobile.page.locator('.mediator-message-assistant').nth(1).waitFor();
  const sentOn=mediatorMobile.mediatorCalls.filter(c=>c.pathname==='/api/ai/mediate');
  assert.equal(sentOn.length,2);
  assert.equal(sentOn[1].body.useProjectContext,true,'ON is sent after restoring the choice');
  await mediatorMobile.context.close();

  // Automatic result analyses are checked through the REAL browser DOM,
  // with a mocked Worker and synthetic data, never real accounts.
  const aiView=await freshContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},
    {authenticated:true,paired:true,personalityComplete:true,aiAnalyses:true});
  await aiView.page.goto(base+'#personlighet',{waitUntil:'load'});
  await aiView.page.locator('.pf-results .ai-result-panel .ai-result-prose').waitFor();
  assert.match(await aiView.page.locator('.pf-results .ai-result-prose').innerText(),/Ert resultat kan vara en bra samtalsstart/);
  assert.equal(aiView.aiRequests[0].kind,'personality');
  assert.equal(aiView.aiRequests[0].scope,'own');
  assert.deepEqual(Object.keys(aiView.aiRequests[0]).sort(),['kind','scope']);
  assert.equal(await aiView.page.locator('.pf-reference-feedback').count(),0,
    'Old static personality advice is replaced when AI is enabled');
  await checkOverflow(aiView.page,'AI personality result 390px');
  await capture(aiView.page,'mobile-ai-personality-result.png');
  await aiView.page.goto(base+'#swipe',{waitUntil:'load'});
  await aiView.page.locator('.swipe-secondary-results').waitFor();
  await revealSwipeSecondary(aiView.page);
  await aiView.page.locator('.swipe-results .ai-result-panel .ai-result-prose').waitFor();
  await aiView.page.locator('.live-main').evaluate(el=>{el.scrollTop=0;});
  assert.equal(await aiView.page.locator('.swipe-play-view > .swipe-heading #swipe-export-private').count(),0);
  assert.equal(await aiView.page.locator('.swipe-play-view > .swipe-stage + .swipe-private-export').count(),1,
    'Optional export remains reachable immediately after the playable card');
  const generalCardRect=await aiView.page.locator('#swipe-card').boundingBox();
  const generalNavRect=await aiView.page.locator('#live-mobile-nav').boundingBox();
  assert.ok(generalCardRect && generalNavRect && generalCardRect.y + 190 < generalNavRect.y,
    'At 390px the playable card has substantial visible room above navigation');
  const generalActions=await aiView.page.locator('.swipe-actions').boundingBox();
  assert.ok(generalActions && generalActions.y < generalNavRect.y+85,
    '390px general Ja/Nej row is near the first viewport, not far below it');
  await capture(aiView.page,'mobile-general-swipe-compact-choices.png');
  await capture(aiView.page,'mobile-general-swipe-first-card-top.png');
  const swipeRequest=aiView.aiRequests.find(x=>x.kind==='swipe');
  assert.equal(swipeRequest.scope,'general');
  assert.deepEqual(Object.keys(swipeRequest).sort(),['kind','scope']);
  assert.equal(await aiView.page.locator('.swipe-rule-summary').count(),0,
    'Old static swipe advice is replaced when AI is enabled');
  await checkOverflow(aiView.page,'AI swipe result 390px');
  await capture(aiView.page,'mobile-ai-swipe-result.png');
  await aiView.context.close();

  const d=await freshContext({viewport:{width:1440,height:900},deviceScaleFactor:1},{authenticated:true});
  await d.page.getByRole("heading",{name:/Hej[ ,]+Provförälder/}).waitFor();
  assert.equal(await d.page.locator("#live-desktop-nav a").count(),8);
  await checkOverflow(d.page,"Desktop homepage");
  await capture(d.page,"desktop-home.png");
  await d.context.close();
  await verifyMediatorConversationLifecycle();
  await verifyAiReflectionRetryAndRoutes();
  await captureFunctionalInventory();
  await testAccountBrowserJourney();
  await verifyBrowserHistory();
  await verifyTouchMobileTabStrip();
  await verifyUnderstandingStateWriteRecheck();
  await verifySwipeAnswerWriteRecheck();
  await verifyImportancePendingAnswerFeedback();
  await verifyImportanceWriteAckBrowser();
  await verifyAllThemeDeckJourneys();
  await verifyInsightsTwoRolesAndStates();
  await verifyIpip50WriteAckBrowser();
  await verifyFullPersonalitySurvey();
  await verifyRetestAnswerAcknowledgements();
  await verifyRetestLifecycleAckBrowser();
  await verifyRetestDeletionAckBrowser();
  await verifyFullPrivateRetest();
  await verifyDistinctPrivateRetestHistory();
  await verifyCommunicationForms();
  await verifyAllCommunicationExercises();
  await verifyWholeInboxBackgroundLoadStatus();
  await verifyPairedTwoRoleExchange();
  await verifyLinkedInboxOlderPages();
  await verifyPairedRuleRevisionAndHistory();
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
