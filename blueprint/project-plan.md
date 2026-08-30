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

**What this repository builds is the Solean front end: the marketing site and
the funnel that ends in a real RxScale order.** Features 1 to 8 were built as a
UI prototype on mocked data, and the marketing and editorial surfaces stay
fixture-driven. From feature 9 the funnel is not mocked.

The questionnaire is fetched from and validated by the RxScale Anamnesis API,
its submission creates a real anamnesis record a doctor will read, and the order
is placed through an RxScale-generated Shopify checkout URL. **Solean never runs
a checkout of its own.**

What the build still has to prove:

- Visual design and its translation from the reference into a real responsive app
- Responsiveness across mobile, tablet, and desktop
- End-to-end UX of the funnel, from landing page to the external checkout
- The component inventory and its reuse
- Forms, validation, and error recovery against a server-side validator
- Success, error, and waiting states, integration failure included
- Desktop and mobile consistency

The questionnaire UI is ours; the questionnaire content is not. Question text,
options, order, and branching come from the RxScale model at runtime, so a
change in their Admin Tool changes the funnel without a deploy here.

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

The flow, end to end:

```
Landing page
  -> Questionnaire, fetched from RxScale, interleaved with Solean interludes
  -> Submission to the Anamnesis API, which returns an anamnesis uid
  -> Recommendation screen for one configured SKU
  -> "Place your order" calls Solean's own server endpoint
  -> RxScale generates a Shopify checkout URL
  -> Redirect off-site. Payment, doctor review, and order status are theirs
```

Delivered in features 1 to 8:

- Design system foundation with semantic tokens, adapted shared primitives, and
  a browser-reviewable component showcase
- Prototype architecture with feature-first modules and typed domain models.
  Its journey state and mock services are removed by feature 9c, which the
  pivot made redundant
- Marketing landing page with header, product dropdown, and footer
- Learn article (`Mounjaro vs Wegovy`) with supporting navigation
- The questionnaire UI: shell, progress, field renderers, interludes,
  validation, and completion, built against a local mock schema

Remaining:

- Live questionnaire: the model fetched on entry, rendered by our components,
  driven headlessly by `survey-core`
- Every question type in the model mapped to an adapted primitive, with no
  silently skipped question
- Solean interludes placed between survey pages without inflating the question
  count
- Submission, with 400 validation errors and 502 retries handled honestly
- The recommendation screen and the handoff that turns an anamnesis uid into a
  Shopify checkout URL

Dropped from the original plan: Solean's own checkout (account, shipping,
payment), the pricing engine, add-on selection, and the doctor review and order
status screens. RxScale and Shopify own everything after the redirect.

## 4. Data - What are we storing?

**Solean stores nothing server-side.** No database, no session store, no logging
of answers. In-progress answers live in the browser (`sessionStorage`, SSR-safe)
so a refresh does not lose them, and they are discarded once the submission
succeeds.

**Real data now leaves the browser.** From feature 9 the questionnaire carries
genuine personal and medical answers to RxScale, who own storage, retention, and
clinical review. Two rules follow, neither negotiable:

- Answers, the anamnesis uid, and the checkout URL never reach console output,
  analytics, or an error report in production.
- Nothing about the answers is persisted or forwarded anywhere except the
  anamnesis submission and, for the e-mail alone, the checkout call.

What lives where:

| Data | Owner | Notes |
| --- | --- | --- |
| Questionnaire model and theme | RxScale | SurveyJS JSON, versioned, fetched on entry to the flow, never hardcoded, never cached past the visit |
| Answers in progress | Browser session | `survey.data` in SSR-safe `sessionStorage`, keyed by questionnaire identifier and version so a model change cannot resume against stale answers |
| `steps[]` | Solean | Survey pages interleaved with Solean interludes. The single source of truth for position, progress, and routing |
| Anamnesis uid | Browser session | Returned by the submission, required by the checkout call |
| Questionnaire uid, shop identifier, SKU uid, question names | Config | One module, see section 5 |
| Order, payment, prescription, delivery | RxScale and Shopify | Not modelled here |

Still typed fixtures, unchanged, because marketing and editorial content is not
part of the integration:

| Entity | Holds |
| --- | --- |
| `Money` | amount as integer minor units (cents), currency fixed to EUR |
| `Treatment` | id, name, form (injection/tablet), dose, price, claim copy |
| `Clinician` | name, role, bio, portrait |
| `Testimonial`, `FaqItem`, `Article` | marketing content |

`AddOn`, `PatientProfile`, `ShippingAddress`, `Order`, `PricingBreakdown`, and
`OrderStatus` modelled the checkout Solean no longer builds. They are removed
along with the mock funnel services in feature 9.

Money shown on Solean pages stays fixture copy in integer cents, and it is
display only. The amount actually charged is the Shopify price of the configured
SKU, which this app never reads. Keeping the two in step is a manual editorial
task, see section 6.

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
src/routes/                   routing, load functions, endpoints, screen composition
src/lib/features/             product logic, one module per feature
  marketing/
  learn/
  questionnaire/
src/lib/domain/               shared business concepts and their fixtures
src/lib/components/ui/        shadcn primitives
src/lib/components/brand/     global brand visual components
src/lib/config/               questionnaire uid, SKU, question names, public values
src/lib/server/rxscale/       the private-key client, server-only
```

**Each feature module owns** its own components, types, state, and validation.

The `checkout/` and `order-status/` feature modules go. Their mock services lost
their caller when the plan changed, and an abstraction with no caller is not
kept.

Static marketing and editorial features consume typed content fixtures directly.
The questionnaire owns one typed boundary to RxScale rather than a service
interface per screen: a public anamnesis client for the model and the
submission, and a server-only client for the checkout call.

**`src/lib/domain/`** holds what more than one feature depends on: `Money`, and
`Treatment` with its catalogue.

There is no cross-feature journey module. The funnel is one flow now, from the
landing page into the questionnaire and out to Shopify, and the questionnaire
owns the only state it carries. A module sequencing stages between features
would have nothing left to sequence.

### The RxScale boundary

Three calls, two public and one that must never reach the browser.

| Call | Endpoint | Auth |
| --- | --- | --- |
| Fetch the questionnaire | `GET https://api.rxscale.com/v4/anamnesis/questionnaires/{uid}` | public |
| Submit answers | `POST https://api.rxscale.com/v4/anamnesis/questionnaires/{uid}/submissions` | public |
| Create the checkout | `POST https://api.rxscale.com/v2/public-api/treatments/{shop_identifier}` | `X-API-Key`, permission `create_treatment_checkout` |

Optionally before the checkout call:
`POST https://api.rxscale.com/v2/public-api/products/{shop_identifier}/live-stock`,
where a 409 means the SKU is out of stock and the user gets a message instead of
a redirect.

Rules:

- **`RXSCALE_API_KEY` and `RXSCALE_SHOP_IDENTIFIER` are private.** Read only
  through `$env/static/private`, only inside `+server.ts`. A `PUBLIC_` prefix in
  SvelteKit means the value is compiled into the client bundle, so the key never
  carries one and is never imported by a component.
  `PUBLIC_RXSCALE_QUESTIONNAIRE_UID` may be public, because the anamnesis
  endpoints are.
- **The model is the only source of question content.** Text, options, order,
  required flags, and `visibleIf` branching all come from the fetched model.
  Nothing hardcoded, nothing hidden by a condition in our code. The submission is
  validated server-side against the current model, so any divergence returns 400,
  and hiding a required question guarantees one.
- **`survey-core` is a headless state engine only.** It supplies branching,
  validation, and the `data` shape. `showNavigationButtons` is off, the SurveyJS
  renderer and theme are unused, and the entire UI is Solean's design system.
- **Every question type in the model maps to an adapted primitive.** An unmapped
  type throws visibly in development and is logged in production. A question is
  never skipped silently.
- **`anamnesis_id` is mandatory on the checkout line.** The API marks it
  optional; Solean does not. Without it the Shopify order arrives with no
  anamnesis and the doctor has nothing to review, so a missing uid blocks the
  redirect and shows an error.
- **The returned `checkout_url` is opaque.** No appended parameters, no
  trimming, no domain substitution.
- **One SKU, from config.** The recommendation is fixed: the catalogue is not
  queried and nothing is computed from the answers. The SKU lives in its own
  module so it can later be replaced by catalogue data.
- **The e-mail for `buyerIdentity` is read from the answers by a configured
  question name**, never by a name written into the code. The phone question is
  rendered whenever the model contains it, but the phone is not sent in this
  iteration.

### Routing

Route groups separate the surfaces:

```
src/routes/(marketing)/
src/routes/(questionnaire)/
```

Pages:

```
/
/learn/blog/[slug]
/questionnaire/[step]
```

Server endpoint:

```
POST /api/checkout
```

**Decision on questionnaire routing, unchanged:** one dynamic `[step]` route
rather than a page per question. `steps[]` now supplies the order, interleaving
the model's survey pages with Solean's interludes, and the survey engine's
position is synchronised to it, never the other way round. Each step keeps its
own URL, so back, forward, deep links, and screen-reader page changes behave
normally. The progress indicator counts survey steps only; interludes never
inflate it.

The recommendation screen is the terminal step in `steps[]`, reachable only with
an anamnesis uid in the session. Direct entry to any step the answers do not
justify redirects to the first unanswered one. Progress is not resumable across
visits: no saved progress, no resume link by e-mail, no account.

## 6. Monetize - How will this make money?

Revenue happens in Shopify, through the checkout URL RxScale generates. Solean
takes no payment, calculates no total, and applies no discount.

Money on Solean pages is therefore **marketing copy**: the reference prices the
landing page, the learn comparison, and the recommendation screen display.

| Line item | Displayed price |
| --- | --- |
| Treatment plan, first month supply | 144.00 EUR |
| Initial treatment fee | 9.90 EUR |
| First-order discount | -75.00 EUR |
| Shipping | Free |

> Keeping the displayed price in step with the Shopify price of the configured
> SKU is a manual editorial task. This app never reads the catalogue, so nothing
> detects a divergence. Check it whenever the SKU or its price changes.

The add-on price list (consultation, coaching, body smart scale) and the
"6 month plan, pause anytime" terms leave the build. Add-ons belonged to the
checkout Solean no longer runs, and the subscription terms are the Shopify
product's business.

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
marketing and questionnaire surfaces consume it. Later features may
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

- "Learn more" is a link or a dialog, not a tooltip
- The projection chart is a custom responsive SVG; no chart library unless that
  proves insufficient
- The projection horizon uses adapted `Tabs`
- Not every visual panel needs to be a shadcn `Card`
- Questionnaire single choice maps to the adapted `RadioGroup`, multiple choice
  to `Checkbox`, and a dropdown question to the adapted `Select`. The mapping is
  a registry keyed by the model's question type, not a chain of conditionals in
  a screen component
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

questionnaire answer cards and field renderers, the interlude screens, the
recommendation card, `CountdownTimer`, `ProgressProjectionChart`,
`NumberedHowItWorks`, `BentoGrid`, `PartnerLogoStrip`

`AddOnCard`, `OrderSummary`, `CheckoutStep`, and `ReviewTimeline` are dropped
with the checkout and order status features. `TreatmentOption` survives only if
the recommendation screen reuses it; the treatment preference question it was
built for is gone.

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

**A static build is no longer possible.** `POST /api/checkout` runs server-side
because it holds the private API key, so the host must execute server code:
Node, or a serverless platform with a matching SvelteKit adapter.
`@sveltejs/adapter-auto` still cannot detect a target and warns at build time.

That makes the host choice blocking rather than deferrable, and it brings env
configuration with it:

| Variable | Visibility | Purpose |
| --- | --- | --- |
| `RXSCALE_API_KEY` | private, server only | `X-API-Key` for the checkout call |
| `RXSCALE_SHOP_IDENTIFIER` | private, server only | shop path segment |
| `PUBLIC_RXSCALE_QUESTIONNAIRE_UID` | public | the questionnaire to fetch |

> TODO: choose a host, swap `adapter-auto` for the matching adapter, and set the
> three variables in the provider. Handle it through `/release`.

## 9. Reference inconsistencies

The export contains errors that must not be transcribed as requirements:

| Inconsistency | Resolution |
| --- | --- |
| "All 8 steps complete" versus "Question 9 of 9" | One count, from `steps[]`. The model defines the questions and interludes never inflate the total |
| Mounjaro selected in the questionnaire, Wegovy shown in checkout | Not applicable: one configured SKU, and no in-app checkout to diverge from |
| Contradictory totals (202.90 to 127.90, 153.90 to 78.90, button reading 69.00) | Not applicable: Shopify owns the amount charged |
| Coaching priced 29 in one panel and 39 in another | Not applicable: add-ons are out of scope |
| "Wegovy Pill", "change to an injection", and treatment-fee copy conflict | Treatment naming on marketing pages comes from centralized fixtures |
| "6 month plan, pause anytime" without recurring billing rules | Marketing copy only; the real terms belong to the Shopify product |
| Delivery estimate ignores clinical approval | Any estimate shown before checkout is phrased as conditional on approval |
| No declined or refund flow | Owned by RxScale after the handoff, not a Solean screen |
| Competitor names in copy ("Juniper evens the playing field", "Minimal Voy Footer") | Replaced with Solean |
| Duplicate testimonial (Amy R. and Maya R., both 22 kg, Wegovy injection) | One testimonial per person in fixtures |

Marketing medical copy is mock content, not approved production content. The
questionnaire's medical content is not ours at all: it comes from RxScale.

## 10. Non-goals for this scope

Explicitly excluded, and not to be added as implementation tasks now:

- **Solean's own checkout.** No account, shipping, or payment step, no pricing
  engine, no add-on selection. RxScale returns a URL and we redirect
- **Shopify Storefront API**, `cartCreate`, cart attributes, discount codes
- **Doctor review and order status screens.** After the redirect, order state
  belongs to RxScale and Shopify and reaches the patient through their
  notifications
- **Saved progress.** No server-side session, no resume link by e-mail, no
  cross-device continuation
- **Authentication and a member account area**
- **Phone in `buyerIdentity`.** The phone question is rendered when the model
  contains it, because hiding a required question breaks submission validation,
  but only the e-mail is sent. Removing the question is a change in RxScale's
  Admin Tool, not in this code
- **Product catalogue querying and computed recommendations.** One configured
  SKU
- A database of our own
- Dark mode
- Multi-language routing and translated content. The language `Select` exposes
  English as selected and Deutsch as a disabled placeholder
- Undesigned routes linked from nav and footer (treatments index, product pages,
  about, contact, legal pages, clinician profiles, member account). Links remain
  inert
- Clinician-facing screens

## 11. Open decisions

1. **Eligibility rule. Resolved, and now external.** The questionnaire never
   judges: it collects answers and every path reaches submission. Branching is
   whatever the model expresses through `visibleIf`, and no contraindication
   logic, BMI threshold, or medical judgement is encoded here. Approval and
   decline happen in RxScale's doctor review, not on a Solean screen.
2. **Credentials and ids.** The questionnaire uid, shop identifier, API key, and
   SKU uid are supplied by the user. Feature 9 needs the questionnaire uid to run
   against the real model, features 12 and 13 need the rest. Until they arrive the
   config module holds placeholders and the flow cannot be verified end to end.
3. **Question names for e-mail, height, and weight.** The projection interlude
   reads height and weight from `survey.data`, and the checkout call reads the
   e-mail. All three are configured by name and must be confirmed against the
   real model.
4. **Market and country code.** `DE` is assumed for `buyerIdentity.countryCode`.
   Confirm before feature 13, and decide whether it stays fixed or is derived.
5. **Live-stock preflight.** Optional in feature 13. Decide whether an
   out-of-stock SKU should block the order or let it through.
6. **Deployment target.** Now blocking, see section 8.
7. **Displayed price versus SKU price.** See section 6.
8. **The `os-date-picker` value format. Resolved.** RxScale's widget declares no
   properties, so the stored shape was the renderer's choice. Confirmed as
   `YYYY-MM-DD` on 2026-08-30; feature 10 already stores it that way.
9. **The submission prefix.** `/v4/anamnesis` is not routed on `api.rxscale.com`.
   The submission goes to the prefix the model came from, `/api/v3-1/anamnesis`
   by default, where the route exists but its error bodies are undocumented.
   Feature 12 confirms them against the live service.
