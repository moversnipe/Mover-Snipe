import { describe, expect, it } from "vitest"

import { initialsOf, isRenderableAvatar } from "@/features/auth/avatar"

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

describe("initialsOf", () => {
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
    expect(initialsOf(name)).toBe(expected)
  })
})
