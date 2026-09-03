import { AuthBrandPanel } from "@/features/auth/components/auth-brand-panel"

// Shared frame for every page under /auth, after shadcn/ui's authentication
// example: a two-column split on large screens with the brand panel on the
// left and the form centred on the right. The right column is `relative` so a
// page's AuthTopBar can pin itself to its corner. Below `lg` the panel is
// hidden and the form takes the full width.
const AuthLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="grid min-h-svh lg:grid-cols-2">
    <AuthBrandPanel />
    <main className="relative flex items-center justify-center px-6 py-24 lg:p-8">
      <div className="mx-auto flex w-full flex-col justify-center gap-6 sm:w-[350px]">
        {children}
      </div>
    </main>
  </div>
)

export default AuthLayout
