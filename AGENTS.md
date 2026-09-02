# AGENTS.md

Instructions for AI coding agents working in this project. This is the cross-tool
entry point: Codex, OpenCode, Cursor, GitHub Copilot, Gemini CLI, Aider, Zed,
Windsurf, and others read `AGENTS.md`. Claude Code reads `CLAUDE.md`, which imports
this file, so there is a single source of truth.

## What this is

The landing page for Solean, built with SvelteKit (Svelte 5, runes mode),
Tailwind CSS v4, and shadcn-svelte.

> TODO: the product problem, audience, and deployment target are not defined yet.
> Fill in `blueprint/project-plan.md`, then run `/overview`.

This project is built with the **AI Blueprint**, a workflow layer, not an
app skeleton. To start a new project, scaffold the app first in an empty folder
(create-next-app, Vite, etc.), then overlay these files on top. Never run a
framework scaffolder inside a directory that already holds the blueprint files
(`AGENTS.md`, `CLAUDE.md`, `.agents/`, `.claude/`, `blueprint/`); it fails
because the directory isn't empty.

The workflow is defined by the local skills and context files below.

## Read these for full context

- `blueprint/config.json` - deterministic project workflow settings
- `blueprint/context/project-overview.md` - the project's source of truth
- `blueprint/context/coding-standards.md` - conventions to follow
- `blueprint/context/ai-interaction.md` - how to work with the user on this project
- `blueprint/context/current-feature.md` - the one feature, fix, or rollback being built right now

## Project configuration

`blueprint/config.json` is the user-owned, machine-readable workflow policy for
this project. Workflow skills read the relevant settings before acting. A
missing file means built-in defaults. An invalid file falls back to defaults for
read-only status reporting, but mutating workflow commands stop and point to
`/doctor` instead of guessing.

Configuration can make review or verification stricter and can tune local
branch names and automated-mode limits. It never grants permission to commit,
merge, push, deploy, publish, send, delete data, waive a failing check, or accept
a finding. Those approval and safety boundaries are not configurable.

`qualityGates.regular` controls automatic audit, check, and try-guide behavior
for the normal workflow and Autopilot. `qualityGates.continuous` controls the
same per-feature gates for Continuous Mode. Every gate defaults to `manual`, so
the named skill runs only when explicitly requested. The conditional modes are
`when-sensitive` for audit, `when-behavioral` for check, and `when-user-facing`
for try guides. `always` runs the gate for every work item in that workflow.

## Workflow

Build one feature, fix, or rollback at a time, behind review gates. Each step's instructions
are plain markdown skills any capable agent can read and follow. The workflow is
exposed through tool-specific adapters:

- Codex: `.agents/skills/<skill>/SKILL.md`
- Claude Code: `.claude/skills/<skill>/SKILL.md`
- GitHub Copilot: `AGENTS.md` plus `.agents/skills/<skill>/SKILL.md`
- OpenCode: `AGENTS.md` plus the compatible `.agents/skills/` or
  `.claude/skills/` tree already installed for the selected tools

Unused adapters can be removed. Codex, GitHub Copilot, and OpenCode can share
`.agents/`. OpenCode can also reuse `.claude/` when Claude Code is selected.
Codex-only, Copilot-only, or OpenCode-only projects can delete `CLAUDE.md` and
`.claude/`. Claude Code-only projects can delete `.agents/`, but should keep
`AGENTS.md` because `CLAUDE.md` imports it. Do not duplicate the same Blueprint
skills under `.opencode/skills/`; OpenCode already discovers the compatible
trees.

When changing shared workflow behavior, update the matching skill in both
adapter folders so Codex, Claude Code, GitHub Copilot, and OpenCode stay aligned.

Core skills:

- `onboard` - tune commands, standards, visibility, ignore rules, and tool adapters after overlaying the Blueprint onto a freshly scaffolded or early project
- `discovery` - optional deep, multi-turn planning conversation that drafts the two user-owned plans only after review and approval; direct plan writing remains fully supported
- `doctor` - read-only Blueprint health check for setup, adapters, plans, overview freshness, and workflow drift
- `adopt` - bootstrap the Blueprint into an existing brownfield app with shipped features
- `overview` - distill the two planning docs into `blueprint/context/project-overview.md`
- `brief` - read-only briefing on an upcoming build-plan feature (scope, dependencies, size) before you spec it
- `feature` - turn a build-plan item into a spec, or propose a reviewed plan addition for a genuinely new feature
- `debug` - reproduce and isolate a failure without editing code, then hand the evidence to `fix` or `implement`
- `fix` - document an ad-hoc bug or change into `blueprint/context/current-feature.md`
- `tests` - add or normalize unit testing and turn on the test gate
- `browser-tests` - explicitly add or normalize a repeatable browser test harness and document its command
- `ci` - explicitly set up one project-specific Verify command and matching automatic GitHub checks
- `implement` - build the current spec one small, reviewed step at a time
- `check` - prove the current spec against the running app
- `try` - read-only manual review guide: where to go, what to click, what to expect
- `audit` - branch-aware or full-project review across all concerns or a focused quality, security, performance, or tests lens; records findings with durable IDs and statuses in `blueprint/context/findings.md`, where open or fixed P0/P1 findings block `complete`
- `rollback` - plan a safe reversal of a completed feature from its archive and exact git commit, with later-dependency review before code changes
- `complete` - run the final safety pass, log features, fixes, or rollbacks under `blueprint/history/`, then merge with approval
- `release` - optional Render or Vercel deployment readiness, local config, env review, and smoke-test planning
- `prototype` - optional, pre-build static mockups to lock the look
- `status` - read-only progress summary, workflow drift warning, and suggested next action

In Codex, invoke these as skills (`$onboard`, `$discovery`, `$overview`, `$feature`,
`$implement`, and so on) or ask naturally, such as "run the overview." In Claude
Code, use the slash commands (`/onboard`, `/discovery`, `/overview`, `/feature`,
and so on). In OpenCode or other tools without a dedicated invocation syntax,
ask the agent to run the matching skill or follow its `SKILL.md` manually. The
conventions in `blueprint/context/` apply however a step is invoked. `/discovery`
is never required: users may write detailed plans directly or develop them
through any conversation before running `/overview`.

Optional explicit-only skill: `autopilot` can run one bounded spec/build pass
when directly invoked, including the configured regular quality gates. It may
create checkpoint commits on the feature or fix branch after passing steps and
repair confirmed P0/P1 findings when its audit gate runs. It stops before
`/complete`, merge, push, deploy, or destructive actions.

Optional explicit-only skill: `continuous` can resume or select the next planned
feature and repeat the complete local feature lifecycle through the configured
limit or end of the build plan. It creates one branch and one local main commit
per feature, applies the Continuous quality gates, archives and merges serially,
and stops on decisions or failed safety gates. It never pushes, deploys,
publishes, sends, or performs destructive actions.

Deployment is also explicit. `/release` can prepare local Render or Vercel config
and run readiness checks, but it must stop before deploy, remote service changes,
push, or publish unless the user gives a separate yes in the current chat.

## Dashboard activity

The dashboard can show the active or most recent substantial Blueprint command
from `blueprint/.state/run.json`. This file is generated local state, ignored by
Git, and never part of a feature commit.

Commands with meaningful progress or a durable handoff should write it when the
state directory exists: `onboard`, `adopt`, `discovery`, `overview`, `feature`,
`fix`, `rollback`, `implement`, `debug`, `check`, `audit`, `tests`,
`browser-tests`, `ci`, `prototype`, `autopilot`, `continuous`, `complete`, and
`release`. Short
read-only orientation commands such as `brief`, `try`, `status`, and `doctor`
do not need activity state.

Writing the initial activity record is the first action of a tracked command,
before project inspection, preflight, or other tool calls. This one generated
state write does not authorize product changes or bypass any safety check. Set
status to `running`, use the command name and a truthful initial summary, then
replace the record at meaningful milestones. On a preflight stop or another
blocker, set it to `blocked` with the exact recovery command. Leave the final
state in place for the next session; the next tracked command replaces it. Use
this schema:

```json
{
  "schemaVersion": 1,
  "command": "continuous",
  "status": "running",
  "summary": "Completing the remaining build plan",
  "detail": "Implementing feature 3.",
  "boundary": "local-only",
  "startedAt": "<ISO-8601 timestamp>",
  "updatedAt": "<ISO-8601 timestamp>",
  "resumeCommand": "/continuous resume",
  "progress": { "current": 2, "total": 5, "label": "features" },
  "feature": { "id": "3", "title": "Export reports" }
}
```

`status` must be `running`, `blocked`, `ready`, or `completed`. Use `ready` when
the command reached its intended review handoff, such as Autopilot waiting for
review before `/complete`. Use `blocked` with the exact recovery command when
work can resume. `boundary` must be `read-only`, `reviewed`, or `local-only`.
The progress, feature, detail, boundary, and resume fields are optional. Never
put secrets, raw logs, prompts, or user content in this file. Activity tracking
must not change a command's approval boundaries or turn a reporting failure into
a workflow failure.

## Analytics: Mixpanel

Mixpanel is the only analytics tool in this project. Do not add a second one, and do not add
a tag manager, a session recorder, or a heatmap tool: each would reopen decisions this section
settles.

| Detail | Value |
| --- | --- |
| Platform | SvelteKit 2, Svelte 5 runes, browser only |
| SDK | `mixpanel-browser`, imported dynamically, never at module scope |
| Tracking method | client-side |
| CDP | none |
| Consent required | **yes**, DSGVO. Nothing is sent before an explicit accept |
| Data residency | EU, `https://api-eu.mixpanel.com` |
| Token | `PUBLIC_MIXPANEL_TOKEN`. Absent means this deployment does not measure, which is a valid state |

Everything lives in `src/lib/analytics/`:

| File | What it owns |
| --- | --- |
| `config.ts` | the token and the ingestion host, read from `$env/dynamic/public` |
| `consent.ts` | the cookie, and `mayTrack`, the rule that only an explicit yes tracks |
| `consent.svelte.ts` | the decision as rune state, seeded from the server's read of the cookie |
| `client.ts` | the single Mixpanel instance, its config, and `track` |
| `events.ts` | **every event name and property in the app** |
| `ConsentBanner.svelte` | the banner, rendered from the root layout |

### Adding an event

Add a function to `events.ts` and call that. Never call `track` from a component, and never
build an event name from a variable: Mixpanel is case-sensitive and treats a typo as a new
event forever. Names are `snake_case`, and one name means one thing.

Current events: `page_viewed`, `questionnaire_started`, `anamnesis_submitted`,
`checkout_started` (the value moment). Super properties `platform` and `locale` are registered
at init, so no event repeats them.

### What may never be sent

This is a medical funnel, and `project-overview.md` states that the answers never reach
analytics. No event property may carry:

- an answer value, or anything derived from one
- the visitor's e-mail, name, or telephone number
- the anamnesis uid
- the medication, the dose, or the Shopify variant

Two consequences that are easy to undo by accident:

- **`autocapture` and `record_sessions_percent` are off in `client.ts` and must stay off.**
  Autocapture reports the text of clicked elements, which on a questionnaire step is the
  wording of a medical question and the answer chosen.
- **No page view is sent for a `/questionnaire` path.** The model branches on `visibleIf`, so
  which steps a person sees is derived from what they answered: the path is the answer.
  `isTrackablePath` enforces this and is unit tested.

### Consent

`opt_out_tracking_by_default` is on, and the SDK is behind a dynamic import, so a visitor who
declines never downloads the vendor's code at all. Consent is a first-party cookie read by
`src/routes/+layout.server.ts`, so the banner is server-rendered and never flashes at someone
who already answered.

Anything that depends on consent must also depend on the decision as a reactive dependency:
the banner is answered on the page the visitor is standing on, and an effect that only watches
the path will have already run and been dropped. `track` returns whether the event was
accepted for exactly this reason, so a one-shot event is not spent on a gate that refused it.

There is no `identify()` or `reset()` anywhere, and there should not be: this app has no
accounts, no login, and no logout. Every visitor is an anonymous `distinct_id`.

Adding Mixpanel to a page that a person reaches means the privacy policy has to say so.
`src/lib/features/legal/content/privacy.ts` currently names Google Analytics and Google Ads
and does not mention Mixpanel; that document is Solean's to amend.

### Testing

`src/lib/analytics/*.test.ts` covers the consent rule, the questionnaire path rule, the
one-shot gate, and the property shapes. `e2e/analytics.spec.ts` proves the gate and the funnel
in a browser with every Mixpanel request intercepted. The browser suite runs with analytics
declined (`CONSENT_DENIED_STATE` in `playwright.config.ts`), because the banner is fixed to the
bottom of the viewport and would sit over the Continue button the other specs press.

## Automatic verification

Automatic GitHub checks are a separate explicit setup. `/onboard` and `/adopt`
only report existing checks and point to `/ci` or `$ci` when none exist. Running
`/ci` inspects the real project and defines one `Verify` command from checks that
already exist. Use this order when available: typecheck, tests, then build. Never
invent a test runner or another check just to fill the command.

For JavaScript and TypeScript projects, prefer a package script such as `verify`
and use the detected package manager. For other stacks, use the native task
runner or exact combined command. Record the exact command under Commands below.

The optional `.github/workflows/verify.yml` must run that same command for pull
requests and pushes to the default branch. Preserve existing workflows, use the
project's real runtime and install command, and grant only `contents: read` by
default. This setup does not add local git hooks, coverage, browser tests,
security scans, or version matrices. Those remain later project choices.

GitHub branch protection or a ruleset can require the check after the repository
is pushed, but that is a separate remote setting. Missing automatic GitHub
checks do not make the Blueprint unusable.

## Commands

Package manager: **pnpm**, pinned to 11.25.0 by `package.json#packageManager` so the version that
writes the lockfile is the version Vercel installs with. pnpm 11 refuses a lockfile entry published
less than a day ago, and that check runs against the committed lockfile, not just fresh resolution,
so an older pnpm resolving without the rule produces a lockfile the deploy rejects.

- Dev server: `pnpm dev` (http://localhost:5173)
- Build: `pnpm build`
- Preview production build: `pnpm preview`
- Typecheck: `pnpm check` (runs `svelte-kit sync` then `svelte-check`)
- Typecheck (watch): `pnpm check:watch`
- Unit tests: `pnpm test` (Vitest, `src/**/*.test.ts`)
- Unit tests (watch): `pnpm test:watch`
- Browser tests: `pnpm test:browser` (Playwright, Chromium)
- Questionnaire fixture API: `pnpm fixture:questionnaire` (port 4319)

No lint or format command is configured. No `Verify` command and no automatic
GitHub checks exist yet.

**The test gate is on.** `pnpm test` is declared above, so a step that adds
logic where a wrong answer is possible ships a passing test in the same
reviewable diff. Unit tests live beside the source they cover
(`feature.test.ts`) and Vitest collects `src/**/*.test.ts` only: `e2e/` belongs
to Playwright and is not part of this command. UI components and integration
surfaces stay out of unit tests and ride on the browser harness and the build,
per the Testing section of `blueprint/context/coding-standards.md`.

Browser tests run Playwright against the production preview build, which the
runner starts on port 4173 and stops again, so no server needs to be running
first. Specs live in `e2e/`. They are deliberately not part of any `Verify`
command or GitHub workflow; adding that slower gate is a separate decision.

`pnpm fixture:questionnaire` serves `e2e/fixtures/questionnaire-model.json` as
the RxScale anamnesis API on port 4319, under `/api/v2/anamnesis`,
`/api/v3-1/anamnesis` and the documented `/v4/anamnesis` prefix.
It exists so the questionnaire can be developed and tested without calling the
live API. The fixture is a trimmed snapshot of the real questionnaire keeping one
page of each question type.

What the harness proves is behavior: routing, hydration, client state,
validation, and navigation. It does not prove visual fidelity against the
design reference, and it runs Chromium only, so no cross-browser claim follows
from a green run. Compare screens with the artboards in `blueprint/reference/`
through `/check` or `/try` instead.
