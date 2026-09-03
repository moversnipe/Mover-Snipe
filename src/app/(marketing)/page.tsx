import type { Metadata } from "next"
import Link from "next/link"

import { DEFAULT_AUTHENTICATED_PATH, ROUTES } from "@/config/routes"
import { siteConfig } from "@/config/site"
import { getUser } from "@/features/auth/queries"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: { absolute: siteConfig.name },
  description: siteConfig.description,
}

const HomePage = async () => {
  const user = await getUser()

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-3xl flex-col px-6 py-8">
      <header className="flex items-center justify-between">
        <span className="font-mono text-sm tracking-tight">
          {siteConfig.name}
        </span>
        <ThemeToggle />
      </header>

      <section className="flex flex-1 flex-col justify-center gap-6 py-16">
        <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Welcome to {siteConfig.name}.
        </h1>
        <p className="max-w-prose text-lg text-pretty text-muted-foreground">
          Sign in to your account, or view our plans to get started.
        </p>
        <div className="flex flex-wrap gap-3">
          {user ? (
            <Button render={<Link href={DEFAULT_AUTHENTICATED_PATH} />}>
              Open dashboard
            </Button>
          ) : (
            <Button render={<Link href={ROUTES.login} />}>Sign in</Button>
          )}
          <Button variant="outline" render={<Link href={ROUTES.billing} />}>
            View plans
          </Button>
        </div>
      </section>
    </main>
  )
}

export default HomePage
