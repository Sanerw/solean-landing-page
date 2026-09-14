# The phone number is validated as a real number, and carries its country

**Type:** Fix

**Status:** verified

## The problem

`validateQuestion` checks the phone with a character class and a digit count
(`src/lib/features/questionnaire/answers/validate.ts:47`):

```ts
const PHONE = /^[+()\d\s./-]+$/;
const PHONE_DIGITS = 6;
```

Two things follow from that, and the second is the one that matters.

- **It accepts input that is not a number.** `++++123456`, `000000`, `(((999999)))` and
  `1-2-3-4-5-6` all pass. The rule measures punctuation, not a numbering plan.
- **It accepts numbers nobody can reach.** `0151/2345678` passes and is undialable outside
  Germany. The field's own description promises `Bestellupdates, exklusive Rabatte und Tipps
  per SMS`, and `reminder-client.ts:50` forwards the string verbatim to Customer.io as the
  `phone` profile attribute. A national-format number is stored, reads as valid, and can never
  be messaged. Nothing in the app notices.

The visitor is given no way to say which country the number belongs to. The artboard
(`blueprint/reference/questionnaire-flow-export.html:5512`) draws the field as a smartphone
icon with an example inside the box, so the country was never asked for at all.

## The fix

Validate against the real numbering plans, and give the visitor the control that makes a valid
answer possible.

- **`libphonenumber-js`**, the Google libphonenumber port. No runtime dependencies.
  **Settled in step 1: `max` metadata, not `min`.** `min` validates by length alone and accepts
  `+49123456`, which the German plan cannot issue, so the rule the spec asked for moved the
  import as written. The cost, measured over the whole client output, is 193 kB raw and 50 kB
  gzipped, and it is carried by the questionnaire nodes alone: the marketing pages do not
  reference the chunk. `validate.test.ts` keeps the case that decides it, so a later move back
  to `min` fails rather than quietly loosening the rule.
- **The rule is `isValidPhoneNumber` on a full international number.** A landline passes, so
  somebody whose only number is a landline is not refused; the SMS promise is the campaign's
  problem, not the field's. A number without a country code cannot pass, because there is now
  a control that supplies one.
- **The control is ours**, built from the existing `select` primitive rather than a
  third-party phone input: a country dropdown in the input's leading addon, every country,
  DE, AT and CH pinned above the rest, DE preselected. Flags are emoji derived from the ISO
  code, so no assets and no second dependency. Country names come from `Intl.DisplayNames` in
  the UI language, so they are not a table this repository has to translate.
- **The answer stays one string.** `phone` holds E.164 (`+491512345678`), composed from the
  chosen country and the typed digits. `Answers` does not grow a field, so the mapper's
  `DROPPED` set, `coverage.test.ts` and the Customer.io payload are untouched, and the 30-day
  `localStorage` session keeps working without a migration. The country is read back out of
  the stored number on mount, not stored beside it.

### What it must not break

- **`mp-sensitive` on the dropdown's content.** It portals to `document.body`, so without the
  class the heatmap collects `aria-label` and `$attr-` properties from a questionnaire surface
  and `e2e/analytics.spec.ts` fails. The date picker carries it for the same reason
  (`date-picker.svelte:231`). Never `mp-no-track`, which discards the click instead.
- **The 32-character cap** on `phone` in `src/routes/api/reminder/validate.ts`. E.164 is at
  most 16 characters, so normalizing moves the answer further inside the cap, not past it.
- **Optional stays optional.** An empty phone is still no error, and the rule still only
  judges what was actually typed.
- **The 400 path.** RxScale has no phone question, so nothing here can change what is
  submitted. `DROPPED.phone` keeps its reason.
- **The flag emoji does not render on Windows Chrome**, which draws the two letters instead.
  Accepted: the dial code sits beside it either way, so the trigger still reads `DE +49`.

## Build steps

- [x] **Step 1 - The country data and the composer, with tests.** Add `libphonenumber-js`, and
  one module under `questionnaire/definition/` holding the country list (pinned first, then
  sorted by localized name), the flag emoji from an ISO code, the compose of country plus typed
  digits into E.164, and the reverse read of a stored number back into country and national
  part. Handle a full international number typed or pasted into the national box: it sets the
  country rather than being concatenated onto one. Nothing user-facing changes.
  *Done when:* `pnpm test` covers compose, the round trip, the pasted `+49 ...`, the shared
  `+1` fallback and the pinned ordering, and the app behaves exactly as before.

- [x] **Step 2 - The rule.** Add a `phone` question kind, point the phone question at it,
  register it in the renderer registry, and replace the character class with
  `isValidPhoneNumber` on the stored string. Update `validate.test.ts`: `+49 151 2345678` and
  the Austrian and Swiss equivalents pass, `+49 000 000 000` and the national-only
  `0151/2345678` do not, and an empty field is still silent. *Done when:* `pnpm test` proves
  the new rule, including the case that decides `min` against `max`.

- [x] **Step 3 - The control.** `PhoneField.svelte`: the country select in the leading addon
  with `mp-sensitive` on its content, the national number beside it, `type="tel"` kept, an
  accessible name for the selector in both languages, and the placeholder reduced to the
  national example. `TextInputField` loses its phone branch. Move the browser coverage:
  `questionnaire-types.spec.ts` asserts the new markup, `e2e/answers.ts` still fills the field,
  and `reminder.spec.ts` expects the normalized `+491701234567`. *Done when:* picking Austria
  and typing a Vienna number continues, a German number typed without a prefix continues,
  the reminder request carries E.164, and `analytics.spec.ts` still finds no `$attr-` key.

- [x] **Step 4 - Flags that render everywhere.** The emoji pair becomes a real SVG. Copy the
  245 `circle-flags` files this app needs into `static/flags/`, drop both flag packages again
  so nothing new is depended on at runtime, and draw each one as a lazily loaded `<img>` so
  opening the list fetches the rows on screen rather than all 245. *Done when:* the flag is a
  picture on a platform with no flag glyphs, the page weight is unchanged until the list opens,
  and `phone.test.ts` covers the path the code builds.

- [x] **Step 5 - Findable, and finished.** 245 rows need a search box, so the control becomes a
  popover holding a filter and the list, on `command` beside the existing `popover`. Filtering
  matches the country name and the dial code. Choosing one returns focus to the number, and a
  valid number is formatted once on blur. The selector announces the country it holds rather
  than the code alone. *Done when:* typing "pol" narrows the list to Polen, the keyboard alone
  can open, filter, choose and carry on typing the number, and axe is clean on the screen.

- [x] **Step 6 - The review pass on the control itself.** Asked for after step 5, against the
  screen rather than the spec. The radii were the Popover's card defaults, which this scale
  resolves to 44px, and the trigger was a 16px chip floating inside a 16px field, so its hover
  read as a second control. The panel drops to 16px with a border, the rows to 12px, and the
  trigger becomes a segment of the field: full height, rounded only where the field is, a rule
  between it and the number, and a neutral fill on hover with the ring inset so it cannot spill
  outside. The number is filtered as it is typed, because a letter is never part of one and
  refusing it a screen later is late news. *Done when:* hover, focus, open and the refusal all
  read as one control at 1440 and 390, and `abc151-..;234` cannot be typed into the box.

## Verify

- `pnpm verify`, then `pnpm test:browser` in full. The analytics and reminder specs are the two
  that can fail quietly, and neither is in `Verify`.
- Walk `your-details` at `390x844` and `1440x900`: open the dropdown, pick a country by
  keyboard, check the focus ring, and confirm the row does not wrap around the addon.
- Type `0151 2345678` with Germany selected and confirm it is accepted as `+491512345678`.
- Check the questionnaire route's bundle before and after, and record what the metadata cost.

## Found while building, and dealt with here

- **`shadow.test.ts` began timing out intermittently**, about one run in three. Not a wrong
  answer: `refuses none of these visitors` builds fourteen survey-core sessions from the 37 kB
  snapshot and measures 2.5 s idle, which was already half of Vitest's 5 s default. The
  metadata this fix parses in the same worker pool was enough to tip it over under load. It has
  a 20 s budget of its own now, with the reason written down. Confirmed absent on `main` over
  six runs and absent here over eight after the change. Caching the parsed snapshot would fix
  the cause rather than the symptom, but survey-core models are stateful and that is feature
  24b's code, so it is not done here.
- **The country list was wider than a 390px screen**, putting the dial codes off the edge. It is
  capped now and the name truncates.
- **The list ranked by the alphabet, not by the search.** "pol" drew Französisch-Polynesien
  above Polen, so the Enter key chose the wrong country. `searchCountries` owns the order.
- **The placeholder was not a valid number.** `151 234 56 78` is a digit short of anything
  Germany issues, so the example the field taught turned the field red the moment somebody
  copied it. It predates this fix and only began to matter once the rule got strict. It is
  `0151 12345678` now, which is valid and is how a German writes their own number.

## Out of scope

- The e-mail rule, the name rule and every other question's validation.
- Requiring a mobile number. Considered and declined: the `max` or `mobile` metadata is bigger
  and a landline is not a reason to refuse an optional answer.
- The Customer.io campaign, its SMS channel and whether it sends one at all.
- The privacy policy gap recorded in `AGENTS.md`, which is Solean's to amend at the source.
