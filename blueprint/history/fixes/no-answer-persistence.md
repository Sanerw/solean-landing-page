# The questionnaire stores nothing

**Type:** Fix

**Status:** verified

**Branch:** `fix/no-answer-persistence`

## The change

Answers, the submitted anamnesis uid and the chosen plan were written to
`sessionStorage` so a reload could resume the walk. They no longer are. All three live in
one module in memory, and a reload starts the questionnaire over.

The reason is the data: the questionnaire carries real personal and medical answers, and the
guarantee worth making is that they exist in the page asking for them and in the submission,
nowhere else. Feature 11 built the resume deliberately; this reverses that decision on
purpose rather than by accident.

## What the user decided, and what it costs

Asked directly, with the cost stated, and answered: **remove all three keys**, not just the
answers.

| | Before | After |
| --- | --- | --- |
| Reload mid-questionnaire | resumes where it left off | starts over |
| Reload after the submission | the order screen | starts over |
| Moving between steps | kept | kept, because that is a client-side navigation |
| Anything in `sessionStorage` | three `solean:` keys | none |

The cost is real and was accepted before the work started: a person who reloads after the
submission cannot reach the order screen again. The anamnesis exists at RxScale either way,
and walking the questionnaire a second time files a second one. Nothing in the app can
detect or prevent that, because detecting it would mean storing something.

## The fix

### [x] Step 1 - the storage layer goes

`answer-storage.ts` and `answer-storage.test.ts` deleted outright: every function in them
existed to read or write `sessionStorage`.

`survey-state.svelte.ts`: the keys, the loads, the saves and `dropStaleKeys` are gone. The
`onValueChanged` listener now only bumps the revision. `RecommendationChoice` moved here,
since the module that owned it no longer exists. `forgetAnswers` empties `survey.data`
rather than removing a stored copy.

The version rule survives in memory: `surveyFor` still rebuilds the survey when the
questionnaire identifier or version changes, so answers to an old model cannot carry into a
new one.

### [x] Step 2 - the harness walks instead of seeding

38 seeding calls across 9 specs had nothing left to seed. `e2e/answers.ts` was rewritten
around `walkTo(page, step)`, which answers its way to a step through the same validation,
branching and navigation a visitor goes through, and `walkAndSubmit` for the whole thing.

Two things needed more than a helper swap:

- **The recommendation outcome** was selected by a seeded uid. The fixture now reads a
  marker off the answers and puts it in the uid it answers the submission with, which is the
  same idiom the submission failures already used.
- **The submission failure marker** moved from the e-mail (question 1) to the last
  question's free text. The retry test has to correct the answer that carries it, and going
  back to an earlier question means reloading, which now discards the walk.

### [x] Step 3 - the specs that proved the old rule now prove the new one

Three tests asserted persistence and were inverted rather than deleted, because the
behaviour they cover still matters in the opposite direction:

| Was | Is |
| --- | --- |
| `answers survive a refresh` | `a refresh starts the questionnaire over` |
| `the answers are stored under the questionnaire and its version` | `nothing a visitor answers is written down` |
| `leaving takes the answers with it, and keeps what a return needs` | `leaving takes everything with it` |

`a reload after the submission starts the questionnaire over` is new, and states the accepted
cost as a test so it cannot be lost by accident.

Deleted as unreachable: `a seeded resume opens the step those answers reach`, `a resumed
session reaches the step its answers justify`, `a new version of the model discards the
answers to the old one` (nothing is written, so there is nothing to discard), and `reaching
the end is not the same as having sent it` (a deep link to `complete` now arrives with no
answers at all, which `the completion screen is not a place you can jump to` already covers).

### [x] Step 4 - the plans and the comments follow

`project-overview.md` and `project-plan.md`: the data model said answers live in
"SSR-safe `sessionStorage`". Both now say the browser stores nothing.

`RecommendationScreen.svelte`: comments only. The `answersHeld: false` branch, which shows
"Your checkout has already been opened", is now reachable only when a browser restores the
page alive from its back-forward cache. **The code was kept deliberately.** A probe showed
Chromium reloading instead, which lands at the first question, but Safari and Firefox may
restore it, and there the screen still prevents a second order. The comments say so rather
than continuing to describe a path a reload can take.

## Verify

- `pnpm check` - 1201 files, 0 errors
- `pnpm test` - 17 passed (was 24; the 7 that went were the deleted storage module's)
- `pnpm test:browser` - 71 passed, up from 48s to 1.6m because every test now walks
- `pnpm build` - clean
- Observed directly: after a reload `sessionStorage` holds only SvelteKit's own two keys.

## What this leaves open

- **A reload mid-questionnaire lands on `page27`, not `page30`.** The first question asks for
  an e-mail and requires nothing, so the "go where the answers reach" rule steps past it.
  Entering through `/questionnaire` still starts at `page30`. Making a reload always return
  to the first question would be a change to `resolveStepEntry`.
- A second submission from the same person is now possible and undetectable here. That was
  the accepted cost, not an oversight.
