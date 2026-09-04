import { beforeEach, describe, expect, it, vi } from "vitest"

import { handleBrightDataEvent } from "@/features/scraping/webhook-handlers"
import type { BrightDataEvent } from "@/lib/brightdata/webhooks"
import { ErrorCode } from "@/lib/errors"

const getScrapeJobAsSystem = vi.fn()
const applyScrapeOutcome = vi.fn()
const downloadSnapshot = vi.fn()

vi.mock("@/features/scraping/jobs", () => ({
  getScrapeJobAsSystem: (jobId: string) => getScrapeJobAsSystem(jobId),
  applyScrapeOutcome: (jobId: string, outcome: unknown) =>
    applyScrapeOutcome(jobId, outcome),
}))

vi.mock("@/lib/brightdata/client", () => ({
  downloadSnapshot: (snapshotId: string) => downloadSnapshot(snapshotId),
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

const JOB_ID = "job-1"

const delivery: BrightDataEvent = {
  id: `${JOB_ID}:delivery`,
  type: "delivery",
  jobId: JOB_ID,
  records: [{ title: "A" }],
}

const notification = (status: string): BrightDataEvent => ({
  id: `${JOB_ID}:notification:${status}`,
  type: "notification",
  jobId: JOB_ID,
  snapshotId: "s_1",
  status,
})

describe("handleBrightDataEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getScrapeJobAsSystem.mockResolvedValue({
      id: JOB_ID,
      status: "running",
      snapshot_id: null,
    })
  })

  it("stores delivered records as the ready outcome", async () => {
    await handleBrightDataEvent(delivery)
    expect(applyScrapeOutcome).toHaveBeenCalledWith(JOB_ID, {
      status: "ready",
      records: [{ title: "A" }],
    })
  })

  it("marks the job failed on a failed notice", async () => {
    await handleBrightDataEvent(notification("failed"))
    expect(applyScrapeOutcome).toHaveBeenCalledWith(
      JOB_ID,
      expect.objectContaining({ status: "failed" })
    )
  })

  it("downloads the snapshot on a ready notice", async () => {
    downloadSnapshot.mockResolvedValue([{ title: "B" }])
    await handleBrightDataEvent(notification("ready"))
    expect(downloadSnapshot).toHaveBeenCalledWith("s_1")
    expect(applyScrapeOutcome).toHaveBeenCalledWith(JOB_ID, {
      status: "ready",
      records: [{ title: "B" }],
    })
  })

  it("throws so Bright Data retries when the snapshot is not downloadable yet", async () => {
    downloadSnapshot.mockResolvedValue(null)
    await expect(
      handleBrightDataEvent(notification("ready"))
    ).rejects.toMatchObject({ code: ErrorCode.EXTERNAL_SERVICE })
    expect(applyScrapeOutcome).not.toHaveBeenCalled()
  })

  it("records the snapshot id on an intermediate notice", async () => {
    await handleBrightDataEvent(notification("running"))
    expect(applyScrapeOutcome).toHaveBeenCalledWith(JOB_ID, {
      status: "running",
      snapshotId: "s_1",
    })
  })

  it("leaves a finished job untouched", async () => {
    getScrapeJobAsSystem.mockResolvedValue({
      id: JOB_ID,
      status: "ready",
      snapshot_id: null,
    })
    await handleBrightDataEvent(delivery)
    expect(applyScrapeOutcome).not.toHaveBeenCalled()
  })

  it("throws NOT_FOUND for an unknown job", async () => {
    getScrapeJobAsSystem.mockResolvedValue(null)
    await expect(handleBrightDataEvent(delivery)).rejects.toMatchObject({
      code: ErrorCode.NOT_FOUND,
    })
  })
})
