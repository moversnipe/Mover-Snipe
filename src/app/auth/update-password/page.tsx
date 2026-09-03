import type { Metadata } from "next"

import { requireUser } from "@/features/auth/queries"
import { AuthPageHeader } from "@/features/auth/components/auth-page-header"
import { AuthTopBar } from "@/features/auth/components/auth-top-bar"
import { UpdatePasswordForm } from "@/features/auth/components/update-password-form"

export const metadata: Metadata = { title: "New password" }

// Reached from a recovery link, which has already exchanged its code for a
// session. src/proxy.ts keeps anonymous visitors out; requireUser is defence
// in depth, matching the (app) layout.
const UpdatePasswordPage = async () => {
  await requireUser()

  return (
    <>
      <AuthTopBar />
      <AuthPageHeader
        title="Choose a new password"
        description="Enter a new password for your account. It replaces the old one immediately."
      />
      <UpdatePasswordForm />
    </>
  )
}

export default UpdatePasswordPage
