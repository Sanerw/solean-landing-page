# Project Plan

Owned by the user. The single narrative source for what Solean is, who it is
for, and the constraints the build must respect. `build-plan.md` holds the
ordered feature list; this file holds the reasoning behind it. Run `/overview`
after editing either file.

## 1. Problem - What problem are we solving?

Solean is a doctor-led weight-loss platform for the German and wider EU market,
built around GLP-1 treatments (Mounjaro injection, Wegovy injection, Wegovy
pill). The user journey it models: a person completes an online medical
questionnaire, a clinician reviews it, treatment is prescribed when appropriate,
and medication is dispensed by a partner pharmacy and delivered discreetly, with
ongoing clinical and coaching support.

**What this repository actually builds right now is a complete, clickable,
responsive UI prototype on mocked data.** It is not a production medical
service. The purpose is to validate, before any integration work is committed:

- Visual design and its translation from the reference into a real responsive app
- Responsiveness across mobile, tablet, and desktop
- End-to-end UX of the funnel
- The component inventory and its reuse
- Forms, validation, and error recovery
- Price calculation correctness
- Success, error, and waiting states
- Desktop and mobile consistency

The architecture must let mock services be swapped for Shopify and RxScale
adapters later without rewriting components.

## 2. Users - Who is this for?

**Primary end user in the modelled product:** adults in the EU, this variant
addressed to men, seeking medically supervised weight loss. They are
price-aware, privacy-sensitive, and often comparing against competitor
telehealth brands. They expect a consumer-grade purchase experience, not a
clinical portal.

**Primary user of this repository right now:** the product and design team
reviewing whether the funnel works. Every feature must therefore be
independently runnable and reviewable in a browser.

**Not addressed in this scope:** clinicians. No clinician-facing screens exist
in the reference, and no admin surface is in scope.

## 3. Features - What does the MVP need?

The mocked flow, end to end:

```
Landing page
  -> Questionnaire
  -> Treatment preference and recommendation
  -> Complete profile
  -> Checkout: account
  -> Checkout: shipping
  -> Mock payment
  -> Doctor review
  -> Approved / declined / more information required
  -> Prescription issued
  -> Dispatched
```

High level:

- Design system foundation with semantic tokens, adapted shared primitives, and
  a browser-reviewable component showcase
- Prototype architecture with feature-first modules, typed domain models,
  journey state, and mock service boundaries
- Marketing landing page with header, product dropdown, and footer
- Learn article (`Mounjaro vs Wegovy`) with supporting navigation
- Multi-step questionnaire with typed schema, validation, and resume
- Treatment preference and recommendation
- Checkout: account, shipping, treatment switching, add-ons, mock payment
- Central price calculation feeding every surface that shows money
- Doctor review and order status, including declined and more-information paths
- Cross-flow polish: transitions, empty/loading/error states, responsive and
  accessibility review

The payment screen may reproduce the reference visually but must be clearly
labelled as a mock/prototype. It will later be replaced by an external checkout.

## 4. Data - What are we storing?

**Nothing real, and no real medical data.** Every value in the prototype is
fictional. Persistence is limited to `sessionStorage` so a refresh does not lose
progress, and all writes must be SSR-safe.

Modelled entities, all as typed fixtures:

| Entity | Holds |
| --- | --- |
| `Money` | amount as integer minor units (cents), currency fixed to EUR |
| `Treatment` | id, name, form (injection/tablet), dose, price, claim copy |
| `AddOn` | id, name, description, price, unit (one-off vs per session) |
| `QuestionnaireSchema` | ordered steps, question types, options, validation rules |
| `QuestionnaireAnswers` | answers keyed by question id, plus progress marker |
| `PatientProfile` | name, email, phone, date of birth, questionnaire answers, selected treatment (fictional) |
| `ShippingAddress` | street, postcode, city, country, delivery estimate |
| `Order` | id, line items, pricing breakdown, status |
| `PricingBreakdown` | subtotal, discount, shipping, total |
| `OrderStatus` | review in progress, approved, declined, more information required, prescription issued, dispatched |
| `Clinician` | name, role, bio, portrait |
| `Testimonial`, `FaqItem`, `Article` | marketing content |

`Money.amount` is always an integer number of cents and `Money.currency` is
always `EUR`. Floating-point euro amounts are never used for calculations.

**Single source of truth for money.** One canonical price list in
`src/lib/domain/` feeds one calculation function in
`src/lib/features/checkout/pricing.ts`, which produces subtotal, discount,
shipping, and total. No component writes its own arithmetic or hardcodes a
total.

## 5. Tech - What stack are we using?

Already scaffolded and in use:

- SvelteKit 2 on Vite
- Svelte 5, runes mode (forced in `vite.config.ts`)
- TypeScript, strict
- Tailwind CSS v4, CSS-first config
- shadcn-svelte, `luma` style, `neutral` base
- Lucide icons
- pnpm

Follow `blueprint/context/coding-standards.md` throughout.

### Application architecture

Pragmatic **feature-first** with a thin SvelteKit routing layer. Not full
Feature-Sliced Design, not Atomic Design.

```
src/routes/                   routing, load functions, form actions, screen composition
src/lib/features/             product logic, one module per feature
  marketing/
  learn/
  questionnaire/
  checkout/
  order-status/
src/lib/domain/               shared business concepts and their fixtures
src/lib/journey/              links questionnaire -> checkout -> order status
src/lib/components/ui/        shadcn primitives
src/lib/components/brand/     global brand visual components
src/lib/server/integrations/  future Shopify and RxScale adapters
```

**Each feature module owns** its own components, types, state, and validation.

**Stateful and integration-facing features own typed service interfaces and
mock adapters. Static marketing and editorial features may consume typed
content fixtures directly.** Service interfaces are required for questionnaire,
checkout, and order status, and for any future integration. They are not
required for static marketing content or articles, where inventing a service
layer would be an abstraction with no caller.

**`src/lib/domain/`** holds concepts more than one feature depends on:
`Treatment`, `AddOn`, `Money`, `PatientProfile`, `Order`.

### Where catalogue data ends and checkout logic begins

A deliberate split, not an inconsistency:

`src/lib/domain/` owns the canonical treatment and add-on catalogue, including
the shared fixture prices. Marketing, questionnaire, and checkout all read it,
so it belongs to no single feature.

`src/lib/features/checkout/pricing.ts` owns the pure checkout calculation that
consumes this catalogue and produces subtotal, discount, shipping, and total.
The numbers are shared; the arithmetic that turns them into an order total is
checkout's business and lives with checkout.

**`src/lib/journey/`** is a small module holding the cross-feature progression:
which stage the user has reached, what the next stage is, and the guards that
stop someone landing mid-checkout without a completed profile. It exists so no
feature has to import another feature.

Rules:

- Route components stay thin. Business logic never sits in `+page.svelte`
- Components inside a stateful feature do not import raw fixtures; they go
  through that feature's service interface
- Static marketing and editorial components may import typed content fixtures
  directly
- Mock adapters are today's implementation. Real integrations replace them later
  without changing components

Service interfaces and their first implementations:

| Interface | Mock | Later |
| --- | --- | --- |
| `QuestionnaireService` | `MockQuestionnaireService` | `RxScaleService` |
| `CheckoutService` | `MockCheckoutService` | `ShopifyService` |
| `OrderService` | `MockOrderService` | `RxScaleService` |

State is rune-based and persisted to `sessionStorage`, SSR-safe, so a refresh
does not lose progress.

The mock layer must support at minimum:

- Treatment selection
- Treatment change before checkout
- Adding and removing add-ons
- Automatic subtotal, discount, shipping, and total calculation
- Account and shipping validation
- Mock payment success and failure
- Doctor review statuses
- Returning to an in-progress questionnaire
- Consistent movement between steps

Mock doctor-review outcomes are deterministic and selected by seeded fixtures,
never randomly. The six canonical `OrderStatus` values are directly reachable
for visual and behavioral review.

### Routing

Route groups separate the three surfaces:

```
src/routes/(marketing)/
src/routes/(questionnaire)/
src/routes/(checkout)/
```

Planned pages:

```
/
/learn/blog/[slug]
/questionnaire/[step]
/checkout/account
/checkout/shipping
/checkout/payment
/order/[id]/review
```

**Decision on questionnaire routing:** one dynamic `[step]` route rather than
nine separate pages. Rationale: the steps share one shell, one progress
indicator, and one validation contract; a dynamic route keeps the schema as the
single definition of step order, makes resume a matter of reading one index, and
avoids nine near-identical page files drifting apart. Each step still gets its
own URL, so back/forward, deep links, and screen-reader page changes behave
normally. Mid-step interstitials (projection, motivation) are entries in the
same schema with a distinct step kind, not special-cased routes.

## 6. Monetize - How will this make money?

Modelled in the prototype, not transacted. The reference implies a subscription:
a treatment plan billed monthly on a six-month commitment with "pause anytime",
plus a one-off initial treatment fee and optional paid add-ons.

Canonical fixture price list, owned by `src/lib/domain/` and consumed by
`src/lib/features/checkout/pricing.ts`:

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

> TODO: recurring billing rules are not defined by the reference. The prototype
> shows the plan and the "pause anytime" claim as mock copy only. Real terms,
> renewal dates, and cancellation rules are undecided.

## 7. UI/UX - How should this look and feel?

The visual reference is `design/prio_one_landing_page_men_new.html`, a Pencil
canvas export with 21 artboards. Full token mapping lives in
`blueprint/reference/design-system.md`.

**The export is a visual reference, not code to port.** Do not copy its absolute
positioning, fixed canvas dimensions, or arbitrary classes one to one.

### Typography

Exactly two fonts:

| Token | Font | Used for |
| --- | --- | --- |
| `--font-display` | Inter Tight Variable | Headings, product names, prices, stats, large numbers |
| `--font-sans` | DM Sans Variable | Body, navigation, buttons, forms, labels, badges, eyebrows, metadata, captions |

Poppins and plain Inter are **not used**. Buttons, navigation, chips, and
eyebrows that use Poppins in the export normalize to DM Sans.

No arbitrary type classes (`text-[17px]`, `leading-[27px]`, `tracking-[-0.5px]`).
Only the stock Tailwind scale and stock `leading-*` / `tracking-*` utilities.

Responsive ladders:

| Role | Classes |
| --- | --- |
| Hero H1 | `text-4xl sm:text-5xl lg:text-7xl xl:text-8xl` |
| Section H2 | `text-3xl md:text-4xl` |
| Large stat | `text-4xl md:text-5xl lg:text-6xl` |
| Sub-heading H3 | `text-2xl md:text-3xl` |
| Card title | `text-lg md:text-xl` |
| Lead paragraph | `text-base md:text-lg lg:text-xl` |
| Body | `text-base` |
| Label, body small | `text-sm` |
| Caption, legal | `text-xs` |
| Eyebrow | `font-sans text-xs font-semibold uppercase tracking-widest` |

Weight is chosen by role, not applied uniformly:

- Hero: `font-medium`
- Section heading: `font-medium` or `font-semibold`
- Card heading: `font-semibold`
- Button: `font-semibold`
- Body: `font-normal`

Do not make `font-semibold` the automatic weight for every heading.

### Color

Semantic tokens only. No `text-[#173824]`.

| Token | Value |
| --- | --- |
| `--background` | `#FBFAF7` |
| `--foreground` | `#173824` |
| `--card` / `--popover` | `#FFFFFF` |
| `--card-foreground` / `--popover-foreground` | `#173824` |
| `--primary` | `#E2B64F` |
| `--primary-foreground` | `#172019` |
| `--primary-hover` | `#D9971C` |
| `--secondary` | `#F7F8F5` |
| `--secondary-foreground` | `#173824` |
| `--muted` | `#F4F3EC` |
| `--muted-foreground` | `#405756` |
| `--accent` | `#EEF3EC` |
| `--accent-foreground` | `#173824` |
| `--border` / `--input` | `#E5E7E2` |
| `--ring` | `#173824` (deep green, not gold) |

Semantic extensions:

| Token | Value |
| --- | --- |
| `--highlight` | `#F7EBCB` |
| `--highlight-foreground` | `#B07E12` |
| `--surface-warm` | `#F3ECDD` |
| `--surface-subtle` | `#FFFDF8` |
| `--surface-tint` | `#DDE4DD` |
| `--text-tertiary` | `#6F7D74` |
| `--text-faint` | `#9AA79E` |
| `--rating` | `#00B67A` |

Names describe role, never appearance. Do not reintroduce `cream`, `sand`,
`gold-deep`, or `gold-subtle`. Components use `bg-primary`,
`text-primary-foreground`, `bg-highlight`, `text-highlight-foreground`,
`bg-surface-subtle`, `text-text-tertiary`, `border-border`.

`#00B67A` is the rating and star color, not a general success color.

The reference defines no destructive colour. A provisional technical token is
approved **for the prototype only** and requires final brand review:
`--destructive` `#C34E45`, `--destructive-foreground` `#FFFFFF` (4.66:1),
`--destructive-hover` `#B23F37`, `--destructive-active` `#A4322C`, and
`--destructive-text` `#BC483F` for message copy, because the fill tone fails AA
as normal text on the warm page ground. Used for invalid field borders,
validation messages, destructive actions, contraindication warnings, and
destructive focus states. The rating green is never a success, validation, or
destructive colour.

`--ring` is the deep green `#173824`, not gold: the gold ring was too close to
the gold primary button. Default treatment is `focus-visible:ring-2
ring-ring ring-offset-2 ring-offset-background`, with a gold ring only on dark
surfaces where deep green would be invisible. Full contrast measurements and the
button, hover/active, and Textarea/Select specifications are in
`blueprint/reference/design-system.md`.

### Dark mode

Out of scope. No toggle, no dedicated build-plan feature, not treated as
approved design, not covered by QA. The technical `.dark` block shipped by
shadcn may remain.

### Radii

Base `--radius: 1.25rem`. Only stock classes: `rounded-sm`, `rounded-md`,
`rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-full`. Pill buttons use
`rounded-full`. No `rounded-[34px]`.

### shadcn-svelte

shadcn is a behavior and accessibility layer, not the finished look of the page.

Feature 1 delivered the initial shared primitive foundation. A reference audit
before page implementation found nine additional behavior primitives already
proven by the 21 artboards. Feature 3a completes that known set before the
marketing, questionnaire and checkout surfaces consume it. Later features may
add another primitive only when a genuinely unforeseen interaction requires it,
and must adapt it to the Solean design system in the same feature.

Initial primitive set delivered by Feature 1:

`button`, `input`, `textarea`, `label`, `select`, `checkbox`, `radio-group`,
`card`, `badge`, `separator`, `dialog`, `sheet`, `accordion`

Reference-proven completion set delivered by Feature 3a:

`field`, `input-group`, `progress`, `navigation-menu`, `tabs`, `carousel`,
`alert`, `breadcrumb`, `collapsible`

Button's stable API has seven variants: `default`, `inverse`, `secondary`,
`outline`, `ghost`, `link`, and `destructive`; and four sizes: `sm`, `default`,
`lg`, and `icon`.

Still deferred until a feature proves it genuinely needs one: `popover`,
`tooltip`, `sonner`, `skeleton`, `chart`.

**Installing a shadcn primitive is not completion. Each primitive must be
visually adapted to the Solean design reference using semantic tokens and
standard Tailwind scales while preserving accessible behavior and a stable
public API.** For every applicable primitive that means default, hover, active,
focus-visible, disabled, invalid, and checked or selected states; the supported
sizes and variants; documented keyboard behavior; and responsive behavior where
the primitive has any.

Variants are centralized in the primitive implementation using the existing
shadcn-svelte variant approach. Do not create redundant wrappers such as
`SoleanButton` when the difference is only visual styling.

Specific rulings:

- Checkout steps are a bespoke sequential component, not an Accordion
- The bespoke `CheckoutStep` composes the adapted `Collapsible` for disclosure
  behavior while keeping progression rules in the checkout feature
- "Learn more" is a link or a dialog, not a tooltip
- The projection chart is a custom responsive SVG; no chart library unless that
  proves insufficient
- The projection horizon uses adapted `Tabs`; mock payment methods remain a
  `RadioGroup`, because they select submitted form data
- Not every visual panel needs to be a shadcn `Card`
- The payment radio group is acceptable only as mock UI
- Desktop site navigation uses adapted `NavigationMenu`; mobile navigation uses
  the adapted `Sheet`, designed as a considered responsive adaptation because
  the export contains no mobile artboards
- The language control uses the adapted `Select`, not `Popover`. English is
  selected and Deutsch is visible but disabled until translations and routing
  exist
- Static informational banners compose `Alert` without an assertive live-region
  role; urgent runtime feedback opts into `role="alert"`
- Editorial hierarchy uses `Breadcrumb` with a labelled navigation landmark and
  `aria-current="page"` on the current item

### Component boundaries

| Location | Holds |
| --- | --- |
| `src/lib/components/ui/` | Adapted shadcn primitives |
| `src/lib/components/brand/` | Global brand visuals: `SoleanLogo`, `StarRating` |
| `src/lib/features/<feature>/` | Feature-specific product components |

Features 1 and 3a build shared primitives and global brand foundations only.
They do not build product components. These belong to the feature that owns
their domain semantics and compose the already adapted primitives:

`TreatmentOption`, `AddOnCard`, `OrderSummary`, `CheckoutStep`, `ReviewTimeline`,
questionnaire answer cards, `CountdownTimer`, `ProgressProjectionChart`,
`NumberedHowItWorks`, `BentoGrid`, `PartnerLogoStrip`

### Responsiveness

The export is a 41280 x 7944 px canvas of desktop artboards. Its absolute
positions and left/top values are not part of the application design.

Use max-width containers, CSS Grid, Flexbox, fluid padding, responsive
breakpoints, and sensible mobile layouts. The order summary is sticky only on
sufficiently wide screens.

Never use absolute positioning for main layout, fixed section heights that exist
only to match the canvas, widths such as `w-[1920px]`, or Pencil coordinates.

### Accessibility

Part of every feature's completion criteria, never deferred to a final task:

semantic HTML, correct labels, `fieldset` and `legend` for answer groups, full
keyboard operation, visible focus, adequate contrast, inline validation,
`aria-live` for asynchronous status, reduced motion support, accessible dialogs,
and no hover-only interactions.

## 8. Deployment - Where and how will this ship?

Not decided. Currently `@sveltejs/adapter-auto`, which cannot detect a target
and warns at build time.

While state is client-side only, the prototype can ship as a static build to any
host. If server-side session handling is added later, a Node-capable adapter
becomes necessary. Handle this through `/release` when a host is chosen, not
before.

> TODO: choose a host and swap the adapter.

## 9. Reference inconsistencies

The export contains errors that must not be transcribed as requirements:

| Inconsistency | Resolution for the prototype |
| --- | --- |
| "All 8 steps complete" versus "Question 9 of 9" | One consistent step count, defined by the schema |
| Mounjaro selected in the questionnaire, Wegovy shown in checkout | The selected treatment carries through to checkout |
| Contradictory totals (202.90 to 127.90, 153.90 to 78.90, button reading 69.00) | All totals computed by the pricing function |
| Coaching priced 29 in one panel and 39 in another | One canonical price in fixtures |
| "Wegovy Pill", "change to an injection", and treatment-fee copy conflict | Treatment naming comes from centralized fixtures |
| "6 month plan, pause anytime" without recurring billing rules | Mock copy only; real terms undecided |
| Delivery estimate ignores clinical approval | Estimate presented as conditional on approval |
| No declined or refund flow | Declined and more-information states are explicit build items |
| Competitor names in copy ("Juniper evens the playing field", "Minimal Voy Footer") | Replaced with Solean |
| Duplicate testimonial (Amy R. and Maya R., both 22 kg, Wegovy injection) | One testimonial per person in fixtures |

All medical copy and claims in the prototype are mock content, not approved
production content.

## 10. Non-goals for this scope

Explicitly excluded, and not to be added as implementation tasks now:

- Shopify integration
- RxScale integration
- A real payment provider
- A database
- Authentication
- A real medical backend
- Dark mode
- Multi-language routing and translated content. The language `Select` exposes
  English as selected and Deutsch as a disabled prototype placeholder
- Undesigned routes linked from nav and footer (treatments index, product pages,
  about, contact, legal pages, clinician profiles, member account). Links remain
  inert.
- Clinician-facing screens

Shopify and RxScale may appear only as deferred backlog after the UI prototype
is accepted.

## 11. Open decisions

1. **Eligibility rule. Resolved: the questionnaire never judges.** The reference
   states no pass/fail logic for the 16 contraindications, shows no BMI
   threshold, and has no fail path or ineligibility screen. The prototype
   follows it: the questionnaire collects answers and every path reaches the
   completion screen. Approval, decline, and requests for more information stay
   order states in feature 11, reachable through seeded mock IDs. No
   contraindication branch, BMI threshold, or medical judgement is encoded
   anywhere in the questionnaire.
2. **Recurring billing rules.** See section 6.
3. **Deployment target.** See section 8.
