import { formatPrice } from "@/features/billing/format"
import type { getActiveSubscription } from "@/features/billing/queries"
import { Badge } from "@/components/ui/badge"

type SubscriptionSummaryProps = {
  subscription: Awaited<ReturnType<typeof getActiveSubscription>>
}

export const SubscriptionSummary = ({
  subscription,
}: SubscriptionSummaryProps) => {
  if (!subscription) {
    return (
      <p className="text-sm text-muted-foreground">
        You are not subscribed to a plan.
      </p>
    )
  }

  const price = subscription.prices
  const renewsOn = subscription.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString()
    : null

  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="font-medium">
          {price?.products?.name ?? "Subscription"}
        </span>
        <Badge variant="secondary">{subscription.status}</Badge>
      </div>
      {price ? (
        <span className="text-muted-foreground">{formatPrice(price)}</span>
      ) : null}
      {renewsOn ? (
        <span className="text-muted-foreground">
          {subscription.cancel_at_period_end ? "Ends" : "Renews"} on {renewsOn}
        </span>
      ) : null}
    </div>
  )
}
