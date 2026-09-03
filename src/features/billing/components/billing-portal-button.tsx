"use client"

import { useActionState } from "react"

import { openBillingPortal } from "@/features/billing/actions"
import { Button } from "@/components/ui/button"

export const BillingPortalButton = () => {
  const [state, formAction, isPending] = useActionState(
    openBillingPortal,
    undefined
  )

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <Button type="submit" variant="outline" disabled={isPending}>
        {isPending ? "Opening…" : "Manage billing"}
      </Button>
      {state && !state.ok ? (
        <p className="text-xs text-destructive" role="alert">
          {state.error.message}
        </p>
      ) : null}
    </form>
  )
}
