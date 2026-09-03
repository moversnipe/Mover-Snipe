import Link from "next/link"

import { ROUTES } from "@/config/routes"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"

const NotFound = () => (
  <main className="flex min-h-svh items-center justify-center p-6">
    <Empty>
      <EmptyHeader>
        <EmptyTitle>Page not found</EmptyTitle>
        <EmptyDescription>
          The page you are looking for does not exist or has moved.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button render={<Link href={ROUTES.home} />}>Go home</Button>
      </EmptyContent>
    </Empty>
  </main>
)

export default NotFound
