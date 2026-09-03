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
- Icons: `lucide-react`. Import each icon by name. Size them with a `size-*` token (`size-4` is the button/menu default) — never an arbitrary `h-[…] w-[…]`. The vendored `Button` already sets `size-4` on any `svg` whose class has no `size-`, so an arbitrary value there is silently overridden rather than applied.
- The `base-nova` style ships a denser sidebar than earlier shadcn styles: `SidebarContent` and `SidebarMenu` both carry `gap-0`, which puts groups and entries flush against each other. `src/components/app-sidebar.tsx` restores the spacing at the call site with `gap-2` on the content column and `gap-1` on each nav menu (the header menu holds a single item, so its gap never applies). Collapsed to icon width those same overrides go the other way: the group labels shrink to nothing, so the content column drops to `gap-1` and each `SidebarGroup` to `py-0`, otherwise group padding strands icons far apart while their neighbours stay 4px away. Both are `transition-`ed over the 200ms the sidebar animates in, so nothing snaps. Every `SidebarMenu` also takes `group-data-[collapsible=icon]:items-center`: the `inset` container reserves 2px past its own padding for the `floating` variant's ring, leaving a 34px track around a 32px button that flex would otherwise park 2px left of centre. Re-running the shadcn CLI resets the vendored defaults but leaves these overrides intact; keep them rather than editing `src/components/ui/sidebar.tsx`.
- Accessibility: semantic elements, `htmlFor`/`id` on labels, `aria-*` on custom controls, visible focus, keyboard support. Every icon-only button has `<span className="sr-only">`.
- Animation: Framer Motion for orchestrated motion, `tw-animate-css` for simple CSS animation. Prefer `transform`/`opacity`; respect `useReducedMotion()`.
- New UI work follows the `frontend-design` skill within these constraints.
