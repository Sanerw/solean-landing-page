# Feature: Design system completion

**From build-plan:** feature 3a
**Status:** verified

## Goal

Complete the shared Solean UI foundation before page implementation by adding
and adapting the nine behavior primitives already proven by the 21 reference
artboards: `field`, `input-group`, `progress`, `navigation-menu`, `tabs`,
`carousel`, `alert`, `breadcrumb`, and `collapsible`.

The feature also normalizes the load-bearing Button API, closes the known form
composition and dark-surface contrast gaps, and repairs the showcase's fake
interactive Card. Later features should consume these components without
inventing parallel behavior or visual contracts.

## Design reference

- `blueprint/reference/Solean landing page.png` - desktop site navigation,
  Treatments dropdown, testimonial and clinician carousel controls
- `blueprint/reference/Learn Article — !learn!blog!mounjaro-vs-wegovy.png` -
  solid desktop navigation and the dark editorial CTA surface
- `blueprint/reference/EN Questionnaire 1 — About You.png` - progress indicator,
  grouped answer fields and form rhythm
- `blueprint/reference/EN Questionnaire — Projection Mid Step.png` - progress
  indicator and the `3 months / 6 months / 12 months` tab treatment
- `blueprint/reference/EN Checkout — Step 1 · Account.png` - labelled fields,
  leading icons, inline consent and sequential collapsed checkout steps
- `blueprint/reference/EN Checkout — Step 3 · Payment.png` - grouped card fields,
  suffix and icon input composition; payment methods remain a `RadioGroup`
- `blueprint/reference/design-system.md` - authoritative tokens, typography,
  radii, interaction states and component boundaries

The export has no mobile artboards. Responsive behavior below desktop is a
considered adaptation and must be proven at 375px, 768px and 1440px.

## In scope

- Normalize Button as seven variants: `default`, `inverse`, `secondary`,
  `outline`, `ghost`, `link`, `destructive`; retain four sizes
- Add a stable Button `surface` contract for light and dark grounds instead of
  call-site class strings; document and demonstrate safe dark-surface pairings
- Repair the showcase Card that exposes `role="link"` without an action
- Install and adapt `field`, including label, description, error, fieldset,
  legend, horizontal layout and generic choice-card composition
- Install and adapt `input-group` for leading icons, trailing units and inline
  actions without changing Input's visual contract
- Install and adapt `progress` for the questionnaire progress treatment
- Install and adapt `navigation-menu` for desktop site navigation and the
  Treatments link collection; mobile navigation remains on `Sheet`
- Install and adapt `tabs` for the projection horizon switcher
- Install and adapt `carousel` for testimonial and clinician browsing
- Install and adapt `alert` for delivery, medical review and status notices,
  keeping visual treatment separate from live-region urgency
- Install and adapt `breadcrumb` for the learn article hierarchy
- Install and adapt `collapsible` as the disclosure behavior later composed by
  the feature-owned `CheckoutStep`
- Extend `/dev/design-system` with responsive, keyboard-operable demonstrations
- Replace duplicated showcase field and option-card strings with the adapted
  `Field` composition and mark F-05 fixed
- Repair and document F-06's on-dark Button contrast and mark it fixed

## Out of scope

- Marketing routes, header, hero, footer and content fixtures, preserved for 3b
- Product components such as `CheckoutStep`, `TreatmentOption`, testimonial
  cards, clinician cards and questionnaire answer cards
- The custom responsive projection SVG
- Mock payment behavior or other funnel state
- `popover`, `tooltip`, `sonner`, `skeleton`, `chart`, `avatar`, `table`,
  `toggle-group`, `dropdown-menu` and any other shadcn primitive
- Dark mode
- Unit or browser test runner installation

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan the step before editing code.
2. Implement only that step.
3. Show the diff and explain each changed file.
4. Verify the observable done-when before requesting approval.
5. Continue only after review; checkpoint commits remain optional.

## Build steps

Accessibility and responsiveness are done criteria on every UI step. Each
showcase addition is reviewed at 375px, 768px and 1440px with keyboard-only
operation and visible focus.

- [x] **Step 1 - Normalize Button and repair existing showcase contracts** -
  Update the Button public API to explicitly document seven variants and add a
  `surface="default" | "dark"` variant dimension. Dark-surface compound variants
  provide safe text, border, hover, active, focus-ring and ring-offset pairings
  without ad-hoc class constants. Extend the contrast record and dark showcase
  matrix. Replace the fake interactive Card with a real semantic link or remove
  its interactive claim. *Done when:* plans, `design-system.md`, Button types and
  showcase all agree on seven variants; every dark Button text pairing measures
  at least 4.5:1 and its focus boundary at least 3:1; Enter activates the
  interactive Card or the Card is no longer exposed as interactive; F-06 is
  marked fixed.

- [x] **Step 2 - Adapt Field and remove copied form composition** - Install
  `field`, map every subcomponent to Solean typography, semantic colours, stock
  spacing and responsive orientations, and migrate the showcase's repeated
  label, description, error and generic option-card structures to it. Product
  meaning remains outside the primitive. *Done when:* Input, Textarea, Select,
  Checkbox and RadioGroup examples compose `Field`; labels and descriptions are
  associated with their controls; invalid examples expose their message through
  `aria-describedby`; the repeated `FIELD_LABEL` and option-card class strings
  recorded in F-05 are gone; F-05 is marked fixed.

- [x] **Step 3 - Adapt InputGroup** - Install `input-group`, inherit Input's
  surface, boundary, radius, typography, invalid, disabled and focus-within
  treatments, then demonstrate a leading email icon, trailing `kg` unit and a
  compact inline action. *Done when:* focus and invalid state are visible around
  the group rather than competing child borders; decorative icons are hidden
  from assistive technology; units and actions remain discoverable; no arbitrary
  visual value or parallel field colour appears.

- [x] **Step 4 - Adapt Progress** - Install `progress`, style its track and
  indicator from semantic tokens, and demonstrate the questionnaire's current
  step against the canonical total. *Done when:* the rendered component exposes
  its accessible value and maximum, 0 and 100 percent render safely, the gold
  indicator remains visible at all three widths, and no progress position is
  hardcoded as a visual pixel value.

- [x] **Step 5 - Adapt NavigationMenu** - Install `navigation-menu` and adapt
  link, trigger, content, indicator and viewport states for both solid and
  on-dark desktop headers. Demonstrate the canonical nav model with a Treatments
  collection; do not build the marketing header itself. *Done when:* links are
  semantic navigation links, the Treatments content opens by pointer and
  keyboard, arrow-key navigation follows the primitive, Escape closes and
  restores focus, focus rings are visible on light and dark grounds, and the
  content does not overflow at 768px or 1440px.

- [x] **Step 6 - Adapt Tabs** - Install `tabs` and adapt a pill-like segmented
  list matching the projection reference, with `3 months`, `6 months` and
  `12 months` controlling one visible panel at a time. *Done when:* the selected
  trigger and panel relationship is exposed semantically, Left and Right Arrow
  move between enabled triggers, focus remains visible, disabled treatment is
  demonstrated, and the list fits or scrolls safely at 375px.

- [x] **Step 7 - Adapt Carousel** - Install `carousel`, adapt viewport, content,
  item and previous/next controls for the testimonial and clinician card rhythm,
  and add a neutral showcase fixture rather than a product component. *Done
  when:* one item is usable at 375px and three are visible at 1440px, previous
  and next controls expose accessible names and disabled boundaries, keyboard
  focus is visible, reduced-motion users are not forced through decorative
  animation, and no custom carousel state duplicates the primitive.

- [x] **Step 8 - Adapt Alert** - Install `alert` and adapt its anatomy to the
  delivery, medical review and status-notice surfaces in the reference. Keep
  visual variants independent from announcement urgency: static information has
  no assertive live-region role, non-urgent runtime feedback may use
  `role="status"`, and urgent runtime feedback may use `role="alert"`. *Done
  when:* title, description and optional icon compose without product-specific
  markup; default, highlighted and destructive examples use semantic colours;
  static showcase examples are not announced as new events; runtime semantics
  are documented; and content wraps without overflow at 375px.

- [x] **Step 9 - Adapt Breadcrumb** - Install `breadcrumb` and adapt its link,
  current-item, separator and collapsed states to the learn article reference.
  Demonstrate a neutral article hierarchy rather than hardcoding the final
  route. *Done when:* the trail sits in a labelled navigation landmark, the
  current item exposes `aria-current="page"`, decorative separators are hidden
  from assistive technology, every link has a visible focus state, and long
  labels wrap or truncate safely at 375px without losing their accessible name.

- [x] **Step 10 - Adapt Collapsible** - Install `collapsible` and demonstrate a
  generic sequential section with a heading trigger and content region matching
  the checkout disclosure rhythm. It supplies behavior only; progression remains
  a later `CheckoutStep` responsibility. *Done when:* trigger state is announced,
  Enter and Space toggle the section, focus is visible, the closed region is not
  exposed as active content, and the demonstration does not pretend to implement
  checkout business rules.

- [x] **Step 11 - Final showcase and contract sweep** - Review all twenty-two
  adapted primitives together, remove dead token or demo code introduced during
  the feature, verify the new sections use semantic colours and stock Tailwind
  scales, and update the design-system reference inventory and rulings. *Done
  when:* `/dev/design-system` has no console errors, no horizontal overflow at
  375px, 768px or 1440px, every interactive control is keyboard reachable and
  operable, repository search finds no arbitrary visual value outside permitted
  SVG or data-driven geometry, and `pnpm check` plus `pnpm build` pass.

## Files / areas

**Created**

- `src/lib/components/ui/field/`
- `src/lib/components/ui/input-group/`
- `src/lib/components/ui/progress/`
- `src/lib/components/ui/navigation-menu/`
- `src/lib/components/ui/tabs/`
- `src/lib/components/ui/carousel/`
- `src/lib/components/ui/alert/`
- `src/lib/components/ui/breadcrumb/`
- `src/lib/components/ui/collapsible/`
- Focused showcase sections under `src/routes/dev/design-system/`

**Changed**

- `src/lib/components/ui/button/button.svelte`
- Existing field and surface showcase sections under
  `src/routes/dev/design-system/`
- `src/routes/dev/design-system/+page.svelte`
- `blueprint/reference/design-system.md`
- `blueprint/context/findings.md`
- `package.json` and `pnpm-lock.yaml` only for dependencies required by the
  official shadcn-svelte components

## Data / contracts

No business data or service interface.

Load-bearing UI contracts:

| Contract | Decision | Later consumers |
| --- | --- | --- |
| Button variants | Seven variants including `inverse` | All page features |
| Button surface | `default` or `dark`; appearance variant remains independent | Marketing and learn dark grounds |
| Field anatomy | label, control, description, error; Field.Set for groups | Questionnaire and checkout |
| Projection switch | Tabs, not ToggleGroup | Questionnaire interstitial |
| Payment selection | RadioGroup, not Tabs | Mock checkout |
| Desktop navigation | NavigationMenu | Marketing and learn headers |
| Mobile navigation | Sheet | Marketing and learn headers |
| Language selection | Select, not Popover | Marketing and learn headers and footer |
| Checkout disclosure | CheckoutStep composes Collapsible | Checkout foundation |
| Carousel behavior | Shared primitive; card content remains feature-owned | Testimonials and clinician team |
| Notice semantics | Alert visuals are independent from live-region urgency | Delivery, medical review and order status |
| Editorial hierarchy | Breadcrumb with semantic current item | Learn article |

## Testing

No unit test runner, `test` command, Verify command or Browser tests command is
configured. This feature contains no business logic suitable for a unit test.
Do not install a runner here.

For every step:

- Run `pnpm check` and `pnpm build`
- Run the app and inspect `/dev/design-system` at 375px, 768px and 1440px
- Exercise pointer, Tab, Shift+Tab, Enter, Space, Escape and arrow keys where the
  primitive supports them
- Check the browser console and horizontal overflow
- Measure every newly sanctioned text and focus pairing rather than eyeballing
  contrast

## Notes for the AI

- The official shadcn-svelte CLI provides behavior and initial source only. All
  generated files must be reviewed and intentionally adapted before a step is
  complete.
- Preserve Svelte 5 runes and existing Bits UI conventions.
- Inter Tight and DM Sans remain the only product fonts. Code samples in the dev
  showcase may use the technical monospace stack.
- Use semantic colours and stock Tailwind scales. No raw colour utility or
  arbitrary visual value in a component.
- Keep product semantics out of shared primitives and neutral showcase fixtures.
- Do not edit the preserved 3b marketing draft while implementing 3a.
- No em dash in generated docs, comments or copy.
