"use client"

import { useActionState } from "react"

import { requestPasswordReset } from "@/features/auth/actions"
import { AuthFormMessage } from "@/features/auth/components/auth-form-message"
import { AuthSubmitButton } from "@/features/auth/components/auth-submit-button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { fieldError } from "@/lib/actions/result"

export const ForgotPasswordForm = () => {
  const [state, formAction] = useActionState(requestPasswordReset, undefined)

  return (
    <div className="grid gap-6">
      <form action={formAction}>
        <FieldGroup>
          <Field>
            <FieldLabel className="sr-only" htmlFor="email">
              Email
            </FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              required
            />
            <FieldError>{fieldError(state, "email")}</FieldError>
          </Field>
          <AuthFormMessage state={state} />
          <Field>
            <AuthSubmitButton>Send reset link</AuthSubmitButton>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
