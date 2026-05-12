# Project Skill Registry

Generated: 2026-05-12
Project: mecanismos-dashboard-frontend

## Sources Scanned

- Project conventions: `AGENTS.md`, `CLAUDE.md`
- User skills: `C:\Users\Andres\.config\opencode\skills\*/SKILL.md`, `C:\Users\Andres\.agents\skills\*/SKILL.md`
- Project skill folders checked: `.claude/skills`, `.gemini/skills`, `.agent/skills`, `skills` (none present)
- Excluded by SDD init rule: `_shared`, `sdd-*`, `skill-registry`

## Project Conventions

- Use npm; `package-lock.json` is the only lockfile.
- Next.js 16.2.6 + React 19.2 App Router; entrypoints are `app/layout.tsx`, `app/page.tsx`, `app/globals.css`; no `src/` directory.
- `next.config.ts` enables `reactCompiler: true`; avoid reflexive manual memoization and read local Next docs before Next-specific changes.
- Tailwind v4 is configured through `@tailwindcss/postcss` and `app/globals.css`; do not create Tailwind config unless intentionally changing the design system.
- shadcn/ui is configured in `components.json` with style `radix-maia`, RSC enabled, Lucide icons, and aliases under `@/*`.
- Preserve `app/layout.tsx` shell: `TanstackProvider`, `TooltipProvider`, and `Toaster` are global providers.
- Use TanStack Query custom hooks for server reads/writes; hooks own query keys, options, invalidation, pending/error behavior.
- Use Zustand only for shared client/UI state, not duplicated server state.
- Verification after code changes: run `npm run lint` before `npm run build`; use `npx tsc --noEmit --pretty false` for focused type checks.
- UX is part of done: responsive layouts, loading placeholders, disabled/pending submit states, and success/error notifications where useful.

## User Skills Trigger Table

| Skill | Trigger | Source |
|---|---|---|
| branch-pr | Creating, opening, or preparing PRs for review | `C:\Users\Andres\.config\opencode\skills\branch-pr\SKILL.md` |
| chained-pr | PRs over 400 changed lines, stacked PRs, review slices | `C:\Users\Andres\.config\opencode\skills\chained-pr\SKILL.md` |
| cognitive-doc-design | Guides, READMEs, RFCs, onboarding, architecture, review docs | `C:\Users\Andres\.config\opencode\skills\cognitive-doc-design\SKILL.md` |
| comment-writer | PR feedback, issue replies, reviews, Slack/GitHub comments | `C:\Users\Andres\.config\opencode\skills\comment-writer\SKILL.md` |
| date-fns | date-fns v4 parsing, formatting, timezone-safe date logic | `C:\Users\Andres\.agents\skills\date-fns\SKILL.md` |
| find-skills | User asks to find/install skills or extend agent capabilities | `C:\Users\Andres\.agents\skills\find-skills\SKILL.md` |
| frontend-design | Building or beautifying frontend pages/components | `C:\Users\Andres\.agents\skills\frontend-design\SKILL.md` |
| go-testing | Go tests, coverage, golden files, Bubbletea teatest | `C:\Users\Andres\.config\opencode\skills\go-testing\SKILL.md` |
| issue-creation | Creating GitHub issues, bug reports, feature requests | `C:\Users\Andres\.config\opencode\skills\issue-creation\SKILL.md` |
| judgment-day | Explicit dual/adversarial review or `juzgar` request | `C:\Users\Andres\.config\opencode\skills\judgment-day\SKILL.md` |
| pydantic | Python runtime validation, settings, FastAPI/Django schemas | `C:\Users\Andres\.agents\skills\pydantic\SKILL.md` |
| shadcn | shadcn/ui components, registry, presets, `components.json` projects | `C:\Users\Andres\.agents\skills\shadcn\SKILL.md` |
| skill-creator | Creating/updating LLM-first skills | `C:\Users\Andres\.config\opencode\skills\skill-creator\SKILL.md` |
| tanstack-query | React server state, mutations, Query v5 migration/SSR issues | `C:\Users\Andres\.agents\skills\tanstack-query\SKILL.md` |
| ui-ux-pro-max | UI/UX design, accessibility, layout, interaction, charts | `C:\Users\Andres\.agents\skills\ui-ux-pro-max\SKILL.md` |
| vercel-composition-patterns | React component API design, compound components, boolean prop proliferation | `C:\Users\Andres\.agents\skills\vercel-composition-patterns\SKILL.md` |
| vercel-react-best-practices | React/Next performance, data fetching, bundle optimization | `C:\Users\Andres\.agents\skills\vercel-react-best-practices\SKILL.md` |
| web-design-guidelines | UI audits, accessibility checks, design reviews | `C:\Users\Andres\.agents\skills\web-design-guidelines\SKILL.md` |
| work-unit-commits | Commit splitting, reviewable work units, chained PR boundaries | `C:\Users\Andres\.config\opencode\skills\work-unit-commits\SKILL.md` |

## Compact Rules

### branch-pr
- Every PR must link an approved issue and have exactly one `type:*` label.
- Use branches matching `^(feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)/[a-z0-9._-]+$`.
- Use Conventional Commits and never add `Co-Authored-By` trailers.
- PR body must include linked issue, PR type, summary, changes table, test plan, and checklist.
- Verify automated checks pass before merge.

### chained-pr
- Split PRs over 400 changed lines unless maintainer accepts `size:exception`.
- Keep each PR to one deliverable work unit with tests/docs included.
- State start, end, dependencies, follow-up, and out-of-scope items in every chained PR.
- Feature Branch Chain uses a draft/no-merge tracker and child PRs targeting the previous branch.
- Treat polluted diffs as base bugs: retarget or rebase until the diff is clean.

### cognitive-doc-design
- Lead with the answer, decision, or action; put context after.
- Use progressive disclosure: happy path first, then details and edge cases.
- Prefer tables, checklists, templates, and examples over dense prose.
- For review docs, state what to review first and what is intentionally out of scope.
- Chunk sections so reviewers can verify intent without reconstructing the whole story.

### comment-writer
- Start with the actionable point; avoid long recaps.
- Be warm, direct, short, and explain the technical why when asking for change.
- Match the thread language; Spanish uses natural Rioplatense voseo.
- Avoid pile-ons; comment on the highest-value issue.
- Do not use em dashes.

### date-fns
- Use `date-fns` v4 and native `@date-fns/tz`; do not recommend `date-fns-tz`.
- Parse once, validate with `isValid`, and keep internal values as `Date`/`TZDate`.
- Use Unicode tokens (`yyyy`, `MM`, `dd`), not Moment-style assumptions.
- For timezone-sensitive calculations, use `TZDate` or `{ in: tz("Area/City") }` explicitly.
- Separate transport formats from display formats.

### find-skills
- Use when the user asks to find/install a skill or extend capabilities.
- Identify domain, task, and whether a reusable skill likely exists.
- Prefer reputable skills with strong install counts and source reputation.
- Do not recommend solely from search results; verify quality first.
- If no skill exists, offer to help directly and mention custom skill creation.

### frontend-design
- Choose a clear aesthetic direction before coding; intentionality matters more than intensity.
- Avoid generic AI aesthetics: predictable purple gradients, cookie-cutter layouts, and generic font choices.
- Production UI must be functional, accessible, responsive, and visually cohesive.
- Use typography, spatial composition, motion, and atmospheric details deliberately.
- Match implementation complexity to the selected visual direction.

### go-testing
- Prefer table-driven tests with `t.Run` for multiple Go cases.
- Test behavior and state transitions, not implementation trivia.
- Use `t.TempDir()` for filesystem tests; never depend on the real home directory.
- Keep integration tests skippable with `testing.Short()` when slow or external.
- Golden files must be deterministic and rerun without `-update` after updating.

### issue-creation
- Search existing issues before creating a new one.
- Use the correct template and fill all required fields.
- New issues get `status:needs-review`; PRs require maintainer `status:approved`.
- Questions belong in Discussions, not issues.
- Use feature/bug templates with clear repro, expected/actual behavior, and affected area.

### judgment-day
- Use only when explicitly requested for dual/adversarial review.
- Launch two blind judges in parallel with identical target and criteria; do not self-review.
- Classify warnings as real only if normal intended use can trigger them.
- Ask before fixing Round 1 confirmed issues, then re-judge with both judges.
- Terminal states are only `JUDGMENT: APPROVED` or `JUDGMENT: ESCALATED`.

### pydantic
- Use Pydantic v2 APIs: `model_dump`, `model_validate`, `field_validator`, `model_config`.
- Model API request/response, settings, ORM parsing, CLI args, and serialized data with typed schemas.
- Prefer constrained fields and explicit validators for domain rules.
- Use `BaseModel`/`ConfigDict`; do not write v1 `Config` patterns in new code.
- Remember Pydantic coerces types unless stricter validation is configured.

### shadcn
- In this repo, use existing `components/ui` components before custom markup.
- Use semantic tokens (`bg-background`, `text-muted-foreground`) and `cn()`; avoid raw colors and manual dark overrides.
- Use `gap-*`, not `space-*`; use `size-*` for equal dimensions.
- Forms use `FieldGroup`/`Field`; validation uses `data-invalid` on `Field` and `aria-invalid` on controls.
- Dialog/Sheet/Drawer require titles; Card uses full composition; Button loading is `Spinner` + `disabled`, not `isLoading`.
- Icons in Button use `data-icon`; avoid sizing classes on icons inside components.
- For component work, run shadcn docs/search as needed and verify added files.

### skill-creator
- Create a skill only for reusable patterns, not one-off documentation.
- Skills are runtime instruction contracts for LLMs, not tutorials.
- Required sections: Activation Contract, Hard Rules, Decision Gates, Execution Steps, Output Contract, References.
- Keep `description` one physical YAML-safe line with trigger words; no Keywords section.
- Put long examples, schemas, and detail in local `assets/` or `references/`.

### tanstack-query
- Use TanStack Query v5 object syntax and `gcTime`, not old v4 options.
- Queries/mutations should live in custom hooks that own keys, options, invalidation, errors, and pending behavior.
- Prefer `variables`/`useMutationState` for simple optimistic pending UI.
- Use `throwOnError` for error-boundary integration.
- For infinite queries, provide required `initialPageParam`; `maxPages` requires next and previous params.

### ui-ux-pro-max
- UI changes must satisfy accessibility first: contrast, focus, labels, keyboard nav, non-color-only meaning.
- Design mobile-first; avoid horizontal scroll and fixed pixel layouts that break responsive behavior.
- Provide loading, empty, error, success, disabled, and pending states where users need feedback.
- Use semantic tokens and consistent type/spacing scales; avoid raw hex in components.
- Charts need legends/tooltips and accessible color encodings.

### vercel-composition-patterns
- Avoid boolean prop proliferation; use composition and explicit variant components.
- Use compound components and provider-owned state for complex shared component APIs.
- Define generic context interfaces with state, actions, and metadata for dependency injection.
- Prefer children composition over render props unless the render prop is essential.
- React 19 note: avoid new `forwardRef` usage when the React 19 pattern applies.

### vercel-react-best-practices
- Eliminate async waterfalls; start independent work early and use `Promise.all`/Suspense where appropriate.
- Optimize bundle size: avoid barrel imports and dynamically import heavy components.
- In RSC/Next code, minimize data serialized into client components and parallelize server fetching.
- Derive state during render; avoid effect-driven derived state and unnecessary memoization.
- Use transitions/deferred values for non-urgent expensive client updates.

### web-design-guidelines
- Before UI reviews, fetch the latest guidelines from Vercel's web-interface-guidelines source.
- Read the specified files/patterns and report findings in terse `file:line` format.
- If no files are specified for review, ask for the target files first.

### work-unit-commits
- A commit is one deliverable behavior, fix, migration, or docs unit.
- Do not split by file type when no individual commit works alone.
- Keep tests with the code and docs with the user-visible change.
- Each commit should tell a reviewable story and remain rollbackable.
- If SDD forecasts over 400 changed lines, group work units into chained PR slices.
