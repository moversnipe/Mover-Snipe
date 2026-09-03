/**
 * Whether a stored avatar URL is safe to put in `<img src>`.
 *
 * `handle_new_user` seeds `profiles.avatar_url` from `raw_user_meta_data`,
 * which the signup call supplies, so the value is user-controlled even though
 * our own `signUp` never sets it. RLS keeps a row to its owner and an `img`
 * src runs no script, so the exposure is narrow, but an arbitrary URL still
 * makes the viewer's browser fetch a third party on load. Allow plain `https:`
 * only, which also rules out `data:`, `blob:` and protocol-relative values.
 */
export const isRenderableAvatar = (url: string | null): url is string => {
  if (!url) return false

  try {
    return new URL(url).protocol === "https:"
  } catch {
    return false
  }
}
