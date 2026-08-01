import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Button } from "@/components/ui/button"

describe("Button", () => {
  it("renders its children text", () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText("Click me")).toBeInTheDocument()
  })

  it("fires onClick when clicked", async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    await user.click(screen.getByRole("button", { name: "Click me" }))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it("does not fire onClick when disabled", async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(
      <Button disabled onClick={handleClick}>
        Click me
      </Button>
    )

    await user.click(screen.getByRole("button", { name: "Click me" }))

    expect(handleClick).not.toHaveBeenCalled()
  })
})
