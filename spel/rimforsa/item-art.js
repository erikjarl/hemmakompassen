/* Lage i Rimforsa – originalritade 16-bitars föremålsikoner till väskan. */
(function(root){
'use strict';
// Varje 16x16-mönster ritas skarpt som 32x32 pixelkonst.
// Transparent bakgrund: '.'; färgpalett per föremål.
const art={
 nyckelring:{
  palette:{d:'#433930',m:'#89929a',l:'#dce6df',h:'#faf5d4',k:'#bb8e51'},
  rows:[
 '................','......mmmm......','.....mllllm.....','....ml....lm....',
 '....ml....lm....','....ml....lm....','.....mllllm.....','......mmmm......',
 '.......dd.......','.......ml.......','.......ml.......','.......ml.......',
 '.......mlll.....','.......mlmm.....','.......mlll.....','................'
 ]},
 fotboll:{
  palette:{o:'#24352d',w:'#f3e7c9',g:'#9fbd99'},
  rows:[
 '................','.....oooooo.....','...oowwwwwwoo...','..owwwwwwwwwwo..',
 '.owwwwwoowwwwwo.','.owwwwooowwwwwo','owwwoooooowwwwo.',
 'owwwoooooowwwwo.','owwwwooooowwwwo.','owwwwwwwwwwwwo.',
 '.owwwwowwwwowwo.','.owwwwoowwwoo..','..owwwwwwwwwwo..',
 '...oowwwwwwoo...','.....oooooo.....','................'
 ]},
 kritor:{
  palette:{r:'#df6158',b:'#5e8dcd',y:'#f2d46b',p:'#f5e5b7',d:'#4e483b'},
  rows:[
 '................','................','...rr..bb..yy...','..rrr.bbb.yyy...',
 '..rrr.bbb.yyy...','..rrr.bbb.yyy...','..rrr.bbb.yyy...',
 '..rrr.bbb.yyy...','..ppp.ppp.ppp...','..ppp.ppp.ppp...',
 '..rrr.bbb.yyy...','..rrr.bbb.yyy...','..ddd.ddd.ddd...',
 '................','................','................'
 ]},
 snacka:{
  palette:{s:'#e7b17e',l:'#ffe2af',d:'#8b5b56',p:'#f4cbb5'},
  rows:[
 '................','.......dd.......','......dssd......','.....dssssd.....',
 '....dssllssd....','...dsslsslssd...','..dsslsssslsd...','..dssllssllsd...',
 '.dssslsssslsds..','.dsslssllsssd...','..dsssssssssd...',
 '...dssllsssd....','....dsssssd.....','.....ddddd......',
 '................','................'
 ]},
 paronglass:{
  palette:{g:'#a9cc73',l:'#dff0a5',d:'#5d894b',w:'#f8e9c7',b:'#9f7050'},
  rows:[
 '................','......gggg......','....ggllllgg....','...gllllllllg...',
 '...glllllgglg...','...gllllllllg...','....ggllllgg....',
 '......gllg......','......gllg......','.....wwwww......',
 '.....wbbbw......','.....wbbbw......','......bbb.......',
 '.......b........','................','................'
 ]},
 vaniljglass:{
  palette:{v:'#fff2ca',s:'#ead8a8',b:'#ac7547',d:'#865638'},
  rows:[
 '................','.......vv.......','.....vvvvvv.....','....vssssvv.....',
 '....vvvvvvv.....','...vsssssvvv....','...vvvvvvvvv....',
 '....ssssss......','.....vvvvv......','.....bbbbb......',
 '......bbb.......','......bbb.......','.......b........',
 '................','................','................'
 ]},
 ananaspizza:{
  palette:{c:'#b76a3d',y:'#efcb6a',r:'#be5846',p:'#f5e39c',g:'#597b45'},
  rows:[
 '................','..cccccccccccc..','..cyyyyyyyyyyyc..','...cyyyyyyyyyc...','...cyyrryyyyyc...',
 '....cyyppyyyc....','....cyyyyrryc....','.....cyyyppc.....',
 '.....cyyyyyc.....','......cyggc......','......cyyc.......',
 '.......cc........','.......c........','................','................','................'
 ]}
};
const descriptions={
 nyckelring:'En glänsande nyckelring som Lage hittade vid bensinmacken.',
 fotboll:'En fotboll att leka med vid Hackelhallen.',
 kritor:'Färgglada kritor från förskolan.',
 snacka:'En vacker snäcka som Lage hittade vid Åsundabadet.',
 paronglass:'En grön päronglass från ICA Melkers.',
 vaniljglass:'En krämig vaniljglass från ICA Melkers.',
 ananaspizza:'En varm pizzaslice med ananas från Bella Donna.'
};
function draw(canvas,id){
 const entry=art[id];if(!entry||!canvas?.getContext)return false;
 const ctx=canvas.getContext('2d');if(!ctx)return false;
 ctx.clearRect(0,0,canvas.width,canvas.height);
 ctx.imageSmoothingEnabled=false;
 const pixel=Math.min(canvas.width/16,canvas.height/16);
 const ox=(canvas.width-16*pixel)/2,oy=(canvas.height-16*pixel)/2;
 for(let y=0;y<16;y++)for(let x=0;x<16;x++){
  const key=entry.rows[y]?.[x],color=entry.palette[key];
  if(color){ctx.fillStyle=color;ctx.fillRect(Math.floor(ox+x*pixel),Math.floor(oy+y*pixel),Math.ceil(pixel),Math.ceil(pixel))}
 }
 return true;
}
root.RimforsaItemArt={draw,descriptions};
})(typeof window!=='undefined'?window:globalThis);
