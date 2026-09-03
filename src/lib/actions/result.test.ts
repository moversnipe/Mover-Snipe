import { describe, expect, it } from "vitest"
import { z } from "zod"

import {
  fail,
  failFromError,
  failValidation,
  fieldError,
  ok,
} from "@/lib/actions/result"
import { AppError, ErrorCode } from "@/lib/errors"

describe("ActionResult helpers", () => {
  it("wraps data in ok", () => {
    expect(ok({ id: 1 })).toEqual({ ok: true, data: { id: 1 } })
  })

  it("groups zod issues by top-level field", () => {
    const schema = z.object({ email: z.email(), password: z.string().min(8) })
    const parsed = schema.safeParse({ email: "nope", password: "short" })
    if (parsed.success) throw new Error("expected failure")

    const result = failValidation(parsed.error)
    expect(result.ok).toBe(false)
    expect(fieldError(result, "email")).toBeDefined()
    expect(fieldError(result, "password")).toBeDefined()
    expect(fieldError(result, "missing")).toBeUndefined()
  })

  it("maps AppError codes and hides unknown error messages", () => {
    const known = failFromError(new AppError(ErrorCode.FORBIDDEN, "No access"))
    expect(known).toEqual(fail(ErrorCode.FORBIDDEN, "No access"))

    const unknown = failFromError(new Error("secret"))
    expect(unknown.ok).toBe(false)
    if (!unknown.ok) {
      expect(unknown.error.code).toBe(ErrorCode.INTERNAL)
      expect(unknown.error.message).not.toContain("secret")
    }
  })
})
