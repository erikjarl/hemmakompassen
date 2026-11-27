import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>{errors.push(String(e));console.error('PAGEERROR',e.stack);});
 page.on('console',m=>{if(['error','warning'].includes(m.type()))console.log(m.type(),m.text());});
 await page.goto('http://127.0.0.1:8765/spel/rimforsa/',{waitUntil:'load'});
 await page.waitForFunction(()=>window.__rimforsaTest?.isReady()&&window.__rimforsaTest.frames()>10,{},{timeout:25000});
 const initial=await page.evaluate(()=>({frames:window.__rimforsaTest.frames(),x:window.__rimforsaTest.state.x,y:window.__rimforsaTest.state.y,boba:window.__rimforsaTest.npcSystem.boba?.p.ready,slobido:window.__rimforsaTest.npcSystem.slobido?.p.ready,sprite:window.__rimforsaTest.hasSprite()}));
 console.log('INITIAL',initial);assert(initial.sprite);assert(initial.boba);assert(initial.slobido);
 await page.keyboard.down('ArrowDown');await page.waitForTimeout(500);await page.keyboard.up('ArrowDown');
 const after=await page.evaluate(()=>({frames:window.__rimforsaTest.frames(),x:window.__rimforsaTest.state.x,y:window.__rimforsaTest.state.y}));
 console.log('AFTER',after);assert(after.frames>initial.frames);assert(Math.hypot(after.x-initial.x,after.y-initial.y)>1,'Lage did not move');
 assert.deepEqual(errors,[]);await page.screenshot({path:'rimforsa-start.png'});
}finally{await browser.close();}
