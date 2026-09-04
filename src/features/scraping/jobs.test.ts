import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  applyScrapeOutcome,
  getScrapeJobAsSystem,
} from "@/features/scraping/jobs"

const update = vi.fn()
const filters = vi.fn()
const updated = vi.fn()
const lookup = vi.fn()

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      update: (patch: unknown) => {
        update(patch)
        const query = {
          eq: (column: string, value: unknown) => {
            filters(column, value)
            return query
          },
          select: () => updated(),
        }
        return query
      },
      select: () => ({
        eq: () => ({ maybeSingle: () => lookup() }),
      }),
    }),
  }),
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

const JOB_ID = "job-1"

describe("applyScrapeOutcome", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    updated.mockResolvedValue({ data: [{ id: JOB_ID }], error: null })
  })

  it("stores records and a completion time for a ready outcome", async () => {
    await applyScrapeOutcome(JOB_ID, { status: "ready", records: [{ a: 1 }] })
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "ready",
        records: [{ a: 1 }],
        error: null,
        completed_at: expect.any(String),
      })
    )
  })

  it("stores the error and a completion time for a failed outcome", async () => {
    await applyScrapeOutcome(JOB_ID, { status: "failed", error: "Nope." })
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
        error: "Nope.",
        completed_at: expect.any(String),
      })
    )
  })

  it("stores only the snapshot id for a running outcome", async () => {
    await applyScrapeOutcome(JOB_ID, { status: "running", snapshotId: "s_1" })
    expect(update).toHaveBeenCalledWith({ snapshot_id: "s_1" })
  })

  it("writes nothing for a running outcome without a snapshot id", async () => {
    await applyScrapeOutcome(JOB_ID, { status: "running", snapshotId: null })
    expect(update).not.toHaveBeenCalled()
  })

  it("changes only a job that is still running", async () => {
    await applyScrapeOutcome(JOB_ID, { status: "ready", records: [] })
    expect(filters).toHaveBeenCalledWith("id", JOB_ID)
    expect(filters).toHaveBeenCalledWith("status", "running")
  })

  it("resolves quietly when the job was already finished", async () => {
    updated.mockResolvedValue({ data: [], error: null })
    await expect(
      applyScrapeOutcome(JOB_ID, { status: "failed", error: "Nope." })
    ).resolves.toBeUndefined()
  })

  it("throws on a database error", async () => {
    updated.mockResolvedValue({ data: null, error: { message: "down" } })
    await expect(
      applyScrapeOutcome(JOB_ID, { status: "ready", records: [] })
    ).rejects.toThrow("apply scrape outcome: down")
  })
})

describe("getScrapeJobAsSystem", () => {
  it("returns the row or null", async () => {
    lookup.mockResolvedValue({
      data: { id: JOB_ID, status: "running", snapshot_id: null },
      error: null,
    })
    await expect(getScrapeJobAsSystem(JOB_ID)).resolves.toEqual({
      id: JOB_ID,
      status: "running",
      snapshot_id: null,
    })
    lookup.mockResolvedValue({ data: null, error: null })
    await expect(getScrapeJobAsSystem(JOB_ID)).resolves.toBeNull()
  })
})
