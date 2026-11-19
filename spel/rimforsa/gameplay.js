/* Lage i Rimforsa: självständig spelomgång för hjärtan och mynt. */
(function(root){
'use strict';
function createSession(target=20){
 let hearts=3,coins=0,spent=0,goal=Math.max(0,Math.floor(target)),lastHazard=null,finished=false;
 const snapshot=()=>({hearts,coins,spent,balance:coins-spent,goal,finished,lastHazard});
 return {
  snapshot,
  reset(nextGoal=goal){
   hearts=3;coins=0;spent=0;goal=Math.max(0,Math.floor(nextGoal));lastHazard=null;finished=false;
   return snapshot();
  },
  collect(amount=1){
   if(finished||hearts===0)return {...snapshot(),added:0,justWon:false};
   const before=coins,add=Math.max(0,Math.floor(Number(amount)||0));
   coins=Math.min(goal,coins+add);
   const justWon=goal>0&&before<goal&&coins===goal;
   if(justWon)finished=true;
   return {...snapshot(),added:coins-before,justWon};
  },
  spend(amount){
   const cost=Number(amount);
   if(!Number.isSafeInteger(cost)||cost<=0||hearts===0||cost>coins-spent)return {...snapshot(),paid:false};
   spent+=cost;
   return {...snapshot(),paid:true};
  },
  refund(amount){
   const value=Number(amount);
   if(!Number.isSafeInteger(value)||value<=0||value>spent)return {...snapshot(),refunded:false};
   spent-=value;
   return {...snapshot(),refunded:true};
  },
  touchHazard(id){
   if(id===null||id===undefined){lastHazard=null;return {...snapshot(),damaged:false,gameOver:false};}
   if(id===lastHazard||hearts===0)return {...snapshot(),damaged:false,gameOver:hearts===0};
   lastHazard=id;hearts=Math.max(0,hearts-1);
   return {...snapshot(),damaged:true,gameOver:hearts===0};
  }
 };
}
root.RimforsaGameplay={createSession};
})(window);
