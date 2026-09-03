"use client"

import { useActionState } from "react"
import Link from "next/link"

import { ROUTES } from "@/config/routes"
import { requestPasswordReset } from "@/features/auth/actions"
import { AuthFormMessage } from "@/features/auth/components/auth-form-message"
import { AuthPageHeader } from "@/features/auth/components/auth-page-header"
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

export const ForgotPasswordForm = () => {
  const [state, formAction] = useActionState(requestPasswordReset, undefined)

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <FieldGroup>
        <AuthPageHeader
          title="Forgot your password?"
          description="Enter your email below and we will send you a link to reset it"
        />
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            autoComplete="email"
            required
          />
          <FieldError>{fieldError(state, "email")}</FieldError>
        </Field>
        <AuthFormMessage state={state} />
        <Field>
          <AuthSubmitButton>Send reset link</AuthSubmitButton>
          <FieldDescription className="text-center">
            Remembered it?{" "}
            <Link href={ROUTES.login} className="underline underline-offset-4">
              Back to login
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
