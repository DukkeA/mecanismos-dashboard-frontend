# Agent Notes

## Commands

- Use npm; `package-lock.json` is the only lockfile. The stock README lists other package managers, but the repo does not.
- `npm run dev` starts Next 16.2.6; `npm run build` creates the production build; `npm run start` requires a prior build.
- `npm run lint` is the non-mutating lint check. `npm run format` rewrites the repo with Prettier, and `npm run check` rewrites with Prettier plus `eslint --fix`.
- No test script is configured. For a focused TypeScript check without a full build, use `npx tsc --noEmit --pretty false`.
- For meaningful verification after code changes, run `npm run lint` before `npm run build`; Next 16 no longer runs lint during `next build`.

## Next.js / React gotchas

- This is Next 16 + React 19.2 with App Router. APIs and defaults may differ from older training data; read the relevant local docs under `node_modules/next/dist/docs/` before writing Next-specific code.
- `next dev` and `next build` use Turbopack by default in Next 16. Do not add legacy `--turbopack` flags or assume Webpack behavior unless a config change explicitly opts in.
- `next.config.ts` enables `reactCompiler: true`; `babel-plugin-react-compiler` is installed, so avoid adding manual memoization as a reflex.
- Client components still need `"use client"` when they use state, effects, event handlers, or browser APIs.

## App structure and UI system

- Real entrypoints are `app/layout.tsx`, `app/page.tsx`, and `app/globals.css`; there is no `src/` directory.
- `app/layout.tsx` owns the global `TooltipProvider` and `Toaster`. Preserve that shell unless intentionally changing app-wide providers.
- shadcn/ui is initialized via `components.json` with `style: "radix-maia"`, `rsc: true`, `iconLibrary: "lucide"`, aliases under `@/*`, and UI components in `components/ui`.
- Tailwind is v4 through `@tailwindcss/postcss`; the design system is already defined in `app/globals.css` (`@theme inline` plus CSS variables). Do not create a Tailwind config or introduce colors/styles outside those tokens unless the design system is intentionally updated there.
- Prefer existing shadcn components from `components/ui` over custom markup; especially use Data Table patterns for tables, `sonner` for notifications/mutation feedback, and Combobox for select/search-select flows.
- UX is a requirement, not polish: design every screen as a responsive web app for mobile, tablet, and desktop, and include loading skeletons/placeholders, disabled or pending submit states, and success/error notifications where the user needs feedback.

## Data fetching and mutations

- Use TanStack Query for server reads and writes. Keep queries and mutations in custom hooks, then import those hooks into components.
- Query/mutation hooks should own query keys, options, invalidation, optimistic or pending behavior, and error handling; components should mostly render states and call hook APIs.
- Use Zustand for shared client state/context-like concerns. Keep server state in TanStack Query; do not duplicate fetched data into Zustand unless there is a deliberate derived UI-state reason.

## Data validation

- Use Zod for validation of data/forms/etc... The `zod` package is installed, keep the folder structure well-organized, and export schemas from `lib/validation/schema-name.ts` for easy imports across the app.

## Imports

- Absolute imports are configured with `@/*` pointing to the repo root. Use absolute imports for all internal modules, and avoid relative imports except for external packages.

## Existing instruction files

- `CLAUDE.md` only points to this file. Keep `AGENTS.md` as the source of truth for agent-facing repo guidance.
