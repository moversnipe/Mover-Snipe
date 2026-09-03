---
paths:
  - "src/components/**"
---

# Component rules (`src/components/`)

## `src/components/ui/` is vendored shadcn/ui output

- Add components with `npx shadcn@latest add <name>` (config: `components.json`, style `base-nova`, Base UI primitives). Do not hand-write new primitives here.
- Do not edit these files to fit one call site. Extend by composing or wrapping in a feature component. Small, deliberate fixes (a11y, a bug) are allowed and must be commented `// customised:`.
- These files keep the upstream `function Component()` style; the repo-wide `const` arrow rule does not apply here.

## Everything else in `src/components/`

- App-wide, domain-free building blocks only (theme toggle, providers). Domain UI belongs in `src/features/<domain>/components/`.
- Components are built on **Base UI**, not Radix. Compose triggers with `render`: `<DialogTrigger render={<Button />}>…</DialogTrigger>`. `asChild` does not exist here.
- Use `cn()` from `src/lib/utils.ts` for conditional classes. Colours, spacing, and radii come from the tokens in `src/app/globals.css`; no hard-coded hex values.
- Icons: `lucide-react`. Import each icon by name.
- Accessibility: semantic elements, `htmlFor`/`id` on labels, `aria-*` on custom controls, visible focus, keyboard support. Every icon-only button has `<span className="sr-only">`.
- Animation: Framer Motion for orchestrated motion, `tw-animate-css` for simple CSS animation. Prefer `transform`/`opacity`; respect `useReducedMotion()`.
- New UI work follows the `frontend-design` skill within these constraints.
