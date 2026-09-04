import { describe, expect, it } from "vitest"

import {
  runScrapeJobSchema,
  scrapeJobsSchema,
} from "@/features/scraping/schemas"

describe("runScrapeJobSchema", () => {
  it("accepts a dataset id and up to 20 input rows", () => {
    const input = Array.from({ length: 20 }, (_, index) => ({
      url: `https://example.com/${index}`,
    }))
    expect(
      runScrapeJobSchema.safeParse({ datasetId: "gd_abc", input }).success
    ).toBe(true)
  })

  it("rejects an unknown dataset id shape, an empty input, and a 21st row", () => {
    const row = { url: "https://example.com" }
    expect(
      runScrapeJobSchema.safeParse({ datasetId: "abc", input: [row] }).success
    ).toBe(false)
    expect(
      runScrapeJobSchema.safeParse({ datasetId: "gd_abc", input: [] }).success
    ).toBe(false)
    expect(
      runScrapeJobSchema.safeParse({
        datasetId: "gd_abc",
        input: Array.from({ length: 21 }, () => row),
      }).success
    ).toBe(false)
  })

  it("rejects nested values inside an input row", () => {
    expect(
      runScrapeJobSchema.safeParse({
        datasetId: "gd_abc",
        input: [{ url: "https://example.com", nested: { a: 1 } }],
      }).success
    ).toBe(false)
  })
})

describe("scrapeJobsSchema", () => {
  it("defaults the limit and caps it at 50", () => {
    expect(scrapeJobsSchema.parse({})).toEqual({ limit: 20 })
    expect(scrapeJobsSchema.safeParse({ limit: 51 }).success).toBe(false)
  })

  it("requires the cursor to be an ISO timestamp", () => {
    expect(
      scrapeJobsSchema.safeParse({ createdBefore: "yesterday" }).success
    ).toBe(false)
    expect(
      scrapeJobsSchema.safeParse({ createdBefore: "2026-09-04T00:00:00Z" })
        .success
    ).toBe(true)
    // Supabase returns created_at with an offset; the cursor is passed back as is.
    expect(
      scrapeJobsSchema.safeParse({
        createdBefore: "2026-09-04T00:00:00.123456+00:00",
      }).success
    ).toBe(true)
  })
})
