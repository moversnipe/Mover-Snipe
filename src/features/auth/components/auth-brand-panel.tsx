import { Crosshair } from "lucide-react"

import { siteConfig } from "@/config/site"

/**
 * Left half of the split auth screen: brand mark at the top, a statement at
 * the bottom. Hidden below `lg`, where the form takes the full width.
 */
export const AuthBrandPanel = () => (
  <aside className="relative hidden h-full flex-col p-10 text-primary lg:flex dark:border-r">
    <div className="absolute inset-0 bg-primary/5" />
    <div className="relative z-20 flex items-center text-lg font-medium">
      <Crosshair className="mr-2 h-6 w-6" aria-hidden />
      {siteConfig.name}
    </div>
    <div className="relative z-20 mt-auto">
      <blockquote className="leading-normal text-balance">
        &ldquo;Find the people who are about to move, and reach them before
        anyone else does.&rdquo; &ndash; {siteConfig.name}
      </blockquote>
    </div>
  </aside>
)
