---
description: Add a shadcn/ui component through the CLI and wire it in
argument-hint: <component-name> [where it will be used]
---

Add the shadcn/ui component(s): $ARGUMENTS

1. Check `src/components/ui/` first; do not re-add an existing component.
2. Run `npx shadcn@latest add <name>` (uses `components.json`: Base UI, style `base-nova`). Do not hand-write primitives.
3. Do not edit the generated file except for a commented `// customised:` fix.
4. Compose it in the requesting feature component with the `render` prop pattern (never `asChild`). Check light and dark themes and keyboard access.
5. Run `npm run check`.
