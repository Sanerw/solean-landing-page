# Build Plan

Fourteen feature-sized outcomes for Solean, in build order. Each one delivers
something visible you can open in a browser and judge. Technical detail belongs
in the `/feature` spec, not here.

Features 1 to 8 built the UI prototype on mocked data. From feature 9 the funnel
is a real RxScale integration: the questionnaire comes from their Anamnesis API,
the submission creates a real anamnesis record, and the order is placed through
an RxScale-generated Shopify checkout URL. Solean builds no checkout of its own,
and features 9 to 12 of the original plan (checkout, mock payment, doctor review
and order status) are dropped to the deferred backlog.

Run `/feature` with no argument to spec the next unchecked item, or
`/feature 10` / `/feature "handoff"` to pick a specific one. `/complete` checks
items off. Do not renumber completed features; archived specs refer back to those
numbers. A feature that proves too large splits at spec time into `9a`, `9b`, and
so on. Do not pre-split it here.

Full context: `blueprint/project-plan.md`. Token mapping:
`blueprint/reference/design-system.md`. API reference: `https://docs.rxscale.com`,
also available as an MCP server.

## Rules that apply to every feature

Completion criteria, not separate tasks.

### Architecture

- Feature-first. Product logic lives in `src/lib/features/<feature>/`. Route
  components stay thin; no business logic in `+page.svelte`.
- **Static marketing and editorial features consume typed content fixtures
  directly. The questionnaire owns one typed boundary to RxScale**, not a service
  interface per screen.
- Do not build an abstraction before something calls it. A mock service whose
  caller was dropped is deleted, not kept.

### Integration rules

Apply to every feature from 9 onward.

- No secret is on the checkout path. The Shopify variables are read through
  `$env/dynamic/private` and used only in `+server.ts`, so the variant stays out
  of the client bundle and validation has one home, not because they are private.
- Question text, options, order, required flags, and branching come from the
  fetched model only. Nothing hardcoded, nothing hidden by a condition in our
  code. The submission is validated server-side against the current model, so a
  divergence returns 400.
- `survey-core` is a headless state engine. No SurveyJS renderer, no SurveyJS
  theme, `showNavigationButtons` off.
- `steps[]` is the single source of truth for position. Survey state is
  synchronised to it, never the reverse.
- An unmapped question type fails visibly in development and is logged in
  production. A question is never skipped silently.
- `_anamnesis_uid` is mandatory, exact, and set on the cart's order attributes
  alone. RxScale compares the key character for character and ignores a mismatch
  silently, so it is one constant and is never assembled from parts.
- `checkoutUrl` is opaque: no appended parameters, no trimming, no domain
  substitution.
- One configured variant. The catalogue is not queried and no recommendation is
  computed from the answers. The variant is a bundle Shopify expands itself, so
  no fee line is ever built here.
- Answers, the anamnesis uid, and the checkout URL never reach console output or
  analytics in production.

### Content consistency

- One source of truth for the treatment catalogue the marketing pages and the
  learn comparison read.
- Prices on Solean pages are display copy. Shopify owns the amount charged and
  nothing in this app computes a total.
- Treatment names come from typed fixtures.

### Design and delivery

- **Tokens only.** Semantic color tokens, stock Tailwind type, spacing, and
  radius scales. No arbitrary values transcribed from the export: no
  `text-[17px]`, no `rounded-[34px]`, no `w-[1920px]`, no `left-[30551px]`, no
  layout spacing copied from the canvas, no fixed heights that exist only to
  reproduce an artboard.
  The restriction applies to **visual design decisions**. SVG geometry, path
  data, `viewBox` coordinates, and genuinely data-driven dynamic values such as
  calculated progress positions are exempt.
- **Responsive.** Real mobile, tablet, and desktop layouts. No absolute
  positioning for layout, no canvas coordinates, no fixed section heights.
- **Accessible.** Semantic HTML, correct labels, `fieldset`/`legend` for answer
  groups, keyboard operation, visible focus, adequate contrast, inline
  validation, `aria-live` for async status, reduced motion, accessible dialogs,
  no hover-only interactions.
- **Honest about data.** Marketing and editorial content stays fictional
  fixture copy. From feature 9 the questionnaire carries real answers to
  RxScale, so no answer is logged, echoed into analytics, or persisted anywhere
  else.
- **Verifiable alone.** Runnable and reviewable in a browser on its own.

### shadcn-svelte

shadcn is a behavior and accessibility layer, not the finished look of the page.

Feature 1 delivered the initial shared primitive foundation. Feature 3a closes
the reference-proven gaps before page implementation. Later features may add a
new primitive only when an unforeseen interaction genuinely requires it. Any
newly added primitive must be adapted to the Solean design system in the same
feature.

**Installing a shadcn primitive is not completion. Each primitive must be
visually adapted to the Solean design reference using semantic tokens and
standard Tailwind scales while preserving accessible behavior and a stable
public API.**

Variants are centralized in the primitive implementation using the existing
shadcn-svelte variant approach. No redundant wrappers such as `SoleanButton`
when the difference is only visual styling.

Feature 3a adds and adapts `field`, `input-group`, `progress`,
`navigation-menu`, `tabs`, `carousel`, `alert`, `breadcrumb`, and `collapsible`.
Still deferred until a feature proves it genuinely needs one: `tooltip`,
`sonner`, `skeleton`, `chart`. `popover`, `calendar` and `date-picker` were
deferred until the date question proved it needed them.

"Learn more" is a link or a dialog, not a tooltip by default. Not every visual
panel needs to be a shadcn `Card`. Question types map to primitives through a
registry keyed by the model's type, not a chain of conditionals in a screen
component.

### Component boundaries

| Location | Holds |
| --- | --- |
| `src/lib/components/ui/` | Adapted shadcn primitives from Features 1 and 3a |
| `src/lib/components/brand/` | Global brand visuals: `SoleanLogo`, `StarRating` |
| `src/lib/features/<feature>/` | Feature-specific product components |

Features 1 and 3a deliver shared primitives and brand foundations. They do not
build product components. Questionnaire field renderers, answer cards, the
interlude screens, the recommendation card and the rest belong to the feature
that owns their domain semantics, and they compose the already adapted
primitives.

### Reference inconsistencies are not requirements

The export contains known errors. Do not transcribe them:

"All 8 steps complete" against "Question 9 of 9"; conflicting "Wegovy Pill" and
injection copy; missing recurring billing terms; a delivery estimate that ignores
clinical approval; copy naming Juniper or other brands; inconsistent
testimonials. The checkout and order-status inconsistencies no longer apply: both
surfaces belong to RxScale and Shopify now.

Resolutions are in `blueprint/project-plan.md` section 9. Mock medical copy and
claims are not approved production content.

## Features

- [x] 1. **Design system and core UI components** - The full shared foundation
  every later feature builds on.
  - Semantic colour tokens mapped from the design reference, `--radius: 1.25rem`,
    the provisional `--destructive` family, and `--ring` as deep green `#173824`
  - Inter Tight Variable for display, DM Sans Variable for UI and body
  - Stock Tailwind typography, spacing and radius scales, no arbitrary visual
    values
  - Shared responsive and accessibility rules
  - `SoleanLogo` and the global brand foundations
  - Install **and adapt** all currently known shared primitives: `button`,
    `input`, `textarea`, `label`, `select`, `checkbox`, `radio-group`, `card`,
    `badge`, `separator`, `dialog`, `sheet`, `accordion`
  - Each adapted primitive demonstrates default, hover, active, focus-visible,
    disabled, invalid, and checked or selected states where applicable, plus its
    supported sizes and variants, keyboard behavior, and responsive behavior
  - Button ships seven variants (default, inverse, secondary, outline, ghost,
    link, destructive) and four sizes (`sm`, `default`, `lg`, `icon`). Textarea and
    Select derive from Input. Hover and active reuse semantic surface tokens;
    only `--primary-hover` and the destructive family are dedicated state
    tokens. Exact specs in `blueprint/reference/design-system.md`
  - A browser-reviewable showcase at `/dev/design-system` covering: semantic
    tokens; both font families and their typography roles; the responsive type
    ladders; Button variants and sizes; Input, Textarea, Select and Label
    combinations; valid, invalid, disabled and focus-visible form states;
    Checkbox and RadioGroup states; Card, Badge and Separator variants; Dialog,
    Sheet and Accordion behavior; keyboard-focus visibility; and at least one
    small example form composition resembling the future questionnaire or
    checkout UI

  The showcase is a development and visual QA surface, not a public marketing
  route and not an admin dashboard.

- [x] 2. **Prototype architecture** - Feature-first layout under
  `src/lib/features/`, thin SvelteKit routes, `src/lib/domain/` holding
  `Treatment`, `AddOn`, `Money`, `PatientProfile` and `Order`, and
  `src/lib/journey/`
  holding stage progression and the transition rules between questionnaire,
  checkout and order status. Rune-based journey state with an SSR-safe
  `sessionStorage` adapter, typed service contracts, and minimal mock adapters.
  Nothing abstract built ahead of a caller. Proven through a small prototype
  scenario page showing the current journey stage, the selected treatment, a
  mock session summary, and the available transitions, so `sessionStorage`
  persistence and the journey guards can be exercised in the browser. Small and
  functional, not an admin dashboard; it can later serve as a local QA scenario
  launcher.

- [x] 3. **Design system completion and marketing shell**
  - [x] 3a. **Design system completion** - Add and adapt the nine primitives
    already proven by the reference: `field`, `input-group`, `progress`,
    `navigation-menu`, `tabs`, `carousel`, `alert`, `breadcrumb`, and
    `collapsible`. Extend
    `/dev/design-system`, normalize the seven-variant Button contract, repair the
    non-functional interactive Card example, and close the recorded form
    composition and dark-surface contrast gaps before page features consume the
    system.
  - [x] 3b. **Marketing shell and hero** - `(marketing)` route group, page
    container, header with desktop navigation on the adapted `NavigationMenu`
    and products dropdown, mobile navigation on the adapted `Sheet`, compact
    language `Select` with English selected and Deutsch disabled, announcement
    bar, hero, trust benefits, and footer. The
    first page a visitor can land on and navigate.

- [x] 4. **Landing page product story** - Progress projection, results and
  support, treatment bento, how it works, and the CTAs tying them together.
  - [x] 4a. **Product story panels** - The treatment bento, the results and
    support band, and the how-it-works steps: three tinted content panels built
    from typed fixtures, with the CTAs that tie them to the questionnaire.
  - [x] 4b. **Progress projection** - The custom responsive SVG projection chart
    on the adapted `Tabs`, its accessible non-visual alternative, and the
    medical-framing panel and CTAs beside it.

- [x] 5. **Landing page social proof** - Testimonials, clinical team, and FAQ
  from typed, deduplicated content fixtures, the FAQ on the adapted `Accordion`.
  Keyboard and mobile operable, with testimonial and team browsing on the
  adapted `Carousel`.

- [x] 6. **Learn article** - `/learn/blog/[slug]` from a typed article fixture:
  hero, medical-review metadata, body typography, table of contents, treatment
  comparison, related content. Static editorial content, so no service interface.

- [x] 7. **Questionnaire foundation** - Typed question schema,
  `QuestionnaireService` and `MockQuestionnaireService`, route shell, rune-based
  state, SSR-safe persistence, progress, back and continue, per-step validation
  infrastructure, journey guards, and resume infrastructure. Carried end to end
  by one complete single-select question as the vertical slice, composing the
  adapted `progress`, `field`, `radio-group`, `label` and `button`, so the
  feature finishes on a working screen without implementing the questionnaire
  content.

- [x] 8. **Questionnaire content and completion**
  - [x] 8a. **Multi-field steps and the remaining field kinds** - Revise the
    feature 7 schema so a step owns an ordered list of fields rather than one
    kind, because the reference puts a single-select and two numerics on
    question 1 and pairs a multi-select with a yes/no on questions 5, 6 and 7.
    Add the multi-select renderer with an exclusive "none of the above", the
    numeric renderer with unit selection, and the contact renderer, all
    composing the adapted `checkbox`, `input-group`, `input`, `select` and
    `field`. Complete questions 1 to 3 on the new contract. Answer cards are
    questionnaire components, not new primitives.
  - [x] 8b. **The medical questions** - Questions 4 to 7 (medical conditions,
    health history, eating disorders, allergies and medications) as fixture
    content on 8a's contract, with no new renderers. The questionnaire collects
    only: no pass/fail logic, no BMI threshold, no contraindication branch.
  - [x] 8c. **Questionnaire interstitials** - The projection mid-step, reusing
    `projection.ts` and the adapted `Tabs` against the patient's own height and
    weight, and the motivation mid-step. Interstitials never shift the canonical
    question count. Repairs finding F-07 so `Tabs` associates each panel with
    its tab in the primitive rather than at the call site.
  - [x] 8d. **Treatment preference and completion** - Question 8's bespoke
    treatment cards over the canonical domain catalogue with a preference-aware
    continue action, and the completion state. Sets `questionnaire.completed`
    and `selectedTreatmentId`, unlocking checkout. Resume lands on the first
    unanswered question, and a guard blocks direct entry to an unreachable step.

- [x] 9. **Live questionnaire foundation** - Swap the mock questionnaire data
  layer for the RxScale model while keeping the UI features 7 and 8 delivered. A
  config module holding the questionnaire uid and the question names other
  features read, a public anamnesis client that fetches the model on entry to the
  flow and does not cache it past the visit, `survey-core` wired headlessly with
  `showNavigationButtons` off, a `steps[]` builder that interleaves the model's
  survey pages with Solean's interludes and owns the position, and a question
  type registry that maps a model type to an adapted primitive and fails loudly
  on an unmapped one. Continue is gated on
  `survey.currentPage.validate(true, true)`. The local `schema.ts`,
  `MockQuestionnaireService`, the treatment preference question, and the unused
  `checkout` and `order-status` mock services with their domain types go with it.
  Carried end to end by the real model's first page rendering through the
  existing renderers, so the feature finishes on a working screen.

  - [x] 9a. **Questionnaire model boundary** - The config module and public env
    for the questionnaire uid, a typed anamnesis client that fetches the model
    once per entry to the flow and does not cache it past the visit, honest
    not-configured and unavailable states with a retry and no local fallback,
    `survey-core` instantiated headlessly with `showNavigationButtons` off, and a
    dev inspection surface listing identifier, version, pages, and every question
    with its type and required flag. Question rendering is untouched.
  - [x] 9b. **`steps[]` and the question type registry** - The builder that
    interleaves the model's survey pages with Solean's interludes and owns
    position and progress, the registry mapping a model question type onto the
    existing field renderers, and `/questionnaire/[step]` driven by the model with
    continue gated on `survey.currentPage.validate(true, true)`. An unmapped type
    fails visibly in development and is logged in production. Removes `schema.ts`,
    `MockQuestionnaireService`, and the treatment preference question.
  - [x] 9c. **Removing the dropped funnel** - Delete the `checkout` and
    `order-status` feature modules, the `AddOn`, `PatientProfile`,
    `ShippingAddress`, `Order`, `PricingBreakdown` and `OrderStatus` domain types,
    and the whole `journey` module. A reduced journey would have no caller: 9b
    took the questionnaire off it, and the anamnesis uid belongs with the survey
    session that shares its lifetime. The dev scenario surface, built to
    demonstrate those services, goes with them.

- [x] 10. **Question type coverage** - Every question type the live model
  actually uses, mapped to adapted primitives: single choice, multiple choice
  with the model's own exclusive-option behavior, dropdown, free text, and
  numeric with units, plus file and signature capture if the model contains them.
  Server-side validation messages surfaced inline on the field that failed. File
  and signature answers submitted in exact SurveyJS shape,
  `[{ name, type, content: "data:image/png;base64,..." }]`. An unsupported type
  is a visible failure in development and a logged one in production, never a
  skipped question. The definitive type list comes from the real model, so it is
  confirmed at spec time, not guessed here.

- [x] 11. **Interludes, progress and flow integrity** - The projection interlude
  computed locally from `survey.data` through the configured height and weight
  question names, with no extra API call, positioned by `steps[]` alongside the
  motivation interlude 9b already places. It waits for feature 10 because the
  height and weight question is a `multipletext`. The final progress rule, since
  9b's denominator moves as branching opens pages.
  Refresh, back, forward and deep links land where the answers justify;
  in-session persistence is keyed by questionnaire identifier and version so a
  model change discards stale answers instead of resuming against them. The
  journey stage reduction moved to 9c, where the stages it removes are deleted.

- [x] 12. **Submission and the recommendation screen** - Post the answers to the
  anamnesis submissions endpoint, keep the returned uid for the checkout call,
  and handle failure honestly: 400 shows the validation errors and stays on the
  questionnaire, 502 offers a retry and states that nothing was saved, and no
  error path advances to the end screen. On success the congratulations screen
  presents the configured SKU, read from its own module so it can later be
  replaced by catalogue data, with the "Place your order" action present but not
  yet wired.

- [x] 13. **Checkout handoff** - `POST /api/checkout` in `+server.ts`, the only
  place the private API key is read, calling RxScale's treatment checkout with
  the configured SKU, quantity 1, the mandatory `anamnesis_id`, and a
  `buyerIdentity` built from the e-mail answer and the configured country code.
  The URL is generated on click, never on screen entry, and the returned
  `checkout_url` is redirected to exactly as received. A missing anamnesis uid
  blocks the call and shows an error rather than placing an order no doctor can
  review. Optional live-stock preflight, where a 409 shows an out-of-stock
  message instead of a redirect.
  Completed 2026-08-31 with the live contract **unconfirmed**: the API key lacked
  the `create_treatment_checkout` permission, so no checkout was ever created
  against the real service. See
  `blueprint/history/features/13-checkout-handoff.md`.
  **Superseded the same day.** The permission is not selectable in the Admin Tool
  and RxScale recommended the cart instead, so the mechanism was replaced by a
  Shopify Storefront `cartCreate` carrying `_anamnesis_uid` as an order
  attribute. The visitor's journey is unchanged. One live cart confirmed the shop
  accepts it. See the fix in `blueprint/history/fixes/`.

- [x] 14. **End-to-end hardening** - The whole path from landing page to the
  external redirect: transitions between route groups, deep links, refresh and
  back-button behavior, empty, loading and integration-error states, a
  mobile/tablet/desktop pass, a cross-feature accessibility sweep, browser tests
  updated to the live flow, typecheck, build, and a manual try guide. This
  catches cross-feature regressions only; accessibility and responsiveness are
  already done criteria on every earlier feature.

## Post-MVP

- [x] 15. **Mobile announcement bar and hero** - Refine the landing page's
  mobile announcement bar, hero imagery, navigation treatment, copy layout,
  CTA, and trust indicators to match
  `blueprint/reference/Solean landing page — mobile hero.png`, while preserving
  the existing desktop experience.

- [x] 16. **Mobile menu panel** - Give the opened mobile menu the reference's
  full-screen treatment: numbered navigation rows in display type under the
  offer bar, a logo-and-close header aligned with the closed state, a gold
  primary CTA, and a utilities row. Carries three hero refinements agreed
  during review: the viewport-minus-offer-bar height, a larger mobile headline,
  and a scrim that darkens the photograph instead of tinting it green.

- [x] 17. **Mobile landing sections** - Carry the mobile refinement down the
  rest of the landing page: the trust band hidden, the bento set as a lead card
  plus a swipeable row, the results band opened on its own heading with a
  full-width CTA, the projection reordered without its tabs or CTAs, the two
  carousels' controls centred below their cards, the how-it-works button moved
  to the foot, and every bleed panel meeting its neighbours and the viewport
  edge.

- [x] 18. **Legal pages and real contact details** - the four German policy
  documents Solean already publishes (privacy, terms, cancellation, legal
  notice) served on their own routes and linked from the footer, replacing the
  three inert labels there. Copied verbatim from solean.com rather than
  rewritten: legal text is not ours to paraphrase. Carries the real support
  address, telephone number and service hours.

- [x] 19. **German as the default language, English at `/en`** - the site becomes
  bilingual, with German the language served at the bare path and English moved
  behind a prefix. Split because the string surface is roughly 370 messages
  across 61 components and five content modules, and because the default cannot
  flip until both languages are complete.

  **The funnel stays German either way.** The questionnaire's content is
  RxScale's, fetched at runtime and authored in German, so only the chrome around
  it is ours to translate. An English visitor reaches a German questionnaire, by
  the user's decision on 2026-09-01, and deliberately without a warning screen.

  - [x] 19a. Runtime and routing - Paraglide, locale-prefixed routing with
    English still at `/` and German at `/de`, `<html lang>`, hreflang, the
    language switcher made real, and the shared chrome (announcement bar, header,
    footer) in both languages.
  - [x] 19b. Landing page - the marketing content module and its components.
  - [x] 19c. Learn article - the article, its table of contents, comparison and
    related content.
  - [x] 19d. Questionnaire chrome - the interludes, progress, buttons and the two
    completion screens. The questions themselves stay RxScale's.
  - [x] 19e. Flip the default - German moves to `/`, English to `/en`, with
    redirects from the interim paths. Last, because every surface must already
    exist in both languages before the bare path changes what it serves.

## Testing

**Decided, then deferred at 9a.** The plan was to run `/tests` before feature 9;
the user chose to skip it and start building, so this project still has no test
command and no test gate. That is recorded here rather than quietly dropped: the
logic below is unverified by any runner until the decision is revisited, and
feature 13's payload builder is the point where it should be. The pricing engine that originally raised the
question is gone; what replaces it is logic with clear inputs, outputs, and real
edge cases:

- model to `steps[]` mapping: interlude placement, step ids, and the survey-step
  count the progress bar uses
- the question type registry, including the unmapped-type failure
- the checkout payload builder: missing anamnesis uid, missing or empty e-mail
  answer, a configured question name absent from the model

Component rendering and the RxScale calls themselves stay out of unit tests.
They are proven by the browser harness (`pnpm test:browser`), a walkthrough, and
the build. Once `test` is declared in `AGENTS.md`, a step that adds in-scope
logic ships a passing test in the same diff.

## Deferred backlog

Not in scope. Listed without checkboxes so `/feature` never selects them.

- Solean-side checkout: account, shipping, pricing engine, add-ons, payment
- Doctor review and order status screens inside Solean
- Discount codes
- Saved progress and resume by e-mail link
- Phone in `buyerIdentity`
- Querying the Shopify catalogue ourselves, and computing a recommendation here
- Authentication and a member account area
- Undesigned routes: treatments index, product pages, about, contact,
  clinician profile pages
- Dark mode
- Clinician-facing tooling
