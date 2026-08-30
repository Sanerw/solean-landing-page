# Feature: Question type coverage

**From build-plan:** feature 10
**Status:** verified

## Goal

Give every question type in the live model a renderer, so the questionnaire can
be walked from the first page to the last. Feature 9b built the registry and
mapped two types; this fills it in and removes the last placeholder from the
flow.

## What the model actually contains

Read from the live document, not assumed. 16 of 35 elements have no renderer
today.

| Type | Count | What it carries |
| --- | --- | --- |
| `checkbox` | 6 | `choices`, a model-enabled "none" item (`Keine der Genannten`) on five, an "other" item (`Andere`) on three, and `expression` validators |
| `multipletext` | 3 (1 visible) | `items[]`, each a labelled sub-input with its own `inputType`, `isRequired`, `requiredErrorText` and expression validators. The visible one is `WeightSize`: `Größe (cm)` and `Gewicht (kg)` |
| `expression` | 3 | Display only, `hasInput: false`. The real text is in `description`, and it is multi-line: a consent notice, a support address, a note about pen needles |
| `comment` | 2 | Free text, required, both behind a `visibleIf` |
| `os-date-picker` | 1 | Date of birth, required. RxScale's own widget, registered in 9b, with no properties of its own |
| `radiogroup` with `showOtherItem` | 1 | `WeightlossMedication`, 13 choices plus "Andere" with its own placeholder and error text |

Two findings the draft of this spec had to absorb:

- **`description` carries real content, and it is multi-line.** The `Disclaimer`
  checkbox holds a four-line bulleted consent text there, and every `expression`
  puts its whole message there. A renderer that collapses newlines loses the
  meaning.
- **The "other" choice is a second value.** SurveyJS stores the free text in
  `question.comment`, not in `question.value`, and `survey.data` carries it as
  `<name>-Comment`. The renderer contract has to carry it.
- **A `multipletext` reports its errors on its items, not on itself.** Checked in
  the engine: a height of 5 puts `Bitte überprüfe Deine Angaben.` on
  `items[0].editor.errors` while `question.errors` stays empty. A renderer reading
  only the question would show a step that refuses to advance with no visible
  reason.
- **The engine does not require the "other" text, even though the model supplies
  an error message for it.** Checked: selecting `Andere` on
  `WeightlossMedication` and leaving the box empty validates cleanly and stores
  `"other"` with an empty comment. We do not add a rule survey-core does not
  have, because our validation must agree with the submission validator rather
  than guess at it. If RxScale's server does enforce it, it surfaces as a 400,
  which feature 12 handles and reports.

## In scope

- Renderers for `expression`, `os-date-picker`, `multipletext`, `checkbox` and
  `comment`
- The "other" free-text companion, for both `checkbox` and `radiogroup`
- Multi-line `description` rendering wherever a description is shown
- A visible guarantee that no question in the model is left without a renderer
- Browser coverage that walks the questionnaire end to end

## Out of scope

- Interlude placement and the projection's data, which this feature unblocks but
  feature 11 owns
- Persistence across a refresh (feature 11)
- Submission and the recommendation screen (feature 12)
- `file` and `signaturepad`, which the build plan anticipated but this
  questionnaire does not contain. `UnsupportedQuestion` stays in place for
  exactly that reason: the model is versioned and can gain a type we have not met

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

Ordered by the flow, so each step carries the walk one page further.

- [x] **Step 1 - Display-only elements** - A renderer for `expression`: the
  title and its multi-line description as body copy, no control, no label
  association, and nothing that can be answered. Descriptions keep their line
  breaks here and in every existing renderer. *Done when:* `/questionnaire/page30`
  shows the e-mail consent notice as text instead of a placeholder, and
  `/questionnaire/page12` shows both of its information panels.

- [x] **Step 2 - Date of birth** - A renderer for `os-date-picker` on the adapted
  `Input`, storing `YYYY-MM-DD`. *Done when:* `/questionnaire/page26` accepts a
  date, Continue advances, and leaving it empty shows the model's own required
  message.

- [x] **Step 3 - Composite inputs** - A renderer for `multipletext`: one labelled
  control per `item`, each honouring its `inputType`, and each showing its own
  error under its own control. *Done when:* `/questionnaire/page2` asks for
  `Größe (cm)` and `Gewicht (kg)` separately, a height of 5 shows the model's
  `Bitte überprüfe Deine Angaben.` on that control alone, and valid values
  advance.

- [x] **Step 4 - Multiple choice** - A renderer for `checkbox` over
  `visibleChoices`, so the model's "none" item and its exclusive behaviour come
  from survey-core rather than from us. *Done when:* on `/questionnaire/page8`,
  a checkbox with no "other" item, choosing a condition and then
  `Keine der Genannten` clears the others, choosing a condition again clears the
  none item, and Continue advances. `/questionnaire/page28` shows its four-line
  consent text as four lines, since that description belongs to a checkbox rather
  than to an `expression`. `page6` and the other three that also offer "Andere"
  stay behind the placeholder until step 5, which is why this step is proved on
  the one that does not.

- [x] **Step 5 - The "other" free text** - The companion input for an "other"
  choice, bound to `question.comment`, using the model's `otherText`,
  `otherPlaceholder` and `otherErrorText`, for both `checkbox` and `radiogroup`.
  The fixture gains `page18` so the harness covers the radiogroup case. *Done
  when:* `/questionnaire/page18` offers "Andere", selecting it reveals the text
  input carrying the model's placeholder, a typed value lands in `survey.data` as
  `WeightlossMedication-Comment`, and `/questionnaire/page6` stops showing the
  placeholder. An empty box still advances, matching the engine; do not add a rule
  to make it fail.

- [x] **Step 6 - Long free text** - A renderer for `comment` on the adapted
  `Textarea`. *Done when:* answering `WegovySideEffects` with yes reaches
  `/questionnaire/page23`, the textarea accepts several lines, and the required
  rule refuses an empty one.

- [x] **Step 7 - No type left behind, and the whole walk** - The dev surface
  states the count plainly and the harness asserts it, so a model that gains an
  unmapped type is visible rather than silent. Browser coverage walks the
  questionnaire from the first page to `/questionnaire/complete`. *Done when:*
  `/dev/questionnaire` reads `35 of 35 questions have a renderer` against the live
  model, a spec asserts the fixture's mapped count equals its total, and a spec
  answers every step of the fixture questionnaire and arrives at the completion
  screen.

## Found while building

- **The screen never showed an answer back.** Every renderer read `question.value`
  straight from the engine, which Svelte cannot see change, so a click reached
  survey-core and the step advanced while the control stayed blank. It went
  unnoticed until now because no step depended on the drawn answer; the "other"
  free text does, since it appears only when its choice is selected. Engine reads
  now go through the session revision.
- **A multiple-choice answer is the engine's own array, edited in place.**
  `question.value` hands back the same instance it mutates, so the exclusive
  "none" clearing the others changed nothing Svelte could compare. The screen
  passes a copy.
- **The consent text on `page28` is ten lines, not the four this spec assumed.**
  The renderer keeps whatever the model sends, so the count was never load
  bearing, but the live screen is worth looking at rather than the number.
- **The fixture's own flow is not the live one.** Its conditions page is behind a
  BMI between 27 and 30, and Solean's motivation screen sits between two model
  pages, so the walk answers 178 cm and 90 kg and continues through the interlude.

## Files / areas

| Path | Change |
| --- | --- |
| `src/lib/features/questionnaire/fields/ExpressionField.svelte` | new: display-only text |
| `src/lib/features/questionnaire/fields/DateField.svelte` | new: `os-date-picker` |
| `src/lib/features/questionnaire/fields/MultipleTextField.svelte` | new: labelled sub-inputs with per-item errors |
| `src/lib/features/questionnaire/fields/CheckboxField.svelte` | new: multiple choice |
| `src/lib/features/questionnaire/fields/CommentField.svelte` | new: textarea |
| `src/lib/features/questionnaire/fields/OtherChoiceInput.svelte` | new: the free-text companion, shared by the two choice renderers |
| `src/lib/features/questionnaire/question-registry.ts` | the new entries, and the "other" capability stops being a reason to refuse |
| `src/lib/features/questionnaire/SurveyStepScreen.svelte` | multi-line descriptions, the comment value passed through, and engine reads tied to the session revision |
| `e2e/fixtures/questionnaire-model.json` | `page18` for the radiogroup "other" case |
| `e2e/questionnaire-types.spec.ts` | new: one spec per type, the coverage assertion and the full walk |
| `e2e/questionnaire-flow.spec.ts`, `questionnaire-model.spec.ts`, `fixture.ts` | the placeholder step drops out, and the fixture's page and element counts move |
| `e2e/screenshots.spec.ts` | walks the flow, so every new type is captured instead of stopping at the first unrenderable one |
| `src/routes/dev/questionnaire/+page.svelte` | the renderer sentence no longer points at this feature as the gap |

## Data / contracts

The renderer contract gains the free-text companion. It is part of the SurveyJS
model, not an invention: a choice question with an "other" item keeps its answer
in `value` and the typed text in `comment`, and validates them separately.

```ts
export interface QuestionFieldProps {
	question: Question;
	controlId: string;
	invalid: boolean;
	describedBy: string | undefined;
	value: unknown;
	onchange: (next: unknown) => void;
	/** The model's free-text companion for an "other" choice. */
	comment: string;
	oncomment: (next: string) => void;
}
```

`survey.data` carries the companion under `<question name>-Comment`, which is the
key the submission sends. Nothing renames it.

Load-bearing for feature 11 and 12: after this feature `survey.data` holds every
answer the model asks for, including `WeightSize.size` and `WeightSize.weight`,
which feature 11's projection reads, and `dob`, which feature 12 submits.

**The stored shape of `dob` is `YYYY-MM-DD`.** RxScale's widget declares no
properties, so the format is the renderer's choice, and an ISO string passes
their validator. Confirm it against their review tooling before feature 12
submits; changing it later is a one-line change in this renderer.

## Testing

No unit runner is configured, so no step ships a unit test. Every done-when above
is observable in the browser, and the harness covers the stable ones.

| Claim | Evidence |
| --- | --- |
| Each type renders and validates | The named route per step, checked in the browser |
| The model's own rules and messages are what the user sees | German messages from the model appear verbatim: `Bitte überprüfe Deine Angaben.`, `Bitte gib Dein Medikament an.` |
| Exclusive "none" behaviour is survey-core's | Browser spec on `page6` |
| Nothing in the model is unrenderable | `/dev/questionnaire` count, plus a harness assertion on the fixture |
| The questionnaire can be completed | A browser spec that answers every fixture step and lands on `/questionnaire/complete` |
| Nothing regressed | `pnpm check`, `pnpm build`, `pnpm test:browser` |

## Notes for the AI

- **survey-core owns behaviour, we own presentation.** The exclusive "none" item,
  the "other" comment, `visibleIf` and every validator already work in the engine.
  A renderer that reimplements one of them will disagree with the submission
  validator.
- **Read choices from `visibleChoices`**, which already includes the none and
  other items the model enabled.
- **Descriptions are multi-line and carry consent text.** Preserve the breaks.
- **Never hide a question or an option** that the model marks visible, and never
  make a required question optional to get past it.
- **Keep `UnsupportedQuestion`.** Full coverage today is not full coverage
  forever; the model is versioned.
- Conventions: runes only, `$lib` imports, kebab-case modules, no `any`, semantic
  tokens, stock Tailwind scales, a fieldset and legend for grouped controls and a
  label for single ones.
- Answers never reach console output or analytics.
