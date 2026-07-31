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
  const [signInState, signInAction, signInPending] = useActionState(
    signIn,
    initialState
  )
  const [signUpState, signUpAction, signUpPending] = useActionState(
    signUp,
    initialState
  )

  const state = signUpState.success ? signUpState : signInState
  const isPending = signInPending || signUpPending

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
        {signUpState.success && (
          <p className="text-sm text-muted-foreground">
            {signUpState.message}
          </p>
        )}
        <div className="flex flex-col gap-2">
          <Button formAction={signInAction} disabled={isPending}>
            Sign in
          </Button>
          <Button
            variant="outline"
            formAction={signUpAction}
            disabled={isPending}
          >
            Create account
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}
