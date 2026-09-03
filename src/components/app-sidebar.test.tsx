import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ROUTES } from "@/config/routes"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

const pathname = vi.fn<() => string>()

vi.mock("next/navigation", () => ({
  usePathname: () => pathname(),
}))

const user = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  avatarUrl: null,
}

const renderSidebar = (currentPath: string) => {
  pathname.mockReturnValue(currentPath)
  return render(
    <SidebarProvider>
      <AppSidebar user={user} />
    </SidebarProvider>
  )
}

describe("AppSidebar", () => {
  it("links every page to its route", () => {
    renderSidebar(ROUTES.dashboard)

    const expected: ReadonlyArray<[string, string]> = [
      ["Dashboard", ROUTES.dashboard],
      ["Listings", ROUTES.listings],
      ["Prospects", ROUTES.prospects],
      ["Templates", ROUTES.templates],
      ["Campaigns", ROUTES.campaigns],
      ["Mails", ROUTES.mails],
      ["Billing", ROUTES.billing],
      ["Settings", ROUTES.settings],
    ]

    for (const [name, href] of expected) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href)
    }
  })

  it("exposes the links inside a navigation landmark", () => {
    renderSidebar(ROUTES.dashboard)

    const nav = screen.getByRole("navigation", { name: "Main" })
    expect(nav).toContainElement(screen.getByRole("link", { name: "Mails" }))
  })

  it("labels the section groups", () => {
    renderSidebar(ROUTES.dashboard)

    expect(screen.getByText("Pipeline")).toBeInTheDocument()
    expect(screen.getByText("Outreach")).toBeInTheDocument()
    expect(screen.getByText("Account")).toBeInTheDocument()
  })

  it("marks the current page for assistive technology", () => {
    renderSidebar(ROUTES.campaigns)

    expect(screen.getByRole("link", { name: "Campaigns" })).toHaveAttribute(
      "aria-current",
      "page"
    )
    expect(screen.getByRole("link", { name: "Mails" })).not.toHaveAttribute(
      "aria-current"
    )
  })

  it("keeps the parent entry current on a nested path", () => {
    renderSidebar("/listings/some-listing")

    expect(screen.getByRole("link", { name: "Listings" })).toHaveAttribute(
      "aria-current",
      "page"
    )
  })
})

describe("AppSidebar account card", () => {
  it("shows the signed-in account at the foot of the sidebar", () => {
    renderSidebar(ROUTES.dashboard)

    expect(screen.getByText(user.name)).toBeInTheDocument()
    expect(screen.getByText(user.email)).toBeInTheDocument()
  })

  it("puts the account details behind a menu trigger", () => {
    renderSidebar(ROUTES.dashboard)

    expect(
      screen.getByRole("button", { name: /Ada Lovelace/ })
    ).toHaveAttribute("aria-haspopup")
  })

  it("falls back to initials when there is no avatar", () => {
    renderSidebar(ROUTES.dashboard)

    expect(screen.getByText("AL")).toBeInTheDocument()
  })
})

describe("AppSidebar chrome", () => {
  it("renders in the inset style, so the content sits in a floating card", () => {
    const { container } = renderSidebar(ROUTES.dashboard)

    expect(container.querySelector('[data-slot="sidebar"]')).toHaveAttribute(
      "data-variant",
      "inset"
    )
  })

  it("leaves out the rail, which invites a drag it does not support", () => {
    const { container } = renderSidebar(ROUTES.dashboard)

    expect(container.querySelector('[data-slot="sidebar-rail"]')).toBeNull()
  })
})
