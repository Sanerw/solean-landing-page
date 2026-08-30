# Feature: The medical questions

**From build-plan:** feature 8b
**Status:** verified

## Goal

Add questions 4 to 7, the medical body of the questionnaire, as fixture content
on the field contract 8a locked: medical conditions, health history, eating
disorders, and allergies and medications. No new renderer is built. Two small
schema properties are added because the reference needs them, and the canonical
question count is resolved so every screen from here on states the same total.

## Design reference

- [Questionnaire 4 - Medical Conditions](../reference/EN%20Questionnaire%204%20%E2%80%94%20Medical%20Conditions.png)
  - sixteen conditions in two columns, an `OR` separator, then a trailing row
    holding both "None of the above" and "Other".
- [Questionnaire 5 - Health History](../reference/EN%20Questionnaire%205%20%E2%80%94%20Health%20History.png)
  - two fields on one step, each labelled with a sentence-case question in bold
    rather than the uppercase eyebrow question 1 uses.
- [Questionnaire 6 - Eating Disorders](../reference/EN%20Questionnaire%206%20%E2%80%94%20Eating%20Disorders.png)
  - a yes/no whose label is the `h1` itself, then a second labelled
    multi-select of five statements in one column.
- [Questionnaire 7 - Allergies & Medications](../reference/EN%20Questionnaire%207%20%E2%80%94%20Allergies%20&%20Medications.png)
  - a two-column allergen multi-select with the same trailing row, then a
    labelled yes/no that carries its own help text.
- `blueprint/reference/design-system.md` stays authoritative for tokens,
  typography, spacing, radii, focus, and contrast.
- The shell, progress, navigation, and every field renderer already shipped in
  Features 7 and 8a and are not redesigned here.

## In scope

- Resolving the canonical question count. The reference states "QUESTION n OF 9"
  on eight question artboards and "ALL 8 STEPS COMPLETE" on the ninth, which is
  a completion screen, not a question. Project plan section 9 records the
  resolution as "one consistent step count, defined by the schema", so
  `questionCount` becomes 8 and the completion screen is never numbered.
- A `trailing` flag on `QuestionOption`, so an option can sit below the `OR`
  separator without being exclusive. The reference puts "None of the above" and
  "Other" there together on questions 4 and 7; only the first is exclusive.
- A `labelStyle` on a question field, so a field label can render as the
  reference's sentence-case bold question instead of the uppercase eyebrow.
  Questions 5, 6, and 7 need it; question 1 keeps the eyebrow.
- Question 4: one two-column multi-select of the sixteen contraindications, plus
  the trailing "None of the above" and "Other".
- Question 5: a single-column family-history multi-select, plus a yes/no about
  mental health, both with sentence-case labels.
- Question 6: a yes/no whose label is hidden because the `h1` asks it, plus a
  labelled multi-select of five statements.
- Question 7: a two-column allergen multi-select with a trailing row, plus a
  labelled yes/no carrying its own help text.
- Verifying resume, the reachability guard, progress, and numbering across seven
  real steps, which is the first time the funnel is long enough to exercise them
  properly.

## Out of scope

- Any eligibility judgement. The resolved decision stands: the questionnaire
  collects only. These four screens gather the sixteen contraindications and
  record them as answers, and nothing reads them, scores them, branches on them,
  or blocks anyone. Feature 11's order states own every outcome.
- Both interstitials, treatment preference, and the completion screen. 8c and 8d
  own them, including whatever the completion screen says about the total.
- New field renderers, new validation rule types, and new shared primitives.
  This feature is fixture content plus two small schema properties.
- Setting `questionnaire.completed`, selecting a treatment, or unlocking
  checkout.
- The F-07 `Tabs` repair, which 8c owns.
- Free-text capture behind "Other". The reference shows it as a plain checkbox
  with no text input, so it stays a plain option here.
- Unit or browser test runner setup, deployment, dark mode, analytics.

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

- [x] **Step 1 - Resolve the canonical question count to 8** - Change
  `questionCount` from 9 to 8 and record why in the schema, so the three shipped
  screens and every screen after them agree. This is the recorded resolution of
  a known reference defect, not a new decision: eight artboards ask a question
  and the ninth congratulates, so "of 9" was the error and "all 8 steps" was
  right. *Done when:* `/questionnaire/about-you`, `/your-details`, and
  `/pregnancy` read "Question 1, 2, 3 of 8"; the progress bar fills three
  eighths at question 3; no component restates the total; and `pnpm check`
  passes.

- [x] **Step 2 - Add the trailing option group and question 4** - Add
  `trailing?: boolean` to `QuestionOption`, treat an exclusive option as
  implicitly trailing, and render every trailing option in the row below the
  `OR` separator. Then add question 4 with its sixteen conditions in two
  columns and its trailing "None of the above" (exclusive) and "Other" (not
  exclusive). *Done when:* the sixteen conditions render two-up on wide
  viewports and stacked on mobile; "None of the above" and "Other" sit side by
  side below one `OR` separator; checking "None of the above" clears "Other" and
  every condition, and checking "Other" or any condition clears "None of the
  above"; "Other" and a condition can be checked together; continuing with
  nothing checked shows the required message; and the layout matches the
  artboard.

- [x] **Step 3 - Add the sentence-case field label and question 5** - Add
  `labelStyle?: 'eyebrow' | 'question'` defaulting to `eyebrow`, render the
  `question` style as the reference's bold sentence-case text, then add question
  5 with its two fields: the family-history multi-select in one column with a
  trailing "None of the above", and the mental-health yes/no. *Done when:*
  question 1 still shows uppercase eyebrow labels while question 5 shows bold
  sentence-case ones; both fields render under one continue button; submitting
  empty reports both failures at once and focuses the first; each field keeps
  its own error region; and answering only one still blocks continue.

- [x] **Step 4 - Add question 6** - The eating-disorder yes/no with its label
  hidden because the `h1` asks it, followed by the labelled five-statement
  multi-select with a trailing "None of the above". *Done when:* the yes/no is
  reachable by keyboard and has an accessible name despite the hidden label;
  the help text under the `h1` is associated with the group rather than
  floating; the five statements render in one column; exclusivity works; and
  the page still has exactly one `h1`.

- [x] **Step 5 - Add question 7** - The eight-allergen two-column multi-select
  with its trailing "None of the above" and "Other", plus the other-medication
  yes/no carrying its own help text under its label. *Done when:* both fields
  render and validate independently; the second field's help is associated with
  its group by `aria-describedby` and is distinct from the step-level help;
  exclusivity works on the allergen field; and the layout matches the artboard
  at desktop and mobile.

- [x] **Step 6 - Walk questions 1 to 7 and finish integration** - Verify the
  whole seven-question path against the artboards at desktop and mobile widths,
  and confirm the behavior that only a long funnel can exercise: progress,
  numbering, back and forward across seven steps, resume from any point, and
  the reachability guard on a deep direct URL. *Done when:* answering 1 through
  7 in order advances by real navigation with working browser Back; the
  progress bar and eyebrow agree at every step; refreshing at question 6
  resumes at question 6 with its answers restored; entering question 7's URL on
  a fresh session redirects to question 1; `firstUnansweredIndex` matches the
  questions actually answered throughout; every page has one `h1`, no
  horizontal overflow, and no console error; and checkout is still guarded.

## Files / areas

- `src/lib/features/questionnaire/schema.ts` - `questionCount`, questions 4 to
  7, and the trailing-option grouping helper.
- `src/lib/features/questionnaire/types.ts` - `QuestionOption.trailing` and
  the field `labelStyle`.
- `src/lib/features/questionnaire/MultiSelectField.svelte` - render trailing
  options below the separator instead of assuming the exclusive option is the
  only one there.
- `src/lib/features/questionnaire/QuestionScreen.svelte` - the two label styles.

Nothing else should need to change. If a step wants to touch the service, the
journey, a route, or a shared primitive, stop: this feature is content on an
existing contract, and that would be a signal the contract is wrong.

## Data / contracts

- `questionCount` becomes 8. It stays the only total any screen renders, and
  8c's interstitials must not change it. 8d owns whatever the completion screen
  says, and it must not reintroduce a second number.
- `QuestionOption` gains `trailing?: boolean`. An option with `exclusive: true`
  is treated as trailing whether or not the flag is set, so no fixture has to
  state both. Trailing options render below the `OR` separator, in the same
  column layout as the primary ones.
- Exclusivity is unchanged and still enforced by the renderer from the schema
  flag: checking the exclusive option clears everything else, and checking
  anything else clears the exclusive option. "Other" is trailing but not
  exclusive, so it combines freely with a condition.
- A question field gains `labelStyle?: 'eyebrow' | 'question'`, defaulting to
  `eyebrow`. It affects presentation only: the element, its association, and its
  error region are unchanged, so a hidden label, a legend, and a label all keep
  their existing semantics.
- No new `ValidationRule` type is needed. Every field here is covered by
  `required` and `min-selected`.
- Answers keep the 8a shape: step id to field id to `Answer`, saved atomically
  with the recomputed `firstUnansweredIndex`. Multi-select answers keep schema
  order, not click order.
- `SESSION_VERSION` does not change. Adding steps does not alter the stored
  shape, and a session answered under three questions stays readable: the extra
  questions simply read as unanswered, which is exactly what resume should do.
- Every condition, allergen, and statement is fictional prototype content
  transcribed from the design reference. It is not approved medical content, and
  nothing in the app interprets it.

## Testing

- No `test` command and no unit runner are configured, and this feature must not
  install one. Schema and validation logic is checked through strict TypeScript,
  a scratch runtime script against the built schema module, `pnpm check`, and
  `pnpm build`. No claim is made that it has unit tests.
- No `Browser tests` command is declared, so form and route behavior is verified
  directly in the running app rather than by adding Playwright mid-feature.
- Run `pnpm check` after each step and `pnpm build` for the completed feature.
- Runtime assertions to extend from 8a's script, which is the cheapest place to
  prove content correctness:
  - every step id and option id is unique and URL-safe, and the schema builder
    accepts the fixture;
  - question numbers run 1 to 7 with no gap or duplicate, and none exceeds
    `questionCount`;
  - exactly one exclusive option per multi-select field;
  - exclusivity resolves both directions on questions 4 to 7;
  - "Other" and a condition coexist on question 4;
  - `firstUnansweredIndex` and the guard behave correctly at each of the seven
    steps.
- Direct browser verification covers what the script cannot: the two-column
  layout and trailing row against artboards 4 and 7, the two label styles side
  by side, keyboard reachability of every option, focus order, the hidden label
  on question 6, one `h1` per page, no horizontal overflow, 200 percent zoom,
  and console output.
- The manual try path is: start at `/questionnaire`, answer questions 1 to 3,
  then on question 4 check a condition, check "None of the above" and watch it
  clear, check "Other" and confirm "None of the above" clears, continue through
  questions 5, 6, and 7, refresh at question 6, and confirm the saved answers
  and that checkout is still inaccessible.

## Notes for the AI

- This is content, not architecture. If a question seems to need a new renderer,
  rule, or primitive, stop and say so rather than inventing one; the contract
  was designed against all nine artboards and should already fit.
- Transcribe the reference's option text exactly, but do not carry its em dash
  into the fixture: rewrite question 6's help as two sentences, per the writing
  rule in `coding-standards.md`.
- Do not transcribe the reference's known defects. The "of 9" numbering is the
  defect step 1 resolves; the completion artboard's "All 8 steps complete" is
  the correct figure.
- Option ids must satisfy the schema's URL-safe pattern, so
  "Hydrochloric acid / sodium hydroxide" becomes a kebab-case id while its label
  keeps the reference's exact text.
- Use Svelte 5 runes and strict TypeScript. Reuse the existing shell, service,
  routes, and renderers; add no second state path.
- Questionnaire components consume `QuestionnaireService`, never raw schema
  fixtures or `sessionStorage`.
- Keep every route SSR-safe. Saved answers are restored after mount, as Features
  7 and 8a do.
- Use semantic tokens and stock Tailwind scales only. No raw colors, arbitrary
  visual values, or fixed artboard dimensions.
- Treat every answer as fictional prototype content. Introduce no medical
  decision, threshold, or claim, and add no copy suggesting the app assesses
  what the user selected.
