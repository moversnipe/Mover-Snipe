"use client"

import { useActionState, useState } from "react"
import Link from "next/link"

import { ROUTES } from "@/config/routes"
import { signUp } from "@/features/auth/actions"
import { AuthFormMessage } from "@/features/auth/components/auth-form-message"
import { AuthPageHeader } from "@/features/auth/components/auth-page-header"
import { AuthSubmitButton } from "@/features/auth/components/auth-submit-button"
import { PasswordRequirements } from "@/features/auth/components/password-requirements"
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
  const [password, setPassword] = useState("")
  const loginHref = next
    ? `${ROUTES.login}?next=${encodeURIComponent(next)}`
    : ROUTES.login

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <FieldGroup>
        <AuthPageHeader
          title="Create an account"
          description="Enter your email below to create your account"
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
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
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
          <AuthSubmitButton>Create account</AuthSubmitButton>
          <FieldDescription className="text-center">
            Already have an account?{" "}
            <Link href={loginHref} className="underline underline-offset-4">
              Login
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
