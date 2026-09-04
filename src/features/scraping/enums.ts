import { z } from "zod"

import type { Enums } from "@/lib/supabase/database.types"

/** Zod mirror of the Postgres `scrape_status` enum in supabase/migrations. */
export const scrapeStatusSchema = z.enum([
  "running",
  "ready",
  "failed",
]) satisfies z.ZodType<Enums<"scrape_status">>

export type ScrapeStatus = z.infer<typeof scrapeStatusSchema>
