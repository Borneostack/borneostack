-- Dashboard example: public datasets from data.gov.my, one row per figure, plus a log of every refresh run.
CREATE TABLE IF NOT EXISTS dash_sources (
  id TEXT PRIMARY KEY,               -- "fuel", "fx", "inflation", "labour", "gdp"
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  publisher TEXT NOT NULL,           -- who publishes the numbers (DOSM, BNM, MOF)
  dataset_id TEXT NOT NULL,          -- id on api.data.gov.my (the first one, when a source uses two)
  page_url TEXT NOT NULL,            -- the human-readable dataset page
  frequency TEXT NOT NULL,           -- daily, weekly, monthly, quarterly, yearly
  note TEXT NOT NULL DEFAULT '',
  data_as_of TEXT,                   -- "data_as_of" from the API's own metadata, kept as given
  next_update TEXT,                  -- "next_update" from the API's metadata
  last_fetched_at TEXT,              -- last SUCCESSFUL fetch (ISO UTC)
  last_attempt_at TEXT,
  last_status TEXT,                  -- ok | failed
  last_error TEXT
);

CREATE TABLE IF NOT EXISTS dash_series (
  id TEXT PRIMARY KEY,               -- "fuel.ron95", "cpi.sabah"
  source_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  label TEXT NOT NULL,
  geo TEXT NOT NULL,                 -- Sabah, Malaysia or East Malaysia
  unit TEXT NOT NULL,                -- "RM per litre", "%"
  decimals INTEGER NOT NULL DEFAULT 2
);

CREATE TABLE IF NOT EXISTS dash_points (
  series_id TEXT NOT NULL,
  date TEXT NOT NULL,                -- YYYY-MM-DD, the date the figure is for
  value REAL NOT NULL,
  PRIMARY KEY (series_id, date)      -- a second run updates a point in place, it never adds a copy
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS dash_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trigger TEXT NOT NULL,             -- scheduled | manual | backfill
  started_at TEXT NOT NULL,
  finished_at TEXT,
  status TEXT NOT NULL,              -- running | succeeded | partial | failed
  rows_written INTEGER NOT NULL DEFAULT 0,  -- new or changed points only
  results TEXT NOT NULL DEFAULT '[]' -- JSON: one entry per source { source, status, fetched, changed, error }
);
CREATE INDEX IF NOT EXISTS dash_runs_trigger ON dash_runs (trigger, id DESC);
