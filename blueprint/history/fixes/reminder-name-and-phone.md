# Name and telephone number on the Customer.io reminder

**Type:** Fix
**Status:** verified

## The problem

The reminder enrols somebody by e-mail alone, so Customer.io holds a profile it
cannot address by name. A mail that opens "Hallo," is the visible half; the
invisible half is that the panel shows a list of addresses with nothing to tell
one abandoned questionnaire from another.

The questionnaire already asks for all three on the `your-details` screen, in the
same screen that answers the e-mail: `firstName` and `lastName` are required,
`phone` is optional. Nothing reads them today. `Answers.phone` even carries the
comment "Nothing sends it anywhere."

**This fix deliberately reverses a written rule.** `no name, no telephone number`
is stated in four places and asserted in two tests:

| Where | What it says today |
| --- | --- |
| `src/lib/server/customerio/payload.ts` | the builder takes two scalars so no caller can widen it |
| `src/lib/server/customerio/payload.test.ts` | the exact key set of both requests, at every depth |
| `e2e/reminder.spec.ts` | `jonas` and `weber` must not appear in what left the browser |
| `AGENTS.md`, `blueprint/context/project-overview.md` | the reminder may carry the e-mail and a stage marker, nothing else |

Requested by the user on 2026-09-05. The rule changes with the code, in the same
diff, or the repository contradicts itself.

## The fix

Three attributes on the identify half of both stages, using Customer.io's own
conventional profile keys, so its templates and its SMS channel find them where
they expect to:

| Answer | Attribute |
| --- | --- |
| `firstName` | `first_name` |
| `lastName` | `last_name` |
| `phone` | `phone` |

Decisions this makes, each one deliberate:

- **Both stages carry them**, exactly as `language` does. The two calls are
  independent, so a capture whose request was lost must not leave the profile
  unaddressable.
- **A blank value is omitted, never sent as an empty string.** An empty
  `first_name` renders as "Hallo ," in a template, which is worse than a
  template that can fall back.
- **The phone travels as the visitor typed it.** E.164 normalisation is what an
  SMS channel would need and is out of scope here; this is a mail personalisation
  and a name in the panel.
- **`/api/reminder` is public, so the three new fields are hostile input.** They
  are optional on the wire, trimmed, length-capped, and dropped when unusable
  rather than answered with a 400, matching the rule `language` already follows:
  a rejection would cost the reminder itself, and this endpoint may never fail
  the funnel.
- **The builder keeps its no-bag property.** It takes a closed typed record
  rather than four more positional arguments, and reads each field by name into
  the attributes, so there is still no spread through which a caller could widen
  what travels.

What must not break:

- The endpoint still answers 204 to everything except malformed input.
- Every reminder call stays fire and forget: no caller awaits one, and a
  rejection is still swallowed.
- What may still never be sent is unchanged: no answer value, no anamnesis uid,
  no medication or dose. The exact-key-set tests keep enforcing it, against a
  wider set.
- A deployment with no credentials still sends nothing.

Out of scope, and staying open: the privacy policy is a verbatim mirror of
Solean's own and cannot be edited here. It already fails to mention Mixpanel,
session replay and heatmaps; this fix widens what it fails to mention. Recorded,
not closed.

## Build steps

### Step 1 - the server half and its boundary

- [x] Done. `pnpm test` 416 passing, `pnpm check` clean, and the key-set guard proven to
  still bite by adding a stray attribute and watching three assertions fail.
- `payload.ts`: `buildReminderRequest` takes `(stage, person, language)` where
  `person` is a closed `ReminderPerson` record of `email`, `firstName`,
  `lastName` and optional `phone`. Each field is read by name onto the identify's
  attributes, blanks omitted. Attribute keys become constants beside
  `LANGUAGE_ATTRIBUTE`.
- `client.ts`: `sendReminderEvent` passes the record through. No other change.
- `validate.ts`: reads the three new fields off the request body, trims them,
  caps the names at 100 characters and the phone at 32, drops any value that is
  not a usable string (wrong type, empty, control characters), and returns a
  `ReminderPerson`.
- `payload.test.ts` and `validate.test.ts` updated: the exact key sets grow by
  exactly the three attributes, a case proves each is omitted when absent, and
  the validator's new drop rules are covered.

**Done when:** `pnpm test` is green, and `payload.test.ts` still fails if a
fourth attribute is added without being named in the expected key set.

### Step 2 - the browser half

- [x] Done. `pnpm test` 418 passing, `pnpm check` clean.
- `answers.ts`: one reader returning the contact record from `Answers`, or null
  when the address has not been typed, so `reminder-client.ts` keeps its single
  "no address, no reminder" rule.
- `reminder-client.ts`: both signals send the record. The one-shot capture guard
  is untouched.
- `reminder-client.test.ts` updated: the bodies now carry the name, the phone is
  absent from the body when not answered, and the no-address case still sends
  nothing.

**Done when:** `pnpm test` is green and `pnpm check` is clean.

### Step 3 - the browser suite and the written rule

- [x] Done. Full browser suite 150 passing, including the four reminder specs; `pnpm test`
  418 passing and `pnpm check` clean.
- `e2e/reminder.spec.ts`: the exact-keys assertion grows to the new fields; the
  leak list drops `jonas` and `weber`, which now travel by design, and keeps the
  date of birth, the diagnosis, the side effect and `anam-`. One case answers a
  phone and asserts it arrives; the default walk leaves it blank and asserts it
  does not.
- `e2e/answers.ts`: the walk can fill the phone, off by default.
- `AGENTS.md` and `blueprint/context/project-overview.md`: the "what may travel"
  rule is rewritten to name the three fields and dated, and the privacy policy
  gap is noted as widened.
- `Answers.phone`'s "Nothing sends it anywhere" comment is corrected.

**Done when:** `pnpm test:browser` passes `e2e/reminder.spec.ts`, and no file
still claims the reminder carries the address alone.

## Verify

1. `pnpm test`, `pnpm check`, `pnpm build`.
2. `pnpm test:browser e2e/reminder.spec.ts`: the walk enrols a first name, a
   last name and no phone; nothing medical travels.
3. Manually, with credentials set locally: walk to `your-details`, fill all four
   fields, press Continue, and confirm in the Customer.io panel that the person
   created carries `first_name`, `last_name` and `phone`. Without credentials
   the browser still gets a 204 and the questionnaire is unaffected.
