// Internal-test AI mediator: private, owner-scoped chat history lives in D1.
// The optional authorized project context can be disabled for each reply.
// A strict allowlist: only known local communication routes become clickable.
export function renderMediatorInternalLinks(text,escapeHtml,getViewerRole=()=>null) {
  const source=String(text??'');
  const re=/(https:\/\/erikjarl\.github\.io\/hemmakompassen\/#(?:kommunikation(?:\/(?:lyssna|pausa|reparera|losning|kontakt|svaart|validera|onskemal|grans))?|nvc|mi-foralder))(?![A-Za-z0-9_/%<>-])/g;
  return source.split(re).map(piece=>{
    const match=/^https:\/\/erikjarl\.github\.io\/hemmakompassen\/#(kommunikation(?:\/(?:lyssna|pausa|reparera|losning|kontakt|svaart|validera|onskemal|grans))?|nvc|mi-foralder)$/.exec(piece);
    if(!match||match[1]==='mi-foralder'&&getViewerRole()!=='parent')return escapeHtml(piece);
    return '<a href="#'+match[1]+'">'+escapeHtml(piece)+'</a>';
  }).join('');
}
export function createAiMediatorExperience({ db, config, escapeHtml, fetchImpl = fetch, onRender = () => {}, getViewerRole=()=>null, historyReadTimeoutMs=15000, createChatTimeoutMs=15000 }) {
  const h = escapeHtml;
  let userId = null;
  let epoch = 0;
  let controller = null;
  let sending = false;
  let creatingChat = false;
  let unconfirmedChatCreate = false;
  let draft = '';
  let error = '';
  let remaining = null;
  let turns = [];
  let chats = [];
  let activeChatId = null;
  let loading = false;
  let historyError = '';
  let contextSections = [];
  let contextError = '';
  let contextLoading = false;
  let contextRequest = 0;
  let includeProjectContext = true;
  let listRequest = 0;

  const enabled = config.enableAiMediator === true
    && typeof config.aiMediatorUrl === 'string'
    && /^https:\/\/[a-z0-9-]+\.erikbertiljarl\.workers\.dev\/api\/ai\/mediate$/.test(config.aiMediatorUrl);

  const historyEnabled = enabled && config.enableAiHistory === true;
  const readDeadlineMs=Number.isFinite(historyReadTimeoutMs)&&historyReadTimeoutMs>0
    ?Math.min(historyReadTimeoutMs,60000):15000;
  const createDeadlineMs=Number.isFinite(createChatTimeoutMs)&&createChatTimeoutMs>0
    ?Math.min(createChatTimeoutMs,60000):15000;
  function notify() { onRender(); }
  async function tokenFor(account) {
    const {data, error: sessionError} = await db.auth.getSession();
    if (sessionError || !data?.session?.access_token || data.session.user?.id !== account) {
      throw new Error('Din inloggning behöver förnyas.');
    }
    return data.session.access_token;
  }
  async function callApi(path, method, account, payload = null, signal) {
    // A stalled read used to leave the chat list or context overview loading
    // forever. Only GET is time-limited here: writes must not be retried after
    // an ambiguous timeout (a server could already have saved a message).
    const reader=method==='GET'?new AbortController():null;
    const activeSignal=signal||reader?.signal;
    let timer;
    const operation=(async()=>{
      const token=await tokenFor(account);
      // Auth adapters may ignore AbortSignal; never start a late fetch after
      // a deadline has already expired.
      if(activeSignal?.aborted)throw Error('Hämtningen tog för lång tid. Försök igen.');
      const url = config.aiMediatorUrl.replace(/\/mediate$/, '') + path;
      const res = await fetchImpl(url, {
        method,
        headers: {
          Authorization: 'Bearer ' + token,
          ...(payload ? {'Content-Type':'application/json'} : {})
        },
        ...(payload ? {body: JSON.stringify(payload)} : {}),
        ...(activeSignal ? {signal:activeSignal} : {}),
        credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer'
      });
      let result;
      try{result=await res.json();}catch{throw new Error('Servern gav ett oläsligt svar.');}
      if (!res.ok) throw new Error(typeof result?.error === 'string' ? result.error : 'Privata samtal kan inte nås.');
      return result;
    })();
    if(!reader)return operation;
    try{
      return await Promise.race([operation,new Promise((_,reject)=>{
        timer=setTimeout(()=>{
          reader.abort();
          reject(Error('Hämtningen tog för lång tid. Försök igen.'));
        },readDeadlineMs);
      })]);
    }finally{
      clearTimeout(timer);
    }
  }
  async function loadContextStatus() {
    if (!historyEnabled || !userId || !includeProjectContext || contextLoading) return false;
    const account=userId, myEpoch=epoch, request=++contextRequest;
    contextLoading=true;contextError='';notify();
    try {
      const result=await callApi('/context','GET',account);
      if(myEpoch!==epoch||userId!==account||request!==contextRequest)return false;
      if(!Array.isArray(result.sections)||result.sections.length>12||
         result.sections.some(x=>typeof x!=='string'||x.length>90))throw Error('Ogiltig översikt.');
      contextSections=result.sections;
      if(result.unavailableCount>0)contextError='Några uppgifter kunde inte hämtas. AI:n ska inte gissa vad de innehåller.';
      return true;
    } catch(e) {
      // Opting out and then back in may start a newer overview request.
      // An obsolete failure must not replace that newer request's status.
      if(myEpoch===epoch&&userId===account&&request===contextRequest&&includeProjectContext)
        contextError='Kunde inte kontrollera tillgängliga uppgifter.';
      return false;
    } finally {
      if(myEpoch===epoch&&userId===account&&request===contextRequest&&includeProjectContext){
        contextLoading=false;
        notify();
      }
    }
  }
  async function loadList() {
    if (!historyEnabled || !userId || loading || sending || creatingChat) return false;
    if(includeProjectContext&&!contextSections.length&&!contextLoading)void loadContextStatus();
    const epochAtStart = epoch, account = userId, request = ++listRequest;
    loading = true;historyError = '';notify();
    try {
      const data = await callApi('/chats','GET',account);
      if (epoch !== epochAtStart || userId !== account || request !== listRequest) return false;
      if (!Array.isArray(data.chats) || data.chats.length > 12) throw new Error('Samtalslistan är ogiltig.');
      chats = data.chats;
      unconfirmedChatCreate=false; // Verified read reconciles a timed-out create.
      if (!chats.some(x=>x.id===activeChatId)) activeChatId = chats[0]?.id || null;
      if (activeChatId && !await openChat(activeChatId, true)) return false;
      if (!activeChatId) turns = [];
      return true;
    } catch(err) {
      if (epoch===epochAtStart && userId===account && request===listRequest) historyError=err?.message||'Samtalslistan kunde inte laddas.';
      return false;
    } finally {
      if (epoch===epochAtStart && userId===account && request===listRequest){loading=false;notify();}
    }
  }
  async function createChat(fromSubmit=false) {
    // Repeated taps while the POST is pending must never create duplicate
    // blank chats. A reply submission may enter here during its own busy state.
    if(!historyEnabled || !userId || creatingChat || loading || (sending&&!fromSubmit))return false;
    if(unconfirmedChatCreate){
      historyError='Kontrollera samtalslistan innan du skapar ett nytt samtal.';
      notify();
      return false;
    }
    creatingChat=true;
    const request=++listRequest; // Invalidate any pending list read.
    const account=userId,myEpoch=epoch,aborter=new AbortController();
    let timer;
    notify();
    try {
      const operation=callApi('/chats','POST',account,null,aborter.signal);
      const data=await Promise.race([operation,new Promise((_,reject)=>{
        timer=setTimeout(()=>{
          aborter.abort();
          const problem=Error('Samtalet kunde inte bekräftas i tid.');
          problem.code='CHAT_CREATE_TIMEOUT';
          reject(problem);
        },createDeadlineMs);
      })]);
      if(myEpoch!==epoch || account!==userId || request!==listRequest)return false;
      if(!data.chat?.id || !/^[0-9a-f-]{36}$/i.test(data.chat.id))
        throw Error('Samtal kunde inte skapas.');
      chats=[data.chat,...chats];
      activeChatId=data.chat.id;
      turns=[];error='';historyError='';notify();
      return data.chat.id;
    }catch(e){
      if(myEpoch===epoch && account===userId && request===listRequest){
        if(e?.code==='CHAT_CREATE_TIMEOUT')unconfirmedChatCreate=true;
        historyError=e?.code==='CHAT_CREATE_TIMEOUT'
          ?'Servern svarade inte i tid. Ett tomt samtal kan redan ha skapats. Uppdatera samtalslistan innan du försöker igen.'
          :e?.message||'Kunde inte skapa samtal.';
        notify();
      }
      return false;
    }finally{
      clearTimeout(timer);
      if(myEpoch===epoch && account===userId){creatingChat=false;notify();}
    }
  }
  async function openChat(chatId, preserveLoading=false) {
    if (!historyEnabled || !userId || !chats.some(c=>c.id===chatId) || sending || creatingChat) return false;
    // A read opened as part of loadList belongs to that list's request.
    // User-initiated switches must supersede both the list and its read.
    const myEpoch=epoch,account=userId,request=preserveLoading?listRequest:++listRequest;
    activeChatId=chatId;
    // A selected chat is not the previously verified transcript. Remove stale
    // private messages immediately, including when the new read fails.
    turns=[];
    if(!preserveLoading)loading=true;
    historyError='';notify();
    try{
      const result=await callApi('/chats/'+encodeURIComponent(chatId),'GET',account);
      if(myEpoch!==epoch || userId!==account || activeChatId!==chatId || request!==listRequest)return false;
      if(!Array.isArray(result.messages) || result.messages.length>40 || result.messages.some(m=>!['user','assistant','safety'].includes(m.role)||typeof m.body!=='string'))throw new Error('Samtalet har ogiltigt innehåll.');
      turns=result.messages.map(m=>({role:m.role,text:m.body}));
      return true;
    }catch(e){
      // A failed read for an older selection must not show an error in the
      // currently selected conversation (or clear its pending indicator).
      if(myEpoch===epoch && userId===account && activeChatId===chatId && request===listRequest)
        historyError=e?.message||'Kunde inte öppna samtalet.';
      return false;
    }finally{
      if(myEpoch===epoch && userId===account && activeChatId===chatId && request===listRequest){
        if(!preserveLoading)loading=false;
        notify();
      }
    }
  }
  async function deleteChat() {
    if (!historyEnabled || !activeChatId || !userId || sending || creatingChat || loading) return false;
    listRequest++; // A pending list fetch may not restore a just-deleted chat.
    const account=userId,myEpoch=epoch,id=activeChatId;
    try {
      await callApi('/chats/'+encodeURIComponent(id),'DELETE',account);
      if(myEpoch!==epoch || account!==userId)return false;
      chats=chats.filter(c=>c.id!==id);activeChatId=null;turns=[];draft='';error='';remaining=null;
      if(chats.length)await openChat(chats[0].id);
      notify();return true;
    }catch(e){if(myEpoch===epoch && account===userId){historyError=e?.message||'Kunde inte radera samtalet.';notify();}return false;}
  }
  function setProjectContext(value) {
    // An in-flight request uses its already captured setting.
    if (sending || !historyEnabled) return false;
    const enabledForReply = value === true;
    if (includeProjectContext === enabledForReply) return true;
    includeProjectContext = enabledForReply;
    contextRequest++; // discard a delayed overview after opt-out
    contextSections = [];
    contextError = '';
    contextLoading = false;
    notify();
    if (enabledForReply && userId) void loadContextStatus();
    return true;
  }
  function reset(nextId = null) {
    epoch++;
    if (controller) controller.abort();
    controller = null;
    userId = nextId;
    sending = false;
    creatingChat=false;
    unconfirmedChatCreate=false;
    draft = '';
    error = '';
    remaining = null;
    turns = [];
    chats = [];
    activeChatId = null;
    loading = false;
    historyError = '';
    contextSections = [];
    contextError = '';
    contextLoading = false;
    contextRequest++;
    includeProjectContext = true;
    listRequest++;
  }
  function clear() {
    epoch++;
    if (controller) controller.abort();
    controller = null;
    sending = false;
    draft = '';
    error = '';
    remaining = null;
    turns = [];
    // clear() only resets local data; server deletion requires explicit deleteChat().
    notify();
  }
  function input(value) {
    draft = String(value ?? '').slice(0, 2000);
    error = '';
  }
  function render() {
    if (!enabled) {
      return '<h1>AI-medlaren</h1><section class="live-panel"><h2>Testchatten är inte aktiverad</h2>'
        + '<p>Den privata AI-tjänsten håller på att anslutas. Inga samtal skickas innan anslutningen är verifierad.</p></section>';
    }
    const historyBar = historyEnabled
      ? '<section class="mediator-history"><div class="mediator-history-heading"><h2>Privata samtal</h2><button type="button" class="mediator-clear" id="mediator-new"'+(sending||loading||creatingChat||unconfirmedChatCreate?' disabled':'')+'>+ Nytt samtal</button></div>'
        + (loading?'<p>Hämtar dina samtal…</p>':'')
        + (historyError?'<p role="alert" class="mediator-error">'+h(historyError)+'</p><button type="button" class="mediator-clear" id="mediator-retry-list"'+(sending||loading?' disabled':'')+'>Försök hämta samtal igen</button>':'')
        + (chats.length ? '<div class="mediator-thread-list" role="group" aria-label="Dina samtal">'
           + chats.map(c=>'<button type="button" data-mediator-open="'+h(c.id)+'"'+(c.id===activeChatId?' aria-current="true"':'')+(sending||creatingChat?' disabled':'')+'>'+h(c.title)+'</button>').join('')+'</div>'
          : '<p>Inga sparade samtal ännu. Skriv nedan så skapas ett privat samtal.</p>')
        + '</section>' : '';
    const messages = turns.length
      ? '<ol class="mediator-messages" aria-label="Tillfälliga testmeddelanden">'
        + turns.map(turn => '<li class="mediator-message mediator-message-' + h(turn.role) + '"><strong>'
          + (turn.role === 'user' ? 'Du' : turn.role === 'safety' ? 'Säkerhetsinformation' : 'Samtalsstödet') + '</strong><p>' + (turn.role==='assistant'?renderMediatorInternalLinks(turn.text,h,getViewerRole):h(turn.text)) + '</p></li>').join('')
        + '</ol>'
      : '<p class="mediator-empty">Inga meddelanden ännu. Skriv ett fiktivt exempel för att testa samtalsstödet.</p>';
    const count = draft.length;
    const status = sending ? 'AI:n arbetar…' : error;
    return '<div class="mediator-view">'
      + '<header class="swipe-heading"><span class="swipe-eyebrow">PRIVAT · INTERN TESTVERSION</span><h1>AI-medlaren</h1>'
      + '<p>Utforska konflikter och möjliga samtalsvägar, utan att den andra familjemedlemmen ser chatten.</p></header>'
      + '<div class="live-panel mediator-notice"><h2>Viktig information</h2>'
      + (historyEnabled?'<p><strong>Testa enbart med påhittade situationer.</strong> Dina samtal sparas tills de raderas. '
        + 'AI:n får använda dina egna svar, behörigt delade resultat, överenskommelser och ett fåtal meddelanden från familjens inkorg. '
        + 'Informationen hämtas på nytt inför varje svar, så ändrad delning respekteras. '
        + 'Motpartens privata testsvar och privata AI-chattar läses inte in.</p>'
        : '<p><strong>Testa enbart med påhittade situationer.</strong> Inga meddelanden sparas. '
        + 'Chatten minns inte tidigare turer när den svarar.</p>')
      + '<p>Det här är inte terapi eller krishjälp. Vid akut fara, ring 112.</p><p>Du kan också läsa <a href="#kommunikation">Kommunikationsråd</a> eller <a href="#nvc">öva på NVC</a> direkt. AI:n kan föreslå länkar till de verktygen i ett svar.</p></div>'
      + (historyEnabled ? '<section class="mediator-context"><h2>Uppgifter som AI:n får använda</h2>'
         + '<label class="mediator-context-choice" for="mediator-use-context"><input type="checkbox" id="mediator-use-context"'
         + (includeProjectContext ? ' checked' : '') + (sending ? ' disabled' : '')
         + '> Använd mina uppgifter från övriga delar av Hemmakompassen när AI:n svarar</label>'
         + (includeProjectContext
            ? (contextLoading ? '<p>Kontrollerar tillgängliga uppgifter…</p>' : '')
              + (contextSections.length ? '<p>'+contextSections.map(h).join(' · ')+'</p>'
                : '<p>Inga uppgifter har ännu bekräftats. AI:n ska inte hitta på saknade resultat.</p>')
              + (contextError ? '<p class="mediator-error" role="status">'+h(contextError)+'</p>' : '')
              + '<button type="button" class="mediator-clear" id="mediator-refresh-context">Uppdatera översikt</button>'
            : '<p role="status">Avstängt. AI:n får bara detta samtals egna meddelanden, inte nya uppgifter från Gillaswajpen, Big Five, Schyssta listan eller Inkorgen. Du kan slå på det inför nästa svar.</p>')
         + '</section>' : '')
      + historyBar + '<div class="live-panel mediator-chat">' + messages
      + '<form id="mediator-form">'
      + '<label for="mediator-input"><strong>Ditt testmeddelande</strong></label>'
      + '<textarea id="mediator-input" rows="4" maxlength="2000" placeholder="Exempel: Min förälder tycker att jag använder mobilen för mycket…"'
      + (sending||creatingChat ? ' disabled' : '') + '>' + h(draft) + '</textarea>'
      + '<div class="mediator-actions"><span class="live-muted" id="mediator-char-count">' + count + ' / 2000 tecken</span>'
      + '<button class="live-button" type="submit"' + (sending || creatingChat || (historyEnabled&&!activeChatId&&(loading||unconfirmedChatCreate)) || !draft.trim() ? ' disabled' : '') + '>Skicka testmeddelande</button>'
      + (historyEnabled ? '<button class="mediator-clear" type="button" id="mediator-delete"' + (!activeChatId || sending ? ' disabled' : '') + '>Radera detta samtal</button>'
        : '<button class="mediator-clear" type="button" id="mediator-clear"' + (!turns.length && !draft && !error || sending ? ' disabled' : '') + '>Rensa chatten</button>') + '</div>'
      + '</form><p role="status" id="mediator-status"' + (error ? ' class="mediator-error"' : '') + '>'
      + h(status) + '</p>'
      + (remaining === null ? '' : '<p class="live-muted">Återstående testsvar i dag: ' + remaining + '</p>')
      + '</div></div>';
  }
  async function submit() {
    if (!enabled || !userId || sending || creatingChat || (historyEnabled && loading && !activeChatId)) return false;
    const message = draft.trim();
    if (!message || message.length > 2000) return false;
    const requestEpoch = epoch;
    const requestUser = userId;
    const useProjectContext = includeProjectContext;
    sending = true;
    error = '';
    controller = new AbortController();
    const currentController = controller;
    notify();
    try {
      const accessToken = await tokenFor(requestUser);
      let chatId = activeChatId;
      if (historyEnabled && !chatId) {
        chatId = await createChat(true);
        if (!chatId) throw new Error(historyError || 'Kunde inte skapa ett privat samtal.');
      }
      if (requestEpoch !== epoch || userId !== requestUser) return false;
      const response = await fetchImpl(config.aiMediatorUrl, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(historyEnabled ? { message, chatId, useProjectContext } : { message }),
        signal: currentController.signal,
        cache: 'no-store',
        credentials: 'omit',
        referrerPolicy: 'no-referrer'
      });
      let result;
      try { result = await response.json(); }
      catch { throw new Error('AI:n gav inget läsbart svar.'); }
      if (requestEpoch !== epoch || userId !== requestUser) return false;
      if (!response.ok || typeof result?.reply !== 'string' || !result.reply.trim() || result.reply.length > 15000 ||
          (historyEnabled && (result.ephemeral !== false || result.chatId !== chatId))) {
        throw new Error(typeof result?.error === 'string' && result.error.length < 180
          ? result.error : 'AI:n kunde inte svara just nu.');
      }
      turns = [...turns, { role: 'user', text: message }, { role: result.safetyNotice === true ? 'safety' : 'assistant', text: result.reply.trim() }];
      if (turns.length > 30) turns = turns.slice(-30);
      draft = '';
      if (historyEnabled && chats.length && chats.find(c=>c.id===chatId)?.title==='Nytt samtal') {
        chats=chats.map(c=>c.id===chatId?{...c,title:message.slice(0,70)}:c);
      }
      remaining = Number.isInteger(result.remainingToday) && result.remainingToday >= 0
        ? result.remainingToday : null;
      return true;
    } catch (err) {
      if (requestEpoch !== epoch || userId !== requestUser) return false;
      error = err?.name === 'AbortError' ? 'Förfrågan avbröts.' :
        (err instanceof TypeError ? 'Kunde inte nå AI-servern. Kontrollera anslutningen.' : err?.message || 'Ett fel uppstod.');
      return false;
    } finally {
      if (requestEpoch === epoch && userId === requestUser) {
        sending = false;
        controller = null;
        notify();
      }
    }
  }
  return { render, reset, clear, input, submit, loadList, loadContextStatus, setProjectContext, createChat, openChat, deleteChat,
    getState: () => ({ userId, sending, creatingChat, unconfirmedChatCreate, draft, error, remaining, turns: turns.map(x => ({ ...x })), chats:chats.map(c=>({...c})),activeChatId,historyError,contextSections:[...contextSections],contextError,includeProjectContext }) };
}
