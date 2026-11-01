// A deliberately ephemeral, one-turn AI chat for internal testing only.
// No localStorage, no database writes, no family context or automatic AI requests.
export function createAiMediatorExperience({ db, config, escapeHtml, fetchImpl = fetch, onRender = () => {} }) {
  const h = escapeHtml;
  let userId = null;
  let epoch = 0;
  let controller = null;
  let sending = false;
  let draft = '';
  let error = '';
  let remaining = null;
  let turns = [];
  let chats = [];
  let activeChatId = null;
  let loading = false;
  let historyError = '';
  let listRequest = 0;

  const enabled = config.enableAiMediator === true
    && typeof config.aiMediatorUrl === 'string'
    && /^https:\/\/[a-z0-9-]+\.erikbertiljarl\.workers\.dev\/api\/ai\/mediate$/.test(config.aiMediatorUrl);

  const historyEnabled = enabled && config.enableAiHistory === true;
  function notify() { onRender(); }
  async function tokenFor(account) {
    const {data, error: sessionError} = await db.auth.getSession();
    if (sessionError || !data?.session?.access_token || data.session.user?.id !== account) {
      throw new Error('Din inloggning behöver förnyas.');
    }
    return data.session.access_token;
  }
  async function callApi(path, method, account, payload = null, signal) {
    const token = await tokenFor(account);
    const url = config.aiMediatorUrl.replace(/\/mediate$/, '') + path;
    const res = await fetchImpl(url, {
      method,
      headers: {
        Authorization: 'Bearer ' + token,
        ...(payload ? {'Content-Type':'application/json'} : {})
      },
      ...(payload ? {body: JSON.stringify(payload)} : {}),
      ...(signal ? {signal} : {}),
      credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer'
    });
    let result;
    try{result=await res.json();}catch{throw new Error('Servern gav ett oläsligt svar.');}
    if (!res.ok) throw new Error(typeof result?.error === 'string' ? result.error : 'Privata samtal kan inte nås.');
    return result;
  }
  async function loadList() {
    if (!historyEnabled || !userId || loading || sending) return false;
    const epochAtStart = epoch, account = userId, request = ++listRequest;
    loading = true;historyError = '';notify();
    try {
      const data = await callApi('/chats','GET',account);
      if (epoch !== epochAtStart || userId !== account || request !== listRequest) return false;
      if (!Array.isArray(data.chats) || data.chats.length > 12) throw new Error('Samtalslistan är ogiltig.');
      chats = data.chats;
      if (!chats.some(x=>x.id===activeChatId)) activeChatId = chats[0]?.id || null;
      if (activeChatId) await openChat(activeChatId, true);
      else turns = [];
      return true;
    } catch(err) {
      if (epoch===epochAtStart && userId===account) historyError=err?.message||'Samtalslistan kunde inte laddas.';
      return false;
    } finally {
      if (epoch===epochAtStart && userId===account){loading=false;notify();}
    }
  }
  async function createChat() {
    if (!historyEnabled || !userId) return false;
    const account=userId, myEpoch=epoch;
    try {
      const data=await callApi('/chats','POST',account);
      if (myEpoch!==epoch || account!==userId) return false;
      if (!data.chat?.id || !/^[0-9a-f-]{36}$/i.test(data.chat.id)) throw new Error('Samtal kunde inte skapas.');
      chats=[data.chat,...chats];
      activeChatId=data.chat.id;
      turns=[];error='';historyError='';notify();
      return data.chat.id;
    } catch(e) {
      if(myEpoch===epoch && account===userId){historyError=e?.message||'Kunde inte skapa samtal.';notify();}
      return false;
    }
  }
  async function openChat(chatId, preserveLoading=false) {
    if (!historyEnabled || !userId || !chats.some(c=>c.id===chatId) || sending) return false;
    const myEpoch=epoch,account=userId,request=++listRequest;
    activeChatId=chatId;
    if(!preserveLoading)loading=true;
    historyError='';notify();
    try{
      const result=await callApi('/chats/'+encodeURIComponent(chatId),'GET',account);
      if(myEpoch!==epoch || userId!==account || activeChatId!==chatId || request!==listRequest)return false;
      if(!Array.isArray(result.messages) || result.messages.length>40 || result.messages.some(m=>!['user','assistant','safety'].includes(m.role)||typeof m.body!=='string'))throw new Error('Samtalet har ogiltigt innehåll.');
      turns=result.messages.map(m=>({role:m.role,text:m.body}));
      return true;
    }catch(e){if(myEpoch===epoch && userId===account)historyError=e?.message||'Kunde inte öppna samtalet.';return false;}
    finally{if(myEpoch===epoch && userId===account){if(!preserveLoading)loading=false;notify();}}
  }
  async function deleteChat() {
    if (!historyEnabled || !activeChatId || !userId || sending) return false;
    const account=userId,myEpoch=epoch,id=activeChatId;
    try {
      await callApi('/chats/'+encodeURIComponent(id),'DELETE',account);
      if(myEpoch!==epoch || account!==userId)return false;
      chats=chats.filter(c=>c.id!==id);activeChatId=null;turns=[];draft='';error='';remaining=null;
      if(chats.length)await openChat(chats[0].id);
      notify();return true;
    }catch(e){if(myEpoch===epoch && account===userId){historyError=e?.message||'Kunde inte radera samtalet.';notify();}return false;}
  }
  function reset(nextId = null) {
    epoch++;
    if (controller) controller.abort();
    controller = null;
    userId = nextId;
    sending = false;
    draft = '';
    error = '';
    remaining = null;
    turns = [];
    chats = [];
    activeChatId = null;
    loading = false;
    historyError = '';
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
      ? '<section class="mediator-history"><div class="mediator-history-heading"><h2>Privata samtal</h2><button type="button" class="mediator-clear" id="mediator-new"'+(sending?' disabled':'')+'>+ Nytt samtal</button></div>'
        + (loading?'<p>Hämtar dina samtal…</p>':'')
        + (historyError?'<p role="alert" class="mediator-error">'+h(historyError)+'</p>':'')
        + (chats.length ? '<div class="mediator-thread-list" role="group" aria-label="Dina samtal">'
           + chats.map(c=>'<button type="button" data-mediator-open="'+h(c.id)+'"'+(c.id===activeChatId?' aria-current="true"':'')+(sending?' disabled':'')+'>'+h(c.title)+'</button>').join('')+'</div>'
          : '<p>Inga sparade samtal ännu. Skriv nedan så skapas ett privat samtal.</p>')
        + '</section>' : '';
    const messages = turns.length
      ? '<ol class="mediator-messages" aria-label="Tillfälliga testmeddelanden">'
        + turns.map(turn => '<li class="mediator-message mediator-message-' + h(turn.role) + '"><strong>'
          + (turn.role === 'user' ? 'Du' : turn.role === 'safety' ? 'Säkerhetsinformation' : 'Samtalsstödet') + '</strong><p>' + h(turn.text) + '</p></li>').join('')
        + '</ol>'
      : '<p class="mediator-empty">Inga meddelanden ännu. Skriv ett fiktivt exempel för att testa samtalsstödet.</p>';
    const count = draft.length;
    const status = sending ? 'AI:n arbetar…' : error;
    return '<div class="mediator-view">'
      + '<header class="swipe-heading"><span class="swipe-eyebrow">PRIVAT · INTERN TESTVERSION</span><h1>AI-medlaren</h1>'
      + '<p>Utforska konflikter och möjliga samtalsvägar, utan att den andra familjemedlemmen ser chatten.</p></header>'
      + '<div class="live-panel mediator-notice"><h2>Viktig information</h2>'
      + (historyEnabled?'<p><strong>Testa enbart med påhittade situationer.</strong> Dina samtal sparas i en privat testdatabas tills du raderar dem. '
        + 'AI:n kan läsa de senaste meddelandena i just ditt aktuella samtal. '
        : '<p><strong>Testa enbart med påhittade situationer.</strong> Inga meddelanden sparas. '
        + 'Chatten minns inte tidigare turer när den svarar. ')
      + 'Ingen information från Gillaswajpen, '
      + 'personlighetstestet eller familjens inkorg läses in.</p>'
      + '<p>Det här är inte terapi eller krishjälp. Vid akut fara, ring 112.</p></div>'
      + historyBar + '<div class="live-panel mediator-chat">' + messages
      + '<form id="mediator-form">'
      + '<label for="mediator-input"><strong>Ditt testmeddelande</strong></label>'
      + '<textarea id="mediator-input" rows="4" maxlength="2000" placeholder="Exempel: Min förälder tycker att jag använder mobilen för mycket…"'
      + (sending ? ' disabled' : '') + '>' + h(draft) + '</textarea>'
      + '<div class="mediator-actions"><span class="live-muted" id="mediator-char-count">' + count + ' / 2000 tecken</span>'
      + '<button class="live-button" type="submit"' + (sending || !draft.trim() ? ' disabled' : '') + '>Skicka testmeddelande</button>'
      + (historyEnabled ? '<button class="mediator-clear" type="button" id="mediator-delete"' + (!activeChatId || sending ? ' disabled' : '') + '>Radera detta samtal</button>'
        : '<button class="mediator-clear" type="button" id="mediator-clear"' + (!turns.length && !draft && !error || sending ? ' disabled' : '') + '>Rensa chatten</button>') + '</div>'
      + '</form><p role="status" id="mediator-status"' + (error ? ' class="mediator-error"' : '') + '>'
      + h(status) + '</p>'
      + (remaining === null ? '' : '<p class="live-muted">Återstående testsvar i dag: ' + remaining + '</p>')
      + '</div></div>';
  }
  async function submit() {
    if (!enabled || !userId || sending) return false;
    const message = draft.trim();
    if (!message || message.length > 2000) return false;
    const requestEpoch = epoch;
    const requestUser = userId;
    sending = true;
    error = '';
    controller = new AbortController();
    const currentController = controller;
    notify();
    try {
      const accessToken = await tokenFor(requestUser);
      let chatId = activeChatId;
      if (historyEnabled && !chatId) {
        chatId = await createChat();
        if (!chatId) throw new Error(historyError || 'Kunde inte skapa ett privat samtal.');
      }
      if (requestEpoch !== epoch || userId !== requestUser) return false;
      const response = await fetchImpl(config.aiMediatorUrl, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(historyEnabled ? { message, chatId } : { message }),
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
  return { render, reset, clear, input, submit, loadList, createChat, openChat, deleteChat,
    getState: () => ({ userId, sending, draft, error, remaining, turns: turns.map(x => ({ ...x })), chats:chats.map(c=>({...c})),activeChatId,historyError }) };
}
