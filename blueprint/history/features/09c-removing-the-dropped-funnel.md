# Feature: Removing the dropped funnel

**From build-plan:** feature 9c
**Status:** verified

## Goal

Delete the code the pivot orphaned: the mock checkout and order-status services,
the journey module that sequenced them, the domain types that modelled a
checkout Solean no longer runs, and the dev surface built to demonstrate all of
it. Nothing here changes behaviour a visitor can see.

## What the survey found

Checked before writing this, because the answer decides the scope.

| Module | Who still calls it |
| --- | --- |
| `features/checkout/` | `/dev/scenario` only |
| `features/order-status/` | `/dev/scenario` only |
| `lib/journey/` | `features/checkout/`, `/dev/scenario` and its `guarded/` child |
| `domain` `AddOn`, `PatientProfile`, `ShippingAddress`, `Order`, `PricingBreakdown`, `OrderStatus`, `Answer`, `QuestionnaireAnswers` | the three modules above |
| `domain` `TREATMENTS`, `findTreatment`, `Treatment` | marketing and learn, which keep them |
| `domain` `formatMoney`, `INITIAL_TREATMENT_FEE`, `FIRST_ORDER_DISCOUNT` | `/dev/scenario` only, or nothing at all |

Feature 9b already took the questionnaire off the journey: answers live in
`survey.data`, and no product route imports `lib/journey` any more.

**So the journey module goes entirely, rather than being reduced to three
stages.** Nothing would call the reduced version: the questionnaire owns its own
state, and feature 12 keeps the anamnesis uid in that same session, where it has
the same lifetime. `journey/storage.ts` is not a reusable helper either; it is a
validator for the dead session shape, checking answers, patient details and a
shipping address. Feature 11 needs a different one, keyed by questionnaire
identifier and version.

This is the one place the feature departs from the build-plan line, which says
"reduce the journey stages". Building a module with no caller would break the
project's own rule, so the plan text needs a small edit alongside this feature.

## In scope

- Delete `src/lib/features/checkout/` and `src/lib/features/order-status/`
- Delete `src/lib/journey/`
- Delete `/dev/scenario` and its `guarded/` child, and repoint the one link into
  it from the design system showcase
- Trim `src/lib/domain/` to `Money`, `eur`, `Treatment`, `TreatmentForm`,
  `TREATMENTS` and `findTreatment`

## Out of scope

- Any change a visitor can see. Marketing, learn and the questionnaire keep
  behaving exactly as they do today
- Session persistence and the anamnesis uid (features 11 and 12), which will be
  written where their caller is, not restored from the deleted journey
- The remaining question types (feature 10)
- `blueprint/context/project-overview.md`, which is generated: it is refreshed by
  `/overview` after the plan edit, not hand-patched here
- The archives under `blueprint/history/`, which name `/dev/scenario` because it
  existed when they were written. History records what was true then and is never
  rewritten to match the present

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - The scenario surface** - Delete `src/routes/dev/scenario/`, and
  point the design system showcase's interactive Card at `/dev/questionnaire`,
  the dev surface that still exists. The Card stays a working link rather than
  becoming inert: feature 3a repaired it precisely because it was not one. *Done when:* `/dev/scenario` is a 404, the
  showcase's interactive Card opens `/dev/questionnaire`, and `pnpm check` and
  `pnpm build` pass.

- [x] **Step 2 - The checkout and order-status modules** - Delete
  `src/lib/features/checkout/` and `src/lib/features/order-status/`. *Done when:*
  no file imports either path, `pnpm check` and `pnpm build` pass, and
  `pnpm test:browser` is green.

- [x] **Step 3 - The journey module** - Delete `src/lib/journey/`. *Done when:*
  no file imports `$lib/journey`, and check, build and the browser suite pass.

- [x] **Step 4 - The domain trim** - Remove `AddOn`, `AddOnUnit`, `Answer`,
  `QuestionnaireAnswers`, `PatientDetails`, `PatientProfile`, `ShippingAddress`,
  `PricingBreakdown`, `OrderStatus`, `OrderLineItems`, `Order`, `IsoDate`,
  `ADD_ONS`, `findAddOn`, `INITIAL_TREATMENT_FEE`, `FIRST_ORDER_DISCOUNT` and
  `formatMoney`. *Done when:* `src/lib/domain/` exports only what marketing and
  learn import, check and build pass, the browser suite is green, and the landing
  page and learn article render unchanged.

## Files / areas

| Path | Change |
| --- | --- |
| `src/routes/dev/scenario/**` | deleted (4 files) |
| `src/routes/dev/design-system/SurfacesSection.svelte` | the interactive Card points at a surface that exists |
| `src/lib/features/checkout/`, `src/lib/features/order-status/` | deleted |
| `src/lib/journey/` | deleted (4 files, 328 lines) |
| `src/lib/domain/types.ts`, `catalogue.ts`, `money.ts` | trimmed to the marketing and learn surface |
| `blueprint/build-plan.md`, `blueprint/project-plan.md` | the journey line and the architecture tree, after approval |

## Data / contracts

What survives in `src/lib/domain/` is the contract marketing, learn and feature
12's recommendation screen read:

```ts
export interface Money { amount: number; currency: 'EUR' }
export function eur(cents: number): Money;

export type TreatmentForm = 'injection' | 'tablet';
export interface Treatment {
	id: string;
	name: string;
	form: TreatmentForm;
	dose: string;
	claim: string;
	price: Money;
}

export const TREATMENTS: readonly Treatment[];
export function findTreatment(id: string): Treatment | null;
```

`Treatment.price` stays even though nothing renders it today: it is the
catalogue's own data, and feature 12's recommendation screen shows a price.
`formatMoney` goes, because a formatter with no caller is the kind of thing this
project deletes; feature 12 adds it back where it renders one.

## Testing

No unit runner, so no step ships a unit test. This feature removes code rather
than adding behaviour, so the evidence is that nothing else moved:

| Claim | Evidence |
| --- | --- |
| Nothing imports the deleted modules | `pnpm check` after each step |
| The app still builds | `pnpm build` after each step |
| No visible regression | `pnpm test:browser`, 15 specs covering marketing, the questionnaire flow and the dev model surface |
| The showcase link is not a 404 | Open `/dev/design-system` and follow the interactive Card |

## Notes for the AI

- **Deletion only.** If a step tempts you to rewrite something to keep it alive,
  that is a sign it should stay deleted and be rebuilt by the feature that needs
  it.
- **Delete in dependency order**, consumers before the modules they consume, so
  every step leaves a compiling app.
- The `(checkout)` route group never existed on disk; there is nothing to remove
  there.
- No e2e spec references `/dev/scenario`, so no test needs rewriting for step 1.
- The plan edits are user-owned: make them only after the deviation above is
  approved, and regenerate the overview with `/overview` rather than editing it.
