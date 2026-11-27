import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try {
 // Use the real approved artwork whenever present. If absent, exercise the live
 // transition code with a same-size fixture intercepted only inside Playwright.
 const southPage=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 try {
  let fixture=false;
  await southPage.route('**/helvetets-portar.png',async route=>{
   const response=await route.fetch();
   if(response.ok()){await route.fulfill({response});return;}
   fixture=true;
   const substitute=await route.fetch({url:'http://127.0.0.1:8765/spel/rimforsa/rimforsa-karta.webp'});
   assert(substitute.ok(),'Missing test-only map fixture');
   await route.fulfill({response:substitute});
  });
  await southPage.addInitScript(()=>{
   const draw=CanvasRenderingContext2D.prototype.drawImage;window.__southDraws=0;
   CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
    const value=draw.call(this,image,...args);
    if(image instanceof HTMLImageElement&&image.src.includes('helvetets-portar.png'))window.__southDraws++;
    return value;
   };
  });
  await southPage.goto('http://127.0.0.1:8765/spel/rimforsa/',{waitUntil:'load'});
  await southPage.waitForFunction(()=>{const t=window.__rimforsaTest;return t?.isReady()&&t.southReady()&&t.carDrive.ready()&&t.frames()>10;},{},{timeout:25000});
  for(const mode of ['walk','car','heli']){
   const setup=await southPage.evaluate(mode=>{
    const t=window.__rimforsaTest;t.reset({clearMoney:false});t.moveTo(490,1038);
    if(mode==='car'){t.carPos.x=490;t.carPos.y=1038;t.enterCar();}
    if(mode==='heli'){t.helicopter.position.x=490;t.helicopter.position.y=1038;t.enterHeli();}
    return {inCar:t.state.inCar,inHeli:t.state.inHeli,walkable:t.canStand(490,1038),driveable:t.carDrive.canDrive(490,1038)};
   },mode);
   assert.equal(setup.inCar,mode==='car');assert.equal(setup.inHeli,mode==='heli');
   if(mode==='walk')assert(setup.walkable);if(mode==='car')assert(setup.driveable);
   await southPage.keyboard.down('ArrowDown');
   try{await southPage.waitForFunction(()=>window.__rimforsaTest.region()==='south',{},{timeout:5000});}finally{await southPage.keyboard.up('ArrowDown');}
   await southPage.waitForFunction(()=>window.__southDraws>0);
   const arrival=await southPage.evaluate(()=>{const t=window.__rimforsaTest,s=window.RimforsaSouthWorld;return {x:t.state.x,y:t.state.y,walkable:s.canStand(t.state.x,t.state.y),car:t.state.inCar,heli:t.state.inHeli,regions:t.vehicleRegions()};});
   assert(arrival.walkable);assert.equal(arrival.car,mode==='car');assert.equal(arrival.heli,mode==='heli');
   if(mode==='car')assert.equal(arrival.regions.car,'south');else assert.equal(arrival.regions.car,'rimforsa');
   if(mode==='heli')assert.equal(arrival.regions.heli,'south');else assert.equal(arrival.regions.heli,'rimforsa');
   if(mode==='heli'){
    const landing=await southPage.evaluate(()=>{const t=window.__rimforsaTest,p={x:t.state.x,y:t.state.y};t.moveTo(165,65);t.helicopter.position.x=165;t.helicopter.position.y=65;t.landHeli();const rejected=t.state.inHeli;t.moveTo(p.x,p.y);Object.assign(t.helicopter.position,p);return rejected;});
    assert(landing,'Manual landing on a rock must be rejected');
   }
   await southPage.keyboard.down('ArrowUp');
   try{await southPage.waitForFunction(()=>window.__rimforsaTest.region()==='rimforsa',{},{timeout:5000});}finally{await southPage.keyboard.up('ArrowUp');}
   const returned=await southPage.evaluate(()=>{const t=window.__rimforsaTest;return {car:t.state.inCar,heli:t.state.inHeli,regions:t.vehicleRegions(),x:t.state.x,y:t.state.y};});
   assert.equal(returned.car,mode==='car');assert.equal(returned.heli,mode==='heli');assert.equal(returned.regions.car,'rimforsa');assert.equal(returned.regions.heli,'rimforsa');
   assert(Math.abs(returned.x-490)<40&&Math.abs(returned.y-1032)<45,'Return near väg 23');
   console.log('SOUTH ROUNDTRIP',mode,arrival,returned);
  }
  console.log('SOUTH ART',fixture?'test-only fixture; real image missing':'actual repository image');
 }finally{await southPage.close();}
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
