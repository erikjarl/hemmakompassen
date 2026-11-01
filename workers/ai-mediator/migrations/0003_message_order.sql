-- Deterministic message ordering even if two exchanges share the same millisecond.
-- All chat data is currently internal test data only.
ALTER TABLE ai_private_chat_messages ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS ai_private_chat_messages_owner_sequence
  ON ai_private_chat_messages(user_id, chat_id, sort_order DESC, id DESC);
