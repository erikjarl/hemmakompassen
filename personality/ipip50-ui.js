import {IPIP50_V1} from './ipip50-v1.js';
import {scoreIPIP50} from './ipip50-scoring.js';
import {buildIPIP50FamilyInsights} from './ipip50-family-insights.js?v=20261101-family-reflections3';
import {richFamilyReflection} from './ipip50-family-copy.js?v=20261101-family-reflections3';
import {IPIP50_REFERENCE,IPIP50_PERCENTILE_BANDS,approximateReferencePercentile,referenceLimits,describeReferenceProfile,formatSv} from './ipip50-reference.js?v=20261101-family-reflections3';
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

const clampScore=value=>Math.max(10,Math.min(50,value));
// Concentric SD regions use each factor's own M and SD, so their
// contours are not circles on the raw 10–50 axes.
function sdContour(level){
  return FACTORS.map(f=>{
    const n=referenceLimits(f.id);
    return clampScore(n.mean+level*n.sd);
  });
}
function polygonPath(scores){
  return scores.map((value,i)=>(i===0?'M':'L')+point(i,value).join(' ')).join(' ')+' Z';
}
function radarSvg(self,other=null,role='parent'){
  const values=FACTORS.map(f=>self.byFactor[f.id].sum);
  const otherValues=other?FACTORS.map(f=>other.byFactor[f.id].sum):null;
  const means=FACTORS.map(f=>referenceLimits(f.id).mean);
  const rings=[10,20,30,40,50].map((n,i)=>
    '<polygon points="'+polygon(Array(5).fill(n))+'" fill="none" stroke="#657084" stroke-width="'+(i===4?'1.4':'0.7')+'" opacity=".65"/>').join('');
  const spokes=FACTORS.map((f,i)=>{
    const [x,y]=point(i,50);
    return '<line x1="220" y1="198" x2="'+x+'" y2="'+y+'" stroke="#657084" stroke-width=".8"/>';
  }).join('');
  const labels=['Extraversion','Vänlighet','Samvetsgrannhet','Emotionell stabilitet','Idéer och fantasi']
    .map((name,i)=>{
      const a=-Math.PI/2+i*Math.PI*2/5,x=220+Math.cos(a)*148,y=198+Math.sin(a)*148;
      const shortened=name==='Emotionell stabilitet'?'Emotionell balans':name;
      return '<text x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" text-anchor="middle" font-size="12" fill="#e2e8f0">'+esc(shortened)+'</text>';
    }).join('');
  const outer=sdContour(1),inner=sdContour(-1);
  const band='<path d="'+polygonPath(outer)+' '+polygonPath(inner)+
    '" fill="#d1d7e4" fill-rule="evenodd" fill-opacity=".16" stroke="none"/>';
  const tails=[-2,2].map(level=>'<polygon points="'+polygon(sdContour(level))+
    '" fill="none" stroke="#aab5cb" stroke-width="1.1" opacity=".75" stroke-dasharray="2 5"/>').join('');
  const referenceMean='<polygon points="'+polygon(means)+
    '" fill="none" stroke="#f0f4ff" stroke-width="2" stroke-dasharray="5 4" opacity=".95"/>';
  const ownColor=role==='teen'?'#f8b55b':'#55d6d2';
  const otherColor=role==='teen'?'#55d6d2':'#f8b55b';
  const own='<polygon points="'+polygon(values)+'" fill="'+ownColor+'" fill-opacity=".12" stroke="'+ownColor+'" stroke-width="3.3" stroke-linejoin="round"/>';
  const second=otherValues?'<polygon points="'+polygon(otherValues)+'" fill="'+otherColor+'" fill-opacity=".06" stroke="'+otherColor+'" stroke-width="3" stroke-dasharray="8 5" stroke-linejoin="round"/>':'';
  return '<svg class="pf-radar" viewBox="0 0 440 398" role="img" aria-label="'+
    (other?'Era två profiler, amerikanskt vuxenmedelvärde samt plus och minus en och två standardavvikelser. Exakta värden finns i tabellen.':
      'Din profil, amerikanskt vuxenmedelvärde samt plus och minus en och två standardavvikelser. Exakta värden finns i tabellen.')+
    '" xmlns="http://www.w3.org/2000/svg">'+rings+spokes+band+tails+referenceMean+own+second+labels+'</svg>';
}

function percentileChart(self,other=null){
  const bandKey='<div class="pf-band-key" aria-label="Fem jämförelsezoner utifrån standardavvikelser">'+
    IPIP50_PERCENTILE_BANDS.map(b=>'<span class="pf-band-key-item"><i class="pf-band-swatch pf-band-'+esc(b.id)+'" aria-hidden="true"></i>'+
      esc(b.label)+'</span>').join('')+'</div>';
  const rows=FACTORS.map(f=>{
    const own=approximateReferencePercentile(f.id,self.byFactor[f.id].sum);
    const partner=other?approximateReferencePercentile(f.id,other.byFactor[f.id].sum):null;
    const title= f.id==='emotional_stability'?'Emotionell balans':f.labelSv;
    const ownPct=own.percentile.toFixed(6);
    const otherPct=partner?.percentile.toFixed(6);
    const ownText='Du: '+own.category+' (P≈'+Math.round(own.percentile)+')';
    const partnerText=partner?'Den andra: '+partner.category+' (P≈'+Math.round(partner.percentile)+')':'';
    const aria=title+'. '+ownText+(partner?'. '+partnerText:'')+
      '. Placeringar är normalmodellerade uppskattningar, inte observerade percentiler.';
    return '<section class="pf-scale-row"><h3>'+esc(title)+'</h3>'+
      '<div class="pf-scale-track" role="img" aria-label="'+esc(aria)+'">'+
      '<div class="pf-scale-bands" aria-hidden="true">'+
      IPIP50_PERCENTILE_BANDS.map(b=>'<span class="pf-band pf-band-'+esc(b.id)+'" style="left:'+b.start.toFixed(6)+'%;width:'+(b.end-b.start).toFixed(6)+'%"></span>').join('')+
      '</div><div class="pf-scale-grid" aria-hidden="true"><i style="left:25%"></i><i class="pf-median" style="left:50%"></i><i style="left:75%"></i></div>'+
      '<span class="pf-score-dot pf-score-own" style="left:'+ownPct+'%" aria-hidden="true" title="'+esc(ownText)+'"></span>'+
      (partner?'<span class="pf-score-dot pf-score-other" style="left:'+otherPct+'%" aria-hidden="true" title="'+esc(partnerText)+'"></span>':'')+
      '</div><div class="pf-pct-axis" aria-hidden="true"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>'+
      '<p class="pf-scale-summary">'+esc(ownText)+(partner?'<span> · '+esc(partnerText)+'</span>':'')+'</p></section>';
  }).join('');
  return '<div class="pf-percentile-chart">'+
    '<div class="pf-legend" style="--pf-own:#55d6d2;--pf-other:#f8b55b"><span class="pf-legend-own">Din profil</span>'+
    (other?'<span class="pf-legend-other">Den andras profil</span>':'')+'</div>'+
    '<p class="pf-chart-description"><strong>Uppskattad percentil:</strong> 50 ligger exakt i mitten och 75 vid tre fjärdedelar. Färgzonerna motsvarar standardavvikelser.</p>'+
    bandKey+rows+
    '<details class="pf-chart-help"><summary>Hur ska jag tolka percentilerna?</summary>'+
    '<p>P≈75 betyder att ditt resultat uppskattas ligga högre än cirka 75 % i en hypotetisk normalfördelning med det amerikanska vuxenurvalets medelvärde och standardavvikelse. Det är <strong>inte</strong> en uppmätt percentil i urvalet eller en svensk norm.</p>'+
    '<p>Den gröna mittzonen motsvarar −1 till +1 SD (cirka percentil 16–84), zonerna utanför motsvarar 1–2 SD och de smala ändarna resultat bortom 2 SD. Poängen är diskreta och den svenska översättningen är inte validerad.</p></details></div>';
}

function referenceLegend(){
  return '<div class="pf-reference-legend" aria-label="Förklaring av referenslinjer">'+
    '<span class="pf-reference-mean">Vuxna: medelvärde</span>'+
    '<span class="pf-reference-sd">Vuxna: ±1 SD (grått fält)</span>'+
    '<span class="pf-reference-two">Vuxna: ±2 SD (prickade gränser)</span></div>';
}
function referenceFeedback(profile,roleLabel='Dina'){
  const selfLabel=roleLabel==='Dina'?'ditt värde':'den andras värde';
  const positions=describeReferenceProfile(profile);
  return '<div class="pf-reference-feedback"><h3>'+esc(roleLabel)+' resultat jämfört med vuxenreferensen</h3>'+
    '<ul>'+positions.map(p=>{
      const factor=FACTORS.find(f=>f.id===p.factorId);
      return '<li><strong>'+esc(factor.labelSv)+'</strong>: '+esc(p.description)+
        ' (M '+formatSv(p.mean,2)+', SD '+formatSv(p.sd,2)+', '+esc(selfLabel)+' '+p.score+
        '; '+formatSv(p.z)+' SD från medelvärdet.)</li>';
    }).join('')+'</ul></div>';
}
function referenceCaveat(){
  return '<p class="pf-reference-caveat">'+esc(IPIP50_REFERENCE.disclaimer)+
    ' ”Mycket över/under genomsnittet” motsvarar mer än två SD i modellen. P≈-värden är beräknade under antagande om normalfördelning, inte direkt observerade percentiler eller diagnoser. '+
    'Under 18 år beskriver jämförelsen fortfarande en <strong>vuxen</strong> referens, inte en tonårsnorm. '+
    '<a href="'+esc(IPIP50_REFERENCE.studyUrl)+'" target="_blank" rel="noopener noreferrer">Referensstudie och urval</a>.</p>';
}

function profileFromSums(sums){
  return {complete:true,instrumentId:IPIP50_V1.id,version:IPIP50_V1.version,
    byFactor:Object.fromEntries(FACTORS.map(f=>[f.id,{sum:sums[f.id]}]))};
}
function table(self,other=null){
  return '<div class="pf-table-wrap"><table class="pf-table"><caption>Råpoäng (10–50) och amerikansk vuxenreferens. M = medelvärde; SD = standardavvikelse.</caption><thead><tr><th scope="col">Dimension</th><th scope="col">Du</th>'+
    (other?'<th scope="col">Den andra</th>':'')+'<th scope="col">Vuxna M</th><th scope="col">Vuxna SD</th><th scope="col">Du från M</th></tr></thead><tbody>'+FACTORS.map(f=>{
      const ref=referenceLimits(f.id),own=describeReferenceProfile(self).find(p=>p.factorId===f.id);
      return '<tr><th scope="row">'+esc(f.labelSv)+'</th><td>'+self.byFactor[f.id].sum+'</td>'+
      (other?'<td>'+other.byFactor[f.id].sum+'</td>':'')+
      '<td>'+formatSv(ref.mean,2)+'</td><td>'+formatSv(ref.sd,2)+'</td>'+
      '<td>'+formatSv(own.z,1)+' SD</td></tr>';
    }).join('')+'</tbody></table></div>';
}

function familyReflectionPanel(parentProfile,teenProfile,viewerRole){
  const parent=Object.fromEntries(FACTORS.map(f=>[f.id,parentProfile.byFactor[f.id].sum]));
  const teen=Object.fromEntries(FACTORS.map(f=>[f.id,teenProfile.byFactor[f.id].sum]));
  const summary=buildIPIP50FamilyInsights({parent,teen});
  const parentView=viewerRole==='parent';
  const roleHeading=parentView?'För dig som förälder':'För dig som tonåring';
  const roleIntro=parentView
    ?'Skillnader kan skapa missförstånd även när båda vill väl. Som vuxen har du ett särskilt ansvar att lyssna, erbjuda stöd och anpassa dina förväntningar. Använd texterna som förslag att pröva, inte som sanningar om er.'
    :'Det kan vara svårt när du och din förälder tänker, reagerar eller planerar olika. Dina behov får också ta plats, och du ska inte ensam behöva lösa konflikter. Texterna ger idéer att prova, inte facit på hur ni är.';
  const formatTitle=items=>items.map(i=>'”'+i.label.toLowerCase()+'”').join(', ').replace(/, ([^,]+)$/,' och $1');
  const big=summary.notable; // All qualifying differences, largest first.
  const close=summary.similar; // All qualifying similarities, closest first.
  const lead=big.length
    ?'Störst skillnader i era svar syns inom '+esc(formatTitle(big))+'. Skillnaderna kan vara värda att utforska, men behöver inte innebära något problem.'
    :'Era fem självskattningar visar ingen tydlig skillnad enligt våra preliminära gränser.';
  const similarities=close.length
    ?'Ni beskriver er samtidigt ganska lika inom '+esc(formatTitle(close))+'. Det kan ge en gemensam utgångspunkt.'
    :'Ingen skala ligger inom vår gräns för särskilt liknande svar. Ni kan ändå känna igen er i varandra på många sätt.';
  const story=(item,index)=>{
    const detail=richFamilyReflection(item,viewerRole);
    const type=item.status==='similarity'?'Likhet att bygga vidare på':item.status==='notable'?'Skillnad att utforska':'Ytterligare en nyans';
    const opening=''; // Role-specific prose already expresses similarity without unvalidated raw-score labels.
    return '<article class="pf-insight-card pf-insight-'+esc(item.status)+'">'+
      '<div class="pf-insight-header"><span class="pf-insight-type">'+esc(type)+'</span><h5>'+esc(item.label)+'</h5></div>'+
      opening+'<p class="pf-insight-narrative">'+esc(detail.paragraph)+'</p>'+
      '<p class="pf-insight-question"><strong>En fråga att ta med er:</strong> '+esc(item.question)+'</p>'+
      '<div class="pf-insight-resource"><a href="'+esc(detail.resource.href)+'">Utforska i '+esc(detail.resource.title)+'</a>'+
      '<p>'+esc(detail.resource.instruction)+'</p></div></article>';
  };
  const moderate=summary.moderate; // No arbitrary promotion to "large difference".
  return '<section class="pf-family-reflections" aria-label="Personlig återkoppling om era profiler">'+
    '<h3>Att förstå era likheter och olikheter</h3>'+
    '<p class="pf-insight-audience">'+esc(roleHeading)+'</p>'+
    '<p class="pf-insight-intro">'+esc(roleIntro)+'</p>'+
    '<p class="pf-insight-overview">'+lead+' '+similarities+'</p>'+
    '<div class="pf-insight-group"><h4>Skillnader som kan vara värda att prata om</h4>'+
    (big.length?big.map(story).join(''):'<p class="pf-insight-empty">Här finns inga stora skillnader att lyfta fram. I vardagen kan ni ändå ha olika önskemål, även om ni svarat liknande.</p>')+
    '</div><div class="pf-insight-group"><h4>Likheter som kan hjälpa er</h4>'+
    (close.length?close.map(story).join(''):'<p class="pf-insight-empty">Ingen skala ligger särskilt nära enligt vår gräns. Det säger inte att ni saknar gemensamma intressen eller värderingar.</p>')+
    '</div>'+
    (moderate.length?'<details class="pf-insight-more"><summary>Även andra skillnader kan vara intressanta ('+moderate.length+')</summary>'+
      moderate.map(story).join('')+'</details>':'')+
    '<details class="pf-insight-method"><summary>Vad bygger tolkningen på?</summary>'+
    '<p>Skalorna jämför bara era summerade självskattningar: 0–3 råpoängs skillnad lyfts som likhet, 4–8 som viss skillnad och minst 9 som tydlig skillnad; från 15 poäng får skillnaden högre prioritet. Det är redaktionella sorteringsgränser, <strong>inte</strong> validerade kliniska eller statistiska gränsvärden. Den svenska testversionen är inte validerad för tonåringar.</p>'+
    '<p>Råden är möjliga vardagsscenarier och samtalsförslag, inte bedömningar av er relation. Vissa funktioner och kortlekar kan kräva en parad familj och att de är upplåsta. AI-medlaren är ännu under utveckling och används därför inte som färdigt verktyg här.</p>'+
    '</details></section>';
}

function statusPanel(message){return '<section class="live-panel"><p class="pf-status" role="status">'+esc(message)+'</p></section>';}

export function createPersonalityExperience({db,onRender,isSharingEnabled=false}){
  let viewer=null,sequence=0,answers={},loading=false,loaded=false,loadError='',saving=false,saveError='';
  let active=false,index=0,selectedAnswer=null,shareEnabled=false,shareBusy=false,shareError='',paired=null,partnerError='';
  const repaint=()=>onRender();
  function reset(userId=null){
    viewer=userId;sequence++;answers={};loading=false;loaded=false;loadError='';saving=false;
    saveError='';active=false;index=0;selectedAnswer=null;shareEnabled=false;shareBusy=false;shareError='';paired=null;partnerError='';
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
  function start(){active=true;saveError='';selectedAnswer=null;index=FIRST_UNANSWERED(answers);repaint();}
  function render({isPaired=false,viewerRole='parent'}={}){
    const heading='<section class="pf-intro"><span class="swipe-eyebrow">LÄR KÄNNA DIG SJÄLV</span><h1>Min personlighet</h1><p>Utforska fem sidor av hur du brukar vara. Det finns inga rätt eller fel svar.</p></section>';
    if(!viewer)return heading+statusPanel('Logga in för att göra testet.');
    if(loading)return heading+statusPanel('Hämtar dina svar…');
    if(loadError)return heading+'<section class="live-panel"><p role="alert">'+esc(loadError)+'</p><button class="live-button" data-pf-action="reload" type="button">Försök igen</button></section>';
    if(!loaded)return heading+statusPanel('Förbereder testet…');
    const result=scoreIPIP50(answers),count=result.answeredCount,complete=result.complete;
    if(active){
      const item=ITEMS[index],old=selectedAnswer?.id===item.id?selectedAnswer.value:answers[item.id],progress=Math.round(100*count/50);
      return heading+'<section class="live-panel pf-survey"><div class="pf-counter"><span>Fråga '+(index+1)+' av 50</span><span>'+count+' besvarade</span></div>'+
        '<div class="pf-progress" role="progressbar" aria-label="Besvarade frågor" aria-valuemin="0" aria-valuemax="50" aria-valuenow="'+count+'"><span style="width:'+progress+'%"></span></div>'+
        '<fieldset class="pf-question"'+(saving?' disabled':'')+'><legend>'+esc(item.sv)+'</legend>'+
        '<p class="live-muted">Hur väl stämmer det här på dig?</p>'+
        IPIP50_V1.responseOptions.map(option=>'<label class="pf-option'+(old===option.value?' is-selected':'')+'"><input type="radio" name="pf-answer" data-pf-answer="'+esc(item.id)+'" value="'+option.value+'"'+(old===option.value?' checked':'')+'><span>'+esc(option.label)+'</span></label>').join('')+'</fieldset>'+
        '<div class="pf-controls"><button type="button" data-pf-action="prev"'+(index===0||saving?' disabled':'')+'>← Föregående</button>'+
        '<button type="button" data-pf-action="next"'+(index===49||saving?' disabled':'')+'>Nästa →</button>'+
        '<button type="button" data-pf-action="overview"'+(saving?' disabled':'')+'>Spara och avsluta för nu</button></div>'+
        '<p class="pf-status" role="status">'+esc(saving?'Valt alternativ: '+IPIP50_V1.responseOptions.find(o=>o.value===selectedAnswer?.value)?.label+'. Sparar svaret…':saveError||'Dina svar sparas bara i ditt konto. Du kan ändra dina svar senare.')+'</p>'+
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
      // Compare five authorized sums; raw questionnaire answers remain private.
      const parentProfile=role==='parent'?own:other;
      const teenProfile=role==='teen'?own:other;
      const reflections=familyReflectionPanel(parentProfile,teenProfile,role);
      comparison='<section class="live-panel pf-comparison"><h2>Våra profiler</h2><p>Två självskattningar jämförda med samma amerikanska vuxenreferens. Placeringarna är uppskattningar, inte svenska normer.</p>'+
        
        percentileChart(own,other)+reflections+table(own,other)+referenceFeedback(other,'Den andras')+referenceCaveat()+
        '<p class="live-muted">Markörerna visar uppskattad percentil jämfört med samma vuxenreferens. Tabellen visar råpoäng, medelvärde och SD. Skillnader är inte bevis för att ni fungerar olika.</p>'+
        '</section>';
    }
    return heading+'<section class="live-panel pf-results"><h2>Din profil</h2><p>Dina fem skalor visar uppskattad placering jämfört med en amerikansk vuxenreferens, inte svenska normer.</p>'+
      percentileChart(own)+table(own)+referenceFeedback(own)+referenceCaveat()+
      '<p class="live-muted">Skalorna bygger på dina svar (10–50). Högt eller lågt är inte i sig bättre eller sämre. Den svenska översättningen behöver prövas vetenskapligt.</p>'+
      '<button type="button" data-pf-action="review">Granska eller ändra mina svar</button></section>'+sharing+comparison;
  }
  async function handleClick(element,{isPaired=false}={}){
    const btn=element?.closest?.('[data-pf-action]');
    if(!btn||!viewer||saving||shareBusy)return false;
    if(btn.dataset.pfAction==='reload'){await load(viewer);return true;}
    if(!loaded)return false;
    const action=btn.dataset.pfAction;
    if(action==='start'||action==='review'){start();if(action==='review')index=0;}
    else if(action==='prev'){selectedAnswer=null;index=Math.max(0,index-1);repaint();}
    else if(action==='next'){selectedAnswer=null;index=Math.min(49,index+1);repaint();}
    else if(action==='overview'||action==='result'){selectedAnswer=null;active=false;repaint();}
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
    // Keep the radio visibly highlighted during save instead of immediately
    // replacing the entire page with the next question.
    selectedAnswer={id:item.id,value};saving=true;saveError='';repaint();
    try{
      await Promise.all([
        saveMyIPIP50Answer(db,item.id,value),
        new Promise(resolve=>setTimeout(resolve,650))
      ]);
    }catch(e){
      if(token===sequence&&viewer===id){
        selectedAnswer=null;saving=false;
        saveError='Kunde inte spara svaret. Välj ett alternativ igen när anslutningen fungerar.';
        repaint();
      }
      return true;
    }
    if(token!==sequence||viewer!==id)return true;
    answers[item.id]=value;selectedAnswer=null;saving=false;
    if(index<49)index++;
    else active=false;
    paired=null;shareError='';
    repaint();
    return true;
  }
  return {reset,load,refreshShared,render,handleClick,handleChange};
}
