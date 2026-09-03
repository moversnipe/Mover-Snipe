import { describe, expect, it } from "vitest"

import {
  AppError,
  ErrorCode,
  ERROR_STATUS,
  isAppError,
  toErrorCode,
  toUserMessage,
} from "@/lib/errors"

describe("AppError", () => {
  it("carries a code and defaults the message to it", () => {
    const error = new AppError(ErrorCode.NOT_FOUND)
    expect(error.code).toBe("not_found")
    expect(error.message).toBe("not_found")
    expect(isAppError(error)).toBe(true)
  })

  it("maps every code to an HTTP status", () => {
    for (const code of Object.values(ErrorCode)) {
      expect(ERROR_STATUS[code]).toBeGreaterThanOrEqual(400)
    }
  })

  it("hides messages of unknown errors from users", () => {
    expect(toUserMessage(new Error("db password leaked"))).toBe(
      "Something went wrong. Please try again."
    )
    expect(toUserMessage(new AppError(ErrorCode.FORBIDDEN, "Nope"))).toBe(
      "Nope"
    )
    expect(toErrorCode(new Error("x"))).toBe(ErrorCode.INTERNAL)
  })
})
