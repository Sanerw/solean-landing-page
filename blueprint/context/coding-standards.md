# Coding Standards

> Tuned to this project by `/onboard`. Stack: SvelteKit, Svelte 5 (runes),
> TypeScript, Tailwind CSS v4, shadcn-svelte, pnpm. Edit freely as conventions
> settle; re-run `/onboard` only if the stack itself changes.

## Stack

| Concern         | Choice                                                  |
| --------------- | ------------------------------------------------------- |
| Framework       | SvelteKit 2 on Vite                                      |
| UI library      | Svelte 5, runes mode forced in `vite.config.ts`          |
| Language        | TypeScript, strict mode, `checkJs` on                    |
| Styling         | Tailwind CSS v4, CSS-first config                        |
| Components      | shadcn-svelte (`luma` style, `neutral` base, Lucide icons) |
| Package manager | pnpm                                                     |
| Adapter         | `@sveltejs/adapter-auto`                                 |

> TODO: no database, auth, or backend data layer exists yet. Add conventions here
> when one is introduced.

## TypeScript

- Strict mode is on; keep it on
- No `any` - use a real type or `unknown`
- Type component props with an interface or inline type on `$props()`
- Use type inference where obvious, explicit types where they help a reader
- `.svelte` files use `<script lang="ts">`

## Svelte 5

- Runes only. `$state`, `$derived`, `$effect`, `$props`, `$bindable`
- No legacy `export let`, `$:` reactive statements, or stores for local component state
- Prefer `$derived` over `$effect` for computed values; `$effect` is for
  synchronizing with something outside Svelte
- Snippets and `{@render ...}` instead of slots
- Keep components focused - one job per component
- Extract reusable logic into `.svelte.ts` modules that export rune-based state

## SvelteKit

- Routes live in `src/routes`, file-based
- Load data in `+page.ts` / `+page.server.ts` / `+layout.server.ts`, not in
  component `onMount`
- Use form actions in `+page.server.ts` for mutations and form submissions
- Use `+server.ts` endpoints only when you need: webhooks, file uploads,
  specific status codes or headers, or clients that are not this app
- `+page.server.ts` for anything touching secrets or server-only modules
- Import server-only values from `$env/static/private` or `$env/dynamic/private`;
  never leak them into client code

## File Organization

- Routes and pages: `src/routes/[segment]/+page.svelte`
- Route data: `src/routes/[segment]/+page.ts` or `+page.server.ts`
- Shared components: `src/lib/components/[feature]/ComponentName.svelte`
- shadcn-svelte primitives: `src/lib/components/ui/` (generated; do not hand-edit
  unless intentionally customizing)
- Utilities: `src/lib/utils.ts` or `src/lib/[utility].ts`
- Types: `src/lib/types/[feature].ts`
- Static assets: `static/` for public files, `src/lib/assets/` for imported ones
- Import through the `$lib` alias, not deep relative paths

## Naming

- Components: PascalCase (`HeroSection.svelte`)
- Route files: SvelteKit's own names (`+page.svelte`, `+layout.server.ts`)
- Other files: kebab-case
- Functions: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Types/Interfaces: PascalCase, no prefix

## Styling

- Tailwind utility classes for all styling
- Tailwind v4 CSS-first config: theme tokens live in `src/routes/layout.css`,
  there is no `tailwind.config.js`
- Use the semantic theme variables (`bg-background`, `text-muted-foreground`,
  `border-border`) rather than raw color utilities, so light and dark stay in sync
- Merge conditional classes with `cn()` from `$lib/utils`
- Reach for a shadcn-svelte component before writing a new primitive
- No inline `style` attributes except for genuinely dynamic values
- Both light and dark themes are defined in `layout.css`; dark is applied via the
  `.dark` class variant. Any new color must be added to both blocks.

## Data and Validation

> TODO: no data layer yet. When one lands, record the ORM or client, the query
> boundary, and the auth-scoping rule here.

- Validate every external input (form data, URL params, request bodies) at the
  server boundary before use
- Never trust a client-supplied id for ownership; scope by the authenticated user

## Error Handling

- Use SvelteKit's `error()` and `redirect()` helpers in load functions and actions
- Return `fail(status, { ... })` from form actions for validation errors so the
  form can re-render with the user's input
- Show user-facing messages, not raw exception text
- Add `+error.svelte` for routes that need a friendly failure state

## Testing

The blueprint installs no test runner; testing is opt-in at the project level,
because the overlay can't know your stack. Adding unit testing is an explicit
setup task the AI can do through the normal workflow, either as a build-plan item
or with `/tests`. The setup should choose the stack-native runner, wire the
scripts or commands, add a small example test, and update the Commands section
of `AGENTS.md`.

When `AGENTS.md` declares a `Verify` command, treat it as the umbrella automated
gate. It combines only the checks this project actually has, in this order when
available: typecheck, tests, then build. The command does not enable an absent
test runner or replace focused evidence. It gives local work and optional CI one
exact command to run. `/ci` owns Verify and CI setup. `/tests` adds the real test
command to Verify when it already exists, but never creates CI only because
testing was configured.

**The opt-in switch is one signal: a `test` command in the Commands section of
`AGENTS.md`.** Declare one and **tests become a gate for logic-bearing steps**,
not an optional extra; leave it out and the loop verifies logic with the evidence
it already uses (run it, a screenshot, the build). Adding the runner is itself a
deliberate step, never a silent mid-step install. This is the single definition
of the switch; the skills and `ai-interaction.md` only point back here.

- **What to test (the scope rule):** pure logic where a wrong answer is possible -
  parsers, formatters, validators, id/slug builders, server actions. These have
  assertable inputs and outputs and real edge cases (empty, missing, malformed).
- **What not to test:** UI components and integration-level surfaces (render or
  export routes, anything driving a real browser or external service). Verify those
  with a screenshot and the build, not brittle unit tests.
- **The gate (when a runner is configured):** a build step that adds in-scope logic
  must ship a passing test in the same reviewable diff. The project's test command
  must be green before the step is approved, before any checkpoint commit, and
  before `/complete` merges. UI and integration-only steps are exempt and ride on
  screenshot plus build evidence.
- **When it's named:** the `/feature` spec's Testing section predicts the coverage,
  `/implement` writes the test with the step, and if a step surfaces logic the spec
  didn't foresee, add a focused test then.
- An empty suite should fail, not pass, so "no tests ran" never looks like "passed".
- Test files live next to source files (for example `feature.test.ts`).
- Run them via the project's test command (see Commands in `AGENTS.md`), not a
  hardcoded tool name.

Stack binding for this project: Vitest, `vi.mock()` for external dependencies,
and `vi.useFakeTimers()` for time-dependent logic. Nothing is installed yet; run
`/tests` when you want the runner and the gate.

## Browser Verification

For UI and integration behavior, prefer real browser evidence over reading the
code and assuming it works.

- Browser automation is separately opt-in through `/browser-tests`. That setup
  reuses a compatible runner or prefers Playwright for supported projects, then
  documents the exact command as `Browser tests` in `AGENTS.md`.
- When `Browser tests` is declared, add focused coverage for stable behavioral
  done-whens when it is proportionate, and run the documented command during
  `/check`. Do not assume it proves visual fidelity, real authenticated-profile
  behavior, browser chrome, or another claim the test does not observe.
- If no Browser tests command is declared, do not add a runner silently in the
  middle of an unrelated feature. Use the available dev server, browser
  screenshots, build output, API output, or manual evidence instead.
- Browser tests are not part of the default Verify command or CI unless the user
  separately chooses that slower gate.
- Browser evidence is especially important for flows that click, type, submit,
  navigate, download files, render complex layouts, or depend on client-side
  state.

## Code Quality

- No commented-out code unless specified
- No unused imports or variables
- Keep functions under 50 lines when possible

## Comments

Write code that explains itself; comment only what the code cannot say.
Over-commenting is a common AI tell, so resist it.

- Comment the **why**, not the **what**. Delete any comment that restates the code.
- No banner/header blocks, section dividers, or step-by-step narration of obvious
  code. A file does not need a comment announcing each region.
- A comment earns its place only when it captures something the code can't: a
  non-obvious decision, a gotcha or workaround, why a value is what it is, or a
  link to a spec or issue.
- Prefer self-documenting names and small functions over explanatory comments.
- Keep doc comments minimal: a one-line purpose on an exported type or function is
  plenty; don't write JSDoc that just repeats the signature.
- When in doubt, leave the comment out.

## Writing

- No em dashes (U+2014) in generated content: docs, comments, commit messages,
  READMEs, specs. They read as AI-generated.
- Use a hyphen for `term - description` separators; rephrase prose with commas,
  parentheses, or a colon. Avoid en dashes and the ellipsis character too.
