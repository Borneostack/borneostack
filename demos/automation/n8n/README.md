# Invoice intake in n8n: written, not yet run in n8n

`invoice-intake.workflow.json` is the same flow as the /work/automation example, written as an n8n workflow. **It has been written but not yet run in n8n**, because no n8n instance was available when it was made. It has not been imported, validated by n8n or tested with a real invoice. The page on the website does not link to it and does not claim it runs.

Only the JavaScript in the "Checks and duplicate" Code node was run (in plain Node, with stand-ins for n8n's `$input` and `$`): it reports the wrong-total case and the duplicate case correctly.

## The flow

Gmail Trigger (PDF attachments) -> Extract From File (PDF text) -> Information Extractor (AI, fixed schema, Google Gemini chat model) -> Google Sheets read (the ledger) -> Code (checks and duplicate) -> IF needs review -> Google Sheets append ("Needs review" or "Ledger") -> Telegram message.

Node types and versions were taken from the n8n documentation and node pages as of November 2026. n8n may rename parameters between versions; the import will show which node to fix.

## What has to be connected

1. Credentials: Gmail OAuth2, Google Sheets OAuth2, Google Gemini (PaLM) API key (or swap the chat model for one you already pay for), Telegram bot token.
2. A Gmail label `invoices` that the incoming invoices get (or edit the search in the trigger).
3. A Google spreadsheet with two tabs, `Ledger` and `Needs review`, each with this header row: `supplier, invoice_number, invoice_date, due_date, currency, subtotal, tax, total, due_status, reasons, filed_at`. Put its ID in the three Sheets nodes (`REPLACE_WITH_SPREADSHEET_ID`).
4. The Telegram chat ID in both Telegram nodes (`REPLACE_WITH_CHAT_ID`).

## What to test first

1. Import the file, attach credentials, and run the Extract From File and Information Extractor nodes on one text PDF from `site/public/work/automation/invoices/` using "Execute step".
2. Check the attachment property name. The Gmail Trigger names downloaded attachments `attachment_0`, `attachment_1`; the file assumes `attachment_0`.
3. Check the Information Extractor's output shape: the Code node reads `output` and falls back to the item itself.
4. Run `batu-layar.pdf` (the lines do not match the total): it should go to the "Needs review" tab.
5. Run `tanjung-merpati.pdf` twice: the second should be flagged as a duplicate. The first run needs a header-only `Ledger` tab to work with an empty sheet ("Read ledger" is set to still output when empty).
6. Scanned PDFs have no text, so Extract From File returns nothing. Add a branch for that case; the website version sends them to a person.

## Differences from the website version

- The website version reads PDFs with Cloudflare Workers AI and a small Granite model; this file uses n8n's PDF extraction and a Gemini chat model.
- The website version also checks that each line multiplies out and that the dates are sensible; the Code node here covers the sums, the currency, the missing due date and the duplicate only.
- "build-workflow.mjs" regenerates the JSON file from a readable source.
