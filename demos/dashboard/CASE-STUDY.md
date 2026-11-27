# Sabah business conditions in one view: five public datasets on one page, with the source and date of every figure

**Client:** None. This is a demonstration project built by BorneoStack · **Industry:** Any business that watches public economic figures (trading, logistics, retail, tourism) · **Date:** 27 November 2026
**Label:** Demo project (not a client project)

## The problem

The figures a Sabah business owner might watch are published on different government pages, each with its own download and update day. In this build that meant five datasets from three publishers (Ministry of Finance, Bank Negara Malaysia, Department of Statistics Malaysia), updated daily, weekly, monthly, quarterly and yearly. Checking them by hand means five pages and five formats each time.

## What I built

A Cloudflare Worker reads the five datasets from the data.gov.my open data API every morning at 06:00 Kota Kinabalu time and stores the figures in one database (Cloudflare D1). A single web page shows them: the latest value, the change on the previous period and the date of each value, charts with a time-range switch, Sabah set against Malaysia where the data allows it, and a "show as table" switch under each chart. Under every chart one line gives the publisher and the date the data runs to, and opens to the dataset link, the update frequency, the time of the last fetch and the licence. Where the source changed how a line should be read, the chart marks the date and says why: the East Malaysia diesel price steps on 1 July 2026, when the dataset's own note says East Malaysia moved to the BUDI Diesel scheme. A strip shows the last 14 runs of the daily job, taken from the job's own log; it starts empty and fills as the job runs. The page is built from a saved copy of the data so it opens with figures, then replaces them with live ones; if the API cannot be reached it keeps the saved copy and says which date it is from.

## The result

This is a demonstration, so there is no client result. What was measured on a local run on 27 November 2026:

| Measure | Value | How it was checked |
| --- | --- | --- |
| Datasets and series | 5 datasets, 8 requests, 11 series | Counted in `cloudflare/api/src/dashboard/sources.ts` |
| Figures stored | 2,476 | `SELECT COUNT(*)` on the local database after loading the history |
| Duplicates after running the job twice | 0 (2,476 figures and 2,476 distinct series-and-date pairs before and after) | Two scheduled runs; the second reported 0 new or changed figures |
| Time for one full daily run | About 1 minute 52 seconds | Timed on a local run. Most of it is deliberate waiting: the API allows 4 requests a minute, so requests are 16 seconds apart |
| Figures spot-checked against the live API | 3 of 3 matched: RON95 RM 3.47 (26 Nov 2026), Sabah unemployment 5.8% (Q3 2026), Sabah inflation 1.9% (Oct 2026) | Compared with a direct call to api.data.gov.my |
| Automated tests | 11 passing | `cloudflare/api/test/dashboard`. They cover request spacing, a 429 reply, a repeated run, a source that fails while the others succeed, a source that returns nothing, and the stored snapshot (built once per run, returned as stored, not rebuilt on a request) |

The comparison "before" (checking five pages by hand) was not timed, so no time saving is claimed.

## In their words

None. There is no client.

## Screenshot or 60-second video

Not recorded yet. The live example is at `/work/dashboard` on the BorneoStack site.

## Notes

- All figures come from data.gov.my and OpenDOSM, made open under the Creative Commons Attribution 4.0 International licence (CC BY 4.0). Figures are shown as published.
- The API limit of 4 requests a minute is stated at https://developer.data.gov.my/rate-limit.

---

*Permission to publish: Not applicable (no client) · Date agreed: not applicable*
