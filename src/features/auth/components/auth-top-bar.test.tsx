import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ROUTES } from "@/config/routes"
import { AuthTopBar } from "@/features/auth/components/auth-top-bar"

describe("AuthTopBar", () => {
  it("renders the counterpart link with its target", () => {
    render(<AuthTopBar link={{ href: ROUTES.signUp, label: "Sign up" }} />)
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      ROUTES.signUp
    )
  })

  it("always offers the theme toggle", () => {
    render(<AuthTopBar />)
    expect(
      screen.getByRole("button", { name: "Toggle theme" })
    ).toBeInTheDocument()
  })

  it("renders no link when the page has no counterpart", () => {
    render(<AuthTopBar />)
    expect(screen.queryByRole("link")).toBeNull()
  })
})
