"use client"

import { useActionState, useState } from "react"

import { submitUpdatePasswordForm } from "@/features/auth/actions"
import { AuthFormMessage } from "@/features/auth/components/auth-form-message"
import { AuthPageHeader } from "@/features/auth/components/auth-page-header"
import { AuthSubmitButton } from "@/features/auth/components/auth-submit-button"
import { PasswordRequirements } from "@/features/auth/components/password-requirements"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { fieldError } from "@/lib/actions/result"

export const UpdatePasswordForm = () => {
  const [state, formAction] = useActionState(
    submitUpdatePasswordForm,
    undefined
  )
  const [password, setPassword] = useState("")

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <FieldGroup>
        <AuthPageHeader
          title="Set a new password"
          description="Enter a new password for your account. It replaces the old one immediately"
        />
        <Field>
          <FieldLabel htmlFor="password">New password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            aria-describedby="password-requirements"
            required
            onChange={(event) => setPassword(event.target.value)}
          />
          <PasswordRequirements id="password-requirements" value={password} />
          <FieldError>{fieldError(state, "password")}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
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
  )
}
