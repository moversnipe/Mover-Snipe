import { beforeEach, describe, expect, it, vi } from "vitest"

import { handleBrightDataDelivery } from "@/features/scraping/webhook-handlers"

const scrapeLookup = vi.fn()
const storeScrapeRecords = vi.fn()

vi.mock("@/features/scraping/completion", () => ({
  storeScrapeRecords: (scrapeId: string, records: unknown[]) =>
    storeScrapeRecords(scrapeId, records),
}))

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: () => scrapeLookup() }) }),
    }),
  }),
}))

describe("handleBrightDataDelivery", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storeScrapeRecords.mockResolvedValue(undefined)
  })

  it("stores the delivered records on the scrape named by the URL", async () => {
    scrapeLookup.mockResolvedValue({ data: { id: "scrape-1" }, error: null })

    await handleBrightDataDelivery({
      scrapeId: "scrape-1",
      records: [{ a: 1 }, { a: 2 }],
    })

    expect(storeScrapeRecords).toHaveBeenCalledWith("scrape-1", [
      { a: 1 },
      { a: 2 },
    ])
  })

  it("throws for an unknown scrape so the provider retries", async () => {
    scrapeLookup.mockResolvedValue({ data: null, error: null })

    await expect(
      handleBrightDataDelivery({ scrapeId: "scrape-x", records: [] })
    ).rejects.toThrow("No scrape scrape-x")
    expect(storeScrapeRecords).not.toHaveBeenCalled()
  })
})
