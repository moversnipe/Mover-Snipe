import { describe, expect, it } from "vitest"

import { absoluteUrl, siteConfig } from "@/config/site"

describe("absoluteUrl", () => {
  it("resolves paths against the configured site URL", () => {
    expect(absoluteUrl("/billing?checkout=success")).toBe(
      `${siteConfig.url}/billing?checkout=success`
    )
  })
})
