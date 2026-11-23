import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const code=readFileSync(new URL('../spel/rimforsa/car.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../spel/rimforsa/index.html',import.meta.url),'utf8');

function fixture(){
 const context={window:{}};
 vm.runInNewContext(code,context);
 const car=context.window.RimforsaCar;
 const data=new Uint8ClampedArray(10*10*4);
 // Right-hand part of the map is water. The left side, including buildings and woods, is land.
 for(let y=0;y<10;y++)for(let x=7;x<10;x++)data[(y*10+x)*4]=255;
 car.setWaterMask(data,10,10,100,100);
 return car;
}

test('Vit bil får köra över all landterräng men aldrig genom vatten',()=>{
 const car=fixture();
 assert.equal(car.ready(),true);
 assert.equal(car.canDrive(40,50),true);
 assert.equal(car.canDrive(60,50),false); // front of the car touches the shoreline
 assert.equal(car.canDrive(96,50),false);
 assert.equal(car.canDrive(-1,50),false);
 assert.equal(car.waterAt(45,50),false);
 assert.equal(car.waterAt(80,50),true);
});

test('Rörelse hindrar genomkörning av vatten även vid stora frame-tider',()=>{
 const car=fixture();
 const onLand=car.move(30,50,1,0,.05);
 assert.ok(onLand.moved);
 assert.ok(onLand.x>30);
 assert.ok(onLand.speed>0);
 let p={x:30,y:50};
 for(let i=0;i<50;i++)p=car.move(p.x,p.y,1,0,.05);
 assert.ok(p.x<55,'Boat-sized vehicle must remain wholly on land');
 assert.equal(car.canDrive(p.x,p.y),true);
 const blocked=car.move(p.x,p.y,1,0,.05);
 assert.equal(blocked.moved,false);
});

test('Rörelse normaliserar diagonal styrning och bilen ritas separat',()=>{
 const car=fixture();
 const a=car.move(25,25,0,1,.04);
 const b=car.move(25,25,1,1,.04);
 assert.ok(a.moved&&b.moved);
 assert.ok(Math.hypot(b.x-25,b.y-25)<=Math.hypot(a.x-25,a.y-25)+.01);
 let drawn=0;
 const ctx={save(){},translate(){},rotate(){},scale(){},restore(){},fillRect(){drawn++}};
 car.draw(ctx,10,10,'left',true);
 assert.ok(drawn>8,'The white car, wheels and seated Lage should be rendered');
});

test('Huvudspelet har påstigning, avstigning, motorljud och återställning',()=>{
 for(const phrase of [
  '<script src="./car.js?v=4"></script>',
  'car-water-mask.png?v=1',
  'function enterCar(){',
  'function exitCar(){',
  'function nearbyExit(){',
  'const carPos={x:carDrive.HOME.x',
  'audio.setCarActive(true)',
  'audio.setCarActive(false)',
  "carDrive.move(state.x,state.y,dx,dy,dt)",
  "if(state.inCar){carDrive.draw",
  'carPos.x=carDrive.HOME.x'
 ])assert.ok(html.includes(phrase),'Missing car integration '+phrase);
 assert.match(html,/function scatterCoins\(\)/);
 assert.match(html,/function reachableBoatPoints\(\)/);
 assert.match(html,/boatW=boatChart\.naturalWidth;boatH=boatChart\.naturalHeight/);
});

test('Bilen har en transparent 16-bitarsbild för parkerat läge och Lage vid ratten',()=>{
 const fs=requireSprite();
 assert.equal(fs.subarray(1,4).toString(),'PNG');
 assert.equal(fs.readUInt32BE(16),176);
 assert.equal(fs.readUInt32BE(20),55);
 assert.match(code,/car-spritesheet\.png\?v=2/);
});
function requireSprite(){return readFileSync(new URL('../spel/rimforsa/car-spritesheet.png',import.meta.url));}

test('Bilen visar olika bildrutor när Lage kliver in och ut',()=>{
 const ctxVm={window:{Image:class {
  constructor(){this.complete=true;this.naturalWidth=176;this.naturalHeight=55;}
 }}};
 vm.runInNewContext(code,ctxVm);
 const car=ctxVm.window.RimforsaCar;
 const draws=[];
 const canvas={save(){},restore(){},translate(){},rotate(){},scale(){},fillRect(){},
  imageSmoothingEnabled:true,
  drawImage(...args){draws.push(args);}
 };
 car.draw(canvas,100,100,'right',false);
 car.draw(canvas,100,100,'left',true);
 assert.equal(draws.length,2);
 assert.equal(draws[0][1],0,'Parked image frame should be first');
 assert.equal(draws[1][1],88,'Seated Lage frame should be second');
 assert.equal(draws[0][3],88);
 assert.equal(draws[0][4],55);
 assert.equal(canvas.imageSmoothingEnabled,true,'Restore canvas smoothing after pixel rendering');
 assert.equal(car.spriteReady(),true);
});


test('Nytt spritesheet visar samma bil i åtta riktningar utan utjämning',()=>{
 const fs=readFileSync(new URL('../spel/rimforsa/car-directions.png',import.meta.url));
 assert.equal(fs.subarray(1,4).toString(),'PNG');
 assert.equal(fs.readUInt32BE(16),640);
 assert.equal(fs.readUInt32BE(20),60);
 const ImageMock=class {
  set src(url){
   this.complete=true;
   this.naturalWidth=url.includes('car-directions')?640:176;
   this.naturalHeight=url.includes('car-directions')?60:55;
  }
 };
 const context={window:{Image:ImageMock}};
 vm.runInNewContext(code,context);
 const car=context.window.RimforsaCar;
 assert.equal(car.directionSpriteReady(),true);
 const draws=[];
 const ctx={save(){},restore(){},translate(){},scale(){},fillRect(){},
  beginPath(){},rect(){},clip(){},
  imageSmoothingEnabled:true,drawImage(...args){draws.push(args);}
 };
 const dirs=['down','down-right','left','up-left','up','up-right','right','down-left'];
 dirs.forEach(dir=>car.draw(ctx,120,120,dir,true));
 assert.equal(draws.length,8);
 dirs.forEach((_,i)=>{
  assert.equal(draws[i][1],i*80,'Correct directional frame '+i);
  assert.equal(draws[i][3],80);
  assert.equal(draws[i][4],60);
 });
 assert.equal(ctx.imageSmoothingEnabled,true);
 car.draw(ctx,120,120,'right',false);
 assert.equal(draws.at(-1)[1],480,'Parked right-side car uses the same directional image');
 car.draw(ctx,120,120,'unknown',false);
 assert.equal(draws.at(-1)[1],480,'Unknown direction falls back to right-facing directional sprite');
});
