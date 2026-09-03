import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "node:path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "supabase/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      // `server-only` throws outside a React Server Components bundler.
      // Tests import server modules directly, so stub it out.
      "server-only": path.resolve(
        import.meta.dirname,
        "./src/test/server-only.ts"
      ),
    },
  },
})
