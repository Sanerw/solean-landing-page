# Solean - Project Overview

<!-- blueprint:source-hash a85e75d2041f31c78c364d726229bdfaec5b8c7ab27ef7d0ec8dd87843f4997d -->

> A complete, clickable, responsive UI prototype of a doctor-led GLP-1
> weight-loss funnel, built on mocked data so the design and UX can be judged
> before any integration work is committed.

## Problem

Solean models a doctor-led weight-loss service for the German and wider EU
market: a person completes an online medical questionnaire, a clinician reviews
it, treatment is prescribed when appropriate, and medication is dispensed by a
partner pharmacy and delivered discreetly.

**This repository is not that service.** It builds the prototype that proves the
funnel works: visual translation of the design reference, responsiveness, the
end-to-end UX, the component inventory, forms and validation, price calculation,
and the success, error, and waiting states. The architecture must let mock
services be swapped for real adapters later without rewriting components.

## Users

| User | Needs |
| --- | --- |
| **Modelled end user** | EU adults, this variant addressed to men, seeking medically supervised weight loss. Price-aware, privacy-sensitive, comparing against competitor telehealth brands. Expect a consumer purchase experience, not a clinical portal. |
| **Actual user of this repo** | The product and design team reviewing whether the funnel works. Every feature must be independently runnable and reviewable in a browser. |

No access tiers exist. There is no authentication, and no clinician-facing
surface is in scope.

## Features

Twelve top-level features in build-plan order. Feature 3 is split into a design
system completion pass and the marketing shell. The headline is the funnel
itself, delivered across 7 through 11.

1. **Design system and core UI components** - semantic tokens, two fonts,
   radii, brand foundations, and the initial thirteen shared shadcn primitives
   installed *and adapted*, proven on a showcase at `/dev/design-system`.
2. **Prototype architecture** - feature-first layout, domain types, journey
   state, service contracts, proven by a small scenario page.
3a. **Design system completion** - nine reference-proven primitives, the
   seven-variant Button contract, and outstanding showcase and contrast repairs.
3b. **Marketing shell and hero** - the first page a visitor can land on and
   navigate.
4. **Landing page product story** - projection, results, bento, how it works.
5. **Landing page social proof** - testimonials, clinical team, FAQ.
6. **Learn article** - the Mounjaro vs Wegovy comparison page.
7. **Questionnaire foundation** - schema, service, shell, state, one working
   question as the vertical slice.
8. **Questionnaire content and completion** - every remaining question through
   to treatment preference and completion.
9. **Checkout foundation** - account, shipping, order summary, pricing engine.
10. **Checkout customization and mock payment** - switching, add-ons, mock pay.
11. **Doctor review and order status** - six states, each directly reachable.
12. **End-to-end prototype hardening** - continuity, states, sweeps, verification.

Deferred and explicitly out of scope: Shopify, RxScale, real payment,
server-side sessions, authentication, member account, German routing, undesigned
routes, dark mode, clinician tooling.

## Data model

Nothing real is stored. Every value is a fictional fixture, persisted only to
`sessionStorage`, SSR-safe.

**Ownership boundary.** `src/lib/domain/` owns the canonical treatment and
add-on catalogue including shared fixture prices, because marketing,
questionnaire, and checkout all read it.
`src/lib/features/checkout/pricing.ts` owns the pure calculation that consumes
the catalogue and produces subtotal, discount, shipping, and total.

### Money

- `amount` (integer, minor units) - cents, to keep the pricing engine free of
  float error
- `currency` (`'EUR'`)

This representation is locked in the project plan. Euro values are never stored
as floating-point amounts for calculations.

### Treatment (domain, canonical)

- `id` (string)
- `name` (string) - "Mounjaro", "Wegovy", "Wegovy Pill"
- `form` (`'injection' | 'tablet'`)
- `dose` (string) - e.g. "1.5 mg"
- `claim` (string) - e.g. "Lose up to 23% body weight"
- `price` (Money) - first month supply
- Referenced by: questionnaire treatment preference, checkout line items, learn
  comparison table

### AddOn (domain, canonical)

- `id` (string)
- `name` (string) - consultation, coaching, body smart scale
- `description` (string)
- `price` (Money)
- `unit` (`'one-off' | 'per-session'`)

> Lock `unit` before feature 10. The reference prices coaching inconsistently
> (29 in one panel, 39 in a modal); one canonical value wins.

### QuestionnaireSchema

- `steps` (QuestionStep[]) - ordered, the single definition of step order
- One canonical question count. Interstitials must not shift question numbering.

### QuestionStep

- `id` (string)
- `kind` (`'single-select' | 'multi-select' | 'numeric' | 'contact' | 'interstitial'`)
- `title`, `help` (string)
- `options` (Option[], for select kinds) - an option may be flagged exclusive to
  implement "none of the above"
- `validation` (rule set)

### QuestionnaireAnswers

- `byQuestionId` (Record<string, Answer>)
- `firstUnansweredIndex` (number) - drives resume
- Relationship: validated against QuestionnaireSchema

### PatientProfile (domain)

- `firstName`, `lastName`, `email` (string)
- `phone` (string, optional)
- `dateOfBirth` (date) - collected at checkout, not in the questionnaire
- `answers` (QuestionnaireAnswers)
- `selectedTreatmentId` (Treatment id) - **must carry through to checkout**

### ShippingAddress

- `street`, `postcode`, `city`, `country` (string)
- `deliveryEstimate` (string) - always presented as conditional on clinical
  approval

### PricingBreakdown

- `subtotal`, `discount`, `shipping`, `total` (Money)
- Produced only by `pricing.ts`. No component computes or hardcodes a total.

### Order (domain)

- `id` (string) - reference in the style `#SL-24819`
- `lineItems` (treatment + add-ons)
- `pricing` (PricingBreakdown)
- `status` (OrderStatus)
- Relationship: one PatientProfile, one Treatment, many AddOns

### OrderStatus

`'review-in-progress' | 'approved' | 'declined' | 'more-information-required' | 'prescription-issued' | 'dispatched'`

Six presented states: one initial plus five outcomes. Each must be reachable
directly through seeded mock IDs or a dev-only selector (`mock-review`,
`mock-approved`, `mock-declined`, `mock-info-required`,
`mock-prescription-issued`, `mock-dispatched`), without walking the funnel.

### Content fixtures (static, no service interface)

`Clinician`, `Testimonial`, `FaqItem`, `Article` - typed, deduplicated, imported
directly by marketing and editorial components.

## Tech stack

| Tech | Role |
| --- | --- |
| **SvelteKit 2** | Routing, load functions, thin route components |
| **Svelte 5, runes** | All components; runes forced in `vite.config.ts` |
| **TypeScript strict** | Domain types and service contracts |
| **Tailwind CSS v4** | Styling, CSS-first config, semantic tokens only |
| **shadcn-svelte** (`luma`) | Behavior and accessibility layer; the initial thirteen primitives are adapted in Feature 1 and the nine reference-proven gaps in Feature 3a |
| **Lucide** | Icons |
| **pnpm** | Package manager |

### Architecture

Pragmatic feature-first with a thin routing layer. Not Feature-Sliced Design,
not Atomic Design.

```
src/routes/                   routing, load, form actions, screen composition
src/lib/features/             marketing, learn, questionnaire, checkout, order-status
src/lib/domain/               Treatment, AddOn, Money, PatientProfile, Order + canonical catalogue
src/lib/journey/              stage progression and guards across the funnel
src/lib/components/ui/        shadcn primitives
src/lib/components/brand/     global brand visuals
src/lib/server/integrations/  future adapters, empty for now
```

**Service contracts.** Stateful and integration-facing features own typed
service interfaces and mock adapters. Static marketing and editorial features
consume typed content fixtures directly.

| Interface | Mock | Later |
| --- | --- | --- |
| `QuestionnaireService` | `MockQuestionnaireService` | `RxScaleService` |
| `CheckoutService` | `MockCheckoutService` | `ShopifyService` |
| `OrderService` | `MockOrderService` | `RxScaleService` |

## Monetization

Modelled, never transacted. A treatment plan billed monthly on a six-month
commitment with "pause anytime", a one-off initial treatment fee, and optional
paid add-ons.

| Line item | Price |
| --- | --- |
| Treatment plan, first month supply | 144.00 EUR |
| Initial treatment fee | 9.90 EUR |
| Doctor consultation add-on | 49.00 EUR |
| Coaching add-on | 29.00 EUR |
| Body smart scale add-on | 39.00 EUR |
| First-order discount | -75.00 EUR |
| Shipping | Free |
| Welcome offer | 10.00 EUR off first consultation |

> TODO: recurring billing rules are undefined. "Pause anytime" is mock copy.

## UI/UX

Visual reference: `design/prio_one_landing_page_men_new.html`, a Pencil canvas
export of 21 artboards. **A reference, not code to port.** Its absolute
positioning, canvas dimensions, and arbitrary classes are not part of the app.
Full token mapping in `blueprint/reference/design-system.md`.

**Two fonts only:** Inter Tight (`--font-display`) for headings, product names,
prices, stats. DM Sans (`--font-sans`) for everything else. No Poppins, no
plain Inter, no `--font-ui`.

**Semantic tokens only.** Gold `--primary` `#E2B64F`, deep green `--foreground`
`#173824`, warm sand `--background` `#FBFAF7`. Names describe role, never
appearance. `--rating` `#00B67A` is for stars only, never success, validation,
or destructive. Base `--radius: 1.25rem`, stock radius classes, pills use
`rounded-full`.

**Focus:** `--ring` is deep green `#173824`, not gold, because gold was
indistinct against the gold primary button. Default
`focus-visible:ring-2 ring-ring ring-offset-2 ring-offset-background`; gold ring
only on dark surfaces where deep green measures 1.00:1.

**Destructive is provisional.** The reference has no red. `--destructive`
`#C34E45` with white foreground (4.66:1) is approved **for the prototype only
and needs final brand review**. A darker `--destructive-text` `#BC483F` exists
because the fill tone fails AA as normal text on the warm ground. Used for
invalid borders, validation messages, destructive actions, and contraindication
warnings.

**Interaction states:** Tailwind variants control *when*, semantic tokens control
*what*. Hover and active reuse `accent` and `muted`; only `--primary-hover`
`#D9971C` and the destructive family are dedicated state tokens. Static Cards get
no hover.

**Stock Tailwind scales only.** No `text-[17px]`, `rounded-[34px]`,
`w-[1920px]`, or canvas coordinates. The restriction covers visual design
decisions; SVG geometry, `viewBox`, path data, and data-driven values such as
calculated progress positions are exempt.

**Dark mode is out of scope.** No toggle, not approved design, not QA'd.

### Shared UI primitives

Feature 1 delivered the initial primitive foundation. Feature 3a completes the
known set proven by the 21 reference artboards before page implementation.
Later features may add one only when a genuinely unforeseen interaction
requires it, and must adapt it in the same feature.

Feature 1 set: `button`, `input`, `textarea`, `label`, `select`, `checkbox`,
`radio-group`, `card`, `badge`, `separator`, `dialog`, `sheet`, `accordion`.

Feature 3a set: `field`, `input-group`, `progress`, `navigation-menu`, `tabs`,
`carousel`, `alert`, `breadcrumb`, `collapsible`.

Button: seven variants (default, inverse, secondary, outline, ghost, link,
destructive),
four sizes (`sm` `h-10`, `default` `h-12`, `lg` `h-17` `rounded-full`, `icon`
`size-10`). `h-17` is verified to compile to exactly 68px in this project's
Tailwind v4, matching the reference pill. Textarea and Select derive from Input.

Still deferred: `popover`, `tooltip`, `sonner`, `skeleton`, `chart`.

Desktop site navigation uses `NavigationMenu`; mobile navigation uses `Sheet`.
The projection horizon uses `Tabs`; mock payment methods remain a `RadioGroup`.
The bespoke `CheckoutStep` composes `Collapsible` for disclosure behavior.
The language control uses `Select`, with English selected and Deutsch disabled
until translations and routing exist. `Alert` covers delivery, medical review
and status notices; `Breadcrumb` covers the learn article hierarchy.

**Installing a primitive is not completion.** Each is adapted to the design
reference with semantic tokens and stock scales, preserving accessible behavior
and a stable public API, and demonstrates default, hover, active, focus-visible,
disabled, invalid and checked or selected states, its sizes and variants,
keyboard behavior, and responsive behavior. Variants live in the primitive via
the shadcn-svelte variant approach; no wrappers like `SoleanButton` for styling
alone.

| Location | Holds |
| --- | --- |
| `src/lib/components/ui/` | Adapted shadcn primitives |
| `src/lib/components/brand/` | `SoleanLogo`, `StarRating` |
| `src/lib/features/<feature>/` | Product components: `TreatmentOption`, `AddOnCard`, `OrderSummary`, `CheckoutStep`, `ReviewTimeline`, questionnaire answer cards |

Product components are built by the feature owning their domain semantics and
compose the already adapted primitives. Not every visual panel is a `Card`.

**Accessibility and responsiveness are done criteria on every feature**, not a
final task. Feature 12 catches cross-feature regressions only.

### Routes

| Route | What's there |
| --- | --- |
| `/` | Landing page: hero, product story, social proof, FAQ, footer |
| `/learn/blog/[slug]` | Learn article with ToC, comparison, related content |
| `/questionnaire/[step]` | One dynamic route for all steps and interstitials |
| `/checkout/account` | Patient details, DOB, consent |
| `/checkout/shipping` | Address, conditional delivery estimate |
| `/checkout/payment` | Mock payment, labelled as prototype |
| `/order/[id]/review` | Doctor review timeline and the six order states |

Route groups: `(marketing)`, `(questionnaire)`, `(checkout)`.

Development surfaces, not public routes:

| Route | What's there |
| --- | --- |
| `/dev/design-system` | Features 1 and 3a showcase: tokens, type, every adapted primitive and its states |

> TODO: feature 2's prototype scenario page has no named route yet. Decide at
> spec time; `/dev/scenario` would sit alongside the showcase.

## Deployment

Not decided. Currently `@sveltejs/adapter-auto`, which cannot detect a target
and warns at build time. While state is client-side only, the prototype can ship
as a static build to any host; server-side session handling would require a
Node-capable adapter.

> TODO: choose a host and swap the adapter. Handle through `/release`.

## Open questions

Resolve each before the feature named below, then
re-run `/overview` if a plan changes.

1. ~~**Eligibility rule.**~~ Resolved: the questionnaire never judges. It
   collects answers and every path reaches completion; approval, decline, and
   more-information stay feature 11 order states reachable by seeded mock IDs.
   No contraindication branch, BMI threshold, or medical judgement lives in the
   questionnaire. Feature 8 is unblocked.
2. **Testing decision, required before feature 9.** There is no test runner and
   no `test` command. Either run `/tests` first so the pricing engine ships with
   unit tests, or accept that it is verified by browser walkthrough, typecheck,
   and build with no claim of unit tests. Do not install a runner silently.
3. **Canonical add-on units.** Assign each add-on as `one-off` or `per-session`
   before feature 10.
4. **Recurring billing rules.** Undefined; see Monetization.
5. **Deployment target.** Undecided; see Deployment.

### Reference errors are not requirements

Known defects in the export must never be transcribed: "All 8 steps complete"
against "Question 9 of 9"; Mounjaro chosen but Wegovy in checkout; a 69.00 EUR
button against a 78.90 EUR total; conflicting Wegovy Pill and injection copy; a
delivery estimate ignoring clinical approval; no declined or refund path; copy
naming Juniper or Voy; duplicated testimonials. Resolutions in `project-plan.md`
section 9. Mock medical copy is not approved production content.
