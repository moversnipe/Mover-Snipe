import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AuthPageHeader } from "@/features/auth/components/auth-page-header"

describe("AuthPageHeader", () => {
  it("renders the title as the page heading with its description", () => {
    render(
      <AuthPageHeader
        title="Create an account"
        description="Enter your email below to create your account"
      />
    )
    expect(
      screen.getByRole("heading", { level: 1, name: "Create an account" })
    ).toBeInTheDocument()
    expect(
      screen.getByText("Enter your email below to create your account")
    ).toBeInTheDocument()
  })
})
