import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

describe("AlertDialog", () => {
  it("closes the dialog and fires onClick when Action is clicked", async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()

    render(
      <AlertDialog defaultOpen>
        <AlertDialogTrigger>Open</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This cannot be undone.
          </AlertDialogDescription>
          <AlertDialogAction onClick={handleClick}>Continue</AlertDialogAction>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>
    )

    expect(screen.getByText("Are you sure?")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Continue" }))

    expect(handleClick).toHaveBeenCalledTimes(1)
    expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument()
  })

  it("closes the dialog when Cancel is clicked", async () => {
    const user = userEvent.setup()

    render(
      <AlertDialog defaultOpen>
        <AlertDialogTrigger>Open</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This cannot be undone.
          </AlertDialogDescription>
          <AlertDialogAction>Continue</AlertDialogAction>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>
    )

    expect(screen.getByText("Are you sure?")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Cancel" }))

    expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument()
  })
})
