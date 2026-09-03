import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { siteConfig } from "@/config/site"
import { Providers } from "@/components/providers"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
}

// The font variables live on <html>, not <body>: globals.css applies
// `font-sans` to the html element, so the variables have to be defined there
// or the declaration cannot resolve and the browser default font wins.
const RootLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => (
  <html
    lang="en"
    className={`${geistSans.variable} ${geistMono.variable}`}
    suppressHydrationWarning
  >
    <body className="antialiased">
      <Providers>{children}</Providers>
    </body>
  </html>
)

export default RootLayout
