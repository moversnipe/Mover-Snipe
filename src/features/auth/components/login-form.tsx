"use client"

import { useActionState } from "react"
import Link from "next/link"

import { ROUTES } from "@/config/routes"
import { signIn } from "@/features/auth/actions"
import { AuthFormMessage } from "@/features/auth/components/auth-form-message"
import { AuthSubmitButton } from "@/features/auth/components/auth-submit-button"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { fieldError } from "@/lib/actions/result"

type LoginFormProps = {
  /** Sanitised same-origin path to return to after sign-in. */
  next?: string
}

export const LoginForm = ({ next }: LoginFormProps) => {
  const [state, formAction] = useActionState(signIn, undefined)

  return (
    <div className="grid gap-6">
      <form action={formAction}>
        {next ? <input type="hidden" name="next" value={next} /> : null}
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
          <Field>
            <FieldLabel className="sr-only" htmlFor="password">
              Password
            </FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              required
            />
            <FieldError>{fieldError(state, "password")}</FieldError>
          </Field>
          <AuthFormMessage state={state} />
          <Field>
            <AuthSubmitButton>Sign In with Email</AuthSubmitButton>
          </Field>
        </FieldGroup>
      </form>
      <FieldSeparator>Or</FieldSeparator>
      <Button variant="outline" render={<Link href={ROUTES.forgotPassword} />}>
        Forgot password?
      </Button>
    </div>
  )
}
