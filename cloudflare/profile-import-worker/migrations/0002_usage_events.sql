CREATE TABLE IF NOT EXISTS usage_events (
  id TEXT PRIMARY KEY,
  visitor_fingerprint TEXT NOT NULL,
  session_fingerprint TEXT NOT NULL,
  event_type TEXT NOT NULL,
  path TEXT NOT NULL,
  referrer_host TEXT,
  device_type TEXT,
  timezone TEXT,
  country TEXT,
  user_agent_family TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_usage_events_created
  ON usage_events (created_at);

CREATE INDEX IF NOT EXISTS idx_usage_events_visitor_created
  ON usage_events (visitor_fingerprint, created_at);

CREATE INDEX IF NOT EXISTS idx_usage_events_session_created
  ON usage_events (session_fingerprint, created_at);

CREATE INDEX IF NOT EXISTS idx_usage_events_path_created
  ON usage_events (path, created_at);
