import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  HANDLED_EVENT_TYPES,
  handleBrightDataEvent,
} from "@/features/scraping/webhook-handlers"

const downloadSnapshot = vi.fn()
const scrapeLookup = vi.fn()
const upsert = vi.fn()
const update = vi.fn()
const updateFilter = vi.fn()

vi.mock("@/lib/brightdata/server", () => ({
  downloadSnapshot: (snapshotId: string) => downloadSnapshot(snapshotId),
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({ maybeSingle: () => scrapeLookup(table) }),
      }),
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

describe("HANDLED_EVENT_TYPES", () => {
  it("covers the two final statuses", () => {
    expect([...HANDLED_EVENT_TYPES].sort()).toEqual(["failed", "ready"])
  })
})

describe("handleBrightDataEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    scrapeLookup.mockResolvedValue({
      data: { id: "scrape-1", status: "running" },
      error: null,
    })
    upsert.mockResolvedValue({ error: null })
  })

  it("stores the snapshot records and marks the scrape ready", async () => {
    downloadSnapshot.mockResolvedValue([{ a: 1 }, { a: 2 }])

    await handleBrightDataEvent({
      snapshotId: "s_1",
      status: "ready",
      error: null,
    })

    expect(downloadSnapshot).toHaveBeenCalledWith("s_1")
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
    downloadSnapshot.mockResolvedValue(
      Array.from({ length: 1001 }, (_, index) => ({ index }))
    )

    await handleBrightDataEvent({
      snapshotId: "s_1",
      status: "ready",
      error: null,
    })

    expect(upsert).toHaveBeenCalledTimes(3)
    const lastBatch = upsert.mock.calls[2]?.[1] as { position: number }[]
    expect(lastBatch).toHaveLength(1)
    expect(lastBatch[0]?.position).toBe(1000)
  })

  it("marks the scrape failed without downloading anything", async () => {
    await handleBrightDataEvent({
      snapshotId: "s_1",
      status: "failed",
      error: "blocked",
    })

    expect(downloadSnapshot).not.toHaveBeenCalled()
    expect(upsert).not.toHaveBeenCalled()
    expect(update).toHaveBeenCalledWith(
      "scrapes",
      expect.objectContaining({ status: "failed", error: "blocked" })
    )
  })

  it("throws for an unknown snapshot so the provider retries", async () => {
    scrapeLookup.mockResolvedValue({ data: null, error: null })

    await expect(
      handleBrightDataEvent({ snapshotId: "s_x", status: "ready", error: null })
    ).rejects.toThrow("No scrape for snapshot s_x")
    expect(downloadSnapshot).not.toHaveBeenCalled()
  })

  it("propagates a not-ready snapshot download so the provider retries", async () => {
    downloadSnapshot.mockRejectedValue(new Error("not ready"))

    await expect(
      handleBrightDataEvent({ snapshotId: "s_1", status: "ready", error: null })
    ).rejects.toThrow("not ready")
    expect(update).not.toHaveBeenCalled()
  })
})
