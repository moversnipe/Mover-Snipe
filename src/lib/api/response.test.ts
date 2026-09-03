import { describe, expect, it } from "vitest"

import { apiError, apiSuccess } from "@/lib/api/response"
import { ErrorCode } from "@/lib/errors"

describe("api response envelope", () => {
  it("wraps success data", async () => {
    const response = apiSuccess({ status: "ok" })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ data: { status: "ok" } })
  })

  it("maps error codes to HTTP statuses", async () => {
    const response = apiError(ErrorCode.UNAUTHENTICATED, "Sign in first")
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({
      error: { code: "unauthenticated", message: "Sign in first" },
    })
  })
})
