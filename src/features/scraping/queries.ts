import "server-only"

import { cache } from "react"

import {
  type ListScrapeRecordsInput,
  type ListScrapesInput,
  listScrapeRecordsSchema,
  listScrapesSchema,
} from "@/features/scraping/schemas"
import { createClient } from "@/lib/supabase/server"

const SCRAPE_COLUMNS =
  "id, dataset_id, snapshot_id, status, input, record_count, error, created_at, completed_at"

/**
 * Lists the signed-in user's scrapes, newest first, at most `limit` (default
 * 20, maximum 100), continuing after `cursor` when given. RLS scopes the read
 * to the caller's own rows. Read-only.
 */
export const listScrapes = cache(async (input: ListScrapesInput = {}) => {
  const { limit, cursor } = listScrapesSchema.parse(input)
  const supabase = await createClient()
  let query = supabase
    .from("scrapes")
    .select(SCRAPE_COLUMNS)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit)
  if (cursor) query = query.lt("created_at", cursor)

  const { data, error } = await query
  if (error) throw error
  return data
})

/**
 * Returns one scrape by id, or null when it does not exist or belongs to
 * someone else (RLS). Read-only.
 */
export const getScrape = cache(async (scrapeId: string) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("scrapes")
    .select(SCRAPE_COLUMNS)
    .eq("id", scrapeId)
    .maybeSingle()

  if (error) throw error
  return data
})

/**
 * Lists the records of one scrape in snapshot order, at most `limit` (default
 * 100, maximum 500), continuing after `cursor` (a position) when given. RLS
 * returns nothing for scrapes the caller does not own. Read-only.
 */
export const listScrapeRecords = cache(
  async (input: ListScrapeRecordsInput) => {
    const { scrapeId, limit, cursor } = listScrapeRecordsSchema.parse(input)
    const supabase = await createClient()
    let query = supabase
      .from("scrape_records")
      .select("id, scrape_id, position, data")
      .eq("scrape_id", scrapeId)
      .order("position", { ascending: true })
      .limit(limit)
    if (cursor !== undefined) query = query.gt("position", cursor)

    const { data, error } = await query
    if (error) throw error
    return data
  }
)
