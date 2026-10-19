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
async function capture(page,name){await page.screenshot({path:path.join(output,name),fullPage:true,animations:"disabled"});}
async function freshContext(options){
  const context=await browser.newContext({...options,locale:"sv-SE",reducedMotion:"reduce"});
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
  const m=await freshContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  assert.equal(await m.page.locator(".welcome-intro").count(),1,"First visit must show onboarding");
  await checkOverflow(m.page,"Mobile onboarding");
  await capture(m.page,"mobile-onboarding.png");
  await m.page.locator(".role-chooser label").nth(1).click();
  await m.page.locator("#first-name").fill("Provförälder");
  await m.page.locator("#onboarding-form button[type=submit]").click();
  assert.match(await m.page.locator("#app").innerText(),/förälder/i);
  await checkOverflow(m.page,"Mobile homepage");
  await capture(m.page,"mobile-home.png");
  await m.page.locator(".home-connection [data-page='familj']").click();
  await m.page.waitForFunction(()=>document.querySelector("#app")?.textContent?.includes("Familjekoder fungerar inte ännu"));
  await checkOverflow(m.page,"Family page");
  await capture(m.page,"mobile-family.png");
  await m.page.locator(".mobile-nav [data-page='swipe']").click();
  await m.page.locator(".swipe-choice.like").waitFor();
  await m.page.locator(".swipe-choice.like").click();
  await m.page.waitForFunction(()=>document.querySelector("#app")?.textContent?.includes("1 av 14 påståenden"));
  await checkOverflow(m.page,"Swipe page");
  await capture(m.page,"mobile-swipe.png");
  await m.page.locator(".mobile-nav [data-page='personlighet']").click();
  await m.page.locator(".question-box").first().waitFor();
  assert.equal(await m.page.locator(".question-box").count(),15);
  await checkOverflow(m.page,"Personality page");
  await capture(m.page,"mobile-personality.png");
  await m.context.close();
  const d=await freshContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
  assert.equal(await d.page.locator(".welcome-intro").count(),1);
  await d.page.keyboard.press("Tab");
  assert.equal(await d.page.evaluate(()=>document.activeElement?.classList.contains("skip-link")),true,"Skip link should be first in tab order");
  await d.page.keyboard.press("Enter");
  assert.equal(await d.page.evaluate(()=>document.activeElement?.id),"app","Skip link should focus main");
  await checkOverflow(d.page,"Desktop onboarding");
  await capture(d.page,"desktop-onboarding.png");
  await d.page.locator("#first-name").fill("Provtonåring");
  await d.page.locator("#onboarding-form button[type=submit]").click();
  await d.page.waitForFunction(()=>document.activeElement?.id==="app");
  assert.equal(await d.page.locator(".desktop-nav .nav-item").count(),7);
  await checkOverflow(d.page,"Desktop homepage");
  await capture(d.page,"desktop-home.png");
  await d.context.close();
  assert.deepEqual(errors,[],"Browser errors: "+errors.join("; "));
  console.log("Browser smoke tests passed. 7 screenshots written to artifacts/.");
}catch(error){console.error(error);process.exitCode=1;}
finally{if(browser)await browser.close();server.kill();}
