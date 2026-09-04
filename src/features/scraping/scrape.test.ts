import { beforeEach, describe, expect, it, vi } from "vitest"

import { runScrapeJob, scrapeWebhookUrl } from "@/features/scraping/scrape"
import { ErrorCode } from "@/lib/errors"

const getUserOrThrow = vi.fn()
const insertJob = vi.fn()
const insertedValues = vi.fn()
const scrape = vi.fn()
const applyScrapeOutcome = vi.fn()
const getScrapeJob = vi.fn()

vi.mock("@/features/auth/queries", () => ({
  getUserOrThrow: () => getUserOrThrow(),
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: () => ({
      insert: (values: unknown) => {
        insertedValues(values)
        return { select: () => ({ single: () => insertJob() }) }
      },
    }),
  }),
}))

vi.mock("@/lib/brightdata/client", () => ({
  scrape: (request: unknown) => scrape(request),
}))

vi.mock("@/lib/brightdata/webhooks", () => ({
  SCRAPE_JOB_QUERY_PARAM: "job",
  webhookAuthorization: (jobId: string) => `Bearer token-for-${jobId}`,
}))

vi.mock("@/features/scraping/jobs", () => ({
  applyScrapeOutcome: (jobId: string, outcome: unknown) =>
    applyScrapeOutcome(jobId, outcome),
}))

vi.mock("@/features/scraping/queries", () => ({
  SCRAPE_JOB_COLUMNS: "id",
  getScrapeJob: (jobId: string) => getScrapeJob(jobId),
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

const USER = { id: "user-1", email: "user@example.com" }
const JOB_ID = "0b1f1c2e-9f0c-4a4e-8d9a-1f2e3d4c5b6a"
const input = {
  datasetId: "gd_test",
  input: [{ url: "https://example.com" }],
}

describe("scrapeWebhookUrl", () => {
  it("builds an absolute webhook URL carrying the job id", () => {
    expect(scrapeWebhookUrl(JOB_ID)).toBe(
      `http://localhost:3000/api/webhooks/brightdata?job=${JOB_ID}`
    )
  })
})

describe("runScrapeJob", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getUserOrThrow.mockResolvedValue(USER)
    insertJob.mockResolvedValue({ data: { id: JOB_ID }, error: null })
    getScrapeJob.mockResolvedValue({ id: JOB_ID, status: "ready" })
  })

  it("creates the job as the user, scrapes, and stores the outcome", async () => {
    scrape.mockResolvedValue({ status: "ready", records: [{ title: "A" }] })

    await expect(runScrapeJob(input)).resolves.toEqual({
      id: JOB_ID,
      status: "ready",
    })
    expect(insertedValues).toHaveBeenCalledWith({
      user_id: USER.id,
      dataset_id: "gd_test",
      input: input.input,
    })
    expect(scrape).toHaveBeenCalledWith({
      datasetId: "gd_test",
      input: input.input,
      webhook: {
        url: scrapeWebhookUrl(JOB_ID),
        authorization: `Bearer token-for-${JOB_ID}`,
      },
    })
    expect(applyScrapeOutcome).toHaveBeenCalledWith(JOB_ID, {
      status: "ready",
      records: [{ title: "A" }],
    })
  })

  it("keeps the job running with its snapshot id when Bright Data answers 202", async () => {
    scrape.mockResolvedValue({ status: "running", snapshotId: "s_1" })
    await runScrapeJob(input)
    expect(applyScrapeOutcome).toHaveBeenCalledWith(JOB_ID, {
      status: "running",
      snapshotId: "s_1",
    })
  })

  it("records a timeout as still running without a snapshot id", async () => {
    scrape.mockResolvedValue({ status: "running", snapshotId: null })
    await runScrapeJob(input)
    expect(applyScrapeOutcome).toHaveBeenCalledWith(JOB_ID, {
      status: "running",
      snapshotId: null,
    })
  })

  it("marks the job failed and rethrows when Bright Data rejects the request", async () => {
    scrape.mockRejectedValue(new Error("rejected"))
    await expect(runScrapeJob(input)).rejects.toThrow("rejected")
    expect(applyScrapeOutcome).toHaveBeenCalledWith(
      JOB_ID,
      expect.objectContaining({ status: "failed" })
    )
  })

  it("rejects invalid input before touching the database", async () => {
    await expect(
      runScrapeJob({ datasetId: "nope", input: input.input })
    ).rejects.toThrow()
    expect(insertedValues).not.toHaveBeenCalled()
  })

  it("requires a signed-in user", async () => {
    getUserOrThrow.mockRejectedValue(
      Object.assign(new Error("Sign in required"), {
        code: ErrorCode.UNAUTHENTICATED,
      })
    )
    await expect(runScrapeJob(input)).rejects.toMatchObject({
      code: ErrorCode.UNAUTHENTICATED,
    })
    expect(insertedValues).not.toHaveBeenCalled()
  })
})
