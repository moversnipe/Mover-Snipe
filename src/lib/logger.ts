/**
 * Minimal structured logger. One JSON object per line so hosted log
 * platforms (Vercel, Supabase, Datadog) can index fields.
 *
 * `message` is prose for a human reading the stream. A line that records a
 * side effect also carries `event`, a stable `<domain>.<object>.<verb>` name
 * such as `billing.checkout_session.created`, plus the ids involved, so a
 * write can be found and counted without matching on prose
 * (.claude/rules/agent-ready.md, rule 13).
 *
 * Never log secrets, tokens, or full request bodies.
 */
type Level = "debug" | "info" | "warn" | "error"

type Fields = Record<string, unknown> & {
  /** Stable `<domain>.<object>.<verb>` name for a side effect. */
  event?: string
}

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
