import { describe, expect, it } from "vitest"

import { scrapeStatusSchema } from "@/features/scraping/enums"

describe("scrapeStatusSchema", () => {
  it("mirrors the scrape_status enum", () => {
    expect(scrapeStatusSchema.options).toEqual(["running", "ready", "failed"])
  })

  it("rejects Bright Data's transient statuses", () => {
    expect(scrapeStatusSchema.safeParse("starting").success).toBe(false)
  })
})
