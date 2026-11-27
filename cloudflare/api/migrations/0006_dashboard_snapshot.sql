-- Dashboard example: the page's snapshot, built once at the end of each refresh and stored as one row of JSON text.
-- A visitor's request reads this row and returns it as it is, so the Worker never loops over the points on a request.
CREATE TABLE IF NOT EXISTS dash_snapshot (
  id INTEGER PRIMARY KEY CHECK (id = 1),  -- one row only
  built_at TEXT NOT NULL,                 -- ISO UTC, the same value as "generatedAt" inside the body
  body TEXT NOT NULL                      -- the whole snapshot, as the API returns it
);
