CREATE TABLE IF NOT EXISTS import_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  job_id TEXT,
  requester_fingerprint TEXT,
  target_hash_fingerprint TEXT,
  status TEXT,
  error_code TEXT,
  budget_mode TEXT,
  request_count INTEGER NOT NULL DEFAULT 0,
  retry_count INTEGER NOT NULL DEFAULT 0,
  duration_seconds REAL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_import_events_created
  ON import_events (created_at);

CREATE INDEX IF NOT EXISTS idx_import_events_type_created
  ON import_events (event_type, created_at);

CREATE INDEX IF NOT EXISTS idx_import_events_requester_created
  ON import_events (requester_fingerprint, created_at);

CREATE INDEX IF NOT EXISTS idx_import_events_target_created
  ON import_events (target_hash_fingerprint, created_at);

CREATE INDEX IF NOT EXISTS idx_import_events_job_created
  ON import_events (job_id, created_at);
