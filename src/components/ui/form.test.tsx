import * as React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import { useForm } from "react-hook-form"
import { describe, expect, it, vi } from "vitest"

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

type TestFormValues = {
  username: string
}

function TestForm({ withError }: { withError?: boolean }) {
  const form = useForm<TestFormValues>({ defaultValues: { username: "" } })

  React.useEffect(() => {
    if (withError) {
      form.setError("username", {
        type: "manual",
        message: "Username is required",
      })
    }
  }, [withError, form])

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="username"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Username</FormLabel>
            <FormControl render={<Input {...field} />} />
            <FormDescription>Enter your username.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </Form>
  )
}

describe("Form", () => {
  it("gives FormControl's rendered element an id, aria-invalid=false, and aria-describedby pointing at the description", () => {
    render(<TestForm />)

    const input = screen.getByLabelText("Username")
    const id = input.getAttribute("id")

    expect(id).toBeTruthy()
    expect(input).toHaveAttribute("aria-invalid", "false")
    expect(input).toHaveAttribute(
      "aria-describedby",
      `${id?.replace(/-form-item$/, "")}-form-item-description`
    )
  })

  it("sets aria-invalid=true and renders the error message when the field has an error", async () => {
    render(<TestForm withError />)

    const input = screen.getByLabelText("Username")

    await waitFor(() => {
      expect(input).toHaveAttribute("aria-invalid", "true")
    })
    expect(screen.getByText("Username is required")).toBeInTheDocument()
  })

  it("connects FormLabel's htmlFor to FormControl's id", () => {
    render(<TestForm />)

    const label = screen.getByText("Username")
    const input = screen.getByLabelText("Username")

    expect(label).toHaveAttribute("for", input.getAttribute("id"))
  })

  it("throws when useFormField is used outside of <FormField>", () => {
    const Broken = () => {
      useFormField()
      return null
    }

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

    expect(() => render(<Broken />)).toThrow(
      "useFormField should be used within <FormField>"
    )

    consoleError.mockRestore()
  })
})
