import Link from "next/link"

import { ROUTES } from "@/config/routes"
import { siteConfig } from "@/config/site"
import { ThemeToggle } from "@/components/theme-toggle"

// Shared frame for every page under /auth: brand, theme toggle, and a centred
// column the individual cards drop into.
const AuthLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-svh flex-col">
    <header className="flex items-center justify-between gap-4 px-6 py-3">
      <Link href={ROUTES.home} className="font-mono text-sm tracking-tight">
        {siteConfig.name}
      </Link>
      <ThemeToggle />
    </header>
    <main className="flex flex-1 items-center justify-center px-6 pt-4 pb-16">
      <div className="w-full max-w-sm">{children}</div>
    </main>
  </div>
)

export default AuthLayout
