# Feature: Prototype architecture

**From build-plan:** feature 2
**Status:** verified

## Goal

Lay the structural foundation the whole funnel is built on: the shared domain
layer (`Money`, `Treatment`, `AddOn`, `PatientProfile`, `Order` and the canonical
catalogue), the cross-feature journey module (stages, transition rules, guards,
and SSR-safe `sessionStorage` persistence), and the typed service contracts with
their first mock adapters. All of it proved in the browser on a small scenario
page at `/dev/scenario`.

This matters because features 7 through 11 are the funnel, and every one of them
reads or writes this layer. The persisted session shape in particular is written
by the questionnaire and read by checkout and order status, so getting it wrong
here means a migration across three features rather than an edit in one file.

## Design reference

**No artboard governs this feature.** It ships no user-facing surface. The one
visible output, `/dev/scenario`, is a development and QA surface exactly like
`/dev/design-system`: it is not in the reference set, not public, and not linked
from the app.

That means the scenario page must **not** invent a visual language. It composes
the primitives adapted in feature 1, uses only semantic tokens and stock
Tailwind scales, and stays plain. If a layout question comes up, copy the
existing showcase at `src/routes/dev/design-system/+page.svelte`.

The one place the reference does bind this feature is **money presentation**.
The export renders prices as `€144.00`, `€9.90`, `€49.00`: leading euro symbol,
dot decimal separator, no space. That is the format `formatMoney` produces.

## Decisions to settle

**All three are settled.** Recorded here on 2026-08-29 at the start of
`/implement`, so the choices survive a context clear.

| # | Decision | Settled as |
| --- | --- | --- |
| 1 | Test runner | **Option B, leave testing unconfigured.** No runner is installed by this feature. `pnpm check` plus `pnpm build` plus the scenario page are the gate, and no step claims unit coverage |
| 2 | Guard enforcement | **Option A, opt out of SSR plus a universal load guard.** Guarded groups set `export const ssr = false` and guard in `+layout.ts`. Marketing and learn keep SSR |
| 3 | Add-on units | **As proposed.** Consultation `one-off`, coaching `per-session`, smart scale `one-off`, marked provisional in the fixture |

The reasoning behind each is kept below for the record.

### 1. Test runner - SETTLED: Option B, testing stays unconfigured

Feature 1 shipped no logic worth testing and correctly installed no runner. This
feature is the opposite: it introduces the first genuinely testable logic in the
project, and all of it is load-bearing for features 7 through 11.

| Logic | Why it earns a test |
| --- | --- |
| `parseSession` | Parses untrusted `sessionStorage` JSON. Malformed, truncated, wrong-version and wrong-shape input all have to be rejected without throwing |
| `formatMoney` | A formatter with edge cases (zero, whole euros, negative discount amounts) |
| `canEnter` / stage rules | The guard table. A wrong answer either leaks a guarded route or locks a valid user out |
| `toPatientProfile` | Assembles a complete profile from partial session pieces, or returns null |

The build plan says the testing decision must be explicit before feature 9. This
is the natural moment to make it, because a runner added now covers this
feature's logic **and** feature 9's pricing engine, whereas one added at feature
9 leaves this layer permanently untested.

- **Option A (recommended):** run `/tests` before Step 3. The gate turns on, and
  steps 3, 4, 5 and 6 each ship a focused test in the same diff.
- **Option B:** leave testing unconfigured. Every step is verified by
  `pnpm check`, `pnpm build` and the scenario page, and no claim is made that
  this logic has unit tests.

The spec below works either way; the Testing section covers both branches.

### 2. How guarded routes enforce the journey - SETTLED: Option A

The journey session lives in `sessionStorage`, which the server cannot read. That
rules out the obvious pattern, so this must be settled before Step 9 sets the
pattern features 7, 9 and 11 will copy.

| Option | Behavior | Verdict |
| --- | --- | --- |
| **A. Guarded groups opt out of SSR** (`export const ssr = false` in the group layout) and the guard runs in a universal `+layout.ts` load | Load runs in the browser only, so the session is readable and `redirect()` fires before any guarded content paints | **Recommended.** Marketing and learn keep SSR for SEO; the funnel is app-shaped and non-indexable anyway, and the plan already says the prototype can ship as a static build |
| B. Keep SSR, guard in a component `$effect` calling `goto()` | Guarded content renders, then disappears. A visible flash on every blocked entry | Rejected unless A proves impossible |
| C. Keep SSR, guard in a universal load with a `browser` check | On a direct deep link the load runs on the server, finds no session, returns, and never re-runs after hydration. **The guard silently does nothing** | Rejected. This is the trap worth naming |

Recommendation: **A**.

### 3. Add-on units - SETTLED as proposed, cheap to change

Open question 3 in the overview says lock `AddOn.unit` before feature 10, but the
catalogue fixture written in Step 1 has to carry *some* value. Proposed, and
marked provisional in the fixture: doctor consultation `one-off`, coaching
`per-session`, body smart scale `one-off`. Overriding this later is one field in
one file, so it does not gate any step.

## In scope

- **Domain layer** at `src/lib/domain/`: `Money` and its helpers, `Treatment`,
  `AddOn`, `OrderStatus`, `PricingBreakdown`, `ShippingAddress`,
  `PatientDetails`, `PatientProfile`, `Order`, `Answer`, `QuestionnaireAnswers`.
- **Canonical catalogue** at `src/lib/domain/catalogue.ts`: three treatments and
  three add-ons at the exact fixture prices from the plan. One source of truth.
- **Journey module** at `src/lib/journey/`: the four stages, the transition
  rules, the guards, the SSR-safe `sessionStorage` adapter with a versioned and
  validated read, and the rune-based state module that composes them.
- **Three service contracts and their mock adapters**, each owned by its feature
  module: `QuestionnaireService`, `CheckoutService`, `OrderService`. Only the
  methods the scenario page actually calls.
- **Six seeded mock order ids** (`mock-review`, `mock-approved`,
  `mock-declined`, `mock-info-required`, `mock-prescription-issued`,
  `mock-dispatched`) resolving to the six `OrderStatus` values.
- **Scenario page** at `/dev/scenario`: current stage, session summary, treatment
  and add-on selection, the guard table, seeded order selection, reset, and proof
  that a refresh preserves state.
- **One guarded demo route** at `/dev/scenario/guarded` applying the chosen guard
  pattern end to end, so features 7, 9 and 11 copy something that has been shown
  to work.

## Out of scope

- **The pricing engine.** `src/lib/features/checkout/pricing.ts` is feature 9.
  Nothing in this feature computes a subtotal, discount, shipping or total, and
  no fixture hardcodes one.
- **`Order` fixtures with line items and totals.** They need pricing. Feature 11
  builds them; `OrderService` here resolves a seeded id to a **status** only.
- **`QuestionnaireSchema`, `QuestionStep`, options and validation rules.**
  Feature 7 owns them. This feature stores answers, it does not define or
  validate the questions that produce them.
- **The real route groups** `(marketing)`, `(questionnaire)`, `(checkout)`.
  Features 3, 7 and 9 create them. Creating them empty now would collide with
  feature 3 and build ahead of a caller.
- **`src/lib/features/marketing/` and `src/lib/features/learn/`.** No caller
  exists. Static content features consume typed fixtures directly and do not get
  a service, so an empty module would be pure scaffolding.
- **`src/lib/server/integrations/`.** Deferred to the first real integration.
- **Content fixtures:** `Clinician`, `Testimonial`, `FaqItem`, `Article` belong
  to features 5 and 6.
- **Product components:** `TreatmentOption`, `AddOnCard`, `OrderSummary`,
  `CheckoutStep`, `ReviewTimeline`. Each belongs to the feature that owns its
  domain semantics.
- **New UI primitives.** Feature 1 delivered thirteen. This feature adds none and
  edits none.
- **Eligibility logic.** Open question 1, undecided, blocks feature 8 not this.
- **The landing page.** `src/routes/+page.svelte` keeps the SvelteKit welcome
  page until feature 3.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

Steps 1 and 2 are pure types and fixtures. Steps 3 to 6 build the journey and
services bottom up, each one usable by the next. Steps 7 to 9 make all of it
visible and exercisable in a browser.

- [x] **Step 1 - Money, the `Treatment` and `AddOn` types, and the canonical
  catalogue** - Create `src/lib/domain/money.ts` (`Money`, `eur(cents)`,
  `formatMoney`), define `Treatment` and `AddOn` (the catalogue cannot be typed
  without them), then write `src/lib/domain/catalogue.ts` holding the three
  treatments (Mounjaro, Wegovy, Wegovy Pill) and the three add-ons, with the
  exact fixture prices from the plan: treatment plan first month 144.00, initial
  treatment fee 9.90, consultation 49.00, coaching 29.00, body smart scale 39.00,
  first-order discount -75.00. Add the `src/lib/domain/index.ts` barrel. Mark the
  add-on `unit` values provisional per decision 3.
  *Reference for the fixture content, not the layout:*
  `blueprint/reference/EN Questionnaire 8 — Treatment Preference.png` is the one
  artboard showing all three treatments together with their form, dose and claim
  copy. `blueprint/reference/EN Checkout — Step 1 · Account.png` and
  `blueprint/reference/EN Checkout — Step 1 · Account — Consultation Added.png`
  carry the add-on names and descriptions. Take names, doses and claim strings
  from those, not from invention. Where the export contradicts itself, section 9
  of `blueprint/project-plan.md` wins.
  *Done when:* `pnpm check` and `pnpm build` pass; every price is an integer
  number of cents and no float appears anywhere in the module;
  `formatMoney(eur(14400))` returns `€144.00` and `formatMoney(eur(990))`
  returns `€9.90`, matching the export's presentation; coaching is 29.00 and the
  smart scale 39.00, resolving the reference's 29-versus-39 conflict; the three
  treatment names come from this file and nowhere else.

- [x] **Step 2 - The remaining domain types** - Add `OrderStatus` (the six
  canonical values), `PricingBreakdown`, `ShippingAddress`, `PatientDetails`,
  `PatientProfile`, `Order`, `Answer` and `QuestionnaireAnswers`. Types only:
  no fixture in this step invents an order, a total or a patient. `Answer` is the
  kind-tagged union in Data / contracts below. Dates are ISO `YYYY-MM-DD`
  strings, never `Date` objects, because the session round-trips through JSON.
  *Done when:* `pnpm check` passes with no `any` anywhere in
  `src/lib/domain/`; `OrderStatus` has exactly the six values from the overview;
  every type in the overview's data model either exists here or is explicitly
  listed as deferred in this spec's Out of scope; nothing in the module imports
  from `src/lib/features/`.

- [x] **Step 3 - SSR-safe session storage adapter** - Create
  `src/lib/journey/storage.ts` with `readSession()`, `writeSession()`,
  `clearSession()` and the exported `parseSession(raw)` validator. Guard every
  call with `browser` from `$app/environment`. Reading wraps `JSON.parse` in
  `try`/`catch`, checks `version`, validates shape, and returns `null` on any
  failure rather than throwing. Writing tolerates a quota or private-mode
  rejection without breaking the page.
  *Done when:* on the server every function is a no-op and `readSession()`
  returns `null`; hand-writing malformed JSON into the storage key and reloading
  produces a clean empty session with no thrown error; hand-writing a valid
  session with `version: 0` discards it; a valid session round-trips unchanged;
  if the test gate is on (decision 1), `parseSession` ships with tests covering
  malformed, truncated, wrong-version and wrong-shape input.

- [x] **Step 4 - Stages, transitions and guards** - Create
  `src/lib/journey/stages.ts`: the four ordered stages, `nextStage`,
  `reachedStage(session)` and `canEnter(stage, session): StageAccess`. Pure
  functions over a session value, no state and no storage. The guard returns an
  actionable result carrying a redirect target and a reason, not a bare boolean.
  Add `toPatientProfile(session)` in the **journey** module, not domain: it reads
  a session and returns a domain type, and the import direction is one way.
  `src/lib/journey/` may import `src/lib/domain/`; domain never imports journey.
  *Done when:* `pnpm check` passes; `canEnter('checkout', ...)` is denied for an
  empty session, denied when the questionnaire is complete but no treatment is
  selected, and allowed when both hold; `canEnter('order', ...)` is denied
  without an `orderId`; `reachedStage` on an empty session is `browsing`;
  nothing in this file imports `$app/environment`, `sessionStorage` or any
  Svelte runtime; if the test gate is on, the guard table ships with tests.

- [x] **Step 5 - Rune-based journey state** - Create
  `src/lib/journey/journey.svelte.ts` composing steps 3 and 4: a `$state` session
  initialised **empty**, hydrated from storage in the browser only, persisted on
  change, with `stage` exposed as `$derived` rather than stored. Add mutators for
  the facts the services need to write, and a `reset()`.
  *Done when:* `pnpm build` succeeds and the app server-renders without touching
  `sessionStorage`; the first client render matches the SSR output, so the
  console shows no hydration warning; changing a fact and reloading the tab
  preserves it; opening a second tab starts empty, confirming per-tab
  `sessionStorage` semantics; `stage` cannot be assigned directly from outside
  the module.

- [x] **Step 6 - Service contracts and mock adapters** - Create the three
  interfaces and their mocks, each in its own feature module:
  `src/lib/features/questionnaire/`, `src/lib/features/checkout/`,
  `src/lib/features/order-status/`. Only the methods listed in Data / contracts.
  The mocks read the domain catalogue and write journey state; components never
  touch fixtures or storage directly. Add the six seeded order ids.
  *Done when:* `pnpm check` passes; each mock implements its interface with no
  cast; a repo-wide search shows no component importing `catalogue.ts` or
  `storage.ts` directly; `OrderService.getStatus` returns the right status for
  each of the six seeded ids and `null` for an unknown one; a session carrying a
  `selectedTreatmentId` or an add-on id that is no longer in the catalogue
  resolves to `null` or is dropped rather than producing a phantom selection,
  proved by hand-editing the storage key to a bogus id and reloading; no service
  exposes a pricing, total or line-item method.

- [x] **Step 7 - Scenario page, read-only view** - Create
  `src/routes/dev/scenario/+page.svelte` with the same `noindex` head, container
  and plain dev-surface treatment as the design-system showcase. Render, through
  the services only: the current stage, the raw session summary, the selected
  treatment and add-ons, and the guard table showing each stage as allowed or
  denied with its reason. No actions yet.
  *Done when:* `/dev/scenario` loads with no console errors and no hydration
  warning; with an empty session it reads `browsing`, no treatment, and checkout
  and order both denied with a readable reason; every value on the page comes
  from a service call, not a direct fixture or storage import; the page uses only
  semantic tokens and stock Tailwind scales.

- [x] **Step 8 - Scenario page actions and persistence** - Add the controls:
  select a treatment, toggle add-ons, mark the questionnaire complete, seed one
  of the six order ids, and reset. Built from feature 1's adapted primitives with
  no bespoke styling and no new composition strings duplicated from the showcase
  (see finding F-05). Sweep the page for keyboard operation, focus visibility and
  responsiveness in the same step.
  *Done when:* selecting a treatment flips the checkout guard from denied to
  allowed live; seeding an order id flips the order guard; reload preserves every
  selection and reset clears it; the whole page is operable by keyboard with a
  visible focus ring on every control, and readable at 375px, 768px and 1440px
  with no horizontal scroll.

- [x] **Step 9 - Guarded demo route and the documented pattern** - Apply decision
  2 at `src/routes/dev/scenario/guarded/`, guarding it on the `checkout` stage.
  Add a short comment or note recording the pattern features 7, 9 and 11 copy.
  *Done when:* with an incomplete session, visiting `/dev/scenario/guarded`
  directly by URL redirects to `/dev/scenario` **before any guarded content
  paints**, both on a cold load and on client-side navigation; with a complete
  session it renders; the same holds after a hard refresh on the guarded URL;
  `pnpm check` and `pnpm build` pass.

## Files / areas

| Path | Change |
| --- | --- |
| `src/lib/domain/money.ts` | New: `Money`, `eur`, `formatMoney` |
| `src/lib/domain/catalogue.ts` | New: canonical treatments, add-ons, fixture prices |
| `src/lib/domain/types.ts` | New: the remaining domain types |
| `src/lib/domain/index.ts` | New: barrel |
| `src/lib/journey/storage.ts` | New: SSR-safe versioned persistence and `parseSession` |
| `src/lib/journey/stages.ts` | New: stages, transitions, guards |
| `src/lib/journey/journey.svelte.ts` | New: rune-based state |
| `src/lib/features/questionnaire/` | New: `QuestionnaireService` + mock |
| `src/lib/features/checkout/` | New: `CheckoutService` + mock |
| `src/lib/features/order-status/` | New: `OrderService` + mock, seeded ids |
| `src/routes/dev/scenario/+page.svelte` | New: scenario surface |
| `src/routes/dev/scenario/guarded/` | New: guarded demo route |

Untouched: every file under `src/lib/components/`, `src/routes/layout.css`,
`src/routes/+layout.svelte`, `src/routes/+page.svelte`,
`src/routes/dev/design-system/`, `vite.config.ts`, `components.json`. This
feature adds no dependency unless decision 1 selects Option A.

## Data / contracts

Everything here is load-bearing. The session shape in particular is written by
feature 7 and read by features 9, 10 and 11, so changing it later is a migration
across three features.

**1. Money.** `{ amount: number; currency: 'EUR' }`, `amount` always an integer
number of cents. Never a float, never a formatted string in storage.
`formatMoney` renders `€144.00`.

**2. `Answer` is a kind-tagged union**, so a persisted answer describes itself
and can be validated on read without the schema:

```ts
type Answer =
  | { kind: 'single-select'; optionId: string }
  | { kind: 'multi-select'; optionIds: string[] }
  | { kind: 'numeric'; value: number; unit?: string }
  | { kind: 'contact'; fields: Record<string, string> };
```

Interstitials produce no answer. Feature 7 maps `QuestionStep.kind` onto these
and feature 8 adds no new arm without saying so.

**3. `JourneySession` is the persisted shape.**

```ts
interface JourneySession {
  version: 1;
  questionnaire: { answers: QuestionnaireAnswers; completed: boolean };
  selectedTreatmentId: string | null;
  selectedAddOnIds: string[];
  patient: PatientDetails | null;
  shipping: ShippingAddress | null;
  orderId: string | null;
}
```

- **`stage` is deliberately absent.** It is derived from these facts, so it can
  never drift out of agreement with them.
- **`completed` is an explicit flag**, not something inferred from
  `firstUnansweredIndex`. Inferring completion needs feature 7's schema, and a
  placeholder computation here would be fake logic that later has to be unpicked.
- `QuestionnaireAnswers` keeps `firstUnansweredIndex` as the overview specifies,
  but **feature 7 owns setting it**, because only the schema knows the order.
- `version` is checked on every read; a mismatch discards the session rather than
  half-loading it.

**4. `PatientProfile` is assembled, not stored.** `PatientDetails` holds
`firstName`, `lastName`, `email`, `phone?`, `dateOfBirth`, all collected at
checkout. `PatientProfile = PatientDetails & { answers; selectedTreatmentId }` is
produced by `toPatientProfile(session)`, returning `null` until every piece
exists. This keeps the overview's `PatientProfile` intact without forcing a
`Partial<>` through the questionnaire, where name, email and date of birth do not
exist yet.

**5. Stages and the guard result.**

```ts
type JourneyStage = 'browsing' | 'questionnaire' | 'checkout' | 'order';

type StageAccess =
  | { allowed: true }
  | { allowed: false; redirectTo: string; reason: string };
```

One stage per route group, so the guard maps onto routing directly. Rules:
`questionnaire` always enterable; `checkout` needs
`questionnaire.completed && selectedTreatmentId !== null`; `order` needs
`orderId !== null`. The guard returns a redirect target and a human-readable
reason so a layout can act on it and the scenario page can display it.

**6. Service contracts.** Minimal on purpose. Each is owned by its feature
module, and the feature that needs more methods adds them.

| Interface | Methods now | Added later by |
| --- | --- | --- |
| `QuestionnaireService` | `getAnswers()`, `saveAnswer(questionId, answer)`, `setCompleted(bool)`, `clear()` | 7, 8 |
| `CheckoutService` | `listTreatments()`, `listAddOns()`, `selectTreatment(id)`, `toggleAddOn(id)`, `getSelection()` | 9, 10 |
| `OrderService` | `getStatus(orderId)`, `listSeededOrderIds()` | 11 |

`OrderService` returns a **status**, not an `Order`. A full `Order` carries a
`PricingBreakdown`, and hardcoding one in a fixture would create a second source
of truth for money that the feature 9 pricing engine would then contradict.

**7. Injection is a module singleton, not context.** Each feature module exports
one mock instance. This is safe only because journey state is never written
during SSR (see Notes). If a later feature ever needs a server-side session, this
moves to Svelte context and that is a deliberate change, not a quiet one.

## Testing

**Which branch applies depends on decision 1.**

**If `/tests` has been run (Option A, recommended):** the gate is on, and these
steps ship a focused test in the same reviewable diff.

| Step | Test |
| --- | --- |
| 1 | `formatMoney` on zero, whole euros, sub-euro and a negative discount amount |
| 3 | `parseSession`: malformed JSON, truncated JSON, wrong `version`, missing field, valid round-trip |
| 4 | `canEnter` for all four stages against empty, questionnaire-only, treatment-selected and ordered sessions; `reachedStage`; `toPatientProfile` returning `null` on each missing piece |
| 6 | Catalogue resolution: an unknown treatment or add-on id in a session resolves to `null` rather than a phantom selection |
| 5 | Exempt. Rune state is integration-shaped and rides on the scenario page plus build |

**If testing stays unconfigured (Option B):** no runner is installed, and no step
claims unit coverage. The automated gate stays:

```
pnpm check    # svelte-kit sync + svelte-check
pnpm build
```

Both must pass before a step is approved and before any checkpoint commit.

No `Verify` command and no `Browser tests` command are declared in `AGENTS.md`,
so browser behavior is verified directly, not by a harness:

| What | How it is verified |
| --- | --- |
| Session persistence | Set state on `/dev/scenario`, reload, values survive |
| Per-tab isolation | Open a second tab, it starts empty |
| SSR safety | `pnpm build` succeeds; no `sessionStorage` access on the server |
| Hydration | Console shows no hydration mismatch warning on `/dev/scenario` |
| Corrupt storage | Hand-edit the key in DevTools to garbage, reload, no thrown error |
| Version rejection | Hand-edit `version` to `0`, reload, session discarded |
| Guards | The scenario page's guard table, plus the real redirect at `/dev/scenario/guarded` |
| Seeded orders | Each of the six mock ids resolves to its own status |
| Keyboard and focus | Tab the whole scenario page |
| Responsiveness | 375px, 768px, 1440px, no horizontal scroll |
| No arbitrary values | Repo-wide search for `text-[`, `rounded-[`, `w-[`, `h-[` in the new files |

Run `/check` when the feature is built to prove the done-whens, and `/try` for a
human walkthrough.

## Notes for the AI

- **Nothing writes journey state during SSR.** The rune module initialises empty
  and hydrates from storage in the browser only. This is what makes a module
  singleton safe; break it and state leaks between requests on a Node adapter.
- **Guard the storage boundary, not the call sites.** `browser` checks live in
  `storage.ts`. No component or service should be sprinkling `if (browser)`.
- **A persisted id is not a guarantee.** `sessionStorage` can outlive a catalogue
  edit, so resolving `selectedTreatmentId` or an add-on id always goes through
  the catalogue and always handles the miss. Never assume the lookup succeeds.
- **Import direction is one way:** routes to features to journey to domain.
  `src/lib/domain/` imports nothing from the layers above it.
- **Do not build an abstraction before a caller.** No empty feature folders, no
  `src/lib/server/integrations/`, no service method the scenario page does not
  call. Adding a method in feature 7 is cheap; carrying dead interface surface
  through five features is not.
- **One source of truth for money.** Prices exist once, in
  `src/lib/domain/catalogue.ts`. No component, mock, or fixture restates a price
  or computes a total in this feature.
- **Thin routes.** `/dev/scenario`'s `+page.svelte` composes and displays. The
  logic lives in `src/lib/journey/` and the mocks.
- **Tokens only.** Semantic tokens and stock Tailwind scales, exactly as feature
  1 established. No hex, no arbitrary values, no new primitive, no edit to
  anything under `src/lib/components/`.
- **Dark mode stays out of scope.** Do not touch the `.dark` block.
- **The scenario page is a dev surface**, `noindex`, not linked from the app, and
  not a design deliverable. Match the showcase's plain treatment rather than
  designing something new.
- **Watch F-05.** Feature 1's open finding is duplicated composition strings
  across dev-surface sections. Do not add a sixth copy; if the scenario page
  wants the same field or option-card composition, extract it once.
- **Reference errors are not requirements.** Coaching is 29.00, the smart scale
  is 39.00, and the selected treatment carries through the session. See
  `blueprint/project-plan.md` section 9.

## Verification record

Steps 1 through 6 were proved directly: `pnpm check` and `pnpm build` on every
step, plus focused probes run through Node's type stripping over `parseSession`
(27 cases), the stage and guard table (15 cases), `toPatientProfile`, the six
seeded order ids, and catalogue resolution of stale ids. Those probes were
scratch, not committed, because decision 1 settled on Option B and this project
declares no test runner.

Steps 7, 8 and 9 end in browser observations. The Chrome extension was not
connected during this session (`list_connected_browsers` returned empty across
five attempts), so the agent could not run them. **The user walked the seven-item
script manually and confirmed all of it passing on 2026-08-29**, and this feature
is marked verified on that attestation rather than on agent-captured evidence.
The items were: a clean console with no hydration warning; an empty session
reading `browsing` with both guards denied and readable reasons; the checkout
guard flipping live on treatment selection; reload persistence, per-tab
isolation and reset; malformed, wrong-version and stale-id storage all degrading
cleanly; the guarded route redirecting before paint on cold load and client-side
navigation; and keyboard, focus-ring and 375/768/1440 responsiveness.

Two defects were found by reading after the code was first called done, both the
same shape, a second source of truth disagreeing with the session:

1. `canEnter('checkout', ...)` and `reachedStage` trusted a non-null
   `selectedTreatmentId` without resolving it, so a session holding an id the
   catalogue had dropped opened checkout with no treatment behind it. Both now
   resolve through `findTreatment`.
2. The scenario page's radio group and checkboxes were passed plain `value` and
   `checked` props against `$bindable` primitives, giving each control its own
   copy of state alongside the journey's. All three now use Svelte 5 function
   bindings, so the journey is the sole owner.

## Carried into later features

- `/questionnaire` is the redirect target for a denied checkout. Feature 7 owns
  that route and needs a `+page.ts` there that forwards to the first unanswered
  step, or the redirect lands on a 404.
- `setPatient` and `setShipping` were deliberately not added to the journey
  module, so `toPatientProfile` returns `null` for every session this feature can
  produce. Feature 9 adds both when it collects the details.
- `setOrderId` sits on the journey module, not on `OrderService`, whose contract
  is `getStatus` and `listSeededOrderIds` only. Feature 11 decides where placing
  an order belongs.
- `src/lib/journey/session.ts` is a fourth journey file the spec's Files table
  did not list. It holds `JourneySession` and `emptySession()` so `stages.ts` can
  stay free of any storage import.
- The scenario page imports `ShowcaseSection` from
  `src/routes/dev/design-system/`, a dev-surface-only coupling taken to avoid
  adding another copy of the composition F-05 already tracks.
