import { afterEach, describe, expect, it, vi } from "vitest"

import {
  runOnce,
  type WebhookEventKey,
  type WebhookEventStore,
} from "@/lib/api/idempotency"

/** In-memory store with the same claim semantics as public.claim_webhook_event. */
const createMemoryStore = () => {
  const rows = new Map<string, { status: string; error?: string }>()
  const id = (key: WebhookEventKey) => `${key.provider}:${key.eventId}`
  const store: WebhookEventStore = {
    claim: async (key) => {
      const row = rows.get(id(key))
      if (row && row.status !== "failed") return false
      rows.set(id(key), { status: "processing" })
      return true
    },
    markProcessed: async (key) => {
      rows.set(id(key), { status: "processed" })
    },
    markFailed: async (key, error) => {
      rows.set(id(key), { status: "failed", error })
    },
  }
  return { store, rows, id }
}

const key: WebhookEventKey = {
  provider: "stripe",
  eventId: "evt_1",
  eventType: "product.created",
}

describe("runOnce", () => {
  afterEach(() => vi.restoreAllMocks())

  it("processes the first delivery and skips replays", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {})
    const { store } = createMemoryStore()
    const handler = vi.fn(async () => {})

    await expect(runOnce(store, key, handler)).resolves.toBe("processed")
    await expect(runOnce(store, key, handler)).resolves.toBe("duplicate")
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it("marks a failed handler and allows a retry", async () => {
    const { store, rows, id } = createMemoryStore()
    const failing = vi.fn(async () => {
      throw new Error("db down")
    })

    await expect(runOnce(store, key, failing)).rejects.toThrow("db down")
    expect(rows.get(id(key))).toEqual({ status: "failed", error: "db down" })

    const succeeding = vi.fn(async () => {})
    await expect(runOnce(store, key, succeeding)).resolves.toBe("processed")
    expect(rows.get(id(key))?.status).toBe("processed")
  })
})
