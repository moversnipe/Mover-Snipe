import { describe, expect, it } from "vitest"

import {
  SCRAPE_MAX_INPUTS,
  SCRAPE_MAX_RECORDS,
  SCRAPE_RECORDS_MAX_LIMIT,
  SCRAPES_MAX_LIMIT,
  getScrapeSchema,
  listScrapeRecordsSchema,
  scrapeDeliverySchema,
  listScrapesSchema,
  startScrapeSchema,
} from "@/features/scraping/schemas"

describe("startScrapeSchema", () => {
  it("accepts a dataset id with scalar input objects", () => {
    const parsed = startScrapeSchema.parse({
      datasetId: "gd_abc123",
      input: [{ url: "https://example.com", pages: 2, deep: true }],
      limitPerInput: 10,
    })
    expect(parsed.limitPerInput).toBe(10)
    expect(parsed.limitMultipleResults).toBe(SCRAPE_MAX_RECORDS)
    expect(parsed.discoverBy).toBeUndefined()
  })

  it("rejects an unknown dataset id shape", () => {
    expect(
      startScrapeSchema.safeParse({ datasetId: "abc", input: [{ url: "x" }] })
        .success
    ).toBe(false)
  })

  it("rejects empty input and nested values", () => {
    expect(
      startScrapeSchema.safeParse({ datasetId: "gd_abc", input: [] }).success
    ).toBe(false)
    expect(
      startScrapeSchema.safeParse({
        datasetId: "gd_abc",
        input: [{ nested: { a: 1 } }],
      }).success
    ).toBe(false)
  })

  it("caps the records per scrape", () => {
    expect(
      startScrapeSchema.safeParse({
        datasetId: "gd_abc",
        input: [{ url: "x" }],
        limitMultipleResults: SCRAPE_MAX_RECORDS + 1,
      }).success
    ).toBe(false)
  })

  it("caps the number of inputs", () => {
    const input = Array.from({ length: SCRAPE_MAX_INPUTS + 1 }, () => ({
      url: "x",
    }))
    expect(
      startScrapeSchema.safeParse({ datasetId: "gd_abc", input }).success
    ).toBe(false)
  })
})

describe("getScrapeSchema", () => {
  it("requires a uuid", () => {
    expect(
      getScrapeSchema.safeParse({
        scrapeId: "6f1c9c1e-6a5f-4d9a-9b1b-2b7a3c1d4e5f",
      }).success
    ).toBe(true)
    expect(getScrapeSchema.safeParse({ scrapeId: "1" }).success).toBe(false)
  })
})

describe("scrapeDeliverySchema", () => {
  it("reads the scrape id from the delivery query string", () => {
    expect(
      scrapeDeliverySchema.safeParse({
        scrape: "6f1c9c1e-6a5f-4d9a-9b1b-2b7a3c1d4e5f",
      }).success
    ).toBe(true)
    expect(scrapeDeliverySchema.safeParse({ scrape: "x" }).success).toBe(false)
  })
})

describe("listScrapesSchema", () => {
  it("defaults the limit and accepts an ISO cursor", () => {
    expect(listScrapesSchema.parse({})).toEqual({ limit: 20 })
    expect(
      listScrapesSchema.parse({ cursor: "2026-09-04T10:00:00.000Z" }).cursor
    ).toBe("2026-09-04T10:00:00.000Z")
  })

  it("caps the limit", () => {
    expect(
      listScrapesSchema.safeParse({ limit: SCRAPES_MAX_LIMIT + 1 }).success
    ).toBe(false)
  })
})

describe("listScrapeRecordsSchema", () => {
  it("requires a uuid scrape id and defaults the limit", () => {
    const parsed = listScrapeRecordsSchema.parse({
      scrapeId: "6f1c9c1e-6a5f-4d9a-9b1b-2b7a3c1d4e5f",
    })
    expect(parsed.limit).toBe(100)
    expect(
      listScrapeRecordsSchema.safeParse({ scrapeId: "nope" }).success
    ).toBe(false)
  })

  it("caps the limit and rejects a negative cursor", () => {
    const scrapeId = "6f1c9c1e-6a5f-4d9a-9b1b-2b7a3c1d4e5f"
    expect(
      listScrapeRecordsSchema.safeParse({
        scrapeId,
        limit: SCRAPE_RECORDS_MAX_LIMIT + 1,
      }).success
    ).toBe(false)
    expect(
      listScrapeRecordsSchema.safeParse({ scrapeId, cursor: -1 }).success
    ).toBe(false)
  })
})
