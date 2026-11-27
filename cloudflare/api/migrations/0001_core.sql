-- Shared tables: request counters per visitor and the daily Workers AI allowance.
CREATE TABLE IF NOT EXISTS rate_limit (
  key TEXT PRIMARY KEY,          -- "<bucket>:<visitor hash>:<window start>"
  n INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL    -- unix seconds; rows past this are deleted by the daily job
);

CREATE TABLE IF NOT EXISTS ai_usage (
  day TEXT PRIMARY KEY,          -- UTC date, YYYY-MM-DD (the free allowance resets at 00:00 UTC)
  neurons REAL NOT NULL DEFAULT 0,
  calls INTEGER NOT NULL DEFAULT 0
);
