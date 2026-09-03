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
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

export const AppSidebar = () => {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
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
        The `base-nova` sidebar ships `gap-0` on both the content column and
        each menu, so groups and entries sit flush against one another. These
        overrides restore the spacing without hand-editing the vendored file.
      */}
      <SidebarContent className="gap-2">
        {/*
          The vendored sidebar renders plain `div`/`ul` elements, so the app
          would otherwise have no navigation landmark. `contents` keeps this
          wrapper out of the flex layout while still exposing the role.
        */}
        <nav aria-label="Main" className="contents">
          {NAV_SECTIONS.map((section) => (
            <SidebarGroup key={section.label ?? "overview"}>
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

      <SidebarRail />
    </Sidebar>
  )
}
