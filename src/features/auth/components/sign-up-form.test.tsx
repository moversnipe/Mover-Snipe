import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ROUTES } from "@/config/routes"
import { SignUpForm } from "@/features/auth/components/sign-up-form"

// The action is a server module; the form only needs a callable reference.
vi.mock("@/features/auth/actions", () => ({
  signUp: vi.fn(),
}))

describe("SignUpForm", () => {
  it("labels the three inputs an account needs", () => {
    render(<SignUpForm />)
    expect(
      screen.getByRole("heading", { level: 1, name: "Create an account" })
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByLabelText("Password")).toBeInTheDocument()
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Create account" })).toBeEnabled()
  })

  it("asks the browser for a new password, not a saved one", () => {
    render(<SignUpForm />)
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "autocomplete",
      "new-password"
    )
  })

  it("links to login, carrying the return path along", () => {
    render(<SignUpForm next={ROUTES.billing} />)
    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute(
      "href",
      `${ROUTES.login}?next=${encodeURIComponent(ROUTES.billing)}`
    )
  })

  it("carries the return path through as a hidden field", () => {
    const { container } = render(<SignUpForm next={ROUTES.billing} />)
    expect(container.querySelector('input[name="next"]')).toHaveValue(
      ROUTES.billing
    )
  })

  it("omits the hidden field when there is nowhere to return to", () => {
    const { container } = render(<SignUpForm />)
    expect(container.querySelector('input[name="next"]')).toBeNull()
  })
})
