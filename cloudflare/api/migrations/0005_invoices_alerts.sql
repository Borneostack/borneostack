-- Invoice automation example: how many Telegram messages the demo has posted today, across all visitors.
-- The Worker allows a handful a day so nobody can use the sample invoices to fill the owner's chat.
CREATE TABLE IF NOT EXISTS invoice_alert_sends (
  day TEXT PRIMARY KEY,                 -- UTC date, YYYY-MM-DD
  n INTEGER NOT NULL
);
