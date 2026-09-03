import { afterEach, describe, expect, it, vi } from "vitest"

import { throwIfError } from "@/lib/supabase/errors"

afterEach(() => {
  vi.restoreAllMocks()
})

describe("throwIfError", () => {
  it("returns without throwing when the query succeeded", () => {
    expect(() => throwIfError(null, "getProfile")).not.toThrow()
  })

  it("throws a real Error so the stack survives", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})

    let thrown: unknown
    try {
      throwIfError({ message: "permission denied" }, "getProfile")
    } catch (error) {
      thrown = error
    }

    // The regression this guards: postgrest-js hands back a plain object, and
    // throwing it directly makes Next.js report `@E394` with no app frames.
    if (!(thrown instanceof Error)) throw new Error("expected an Error")
    expect(thrown.name).toBe("Error")
    expect(thrown.stack).toContain("errors.test.ts")
    expect(thrown.cause).toEqual({ message: "permission denied" })
  })

  it("names the failing query in the message", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})

    expect(() =>
      throwIfError(
        { message: "Could not find the table 'public.profiles'" },
        "getProfile"
      )
    ).toThrow("getProfile: Could not find the table 'public.profiles'")
  })

  it("logs the fields PostgREST returned", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

    expect(() =>
      throwIfError(
        {
          message: "Could not find the table 'public.profiles'",
          code: "PGRST205",
          details:
            "Failing row contains (uuid, someone@example.com, Real Name)",
          hint: "Run the migrations",
        },
        "getProfile"
      )
    ).toThrow()

    expect(consoleError).toHaveBeenCalledTimes(1)
    const logged = JSON.parse(String(consoleError.mock.calls[0]?.[0]))
    expect(logged).toMatchObject({
      level: "error",
      // The provider's text lands under `error`; the log line keeps its own
      // `message`, which a `message` field would otherwise overwrite.
      message: "Supabase query failed",
      error: "Could not find the table 'public.profiles'",
      context: "getProfile",
      code: "PGRST205",
      hint: "Run the migrations",
    })
    // `details` carries row contents on a constraint violation; keep it out.
    expect(logged).not.toHaveProperty("details")
  })
})
