import type { Metadata } from "next"

import { requireUser } from "@/features/auth/queries"
import { UpdatePasswordForm } from "@/features/auth/components/update-password-form"

export const metadata: Metadata = { title: "New password" }

// Reached from a recovery link, which has already exchanged its code for a
// session. src/proxy.ts keeps anonymous visitors out; requireUser is defence
// in depth, matching the (app) layout.
const UpdatePasswordPage = async () => {
  await requireUser()

  return <UpdatePasswordForm />
}

export default UpdatePasswordPage
