import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PasswordRequirements } from "@/features/auth/components/password-requirements"
import { PASSWORD_RULES } from "@/features/auth/schemas"

const getItems = () =>
  within(
    screen.getByRole("list", { name: "Password requirements" })
  ).getAllByRole("listitem")

describe("PasswordRequirements", () => {
  it("lists every rule, all unmet, before anything is typed", () => {
    render(<PasswordRequirements value="" />)
    const items = getItems()
    expect(items).toHaveLength(PASSWORD_RULES.length)
    for (const item of items) {
      expect(item).toHaveAttribute("data-met", "false")
      expect(item).toHaveTextContent("(not met)")
    }
    expect(
      screen.getByText(
        `0 of ${PASSWORD_RULES.length} password requirements met`
      )
    ).toBeInTheDocument()
  })

  it("marks only the satisfied rules as met while typing", () => {
    render(<PasswordRequirements value="abc1" />)
    const items = getItems()
    const byLabel = (label: string) =>
      items.find((item) => item.textContent?.includes(label))

    expect(byLabel("A lowercase letter")).toHaveAttribute("data-met", "true")
    expect(byLabel("A number")).toHaveAttribute("data-met", "true")
    expect(byLabel("At least 8 characters")).toHaveAttribute(
      "data-met",
      "false"
    )
    expect(byLabel("An uppercase letter")).toHaveAttribute("data-met", "false")
    expect(byLabel("A symbol, such as ! @ # $ %")).toHaveAttribute(
      "data-met",
      "false"
    )
    expect(
      screen.getByText(
        `2 of ${PASSWORD_RULES.length} password requirements met`
      )
    ).toBeInTheDocument()
  })

  it("marks everything met for a compliant password", () => {
    render(<PasswordRequirements value="Str0ng!pass" />)
    for (const item of getItems()) {
      expect(item).toHaveAttribute("data-met", "true")
    }
  })

  it("exposes the id the password input describes itself with", () => {
    const { container } = render(
      <PasswordRequirements value="" id="password-requirements" />
    )
    expect(container.querySelector("#password-requirements")).not.toBeNull()
  })
})
