import Link from "next/link"

import { ThemeToggle } from "@/components/theme-toggle"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type AuthTopBarProps = {
  /** The one other place this page points to, e.g. "Login" from sign-up. */
  link?: {
    href: string
    label: string
  }
}

/**
 * Pinned to the top-right corner of the auth screen: the page's counterpart
 * link (rendered as a ghost button) and the theme toggle. Positioned against
 * the nearest `relative` ancestor, which `auth/layout.tsx` provides.
 */
export const AuthTopBar = ({ link }: AuthTopBarProps) => (
  <div className="absolute top-4 right-4 flex items-center gap-2 md:top-8 md:right-8">
    {link ? (
      <Link
        href={link.href}
        className={cn(buttonVariants({ variant: "ghost" }))}
      >
        {link.label}
      </Link>
    ) : null}
    <ThemeToggle />
  </div>
)
