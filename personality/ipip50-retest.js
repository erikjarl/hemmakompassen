import {IPIP50_V1} from './ipip50-v1.js';
import {scoreIPIP50} from './ipip50-scoring.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const fmtDate=value=>{
  const parsed=Date.parse(String(value||''));
  return Number.isFinite(parsed)?new Intl.DateTimeFormat('sv-SE',{year:'numeric',month:'short',day:'numeric'}).format(new Date(parsed)):'Datum saknas';
};
const fromRows=rows=>{
  const answers={};
  const allowed=new Set(IPIP50_V1.items.map(item=>item.id));
  for(const row of rows||[]){
    if(!allowed.has(row?.question_id))continue;
    if(!Number.isInteger(row.answer_value)||row.answer_value<1||row.answer_value>5)
      throw Error('Invalid saved retest answer');
    if(Object.hasOwn(answers,row.question_id))throw Error('Duplicate saved retest answer');
    answers[row.question_id]=row.answer_value;
  }
  return answers;
};

// A downloaded file contains only this viewer's answers: no account IDs,
 // pair information, AI context or database attempt identifiers.
export function buildPrivateIpipRetestExport(answers,{startedAt=null,completedAt=null,exportedAt=new Date().toISOString()}={}){
  const responses=IPIP50_V1.items.flatMap(item=>{
    const value=answers?.[item.id];
    return Number.isInteger(value)&&value>=1&&value<=5
      ?[{item_id:item.id,statement_sv:item.sv,value}]:[];
  });
  return {
    format:'hemmakompassen-own-ipip50-retest-v1',
    instrument_id:IPIP50_V1.id,
    instrument_version:IPIP50_V1.version,
    language:'sv-SE',
    exported_at:exportedAt,
    started_at:startedAt,
    completed_at:completedAt,
    answered_count:responses.length,
    complete:responses.length===IPIP50_V1.items.length,
    note:'Privat omtestning. Preliminär svensk översättning, inte ett diagnostiskt test.',
    responses
  };
}
function downloadPrivateRetest(filename,data){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;link.download=filename;link.hidden=true;
  document.body.appendChild(link);link.click();link.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),30000);
}
export function createPrivateIpipRetests({
  db,onRender=()=>{},renderOwnScores=()=>'',saveExport=downloadPrivateRetest,
  confirmDelete=message=>window.confirm(message)
}){
  let userId=null,generation=0,loading=false,error='',busy=false;
  let attempts=[],draftId=null,answers={},questionIndex=0,surveyOpen=false;
  let historyId=null,historyAnswers=null,status='';
  const repaint=()=>onRender();
  const isCurrent=(id,token)=>userId===id&&generation===token;

  function reset(id=null){
    userId=id;generation++;loading=false;error='';busy=false;
    attempts=[];draftId=null;answers={};questionIndex=0;surveyOpen=false;
    historyId=null;historyAnswers=null;status='';
  }

  async function readAnswers(id,attemptId){
    const result=await db.from('personality_attempt_answers')
      .select('question_id,answer_value')
      .eq('user_id',id).eq('attempt_id',attemptId);
    if(result.error||!Array.isArray(result.data))throw result.error||Error('Invalid answer response');
    return fromRows(result.data);
  }

  async function load(id){
    if(!id)return;
    const token=++generation;
    userId=id;loading=true;error='';repaint();
    try{
      const result=await db.from('personality_test_attempts')
        .select('id,created_at,completed_at').eq('user_id',id)
        .order('created_at',{ascending:false});
      if(result.error||!Array.isArray(result.data))throw result.error||Error('Invalid attempts');
      if(!isCurrent(id,token))return;
      attempts=result.data.filter(a=>typeof a.id==='string'&&a.id.length>0);
      const draft=attempts.find(a=>a.completed_at===null);
      const loaded=draft?await readAnswers(id,draft.id):{};
      if(!isCurrent(id,token))return;
      draftId=draft?.id||null;answers=loaded;
      questionIndex=IPIP50_V1.items.findIndex(item=>!Object.hasOwn(answers,item.id));
      if(questionIndex<0)questionIndex=0;
      surveyOpen=false;historyId=null;historyAnswers=null;
      loading=false;repaint();
    }catch(e){
      if(!isCurrent(id,token))return;
      loading=false;error='Det gick inte att hämta dina privata omtestningar. Försök igen.';repaint();
    }
  }

  function render(){
    if(!userId)return '';
    const introduction='<section class="live-panel pf-retest" aria-label="Privat omtestning av personlighet">'+
      '<h2>Gör testet igen – helt privat</h2>'+
      '<p>Du kan göra nya omgångar och jämföra dina egna resultat över tid. De ursprungliga 50 svaren ändras aldrig av ett omtest. Omtest och deras resultat visas bara för dig – de delas inte med din familjemedlem eller AI-medlaren.</p>';
    if(loading)return introduction+'<p role="status">Hämtar privata omtest…</p></section>';
    if(error)return introduction+'<p role="alert">'+esc(error)+'</p><button type="button" data-ipip-retest="reload">Försök igen</button></section>';
    const completed=attempts.filter(a=>a.completed_at!==null);
    let html=introduction;
    html+='<p><button type="button" data-ipip-retest="refresh"'+(busy?' disabled':'')+'>Uppdatera mina omtest</button></p>';
    if(status)html+='<p role="status">'+esc(status)+'</p>';
    if(draftId){
      const count=Object.keys(answers).length;
      html+='<p><strong>Påbörjad omgång:</strong> '+count+' av 50 svar.</p>';
      if(!surveyOpen)html+='<button type="button" class="live-button" data-ipip-retest="resume"'+(busy?' disabled':'')+'>Fortsätt privat omtest</button>';
      else{
        const item=IPIP50_V1.items[questionIndex];
        html+='<div class="pf-survey"><p>Fråga '+(questionIndex+1)+' av 50 · '+count+' sparade</p>'+
          '<fieldset class="pf-question"'+(busy?' disabled':'')+'><legend>'+esc(item.sv)+'</legend>'+
          IPIP50_V1.responseOptions.map(opt=>'<label class="pf-option'+(answers[item.id]===opt.value?' is-selected':'')+'">'+
            '<input type="radio" name="ipip-retest-answer" data-ipip-retest-answer="'+esc(item.id)+'" value="'+opt.value+'"'+
            (answers[item.id]===opt.value?' checked':'')+'><span>'+esc(opt.label)+'</span></label>').join('')+
          '</fieldset><div class="pf-controls">'+
          '<button type="button" data-ipip-retest="prev"'+(questionIndex===0||busy?' disabled':'')+'>← Föregående</button>'+
          '<button type="button" data-ipip-retest="next"'+(questionIndex===49||busy?' disabled':'')+'>Nästa →</button>'+
          '<button type="button" data-ipip-retest="overview"'+(busy?' disabled':'')+'>Spara och pausa</button>'+
          '</div>';
        if(count===50)html+='<p>Alla 50 svar är sparade. Du kan fortfarande ändra dem innan du avslutar omgången.</p>'+
          '<button type="button" data-ipip-retest="complete"'+(busy?' disabled':'')+'>Avsluta omgången och spara resultat</button>';
        html+='</div>';
      }
    }else{
      html+='<button type="button" class="live-button" data-ipip-retest="new"'+(busy?' disabled':'')+'>Starta en ny privat testomgång</button>';
    }
    if(draftId)html+='<p><button type="button" data-ipip-retest="export" data-attempt-id="'+esc(draftId)+'"'+(busy?' disabled':'')+'>Exportera min påbörjade omgång (JSON)</button> '+
      '<button type="button" data-ipip-retest="delete" data-attempt-id="'+esc(draftId)+'"'+(busy?' disabled':'')+'>Radera påbörjad omgång</button></p>';
    html+='<h3>Min omtestningshistorik</h3>';
    if(!completed.length)html+='<p>Inga avslutade omtest ännu.</p>';
    else html+='<ul>'+completed.map(a=>'<li>'+esc(fmtDate(a.completed_at))+
      ' <button type="button" data-ipip-retest="view" data-attempt-id="'+esc(a.id)+'"'+(busy?' disabled':'')+'>Visa mitt resultat</button> '+
      '<button type="button" data-ipip-retest="export" data-attempt-id="'+esc(a.id)+'"'+(busy?' disabled':'')+'>Exportera omgången (JSON)</button> '+
      '<button type="button" data-ipip-retest="delete" data-attempt-id="'+esc(a.id)+'"'+(busy?' disabled':'')+'>Radera omgången</button></li>').join('')+'</ul>';
    if(historyId&&historyAnswers){
      const scored=scoreIPIP50(historyAnswers);
      if(scored.complete)html+='<div class="pf-retest-history"><h3>Mitt privata omtest · '+esc(fmtDate(completed.find(a=>a.id===historyId)?.completed_at))+'</h3>'+
        '<p>Den här omgången påverkar inte den profil du eventuellt redan delar med en familjemedlem.</p>'+
        renderOwnScores(scored)+'</div>';
    }
    return html+'</section>';
  }

  async function handleClick(target){
    const button=target?.closest?.('[data-ipip-retest]');
    if(!button||!userId)return false;
    const action=button.dataset.ipipRetest;
    if(action==='reload'){await load(userId);return true;}
    if(loading||busy||error)return true;
    if(action==='refresh'){
      const id=userId;
      await load(id);
      if(userId===id&&!error){status='Dina omtest har uppdaterats från servern.';repaint();}
      return true;
    }
    if(action==='resume'){surveyOpen=true;status='';repaint();return true;}
    if(action==='overview'){surveyOpen=false;status='Omgången är sparad och kan fortsättas senare.';repaint();return true;}
    if(action==='prev'||action==='next'){
      questionIndex=Math.max(0,Math.min(49,questionIndex+(action==='prev'?-1:1)));
      status='';repaint();return true;
    }
    if(action==='new'&&!draftId){
      const id=userId,token=generation;busy=true;status='Startar en ny privat omgång…';repaint();
      try{
        const result=await db.from('personality_test_attempts')
          .insert({user_id:id,instrument_id:IPIP50_V1.id})
          .select('id,created_at,completed_at').single();
        if(result.error||!result.data?.id)throw result.error||Error('Invalid response');
        if(!isCurrent(id,token))return true;
        attempts=[result.data,...attempts];draftId=result.data.id;answers={};
        questionIndex=0;surveyOpen=true;status='';
      }catch(e){
        if(!isCurrent(id,token))return true;
        if(e?.code==='23505'){
          // Another tab already created this owner's draft. The database is
          // authoritative; reconcile rather than opening a second test.
          busy=false;
          await load(id);
          if(userId===id&&draftId&&!error){
            status='Det finns redan en påbörjad omgång från en annan flik. Fortsätt den i stället.';
            repaint();
          }
          return true;
        }
        status='Omgången kunde inte startas. Inga gamla svar har ändrats.';
      }
      if(isCurrent(id,token)){busy=false;repaint();}
      return true;
    }
    if(action==='complete'&&draftId&&Object.keys(answers).length===50){
      const id=userId,token=generation,attemptId=draftId;
      busy=true;status='Avslutar omgången…';repaint();
      try{
        const result=await db.from('personality_test_attempts')
          .update({completed_at:new Date().toISOString()})
          .eq('user_id',id).eq('id',attemptId)
          .select('id,completed_at').single();
        if(result.error||!result.data?.completed_at)throw result.error||Error('Completion unconfirmed');
        if(!isCurrent(id,token))return true;
        attempts=attempts.map(a=>a.id===attemptId?{...a,completed_at:result.data.completed_at}:a);
        draftId=null;surveyOpen=false;historyId=attemptId;historyAnswers={...answers};answers={};
        status='Den privata omgången har avslutats och sparats.';
      }catch(e){if(isCurrent(id,token))status='Det gick inte att bekräfta avslutningen. Kontrollera din omgång innan du försöker igen.';}
      if(isCurrent(id,token)){busy=false;repaint();}
      return true;
    }
    if(action==='export'){
      const attemptId=button.dataset.attemptId;
      const attempt=attempts.find(a=>a.id===attemptId);
      if(!attempt)return true;
      const id=userId,token=generation;
      busy=true;status='Hämtar dina privata svar för export…';repaint();
      try{
        // Export only a confirmed server snapshot, never a stale local draft.
        // Another tab may have changed or deleted its answers after our load.
        const saved=await readAnswers(id,attemptId);
        if(!isCurrent(id,token))return true;
        const data=buildPrivateIpipRetestExport(saved,{
          startedAt:attempt.created_at,completedAt:attempt.completed_at
        });
        if(!data.responses.length)throw Error('Nothing to export');
        const filename='hemmakompassen-ipip50-omtest-'+data.exported_at.slice(0,10)+'.json';
        saveExport(filename,data);
        status='Exporten har öppnats. Kontrollera att JSON-filen sparats på din enhet.';
      }catch(e){
        if(isCurrent(id,token))status='Det gick inte att exportera omtestet. Försök igen.';
      }
      if(isCurrent(id,token)){busy=false;repaint();}
      return true;
    }
    if(action==='delete'){
      const attemptId=button.dataset.attemptId;
      const attempt=attempts.find(a=>a.id===attemptId);
      if(!attempt)return true;
      const message='Vill du permanent radera den här privata IPIP-testomgången och alla dess sparade svar? Detta går inte att ångra. Din ursprungliga profil och andra omtest påverkas inte.';
      if(!confirmDelete(message))return true;
      const id=userId,token=generation;
      busy=true;status='Raderar den valda privata omgången…';repaint();
      try{
        const result=await db.from('personality_test_attempts').delete()
          .eq('user_id',id).eq('id',attemptId)
          .select('id').single();
        if(result.error||result.data?.id!==attemptId)
          throw result.error||Error('Delete was not confirmed');
        if(!isCurrent(id,token))return true;
        attempts=attempts.filter(a=>a.id!==attemptId);
        if(draftId===attemptId){draftId=null;answers={};surveyOpen=false;questionIndex=0;}
        if(historyId===attemptId){historyId=null;historyAnswers=null;}
        status='Den privata omgången och dess svar har raderats.';
      }catch(e){
        if(isCurrent(id,token))status='Radering kunde inte bekräftas. Ladda om historiken innan du försöker igen.';
      }
      if(isCurrent(id,token)){busy=false;repaint();}
      return true;
    }
    if(action==='view'){
      const attemptId=button.dataset.attemptId;
      if(!attempts.some(a=>a.id===attemptId&&a.completed_at!==null))return true;
      const id=userId,token=generation;
      busy=true;status='Hämtar privata omtestresultat…';repaint();
      try{
        const saved=await readAnswers(id,attemptId);
        if(!isCurrent(id,token))return true;
        if(!scoreIPIP50(saved).complete)throw Error('Incomplete historic result');
        historyId=attemptId;historyAnswers=saved;status='';
      }catch(e){if(isCurrent(id,token))status='Det gick inte att visa historiken. Försök igen.';}
      if(isCurrent(id,token)){busy=false;repaint();}
      return true;
    }
    return false;
  }

  async function handleChange(target){
    if(!target?.matches?.('input[data-ipip-retest-answer]')||!surveyOpen||!draftId||busy||!userId)return false;
    const item=IPIP50_V1.items[questionIndex],value=Number(target.value);
    if(target.dataset.ipipRetestAnswer!==item.id||!Number.isInteger(value)||value<1||value>5)return false;
    const id=userId,token=generation,attemptId=draftId,index=questionIndex;
    busy=true;status='Sparar ditt privata svar…';repaint();
    try{
      const result=await db.from('personality_attempt_answers').upsert({
        attempt_id:attemptId,user_id:id,question_id:item.id,answer_value:value
      },{onConflict:'attempt_id,question_id'});
      if(result.error)throw result.error;
      if(!isCurrent(id,token)||draftId!==attemptId)return true;
      answers[item.id]=value;questionIndex=index<49?index+1:index;
      status='';
    }catch(e){if(isCurrent(id,token))status='Svaret kunde inte sparas. Välj igen när anslutningen fungerar.';}
    if(isCurrent(id,token)){busy=false;repaint();}
    return true;
  }
  return {reset,load,render,handleClick,handleChange};
}
