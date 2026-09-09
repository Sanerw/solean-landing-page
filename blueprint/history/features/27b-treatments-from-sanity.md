# Feature: 27b - The treatment page reads Sanity

**From build-plan:** feature 27b
**Status:** verified

## Goal

Switch `/treatments/[slug]` onto the documents 27a seeded, delete the fixture
that fed it, and move the photographs to the CDN. After this a price change is an
edit in the Studio rather than a deploy, which is the point of feature 27.

**The page does not change visually**, and that is the acceptance rule. The
documents were seeded from the fixture, so every price, dose and sentence is
already the same; if the page moves, something is wrong.

## Design reference

No new artboards. The parity target is the page as it renders today, plus
`blueprint/reference/treatment-page-desktop.png`,
`treatment-page-mobile.png` and `treatment-page-mobile-sticky.png` for the
sections the browser suite does not measure.

## In scope

- **A list query.** `treatmentsQuery`, all three treatments in one language.
  27a assumed one document per page and that is not enough: `comparisonRows`
  reads every treatment's plans, so the page needs all three or the table draws
  one row.
- **The load and the page**: server-side read, the mapper at the boundary, the
  404 from an absent document rather than an absent fixture entry. The Reviews.io
  rating stays on this load beside the Sanity read, in the same `Promise.all` the
  landing page uses: it is unrelated to this switch and easy to drop by accident
  while rewriting the function around it.
- **The photographs** on a CDN width ladder, replacing the `enhanced:img` import.
- **The deletions**: the fixture in `content.ts`, its 31 message keys, and the
  catalogue's dead `dose`, `claim` and `price`.
- **The e2e fixture**: the generator learns both queries, the fixture server
  answers them, and the file is regenerated.
- Both languages, the narrow frame, axe, and a visual parity check.

## Out of scope

- **The derived helpers.** `startingDose`, `standardMonthly`, `firstMonthSaving`,
  `formatPrice`, `comparisonRows` and `comparisonDurations` are logic, not
  content, and they stay. "`content.ts` goes" in the build-plan line means the
  fixture inside it, not the file's every export.
- **The 30 chrome keys.** The build plan says 62 message keys go. That is wrong
  and this spec corrects it: 31 keys are content and move, 30 are chrome, and one
  is already dead. See Data below.
- **A treatments index.** Still undrawn; the two landing CTAs keep pointing at
  Wegovy Pill.
- **Preview through `LiveQuery`.** The landing page renders its server load
  directly and this page follows it. Adding click-to-edit here is a separate
  decision, not a side effect of the switch.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

The order is the 26c lesson applied again: the browser harness learns the new
queries **before** the app depends on them, so the switch never lands on a
fixture that cannot answer it.

- [x] **Step 1 - The list query and the harness that can answer it** -
  `treatmentsQuery` beside 27a's two; `generate-sanity-fixture.mjs` fetches
  treatments and the singleton; `fixture-server.mjs` answers both by shape, the
  way it answers `legalPage-`; the fixture regenerated. Nothing reads any of it
  yet, so the app is unchanged.
  *Done when:* `e2e/fixtures/sanity-articles.json` carries `treatments` and
  `treatmentsPages` for both languages with the same prices the page shows today
  (`12400` for the pill's three-month plan, `6900` first month); the fixture still
  carries `articles`, `homePages`, `announcements`, `testimonials` and
  `legalPages`; `pnpm test:browser` is green on all 193.

- [x] **Step 2 - The page reads Sanity** - the load fetches the three treatments
  and the singleton and 404s on a missing document; the page and its sections
  take the mapped data; `SanityTreatmentPage` becomes the shape the components
  see. **This is the step that cannot land in halves.**

  **Capture the before first.** Full-page screenshots of all three treatments at
  1440 and 390 in both languages, into the scratchpad. After this step the
  fixture rendering is gone and the comparison cannot be reconstructed.
  *Done when:* all three pages at 1440 and 390 in both languages are
  indistinguishable from those captures; `/treatments/not-a-treatment` is still a
  404 with its own screen rather than a blank page; the rating still renders in
  the hero, from the same cached Reviews.io call; `pnpm test:browser` is green,
  including the price assertions on `€124`, `€109`, `€149`, `€209` and `€69`.

- [x] **Step 3 - The photographs move to the CDN** - `TreatmentGallery` and
  `PlanComparison` take a `SanityPicture` instead of an `enhanced:img` import,
  `TreatmentPhoto` narrows to one shape, and the `?enhanced` import goes.
  *Done when:* the gallery's `img` carries a `w`-descriptor srcset from the CDN
  and no `<picture>` element; the image-density assertion in
  `marketing-fidelity.spec.ts` passes for the treatment pages, so nothing is
  drawn above the pixels it carries; Wegovy Pill still draws no photograph at all.

- [x] **Step 4 - The fixture and the dead fields out** - the fixture tables,
  their message-reading builders and `treatmentPages()` deleted from
  `content.ts`, leaving the derived helpers; the 31 content keys out of both
  catalogues along with the already-dead `treatment_price_per_month`; `dose`,
  `claim` and `price` off `Treatment` and out of the catalogue;
  `content.test.ts` rewritten onto the helpers that remain.
  *Done when:* `grep` finds no `PLAN_PRICES`, `DOSE_PRICES` or `treatmentPages`
  in `src/`; the 32 keys are gone from both catalogues and `pnpm build` reports
  no missing message; `dose`, `claim` and `price` are gone from
  `src/lib/domain/catalogue.ts`; `pnpm test` and `pnpm check` are clean.

- [x] **Step 5 - Both languages, the frame and the gate** - the parity
  comparison against step 2's captures, the narrow frame, axe, and the full
  suite.
  *Done when:* `pnpm test`, `pnpm check`, `pnpm build` and `pnpm test:browser`
  are green; no horizontal scroll at 390 on any of the three pages in either
  language; axe reports no serious violation; and the before and after captures
  read as the same pages.

## Files / areas

| File | Why |
| --- | --- |
| `src/lib/sanity/queries.ts` | `treatmentsQuery` and its response type |
| `scripts/generate-sanity-fixture.mjs` | fetches treatments and the singleton |
| `e2e/fixture-server.mjs` | answers both treatment queries by shape |
| `e2e/fixtures/sanity-articles.json` | regenerated |
| `src/routes/(marketing)/treatments/[slug]/+page.server.ts` | reads Sanity, 404s on absence |
| `src/routes/(marketing)/treatments/[slug]/+page.svelte` | takes the mapped page |
| `src/lib/features/treatments/from-sanity.ts` | gains the list mapper |
| `src/lib/features/treatments/content.ts` | fixture out, derived helpers stay |
| `src/lib/features/treatments/content.test.ts` | rewritten onto the helpers |
| `src/lib/features/treatments/types.ts` | `TreatmentPhoto` narrows to `SanityPicture` |
| `src/lib/features/treatments/TreatmentGallery.svelte`, `PlanComparison.svelte` | CDN picture |
| `src/lib/domain/catalogue.ts`, `types.ts` | `dose`, `claim`, `price` out |
| `messages/de.json`, `messages/en.json` | 32 keys out |

## Data / contracts

**`treatmentsQuery`**, the addition 27a did not foresee:

```groq
*[_type == "treatment" && language == $language] { ...the same projection }
```

One query, three documents, because the comparison table reads every treatment's
plans. 27a's `treatmentQuery` stays for a single-document read; the page uses the
list and picks its own out of it, so the table and the dose selector read one
response and cannot disagree.

**The 62 keys, split.** The build-plan line is wrong and this is the correction:

| | Count | What |
| --- | --- | --- |
| Move to Sanity | 31 | The copy `content.ts` reads: intros, captions, form labels, the dosing note, the three how-it-works steps, the seven FAQs |
| Stay | 30 | Chrome the components own: table headers, "Best value", the dose heading, the offer card's labels, the 404 page |
| Already dead | 1 | `treatment_price_per_month`, used by nothing |

**Load-bearing, and unchanged:** `treatmentId` is still the join to
`src/lib/domain`. The catalogue keeps `id`, `name` and `form`; the nav dropdown,
the gallery icon and the comparison table's product names still resolve through
it.

**Still derived, never stored:** `startingDose`, `standardMonthly`,
`firstMonthSaving`, `comparisonRows` and their order, `comparisonDurations`,
`isCurrent`, and `formatPrice`.

**The 404 changes hands, and gains a case.** Today it comes from
`findTreatmentPage` returning null for an unknown slug. After this it comes from
Sanity returning no document.

That is a genuinely new failure the fixture could not have: **a treatment the
catalogue knows but nobody has written a page for**. The navigation dropdown is
built from `TREATMENTS`, so that product would still be listed and its link would
404. The catalogue is three ids and all three are seeded, so this is not live
today; it becomes live the moment somebody unpublishes one. The mapper cannot fix
it, because a missing document is not something a page-level mapper sees.

Step 2 does not solve it and must not pretend to. What it does is record the
behaviour honestly: a nav item whose document is gone leads to the 404 screen,
which is a broken link rather than a broken page. Making the dropdown read
published documents is a real improvement and a different feature; the spec names
it rather than absorbing it.

## Testing

`pnpm test` is the gate. The mapper's tests exist from 27a; what this feature
adds is small.

| In scope | Why |
| --- | --- |
| The list mapper | Three documents to three pages, one refused for an unknown id |
| `comparisonRows` on mapped data | It moves off `treatmentPages()`; its ordering and `isCurrent` tests follow it |
| `content.test.ts` | Its fixture-coverage tests go with the fixture; the derived-helper tests stay and are re-pointed |

`pnpm test:browser` carries the weight and is the reason step 1 comes first.
**Thirty-one existing tests in `treatments.spec.ts` render these pages**, and
they assert exact prices, the dose selector, the sticky bar and the comparison
table. They are the regression net for the whole switch: if the fixture cannot
answer the new queries, they fail as a block.

**Not covered by any runner, so check by eye:** the gallery's photograph after it
moves to the CDN, and the three pages against their artboards.

## Notes for the AI

- **`seed-treatments.ts` must not run again after step 4.** It reads its prices
  from `content.ts` and its strings from the catalogues, and this feature deletes
  both. It is bootstrap only and its header says so.
- **The fixture server matches queries by shape**, not by parsing GROQ. Both
  treatment branches need a discriminator that cannot collide with the article or
  legal-page branches; `_type == "treatment"` and `treatmentsPage-` are the
  natural ones, and the singleton must be recognised before the list.
- **The generator writes the whole fixture file.** It silently dropped
  `legalPages` before 26c repaired it. Adding two keys means adding them to the
  final `JSON.stringify`, not only to the fetch loop.
- Sanity strings that are read as logic go through `plain()`. Here that is
  `treatmentId` alone: it builds an href and keys the catalogue lookup.
- The load is server-side, with `locals.locale` for the language, like every
  other Sanity read in this app.
