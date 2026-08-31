# Solean - Project Overview

<!-- blueprint:source-hash f6cabbc69ae583920a0d7802d97e1629062a4ea89884b75f5de75b5f0852bbf3 -->

> The Solean front end: a marketing site and a doctor-led GLP-1 funnel that runs
> on RxScale's Anamnesis API and hands the order to Shopify by creating a cart
> that carries the anamnesis reference. Solean runs no checkout of its own.

## Problem

Solean models a doctor-led weight-loss service for the German and wider EU
market: a person completes an online medical questionnaire, a clinician reviews
it, treatment is prescribed when appropriate, and medication is dispensed by a
partner pharmacy and delivered discreetly.

Features 1 to 8 built that funnel as a UI prototype on mocked data, and the
marketing and editorial surfaces stay fixture-driven. **From feature 9 the funnel
is a real integration.** The questionnaire is fetched from and validated by the
RxScale Anamnesis API, the submission creates a real anamnesis record a doctor
will read, and the order is placed by creating a Shopify cart that carries the
anamnesis as an order attribute, then redirecting to the checkout URL Shopify
returns.

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
   journey state, service contracts, a scenario page. Feature 9c removes the
   journey and the mock services the pivot left without callers.
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
9. **Live questionnaire foundation**, split into three:
   **9a** (done) the config module, the public anamnesis client, honest failure
   states and the headless engine;
   **9b** (done) `steps[]`, the question type registry, the model-driven route,
   and the deletion of the local schema;
   **9c** the removal of the checkout, order-status and journey modules with the
   domain types and dev surface that served them.
10. **Question type coverage** - every type the live model uses, mapped to
    adapted primitives, with server-side validation surfaced inline and file or
    signature answers in exact SurveyJS shape.
11. **Interludes, progress and flow integrity** - projection computed from
    `survey.data`, motivation screen, progress counting survey steps only,
    refresh, back, deep links, and version-keyed in-session persistence.
12. **Submission and the recommendation screen** - the anamnesis submission, its
    400 and 502 paths, and the congratulations screen for one configured SKU.
13. **Checkout handoff** - `POST /api/checkout` in `+server.ts`, the Shopify
    `cartCreate` call, and the redirect to the returned URL. Built first against
    RxScale's treatment checkout, then rebuilt on the cart when that endpoint
    proved unusable.
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
| Anamnesis uid | Browser session | Returned by the submission, the key to the recommendation, and the cart's order attribute |
| Recommendation | RxScale | Which treatments and doses the answers allow, with the Shopify variant and price of each. Read on the screen and again on the order, never cached |
| Questionnaire uid, store domain, variant id, question names | Config | One module per concern. Nothing on the checkout path is a secret |
| Order, payment, prescription, delivery | Shopify, then RxScale by webhook | Not modelled here. RxScale is never told about the order by us |

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
src/lib/components/ui/        shadcn primitives
src/lib/components/brand/     global brand visuals
src/lib/config/               questionnaire uid, the anamnesis attribute key, question names
src/lib/server/shopify/       the Storefront cart client, server-only
```

Static marketing and editorial features consume typed content fixtures directly.
The questionnaire owns one typed boundary per external service rather than a
service interface per screen. No abstraction is built before something calls it.

### The external boundaries

| Call | Endpoint | Auth |
| --- | --- | --- |
| Fetch the questionnaire | `GET https://api.rxscale.com/api/v3-1/anamnesis/questionnaires/{uid}` | public |
| Submit answers | `POST https://api.rxscale.com/api/v3-1/anamnesis/questionnaires/{uid}/submissions` | public |
| Read the recommendation | `GET https://api.rxscale.com/api/v2/anamnesis/{anamnesisUid}/recommendation` | public |
| Create the cart | `POST https://{store}/api/{version}/graphql.json`, `cartCreate` | Storefront token when configured |

**RxScale is not called to place the order.** They import it from Shopify by
webhook and read the anamnesis off the cart attribute. Their treatment checkout
endpoint was tried first and refused: the key lacks `create_treatment_checkout`,
a permission the Admin Tool does not offer, and RxScale recommended the cart
instead on 2026-08-31.

The submission returns `{ "uid": "anam-..." }`; `cartCreate` returns
`cart { checkoutUrl }` plus `userErrors`, which arrive with a 200 and are the
refusal channel. Submission errors: 400 validation (nothing saved, stay on the
questionnaire), 404 unknown questionnaire, 502 validator unavailable (retry,
nothing saved).

Rules that bind every feature from 9 onward:

- No secret is on the checkout path. `SHOPIFY_STORE_DOMAIN` and
  `SHOPIFY_VARIANT_ID` are read through `$env/dynamic/private` and used only in
  `+server.ts`, so the variant stays out of the client bundle and validation has
  one home, not because they are private.
- The model is the only source of question content. Nothing hardcoded, nothing
  hidden by a condition in our code. The submission is validated server-side
  against the current model, so hiding a required question guarantees a 400.
- `survey-core` runs headless with `showNavigationButtons` off. Continue is gated
  on `survey.currentPage.validate(true, true)`.
- An unmapped question type fails visibly in development and is logged in
  production. A question is never skipped silently.
- `_anamnesis_uid` is mandatory, exact, and set on the cart's order attributes
  alone. RxScale compares the key character for character and ignores a mismatch
  silently, so it is one constant, never assembled from parts. Order level
  because their resolution falls back from the line to its group to the order,
  which is what reaches the components a bundle expands into. A missing uid
  blocks the redirect and shows an error.
- The cart is created on click, never on screen entry, and the returned
  `checkoutUrl` is opaque: no appended parameters, no trimming, no domain
  substitution.
- **The recommendation is RxScale's, not ours.** After the submission,
  `GET /api/v2/anamnesis/{uid}/recommendation` returns the treatments and doses
  the answers allow, each with its Shopify variant, its price, and RxScale's own
  `pre_selected` default. Nothing is computed here and the catalogue is never
  queried. It is read server-side: the raw document is over a megabyte of
  catalogue graph, and the same read validates the order.
- **The variant the browser names is a request, not an authorisation.**
  `/api/checkout` reads the recommendation again and refuses a variant that is
  not in it, so the endpoint cannot be used to order arbitrary merchandise.
- `SHOPIFY_VARIANT_ID` is the fallback and only that: the plan offered when
  RxScale recommends nothing, or cannot be reached. It is a bundle Shopify
  expands into medication, treatment fee, and needles, so no fee line is ever
  built here.
- **A prescription-only listing is a different purchase.** `sku.digital` marks
  the ones where the signed prescription is all that is sold, at a fraction of
  the price and with nothing dispensed or delivered, so they are shown under
  their own heading and never beside a treatment price.
- The `buyerIdentity` e-mail is read from the answers by a configured question
  name. It is a prefill, not a condition: Shopify collects the address at
  checkout, so an order without one is complete rather than unreachable. The
  phone question is rendered whenever the model contains it, but the phone is
  not sent in this iteration.

### Testing

Decided: run `/tests` before feature 9, so Vitest and the test gate exist before
the integration logic does. In scope for unit tests: the model to `steps[]`
mapping, the question type registry including its unmapped-type failure, and the
cart input builder (missing uid, an unconfigured variant, an absent e-mail
answer, and the order-level placement of `_anamnesis_uid`). Component rendering and the
RxScale calls themselves stay with the browser harness (`pnpm test:browser`), a
walkthrough, and the build.

## Monetization

Revenue happens in Shopify, through the checkout URL RxScale generates. Solean
takes no payment, calculates no total, and applies no discount.

Money on the landing page and the learn comparison is marketing copy: reference
prices, kept in step by hand.

**The recommendation screen is not.** Every amount it shows comes from the
recommendation, which reads the shop's own catalogue, so it cannot drift from
what Shopify charges. It shows what is offered rather than a fixed line-item
breakdown:

| Offer | Price, live shop |
| --- | --- |
| Treatment, one month | 99.00 to 549.00 EUR by product and dose |
| Prescription only, no medication | 49.90 EUR |

> The landing page and the learn article still carry hand-written reference
> prices, and nothing detects a divergence there.

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
| `GET /api/recommendation` | Server endpoint: what RxScale recommends for one anamnesis, trimmed for the screen |
| `POST /api/checkout` | Server endpoint: checks the chosen variant against the recommendation, creates the Shopify cart, returns the URL to redirect to |

Route groups: `(marketing)`, `(questionnaire)`. The `(checkout)` group is not
built.

Development surfaces, not public routes:

| Route | What's there |
| --- | --- |
| `/dev/design-system` | Features 1 and 3a showcase: tokens, type, every adapted primitive and its states |
| `/dev/questionnaire` | The fetched model: identifier, version, step plan, every question with its type and whether it has a renderer |

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
so the cart's rules are enforced in one place and the variant stays out of the
client bundle, so the host must execute server code: Node, or a serverless
platform with a matching SvelteKit adapter.
`@sveltejs/adapter-auto` still cannot detect a target and warns at build time.

| Variable | Visibility | Purpose |
| --- | --- | --- |
| `SHOPIFY_STORE_DOMAIN` | server only | the shop the cart is created in |
| `SHOPIFY_VARIANT_ID` | server only | fallback only: the plan offered when RxScale recommends nothing |
| `SHOPIFY_STOREFRONT_TOKEN` | server only, optional | sent when configured |
| `SHOPIFY_STOREFRONT_API_VERSION` | server only, optional | defaults to `2025-01` |
| `PUBLIC_RXSCALE_QUESTIONNAIRE_UID` | public | the questionnaire to fetch |
| `PUBLIC_RXSCALE_SHOP_IDENTIFIER` | public | the shop the recommendation is keyed by. The storefront hostname (`solean.com`), not the myshopify domain, which is refused |

> TODO: choose a host, swap `adapter-auto` for the matching adapter, and set the
> variables in the provider. Handle it through `/release`.

## Open questions

Resolve each before the feature named, then re-run `/overview` if a plan changes.

1. ~~**Eligibility rule.**~~ Resolved, and now external. The questionnaire never
   judges: branching is whatever the model expresses through `visibleIf`, and
   approval or decline happens in RxScale's doctor review.
2. ~~**Testing decision.**~~ Resolved: run `/tests` before feature 9.
3. ~~**Credentials and ids.**~~ Resolved 2026-08-31. The questionnaire runs
   against the real model, and the handoff runs on `mygina.myshopify.com` with
   variant `49703544684877`, `Mounjaro 5 mg Behandlung`, the bundle. One live
   cart confirmed the shop accepts the app's payload. The RxScale API key and
   shop identifier are no longer read by anything.
4. **Question names for e-mail, height, and weight.** Configured by name and
   confirmed against the real model, needed by feature 11. The e-mail is now a
   prefill rather than a requirement, so a wrong name there costs a convenience,
   not an order.
5. **Market and country code.** `DE` is configured, and now reaches two calls:
   `buyerIdentity.countryCode` on the cart and `country_code` on the
   recommendation. The live snippet derives it from Shopify's market detection
   instead, which answered `IE` from an Irish address. Observed 2026-08-31: the
   recommendation is identical for `DE`, `IE`, `AT` and `US`, so nothing depends
   on it today. Whether it should be derived is still open.
6. ~~**Live-stock preflight.**~~ Dropped. It was an RxScale public-API call on a
   path that no longer exists here, and it needed the same key that was refused.
   Shopify's own inventory rules apply at checkout instead.
7. **Deployment target.** Now blocking, see Deployment.
8. ~~**The `os-date-picker` value format.**~~ Resolved: `YYYY-MM-DD`, confirmed
   2026-08-30. That is what feature 10 stores and what the submission sends.
9. **Whether `/v4/anamnesis` will be routed.** Answered in part: it is not.
   `/v4/anamnesis/questionnaires/{uid}/submissions` falls through to object
   storage, while the same path under `/api/v2` and `/api/v3-1` answers 405 to a
   GET, so the route exists there and takes POST only. What remains is whether
   that prefix returns the v4 documented 400 and 502 bodies, which feature 12
   settles with one live submission.
10. ~~**Displayed price versus SKU price.**~~ Resolved for the recommendation
    screen on 2026-08-31: its prices come from the recommendation, which reads
    the shop, so there is nothing left to keep in step. Still open for the
    landing page and the learn comparison, which remain hand-written.
11. **The Storefront access token.** The shop answered `cartCreate` with no token
    on 2026-08-31, twice. Undocumented behaviour is not a foundation, so the
    token is sent when configured and its absence is not an error. Adopting a
    proper one is one header and no code change.
12. **Whether one order attribute reaches every component of the bundle.**
    RxScale confirmed it on 2026-08-31, and their line, group, order fallback is
    why. Not observed here: the live cart proves the attribute is attached and
    reads back, and only a paid order would prove the import.

### Reference errors are not requirements

Known defects in the export must never be transcribed: "All 8 steps complete"
against "Question 9 of 9"; conflicting Wegovy Pill and injection copy; missing
recurring billing terms; a delivery estimate ignoring clinical approval; copy
naming Juniper or Voy; duplicated testimonials. Resolutions in
`project-plan.md` section 9. The checkout and order-status inconsistencies no
longer apply: both surfaces belong to RxScale and Shopify. Marketing medical copy
is mock content and not approved production content; the questionnaire's medical
content is RxScale's, not ours.
