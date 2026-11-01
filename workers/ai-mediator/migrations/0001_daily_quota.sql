-- Count AI requests only. No chat content is stored in D1.
CREATE TABLE IF NOT EXISTS ai_daily_user_usage (
  user_id TEXT NOT NULL,
  day_utc TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  PRIMARY KEY (user_id, day_utc)
);
