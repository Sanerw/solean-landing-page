# Feature: 27a - The treatment schema, its documents and the mapper

**From build-plan:** feature 27a
**Status:** verified

## Goal

Give the three treatment pages a home in the Content Lake: a `treatment`
document per product per language, a `treatmentsPage` singleton for the parts all
three share, the six documents seeded from the fixture that holds them today, and
the query and typed mapper that read them back.

Additive throughout. The route keeps rendering from
`features/treatments/content.ts`, so nothing a visitor sees changes and nothing
can regress. 27b performs the switch.

The point of the whole feature is that a price change stops being a deploy.
Feature 25 chose the opposite deliberately, and this reverses it at the user's
decision.

## Design reference

None needed. 27a is a model and a mapper; no pixel moves. 27b's parity target is
the page as it renders today, plus
`blueprint/reference/treatment-page-desktop.png` and
`treatment-page-mobile.png`.

## In scope

- **Studio:** `treatment`, keyed by a `treatmentId` chosen from the catalogue's
  three ids, and `treatmentsPage` as a localised singleton for the shared
  how-it-works steps and FAQ.
- **Seed:** a script writing all six documents from the current fixture, reading
  the copy out of the Paraglide catalogues the way `seed.ts` does.
- **App:** `treatmentQuery` and `treatmentsPageQuery`, their response types, and
  `from-sanity.ts` mapping them onto the existing `TreatmentPage` shape.
- **The photographs**, uploaded by the seed and mapped through `picture()` on a
  width ladder of their own. They were nearly deferred to 27b, which would have
  left 27a shipping a `photo` field nothing fills and a mapper branch nothing
  exercises. A document that is only half seeded is worse than either half.
- Unit tests for the mapper, including every derived value staying derived.

## Out of scope

- **The switch.** 27b. The route, the fixture, the message keys and
  `content.ts` are untouched here.
- **The route.** Nothing renders from these documents until 27b. That is the
  whole shape of this sub-feature.
- **A treatments index.** Still undrawn and still deferred; the two landing CTAs
  point at Wegovy Pill until it exists.
- **Making the derived figures editable.** The starting dose, the standard
  monthly price, the first-month saving and the comparison rows stay computed,
  for the reason `content.ts` already records: a stored figure goes stale the
  moment a price moves.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - The two Studio types** - `treatment` with `treatmentId`,
  `formLabel`, `isNew`, `galleryCaption`, `intro`, `doses[]`, `plans[]`,
  `firstMonth`, `clinicianNote` and `photo`; `treatmentsPage` as the localised
  singleton carrying `howItWorks[]` and `faqs[]`. Prices are integer cents, named
  so, because `Money` is minor units and a euro typed into a cents field is a
  hundredfold error nobody notices until checkout.
  *Done when:* `npx sanity schema validate` reports 0 errors and 0 warnings; the
  Studio offers Treatment in its new-document menu with the three ids in a
  dropdown and no free text; `npx tsc --noEmit` passes in the Studio.

- [x] **Step 2 - The six documents** -
  `../studio-solean/scripts/seed-treatments.ts`, run by hand, writing the three
  treatments and the singleton in German and English from the current fixture and
  the Paraglide catalogues. Idempotent, with deterministic keys, like
  `migrate-article-body.ts`. Nothing in the app reads them yet.
  *Done when:* six documents exist, `sanity documents validate` adds no new
  errors, a re-run reports every document unchanged, and the site still renders
  every treatment page from the fixture, unchanged.

- [x] **Step 3 - The query, the types and the mapper** - `treatmentQuery` and
  `treatmentsPageQuery` in `src/lib/sanity/queries.ts` with their response types,
  and `features/treatments/from-sanity.ts` mapping them onto `TreatmentPage`,
  `HowItWorksStep` and `FaqItem`. Nothing calls it yet.
  *Done when:* `pnpm test` covers the mapper against a fixture of the real
  response: prices in cents to `Money`, plans ordered by duration, the
  recommended plan marked, an absent photo left undefined, and an unknown
  `treatmentId` refused rather than rendered; `pnpm check` and `pnpm build` are
  clean; the browser suite is untouched and green.

## Files / areas

| File | Why |
| --- | --- |
| `../studio-solean/schemaTypes/documents/treatment.ts` | new |
| `../studio-solean/schemaTypes/documents/treatmentsPage.ts` | new: the localised singleton |
| `../studio-solean/schemaTypes/objects/treatmentDose.ts`, `treatmentPlan.ts` | new |
| `../studio-solean/schemaTypes/index.ts` | registers them; both join `LOCALIZED_SINGLETONS`, and neither joins `TRANSLATED_TYPES` |
| `../studio-solean/scripts/seed-treatments.ts` | new: writes the six documents |
| `src/lib/sanity/queries.ts` | two queries and their response types |
| `src/lib/features/treatments/from-sanity.ts` + `.test.ts` | new: the mapper |

## Data / contracts

**Document ids are fixed, not generated**, following `legalPage` rather than
`article`: `treatment-wegovy-pill-de`, `treatment-wegovy-en`, and
`treatmentsPage-de`. Three known products on three known routes, exactly the
shape `legalPageQuery` addresses directly because "the four routes each know
which document they serve, so a lookup would be a query that can return the wrong
one".

This is why neither type joins `TRANSLATED_TYPES`. The index file already records
the trap: `@sanity/document-internationalization` creates translations with
generated ids, and the fixed ones would go unused. `LOCALIZED_SINGLETONS` is the
list that exists for documents addressed by a known id, and both belong on it.

**`treatment`**, one per product per language, `treatmentId` from the catalogue's
three ids as a dropdown. `formLabel`, `galleryCaption`, `intro`, `isNew`,
`clinicianNote {title, body}`, `photo`, plus:

```
doses[]  { label: string; monthlyPriceCents: number }
plans[]  { durationMonths: 3 | 6 | 9 | 12; monthlyPriceCents: number; recommended: boolean }
firstMonthCents: number
```

**`treatmentsPage`**, localised singleton at `treatmentsPage-de` / `-en`, holding
`howItWorks[] {title, body}` and `faqs[]` of the shared `faqItem`.

**Load-bearing, and the reason the ids stay in code.** `treatmentId` is the join
to `src/lib/domain`: the nav dropdown, the gallery icon and the comparison
table's product names all resolve through it. A document naming an id the
catalogue does not have has no product behind it, so the mapper refuses it rather
than rendering a page with no name and no form.

**Money is cents.** The fields are named `...Cents` so the Studio cannot be typed
in euros by mistake, and the mapper is the only place that builds `Money`.

**Still derived, never stored:** `startingDose`, `standardMonthly`,
`firstMonthSaving`, `comparisonRows` and their order, and `isCurrent`.
`formatPrice` stays in code too: it is display formatting, not content.

**The catalogue's dead fields leave in 27b, not here.** `dose`, `claim` and
`price` have no consumers anywhere outside `src/lib/domain`, but removing them is
cleanup that belongs with the switch, and 27a is meant to be purely additive.

## Testing

`pnpm test` is the gate and the mapper is squarely in scope: it is a pure
function turning a document into a typed shape, with real edge cases.

| Case | Why |
| --- | --- |
| Cents to `Money` at every price | The one conversion in the feature |
| Plans ordered by duration, recommended marked | The table and the selector read one list |
| An unknown `treatmentId` | Refused, not rendered nameless |
| A document with no photo | Undefined, not a broken image: Wegovy Pill has none today |
| The photo's ladder | The widths asked for, per the density test feature 21 taught |
| No doses or no plans | Empty rather than a crash: a half-written draft must preview |
| `treatmentsPage` absent | The page keeps its sections rather than 500ing |

The Studio schema rides on `sanity schema validate`; the documents on
`sanity documents validate` plus a read-back. No browser coverage changes here,
because nothing renders from Sanity until 27b.

## Notes for the AI

- **Two repositories.** The Studio is `../studio-solean` with its own prettier
  settings (no semicolons, single quotes, no bracket spacing, 100 columns).
- **`getCliClient` needs `perspective: 'raw'`** to see drafts. The default
  answers "no drafts" to every question about drafts, which reads as a clean
  dataset and is not the same thing. Both existing scripts learned this the hard
  way.
- **The seed reads the Paraglide catalogues**, like `seed.ts`, so the seeded copy
  cannot disagree with the page it reproduces. That fixes an order: seed before
  27b removes those keys.
- Prices in the fixture are euros (`PLAN_PRICES`, `DOSE_PRICES` hold whole
  euros and multiply by 100). The seed converts once, into cents.
- The route and `content.ts` are not touched in this feature. If a step wants to,
  the step belongs in 27b.
