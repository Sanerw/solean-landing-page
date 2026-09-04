# Solean - Project Overview

<!-- blueprint:source-hash 64271b4a7f5b0f05d8ee6679d5885c926ced4865b4ead97189ed56e008952198 -->

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

The questionnaire UI is ours; through feature 23 the questionnaire content was
not. Text, options, order, and branching came from the RxScale model at runtime,
so a change in their Admin Tool changed the funnel without a deploy here.

**Feature 24 reverses that.** The content becomes one typed definition in this
repository, and RxScale's model becomes the contract the answers are mapped onto:
a committed snapshot applies their `visibleIf` and their `validators` locally, a
contract test fails when the live document drifts from it, and their server still
validates every submission. The property being given up is stated plainly,
because it was the point of the old arrangement: RxScale can no longer change the
funnel's questions without a deploy here.

## Users

| User | Needs |
| --- | --- |
| **End user** | EU adults, this variant addressed to men, seeking medically supervised weight loss. Price-aware, privacy-sensitive, comparing against competitor telehealth brands. Expects a consumer purchase experience, not a clinical portal. |
| **Product and design team** | Reviews whether the funnel works. Every feature must be independently runnable and reviewable in a browser. |

No access tiers, no authentication, no clinician-facing surface. Doctor review
happens inside RxScale, not on a Solean screen.

## Features

Twenty-four in build-plan order. The first twenty-three are complete; 24 is
next.

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
   **9c** (done) the removal of the checkout, order-status and journey modules with the
   domain types and dev surface that served them.
10. **Question type coverage** (done) - every type the live model uses, mapped to
    adapted primitives, with server-side validation surfaced inline and file or
    signature answers in exact SurveyJS shape.
11. **Interludes, progress and flow integrity** (done) - projection computed from
    `survey.data`, motivation screen, progress counting survey steps only,
    refresh, back, and deep links. In-session persistence was later removed: nothing
    is stored, so a refresh starts the questionnaire over.
12. **Submission and the recommendation screen** (done) - the anamnesis submission, its
    400 and 502 paths, and the congratulations screen for one configured SKU.
13. **Checkout handoff** (done) - `POST /api/checkout` in `+server.ts`, the Shopify
    `cartCreate` call, and the redirect to the returned URL. Built first against
    RxScale's treatment checkout, then rebuilt on the cart when that endpoint
    proved unusable.
14. **End-to-end hardening** (done) - the whole path, states, sweeps, browser tests,
    verification.
15. **Mobile announcement bar and hero** (done) - the landing page's mobile
    announcement bar, hero imagery, navigation treatment, copy layout, CTA and
    trust indicators, without regressing desktop.
16. **Mobile menu panel** (done) - the opened menu as the reference's full-screen
    treatment, with three hero refinements agreed during review.
17. **Mobile landing sections** (done) - the mobile refinement carried down the
    rest of the landing page.
18. **Legal pages and real contact details** (done) - the four German policy documents
    Solean already publishes, served on their own routes and linked from the
    footer, plus the real support address, telephone number and service hours.
19. **German as the default language, English at `/en`** (done) - 19a the Paraglide
    runtime, locale routing and the shared chrome; 19b the landing page; 19c the
    Learn article; 19d the questionnaire chrome; 19e the flip that moves German
    to the bare path. The questionnaire's own questions stay RxScale's and stay
    German, so an English visitor reaches a German funnel by decision.

20. **Learn article from Sanity** (done) - the Mounjaro vs Wegovy page
    reads its content from the Content Lake instead of
    `src/lib/features/learn/content.ts`, in both languages, so an editor can
    publish a second article without a deploy. The hero becomes a Sanity-hosted
    image served through the CDN. The related-guides block stays a fixture.
21. **Landing page from Sanity** (done) - every section reads its copy and its
    photographs from the Content Lake, in both languages. The images moved too,
    which meant rebuilding the `enhanced:img` width ladders as `w`-descriptor CDN
    srcsets and teaching the image-density test to measure a cross-origin file it
    cannot fetch. Payment and carrier logos stay in the repository: chrome, not
    home page content.

22. **Brevo abandoned-questionnaire reminder** (done) - a visitor who types their
    e-mail and does not submit gets a reminder; one who submits stops getting
    them. Two server-sent events carry it, `questionnaire_email_captured` and
    `anamnesis_submitted`; the campaign, its timing and its exit condition live
    in the vendor's panel, not here. Nothing medical travels. Because nothing is
    persisted, the reminder returns someone to the start of the questionnaire,
    not to the step they left. Feature 23 replaces Brevo with Customer.io.

23. **Customer.io reminder, replacing Brevo** (done) - the same reminder, moved
    onto Customer.io and off Brevo entirely. The seam feature 22 drew stays:
    `POST /api/reminder` takes a stage and an address, the browser half is
    untouched, and both event names keep their spelling, because a person types
    them into the new panel exactly as they typed them into the old one. What
    changes is the vendor: the EU region, HTTP Basic with a Site ID and a Track
    API Key instead of one `api-key` header, and the e-mail as the person
    identifier, because this app persists nothing it could key on instead.
    `src/lib/server/brevo/` and `BREVO_API_KEY` are deleted in the same feature,
    so the app is never wired to two mail vendors at once.

24. **Own questions, mapped onto RxScale** (next) - the questionnaire's content
    moves into this repository, built from the Pencil export at
    `blueprint/reference/questionnaire-flow-export.html`. RxScale keeps every
    clinical judgement and gains a new role: contract. Four sub-features, each
    leaving the app working.
    - **24a** the typed definition: our questions, options, screens, branching
      and per-screen validation as data, plus the answer store. Unit tested, and
      nothing user-facing changes yet.
    - **24b** the contract: the committed model snapshot, the mapper into
      RxScale's `data` shape with its reverse index, the shadow `survey-core`
      that applies their `visibleIf` and `validators` locally, the completeness
      guard, and the contract test against the live document. Still additive.
    - **24c** the switch: route, screens, progress, branching and submission all
      read the local definition, and the runtime model fetch with its entry
      failure states is removed.
    - **24d** the added screens and the design pass: the seven answers the export
      never asks for, medication history rebuilt to its artboards, copy in both
      languages, browser coverage, accessibility.

Dropped to the deferred backlog with this plan change: Solean's own checkout
(account, shipping, payment), the pricing engine, add-on selection, and the
doctor review and order status screens.

## Data model

**Solean stores nothing server-side.** No database, no session store, no logging
of answers. **The browser stores nothing either.** In-progress answers live in
one module in memory and are never written to `sessionStorage` or anywhere else,
so a reload starts the questionnaire over: the medical answers a person types do
not outlive the page asking for them.

**Real data now leaves the browser.** The questionnaire carries genuine personal
and medical answers to RxScale, who own storage, retention, and clinical review.

- Answers, the anamnesis uid, and the checkout URL never reach console output,
  analytics, or an error report in production.
- Nothing about the answers is persisted or forwarded anywhere except the
  anamnesis submission and, for the e-mail alone, the checkout call and the
  Customer.io reminder.

**The reminder exception, decided 2026-09-03.** The visitor's e-mail is forwarded
to a marketing processor when the question is answered, which is *before* any
submission, so a reminder can reach someone who walked away. A personal
identifier leaves an unfinished medical questionnaire, deliberately. What may
travel is the e-mail and a stage marker: no answer, no anamnesis uid, no
medication or dose, no name, no telephone number. Typing the e-mail and
continuing is the whole consent step; there is no separate marketing opt-in.

**The processor changed, the decision did not.** Feature 22 sent this to Brevo;
feature 23 moves it to Customer.io, EU region. Only one processor is ever
configured, and what may travel was not re-opened.

### Ownership

| Data | Owner | Notes |
| --- | --- | --- |
| Questionnaire content | Solean, from feature 24 | Question text, options, order, required flags and branching, as one typed definition in the repository, in German and English. Changing a question is a deploy, deliberately |
| RxScale model | RxScale, snapshotted here from feature 24 | The contract the answers are mapped onto. A committed copy drives their `visibleIf` and `validators` locally; the live document is read only by the contract test, which fails when the two drift. Through feature 23 this was fetched on every entry to the flow |
| Answers in progress | Browser memory | `survey.data` in one module, never persisted. Client-side navigation between steps keeps them; a reload does not |
| `steps[]` | Solean | Survey pages interleaved with Solean interludes. The single source of truth for position, progress, and routing |
| Anamnesis uid | Browser memory | Returned by the submission, the key to the recommendation, and the cart's order attribute. Not persisted, so a reload after the submission cannot reach the order screen |
| Recommendation | RxScale | Which treatments and doses the answers allow, with the Shopify variant and price of each. Read on the screen and again on the order, never cached |
| Questionnaire uid, store domain, variant id, question names | Config | One module per concern. Nothing on the checkout path is a secret |
| Order, payment, prescription, delivery | Shopify, then RxScale by webhook | Not modelled here. RxScale is never told about the order by us |
| Learn article and its reviewer | Sanity | Published editorial copy, one document per language. Read at request time, never cached past the response |
| Visitor e-mail, once typed | Customer.io, EU region | Forwarded when the question is answered, before any submission, so a reminder can be sent. The e-mail and a stage marker, nothing else |

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

### Editorial content (Sanity, from feature 20)

Project `tzq5b2my`, dataset `production`. The Studio is standalone in
`../studio-solean`, never embedded in a route. Sanity holds published editorial
copy only: no answers, nothing personal, nothing from the funnel.

Document-level i18n via `@sanity/document-internationalization`: one document per
language, linked by a `translation.metadata` document, so every query filters on
`language`. The locale list stays in `project.inlang/settings.json`, because
Paraglide compiles the message catalogues from it at build time.

| Type | Fields | Read by |
| --- | --- | --- |
| `article` | `language`, `title`, `shortTitle`, `slug`, `category`, `summary`, `hero` (image + alt), `reviewer` (ref to `clinician`), `reviewedAt`, `nextReviewAt`, `readTimeMinutes`, `quickAnswer[]`, `keyTakeaways[]`, `treatmentProfiles[]`, `howTheyWork[]`, `expectedResults[]`, `sideEffects{intro, items[]}`, `faqs[]`, `sourcesSummary`, `sources[]`, `related[]`, SEO overrides | `/learn/blog/[slug]` |
| `clinician` | `language`, `name`, `role`, `description`, `portrait` | as an article's reviewer |
| `homePage` | localized singleton at `homePage-de` / `homePage-en`: announcement, hero, article teaser, trust band, bento, results band, projection wording, medical framing, stories, team, FAQ, and every photograph | `/` |
| `testimonial` | `language`, `name`, `memberLabel`, `quote`, `kgLost`, `rating`, `treatmentId`, `verified`, `photo` | `/` and the questionnaire's motivation screen |

`treatmentProfile` is an object inside an article, not a document: it names a
treatment by the catalogue id (`mounjaro`, `wegovy`, `wegovy-pill`) and adds the
article's own framing (active ingredient, manufacturer, frequency, main action,
manufacturer note). Treatments themselves stay in `src/lib/domain`, because they
are commerce data keyed to Shopify variants.

### What stays in the repository

Not everything on a page is editorial content, and three things stay in code on
purpose.

- **The chart's figures.** `projection` in Sanity carries the section's wording
  only; the reference weights and horizons are geometry.
- **Payment and carrier logos.** Brand marks in the footer, on every page.
- **The treatment catalogue.** Commerce data keyed to Shopify variants, in
  `src/lib/domain`. Editorial content names a treatment by its id.

The Learn article's related-guides block also stays a fixture for now.

### Two rules the Sanity boundary imposes

- **Clean every string used as logic.** Preview mode embeds invisible source
  markers in all content so the Presentation tool can offer click-to-edit. They
  are harmless in prose and fatal in a lookup key: an icon name, a bento
  category, a catalogue id, an href. `$lib/sanity/plain` strips them, and the
  mappers apply it at the boundary so no component has to remember. Skipping it
  once cost the previewed page every photograph and every card colour.
- **Guard every section.** Sections are optional fields, so the page renders each
  one only when its content is there. An editor who empties a section, or
  publishes a draft written before a field existed, loses that section and
  nothing else.

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
| **survey-core** | Headless questionnaire engine: branching, validation, the `data` shape. No SurveyJS renderer, no SurveyJS theme. From feature 24 it is fed the committed snapshot and holds RxScale's rules rather than our questions |
| **RxScale API** | Anamnesis v4 and Public API v2. Docs at `https://docs.rxscale.com`, also an MCP server |
| **Sanity** | Editorial content. Standalone Studio in `../studio-solean`; `@sanity/sveltekit` here for the client, preview mode and Visual Editing |
| **Customer.io** | The abandoned-questionnaire reminder, from feature 23, EU region. Server-side REST only: no tracker, no browser script |
| **Lucide** | Icons |
| **pnpm** | Package manager |

**Two rules bind every Sanity import.** `@sanity/sveltekit` has a single entry
point that also carries Sanity UI's stylesheet, and that stylesheet declares a
`sui` cascade layer plus a `:where(html, body, button)` reset.

- Nothing that renders on an ordinary page may import it eagerly. Pages read
  Sanity data through `$lib/sanity/LiveQuery.svelte`, which renders the server
  load's data and only reaches for `useQuery` behind a dynamic import when
  preview is on. The root layout loads the preview providers the same way.
- `layout.css` declares `@layer sui, sui.global` above the Tailwind import.
  Layers rank by first declaration, so without that line Sanity's layer is
  declared last, outranks every Tailwind utility, and strips the padding, gaps
  and radii off the page.

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

From feature 24 the questionnaire feature grows three folders, which is the whole
shape of the pivot in one place:

```
questionnaire/definition/     our questions, options, screens, typed branching
questionnaire/answers/        the typed answer store and our per-screen validation
questionnaire/rxscale/        the model snapshot, the mapper, the shadow validator
```

Static marketing and editorial features consume typed content fixtures directly.
The questionnaire owns one typed boundary per external service rather than a
service interface per screen. No abstraction is built before something calls it.

### The external boundaries

| Call | Endpoint | Auth |
| --- | --- | --- |
| Fetch the questionnaire model | `GET https://api.rxscale.com/api/v3-1/anamnesis/questionnaires/{uid}` | public. From feature 24 this leaves the visitor's path: only the contract test calls it |
| Submit answers | `POST https://api.rxscale.com/api/v3-1/anamnesis/questionnaires/{uid}/submissions` | public |
| Read the recommendation | `GET https://api.rxscale.com/api/v2/anamnesis/{anamnesisUid}/recommendation` | public |
| Create the cart | `POST https://{store}/api/{version}/graphql.json`, `cartCreate` | Storefront token when configured |
| Signal the funnel stage | `POST https://track-eu.customer.io/api/v2/entity` | `CUSTOMERIO_SITE_ID` and `CUSTOMERIO_TRACK_API_KEY` as HTTP Basic, server only |

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

- No secret is on the checkout path. `PUBLIC_SHOPIFY_STORE_DOMAIN` is public
  because the checkout URL names the shop anyway, while `SHOPIFY_VARIANT_ID`
  stays private and is used only in `+server.ts`, so the variant stays out of
  the client bundle and validation has one home, not because it is a secret.
- Through feature 23, the model is the only source of question content: nothing
  hardcoded, nothing hidden by a condition in our code. **Feature 24 reverses
  this.** The content is Solean's, in one typed definition, and RxScale's model
  is the contract the answers are mapped onto. Their `visibleIf` and
  `validators` still apply, from a committed snapshot and in their own wording,
  and the submission is still validated server-side against their current model,
  so a divergence still returns a 400. Every question of theirs that is required
  and visible must have a mapped answer; a gap fails visibly in development
  rather than reaching a visitor as a 400.
- `survey-core` runs headless with `showNavigationButtons` off. Continue is gated
  on `survey.currentPage.validate(true, true)`.
- An unmapped question kind fails visibly in development and is logged in
  production. A question is never skipped silently. Through feature 23 the
  registry was keyed by RxScale's type string; from feature 24 by our own kind.
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
  the price and with nothing dispensed or delivered, so they are shown in a
  panel of their own and never beside a treatment price. The choice screen
  switches between the two rather than listing them together, and switching
  takes the selection with it.
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

Feature 24 adds the largest body of testable logic this project has had, and it
is exactly the shape the gate is for: pure functions with real edge cases. In
scope: the typed branching predicates, our per-screen validation, the mapper from
our answers into RxScale's `data` shape at every arity (one to one, one to many,
many to one, constant, dropped), its reverse index, the completeness guard over
required and visible model questions, and the contract test that reads the live
document. The screens themselves stay with the browser harness.

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

Desktop visual reference: `blueprint/reference/Solean landing page.png`, a capture
of the Pencil canvas of 21 artboards. Feature 15's mobile reference is
`blueprint/reference/Solean landing page — mobile hero.png`. The Pencil HTML
exports these were taken from are no longer in the repository. **References, not
code to port.** Full token mapping in `blueprint/reference/design-system.md`.

**Two fonts only:** Inter Tight (`--font-display`) for headings, product names,
prices, stats. DM Sans (`--font-sans`) for everything else.

**Semantic tokens only.** Gold `--primary` `#E2B64F`, deep green `--foreground`
`#173824`, warm sand `--background` `#FBFAF7`. `--rating` `#00B67A` is for stars
only. Base `--radius: 1.25rem`, stock radius classes, pills use `rounded-full`.

**Focus:** `--ring` is deep green `#173824`. Buttons, links and other
non-field controls take `focus-visible:ring-2 ring-ring ring-offset-2
ring-offset-background`; gold ring only on dark surfaces. **Form fields** take
`focus-visible:border-ring ring-[3px] ring-ring/20` instead: the border itself
goes solid deep green and the halo sits against it with no offset.

**Destructive is provisional.** `--destructive` `#C34E45` with white foreground
is approved for this build and still needs final brand review, with a darker
`--destructive-text` `#BC483F` for text on the warm ground. It now also carries
the RxScale validation errors.

**Stock Tailwind scales only.** No arbitrary visual values. SVG geometry,
`viewBox`, path data, and data-driven values are exempt, and so is the form
field's `ring-[3px]`: the stock ring scale steps 2 to 4, and neither reads as
the intended halo. It is the one recorded exception, not a precedent.

**Dark mode is out of scope.**

### Routes

| Route | What's there |
| --- | --- |
| `/` | Landing page: hero, product story, social proof, FAQ, footer |
| `/learn/blog/[slug]` | Learn article with ToC, comparison, related content |
| `/privacy`, `/terms`, `/returns`, `/legal-notice` | The four policy documents, in German, copied from what Solean publishes |
| `/questionnaire/[step]` | Every survey page, interlude, and the two completion screens: the plan choice, then the order |
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
`navigation-menu`, `tabs`, `carousel`, `alert`, `breadcrumb`, `collapsible`, and
three more the date question needed: `popover`, `calendar`, `date-picker`.
Still deferred: `tooltip`, `sonner`, `skeleton`, `chart`.

Question types map to primitives through a registry keyed by the model's type:
single choice to `RadioGroup`, multiple choice to `Checkbox`, dropdown to
`Select`, free text and numeric to `Input` and `InputGroup`, all wrapped in
`Field`. Not a chain of conditionals in a screen component.

**Accessibility and responsiveness are done criteria on every feature.** Feature
14 catches cross-feature regressions only.

## Deployment

**A static build is no longer possible.** `POST /api/checkout` and
`GET /api/recommendation` run server-side, so the host must execute server code.
**Vercel is the target**, pinned as `@sveltejs/adapter-vercel` in
`vite.config.ts` rather than left to `adapter-auto`, which would install the same
adapter part way through a build.

| Variable | Visibility | Purpose |
| --- | --- | --- |
| `PUBLIC_SHOPIFY_STORE_DOMAIN` | public | the shop the cart is created in, the myshopify domain. Not the identifier below |
| `SHOPIFY_VARIANT_ID` | server only | fallback only: the plan offered when RxScale recommends nothing |
| `SHOPIFY_STOREFRONT_TOKEN` | server only, optional | sent when configured |
| `SHOPIFY_STOREFRONT_API_VERSION` | server only, optional | defaults to `2025-01` |
| `PUBLIC_RXSCALE_QUESTIONNAIRE_UID` | public | the questionnaire the submission is filed against. From feature 24 it no longer fetches a model on the visitor's path |
| `PUBLIC_RXSCALE_SHOP_IDENTIFIER` | public | the shop the recommendation is keyed by. The storefront hostname (`solean.com`), not the myshopify domain, which is refused |
| `PUBLIC_SANITY_PROJECT_ID` | public | the Content Lake project, `tzq5b2my` |
| `PUBLIC_SANITY_DATASET` | public | `production` |
| `PUBLIC_SANITY_API_VERSION` | public | pinned, not floating |
| `PUBLIC_SANITY_STUDIO_URL` | public | where the Presentation tool lives, for the click-to-edit overlays |
| `SANITY_API_READ_TOKEN` | server only | reads drafts. Without it the site serves published content and preview stays off, which is not an error |
| `CUSTOMERIO_SITE_ID` | server only | the Customer.io workspace the reminder events are written into |
| `CUSTOMERIO_TRACK_API_KEY` | server only | the other half of the Basic credential. Either one absent means this deployment sends no reminders, which is a valid state |

> TODO: set the variables in the Vercel project and run a deploy. Handle it
> through `/release vercel`.

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
7. ~~**Deployment target.**~~ Resolved: Vercel, pinned as
   `@sveltejs/adapter-vercel` in `vite.config.ts`. What remains is setting the
   variables in the provider and deploying, which is `/release vercel`.
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
    on 2026-08-31, three times now. Undocumented behaviour is not a foundation,
    so the token is sent when configured and its absence is not an error.
    Adopting a proper one is one header and no code change.
12. **Whether one order attribute reaches every component of the bundle.**
    RxScale confirmed it on 2026-08-31, and their line, group, order fallback is
    why. Not observed here: the live cart proves the attribute is attached and
    reads back, and only a paid order would prove the import.
13. **How a model change reaches us, from feature 24.** The snapshot is the
    contract, so an edit RxScale makes in their Admin Tool is invisible here
    until the contract test runs against the live document. Open: how often it
    runs, and whether it belongs in `pnpm test`, where an RxScale outage would
    redden a build for a reason unrelated to the change under review. Starting
    position is a separate command, run deliberately. Not open: a drift the test
    catches is a deploy, and until then the funnel keeps working on the answers
    it already maps.
14. **Who owns the questionnaire's wording, from feature 24.** The text becomes
    Solean's, in two languages, and it asks about a person's health. Nobody is
    yet named as the one who signs off that a question is medically sound and
    legally sufficient. The export is design copy, not approved clinical
    wording; treating it as approved would be the same mistake as transcribing
    the marketing claims. Resolve before 24d puts copy on a screen.

### The recommendation path, proven live

Run 2026-08-31 against the real RxScale recommendation and the live shop. One
cart, no order.

| | |
| --- | --- |
| Anamnesis | `b326f1e3-...`, feature 12's own test submission, reused so no new record was created |
| Recommended | six offers: Nevolat 99.00, Wegovy 0,25 mg 249.00, Mounjaro 2,5 mg 299.00, and the three prescription-only listings at 49.90 |
| Chosen | the prescription-only `2.5 mg KwikPen - digital`, deliberately not RxScale's pre-selected plan |
| Cart | `gid://shopify/Cart/hWNGIE3OjuO15CAU0nExLiz5`, landing on the shop's own checkout |
| Attribute, read back | `_anamnesis_uid` = the uid, exact, order level, off a separate `cart(id:)` query |
| Line | one, quantity 1, variant `48908103352653`, total 49.90 EUR |

Two things this settles. The variant a person picks survives the round trip and
the server's own check against the recommendation. And a prescription-only
listing is a single line that does **not** expand, unlike the bundle, which is
why its price may never be shown beside a treatment's.

One thing it raises: `buyerIdentity.email` read back as `null` although a prefill
was sent. Either the shop refused that address and the e-mail retry dropped it as
designed, or it does not echo the field back without a customer token. Not worth
a second cart to separate, because the e-mail is a prefill and Shopify collects
one at checkout either way.

### Reference errors are not requirements

Known defects in the export must never be transcribed: "All 8 steps complete"
against "Question 9 of 9"; conflicting Wegovy Pill and injection copy; missing
recurring billing terms; a delivery estimate ignoring clinical approval; copy
naming Juniper or Voy; duplicated testimonials. Resolutions in
`project-plan.md` section 9. The checkout and order-status inconsistencies no
longer apply: both surfaces belong to RxScale and Shopify.

The questionnaire export at `blueprint/reference/questionnaire-flow-export.html`
repeats the counter error in a second form, "Question 9 of 10" over nine question
screens and "All 8 steps complete" at the end. Same resolution: the counter is
computed from the step plan, never read off an artboard.

Marketing medical copy is mock content and not approved production content. From
feature 24 the questionnaire's wording is ours to write and ours to keep
medically sound, which is a responsibility the fetched model used to carry. The
clinical judgement behind it stays RxScale's: their validators decide who is
eligible and their doctors review every submission.
