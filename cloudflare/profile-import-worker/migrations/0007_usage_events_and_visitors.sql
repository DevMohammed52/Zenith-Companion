DROP INDEX IF EXISTS idx_usage_events_visitor_created;
DROP INDEX IF EXISTS idx_usage_events_session_created;
DROP INDEX IF EXISTS idx_usage_events_path_created;

CREATE INDEX IF NOT EXISTS idx_usage_events_summary
  ON usage_events (created_at, event_type, visitor_fingerprint, session_fingerprint);

CREATE INDEX IF NOT EXISTS idx_usage_events_pages
  ON usage_events (event_type, created_at, path);

CREATE TABLE IF NOT EXISTS usage_visitors (
  visitor_fingerprint TEXT PRIMARY KEY,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  total_events INTEGER NOT NULL DEFAULT 1,
  total_pageviews INTEGER NOT NULL DEFAULT 0,
  device_type TEXT,
  country TEXT
);

CREATE INDEX IF NOT EXISTS idx_usage_visitors_last_seen
  ON usage_visitors (last_seen_at);

CREATE INDEX IF NOT EXISTS idx_usage_visitors_first_seen
  ON usage_visitors (first_seen_at);

INSERT OR IGNORE INTO usage_visitors (
  visitor_fingerprint, first_seen_at, last_seen_at, total_events, total_pageviews, device_type, country
)
SELECT
  visitor_fingerprint,
  MIN(created_at) AS first_seen_at,
  MAX(created_at) AS last_seen_at,
  COUNT(*) AS total_events,
  SUM(CASE WHEN event_type = 'pageview' THEN 1 ELSE 0 END) AS total_pageviews,
  MAX(device_type) AS device_type,
  MAX(country) AS country
FROM usage_events
GROUP BY visitor_fingerprint;
