/* Lage i Rimforsa: sparad bensin för bil och motorbåt. Påhittade spelpriser. */
(function(root){
'use strict';
const CAR_KEY='rimforsa-car-fuel-v1', BOAT_KEY='rimforsa-boat-fuel-v1';
const CAPACITY=100,COST=2;
function makeTank(key,unitsPerPercent,cost=COST){
 let level=0;
 try{
  const saved=JSON.parse(root.localStorage.getItem(key));
  if(saved&&Number.isFinite(saved.level))level=Math.max(0,Math.min(CAPACITY,saved.level));
 }catch(_){}
 function save(){try{root.localStorage.setItem(key,JSON.stringify({level}));}catch(_){}}
 function snapshot(){return {level,capacity:CAPACITY,percent:Math.round(level),cost};}
 function consume(distance){
  const amount=Number(distance);
  if(Number.isFinite(amount)&&amount>0){level=Math.max(0,level-amount/unitsPerPercent);save();}
  return snapshot();
 }
 function fill(){level=CAPACITY;save();return snapshot();}
 function reset(){level=0;save();return snapshot();}
 return {snapshot,consume,fill,reset};
}
const car=makeTank(CAR_KEY,27),boat=makeTank(BOAT_KEY,35),heli=makeTank('rimforsa-heli-fuel-v1',65,7);
// Bevara den tidigare API:n och sparnyckeln för bilen för bakåtkompatibilitet.
root.RimforsaFuel={snapshot:car.snapshot,consume:car.consume,fill:car.fill,reset:car.reset,
 car,boat,heli,COST};
})(window);
