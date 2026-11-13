// Automatic, ephemeral analysis in the result views. No raw results are
// accepted by the Worker: browser sends only kind/scope and Supabase JWT.
const escape=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
// Only editorially verified communication exercises may become clickable.
// All other AI text remains escaped; no arbitrary URLs/HTML from the model.
const ANALYSIS_ROUTE_LABELS=Object.freeze({
  '#nvc':'Bygg ett jag-budskap med NVC',
  '#kommunikation/lyssna':'Spegla innan du svarar',
  '#kommunikation/pausa':'Pausa och återkom',
  '#kommunikation/reparera':'Reparera efter ett gräl',
  '#kommunikation/losning':'Hitta en gemensam lösning',
  '#kommunikation/kontakt':'Fem minuter kontakt',
  '#kommunikation/svaart':'Ta upp något känsligt',
  '#kommunikation/validera':'Bekräfta utan att hålla med',
  '#kommunikation/onskemal':'Be om något konkret',
  '#kommunikation/grans':'Sätt en gräns med respekt'
});
export function renderAiAnalysisReply(value){
  // Match an entire route token: never link the valid prefix of an invalid path
  // such as #kommunikation/losning-extra.
  return escape(value).replace(/#(?:kommunikation\/[a-z]+|nvc)(?![\p{L}\p{N}_\/?#&=%-])/gu,route=>{
    const label=ANALYSIS_ROUTE_LABELS[route];
    return label?'<a href="'+route+'">'+escape(label)+'</a>':route;
  }).replace(/\n/g,'<br>');
}
export function createAiResultExperience({db,config,fetchImpl=fetch,onRender=()=>{},timeoutMs=25000}){
  const enabled=config.enableAiResultAnalyses===true && config.enableAiMediator===true
    && typeof config.aiMediatorUrl==='string'
    && /^https:\/\/[a-z0-9-]+\.erikbertiljarl\.workers\.dev\/api\/ai\/mediate$/.test(config.aiMediatorUrl);
  let userId=null,epoch=0;
  const results=new Map();
  const pending=new Map();
  const maxWaitMs=Number.isFinite(timeoutMs)&&timeoutMs>0?Math.min(timeoutMs,60000):25000;
  const sourceKey=(kind,scope)=>kind+':'+scope;
  function cancel(key){
    const controller=pending.get(key);
    if(controller){pending.delete(key);controller.abort();}
  }
  function reset(nextUserId=null){
    epoch++;userId=nextUserId;
    for(const key of pending.keys())cancel(key);
    results.clear();
    // Even if a backend ignores abort, obsolete replies cannot restore another account.
  }
  function invalidate(kind,scope){
    const key=sourceKey(kind,scope);cancel(key);results.delete(key);
  }
  async function ensure(kind,scope,signature,{force=false}={}){
    if(!enabled||!userId||typeof signature!=='string'||!signature)return false;
    if(kind!=='personality'&&kind!=='swipe')return false;
    if(!/^[a-z0-9-]{1,36}$/.test(scope))return false;
    const key=sourceKey(kind,scope),previous=results.get(key);
    if(!force&&previous?.signature===signature)return false;
    const account=userId,requestEpoch=epoch;
    // Changing a signature or retrying replaces any obsolete client request.
    // This does not undo a Worker invocation already accepted server-side.
    cancel(key);
    const controller=new AbortController();
    pending.set(key,controller);
    // Client-only fingerprint controls refresh, NEVER sent over the wire.
    const request={signature,status:'loading',reply:'',error:'',basis:''};
    results.set(key,request);
    onRender();
    let timer;
    try{
      // Time-limit both session lookup and fetch. Some adapters ignore abort,
      // so Promise.race prevents a permanently stuck loading indicator.
      const operation=(async()=>{
      const session=await db.auth.getSession();
      // Session retrieval may outlive a logout, a consent/result change or a retry.
      // An aborted request must never start a late Worker analysis or spend quota.
      if(controller.signal.aborted||account!==userId||requestEpoch!==epoch||pending.get(key)!==controller)
        return null;
      if(session?.error||session?.data?.session?.user?.id!==account||!session?.data?.session?.access_token)
        throw Error('Din inloggning behöver förnyas.');
      const url=config.aiMediatorUrl.replace(/\/mediate$/,'')+'/analyze';
      const response=await fetchImpl(url,{method:'POST',headers:{
        Authorization:'Bearer '+session.data.session.access_token,'Content-Type':'application/json'
      },body:JSON.stringify({kind,scope}),credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',signal:controller.signal});
      let payload;
      try{payload=await response.json();}catch{throw Error('AI-servern gav ett oläsligt svar.');}
      if(!response.ok)throw Error(typeof payload?.error==='string'&&payload.error.length<190?
        payload.error:'Kunde inte skapa AI-reflektionen.');
      return payload;
      })();
      const timeout=new Promise((_,reject)=>{
        timer=setTimeout(()=>{
          controller.abort();
          reject(Error('AI-servern svarade inte i tid. Försök igen.'));
        },maxWaitMs);
      });
      const payload=await Promise.race([operation,timeout]);
      if(account!==userId||requestEpoch!==epoch||results.get(key)!==request)return false;
      if(payload?.empty===true){
        request.status='empty';
      }else if(typeof payload?.reply==='string'&&payload.reply.trim()&&payload.reply.length<=9000
        &&payload.kind===kind&&payload.scope===scope&&typeof payload?.basis==='string'&&payload.basis.length<1000){
        request.status='ready';
        request.reply=payload.reply.trim();request.basis=payload.basis;
      }else throw Error('AI-servern skickade ett ogiltigt resultat.');
      onRender();return true;
    }catch(err){
      if(account!==userId||requestEpoch!==epoch||results.get(key)!==request)return false;
      request.status='error';
      request.error=controller.signal.aborted
        ?'AI-servern svarade inte i tid. Försök igen.'
        :err?.message||'AI-analysen kunde inte visas.';
      onRender();return false;
    }finally{
      clearTimeout(timer);
      if(pending.get(key)===controller)pending.delete(key);
    }
  }
  function panel(kind,scope,signature){
    if(!enabled||!signature)return '';
    const record=results.get(sourceKey(kind,scope));
    const item=record?.signature===signature?record:null;
    const title=kind==='personality'?'AI-reflektion om din personlighetsprofil':'AI-reflektion om era gemensamma svar';
    const status=item?.status||'loading';
    const body=status==='ready'
      ?'<p class="ai-result-prose">'+renderAiAnalysisReply(item.reply)+'</p><details><summary>Vad bygger reflektionen på?</summary><p>'+
         escape(item.basis)+'</p></details>'
      :status==='empty'
        ?'<p>Det finns ännu inget färdigt, behörigt resultat att analysera.</p>'
        :status==='error'
          ?'<p role="alert">'+escape(item.error)+'</p>'
          :'<p role="status">AI:n analyserar resultatet…</p>';
    return '<section class="ai-result-panel" aria-label="'+escape(title)+'">'+
      '<span class="swipe-summary-label">AI-GENERERAD REFLEKTION · INTERN TESTVERSION</span>'+
      '<h3>'+escape(title)+'</h3>'+
      '<p class="live-muted">AI:n skriver utifrån resultat som kontrollerats på servern. Den kan ha fel. Texten är ingen diagnos och visar inte varför er relation fungerar som den gör.</p>'+
      body+(status==='ready'?'<p class="ai-result-resources">Fler frivilliga övningar: '+(kind==='personality'
        ?'<a href="#kommunikation/validera">Bekräfta utan att hålla med</a> eller <a href="#nvc">bygg ett jag-budskap med NVC</a>'
        :'<a href="#kommunikation/losning">Hitta en gemensam lösning</a> eller <a href="#kommunikation/kontakt">prova fem minuter kontakt</a>')+
        '. Övningarna är allmänna förslag, inte en slutsats om era resultat. Om det finns hot, rädsla eller kontroll ska trygghet och stöd gå före samtalsövningar.</p>':'')+(status==='error'||status==='ready'
        ?'<button type="button" class="mediator-clear" data-ai-analysis-retry="'+escape(kind+':'+scope)+'">Generera ny reflektion</button>'
        :'')+'</section>';
  }
  const snapshot=(kind,scope)=>results.get(sourceKey(kind,scope));
  return {enabled,reset,invalidate,ensure,panel,snapshot};
}
