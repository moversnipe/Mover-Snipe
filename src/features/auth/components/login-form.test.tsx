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
    expect(
      screen.getByRole("heading", { level: 1, name: "Login to your account" })
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByLabelText("Password")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Login" })).toBeEnabled()
  })

  it("links to the password reset page", () => {
    render(<LoginForm />)
    expect(
      screen.getByRole("link", { name: "Forgot your password?" })
    ).toHaveAttribute("href", ROUTES.forgotPassword)
  })

  it("links to sign-up, carrying the return path along", () => {
    render(<LoginForm next={ROUTES.billing} />)
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      `${ROUTES.signUp}?next=${encodeURIComponent(ROUTES.billing)}`
    )
  })

  it("links to plain sign-up when there is nowhere to return to", () => {
    render(<LoginForm />)
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      ROUTES.signUp
    )
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
