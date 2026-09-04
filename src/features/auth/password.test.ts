import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  sendPasswordResetEmail,
  updatePassword,
} from "@/features/auth/password"
import { AppError, ErrorCode } from "@/lib/errors"

const getUserOrThrow = vi.fn()
const resetPasswordForEmail = vi.fn()
const updateUser = vi.fn()
const signOut = vi.fn()

vi.mock("@/features/auth/queries", () => ({
  getUserOrThrow: () => getUserOrThrow(),
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      resetPasswordForEmail: (email: string, options: unknown) =>
        resetPasswordForEmail(email, options),
      updateUser: (attributes: unknown) => updateUser(attributes),
      signOut: (options: unknown) => signOut(options),
    },
  }),
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

describe("sendPasswordResetEmail", () => {
  beforeEach(() => vi.clearAllMocks())

  it("asks Supabase for a recovery link that returns to the update page", async () => {
    resetPasswordForEmail.mockResolvedValue({ error: null })
    await sendPasswordResetEmail({ email: "user@example.com" })
    expect(resetPasswordForEmail).toHaveBeenCalledWith(
      "user@example.com",
      expect.objectContaining({
        redirectTo: expect.stringContaining("/auth/callback?next="),
      })
    )
  })

  it("resolves the same way when the provider reports an error", async () => {
    resetPasswordForEmail.mockResolvedValue({
      error: { code: "user_not_found" },
    })
    await expect(
      sendPasswordResetEmail({ email: "user@example.com" })
    ).resolves.toBeUndefined()
  })
})

describe("updatePassword", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getUserOrThrow.mockResolvedValue({ id: "user-1", email: "u@example.com" })
    updateUser.mockResolvedValue({ error: null })
    signOut.mockResolvedValue({ error: null })
  })

  it("replaces the password and revokes the other sessions", async () => {
    await updatePassword({ password: "Str0ng!pass" })
    expect(updateUser).toHaveBeenCalledWith({ password: "Str0ng!pass" })
    expect(signOut).toHaveBeenCalledWith({ scope: "others" })
  })

  it("throws UNAUTHENTICATED without a session", async () => {
    getUserOrThrow.mockRejectedValue(
      new AppError(ErrorCode.UNAUTHENTICATED, "Sign in required")
    )
    await expect(
      updatePassword({ password: "Str0ng!pass" })
    ).rejects.toMatchObject({ code: ErrorCode.UNAUTHENTICATED })
    expect(updateUser).not.toHaveBeenCalled()
  })

  it("throws REAUTHENTICATION_REQUIRED when the session is not fresh enough", async () => {
    updateUser.mockResolvedValue({ error: { code: "reauthentication_needed" } })
    await expect(
      updatePassword({ password: "Str0ng!pass" })
    ).rejects.toMatchObject({ code: ErrorCode.REAUTHENTICATION_REQUIRED })
    expect(signOut).not.toHaveBeenCalled()
  })

  it("throws VALIDATION when the provider rejects the password", async () => {
    updateUser.mockResolvedValue({ error: { code: "weak_password" } })
    await expect(
      updatePassword({ password: "Str0ng!pass" })
    ).rejects.toMatchObject({ code: ErrorCode.VALIDATION })
  })

  it("still succeeds when revoking other sessions fails", async () => {
    signOut.mockResolvedValue({ error: { code: "unexpected" } })
    await expect(
      updatePassword({ password: "Str0ng!pass" })
    ).resolves.toBeUndefined()
  })
})
