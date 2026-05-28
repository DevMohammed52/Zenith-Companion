CREATE TABLE IF NOT EXISTS app_error_events (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  event_type TEXT NOT NULL,
  path TEXT NOT NULL,
  digest TEXT,
  app_version TEXT,
  browser_class TEXT,
  user_agent_family TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_app_error_events_created
  ON app_error_events (created_at);

CREATE INDEX IF NOT EXISTS idx_app_error_events_path_created
  ON app_error_events (path, created_at);

CREATE INDEX IF NOT EXISTS idx_app_error_events_digest_created
  ON app_error_events (digest, created_at);
