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

const RootLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => (
  <html lang="en" suppressHydrationWarning>
    {/*
      `font-sans` has to sit on the same element as the font classes. Those
      classes are what declare `--font-geist-sans`, and a custom property is
      only visible to the declaring element and its descendants — applying
      `font-sans` to <html> resolved `var(--font-geist-sans)` against an
      undefined value, which silently dropped the whole declaration and left
      the app in the browser's default face. Body also covers portalled UI,
      which React mounts as a sibling of this tree under <body>.
    */}
    <body
      className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
    >
      <Providers>{children}</Providers>
    </body>
  </html>
)

export default RootLayout
