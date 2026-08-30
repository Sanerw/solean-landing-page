# Feature: Questionnaire interstitials

**From build-plan:** feature 8c
**Status:** verified

## Goal

Add the two mid-questionnaire screens that break up the medical questions: a
projection built from the patient's own height and weight, and a motivation
screen. Neither asks anything, neither produces an answer, and neither shifts
the question count. Along the way, move the projection chart somewhere both
marketing and the questionnaire can legitimately use it, and repair finding
F-07 in the `Tabs` primitive rather than working around it a second time.

## Design reference

- [Questionnaire - Projection Mid Step](../reference/EN%20Questionnaire%20%E2%80%94%20Projection%20Mid%20Step.png)
  - eyebrow, "You could reach", the projected weight in a highlight pill, the
    chart with value pills on each milestone, a three-option horizon `Tabs`, a
    highlighted callout that changes with the horizon, a source footnote, and
    Continue.
- [Questionnaire - Motivation Mid Step](../reference/EN%20Questionnaire%20%E2%80%94%20Motivation%20Mid%20Step.png)
  - eyebrow, headline, two lines of body, a story card with portrait and
    rating, two clinical stat cards, a sources footnote, and Continue.
- [Landing page](../reference/Solean%20landing%20page.png) - the projection
  section this chart already serves, which must not change appearance.
- `blueprint/reference/design-system.md` stays authoritative for tokens,
  typography, spacing, radii, focus, and contrast.
- The shell, progress, and navigation shipped in Feature 7 and are not
  redesigned.

**Placement evidence.** The reference has no step numbers on either
interstitial, so their position is read from the progress bar. The projection
board's bar is filled about 39 percent, matching 3 of 8; the motivation board's
about 61 percent, matching 5 of 8. So the projection follows question 3 and the
motivation follows question 5.

## In scope

- Moving `projection.ts`, `ProjectionChart.svelte`, and the `ProjectionPoint`
  and `ProjectionHorizon` types out of `features/marketing/` into
  `components/brand/`, so the questionnaire is not importing a component from
  another feature. Marketing's rendered output must not change.
- A pure weight-projection model: the ratios the marketing fixture already
  encodes, applied to any starting weight. Marketing's own series is then
  derived from the model at the reference weight, so the landing page and the
  questionnaire can never disagree about the curve.
- Repairing F-07: `Tabs` associates each panel with its tab inside the
  primitive, through a shared generated id, so every consumer gets
  `aria-controls` and `aria-labelledby` without restating them. Feature 4b's
  call-site workaround in `ProjectionSection.svelte` is removed.
- Extending `InterstitialStep` with a variant, so the schema names which screen
  a step renders without a component branching on a hardcoded id.
- The projection interstitial after question 3, reading the patient's own
  weight through `QuestionnaireService`, with the horizon `Tabs`, a
  horizon-specific callout, and an honest state when weight is missing.
- The motivation interstitial after question 5, reusing the existing photo
  testimonial fixture and adding the two clinical stat figures as new
  questionnaire content.
- Continue on an interstitial advancing to the next step without writing an
  answer, and Back behaving as it does on any other step.
- Browser coverage for the behavior a harness can actually prove: the tab and
  panel association, the projected weight changing with the horizon, and the
  question count not shifting across an interstitial.
- Keyboard, focus, heading, live-region, responsive, and reduced-motion
  behavior required by project standards.

## Out of scope

- Treatment preference, the completion screen, and `questionnaire.completed`.
  8d owns them.
- Any eligibility judgement. The resolved decision stands: the questionnaire
  collects only. The projection is an illustrative model applied to a number
  the patient typed, not an assessment, a prediction, or a clinical claim.
- Video playback. The reference's story card shows a play control and a
  duration; no video asset exists and video is not in the project scope, so the
  card renders as a static story with no fake player affordance.
- New field kinds, validation rules, or shared primitives beyond the F-07
  repair to `Tabs`.
- Changing the landing page's projection appearance, copy, or numbers.
- Unit test runner setup, deployment, dark mode, analytics.

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

- [x] **Step 1 - Move the projection chart to a shared home** - Move
  `projection.ts` and `ProjectionChart.svelte` into `src/lib/components/brand/`,
  move the `ProjectionPoint` and `ProjectionHorizon` types with them, and update
  marketing's imports. A pure move: no behavior, markup, or number changes.
  *Done when:* `pnpm check` and `pnpm build` pass; the landing page's projection
  section renders the same milestones, pills, horizon tabs, and table as before;
  `pnpm test:browser` still passes; and nothing under `features/marketing/`
  still owns chart geometry.

- [x] **Step 2 - Repair F-07 inside the Tabs primitive** - Generate one id per
  `Tabs.Root` in its context, derive `aria-controls` on each trigger and
  `aria-labelledby` plus a stable `id` on each panel from that id and the item
  value, and delete the explicit `id` and `aria-controls` that
  `ProjectionSection.svelte` passes today. Add a focused browser test asserting
  the association on the landing page. *Done when:* every trigger's
  `aria-controls` resolves to its panel's `id` and every panel's
  `aria-labelledby` resolves to its trigger, with no call site restating either;
  two `Tabs.Root` instances on one page generate different ids; keyboard tab
  behavior is unchanged; `pnpm test:browser` proves the association; and F-07 is
  marked `fixed` in the findings ledger with its repair recorded.

- [x] **Step 3 - Add the weight projection model** - Add a pure
  `buildWeightProjection(currentKg)` beside the chart, holding the milestone
  ratios the marketing fixture already encodes, for both the treated series and
  the lifestyle comparison. Derive marketing's `PROJECTION_SERIES` and
  `PROJECTION_COMPARISON` from it at the reference weight so one curve exists.
  *Done when:* the model at 96 kg reproduces exactly 88, 82, 78 and 94, 92, 90,
  so the landing page's rendered numbers are byte-identical to before; a
  different weight scales every milestone and rounds to whole kilograms; the
  model never returns a negative or increasing weight; and it is pure, with no
  Svelte or DOM dependency.

- [x] **Step 4 - Add the projection interstitial** - Extend `InterstitialStep`
  with a variant, place the projection step after question 3, and build the
  screen: eyebrow, "You could reach", the projected weight, the chart, the
  horizon `Tabs`, the horizon callout, and the source footnote. It reads weight
  through `QuestionnaireService`, never from raw storage. *Done when:* entering
  96 kg at question 1 shows 82 kg at the default six-month horizon; switching
  the horizon updates the headline weight, the chart's solid-to-dotted split,
  and the callout together; the eyebrow and progress still read question 3 of 8
  on this screen, because an interstitial never advances the count; a session
  with no weight shows an honest fallback rather than a chart of zeros or a
  crash; and Continue advances to question 4 without writing an answer.

- [x] **Step 5 - Add the motivation interstitial** - Place it after question 5
  and build the screen: eyebrow, headline, body, the story card reusing the
  existing photo testimonial, the two clinical stat cards, and the sources
  footnote. *Done when:* the screen matches the artboard's hierarchy at desktop
  and mobile; the story card presents as static content with no play control or
  duration implying video; the stat cards name their trial and citation; the
  progress and eyebrow still read question 5 of 8; and Continue advances to
  question 6.

- [x] **Step 6 - Walk the whole funnel and finish integration** - Verify the
  seven questions and two interstitials end to end at desktop and mobile,
  confirm interstitials never disturb numbering, resume, or the guard, and
  extend the browser smoke path to cross an interstitial. *Done when:* walking
  question 1 through question 7 passes through both interstitials in order with
  working browser Back; the question count reads 8 on every screen and each
  question's number is unchanged from before this feature; refreshing on an
  interstitial returns to a sensible step rather than erroring;
  `firstUnansweredIndex` is unaffected by visiting or skipping an interstitial;
  every page has one `h1`, no horizontal overflow, and no console error;
  `pnpm test:browser` passes; and checkout is still guarded.

## Files / areas

- `src/lib/components/brand/projection.ts` - moved geometry plus the new weight
  model and the projection types.
- `src/lib/components/brand/ProjectionChart.svelte` - moved chart, unchanged.
- `src/lib/components/ui/tabs/*` - the F-07 repair.
- `src/lib/features/marketing/content.ts` - projection types re-exported or
  imported from brand; series derived from the model.
- `src/lib/features/marketing/ProjectionSection.svelte` - drop the F-07
  workaround, update imports.
- `src/lib/features/questionnaire/types.ts` - the interstitial variant.
- `src/lib/features/questionnaire/schema.ts` - both interstitial steps and their
  content.
- `src/lib/features/questionnaire/ProjectionInterstitial.svelte` and
  `MotivationInterstitial.svelte` - the two screens.
- `src/routes/(questionnaire)/questionnaire/[step]/+page.svelte` - render an
  interstitial variant instead of today's placeholder paragraph.
- `e2e/` - focused specs for the tab association and the projection.
- `blueprint/context/findings.md` - F-07 moves to `fixed`.

## Data / contracts

- `InterstitialStep` gains a required variant, currently
  `'projection' | 'motivation'`. The route maps variant to component; no
  component branches on a step id. 8d adds a variant only if its completion
  screen turns out to be an interstitial rather than its own route.
- Interstitials still have no `questionNumber`, no fields, and produce no
  answer. `getQuestionnaireProgress` already reports the last question step at
  or before a step, so an interstitial inherits the preceding question's number
  and the total never moves. This is the contract that keeps `questionCount` at
  8 with nine screens between question 1 and question 7.
- `getFirstUnansweredIndex` and resume are indexed over answer-producing steps
  only, so an interstitial can be visited or skipped without moving the marker.
  Resume therefore lands on a question, never on an interstitial, which is
  correct: an interstitial is not work in progress.
- The reachability guard already permits any step at or before the first
  unanswered question, so an interstitial between two questions is reachable
  exactly when the question before it is answered. No guard change is needed.
- `buildWeightProjection(currentKg)` is pure and returns the treated series and
  the lifestyle comparison as `ProjectionPoint[]`, including the `Now` point. It
  owns the milestone ratios; the marketing fixture and the questionnaire both
  consume it, so there is one curve in the project, not two.
- The projection reads `weight` from question 1's answers through
  `QuestionnaireService`. The unit is carried on the stored numeric answer, so
  the screen never assumes kilograms; if a future feature adds pounds, the
  conversion belongs in the model, not the screen.
- Missing or unusable weight is a real state, not an impossible one: a direct
  link, a cleared session, or a schema change can all produce it. The screen
  renders an honest message and a way onward instead of a chart of zeros.
- Every figure is illustrative prototype content. The projection is a model
  applied to a typed number, and the screen says so; no medical claim,
  threshold, or assessment is introduced.

## Testing

- No `test` command and no unit runner are configured, and this feature must not
  install one. The projection model, being pure, is checked through strict
  TypeScript, a scratch runtime script against the built module, `pnpm check`,
  and `pnpm build`. No claim is made that it has unit tests.
- `AGENTS.md` declares `Browser tests: pnpm test:browser`, so stable behavioral
  done-whens get focused Playwright coverage. Add:
  - the `Tabs` association on the landing page: each trigger's `aria-controls`
    resolves to its panel and each panel's `aria-labelledby` to its trigger;
  - the projection interstitial: entering 96 kg yields 82 kg at six months and
    78 kg at twelve, proving the model and the render together;
  - the count not shifting: the screen after the projection interstitial reads
    question 4 of 8.
- Keep out of the harness what it cannot observe: visual fidelity against the
  two artboards, chart curve shape, and cross-browser behavior. Those stay
  direct `/check` or `/try` evidence.
- Run `pnpm check` after each step, and `pnpm build` plus `pnpm test:browser`
  for the completed feature.
- Direct browser verification covers: both interstitials against their
  artboards at desktop and mobile; the chart's pills landing on their plotted
  points; the horizon callout changing with the tab; the missing-weight
  fallback; one `h1` per page; no horizontal overflow; 200 percent zoom;
  reduced-motion behavior; and console output.
- The manual try path is: start at `/questionnaire`, answer question 1 with 96
  kg, continue through questions 2 and 3, land on the projection, switch
  horizons, continue to question 4, answer through question 5, land on the
  motivation screen, continue to question 6, then use Back across both
  interstitials and confirm the numbering never moves.

## Notes for the AI

- Step 1 is a move, not a rewrite. If the diff shows changed markup or numbers,
  something went wrong; the landing page must be pixel-identical after it.
- The F-07 repair belongs in the primitive. Do not leave the call-site
  workaround in place "just in case": two mechanisms for one association is the
  defect repeating itself.
- Reuse the existing photo testimonial fixture rather than inventing a person.
  Duplicated testimonials are a recorded reference defect, and the learn feature
  already sets the precedent for importing marketing content fixtures.
- Use Svelte 5 runes and strict TypeScript. Reuse the existing shell, service,
  and routes; add no second state path and no new store.
- Questionnaire components consume `QuestionnaireService`, never raw schema
  fixtures or `sessionStorage`.
- Keep every route SSR-safe. The weight is browser state, so the projection
  resolves after mount, as every other questionnaire screen does.
- The chart is decorative to assistive technology and the adjacent table carries
  the data. Preserve that pairing when the chart moves.
- Respect reduced motion: the horizon change must not depend on a scripted
  animation to be understood.
- Use semantic tokens and stock Tailwind scales only. Chart geometry, `viewBox`,
  path data, and calculated positions are the documented exemption; page layout
  is not.
- Treat all content as fictional prototype material. The projection headline
  must read as illustrative, never as a promise or a clinical outcome.
