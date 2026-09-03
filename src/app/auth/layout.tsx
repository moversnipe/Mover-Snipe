import Image from "next/image"
import Link from "next/link"
import { Crosshair } from "lucide-react"

import { ROUTES } from "@/config/routes"
import { siteConfig } from "@/config/site"
import { ThemeToggle } from "@/components/theme-toggle"

// Shared frame for every page under /auth, after shadcn/ui's login-02 block
// mirrored: a full-bleed image on the left from `lg` up, the brand row and a
// centred form column on the right. Below `lg` the image is hidden and the
// form column takes the full width.
const AuthLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="grid min-h-svh lg:grid-cols-2">
    <div className="relative hidden bg-muted lg:block">
      <Image
        src="/placeholder.svg"
        alt=""
        fill
        unoptimized
        className="object-cover dark:brightness-[0.2] dark:grayscale"
      />
    </div>
    <div className="flex flex-col gap-4 p-6 md:p-10">
      <header className="flex items-center justify-between gap-2">
        <Link
          href={ROUTES.home}
          className="flex items-center gap-2 font-medium"
        >
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Crosshair className="size-4" aria-hidden />
          </div>
          {siteConfig.name}
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-xs">{children}</div>
      </main>
    </div>
  </div>
)

export default AuthLayout
