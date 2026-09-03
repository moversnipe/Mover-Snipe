"use client"

import { useActionState } from "react"

import { type AuthActionResult, signIn, signUp } from "@/features/auth/actions"
import { Button } from "@/components/ui/button"
import {
  Field,
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
  const [state, formAction, isPending] = useActionState(
    (prev: AuthActionResult | undefined, formData: FormData) =>
      formData.get("intent") === "sign-up"
        ? signUp(prev, formData)
        : signIn(prev, formData),
    undefined
  )

  const formError =
    state && !state.ok && !state.error.fieldErrors
      ? state.error.message
      : fieldError(state, "form")

  return (
    <form className="flex flex-col gap-6">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
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
            autoComplete="current-password"
            required
          />
          <FieldError>{fieldError(state, "password")}</FieldError>
        </Field>
        <FieldError>{formError}</FieldError>
        {state?.ok && state.data.message ? (
          <p className="text-sm text-muted-foreground" role="status">
            {state.data.message}
          </p>
        ) : null}
        <div className="flex flex-col gap-2">
          <Button
            type="submit"
            name="intent"
            value="sign-in"
            formAction={formAction}
            disabled={isPending}
          >
            Sign in
          </Button>
          <Button
            type="submit"
            variant="outline"
            name="intent"
            value="sign-up"
            formAction={formAction}
            disabled={isPending}
          >
            Create account
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}
