import { beforeEach, describe, expect, it, vi } from "vitest"

import { failScrape, storeScrapeRecords } from "@/features/scraping/completion"
import { SCRAPE_MAX_RECORDS } from "@/features/scraping/schemas"

const upsert = vi.fn()
const update = vi.fn()
const updateFilter = vi.fn()

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      upsert: (rows: unknown, options: unknown) => upsert(table, rows, options),
      update: (fields: unknown) => {
        update(table, fields)
        return {
          eq: (column: string, value: unknown) => {
            updateFilter(column, value)
            return Promise.resolve({ error: null })
          },
        }
      },
    }),
  }),
}))

describe("storeScrapeRecords", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    upsert.mockResolvedValue({ error: null })
  })

  it("upserts the records by position and marks the scrape ready", async () => {
    await storeScrapeRecords("scrape-1", [{ a: 1 }, { a: 2 }])

    expect(upsert).toHaveBeenCalledWith(
      "scrape_records",
      [
        { scrape_id: "scrape-1", position: 0, data: { a: 1 } },
        { scrape_id: "scrape-1", position: 1, data: { a: 2 } },
      ],
      { onConflict: "scrape_id,position", ignoreDuplicates: true }
    )
    expect(update).toHaveBeenCalledWith(
      "scrapes",
      expect.objectContaining({ status: "ready", record_count: 2 })
    )
    expect(updateFilter).toHaveBeenCalledWith("id", "scrape-1")
  })

  it("inserts records in batches", async () => {
    await storeScrapeRecords(
      "scrape-1",
      Array.from({ length: 1001 }, (_, index) => ({ index }))
    )

    expect(upsert).toHaveBeenCalledTimes(3)
    const lastBatch = upsert.mock.calls[2]?.[1] as { position: number }[]
    expect(lastBatch).toHaveLength(1)
    expect(lastBatch[0]?.position).toBe(1000)
  })

  it("marks an oversized snapshot failed instead of storing it", async () => {
    await storeScrapeRecords(
      "scrape-1",
      Array.from({ length: SCRAPE_MAX_RECORDS + 1 }, () => ({}))
    )

    expect(upsert).not.toHaveBeenCalled()
    expect(update).toHaveBeenCalledWith(
      "scrapes",
      expect.objectContaining({ status: "failed" })
    )
  })

  it("propagates a storage error so the caller retries", async () => {
    upsert.mockResolvedValue({ error: { message: "down" } })

    await expect(storeScrapeRecords("scrape-1", [{}])).rejects.toThrow(
      "store scrape records: down"
    )
    expect(update).not.toHaveBeenCalled()
  })
})

describe("failScrape", () => {
  it("marks the scrape failed with the reason", async () => {
    await failScrape("scrape-1", "blocked")

    expect(update).toHaveBeenCalledWith(
      "scrapes",
      expect.objectContaining({ status: "failed", error: "blocked" })
    )
    expect(updateFilter).toHaveBeenCalledWith("id", "scrape-1")
  })
})
