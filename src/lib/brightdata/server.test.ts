import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  buildTriggerUrl,
  downloadSnapshot,
  getSnapshotProgress,
  triggerCollection,
} from "@/lib/brightdata/server"
import { AppError, ErrorCode } from "@/lib/errors"

vi.mock("@/lib/env/server", () => ({
  serverEnv: {
    BRIGHTDATA_API_KEY: "api-key",
    BRIGHTDATA_WEBHOOK_SECRET: "webhook-secret-webhook-secret-webhook-secret",
  },
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

const fetchMock = vi.fn()

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })

const ENDPOINT = "http://localhost:3000/api/webhooks/brightdata?scrape=abc"
const PARAMS = {
  datasetId: "gd_abc",
  input: [{ url: "https://x" }],
  endpoint: ENDPOINT,
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("buildTriggerUrl", () => {
  it("asks for uncompressed JSON delivery to the endpoint with the shared secret", () => {
    const url = new URL(buildTriggerUrl(PARAMS))
    expect(url.origin + url.pathname).toBe(
      "https://api.brightdata.com/datasets/v3/trigger"
    )
    expect(url.searchParams.get("dataset_id")).toBe("gd_abc")
    expect(url.searchParams.get("format")).toBe("json")
    expect(url.searchParams.get("include_errors")).toBe("true")
    expect(url.searchParams.get("endpoint")).toBe(ENDPOINT)
    expect(url.searchParams.get("uncompressed_webhook")).toBe("true")
    expect(url.searchParams.get("auth_header")).toBe(
      "Bearer webhook-secret-webhook-secret-webhook-secret"
    )
    expect(url.searchParams.get("webhook_header_Authorization")).toBe(
      "Bearer webhook-secret-webhook-secret-webhook-secret"
    )
    expect(url.searchParams.has("notify")).toBe(false)
    expect(url.searchParams.has("type")).toBe(false)
    expect(url.searchParams.has("limit_per_input")).toBe(false)
  })

  it("adds discovery and limit parameters when given", () => {
    const url = new URL(
      buildTriggerUrl({
        ...PARAMS,
        input: [{ keyword: "movers" }],
        discoverBy: "keyword",
        limitPerInput: 10,
        limitMultipleResults: 50,
      })
    )
    expect(url.searchParams.get("type")).toBe("discover_new")
    expect(url.searchParams.get("discover_by")).toBe("keyword")
    expect(url.searchParams.get("limit_per_input")).toBe("10")
    expect(url.searchParams.get("limit_multiple_results")).toBe("50")
  })
})

describe("triggerCollection", () => {
  it("posts the inputs with the API key and returns the snapshot id", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ snapshot_id: "s_1" }))

    await expect(triggerCollection(PARAMS)).resolves.toEqual({
      snapshotId: "s_1",
    })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain("dataset_id=gd_abc")
    expect(init.method).toBe("POST")
    expect(init.headers).toMatchObject({ Authorization: "Bearer api-key" })
    expect(init.body).toBe(JSON.stringify([{ url: "https://x" }]))
  })

  it("throws EXTERNAL_SERVICE when Bright Data rejects the trigger", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "bad" }, 400))

    await expect(triggerCollection(PARAMS)).rejects.toMatchObject({
      code: ErrorCode.EXTERNAL_SERVICE,
    })
  })

  it("throws EXTERNAL_SERVICE when the response has no snapshot id", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}))

    await expect(triggerCollection(PARAMS)).rejects.toBeInstanceOf(AppError)
  })
})

describe("getSnapshotProgress", () => {
  it("returns the status Bright Data reports", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ snapshot_id: "s_1", dataset_id: "gd", status: "running" })
    )

    await expect(getSnapshotProgress("s_1")).resolves.toEqual({
      status: "running",
    })
    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toBe("https://api.brightdata.com/datasets/v3/progress/s_1")
  })

  it("throws EXTERNAL_SERVICE on a failed request", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "nope" }, 404))

    await expect(getSnapshotProgress("s_1")).rejects.toMatchObject({
      code: ErrorCode.EXTERNAL_SERVICE,
    })
  })
})

describe("downloadSnapshot", () => {
  it("returns the records of a ready snapshot", async () => {
    fetchMock.mockResolvedValue(jsonResponse([{ a: 1 }, { a: 2 }]))

    await expect(downloadSnapshot("s_1")).resolves.toEqual([{ a: 1 }, { a: 2 }])
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(
      "https://api.brightdata.com/datasets/v3/snapshot/s_1?format=json"
    )
    expect(init.headers).toMatchObject({ Authorization: "Bearer api-key" })
  })

  it("throws EXTERNAL_SERVICE while the snapshot is not ready (202)", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ status: "building", message: "not ready" }, 202)
    )

    await expect(downloadSnapshot("s_1")).rejects.toMatchObject({
      code: ErrorCode.EXTERNAL_SERVICE,
    })
  })

  it("throws EXTERNAL_SERVICE when the body is not an array", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ nope: true }))

    await expect(downloadSnapshot("s_1")).rejects.toBeInstanceOf(AppError)
  })
})
