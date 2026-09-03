"use client"

type GlobalErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

// Replaces the root layout when it throws, so it must render <html> and <body>
// itself and cannot rely on providers or Tailwind having loaded.
const GlobalError = ({ error, reset }: GlobalErrorProps) => (
  <html lang="en">
    <body style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
      <h1>Something went wrong</h1>
      {error.digest ? <p>Reference: {error.digest}</p> : null}
      <button type="button" onClick={reset}>
        Try again
      </button>
    </body>
  </html>
)

export default GlobalError
