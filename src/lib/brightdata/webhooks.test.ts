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
  new Request("http://localhost:3000/api/webhooks/brightdata", {
    method: "POST",
    headers: authorization ? { Authorization: authorization } : {},
    body,
  })

describe("verifyBrightDataWebhook", () => {
  it("returns the typed event for a request carrying the shared secret", async () => {
    const request = makeRequest(
      JSON.stringify({ snapshot_id: "s_1", status: "ready", dataset_id: "gd" }),
      SECRET
    )
    await expect(verifyBrightDataWebhook(request)).resolves.toEqual({
      snapshotId: "s_1",
      status: "ready",
      error: null,
    })
  })

  it("keeps the error text of a failed notification", async () => {
    const request = makeRequest(
      JSON.stringify({ snapshot_id: "s_1", status: "failed", error: "boom" }),
      SECRET
    )
    await expect(verifyBrightDataWebhook(request)).resolves.toMatchObject({
      status: "failed",
      error: "boom",
    })
  })

  it("rejects a missing secret with UNAUTHENTICATED", async () => {
    const request = makeRequest(
      JSON.stringify({ snapshot_id: "s_1", status: "ready" })
    )
    await expect(verifyBrightDataWebhook(request)).rejects.toMatchObject({
      code: ErrorCode.UNAUTHENTICATED,
    })
  })

  it("rejects a wrong secret with UNAUTHENTICATED", async () => {
    const request = makeRequest(
      JSON.stringify({ snapshot_id: "s_1", status: "ready" }),
      "Bearer nope"
    )
    await expect(verifyBrightDataWebhook(request)).rejects.toMatchObject({
      code: ErrorCode.UNAUTHENTICATED,
    })
  })

  it("rejects a non-JSON body with VALIDATION", async () => {
    await expect(
      verifyBrightDataWebhook(makeRequest("not json", SECRET))
    ).rejects.toMatchObject({ code: ErrorCode.VALIDATION })
  })

  it("rejects a body without snapshot_id with VALIDATION", async () => {
    await expect(
      verifyBrightDataWebhook(
        makeRequest(JSON.stringify({ status: "ready" }), SECRET)
      )
    ).rejects.toMatchObject({ code: ErrorCode.VALIDATION })
  })
})
