ALTER TABLE import_jobs ADD COLUMN current_step TEXT NOT NULL DEFAULT 'root_baseline';
ALTER TABLE import_jobs ADD COLUMN step_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE import_jobs ADD COLUMN step_data_json TEXT;
ALTER TABLE import_jobs ADD COLUMN lease_expires_at TEXT;
ALTER TABLE import_jobs ADD COLUMN lease_token TEXT;

CREATE INDEX IF NOT EXISTS idx_import_jobs_step_lease
  ON import_jobs (status, step_status, lease_expires_at);
