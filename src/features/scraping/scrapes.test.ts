import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  scrapeDeliveryUrl,
  startScrape,
  syncScrape,
} from "@/features/scraping/scrapes"
import { ErrorCode } from "@/lib/errors"

const getUserOrThrow = vi.fn()
const getScrape = vi.fn()
const triggerCollection = vi.fn()
const getSnapshotProgress = vi.fn()
const downloadSnapshot = vi.fn()
const storeScrapeRecords = vi.fn()
const failScrape = vi.fn()
const insert = vi.fn()
const insertResult = vi.fn()

vi.mock("@/features/auth/queries", () => ({
  getUserOrThrow: () => getUserOrThrow(),
}))

vi.mock("@/features/scraping/queries", () => ({
  getScrape: (input: unknown) => getScrape(input),
}))

vi.mock("@/features/scraping/completion", () => ({
  storeScrapeRecords: (id: string, records: unknown) =>
    storeScrapeRecords(id, records),
  failScrape: (id: string, error: unknown) => failScrape(id, error),
}))

vi.mock("@/lib/brightdata/server", () => ({
  triggerCollection: (params: unknown) => triggerCollection(params),
  getSnapshotProgress: (id: string) => getSnapshotProgress(id),
  downloadSnapshot: (id: string) => downloadSnapshot(id),
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: () => ({
      insert: (row: unknown) => {
        insert(row)
        return { select: () => ({ single: () => insertResult() }) }
      },
    }),
  }),
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

const USER = { id: "user-1", email: "user@example.com" }
const SCRAPE_ID = "6f1c9c1e-6a5f-4d9a-9b1b-2b7a3c1d4e5f"

describe("scrapeDeliveryUrl", () => {
  it("points at the webhook with the scrape id in the query string", () => {
    expect(scrapeDeliveryUrl(SCRAPE_ID)).toBe(
      `http://localhost:3000/api/webhooks/brightdata?scrape=${SCRAPE_ID}`
    )
  })
})

describe("startScrape", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getUserOrThrow.mockResolvedValue(USER)
    triggerCollection.mockResolvedValue({ snapshotId: "s_1" })
    insertResult.mockImplementation(() => {
      const row = insert.mock.calls[0]?.[0] as { id: string }
      return Promise.resolve({
        data: { id: row.id, snapshot_id: "s_1", status: "running" },
        error: null,
      })
    })
  })

  it("triggers with a delivery URL naming the new scrape, then records it", async () => {
    const result = await startScrape({
      datasetId: "gd_abc",
      input: [{ url: "https://x" }],
    })

    expect(result).toMatchObject({ snapshotId: "s_1", status: "running" })
    expect(triggerCollection).toHaveBeenCalledWith(
      expect.objectContaining({
        datasetId: "gd_abc",
        endpoint: scrapeDeliveryUrl(result.id),
      })
    )
    expect(insert).toHaveBeenCalledWith({
      id: result.id,
      user_id: "user-1",
      dataset_id: "gd_abc",
      snapshot_id: "s_1",
      input: [{ url: "https://x" }],
    })
  })

  it("does not contact Bright Data when the caller is signed out", async () => {
    getUserOrThrow.mockRejectedValue(new Error("unauthenticated"))

    await expect(
      startScrape({ datasetId: "gd_abc", input: [{ url: "https://x" }] })
    ).rejects.toThrow("unauthenticated")
    expect(triggerCollection).not.toHaveBeenCalled()
  })

  it("fails with INTERNAL when the row cannot be saved", async () => {
    insertResult.mockResolvedValue({ data: null, error: { code: "23505" } })

    await expect(
      startScrape({ datasetId: "gd_abc", input: [{ url: "https://x" }] })
    ).rejects.toMatchObject({ code: ErrorCode.INTERNAL })
  })
})

describe("syncScrape", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getUserOrThrow.mockResolvedValue(USER)
    getScrape.mockResolvedValue({
      id: SCRAPE_ID,
      snapshot_id: "s_1",
      status: "running",
    })
  })

  it("returns NOT_FOUND for a scrape the caller cannot see", async () => {
    getScrape.mockResolvedValue(null)

    await expect(syncScrape({ scrapeId: SCRAPE_ID })).rejects.toMatchObject({
      code: ErrorCode.NOT_FOUND,
    })
  })

  it("leaves a finished scrape alone", async () => {
    getScrape.mockResolvedValue({
      id: SCRAPE_ID,
      snapshot_id: "s_1",
      status: "ready",
    })

    await expect(syncScrape({ scrapeId: SCRAPE_ID })).resolves.toEqual({
      id: SCRAPE_ID,
      snapshotId: "s_1",
      status: "ready",
    })
    expect(getSnapshotProgress).not.toHaveBeenCalled()
  })

  it("stores the snapshot when Bright Data reports it ready", async () => {
    getSnapshotProgress.mockResolvedValue({ status: "ready" })
    downloadSnapshot.mockResolvedValue([{ a: 1 }])

    await expect(syncScrape({ scrapeId: SCRAPE_ID })).resolves.toMatchObject({
      status: "ready",
    })
    expect(storeScrapeRecords).toHaveBeenCalledWith(SCRAPE_ID, [{ a: 1 }])
  })

  it("marks the scrape failed when the collection failed", async () => {
    getSnapshotProgress.mockResolvedValue({ status: "failed" })

    await expect(syncScrape({ scrapeId: SCRAPE_ID })).resolves.toMatchObject({
      status: "failed",
    })
    expect(failScrape).toHaveBeenCalledWith(SCRAPE_ID, expect.any(String))
    expect(downloadSnapshot).not.toHaveBeenCalled()
  })

  it("keeps a still-running scrape running", async () => {
    getSnapshotProgress.mockResolvedValue({ status: "running" })

    await expect(syncScrape({ scrapeId: SCRAPE_ID })).resolves.toMatchObject({
      status: "running",
    })
    expect(storeScrapeRecords).not.toHaveBeenCalled()
    expect(failScrape).not.toHaveBeenCalled()
  })
})
