import { signOut } from "@/features/auth/actions"
import { Button } from "@/components/ui/button"

export const SignOutButton = () => (
  <form action={signOut}>
    <Button type="submit" variant="ghost" size="sm">
      Sign out
    </Button>
  </form>
)
