# Feature: Own questions, mapped onto RxScale - 24d, the flow switches over

**From build-plan:** feature 24d
**Status:** verified

## Goal

Make our questionnaire the one a visitor answers. The route stops fetching
RxScale's model and starts reading the definition 24a wrote, the components 24c
built, and the mapper 24b proved; the submission goes through that mapper behind
a completeness guard; and everything the fetched model needed is deleted.

This is the sub-feature that cannot land in halves. The moment `+layout.ts` stops
fetching, the step ids change, the renderers change, the validation changes and
every browser spec that walks the questionnaire changes with them. 24a, 24b and
24c existed so that this one is a change of wiring rather than a change of wiring
plus everything it wires.

At the end, `/questionnaire` walks our twelve screens, submits a payload RxScale
accepts, and `survey-core` survives only inside 24b's shadow.

## Design reference

No new design. The screens must look like what `/questionnaire` renders today,
which is what 24c's components were built to match:

- `blueprint/reference/EN Questionnaire 1 — About You.png` and that set.
- The live app before the switch: `pnpm dev`, `/questionnaire`.
- `/dev/definition` after 24c, which already renders our screens through the new
  components and is the closest thing to a preview of the result.

The seven added screens keep the plain treatment 24c gave them. Designing them is
24e's, and doing it here would hide a rendering regression inside a redesign.

## In scope

- `(questionnaire)/+layout.ts` and `+layout.svelte`: the fetch and its three
  entry failure states removed.
- `questionnaire/[step]/+page.ts` and `+page.svelte`: the step resolved from our
  walk, progress from our screen count, navigation over our steps.
- `questionnaire/+page.svelte`: the entry handoff onto our first screen.
- The submission: `toAnamnesisData` behind `missingRequired`.
- `answers.ts` repointed from `survey.data` onto `Answers`.
- Deleting the old path, and renaming `fields2/` to `fields/`.
- The browser suite moved onto our screen ids.

## Out of scope

- **Designing the added screens.** 24e.
- **Translating RxScale's refusals.** They render in German to an English
  visitor, which 24c made visible. Still a decision without an owner, recorded in
  `project-overview.md` open question 14 and not closed by a local edit here.
- **Changing what is submitted.** 24b fixed the payload and proved it; this
  sub-feature sends it, and any disagreement is a 24b defect rather than a licence
  to adjust the mapper.
- **The recommendation and checkout screens.** They take an anamnesis uid and an
  e-mail and neither changes shape. `RecommendationScreen` is untouched.
- **Clearing answers when a branch closes.** The mapper already refuses to send
  them. Removing them from the store would be a behaviour change nobody asked for.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

Steps 1 to 6 switch the app. `pnpm test:browser` is red from step 2 until step 9,
which is expected and is why the suite is not part of the unit gate: the app is
working in a browser throughout, and the specs are describing the old flow.

- [x] **Step 1 - The reading helpers, repointed.** Rewrite
  `features/questionnaire/answers.ts` so `readWeightKg`, `readEmail` and the
  weight screen's href read `Answers` instead of `survey.data`, and repoint
  `reminder-client.ts` with them: it takes `AnswerData` today and calls
  `readEmail`, so it moves in the same step or the types split in two.
  **This step changes the live flow's imports**, unlike the rest of 24a to 24c, so
  the old route is edited here to keep compiling. That is the price of not
  maintaining two shapes of the same reader.
  *Done when:* `answers.test.ts` proves the weight is read from `weightKg`
  including a comma decimal, that a blank or unparseable value reads as null, and
  that the e-mail is trimmed and reads as null when empty; `reminder-client.test.ts`
  still passes unchanged in what it asserts. `pnpm check` and `pnpm test` green.

- [x] **Step 2 - The route reads our walk.** `+layout.ts` stops fetching and
  returns only what the layout still needs; `+layout.svelte` loses the three
  failure states; `[step]/+page.ts` validates the step id against our screens and
  interludes; `[step]/+page.svelte` builds the walk from the answer store,
  resolves entry, and renders `ScreenView`. The submission is still the old call
  with the old data shape in this step, so the diff is navigation only.
  *Done when:* `pnpm dev`, `/questionnaire` redirects to `/questionnaire/about-you`,
  the four questions render through the new components, Continue advances to the
  projection interlude and then to `your-details`, and Back returns. Zero console
  errors. `pnpm check` and `pnpm test` green.

- [x] **Step 3 - Progress, entry and deep links.** Progress counts our screens,
  the entry page hands off to our first screen, and a step the answers do not
  justify redirects to the furthest reachable one.
  *Done when:* the bar reads "1 of 8" for a blank male walk and "1 of 12" once
  the answers open the extra screens; visiting `/questionnaire/disclaimers`
  directly on a fresh load lands on `about-you`; and a reload mid-walk starts
  over, which is the documented no-persistence behaviour.

- [x] **Step 4 - The submission.** The last Continue maps the answers through
  `toAnamnesisData` and posts them, with `missingRequired` checked first: a
  non-empty result blocks the send and is reported, because it means our branching
  and theirs disagree and the 400 is predictable rather than surprising.
  *Done when:* a full walk against the fixture reaches the recommendation screen
  with a real uid; and a unit test proves the guard blocks a submission when
  `missingRequired` is non-empty, without calling the network.

- [x] **Step 5 - The submission's failure states.** `SurveyStepScreen` carried the
  rejected and unavailable alerts, and `ScreenView` does not: 24c built it for
  validation, not for a network failure. Put them on the route's last screen,
  reusing the existing `q_submission_rejected_*` and `q_submission_failed_*`
  messages, so nothing about what a visitor is told changes.
  *Done when:* a walk whose e-mail is `TRIGGER-400` shows the rejection alert with
  RxScale's own messages and stays on the screen with the answers intact; one with
  `TRIGGER-502` shows the retry alert; and the Continue button reads "try again"
  after either, as it does today.

- [x] **Step 6 - Delete the old path.** Remove `steps.ts`,
  `survey-state.svelte.ts`, `SurveyStepScreen.svelte`, `question-registry.ts`,
  `survey-model.ts`, `fields/`, `fetchQuestionnaire` and its types from
  `anamnesis-client.ts`, `/dev/questionnaire`, and `/dev/definition`. Rename
  `fields2/` to `fields/` in the same step, which is the commit where the name is
  free.
  *Done when:* `grep -rn "survey-core" src/` reports only `rxscale/shadow.ts` and
  `rxscale/contract.ts`; `pnpm check`, `pnpm test` and `pnpm build` are green; and
  the walk from step 2 still works in a browser.

- [x] **Step 7 - The browser walk helper.** Rewrite `e2e/answers.ts` onto our
  screen ids, keeping its exported API so the specs that only call `walkTo` need
  no other change. The fixture questionnaire model is no longer what the app
  renders, so the walk answers our twelve screens rather than the fixture's
  eleven pages.
  *Done when:* one spec that only uses `walkTo`, `LAST_STEP` and `COMPLETE_STEP`
  passes end to end: `pnpm test:browser e2e/questionnaire-flow.spec.ts`.

- [x] **Step 8 - The specs that assert on a screen.** Update the ten specs that
  name a model page id. **This is not a rename.** Several model pages collapse
  into one screen of ours: `page30` and `page27` are both `your-details`, and
  `page26`, `page3` and `page2` are all `about-you`, so an assertion about "the
  page that asks the date of birth" is now an assertion about one question on a
  shared screen.
  *Done when:* `pnpm test:browser` passes for `questionnaire-flow`,
  `questionnaire-integrity`, `questionnaire-interludes`, `questionnaire-submission`,
  `journey`, `reminder`, `checkout-handoff`, `analytics`, `accessibility` and
  `choice-wrapping`.

- [x] **Step 9 - The visual and coverage specs.** `questionnaire-types`,
  `questionnaire-viewport`, `screenshots` and `choice-wrapping` assert on the
  rendered controls, so they move with the components rather than only with the
  ids. Delete `questionnaire-model.spec.ts`, which tests the dev page for a model
  nothing fetches, and the fixture constants it alone used.
  *Done when:* `pnpm test:browser` is green in full. The screenshots this
  regenerates are **shown in the review, side by side with the ones on main**, and
  a difference is either explained or fixed. Accepting a regenerated screenshot
  because the suite went green is how a rendering regression ships as a new
  baseline.

## Files / areas

Changed:

| Path | Change |
| --- | --- |
| `(questionnaire)/+layout.ts` | the fetch goes; returns the layout's own data only |
| `(questionnaire)/+layout.svelte` | the three entry failure states go |
| `questionnaire/[step]/+page.ts` | validates against our screens and interludes |
| `questionnaire/[step]/+page.svelte` | the walk, progress, navigation, submission |
| `questionnaire/+page.svelte` | hands off to our first screen |
| `features/questionnaire/answers.ts` | reads `Answers`, not `survey.data` |
| `features/questionnaire/reminder-client.ts` | takes `Answers`; it reads the e-mail through the helper above |
| `features/questionnaire/anamnesis-client.ts` | `fetchQuestionnaire` and its types removed |
| `e2e/answers.ts` | the walk, on our screen ids |
| 14 specs under `e2e/` | screen ids and the assertions that moved with them |

Deleted: `steps.ts`, `steps.test.ts` if present, `survey-state.svelte.ts`,
`SurveyStepScreen.svelte`, `question-registry.ts`, `survey-model.ts`, `fields/`,
`src/routes/dev/questionnaire/`, `src/routes/dev/definition/`,
`e2e/questionnaire-model.spec.ts`.

Renamed: `fields2/` to `fields/`.

Unchanged: `RecommendationScreen.svelte`, `checkout-client.ts`,
`recommendation-client.ts`, the interlude components, `QuestionnaireShell.svelte`,
and everything under `rxscale/`, `definition/` and `answers/`.

**`isTrackablePath` needs no change and that is worth checking rather than
assuming.** It matches on the `/questionnaire/` prefix, which our screen ids keep,
so no `page_viewed` is sent for a questionnaire path before or after the switch.
The analytics rule survives the rename because it was written against the route,
not the ids.

## Data / contracts

**The submission body does not change.** `submitAnamnesis` already takes
`Record<string, unknown>`; what changes is where it comes from. 24b fixed and
proved that shape, so a payload disagreement discovered here is a 24b defect.

**`missingRequired` becomes a gate, not a report.** 24b built it and tested it;
this is the first caller. A non-empty result means our branching and RxScale's
disagree about which questions are required, and sending anyway produces a 400
the visitor cannot act on. Blocking with a plain message is honest; sending and
hoping is not.

**Step ids become our screen ids.** `about-you`, `weight-related-conditions`,
`your-details`, `medication-history`, `side-effects`, `pregnancy`,
`medical-conditions`, `gallbladder`, `health-history`, `eating-disorders`,
`allergies`, `disclaimers`, plus `projection`, `motivation` and `complete`. These
are URL segments a person can see and a spec can name, so they are load-bearing
from here on.

**The fixture stops serving a questionnaire.** `e2e/fixture-server.mjs` keeps its
submission, recommendation, checkout and Sanity endpoints, and its model endpoint
becomes dead weight the app never calls. Leave the endpoint in place rather than
removing it in this sub-feature: `pnpm check:model` and a future re-snapshot still
benefit from a local stand-in, and removing it would widen this diff for no gain.

## Testing

`pnpm test` is the gate and stays green throughout: every step's logic is pure or
already covered. `pnpm test:browser` is the evidence for steps 7 to 9 and is red
in between, which is the honest state of a suite describing a flow that no longer
exists.

| Module | Tested how |
| --- | --- |
| `answers.ts` | unit: comma decimals, blanks, an empty e-mail |
| the submission guard | unit: `missingRequired` non-empty blocks, with no network call |
| the submission failure states | browser: the two trigger addresses, per step 5 |
| the walk, progress, entry | browser, per step, plus the full suite at step 8 |
| the twelve screens | the existing specs, moved onto our ids |

**One new unit test is worth writing that did not exist before:** the guard in
step 4. Everything else this feature does is wiring already-tested parts together,
and the browser suite is what proves the wiring.

## Notes for the AI

- **Do not change the mapper, the definition or the components.** If a screen
  renders wrongly, the fault is in 24c and worth naming; if the payload is wrong,
  it is 24b. Reaching into either from here would hide which sub-feature was
  wrong.
- **Delete, do not comment out.** The old path is in git and the archives; a
  commented-out `SurveyStepScreen` would outlive everyone's memory of why.
- **`theirErrors` on submit only.** 24c gave `ScreenView` the prop precisely so
  the route decides when to call it. Calling it from a derived re-parses a 37 KB
  snapshot on every keystroke.
- **The store is browser-only.** `answers/store.svelte.ts` throws on a server
  write in development. The route must not read answers during SSR to decide
  anything; the current route already defers that to hydration and the reason is
  unchanged.
- **Expect the e2e diff to be large and boring.** That is the shape of this work.
  If a spec's assertion becomes hard to express on our screens, say so rather
  than weakening it: it may be pointing at a real difference between the old flow
  and the new one.
- **Comment the why.** The submission guard, the collapse of several model pages
  into one screen, and the fixture's now-dead model endpoint each deserve a line.
