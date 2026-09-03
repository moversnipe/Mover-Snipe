import "@testing-library/jest-dom/vitest"

// Public env placeholders so modules that import clientEnv can load in tests.
process.env.NEXT_PUBLIC_SITE_URL ??= "http://localhost:3000"
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "http://127.0.0.1:54321"
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??=
  "sb_publishable_test_placeholder"

import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

// jsdom ships no `matchMedia`, so any component reading responsive state
// through `useIsMobile` would throw on render. Answer "no match" for every
// query, which puts those components on their desktop branch.
const createMediaQueryList = (query: string): MediaQueryList => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
})

window.matchMedia ??= createMediaQueryList

afterEach(() => {
  cleanup()
})
