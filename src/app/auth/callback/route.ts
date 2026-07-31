import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Only allow same-origin path redirects: must start with exactly one "/"
// ("//host" and "/\\host" are protocol-relative / parser-confusion forms).
export const sanitizeNextPath = (raw: string | null): string => {
  if (!raw) return '/'
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) {
    return '/'
  }
  return raw
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = sanitizeNextPath(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
