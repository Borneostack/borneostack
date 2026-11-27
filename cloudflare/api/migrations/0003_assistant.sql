-- Document assistant: the document list, the passages cut from the PDFs with their embeddings, and a keyword index.
CREATE TABLE IF NOT EXISTS assistant_documents (
  id TEXT PRIMARY KEY,           -- file name without .pdf
  title TEXT NOT NULL,
  file TEXT NOT NULL,            -- served from the site at /work/assistant/docs/<file>
  pages INTEGER NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS assistant_passages (
  id INTEGER PRIMARY KEY,
  doc_id TEXT NOT NULL,
  page INTEGER NOT NULL,
  heading TEXT NOT NULL DEFAULT '',
  text TEXT NOT NULL,
  -- 1024-dimension bge-m3 vector scaled to int8 and stored as base64 (about 1.4 KB). D1 returns BLOB columns as
  -- JSON arrays of numbers, which costs far more CPU to read than one short string.
  embedding TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS assistant_passages_doc ON assistant_passages (doc_id, page);

-- Keyword search. rowid is the passage id. Filled by the ingest route together with assistant_passages.
CREATE VIRTUAL TABLE IF NOT EXISTS assistant_fts USING fts5(heading, text, tokenize = 'porter unicode61 remove_diacritics 2');

-- One row, "version": changes whenever the passages change, so a running Worker knows to reload its in-memory copy.
CREATE TABLE IF NOT EXISTS assistant_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
