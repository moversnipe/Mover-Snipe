"use client"

import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

type AuthSubmitButtonProps = {
  children: React.ReactNode
}

/**
 * Submit button for the auth forms. Reads pending state from the enclosing
 * <form> with useFormStatus, so each form does not have to thread it down.
 */
export const AuthSubmitButton = ({ children }: AuthSubmitButtonProps) => {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Spinner aria-hidden /> : null}
      {children}
    </Button>
  )
}
