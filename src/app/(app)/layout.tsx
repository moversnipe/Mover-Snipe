import Link from "next/link"

import { ROUTES } from "@/config/routes"
import { siteConfig } from "@/config/site"
import { SignOutButton } from "@/features/auth/components/sign-out-button"
import { requireUser } from "@/features/auth/queries"
import { ThemeToggle } from "@/components/theme-toggle"

// Defence in depth: src/proxy.ts already redirects anonymous users, but the
// layout re-checks so a proxy matcher mistake can never expose app pages.
const AppLayout = async ({ children }: { children: React.ReactNode }) => {
  await requireUser()

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <nav
          aria-label="Main"
          className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-3"
        >
          <div className="flex items-center gap-6 text-sm">
            <Link href={ROUTES.home} className="font-mono tracking-tight">
              {siteConfig.name}
            </Link>
            <Link href={ROUTES.dashboard} className="hover:underline">
              Dashboard
            </Link>
            <Link href={ROUTES.billing} className="hover:underline">
              Billing
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <SignOutButton />
          </div>
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-8">
        {children}
      </main>
    </div>
  )
}

export default AppLayout
