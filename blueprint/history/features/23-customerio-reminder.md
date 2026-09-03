# Feature: Customer.io reminder, replacing Brevo

**From build-plan:** feature 23
**Status:** verified

## Goal

The abandoned-questionnaire reminder moves onto Customer.io and off Brevo
entirely. Behaviour a visitor can see does not change: type your address, walk
away, get reminded; submit, and the reminders stop.

The seam feature 22 drew is what makes this shallow. `POST /api/reminder` takes a
stage and an address, the browser half names a stage rather than a vendor event,
and the browser spec asserts on our own request rather than on the vendor. All of
that survives. What is replaced is the module behind the endpoint.

## In scope

- `src/lib/server/customerio/`: the payload builder, its allow-list test, and the
  client, mirroring the shape `src/lib/server/brevo/` has today.
- Two server-only credentials, `CUSTOMERIO_SITE_ID` and
  `CUSTOMERIO_TRACK_API_KEY`, combined into one HTTP Basic header.
- The EU ingestion host, `https://track-eu.customer.io`.
- Deleting `src/lib/server/brevo/` and `BREVO_API_KEY` in the same feature, so the
  app is never wired to two mail vendors at once.
- The harness guard in `playwright.config.ts`, moved to the new variables and
  proven by a negative assertion rather than trusted.
- `.env.example` and the `AGENTS.md` lifecycle-mail section.

## Out of scope

- **The Customer.io campaign itself.** Entry trigger, delays, mail content and
  exit condition are panel configuration, exactly as they were in Brevo. This
  feature guarantees only that the two events arrive with the right names.
- **Switching the Brevo automation off.** Panel work on the user's side, and it
  has a sequencing consequence, recorded under Handoff below.
- **Any browser-side Customer.io code.** No JS snippet, no in-app messaging, no
  tracker. `AGENTS.md` rules out a second measurement tool and a tag manager, and
  this stays server-side REST or nothing.
- **Double opt-in.** Weighed and declined on 2026-09-03; the reach decision moves
  across unchanged. Do not add a marketing checkbox because a new vendor makes it
  feel like a fresh question.
- **A vendor-neutral `src/lib/server/reminder/stage.ts`.** Considered: `validate.ts`
  imports the stage vocabulary from the vendor module, which is the one line that
  says the vendor's name in a file that has nothing to do with it. Left alone,
  because extracting it is a refactor this feature was not asked for and the
  import is a one-word change either way. Revisit if a third vendor ever appears.
- **The privacy policy.** It names Google tools and neither Mixpanel nor any mail
  processor. That gap is open on purpose and documented in `AGENTS.md`: the file
  is a verbatim mirror of what Solean publishes and is not ours to edit.
- Resuming where the visitor stopped. Nothing is persisted; still deferred.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Before step 1 can run

**The credentials have to be in `.env` first.** `CUSTOMERIO_SITE_ID` and
`CUSTOMERIO_TRACK_API_KEY`, both from the Customer.io workspace under Settings >
Account Settings > API Credentials, as a **Track API key** rather than an App API
key: the two are different credentials and only the first authenticates
`track-eu.customer.io`. Step 1 is a live call and cannot start without them.

`.env` is gitignored, so this is the user's local action and nothing in the diff
records it. `.env.example` gains both names in step 6.

## Build steps

- [x] **Step 1 - preflight against the real Customer.io account.** Four things the
  docs do not settle for this workspace, and each one changes the code below.
  **Ask before the probe that writes: it creates a real person on the user's
  account.** Use an obviously-test address and delete it afterwards.
  1. **Does an event create the person?** `POST /api/v2/entity` with
     `identifiers: { email }` for an address that does not exist yet. The user has
     confirmed the workspace is keyed on e-mail; this proves it, because nothing
     here is persisted that could serve as an `id` instead.
  2. **What does success answer?** The Brevo client keys on `204` exactly. Record
     the real status rather than assuming, and key the new client on it.
  3. **Can one call carry the completion marker?** On `action: "event"`,
     `attributes` are *event* attributes, not person attributes, so the
     `QUESTIONNAIRE_COMPLETED` equivalent may need a separate `identify`. If it
     does, the submitted stage becomes one `POST /api/v2/batch` carrying identify
     then event, and the client gains a failure channel Brevo never had: a batch
     answers 200 while reporting per-entry errors in its body.
  4. **Is a new person attribute created on write?** Brevo silently dropped one
     that did not already exist. If Customer.io does the same, the attribute has
     to be created in the panel before the code sends it.

  **Read a 401 carefully.** A US-region workspace, an App API key instead of a
  Track key, and a genuinely wrong secret all answer the same way. Confirm the
  region in the panel before concluding the key is wrong, because the two
  hypotheses have opposite fixes.
  *Done when:* all four answers are written into this spec under a Step 1 findings
  heading, steps 2 to 4 are adjusted to match, and the test person is deleted.

### Step 1 findings

Probed live on 2026-09-03 against the real workspace, from
`solean-preflight-20260903@example.com`.

**Success is `200`, not `204`, and the body is `{}`.** All three calls answered
the same way. This is the finding that justified the preflight: the Brevo client
keys on `status === 204` exactly, so a one-to-one port would have reported every
successful call as `failed` and written a log line per questionnaire, while the
events arrived normally. The new client keys on `response.ok`.

**`GET /auth` does not test the region.** It answers `200` on
`track-eu.customer.io` *and* on `track.customer.io` with the same credentials, so
it validates the pair and nothing more. The region rests on the panel and on the
user's confirmation, and the spec's "read a 401 carefully" note is therefore not
enough on its own: a 200 does not prove the right region either. Send to the EU
host because the workspace is EU, not because a probe confirmed it.

**The batch endpoint accepts the identify-then-event shape** and answered `200`
with `{}`. A batch reports per-entry failures inside a `200` body rather than by
status, so a client using it must read the body, not just the status.

**The event alone creates the person.** The profile's activity shows the two
events at 2:12:36 and a `Profile Created / email (identifier)` at 2:12:37, so the
person is a consequence of the event rather than a prerequisite for it. There is
no `identify` call on the capture path, exactly as there was no `POST /v3/contacts`
on the Brevo one. Ingestion took about a second, against Brevo's eighteen.

**Event attributes are not person attributes.** `completed_via_event`, sent as
`attributes` on an `action: "event"` call, appears nowhere on the profile;
`completed_via_identify`, sent on an `action: "identify"`, appears as an Attribute
Change. So the submitted stage cannot be one event call the way Brevo's was: it is
one `POST /api/v2/batch` carrying an identify that sets the attribute, then the
event.

**A new attribute is created on write.** `completed_via_identify` did not exist
beforehand and needed no panel definition. This is the one place Customer.io is
simpler than Brevo, which answered 204 and silently discarded an undefined
attribute. Nothing has to be pre-created before the code sends it.

**The person is created `Subscribed`.** Worth knowing for the campaign, and
consistent with the reach decision already on the record. Not a code concern.

- [x] **Step 2 - the payload builder and its allow-list.** Add
  `src/lib/server/customerio/payload.ts`: the two stages, the two event names and
  the completion attribute as one constant each, never assembled from parts, and a
  pure builder taking a stage and an address as two scalars so there is no bag of
  properties for a caller to widen. Step 1 settled the two shapes, and they are
  **not** the same shape: capture is a single entity event, submission is a batch
  of an identify and an event. The builder therefore returns a request, meaning a
  path plus a body, rather than a body alone. Port `payload.test.ts`, keeping the
  assertion that matters: the **exact** key set at every depth, so a field added
  later fails the test instead of travelling.
  *Done when:* `pnpm test` asserts the exact key set for both stages including
  inside the batch entries, that the completion attribute appears only on the way
  out, that capture targets `/api/v2/entity` and submission `/api/v2/batch`, and
  that `isReminderStage` refuses the event names themselves.

- [x] **Step 3 - the client.** Add `src/lib/server/customerio/client.ts`: both
  credentials read from `$env/dynamic/private`, the EU host, and the Basic header
  built once from the pair. `reminderConfigured()` is true only when both are
  present and non-empty, so a half-configured deployment sends nothing rather than
  401-ing on every questionnaire. Keep the three-state `ReminderResult`.

  **Success is `200` and the body is `{}`, not `204`.** Porting the Brevo check
  unchanged would have reported every successful call as failed. Worse, a batch
  reports per-entry failures *inside* a 200 body, so the check is `response.ok`
  **and** no populated `errors` in the body. Unit test the header construction,
  the both-or-nothing rule, and that response reading, all of which are real logic
  with real edge cases the Brevo client never had.
  *Done when:* `pnpm test` covers a missing site id, a missing key, a correctly
  encoded header, a 200 with `{}` reading as sent, and a 200 carrying `errors`
  reading as failed. The credentials appear in no log line.

- [x] **Step 4 - swap the endpoint over, and delete Brevo.** Point
  `src/routes/api/reminder/+server.ts` and `src/routes/api/reminder/validate.ts` at
  the new module, delete `src/lib/server/brevo/` entirely, drop `BREVO_API_KEY`
  from `.env` and `.env.example`, and reword the one comment in
  `+page.svelte:209` that names Brevo's exit condition. The endpoint's own
  contract does not move: still 204 for everything except malformed input,
  including an unconfigured deployment and a vendor that refuses.
  *Done when:* no Brevo **code** remains, meaning no module, no env var and no
  import, and `pnpm check`, `pnpm test` and `pnpm build` pass. Narrowed from
  "`grep -ril brevo` returns nothing" while building: the new client's comment
  explaining why the success check is 200 rather than 204 names Brevo on purpose,
  and deleting the most useful comment in the file to satisfy a grep would be a
  loss. Historical references that explain a decision stay.

- [x] **Step 5 - the harness guard.** Replace
  `BREVO_API_KEY: ''` in `playwright.config.ts` with both new variables blanked,
  for the same reason: Vite still reads `.env` for anything `webServer.env` does
  not override, so without it every browser run enrols its walked-through
  addresses on the real workspace. Both are blanked, not one, because the client
  reads a half-configured pair as unconfigured and leaving one set would make the
  protection an accident rather than the intent.

  **The negative assertion this step called for was written, then removed, and the
  spec was wrong to ask for it.** The outbound call is made by the server in the
  `webServer` process, so `page.on('request')` never sees it: an assertion that no
  request reached `customer.io` passes whether the guard works or not. Shipping it
  would have been worse than shipping nothing, because it reads as protection.
  What proves the guard is `client.test.ts`, which asserts that an unconfigured
  pair makes no call at all, plus the blanked variables. The reasoning is recorded
  at the top of `e2e/reminder.spec.ts` so the next person does not re-add it.
  *Done when:* `pnpm test:browser` passes and the existing signal assertions are
  untouched in substance.

- [x] **Step 6 - documentation.** Rewrite the `AGENTS.md` section as **Lifecycle
  e-mail: Customer.io**, carrying forward what is still true (what may never be
  sent, the 204 rule and why, no consent gate, the public-endpoint abuse note) and
  replacing the Brevo mechanics with Step 1's findings. Add both variables to
  `.env.example` with the same "absent is a valid state" framing the Mixpanel token
  has.
  *Done when:* `AGENTS.md` names the exact strings a person types into the
  Customer.io panel, and no Brevo section remains anywhere in the repo.

## Files / areas

| Path | What |
| --- | --- |
| `src/lib/server/customerio/payload.ts` | new. Stages, event names, the pure builder and its allow-list |
| `src/lib/server/customerio/payload.test.ts` | new. Ported from the Brevo one, same exact-key-set discipline |
| `src/lib/server/customerio/client.ts` | new. Both credentials, the Basic header, the EU host, the call |
| `src/lib/server/customerio/client.test.ts` | new. Header construction and the both-or-nothing rule |
| `src/lib/server/brevo/` | **deleted**, all three files |
| `src/routes/api/reminder/+server.ts` | import only; the 204 contract does not move |
| `src/routes/api/reminder/validate.ts` + test | import path only |
| `src/routes/(questionnaire)/questionnaire/[step]/+page.svelte` | one comment |
| `playwright.config.ts` | the env guard, two variables instead of one |
| `e2e/reminder.spec.ts` | comments, plus one negative assertion on the vendor host |
| `.env.example`, `AGENTS.md` | documentation |

Untouched, and that is the point: `src/lib/features/questionnaire/reminder-client.ts`
and its test, and both call sites in `+page.svelte`.

## Data / contracts

**Browser to our endpoint.** Load-bearing and unchanged from feature 22:

    POST /api/reminder
    { "stage": "email_captured" | "submitted", "email": string }

**Our endpoint to Customer.io**, EU region, `Authorization: Basic
base64(siteId:trackApiKey)`. Settled by step 1: the two stages are different
shapes, because an event's `attributes` are event attributes and never reach the
profile.

Capture, one call:

    POST https://track-eu.customer.io/api/v2/entity
    {
      "type": "person",
      "identifiers": { "email": string },
      "action": "event",
      "name": "questionnaire_email_captured"
    }

Submission, one batch of two:

    POST https://track-eu.customer.io/api/v2/batch
    {
      "batch": [
        { "type": "person", "identifiers": { "email": string },
          "action": "identify", "attributes": { "questionnaire_completed": true } },
        { "type": "person", "identifiers": { "email": string },
          "action": "event", "name": "anamnesis_submitted" }
      ]
    }

Both answer `200` with `{}` on success. A batch reports per-entry failures inside
a `200` body, so the client reads the body and not only the status.

**Load-bearing strings, because a person types them into the Customer.io panel by
hand and a mismatch raises nothing:**

| Role | String |
| --- | --- |
| Entry trigger | `questionnaire_email_captured` |
| Exit condition | `anamnesis_submitted` |
| Person attribute checked before each send | `questionnaire_completed` |

The two event names keep their feature 22 spelling by decision. The attribute is
lowercased to Customer.io's own convention, because it is typed fresh into a new
panel either way and nothing reads the old spelling.

**The allow-list.** Nothing beyond the keys above may appear in the outgoing body.
No answer value, no anamnesis uid, no medication or dose, no name, no telephone
number. Asserted as an exact key set, not an absence check.

## Testing

The test gate is on (`pnpm test` is declared in `AGENTS.md`), and browser tests
are declared (`pnpm test:browser`).

| Step | Evidence |
| --- | --- |
| 1 | The four answers, written into this spec. Live probe, not a doc reading |
| 2 | `pnpm test`: exact key set per stage, completion marker only on exit, `isReminderStage` refusing the event names |
| 3 | `pnpm test`: header encoding, missing site id, missing key |
| 4 | `pnpm check`, `pnpm test`, `pnpm build`, and no Brevo module, env var or import left. Also grepped the built client bundle for the real credential values, both absent |
| 5 | `pnpm test:browser`, 112 passed. The assertion this row originally named was removed as unfalsifiable; see step 5 |
| 6 | Read the rewritten `AGENTS.md` section against Step 1's findings |

Out of unit scope, as before: the Customer.io call itself and component
rendering. Those ride on the browser harness and the live preflight.

## Handoff, and it has an order

The repository cannot prevent the one user-facing defect this feature can cause:
**someone abandoning the questionnaire being mailed by both vendors.** Contacts
already enrolled in Brevo stay enrolled, and its automation stays armed until
someone switches it off by hand.

So the order is: merge this, then build the Customer.io campaign, then switch the
Brevo automation off, and only then let the two run against real traffic. Both
event names have to have been received once before Customer.io's panel will offer
them as a trigger, the same constraint Brevo had, so send them from a test address
first.

## Notes for the AI

- **Server only.** The credentials are read from `$env/dynamic/private` and must
  never reach a bundle the browser downloads. The questionnaire asks our own
  endpoint, never the vendor.
- **`/api/reminder` answers 204 to everything except malformed input.** An
  unconfigured deployment and a vendor that refuses are both answered as success.
  The reminder is marketing and the questionnaire is medical: a failed mail may
  not delay a navigation, block a submission, or put an error in front of somebody
  answering questions about their health. Do not "improve" this into a 5xx.
- **Log nothing identifying.** The existing failure log names the stage and never
  the address. Keep that, and never log the Basic header.
- **Do not re-open the accepted decisions.** No consent gate on the reminder, no
  double opt-in, and the public endpoint's abuse surface, all decided 2026-09-03
  and recorded in `project-overview.md` and `AGENTS.md`.
- Follow `blueprint/context/coding-standards.md`: no em dashes, comments explain
  why rather than what, tests live beside their source.
