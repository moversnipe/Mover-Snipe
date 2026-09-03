// Edge Function template. Deno runtime; not part of the Next.js build.
//
// Authorisation happens here, not at the gateway: config.toml sets
// `verify_jwt = false` for every function because the platform check only
// understands legacy JWT-based API keys. `withSupabase` verifies the caller's
// session JWT against the project's signing keys (JWKS) and hands back
// `ctx.supabase`, already scoped to the caller's RLS policies.
//
// Auth modes: 'user' (session JWT), 'secret' (secret key on `apikey` for
// service-to-service calls), 'publishable', 'none' (public / provider-signed
// webhooks; you must verify the caller yourself).
import { withSupabase } from "npm:@supabase/server@1"

export default {
  fetch: withSupabase({ auth: "user" }, async (_request, ctx) => {
    const { data, error } = await ctx.supabase
      .from("profiles")
      .select("id, email, full_name")
      .eq("id", ctx.userClaims?.sub ?? "")
      .maybeSingle()

    if (error) {
      return Response.json(
        { error: { code: "internal_error", message: "Could not load profile" } },
        { status: 500 }
      )
    }

    return Response.json({ data: { claims: ctx.userClaims, profile: data } })
  }),
}
