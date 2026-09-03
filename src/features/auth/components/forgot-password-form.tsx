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
    <form action={formAction} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
          <FieldError>{fieldError(state, "email")}</FieldError>
        </Field>
        <AuthFormMessage state={state} />
        <AuthSubmitButton>Send reset link</AuthSubmitButton>
      </FieldGroup>
    </form>
  )
}
