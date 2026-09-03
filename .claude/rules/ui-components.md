---
paths:
  - "src/components/**"
---

# Component rules (`src/components/`)

## `src/components/ui/` is vendored shadcn/ui output

- Add components with `npx shadcn@latest add <name>` (config: `components.json`, style `base-nova`, Base UI primitives). Do not hand-write new primitives here.
- Do not edit these files to fit one call site. Extend by composing or wrapping in a feature component. Small, deliberate fixes (a11y, a bug) are allowed and must be commented `// customised:`.
- Re-adding a component through the CLI overwrites it and takes those fixes with it. `grep -rn "customised:" src/components/ui/` before and after, and reapply what the diff dropped. `sidebar.tsx` currently carries four — three animation or hit-testing bugs in the collapse, and one collapsed-width bug: the group label collapses its height instead of lifting itself out of flow with a negative margin (which parked a still-clickable box over the previous group's last entry), `SidebarInset` transitions the margin it swaps on state, `SidebarMenuButton` names a duration instead of inheriting Tailwind's 150ms default against the sidebar's 200ms, and the 2px collapsed-width allowance is billed to `floating`, whose ring needs it, rather than to `inset`, which draws none.
- These files keep the upstream `function Component()` style; the repo-wide `const` arrow rule does not apply here.

## Everything else in `src/components/`

- App-wide, domain-free building blocks only (theme toggle, providers). Domain UI belongs in `src/features/<domain>/components/`.
- Components are built on **Base UI**, not Radix. Compose triggers with `render`: `<DialogTrigger render={<Button />}>…</DialogTrigger>`. `asChild` does not exist here.
- Use `cn()` from `src/lib/utils.ts` for conditional classes. Colours, spacing, and radii come from the tokens in `src/app/globals.css`; no hard-coded hex values.
- Icons: `lucide-react`. Import each icon by name. Size them with a `size-*` token (`size-4` is the button/menu default) — never an arbitrary `h-[…] w-[…]`. The vendored `Button` already sizes any `svg` whose class has no `size-` — `size-4` at most sizes, `size-3` on `xs`/`icon-xs` and `size-3.5` on `sm` — so an arbitrary value there is silently overridden rather than applied.
- The `base-nova` style ships a denser sidebar than earlier shadcn styles: `SidebarContent` and `SidebarMenu` both carry `gap-0`, which puts groups and entries flush against each other. `src/components/app-sidebar.tsx` sets one 4px rhythm on both, and `py-0` on each `SidebarGroup`. That spacing is deliberately state-independent: the group labels give expanded sections their separation and collapse to nothing in icon mode, so the same gap reads as evenly spaced icons there and nothing has to animate between states. Group padding, kept, would strand collapsed icons far from their neighbours. These three are call-site taste, so they live at the call site; the vendored file carries only the four commented bug fixes listed above. Re-running the shadcn CLI leaves the call-site overrides intact and drops those fixes.
- Accessibility: semantic elements, `htmlFor`/`id` on labels, `aria-*` on custom controls, visible focus, keyboard support. Every icon-only button has `<span className="sr-only">`.
- Animation: Framer Motion for orchestrated motion, `tw-animate-css` for simple CSS animation. Prefer `transform`/`opacity`; respect `useReducedMotion()`.
- New UI work follows the `frontend-design` skill within these constraints.
