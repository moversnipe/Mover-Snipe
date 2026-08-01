"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes";

/**
 * ThemeProvider component to manage the theme of the application.
 * 
 * @param {ThemeProviderProps} props - The props for the ThemeProvider component.
 * @param {React.ReactNode} props.children - The children to be rendered.
 * @returns {React.ReactNode} The ThemeProvider component.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  )
}