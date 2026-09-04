import { afterEach, describe, expect, it, vi } from "vitest"

import { logger } from "@/lib/logger"

describe("logger", () => {
  afterEach(() => vi.restoreAllMocks())

  it("writes one JSON object per line with level, message, and fields", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {})
    logger.info("hello", { userId: "u1" })

    expect(spy).toHaveBeenCalledTimes(1)
    const line = JSON.parse(spy.mock.calls[0]?.[0] as string)
    expect(line).toMatchObject({
      level: "info",
      message: "hello",
      userId: "u1",
    })
    expect(typeof line.time).toBe("string")
  })

  it("keeps the event name as its own indexed field", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {})
    logger.info("Checkout session created", {
      event: "billing.checkout_session.created",
      userId: "u1",
    })
    const line = JSON.parse(spy.mock.calls[0]?.[0] as string)
    expect(line.event).toBe("billing.checkout_session.created")
    expect(line.message).toBe("Checkout session created")
  })

  it("routes errors to console.error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    logger.error("boom")
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
