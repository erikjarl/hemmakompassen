// Accessible internal-test feedback, shared by the app and account page.
// No screenshots, personal answers or private chats are attached automatically.
const CATEGORIES = new Set(['bug', 'content', 'suggestion']);
const ROUTES = new Set(['hem', 'inkorg', 'swipe', 'insikter', 'personlighet', 'kommunikation', 'regler', 'medlare', 'installningar']);

function feedbackPageContext(href) {
  const url = new URL(href);
  const page = url.pathname.endsWith('/') ? 'index.html' : (url.pathname.split('/').filter(Boolean).at(-1) || 'index.html');
  // Account invitation tokens must never be collected as issue context.
  if (page !== 'index.html') return page === 'konto.html' ? 'konto.html' : 'annan-sida';
  const route = url.hash.slice(1).split('/')[0];
  return ROUTES.has(route) ? 'index.html#' + route : 'index.html';
}

function feedbackPayload(userId, fields, href) {
  const category = String(fields.category || '');
  const description = String(fields.description || '').trim();
  const expected = String(fields.expected || '').trim();
  if (!userId || !CATEGORIES.has(category) || description.length < 10 || description.length > 2500 || expected.length > 1000) {
    throw new Error('Välj typ och skriv minst 10 tecken (högst 2 500).');
  }
  return {
    user_id: userId,
    category,
    page_context: feedbackPageContext(href),
    description,
    expected_result: expected || null
  };
}

function installFeedback({ db }) {
  const dialog = document.getElementById('hk-feedback-dialog');
  const open = document.getElementById('hk-feedback-open');
  const form = document.getElementById('hk-feedback-form');
  const close = document.getElementById('hk-feedback-close');
  const status = document.getElementById('hk-feedback-status');
  if (!dialog || !open || !form || !close || !status) return;
  const submit = form.querySelector('button[type="submit"]');
  let busy = false;
  const setStatus = message => { status.textContent = message; };
  open.addEventListener('click', () => {
    if (busy) return;
    form.reset();
    setStatus('');
    dialog.showModal();
    form.elements.category.focus();
  });
  close.addEventListener('click', () => { if (!busy) dialog.close(); });
  dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
  dialog.addEventListener('click', event => {
    if (event.target === dialog && !busy) dialog.close();
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    const fields = {
      category: form.elements.category.value,
      description: form.elements.description.value,
      expected: form.elements.expected.value
    };
    busy = true;
    submit.disabled = true;
    close.disabled = true;
    setStatus('Skickar rapporten…');
    try {
      const { data, error: authError } = await db.auth.getUser();
      if (authError || !data?.user) {
        setStatus('Logga in via Ditt konto och försök sedan igen. Din text ligger kvar.');
        return;
      }
      const payload = feedbackPayload(data.user.id, fields, location.href);
      // Avoid an indefinite disabled form. A deadline cannot determine whether a
      // write succeeded, so never automatically retry a timed-out submission.
      let timeout;
      let result;
      try {
        result = await Promise.race([
          db.from('test_feedback').insert(payload),
          new Promise((_, reject) => {
            timeout = setTimeout(() => reject(Object.assign(new Error('timeout'), { code: 'FEEDBACK_TIMEOUT' })), 15000);
          })
        ]);
      } finally {
        clearTimeout(timeout);
      }
      if (result.error) throw result.error;
      form.reset();
      setStatus('Tack! Rapporten är sparad och kan läsas av projektansvarig.');
    } catch (error) {
      if (error?.code === 'FEEDBACK_TIMEOUT') {
        setStatus('Servern svarade inte i tid. Rapporten kan redan vara sparad. Kontrollera innan du skickar igen.');
      } else if (error?.message?.startsWith('Välj typ')) {
        setStatus(error.message);
      } else {
        console.error('Feedback could not be submitted:', error?.code || error?.message);
        setStatus('Rapporten kunde inte bekräftas som sparad. Din text ligger kvar så att du kan försöka igen.');
      }
    } finally {
      busy = false;
      submit.disabled = false;
      close.disabled = false;
    }
  });
}

// Classic script loaded before the main app/account module. Reuse their auth client.
if (typeof window !== 'undefined') {
  window.HKFeedback = Object.freeze({feedbackPageContext, feedbackPayload, installFeedback});
}
