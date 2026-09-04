---
paths:
  - "src/lib/brightdata/**"
  - "src/features/scraping/**"
  - "src/app/api/webhooks/brightdata/**"
---

# Bright Data rules

The Web Scraper API integration: `lib/brightdata/client.ts` talks to Bright
Data, `features/scraping/` owns scrape jobs, and
`app/api/webhooks/brightdata/route.ts` receives deliveries. Verified against
Bright Data's published SDKs and API reference (datasets v3).

- **Synchronous endpoint, webhook completion.** `scrape` in `lib/brightdata/client.ts` calls `POST /datasets/v3/scrape` (at most 20 inputs, `format=json`, `include_errors=true`) and passes our webhook URL as both `endpoint` (records) and `notify` (status notice), with `auth_header` and `uncompressed_webhook=true`. A 200 carries the records; a 202 carries a `snapshot_id` and the webhook finishes the job. Our own `SCRAPE_TIMEOUT_MS` abort leaves the job `running` with no snapshot id; a 202 without a `snapshot_id` is `EXTERNAL_SERVICE` and the job is stored `failed`. Never add polling loops; `downloadSnapshot` exists only for the `ready` notice.
- **The job id travels in the webhook URL** (`?job=<uuid>`; the parameter name is `SCRAPE_JOB_QUERY_PARAM`, the URL is built by `scrapeWebhookUrl`). Bright Data sends no event id of its own, so the idempotency key is `<jobId>:delivery` or `<jobId>:notification:<status>` and lives on the event as `id`.
- **Authentication is a per-job token**, not a signature: `webhookAuthorization(jobId)` derives `Bearer <HMAC-SHA256(BRIGHTDATA_WEBHOOK_SECRET, jobId)>`, which is registered as `auth_header` and comes back as `Authorization`; `verifyBrightDataWebhook` recomputes it from the `job` parameter and compares timing-safe before reading the body, so the secret never leaves the server and a leaked URL authorises one job. A bad token is `UNAUTHENTICATED` (401), a missing job id or unrecognised body `VALIDATION` (400); both stop retries. Bodies are capped at `MAX_WEBHOOK_BODY_BYTES` and a gzipped body is inflated under the same cap, in case `uncompressed_webhook` is ever ignored.
- **One capability, one writer path.** `runScrapeJob` (`features/scraping/scrape.ts`) inserts the row under RLS as the user, calls Bright Data, and records the answer. Every status or records write, from that answer or from the webhook, goes through `applyScrapeOutcome` in `features/scraping/jobs.ts` with the admin client, because `scrape_jobs` has no client update policy on purpose. `getScrapeJobAsSystem` is the only other admin read; keep both in `jobs.ts`. The `scrape_jobs` insert grant is column-level (`user_id`, `dataset_id`, `input`), so a client cannot create a finished job through the Data API either.
- **Job states are Bright Data's words**: `running`, `ready`, `failed` (enum `scrape_job_status`). A ready or failed job is final: the webhook handler skips events for it, and `applyScrapeOutcome` updates only rows still `running`, so the first terminal outcome wins even when a delivery and a status notice race. `records` holds the delivered array verbatim, error records included; `error` is a fixed user-safe sentence, never provider text.
- **Retries are Bright Data's job.** The webhook route returns non-2xx (through `runOnce`) when the job is unknown or the snapshot is not downloadable yet, and 2xx once it is stored or already finished.
- Secrets come only from `serverEnv` (`BRIGHTDATA_API_KEY`, `BRIGHTDATA_WEBHOOK_SECRET`); both modules are `server-only`. Log ids and counts (`scraping.scrape_job.*`, `scraping.brightdata_event.*`, `brightdata.request.failed`), never records.
- **Before exposing `runScrapeJob` to a form, tool, or route**: every call is billed to the operator's key and `datasetId` is caller-supplied, so add an allowlist of dataset ids in `src/config/` and a per-user cap on running or recent jobs first. Nothing calls it yet.
- Local testing: Bright Data must reach the webhook, so expose the dev server with a tunnel and set `NEXT_PUBLIC_SITE_URL` to the tunnel origin.
