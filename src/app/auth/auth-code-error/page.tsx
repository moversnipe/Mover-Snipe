import Link from "next/link"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const AuthCodeErrorPage = () => {
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in failed</CardTitle>
          <CardDescription>
            The confirmation link may have expired or already been used.
            Please try signing in again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button render={<Link href="/auth/login" />}>
            Back to sign in
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default AuthCodeErrorPage
