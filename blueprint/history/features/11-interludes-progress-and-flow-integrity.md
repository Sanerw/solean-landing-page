# Feature: Interludes, progress and flow integrity

**From build-plan:** feature 11
**Status:** verified

## Goal

Make the walk hold together. The projection interlude starts reading the weight
the model actually collected, both Solean screens sit where the reference puts
them, answers survive a refresh, a step nobody has earned cannot be opened by
URL, and the progress bar follows one stated rule instead of three call sites.

Feature 10 made every question renderable. This makes the sequence around those
questions trustworthy, which is what feature 12 submits against.

## Design reference

The two interlude screens were built to their artboards in feature 8c and are
not redesigned here. They are linked because this feature decides where they
appear and, for the projection, what number it shows.

- [Questionnaire - Projection Mid Step](../reference/EN%20Questionnaire%20%E2%80%94%20Projection%20Mid%20Step.png)
- [Questionnaire - Motivation Mid Step](../reference/EN%20Questionnaire%20%E2%80%94%20Motivation%20Mid%20Step.png)
- `blueprint/reference/design-system.md` stays authoritative for tokens, type,
  spacing, radii and focus.

## What the live model dictates

Read from `LIVE: MedQ NEW RECOMMENDER (01/26)`, version 1: 26 pages, 35
questions, all of them renderable since feature 10.

| Fact | Consequence for this feature |
| --- | --- |
| The weight lives in `WeightSize`, a `multipletext` on `page2` with items `size` and `weight` | The projection can only be true after `page2`, which is page 7 of 26. Its name is configuration, not a literal in a component |
| `page2` is unconditional and required | Every walk passes it, so the projection is always reachable and always has a number |
| 6 of the 26 pages are behind a `visibleIf` | The denominator moves while the user answers. Progress has to state a rule for that rather than pretend it is fixed |
| Nothing in the model is answered server-side | The server can only know whether a step id exists. Whether it is reachable depends on `survey.data`, which is browser-only |

**Placement.** Feature 8c read both positions off the artboards' progress bars:
the projection at about 39 percent of the walk, the motivation at about 61.
Against 26 pages that is page 10 and page 16. The projection cannot sit at page
10 because the weight arrives at page 7, so it takes the first honest slot, right
after `page2`. The motivation goes after `page16` (`allergy`), page 15 of 26,
which is unconditional, so the screen cannot vanish for a branch, and its
"Halfway done" copy is true there. `page16` does not exist in the harness
fixture yet and is added with this feature.

## In scope

- The weight question named in configuration, read out of `survey.data` by a
  pure function, and passed to the projection interlude
- Both interludes placed in `INTERLUDES`, the projection wired into the step
  route the way the motivation already is
- In-session persistence of `survey.data`, keyed by questionnaire identifier and
  version, so a refresh resumes and a model change does not
- A reachability rule: the step you open is the step your answers justify, for
  deep links, a stale tab and the completion screen alike
- One progress rule, owned by `steps.ts`, covering survey steps, interludes and
  the completion screen
- Browser coverage for each of the above, and the full walk updated to the new
  step order

## Out of scope

- Clearing the stored answers, which happens on a successful submission and so
  belongs to feature 12. This feature builds the module that owns the key; 12
  adds the one function that empties it
- The recommendation screen and the checkout handoff (12 and 13)
- The e-mail question name, which only the checkout payload needs (13)
- Any change to how either interlude looks, or to the landing page projection
- Cross-feature regression sweeps, which are feature 14

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - The projection shows the weight the user gave** - A config
  module naming the weight question and its two items, a pure
  `readWeightKg(data)` beside it, the `projection` interlude placed after
  `page2`, and the step route rendering `ProjectionInterstitial` with that
  number and with the href of the page the weight came from. Before hydration
  the weight is `undefined`, not `null`, so the screen reserves the headline
  instead of claiming the answer is missing. *Done when:* answering 178 and 90 on
  `/questionnaire/page2` and continuing lands on `/questionnaire/projection`,
  where the output pill reads `77 kg` at the default 6-month horizon and the
  chart's value pills read `83`, `77` and `73 kg`, which is the 8c model applied
  to 90 rather than to the reference's 96. A browser spec asserts that number.

- [x] **Step 2 - The motivation screen sits in the middle** - Move its placement
  to follow `page16`, and add `page16` to the fixture as a faithful trim of the
  live allergy question, keeping its "none" and "other" items and its expression
  validator. *Done when:* `/dev/questionnaire` lists both interludes in the step
  plan with no "did not land" alert against the live model, and the fixture walk
  reaches `/questionnaire/motivation` after the allergy page rather than after
  the weight page. Moving a placement changes the step order, so this step also
  repairs every existing spec it breaks rather than leaving them for step 6.

- [x] **Step 3 - Answers survive a refresh** - An `answer-storage` module over
  `sessionStorage`, keyed `solean:questionnaire:<identifier>@<version>`, wired
  into `QuestionnaireSession`: restore on creating the survey, write on every
  answer, drop every key for a different version of the same questionnaire, and
  never throw when storage is unavailable. *Done when:* answering the first three
  fixture steps and reloading the browser leaves those answers in their controls
  and the step still rendered, and an entry seeded under
  `solean:questionnaire:FIXTURE: trimmed MedQ recommender@0` is neither restored
  nor left behind once the real version loads. Both are browser specs.

- [x] **Step 4 - A step you have not earned sends you to the one you have** -
  `steps.ts` gains the reachable frontier: walking the plan in order, the first
  survey step that does not validate silently is as far as the answers reach.
  The step route resolves its entry against it and replaces the URL when the step
  is beyond it, showing the same waiting screen the entry page uses rather than
  flashing a question. The document-order fallback in `neighbourHref`, which 9b
  left behind for exactly this feature, goes with it. *Done when:*
  `/questionnaire/page23` opened in a fresh tab replaces to the first step,
  `/questionnaire/complete` in a fresh tab does the same, the same deep link
  after answering three steps and reloading lands on the step those answers reach
  rather than back at the start, and a step already answered can still be
  reopened and edited.

- [x] **Step 5 - One progress rule, stated once** - `progressFor(plan, stepId)`
  in `steps.ts` replaces the derivation in the step route: a survey step reads
  its own number, an interlude holds the number of the step before it, the
  completion screen reads the total, and a step outside the plan has no bar.
  The denominator is the current plan, so a branch the user opens raises it
  honestly. *Done when:* on the fixture, `/questionnaire/page3` reads
  `Question 4 of 8`, answering `Weiblich` moves the walk to `page4` reading
  `Question 5 of 9`, an interlude repeats its neighbour's number, and
  `/questionnaire/complete` reads the total of the total. A browser spec asserts
  the labels, including the one that grows.

- [x] **Step 6 - The whole walk, again** - The end-to-end walk updated to the new
  order, the capture spec extended to the projection screen, and the fixture
  counts moved. Every other spec was repaired by the step that broke it, so this
  is the sweep, not the coverage. *Done when:* `pnpm test:browser` is green,
  including a walk that answers every fixture step, passes both interludes and
  reaches `/questionnaire/complete`, and `pnpm check` and `pnpm build` pass.

## Files / areas

| Path | Change |
| --- | --- |
| `src/lib/config/answers.ts` | new: the weight question name and its item names, confirmed against the live model |
| `src/lib/features/questionnaire/answers.ts` | new: `readWeightKg(data)` and the step id of the page that asks it |
| `src/lib/features/questionnaire/answer-storage.ts` | new: the sessionStorage key, load, save, drop-stale and clear |
| `src/lib/features/questionnaire/survey-state.svelte.ts` | restore on create, persist on change |
| `src/lib/features/questionnaire/steps.ts` | both placements, the reachable frontier, `progressFor` |
| `src/routes/(questionnaire)/questionnaire/[step]/+page.svelte` | the projection variant, the entry guard, progress from `steps.ts` |
| `e2e/fixtures/questionnaire-model.json` | `page16`, the motivation anchor |
| `e2e/questionnaire-flow.spec.ts`, `e2e/questionnaire-types.spec.ts`, `e2e/fixture.ts` | the new step order and counts |
| `e2e/questionnaire-integrity.spec.ts` | new: refresh, deep links, progress |
| `e2e/screenshots.spec.ts` | the projection screen joins the capture walk |

## Data / contracts

**Configured question names.** The model's own names, not ours. Resolves open
question 4 in the overview for the weight half; the e-mail half stays with
feature 13.

```ts
export const WEIGHT_QUESTION = {
	name: 'WeightSize',
	heightItem: 'size',
	weightItem: 'weight'
} as const;
```

**Stored answers.** One key per questionnaire version, holding `survey.data`
verbatim, including the `<name>-Comment` companions feature 10 added.

```
sessionStorage["solean:questionnaire:<identifier>@<version>"] = JSON.stringify(survey.data)
```

Load-bearing for feature 12: the submission clears this key on success, and
nothing else writes it. `sessionStorage`, not `localStorage`, so answers end with
the tab; browser-only, so SSR never touches it.

**Reachability.** Added to `steps.ts`, which already owns position.

```ts
/** Index of the last step the answers justify opening. */
export function reachableLimit(plan: StepPlan, survey: Model): number;

/** What the route should do with a requested step id. */
export function resolveStepEntry(
	plan: StepPlan,
	survey: Model,
	stepId: string
): { show: true } | { show: false; redirectTo: string };
```

A survey step counts as passed when `page.validate(false, false)` is true, which
is survey-core's own answer with the error display suppressed. The rule is
therefore the model's, not ours, exactly as validation is on the step itself.

Checked in survey-core rather than assumed: `validateElementCore` assigns
`this.errors` only when the context's `fireCallback` is set, so scanning every
page for the frontier cannot light up errors on a screen the user has not
submitted.

When every survey step passes, the limit is the completion step. When the user
goes back and empties an answer, the limit moves back with it and takes them
with it; that is the rule working, not a bug to special-case.

**Progress.**

```ts
export function progressFor(plan: StepPlan, stepId: string): QuestionnaireProgress | null;
```

## Testing

No unit runner is configured, so no step ships a unit test and every done-when
above is observable in the browser. `pnpm test:browser` is the harness.

**Worth deciding before Step 1.** This feature adds the first pure logic in the
questionnaire that is genuinely worth unit testing: `readWeightKg` over a
malformed or absent answer, the storage key over a version change, and
`reachableLimit` over a half-answered plan. The overview recorded a decision to
run `/tests` before feature 9 and it never happened. Running `/tests` is a
separate explicit command, not part of this feature; say the word and it goes
first.

| Claim | Evidence |
| --- | --- |
| The projection shows the user's own weight | `/questionnaire/projection` after answering 90 kg reads 77 kg at 6 months |
| Both interludes land where they are placed | The step plan on `/dev/questionnaire` against the live model, plus the fixture walk |
| A refresh does not lose answers | Browser spec: answer, reload, assert the controls |
| A model change discards stale answers | Browser spec: seed a stale version key, load, assert nothing restored |
| You cannot open a step you have not earned | Browser spec on a deep link into the middle and into `complete` |
| Progress states one truthful rule | Browser spec on the label across a survey step, an interlude, a branch opening and the completion screen |
| Nothing regressed | `pnpm check`, `pnpm build`, `pnpm test:browser` |

## Notes for the AI

- **The engine owns validity, we own position.** The frontier asks
  `page.validate(false, false)`; it never reimplements a rule or reads a
  `visibleIf`.
- **The plan is derived, never stored.** `buildStepPlan` runs off the survey on
  every revision. Persistence stores answers only, never a step id or a plan.
- **Answers never reach console output or analytics**, and the stored blob is
  never logged, not even in development.
- **The server has no answers.** Anything that depends on `survey.data` is
  browser-only and must render an honest waiting state before hydration rather
  than guessing.
- **Do not widen the interludes.** Their copy, layout and the projection model
  shipped in 8c; this feature changes where they appear and what number the
  projection is given.
- Conventions: runes only, `$lib` imports, kebab-case modules, no `any`, semantic
  tokens, stock Tailwind scales.
