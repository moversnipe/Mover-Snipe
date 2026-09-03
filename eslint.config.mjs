import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    // shadcn/ui registry output is vendored as-is; keep it lint-clean without
    // forcing our app rules onto generated code.
    files: ["src/components/ui/**"],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "src/lib/supabase/database.types.ts",
    ],
  },
]

export default eslintConfig
