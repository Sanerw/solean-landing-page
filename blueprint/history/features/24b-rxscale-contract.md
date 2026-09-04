# Feature: Own questions, mapped onto RxScale - 24b, the RxScale contract

**From build-plan:** feature 24b
**Status:** verified

## Goal

Turn RxScale's model from the thing that *renders* the questionnaire into the
thing our answers are *checked against*. 24a defined 27 questions; this
sub-feature maps them onto the 32 answers RxScale's model expects, applies their
own `visibleIf` and `validators` to the result locally, and proves the mapping is
complete in both directions.

Still additive. The live flow keeps fetching and rendering their model, and no
visitor sees anything different. What exists at the end is a function from our
answers to a submittable payload, a second opinion from RxScale's own rules
before anything is sent, and a command that says when their model has moved.

## Design reference

None. Nothing in this sub-feature renders. The reference that matters is the live
model itself, snapshotted in step 1 and readable as
`src/lib/features/questionnaire/rxscale/model-snapshot.json`.

## In scope

- The committed snapshot of `LIVE: MedQ NEW RECOMMENDER (01/26)` version 1, and a
  typed reading of it.
- The mapping from `Answers` to RxScale's `data` shape, as declared rules rather
  than one long function, so the reverse index falls out of the declaration.
- The reverse index: which of our questions feeds a given model question.
- Two coverage guards, one per direction, each a test that fails on a gap.
- The shadow survey: `survey-core` fed the snapshot and our mapped data, so
  RxScale's `visibleIf` and `validators` decide eligibility, in their wording.
- `compareModel`, pure and unit tested, plus `pnpm check:model` which fetches the
  live document and runs it.

## Out of scope

- **Submitting anything.** No call to `submitAnamnesis`, no change to
  `anamnesis-client.ts`. The mapper produces the payload; 24c sends it.
- **Any route, screen or component.** `(questionnaire)/` and every field renderer
  stay untouched, as in 24a.
- **Translating RxScale's refusals.** Their validator texts are German only. See
  the note under Notes for the AI: an English visitor would meet an English
  question and a German refusal, and deciding what to do about that is 24c's.
- **Running the contract check automatically.** It is a deliberate command, not
  part of `pnpm test` or any CI job. Open question 13 in `project-overview.md`
  records why and leaves the schedule open.
- **Clearing answers when a branch closes.** The mapper reads only what the 24a
  branching says is visible, so a stale answer does not travel. Removing it from
  the store is 24c's if it is wanted at all.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - The snapshot.** Save the live document to
  `src/lib/features/questionnaire/rxscale/model-snapshot.json` and add
  `snapshot.ts`: the typed import plus `modelInventory()`, which walks the pages
  and returns one entry per answerable element (name, type, `isRequired`, its
  `visibleIf` string, its choice values, its validator expressions), skipping the
  three `expression` elements that take no answer.
  *Done when:* `snapshot.test.ts` proves the inventory finds **32** answerable
  questions, that **17** of them are required with no `visibleIf`, that `EMail` is
  the only optional one, and that the three display-only elements are absent.

- [x] **Step 2 - The mapping table, and the rules that are a rename.** Add
  `mapping.ts` with the `MappingRule` contract, `toAnamnesisData`, `DROPPED`, and
  the rules where our answer travels unchanged under a different name: `gender`,
  `email`, `diseases`, `familyDiseases`, `mentalHealth`, `eatingDisorder`,
  `eatingDisorderStatements`, `allergies`, `gallbladderRemoved`, `otherMedication`,
  `otherMedicationDescription`, `hasSideEffects`, `sideEffectsDescription`,
  `weightRelatedConditions`, `pastMedicationDuration`, `pastMedicationLastDose`.
  Also `ourQuestionFor`, built from the rules rather than written by hand.
  **`toAnamnesisData` reads only the questions 24a's branching says are visible**,
  from this step onward rather than as a later correction: a rule added against
  raw answers would have to be rewritten, and the one that got missed would be the
  one that leaked.
  *Done when:* `mapping.test.ts` proves each of those lands under RxScale's own
  name with its value untouched, that `ourQuestionFor('PsychologicalConditions')`
  answers `mentalHealth`, that a question nobody answered contributes no key at all
  rather than a null, and that free text typed against an "other" that is no longer
  chosen writes no `-Comment` key.

- [x] **Step 3 - The rules that reshape.** Add the eight that are not a rename:
  the date to `dob` and `dob2{Day,Month,Year}`; the name to `FirstName`, `Surname`
  **and** `Name{Name,Surname}`; height and weight folded into
  `WeightSize{size,weight}`; `pregnancyStatus` fanned out to
  `isPregnantorBreastfeeding` and `PlanningPregnancy`; `pastMedication` fanned out
  to `TakingWeightlossMedication` and `WeightlossMedication`; the dose routed to
  whichever of the four dose questions applies; both consents from a boolean to
  their one-item shapes; and every `hasOther` question's free text to
  `<Name>-Comment`.
  *Done when:* `mapping.test.ts` covers each arity, and specifically: a date of
  `1990-04-17` produces `dob: '1990-04-17'` and `dob2: { Day: 17, Month: 4, Year:
  1990 }` as numbers; `pastMedication: 'never'` writes
  `TakingWeightlossMedication: 'no'` and **no** `WeightlossMedication`;
  `pastMedication: 'mounjaro'` with a dose writes `question4` and none of the other
  three dose questions; `pregnancyStatus: ['breastfeeding']` writes
  `isPregnantorBreastfeeding: 'yes'` (lowercase) and `PlanningPregnancy: 'No'`
  (capitalised); `disclaimer: true` writes `['Item 3']`.
  **Prove the `-Comment` suffix rather than assuming it.** It is a survey-core
  convention, not something the model states, so one test sets `comment` on a real
  question of a shadow survey and reads the key back out of `survey.data`. If the
  library spells it differently, the mapping is wrong everywhere an "other" exists
  and nothing else would say so.

- [x] **Step 4 - Stale answers from a closed branch.** Prove the visibility mask
  from step 2 holds across the reshaping rules, where the consequences are worst.
  *Done when:* `mapping.test.ts` proves that naming Mounjaro with a dose and then
  switching to `never` writes neither `question4` nor `WeightlossMedication`, and
  that a visitor who answers the pregnancy screen and then changes sex to male
  writes neither pregnancy question.

- [x] **Step 5 - The two coverage guards.** Add `coverage.ts` with
  `unmappedModelQuestions()` and `unwrittenOurQuestions()`, each returning what is
  missing rather than a boolean, so a failure names the gap.
  *Done when:* `coverage.test.ts` proves that every answerable model question is
  written by some rule, and that every one of our 27 questions is either read by a
  rule or listed in `DROPPED` with a reason, with `phone` as the only entry in
  `DROPPED`. Both assertions must be shown to fail with the offending name in the
  message before passing: prove it by temporarily removing one rule, capturing the
  failure text, and restoring it.

- [x] **Step 6 - The shadow: RxScale's own rules, locally.** Add `shadow.ts`
  building a `survey-core` model from the snapshot, setting the mapped data on it,
  and exposing `theirErrors(answers)` keyed by **our** question id through the
  reverse index, plus `missingRequired(answers)` naming model questions that are
  visible, required, and unanswered.
  *Done when:* `shadow.test.ts` proves that **`missingRequired` is empty for every
  branch scenario**, not just one: a male visitor, a female visitor, one inside the
  BMI 27 to 30 band and one above it, one on Mounjaro and one who has never taken
  anything, one with gallstones and one without. That sweep is the real test here,
  because it is the only thing that exercises the seam between our branching and
  theirs, and a disagreement between the two is what silently produces a 400.
  Then: a BMI under 27 produces RxScale's own refusal against `weightKg`; a date of
  birth under 18 produces theirs against `dateOfBirth`; `eatingDisorder: 'Yes'`
  produces theirs against `eatingDisorder`; and a male visitor is not reported as
  missing `isPregnantorBreastfeeding`, because their `visibleIf` hides it.

- [x] **Step 7 - The drift check and its command.** Add `contract.ts` with
  `compareModel(snapshot, live)` returning added, removed and changed questions,
  comparing **structure only**: names, types, `isRequired`, `visibleIf`, choice
  values and validator expressions, never titles or descriptions. It also reports a
  changed `identifier` or `version`, which is the cheapest first signal that
  anything moved at all. Add `scripts/check-model-contract.ts` which fetches the
  live document, runs the comparison, prints what moved, and exits **1 on drift and
  2 when RxScale could not be reached or answered something unusable**, because a
  network blip must never read as "they changed the questionnaire". Add
  `check:model` to `package.json` and to the Commands section of `AGENTS.md`.
  *Done when:* `contract.test.ts` proves a renamed question, a new required
  question, a changed `visibleIf`, a removed choice value and a changed validator
  are each reported, and that a changed **title** is not. Then `pnpm check:model`
  is run for real against `api.rxscale.com` and reports no drift.

## Files / areas

New, all under `src/lib/features/questionnaire/rxscale/`:

| Path | Holds |
| --- | --- |
| `model-snapshot.json` | the live document, committed |
| `snapshot.ts` | the typed snapshot and `modelInventory()` |
| `mapping.ts` | `MappingRule`, the rules, `toAnamnesisData`, `DROPPED`, `ourQuestionFor` |
| `coverage.ts` | the two directional guards |
| `shadow.ts` | `survey-core` from the snapshot: their visibility and their validators |
| `contract.ts` | `compareModel`, pure |

Also new: `scripts/check-model-contract.ts`.

Changed: `package.json` gains `check:model`; `AGENTS.md` documents it.

Unchanged, and deliberately so: everything under `src/routes/(questionnaire)/`,
every field component, `anamnesis-client.ts`, and all of 24a's `definition/` and
`answers/` modules. This sub-feature reads 24a; it does not amend it.

## Data / contracts

Load-bearing: 24c calls all four of these.

| Export | Shape | Used for |
| --- | --- | --- |
| `toAnamnesisData(answers)` | `Record<string, unknown>` | the body of the submission, exactly what `submitAnamnesis` already takes |
| `theirErrors(answers)` | `Partial<Record<QuestionId, string>>` | RxScale's refusals, keyed by the question of ours that shows them |
| `missingRequired(answers)` | `readonly string[]` | model question names with no answer, the pre-submission guard |
| `ourQuestionFor(modelName)` | `QuestionId \| null` | the reverse index |

**A mapping rule declares what it touches.**

```ts
interface MappingRule {
	readonly reads: readonly QuestionId[];
	readonly writes: readonly string[];
	readonly apply: (answers: Answers, out: AnamnesisData) => void;
}
```

Declaring `reads` and `writes` beside the function is what makes both coverage
guards and the reverse index derivable instead of hand-maintained. The dose rule
lists all four dose question names in `writes` even though it writes one, so an
error on any of them still resolves back to `pastMedicationDose`.

**`theirErrors` returns their sentence, not a code.** The opposite of 24a's
validation, and for the opposite reason: our codes exist so we can word them in
two languages, while their refusal is a clinical statement we are not going to
paraphrase. Both reach a screen in 24c and the screen shows whichever it has.

**Nothing hidden travels**, which step 4 exists for. A visitor who names Mounjaro,
enters a dose, then switches to "never" still has a dose sitting in the store.
RxScale's `question4` is hidden for that answer, and a value sent for a hidden
question is exactly the divergence their validator exists to catch.

**Six exact strings, each a silent failure if wrong.** RxScale compares literally
and a mismatch raises nothing.

| Model question | Value we must write | Trap |
| --- | --- | --- |
| `isPregnantorBreastfeeding` | `'yes'` / `'no'` | lowercase |
| `PlanningPregnancy` | `'Yes'` / `'No'` | capitalised, on the adjacent question |
| `TakingWeightlossMedication` | `'yes'` / `'no'` | lowercase |
| `Disclaimer` | `['Item 3']` | an array, of their internal item name |
| `ContraceptionDisclaimer` | `'I understand'` | a bare string |
| `<Name>-Comment` | the "other" free text | survey-core's own suffix |

**`dob` and `dob2` are the same date twice**, in two shapes, both required.
`dob` is the `YYYY-MM-DD` string confirmed in feature 10; `dob2` is
`{ Day, Month, Year }` as numbers, because their item validators use
`minValueExpression` and compare numerically. Their `Year` range of 1935 to 2007
encodes the age gate, which is theirs to enforce.

**`Name`, `FirstName` and `Surname` are three required questions for two facts.**
Redundant in their model, and all three must be present or the submission is
incomplete.

## Testing

`pnpm test` is declared in `AGENTS.md`, so the gate is on, and every step here is
pure logic with an assertable answer. Each ships its tests in the same diff.

| Module | What the test has to catch |
| --- | --- |
| `snapshot.ts` | a miscounted inventory, a display-only element treated as answerable |
| `mapping.ts` | a value under the wrong name, a wrong literal from the table above, a null written where the key should be absent, the wrong dose question, a hidden answer travelling |
| `coverage.ts` | a model question no rule writes, one of ours neither read nor dropped |
| `shadow.ts` | a refusal that should fire and does not, a hidden question reported as missing |
| `contract.ts` | a structural change not reported, a cosmetic change reported |

**`pnpm test` must stay offline.** `contract.ts` is pure and tested against
fixtures; only `scripts/check-model-contract.ts` touches the network, and it is
its own command. A test that reached `api.rxscale.com` would make an unrelated
build fail during an RxScale outage.

**One answer fixture, built once and shared.** Step 6 needs a complete, eligible
set of answers, and steps 3 to 5 all want variations on it. Put it in
`rxscale/fixtures.ts` as a function returning a fresh object with an overrides
argument, following the `answering()` helper 24a's tests already use. A shared
literal would be mutated by one test and read by another.

It sits under `src/` but is test-only: nothing in the app may import it, or a
fabricated set of medical answers ships to the browser. Vitest collects
`src/**/*.test.ts`, so the name keeps it out of the suite as a test file, and the
coverage guard in step 5 is the thing that would notice it being wired in.

`pnpm test:browser` is not extended: nothing a browser can observe changes.

**One live run is part of step 7**, and it is the only network evidence this
sub-feature produces: `pnpm check:model` against `api.rxscale.com`, reporting no
drift from the snapshot committed in step 1.

## Notes for the AI

- **Do not touch the live flow, and do not amend 24a.** If a change looks needed
  in `definition/` or `answers/`, say so and stop; it is either a 24a defect worth
  its own fix or 24c's work.
- **Read the model, do not recall it.** Every name, value and expression comes
  from `model-snapshot.json` in the repository. The values in this spec are a
  guide for review, not a source to type from.
- **The shadow is a separate survey instance** from anything the app renders, and
  it is fed data rather than answers. Attaching validation errors to it is fine
  precisely because nobody is looking at it: use `validate(true, false)`, unlike
  24a's `steps.ts`, which suppresses attachment because its instance is on screen.
- **`survey-core` needs the `os-date-picker` registration** before the snapshot
  will parse with `dob` intact. `survey-model.ts` already does this at import;
  reuse `createSurvey` rather than repeating the registration, and note that this
  is the one place 24b depends on a module 24c will rework.
- **The snapshot ships to the browser.** It is around 29 KB of JSON and the shadow
  runs client-side, per screen, in 24c. `survey-core` is already in that bundle, so
  this is an acceptable addition, but it is a real one and worth stating rather
  than discovering.
- **Their refusals are German only.** Feature 19 decided an English visitor walks a
  German funnel because the questions were RxScale's. After 24a the questions are
  English, so an English visitor would meet an English question and a German
  refusal. Do not translate them here: a refusal is a clinical and legal statement,
  and owning its wording is a decision, not a chore. Record it for 24c.
- **`check:model` exits non-zero on drift** and prints what moved. It is a report a
  person reads, not an assertion: when it fires, the fix is a new snapshot plus
  whatever mapping the change implies, and that is a deploy.
- **Comment the why.** The six literals, the two shapes of the date, and the
  hidden-answer rule each deserve a line. The rule list does not.
