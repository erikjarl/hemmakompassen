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
async function freshContext(options,{authenticated=false}={}){
  const context=await browser.newContext({...options,locale:"sv-SE",reducedMotion:"reduce"});
  await context.addInitScript(value=>{window.__HK_TEST_USER__=value;},authenticated?{id:"10000000-0000-0000-0000-000000000001",email:"synthetic@example.invalid"}:null);
  await context.route("https://esm.sh/**",route=>route.fulfill({
    contentType:"application/javascript",
    body:`
      export function createClient(){
        const current=()=>window.__HK_TEST_USER__;
        return {
          auth:{
            async getUser(){return {data:{user:current()},error:current()?null:{name:'AuthSessionMissingError'}}},
            onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},
            async signInWithPassword(){return {error:null}}
          },
          from(){return {select(){return {eq(){return {async maybeSingle(){return {data:current()?{display_name:'Provförälder'}:null,error:null}}}}}}}},
          async rpc(){return {data:current()?[{user_id:current().id,role:'parent',display_name:'Provförälder'}]:[],error:null}}
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
  await m.page.getByRole("heading",{name:/Hej, Provförälder/}).waitFor();
  assert.match(await m.page.locator("#live-app").innerText(),/Din familj/i);
  await checkOverflow(m.page,"Mobile homepage");
  await capture(m.page,"mobile-home.png");
  await m.page.goto(base+"konto.html",{waitUntil:"load"});
  await m.page.getByRole("heading",{name:"Använd en familjekod"}).waitFor();
  assert.ok(await m.page.locator("#join-family").isVisible(),"A singleton account must be able to enter a family code");
  assert.ok(await m.page.locator("#waiting").isVisible(),"A singleton account must be able to create an invite");
  await checkOverflow(m.page,"Mobile family pairing");
  await capture(m.page,"mobile-pairing.png");
  await m.page.goto(base+"#hem",{waitUntil:"load"});
  await m.page.locator("#live-mobile-nav a[href='#inkorg']").click();
  await m.page.getByRole("heading",{name:"Inkorg"}).waitFor();
  await checkOverflow(m.page,"Mobile authenticated section");
  await capture(m.page,"mobile-inbox.png");
  await m.context.close();
  const d=await freshContext({viewport:{width:1440,height:900},deviceScaleFactor:1},{authenticated:true});
  await d.page.getByRole("heading",{name:/Hej, Provförälder/}).waitFor();
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
