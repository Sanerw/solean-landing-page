# Feature: Mixpanel profiles and identity (29a)

**From build-plan:** feature 29a
**Status:** verified

## Goal

Give the analytics a person. Today every visitor is an anonymous `distinct_id` and
there is no People profile anywhere, so Mixpanel can count arrivals and checkouts
but cannot say who reached them or join a session to anything outside itself. This
adds first-visit profile properties and an `identify()` with the full e-mail
address at the one screen that asks for it, which is also the identity key
Customer.io already uses.

It reverses two rules this repository records as settled, so it rewrites both
rather than leaving the documentation contradicting the code:

| Rule today | After this feature |
| --- | --- |
| `AGENTS.md`: "There is no `identify()` or `reset()` anywhere, and there should not be" | `identify()` exists, once per session, at the details screen. `reset()` still does not: this app has no logout |
| `events.ts`: no e-mail may appear in any property | The e-mail is the `distinct_id` and a profile property. Answers, uid, medication and dose are unchanged and still never travel |

**The cost, named here because it is the reason this needed a decision.** Session
replay is on for every page including the questionnaire. Once a session is
identified, a recording of somebody answering questions about their health is
searchable in the Mixpanel panel by their e-mail address. Decided by the user on
2026-09-14, against the recommendation to identify by a hash of the address.
Mixpanel replays of the funnel should be treated as medical records: access
restricted, retention short.

## In scope

- Pure builders for the profile properties, with an exact key set.
- An identity seam in `client.ts` behind the same consent gate `track` uses.
- First-visit properties, queued at the first consented page view.
- One `identify()` per session, at the e-mail, beside the existing reminder call.
- The documentation rewrite in `AGENTS.md` and the `events.ts` header.
- Browser proof that the e-mail travels, that no answer travels with it, and that
  first-touch attribution is unblocked.

## Out of scope

- `questionnaire_progressed` (29b), the cart attribute (29c), feature flags (29d).
- The Shopify `orders/paid` webhook and the Mixpanel Import API. Deferred with
  feature 29 on 2026-09-14 and recorded in the build plan's backlog.
- Hashing the address. Offered, declined, recorded above.
- The privacy policy. It is a verbatim mirror of Solean's own document and cannot
  be amended here, for the reason `AGENTS.md` gives. The gap widens with this
  feature and stays open deliberately.
- Creating the Mixpanel cohort and wiring it into a Customer.io campaign. That is
  panel work in two products; this feature only guarantees both key on the same
  address, and says so in the documentation.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - the property builders** - a new `src/lib/analytics/identity.ts`
  holding two pure functions and no SDK: `profileTraits(contact)` mapping a
  `ReminderContact` to Mixpanel's reserved keys (`$email`, `$first_name`,
  `$last_name`, `$phone`), field by field and never by spread, omitting an
  unanswered field rather than sending it blank; and `firstVisitProperties(path,
  locale)`, which omits the landing path entirely when `isTrackablePath` refuses
  it, because a questionnaire path is an answer. *Done when:* `identity.test.ts`
  asserts the exact key set at every depth, that a blank field is absent rather
  than empty, and that a `/questionnaire/...` landing path yields an object with
  no path key; `pnpm test` green and nothing user-facing changed.

- [x] **Step 2 - the identity seam** - `identifyVisitor(distinctId, traits)` and
  `setProfileOnce(properties)` in `client.ts`, both refusing without
  `analyticsEnabled()` and `mayTrack(consent)`, both returning whether they were
  accepted, the way `track` does, and both routed through the existing `loading`
  promise so they cannot race the SDK import. Re-check consent at delivery, as
  `track` does, so a withdrawal during the import is honoured. *Done when:* the
  gate is unit tested through the returned boolean (no token, no consent, denied
  mid-flight), `pnpm verify` green, and no call site exists yet.

- [x] **Step 3 - first-visit properties** - call `setProfileOnce` from the root
  layout effect that already sends the page view, so it shares that effect's
  dependency on the consent decision and is not dropped for the visitor who
  consents on the page they landed on. *Done when:* after a consented load the
  SDK's persisted People queue in `localStorage` holds exactly one `$set_once`
  carrying the locale and, on a public page only, the landing path; a declined
  load leaves no queue at all; and navigating on does not add a second entry.
  (The queue is where it stays until step 4 flushes it, so this is the observable
  evidence, not the network tab.)

- [x] **Step 4 - identify at the e-mail** - a new
  `src/lib/features/questionnaire/identity-client.ts`, shaped like
  `reminder-client.ts` beside it: read the contact through
  `readReminderContact`, return without one, and otherwise identify once per
  session. Guard it the way `events.ts` guards a one-shot, marking it spent only
  once it was accepted, so an event refused by a gate the visitor has not yet
  answered is not lost for good. Call it in `advance()` next to
  `startReminderWatch(answers)`, and never await it. Retrying until accepted is
  affordable here because `your-details` is the second screen of twelve, so a
  visitor who answers the banner later still has ten Continues to be identified
  on. The residual gap is a visitor who consents only on the final screen, and it
  is accepted rather than closed. *Done when:* walking to the details screen with
  consent produces exactly one identify carrying `$email`;
  declining produces none; pressing Continue on later screens does not repeat it;
  the questionnaire behaves identically when Mixpanel is unconfigured.

- [x] **Step 5 - the documentation** - rewrite the `AGENTS.md` analytics section
  so no sentence contradicts the code: `identify()` exists and why, the e-mail is
  a profile property and what that does to replay, the date and who decided, the
  hash that was offered and declined, and the sentence recording that Mixpanel and
  Customer.io now key on the same address. Correct the "What may never be sent"
  list and the `events.ts` header, which both still forbid the e-mail. *Done
  when:* `AGENTS.md` and `events.ts` describe what the code does, the reversal
  reads as a decision with a date rather than an erosion, and `pnpm verify` green.

- [x] **Step 6 - browser proof** - extend `e2e/analytics.spec.ts` with a walk
  that grants consent, arrives with `?utm_source=spec`, reaches the details
  screen and asserts on the intercepted Mixpanel traffic: an engage payload
  carrying `$email`, no questionnaire answer value anywhere in it, and
  `initial_utm_source` present. That last assertion found the feature's one real
  surprise: the SDK's own first-touch call never happens behind a consent gate,
  so `firstVisitProperties` records the campaign itself. *Done when:* `pnpm test:browser` green, including the
  existing assertion that no `$mp_click` from a questionnaire path carries an
  `$attr-` key.

## Files / areas

| Path | Why |
| --- | --- |
| `src/lib/analytics/identity.ts`, `identity.test.ts` | new: the pure builders and their key-set test |
| `src/lib/analytics/client.ts` | the identity seam, behind the existing gate |
| `src/lib/analytics/events.ts` | the header comment that still forbids the e-mail |
| `src/routes/+layout.svelte` | first-visit properties, in the existing page-view effect |
| `src/lib/features/questionnaire/identity-client.ts` and its test | new: the one-shot identify, shaped like `reminder-client.ts` |
| `src/routes/(questionnaire)/questionnaire/[step]/+page.svelte` | one call in `advance()`, beside `startReminderWatch` |
| `AGENTS.md` | the analytics section, rewritten |
| `e2e/analytics.spec.ts` | the browser proof |

## Data / contracts

**Reused, not redefined.** `ReminderContact` in
`src/lib/features/questionnaire/answers.ts` is already the closed record of what
may leave this app about a person, and this feature reads the same one. A field
added to it still cannot travel until somebody writes the line that sends it,
which is the property `payload.ts` relies on and this feature inherits.

**The profile, and nothing beyond it:**

| Key | Source |
| --- | --- |
| `$email` | `contact.email`, and also the `distinct_id` |
| `$first_name`, `$last_name`, `$phone` | the same screen, omitted when unanswered |
| locale, landing path | first visit only, path omitted on a questionnaire URL |
| `initial_utm_*` | read from the arrival URL by `firstVisitProperties`, five named lines. The SDK's own first-touch call is made while it is opted out and never happens, which step 6 proved |

**Never:** an answer value, the anamnesis uid, the medication, the dose, the
Shopify variant. Unchanged by this feature.

## Testing

`pnpm verify` is the gate (typecheck, unit tests, build). `pnpm test:browser` is
run for step 6 and is deliberately outside Verify.

In-scope logic, one test per logic-bearing step:

- `profileTraits`: the exact key set, an omitted blank, no spread leakage.
- `firstVisitProperties`: the questionnaire path omitted, a public path kept.
- The identity gate: refused with no token, refused without consent, refused when
  consent is withdrawn while the SDK is still importing.
- The one-shot: not marked spent when the gate refused it, not repeated after it
  was accepted.

Out of scope for unit tests, as `coding-standards.md` requires: the SDK itself,
the layout effect, and the screen. Those ride on step 6 and on a manual walk.

**Manual check that no test can make:** open the Mixpanel panel after a deploy
and confirm the identified profile carries `initial_utm_source` from the arrival
rather than the last touch. The browser spec proves the payload; only the panel
proves the merge landed.

## Notes for the AI

- **The SDK queues People calls until `identify()` is called**
  (`MixpanelPeople.prototype.set` checks `_identify_called()` and otherwise
  `_enqueue`s). So "create the user on arrival" is not literally possible: an
  anonymous visitor appears in Mixpanel through their events, and the profile
  materialises when the identify flushes the queue. Step 3 is worth doing anyway,
  because the queued values are the first visit's and would be lost otherwise.
  Do not force a profile by identifying an anonymous id: it would defeat the merge.
- **Verify which ID merge the project uses before step 4** (Mixpanel project
  settings). On Simplified ID Merge, `identify(email)` is enough and links the
  anonymous history. On the original API, a first-time user also needs `alias()`,
  and calling it twice corrupts the profile. This is a panel fact, not a code
  fact; ask rather than guess.
- **Identify once, with the first address, and never again.** A visitor who goes
  back and edits the e-mail keeps the identity they were given. Re-identifying to
  a second `distinct_id` mid-session is the classic way to corrupt a profile, and
  the reminder has the same property for the same reason. The one-shot is a
  correctness rule, not an optimisation.
- Consent is the gate for identity exactly as it is for events. Withdrawal
  already calls `opt_out_tracking()`, which clears stored identifiers, so a
  withdrawn visitor becomes anonymous again. That is the honest outcome; do not
  add anything that restores the old identity on a later yes.
- `client.test.ts` asserts every privacy-bearing SDK flag. This feature should not
  need to touch `mixpanelInitOptions` at all; if a step wants to, stop and say so.
- Never build a property key from a variable, and never spread a record into a
  payload. Both rules are recorded in `events.ts` and `payload.ts` and both exist
  because a widening should be a visible edit.
- No em dashes in code, comments or documentation, per `coding-standards.md`.
