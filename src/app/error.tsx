"use client"

import { useEffect } from "react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"

type ErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

const ErrorPage = ({ error, reset }: ErrorPageProps) => {
  useEffect(() => {
    // Report to your error tracker here. Never render error.message to users:
    // it may contain internals. `digest` is safe and matches server logs.
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Something went wrong</EmptyTitle>
          <EmptyDescription>
            An unexpected error occurred.
            {error.digest ? ` Reference: ${error.digest}` : null}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={reset}>Try again</Button>
        </EmptyContent>
      </Empty>
    </main>
  )
}

export default ErrorPage
