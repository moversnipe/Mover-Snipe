import { z } from "zod"

import type { Enums } from "@/lib/supabase/database.types"

/**
 * Zod mirrors of the Postgres enums in supabase/migrations. Stripe types its
 * enums as `KnownValue | OtherString` for forward compatibility, so values are
 * validated here before they reach the database.
 */
export const pricingTypeSchema = z.enum([
  "one_time",
  "recurring",
]) satisfies z.ZodType<Enums<"pricing_type">>

export const pricingPlanIntervalSchema = z.enum([
  "day",
  "week",
  "month",
  "year",
]) satisfies z.ZodType<Enums<"pricing_plan_interval">>

export const subscriptionStatusSchema = z.enum([
  "trialing",
  "active",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "past_due",
  "unpaid",
  "paused",
]) satisfies z.ZodType<Enums<"subscription_status">>
