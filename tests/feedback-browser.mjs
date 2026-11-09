import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';

// Isolated DOM + genuine Chromium interaction, without a live login or DB write.
const appHtml = readFileSync(new URL('../index.html',import.meta.url),'utf8');
const widget = appHtml.match(/<button type="button" id="hk-feedback-open"[\s\S]*?<\/dialog>/)?.[0];
assert.ok(widget,'The shared feedback widget must be present in the actual app markup');
const accountHtml = readFileSync(new URL('../konto.html',import.meta.url),'utf8');
const accountWidget = accountHtml.match(/<button type="button" id="hk-feedback-open"[\s\S]*?<\/dialog>/)?.[0];
assert.ok(accountWidget, 'The same tester report control must be present on the account page');
const js = readFileSync(new URL('../feedback.js',import.meta.url),'utf8');
const css = readFileSync(new URL('../feedback.css',import.meta.url),'utf8');
const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
try {
  const page = await browser.newPage({viewport:{width:390,height:844}});
  await page.route('https://site.test/**',route=>route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html lang="sv"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body><div class="live-layout"><nav class="live-mobile" style="position:fixed;bottom:0;height:60px;width:100%"></nav></div>'+widget+'</body></html>'
  }));
  await page.goto('https://site.test/hemmakompassen/index.html#kommunikation/plan');
  await page.addStyleTag({content:css});
  await page.addScriptTag({content:js});
  await page.evaluate(()=>{
    window.testFeedbackRows = [];
    window.feedbackInsertAttempts = 0;
    let signedIn = false;
    let scenario = 'ok';
    window.toggleSignedIn = v => { signedIn = v; };
    window.setFeedbackScenario = value => { scenario = value; };
    // Speed up only the client's real 15-second deadline; no live server,
    // authentication token or stored report is involved.
    const browserSetTimeout = window.setTimeout.bind(window);
    window.setTimeout = (fn, ms, ...args) =>
      browserSetTimeout(fn, ms === 15000 ? 30 : ms, ...args);
    window.HKFeedback.installFeedback({
      db:{
        auth:{getUser:async()=>{
          if(scenario==='authHang')return new Promise(()=>{});
          return {data:{user:signedIn?{id:'test-user-id'}:null},error:null};
        }},
        from:table=>({insert:async row=>{
          window.feedbackInsertAttempts++;
          if(scenario==='writeHang')return new Promise(()=>{});
          if(scenario==='writeFail')return {error:{code:'MOCK_503',message:'Servern avvisade inskick.'}};
          window.testFeedbackRows.push({table,row});
          return {error:null};
        }})
      }
    });
  });
  const btn=page.locator('#hk-feedback-open');
  assert.equal(await btn.isVisible(),true);
  const box=await btn.boundingBox();
  const navBox = await page.locator('.live-mobile').boundingBox();
  assert.equal(await btn.getAttribute('aria-label'),'Rapportera fel eller innehåll');
  assert.ok(box && box.width <= 56 && box.x >= 0 && box.x + box.width <= 390,
    'Mobile report button is compact and inside the viewport');
  assert.ok(navBox && box.y + box.height <= navBox.y - 8,
    'Fixed report control does not cover the horizontal navigation');
  assert.equal(await page.locator('.hk-feedback-open-label').isVisible(), false,
    'The full label is visually hidden only on mobile, retaining its accessible name');
  await page.setViewportSize({width:320,height:700});
  const narrowBox = await btn.boundingBox();
  const narrowNav = await page.locator('.live-mobile').boundingBox();
  assert.ok(narrowBox && narrowBox.width <= 56 && narrowBox.x >= 0
    && narrowBox.x + narrowBox.width <= 320 && narrowBox.y + narrowBox.height <= narrowNav.y - 8,
    'Compact report control stays usable at 320px');
  await page.setViewportSize({width:390,height:844});

  await btn.click();
  assert.equal(await page.locator('#hk-feedback-dialog').evaluate(el=>el.open),true);
  await page.locator('[name="category"]').selectOption('bug');
  await page.locator('[name="description"]').fill('Knappen reagerade inte när jag tryckte.');
  await page.locator('button[type=submit]').click();
  await page.waitForFunction(()=>document.querySelector('#hk-feedback-status').textContent.includes('Logga in'));
  assert.equal(await page.locator('[name="description"]').inputValue(),'Knappen reagerade inte när jag tryckte.');
  assert.deepEqual(await page.evaluate(()=>window.testFeedbackRows),[]);

  await page.evaluate(()=>window.toggleSignedIn(true));
  await page.locator('button[type=submit]').click();
  await page.waitForFunction(()=>document.querySelector('#hk-feedback-status').textContent.includes('sparad'));
  const rows=await page.evaluate(()=>window.testFeedbackRows);
  assert.equal(rows.length,1);
  assert.equal(rows[0].table,'test_feedback');
  assert.equal(rows[0].row.page_context,'index.html#kommunikation');
  assert.equal(rows[0].row.category,'bug');
  assert.equal(rows[0].row.user_id,'test-user-id');
  assert.equal(await page.locator('[name="description"]').inputValue(),'');
  await page.locator('#hk-feedback-close').click();
  assert.equal(await page.locator('#hk-feedback-dialog').evaluate(el=>el.open),false);

  // FUN-00/FBK-01: real Chromium events for failed writes and unknown timeouts.
  // None of these synthetic failures may clear the report or silently re-send.
  await btn.click();
  await page.locator('[name="category"]').selectOption('content');
  const draft='Texten i förklaringen blev obegriplig för mig.';
  await page.locator('[name="description"]').fill(draft);
  await page.evaluate(()=>window.setFeedbackScenario('writeFail'));
  await page.locator('button[type=submit]').click();
  await page.waitForFunction(()=>document.querySelector('#hk-feedback-status').textContent.includes('kunde inte bekräftas'));
  assert.equal(await page.locator('[name="description"]').inputValue(),draft);
  assert.equal(await page.locator('button[type=submit]').isEnabled(),true);
  assert.equal(await page.locator('#hk-feedback-close').isEnabled(),true);
  assert.equal(await page.evaluate(()=>window.feedbackInsertAttempts),2);
  assert.equal((await page.evaluate(()=>window.testFeedbackRows)).length,1);

  await page.evaluate(()=>window.setFeedbackScenario('authHang'));
  await page.locator('button[type=submit]').click();
  await page.waitForFunction(()=>document.querySelector('#hk-feedback-status').textContent.includes('Ingen rapport har skickats'));
  assert.equal(await page.locator('[name="description"]').inputValue(),draft);
  assert.equal(await page.locator('button[type=submit]').isEnabled(),true);
  assert.equal(await page.evaluate(()=>window.feedbackInsertAttempts),2,
    'Authentication timeout cannot result in an INSERT');

  await page.evaluate(()=>window.setFeedbackScenario('writeHang'));
  await page.locator('button[type=submit]').click();
  await page.waitForFunction(()=>document.querySelector('#hk-feedback-status').textContent.includes('kan redan vara sparad'));
  assert.equal(await page.locator('[name="description"]').inputValue(),draft);
  assert.equal(await page.locator('button[type=submit]').isEnabled(),true);
  assert.equal(await page.locator('#hk-feedback-close').isEnabled(),true);
  assert.equal(await page.evaluate(()=>window.feedbackInsertAttempts),3,
    'Lost write confirmation must not trigger an automatic retry');
  assert.equal((await page.evaluate(()=>window.testFeedbackRows)).length,1);

  // An explicitly chosen new submission is allowed; it must keep category,
  // page context and the previously retained text.
  await page.evaluate(()=>window.setFeedbackScenario('ok'));
  await page.locator('button[type=submit]').click();
  await page.waitForFunction(()=>document.querySelector('#hk-feedback-status').textContent.includes('sparad'));
  const finalRows=await page.evaluate(()=>window.testFeedbackRows);
  assert.equal(finalRows.length,2);
  assert.equal(finalRows[1].row.description,draft);
  assert.equal(finalRows[1].row.category,'content');
  assert.equal(finalRows[1].row.page_context,'index.html#kommunikation');
  assert.equal(await page.evaluate(()=>window.feedbackInsertAttempts),4);
  assert.equal(await page.locator('[name="description"]').inputValue(),'');
  await page.locator('#hk-feedback-close').click();

  // Account page lacks the swipe-nav; its button must still fit the small viewport.
  const accountPage = await browser.newPage({viewport:{width:320,height:700}});
  await accountPage.route('https://account.test/**', route => route.fulfill({
    status:200, contentType:'text/html; charset=utf-8',
    body:'<!doctype html><html lang="sv"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body>'+accountWidget+'</body></html>'
  }));
  await accountPage.goto('https://account.test/hk/konto.html');
  await accountPage.addStyleTag({content:css});
  const accountButton = accountPage.locator('#hk-feedback-open');
  const accountBox = await accountButton.boundingBox();
  assert.ok(accountBox && accountBox.width <= 56 && accountBox.x >= 0
    && accountBox.x + accountBox.width <= 320 && accountBox.y + accountBox.height <= 700-8,
    'Account page report control remains usable at 320px without a bottom nav');
  assert.equal(await accountButton.getAttribute('aria-label'),'Rapportera fel eller innehåll');
  await accountPage.close();
  console.log('PASS: 320/390px reporter, keyboard-sized modal, rejected/unknown saves, Auth timeout, retained draft and explicit retry');
} finally {
  await browser.close();
}
