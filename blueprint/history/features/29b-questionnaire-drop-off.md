# Feature: Questionnaire drop-off (29b)

**From build-plan:** feature 29b
**Status:** verified

## Goal

Show where people leave the questionnaire. The funnel has four events today and
twelve screens, so Mixpanel can say how many started and how many submitted, and
nothing at all about the ten screens in between. One event per screen entry
closes that, and it is the cheapest useful analytics this project can add: it
turns "half of them vanish" into a named question that loses them.

`questionnaire_progressed` carries the screen's id, its number and the walk's
total. A Mixpanel funnel is then built from one event filtered by `screen_id` at
each step, and the drop between two steps is the people who saw one screen and
never reached the next.

## The rule this rewrites, and why it was already stale

The build plan wrote this feature as "never a screen id", inheriting the rule
`isTrackablePath` states: a questionnaire path is derived from what somebody
answered, so it is an answer in disguise. **The user overruled that on 2026-09-14**,
and two facts made it the right call rather than a concession.

- **The screen id already travels, in two places.** Mixpanel's own
  `$mp_web_page_view` has carried the full questionnaire URL since heatmaps were
  turned on, accepted knowingly on 2026-09-03; and our own
  `questionnaire_started` carries `entry_step_id`, which is a screen id, and has
  since it was written. This feature makes the funnel consistent with what the
  project already sends rather than opening a new channel.
- **The number alone answers a weaker question.** Four of the twelve screens are
  conditional, so a walk is between eight and twelve screens long and screen five
  is a different question for different people. A report built on the index says
  how far somebody got; it cannot say what stopped them, which is the only version
  of this worth building.

What may never travel did not move: **no answer value, no anamnesis uid, no
medication, no dose.** A screen id names the question asked, never the reply.

## In scope

- `questionnaire_progressed` in `events.ts`, with a per-screen one-shot.
- One call from the questionnaire route, on screen entry.
- The documentation that still says a screen id may not travel.
- Browser proof that the ids arrive in order and carry no answer.

## Out of scope

- The cart's distinct id (29c) and the experiments (29d).
- Interludes and the completion screen. An interlude asks nothing and has no
  screen number; the completion screen already has `anamnesis_submitted` and
  `checkout_started` on it.
- Time on screen, which would need a second event or a duration property, and
  is a separate question from where people leave.
- `isTrackablePath` and `page_viewed`, which keep their current rule: our page
  views still name no questionnaire path.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - the event and its guard** - `trackQuestionnaireProgressed(screenId,
  screenNumber, screenTotal)` in `events.ts`, sending `questionnaire_progressed`
  with `screen_id`, `screen_number` and `screen_total`. The event name stays one
  constant, never composed. Guard it with a `Set` of screen ids of its own rather
  than the existing name-keyed `sent`, and mark a screen spent only once `track`
  accepted it, so a visitor who consents mid-walk is still recorded from there on.
  *Done when:* `events.test.ts` covers the exact property set, one event per screen
  however many times it is called, a screen not spent when the gate refused it, and
  two different screens each sending; `pnpm test` green and nothing user-facing
  changed.

- [x] **Step 2 - the call site** - send it from the effect in
  `(questionnaire)/questionnaire/[step]/+page.svelte` that already sends
  `trackQuestionnaireStarted`, so it inherits that effect's dependency on the
  consent decision and its `hydrated && !redirecting` guard. Fire only for a step
  whose `kind` is `screen`, reading `screenNumber` off the walk step and
  `screenTotal` off the walk, so the numbers are the ones the progress bar shows
  and cannot be counted a second way. *Done when:* walking the questionnaire with
  consent granted sends one event per screen entered, in order, with the ids of the
  screens actually shown; a declined walk sends none; going back and forward again
  does not repeat one; `pnpm verify` green.

- [x] **Step 3 - browser proof** - extend `e2e/analytics.spec.ts` with a consented
  walk that asserts on the intercepted traffic: `questionnaire_progressed` arrives
  for `about-you` then `your-details` then `medication-history` in that order, each
  carrying a `screen_number` matching its position and the same `screen_total`; and
  that no payload carries a typed answer, the date of birth, or a diagnosis label.
  *Done when:* `pnpm test:browser` green for `analytics.spec.ts`, including the
  existing assertions that no `$mp_click` from a questionnaire path carries an
  `$attr-` key.

- [x] **Step 4 - the documentation** - update `AGENTS.md`: add the event to the
  current-events list, and rewrite the `isTrackablePath` bullet so it says what is
  true after this feature, that the rule governs `page_viewed` alone while the
  funnel events name the screen deliberately, with the date and the reasoning above.
  *Done when:* no sentence in `AGENTS.md` or `events.ts` claims a screen id may not
  travel, and `pnpm verify` green.

## Files / areas

| Path | Why |
| --- | --- |
| `src/lib/analytics/events.ts`, `events.test.ts` | the event, its per-screen guard, its test |
| `src/routes/(questionnaire)/questionnaire/[step]/+page.svelte` | one call in the existing analytics effect |
| `e2e/analytics.spec.ts` | the browser proof |
| `AGENTS.md` | the rule that still forbids a screen id |

## Data / contracts

**Read, not redefined.** `Walk` in `definition/screens.ts` already holds
`screenTotal`, and a `screen` step already holds `screenNumber`. Both come from
`buildWalk`, which is the single source of the progress the bar renders, so the
event cannot disagree with the screen the visitor is looking at.

| Property | Source | Note |
| --- | --- | --- |
| `screen_id` | `WalkStep.id` | our own stable id, for example `medication-history` |
| `screen_number` | `WalkStep.screenNumber` | 1-based, screens only; an interlude never has one |
| `screen_total` | `Walk.screenTotal` | 8 to 12, because four screens are conditional |

**Never:** an answer value, the anamnesis uid, the medication, the dose, the
Shopify variant.

**One honest limit, stated because a report will show it.** Nothing is sent
before consent, so a visitor who answers the banner on screen four is recorded
from screen four on. The early screens therefore undercount slightly against
`questionnaire_started`, which has the same property and the same cause.

## Testing

`pnpm verify` is the gate. `pnpm test:browser` is run for step 3 and is
deliberately outside it.

In-scope logic:

- the exact property set of `questionnaire_progressed`
- one event per screen, however many times the effect re-runs
- a screen not marked spent when the consent gate refused it
- two different screens each sending their own event

Out of scope for unit tests, per `coding-standards.md`: the effect and the screen
itself, which ride on step 3 and a manual walk.

**Manual check no test can make:** build the funnel in Mixpanel from
`questionnaire_progressed` filtered by `screen_id` per step, and confirm the drop
between two steps matches what the walk actually shows. The spec proves the
payload; only the panel proves the report is readable.

## Notes for the AI

- The event name is one constant. The per-screen guard key is not an event name
  and may be composed, but keep it in its own `Set` so nothing about the
  name-keyed one-shot changes.
- Fire on entry, not on Continue. Somebody who opens a screen and abandons it is
  exactly the person this feature exists to count, and a Continue-shaped event
  would miss them.
- Do not touch `isTrackablePath` or `trackPageView`. Our own page views still
  name no questionnaire path, and that rule is unaffected by this feature.
- `client.test.ts` asserts every privacy-bearing SDK flag. This feature needs
  nothing from `mixpanelInitOptions`; if a step wants to touch it, stop and say so.
- No em dashes in code, comments or documentation, per `coding-standards.md`.
