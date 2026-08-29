# Feature: Questionnaire foundation

**From build-plan:** feature 7
**Status:** verified

## Goal

Deliver the load-bearing questionnaire foundation at `/questionnaire/[step]`:
a typed schema, service-backed rune state, SSR-safe resume behavior, route and
step guards, progress, validation, and navigation. Prove the whole path with one
complete single-select question so reviewers can open, answer, refresh, resume,
and revisit a working screen without pretending the medical questionnaire is
complete.

## Design reference

- [Questionnaire 1 - About You](../reference/EN%20Questionnaire%201%20%E2%80%94%20About%20You.png)
- The artboard defines the centered brand shell, back and close controls,
  progress treatment, content width, question hierarchy, option-card state, and
  primary action. This feature implements only its biological-sex
  single-select field. Height, weight, and the remaining questionnaire content
  belong to Feature 8.
- `blueprint/reference/design-system.md` remains authoritative for semantic
  tokens, typography, spacing, radii, focus, and contrast. The 1920 by 1040
  artboard is not a fixed canvas to reproduce.
- No `prototypes/` directory exists, so there are no prototype tokens or
  mockups to port.

## In scope

- A questionnaire-owned `QuestionKind` contract reserving the five planned
  kinds: `single-select`, `multi-select`, `numeric`, `contact`, and
  `interstitial`, aligned with the existing domain `Answer` union. This
  feature locks the common step shape and the complete single-select variant;
  Feature 8 adds kind-specific fields and rules only when their renderers exist.
- One schema-owned canonical question count and stable ordered step ids.
  Interstitials never increment the displayed question number.
- One complete `single-select` fixture based on the reference's biological-sex
  field, with fictional local data only.
- Pure schema lookup, progress, previous/next, resume, access, and validation
  helpers. Only single-select validation is exercised by UI in this feature;
  later kinds remain typed extension points for Feature 8.
- An expanded `QuestionnaireService` and `MockQuestionnaireService` as the
  only state and schema boundary consumed by questionnaire components.
- Atomic persistence of an answer and its recomputed
  `firstUnansweredIndex` through the existing rune-based journey state and
  SSR-safe `sessionStorage` adapter.
- A `(questionnaire)` route group, responsive questionnaire shell,
  `/questionnaire` resume entry point, dynamic `/questionnaire/[step]` route,
  and friendly unknown-step state.
- Back, close, continue, progress, required-answer validation, restored
  selection, and a truthful saved state when the one implemented question has
  no next implemented step.
- A visible prototype notice telling reviewers not to enter real health
  information.
- Re-enable every existing questionnaire CTA that was intentionally disabled
  only until Feature 7 supplied the route, including the learn article.
- Keyboard, focus, heading, landmark, live-status, responsive, and reduced-motion
  behavior required by project standards.

## Out of scope

- The remaining questionnaire questions and reference screens.
- Multi-select behavior, including exclusive "none of the above"; numeric
  inputs and units; contact fields; projection and motivation interstitials;
  treatment preference; and the final completion screen. Feature 8 owns them.
- Eligibility rules, contraindication decisions, BMI thresholds, medical
  recommendations, or automatic pass/fail behavior. The open eligibility
  decision blocks Feature 8, not this infrastructure slice.
- Setting `questionnaire.completed` to `true`, selecting a treatment,
  unlocking checkout, or navigating into checkout.
- A server session, database, authentication, real patient data, RxScale, or any
  external request.
- Changes to the existing shared primitives. The feature composes the adapted
  `progress`, `field`, `radio-group`, `label`, and `button` APIs.
- Unit-test or browser-test runner setup, deployment configuration, dark mode,
  analytics, or telemetry.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff, not full files; you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at
   the end.

Never accept a step you have not read. If a diff is too big to review, the step
was too big, so split it.

## Build steps

- [x] **Step 1 - Lock the questionnaire schema and navigation rules** - Add
  feature-owned schema types, the canonical question total, the one
  single-select fixture, and pure lookup, progress, previous/next, resume,
  access, and single-select validation helpers. Step ids are URL-safe and
  unique; answer-producing steps carry a question number while interstitials do
  not. The fixture uses the reference's "Tell us about yourself" hierarchy and
  biological-sex choices, but adds no height, weight, or later content. Add a
  compact schema-contract section to `/dev/scenario` so the pure helpers have
  runtime evidence before the public route exists. *Done when:* `pnpm check`
  proves the schema and existing `Answer` union agree; the scenario displays
  the known id, question 1 of the schema total, no previous or next implemented
  step, and the expected invalid and valid sample results; an unknown id returns
  `null`; and no total or fixture copy is independently restated by the
  scenario.

- [x] **Step 2 - Make the service own answer and resume state** - Expand
  `QuestionnaireService` and its mock adapter to expose schema lookup,
  navigation, validation, current answers, and the resume destination. Add one
  atomic journey mutation that persists an answer together with a recomputed
  `firstUnansweredIndex`, so the marker cannot drift from the answer map.
  Normalize an absent, negative, stale, or out-of-range marker through the
  schema instead of trusting storage blindly. Replace the development
  scenario's stand-in answer id with the real fixture through the service.
  *Done when:* the scenario records the typed fixture answer without importing
  raw questionnaire data; its answer count and first-unanswered marker change
  together; refresh restores both from `solean.journey`; clear restores the
  empty state; and malformed or stale progress falls back to the first
  reachable unanswered question without throwing.

- [x] **Step 3 - Add the questionnaire route shell and resume entry** - Create
  the `(questionnaire)` group, a feature-owned shell using `SoleanLogo`, and
  thin route files for `/questionnaire` and
  `/questionnaire/[step]`. The root renders an accessible SSR-safe resuming
  state, then navigates in the browser to the service's resume id. The dynamic
  load resolves only schema-known ids and converts unknown or malformed ids to
  a friendly route-local 404 with working links to restart or return home.
  Include page title metadata and a visible "prototype only - do not enter real
  health information" notice. *Done when:* a fresh session at
  `/questionnaire` reaches the first question; a saved session resumes its
  reachable question; direct entry to the known slug renders the shell;
  `/questionnaire/not-a-step` returns HTTP 404 without raw exception text; the
  server render never reads browser storage; and route files contain no answer
  or validation logic.

- [x] **Step 4 - Render the complete single-select vertical slice** - Build a
  questionnaire answer-card component and single-select screen that compose
  `Field`, `RadioGroup`, `Label`, and `Button`. Use a semantic
  `fieldset` and `legend`, expose the help text and error association, keep
  the whole option label clickable, and restore a saved option on refresh.
  Continue validates before saving; an invalid submit shows inline feedback and
  focuses the answer group, while selecting a valid option clears the stale
  error. *Done when:* mouse, touch, Space, and arrow-key selection work; only one
  option can be selected; selected, hover, focus-visible, invalid, and disabled
  action states are discernible; continuing with no choice does not write
  session state and announces the error; and a valid continuation persists the
  exact `{ kind: 'single-select', optionId }` answer.

- [x] **Step 5 - Complete progress, back, continue, and guard behavior** - Wire
  shell progress and question numbering exclusively to service results. Back
  uses the previous schema step when one exists and otherwise returns home;
  close always returns home without clearing saved answers. Continue saves and
  navigates to the next reachable step when one exists. For this one-question
  slice, a valid continue stays on the screen and announces a neutral
  "answer saved" prototype status; it does not set the questionnaire-completed
  flag or unlock checkout. Apply the client-side reachability guard that
  Feature 8 can reuse for later direct-step URLs. *Done when:* progress and the
  eyebrow agree on the same schema total; Back and Close have accessible names
  and predictable destinations; browser history is not replaced for ordinary
  step navigation; revisiting or refreshing restores the saved answer; and the
  journey remains at questionnaire stage with checkout still guarded.

- [x] **Step 6 - Connect entry points and finish responsive integration** -
  Remove the temporary "questionnaire unavailable" branches from the marketing
  header, mobile navigation, and learn article eligibility callout, then point
  those actions to the real `/questionnaire` resume entry. Compare the route
  directly with the stored artboard at desktop and mobile widths and finish
  page-level spacing, focus order, overflow, and reduced-motion behavior.
  *Done when:* every visible "Check your eligibility" or questionnaire-start
  action reaches the resume entry instead of a disabled control or 404; desktop
  and mobile preserve the reference hierarchy without fixed-canvas sizing; the
  page has one `h1`, no horizontal overflow, no unreachable control, and no
  console error; and the route remains usable at 200 percent zoom.

## Files / areas

- `src/lib/features/questionnaire/types.ts` - load-bearing schema, step,
  option, validation, progress, and access contracts.
- `src/lib/features/questionnaire/schema.ts` - canonical ordered schema, one
  single-select fixture, and pure schema helpers.
- `src/lib/features/questionnaire/questionnaire-service.ts` - expanded service
  interface and mock adapter; the only questionnaire state boundary used by
  components.
- `src/lib/features/questionnaire/QuestionnaireShell.svelte` - centered brand,
  navigation controls, progress, prototype notice, and content frame.
- `src/lib/features/questionnaire/SingleSelectQuestion.svelte` - accessible
  one-question vertical slice and validation presentation.
- `src/lib/features/questionnaire/QuestionnaireCompleteNotice.svelte` or an
  equivalent small saved-state component if it has an independent
  responsibility.
- `src/lib/journey/journey.svelte.ts` - atomic answer plus progress mutation;
  no second questionnaire store.
- `src/routes/(questionnaire)/+layout.svelte` - questionnaire surface frame
  only when routing composition benefits from it.
- `src/routes/(questionnaire)/questionnaire/+page.svelte` - SSR-safe resume
  entry.
- `src/routes/(questionnaire)/questionnaire/[step]/+page.ts` - static schema
  lookup and route-local 404.
- `src/routes/(questionnaire)/questionnaire/[step]/+page.svelte` - thin screen
  composition and metadata.
- `src/routes/(questionnaire)/questionnaire/[step]/+error.svelte` - friendly
  unknown-step state.
- `src/routes/dev/scenario/+page.svelte` - replace the temporary sample answer
  with the real service contract.
- `src/lib/features/marketing/SiteHeader.svelte`,
  `src/lib/features/marketing/MobileNav.svelte`, and
  `src/lib/features/learn/ArticleSidebar.svelte` - remove temporary
  unavailable states now that the route exists.
- `src/routes/(marketing)/learn/blog/[slug]/+page.svelte` and
  `+error.svelte` - stop opting the header out of the now-available route.

The exact shell split may be tightened during implementation if the route group
layout would only pass props through. Route files stay thin and questionnaire
business rules stay under `src/lib/features/questionnaire/`.

## Data / contracts

- `QuestionnaireSchema` owns `questionCount` and ordered `steps`.
  `questionCount` is the only total rendered anywhere. It starts at the
  canonical nine questions from the reference even though this foundation
  implements only question 1; Feature 8 fills the remaining numbered steps.
- `QuestionKind` is exactly
  `'single-select' | 'multi-select' | 'numeric' | 'contact' | 'interstitial'`.
  Every answer-producing `QuestionStep` has a stable URL-safe `id`, a
  `questionNumber` within `1..questionCount`, `kind`, `title`, optional
  `help`, and a readonly validation-rule list. `SingleSelectStep` requires a
  readonly `options` list. `InterstitialStep` has no question number,
  produces no answer, and never changes progress.
- `QuestionOption` has `id`, `label`, optional `description`, and optional
  `exclusive`. Exclusive options are typed now but their multi-select
  behavior is Feature 8.
- Step kinds map to the existing domain `Answer` arms:
  `single-select -> optionId`, `multi-select -> optionIds`,
  `numeric -> value and optional unit`, and
  `contact -> fields`. Interstitials never produce an answer.
- `ValidationRule` initially locks the reusable
  `{ type: 'required'; message: string }` rule. Feature 8 extends the
  discriminated rule union with constraints required by its numeric,
  multi-select, and contact renderers instead of placing validation in
  components.
- `ValidationResult` is a small discriminated result:
  `{ valid: true }` or `{ valid: false; message: string }`. The current
  single-select validator rejects missing answers, mismatched answer kinds, and
  option ids absent from the step. Components do not duplicate these rules.
- `firstUnansweredIndex` is the zero-based index among answer-producing steps,
  not all schema entries. A value equal to the implemented question count means
  the current slice has no unanswered implemented question; until Feature 8
  adds its completion state, resume falls back to the last reachable question.
- Saving is atomic: `saveAnswer` writes both `byQuestionId[step.id]` and the
  recomputed `firstUnansweredIndex` through one journey mutation. The
  service, not the component, decides the marker.
- The one fixture answer is fictional prototype data stored per tab in
  `sessionStorage`. No form action, server write, network request, cookie, or
  real medical record is introduced.
- `questionnaire.completed` remains `false` throughout Feature 7. It is not
  inferred from the temporary absence of a next implemented step.

## Testing

- No `test` command or unit runner is configured, so this feature must not
  install one silently. Pure schema, navigation, resume, and validation logic
  is checked through strict TypeScript, targeted runtime scenarios,
  `pnpm check`, and the production build. No claim is made that it has unit
  tests.
- No `Browser tests` command is declared. Stable route and form behavior is
  verified directly in the running app rather than adding Playwright during the
  feature.
- Run `pnpm check` after each step and `pnpm build` for the completed feature.
- Direct browser verification covers:
  - fresh `/questionnaire` entry, known direct step, saved resume, and unknown
    step 404;
  - missing-answer validation, keyboard radio selection, valid continue,
    restored selection, and the polite saved announcement;
  - `sessionStorage` persistence, malformed stored data recovery, atomic
    `firstUnansweredIndex`, clear, and refresh;
  - progress and question number consistency, Back, Close, guarded checkout,
    and no false questionnaire completion;
  - every marketing and learn entry point reaching the questionnaire;
  - desktop and mobile reference comparison, focus order, one `h1`, 200
    percent zoom, no page overflow, and console output.
- The manual try path is: start at `/`, choose "Check your eligibility", submit
  once without an answer, select an option by keyboard, continue, refresh,
  return through `/questionnaire`, then confirm the saved selection and that
  checkout remains inaccessible.

## Notes for the AI

- Use Svelte 5 runes and strict TypeScript. Reuse the existing rune-based
  `journey` singleton; do not create a second store or component-owned copy of
  persisted questionnaire state.
- Questionnaire components consume `QuestionnaireService`, never raw schema
  fixtures or `sessionStorage`. Thin load functions may use a pure service
  lookup to validate the route id.
- Keep every route SSR-safe. The server cannot know browser
  `sessionStorage`, so `/questionnaire` renders an honest resuming state
  before client navigation instead of guessing a stored destination.
- Use semantic `main`, `nav`, `form`, `fieldset`, `legend`, headings,
  and status markup. Validation is adjacent to its group, announced, and never
  communicated by color alone.
- Reuse `SoleanLogo`, `Progress`, `Field`, `RadioGroup`, `Label`, and
  `Button`. Do not install or create a new shared primitive.
- Use semantic tokens and stock Tailwind scales only. No raw colors, arbitrary
  visual values, fixed artboard dimensions, or absolute positioning for page
  layout.
- Treat all questionnaire copy and answers as fictional prototype content.
  Do not introduce medical decisions, eligibility thresholds, or claims.
- Preserve ordinary browser history for step-to-step navigation. Use
  replacement only for the root resume handoff where leaving a redundant
  `/questionnaire` entry would make Back loop through the redirect.
- Respect reduced motion. Progress changes need no scripted animation beyond
  the adapted primitive's existing behavior.
