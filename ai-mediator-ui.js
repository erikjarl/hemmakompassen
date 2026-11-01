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

  const enabled = config.enableAiMediator === true
    && typeof config.aiMediatorUrl === 'string'
    && /^https:\/\/[a-z0-9-]+\.erikbertiljarl\.workers\.dev\/api\/ai\/mediate$/.test(config.aiMediatorUrl);

  function notify() { onRender(); }
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
      + '<p><strong>Testa enbart med påhittade situationer.</strong> Inga meddelanden sparas. '
      + 'Chatten minns inte tidigare turer när den svarar. Ingen information från Gillaswajpen, '
      + 'personlighetstestet eller familjens inkorg läses in.</p>'
      + '<p>Det här är inte terapi eller krishjälp. Vid akut fara, ring 112.</p></div>'
      + '<div class="live-panel mediator-chat">' + messages
      + '<form id="mediator-form">'
      + '<label for="mediator-input"><strong>Ditt testmeddelande</strong></label>'
      + '<textarea id="mediator-input" rows="4" maxlength="2000" placeholder="Exempel: Min förälder tycker att jag använder mobilen för mycket…"'
      + (sending ? ' disabled' : '') + '>' + h(draft) + '</textarea>'
      + '<div class="mediator-actions"><span class="live-muted" id="mediator-char-count">' + count + ' / 2000 tecken</span>'
      + '<button class="live-button" type="submit"' + (sending || !draft.trim() ? ' disabled' : '') + '>Skicka testmeddelande</button>'
      + '<button class="mediator-clear" type="button" id="mediator-clear"' + (!turns.length && !draft && !error || sending ? ' disabled' : '') + '>Rensa chatten</button></div>'
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
      const { data, error: sessionError } = await db.auth.getSession();
      if (sessionError || !data?.session?.access_token || data.session.user?.id !== requestUser) {
        throw new Error('Din inloggning behöver förnyas.');
      }
      const response = await fetchImpl(config.aiMediatorUrl, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + data.session.access_token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message }),
        signal: currentController.signal,
        cache: 'no-store',
        credentials: 'omit',
        referrerPolicy: 'no-referrer'
      });
      let result;
      try { result = await response.json(); }
      catch { throw new Error('AI:n gav inget läsbart svar.'); }
      if (requestEpoch !== epoch || userId !== requestUser) return false;
      if (!response.ok || typeof result?.reply !== 'string' || !result.reply.trim() || result.reply.length > 15000) {
        throw new Error(typeof result?.error === 'string' && result.error.length < 180
          ? result.error : 'AI:n kunde inte svara just nu.');
      }
      turns = [...turns, { role: 'user', text: message }, { role: result.safetyNotice === true ? 'safety' : 'assistant', text: result.reply.trim() }];
      if (turns.length > 30) turns = turns.slice(-30);
      draft = '';
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
  return { render, reset, clear, input, submit,
    getState: () => ({ userId, sending, draft, error, remaining, turns: turns.map(x => ({ ...x })) }) };
}
