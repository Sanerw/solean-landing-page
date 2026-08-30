# Solean - Project Overview

<!-- blueprint:source-hash bc283e0da550cb4544206897d8f332c6ed0fc12b554239e3692bebb79f3aa4e1 -->

> The Solean front end: a marketing site and a doctor-led GLP-1 funnel that runs
> on RxScale's Anamnesis API and hands the order to a Shopify checkout RxScale
> generates. Solean runs no checkout of its own.

## Problem

Solean models a doctor-led weight-loss service for the German and wider EU
market: a person completes an online medical questionnaire, a clinician reviews
it, treatment is prescribed when appropriate, and medication is dispensed by a
partner pharmacy and delivered discreetly.

Features 1 to 8 built that funnel as a UI prototype on mocked data, and the
marketing and editorial surfaces stay fixture-driven. **From feature 9 the funnel
is a real integration.** The questionnaire is fetched from and validated by the
RxScale Anamnesis API, the submission creates a real anamnesis record a doctor
will read, and the order is placed through an RxScale-generated Shopify checkout
URL that this app only redirects to.

The questionnaire UI is ours; the questionnaire content is not. Text, options,
order, and branching come from the RxScale model at runtime, so a change in their
Admin Tool changes the funnel without a deploy here.

## Users

| User | Needs |
| --- | --- |
| **End user** | EU adults, this variant addressed to men, seeking medically supervised weight loss. Price-aware, privacy-sensitive, comparing against competitor telehealth brands. Expects a consumer purchase experience, not a clinical portal. |
| **Product and design team** | Reviews whether the funnel works. Every feature must be independently runnable and reviewable in a browser. |

No access tiers, no authentication, no clinician-facing surface. Doctor review
happens inside RxScale, not on a Solean screen.

## Features

Fourteen in build-plan order. Features 1 to 8 are complete. The headline is the
live funnel, features 9 to 13.

1. **Design system and core UI components** (done) - semantic tokens, two fonts,
   radii, brand foundations, thirteen adapted shadcn primitives on a showcase at
   `/dev/design-system`.
2. **Prototype architecture** (done) - feature-first layout, domain types,
   journey state, service contracts, a scenario page.
3. **Design system completion and marketing shell** (done) - 3a the nine
   reference-proven primitives and the seven-variant Button contract, 3b the
   `(marketing)` shell, header, navigation, and hero.
4. **Landing page product story** (done) - 4a the bento, results and how-it-works
   panels, 4b the responsive SVG progress projection.
5. **Landing page social proof** (done) - testimonials, clinical team, FAQ.
6. **Learn article** (done) - the Mounjaro vs Wegovy comparison page.
7. **Questionnaire foundation** (done) - shell, progress, state, validation
   infrastructure, one working question, all against a local mock schema.
8. **Questionnaire content and completion** (done) - the remaining field kinds,
   medical questions, interludes, treatment preference, completion.
9. **Live questionnaire foundation** - config module, public anamnesis client,
   headless `survey-core`, the `steps[]` builder, the question type registry.
   Removes the mock schema, the questionnaire mock service, the treatment
   preference question, and the orphaned checkout and order-status mocks.
10. **Question type coverage** - every type the live model uses, mapped to
    adapted primitives, with server-side validation surfaced inline and file or
    signature answers in exact SurveyJS shape.
11. **Interludes, progress and flow integrity** - projection computed from
    `survey.data`, motivation screen, progress counting survey steps only,
    refresh, back, deep links, and version-keyed in-session persistence.
12. **Submission and the recommendation screen** - the anamnesis submission, its
    400 and 502 paths, and the congratulations screen for one configured SKU.
13. **Checkout handoff** - `POST /api/checkout` in `+server.ts`, the treatment
    checkout call, and the redirect to the returned URL.
14. **End-to-end hardening** - the whole path, states, sweeps, browser tests,
    verification.

Dropped to the deferred backlog with this plan change: Solean's own checkout
(account, shipping, payment), the pricing engine, add-on selection, and the
doctor review and order status screens.

## Data model

**Solean stores nothing server-side.** No database, no session store, no logging
of answers. In-progress answers live in the browser (`sessionStorage`, SSR-safe)
and are discarded once the submission succeeds.

**Real data now leaves the browser.** The questionnaire carries genuine personal
and medical answers to RxScale, who own storage, retention, and clinical review.

- Answers, the anamnesis uid, and the checkout URL never reach console output,
  analytics, or an error report in production.
- Nothing about the answers is persisted or forwarded anywhere except the
  anamnesis submission and, for the e-mail alone, the checkout call.

### Ownership

| Data | Owner | Notes |
| --- | --- | --- |
| Questionnaire model and theme | RxScale | SurveyJS JSON, versioned, fetched on entry to the flow, never hardcoded, never cached past the visit |
| Answers in progress | Browser session | `survey.data` in SSR-safe `sessionStorage`, keyed by questionnaire identifier and version so a model change cannot resume against stale answers |
| `steps[]` | Solean | Survey pages interleaved with Solean interludes. The single source of truth for position, progress, and routing |
| Anamnesis uid | Browser session | Returned by the submission, required by the checkout call |
| Questionnaire uid, shop identifier, SKU uid, question names | Config | One module per concern, public values separate from private ones |
| Order, payment, prescription, delivery | RxScale and Shopify | Not modelled here |

### steps[] (Solean)

- `id` (string) - the URL segment for `/questionnaire/[step]`
- `kind` (`'survey' | 'interlude' | 'recommendation'`)
- `pageName` (string, survey steps only) - the model page it synchronises to
- Progress counts `survey` steps only. Interludes never inflate the question
  count.
- Survey state is synchronised to `steps[]`, never the reverse.

### Money (domain, unchanged)

- `amount` (integer, minor units) - cents
- `currency` (`'EUR'`)

Display only. Shopify owns the amount charged.

### Treatment (domain, unchanged)

- `id`, `name`, `form` (`'injection' | 'tablet'`), `dose`, `claim`, `price`
  (Money)
- Read by the landing page bento and the learn comparison table. No longer
  selected by the user: the recommendation is one configured SKU.

### Content fixtures (static)

`Clinician`, `Testimonial`, `FaqItem`, `Article` - typed, imported directly by
marketing and editorial components.

### Removed in feature 9

`AddOn`, `PatientProfile`, `ShippingAddress`, `Order`, `PricingBreakdown`,
`OrderStatus`, the local `QuestionnaireSchema` and its answer types,
`MockQuestionnaireService`, `CheckoutService`, and `OrderService`. They modelled
the checkout and order status Solean no longer builds.

## Tech stack

| Tech | Role |
| --- | --- |
| **SvelteKit 2** | Routing, load functions, the `/api/checkout` endpoint, thin route components |
| **Svelte 5, runes** | All components; runes forced in `vite.config.ts` |
| **TypeScript strict** | Domain types and the RxScale boundary |
| **Tailwind CSS v4** | Styling, CSS-first config, semantic tokens only |
| **shadcn-svelte** (`luma`) | Behavior and accessibility layer, all primitives adapted |
| **survey-core** | Headless questionnaire engine: branching, validation, the `data` shape. No SurveyJS renderer, no SurveyJS theme |
| **RxScale API** | Anamnesis v4 and Public API v2. Docs at `https://docs.rxscale.com`, also an MCP server |
| **Lucide** | Icons |
| **pnpm** | Package manager |

### Architecture

```
src/routes/                   routing, load, endpoints, screen composition
src/lib/features/             marketing, learn, questionnaire
src/lib/domain/               Money, Treatment and the catalogue
src/lib/journey/              browsing -> questionnaire -> handoff
src/lib/components/ui/        shadcn primitives
src/lib/components/brand/     global brand visuals
src/lib/config/               questionnaire uid, SKU, question names, public values
src/lib/server/rxscale/       the private-key client, server-only
```

Static marketing and editorial features consume typed content fixtures directly.
The questionnaire owns one typed boundary to RxScale rather than a service
interface per screen. No abstraction is built before something calls it.

### The RxScale boundary

| Call | Endpoint | Auth |
| --- | --- | --- |
| Fetch the questionnaire | `GET https://api.rxscale.com/v4/anamnesis/questionnaires/{uid}` | public |
| Submit answers | `POST https://api.rxscale.com/v4/anamnesis/questionnaires/{uid}/submissions` | public |
| Create the checkout | `POST https://api.rxscale.com/v2/public-api/treatments/{shop_identifier}` | `X-API-Key`, permission `create_treatment_checkout` |
| Live stock, optional | `POST https://api.rxscale.com/v2/public-api/products/{shop_identifier}/live-stock` | `X-API-Key`, permission `product:read`, 409 means out of stock |

The submission returns `{ "uid": "anam-..." }`; the checkout returns
`{ "status": "success", "checkout_url": "..." }`. Submission errors: 400
validation (nothing saved, stay on the questionnaire), 404 unknown
questionnaire, 502 validator unavailable (retry, nothing saved).

Rules that bind every feature from 9 onward:

- `RXSCALE_API_KEY` and `RXSCALE_SHOP_IDENTIFIER` are private: read through
  `$env/static/private`, used only in `+server.ts`. Never a `PUBLIC_` prefix,
  never imported by a component.
- The model is the only source of question content. Nothing hardcoded, nothing
  hidden by a condition in our code. The submission is validated server-side
  against the current model, so hiding a required question guarantees a 400.
- `survey-core` runs headless with `showNavigationButtons` off. Continue is gated
  on `survey.currentPage.validate(true, true)`.
- An unmapped question type fails visibly in development and is logged in
  production. A question is never skipped silently.
- `anamnesis_id` is mandatory on the checkout line. The API marks it optional;
  Solean does not, because a Shopify order without an anamnesis gives the doctor
  nothing to review. A missing uid blocks the redirect and shows an error.
- The checkout URL is generated on click, never on screen entry, and the returned
  `checkout_url` is opaque: no appended parameters, no trimming, no domain
  substitution.
- One configured SKU. The catalogue is not queried and no recommendation is
  computed from the answers.
- The `buyerIdentity` e-mail is read from the answers by a configured question
  name. The phone question is rendered whenever the model contains it, but the
  phone is not sent in this iteration.

### Testing

Decided: run `/tests` before feature 9, so Vitest and the test gate exist before
the integration logic does. In scope for unit tests: the model to `steps[]`
mapping, the question type registry including its unmapped-type failure, and the
checkout payload builder (missing uid, missing or empty e-mail answer, a
configured question name absent from the model). Component rendering and the
RxScale calls themselves stay with the browser harness (`pnpm test:browser`), a
walkthrough, and the build.

## Monetization

Revenue happens in Shopify, through the checkout URL RxScale generates. Solean
takes no payment, calculates no total, and applies no discount.

Money on Solean pages is marketing copy: the reference prices the landing page,
the learn comparison, and the recommendation screen display.

| Line item | Displayed price |
| --- | --- |
| Treatment plan, first month supply | 144.00 EUR |
| Initial treatment fee | 9.90 EUR |
| First-order discount | -75.00 EUR |
| Shipping | Free |

> Keeping the displayed price in step with the Shopify price of the configured
> SKU is a manual editorial task. This app never reads the catalogue, so nothing
> detects a divergence.

## UI/UX

Visual reference: `design/prio_one_landing_page_men_new.html`, a Pencil canvas
export of 21 artboards. **A reference, not code to port.** Full token mapping in
`blueprint/reference/design-system.md`.

**Two fonts only:** Inter Tight (`--font-display`) for headings, product names,
prices, stats. DM Sans (`--font-sans`) for everything else.

**Semantic tokens only.** Gold `--primary` `#E2B64F`, deep green `--foreground`
`#173824`, warm sand `--background` `#FBFAF7`. `--rating` `#00B67A` is for stars
only. Base `--radius: 1.25rem`, stock radius classes, pills use `rounded-full`.

**Focus:** `--ring` is deep green `#173824`. Default
`focus-visible:ring-2 ring-ring ring-offset-2 ring-offset-background`; gold ring
only on dark surfaces.

**Destructive is provisional.** `--destructive` `#C34E45` with white foreground
is approved for this build and still needs final brand review, with a darker
`--destructive-text` `#BC483F` for text on the warm ground. It now also carries
the RxScale validation errors.

**Stock Tailwind scales only.** No arbitrary visual values. SVG geometry,
`viewBox`, path data, and data-driven values are exempt.

**Dark mode is out of scope.**

### Routes

| Route | What's there |
| --- | --- |
| `/` | Landing page: hero, product story, social proof, FAQ, footer |
| `/learn/blog/[slug]` | Learn article with ToC, comparison, related content |
| `/questionnaire/[step]` | Every survey page, interlude, and the recommendation screen |
| `POST /api/checkout` | Server endpoint: creates the RxScale checkout and returns the URL to redirect to |

Route groups: `(marketing)`, `(questionnaire)`. The `(checkout)` group is not
built.

Development surfaces, not public routes:

| Route | What's there |
| --- | --- |
| `/dev/design-system` | Features 1 and 3a showcase: tokens, type, every adapted primitive and its states |
| `/dev/scenario` | Feature 2's journey scenario page, reduced to the stages that survive |

### Shared UI primitives

Twenty-two adapted primitives from features 1 and 3a: `button`, `input`,
`textarea`, `label`, `select`, `checkbox`, `radio-group`, `card`, `badge`,
`separator`, `dialog`, `sheet`, `accordion`, `field`, `input-group`, `progress`,
`navigation-menu`, `tabs`, `carousel`, `alert`, `breadcrumb`, `collapsible`.
Still deferred: `popover`, `tooltip`, `sonner`, `skeleton`, `chart`.

Question types map to primitives through a registry keyed by the model's type:
single choice to `RadioGroup`, multiple choice to `Checkbox`, dropdown to
`Select`, free text and numeric to `Input` and `InputGroup`, all wrapped in
`Field`. Not a chain of conditionals in a screen component.

**Accessibility and responsiveness are done criteria on every feature.** Feature
14 catches cross-feature regressions only.

## Deployment

**A static build is no longer possible.** `POST /api/checkout` runs server-side
because it holds the private API key, so the host must execute server code: Node,
or a serverless platform with a matching SvelteKit adapter.
`@sveltejs/adapter-auto` still cannot detect a target and warns at build time.

| Variable | Visibility | Purpose |
| --- | --- | --- |
| `RXSCALE_API_KEY` | private, server only | `X-API-Key` for the checkout call |
| `RXSCALE_SHOP_IDENTIFIER` | private, server only | shop path segment |
| `PUBLIC_RXSCALE_QUESTIONNAIRE_UID` | public | the questionnaire to fetch |

> TODO: choose a host, swap `adapter-auto` for the matching adapter, and set the
> three variables in the provider. Handle it through `/release`.

## Open questions

Resolve each before the feature named, then re-run `/overview` if a plan changes.

1. ~~**Eligibility rule.**~~ Resolved, and now external. The questionnaire never
   judges: branching is whatever the model expresses through `visibleIf`, and
   approval or decline happens in RxScale's doctor review.
2. ~~**Testing decision.**~~ Resolved: run `/tests` before feature 9.
3. **Credentials and ids, required before feature 9 can run against the real
   model.** The questionnaire uid, shop identifier, API key, and SKU uid are
   supplied by the user. Until they arrive the config module holds placeholders
   and the flow cannot be verified end to end.
4. **Question names for e-mail, height, and weight.** Configured by name and
   confirmed against the real model, needed by features 11 and 13.
5. **Market and country code.** `DE` is assumed for `buyerIdentity.countryCode`.
   Confirm before feature 13, and decide whether it stays fixed or is derived.
6. **Live-stock preflight.** Optional in feature 13. Decide whether an
   out-of-stock SKU blocks the order or lets it through.
7. **Deployment target.** Now blocking, see Deployment.
8. **Displayed price versus SKU price.** See Monetization.

### Reference errors are not requirements

Known defects in the export must never be transcribed: "All 8 steps complete"
against "Question 9 of 9"; conflicting Wegovy Pill and injection copy; missing
recurring billing terms; a delivery estimate ignoring clinical approval; copy
naming Juniper or Voy; duplicated testimonials. Resolutions in
`project-plan.md` section 9. The checkout and order-status inconsistencies no
longer apply: both surfaces belong to RxScale and Shopify. Marketing medical copy
is mock content and not approved production content; the questionnaire's medical
content is RxScale's, not ours.
