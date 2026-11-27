import { webkit, devices } from 'playwright';
import assert from 'node:assert/strict';
const browser=await webkit.launch();
try {
 const page=await browser.newPage({...devices['iPhone 13']});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:8765/spel/rimforsa/');
 const button=page.locator('header [data-sound-toggle]');
 const running=()=>page.waitForFunction(()=>{const s=window.RimforsaAudio.status();return s.enabled&&s.contextState==='running'&&s.sceneStarted&&!s.recoveryNeeded;},null,{timeout:10000});
 await button.tap();await running();
 const clock=await page.evaluate(()=>window.RimforsaAudio.status().clock);
 await page.waitForFunction(t=>window.RimforsaAudio.status().clock>t+.1,clock);
 await page.evaluate(()=>{window.RimforsaAudio.setVisible(false);window.RimforsaAudio.setVisible(true);});
 assert(await page.evaluate(()=>window.RimforsaAudio.status().recoveryNeeded));
 await button.tap();await running();
 await button.tap();assert.equal(await page.evaluate(()=>window.RimforsaAudio.status().enabled),false);
 await page.reload();await page.locator('h1').tap();
 assert.equal(await page.evaluate(()=>window.RimforsaAudio.status().enabled),false);
 await button.tap();await running();
 assert.deepEqual(errors,[]);
 console.log('WebKit touch, audio clock, recovery, persistent mute: OK');
}finally{await browser.close();}
