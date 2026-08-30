# Feature: steps[] and the question type registry

**From build-plan:** feature 9b
**Status:** verified

## Goal

Turn the fetched model into the questionnaire the user walks. `steps[]` becomes
the single source of truth for position, a registry maps a model question type
onto an adapted primitive, and `/questionnaire/[step]` renders and validates the
real RxScale questions instead of the local mock schema, which is deleted.

Type coverage is deliberately partial. Two types are mapped here to prove the
registry generalizes; the flow stops at the first unmapped type behind a loud,
named placeholder. Feature 10 removes every placeholder.

## What the model dictates

Facts from the live document, already fetched in 9a. The spec follows them; it
does not restate them as choices.

| Fact | Consequence |
| --- | --- |
| 26 pages, 15 visible before any answer once `os-date-picker` is registered | The step plan is derived from `survey.visiblePages` and changes as answers change |
| 5 pages hold more than one element (up to 4) | A step is a survey page, not a question. The page is also survey-core's validation unit |
| `choices` are `{ text, value }` | The German text is the label, the English value is the stored answer |
| `showNoneItem` and `noneText` on 5 questions | survey-core owns the exclusive "none" behavior; our renderer does not reimplement 8a's version |
| `showOtherItem`, `otherText`, `otherPlaceholder` on 5 | An "other" choice with a free-text input, which no current renderer supports. Feature 10 |
| `validators`, `requiredErrorText`, `minErrorText`, `maxErrorText` | Validation messages come from the model through survey-core, never from our own rule set |
| `visible: false` on 2 elements | Statically hidden. survey-core honors it; nothing extra to do |
| 13 elements carry `description`, 5 titles contain a newline | Title and help text both come from the model |
| `visible: false` on `Name` (page27) and `dob2` (page26) | These are hidden legacy duplicates of `FirstName`/`Surname` and `dob`. The model does not ask anything twice |
| `page26` holds only `dob` (`os-date-picker`) and the hidden `dob2` | Unregistered, the engine dropped `dob`, saw an empty page and removed the date of birth from the flow entirely: 14 visible pages instead of 15. Fixed in this feature by registering the type the way RxScale's own snippet does, so the element and its `isRequired` rule survive parsing. Drawing the input is feature 10; until then it shows the placeholder instead of vanishing |
| The registered `dob` accepts any non-empty value | Their class declares no properties, so the stored format is the renderer's choice. `"1990-05-14"` validates and lands in `survey.data` as `{"dob":"1990-05-14"}`. Confirm with RxScale which format their review tooling expects before feature 12 submits |
| Page order starts `page30`, `page27`, `page26`, `page3` | `page30` and `page27` are answerable here: their live elements are all `text`, and the `multipletext` on `page27` is the hidden `Name`. The live flow therefore reaches the third page and stops at `page26`, the date of birth, whose `os-date-picker` has no renderer yet. That is the intended slice, not a defect |
| `expression` elements report `hasInput: false` | Only a question that collects an answer may block a step. An `expression` we cannot draw loses information, which is worth showing, but it cannot make an anamnesis incomplete, so blocking the questionnaire for one would be wrong |

## In scope

- A client-side survey store holding one `Model` per fetched document
- `steps[]` derived from the model's visible pages, owning position, numbering
  and progress
- A question type registry with `radiogroup` and `text` mapped
- A loud, named placeholder for every unmapped type
- `/questionnaire/[step]` rendering and validating from the model, with Back,
  Continue gated on `survey.currentPage.validate(true, true)`, and progress
- The motivation interlude placed by `steps[]`, proving interleaving and the
  progress rule
- Deleting the local questionnaire: `schema.ts`, `questionnaire-service.ts`, the
  treatment preference question, `TreatmentOption`, `CompletionInterstitial`, and
  the browser specs that assert them

## Out of scope

- The remaining five types: `checkbox`, `comment`, `multipletext`, `expression`,
  `os-date-picker`, and the "other" free-text choice (feature 10)
- The projection interlude's placement and data (feature 11). Its component is
  rewired off the deleted service here and sits unreferenced for one feature,
  which is deliberate: deleting working UI to rebuild it in 11 is the worse trade
- Persistence across a refresh, resume, and deep-link guards (feature 11).
  Answers survive step navigation because the store is module state; a refresh
  loses them, and that is a known gap until 11
- Submission, the anamnesis uid and the recommendation screen (feature 12). The
  last page ends on an honest placeholder
- Deleting the checkout and order-status mocks and reducing journey stages (9c)

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - The survey store and the step plan** - `survey-state.svelte.ts`
  holding one `Model` per document, recreated only when identifier or version
  changes, and a pure `steps.ts` deriving the plan from a `Model`'s
  `visiblePages` plus the interlude configuration, so the dev surface builds a
  plan without touching the store. Question numbering counts survey steps only.
  An empty plan is an unusable questionnaire, not an empty flow.
  `/dev/questionnaire` gains a step plan section. *Done when:* the dev surface
  lists the live model's plan in page order with each step's id, kind and
  question number, showing 15 visible steps of 26 pages, and the fixture's plan
  alongside it.

- [x] **Step 2 - The question type registry and the dropped-element guard** -
  `question-registry.ts` mapping a model type onto a renderer, with `radiogroup`
  and `text` mapped, and `UnsupportedQuestion.svelte`, a visible block
  naming the type, the question and the reason, reported once to the console.

  It does not throw in development, as the draft said it would. Partial coverage
  is this feature's intended state, so throwing would turn every unmapped type
  into a crash and hide the very screen later steps have to show. Feature 10 is
  where "every type in the model has a renderer" becomes an assertion, because
  that is where it becomes true.

  The registry alone cannot keep the "never skip a question" promise: an element
  the engine failed to parse never reaches a renderer, and when it was the only
  live element on its page the page disappears from the plan, which is exactly
  what `page26` and the date of birth do today. So the plan is also checked
  against the raw document, and a lost element or page is reported the same way
  an unmapped type is. *Done when:* the dev surface marks the live model's 15
  `radiogroup` and 5 `text` elements mapped and the other 15 unmapped, names each
  missing type, and reports `page26` as a page present in the document but absent
  from the plan.

- [x] **Step 3 - The model-driven step route** - The load answers only "is this a
  page in the model", which the server can decide; the component resolves
  position and visibility from the store, which only the browser can. The step
  renders every element on its page through the registry and gates Continue on
  `survey.currentPage.validate(true, true)`, showing survey-core's own messages.
  Back walks the plan. Progress reads the plan. The last step ends on a
  placeholder naming feature 12, and a page name the model does not contain is
  still a real 404. *Done when:* against the live model,
  `/questionnaire/page30` renders the real e-mail question, Continue with it empty
  shows the model's own German `requiredErrorText` and does not navigate, a valid
  answer advances, `/questionnaire/page26` blocks on the unsupported
  `os-date-picker` with Continue disabled, and an unknown page id is a 404.

- [x] **Step 4 - Delete the local questionnaire** - Remove `schema.ts`,
  `questionnaire-service.ts`, `TreatmentOption.svelte`,
  `CompletionInterstitial.svelte` and the treatment preference content, rewire
  `ProjectionInterstitial` to take the weight as a prop, and delete the browser
  specs that assert the deleted behavior. *Done when:* no source file references
  the removed modules, `pnpm check` and `pnpm build` pass, and `pnpm test:browser`
  is green.

- [x] **Step 5 - The motivation interlude in the plan** - The interlude
  configuration places the motivation screen at a named position between two
  survey pages. *Done when:* the interlude renders at its position, Continue
  moves past it, and the progress count and denominator are identical on the
  steps either side of it.

- [x] **Step 6 - Browser coverage** - Specs against the fixture, deep-linking to
  `/questionnaire/page3`, the first page whose type is mapped, because the fixture
  keeps the live page order and its first two pages hold types feature 10 owns.
  *Done when:* `pnpm test:browser` is green, including a spec where answering the
  gender question `female` lands on the pregnancy question while `male` skips both
  female-only pages, one where Continue on an empty required question shows the
  model's message and does not navigate, one asserting an unmapped type renders
  the named placeholder with Continue disabled, and an updated screenshot spec.

## Files / areas

| Path | Change |
| --- | --- |
| `src/lib/features/questionnaire/survey-state.svelte.ts` | new: one `Model` per document, answers across navigation |
| `src/lib/features/questionnaire/steps.ts` | new: the step plan, numbering and progress |
| `src/lib/features/questionnaire/question-registry.ts` | new: model type to renderer |
| `src/lib/features/questionnaire/UnsupportedQuestion.svelte` | new: the loud placeholder |
| `src/lib/features/questionnaire/fields/RadiogroupField.svelte`, `TextField.svelte`, `UnsupportedQuestion.svelte` | new: the model-driven renderers, in their own folder. The schema-driven `SingleSelectField` and friends keep working until step 4 deletes them, so nothing serves two prop shapes at once |
| `src/routes/(questionnaire)/questionnaire/[step]/+page.ts`, `+page.svelte` | resolve and render from the plan |
| `src/routes/dev/questionnaire/+page.svelte` | the step plan and mapped columns |
| `src/lib/features/questionnaire/schema.ts`, `questionnaire-service.ts`, `TreatmentOption.svelte`, `CompletionInterstitial.svelte` | deleted |
| `src/lib/features/questionnaire/ProjectionInterstitial.svelte` | weight as a prop instead of the service |
| `e2e/questionnaire.spec.ts`, `completion.spec.ts`, `interstitials.spec.ts`, `screenshots.spec.ts` | rewritten or deleted with the behavior they assert |

## Data / contracts

Load-bearing: feature 10 adds renderers against the registry, 11 persists the
store and places the projection interlude, 12 submits `survey.data`.

```ts
export type QuestionnaireStep =
	| { kind: 'survey'; id: string; pageName: string; questionNumber: number }
	| { kind: 'interlude'; id: string; variant: 'motivation' | 'projection' };

export interface StepPlan {
	steps: QuestionnaireStep[];
	/** Survey steps only. Interludes never inflate it. */
	questionTotal: number;
}

/** Placement is by the page the interlude follows, so it is stated in one place. */
export interface InterludePlacement {
	afterPageName: string;
	variant: 'motivation' | 'projection';
}

export function buildStepPlan(survey: Model, interludes: InterludePlacement[]): StepPlan;
```

**Where each half of the route resolves.** The server knows the model but not the
answers, so the load only rejects a page name the model does not contain. Which
steps are visible depends on `survey.data`, which exists only in the browser, so
the component owns position, progress and correction. A deep link to a page that
exists but is not currently reachable renders in this feature; guarding it is
feature 11.

**Progress denominator.** The plan counts currently visible survey pages, so the
total moves as branching opens pages: 14 before any answer, more afterwards. That
is honest but visibly odd, and the reference shows a fixed count. Feature 11 owns
the final progress rule.

**Step id is the model's own page name, lowercased.** It is unique and stable in
the model, and inventing a slug would put a name in the URL the model never
agreed to. The cost is an opaque URL such as `/questionnaire/page30`.

The registry maps the model's raw type string to a component and returns nothing
for an unmapped type; the route renders the placeholder rather than skipping.
Answers live in `survey.data` and nowhere else: no parallel answer shape, and
nothing writes questionnaire answers into the journey session.

## Testing

No unit runner is configured, so no step ships a unit test. Browser coverage runs
against the fixture, never the live API.

| Claim | Evidence |
| --- | --- |
| The plan is derived correctly | `/dev/questionnaire` against the live model and the fixture |
| A question renders, validates and advances | Browser spec plus a manual walk of the live questionnaire |
| Branching follows `visibleIf` | Browser spec: answer the gender question, assert the pregnancy question appears |
| An unmapped type is never skipped | Browser spec asserting the placeholder and its named type |
| Progress ignores interludes | Browser spec comparing the count either side of the interlude |
| Nothing else regressed | `pnpm check`, `pnpm build`, `pnpm test:browser` |

## Notes for the AI

- **survey-core owns validation and branching.** Do not reimplement required
  rules, the exclusive "none" option, or `visibleIf` in our code. Messages come
  from the model.
- **The store is client state.** The load fetches the document; the `Model` is
  constructed in the browser and kept in module state so answers survive step
  navigation. Nothing about answers is written to storage in this feature.
- **`steps[]` leads, the survey follows.** Set the survey's current page from the
  step, never derive the route from `survey.currentPageNo`.
- **The placeholder must be impossible to walk past.** Continue stays disabled on
  a step holding an unmapped question, because advancing would submit a required
  answer the user was never shown.
- **Deletion is part of the feature, not cleanup.** A local schema left behind is
  a second source of questionnaire content.
- Conventions: runes only, `$lib` imports, kebab-case modules, no `any`, semantic
  tokens, stock Tailwind scales.
- Answers never reach console output or analytics. The unsupported placeholder
  logs the type and question name, never a value.
