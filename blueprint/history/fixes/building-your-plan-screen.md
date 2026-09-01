# The building-your-plan screen

**Type:** Fix
**Status:** verified

## The problem

Pressing Continue on the last question freezes the button for the whole wait. In
`src/routes/(questionnaire)/questionnaire/[step]/+page.svelte:198-205`, `send()`
submits the anamnesis, then **waits for the recommendation read too**, and only
then navigates:

```
submitting = false;
preparing = true;
recommendation = await fetchRecommendation(fetch, result.uid);
questionnaireSession.recordSubmission(result.uid);
await goto(questionnaireStepHref(COMPLETION_STEP_ID));
```

While `preparing` is true the button reads "Preparing your plan"
(`SurveyStepScreen.svelte:303`) and is disabled. The recommendation is over a
megabyte of catalogue graph read server-side, so that is seconds spent looking at
a dead button on the question the visitor has already answered.

The current order was a deliberate choice, and its reasoning is in the code:
landing on the choice screen and only then showing "Preparing your plan." would
"spend the same seconds twice as visibly". This fix reverses that call. The
seconds are unavoidable, so they get a screen that says what is happening instead
of a frozen control.

## The fix

**Variant B, chosen by the user.** The submission stays on the question step,
where the 400 validation path already lives and belongs. What moves is the
recommendation read: the screen is entered as soon as the anamnesis uid is in
hand, and the read happens there, behind a screen that shows its progress.

Reference: `We're building your plan` with a ticking checklist, **without the
named-doctor line** (the user's decision). Built from this project's own tokens
and primitives, not ported.

The mechanism is already in place. `recordSubmission` sets the uid, which makes
every step resolve forward to the completion screen, and `RecommendationScreen`
already fetches for itself when it arrives without a prefetch
(`RecommendationScreen.svelte:66-78`). So this fix mostly **removes** the
prefetch and gives the screen's existing loading state a real design.

**Two copy decisions to review, because both could mislead.**

1. The reference's second item is "Checking your eligibility". Nothing here
   checks eligibility: `project-overview.md` records that the questionnaire never
   judges, and approval happens in RxScale's doctor review. Proposed instead, and
   true of what the two waits actually are:
   - "Your answers are with our clinical team" - done on arrival, because the
     submission completed on the previous screen
   - "Matching treatments to your profile" - active until the recommendation
     returns
2. **The ticks are bound to real events, not to a timer.** A staged animation
   would be inventing progress. The read takes seconds against the live service,
   so the screen should not flash; if it turns out to flash on a fast response,
   that is a separate decision about a minimum display time, not something to
   pre-empt with a fake delay here.

Must not break:

- **The 400 path.** A validation failure must still keep the visitor on the
  question with nothing saved. It stays on the question step, untouched.
- **One anamnesis per session.** `send()` still returns early when a uid is
  already held.
- The no-plans and unreachable-recommendation screens, both covered by
  `e2e/recommendation-states.spec.ts`.
- Back from the recommendation, which leaves the questionnaire rather than
  bouncing.

## Build steps

### Step 1 - the screen, behind the existing loading state  - [x]

- Add the copy to `recommendation-content.ts` under a `building` key.
- Add `BuildingPlanScreen.svelte` in `src/lib/features/questionnaire/`: the
  display headline and the two-item checklist, each item either done or waiting,
  on this project's tokens.
- Render it in `RecommendationScreen.svelte` in place of the
  `{#if loading}` one-liner at line 216. **The eyebrow and the "Choose your
  treatment" headline move inside the `{:else}`**: today they sit above the
  loading line, which asks someone to choose from a list that is not there yet.
- The waiting item needs a live region, so a screen reader is told what is
  pending rather than watching a silent list.

Done first, so the screen exists before anything starts relying on it. Reachable
already through a deep link that arrives without a prefetch.

**Done when:** entering the completion step without a prefetched recommendation
shows the new screen, the first item reads as done and the second as waiting, and
the plan list replaces it when the read returns.

### Step 2 - move the wait off the button  - [x]

- `send()`: drop `preparing` and the prefetch, record the uid and navigate.
- Drop the now-unused `recommendation` state and the `prefetched` prop it fed,
  along with the "Preparing your plan" button label and the `preparing` prop
  threaded through `SurveyStepScreen`. No caller means dead code, which
  `coding-standards.md` does not allow to linger.

**Done when:** pressing Continue on the last question leaves the question screen
as soon as the submission returns, the building screen carries the recommendation
wait, and a 400 still keeps the visitor on the question with the error shown.

## Verify

- `pnpm build` before the commit, and `pnpm test` green (the plan-choice logic is
  untouched, so no new unit tests; the screen is UI and the flow is browser work).
- `pnpm test:browser` green, especially `recommendation-states.spec.ts`,
  `questionnaire-submission.spec.ts` and `journey.spec.ts`, which walk the
  submission and both non-plan answers.
- In the browser against the fixture: answer through to the last question, press
  Continue, and watch where the wait is spent. Then force the 400 path and
  confirm the visitor stays on the question.
- Check the screen at 390px and 1280px, and confirm the live region announces the
  waiting item.
