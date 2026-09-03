"use client"

import { useActionState } from "react"
import Link from "next/link"

import { ROUTES } from "@/config/routes"
import { signIn } from "@/features/auth/actions"
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

type LoginFormProps = {
  /** Sanitised same-origin path to return to after sign-in. */
  next?: string
}

export const LoginForm = ({ next }: LoginFormProps) => {
  const [state, formAction] = useActionState(signIn, undefined)
  const signUpHref = next
    ? `${ROUTES.signUp}?next=${encodeURIComponent(next)}`
    : ROUTES.signUp

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <FieldGroup>
        <AuthPageHeader
          title="Login to your account"
          description="Enter your email below to login to your account"
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
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link
              href={ROUTES.forgotPassword}
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
          <FieldError>{fieldError(state, "password")}</FieldError>
        </Field>
        <AuthFormMessage state={state} />
        <Field>
          <AuthSubmitButton>Login</AuthSubmitButton>
          <FieldDescription className="text-center">
            Don&apos;t have an account?{" "}
            <Link href={signUpHref} className="underline underline-offset-4">
              Sign up
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
