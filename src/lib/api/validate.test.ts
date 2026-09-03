import { describe, expect, it } from "vitest"
import { z } from "zod"

import { parseJsonBody, parseSearchParams } from "@/lib/api/validate"
import { AppError, ErrorCode } from "@/lib/errors"

const schema = z.object({ name: z.string().min(1) })

describe("parseJsonBody", () => {
  it("returns the parsed body", async () => {
    const request = new Request("http://localhost/api/x", {
      method: "POST",
      body: JSON.stringify({ name: "Ada" }),
    })
    await expect(parseJsonBody(request, schema)).resolves.toEqual({
      name: "Ada",
    })
  })

  it("throws VALIDATION for malformed JSON and for schema failures", async () => {
    const malformed = new Request("http://localhost/api/x", {
      method: "POST",
      body: "{not json",
    })
    await expect(parseJsonBody(malformed, schema)).rejects.toMatchObject({
      code: ErrorCode.VALIDATION,
    })

    const invalid = new Request("http://localhost/api/x", {
      method: "POST",
      body: JSON.stringify({ name: "" }),
    })
    await expect(parseJsonBody(invalid, schema)).rejects.toBeInstanceOf(
      AppError
    )
  })
})

describe("parseSearchParams", () => {
  it("validates the query string", () => {
    const request = new Request("http://localhost/api/x?name=Ada")
    expect(parseSearchParams(request, schema)).toEqual({ name: "Ada" })
    expect(() =>
      parseSearchParams(new Request("http://localhost/api/x"), schema)
    ).toThrow(AppError)
  })
})
