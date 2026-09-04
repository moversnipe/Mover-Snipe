"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Crosshair } from "lucide-react"

import { NAV_SECTIONS, isNavItemActive } from "@/config/navigation"
import { ROUTES } from "@/config/routes"
import { siteConfig } from "@/config/site"
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

type AppSidebarProps = {
  /**
   * Pinned to the bottom of the rail. Passed in rather than imported so this
   * stays domain-free: the account card belongs to the auth feature.
   */
  footer: React.ReactNode
}

export const AppSidebar = ({ footer }: AppSidebarProps) => {
  const pathname = usePathname()

  // `inset` paints the page wrapper in the sidebar colour via
  // `has-data-[variant=inset]`, so the rail reads as part of the background
  // rather than a panel against it, and the paired `SidebarInset` becomes a
  // rounded content card floating on top.
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
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
        `base-nova` ships `gap-0` on the content column and every menu, which
        leaves entries flush against each other. One rhythm, 4px, applied to
        both: the group labels already give expanded sections their separation,
        and they collapse to nothing in icon mode, so the same gap reads as
        evenly spaced icons there without anything having to change between
        states. Groups drop their vertical padding for the same reason — kept,
        it would strand collapsed icons far apart from their neighbours.
      */}
      <SidebarContent className="gap-1">
        {/*
          The vendored sidebar renders plain `div`/`ul` elements, so the app
          would otherwise have no navigation landmark. `contents` keeps this
          wrapper out of the flex layout while still exposing the role.
        */}
        <nav aria-label="Main" className="contents">
          {NAV_SECTIONS.map((section) => (
            <SidebarGroup key={section.label ?? "overview"} className="py-0">
              {section.label ? (
                <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
              ) : null}
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
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

      <SidebarFooter>{footer}</SidebarFooter>
    </Sidebar>
  )
}
