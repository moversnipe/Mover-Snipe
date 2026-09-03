import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import {
  DEFAULT_AUTHENTICATED_PATH,
  ROUTES,
  isPublicPath,
} from "@/config/routes"
import { clientEnv } from "@/lib/env/client"
import type { Database } from "@/lib/supabase/database.types"

/**
 * Refreshes the Supabase session cookie on every matched request and enforces
 * route access:
 *  - no session + non-public path  -> redirect to login (with `next`)
 *  - session + login page          -> redirect to the app
 *
 * Called from src/proxy.ts. Public paths are declared in src/config/routes.ts.
 */
export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and auth.getUser(); it can
  // desynchronise cookies and randomly log users out.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = ROUTES.login
    url.search = ""
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  if (user && pathname === ROUTES.login) {
    const url = request.nextUrl.clone()
    url.pathname = DEFAULT_AUTHENTICATED_PATH
    url.search = ""
    return NextResponse.redirect(url)
  }

  // Return supabaseResponse as-is so refreshed cookies reach the browser.
  return supabaseResponse
}
