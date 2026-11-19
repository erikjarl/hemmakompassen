/* Lage i Rimforsa: små fynd sparas separat från mynt och hjärtan. */
(function(root){
 'use strict';
 const KEY='lage-rimforsa-inventory-v1';
 const ITEMS=Object.freeze([
  {id:'fotboll',site:'Hackelhallen',name:'Fotboll',icon:'⚽'},
  {id:'kritor',site:'Förskolan Hackel',name:'Färgkritor',icon:'🖍️'},
  {id:'snacka',site:'Åsundabadet',name:'Snäcka',icon:'🐚'},
  {id:'nyckelring',site:'Bensinmacken',name:'Nyckelring',icon:'🔑'},
  {id:'paronglass',site:'ICA Melkers',name:'Päronglass',icon:'🍐'},
  {id:'vaniljglass',site:'ICA Melkers',name:'Vaniljglass',icon:'🍦'}
 ]);
 const known=new Map(ITEMS.map(item=>[item.id,item]));
 function createInventory(storage){
  let ids=[];
  let available=!!storage;
  try{
   const parsed=JSON.parse(storage.getItem(KEY)||'[]');
   if(Array.isArray(parsed))ids=[...new Set(parsed.filter(id=>typeof id==='string'&&known.has(id)))];
  }catch(e){available=false;ids=[];}
  function save(){
   if(!available)return false;
   try{storage.setItem(KEY,JSON.stringify(ids));return true;}
   catch(e){available=false;return false;}
  }
  return {
   items:()=>ids.map(id=>({...known.get(id)})),
   available:()=>available,
   findAt:site=>ITEMS.find(item=>item.site===site&&!['paronglass','vaniljglass'].includes(item.id)&&!ids.includes(item.id))||null,
   collectAt(site){
    const item=ITEMS.find(entry=>entry.site===site&&!['paronglass','vaniljglass'].includes(entry.id)&&!ids.includes(entry.id));
    if(!item)return null;
    ids.push(item.id);return {item:{...item},saved:save()};
   },
   has:id=>ids.includes(id),
   addPurchase(id){
    if(!known.has(id)||!['paronglass','vaniljglass'].includes(id)||ids.includes(id))return {added:false,saved:false};
    ids.push(id);
    return {added:true,saved:save()};
   },
   clear(){ids=[];return save();},
   total:()=>ITEMS.length
  };
 }
 root.RimforsaInventory={createInventory,items:ITEMS,key:KEY};
})(typeof window!=='undefined'?window:globalThis);
