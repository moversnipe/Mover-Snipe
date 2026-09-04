---
paths:
  - "src/lib/brightdata/**"
  - "src/features/scraping/**"
  - "src/app/api/webhooks/brightdata/**"
---

# Bright Data scraping rules

One scrape is one asynchronous Bright Data Web Scraper API run (a
"snapshot"). The flow is trigger → webhook delivery of the records, with an
on-demand sync as the documented fallback:

1. `startScrape` (`features/scraping/scrapes.ts`) validates with `startScrapeSchema`, calls `getUserOrThrow`, mints the scrape id, triggers the collection through `lib/brightdata/server.ts` with `endpoint` set to `scrapeDeliveryUrl(id)` (the webhook route plus `?scrape=<id>`), then inserts the `scrapes` row under RLS with the returned `snapshot_id` and status `running`. The id travels in the URL because Bright Data's delivered body is the bare records array.
2. `triggerCollection` always sets `format=json`, `include_errors=true`, `uncompressed_webhook=true`, and the shared secret as `auth_header` and `webhook_header_Authorization` (the reference and the delivery guide name the same header differently). It never sets `notify`, which is a boolean flag for status notifications, not a URL.
3. The webhook (`app/api/webhooks/brightdata/route.ts` → `lib/brightdata/webhooks.ts` → `features/scraping/webhook-handlers.ts`) compares the `Authorization` header with the shared secret in constant time, parses the body as a JSON array, reads the scrape id from the query string with `scrapeDeliverySchema`, and runs the handler inside `runOnce` keyed `("brightdata", scrapeId)`. An unknown scrape id throws so the route answers non-2xx and Bright Data retries.
4. `features/scraping/completion.ts` owns the completion writes: `storeScrapeRecords` upserts `scrape_records` in batches keyed `(scrape_id, position)` and sets `status`, `record_count`, `completed_at` (or marks the scrape `failed` above `SCRAPE_MAX_RECORDS`); `failScrape` sets `status`, `error`, `completed_at`. Both use the admin client and are safe to re-run.
5. `syncScrape` is the fallback for a delivery that never arrived (a failed collection, a body over the host's request limit, our downtime past Bright Data's retries): it reads the scrape under RLS, asks `GET /progress/{snapshot_id}`, and on `ready` downloads the snapshot into `storeScrapeRecords`, on `failed` calls `failScrape`.

- `completion.ts` is the **only writer** of `scrape_records` and of `scrapes.status`, `record_count`, `error`, `completed_at`. Users insert their own `scrapes` rows (column-scoped grant) and read their own rows and records under RLS.
- With push delivery the webhook secret guards data integrity: whoever holds it and a scrape id can write records to that scrape. Keep it long, random, and out of logs; the trigger URL that carries it is never logged.
- `scrape_status` (`running`, `ready`, `failed`) is mirrored by `scrapeStatusSchema` in `features/scraping/enums.ts` for typing. A scrape is inserted as `running`; only a delivery or `syncScrape` changes it.
- Spend is bounded per run: `limitMultipleResults` defaults to and is capped at `SCRAPE_MAX_RECORDS` (10 000), and `storeScrapeRecords` marks a larger snapshot `failed` instead of storing it. There is no per-user quota or plan check yet; add one in `startScrape` before `triggerCollection` when the product defines it.
- Reads are bounded and paged: `listScrapes` by `created_at` cursor (max 100), `listScrapeRecords` by `position` cursor (max 500). Records are stored verbatim as `jsonb`; interpret them at render time.
- Never add a second trigger path that skips `endpoint` and the auth header parameters.
- `BRIGHTDATA_API_KEY` and `BRIGHTDATA_WEBHOOK_SECRET` come only from `serverEnv`; `lib/brightdata/server.ts` is `server-only`.
