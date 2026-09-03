"use client"

import { usePathname } from "next/navigation"

import { findNavMatch } from "@/config/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"

/**
 * Names the current page in the app header, mirroring the sidebar grouping.
 *
 * Owns the divider that precedes it so a page outside `NAV_SECTIONS` leaves no
 * separator dangling on its own.
 */
export const AppBreadcrumb = () => {
  const pathname = usePathname()
  const match = findNavMatch(pathname)

  if (!match) {
    return null
  }

  return (
    <>
      {/*
        The vendored separator sets `self-stretch`, which beats the header's
        `items-center` and pins a fixed-height rule to the top. `my-auto`
        centres it back without fighting that class.
      */}
      <Separator
        orientation="vertical"
        className="my-auto mr-2 data-vertical:h-4"
      />
      <Breadcrumb>
        <BreadcrumbList>
          {match.section.label ? (
            <>
              <BreadcrumbItem className="hidden sm:inline-flex">
                {match.section.label}
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden sm:block" />
            </>
          ) : null}
          <BreadcrumbItem>
            <BreadcrumbPage>{match.item.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </>
  )
}
