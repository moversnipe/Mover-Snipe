import type { AuthActionResult } from "@/features/auth/actions"
import { FieldError } from "@/components/ui/field"
import { formError } from "@/lib/actions/result"

type AuthFormMessageProps = {
  state: AuthActionResult | undefined
}

/**
 * Renders the form-level outcome of an auth action: the error that belongs to
 * no single input, or the confirmation message a successful action returned.
 */
export const AuthFormMessage = ({ state }: AuthFormMessageProps) => {
  const message = formError(state)
  if (message) return <FieldError>{message}</FieldError>

  if (!state?.ok || !state.data.message) return null

  return (
    <p role="status" className="text-sm text-muted-foreground">
      {state.data.message}
    </p>
  )
}
