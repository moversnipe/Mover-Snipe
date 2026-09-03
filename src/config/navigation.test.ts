import { readFileSync } from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

import {
  NAV_SECTIONS,
  SIDEBAR_STATE_COOKIE,
  findNavMatch,
  isNavItemActive,
  isSidebarOpenByDefault,
} from "@/config/navigation"
import { ROUTES } from "@/config/routes"

describe("NAV_SECTIONS", () => {
  it("opens with an unlabelled group holding only the dashboard", () => {
    const [first] = NAV_SECTIONS
    expect(first?.label).toBeUndefined()
    expect(first?.items.map((item) => item.href)).toEqual([ROUTES.dashboard])
  })

  it("groups the remaining pages under Pipeline, Outreach, and Account", () => {
    expect(NAV_SECTIONS.map((section) => section.label)).toEqual([
      undefined,
      "Pipeline",
      "Outreach",
      "Account",
    ])
  })

  it("lists every page in the order the sidebar renders them", () => {
    expect(
      NAV_SECTIONS.flatMap((section) => section.items).map((item) => item.href)
    ).toEqual([
      ROUTES.dashboard,
      ROUTES.listings,
      ROUTES.prospects,
      ROUTES.templates,
      ROUTES.campaigns,
      ROUTES.mails,
      ROUTES.billing,
      ROUTES.settings,
    ])
  })

  it("gives every entry a title and an icon", () => {
    for (const item of NAV_SECTIONS.flatMap((section) => section.items)) {
      expect(item.title).not.toHaveLength(0)
      expect(item.icon).toBeDefined()
    }
  })
})

describe("isNavItemActive", () => {
  it("matches the entry's own path", () => {
    expect(isNavItemActive(ROUTES.listings, ROUTES.listings)).toBe(true)
  })

  it("keeps the entry active on nested paths", () => {
    expect(isNavItemActive("/listings/abc", ROUTES.listings)).toBe(true)
  })

  it("does not match a different page that shares a prefix", () => {
    expect(isNavItemActive("/listings-archive", ROUTES.listings)).toBe(false)
    expect(isNavItemActive(ROUTES.prospects, ROUTES.listings)).toBe(false)
  })
})

describe("findNavMatch", () => {
  it("returns the section and entry for a grouped page", () => {
    const match = findNavMatch(ROUTES.campaigns)
    expect(match?.section.label).toBe("Outreach")
    expect(match?.item.title).toBe("Campaigns")
  })

  it("returns the ungrouped dashboard entry without a section label", () => {
    const match = findNavMatch(ROUTES.dashboard)
    expect(match?.section.label).toBeUndefined()
    expect(match?.item.title).toBe("Dashboard")
  })

  it("resolves a nested path to its parent entry", () => {
    expect(findNavMatch("/prospects/123")?.item.title).toBe("Prospects")
  })

  it("returns null for a path that is not in the sidebar", () => {
    expect(findNavMatch(ROUTES.home)).toBeNull()
    expect(findNavMatch(ROUTES.updatePassword)).toBeNull()
  })
})

describe("isSidebarOpenByDefault", () => {
  it("opens the sidebar when the cookie is absent", () => {
    expect(isSidebarOpenByDefault(undefined)).toBe(true)
  })

  it("collapses it only for an explicit false", () => {
    expect(isSidebarOpenByDefault("false")).toBe(false)
  })

  it("opens it for any other value", () => {
    expect(isSidebarOpenByDefault("true")).toBe(true)
    expect(isSidebarOpenByDefault("")).toBe(true)
    expect(isSidebarOpenByDefault("nonsense")).toBe(true)
  })
})

describe("SIDEBAR_STATE_COOKIE", () => {
  // Structural check: the vendored sidebar keeps its cookie name private, so
  // `(app)/layout.tsx` reads the state through our mirror of it. Re-running
  // `npx shadcn add sidebar` with a different name would silently stop the
  // open state from persisting; this fails instead.
  it("matches the cookie the vendored sidebar writes", () => {
    const source = readFileSync(
      path.join(import.meta.dirname, "../components/ui/sidebar.tsx"),
      "utf8"
    )

    expect(source).toContain(
      `const SIDEBAR_COOKIE_NAME = "${SIDEBAR_STATE_COOKIE}"`
    )
  })
})
