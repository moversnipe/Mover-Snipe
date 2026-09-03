import type { Metadata } from "next"

import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form"

export const metadata: Metadata = { title: "Reset password" }

// Signed-in users never reach this page: src/proxy.ts redirects them.
const ForgotPasswordPage = () => <ForgotPasswordForm />

export default ForgotPasswordPage
