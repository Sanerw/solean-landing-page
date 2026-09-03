# Feature: Brevo abandoned-questionnaire reminder

**From build-plan:** feature 22
**Status:** verified

## Goal

A visitor who types their e-mail into the questionnaire and then walks away gets
a reminder from Brevo. One who submits stops getting them.

Two server-sent events carry the whole feature. The campaign itself, how many
mails, how far apart, what they say, and the condition that stops them, lives in
the Brevo panel and not in this repository, so it changes without a deploy.

## In scope

- One server endpoint, `POST /api/reminder`, holding `BREVO_API_KEY`.
- Two signals: `questionnaire_email_captured` when the e-mail question is
  answered and the step validates, `anamnesis_submitted` after a successful
  submission, the second also setting `QUESTIONNAIRE_COMPLETED` on the contact.
- An allow-list on the outgoing payload, enforced by a unit test.
- `BREVO_API_KEY` in `.env.example` and in the docs.

## Out of scope

- **The Brevo automation itself.** Entry trigger, exit condition, delays and mail
  content are configured in the panel by the user. This feature only guarantees
  the two events arrive with the right names.
- **Any browser-side Brevo code.** No tracker, no `brevo.track()`, no
  third-party script. `AGENTS.md` rules out a second analytics tool and a tag
  manager, and this is server-side REST or nothing.
- **Resuming where the visitor stopped.** Nothing is persisted, so the reminder
  can only link to the start of the questionnaire. "Saved progress and resume by
  e-mail link" stays in the deferred backlog.
- Sending the telephone number, the name, or anything from the answers.

## What this feature accepts, on the record

Recorded in `project-overview.md` under **The Brevo exception**, decided
2026-09-03:

- The e-mail leaves **before** any submission, so a personal identifier from an
  unfinished medical questionnaire reaches a marketing processor.
- Typing the e-mail and pressing Continue is the whole consent step. There is no
  separate marketing opt-in checkbox.

These are the user's decisions. Do not re-open them, and do not add a checkbox
because it seems safer.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.

## Build steps

- [x] **Step 1 - preflight against the real account.** Two things the docs do not
  settle, and both change the design. Confirm `BREVO_API_KEY` is a standard v3
  key (`xkeysib-`) rather than an MA key from the tracker, because `/v3/events`
  takes only the first. Then find out whether `/v3/events` creates a contact for
  an unknown `email_id` on its own, or whether `POST /v3/contacts` has to come
  first. **Ask before running the second probe: it creates a real contact on the
  user's Brevo account.** Use an address that is obviously a test.
  *Done when:* both answers are written into this spec, and steps 2 and 3 are
  adjusted to match. **Answered below; the `/v3/contacts` fallback is dropped.**

### Step 1 findings

**The key is a standard v3 key.** `xkeysib-` prefix, 89 characters, not the
32-hex MA key the tracker uses. `POST /v3/events` is the right endpoint and no
`in-automate.brevo.com` call is needed.

**The account blocks unknown IPs, and that blocks Vercel.** `GET /v3/account`
answers 401 with `code: "unauthorized"` and "We have detected you are using an
unrecognised IP address". The key is valid; Brevo's Authorized IPs feature is
switched on for this account.

This is a production blocker rather than a local inconvenience. Vercel routes
outbound requests from functions through a **dynamic range** of IP addresses by
default, so there is no address to authorize. Fixed egress is a paid add-on:
Static IPs on Pro and Enterprise, Secure Compute on Enterprise. Authorizing this
development machine alone would make the integration work here and fail in
production, which is the worst of the three outcomes.

**Resolution required before Step 3 can be proven:** deactivate IP blocking in
Brevo, under Settings > Security > Authorized IPs > Deactivate blocking. The
authorized list is retained if the feature is ever switched back on. The
alternative is buying fixed egress from Vercel, which is a cost decision rather
than a code one.

**`POST /v3/events` creates the contact on its own, so no `/v3/contacts` call is
needed.** Proven live on 2026-09-03 against `preflight-20260903@example.com`,
which did not exist beforehand: the event answered 204 and the contact existed
afterwards, with `attributes: {}` and `listIds: []`. The test contact was
deleted again and the account is back to its prior state.

**Ingestion is asynchronous, and that nearly produced the wrong answer.** Three
seconds after the event the contact still read 404; it appeared somewhere between
three and eighteen seconds. A probe that concluded at the first check would have
written a permanent, unnecessary `POST /v3/contacts` into every request. The
browser test in Step 5 must not assert on Brevo's own state for the same reason:
it asserts on the request this app makes, with Brevo intercepted.

**The contact joins no list.** `listIds` is empty, so a Brevo automation keyed on
list membership would never fire. The design uses an event trigger, which is
unaffected, but the panel must not be configured around a list.

**Account context.** DTC Healthtech Solution Limited, free plan, 300 credits.
Brevo brands outgoing mail on that plan and caps daily sending, which is a
campaign consideration for the user rather than a constraint on this code.

- [x] **Step 2 - the server client and the payload builder.** Add
  `src/lib/server/brevo/`, mirroring `src/lib/server/shopify/`: the key read from
  `$env/dynamic/private`, the two event names as constants, and a pure builder
  turning a stage plus an e-mail into the request body. An absent key returns
  null rather than throwing, the way `mixpanelToken()` does, so a deployment
  without one simply sends no reminders. Unit test the builder: the exact key
  set for each stage, `QUESTIONNAIRE_COMPLETED` only on the submitted stage, and
  an assertion that no key outside the allow-list can appear.
  *Done when:* `pnpm test` covers both stages and the allow-list, and nothing
  imports the module from client code.

- [x] **Step 3 - `POST /api/reminder`.** The route validates its own input before
  calling anything: the stage must be one of the two known values and the e-mail
  must look like an address. It answers 204 on success and on an unconfigured
  key alike, because "this deployment sends no reminders" is not a client error.
  A Brevo failure is logged server-side and still answers 204: a reminder that
  did not send must never break the questionnaire. Unit test the input
  validation.
  *Done when:* the endpoint answers 204 for a valid body, 400 for a bad stage or
  a malformed address, and 204 with no outbound call when the key is absent.

- [x] **Step 4 - wire the two call sites.** In
  `src/routes/(questionnaire)/questionnaire/[step]/+page.svelte`: the capture in
  `advance()`, reading the address with the existing `readEmail(survey.data)`,
  and the completion beside `trackAnamnesisSubmitted` in `send()`. Both are
  fire-and-forget: neither may delay a navigation or block the submission, and a
  rejected request is swallowed. Guard the capture so it is sent once per
  session, the way `events.ts` guards its one-shot events.
  *Done when:* walking the questionnaire fires exactly one capture and one
  completion, and a failing endpoint changes nothing a visitor sees.
  **Also required, found while building:** `playwright.config.ts` must blank
  `BREVO_API_KEY` in its `webServer.env`. Vite still reads `.env` for anything
  that block does not override, so without it every harness run enrols its
  walked-through addresses as real contacts and burns the account's sending
  credits. Verified after a full run: the account still holds only the two
  contacts that pre-date this work.

- [x] **Step 5 - prove it in a browser, then document it.** Add a spec to `e2e/`
  intercepting `api.brevo.com`, asserting both events fire at the right moment
  with the right names, and that the payload carries no answer, no name, no
  telephone number and no anamnesis uid. Then add `BREVO_API_KEY` to
  `.env.example` and a short section to `AGENTS.md` covering the two event names,
  the attribute, where the campaign lives, and the abuse note below.
  *Done when:* `pnpm test:browser` passes, and `AGENTS.md` names the two events
  a person has to type into the Brevo panel.

## Files / areas

| Path | What |
| --- | --- |
| `src/lib/server/brevo/client.ts` | new. Key, event names, the call. Server only |
| `src/lib/server/brevo/payload.ts` | new. The pure builder and its allow-list |
| `src/lib/server/brevo/payload.test.ts` | new |
| `src/routes/api/reminder/+server.ts` | new. Input validation, then the call |
| `src/routes/api/reminder/validate.test.ts` | new |
| `src/lib/features/questionnaire/reminder-client.ts` | new. The browser side, beside `checkout-client.ts` |
| `src/routes/(questionnaire)/questionnaire/[step]/+page.svelte` | two call sites |
| `e2e/reminder.spec.ts` | new |
| `.env.example`, `AGENTS.md` | documentation |

## Data / contracts

**Browser to our endpoint**, the only shape it may send:

    POST /api/reminder
    { "stage": "email_captured" | "submitted", "email": string }

**Our endpoint to Brevo**, `POST https://api.brevo.com/v3/events`, header
`api-key`:

    {
      "event_name": "questionnaire_email_captured" | "anamnesis_submitted",
      "identifiers": { "email_id": string },
      "contact_properties": { "QUESTIONNAIRE_COMPLETED": true }   // submitted only
    }

**Load-bearing, because a person types them into the Brevo panel by hand and a
mismatch fails silently:** `questionnaire_email_captured`,
`anamnesis_submitted`, `QUESTIONNAIRE_COMPLETED`. One constant each, never
assembled from parts, the same rule `ANAMNESIS_ATTRIBUTE_KEY` follows.

**The allow-list.** Nothing may appear in the outgoing body beyond the keys
above. No answer value, no anamnesis uid, no medication or dose, no name, no
telephone number.

## Known risk to decide on, not to silently ship

`/api/reminder` is a public endpoint that turns a POST into "add this address to
Brevo and start mailing it". `/api/checkout` has a guard against misuse, it
refuses a variant that is not in the recommendation; this endpoint has no
equivalent, because at capture time there is no anamnesis to check against.

Validating the address and the stage stops malformed junk. It does not stop
someone scripting the endpoint to sign a third party up for reminder mail.

**Decided 2026-09-03: accepted, with reach chosen over protection.** A real
double opt-in was the alternative and was priced honestly first: Brevo's panel
setting applies to its own forms only, so an API integration needs
`POST /v3/contacts/doubleOptinConfirmation` with a template id, a list id and a
redirection page, and the automation would then trigger on list membership
rather than on our event. It also means only a visitor who clicks a confirmation
mail is ever reminded, and somebody who just abandoned a medical questionnaire
rarely does. The user weighed that and chose reach.

What is therefore live: a script can enrol third parties and exhaust the daily
sending credits, which on this free plan is 300. Revisit through `/fix` if it is
ever abused.

## Testing

`pnpm test` is declared, so logic-bearing steps ship a test in the same diff.

| In scope for unit tests | Step |
| --- | --- |
| The payload builder: both stages, the attribute, the allow-list | 2 |
| Endpoint input validation: bad stage, malformed address, absent key | 3 |
| The one-shot capture gate | 4 |

`pnpm test:browser` is declared, so step 5 adds `e2e/reminder.spec.ts` with every
Brevo request intercepted, on the pattern of `e2e/analytics.spec.ts`. It proves
the two events fire at the right moments and that the payload carries nothing
forbidden. The real Brevo call is proven once, by hand, in step 1.

Component rendering stays out of unit tests, per `coding-standards.md`.

## Notes for the AI

- `BREVO_API_KEY` is read from `$env/dynamic/private` and must never appear in a
  client bundle. It is the first real secret on an external boundary in this
  project; `project-plan.md` section 5 has been rescoped to say so.
- An absent key is a valid deployment state, not an error. Follow the pattern in
  `src/lib/analytics/config.ts`.
- The reminder must never be able to break the funnel. Every call from the
  browser is fire-and-forget, and every failure is swallowed after a server-side
  log.
- Do not add a Brevo browser tracker, and do not reach for `in-automate.brevo.com`
  or an MA key. `/v3/events` with the standard key is the whole integration.
