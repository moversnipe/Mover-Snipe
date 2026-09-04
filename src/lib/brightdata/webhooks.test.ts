import { describe, expect, it, vi } from "vitest"

import { verifyBrightDataWebhook } from "@/lib/brightdata/webhooks"
import { ErrorCode } from "@/lib/errors"

vi.mock("@/lib/env/server", () => ({
  serverEnv: {
    BRIGHTDATA_API_KEY: "api-key",
    BRIGHTDATA_WEBHOOK_SECRET: "webhook-secret-webhook-secret-webhook-secret",
  },
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

const SECRET = "Bearer webhook-secret-webhook-secret-webhook-secret"

const makeRequest = (body: BodyInit, authorization?: string) =>
  new Request("http://localhost:3000/api/webhooks/brightdata?scrape=abc", {
    method: "POST",
    headers: authorization ? { Authorization: authorization } : {},
    body,
  })

describe("verifyBrightDataWebhook", () => {
  it("returns the delivered records for a request carrying the shared secret", async () => {
    const request = makeRequest(
      JSON.stringify([{ name: "A" }, { name: "B", error: "blocked" }]),
      SECRET
    )
    await expect(verifyBrightDataWebhook(request)).resolves.toEqual({
      records: [{ name: "A" }, { name: "B", error: "blocked" }],
    })
  })

  it("accepts an empty delivery", async () => {
    await expect(
      verifyBrightDataWebhook(makeRequest("[]", SECRET))
    ).resolves.toEqual({ records: [] })
  })

  it("rejects a missing secret with UNAUTHENTICATED", async () => {
    await expect(
      verifyBrightDataWebhook(makeRequest("[]"))
    ).rejects.toMatchObject({ code: ErrorCode.UNAUTHENTICATED })
  })

  it("rejects a wrong secret with UNAUTHENTICATED", async () => {
    await expect(
      verifyBrightDataWebhook(makeRequest("[]", "Bearer nope"))
    ).rejects.toMatchObject({ code: ErrorCode.UNAUTHENTICATED })
  })

  it("rejects a non-JSON body with VALIDATION", async () => {
    await expect(
      verifyBrightDataWebhook(makeRequest("not json", SECRET))
    ).rejects.toMatchObject({ code: ErrorCode.VALIDATION })
  })

  it("rejects a body that is not an array with VALIDATION", async () => {
    await expect(
      verifyBrightDataWebhook(
        makeRequest(JSON.stringify({ snapshot_id: "s_1" }), SECRET)
      )
    ).rejects.toMatchObject({ code: ErrorCode.VALIDATION })
  })
})
