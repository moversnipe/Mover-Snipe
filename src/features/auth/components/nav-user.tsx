"use client"

import { EllipsisVertical, LogOut } from "lucide-react"

import { signOut } from "@/features/auth/actions"
import { ThemeMenuItems } from "@/components/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

type NavUserProps = {
  /** Display name, already falling back to the email on the server. */
  name: string
  email: string
  avatarUrl: string | null
}

/** Up to two initials for the avatar fallback: "Ada Lovelace" -> "AL". */
const initialsOf = (name: string): string => {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join("")

  return initials || "?"
}

/**
 * Account card pinned to the bottom of the sidebar: who is signed in, plus the
 * menu that owns theme and sign-out. Collapses to just the avatar in icon mode,
 * because the vendored `SidebarMenuButton` squares itself off there.
 */
export const NavUser = ({ name, email, avatarUrl }: NavUserProps) => {
  const { isMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
              />
            }
          >
            <Avatar className="size-8 rounded-lg after:rounded-lg">
              {avatarUrl ? (
                <AvatarImage className="rounded-lg" src={avatarUrl} alt="" />
              ) : null}
              <AvatarFallback className="rounded-lg text-xs">
                {initialsOf(name)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate text-sm font-medium">{name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {email}
              </span>
            </div>
            <EllipsisVertical className="ml-auto" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <ThemeMenuItems />
            <DropdownMenuSeparator />
            {/*
              `nativeButton` stops Base UI emulating button behaviour over the
              div it renders by default, which would swallow the click before
              the form submitted. `closeOnClick={false}` keeps the form mounted
              until `signOut` redirects, rather than racing the unmount.
            */}
            <form action={signOut}>
              <DropdownMenuItem
                nativeButton
                closeOnClick={false}
                render={<button type="submit" className="w-full" />}
              >
                <LogOut aria-hidden="true" />
                Sign out
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
