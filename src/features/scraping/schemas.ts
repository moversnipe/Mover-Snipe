import { z } from "zod"

/** One Bright Data input object: the dataset decides the keys (url, keyword, ...). */
const scrapeInputSchema = z.record(
  z.string().min(1).max(100),
  z.union([z.string().max(2000), z.number(), z.boolean()])
)

/** Hard ceiling on inputs per scrape. */
export const SCRAPE_MAX_INPUTS = 1000

/** Start of a scrape: which Bright Data dataset to run and on what. */
export const startScrapeSchema = z.object({
  datasetId: z
    .string()
    .regex(/^gd_[a-z0-9]+$/, "Invalid dataset id")
    .describe("Bright Data dataset id, such as gd_l7q7dkf244hwjntr0"),
  input: z
    .array(scrapeInputSchema)
    .min(1)
    .max(SCRAPE_MAX_INPUTS)
    .describe(
      "One object per thing to collect, in the dataset's input shape (for example { url } or { keyword, location })"
    ),
  discoverBy: z
    .string()
    .min(1)
    .max(100)
    .optional()
    .describe(
      "For discovery datasets: which input the dataset should discover records by, such as keyword or url. Omit to collect the given inputs directly"
    ),
  limitPerInput: z
    .number()
    .int()
    .min(1)
    .max(100_000)
    .optional()
    .describe("Maximum records collected per input object"),
  limitMultipleResults: z
    .number()
    .int()
    .min(1)
    .max(1_000_000)
    .optional()
    .describe("Maximum records collected across the whole scrape"),
})

export type StartScrapeInput = z.infer<typeof startScrapeSchema>

/** One scrape by id. */
export const getScrapeSchema = z.object({
  scrapeId: z.uuid().describe("The scrape to read"),
})

export type GetScrapeInput = z.infer<typeof getScrapeSchema>

/** Hard ceiling on one scrapes list read. */
export const SCRAPES_MAX_LIMIT = 100

/** Scrapes list: newest first, paged by the created_at of the last row seen. */
export const listScrapesSchema = z.object({
  limit: z.number().int().min(1).max(SCRAPES_MAX_LIMIT).default(20),
  cursor: z.iso
    .datetime({ offset: true })
    .optional()
    .describe(
      "created_at of the last scrape from the previous page; returns strictly older scrapes, so scrapes created in the same instant as the cursor are skipped"
    ),
})

export type ListScrapesInput = z.input<typeof listScrapesSchema>

/** Hard ceiling on one records list read. */
export const SCRAPE_RECORDS_MAX_LIMIT = 500

/** Records of one scrape: in snapshot order, paged by position. */
export const listScrapeRecordsSchema = z.object({
  scrapeId: z.uuid().describe("The scrape whose records to read"),
  limit: z.number().int().min(1).max(SCRAPE_RECORDS_MAX_LIMIT).default(100),
  cursor: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe(
      "position of the last record from the previous page; returns later records only"
    ),
})

export type ListScrapeRecordsInput = z.input<typeof listScrapeRecordsSchema>
