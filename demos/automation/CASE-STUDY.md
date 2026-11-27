# Invoices from the inbox to a spreadsheet, in about nine seconds a file

**Client:** None. Built by BorneoStack as a demonstration · **Industry:** Any business that receives supplier invoices as PDFs · **Date:** 27 November 2026
**Label:** Demo project (not a client project)

## The problem

In many small businesses someone opens each supplier invoice, types the supplier, dates and amounts into a spreadsheet, and reminds the owner what is due. A mistyped digit, an invoice entered twice or a missed due date is easy to overlook. This demonstration has no real business behind it, so there is no measured "before" figure.

## What I built

A workflow that reads a supplier invoice PDF, copies the supplier, invoice number, dates, line items and totals into fixed fields, and then checks the numbers with ordinary code: each line, the subtotal, the tax, the total, the dates and the currency. It looks for a duplicate (same supplier and invoice number), adds a row to a ledger, and writes the short alert a manager would receive. Anything doubtful, such as a total that does not match its lines or a missing due date, goes to a person with the reason. It runs on Cloudflare (a Worker, a D1 database and Workers AI) inside the free plan, and can be tried at /work/automation with eight made-up invoices or with the visitor's own PDF.

## The result

Measured on 27 November 2026 against the live local API, on the eight sample invoices the system was tuned with (so this is a working check, not a blind test):

| Measure | Result |
| --- | --- |
| Fields read correctly from the 7 invoices that contain text | 63 of 63 (9 fields each) |
| Invoices where the workflow did what was intended (filed, sent to review, caught as duplicate) | 8 of 8 |
| Average time for one run | about 8.5 seconds, almost all in the model step |
| Average Workers AI cost for one run | about 3.6 neurons (the free allowance is 10,000 a day for the account) |

What it does not do: read scans or photos (the sample scan is sent to a person), read invoices in other currencies (sent to a person), or connect to a real inbox, spreadsheet or accounting system. The first test run found the model inventing a subtotal for an invoice that prints only a total; the instructions were tightened and the test repeated.

## In their words

No client, so no testimonial.

## Screenshot or 60-second video

Not yet made. The live example is at /work/automation.

---

*Permission to publish: Not applicable (demonstration project, fictional suppliers and buyer) · Date agreed: Not applicable*
