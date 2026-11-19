/* Lage i Rimforsa: sparad bilbensin. Fantasipriser, inte verkliga pumppriser. */
(function(root){
'use strict';
const KEY='rimforsa-car-fuel-v1',CAPACITY=100,COST=2;
let level=0;
try{const saved=JSON.parse(root.localStorage.getItem(KEY));if(saved&&Number.isFinite(saved.level))level=Math.max(0,Math.min(CAPACITY,saved.level));}catch(_){}
function save(){try{root.localStorage.setItem(KEY,JSON.stringify({level}));}catch(_){}}
function snapshot(){return {level,capacity:CAPACITY,percent:Math.round(level),cost:COST};}
function consume(distance){const amount=Math.max(0,Number(distance)||0)/27;level=Math.max(0,level-amount);save();return snapshot();}
function fill(){level=CAPACITY;save();return snapshot();}
function reset(){level=0;save();return snapshot();}
root.RimforsaFuel={snapshot,consume,fill,reset,COST};
})(window);
