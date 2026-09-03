import { Spinner } from "@/components/ui/spinner"

const Loading = () => (
  <div
    className="flex min-h-svh items-center justify-center"
    role="status"
    aria-live="polite"
  >
    <Spinner className="size-6" />
    <span className="sr-only">Loading</span>
  </div>
)

export default Loading
