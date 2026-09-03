"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Crosshair } from "lucide-react"

import { NAV_SECTIONS, isNavItemActive } from "@/config/navigation"
import { ROUTES } from "@/config/routes"
import { siteConfig } from "@/config/site"
import { NavUser } from "@/features/auth/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

type AppSidebarProps = {
  /** Signed-in account shown in the footer card. */
  user: {
    name: string
    email: string
    avatarUrl: string | null
  }
}

/**
 * Centres the fixed-size buttons once the sidebar collapses.
 *
 * The `inset` container reserves `--sidebar-width-icon` plus 18px, but only 16
 * of that is its own padding: the spare 2px exists for the `floating` variant's
 * ring, which `inset` never draws. That leaves a 34px track around a 32px
 * button, and flex parks it at the start, so every icon sits 2px left of centre.
 */
const COLLAPSED_CENTERING = "group-data-[collapsible=icon]:items-center"

export const AppSidebar = ({ user }: AppSidebarProps) => {
  const pathname = usePathname()

  // `inset` drops the sidebar's own panel background and turns the paired
  // `SidebarInset` into a rounded, floating content card. The wrapper picks up
  // the sidebar colour as the page background via `has-data-[variant=inset]`.
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu className={COLLAPSED_CENTERING}>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href={ROUTES.dashboard} />}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Crosshair className="size-4" aria-hidden="true" />
              </div>
              <span className="truncate font-medium">{siteConfig.name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/*
        The `base-nova` sidebar ships `gap-0` on both the content column and
        each menu, so groups and entries sit flush against one another. These
        overrides restore the spacing without hand-editing the vendored file.

        Collapsed to icon width the group labels shrink to nothing, so the
        breathing room between groups would strand icons far apart while their
        neighbours inside a group stay 4px away. Fall back to that same 4px so
        every icon is evenly spaced, and transition the gap rather than
        snapping it, to match the 200ms the sidebar itself animates over.
      */}
      <SidebarContent className="gap-2 transition-[gap] duration-200 ease-linear group-data-[collapsible=icon]:gap-1">
        {/*
          The vendored sidebar renders plain `div`/`ul` elements, so the app
          would otherwise have no navigation landmark. `contents` keeps this
          wrapper out of the flex layout while still exposing the role.
        */}
        <nav aria-label="Main" className="contents">
          {NAV_SECTIONS.map((section) => (
            <SidebarGroup
              key={section.label ?? "overview"}
              className="transition-[padding] duration-200 ease-linear group-data-[collapsible=icon]:py-0"
            >
              {section.label ? (
                <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
              ) : null}
              <SidebarGroupContent>
                <SidebarMenu className={cn("gap-1", COLLAPSED_CENTERING)}>
                  {section.items.map((item) => {
                    const isActive = isNavItemActive(pathname, item.href)

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          isActive={isActive}
                          tooltip={item.title}
                          aria-current={isActive ? "page" : undefined}
                          render={<Link href={item.href} />}
                        >
                          <item.icon aria-hidden="true" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </nav>
      </SidebarContent>

      <SidebarFooter>
        <NavUser {...user} />
      </SidebarFooter>
    </Sidebar>
  )
}
