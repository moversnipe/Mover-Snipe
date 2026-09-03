import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ROUTES } from "@/config/routes"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

const pathname = vi.fn<() => string>()

vi.mock("next/navigation", () => ({
  usePathname: () => pathname(),
}))

const renderSidebar = (currentPath: string) => {
  pathname.mockReturnValue(currentPath)
  render(
    <SidebarProvider>
      <AppSidebar />
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
