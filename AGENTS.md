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
- Tailwind is v4 through `@tailwindcss/postcss`; theme tokens live in `app/globals.css` (`@theme inline`). Do not create a Tailwind config unless the toolchain changes.
- Prefer composing existing shadcn components from `components/ui` and semantic tokens (`bg-background`, `text-muted-foreground`, etc.) over custom styled markup.

## Existing instruction files

- `CLAUDE.md` only points to this file. Keep `AGENTS.md` as the source of truth for agent-facing repo guidance.
