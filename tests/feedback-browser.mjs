import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';

// Isolated DOM + genuine Chromium interaction, without a live login or DB write.
const appHtml = readFileSync(new URL('../index.html',import.meta.url),'utf8');
const widget = appHtml.match(/<button type="button" id="hk-feedback-open"[\s\S]*?<\/dialog>/)?.[0];
assert.ok(widget,'The shared feedback widget must be present in the actual app markup');
const js = readFileSync(new URL('../feedback.js',import.meta.url),'utf8');
const css = readFileSync(new URL('../feedback.css',import.meta.url),'utf8');
const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
try {
  const page = await browser.newPage({viewport:{width:390,height:844}});
  await page.route('https://site.test/**',route=>route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html lang="sv"><meta name="viewport" content="width=device-width,initial-scale=1"><body><div class="live-layout"><nav class="live-mobile" style="position:fixed;bottom:0;height:60px;width:100%"></nav></div>'+widget+'</body></html>'
  }));
  await page.goto('https://site.test/hemmakompassen/index.html#kommunikation/plan');
  await page.addStyleTag({content:css});
  await page.addScriptTag({content:js});
  await page.evaluate(()=>{
    window.testFeedbackRows = [];
    let signedIn = false;
    window.toggleSignedIn = v => { signedIn = v; };
    window.HKFeedback.installFeedback({
      db:{
        auth:{getUser:async()=>({data:{user:signedIn?{id:'test-user-id'}:null},error:null})},
        from:table=>({insert:async row=>{
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
  console.log('PASS: 320/390px compact accessible report button, bottom-nav clearance, mock auth/insert and modal');
} finally {
  await browser.close();
}
