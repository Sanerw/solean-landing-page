# Fix: send the visitor's language so the reminder can be German or English

**Type:** Fix
**Status:** verified

## The problem

The reminder campaign is meant to send a German mail and an English mail, chosen
by the language the visitor was using. It cannot: `POST /api/reminder` carries
`{ stage, email }` and nothing else, so Customer.io has no attribute to branch on
and every recipient would get the same mail.

The information exists in the browser at the moment the address is captured.
`getLocale()` from the Paraglide runtime returns `de` or `en`, and
`src/lib/analytics/client.ts:271` already registers it as a Mixpanel super
property. It simply never reaches the reminder path.

## The fix

Carry the locale to Customer.io as the person attribute `language`, so the
campaign branches on the profile rather than on anything this repository decides.

**Feature 23's preflight dictates the shape.** An event's `attributes` are the
event's and never reach the profile, so `language` has to be set by an `identify`.
That turns the capture stage into a batch of identify plus event, mirroring the
submitted stage, which already carries an identify for `questionnaire_completed`.
Both stages set `language`, because the two calls are independent: a capture whose
network call was lost must not leave the profile without one.

**An unknown or absent language falls back to `baseLocale`, it does not reject.**
The endpoint is public, so the value is hostile input and is checked with
Paraglide's own `isLocale` rather than a hand-written list: only `de` or `en` can
ever leave this app. But a missing value answers with German rather than a 400.
Losing a reminder is worse than sending the majority language, and this is a
German-first market whose questionnaire is German for every visitor anyway.

**What it must not break:**

- `/api/reminder` still answers 204 to everything except malformed input, and a
  reminder still may not delay a navigation or block a submission.
- What may travel stays closed. `language` is a UI locale read from the URL, not
  derived from any answer, so it does not touch the medical boundary in
  `AGENTS.md`. It is still a widening, which is why `payload.test.ts` fails until
  its exact key set is deliberately updated.
- No new browser-side vendor code. The locale goes to our own endpoint, as before.

## Build steps

- [x] **Step 1 - the payload and the client.** Add `language` to
  `buildReminderRequest`, making the capture stage a batch of identify then event
  and adding the attribute to the submitted stage's existing identify. Thread the
  value through `sendReminderEvent`. Update the exact-key-set assertions in
  `payload.test.ts` for both stages, and the two `client.test.ts` cases that name
  a path, since capture now targets `/api/v2/batch`.
  *Done when:* `pnpm test` asserts `language` on both stages' identify, that
  `questionnaire_completed` still appears only on the way out, and that both
  stages now target `/api/v2/batch`.

- [x] **Step 2 - the wire.** `reminder-client.ts` sends `getLocale()` with each
  signal; `validate.ts` normalizes it with `isLocale`, falling back to
  `baseLocale`; `+server.ts` passes it through. Update `e2e/reminder.spec.ts`,
  whose exact-keys assertion currently requires `['email', 'stage']` and will fail
  by design.
  *Done when:* `pnpm test` covers the fallback for an absent, unknown and
  non-string language, and `pnpm test:browser` shows both signals carrying
  `language: 'de'` on the bare path.

  **Two corrections made while building.** The step boundary was wrong:
  `+server.ts` is the only caller of `sendReminderEvent`, so step 1 alone does not
  typecheck and the two steps were reviewed as one diff.
  `reminder-client.test.ts`, listed as untouched, asserts the exact request body
  and had to gain the field too.

## Verify

- `pnpm test`, `pnpm check`, `pnpm build`, `pnpm test:browser`.
- Walk `/questionnaire` past the e-mail question and confirm the request to
  `/api/reminder` carries `language: 'de'`; walk `/en/questionnaire` and confirm
  `'en'`.
- The leak assertions in `e2e/reminder.spec.ts` stay green: still no answer, no
  name, no date of birth, no anamnesis uid.

**Not covered by a browser test, deliberately.** No spec walks the English
questionnaire, because `walkTo` in `e2e/answers.ts` hardcodes the bare path and
parameterising a helper many specs share is more surgery than this fix warrants.
What is proven: `'en'` passes through the validator and reaches the payload
(`validate.test.ts`, `client.test.ts`), the field really travels from the browser
(`reminder.spec.ts` on the German path), and `getLocale()` resolves per path
(`e2e/locale.spec.ts`, plus the identical call in `analytics/client.ts`). The one
link taken on trust is that chain end to end on `/en`. Walk it by hand once.

## Handoff

`language` becomes a fourth string a person types into the Customer.io panel by
hand, alongside `questionnaire_email_captured`, `anamnesis_submitted` and
`questionnaire_completed`. A profile only has it once the capture has been
received at least once, so build the campaign's language branch after a test walk,
not before.
