"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const

/**
 * The three theme choices as radio items, so the active one carries a tick.
 *
 * Shared by the standalone toggle below and the account menu in the sidebar
 * footer, so the two never drift apart. `theme` is undefined until next-themes
 * has read storage on mount; menu content only mounts once opened, so the
 * fallback is belt and braces rather than a state we expect to render.
 */
export const ThemeMenuItems = () => {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenuRadioGroup
      value={theme ?? "system"}
      onValueChange={(value) => setTheme(String(value))}
    >
      {/*
        Inside the group, not beside it: this maps to Base UI's `GroupLabel`,
        which throws without a group ancestor and names the radio group for
        assistive technology.
      */}
      <DropdownMenuLabel>Theme</DropdownMenuLabel>
      {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
        <DropdownMenuRadioItem key={value} value={value}>
          <Icon aria-hidden="true" />
          {label}
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  )
}

/** Icon-button theme switcher for the pages that sit outside the app shell. */
export const ThemeToggle = () => (
  <DropdownMenu>
    <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
      <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <ThemeMenuItems />
    </DropdownMenuContent>
  </DropdownMenu>
)
