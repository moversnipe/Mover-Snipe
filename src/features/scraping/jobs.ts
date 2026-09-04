import "server-only"

import { logger } from "@/lib/logger"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Json, TablesUpdate } from "@/lib/supabase/database.types"

// Admin client throughout: a job is completed by the system, from Bright
// Data's answer or from its webhook (which runs with no user session), and
// `scrape_jobs` has no client update policy on purpose so a user cannot
// rewrite a job's status or records through the Data API.

/** What Bright Data told us about a job, ready to be stored. */
export type ScrapeOutcome =
  | { status: "ready"; records: Json[] }
  | { status: "running"; snapshotId: string | null }
  | { status: "failed"; error: string }

const throwIfError = (error: { message: string } | null, context: string) => {
  if (error) throw new Error(`${context}: ${error.message}`)
}

/**
 * Returns a job's status and snapshot id regardless of who owns it, or null
 * when it does not exist. Webhook code only; read-only.
 */
export const getScrapeJobAsSystem = async (jobId: string) => {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("scrape_jobs")
    .select("id, status, snapshot_id")
    .eq("id", jobId)
    .maybeSingle()
  throwIfError(error, "get scrape job as system")
  return data
}

/** The row change for an outcome, or null when there is nothing new to store yet. */
const toPatch = (
  outcome: ScrapeOutcome
): TablesUpdate<"scrape_jobs"> | null => {
  if (outcome.status === "ready") {
    return {
      status: "ready",
      records: outcome.records,
      error: null,
      completed_at: new Date().toISOString(),
    }
  }
  if (outcome.status === "failed") {
    return {
      status: "failed",
      error: outcome.error,
      completed_at: new Date().toISOString(),
    }
  }
  return outcome.snapshotId ? { snapshot_id: outcome.snapshotId } : null
}

/**
 * Stores what Bright Data reported for a job: its records (ready), its
 * snapshot id (running), or why it failed. System code only. Safe to repeat:
 * only a running job is changed, so the first terminal outcome is final, and
 * a running outcome without a snapshot id writes nothing.
 */
export const applyScrapeOutcome = async (
  jobId: string,
  outcome: ScrapeOutcome
): Promise<void> => {
  const patch = toPatch(outcome)
  if (!patch) return

  // Only a running job changes: a delivery and a status notice arrive as
  // separate calls, and the first terminal write must win.
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("scrape_jobs")
    .update(patch)
    .eq("id", jobId)
    .eq("status", "running")
    .select("id")
  throwIfError(error, "apply scrape outcome")
  if (!data || data.length === 0) {
    logger.info("Scrape job already finished; outcome not applied", {
      event: "scraping.scrape_job.skipped",
      jobId,
      outcome: outcome.status,
    })
    return
  }

  logger.info("Scrape job updated", {
    event: `scraping.scrape_job.${outcome.status}`,
    jobId,
    snapshotId: outcome.status === "running" ? outcome.snapshotId : undefined,
    recordCount:
      outcome.status === "ready" ? outcome.records.length : undefined,
  })
}
