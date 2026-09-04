import { z } from "zod"

/** Bright Data accepts at most this many inputs on the synchronous endpoint. */
export const SCRAPE_MAX_INPUTS = 20

/** One input row, keyed by the dataset's input columns (usually just `url`). */
export const scrapeInputRecordSchema = z.record(
  z.string().min(1).max(64),
  z.union([z.string().max(2048), z.number(), z.boolean()])
)

/** Start of a scrape: which Bright Data scraper to run and on what. */
export const runScrapeJobSchema = z.object({
  datasetId: z
    .string()
    .max(64)
    .startsWith("gd_", "Invalid dataset id")
    .describe(
      "Bright Data dataset id of the scraper to run, such as gd_l7q7dkf244hwjntr0 (Scraper Library)"
    ),
  input: z
    .array(scrapeInputRecordSchema)
    .min(1)
    .max(SCRAPE_MAX_INPUTS)
    .describe(
      "One row per page to scrape, using the dataset's input columns, usually { url }"
    ),
})

export type RunScrapeJobInput = z.infer<typeof runScrapeJobSchema>

/** Hard ceiling on one scrape-job list read. */
export const SCRAPE_JOBS_MAX_LIMIT = 50

/** Job list read: newest first, paged by creation time. */
export const scrapeJobsSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(SCRAPE_JOBS_MAX_LIMIT)
    .default(20)
    .describe("Maximum number of jobs to return"),
  createdBefore: z.iso
    .datetime({ offset: true })
    .optional()
    .describe(
      "Cursor: only jobs created before this UTC time, taken from the last row of the previous page"
    ),
})

export type ScrapeJobsInput = z.input<typeof scrapeJobsSchema>
