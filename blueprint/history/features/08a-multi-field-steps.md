# Feature: Multi-field steps and the remaining field kinds

**From build-plan:** feature 8a
**Status:** verified

## Goal

Revise the Feature 7 schema so one questionnaire step owns an ordered list of
fields instead of a single kind, then build the three field renderers the
reference needs beyond single-select: multi-select with an exclusive "none of
the above", numeric with a unit, and contact. Prove the whole contract by
completing questions 1, 2, and 3, which between them exercise every field kind,
every validation rule, and the multi-field step layout that 8b, 8c, and 8d all
build on.

## Design reference

- [Questionnaire 1 - About You](../reference/EN%20Questionnaire%201%20%E2%80%94%20About%20You.png)
  - the multi-field case: a single-select and two numerics with units on one
    step, laid out as a two-column grid that stacks on mobile.
- [Questionnaire 2 - Your Details](../reference/EN%20Questionnaire%202%20%E2%80%94%20Your%20Details.png)
  - the contact case: first and last name paired on one row, e-mail full width,
    an optional phone number in an `InputGroup` with a leading icon, helper text
    under the field, and a reassurance `Alert` above the action.
- [Questionnaire 3 - Pregnancy](../reference/EN%20Questionnaire%203%20%E2%80%94%20Pregnancy.png)
  - the multi-select case: full-width option cards, an `OR` separator, a single
    exclusive "None of these" below it, and an informational `Alert`.
- `blueprint/reference/design-system.md` stays authoritative for tokens,
  typography, spacing, radii, focus, and contrast. The 1920 by 1040 artboards
  are not a fixed canvas.
- The shell, progress, back, close, prototype notice, and single-select
  behavior already shipped in Feature 7 and are not redesigned here.

## In scope

- A revised `QuestionStep` that owns `fields: readonly QuestionField[]`, where
  each field carries its own id, kind, label, optional help, and validation
  rules. Field kinds stay exactly `single-select`, `multi-select`, `numeric`,
  and `contact`; `interstitial` remains a step kind, not a field kind.
- A revised answer shape: a step's answer is a record of field id to `Answer`,
  so one step can hold several typed answers. The domain `Answer` union itself
  does not change.
- Migrating the existing `about-you` biological sex field and its stored answer
  onto the new shape, including the persisted-session decision in
  Data / contracts below.
- A `MultiSelectField` renderer: checkbox option cards, an exclusive option that
  clears every other selection when checked and is cleared by any other
  selection, and the reference's `OR` separator between the normal options and
  the exclusive one.
- A `NumericField` renderer: an `InputGroup` with a trailing unit, numeric
  keyboard hints, and range and integer validation from the schema.
- A `ContactField` renderer: first name, last name, e-mail, and an optional
  phone number in an `InputGroup` with a leading icon, each with its own label,
  error, and helper text.
- Extending `ValidationRule` with the rules these renderers need:
  `min-selected`, `numeric-range`, `email`, and `max-length`. Validation stays
  in the schema module; renderers never encode a rule.
- Per-field validation and error presentation: a failed continue shows every
  failing field's message at once, focuses the first failing field, and clears
  a field's error as soon as that field becomes valid.
- Completing questions 1 (biological sex, height, weight), 2 (contact details),
  and 3 (pregnancy multi-select) as fixture content on the new contract.
- Keeping the atomic save contract: continuing writes every field answer for
  the step plus the recomputed `firstUnansweredIndex` through one journey
  mutation.
- Keyboard, focus, label association, error announcement, responsive, and
  reduced-motion behavior required by project standards.

## Out of scope

- Questions 4 to 7, both interstitials, treatment preference, and the
  completion screen. Sub-features 8b, 8c, and 8d own them.
- Any eligibility judgement. Resolved decision: the questionnaire collects only.
  No pass/fail logic, BMI threshold, contraindication branch, or ineligibility
  screen exists anywhere in the questionnaire. Feature 11's order states own
  every outcome.
- Setting `questionnaire.completed`, selecting a treatment, or unlocking
  checkout. 8d owns that handoff.
- The F-07 `Tabs` repair, which 8c owns along with the projection interstitial
  that needs it.
- Changes to the adapted shared primitives beyond composing their existing
  public APIs. This feature installs no new primitive.
- Storing a real patient record. `PatientDetails` is collected at checkout in
  Feature 9; the contact answers here stay questionnaire answers.
- A server session, database, authentication, network request, or unit and
  browser test runner setup.

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

- [x] **Step 1 - Move the schema from one kind per step to a field list** -
  Introduce `QuestionField` and its four kind-specific variants, change
  `QuestionStep` to carry `fields`, and change the stored answer for a step from
  one `Answer` to a record of field id to `Answer`. Update the schema validator
  to enforce unique field ids within a step and at least one field per
  answer-producing step. Update validation to cover a whole step and return
  per-field results, and update `getFirstUnansweredIndex`, resume, and access to
  consume it. Migrate the existing `about-you` biological sex fixture and the
  questionnaire service and screen to the new shape, keeping the one shipped
  question working. *Done when:* `pnpm check` passes; `/questionnaire/about-you`
  still renders, validates, saves, and restores the biological sex answer; a
  stored session in the old single-answer shape is discarded rather than
  half-read; and the scenario page's schema section reads every value from the
  new helpers without restating a total or any fixture copy.

- [x] **Step 2 - Render a step's fields generically** - Add a `QuestionScreen`
  component that renders the eyebrow, `h1`, help, and each of the step's fields
  in order, then the continue action, and switch the dynamic route to it.
  Extract the existing single-select markup into a `SingleSelectField` that
  takes one field rather than a whole step. Own per-field local state, per-field
  error state, and the submit path in one place so later renderers only supply
  markup. *Done when:* question 1 renders identically to before through the
  generic screen; a step with two fields renders both under one continue button;
  each field has its own `fieldset`, `legend`, and error region; an invalid
  submit focuses the first failing field; and the route file still contains no
  validation logic.

- [x] **Step 3 - Add the numeric field and finish question 1** - Build
  `NumericField` on the adapted `InputGroup` with a trailing unit, add the
  `numeric-range` rule, and add the reference's height and weight fields to the
  `about-you` step. Lay the step out as the reference does: biological sex full
  width, then height and weight side by side on wider viewports, stacked on
  mobile. *Done when:* height and weight reject empty, non-numeric, and
  out-of-range values with distinct messages and expose `inputmode="numeric"`;
  the unit is visible and not typeable; the three answers save together in one
  mutation and restore together after refresh; and the layout matches the
  artboard at desktop and mobile without fixed-canvas sizing.

- [x] **Step 4 - Add the contact field and question 2** - Build `ContactField`
  over the adapted `Input` and `InputGroup`, add the `email` and `max-length`
  rules, and add question 2 as a contact step with the reference's copy and its
  reassurance `Alert`. First and last name are required, e-mail is required and
  format-checked, phone is optional and free-form. *Done when:* each input has
  its own visible label and its own error; a malformed e-mail is rejected with a
  message naming the format problem; leaving the optional phone empty is valid;
  a filled phone is kept; every value restores after refresh; and `autocomplete`
  attributes are set so a browser can fill the form.

- [x] **Step 5 - Add the multi-select field with exclusivity, and question 3** -
  Build `MultiSelectField` on the adapted `Checkbox` option cards, add the
  `min-selected` rule, implement exclusive-option behavior, and add question 3
  with its `OR` separator and informational `Alert`. *Done when:* checking the
  exclusive option clears every other selection and checking any other option
  clears the exclusive one; continuing with nothing selected shows the required
  message; the `OR` separator is decorative to assistive technology; the group
  announces its change politely; and the selection restores after refresh in
  schema order, not click order.

- [x] **Step 6 - Walk the three-question path and finish integration** - Verify
  the whole path end to end against the artboards at desktop and mobile widths,
  confirm progress, numbering, back, close, resume, and the reachability guard
  across three real steps for the first time, and finish spacing, focus order,
  overflow, and reduced-motion behavior. *Done when:* answering 1 then 2 then 3
  advances through real navigation with working browser Back; refreshing
  mid-path resumes on the same question with its answers restored; entering
  question 3's URL directly on a fresh session redirects to question 1;
  `firstUnansweredIndex` matches the questions actually answered at every point;
  each page has one `h1`, no horizontal overflow, and no console error; and
  checkout is still guarded because nothing here sets `questionnaire.completed`.

## Files / areas

- `src/lib/features/questionnaire/types.ts` - `QuestionField` and its variants,
  the revised `QuestionStep`, the extended `ValidationRule` union, and the
  per-field validation result shape.
- `src/lib/features/questionnaire/schema.ts` - the revised validator, questions
  1 to 3, and per-field validation, progress, resume, and access helpers.
- `src/lib/features/questionnaire/questionnaire-service.ts` - step-level answer
  reads and the atomic multi-field save.
- `src/lib/features/questionnaire/QuestionScreen.svelte` - generic step
  composition, submit, and per-field error orchestration.
- `src/lib/features/questionnaire/SingleSelectField.svelte` - extracted from the
  existing `SingleSelectQuestion.svelte`, now field-scoped.
- `src/lib/features/questionnaire/MultiSelectField.svelte`,
  `NumericField.svelte`, `ContactField.svelte` - the three new renderers.
- `src/lib/journey/session.ts` and `src/lib/journey/storage.ts` - the session
  version bump and the nested answer-shape guard.
- `src/lib/journey/journey.svelte.ts` - only if the multi-field save needs a
  shape change; the existing `saveQuestionnaireAnswer` mutation should cover it.
- `src/routes/(questionnaire)/questionnaire/[step]/+page.svelte` - compose
  `QuestionScreen`; stays thin.
- `src/routes/dev/scenario/+page.svelte` - keep the schema evidence section
  honest against the new contract.

`SingleSelectQuestion.svelte` is replaced by `QuestionScreen.svelte` plus
`SingleSelectField.svelte`; it must not survive as a third path.

## Data / contracts

- `QuestionField` is the new load-bearing unit. Every field has `id` (URL-safe,
  unique within its step), `kind`, `label`, optional `help`, and a readonly
  `validation` list. The single-select and multi-select variants add `options`;
  multi-select may mark exactly one option `exclusive`. The numeric variant adds
  `unit` and its range. The contact variant declares its sub-inputs.
- `QuestionStep` keeps `id`, `questionNumber`, `title`, and optional `help`, and
  replaces `kind` plus kind-specific members with `fields`. `InterstitialStep`
  is unchanged: no question number, no fields, no answer.
- **The stored answer shape changes.** `QuestionnaireAnswers.byQuestionId`
  becomes a record of step id to a record of field id to `Answer`. The domain
  `Answer` union is untouched, so `storage.ts`'s `isAnswer` guard still
  validates each leaf; only the nesting around it changes.
- **Persisted Feature 7 sessions are discarded, not migrated.** Bump
  `SESSION_VERSION` so `parseSession` rejects the old shape outright. The stored
  data is one fictional biological-sex answer in a prototype, so a migration
  path would cost more than it protects. State this in the commit rather than
  dropping it silently.
- `ValidationRule` gains `min-selected` (with a count), `numeric-range` (with
  min, max, and an optional integer flag), `email`, and `max-length`. The union
  stays discriminated and stays in the schema module. 8b, 8c, and 8d extend it
  the same way rather than validating inside a component.
- Validation returns a per-field result: a step result maps field id to
  `ValidationResult`, and a step is valid only when every field is. Components
  render the messages; they never decide them.
- Exclusive-option behavior is a schema-described property (`exclusive: true` on
  one option) enforced by the renderer, never hardcoded to an id or a label.
- `firstUnansweredIndex` stays the zero-based index among answer-producing
  steps. A step counts as answered only when every one of its fields validates.
- Saving stays atomic: one `saveQuestionnaireAnswer` call carries the step's
  whole field-answer record plus the recomputed marker.
- All copy and answers remain fictional prototype content. No medical decision,
  eligibility threshold, or claim is introduced.

## Testing

- No `test` command and no unit runner are configured, and this feature must not
  install one. Pure schema, validation, exclusivity, and resume logic is checked
  through strict TypeScript, the `/dev/scenario` runtime surface, `pnpm check`,
  and `pnpm build`. No claim is made that it has unit tests.
- No `Browser tests` command is declared, so route and form behavior is verified
  directly in the running app rather than by adding Playwright mid-feature.
- Run `pnpm check` after each step and `pnpm build` for the completed feature.
- Direct browser verification covers:
  - the migrated question 1 still answering, saving, restoring, and validating;
  - numeric rejection of empty, non-numeric, below-range and above-range input,
    each with its own message;
  - contact required, e-mail format, optional-phone-empty and
    optional-phone-filled cases, plus browser autofill;
  - exclusive selection in both directions, minimum-selection failure, and
    restore order;
  - a multi-field step reporting several errors at once and focusing the first;
  - forward and backward navigation across questions 1 to 3, refresh-resume,
    direct-URL guard, and `firstUnansweredIndex` agreement;
  - desktop and mobile comparison against the three artboards, one `h1` per
    page, no horizontal overflow, 200 percent zoom, and console output.
- The manual try path is: start at `/questionnaire`, submit question 1 empty,
  fill it, continue, submit question 2 with a malformed e-mail, correct it,
  continue, check "None of these" on question 3 and then a normal option to see
  exclusivity, refresh, and confirm every answer is restored and checkout is
  still inaccessible.

## Notes for the AI

- This is a contract change first and three renderers second. Do Step 1 as a
  pure refactor that keeps the one shipped question working, and resist adding
  new fields until it is reviewed.
- Use Svelte 5 runes and strict TypeScript. Reuse the existing `journey`
  singleton and the Feature 7 shell, service, and route files; do not create a
  second store or a parallel questionnaire state path.
- Questionnaire components consume `QuestionnaireService`, never raw schema
  fixtures or `sessionStorage`.
- Renderers stay dumb: they receive a field, a value, and an error, and emit
  changes. Every rule lives in `schema.ts`.
- Keep every route SSR-safe. Saved answers are restored after mount, as Feature
  7 does, never during the server render.
- Use semantic `fieldset`, `legend`, `label`, and status markup. Each field owns
  its own error region, associated by `aria-describedby` and announced. Never
  communicate validity by color alone.
- Reuse the adapted `Checkbox`, `Input`, `InputGroup`, `Select`, `Field`,
  `RadioGroup`, `Label`, `Alert`, and `Button`. Do not install or create a new
  shared primitive; if one seems necessary, stop and raise it.
- Feature 7 needed two local overrides on the Field primitive: `FieldTitle` gets
  `normal-case tracking-normal` inside an option card, and `FieldLegend` uses
  `variant="label"`. Stay consistent with those rather than inventing a third
  treatment.
- Use semantic tokens and stock Tailwind scales only. No raw colors, arbitrary
  visual values, fixed artboard dimensions, or absolute positioning for layout.
- Do not transcribe the reference's known defects. The completion artboard's
  "All 8 steps complete" against "Question 9 of 9" is a documented error; the
  canonical count stays schema-owned and is 8d's problem, not something to
  pre-empt here.
- Preserve ordinary browser history for step-to-step navigation, as Feature 7
  established.
