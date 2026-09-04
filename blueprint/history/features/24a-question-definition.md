# Feature: Own questions, mapped onto RxScale - 24a, the question definition

**From build-plan:** feature 24a
**Status:** verified

## Goal

Make the questionnaire's content Solean's. This sub-feature defines the questions
as typed data in this repository: their ids, kinds, options, wording, order,
screen grouping, branching, and our own per-screen validation, together with the
answer store that holds what a visitor types.

Nothing user-facing changes. The live flow keeps running on the fetched RxScale
model, and this definition sits beside it, proven by unit tests and readable on a
dev page. 24b maps it onto RxScale, 24c switches the route over, 24d designs the
screens the export never drew.

The reason to build the definition first, alone, is that everything downstream is
a function of it: the mapper, the shadow validation and the screens are all
easier to review once the questions exist as data that can be read in one sitting.

## Design reference

- `blueprint/reference/questionnaire-flow-export.html` - the Pencil export, 16
  artboards. Open it in a browser; the questionnaire artboards run from
  `left-[0px]` rightwards.
- `blueprint/reference/EN Questionnaire 3 — Medication History · base.png`,
  `· details.png`, `· other.png` - the one screen this export adds that the
  earlier reference set does not have.
- The existing `EN Questionnaire 1 — About You.png` through
  `9 — Complete & Order.png` still apply, **shifted by one**: the export inserts
  Medication History at position 3, so the old "3 Pregnancy" is the new 4, and so
  on.

Structure only in this sub-feature. No screen is built here, so no artboard is
implemented; they pin down which questions exist, in what order, with which
options.

## In scope

- The typed `Answers` shape and its empty-value factory.
- The question contract: `QuestionKind`, `QuestionDef`, `ChoiceOption`.
- All 27 questions across 12 screens, as data, with their German and English
  wording as Paraglide messages. The `other` free-text siblings are fields on
  `Answers`, not questions of their own, which is why the count is 27 and not 32.
- Typed branching: per-question and per-screen `visibleIf` predicates over
  `Answers`, plus `visibleScreens` and `visibleQuestions`.
- Our per-screen validation: required, formats, ranges, and the none/other
  combination rule, returning error codes rather than sentences.
- The in-memory answer store, browser-only, persisting nothing.
- A dev page that renders the definition so it can be reviewed in a browser.
- Unit tests for the branching, the validation and the empty-value factory.

## Out of scope

- **Any mapping onto RxScale.** No model snapshot, no mapper, no shadow
  validation, no contract test. That is 24b, and this definition must not import
  anything from `anamnesis-client.ts` or `survey-core`.
- **Rendering a question.** No field component is written or changed, and
  `question-registry.ts` is not re-keyed. That is 24c.
- **The live route.** `(questionnaire)/` is untouched, the model is still fetched
  on entry, and the visitor sees exactly what they see today.
- **Screen design.** The added screens get a definition here and a design in 24d.
- **Reviewed clinical wording.** See the note under Notes for the AI: the German
  comes from RxScale's own model and the English from the export, which is the
  best available starting point and is not the same as approved copy.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - The answer shape and the question contract.** Create
  `src/lib/features/questionnaire/answers/types.ts` with the `Answers` interface,
  the `QuestionId` union derived from it, and `emptyAnswers()`. Create
  `src/lib/features/questionnaire/definition/kinds.ts` with `QuestionKind`,
  `ChoiceOption`, and `QuestionDef` generic over its key so a question's kind and
  its answer's type cannot drift apart. No questions yet.
  *Done when:* `pnpm check` is clean, and `answers/types.test.ts` proves
  `emptyAnswers()` has a value for every key and **returns a fresh object each
  call**, so two sessions cannot share one mutable `string[]`.

- [x] **Step 2 - The scalar questions.** Create `definition/questions.ts` with the
  17 questions that carry no long option list: the four on `about-you`, the four
  on `your-details`, both side-effect questions, `gallbladderRemoved`,
  `mentalHealth`, `eatingDisorder`, `otherMedication` and
  `otherMedicationDescription`, plus the two disclaimers. Add their German and
  English wording to `messages/de.json` and `messages/en.json` under a `q_` prefix.
  German is transcribed from the live RxScale model, English from the export.
  *Done when:* `pnpm check` is clean and `definition/questions.test.ts` proves
  every question id is a key of `Answers` and no two questions share an id.

- [x] **Step 3 - The option catalogues.** Add the remaining 10 questions, the ones
  whose diffs are mostly choices: `weightRelatedConditions` (9), `diseases` (15),
  `familyDiseases` (2), `allergies` (8), `eatingDisorderStatements` (5),
  `pregnancyStatus` (4), `pastMedication` (13 medications, plus other, plus
  never), and `pastMedicationDose` with its four option sets, alongside
  `pastMedicationDuration` and `pastMedicationLastDose`. Choice values are
  RxScale's own strings wherever their model has one.
  *Done when:* the same test file also proves choice values are unique within each
  question, and that `pastMedicationDose` returns a different option set for each
  of the four medication families and an empty one for a medication that has no
  dose question. Whether our values match RxScale's cannot be asserted here, and
  must not be faked with a hand-copied list: the snapshot arrives in 24b, and that
  is where the comparison belongs.

- [x] **Step 4 - Screens and branching.** Create `definition/screens.ts` (the 12
  screens in order, their question ids, and where the two interludes sit) and
  `definition/conditions.ts` (the typed predicates). Add `visibleScreens(answers)`
  and `visibleQuestions(screenId, answers)`.
  *Done when:* `definition/conditions.test.ts` covers, at minimum: pregnancy
  hidden for `gender: 'male'`; weight-related conditions shown only for a BMI
  from 27 to 30 inclusive, and hidden when either measurement is blank; the
  gallbladder question shown only when gallstones are among the diseases; dose,
  duration, last dose and side effects shown only for a GLP-1 answer, and hidden
  for `never`; the other medication description shown only on yes. Progress counts
  screens, and an interlude never raises the count.

- [x] **Step 5 - Our validation.** Create `answers/validate.ts` exporting
  `validateScreen(screenId, answers)` returning `Partial<Record<QuestionId, ValidationCode>>`,
  covering only what is ours: required, number ranges, the e-mail shape, a
  malformed or future date, the none-with-others combination, and an `other`
  selected without its text.
  *Done when:* `answers/validate.test.ts` proves a required question blocks, a
  question hidden by branching never blocks, `['none', 'x']` is refused as
  `none-with-others`, `other` without text is refused, and an out-of-range height
  or weight is refused. RxScale's own rules are deliberately absent; they arrive
  in 24b.

- [x] **Step 6 - The answer store and the dev surface.** Create
  `answers/store.svelte.ts`, browser-only rune state holding one `Answers` object
  with the same never-persisted contract `survey-state.svelte.ts` documents, plus
  the `started` flag routing will need. Add `src/routes/dev/definition/+page.svelte`
  listing every screen, its questions, their kinds and options, which are
  currently visible for a sample answer set, and the validation errors that set
  produces.
  *Done when:* `pnpm dev`, open `/dev/definition`, and all 12 screens are listed
  with 27 questions; switching the sample's gender between male and female makes
  the pregnancy screen appear and disappear on the page; `pnpm check` and
  `pnpm test` are green.

## Files / areas

New, all under `src/lib/features/questionnaire/`:

| Path | Holds |
| --- | --- |
| `answers/types.ts` | `Answers`, `QuestionId`, `emptyAnswers()` |
| `answers/validate.ts` | our per-screen validation |
| `answers/store.svelte.ts` | the in-memory answer store |
| `definition/kinds.ts` | `QuestionKind`, `ChoiceOption`, `QuestionDef` |
| `definition/questions.ts` | the 27 questions |
| `definition/screens.ts` | the 12 screens, their order and their interludes |
| `definition/conditions.ts` | the typed branching predicates |

Also new: `src/routes/dev/definition/+page.svelte` and `+page.ts`.

Changed: `messages/de.json` and `messages/en.json` gain the `q_` entries.

Unchanged, and deliberately so: everything under `src/routes/(questionnaire)/`,
every field component, `question-registry.ts`, `steps.ts`, `survey-model.ts`,
`survey-state.svelte.ts`, `anamnesis-client.ts`.

## Data / contracts

These are load-bearing: 24b's mapper, 24c's route and 24d's screens all read
them, so they are locked here rather than discovered later.

**`Answers`** - one flat, typed object, not `Record<string, unknown>`. A field per
question, named for the question, typed by its kind: `single` answers with a
string-literal union or `null`, `multi` with `string[]`, `text` and `number` with
`string` (inputs are text; the range is validation's job), `date` with a
`YYYY-MM-DD` string or `null`, `consent` with `boolean`. An `other` free text is
its own sibling field, named `<question>Other`, because RxScale keeps the comment
apart from the answer and 24b has to send it separately.

**`QuestionDef<K extends QuestionId>`** - `id: K`, `kind`, `label` and optional
`description` as Paraglide message functions (not keys looked up at runtime; a
direct function reference so a missing message is a build error), `options`, and
an optional `visibleIf: (answers: Answers) => boolean`.

**`options` may be a function.** `options: ChoiceOption[] | ((answers: Answers) => ChoiceOption[])`.
This is not speculative generality: RxScale asks the dose with four different
option sets depending on which medication was named, and our one dose question has
to offer whichever set applies. Wegovy is 0,25 / 0,5 / 1 / 1,7 / 2,4; Ozempic ends
at 2,0; Saxenda and Nevolat are 0,6 / 1,2 / 1,8 / 2,4 / 3,0; Mounjaro is 2,5 / 5 /
7,5 / 10 / 12,5 / 15.

**`ScreenDef`** - `id` (the URL segment, kebab-case), `questionIds`, optional
`visibleIf`, and the interlude that follows it if any.

**Choice values are RxScale's wherever RxScale has one.** `gender` answers
`'female' | 'male'`, the diseases carry the model's English value strings, the
disclaimer's confirmation is `'Item 3'` because that is what their model calls it.
Our ids and our wording are ours; the values are chosen to make 24b's mapper an
identity as often as possible, and every place it cannot be is a place worth
seeing in the diff.

**`validateScreen` returns codes, not sentences.**
`Partial<Record<QuestionId, ValidationCode>>` where `ValidationCode` is a small
union: `'required' | 'out-of-range' | 'invalid-email' | 'invalid-date' | 'none-with-others' | 'other-text-missing'`.
Resolving a code to German or English belongs to the screen, in 24c. Two reasons,
both load-bearing: a validator that returned a sentence would have to know the
locale, and its tests would then assert wording instead of behavior.

**Validation refuses; it does not mutate.** Ticking "none of the above" next to
another option is reported as `none-with-others` rather than silently emptying the
selection. Clearing the other boxes as the visitor ticks is a UI affordance and
belongs to the checkbox screen in 24c; a pure function that rewrites its input
would be untestable as either one.

**The BMI expression exists twice, knowingly.** Ours, in `conditions.ts`, decides
whether screen 2 is part of the walk. RxScale's, in their model, decides whether
their `WeightRelatedConditions` is visible and therefore required. They have to
agree or a required question goes unanswered, and 24b's contract test plus its
completeness guard are what will catch it when they stop agreeing. This is the
first and clearest instance of the cost the whole feature accepts.

**The 12 screens and their 27 questions:**

| # | Screen | Questions | Visible when |
| --- | --- | --- | --- |
| 1 | `about-you` | gender, dateOfBirth, heightCm, weightKg | always |
| 2 | `weight-related-conditions` | weightRelatedConditions (+ other) | BMI 27 to 30 |
| 3 | `your-details` | firstName, lastName, email, phone | always |
| 4 | `medication-history` | pastMedication (+ other), pastMedicationDose, pastMedicationDuration, pastMedicationLastDose | always; the last three only for a GLP-1 |
| 5 | `side-effects` | hasSideEffects, sideEffectsDescription | on a GLP-1; the description on yes |
| 6 | `pregnancy` | pregnancyStatus | `gender = 'female'` |
| 7 | `medical-conditions` | diseases (+ other) | always |
| 8 | `gallbladder` | gallbladderRemoved | gallstones among the diseases |
| 9 | `health-history` | familyDiseases, mentalHealth | always |
| 10 | `eating-disorders` | eatingDisorder, eatingDisorderStatements | always |
| 11 | `allergies` | allergies (+ other), otherMedication, otherMedicationDescription | always; the description on yes |
| 12 | `disclaimers` | disclaimer, contraceptionDisclaimer | always |

Two of those deserve their reasoning on the record.

- **`pastMedication` is a single choice**, decided by the user against the
  export's "Select all that apply". RxScale's `WeightlossMedication` is a
  radiogroup, and folding several selections into one would drop medical
  information silently. Our options are the model's thirteen plus other, not the
  export's four. **"I have never taken anything" is one of those options, not a
  separate question**, even though the export draws it as a checkbox of its own
  below the list: it is the answer that makes every other one impossible, and one
  question cannot be both answered and declined. In 24b it fans out onto two model
  questions, `TakingWeightlossMedication` and `WeightlossMedication`; in 24d it
  gets the export's visual treatment.
- **`pregnancyStatus` stays the export's multi-select**, because it fans out
  losslessly onto RxScale's two yes/no questions: currently pregnant or
  breastfeeding sets one, planning within two months sets the other, none of these
  sets both to no. The fan-out itself is 24b's.

**Interludes keep their placement rule**, stated by the screen they follow rather
than by index: projection after `about-you`, because it needs the weight;
motivation after `eating-disorders`, roughly the middle of the walk and on an
unconditional screen so a branch cannot make it vanish.

## Testing

`pnpm test` is declared in `AGENTS.md`, so the gate is on and every step here is
logic-bearing. Steps 1 through 5 each ship their tests in the same diff; step 6
is state and a dev page, and rides on the browser evidence in its done-when.

In scope for unit tests, per the scope rule in `coding-standards.md`:

| Module | What the test has to catch |
| --- | --- |
| `answers/types.ts` | a key missing from `emptyAnswers()`, and a shared mutable default leaking between calls |
| `definition/questions.ts` | a duplicate id, a duplicate choice value, an id that is not a key of `Answers` |
| `definition/questions.ts`, doses | a different option set per medication family, and an empty one where the model asks no dose |
| `definition/conditions.ts` | each branch above, at its boundary: BMI exactly 27 and exactly 30 are in, 26.9 and 30.1 are out, a blank measurement hides the screen rather than dividing by zero |
| `answers/validate.ts` | required, hidden-so-not-required, `none-with-others`, "other" without its text, out-of-range numbers, a future date |

Because `validateScreen` answers with codes, none of these tests asserts a German
or an English sentence, which is what keeps them from breaking on a copy edit in
24d.

Out of scope for unit tests, deliberately: the dev page and the store's rune
plumbing. `pnpm test:browser` is not extended in this sub-feature, because no
visitor-facing behavior changes; 24c and 24d are where browser coverage belongs.

Manual verification is step 6's done-when: `/dev/definition` renders the whole
definition, and toggling the sample gender moves the pregnancy screen in and out
of the list.

## Notes for the AI

- **Do not touch the live flow.** If a change starts to look necessary in
  `(questionnaire)/`, in a field component or in `steps.ts`, it belongs to 24c.
  Say so and stop rather than reaching across.
- **No `survey-core` import in this sub-feature.** The engine stays where it is,
  serving the current flow. Our branching is plain typed functions, and 24b is
  what reintroduces the engine in its new role.
- **Branching is a function, not a string.** RxScale expresses `visibleIf` as a
  SurveyJS expression because their model is data over the wire. Ours is code, so
  it is a typed predicate that the compiler checks and a test can call directly.
- **The age gate is not ours.** RxScale's `dob` carries
  `age({dob}) < 80 && age({dob}) >= 18` with their own refusal text, and 24b runs
  it from the snapshot. Our validation checks only that the date is well formed
  and not in the future. Re-implementing their window here would put a medical
  rule in two places and quietly make this repository the one that decides who is
  too old for treatment.
- **The German wording is transcribed from the live model, not written fresh.**
  It is RxScale's own clinical phrasing, which makes it the best starting point
  available and keeps this sub-feature from inventing medical language. The
  English comes from the export. Neither is approved copy: open question 14 in
  `project-overview.md` records that nobody has yet been named to sign the wording
  off, and 24d is where that has to be resolved.
- **`messages/*.json` is flat and Paraglide-compiled**, base locale `de`. Add
  entries to both files in the same step; a key present in one and missing in the
  other is a build failure, which is the failure worth having.
- **Nothing is persisted.** The store holds answers in module memory and never
  writes `sessionStorage`, matching the contract `survey-state.svelte.ts`
  documents and the Data section of `project-overview.md`. Browser only: module
  state on the server is shared between requests and would hand one visitor's
  answers to the next.
- **No arbitrary Tailwind values on the dev page.** It is a development surface,
  not a designed screen, so keep it plain, semantic and token-based.
- **Comment the why, not the what.** The choice-value decisions, the BMI boundary
  and the single-choice medication call are worth a line each; the field list is
  not.
