# Feature: Experiments (29d)

**From build-plan:** feature 29d
**Status:** verified

## Goal

Make marketing copy testable from the Mixpanel panel without a deploy. A variant
is chosen per visitor, the choice is reported once consent stands, and the
existing funnel events say which variant converts.

Built now and knowingly ahead of its use, decided by the user on 2026-09-14: the
site is not launched, so there is no traffic to run a test against yet. It is to
be ready on the day there is.

## What the pre-consent fetch does and does not buy

The build plan says a test covering only consenting visitors "would measure a
subset". That is the reason recorded for fetching flags before the banner is
answered, and it is worth stating precisely, because the plainest reading of it
is wrong.

**A visitor who declines sends no events, ever.** They contribute nothing to a
result whether or not they were assigned a variant, so fetching early does not
enlarge the measured population.

**What it actually fixes is the late consenter.** Somebody who answers the banner
on questionnaire screen four has, by then, already seen a hero. Without an early
fetch they are bucketed at the moment of consent, so the variant recorded against
them is not the one that was on screen when they decided to start. With it, the
assignment is made on arrival and holds for the session, and the exposure reported
at consent is the truth. On a funnel whose first screen is the thing worth
testing, that is the difference between a measurable experiment and a meaningless
one.

That is the trade being taken, and it is narrower than "all traffic".

## The design, and why it is not the SDK's own flags

The SDK has a flags module, and using it would mean loading the SDK before
consent, because `mixpanel.flags` lives inside the bundle this project imports
only once somebody has agreed. That would put sixty kilobytes of vendor code on
the page of a visitor who then declines, which is the one guarantee this project
has made loudest.

Read from the SDK source instead: its flag fetch is a plain, tokened `GET`.

    GET {api host}/flags/?context={"distinct_id":...,"device_id":...}&token=...&mp_lib=web
    Authorization: Basic btoa(token + ':')
    -> { "flags": { "<name>": { "variant_key": ..., "variant_value": ... } } }

So this feature makes that one request itself, in about forty lines, and never
enables the SDK's `flags` config at all. One system rather than two, no vendor
bundle before consent, and nothing sent.

**Bucketing is by an id that lives in memory and is never stored.** Persisting an
identifier on someone's device before they have consented is precisely what the
banner exists to ask about, and a variant assignment is not strictly necessary.
An in-memory id also matches how this app already defines a session: the answers
live in one module and a reload starts the questionnaire over, so a reload being
a new assignment is the existing rule rather than a new compromise. Client-side
navigation keeps it, which covers the whole funnel.

The id decides only *which* variant. What the panel analyses is the exposure
event, sent under the SDK's own identity once consent stands, so a random
session id gives a valid split without touching the analysis.

## In scope

- A narrow flags client: one GET, no SDK, no events.
- A session-scoped variant store components can read, defaulting to the current UI.
- `$experiment_started` sent through the existing gate, once per experiment, so
  the panel's own Experiments report works.
- One real experiment, on the hero's primary call to action.
- The documentation this changes, which is a promise rather than a detail.

## Out of scope

- Questionnaire wording. It is medical copy with no clinical sign-off, which is
  open question 14 in `project-overview.md`. A test that shows half of the
  patients a sentence no clinician approved is not a copy test.
- The SDK's `flags` config, its persistence, and its first-time-event activation.
- Server-side assignment. The variant is a client concern here, and the default
  renders on the server so nothing flickers.
- Multi-variant maths, sequential testing, or any result reading. The panel does
  that, and it needs traffic this site does not have yet.

## Build steps

- [x] **Step 1 - the flags client** - `src/lib/analytics/flags.ts`: build the
  request URL and headers from `mixpanelToken()` and `mixpanelApiHost()`, parse
  the response into a `Map<string, string>` of experiment name to variant key, and
  answer an empty map on any failure, a missing token, or the server. A network
  error here must be invisible: every caller falls back to the control. *Done
  when:* `flags.test.ts` covers the URL and the Basic header, a well-formed
  response, a malformed one, a non-200, a thrown fetch, and the no-token case;
  `pnpm test` green and nothing user-facing changed.

- [x] **Step 2 - the variant store** - `flags.svelte.ts` holding the fetched
  variants as rune state plus `variantOf(experiment, fallback)`. Seeded with
  nothing, so server rendering and the first client frame both produce the
  fallback, which is the current UI. Started from the root layout, **not** behind
  the consent effect, and guarded to run once. *Done when:* a page renders
  identically to today with no flags configured and with a fetch that fails;
  `pnpm verify` green; no component reads it yet.

- [x] **Step 3 - the exposure event** - report the assignment through the
  existing `track`, as `$experiment_started` with `Experiment name` and
  `Variant name`, which are the property names the panel's report reads. One
  constant event name, one shot per experiment, marked spent only once the gate
  accepted it, the rule `events.ts` already follows. A declined visitor therefore
  sees a variant and reports nothing, which is the whole shape of this feature.
  *Done when:* `events.test.ts` covers one report per experiment, two experiments
  reported separately, and nothing sent without consent; `pnpm verify` green.

- [x] **Step 4 - no experiment, at the user's decision** - drafted as the hero's primary call
  to action and built that way, then unwired on review: the user chose to ship the machinery
  with nothing switched on. What the reversal left behind is better than what it removed.
  `assignment()` now answers the panel's variant **or null**, where before a reader folded a
  missing experiment into the `control` fallback, so a deployment with no experiment running
  sent a stream of `$experiment_started` about nothing. `EXPERIMENTS` is an empty registry that
  documents the three things a first experiment needs. *Done when:* the hero is byte-identical
  to before the feature, no message key is left behind, and no `$experiment_started` is sent by
  any page.

- [x] **Step 5 - the documentation** - rewrite what this makes untrue. `AGENTS.md`
  says a visitor who declines "never downloads the vendor's code at all" and that
  the refusal "is honoured by the network tab, not only by a flag inside a script".
  After this, one request leaves for a variant. Record it with its date, its
  reason, and the correction above about what it does and does not buy. Add the
  experiment section: how to add one, why questionnaire copy is excluded, and why
  the SDK's own flags module is deliberately off. *Done when:* no sentence in
  `AGENTS.md` overstates the refusal, and `pnpm verify` green.

- [x] **Step 6 - browser proof** - `e2e/analytics.spec.ts` rewritten rather than extended.
  The two tests asserting that nothing reaches Mixpanel before the banner is answered now
  assert that **only** the flags question does, which is the promise this feature narrowed. A
  new test proves the silence: with consent granted and no experiment wired, no
  `$experiment_started` is sent and the flags request is still made. The funnel's leak
  assertion was corrected on the way: it searched for the word `variant`, which
  `$experiment_started`'s own `Variant name` property matched, and which never proved anything
  about the Shopify variant id; it matches the id itself now and is stronger than before.
  *Done when:* `pnpm test:browser` green for `analytics.spec.ts`.

## Files / areas

| Path | Why |
| --- | --- |
| `src/lib/analytics/flags.ts`, `flags.test.ts` | new: the one request and its parsing |
| `src/lib/analytics/flags.svelte.ts` | new: the variants as rune state, and the reader |
| `src/lib/analytics/events.ts`, `events.test.ts` | the exposure event and its one-shot |
| `src/routes/+layout.svelte` | starting the fetch, outside the consent effect |
| `src/lib/features/marketing/HeroSection.svelte` | the one experiment |
| `messages/*.json` | the variant's copy, both languages |
| `AGENTS.md` | the promise this narrows |
| `e2e/analytics.spec.ts` | the proof, and the two tests this changes |

## Data / contracts

| Name | Shape | Note |
| --- | --- | --- |
| Experiment name | one constant per experiment | typed in one place, never composed, because the panel matches it literally |
| Variant key | string | the panel's own, with the fallback being the current UI |
| Bucketing id | random per session, in memory | never stored, never sent to our own server |

**What the flags request carries:** the token, the library name, and a context of
two ids that were generated in this tab and exist nowhere else. No path, no
answer, no e-mail. It is a question, not a measurement.

## Testing

`pnpm verify` is the gate. `pnpm test:browser` for step 6.

In-scope logic: the request builder, the response parser at each failure, the
variant reader's fallback, and the exposure one-shot. Out of scope for unit
tests, per `coding-standards.md`: the layout, the hero, and the SDK.

**What no test proves.** That the panel's Experiments report reads our
`$experiment_started`. The event name and its two property names are copied from
the SDK source, and only a real experiment in the panel confirms the report
populates. Worth doing once, with a throwaway experiment, before relying on it.

## Notes for the AI

- **The fallback is the current UI, in every branch.** Server rendering has no
  variant, the first client frame has no variant, and a failed fetch has none. If
  any of those renders something other than today's page, the feature flickers on
  every load for every visitor, which is worse than having no experiment.
- Do not enable `flags` in `mixpanelInitOptions`. It would fetch a second time,
  under a different id, and the two systems would disagree about the assignment.
- Do not persist the bucketing id anywhere: not `localStorage`, not a cookie, not
  the consent record. In memory is the decision.
- The exposure event goes through `track`, so it inherits the consent gate. Never
  send it another way.
- Never build an experiment or variant name from a variable.
- No em dashes in code, comments or documentation, per `coding-standards.md`.
