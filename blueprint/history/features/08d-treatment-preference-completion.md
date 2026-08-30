# Feature: Treatment preference and completion

**From build-plan:** feature 8d
**Status:** verified

## Goal

Finish the questionnaire. Add question 8, where the patient picks the treatment
they want to explore from the canonical domain catalogue, and the completion
screen that closes the funnel. Between them they set the two facts checkout
depends on, `questionnaire.completed` and `selectedTreatmentId`, and they set
them in a way that cannot drift when the patient goes back and changes an
answer.

## Design reference

- [Questionnaire 8 - Treatment Preference](../reference/EN%20Questionnaire%208%20%E2%80%94%20Treatment%20Preference.png)
  - three full-width option rows, each with a product visual, the name, a form
    badge, the claim, a "Learn more" link out, and a selection control. The
    primary action names the chosen treatment: "Continue with Mounjaro".
- [Questionnaire 9 - Complete & Order](../reference/EN%20Questionnaire%209%20%E2%80%94%20Complete%20%26%20Order.png)
  - a celebration mark, "ALL 8 STEPS COMPLETE", a congratulation headline, two
    lines of body, three confirmation pills, the order action, and a
    reassurance footnote.
- `blueprint/reference/design-system.md` remains authoritative for tokens,
  typography, radii, focus, and contrast.

**Two reference defects resolved here, not transcribed.** The completion
artboard's "ALL 8 STEPS COMPLETE" is now literally true, because 8b set
`questionCount` to 8 and the completion screen is not a numbered question; its
neighbouring "Question 9 of 9" was the defect and does not appear. And the
reference shows Mounjaro chosen at question 8 but Wegovy at checkout: the
selection made here is the one that must survive.

## In scope

- A `TreatmentOption` product component in the questionnaire feature, composing
  adapted primitives, rendering one catalogue treatment as the reference's row.
- Question 8 as a single-select over `TREATMENTS`, so the option list is the
  catalogue rather than a second copy of it. A treatment removed from the
  catalogue disappears from the question rather than becoming a dangling id.
- A preference-aware continue action that names the selected treatment and
  falls back to a neutral label when nothing is chosen yet.
- The completion screen as a new interstitial variant, reusing the shell,
  progress and navigation the funnel already has.
- Making `questionnaire.completed` a recomputed fact rather than a flag anyone
  can set: it is written by the same atomic mutation that saves an answer, and
  it is true only while every question step validates. Going back and clearing
  an answer must take it back to false.
- Writing `selectedTreatmentId` from question 8's answer through that same
  mutation, so the questionnaire and the session cannot disagree about the
  chosen treatment.
- An honest state for the order action, which points at a checkout that Feature
  9 has not built yet.
- Browser coverage for the funnel completing, the selection carrying through,
  and completion reverting when an earlier answer is cleared.
- Keyboard, focus, heading, live-region, responsive, and reduced-motion
  behavior required by project standards.

## Out of scope

- The checkout routes, pricing, and order placement. Feature 9 owns them, and
  it is what makes the order action live.
- Add-ons, treatment switching, and the consultation offer. Features 9 and 10.
- Any eligibility judgement. The resolved decision stands: the questionnaire
  collects only. The completion screen confirms that a profile was submitted for
  review; it does not say anyone was approved, and the "eligibility checked"
  pill from the reference must not imply a verdict.
- Per-treatment product photography. No such assets exist and none are to be
  invented or faked by reusing one photo three times; see Data / contracts.
- Real dose guidance or medical recommendation. The catalogue's `dose` and
  `claim` are fictional prototype strings.
- New shared primitives, new field kinds, or new validation rule types.

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

- [x] **Step 1 - Make completion and treatment selection recomputed facts** -
  Extend the atomic save so one mutation writes the answer map, the recomputed
  `firstUnansweredIndex`, the recomputed `completed` flag, and the treatment id
  derived from question 8's answer. Add the pure helpers the service needs. No
  UI changes. *Done when:* `completed` is false while any question step fails
  validation and true only when all of them pass; it is recomputed on every
  write, so an answer map that stops validating cannot leave it true;
  `selectedTreatmentId`
  matches question 8's answer and returns to null when that answer is removed;
  a stored id the catalogue no longer knows does not unlock checkout; and
  nothing outside the service sets either fact.

- [x] **Step 2 - Add question 8 and the treatment option row** - Build
  `TreatmentOption` and add question 8 as a single-select whose options come
  from `TREATMENTS`. Each row shows the form badge, the claim, and a link out to
  the learn article, and the whole row is one selection control. *Done when:*
  three rows render from the catalogue with no treatment name or claim restated
  in the questionnaire; mouse, touch, Space and arrow keys select exactly one;
  the "Learn more" link is separately reachable by keyboard and does not select
  the row; selected, hover, focus-visible and invalid states are discernible;
  and continuing with nothing chosen shows the required message.

- [x] **Step 3 - Name the choice in the continue action** - Make question 8's
  primary action read "Continue with <treatment>" once a treatment is selected,
  and a neutral label before that, without special-casing the button for every
  other question. *Done when:* the label changes as the selection changes and is
  announced; the neutral label appears when nothing is selected; every other
  question keeps its plain "Continue"; and the label comes from the catalogue,
  so renaming a treatment renames the button.

- [x] **Step 4 - Add the completion screen** - Add a `completion` interstitial
  variant after question 8 and build the screen: the celebration mark, the
  step-count line, the headline, the body, the three confirmation pills, the
  order action, and the footnote. The order action is honest about checkout not
  existing yet. *Done when:* the screen states the same total the schema owns,
  with no second number; the copy confirms submission for review and claims no
  approval; the order action cannot lead to a 404; the celebration mark is
  decorative to assistive technology and respects reduced motion; and reaching
  the screen does not itself set any state.

- [x] **Step 5 - Walk the finished funnel** - Verify all eight questions, both
  earlier interstitials and the completion screen end to end at desktop and
  mobile, and confirm the handoff facts behave under back-navigation. *Done
  when:* answering 1 through 8 reaches completion through real navigation with
  working browser Back; `journey.stage` becomes checkout only after completion
  and a valid treatment; going back to an earlier question and clearing its
  answer returns the stage to questionnaire; the treatment chosen at question 8
  is the one the session reports; every page has one `h1`, no horizontal
  overflow and no console error; and `pnpm test:browser` passes.

## Files / areas

- `src/lib/features/questionnaire/schema.ts` - question 8, the completion
  interstitial, and the pure helpers for completion and treatment selection.
- `src/lib/features/questionnaire/types.ts` - the `completion` interstitial
  variant.
- `src/lib/features/questionnaire/questionnaire-service.ts` - the widened atomic
  save and the reads the two new screens need.
- `src/lib/journey/journey.svelte.ts` - one mutation carrying answers, marker,
  completion and treatment id together.
- `src/lib/features/questionnaire/TreatmentOption.svelte` - the option row.
- `src/lib/features/questionnaire/CompletionInterstitial.svelte` - the final
  screen.
- `src/lib/features/questionnaire/QuestionScreen.svelte` - the per-step action
  label.
- `src/lib/features/questionnaire/interstitial-content.ts` - completion copy.
- `src/routes/(questionnaire)/questionnaire/[step]/+page.svelte` - render the
  new variant.
- `e2e/` - coverage for completing the funnel and for completion reverting.

## Data / contracts

- **`questionnaire.completed` stops being an independently settable flag.** It
  is recomputed inside the same mutation that saves an answer, from whether
  every answer-producing step validates. This mirrors `firstUnansweredIndex`,
  which has worked the same way since Feature 7, and it closes the drift the
  reference itself shows: a funnel that reports completion while an answer is
  missing. `setCompleted` is removed from the service rather than left as a
  second way in.
- **`selectedTreatmentId` is derived from question 8's answer** and written by
  the same mutation. Feature 10 lets checkout change the treatment later; that
  is a separate write to the same field, and the questionnaire does not fight
  it. The questionnaire is the seed, not the owner for all time.
- Question 8's options are built from `TREATMENTS`, so the option id **is** the
  treatment id. No mapping table, and no treatment name or claim is restated in
  the questionnaire.
- The completion screen is an `InterstitialStep` with a new `completion`
  variant. It has no question number and produces no answer, so it does not
  move the count, exactly as the projection and motivation screens do not.
- The journey guard is unchanged. `canEnter('checkout')` already requires
  `completed` and a treatment the catalogue still resolves; this feature makes
  those two facts true honestly rather than relaxing the guard.
- **No per-treatment imagery exists.** The reference shows three product photos;
  the repository has none, and reusing one generic photo for all three would
  state something false about the products. The rows use a form-derived visual
  instead, so an injection and a tablet still read differently. Replacing it
  with real photography later is a content change, not a structural one.
- All catalogue copy, doses and claims remain fictional prototype content.

## Testing

- No `test` command and no unit runner are configured, and this feature must not
  install one. The pure completion and selection logic is checked through strict
  TypeScript, a scratch runtime script against the built schema module,
  `pnpm check` and `pnpm build`.
- `AGENTS.md` declares `Browser tests: pnpm test:browser`, so the behavioral
  done-whens get focused Playwright coverage:
  - answering all eight questions reaches the completion screen;
  - the treatment chosen at question 8 is the one the session reports, and the
    continue action named it;
  - an invalid edit to an earlier answer is refused and writes nothing, so the
    funnel cannot lose a saved answer while still reporting completion;
  - changing the treatment at question 8 rewrites the carried id.

  Note: a saved answer cannot be cleared through the UI, because continuing
  without a valid answer is blocked. Completion going back to false therefore
  only arises from an answer map that stops validating, which the step 1 runtime
  assertions cover directly on the pure function.
- Keep out of the harness what it cannot observe: fidelity against the two
  artboards, and the celebration mark's motion.
- Run `pnpm check` after each step, and `pnpm build` plus `pnpm test:browser`
  for the completed feature.
- Direct browser verification covers both screens against their artboards at
  desktop and mobile, keyboard reachability of the row and its link separately,
  one `h1` per page, no horizontal overflow, 200 percent zoom, reduced motion,
  and console output.
- The manual try path is: start at `/questionnaire`, answer through to question
  8, pick Wegovy, confirm the action names it, continue to completion, then go
  back to question 4, unpick the answer and confirm continue is refused and
  nothing was lost, then return to question 8 and change the treatment.

## Notes for the AI

- The two facts this feature writes are what Feature 9 will trust. Get Step 1
  reviewed before any screen is built; a completion flag that can drift is worse
  than no completion screen.
- Do not add a way to set `completed` directly. If a step seems to need one,
  stop and raise it.
- Use Svelte 5 runes and strict TypeScript. Reuse the existing shell, service,
  routes and renderers; add no second state path.
- Questionnaire components consume `QuestionnaireService`, never raw schema
  fixtures, the catalogue, or `sessionStorage`. The service is what reads the
  catalogue for question 8.
- Keep every route SSR-safe. Selection and completion are browser state,
  restored after mount as every other questionnaire screen does.
- Do not transcribe the reference's em dash in the congratulation headline;
  rewrite it, per the writing rule in `coding-standards.md`.
- The completion pills must not claim a clinical outcome. "Eligibility checked"
  in the reference reads as a verdict; say that the profile is complete and with
  a clinician, not that anyone passed.
- Use semantic tokens and stock Tailwind scales only.
- Landing-page buttons were just reduced to the compact pill; the questionnaire
  deliberately keeps the large action. Do not unify them.
