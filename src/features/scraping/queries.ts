import "server-only"

import { cache } from "react"

import { z } from "zod"

import {
  type ScrapeJobsInput,
  scrapeJobsSchema,
} from "@/features/scraping/schemas"
import { createClient } from "@/lib/supabase/server"

export const SCRAPE_JOB_COLUMNS =
  "id, user_id, dataset_id, input, status, snapshot_id, records, error, created_at, updated_at, completed_at"

/**
 * Returns one scrape job with its input, status, and records, or null when
 * there is none the caller may see. Signed-in users only; RLS limits it to
 * their own jobs. Read-only.
 */
export const getScrapeJob = cache(async (jobId: string) => {
  if (!z.uuid().safeParse(jobId).success) return null
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("scrape_jobs")
    .select(SCRAPE_JOB_COLUMNS)
    .eq("id", jobId)
    .maybeSingle()

  if (error) throw error
  return data
})

/**
 * Lists the caller's scrape jobs newest first, at most `limit` (default 20,
 * maximum 50), optionally only those created before `createdBefore`.
 * Signed-in users only; RLS limits it to their own jobs. Read-only.
 * Takes scalars so React.cache can dedupe calls with the same page.
 */
export const getScrapeJobs = cache(
  async (
    limit?: ScrapeJobsInput["limit"],
    createdBefore?: ScrapeJobsInput["createdBefore"]
  ) => {
    const parsed = scrapeJobsSchema.parse({ limit, createdBefore })
    const supabase = await createClient()
    let query = supabase
      .from("scrape_jobs")
      .select(SCRAPE_JOB_COLUMNS)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(parsed.limit)
    if (parsed.createdBefore) {
      query = query.lt("created_at", parsed.createdBefore)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  }
)
