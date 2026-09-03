import type { NextRequest } from "next/server"

import { updateSession } from "@/lib/supabase/session"

// Next.js 16 replaced `middleware.ts` with `proxy.ts`. Keep this file thin:
// route policy lives in src/config/routes.ts, session logic in
// src/lib/supabase/session.ts.
export const proxy = async (request: NextRequest) => updateSession(request)

export const config = {
  matcher: [
    // Everything except Next internals and static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
