---
paths:
  - "src/lib/brightdata/**"
  - "src/features/scraping/**"
  - "src/app/api/webhooks/brightdata/**"
---

# Bright Data scraping rules

One scrape is one asynchronous Bright Data Web Scraper API run (a
"snapshot"). The flow is trigger → webhook notification → pull results:

1. `startScrape` (`features/scraping/scrapes.ts`) validates with `startScrapeSchema`, calls `getUserOrThrow`, triggers the collection through `lib/brightdata/server.ts`, then inserts the `scrapes` row under RLS with the returned `snapshot_id` and status `running`.
2. `triggerCollection` always sets `notify` to `absoluteUrl(ROUTES.api.brightdataWebhook)` and `auth_header` to `Bearer <BRIGHTDATA_WEBHOOK_SECRET>`. Records are never pushed into us (no `endpoint` parameter): the inbound request stays small, and a caller who knows the webhook secret can only make us re-read a real snapshot.
3. The webhook (`app/api/webhooks/brightdata/route.ts` → `lib/brightdata/webhooks.ts` → `features/scraping/webhook-handlers.ts`) compares the `Authorization` header with the shared secret in constant time, parses `{ snapshot_id, status }`, ignores statuses other than `ready`/`failed`, and runs the handler inside `runOnce` keyed `("brightdata", snapshot_id)`.
4. On `ready` the handler downloads the snapshot with the API key (`GET /datasets/v3/snapshot/{id}?format=json`), upserts `scrape_records` in batches keyed `(scrape_id, position)`, and sets `status`, `record_count`, `completed_at`. On `failed` it sets `status`, `error`, `completed_at`. An unknown snapshot id or a 202 (not ready) download throws so the route answers non-2xx and Bright Data retries.

- The webhook handler is the **only writer** of `scrape_records` and of `scrapes.status`, `record_count`, `error`, `completed_at`; it uses the admin client because those columns have no client write policy. Users insert their own `scrapes` rows and read their own rows and records under RLS.
- Bright Data statuses are mirrored by the `scrape_status` enum (`running`, `ready`, `failed`) via `features/scraping/enums.ts`. `starting`/`running` on Bright Data's side are both our `running`.
- Reads are bounded and paged: `listScrapes` by `created_at` cursor (max 100), `listScrapeRecords` by `position` cursor (max 500). Records are stored verbatim as `jsonb`; interpret them at render time.
- Never add a second trigger path that skips `notify`/`auth_header`, and never accept records from the request body.
- `BRIGHTDATA_API_KEY` and `BRIGHTDATA_WEBHOOK_SECRET` come only from `serverEnv`; `lib/brightdata/server.ts` is `server-only`.
