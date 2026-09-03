import { describe, expect, it } from "vitest"

import {
  NAV_SECTIONS,
  findNavMatch,
  isNavItemActive,
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
      expect(item.icon).toBeTypeOf("object")
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
