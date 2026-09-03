/**
 * Sidebar navigation for the signed-in app.
 *
 * The shape lives here rather than in the component so the sidebar, the header
 * breadcrumb, and the tests all read the same list, and so adding a page is a
 * one-line change next to `ROUTES`.
 */
import {
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  Mail,
  Megaphone,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react"

import { ROUTES, isPathWithin } from "@/config/routes"

export type NavItem = {
  readonly title: string
  readonly href: string
  readonly icon: LucideIcon
}

export type NavSection = {
  /** Group heading. Omitted for the first group so Dashboard stands alone. */
  readonly label?: string
  readonly items: readonly NavItem[]
}

export const NAV_SECTIONS: readonly NavSection[] = [
  {
    items: [
      { title: "Dashboard", href: ROUTES.dashboard, icon: LayoutDashboard },
    ],
  },
  {
    label: "Pipeline",
    items: [
      { title: "Listings", href: ROUTES.listings, icon: Building2 },
      { title: "Prospects", href: ROUTES.prospects, icon: Users },
    ],
  },
  {
    label: "Outreach",
    items: [
      { title: "Templates", href: ROUTES.templates, icon: FileText },
      { title: "Campaigns", href: ROUTES.campaigns, icon: Megaphone },
      { title: "Mails", href: ROUTES.mails, icon: Mail },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Billing", href: ROUTES.billing, icon: CreditCard },
      { title: "Settings", href: ROUTES.settings, icon: Settings },
    ],
  },
]

/**
 * A nav entry stays highlighted for its own path and anything nested under it,
 * so a future `/listings/<id>` keeps Listings selected.
 */
export const isNavItemActive = (pathname: string, href: string): boolean =>
  isPathWithin(pathname, href)

export type NavMatch = {
  readonly section: NavSection
  readonly item: NavItem
}

/** The section and entry a pathname resolves to, or `null` off the nav tree. */
export const findNavMatch = (pathname: string): NavMatch | null => {
  for (const section of NAV_SECTIONS) {
    const item = section.items.find((navItem) =>
      isNavItemActive(pathname, navItem.href)
    )
    if (item) {
      return { section, item }
    }
  }

  return null
}

/**
 * Cookie the sidebar writes its open state into, read by `(app)/layout.tsx` so
 * the first server render matches. Mirrors `SIDEBAR_COOKIE_NAME` in the
 * vendored `src/components/ui/sidebar.tsx`, which does not export it; the
 * structural case in `navigation.test.ts` fails if that name ever drifts.
 */
export const SIDEBAR_STATE_COOKIE = "sidebar_state"

/**
 * Whether the sidebar starts expanded for the cookie value on this request.
 * Anything other than an explicit `"false"` — a missing cookie included —
 * opens it, so a first visit gets the full navigation.
 */
export const isSidebarOpenByDefault = (
  cookieValue: string | undefined
): boolean => cookieValue !== "false"
