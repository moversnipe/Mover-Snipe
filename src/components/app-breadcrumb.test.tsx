import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ROUTES } from "@/config/routes"
import { AppBreadcrumb } from "@/components/app-breadcrumb"

const pathname = vi.fn<() => string>()

vi.mock("next/navigation", () => ({
  usePathname: () => pathname(),
}))

const renderBreadcrumb = (currentPath: string) => {
  pathname.mockReturnValue(currentPath)
  return render(<AppBreadcrumb />)
}

describe("AppBreadcrumb", () => {
  it("names the section and the page for a grouped route", () => {
    renderBreadcrumb(ROUTES.templates)

    expect(screen.getByText("Outreach")).toBeInTheDocument()
    expect(screen.getByText("Templates")).toBeInTheDocument()
  })

  it("shows only the page for the ungrouped dashboard", () => {
    renderBreadcrumb(ROUTES.dashboard)

    expect(screen.getByText("Dashboard")).toBeInTheDocument()
    expect(screen.queryByText("Pipeline")).not.toBeInTheDocument()
  })

  it("renders nothing for a path outside the sidebar", () => {
    const { container } = renderBreadcrumb(ROUTES.updatePassword)

    expect(container).toBeEmptyDOMElement()
  })
})
