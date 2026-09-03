"use client"

import { useActionState } from "react"

import { startCheckout } from "@/features/billing/actions"
import { Button } from "@/components/ui/button"

type CheckoutButtonProps = {
  priceId: string
  isCurrent?: boolean
}

export const CheckoutButton = ({ priceId, isCurrent }: CheckoutButtonProps) => {
  const [state, formAction, isPending] = useActionState(
    startCheckout,
    undefined
  )

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="priceId" value={priceId} />
      <Button type="submit" size="sm" disabled={isPending || isCurrent}>
        {isCurrent ? "Current plan" : isPending ? "Redirecting…" : "Choose"}
      </Button>
      {state && !state.ok ? (
        <p className="text-xs text-destructive" role="alert">
          {state.error.message}
        </p>
      ) : null}
    </form>
  )
}
