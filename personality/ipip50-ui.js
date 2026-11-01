import {IPIP50_V1} from './ipip50-v1.js';
import {scoreIPIP50,compareIPIP50Profiles} from './ipip50-scoring.js';
import {loadMyIPIP50Answers,saveMyIPIP50Answer} from './ipip50-storage.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const ITEMS=IPIP50_V1.items;
const FACTORS=IPIP50_V1.factors;
const FIRST_UNANSWERED=answers=>Math.max(0,ITEMS.findIndex(item=>!Object.hasOwn(answers,item.id)));
const SUM_KEYS=FACTORS.map(f=>f.id);
function validatedPartnerPayload(data){
  if(!data||data.instrument_id!==IPIP50_V1.id||!Array.isArray(data.profiles)
    ||data.profiles.length!==2||!['teen','parent'].includes(data.viewer_role))return null;
  const roles=data.profiles.map(p=>p?.role).sort();
  if(roles.join(',')!=='parent,teen')return null;
  for(const p of data.profiles){
    if(!p.scores||Object.keys(p.scores).length!==5||Object.keys(p.scores).some(key=>!SUM_KEYS.includes(key)))return null;
    if(SUM_KEYS.some(key=>!Number.isInteger(p.scores[key])||p.scores[key]<10||p.scores[key]>50))return null;
  }
  return data;
}
function point(i,sum,radius=120){
  const a=-Math.PI/2+i*(2*Math.PI/5);
  const p=(sum-10)/40; // response range, never population percentile
  return [Math.round((220+Math.cos(a)*radius*p)*100)/100,Math.round((198+Math.sin(a)*radius*p)*100)/100];
}
const polygon=values=>values.map((v,i)=>point(i,v).join(',')).join(' ');
function radarSvg(self,other=null,role='parent'){
  const values=FACTORS.map(f=>self.byFactor[f.id].sum);
  const otherValues=other?FACTORS.map(f=>other.byFactor[f.id].sum):null;
  const rings=[10,20,30,40,50].map((n,i)=>
    '<polygon points="'+polygon(Array(5).fill(n))+'" fill="none" stroke="#657084" stroke-width="'+(i===4?'1.4':'0.7')+'" opacity=".65"/>').join('');
  const spokes=FACTORS.map((f,i)=>{
    const [x,y]=point(i,50);
    return '<line x1="220" y1="198" x2="'+x+'" y2="'+y+'" stroke="#657084" stroke-width=".8"/>';
  }).join('');
  const labels=['Extraversion','Vänlighet','Samvetsgrannhet','Emotionell stabilitet','Idéer och fantasi']
    .map((name,i)=>{
      const a=-Math.PI/2+i*Math.PI*2/5,x=220+Math.cos(a)*148,y=198+Math.sin(a)*148;
      const anchor='middle';
      const shortened=name==='Emotionell stabilitet'?'Emotionell balans':name;
      return '<text x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" text-anchor="'+anchor+'" font-size="12" fill="#e2e8f0">'+esc(shortened)+'</text>';
    }).join('');
  // Orange = teen, turquoise = parent, independent of viewer.
  const ownColor=role==='teen'?'#f8b55b':'#55d6d2';
  const otherColor=role==='teen'?'#55d6d2':'#f8b55b';
  const own='<polygon points="'+polygon(values)+'" fill="'+ownColor+'" fill-opacity=".12" stroke="'+ownColor+'" stroke-width="3" stroke-linejoin="round"/>';
  const second=otherValues?'<polygon points="'+polygon(otherValues)+'" fill="'+otherColor+'" fill-opacity=".06" stroke="'+otherColor+'" stroke-width="3" stroke-dasharray="7 5" stroke-linejoin="round"/>':'';
  return '<svg class="pf-radar" viewBox="0 0 440 398" role="img" aria-label="'+
    (other?'Femaxlig figur med två profiler. Fullständiga värden visas i tabellen nedan.':'Femaxlig figur med din profil. Fullständiga värden visas i tabellen nedan.')+
    '" xmlns="http://www.w3.org/2000/svg">'+rings+spokes+own+second+labels+'</svg>';
}
function profileFromSums(sums){
  return {complete:true,instrumentId:IPIP50_V1.id,version:IPIP50_V1.version,
    byFactor:Object.fromEntries(FACTORS.map(f=>[f.id,{sum:sums[f.id]}]))};
}
function table(self,other=null){
  return '<div class="pf-table-wrap"><table class="pf-table"><caption>Skalpoäng från 10 till 50, utan normjämförelse</caption><thead><tr><th scope="col">Dimension</th><th scope="col">Din profil</th>'+
    (other?'<th scope="col">Den andras</th>':'')+'</tr></thead><tbody>'+FACTORS.map(f=>'<tr><th scope="row">'+esc(f.labelSv)+'</th><td>'+self.byFactor[f.id].sum+' / 50</td>'+
    (other?'<td>'+other.byFactor[f.id].sum+' / 50</td>':'')+'</tr>').join('')+'</tbody></table></div>';
}
function statusPanel(message){return '<section class="live-panel"><p class="pf-status" role="status">'+esc(message)+'</p></section>';}

export function createPersonalityExperience({db,onRender,isSharingEnabled=false}){
  let viewer=null,sequence=0,answers={},loading=false,loaded=false,loadError='',saving=false,saveError='';
  let active=false,index=0,shareEnabled=false,shareBusy=false,shareError='',paired=null,partnerError='';
  const repaint=()=>onRender();
  function reset(userId=null){
    viewer=userId;sequence++;answers={};loading=false;loaded=false;loadError='';saving=false;
    saveError='';active=false;index=0;shareEnabled=false;shareBusy=false;shareError='';paired=null;partnerError='';
  }
  async function fetchPaired(userId,token){
    if(!isSharingEnabled)return;
    let result;
    try{result=await db.rpc('my_ipip50_shared_profiles');}catch(e){result={error:e};}
    if(token!==sequence||viewer!==userId)return;
    if(result?.error){partnerError='Kunde inte kontrollera delningen. Försök uppdatera.';paired=null;}
    else{partnerError='';paired=validatedPartnerPayload(result?.data);}
  }
  async function refreshShared(){
    if(!viewer||!loaded||!isSharingEnabled||!shareEnabled||active||saving||shareBusy)return;
    const id=viewer,token=sequence,before=JSON.stringify(paired);
    await fetchPaired(id,token);
    if(id===viewer&&token===sequence&&before!==JSON.stringify(paired))repaint();
  }
  async function load(userId){
    if(!userId)return;
    const token=++sequence;
    viewer=userId;loading=true;loaded=false;loadError='';saveError='';partnerError='';paired=null;repaint();
    let loadedAnswers,consent;
    try{
      loadedAnswers=await loadMyIPIP50Answers(db);
      if(isSharingEnabled){
        const result=await db.from('personality_share_preferences').select('share_enabled')
          .eq('user_id',userId).eq('instrument_id',IPIP50_V1.id).maybeSingle();
        if(result.error)throw result.error;
        consent=result.data?.share_enabled===true;
      }
    }catch(e){
      if(token!==sequence||viewer!==userId)return;
      loading=false;loadError='Kunde inte hämta dina privata svar. Försök igen.';repaint();return;
    }
    if(token!==sequence||viewer!==userId)return;
    answers=loadedAnswers.answers;shareEnabled=!!consent;index=FIRST_UNANSWERED(answers);
    loaded=true;loading=false;
    if(isSharingEnabled&&shareEnabled&&loadedAnswers.status.complete)await fetchPaired(userId,token);
    if(token===sequence&&viewer===userId)repaint();
  }
  function start(){active=true;saveError='';index=FIRST_UNANSWERED(answers);repaint();}
  function render({isPaired=false,viewerRole='parent'}={}){
    const heading='<section class="pf-intro"><span class="swipe-eyebrow">LÄR KÄNNA DIG SJÄLV</span><h1>Min personlighet</h1><p>Utforska fem sidor av hur du brukar vara. Det finns inga rätt eller fel svar.</p></section>';
    if(!viewer)return heading+statusPanel('Logga in för att göra testet.');
    if(loading)return heading+statusPanel('Hämtar dina svar…');
    if(loadError)return heading+'<section class="live-panel"><p role="alert">'+esc(loadError)+'</p><button class="live-button" data-pf-action="reload" type="button">Försök igen</button></section>';
    if(!loaded)return heading+statusPanel('Förbereder testet…');
    const result=scoreIPIP50(answers),count=result.answeredCount,complete=result.complete;
    if(active){
      const item=ITEMS[index],old=answers[item.id],progress=Math.round(100*count/50);
      return heading+'<section class="live-panel pf-survey"><div class="pf-counter"><span>Fråga '+(index+1)+' av 50</span><span>'+count+' besvarade</span></div>'+
        '<div class="pf-progress" role="progressbar" aria-label="Besvarade frågor" aria-valuemin="0" aria-valuemax="50" aria-valuenow="'+count+'"><span style="width:'+progress+'%"></span></div>'+
        '<fieldset class="pf-question"'+(saving?' disabled':'')+'><legend>'+esc(item.sv)+'</legend>'+
        '<p class="live-muted">Hur väl stämmer det här på dig?</p>'+
        IPIP50_V1.responseOptions.map(option=>'<label class="pf-option"><input type="radio" name="pf-answer" data-pf-answer="'+esc(item.id)+'" value="'+option.value+'"'+(old===option.value?' checked':'')+'><span>'+esc(option.label)+'</span></label>').join('')+'</fieldset>'+
        '<div class="pf-controls"><button type="button" data-pf-action="prev"'+(index===0||saving?' disabled':'')+'>← Föregående</button>'+
        '<button type="button" data-pf-action="next"'+(index===49||saving?' disabled':'')+'>Nästa →</button>'+
        '<button type="button" data-pf-action="overview"'+(saving?' disabled':'')+'>Spara och avsluta för nu</button></div>'+
        '<p class="pf-status" role="status">'+esc(saving?'Sparar privat i ditt konto…':saveError||'Dina svar sparas bara i ditt konto. Du kan ändra dina svar senare.')+'</p>'+
        (complete?'<button type="button" class="live-button" data-pf-action="result">Se min profil</button>':'')+'</section>';
    }
    if(!complete){
      return heading+'<section class="live-panel pf-overview"><h2>'+(count?'Fortsätt där du slutade':'Börja med 50 påståenden')+'</h2>'+
        '<p>Du svarar på 50 korta påståenden, ett i taget. Välj det som bäst beskriver hur du brukar vara. Du kan pausa, gå tillbaka och ändra svar. Det finns ingen tidsgräns.</p>'+
        '<p>Det här är en preliminär svensk version av IPIP-50, inte ett normerat eller diagnostiskt test. Varken föräldern eller tonåringen får automatiskt se den andras svar eller resultat.</p>'+
        '<p><strong>'+count+' av 50</strong> besvarade.</p><div class="pf-progress"><span style="width:'+Math.round(count/50*100)+'%"></span></div>'+
        '<button type="button" class="live-button" data-pf-action="start">'+(count?'Fortsätt testet':'Börja testet')+'</button></section>';
    }
    const own=result;
    let other=null,role=viewerRole;
    if(paired){
      role=paired.viewer_role;
      const partner=paired.profiles.find(p=>p.role!==role);
      if(partner)other=profileFromSums(partner.scores);
    }
    const sharing=isSharingEnabled?'<section class="live-panel pf-sharing"><h2>Frivillig delning</h2><p>Det är bara de fem summerade skalpoängen som kan delas, aldrig enskilda svar. Den andra får inte se din profil förrän ni båda aktivt har valt delning och fortfarande är parade.</p>'+
      (!isPaired?'<p>Para ihop två konton innan ni kan dela profiler.</p>':
        '<p><strong>Din inställning:</strong> '+(shareEnabled?'Delning aktiverad':'Privat')+'</p>'+
        '<button type="button" class="live-button" data-pf-action="'+(shareEnabled?'withdraw':'share')+'"'+(shareBusy?' disabled':'')+'>'+(shareBusy?'Sparar…':shareEnabled?'Sluta dela min profil':'Jag vill dela mina fem skalpoäng')+'</button>')+
      (shareError?'<p role="alert">'+esc(shareError)+'</p>':'')+
      (partnerError?'<p role="alert">'+esc(partnerError)+'</p>':'')+
      (shareEnabled&&!paired?'<p>En gemensam jämförelse visas först när båda har färdiga profiler och har valt att dela dem.</p>':'')+
      (shareEnabled&&isPaired?'<button type="button" data-pf-action="refresh-share">Uppdatera jämförelse</button>':'')+'</section>':
      '<section class="live-panel"><h2>Delning ännu inte aktiverad</h2><p>Dina 50 svar och din profil är privata. Jämförelse med den andra familjemedlemmen aktiveras efter kontroll av serverbehörigheter och frivilligt samtycke.</p></section>';
    let comparison='';
    if(other&&role&&shareEnabled){
      // The server returns only five scores after confirming two current consents.
      const rows=compareIPIP50Profiles(own,other);
      const ordered=[...rows].sort((a,b)=>Math.abs(a.difference)-Math.abs(b.difference));
      const close=ordered.slice(0,2);
      const distant=[...ordered].reverse().slice(0,2);
      const sharedIdentical=rows.every(r=>r.difference===0);
      const topics={
        extraversion:'När tycker ni om att umgås och när vill ni hellre vara för er själva?',
        agreeableness:'Vad uppskattar var och en av er när någon försöker visa omtanke?',
        conscientiousness:'Hur vill ni planera saker som behöver bli gjorda?',
        emotional_stability:'Vad brukar hjälpa när känslor blir starka eller stressen ökar?',
        intellect_imagination:'Vad är ni nyfikna på och vad vill ni upptäcka tillsammans?'
      };
      const reflections='<section class="pf-reflections"><h3>Det ni verkar likna varandra i</h3>'+
        '<p class="live-muted">På de här skalorna ligger era svarssummor närmast varandra. Det behöver inte betyda att ni alltid fungerar likadant.</p>'+
        '<ul>'+close.map(r=>'<li>'+esc(r.labelSv)+'</li>').join('')+'</ul>'+
        '<h3>Där era självskattningar skiljer sig</h3>'+
        (sharedIdentical?'<p>Era svarssummor är lika inom samtliga fem skalor. Ni kan ändå uppleva situationer på olika sätt.</p>':
         '<p class="live-muted">De här skillnaderna är störst <em>inom just era svar</em>, inte statistiskt säkerställda olikheter.</p>'+
         '<ul>'+distant.map(r=>'<li><strong>'+esc(r.labelSv)+'</strong> — '+Math.abs(r.difference)+' poäng mellan era summor.</li>').join('')+'</ul>')+
        '<h3>Frågor att utforska tillsammans</h3><ul>'+
        distant.map(r=>'<li>'+esc(topics[r.factorId])+'</li>').join('')+
        '</ul><p class="live-muted">Samtalsfrågorna är redaktionella förslag, inte individuella psykologiska råd.</p></section>';
      comparison='<section class="live-panel pf-comparison"><h2>Våra profiler</h2><p>Två självskattningar på samma svarsskala, inte ett mått på hur bra någon är som person.</p>'+
        '<div class="pf-legend" style="--pf-own:'+(role==='teen'?'#f8b55b':'#55d6d2')+';--pf-other:'+(role==='teen'?'#55d6d2':'#f8b55b')+'"><span class="pf-legend-own">Din profil</span><span class="pf-legend-other">Den andras profil</span></div>'+
        radarSvg(own,other,role)+table(own,other)+
        '<p class="live-muted">Skillnaderna visas utan gränsvärden. De kan vara utgångspunkt för samtal, inte bevis för att ni fungerar olika.</p>'+
        reflections+'</section>';
    }
    return heading+'<section class="live-panel pf-results"><h2>Din profil</h2><p>De fem skalorna sammanfattar dina svar. De är inte percentiler och inte jämförda med någon svensk normgrupp.</p>'+
      '<div class="pf-legend" style="--pf-own:'+(role==='teen'?'#f8b55b':'#55d6d2')+'"><span class="pf-legend-own">Du</span></div>'+radarSvg(own,null,role)+table(own)+
      '<p class="live-muted">Värdena beskriver din skattning inom svarsspannet 10–50. Högre eller lägre är varken bättre eller sämre. Översättningen behöver fortfarande prövas vetenskapligt.</p>'+
      '<button type="button" data-pf-action="review">Granska eller ändra mina svar</button></section>'+sharing+comparison;
  }
  async function handleClick(element,{isPaired=false}={}){
    const btn=element?.closest?.('[data-pf-action]');
    if(!btn||!viewer||saving||shareBusy)return false;
    if(btn.dataset.pfAction==='reload'){await load(viewer);return true;}
    if(!loaded)return false;
    const action=btn.dataset.pfAction;
    if(action==='start'||action==='review'){start();if(action==='review')index=0;}
    else if(action==='prev'){index=Math.max(0,index-1);repaint();}
    else if(action==='next'){index=Math.min(49,index+1);repaint();}
    else if(action==='overview'||action==='result'){active=false;repaint();}
    else if(action==='reload'){await load(viewer);}
    else if(action==='refresh-share'){const tok=sequence,id=viewer;await fetchPaired(id,tok);if(tok===sequence)repaint();}
    else if(['share','withdraw'].includes(action)&&isSharingEnabled&&isPaired){
      const id=viewer,token=sequence;shareBusy=true;shareError='';repaint();
      let r;
      try{r=await db.rpc('set_my_ipip50_share',{p_share:action==='share'});}catch(e){r={error:e};}
      if(token!==sequence||viewer!==id)return true;
      shareBusy=false;
      if(r?.error){shareError='Kunde inte ändra delningen. Försök igen.';}
      else{shareEnabled=action==='share';paired=null;if(shareEnabled)await fetchPaired(id,token);}
      if(token===sequence&&viewer===id)repaint();
    }else return false;
    return true;
  }
  async function handleChange(target){
    if(!target?.matches?.('input[data-pf-answer]')||!active||saving||!viewer||!loaded)return false;
    const item=ITEMS[index],value=Number(target.value);
    if(target.dataset.pfAnswer!==item.id||!Number.isInteger(value)||value<1||value>5)return false;
    const token=sequence,id=viewer;
    saving=true;saveError='';repaint();
    try{await saveMyIPIP50Answer(db,item.id,value);}
    catch(e){if(token===sequence&&viewer===id){saving=false;saveError='Kunde inte spara svaret. Välj ett alternativ igen när anslutningen fungerar.';repaint();}return true;}
    if(token!==sequence||viewer!==id)return true;
    answers[item.id]=value;saving=false;
    if(index<49)index++;
    else active=false;
    paired=null;shareError='';
    repaint();
    return true;
  }
  return {reset,load,refreshShared,render,handleClick,handleChange};
}
