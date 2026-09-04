/**
 * Whether a stored avatar URL is safe to put in `<img src>`.
 *
 * `handle_new_user` seeds `profiles.avatar_url` from `raw_user_meta_data`, so
 * whatever a signup call passes lands in the column. Our own `signUp` sends
 * none, and there is no OAuth provider yet, so today the only writer is an
 * account owner calling Supabase Auth directly with the publishable key — and
 * RLS means they would be poisoning a row only they can read. Narrow, and a
 * predicate is cheaper than remembering this when a provider does arrive:
 * allow plain `https:`, which also rules out `data:`, `blob:` and
 * protocol-relative values.
 */
export const isRenderableAvatar = (
  url: string | null | undefined
): url is string => {
  if (!url) return false

  try {
    return new URL(url).protocol === "https:"
  } catch {
    return false
  }
}

/**
 * Up to two initials for the avatar fallback: "Ada Lovelace" -> "AL".
 *
 * Returns "?" for a name that yields none, which `getAccountLabels` already
 * prevents; kept so the helper stands on its own.
 */
export const getInitials = (name: string): string => {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join("")

  return initials || "?"
}

/**
 * What the account card shows for the signed-in user.
 *
 * One chain on `||` rather than `??`: `profiles.full_name` is nullable `text`
 * with no check, so a blank string has to fall through the same way a missing
 * one does, and the JWT carries no email claim for phone or anonymous
 * sign-in. Without that, the card could render a blank name over a blank
 * email over "?".
 */
export const getAccountLabels = (
  profile: { email: string | null; full_name: string | null } | null,
  claimedEmail: string | undefined
): { name: string; email: string } => {
  const email = profile?.email || claimedEmail || ""

  return { name: profile?.full_name?.trim() || email || "Account", email }
}
