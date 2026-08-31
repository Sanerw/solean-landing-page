# Recommendation plan cards from the artboard

**Type:** Fix

**Status:** verified

**Branch:** `fix/recommendation-plan-cards`

## The problem

The plan choice worked and looked nothing like the design. Feature 12 drew each plan as a
heading with a nested grid of dose radios inside a warm panel, and the two purchases sat on
one page under two headings, one above the other. Artboard 8, "Which treatment would you
prefer?", draws a flat list of rows instead: a product thumbnail, the name, one line of
detail, and a selection control at the right edge.

Three things were wrong beyond the layout.

- **The prices of two different purchases were on screen together.** A prescription-only
  listing at 49.90 sat a scroll below a treatment at 299.00, which is exactly the reading
  `project-overview.md` forbids: the cheaper one looks like a discount on the same thing.
- **The card radii were wrong by a factor of three.** This project sets `--radius: 1.25rem`
  and scales it multiplicatively, so `rounded-xl` is 28px and `rounded-2xl` 36px. The
  artboard's 18px card radius scales to 13px at our width, so the stock classes that read as
  "large" turned every row into a lozenge.
- **The screen invented nothing, but showed less than it had.** `therapy_duration` is on
  every treatment SKU in the live recommendation and was being dropped by the mapper.

## What the reference dictates

Measured out of `design/prio_one_landing_page_men_new.html`, artboard "EN Questionnaire 8".
Its content column is 900px inside a 1920px artboard; the questionnaire shell here is
`max-w-2xl`, 672px, so every value scales by **0.747**.

| Element | Artboard | Scaled | Class |
| --- | --- | --- | --- |
| Card height | 108px | 81 | `min-h-14` + `p-3` = 80 |
| Card radius | 18px | 13 | `rounded-sm` (12) |
| Card padding, gap | 18px | 13 | `p-3`, `gap-3` (12) |
| Thumbnail | 76px | 57 | `size-14` (56) |
| Thumbnail radius | 16px | 12 | `rounded-sm` (12) |
| Product name | 21px | 16 | `text-base` |
| Detail line | 15px | 11 | `text-xs` |
| Gap between cards | 10px | 7 | `gap-2` (8) |
| Clinical note | 13px | 10 | `text-xs` |

## What the live data does and does not carry

Read from the real recommendation for anamnesis `b326f1e3-...` on 2026-08-31, six offers.

| Wanted by the artboard | In the API |
| --- | --- |
| Product name | yes, `product.display_name` |
| Product photo | yes, `shop_data.featuredImage.url` |
| Price | yes, per shop listing |
| Therapy length | yes, `therapy_duration`, as a number or a numeric string, absent on some |
| Form badge (INJECTION / TABLET) | **no** |
| Claim ("Lose up to 23% body weight") | **no**, and `descriptionHtml` is empty for both treatments |
| "Learn more" target | **no** |

Decided with the user: the card shows only what RxScale actually sends. No badge, no claim,
no learn-more. A hand-written brand map would have to be edited every time RxScale lists a
new medication, and would be the one thing on this screen that could drift from the shop.

## The fix

One list of rows, in the artboard's proportions, with the two purchases behind a switch.

- **A segmented switch above the list**, "Treatment" and "Prescription only", built on the
  existing `tabs` primitive. The two prices are never on screen together, and the tab names
  the purchase, so the explanatory note under the old heading is no longer needed.
- **Switching brings its own default.** Carrying the selection across would leave a treatment
  chosen while a list of prescriptions is on screen, and Continue would confirm merchandise
  nobody can see.
- **The row is the control.** The radio covers the whole card, draws nothing, and lets the
  card's gold border and fill carry the choice. It stays a real radio so the group is
  arrow-navigable and announces "radio, checked"; covering the card is also what puts its
  focus ring around the row rather than around a circle.
- **The button names the choice back**, "Continue with Mounjaro", shortened to the brand only
  when the full name is long and no other plan on screen shares its first word.

## Build steps

### [x] Step 1 - the therapy length, from the API to the type

`recommendation.ts`: `therapyDays: number | null` on `RecommendedOption`. Null is the common
case and means the listing records no duration, not that it lasts zero days.

`server/rxscale/recommendation.ts`: `therapyDays()` accepts a number or a numeric string and
refuses anything else, because a value we do not understand must not become a promise about
a course of medication. Four cases in the mapper's test.

`recommendation-client.ts`: the option is now rebuilt field by field rather than filtered
through, so nothing the endpoint grows later arrives on the screen unread.

### [x] Step 2 - the choice logic, out of the component

`plan-choice.ts`, new: `groupPlans`, `initialMode`, `defaultVariant` (moved off the client
module), and `chosenPlanName`. Being wrong here costs money, so it is nine unit tests rather
than markup: the two groups differ by a factor of six in price and by whether medication is
delivered at all.

`chosenPlanName` shortens to the first word only above 18 characters and only when no other
plan shares it. "Continue with Wegovy" must not be what a person reads after choosing
between two Wegovys.

### [x] Step 3 - the screen

`RecommendationSelectionScreen.svelte`: rewritten. Tabs when both groups are offered, one
plain list when only one is, the artboard's row, and the clinical note from the reference.
The screen falls back to the prescriptions when RxScale recommends no treatment, because
opening on an empty list would look like nothing was matched.

`recommendation-content.ts`: `modes`, `choiceActionFor`, `durationFor`, `reviewNote` in;
`treatmentsHeading`, `prescriptionsHeading`, `prescriptionsNote` and `totalNote` out.

### [x] Step 4 - the harness follows

`e2e/recommendation.ts`: `confirmPlan` takes `{ mode, plan }`, because a prescription-only
plan now lives in a panel that has to be opened first.

`questionnaire-submission.spec.ts` proves the split itself: 249.00 visible while 49.90 is
not, the reverse after the switch, and the default moving with it. `accessibility.spec.ts`
scans both panels, since axe only sees the one on screen.

## Verify

- `pnpm check` - 1203 files, 0 errors
- `pnpm test` - 24 passed, 9 of them new in `plan-choice.test.ts`
- `pnpm test:browser` - 74 passed
- `pnpm build` - clean
- Read against the **live** RxScale recommendation, not the fixture: six offers, three
  treatments at 99.00 / 249.00 / 299.00 and three prescriptions at 49.90.
- Keyboard: focus draws around the whole row, and Down moves the choice and the button label
  with it.

## What this leaves open

- **Selection is carried by colour alone.** The gold border and the lighter fill are the only
  signals that a row is chosen, and both are colour. The artboard used a tick for this. A
  2px border on the chosen row would restore a non-colour cue.
- The screen is in English beside German product names, as the rest of the funnel is.
  Translating the whole funnel is its own piece of work.
- No badge and no claim on the card, for as long as RxScale does not send them.
