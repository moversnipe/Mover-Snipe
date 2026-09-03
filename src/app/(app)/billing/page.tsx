import type { Metadata } from "next"

import { requireUser } from "@/features/auth/queries"
import { BillingPortalButton } from "@/features/billing/components/billing-portal-button"
import { PricingTable } from "@/features/billing/components/pricing-table"
import { SubscriptionSummary } from "@/features/billing/components/subscription-summary"
import {
  getActiveSubscription,
  getProductsWithPrices,
} from "@/features/billing/queries"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export const metadata: Metadata = { title: "Billing" }

type BillingPageProps = {
  searchParams: Promise<{ checkout?: string }>
}

const BillingPage = async ({ searchParams }: BillingPageProps) => {
  const user = await requireUser()
  const [{ checkout }, products, subscription] = await Promise.all([
    searchParams,
    getProductsWithPrices(),
    getActiveSubscription(user.id),
  ])

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
          <p className="text-sm text-muted-foreground">
            Choose a plan or manage your existing subscription.
          </p>
        </div>
        {subscription ? <BillingPortalButton /> : null}
      </div>

      {checkout === "success" ? (
        <Alert>
          <AlertTitle>Payment received</AlertTitle>
          <AlertDescription>
            Your subscription will appear below as soon as Stripe confirms it.
          </AlertDescription>
        </Alert>
      ) : null}
      {checkout === "canceled" ? (
        <Alert>
          <AlertTitle>Checkout canceled</AlertTitle>
          <AlertDescription>No charge was made.</AlertDescription>
        </Alert>
      ) : null}

      <section aria-labelledby="current-plan" className="flex flex-col gap-2">
        <h2 id="current-plan" className="text-lg font-medium">
          Current plan
        </h2>
        <SubscriptionSummary subscription={subscription} />
      </section>

      <section aria-labelledby="plans" className="flex flex-col gap-4">
        <h2 id="plans" className="text-lg font-medium">
          Plans
        </h2>
        <PricingTable
          products={products}
          currentPriceId={subscription?.prices?.id}
        />
      </section>
    </>
  )
}

export default BillingPage
