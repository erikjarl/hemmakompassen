import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const warnings=[];const errors=[];page.on('pageerror',e=>{errors.push(String(e));console.error('PAGEERROR',e.stack);});
 page.on('console',m=>{if(['error','warning'].includes(m.type()))console.log(m.type(),m.text());if(m.text().includes('Boba:draw'))warnings.push(m.text());});
 await page.addInitScript(()=>{const original=CanvasRenderingContext2D.prototype.drawImage;window.__bobaDraws=0;CanvasRenderingContext2D.prototype.drawImage=function(image,...args){const result=original.call(this,image,...args);if(image instanceof HTMLImageElement&&image.src.includes('boba-sprites.png'))window.__bobaDraws++;return result;};});
 await page.goto('http://127.0.0.1:8765/spel/rimforsa/',{waitUntil:'load'});
 await page.waitForFunction(()=>window.__rimforsaTest?.isReady()&&window.__rimforsaTest.frames()>10,{},{timeout:25000});
 const initial=await page.evaluate(()=>({frames:window.__rimforsaTest.frames(),x:window.__rimforsaTest.state.x,y:window.__rimforsaTest.state.y,boba:window.__rimforsaTest.npcSystem.boba?.p.ready,slobido:window.__rimforsaTest.npcSystem.slobido?.p.ready,sprite:window.__rimforsaTest.hasSprite()}));
 console.log('INITIAL',initial);assert(initial.sprite);assert(initial.boba);assert(initial.slobido);
 await page.keyboard.down('ArrowDown');await page.waitForTimeout(500);await page.keyboard.up('ArrowDown');
 const after=await page.evaluate(()=>({frames:window.__rimforsaTest.frames(),x:window.__rimforsaTest.state.x,y:window.__rimforsaTest.state.y}));
 console.log('AFTER',after);assert(after.frames>initial.frames);assert(Math.hypot(after.x-initial.x,after.y-initial.y)>1,'Lage did not move');
 await page.locator('#showMap').click();await page.locator('#goBoba').click();
 const route=await page.evaluate(()=>({path:window.__rimforsaTest.state.path.length,boba:{x:window.__rimforsaTest.npcSystem.boba.p.x,y:window.__rimforsaTest.npcSystem.boba.p.y}}));console.log('BOBA ROUTE',route);assert(route.path>0,'Boba needs a reachable walking route');
 await page.waitForFunction(()=>window.__bobaDraws>0,{},{timeout:15000});
 await page.waitForFunction(()=>{const t=window.__rimforsaTest,p=t.npcSystem.boba.p;return Math.hypot(t.state.x-p.x,t.state.y-p.y)<=32;},{},{timeout:25000});
 console.log('BOBA REACHED',await page.evaluate(()=>{const t=window.__rimforsaTest,p=t.npcSystem.boba.p;return Math.hypot(t.state.x-p.x,t.state.y-p.y);}));
 const humpvind=await page.evaluate(()=>{
  const t=window.__rimforsaTest,h=t.npcSystem.humpvind;
  h.reset();const p=h.p;if(!p.ready)return {ready:false};
  const origin={x:p.x,y:p.y};
  const separation=Math.min(...t.sites.map(s=>Math.hypot(s.x-p.x,s.y-p.y)),...t.npcSystem.people.filter(s=>s.ready).map(s=>Math.hypot(s.x-p.x,s.y-p.y)));
  const walkable=t.canStand(p.x,p.y),route=t.pathTo(p.x,p.y).length;
  h.update(.05,p.x-20,p.y);
  return {ready:true,origin,walkable,separation,route,mode:p.mode,moved:Math.hypot(p.x-origin.x,p.y-origin.y),hasDialogue:!!t.npcSystem.talk('humpvind')};
 });
 console.log('HUMPVIND',humpvind);
 assert(humpvind.ready,'Humpvind needs a reachable grassy spawn');
 assert(humpvind.walkable&&humpvind.separation>=150);
 assert(humpvind.route>0,'Humpvind needs a route from Lage');
 assert.equal(humpvind.mode,'flee');assert(humpvind.moved>1);assert.equal(humpvind.hasDialogue,false);
 assert.deepEqual(warnings,[]);assert.deepEqual(errors,[]);console.log('BOBA DRAW COUNT',await page.evaluate(()=>window.__bobaDraws));await page.screenshot({path:'rimforsa-start.png'});
}finally{await browser.close();}
