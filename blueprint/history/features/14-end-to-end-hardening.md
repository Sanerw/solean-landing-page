# Feature: End-to-end hardening

**From build-plan:** feature 14
**Status:** verified

## Goal

Walk the whole path once, the way a person does, and close what only shows up
where the features meet: the marketing page handing over to the questionnaire,
the questionnaire handing over to Shopify, and every one of those screens on a
phone. Features 1 to 13 each proved themselves; nothing has yet proved them
together.

This is the last item in the build plan, so it is also the pass that decides the
funnel is finished rather than merely built.

## Design reference

`blueprint/reference/Solean landing page.png` and the questionnaire artboards
beside it, already the reference for the features being swept. Nothing new is
designed here, so no new image is needed.

## What is already covered, and is not re-done here

Read this before adding anything. The sweep is for gaps, not a second pass over
proven ground.

| Concern in the plan line | Where it already lives |
| --- | --- |
| Deep links, refresh, back button, version keying | `questionnaire-integrity.spec.ts`, 10 tests |
| Branching, required questions, every question type | `questionnaire-flow`, `questionnaire-types` |
| The submission's 201, 400 and 502 paths | `questionnaire-submission.spec.ts` |
| The questionnaire refusing to open when the model cannot be fetched | `questionnaire-model.spec.ts` |
| Checkout refusal, unavailability, e-mail retry, variant validation | `checkout-handoff.spec.ts`, 8 tests |
| Desktop layout at 1440 and 1920 | `questionnaire-viewport.spec.ts` |
| Landing page composition | `marketing-fidelity.spec.ts` |

## In scope

- A mobile and tablet pass over the questionnaire and the marketing surfaces,
  which no spec covers at any width below 1440
- The recommendation screen's two remaining states: nothing recommended, and a
  recommendation that cannot be reached
- One spec that crosses the route groups end to end, landing page to redirect
- The learn article, which no spec opens at all
- A cross-surface accessibility sweep, subject to the tool decision below
- The final gate: `pnpm test`, `pnpm check`, `pnpm build`, `pnpm test:browser`,
  and a manual try guide

## Out of scope

- New product behaviour of any kind. A defect this sweep finds is fixed; a
  feature it suggests is written down and left
- Pointing the harness at the live RxScale API or the real shop. The fixture is
  deliberate: the run must be deterministic and must not put traffic on someone
  else's production service
- Cross-browser claims. Chromium only, as `playwright.config.ts` records
- Visual fidelity against the artboards, which is `/check` and `/try`'s job and
  is not something this harness can assert
- `/ci`, a `Verify` command, and GitHub checks, which are a separate decision

## Decision this feature needs

**Accessibility tooling.** A real sweep wants `@axe-core/playwright`: one dev
dependency, and auditable violations instead of an opinion. The alternative is
hand-written assertions per surface, which cost more and prove less. Step 5
assumes the dependency. Say so at review if you would rather not add one.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - The questionnaire on a phone and a tablet** - Extend
  `questionnaire-viewport.spec.ts` from two desktop widths to four, adding 390
  and 768. Its current assertion is that a step fits with no scrolling at all,
  which is the wrong rule on a phone: below 1024 the rule becomes no horizontal
  overflow, and a primary action that is visible once scrolled to and not clipped
  by the viewport's width. *Done when:* the spec runs at 390, 768, 1440 and 1920,
  nothing overflows horizontally at any of them, the primary action passes the
  rule for its width at all four, and a screenshot at 390 shows the result.

- [x] **Step 2 - The landing page on a phone and a tablet** - The same two widths
  for `/`, which no spec opens below 1440: header and mobile navigation, hero,
  bento, the SVG projection chart, testimonials, FAQ, footer. The chart and the
  bento are the likely offenders, being the two places with fixed geometry.
  *Done when:* `/` does not overflow horizontally at 390 or 768, the mobile
  navigation opens and closes, and a screenshot at 390 shows the result.

- [x] **Step 3 - The learn article on a phone and a tablet** - `/learn/blog/mounjaro-vs-wegovy`,
  which no spec opens at any width: the table of contents, the comparison table,
  and the related-content strip. A table is the one element that cannot simply
  reflow, so its behaviour below 768 is the question this step answers. *Done
  when:* the article does not overflow horizontally at 390 or 768, the comparison
  table is readable by whatever means the fix chooses, and a screenshot at 390
  shows the result.

- [x] **Step 4 - The recommendation screen's last two states** - Nothing
  recommended, which falls back to the configured variant, and a recommendation
  that cannot be reached. The fixture already answers an anamnesis containing
  `empty` with `[]`, reached by seeding storage rather than by submitting, since
  the fixture's own submissions return `anam-fixture-N`; an unreachable one needs
  a marker beside it. *Done when:* an `empty` anamnesis shows the no-plans alert
  and still orders `FIXTURE_VARIANT_ID`, a 502 from the recommendation shows the
  same screen rather than a dead end, and neither path displays a price nobody
  offered.

- [x] **Step 5 - One walk across the route groups** - A single spec that starts
  on `/`, follows the hero's call to action to `/questionnaire`, answers every
  page, passes both interludes, submits, picks a plan and lands on the fixture
  checkout. Not a re-test of each part: what it asserts is that the seams hold,
  including the `(marketing)` to `(questionnaire)` shell change. *Done when:* the
  walk passes from `/` to the checkout page without seeding storage directly, and
  Back from the recommendation reaches `/`, which is what `QUESTIONNAIRE_HOME_HREF`
  says it should be, rather than a questionnaire step the answers have left.

- [x] **Step 6 - The accessibility sweep** - `@axe-core/playwright` over four
  surfaces: `/`, the learn article, the questionnaire pages the fixture model
  covers, which is one per question type by construction, and the recommendation
  screen. Fix what it finds; record what is deliberately accepted. *Done when:*
  the sweep runs inside `pnpm test:browser` with no serious or critical
  violations, and any accepted violation is named in this spec with its reason.

- [x] **Step 7 - The gate, and the try guide** - `pnpm test`, `pnpm check`,
  `pnpm build` and `pnpm test:browser`, green together, then `/try` for the manual
  path. *Done when:* all four commands pass on the branch and the try guide names
  what to click and what would count as wrong.

## Files / areas

| Path | Change |
| --- | --- |
| `e2e/questionnaire-viewport.spec.ts` | 390 and 768 beside the two desktop widths, and a scrolling rule that is honest on a phone |
| `e2e/marketing-viewport.spec.ts` | new: `/` and the learn article at both narrow widths, one step each |
| `e2e/recommendation-states.spec.ts` | new: nothing recommended, and unreachable |
| `e2e/journey.spec.ts` | new: the one walk across both route groups |
| `e2e/fixture.ts` | the unreachable-recommendation marker, beside the ids already shared |
| `e2e/accessibility.spec.ts` | new: the axe sweep over four surfaces |
| `e2e/fixture-server.mjs` | an unreachable-recommendation marker beside the existing `empty` one |
| `package.json` | `@axe-core/playwright`, subject to the decision above |
| Component files | only where a step's evidence shows a real defect |

## Data / contracts

None new. This feature adds no type, route, endpoint or stored shape; it exercises
the ones features 9 to 13 defined. The one fixture convention it extends is the
marker already used for submission and cart failures: a value in the seeded data
selects the upstream outcome, and the unreachable recommendation follows it rather
than inventing a second mechanism.

## Testing

`AGENTS.md` declares both commands, so both gates apply.

- **`pnpm test` (Vitest).** This feature adds no logic where a wrong answer is
  possible, so it is expected to add no unit test. If a fix turns out to touch a
  parser, a mapper or a validator, that fix ships its test in the same diff. A
  step whose only change is a spec or a stylesheet does not.
- **`pnpm test:browser` (Playwright).** This is where the feature lives. Every
  step above is browser coverage, and its done-whens are the assertions.
- **What the harness cannot prove, and must not be claimed:** visual fidelity
  against the artboards, cross-browser behaviour, the live RxScale and Shopify
  calls, and whether a real screen reader announces what the roles imply. Those
  belong to `/check`, `/try`, and the live probes recorded in
  `blueprint/history/`.

## What the sweep found

Three surfaces swept, two real defects, both invisible to every earlier feature because
each lived exactly where two features meet.

| Defect | Where | Fix |
| --- | --- | --- |
| A horizontal scrollbar on every phone, on every questionnaire step | The hidden duplicate of the question title. `Field` sets `[&>.sr-only]:w-auto` so its own `[&>*]:w-full` cannot stretch an sr-only child, and that also undoes `sr-only`'s `width: 1px`. The clipped label became as wide as the sentence | `sr-only w-px!` at the call site; the `!` is what beats that rule's specificity |
| Every radio and checkbox announced with no name, and the plan options with it | bits-ui renders them as `<button role="radio">`, and HTML-AAM does not name a button from a wrapping `<label for>`. Axe reports it critical; Playwright's own name matching is more generous than the browser, which is why 40 passing specs never noticed | `aria-label` on the item in `RadiogroupField`, `CheckboxField` and `RecommendationScreen` |

Nothing was accepted as a known violation: the sweep is clean at serious and critical.

**Observed and deliberately not fixed:** the learn article's comparison table has no visual
affordance that it scrolls. The clipped column edge reads as one, and a gradient would be a
new feature rather than a defect repair.

## Notes for the AI

- **A step that finds more than one screenful of fixes splits in two**: the
  coverage lands as its own diff, red, and the fix follows as a second. These
  steps are sized by what they discover, which nobody can size in advance, and
  an unreadable diff defeats the review gate whatever caused it.
- **A sweep finds defects; it does not write features.** When a step surfaces
  something that is really a new capability, write it down in this file and leave
  it.
- **Do not weaken an assertion to make a step pass.** The viewport spec's "fits
  without scrolling" rule changes in step 1 because it is the wrong rule on a
  phone, not because it fails. Any other loosened assertion needs the same kind
  of reason, stated in the diff.
- **The fixture stays the harness's only upstream.** No step points a spec at
  `api.rxscale.com` or `mygina.myshopify.com`.
- Semantic tokens and stock Tailwind scales only, per
  `blueprint/context/coding-standards.md`. A layout fix found at 390 is still
  bound by the design system.
- Dark mode is out of scope for this project, so the accessibility sweep runs on
  the light theme only.
