import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { downloadSnapshot, scrape } from "@/lib/brightdata/client"
import { AppError, ErrorCode } from "@/lib/errors"

vi.mock("@/lib/env/server", () => ({
  serverEnv: {
    BRIGHTDATA_API_KEY: "api-key-test",
    BRIGHTDATA_WEBHOOK_SECRET: "webhook-secret-test-1234",
  },
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

const fetchMock = vi.fn()

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status })

const request = {
  datasetId: "gd_test",
  input: [{ url: "https://example.com/a" }],
  webhook: {
    url: "https://app.example.com/api/webhooks/brightdata?job=job-1",
    authorization: "Bearer token-for-job-1",
  },
}

describe("scrape", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock)
    fetchMock.mockReset()
  })
  afterEach(() => vi.unstubAllGlobals())

  it("posts the input to the synchronous endpoint with webhook delivery", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, [{ title: "A" }]))

    await expect(scrape(request)).resolves.toEqual({
      status: "ready",
      records: [{ title: "A" }],
    })

    const [url, init] = fetchMock.mock.calls[0] ?? []
    const parsed = new URL(String(url))
    expect(parsed.origin + parsed.pathname).toBe(
      "https://api.brightdata.com/datasets/v3/scrape"
    )
    expect(Object.fromEntries(parsed.searchParams)).toEqual({
      dataset_id: "gd_test",
      format: "json",
      include_errors: "true",
      endpoint: request.webhook.url,
      notify: request.webhook.url,
      auth_header: "Bearer token-for-job-1",
      uncompressed_webhook: "true",
    })
    expect(init.method).toBe("POST")
    expect(init.headers.Authorization).toBe("Bearer api-key-test")
    expect(JSON.parse(init.body)).toEqual({ input: request.input })
  })

  it("returns the snapshot id when Bright Data answers 202", async () => {
    fetchMock.mockResolvedValue(jsonResponse(202, { snapshot_id: "s_1" }))
    await expect(scrape(request)).resolves.toEqual({
      status: "running",
      snapshotId: "s_1",
    })
  })

  it("leaves the job to the webhook when our own timeout hits", async () => {
    fetchMock.mockRejectedValue(
      Object.assign(new Error("timed out"), { name: "TimeoutError" })
    )
    await expect(scrape(request)).resolves.toEqual({
      status: "running",
      snapshotId: null,
    })
  })

  it("throws EXTERNAL_SERVICE when Bright Data rejects the request", async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { error: "bad key" }))
    await expect(scrape(request)).rejects.toMatchObject({
      code: ErrorCode.EXTERNAL_SERVICE,
    })
  })

  it("throws EXTERNAL_SERVICE when the body is not a record array", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { unexpected: true }))
    await expect(scrape(request)).rejects.toBeInstanceOf(AppError)
  })
})

describe("downloadSnapshot", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock)
    fetchMock.mockReset()
  })
  afterEach(() => vi.unstubAllGlobals())

  it("returns the records of a finished snapshot", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, [{ title: "A" }]))
    await expect(downloadSnapshot("s_1")).resolves.toEqual([{ title: "A" }])
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "https://api.brightdata.com/datasets/v3/snapshot/s_1?format=json"
    )
  })

  it("returns null while the snapshot is still building", async () => {
    fetchMock.mockResolvedValue(jsonResponse(202, { status: "building" }))
    await expect(downloadSnapshot("s_1")).resolves.toBeNull()
  })

  it("throws EXTERNAL_SERVICE on any other failure", async () => {
    fetchMock.mockResolvedValue(jsonResponse(404, {}))
    await expect(downloadSnapshot("s_1")).rejects.toMatchObject({
      code: ErrorCode.EXTERNAL_SERVICE,
    })
  })
})
