import { cookies } from "next/headers"

import {
  SIDEBAR_STATE_COOKIE,
  isSidebarOpenByDefault,
} from "@/config/navigation"
import { getAccountLabels } from "@/features/auth/account"
import { NavUser } from "@/features/auth/components/nav-user"
import { getProfile, requireUser } from "@/features/auth/queries"
import { AppBreadcrumb } from "@/components/app-breadcrumb"
import { AppSidebar } from "@/components/app-sidebar"
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
  const [user, cookieStore] = await Promise.all([requireUser(), cookies()])
  const defaultOpen = isSidebarOpenByDefault(
    cookieStore.get(SIDEBAR_STATE_COOKIE)?.value
  )
  // Needs the id from the check above, so it cannot join the batch.
  const profile = await getProfile(user.id)
  const { name, email } = getAccountLabels(profile, user.email)

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar
        footer={
          <NavUser name={name} email={email} avatarUrl={profile?.avatar_url} />
        }
      />
      <SidebarInset>
        {/* Borderless: the card's own edge already separates it from the page. */}
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <AppBreadcrumb />
        </header>
        {/* No top padding: the h-16 header above already spaces the content. */}
        <div className="flex flex-1 flex-col gap-8 px-6 pb-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default AppLayout
