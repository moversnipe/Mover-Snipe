"use client"

import { useActionState } from "react"

import { signUp } from "@/features/auth/actions"
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

type SignUpFormProps = {
  /** Sanitised same-origin path to open once the account is ready. */
  next?: string
}

export const SignUpForm = ({ next }: SignUpFormProps) => {
  const [state, formAction] = useActionState(signUp, undefined)

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {next ? <input type="hidden" name="next" value={next} /> : null}
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
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
          <FieldDescription>At least 8 characters.</FieldDescription>
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
        <AuthSubmitButton>Create account</AuthSubmitButton>
      </FieldGroup>
    </form>
  )
}
