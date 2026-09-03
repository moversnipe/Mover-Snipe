/**
 * Minimal structured logger. One JSON object per line so hosted log
 * platforms (Vercel, Supabase, Datadog) can index fields.
 *
 * Never log secrets, tokens, or full request bodies.
 */
type Level = "debug" | "info" | "warn" | "error"

type Fields = Record<string, unknown>

const write = (level: Level, message: string, fields?: Fields) => {
  const line = JSON.stringify({
    level,
    message,
    time: new Date().toISOString(),
    ...fields,
  })
  if (level === "error") console.error(line)
  else if (level === "warn") console.warn(line)
  else console.log(line)
}

export const logger = {
  debug: (message: string, fields?: Fields) => write("debug", message, fields),
  info: (message: string, fields?: Fields) => write("info", message, fields),
  warn: (message: string, fields?: Fields) => write("warn", message, fields),
  error: (message: string, fields?: Fields) => write("error", message, fields),
}
