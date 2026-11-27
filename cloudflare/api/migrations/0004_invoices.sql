-- Invoice automation example: the visitor's ledger. Rows belong to one browser session (only a hash of its random
-- id is stored), are hidden after 24 hours and are deleted by the next run or the daily job (within two days).
-- Uploaded files are never stored.
CREATE TABLE IF NOT EXISTS invoice_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,          -- unix seconds
  status TEXT NOT NULL,                 -- 'filed' or 'review'
  source TEXT NOT NULL,                 -- 'sample:<id>' or 'upload'
  filename TEXT,
  supplier TEXT,
  invoice_no TEXT,
  supplier_key TEXT,                    -- lower-case letters and digits only, for the duplicate check
  invoice_key TEXT,
  invoice_date TEXT,
  due_date TEXT,
  currency TEXT,
  subtotal REAL,
  tax REAL,
  total REAL,
  due_status TEXT,                      -- 'overdue', 'due_soon', 'later' or 'unknown'
  reasons TEXT                          -- JSON array of plain-language reasons (review rows)
);
CREATE INDEX IF NOT EXISTS invoice_ledger_session ON invoice_ledger (session_hash, id);
CREATE INDEX IF NOT EXISTS invoice_ledger_dupe ON invoice_ledger (session_hash, supplier_key, invoice_key);
CREATE INDEX IF NOT EXISTS invoice_ledger_age ON invoice_ledger (created_at);
