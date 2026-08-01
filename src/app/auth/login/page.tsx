import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LoginForm } from "@/app/auth/login/login-form"

const LoginPage = async () => {
  // This page renders while Supabase may be unconfigured (no env vars set).
  // In that state `createClient()` throws, so only check for an existing
  // session when Supabase is actually configured. The middleware never
  // redirects here when unconfigured, so this branch is unreachable in
  // practice, but the page must still not crash the build's prerender pass.
  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      redirect("/")
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Enter your email and password to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginPage
