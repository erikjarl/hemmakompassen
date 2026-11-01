// Private AI chat data access. Every query uses the verified Supabase user id.
// D1 is EU-jurisdiction. No family IDs, emails, private test results or API secrets.
export const CHAT_LIMIT = 12;
export const HISTORY_LIMIT = 40;
export const CONTEXT_LIMIT = 10;
export const CHAT_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function listPrivateChats(db, userId) {
  const r = await db.prepare(
    'SELECT id, title, created_at, updated_at FROM ai_private_chat_threads ' +
    'WHERE user_id = ? ORDER BY updated_at DESC, id DESC LIMIT ?'
  ).bind(userId, CHAT_LIMIT).all();
  return r.results || [];
}
export async function createPrivateChat(db, userId, id, at) {
  const count = await db.prepare(
    'SELECT COUNT(*) AS n FROM ai_private_chat_threads WHERE user_id = ?'
  ).bind(userId).first();
  if (Number(count?.n || 0) >= CHAT_LIMIT) return {tooMany: true};
  await db.prepare(
    'INSERT INTO ai_private_chat_threads (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, userId, 'Nytt samtal', at, at).run();
  return {id, title: 'Nytt samtal', created_at: at, updated_at: at};
}
export async function getPrivateChat(db, userId, chatId) {
  const chat = await db.prepare(
    'SELECT id, title, created_at, updated_at FROM ai_private_chat_threads WHERE id = ? AND user_id = ?'
  ).bind(chatId, userId).first();
  if (!chat) return null;
  const r = await db.prepare(
    'SELECT id, role, body, created_at FROM ai_private_chat_messages ' +
    'WHERE chat_id = ? AND user_id = ? ORDER BY created_at DESC, id DESC LIMIT ?'
  ).bind(chatId, userId, HISTORY_LIMIT).all();
  return {chat, messages: (r.results || []).reverse()};
}
export async function deletePrivateChat(db, userId, chatId) {
  // Foreign key ON DELETE CASCADE prevents orphaned messages.
  const r = await db.prepare(
    'DELETE FROM ai_private_chat_threads WHERE id = ? AND user_id = ?'
  ).bind(chatId, userId).run();
  return (r.meta?.changes || 0) > 0;
}
export async function contextForChat(db, userId, chatId) {
  const chat = await db.prepare(
    'SELECT id FROM ai_private_chat_threads WHERE id = ? AND user_id = ?'
  ).bind(chatId, userId).first();
  if (!chat) return null;
  const count = await db.prepare(
    'SELECT COUNT(*) AS n FROM ai_private_chat_messages WHERE chat_id = ? AND user_id = ?'
  ).bind(chatId, userId).first();
  if (Number(count?.n || 0) >= HISTORY_LIMIT) return {full: true};
  const r = await db.prepare(
    'SELECT role, body FROM ai_private_chat_messages WHERE chat_id = ? AND user_id = ? ' +
    'ORDER BY created_at DESC, id DESC LIMIT ?'
  ).bind(chatId, userId, CONTEXT_LIMIT).all();
  return {rows: (r.results || []).reverse()};
}
export async function saveExchange(db, userId, chatId, userText, replyText, replyRole, now, ids) {
  // Batch is transactional in D1. The owner predicate is repeated on BOTH inserts.
  // If a user deletes a chat while inference is running, its messages are NOT resurrected.
  const first = now.toISOString();
  const second = new Date(now.valueOf() + 1).toISOString();
  const title = userText.slice(0, 70);
  const x = await db.batch([
    db.prepare(
      'INSERT INTO ai_private_chat_messages (id, chat_id, user_id, role, body, created_at) ' +
      "SELECT ?, id, user_id, 'user', ?, ? FROM ai_private_chat_threads " +
      'WHERE id = ? AND user_id = ?'
    ).bind(ids[0], userText, first, chatId, userId),
    db.prepare(
      'INSERT INTO ai_private_chat_messages (id, chat_id, user_id, role, body, created_at) ' +
      'SELECT ?, id, user_id, ?, ?, ? FROM ai_private_chat_threads WHERE id = ? AND user_id = ?'
    ).bind(ids[1], replyRole, replyText, second, chatId, userId),
    db.prepare(
      "UPDATE ai_private_chat_threads SET updated_at = ?, title = CASE WHEN title = 'Nytt samtal' THEN ? ELSE title END " +
      'WHERE id = ? AND user_id = ?'
    ).bind(second, title, chatId, userId)
  ]);
  return (x?.[0]?.meta?.changes || 0) === 1 && (x?.[1]?.meta?.changes || 0) === 1;
}
