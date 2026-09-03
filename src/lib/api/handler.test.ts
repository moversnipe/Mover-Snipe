import { afterEach, describe, expect, it, vi } from "vitest"

import { createHandler } from "@/lib/api/handler"
import { apiSuccess } from "@/lib/api/response"
import { AppError, ErrorCode } from "@/lib/errors"

const request = (path = "/api/test") =>
  new Request(`http://localhost:3000${path}`, { method: "GET" })

describe("createHandler", () => {
  afterEach(() => vi.restoreAllMocks())

  it("passes through the handler's response and resolved params", async () => {
    const handler = createHandler<{ id: string }>(({ params }) =>
      apiSuccess({ id: params.id })
    )
    const response = await handler(request(), {
      params: Promise.resolve({ id: "42" }),
    })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ data: { id: "42" } })
  })

  it("works without a params context", async () => {
    const handler = createHandler(() => apiSuccess({ ok: true }))
    const response = await handler(request())
    expect(await response.json()).toEqual({ data: { ok: true } })
  })

  it("maps AppError to the error envelope and status", async () => {
    const handler = createHandler(() => {
      throw new AppError(ErrorCode.NOT_FOUND, "No such thing")
    })
    const response = await handler(request())
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({
      error: { code: "not_found", message: "No such thing" },
    })
  })

  it("hides unknown errors behind a logged 500", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    const handler = createHandler(() => {
      throw new Error("database password is hunter2")
    })
    const response = await handler(request())
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error.code).toBe("internal_error")
    expect(JSON.stringify(body)).not.toContain("hunter2")
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
