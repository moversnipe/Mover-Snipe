import { describe, expect, it } from "vitest"

import {
  getAccountLabels,
  getInitials,
  isRenderableAvatar,
} from "@/features/auth/account"

describe("isRenderableAvatar", () => {
  it("allows plain https", () => {
    expect(isRenderableAvatar("https://cdn.example.com/a.png")).toBe(true)
  })

  it.each([
    ["http, which would load over plaintext", "http://cdn.example.com/a.png"],
    ["a javascript: URL", "javascript:alert(1)"],
    ["an inline data: image", "data:image/svg+xml,<svg onload=alert(1)/>"],
    ["a protocol-relative URL", "//cdn.example.com/a.png"],
    ["a blob: URL", "blob:https://example.com/1234"],
    ["anything unparseable", "not a url"],
    ["an empty string", ""],
    ["a missing avatar", null],
  ])("rejects %s", (_label, url: string | null) => {
    expect(isRenderableAvatar(url)).toBe(false)
  })
})

describe("getInitials", () => {
  it.each([
    ["Ada Lovelace", "AL"],
    ["ada lovelace", "AL"],
    ["Ada", "A"],
    ["Ada Byron King Lovelace", "AB"],
    ["  Ada   Lovelace  ", "AL"],
    ["ada@example.com", "A"],
    ["", "?"],
    ["   ", "?"],
  ])("turns %o into %o", (name, expected) => {
    expect(getInitials(name)).toBe(expected)
  })
})

describe("getAccountLabels", () => {
  const claimed = "claimed@example.com"

  it("prefers the profile name and email", () => {
    expect(
      getAccountLabels({ email: "p@example.com", full_name: "Ada" }, claimed)
    ).toEqual({ name: "Ada", email: "p@example.com" })
  })

  it.each([
    ["a null name", null],
    ["a blank name", ""],
    ["a whitespace-only name", "   "],
  ])("falls back to the email for %s", (_label, full_name) => {
    expect(
      getAccountLabels({ email: "p@example.com", full_name }, claimed)
    ).toEqual({ name: "p@example.com", email: "p@example.com" })
  })

  it("falls back to the claim when the profile is missing", () => {
    expect(getAccountLabels(null, claimed)).toEqual({
      name: claimed,
      email: claimed,
    })
  })

  it("never renders a blank card when no email exists at all", () => {
    expect(getAccountLabels(null, undefined)).toEqual({
      name: "Account",
      email: "",
    })
  })
})
