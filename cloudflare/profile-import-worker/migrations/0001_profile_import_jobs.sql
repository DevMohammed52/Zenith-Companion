CREATE TABLE IF NOT EXISTS import_jobs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  target_hash_encrypted TEXT NOT NULL,
  target_hash_fingerprint TEXT NOT NULL,
  requester_fingerprint TEXT NOT NULL,
  requested_options_json TEXT NOT NULL DEFAULT '{}',
  result_json TEXT,
  request_count INTEGER NOT NULL DEFAULT 0,
  retry_count INTEGER NOT NULL DEFAULT 0,
  error_code TEXT,
  error_message TEXT,
  budget_mode TEXT NOT NULL DEFAULT 'unknown',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_import_jobs_status_created
  ON import_jobs (status, created_at);

CREATE INDEX IF NOT EXISTS idx_import_jobs_hash_created
  ON import_jobs (target_hash_fingerprint, created_at);

CREATE INDEX IF NOT EXISTS idx_import_jobs_requester_created
  ON import_jobs (requester_fingerprint, created_at);

CREATE TABLE IF NOT EXISTS cooldowns (
  scope TEXT NOT NULL,
  key_fingerprint TEXT NOT NULL,
  until_at TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (scope, key_fingerprint)
);

CREATE TABLE IF NOT EXISTS minute_budgets (
  minute_key TEXT NOT NULL,
  source TEXT NOT NULL,
  used_requests INTEGER NOT NULL DEFAULT 0,
  mode TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (minute_key, source)
);
