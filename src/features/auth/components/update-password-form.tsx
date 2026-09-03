"use client"

import { useActionState } from "react"

import { updatePassword } from "@/features/auth/actions"
import { AuthFormMessage } from "@/features/auth/components/auth-form-message"
import { AuthSubmitButton } from "@/features/auth/components/auth-submit-button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { fieldError } from "@/lib/actions/result"

export const UpdatePasswordForm = () => {
  const [state, formAction] = useActionState(updatePassword, undefined)

  return (
    <div className="grid gap-6">
      <form action={formAction}>
        <FieldGroup>
          <Field>
            <FieldLabel className="sr-only" htmlFor="password">
              New password
            </FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="New password"
              autoComplete="new-password"
              required
            />
            <FieldDescription>At least 8 characters.</FieldDescription>
            <FieldError>{fieldError(state, "password")}</FieldError>
          </Field>
          <Field>
            <FieldLabel className="sr-only" htmlFor="confirmPassword">
              Confirm password
            </FieldLabel>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm password"
              autoComplete="new-password"
              required
            />
            <FieldError>{fieldError(state, "confirmPassword")}</FieldError>
          </Field>
          <AuthFormMessage state={state} />
          <Field>
            <AuthSubmitButton>Update password</AuthSubmitButton>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
