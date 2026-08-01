"use client"

import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { signIn, signUp, type AuthFormState } from "@/app/auth/login/actions"

const initialState: AuthFormState = {}

export const LoginForm = () => {
  const [state, formAction, isPending] = useActionState(
    (prev: AuthFormState, formData: FormData) =>
      formData.get("intent") === "sign-up"
        ? signUp(prev, formData)
        : signIn(prev, formData),
    initialState
  )

  return (
    <form className="flex flex-col gap-6">
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
          <FieldError>{state.errors?.email?.[0]}</FieldError>
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
          <FieldError>{state.errors?.password?.[0]}</FieldError>
        </Field>
        <FieldError>{state.errors?.form?.[0]}</FieldError>
        {state.success && (
          <p className="text-sm text-muted-foreground">{state.message}</p>
        )}
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
