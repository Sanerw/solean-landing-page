# Build Plan

Twelve feature-sized outcomes for the Solean UI prototype, in build order. Each
one delivers something visible you can open in a browser and judge. Technical
detail belongs in the `/feature` spec, not here.

Run `/feature` with no argument to spec the next unchecked item, or
`/feature 5` / `/feature "FAQ"` to pick a specific one. `/complete` checks items
off. Do not renumber completed features; archived specs refer back to those
numbers. A feature that proves too large splits at spec time into `4a`, `4b`,
and so on. Do not pre-split it here.

Full context: `blueprint/project-plan.md`. Token mapping:
`blueprint/reference/design-system.md`.

## Rules that apply to every feature

Completion criteria, not separate tasks.

### Architecture

- Feature-first. Product logic lives in `src/lib/features/<feature>/`. Route
  components stay thin; no business logic in `+page.svelte`.
- **Stateful and integration-facing features depend on typed service
  interfaces. Static marketing and editorial features may consume typed content
  fixtures directly.**
- Service interfaces are required for questionnaire, checkout, order status, and
  any future integration. They are not required for static marketing content or
  articles.
- Do not build an abstraction before something calls it.

### Data consistency

- One source of truth for the treatment catalogue.
- One source of truth for the price list.
- One function computes subtotal, discount, shipping, and total.
- The treatment selected in the questionnaire carries through to checkout.
- No component holds its own independent total value.
- Treatment and add-on names come from typed fixtures.

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
- **Mocked.** No real integrations, no real medical data, fictional fixtures.
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
Still deferred until a feature proves it genuinely needs one: `popover`,
`tooltip`, `sonner`, `skeleton`, `chart`.

Checkout steps are a bespoke sequential component, not an Accordion. "Learn
more" is a link or a dialog, not a tooltip by default. Not every visual panel
needs to be a shadcn `Card`.

### Component boundaries

| Location | Holds |
| --- | --- |
| `src/lib/components/ui/` | Adapted shadcn primitives from Features 1 and 3a |
| `src/lib/components/brand/` | Global brand visuals: `SoleanLogo`, `StarRating` |
| `src/lib/features/<feature>/` | Feature-specific product components |

Features 1 and 3a deliver shared primitives and brand foundations. They do not
build product components. `TreatmentOption`, `AddOnCard`, `OrderSummary`,
`CheckoutStep`, `ReviewTimeline`, questionnaire answer cards and the rest belong
to the feature that owns their domain semantics, and they compose the already
adapted primitives.

### Reference inconsistencies are not requirements

The export contains known errors. Do not transcribe them:

"All 8 steps complete" against "Question 9 of 9"; Mounjaro chosen in the
questionnaire but Wegovy shown in checkout; a 69.00 EUR button against a 78.90
EUR total; conflicting "Wegovy Pill" and injection copy; missing recurring
billing terms; a delivery estimate that ignores clinical approval; no declined
or refund path; copy naming Juniper or other brands; inconsistent testimonials.

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

- [ ] 8. **Questionnaire content and completion**
  - [x] 8a. **Multi-field steps and the remaining field kinds** - Revise the
    feature 7 schema so a step owns an ordered list of fields rather than one
    kind, because the reference puts a single-select and two numerics on
    question 1 and pairs a multi-select with a yes/no on questions 5, 6 and 7.
    Add the multi-select renderer with an exclusive "none of the above", the
    numeric renderer with unit selection, and the contact renderer, all
    composing the adapted `checkbox`, `input-group`, `input`, `select` and
    `field`. Complete questions 1 to 3 on the new contract. Answer cards are
    questionnaire components, not new primitives.
  - [ ] 8b. **The medical questions** - Questions 4 to 7 (medical conditions,
    health history, eating disorders, allergies and medications) as fixture
    content on 8a's contract, with no new renderers. The questionnaire collects
    only: no pass/fail logic, no BMI threshold, no contraindication branch.
  - [ ] 8c. **Questionnaire interstitials** - The projection mid-step, reusing
    `projection.ts` and the adapted `Tabs` against the patient's own height and
    weight, and the motivation mid-step. Interstitials never shift the canonical
    question count. Repairs finding F-07 so `Tabs` associates each panel with
    its tab in the primitive rather than at the call site.
  - [ ] 8d. **Treatment preference and completion** - Question 8's bespoke
    treatment cards over the canonical domain catalogue with a preference-aware
    continue action, and the completion state. Sets `questionnaire.completed`
    and `selectedTreatmentId`, unlocking checkout. Resume lands on the first
    unanswered question, and a guard blocks direct entry to an unreachable step.

- [ ] 9. **Checkout foundation** - `(checkout)` route group, `CheckoutService`
  and `MockCheckoutService`, a bespoke sequential `CheckoutStep`, account and
  shipping steps with inline validation using the adapted `Field` and
  `InputGroup`, order summary, and the central pricing
  engine at `src/lib/features/checkout/pricing.ts`. The pricing engine consumes
  the canonical catalogue and fixture price list from `src/lib/domain/`; the
  calculation itself remains owned by checkout. `CheckoutStep` composes the
  adapted `Collapsible` for disclosure behavior. Delivery estimate is presented
  as conditional on clinical approval.

- [ ] 10. **Checkout customization and mock payment** - Treatment switching and
  the consultation offer on the adapted `dialog`, add-ons with adding and
  removing, per-session versus one-off pricing, everything recalculated only
  through the pricing engine. Mock
  payment method selection with success and failure paths, clearly labelled as
  prototype. No real payment provider.

- [ ] 11. **Doctor review and order status** - `OrderService` and
  `MockOrderService`, review timeline, order reference, and six presented
  states: review in progress, plus five outcomes: approved, declined, more
  information required, prescription issued, and dispatched. Tracking
  presentation and `aria-live` on status change. Every state must be reachable
  directly, without walking the whole funnel, through seeded mock order IDs or a
  dev-only scenario selector (`mock-review`, `mock-approved`, `mock-declined`,
  `mock-info-required`, `mock-prescription-issued`, `mock-dispatched`).

- [ ] 12. **End-to-end prototype hardening** - Transitions between route groups,
  deep links, refresh behavior, back-button correctness, empty, loading and
  error states, mobile/tablet/desktop review, a cross-feature accessibility
  sweep, typecheck, build, a full-funnel walkthrough, and a manual try guide.
  This catches cross-feature regressions only; accessibility and responsiveness
  are already done criteria on every earlier feature.

## Testing

This project has **no unit test runner and no `test` command** in `AGENTS.md`,
so there is no test gate today. Do not install a runner silently inside another
feature.

The pricing engine in feature 9 is the one piece of logic that genuinely
warrants unit tests. Decide before feature 9 starts:

1. **Run `/tests` first** to add the runner and turn the test gate on. Feature 9
   then ships pricing tests in the same reviewable diff. Recommended.
2. **Leave testing unconfigured.** Feature 9 is verified with the evidence
   already available (browser walkthrough of the order summary and totals,
   typecheck, build), and no claim is made that it has unit tests.

Either way the choice is explicit, never assumed.

## Deferred backlog

Not in scope. Do not spec these until the UI prototype is accepted. Listed
without checkboxes so `/feature` never selects them.

- Shopify integration
- RxScale integration
- Real payment provider
- Server-side sessions
- Authentication
- Member account area
- German language and `/de` routing
- Undesigned routes: treatments index, product pages, about, contact, legal,
  clinician profile pages
- Dark mode
- Clinician-facing tooling
