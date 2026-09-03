import { cookies } from "next/headers"

import {
  SIDEBAR_STATE_COOKIE,
  isSidebarOpenByDefault,
} from "@/config/navigation"
import { SignOutButton } from "@/features/auth/components/sign-out-button"
import { requireUser } from "@/features/auth/queries"
import { AppBreadcrumb } from "@/components/app-breadcrumb"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

// Defence in depth: src/proxy.ts already redirects anonymous users, but the
// layout re-checks so a proxy matcher mistake can never expose app pages.
const AppLayout = async ({ children }: { children: React.ReactNode }) => {
  // Independent reads: the session check and the cookie jar do not depend on
  // each other. The cookie keeps the first server render in step with the
  // sidebar state the user last chose, so it does not flash open on reload.
  const [, cookieStore] = await Promise.all([requireUser(), cookies()])
  const defaultOpen = isSidebarOpenByDefault(
    cookieStore.get(SIDEBAR_STATE_COOKIE)?.value
  )

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <AppBreadcrumb />
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <SignOutButton />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-8 p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default AppLayout
