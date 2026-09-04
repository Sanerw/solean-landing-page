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
is placed by creating a Shopify cart that carries the anamnesis reference, then
redirecting to the checkout URL Shopify returns. **Solean never runs a checkout
of its own.**

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
  -> Questionnaire, defined here, interleaved with Solean interludes
  -> Answers mapped into RxScale's shape and submitted to the Anamnesis API,
     which returns an anamnesis uid
  -> Recommendation screen: the plans RxScale recommends, treatment or prescription only
  -> "Place your order" calls Solean's own server endpoint
  -> The endpoint creates a Shopify cart carrying the anamnesis as an order attribute
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

- The questionnaire's content moves into this repository (feature 24): our
  questions, our branching, our validation, mapped onto RxScale at submission,
  with their model kept as a committed contract rather than a runtime fetch
- Live questionnaire: the model fetched on entry, rendered by our components,
  driven headlessly by `survey-core`
- Every question type in the model mapped to an adapted primitive, with no
  silently skipped question
- Solean interludes placed between survey pages without inflating the question
  count
- Submission, with 400 validation errors and 502 retries handled honestly
- The recommendation screen and the handoff that turns an anamnesis uid into a
  Shopify cart and its checkout URL

Dropped from the original plan: Solean's own checkout (account, shipping,
payment), the pricing engine, add-on selection, and the doctor review and order
status screens. RxScale and Shopify own everything after the redirect.

## 4. Data - What are we storing?

**Solean stores nothing server-side.** No database, no session store, no logging
of answers. **The browser stores nothing either.** In-progress answers live in one
module in memory and are never written to `sessionStorage` or anywhere else, so a
reload starts the questionnaire over: the medical answers a person types do not
outlive the page asking for them. In-session persistence was planned and then
removed; the table below is the rule.

**Real data now leaves the browser.** From feature 9 the questionnaire carries
genuine personal and medical answers to RxScale, who own storage, retention, and
clinical review. Two rules follow, neither negotiable:

- Answers, the anamnesis uid, and the checkout URL never reach console output,
  analytics, or an error report in production.
- Nothing about the answers is persisted or forwarded anywhere except the
  anamnesis submission and, for the e-mail alone, the checkout call and the
  Customer.io reminder.

**The reminder exception, decided 2026-09-03.** The visitor's e-mail is forwarded
to a marketing processor at the moment the question is answered, which is *before*
any submission, so a reminder can be sent to someone who walked away. That is a
personal identifier leaving an unfinished medical questionnaire, and it is a
deliberate widening of the rule above rather than an oversight. What may travel is
the e-mail and a stage marker, nothing else: no answer, no anamnesis uid, no
medication or dose, no name, no telephone number. The user also decided that typing
the e-mail and continuing is the whole consent step: there is no separate marketing
opt-in checkbox.

**The processor changed, the decision did not.** Feature 22 sent this to Brevo;
feature 23 moved it to Customer.io, EU region. The rule above is written against
whichever processor is configured, and only one ever is. What may travel, and the
fact that typing the address and continuing is the whole consent step, were not
re-opened.

What lives where:

| Data | Owner | Notes |
| --- | --- | --- |
| Questionnaire content | Solean, from feature 24 | Question text, options, order, required flags and branching, as one typed definition in the repository, in German and English. Changing a question is a deploy, deliberately |
| RxScale model | RxScale, snapshotted here | The contract the answers are mapped onto. A committed copy drives their `visibleIf` and `validators` locally; the live document is read only by the contract test, which fails when the two drift |
| Answers in progress | Browser memory | `survey.data` in one module, never persisted. Client-side navigation between steps keeps them; a reload does not |
| `steps[]` | Solean | Survey pages interleaved with Solean interludes. The single source of truth for position, progress, and routing |
| Anamnesis uid | Browser session | Returned by the submission, required by the checkout call |
| Questionnaire uid, store domain, variant id, question names | Config | One module, see section 5 |
| Visitor e-mail, once typed | Customer.io, EU region | Forwarded when the question is answered, before any submission, so a reminder can be sent. The e-mail and a stage marker, nothing else: no answer, no uid, no name, no telephone number |
| Order, payment, prescription, delivery | RxScale and Shopify | Not modelled here |

**Editorial content lives in Sanity.** From feature 20 the Learn article and its
reviewer are documents in the Content Lake; from feature 21 so is every section of
the landing page, copy and photographs alike. Sanity holds only published
editorial content: no answers, nothing personal, nothing from the funnel.

**A missing section is not an error.** The page is composed of optional fields, so
each section is guarded on its own content and a page that loses one renders
shorter rather than failing. This is not defensive habit: publishing a draft
written before a field existed removed one, and an unguarded page answered the
whole site with a 500.

| Entity | Owner | Holds |
| --- | --- | --- |
| `Money` | fixture | amount as integer minor units (cents), currency fixed to EUR |
| `Treatment` | fixture | id, name, form (injection/tablet), dose, price, claim copy. Stays a fixture: it is commerce data keyed to Shopify variants, not editorial copy |
| `article` | Sanity | the Learn article, one document per language, linked as translations |
| `clinician` | Sanity | name, role, description, portrait. Referenced as an article's reviewer |
| `homePage` | Sanity | localized singleton per locale: announcement, hero, teaser, trust band, bento, results band, projection wording, medical framing, stories, team, FAQ |
| `testimonial` | Sanity | the stories the landing page carries, and the one the questionnaire's motivation screen borrows |

Editorial content is queried by `language`, because translations are separate
documents rather than fields on one. The locale list stays in
`project.inlang/settings.json`: Paraglide compiles the message catalogues from it
at build time, so a language Sanity did not know about is a missing translation,
while a language Paraglide did not know about is a broken build.

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

Added for editorial content:

- **Sanity** as the CMS. The Studio is standalone, in `../studio-solean` beside
  this app, deliberately not embedded in a route: the funnel and the Studio have
  nothing to share, and embedding would put the whole Studio bundle in this
  app's dependency graph.
- `@sanity/sveltekit` in the app, for the client, preview mode and Visual
  Editing. It has a single entry point that also carries Sanity UI's stylesheet,
  so nothing that renders on an ordinary page may import it eagerly. Two rules
  follow: pages read Sanity data through `$lib/sanity/LiveQuery.svelte`, which
  only reaches for `useQuery` in preview, and `layout.css` declares
  `@layer sui, sui.global` before Tailwind so Sanity's rules can never outrank a
  utility class.
- `@sanity/document-internationalization` for German and English, document-level:
  one document per language, linked by translation metadata.

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
src/lib/config/               questionnaire uid, the anamnesis attribute key, question names
src/lib/server/shopify/       the Storefront cart client, server-only
```

**Each feature module owns** its own components, types, state, and validation.

The `checkout/` and `order-status/` feature modules go. Their mock services lost
their caller when the plan changed, and an abstraction with no caller is not
kept.

Static marketing and editorial features consume typed content fixtures directly.
The questionnaire owns one typed boundary per external service rather than a
service interface per screen: a public anamnesis client for the model and the
submission, and a server-only Shopify Storefront client for the cart.

**`src/lib/domain/`** holds what more than one feature depends on: `Money`, and
`Treatment` with its catalogue.

There is no cross-feature journey module. The funnel is one flow now, from the
landing page into the questionnaire and out to Shopify, and the questionnaire
owns the only state it carries. A module sequencing stages between features
would have nothing left to sequence.

### The external boundaries

Three services. The first three calls hold no secret; the fourth does.

| Call | Endpoint | Auth |
| --- | --- | --- |
| Fetch the questionnaire model | `GET https://api.rxscale.com/v4/anamnesis/questionnaires/{uid}` | public. From feature 24 this is no longer on the visitor's path: only the contract test calls it |
| Submit answers | `POST https://api.rxscale.com/v4/anamnesis/questionnaires/{uid}/submissions` | public |
| Create the cart | `POST https://{store}/api/{version}/graphql.json`, `cartCreate` | Storefront token when configured |
| Signal the funnel stage | `POST https://track-eu.customer.io/api/v2/entity` | `CUSTOMERIO_SITE_ID` and `CUSTOMERIO_TRACK_API_KEY` as HTTP Basic, server only |

**RxScale is not called to place the order.** They import it from Shopify by
webhook and read the anamnesis off the cart. This replaced
`POST /v2/public-api/treatments/{shop}`, which was refused because the key lacks
`create_treatment_checkout`, a permission the Admin Tool does not offer, and
which RxScale recommended against on 2026-08-31 in favour of the cart.

Rules:

- **No secret is on the checkout path.** That claim is now scoped: the
  Customer.io call carries real credentials, `CUSTOMERIO_SITE_ID` and
  `CUSTOMERIO_TRACK_API_KEY`, and is the one boundary here that does. Neither
  reaches the browser, and no reminder is sent from client code. The Shopify
  variables stay server-side so the variant does not ship in the client bundle
  and validation has one home, not because they are private.
  `PUBLIC_RXSCALE_QUESTIONNAIRE_UID` may be public, because the anamnesis
  endpoints are. A Storefront token is sent when
  configured; the shop answers without one today, which is undocumented
  behaviour rather than a foundation.
- **The question content is Solean's, the contract is RxScale's.** Through
  feature 23 the fetched model was the only source of text, options, order,
  required flags, and branching. Feature 24 reverses that: the content is one
  typed definition here, and RxScale's model becomes the shape the answers are
  mapped onto. A committed snapshot of it applies their `visibleIf` and their
  `validators` locally, so their gates and their wording still hold, and the
  submission is still validated server-side against their current model, so any
  divergence returns 400. Every question of theirs that is required and visible
  must have a mapped answer; a gap fails visibly in development rather than
  reaching a visitor as a 400. The cost, taken knowingly: RxScale can no longer
  change the funnel's questions without a deploy here, and a contract test is
  what turns their next edit into a failing build instead of a broken funnel.
- **`survey-core` is a headless state engine only.** It supplies branching,
  validation, and the `data` shape. `showNavigationButtons` is off, the SurveyJS
  renderer and theme are unused, and the entire UI is Solean's design system.
  From feature 24 it is fed the committed snapshot and holds RxScale's rules,
  not our questions.
- **Every question kind maps to an adapted primitive.** An unmapped kind throws
  visibly in development and is logged in production. A question is never
  skipped silently. Through feature 23 the registry was keyed by RxScale's type
  string; from feature 24 it is keyed by our own kind.
- **`_anamnesis_uid` is mandatory, exact, and order-level.** RxScale compares
  the key character for character and ignores a mismatch without a word, so it
  is one constant, never assembled from parts. It goes on the cart's order
  attributes alone: their resolution falls back from the line to its group to
  the order, so one attribute reaches every component the bundle expands into,
  which a line property could not. Without an anamnesis the doctor has nothing
  to review, so a missing uid blocks the redirect and shows an error.
- **The returned `checkoutUrl` is opaque.** No appended parameters, no trimming,
  no domain substitution. It arrives on the shop's own domain.
- **The recommendation is RxScale's.** After the submission,
  `GET /api/v2/anamnesis/{uid}/recommendation` returns the treatments and doses
  the answers allow, each with its Shopify variant, its price, and their own
  `pre_selected` default. Nothing is computed here and the catalogue is never
  queried. It is read server-side, because the raw document is over a megabyte
  of catalogue graph and because the same read validates the order.
- **The variant the browser names is a request, not an authorisation.** The
  checkout endpoint reads the recommendation again and refuses a variant that is
  not in it, so it cannot be used to order arbitrary merchandise.
- **The configured variant is the fallback and only that**, offered when RxScale
  recommends nothing or cannot be reached. It is a bundle Shopify expands into
  medication, treatment fee, and needles, so no fee line is ever built here.
- **A prescription-only listing is a different purchase.** `sku.digital` marks
  the ones where the signed prescription is all that is sold, at a fraction of
  the price and with nothing dispensed or delivered, so they get a panel of
  their own and are never shown beside a treatment price.
- **The e-mail for `buyerIdentity` is read from the answers by a configured
  question name**, never by a name written into the code. It is a prefill and
  never a condition: Shopify collects the address at checkout, so an order
  without one is complete rather than unreachable. The phone question is
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

Server endpoints:

```
GET  /api/recommendation
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

Money on the landing page and the learn comparison is **marketing copy**:
reference prices, written here and kept in step by hand.

**The recommendation screen is not.** Its prices come from RxScale's own product
recommendation, which reads the shop's catalogue, so they cannot drift from what
Shopify charges. What it offers, on the live shop:

| Offer | Price |
| --- | --- |
| Treatment, one month | 99.00 to 549.00 EUR by product and dose |
| Prescription only, no medication dispensed | 49.90 EUR |

> The landing page and the learn article still carry hand-written prices, and
> nothing detects a divergence there. Check them whenever the catalogue changes.

The add-on price list (consultation, coaching, body smart scale) and the
"6 month plan, pause anytime" terms leave the build. Add-ons belonged to the
checkout Solean no longer runs, and the subscription terms are the Shopify
product's business.

## 7. UI/UX - How should this look and feel?

The visual reference is `blueprint/reference/Solean landing page.png`, a capture
of a Pencil canvas with 21 artboards, alongside the per-screen artboards beside
it. Full token mapping lives in `blueprint/reference/design-system.md`.

**The reference is a picture of the intended design, not code to port.** The
Pencil HTML export it was taken from is no longer in the repository, precisely
because its absolute positioning, fixed canvas dimensions, and arbitrary classes
were never meant to be copied one to one.

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
the gold primary button. Buttons, links and other non-field controls take
`focus-visible:ring-2 ring-ring ring-offset-2 ring-offset-background`, with a
gold ring only on dark surfaces where deep green would be invisible.

Form fields diverged later. `input`, `textarea`, `select-trigger` and
`input-group` take `focus-visible:border-ring ring-[3px] ring-ring/20`: the
border goes solid deep green and a soft halo sits directly against it, with no
offset. The `3px` is the single accepted arbitrary visual value in the project,
because the stock ring scale steps straight from 2 to 4. Full contrast measurements and the
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

`popover`, with `calendar` and `date-picker`, was added later when the model's
date question needed a bounded picker instead of the browser's own widget.

Still deferred until a feature proves it genuinely needs one: `tooltip`,
`sonner`, `skeleton`, `chart`.

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

**A static build is no longer possible.** `POST /api/checkout` and
`GET /api/recommendation` run server-side, so the host must execute server code.
**Vercel is the target**, pinned as `@sveltejs/adapter-vercel` in
`vite.config.ts` rather than left to `adapter-auto`, which would install the same
adapter part way through a build.

The host choice is settled; what it brings with it is env configuration:

| Variable | Visibility | Purpose |
| --- | --- | --- |
| `PUBLIC_SHOPIFY_STORE_DOMAIN` | public | the shop the cart is created in, the myshopify domain. Not the identifier below |
| `SHOPIFY_VARIANT_ID` | server only | fallback only: the plan offered when RxScale recommends nothing |
| `SHOPIFY_STOREFRONT_TOKEN` | server only, optional | sent when configured, see section 11 |
| `SHOPIFY_STOREFRONT_API_VERSION` | server only, optional | defaults to `2025-01` |
| `PUBLIC_RXSCALE_QUESTIONNAIRE_UID` | public | the questionnaire to fetch |
| `PUBLIC_RXSCALE_SHOP_IDENTIFIER` | public | the shop the recommendation is keyed by, the storefront hostname |
| `PUBLIC_SANITY_PROJECT_ID` | public | the Content Lake project, `tzq5b2my` |
| `PUBLIC_SANITY_DATASET` | public | `production` |
| `PUBLIC_SANITY_API_VERSION` | public | pinned, not floating, so a query cannot change behaviour without a code change |
| `PUBLIC_SANITY_STUDIO_URL` | public | where the Presentation tool lives, for the click-to-edit overlays |
| `SANITY_API_READ_TOKEN` | server only | reads drafts. Without it the site serves published content and preview stays off, which is not an error |
| `CUSTOMERIO_SITE_ID` | server only | the Customer.io workspace the reminder events are written into |
| `CUSTOMERIO_TRACK_API_KEY` | server only | the other half of the Basic credential. Either one absent means this deployment sends no reminders, which is a valid state |

> TODO: set the variables in the Vercel project and run a deploy. Handle it
> through `/release vercel`.

## 9. Reference inconsistencies

The export contains errors that must not be transcribed as requirements:

| Inconsistency | Resolution |
| --- | --- |
| "All 8 steps complete" versus "Question 9 of 9" | One count, from `steps[]`. The model defines the questions and interludes never inflate the total |
| Mounjaro selected in the questionnaire, Wegovy shown in checkout | Not applicable: the plan is chosen on the recommendation screen and the cart is built from that same variant, with no in-app checkout to diverge from |
| Contradictory totals (202.90 to 127.90, 153.90 to 78.90, button reading 69.00) | Not applicable: Shopify owns the amount charged |
| Coaching priced 29 in one panel and 39 in another | Not applicable: add-ons are out of scope |
| "Wegovy Pill", "change to an injection", and treatment-fee copy conflict | Treatment naming on marketing pages comes from centralized fixtures |
| "6 month plan, pause anytime" without recurring billing rules | Marketing copy only; the real terms belong to the Shopify product |
| Delivery estimate ignores clinical approval | Any estimate shown before checkout is phrased as conditional on approval |
| No declined or refund flow | Owned by RxScale after the handoff, not a Solean screen |
| Competitor names in copy ("Juniper evens the playing field", "Minimal Voy Footer") | Replaced with Solean |
| Duplicate testimonial (Amy R. and Maya R., both 22 kg, Wegovy injection) | One testimonial per person in fixtures |
| The questionnaire export reads "Question 9 of 10" over nine question screens, and ends on "All 8 steps complete" | Same resolution as the row above, and it now applies to a second export. The counter is computed from the step plan, never transcribed from an artboard |
| The men's export asks about pregnancy and breastfeeding | Kept: the model gates those questions on `Gender = 'female'`, so the branching decides who sees them, not the landing page the visitor arrived from |

Marketing medical copy is mock content, not approved production content. From
feature 24 the questionnaire's wording is ours to write and ours to keep
medically sound, which is a responsibility the fetched model used to carry. The
clinical judgement behind it stays RxScale's: their validators still decide who
is eligible, and their doctors still review every submission.

## 10. Non-goals for this scope

Explicitly excluded, and not to be added as implementation tasks now:

- **Solean's own checkout.** No account, shipping, or payment step, no pricing
  engine, no add-on selection. Shopify returns a URL and we redirect
- **Anything in the Storefront API beyond `cartCreate` and the order attribute.**
  No cart mutation after creation, no discount codes, no second line, no
  quantity above one, no product or catalogue queries
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
- **Querying the Shopify catalogue ourselves.** The recommendation carries the
  variant, price and image of everything it offers, so nothing here reads the
  catalogue directly. Computing a recommendation from the answers stays RxScale's
  job and is not a non-goal any more: we render theirs
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
   decline happen in RxScale's doctor review, not on a Solean screen. **Feature
   24 does not change this, and running their validators from a snapshot rather
   than re-implementing them is exactly what keeps it true.** The BMI floor, the
   age window and the contraindication gates stay RxScale's expressions and
   RxScale's wording; the only thing this repository decides is which screen
   shows the message.
2. **Credentials and ids. Resolved 2026-08-31.** The questionnaire uid runs
   against the real model, and the handoff runs on `mygina.myshopify.com` with
   variant `49703544684877`, `Mounjaro 5 mg Behandlung`, the bundle. One live
   cart confirmed the shop accepts the app's payload and returns a checkout URL
   with the attribute attached. The RxScale API key and shop identifier are no
   longer read by anything.
3. **Question names for e-mail, height, and weight.** The projection interlude
   reads height and weight from `survey.data`, and the cart reads the e-mail.
   All three are configured by name and must be confirmed against the real
   model. The e-mail is now a prefill rather than a requirement, so a wrong name
   there costs a convenience, not an order.
4. **Market and country code.** `DE` is configured, and reaches two calls now:
   `buyerIdentity.countryCode` on the cart and `country_code` on the
   recommendation. RxScale's own snippet derives it from Shopify's market
   detection instead, which answered `IE` from an Irish address. Observed
   2026-08-31: the recommendation is identical for `DE`, `IE`, `AT` and `US`, so
   nothing depends on it today. Whether it should be derived is still open.
5. **Live-stock preflight. Dropped.** It was an RxScale public-API call on a
   path that no longer exists here, and it needed the same key that was refused.
   Shopify's own inventory rules apply at checkout instead.
6. **Deployment target. Resolved.** Vercel, pinned as
   `@sveltejs/adapter-vercel` in `vite.config.ts`. What remains is setting the
   variables in the provider and deploying, through `/release vercel`.
7. **Displayed price versus SKU price. Resolved for the recommendation
   screen** on 2026-08-31: its prices come from the recommendation, which reads
   the shop, so there is nothing left to keep in step. Still open for the landing
   page and the learn comparison, which remain hand-written. See section 6.
8. **The `os-date-picker` value format. Resolved.** RxScale's widget declares no
   properties, so the stored shape was the renderer's choice. Confirmed as
   `YYYY-MM-DD` on 2026-08-30; feature 10 already stores it that way.
9. **The Storefront access token.** The shop answered `cartCreate` with no token
   on 2026-08-31, three times now. Undocumented behaviour is not a foundation, so the token
   is read from configuration and sent when present, and its absence is not an
   error. Ask RxScale or the shop owner for a proper token; adopting it is one
   header and no code change.
10. **Whether one order attribute reaches every component of the bundle.**
   RxScale confirmed it on 2026-08-31, and their documented line, group, order
   fallback is why. Not observed here: the live cart proves the attribute is
   attached and reads back, and only a paid order would prove the import.
11. **The submission prefix.** `/v4/anamnesis` is not routed on `api.rxscale.com`.
   The submission goes to the prefix the model came from, `/api/v3-1/anamnesis`
   by default, where the route exists but its error bodies are undocumented.
   Feature 12 confirms them against the live service.
12. **How a model change reaches us, from feature 24.** The snapshot is the
   contract, so an edit RxScale makes in their Admin Tool is invisible here
   until the contract test runs against the live document. Two things are still
   open: how often that test runs, and whether it belongs in the ordinary test
   command, where an RxScale outage would turn into a red build for a reason
   that has nothing to do with the change under review. The starting position is
   a separate command, run deliberately, not in `pnpm test`. What is not open is
   the failure mode: a drift the test catches is a deploy, and until that deploy
   the funnel keeps working on the answers it already maps.
13. **Who owns the questionnaire's wording, from feature 24.** The text becomes
   Solean's, in two languages, and it asks about the visitor's health. Nobody
   has yet been named as the person who signs off that a question is medically
   sound and legally sufficient. The export is design copy, not approved
   clinical wording, and treating it as approved would be the same mistake as
   transcribing the marketing claims. Resolve before 24d puts the copy on a
   screen.
