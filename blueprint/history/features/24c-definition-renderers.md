# Feature: Own questions, mapped onto RxScale - 24c, the renderers read our definition

**From build-plan:** feature 24c
**Status:** verified

## Goal

Give our questions somewhere to be drawn. 24a defined them and 24b proved they
map onto RxScale; this sub-feature builds the components that render them, keyed
by our own question kind instead of RxScale's type string, reading and writing
the answer store rather than a `survey-core` instance.

Nothing switches. The live flow keeps fetching RxScale's model and keeps
rendering it through the existing components, so no visitor sees anything
different. What exists at the end is a second, complete rendering path, walkable
end to end on the dev surface, which 24d swaps in as one atomic change.

Building it additively is the point: the flip in 24d touches the route, the
layout, the submission and thirty browser-test files at once, and it should be a
change of imports rather than a change of imports plus a rendering layer.

## Design reference

The existing questionnaire is the visual target, because this sub-feature is a
re-plumbing rather than a redesign. The screens must look like what
`/questionnaire` renders today.

- `blueprint/reference/EN Questionnaire 1 — About You.png` and the rest of that
  set, which the current components were built against.
- The live app itself: `pnpm dev`, `/questionnaire`, and the screens as they are
  now.

**No new visual design happens here.** The added screens and the medication
history rebuild are 24e's, and this sub-feature deliberately renders them plainly
rather than half-designing them.

## In scope

- `renderer-registry.ts`, keyed by our `QuestionKind`.
- Seven field components, one per `QuestionKind`: `single`, `multi`, `text`,
  `number`, `date`, `comment`, `consent`. Plus the "other" free-text input, which
  is not a kind but a companion, and the fallback for an unmapped kind.
- One screen component that composes them for a `ScreenDef`, runs our validation
  on submit, and reports RxScale's refusals from the shadow.
- The answer store gaining what the components need to read and write one answer.
- `/dev/definition` extended to render a real, walkable screen so all of it is
  provable in a browser.
- Unit tests for the logic that is genuinely ours: the none/other exclusivity, the
  error precedence, and the registry's exhaustiveness.

## Out of scope

- **The switch.** `(questionnaire)/` keeps every one of its current imports.
  `+layout.ts` still fetches, `SurveyStepScreen.svelte` still renders `PageModel`,
  `survey-state.svelte.ts` still holds the session. None of them are touched, and
  none of them are deleted. That is 24d.
- **The browser suite.** No spec under `e2e/` changes, because nothing a spec
  observes changes.
- **Designing the added screens.** Weight-related conditions, gallbladder, side
  effects, the disclaimers and the rest render through the generic screen with no
  bespoke layout. 24e gives them their artboards.
- **Deleting anything.** Both rendering paths exist side by side at the end of
  this sub-feature. Removing the old one is what makes 24d atomic.
- **Translating RxScale's refusals.** 24b left them German. The screen shows
  whichever text it is given, so this sub-feature is where the gap becomes
  visible, not where it is closed.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - The contract the components share, and the two pure rules.** Add
  `definition/field-props.ts` with `FieldProps`, `answers/choice-behaviour.ts`
  with the none and other exclusivity, and `answers/screen-errors.ts` with the
  error precedence. The store gains a typed reader for one answer. No component
  yet: this is the shape everything after it is built against, and both rules are
  pure functions worth pinning before anything renders them.
  *Done when:* `choice-behaviour.test.ts` proves ticking "none of the above"
  clears the other selections and picking a real option clears "none", in both
  orders; `screen-errors.test.ts` proves ours wins over theirs, theirs shows
  alone, and a question with neither reports nothing. `pnpm check` is clean.

- [x] **Step 2 - A harness to see a component in, and the two choice fields.**
  The dev page is a listing today, so there is nowhere to render a control. Give
  it a `?preview=<questionId>` mode first: one question, drawn through whichever
  component it is handed, with the live answer printed beneath it. Then
  `ChoiceField.svelte` for `single`, `MultiChoiceField.svelte` for `multi`, and
  `OtherTextInput.svelte` for the free text, each rendering our resolved options
  plus the none and other items the question declares. These are what 24a's
  `hasNone` and `hasOther` were declared for, and the exclusivity from step 1 is
  the behaviour the old components got from `survey-core` for free.
  The harness is scaffolding for steps 3 to 6 and step 7 replaces it, which is
  cheaper than either building the screen first or reviewing three components
  nobody can look at.
  *Done when:* `/dev/definition?preview=diseases` renders all sixteen options, the
  none item, the other item and the text input that appears with "other" chosen;
  ticking "none" visibly clears the rest and the printed answer follows.

- [x] **Step 3 - The plain input components.** `TextInputField.svelte`,
  `NumberInputField.svelte`, `CommentField.svelte` and `ConsentField.svelte`.
  Number keeps the current component's rule: `type="text"` with a numeric
  `inputmode`, so a value the browser cannot parse reaches our validation instead
  of being discarded by the input.
  *Done when:* `?preview=` renders `firstName`, `heightCm`, `sideEffectsDescription`
  and `disclaimer`, the number field accepts "96,5" without the browser discarding
  it, and the consent shows its `confirmLabel` beside the box rather than
  repeating the instruction.

- [x] **Step 4 - The date component.** `DateField.svelte` against our contract.
  The existing one bounds the picker at 18 and 80 years to mirror RxScale's rule;
  keep that, and keep it a convenience rather than a gate, since 24b proved the
  gate itself is theirs and runs from the snapshot.
  *Done when:* `?preview=dateOfBirth` renders the picker, it is bounded to that
  window, and choosing a date prints `YYYY-MM-DD` beneath it.

- [x] **Step 5 - The registry, keyed by our kind.** Add
  `definition/renderer-registry.ts` mapping each `QuestionKind` to its component
  and presentation, as an exhaustive record rather than a lookup with a fallback.
  Add `UnsupportedKind.svelte`, which the registry itself can never select: an
  exhaustive record makes a missing kind a build error, not a runtime one. It
  exists for the case the type system genuinely cannot see, a question whose
  `options` resolve empty for the current answers whose kind needs them, and it
  fails visibly in development and blocks Continue in production, which is the
  rule `project-overview.md` states for an unmapped question.
  *Done when:* `renderer-registry.test.ts` proves every member of `QuestionKind`
  has an entry, and a probe shows that adding a kind without one is a type error.
  `question-registry.ts` is untouched.

- [x] **Step 6 - The screen.** `ScreenView.svelte`: takes a `ScreenDef` and the
  answers, renders each visible question through the registry with the heading
  drawn from the first one, runs `validateScreen` on submit, resolves our codes to
  German and English through Paraglide, and shows RxScale's refusal where there is
  no code of ours. Add the `qv_` messages the codes need. **`theirErrors` is called
  on submit only**, after ours passes, never from a derived: see the note in Data
  and contracts.
  *Done when:* `/dev/definition` shows one screen at a time with Continue gated on
  validation; pressing Continue with nothing filled in shows a translated
  `required` message; and entering a height of 300 shows the out-of-range message
  rather than advancing.

- [x] **Step 7 - The dev surface becomes a real walk.** Extend
  `/dev/definition` into a working questionnaire: the walk from `buildWalk`, one
  screen at a time, Continue and Back, progress, and a panel showing the payload
  `toAnamnesisData` would send alongside anything `missingRequired` and
  `theirErrors` report.
  *Done when:* a browser run walks the whole questionnaire as a male visitor who
  has never taken medication, reaching the end with `missingRequired` empty and a
  payload carrying all 17 unconditionally required model questions; then a second
  walk as a female visitor on Mounjaro inside the BMI band reaches the end with
  the extra screens shown and `missingRequired` still empty. Both with zero
  console errors.

## Files / areas

New:

| Path | Holds |
| --- | --- |
| `definition/field-props.ts` | `FieldProps`, the one contract every component takes |
| `definition/renderer-registry.ts` | our kind to its component, exhaustive |
| `answers/choice-behaviour.ts` | the none and other exclusivity, pure |
| `answers/screen-errors.ts` | which error a question shows, pure |
| `fields2/ChoiceField.svelte` | `single` |
| `fields2/MultiChoiceField.svelte` | `multi`, with none and other |
| `fields2/OtherTextInput.svelte` | the free text beside an "other" |
| `fields2/TextInputField.svelte` | `text` |
| `fields2/NumberInputField.svelte` | `number` |
| `fields2/DateField.svelte` | `date` |
| `fields2/CommentField.svelte` | `comment` |
| `fields2/ConsentField.svelte` | `consent` |
| `fields2/UnsupportedKind.svelte` | the fallback that fails visibly |
| `ScreenView.svelte` | one screen, composed |

**`fields2/` is a deliberately ugly name and it is temporary.** The old `fields/`
directory stays until 24d deletes it, and two directories cannot share a name.
24d renames this one as part of the flip, in a commit where the old path is gone.
Naming it something plausible-but-permanent would be worse: it would look like a
decision rather than a scaffold.

Changed: `answers/store.svelte.ts` (a reader for one answer),
`src/routes/dev/definition/+page.svelte` (becomes a walk), `messages/de.json` and
`messages/en.json` (the `qv_` validation messages).

Unchanged, and the point of the sub-feature: everything under
`src/routes/(questionnaire)/`, `fields/`, `question-registry.ts`,
`SurveyStepScreen.svelte`, `steps.ts`, `survey-state.svelte.ts`,
`anamnesis-client.ts`, and every spec in `e2e/`.

## Data / contracts

Load-bearing: 24d swaps the route onto all of these.

```ts
interface FieldProps {
	readonly question: AnyQuestion;
	/** Already resolved, so a component never calls `optionsFor` itself. */
	readonly options: readonly ChoiceOption[];
	readonly controlId: string;
	readonly value: unknown;
	readonly onchange: (next: unknown) => void;
	/** The `<id>Other` free text, empty when the question has none. */
	readonly other: string;
	readonly onother: (next: string) => void;
	readonly invalid: boolean;
	readonly describedBy: string | undefined;
}
```

`value` is `unknown` for the reason the old contract had it: a `single` answers
with a string, a `multi` with an array, a `consent` with a boolean. Each component
narrows what it accepts.

**Error precedence, stated once.** A question can carry an error from our
validation and a refusal from RxScale's at the same time. Ours wins:

| Source | Says | Example |
| --- | --- | --- |
| `validateScreen` | the answer is missing or malformed | `required`, `out-of-range` |
| `theirErrors` | a complete answer is not eligible | "Leider können wir Dir das Medikament nicht verschreiben" |

Showing theirs over ours would tell somebody who typed nothing that they are
ineligible. `screenErrorFor` is the one function that decides.

**Our codes need words, and this is where they get them.** 24a returns a
`ValidationCode` precisely so the wording could be added later in two languages;
step 6 adds the `qv_` messages and resolves them. RxScale's refusal is passed
through untouched, in German, which is the gap 24b recorded.

**The shadow runs on submit, never on a keystroke.** `theirErrors` parses the
37 KB snapshot per call, as 24b recorded, so calling it from a derived that tracks
the answers would re-parse it on every character typed. It runs once when Continue
is pressed and our own validation has passed, which is also the only moment its
answer is meaningful: their refusals are about complete answers. The result is
held in component state until the next press.

**The none and other rule belongs to the component, not the validator.** 24b's
`validateScreen` reports `none-with-others` rather than fixing it, because a pure
function must not rewrite its input. `choice-behaviour.ts` is the affordance: it
answers what the next selection should be, and the component applies it. The
validator stays as the backstop for a state the UI cannot produce.

## Testing

`pnpm test` is declared in `AGENTS.md`, so the gate is on. Most of this
sub-feature is components, which the Testing section of `coding-standards.md`
keeps out of unit tests, so the split matters:

| Module | Tested how |
| --- | --- |
| `choice-behaviour.ts` | unit: none clears others, an option clears none, both orders, "other" deselected |
| `screen-errors.ts` | unit: ours over theirs, theirs alone, neither, a hidden question never reports |
| `renderer-registry.ts` | unit: exhaustive over `QuestionKind`, plus a type probe |
| the seven fields and two companions | browser evidence through `?preview=`, per step |
| the walk | the two full walks in step 7, console errors checked |

**`pnpm test:browser` is not extended.** Every existing spec asserts against the
model-driven flow, which still runs unchanged, and a spec written for the dev
surface would be thrown away in 24d when that walk becomes the real
questionnaire and the real specs cover it.

## Notes for the AI

- **Do not touch the live flow.** Not one import under
  `src/routes/(questionnaire)/` changes, and nothing in `fields/`, `steps.ts` or
  `survey-state.svelte.ts` is edited or deleted. If something looks like it needs
  to, that is 24d and it is worth stopping to say so.
- **No `survey-core` import in a component.** The engine's only remaining job is
  24b's shadow, behind `theirErrors`. A component that imports `Question` has
  reintroduced the coupling this whole feature exists to remove.
- **The old components are the reference, not the base.** Carry over the
  behaviour and the comments where the reasoning still holds: the `w-px!` note on
  the sr-only label, the numeric input rule, the `-other-text` id that must not
  collide with the choice it follows. Do not carry over their `survey-core`
  plumbing.
- **Read and write through the store.** It is `$state`, so a component gets
  reactivity for free and needs none of the revision counter
  `survey-state.svelte.ts` carries. That counter exists because `survey-core` is
  not reactive to Svelte; ours is.
- **`/dev/definition` is a development surface**, so it stays plain and
  token-based. It is not a designed screen and it is not the questionnaire.
- **Comment the why.** The error precedence, the none/other exclusivity and the
  `fields2/` name each deserve a line. The component list does not.
