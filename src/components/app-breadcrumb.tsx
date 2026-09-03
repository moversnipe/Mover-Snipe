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

/** Names the current page in the app header, mirroring the sidebar grouping. */
export const AppBreadcrumb = () => {
  const pathname = usePathname()
  const match = findNavMatch(pathname)

  if (!match) {
    return null
  }

  return (
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
  )
}
