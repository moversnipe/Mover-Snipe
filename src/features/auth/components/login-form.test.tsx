import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ROUTES } from "@/config/routes"
import { LoginForm } from "@/features/auth/components/login-form"

// The action is a server module; the form only needs a callable reference.
vi.mock("@/features/auth/actions", () => ({
  signIn: vi.fn(),
}))

describe("LoginForm", () => {
  it("labels the credential inputs", () => {
    render(<LoginForm />)
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByLabelText("Password")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Sign In with Email" })
    ).toBeEnabled()
  })

  it("links to the password reset page", () => {
    render(<LoginForm />)
    expect(
      screen.getByRole("link", { name: "Forgot password?" })
    ).toHaveAttribute("href", ROUTES.forgotPassword)
  })

  it("carries the return path through as a hidden field", () => {
    const { container } = render(<LoginForm next={ROUTES.billing} />)
    expect(container.querySelector('input[name="next"]')).toHaveValue(
      ROUTES.billing
    )
  })

  it("omits the hidden field when there is nowhere to return to", () => {
    const { container } = render(<LoginForm />)
    expect(container.querySelector('input[name="next"]')).toBeNull()
  })
})
