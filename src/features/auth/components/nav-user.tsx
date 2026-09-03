"use client"

import { EllipsisVertical, LogOut } from "lucide-react"

import { signOut } from "@/features/auth/actions"
import { getInitials, isRenderableAvatar } from "@/features/auth/account"
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
  /** Remote avatar. Untrusted — see `isRenderableAvatar`. */
  avatarUrl?: string | null
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
            <Avatar className="rounded-lg after:rounded-lg">
              {isRenderableAvatar(avatarUrl) ? (
                <AvatarImage className="rounded-lg" src={avatarUrl} alt="" />
              ) : null}
              <AvatarFallback className="rounded-lg text-xs">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 leading-tight">
              <span className="truncate text-sm font-medium">{name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {email}
              </span>
            </div>
            <EllipsisVertical aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56"
            side={isMobile ? "bottom" : "right"}
            align="end"
          >
            <ThemeMenuItems />
            <DropdownMenuSeparator />
            {/*
              `DropdownMenuItem` renders a div and emulates a button over it,
              which means `preventDefault()` on Enter and Space. Over a real
              submit button that kills keyboard sign-out (the mouse path works
              either way, so only the keyboard test catches a regression).
              `nativeButton` tells Base UI the element already is a button.
            */}
            <form action={signOut}>
              <DropdownMenuItem
                nativeButton
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
