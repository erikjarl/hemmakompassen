import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';

// Isolated DOM + genuine Chromium interaction, without a live login or DB write.
const appHtml = readFileSync(new URL('../index.html',import.meta.url),'utf8');
const widget = appHtml.match(/<button type="button" id="hk-feedback-open"[\s\S]*?<\/dialog>/)?.[0];
assert.ok(widget,'The shared feedback widget must be present in the actual app markup');
const accountHtml = readFileSync(new URL('../konto.html',import.meta.url),'utf8');
const accountHeader = accountHtml.match(/<header class="account-toolbar">[\s\S]*?<\/header>/)?.[0];
const accountLoggedOut = accountHtml.match(/<section id="logged-out">[\s\S]*?<\/section>/)?.[0];
const accountDialog = accountHtml.match(/<dialog id="hk-feedback-dialog"[\s\S]*?<\/dialog>/)?.[0];
const accountCss = accountHtml.match(/<style>([\s\S]*?)<\/style>/)?.[1];
assert.ok(accountHeader && accountLoggedOut && accountDialog && accountCss,
  'The account toolbar, actual login controls and report dialog must be present');
const js = readFileSync(new URL('../feedback.js',import.meta.url),'utf8');
const css = readFileSync(new URL('../feedback.css',import.meta.url),'utf8');
const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
try {
  const page = await browser.newPage({viewport:{width:390,height:844}});
  // Route the full browser context so the new account tab uses the fixture too.
  await page.context().route('https://site.test/**',route=>route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html lang="sv"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body><div class="live-layout"><nav class="live-mobile" style="position:fixed;bottom:0;height:76px;left:0;box-sizing:border-box"></nav></div>'+widget+'</body></html>'
  }));
  await page.goto('https://site.test/hemmakompassen/index.html#kommunikation/plan');
  await page.addStyleTag({content:css});
  await page.addScriptTag({content:js});
  // FBK-02-02: NVC reports previously lost their route and appeared as
  // generic index.html; assert all communication subviews map correctly.
  const contexts=await page.evaluate(()=>{
    const base='https://site.test/hemmakompassen/index.html';
    return ['#nvc','#mi-foralder','#kommunikation/plan','#kommunikation/lyssna',
      '#regler','#unknown','?token=SHOULD_NOT_BE_COPIED#nvc']
      .map(route=>window.HKFeedback.feedbackPageContext(base+route));
  });
  assert.deepEqual(contexts,[
    'index.html#nvc','index.html#mi-foralder',
    'index.html#kommunikation','index.html#kommunikation',
    'index.html#regler','index.html','index.html#nvc'
  ],'NVC and parent MI reports retain useful safe route context, without query tokens');
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
      browserSetTimeout(fn, ms === 15000 ? (scenario === 'slowOk' ? 5000 : 30) : ms, ...args);
    window.HKFeedback.installFeedback({
      db:{
        auth:{getUser:async()=>{
          if(scenario==='authHang')return new Promise(()=>{});
          if(scenario==='authError')return {data:{user:null},error:{message:'Simulerat nätverksfel'}};
          return {data:{user:signedIn?{id:'test-user-id'}:null},error:null};
        }},
        from:table=>({insert:async row=>{
          window.feedbackInsertAttempts++;
          if(scenario==='writeHang')return new Promise(()=>{});
          if(scenario==='slowOk')return new Promise(resolve=>{
            window.finishFeedbackInsert=()=>{
              window.testFeedbackRows.push({table,row});
              resolve({error:null});
            };
          });
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
  assert.ok(navBox && navBox.x + navBox.width <= box.x - 6 &&
    box.y >= navBox.y - 2 && box.y + box.height <= navBox.y + navBox.height + 2,
    'Docked report control sits beside, not on top of, the horizontal navigation');
  assert.equal(await page.locator('.hk-feedback-open-label').isVisible(), false,
    'The full label is visually hidden only on mobile, retaining its accessible name');
  await page.setViewportSize({width:320,height:700});
  const narrowBox = await btn.boundingBox();
  const narrowNav = await page.locator('.live-mobile').boundingBox();
  assert.ok(narrowBox && narrowBox.width <= 56 && narrowBox.x >= 0
    && narrowBox.x + narrowBox.width <= 320 && narrowNav.x + narrowNav.width <= narrowBox.x - 6
    && narrowBox.y >= narrowNav.y - 2 && narrowBox.y + narrowBox.height <= narrowNav.y + narrowNav.height + 2,
    'At 320px the report button occupies reserved navigation space, not page content');
  await page.setViewportSize({width:390,height:844});

  const unloadBlocked = () => page.evaluate(() => {
    const event = new Event('beforeunload', {cancelable:true});
    window.dispatchEvent(event);
    return event.defaultPrevented;
  });
  assert.equal(await unloadBlocked(),false,
    'An empty report must not cause a leave-page confirmation');
  await btn.click();
  assert.equal(await page.locator('#hk-feedback-dialog').evaluate(el=>el.open),true);
  await page.locator('[name="category"]').selectOption('bug');
  assert.equal(await unloadBlocked(),false,
    'Selecting only the report category must not cause a leave-page confirmation');
  await page.locator('[name="description"]').fill('Knappen reagerade inte när jag tryckte.');
  await page.locator('[name="expected"]').fill('Knappen ska reagera på första klicket.');
  assert.equal(await unloadBlocked(),true,
    'A written report draft triggers the browser unload guard');
  // VIS/FBK-01: a signed-out user can open account in a separate tab
  // without destroying their edited report in the current tab.
  const newTabLink=page.locator('#hk-feedback-form a[href="./konto.html"]');
  assert.equal(await newTabLink.getAttribute('target'),'_blank');
  assert.equal(await newTabLink.getAttribute('rel'),'noopener noreferrer');
  const [accountTab] = await Promise.all([
    page.waitForEvent('popup'),
    newTabLink.click()
  ]);
  await accountTab.waitForLoadState('domcontentloaded');
  assert.match(accountTab.url(),/\/hemmakompassen\/konto\.html/);
  await accountTab.close();
  assert.equal(await page.locator('[name="description"]').inputValue(),'Knappen reagerade inte när jag tryckte.');
  await page.locator('#hk-feedback-close').click();
  assert.equal(await unloadBlocked(),true,
    'Closing the dialog still protects its preserved unsent draft');
  await btn.click();
  assert.equal(await page.locator('[name="description"]').inputValue(),'Knappen reagerade inte när jag tryckte.',
    'Dismiss/reopen must not erase an unsent report');
  assert.equal(await page.locator('[name="expected"]').inputValue(),'Knappen ska reagera på första klicket.');
  await page.keyboard.press('Escape');
  await btn.click();
  assert.equal(await page.locator('[name="description"]').inputValue(),'Knappen reagerade inte när jag tryckte.',
    'Escape/reopen must preserve a draft');
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
  assert.equal(await unloadBlocked(),false,
    'Confirmed report submission clears the unload guard');
  await page.locator('#hk-feedback-close').click();
  assert.equal(await page.locator('#hk-feedback-dialog').evaluate(el=>el.open),false);

  // Native minlength accepts long whitespace, but the app must reject the
  // trimmed blank report before Auth/INSERT and retain editable inputs.
  await btn.click();
  await page.locator('[name="category"]').selectOption('bug');
  await page.locator('[name="description"]').fill('                  ');
  await page.locator('button[type=submit]').click();
  await page.waitForFunction(()=>document.querySelector('#hk-feedback-status').textContent.includes('minst 10 tecken'));
  assert.equal(await page.evaluate(()=>window.feedbackInsertAttempts),1,
    'Whitespace-only draft must not create another INSERT');
  assert.equal(await page.locator('button[type=submit]').isEnabled(),true);
  assert.equal(await page.locator('[name="description"]').inputValue(),'                  ');
  await page.locator('#hk-feedback-clear').click();
  await page.locator('#hk-feedback-close').click();

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
  for(const field of ['category','description','expected']){
    assert.equal(await page.locator('[name="'+field+'"]').isEnabled(),true,
      'The input must be editable again after a failed report');
  }
  assert.equal(await page.locator('button[type=submit]').isEnabled(),true);
  assert.equal(await page.locator('#hk-feedback-close').isEnabled(),true);
  assert.equal(await page.evaluate(()=>window.feedbackInsertAttempts),2);
  assert.equal((await page.evaluate(()=>window.testFeedbackRows)).length,1);

  // Failed submissions must keep the draft after leaving/reopening the modal.
  await page.locator('#hk-feedback-close').click();
  await btn.click();
  assert.equal(await page.locator('[name="description"]').inputValue(),draft);
  assert.equal(await page.locator('[name="category"]').inputValue(),'content');
  assert.equal(await page.locator('button[type=submit]').isEnabled(),true);

  await page.evaluate(()=>window.setFeedbackScenario('authError'));
  await page.locator('button[type=submit]').click();
  await page.waitForFunction(()=>document.querySelector('#hk-feedback-status').textContent.includes('Kunde inte kontrollera inloggningen'));
  assert.doesNotMatch(await page.locator('#hk-feedback-status').innerText(),/Logga in via Ditt konto/,
    'A service error is not misleadingly treated as an explicit logout');
  assert.equal(await page.locator('[name="description"]').inputValue(),draft);
  assert.equal(await page.locator('button[type=submit]').isEnabled(),true);
  assert.equal(await page.evaluate(()=>window.feedbackInsertAttempts),2,
    'A returned Auth service error must not create a new report');

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

  await btn.click();
  await page.locator('[name="category"]').selectOption('suggestion');
  await page.locator('[name="description"]').fill('Rapport som användaren vill kasta bort.');
  await page.locator('[name="expected"]').fill('Ett frivilligt utkast.');
  await page.locator('#hk-feedback-clear').click();
  assert.equal(await page.locator('[name="category"]').inputValue(),'');
  assert.equal(await page.locator('[name="description"]').inputValue(),'');
  assert.equal(await page.locator('[name="expected"]').inputValue(),'');
  assert.match(await page.locator('#hk-feedback-status').innerText(),/Utkastet har rensats/);
  assert.equal(await unloadBlocked(),false,
    'Explicitly clearing an unsent report removes the unload guard');
  await page.locator('#hk-feedback-close').click();
  await btn.click();
  assert.equal(await page.locator('[name="description"]').inputValue(),'');
  await page.locator('#hk-feedback-close').click();

  // FBK-01: freeze report fields while an INSERT is pending, otherwise a user
  // could type into the old form and lose those edits when success resets it.
  await btn.click();
  await page.locator('[name="category"]').selectOption('suggestion');
  await page.locator('[name="description"]').fill('Rapport med fördröjd bekräftelse.');
  await page.locator('[name="expected"]').fill('Fälten ska inte kunna ändras mitt under sändningen.');
  await page.evaluate(()=>window.setFeedbackScenario('slowOk'));
  await page.locator('button[type=submit]').click();
  await page.waitForFunction(()=>typeof window.finishFeedbackInsert==='function');
  for(const field of ['category','description','expected']){
    assert.equal(await page.locator('[name="'+field+'"]').isDisabled(),true,
      'Input values are frozen until the server settles the write');
  }
  assert.equal(await page.locator('#hk-feedback-clear').isDisabled(),true);
  assert.equal(await page.locator('#hk-feedback-close').isDisabled(),true);
  assert.equal(await page.locator('[name="description"]').inputValue(),'Rapport med fördröjd bekräftelse.');
  await page.evaluate(()=>window.finishFeedbackInsert());
  await page.waitForFunction(()=>document.querySelector('#hk-feedback-status').textContent.includes('sparad'));
  for(const field of ['category','description','expected']){
    assert.equal(await page.locator('[name="'+field+'"]').isEnabled(),true,
      'The settled form must become editable again');
  }
  assert.equal(await page.locator('[name="description"]').inputValue(),'');
  assert.equal((await page.evaluate(()=>window.testFeedbackRows)).length,3);
  await page.locator('#hk-feedback-close').click();

  // Exercise the real report submit handler on the NVC route, not only the
  // pure helper. Changing the hash does not authenticate or save app answers.
  await page.evaluate(()=>{location.hash='#nvc';window.setFeedbackScenario('ok');});
  await btn.click();
  await page.locator('[name="category"]').selectOption('content');
  await page.locator('[name="description"]').fill('NVC-förslaget behöver en språklig förbättring.');
  await page.locator('#hk-feedback-form button[type=submit]').click();
  await page.waitForFunction(()=>document.querySelector('#hk-feedback-status').textContent.includes('sparad'));
  const nvcRows=await page.evaluate(()=>window.testFeedbackRows);
  assert.equal(nvcRows.length,4,'NVC report creates exactly one mock row');
  assert.equal(nvcRows[3].row.page_context,'index.html#nvc',
    'NVC submission must be routed to the actual exercise rather than the generic homepage');
  assert.equal(nvcRows[3].row.category,'content');
  await page.locator('#hk-feedback-close').click();

  // Account page lacks the swipe-nav; its button must still fit the small viewport.
  const accountPage = await browser.newPage({viewport:{width:320,height:700}});
  await accountPage.route('https://account.test/**', route => route.fulfill({
    status:200, contentType:'text/html; charset=utf-8',
    body:'<!doctype html><html lang="sv"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body>'+
      accountHeader+'<main>'+accountLoggedOut+'</main><div style="height:900px"></div>'+accountDialog+'</body></html>'
  }));
  await accountPage.goto('https://account.test/hk/konto.html#invite=FAKE_SECRET_INVITE_123456');
  await accountPage.addStyleTag({content:css+'\n'+accountCss});
  const accountButton = accountPage.locator('#hk-feedback-open');
  const accountBox = await accountButton.boundingBox();
  assert.ok(accountBox && accountBox.width <= 56 && accountBox.x >= 0
    && accountBox.x + accountBox.width <= 320 && accountBox.y + accountBox.height <= 700-8,
    'Account page report control remains usable at 320px without a bottom nav');
  assert.equal(await accountButton.getAttribute('aria-label'),'Rapportera fel eller innehåll');
  assert.equal(await accountButton.evaluate(el=>getComputedStyle(el).position),'static',
    'On the account page the reporter belongs to the toolbar, not floating above form text');
  const backBox=await accountPage.locator('.account-toolbar a').boundingBox();
  const resetBox=await accountPage.locator('#reset summary').boundingBox();
  assert.ok(backBox && accountBox && backBox.x+backBox.width+6 <= accountBox.x,
    'Toolbar has separate, non-overlapping navigation and report actions at 320px');
  assert.ok(resetBox && accountBox.y+accountBox.height <= resetBox.y,
    'The report control no longer obscures the password recovery disclosure');
  await accountPage.evaluate(()=>window.scrollTo(0,450));
  await accountPage.waitForFunction(()=>window.scrollY>100);
  const stickyBox=await accountButton.boundingBox();
  assert.ok(stickyBox && stickyBox.y>=0 && stickyBox.y+stickyBox.height<=700,
    'The report control remains available in the sticky toolbar while scrolling');
  await accountPage.evaluate(()=>window.scrollTo(0,0));

  // FBK-01/FUN-01: actual account-page keyboard/form interactions with
  // synthetic signed-in Auth. Invitation fragments must not leave the browser.
  await accountPage.addScriptTag({content:js});
  await accountPage.evaluate(()=>{
    window.accountFeedbackRows=[];
    window.HKFeedback.installFeedback({
      db:{
        auth:{getUser:async()=>({data:{user:{id:'account-tester'}},error:null})},
        from:table=>({insert:async row=>{
          window.accountFeedbackRows.push({table,row});
          return {error:null};
        }})
      }
    });
  });
  await accountButton.focus();
  await accountPage.keyboard.press('Enter');
  assert.equal(await accountPage.locator('#hk-feedback-dialog').evaluate(el=>el.open),true,
    'The account reporter opens from a real keyboard interaction');
  await accountPage.locator('[name="category"]').selectOption('suggestion');
  const accountReport='Det vore enklare med en tydligare registreringsguide.';
  await accountPage.locator('[name="description"]').fill(accountReport);
  await accountPage.locator('[name="expected"]').fill('Visa en steg-för-steg-guide vid registrering.');
  assert.equal(await accountPage.evaluate(() => {
    const event=new Event('beforeunload',{cancelable:true});
    window.dispatchEvent(event);
    return event.defaultPrevented;
  }),true,'Unsent account-page report also guards against accidental navigation');
  await accountPage.locator('#hk-feedback-form button[type=submit]').click();
  await accountPage.waitForFunction(()=>document.querySelector('#hk-feedback-status').textContent.includes('sparad'));
  const accountRows=await accountPage.evaluate(()=>window.accountFeedbackRows);
  assert.equal(accountRows.length,1,'A single account-page submission must create one mock report');
  assert.equal(accountRows[0].table,'test_feedback');
  assert.equal(accountRows[0].row.user_id,'account-tester');
  assert.equal(accountRows[0].row.category,'suggestion');
  assert.equal(accountRows[0].row.description,accountReport);
  assert.equal(accountRows[0].row.expected_result,'Visa en steg-för-steg-guide vid registrering.');
  assert.equal(accountRows[0].row.page_context,'konto.html',
    'The account invitation hash must never be included in report context');
  assert.doesNotMatch(JSON.stringify(accountRows),/FAKE_SECRET_INVITE_123456/,
    'Invitation code must not leak into the mock database payload');
  assert.equal(await accountPage.locator('[name="description"]').inputValue(),'');
  await accountPage.locator('#hk-feedback-close').click();
  assert.equal(await accountPage.locator('#hk-feedback-dialog').evaluate(el=>el.open),false);
  await accountButton.focus();
  await accountPage.keyboard.press('Enter');
  assert.equal(await accountPage.locator('#hk-feedback-dialog').evaluate(el=>el.open),true);
  await accountPage.keyboard.press('Escape');
  assert.equal(await accountPage.locator('#hk-feedback-dialog').evaluate(el=>el.open),false,
    'The dialog can close with Escape after a completed submission');
  await accountPage.close();
  console.log('PASS: report draft retention, frozen in-flight edits, error recovery, explicit clear, new-tab login and account reporting');
} finally {
  await browser.close();
}
