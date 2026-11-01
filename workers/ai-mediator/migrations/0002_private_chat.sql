-- AI-01B: private, opt-in chat storage on the existing EU-jurisdiction D1 database.
-- Identity is always the Supabase Auth /auth/v1/user id verified by Worker.
-- Never use a client-provided user_id or family_id as authority.
CREATE TABLE IF NOT EXISTS ai_private_chat_threads (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Nytt samtal',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ai_private_chat_threads_user_updated
  ON ai_private_chat_threads(user_id, updated_at DESC);
CREATE TABLE IF NOT EXISTS ai_private_chat_messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','safety')),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (chat_id) REFERENCES ai_private_chat_threads(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ai_private_chat_messages_chat_history
  ON ai_private_chat_messages(user_id, chat_id, created_at DESC, id DESC);
