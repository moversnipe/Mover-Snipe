import { gzipSync } from "node:zlib"

import { describe, expect, it, vi } from "vitest"

import {
  MAX_WEBHOOK_BODY_BYTES,
  verifyBrightDataWebhook,
  webhookAuthorization,
} from "@/lib/brightdata/webhooks"
import { ErrorCode } from "@/lib/errors"

vi.mock("@/lib/env/server", () => ({
  serverEnv: {
    BRIGHTDATA_API_KEY: "api-key-test",
    BRIGHTDATA_WEBHOOK_SECRET: "webhook-secret-test-1234",
  },
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

const JOB_ID = "0b1f1c2e-9f0c-4a4e-8d9a-1f2e3d4c5b6a"
const OTHER_JOB_ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7"

const webhookRequest = ({
  body,
  authorization = webhookAuthorization(JOB_ID),
  job = JOB_ID,
  headers = {},
}: {
  body: BodyInit
  authorization?: string | null
  job?: string
  headers?: Record<string, string>
}) =>
  new Request(`http://localhost:3000/api/webhooks/brightdata?job=${job}`, {
    method: "POST",
    body,
    headers: {
      ...(authorization ? { authorization } : {}),
      "content-type": "application/json",
      ...headers,
    },
  })

describe("webhookAuthorization", () => {
  it("derives a bearer token per job that never contains the secret", () => {
    const token = webhookAuthorization(JOB_ID)
    expect(token).toMatch(/^Bearer [0-9a-f]{64}$/)
    expect(token).not.toContain("webhook-secret-test-1234")
    expect(webhookAuthorization(OTHER_JOB_ID)).not.toBe(token)
  })
})

describe("verifyBrightDataWebhook", () => {
  it("returns a delivery event for a record array", async () => {
    const request = webhookRequest({ body: JSON.stringify([{ title: "A" }]) })
    await expect(verifyBrightDataWebhook(request)).resolves.toEqual({
      id: `${JOB_ID}:delivery`,
      type: "delivery",
      jobId: JOB_ID,
      records: [{ title: "A" }],
    })
  })

  it("returns a notification event for a snapshot status notice", async () => {
    const request = webhookRequest({
      body: JSON.stringify({ snapshot_id: "s_1", status: "ready", extra: 1 }),
    })
    await expect(verifyBrightDataWebhook(request)).resolves.toEqual({
      id: `${JOB_ID}:notification:ready`,
      type: "notification",
      jobId: JOB_ID,
      snapshotId: "s_1",
      status: "ready",
    })
  })

  it("inflates a gzipped delivery", async () => {
    const request = webhookRequest({
      body: gzipSync(Buffer.from(JSON.stringify([{ title: "A" }]))),
      headers: { "content-encoding": "gzip" },
    })
    await expect(verifyBrightDataWebhook(request)).resolves.toMatchObject({
      type: "delivery",
      records: [{ title: "A" }],
    })
  })

  it("rejects a missing, wrong, or other job's token", async () => {
    for (const authorization of [
      null,
      "Bearer wrong",
      "Bearer webhook-secret-test-1234",
      webhookAuthorization(OTHER_JOB_ID),
    ]) {
      const request = webhookRequest({ body: "[]", authorization })
      await expect(verifyBrightDataWebhook(request)).rejects.toMatchObject({
        code: ErrorCode.UNAUTHENTICATED,
      })
    }
  })

  it("rejects a missing or malformed job id", async () => {
    const request = webhookRequest({ body: "[]", job: "not-a-uuid" })
    await expect(verifyBrightDataWebhook(request)).rejects.toMatchObject({
      code: ErrorCode.VALIDATION,
    })
  })

  it("rejects a body over the size cap", async () => {
    const request = webhookRequest({
      body: Buffer.alloc(MAX_WEBHOOK_BODY_BYTES + 1, 0x20),
    })
    await expect(verifyBrightDataWebhook(request)).rejects.toMatchObject({
      code: ErrorCode.VALIDATION,
    })
  })

  it("rejects bodies that are neither records nor a notice", async () => {
    for (const body of ["not json", JSON.stringify({ hello: "world" })]) {
      const request = webhookRequest({ body })
      await expect(verifyBrightDataWebhook(request)).rejects.toMatchObject({
        code: ErrorCode.VALIDATION,
      })
    }
  })
})
