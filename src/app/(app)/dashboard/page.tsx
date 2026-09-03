import type { Metadata } from "next"

import { getProfile, requireUser } from "@/features/auth/queries"
import { SubscriptionSummary } from "@/features/billing/components/subscription-summary"
import { getActiveSubscription } from "@/features/billing/queries"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata: Metadata = { title: "Dashboard" }

const DashboardPage = async () => {
  const user = await requireUser()
  // Independent reads: run in parallel to avoid a request waterfall.
  const [profile, subscription] = await Promise.all([
    getProfile(user.id),
    getActiveSubscription(user.id),
  ])

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              From the profiles table (RLS: own row)
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              <dt className="text-muted-foreground">Email</dt>
              <dd>{profile?.email ?? user.email}</dd>
              <dt className="text-muted-foreground">Name</dt>
              <dd>{profile?.full_name ?? "—"}</dd>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Synced from Stripe by webhook</CardDescription>
          </CardHeader>
          <CardContent>
            <SubscriptionSummary subscription={subscription} />
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default DashboardPage
