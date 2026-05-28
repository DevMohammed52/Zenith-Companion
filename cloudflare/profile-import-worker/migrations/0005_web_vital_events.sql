CREATE TABLE IF NOT EXISTS web_vital_events (
  id TEXT PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  metric_rating TEXT NOT NULL DEFAULT 'unknown',
  path TEXT NOT NULL,
  device_type TEXT NOT NULL DEFAULT 'unknown',
  navigation_type TEXT NOT NULL DEFAULT 'unknown',
  user_agent_family TEXT NOT NULL DEFAULT 'unknown',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_web_vital_events_created_at
  ON web_vital_events(created_at);

CREATE INDEX IF NOT EXISTS idx_web_vital_events_metric_created_at
  ON web_vital_events(metric_name, created_at);

CREATE INDEX IF NOT EXISTS idx_web_vital_events_rating_created_at
  ON web_vital_events(metric_rating, created_at);

CREATE INDEX IF NOT EXISTS idx_web_vital_events_path_created_at
  ON web_vital_events(path, created_at);
