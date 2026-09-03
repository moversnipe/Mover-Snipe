import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AuthFormMessage } from "@/features/auth/components/auth-form-message"
import { fail, ok } from "@/lib/actions/result"
import { ErrorCode } from "@/lib/errors"

describe("AuthFormMessage", () => {
  it("renders nothing before the form is submitted", () => {
    const { container } = render(<AuthFormMessage state={undefined} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("announces a form-level failure as an alert", () => {
    render(
      <AuthFormMessage
        state={fail(ErrorCode.UNAUTHENTICATED, "Invalid email or password.")}
      />
    )
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Invalid email or password."
    )
  })

  it("stays quiet when the failure belongs to a single field", () => {
    const { container } = render(
      <AuthFormMessage
        state={fail(ErrorCode.VALIDATION, "Please fix the errors below.", {
          email: ["Enter a valid email address"],
        })}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("announces a success message as a status", () => {
    render(<AuthFormMessage state={ok({ message: "Check your email." })} />)
    expect(screen.getByRole("status")).toHaveTextContent("Check your email.")
  })
})
