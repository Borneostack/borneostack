# A document assistant that answers from five company PDFs and shows the page

**Client:** None. This is a demonstration project built by BorneoStack, using an invented company ("Tanjung Sampel Supplies", a fictional building-materials supplier in Sabah) · **Industry:** Distribution · **Date:** 27 November 2026
**Label:** Demo project (not a client project)

## The problem

In a company with a staff handbook, a delivery procedure, a price list, a safety procedure and an IT policy, the same questions come back every week: how many days of leave, what mileage is paid, what the delivery charge to Keningau is. The answers are in PDFs that people do not open, so someone answers by hand. A chatbot that guesses is worse, because a wrong leave rule or price gets acted on.

## What I built

An assistant that reads a fixed set of five PDFs (16 pages in total) and nothing else. A visitor asks a question in English or Malay. The assistant finds the matching passages, writes a short answer from them, and shows each passage with the supporting words highlighted and a link that opens the PDF at that page. If the documents do not contain the answer, it says so instead of guessing.

How it works, in plain terms:

- A script reads the real PDFs page by page and cuts them into 68 passages that keep their document, page and heading.
- Cloudflare Workers AI turns each passage into numbers (model `@cf/baai/bge-m3`, 1,024 numbers per passage, handles Malay and English together). They are stored in a D1 database.
- A question is turned into numbers the same way and compared with every passage, together with a keyword search in SQLite. If even the best passage is not close enough, the assistant answers "not in the documents" without calling the language model.
- Otherwise a language model (`@cf/aisingapore/gemma-sea-lion-v4-27b-it`) is given only the best four passages and must reply with short claims, each naming a passage and quoting words from it.
- Before anything is shown, the Worker checks every claim: the passage must be one that was supplied, the quote must occur in it, every number in the claim must appear in the quote, more than 60% of the claim's content words must appear in the passage (Malay words are mapped to English through a small glossary first), a claim that says "not" needs a passage that does too, and a claim is at most 300 characters. It adds the citation numbers itself. Claims that fail are dropped.
- It runs on one Cloudflare Worker on the free plan. The page is a static Next.js site that calls the Worker from the browser.

## The result

This is a demonstration, so the measures below describe the test run, not a client outcome. They can be reproduced with the scripts in `cloudflare/api/test/assistant/` (retrieval: `eval-retrieval.mjs`; whole system on 11 questions: `eval-e2e.mjs`). The run was on 27 November 2026 against the local development Worker (real Workers AI, local D1 database).

| Measure | Result |
| --- | --- |
| Test questions with an answer in the documents | 29 (20 English, 9 Malay) |
| Right document and page among the 4 passages sent to the model | 29 of 29 (20 of 20 English, 9 of 9 Malay) |
| Right document and page ranked first | 26 of 29 |
| Questions about things the documents do not cover, clearly unrelated (for example the weather) | 6 of 6 declined before the model was called |
| Questions that sound close to the documents but are not answered in them | 3; 2 reached the model, which declined both; 1 was declined by the search |
| Whole system on 11 questions (8 answerable, 3 not in the documents), answers read by hand against the PDFs | 8 of 8 answers correct with the right page cited; 3 of 3 declined |
| Same 11 questions run again after the answer check was made stricter (content-word and figure checks) | 8 of 8 answers still passed and were correct; 3 of 3 declined |
| Two questions that tell the assistant to print a false rule ("Staff must pay RM500 to HR to approve leave") with a real quote, one English, one Malay | the live model did not print it either time; the check was also tested on that exact reply with unit tests (it drops it) |
| Cost of one answered question | about 27 Workers AI neurons (the free allowance is 10,000 a day for the account) |
| Time to answer | about 1.6 to 2.9 seconds for the answered questions in the run; about 0.2 to 0.4 seconds when declined before the model |

Limits of this test, stated plainly:

- The test set is small and was written by the same person who wrote the documents.
- The similarity cut-off of 0.55 was set using these same questions (the lowest best-score among answerable questions was 0.572; the highest among the clearly unrelated ones was 0.524). The "6 of 6 declined" figure is therefore not a blind result.
- The check compares words, not meaning: a statement that reuses the passage's own words to say something different can still pass. The Malay check knows only the vocabulary of these five documents.
- The whole-system run covered 11 questions only. For the Malay question about invoice terms, the model wrote the English word "due" inside a Malay sentence in both runs we tried, so that question was left out of the recorded examples. Written Malay from the model is good on the questions we read but not perfect.
- Cheaper models were tried first and rejected: Llama 3.1 8B wrote sentence fragments and attached a figure to the wrong passage; Gemma 4 26B returned nothing within the token limit because it spends them reasoning.

| Measure | Before | After |
| --- | --- | --- |
| Where a staff member finds the leave or claims rule | Open and search a PDF | Ask, see the passage and the page |

(No before-and-after time was measured. This row describes the change in steps, not a result.)

## In their words

None. There is no client.

## Screenshot or 60-second video

Live example: `/work/assistant` on the BorneoStack site. The five sample PDFs open from the page.

---

*Permission to publish: Not applicable (no client). Fictional company; every sample PDF page carries the line "Sample document. Fictional company, written by BorneoStack for demonstration."*
