# Feature: Submission and the recommendation screen

**From build-plan:** feature 12
**Status:** verified

## Goal

Send the answers to RxScale and show the person what happens next. The
submission creates a real anamnesis record a doctor will read, so every failure
path has to be honest: a rejected payload stays on the questionnaire with the
server's own messages, an unavailable validator offers a retry and says nothing
was saved, and neither reaches the congratulations screen.

On success the uid is kept for the checkout call feature 13 makes, and the
recommendation screen presents the one configured treatment.

## Design reference

- [Questionnaire 9 - Complete & Order](../reference/EN%20Questionnaire%209%20%E2%80%94%20Complete%20%26%20Order.png)
  - the celebration mark, an eyebrow counting the completed steps, the
    headline, two lines of body, three confirmation pills, the full-width
    "Place your order" action, and the trust line under it.
- `blueprint/reference/design-system.md` stays authoritative for tokens, type,
  spacing, radii and focus.

Two things the artboard does not settle:

- **Its eyebrow reads "ALL 8 STEPS COMPLETE" against a model with a different
  count.** That is a recorded reference defect, resolved in `project-plan.md`
  section 9 as "one count, from `steps[]`". The eyebrow is built from the plan.
- **It shows no treatment and no price.** The build plan requires the configured
  SKU here, and since Solean no longer has a checkout screen, this is the only
  place the reference prices in `project-plan.md` section 6 can appear. The
  summary block is an addition, built from the existing tokens, not a
  transcription.

## What the API dictates

Read from RxScale's own documentation and, where the documentation is silent,
from the live service.

| Fact | Source | Consequence |
| --- | --- | --- |
| `POST {base}/questionnaires/{uid}/submissions` with `{ "data": ... }`, `201` returning `{ "uid": "anam-..." }` | v4 reference | The payload is `survey.data` verbatim under one key. Nothing is renamed |
| Public: no API key | v4 reference | The call is made from the browser, like the model fetch. No server route, and none of feature 13's private key |
| `400` is either `{"error": ["...", "..."]}` (model validation) or `{"error": {"field": ["..."]}}` (malformed body). No record is created | v4 reference | Both shapes have to be read, and the messages shown are the server's |
| `502` means the validator was unreachable. No record is created | v4 reference | A retry is the correct offer, and "nothing was saved" is a true statement |
| `404` means the uid is not a questionnaire | v4 reference | Same failure the model fetch already reports |
| `/v4/anamnesis/questionnaires/{uid}/submissions` is **not routed** on `api.rxscale.com`: it falls through to object storage and answers `NoSuchBucket` | probed, GET, this session | The submission goes to the same prefix the model came from, which is configuration already |
| `/api/v2/...` and `/api/v3-1/anamnesis/questionnaires/{uid}/submissions` both answer `405 Method Not Allowed` to a GET | probed, GET, this session | The route exists on both prefixes and accepts only POST. It was never documented; the 405 is what proves it is there |

**Confirmed live on 2026-08-30, with your go-ahead, one submission:**
`POST /api/v3-1/anamnesis/questionnaires/{uid}/submissions` with `{ data }` built
by the engine from obviously fictional answers (Test Testpatient,
`integration-test@example.com`, BMI over 30, nothing declared) returned
**`201`** and `{"uid":"b326f1e3-70b3-414e-953e-62f149d8e104"}`. The contract the
app calls is the documented one.

**One difference from the documentation:** the uid is a bare UUID, not the
`anam-...` shape the v4 examples show. Nothing may depend on a prefix, feature 13
included. That record exists in your RxScale queue and can be deleted.

**Was unverified before that, and only a real POST could settle it:** whether the prefix we
actually call returns the v4 documented bodies for `400` and `502`. Step 6 asks
for one live submission with your go-ahead. Until then the fixture server stands
in for all three outcomes, and the code reads both documented `400` shapes plus
an unrecognised one.

## Open questions this closes

- **The `os-date-picker` value format.** Confirmed as `YYYY-MM-DD`. Feature 10
  already stores it that way, so nothing changes; the question stops being open.
- **Whether `/v4/anamnesis` is routed.** Answered above: it is not, and the
  submission follows the configured prefix. What the error bodies look like there
  narrows to step 6.

## In scope

- `submitAnamnesis` on the existing client, with a result union covering
  accepted, rejected, unknown questionnaire and unavailable
- The submission fired by the last question's Continue, once, with a pending
  state, and never repeated once a uid exists
- The 400 and 502 screens, both keeping the person inside the questionnaire
- The anamnesis uid held in the session and in `sessionStorage`, so a refresh on
  the recommendation screen does not resubmit
- The completion step reachable only with a uid
- The recommendation screen: the configured treatment, the reference price lines,
  the confirmation pills, and a "Place your order" action that is present and
  visibly inert until feature 13
- The fixture server answering the submissions endpoint, so the harness can walk
  all three outcomes

## Out of scope

- The checkout call, the redirect and the private key (feature 13)
- Clearing the stored answers. The checkout payload reads the e-mail answer, so
  the session has to outlive the submission. Feature 13 ends it. See the note
  under Data
- Any recommendation computed from the answers: one configured treatment,
  no catalogue query, no live stock
- The `file` and `signaturepad` payload shape, which this questionnaire does not
  contain

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - The call, and something to call** - `submissionsUrl(uid)` beside
  the existing `questionnaireUrl`, `submitAnamnesis(fetch, uid, data)` returning
  the result union below, and the fixture server answering
  `POST /questionnaires/:uid/submissions`: `201` with a uid normally, and, when
  any submitted answer contains `TRIGGER-400` or `TRIGGER-502`, the documented
  `400` or `502` instead. The harness types the marker into the fixture's optional
  e-mail question, so no question exists only for testing. No UI yet. *Done when:* against `pnpm fixture:questionnaire`,
  curl gets a `201` and a uid, a `400` with an `error` array, and a `502`, and
  `pnpm check` passes.

- [x] **Step 2 - The last Continue submits** - Advancing from the last question
  posts instead of navigating: the action shows a pending state and cannot be
  pressed twice, the returned uid is held in the session and written to
  `sessionStorage`, and only then does the completion step open. *Done when:* the
  fixture walk ends on `/questionnaire/complete`, the uid is in `sessionStorage`
  under its own key, and the network panel shows exactly one POST.

- [x] **Step 3 - Once it is sent, the walk is over** - The reachability rule
  extended in both directions: the completion step opens only with a uid, and
  while a uid exists every questionnaire step and the entry page resolve to the
  completion step instead. Editing an answer after the doctor has the anamnesis
  would put a different questionnaire on screen than the one submitted, and there
  is no second submission to reconcile it. *Done when:* deep-linking `complete`
  without a uid still redirects into the questionnaire, and with a uid in session
  `/questionnaire`, `/questionnaire/page3` and a reload of the completion screen
  all land on the completion screen without posting again.

- [x] **Step 4 - A rejected submission stays put** - The `400` path: both
  documented body shapes read, the messages listed verbatim on the step that
  submitted, nothing advancing, and the action offering another attempt. *Done
  when:* an e-mail answer of `TRIGGER-400` makes the fixture reject the
  submission, the server's messages appear on the last step, the URL does not
  change, and no uid is stored.

- [x] **Step 5 - An unavailable validator says so** - The `502` and
  network-failure path: one message stating that nothing was saved, and a retry
  that submits again. *Done when:* an e-mail answer of `TRIGGER-502` shows that
  state, retrying against a healthy fixture succeeds and moves on, and a
  submission attempted with the fixture unreachable reports the same thing rather
  than hanging.

- [x] **Step 6 - The recommendation screen** - The artboard's screen replacing
  the placeholder at `/questionnaire/complete`: celebration mark, an eyebrow
  counting the plan's own questions, headline, body, the three pills, the
  configured treatment with the reference price lines, the trust line, and a
  "Place your order" action that is present and disabled with a line saying the
  handoff arrives next. *Done when:* `/questionnaire/complete` after a walk
  matches the artboard's structure, the eyebrow states the real question total
  rather than eight, the treatment name and prices come from the catalogue and
  config, and the action is visibly not yet wired.

- [x] **Step 7 - The harness, and one real submission** - Browser coverage for
  the three outcomes and the uid's survival across a reload, then, with your
  explicit go-ahead in the chat, exactly one live submission against the real
  questionnaire to confirm the contract the app actually calls. *Done when:*
  `pnpm test:browser` is green including the new specs, `pnpm check` and
  `pnpm build` pass, and either the live `201` and its uid are recorded here or
  the step notes that you declined and the contract stays unconfirmed. Nothing
  about that submission, including the uid, goes anywhere but this file.

## Files / areas

| Path | Change |
| --- | --- |
| `src/lib/config/rxscale.ts` | `submissionsUrl(uid)`, from the same base and prefix as the model fetch |
| `src/lib/config/treatment.ts` | new: which catalogue treatment the recommendation presents |
| `src/lib/features/questionnaire/anamnesis-client.ts` | `submitAnamnesis` and its result union |
| `src/lib/features/questionnaire/answer-storage.ts` | the anamnesis uid key beside the answers key |
| `src/lib/features/questionnaire/survey-state.svelte.ts` | the uid held for the session |
| `src/lib/features/questionnaire/steps.ts` | the completion step gated on the uid |
| `src/lib/features/questionnaire/SurveyStepScreen.svelte` | the pending state and the submission's own failure block |
| `src/lib/features/questionnaire/RecommendationScreen.svelte` | new: the artboard's screen |
| `src/routes/(questionnaire)/questionnaire/[step]/+page.svelte` | submit on the last step, render the recommendation |
| `e2e/fixture-server.mjs` | the submissions endpoint and its three outcomes |
| `e2e/questionnaire-submission.spec.ts` | new: accepted, rejected, unavailable, and the reload |

## Data / contracts

**The submission.** One key, the engine's own data, nothing renamed.

```ts
export type AnamnesisSubmission =
	| { ok: true; uid: string }
	| { ok: false; reason: 'rejected'; messages: string[] }
	| { ok: false; reason: 'not-found' }
	| { ok: false; reason: 'unavailable' };

export function submitAnamnesis(
	fetch: Fetch,
	uid: string | null,
	data: AnswerData
): Promise<AnamnesisSubmission>;
```

`rejected` carries whatever the server said, flattened from either documented
`400` shape and never invented: if the body is unreadable the list is empty and
the screen says so in its own words.

**The uid.** Load-bearing for feature 13, which cannot place an order without it.

```
sessionStorage["solean:anamnesis:<identifier>@<version>"] = "<uid>"
```

Same identifier and version as the answers key, dropped by the same
stale-version sweep, so a new model cannot pair old answers with a live uid.

**Why the answers stay.** `project-overview.md` says answers are discarded once
the submission succeeds. Feature 13 reads the e-mail answer to build
`buyerIdentity`, so discarding them here would break the checkout. This feature
keeps them and feature 13 ends the session at the redirect. Worth correcting in
the plan when you next touch it.

**The screen's seam.** `SurveyStepScreen` does not learn how to submit. It gains
two props and stays a renderer:

```ts
	/** True while the submission is in flight: the action waits, nothing navigates. */
	submitting?: boolean;
	/** The submission's own failure, which belongs to the step, not to a question. */
	submission?: { kind: 'rejected'; messages: string[] } | { kind: 'unavailable' } | null;
```

`onvalid` may return a promise, so the route can await the post before deciding
where to go.

**Reachability.** The completion step joins feature 11's rule with one extra
condition: it opens only when the session holds a uid. That is what stops a
refresh, a deep link or a Back-then-forward from showing a congratulations screen
for a submission that never happened.

## Testing

No unit runner is configured, so no step ships a unit test, and the browser
harness plus the fixture server carry the evidence. `submitAnamnesis`'s response
reading is the clearest unit-test candidate this project has yet produced; `/tests`
is still one command away if you want that gate before this feature rather than
after it.

| Claim | Evidence |
| --- | --- |
| The payload matches the documented contract | The fixture server asserts the `{ data }` shape and the harness walks it |
| A rejected submission does not advance and shows the server's words | Browser spec on the `TRIGGER-400` marker |
| An unavailable validator is reported as saving nothing | Browser spec on the `TRIGGER-502` marker |
| Nothing is submitted twice | Browser spec: reload the recommendation screen, count the requests |
| The recommendation screen matches the artboard | Screenshot against the reference, through `/check` or `/try` |
| The real endpoint behaves as documented | One live submission in step 7, with your go-ahead, recorded here |
| Nothing regressed | `pnpm check`, `pnpm build`, `pnpm test:browser` |

## Notes for the AI

- **This sends real medical answers to a real service.** The payload, the uid and
  the response never reach console output, analytics or an error report, in
  development or production.
- **Never submit twice.** A uid in the session means the anamnesis exists; no
  code path may post again for it.
- **Never fake a success.** No optimistic navigation, no local uid, no
  "submitted" state that a failure could leave behind.
- **The server's messages are the server's.** Show them verbatim and do not map
  them onto fields: the model validates page by page in the browser already, so a
  400 means the two disagree, and guessing which question it meant would hide
  that.
- **Do not POST to the live API while building.** The fixture server is the
  target until step 7, which asks first.
- **A reload mid-flight can still double-submit, and nothing here can prevent
  it.** The public endpoint takes no idempotency key: only external submissions
  have `external_identifier`. The uid guard closes every case the browser can
  see; a request already in flight when the tab reloads is not one of them. Say
  so rather than implying the guard is total.
- Conventions: runes only, `$lib` imports, kebab-case modules, no `any`, semantic
  tokens, stock Tailwind scales.
