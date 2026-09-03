import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { NavUser } from "@/features/auth/components/nav-user"
import { SidebarProvider } from "@/components/ui/sidebar"

// The action is a server module; the form only needs a callable reference.
const signOut = vi.fn()

vi.mock("@/features/auth/actions", () => ({
  signOut: (...args: unknown[]) => signOut(...args),
}))

const setTheme = vi.fn()

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "dark", setTheme }),
}))

const renderNavUser = () =>
  render(
    <SidebarProvider>
      <NavUser name="Ada Lovelace" email="ada@example.com" avatarUrl={null} />
    </SidebarProvider>
  )

const openMenu = async () => {
  const user = userEvent.setup()
  renderNavUser()
  await user.click(screen.getByRole("button", { name: /Ada Lovelace/ }))
  return user
}

describe("NavUser", () => {
  it("names the signed-in account", () => {
    renderNavUser()

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument()
    expect(screen.getByText("ada@example.com")).toBeInTheDocument()
  })

  it("falls back to initials without an avatar", () => {
    renderNavUser()

    expect(screen.getByText("AL")).toBeInTheDocument()
  })

  it("keeps theme and sign out inside the account menu", async () => {
    await openMenu()

    for (const label of ["Light", "Dark", "System"]) {
      expect(
        await screen.findByRole("menuitemradio", { name: label })
      ).toBeInTheDocument()
    }
    expect(screen.getByRole("menuitem", { name: "Sign out" })).toBeVisible()
  })

  it("ticks the active theme", async () => {
    await openMenu()

    expect(
      await screen.findByRole("menuitemradio", { name: "Dark" })
    ).toBeChecked()
    expect(
      screen.getByRole("menuitemradio", { name: "Light" })
    ).not.toBeChecked()
  })

  it("switches theme from the menu", async () => {
    const user = await openMenu()

    await user.click(
      await screen.findByRole("menuitemradio", { name: "Light" })
    )
    expect(setTheme).toHaveBeenCalledWith("light")
  })

  it("submits sign out as a form so the server action runs", async () => {
    await openMenu()

    const signOutItem = await screen.findByRole("menuitem", {
      name: "Sign out",
    })
    expect(signOutItem).toHaveAttribute("type", "submit")
    expect(signOutItem.closest("form")).not.toBeNull()
  })

  it("signs out from the keyboard", async () => {
    const user = await openMenu()

    const signOutItem = await screen.findByRole("menuitem", {
      name: "Sign out",
    })
    signOutItem.focus()
    await user.keyboard("{Enter}")

    // The mouse path submits with or without `nativeButton`; Base UI only
    // calls preventDefault on Enter and Space, so this is the case that
    // regresses if the prop goes.
    expect(signOut).toHaveBeenCalled()
  })
})
