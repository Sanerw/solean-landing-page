# Feature: Design system and core UI components

**From build-plan:** feature 1
**Status:** verified

## Goal

Establish the complete shared visual and interaction foundation every later
feature builds on: the semantic token layer, the two-font typography system, the
radius scale, and all thirteen shared shadcn-svelte primitives installed **and
adapted** to the Solean design reference, plus the global brand visuals. All of
it is proved in the browser on a single showcase route at `/dev/design-system`.

This matters because features 3 through 12 compose these primitives. If Button,
Input or the token names are wrong here, every later feature inherits the
mistake, and there is no per-feature drip that would let us fix it gradually.

## Design reference

**Twenty-one PNG artboards are pinned in `blueprint/reference/`. They are the
stable visual reference for this feature.** They are user-supplied and
**read-only**: do not generate, export, replace, rename or modify any of them,
and do not add new ones.

Order of authority:

1. `blueprint/reference/design-system.md` - the measured token mapping, size
   ladders, radius table, button spec, interaction-state table and contrast
   numbers. **Wins for any value.**
2. **The PNGs** - what a surface actually looks like: proportion, hierarchy,
   fill, border, radius and the states that are captured.
3. `design/prio_one_landing_page_men_new.html` - the Pencil export. Used only
   for what the PNGs cannot show: **SVG path geometry and `viewBox` data** for
   the logo and icons. Never a source for layout, spacing or arbitrary classes.

Where any two disagree, `blueprint/project-plan.md` wins.

### Which PNG supports which surface

| Reference PNG | Supports |
| --- | --- |
| `Solean landing page.png` | Logo in header and footer, header gold pill CTA, hero primary + outline CTAs, colour palette in situ, full type hierarchy, bento and testimonial and clinician Cards, Badges, StarRating in three placements, FAQ Accordion (one row open, rest collapsed, chevron affordance), Separators, dark announcement bar |
| `Learn Article — !learn!blog!mounjaro-vs-wegovy.png` | Long-form body typography and heading ladder, header CTA and language Select, FAQ Accordion collapsed with a plus affordance, editorial Cards, the deep green card that is the one **dark surface** in the references, Separators, eyebrow treatment |
| `EN Checkout — Step 1 · Account.png` | Input default and filled, leading-icon Input, uppercase Label, Checkbox checked, gold `lg` pill Button, secondary Back pill, order summary surface, Separators between line items, accent notice banner |
| `EN Checkout — Step 2 · Shipping.png` | Further Input and Select-shaped fields in the shipping step |
| `EN Checkout — Step 3 · Payment.png` | Segmented RadioGroup (selected shows a gold border), leading-icon and placeholder-only Inputs, completed-step affordance |
| `EN Checkout — Step 1 · Account — Consultation Added.png` | Order summary with an add-on applied, recalculated summary rows |
| `EN Checkout — Change Treatment Modal.png` | Dialog: surface, radius, overlay scrim, title and description, close icon Button, footer pairing of an outline Button with the gold primary; selected vs unselected option rows; Badges |
| `EN Checkout — Consultation Offer Popup.png` | Second Dialog composition |
| `Offer Modal Overlay.png` | Full-bleed Dialog, muted green scrim, circular close icon Button, unlabelled placeholder-only Input, **deep green filled pill Button** |
| `EN Questionnaire 1 — About You.png` | Logo at its cleanest large render, RadioGroup unselected as bordered option cards, Input with a trailing unit suffix, uppercase Labels, gold `lg` pill, secondary Back pill, circular ghost icon Button |
| `EN Questionnaire 4 — Medical Conditions.png` | **Checkbox checked** (gold fill, dark check) and the selected option card treatment, exclusive "None of the above" option, Separator with an inline "OR" |
| `EN Questionnaire 8 — Treatment Preference.png` | **RadioGroup selected** as a card (gold border, warm tint, gold circular check), both Badge tones side by side (`INJECTION` on accent, `TABLET` on highlight), small ghost "Learn more" Button, circular chevron icon Button |
| `EN Questionnaire 2 — Your Details.png`, `EN Questionnaire 3 — Pregnancy.png`, `EN Questionnaire 5 — Health History.png`, `EN Questionnaire 6 — Eating Disorders.png`, `EN Questionnaire 7 — Allergies & Medications.png` | Additional single-select and multi-select option-card compositions; secondary confirmation of the same primitives, not a source of new states |
| `EN Questionnaire 9 — Complete & Order.png` | Completion surface and its card and Button composition |
| `EN Questionnaire — Projection Mid Step.png`, `EN Questionnaire — Motivation Mid Step.png` | Interstitial surfaces; feature 8 owns them, referenced here only for type and Button treatment |
| `EN Checkout — Final · Doctor Review.png` | Feature 11's surface; referenced here only for card and Badge treatment |

### What the references do not contain

The PNGs are static desktop artboards at 1920px wide. **Do not invent a
reference state that is not in them.** The following are absent, and are
therefore governed by `design-system.md` and the accessibility rules, not by a
guessed visual:

| Absent | Governed instead by |
| --- | --- |
| **Hover** on any element | The interaction-state table in `design-system.md` section 4 |
| **Active / pressed** | Same table |
| **Focus-visible** | The focus rules in `design-system.md` section 1a |
| **Invalid / validation** | The provisional destructive family, `design-system.md` section 1a |
| **Disabled** | `design-system.md` section 4 |
| **Any mobile or tablet layout** | Our own responsive design; the export has no mobile artboards |
| **Sheet** in any form | A considered responsive adaptation, per the ruling in `design-system.md` section 4 |
| **Textarea** in any form | Derived from Input with no deviation, per `design-system.md` section 4 |
| **The logo on a dark surface** | The `currentColor` contract, an architecture decision, not a reference state |
| **Indeterminate Checkbox** | `design-system.md` section 4 |

### Decision needed before Step 4

The references show a **deep green filled pill Button** in at least three places:
`Offer Modal Overlay.png` ("Get 50 EUR off"), `EN Checkout — Step 1 ·
Account.png` ("Add to treatment") and `EN Checkout — Change Treatment Modal.png`
("Selected"). It is not any of the six variants in `design-system.md`: it is
`bg-foreground` with `background`-coloured text, not the light `secondary`
`#F7F8F5`.

Button's public API is load-bearing, so this must be settled before Step 4, not
patched later. Options:

1. **Add a seventh variant** to the primitive. Recommended if the treatment
   stays. Wrappers are banned and inline overrides would scatter the styling
   across features 9, 10 and 5.
2. **Rule it out of the design system** and treat those three as product-level
   compositions owned by their features.

**Do not decide this unilaterally during `/implement`.**

## In scope

- **Tokens.** Every base token, semantic extension, and the provisional
  destructive family from `design-system.md` section 1, written into
  `src/routes/layout.css` and exposed through `@theme inline`.
- **Typography.** Inter Tight Variable as `--font-display`, DM Sans Variable as
  `--font-sans`. The stock `Inter Variable` dependency is removed.
- **Radius.** `--radius: 1.25rem` with the existing multiplier chain kept.
- **Focus.** `--ring` as deep green `#173824`, the default focus-visible
  treatment on every focusable primitive, and the gold ring override for dark
  surfaces.
- **All thirteen primitives installed and adapted:** `button`, `input`,
  `textarea`, `label`, `select`, `checkbox`, `radio-group`, `card`, `badge`,
  `separator`, `dialog`, `sheet`, `accordion`.
- **Brand foundations:** `SoleanLogo` and `StarRating` in
  `src/lib/components/brand/`.
- **Showcase** at `/dev/design-system` covering tokens, both fonts and their
  responsive ladders, every primitive with its states, variants, sizes and
  keyboard behavior, and one small example form composition.
- **Dead scaffold token cleanup:** remove the unused `--sidebar-*` and
  `--chart-*` blocks left by the shadcn scaffold.

## Out of scope

- **Product components.** `TreatmentOption`, `AddOnCard`, `OrderSummary`,
  `CheckoutStep`, `ReviewTimeline`, questionnaire answer cards, `CountdownTimer`,
  `ProgressProjectionChart`, `NumberedHowItWorks`, `BentoGrid`,
  `PartnerLogoStrip`. Each belongs to the feature that owns its domain semantics.
- **Deferred primitives:** `carousel`, `tooltip`, `sonner`, `skeleton`, `tabs`,
  `chart`, `navigation-menu`. Do not install them.
- **The marketing shell.** No header, footer, navigation, route groups or landing
  page. Feature 3 owns those. `src/routes/+page.svelte` keeps the SvelteKit
  welcome page; it will look plain against the new tokens and that is expected.
- **Domain types and services.** `src/lib/domain/`, `src/lib/journey/` and every
  service contract belong to feature 2.
- **Dark mode.** No toggle, no QA. See the ruling in Notes for the AI.
- **A test runner.** None is configured; do not install one. See Testing.
- **Wrappers.** No `SoleanButton` or any component that exists only to restyle a
  primitive.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

Steps 1 to 3 are the foundation; every later step adapts primitives and grows
the showcase in the same diff, so nothing is ever added without a visible proof
surface.

- [x] **Step 1 - Tokens, fonts and radius** - Rewrite the `:root` block and
  `@theme inline` in `src/routes/layout.css` with every base token, semantic
  extension and the provisional destructive family from `design-system.md`.
  Set `--radius: 1.25rem`, keep the existing multiplier chain. Swap
  `@fontsource-variable/inter` for `@fontsource-variable/inter-tight` and
  `@fontsource-variable/dm-sans`; define `--font-sans` and `--font-display`.
  Delete the `--sidebar-*` and `--chart-*` blocks. Do **not** touch the `.dark`
  block and do not mirror any new token into it.
  *Reference:* `blueprint/reference/Solean landing page.png` and
  `blueprint/reference/Learn Article — !learn!blog!mounjaro-vs-wegovy.png` for
  the palette in situ, so the warm ground, deep green text and gold CTA read the
  way they do in the artboards.
  *Done when:* `pnpm check` and `pnpm build` pass; the dev server renders `/` on
  the warm sand ground `#FBFAF7` with deep green `#173824` text; DevTools shows
  the computed `--primary` as gold `#E2B64F`, `--ring` as `#173824`, and the
  resolved body font family as `DM Sans Variable`; no `Inter Variable` reference
  remains anywhere in the repo; the `.dark` block is byte-identical to before.

- [x] **Step 2 - Showcase skeleton, tokens and typography** - Create
  `src/routes/dev/design-system/+page.svelte` with a `noindex` robots meta, a
  page container using max-width and fluid padding, a swatch grid for every
  token (name, role, rendered colour), and the typography section: both font
  families labelled by role, plus every responsive ladder from `design-system.md`
  section 2 rendered live.
  *Reference:* `blueprint/reference/Learn Article — !learn!blog!mounjaro-vs-wegovy.png`
  is the best type specimen in the set (H1 through body, lists, eyebrows,
  captions). `blueprint/reference/Solean landing page.png` covers the display
  end: hero headline, large stats, section headings.
  *Done when:* `/dev/design-system` loads with no console errors; every token in
  `layout.css` appears as a labelled swatch and none is missing; the hero,
  section-heading, stat, sub-heading, card-title, lead, body, label, caption and
  eyebrow ladders all render, and each visibly changes size when the viewport is
  resized across `sm`, `md`, `lg` and `xl`; headings render in Inter Tight and
  body text in DM Sans, confirmed in DevTools.

- [x] **Step 3 - Install the thirteen primitives, unadapted** - Run the
  shadcn-svelte CLI for `button input textarea label select checkbox radio-group
  card badge separator dialog sheet accordion` and nothing else. Review the new
  dependencies the CLI pulls in (`bits-ui` and its peers) as part of this diff.
  No hand adaptation in this step, so later diffs read as pure adaptation.
  *Reference:* none. Nothing visual is decided in this step.
  *Done when:* `src/lib/components/ui/` contains exactly those thirteen
  directories and no others; `pnpm check` and `pnpm build` pass; the showcase
  still renders unchanged; `package.json` shows the newly added dependencies and
  nothing from the deferred list.

- [x] **Step 4 - Adapt Button** - Six variants (`default`, `secondary`,
  `outline`, `ghost`, `link`, `destructive`) and four sizes (`sm` `h-10 px-4
  text-sm`, `default` `h-12 px-6 text-base`, `lg` `h-17 px-8 text-lg
  rounded-full`, `icon` `size-10`), centralized in the primitive's variant
  config. Hover and active follow the interaction-state table exactly:
  `bg-primary-hover` for primary, `accent`/`muted` for secondary, outline and
  ghost, and the destructive family for destructive. Add the Button showcase
  section: every variant crossed with every size, plus a dark-surface panel
  proving the gold ring override.
  **Settle the deep green pill decision above before starting this step.**
  *Reference, resting states only:*
  - `blueprint/reference/Solean landing page.png` - header gold pill CTA, hero
    gold pill beside the outline pill on a photo, footer link treatment
  - `blueprint/reference/EN Questionnaire 1 — About You.png` - the full-width
    gold `lg` pill, the secondary Back pill, the circular icon Button
  - `blueprint/reference/EN Questionnaire 8 — Treatment Preference.png` - the
    small ghost "Learn more" Button and the circular chevron icon Button
  - `blueprint/reference/EN Checkout — Change Treatment Modal.png` - an outline
    Button paired with the gold primary in a Dialog footer
  - `blueprint/reference/Offer Modal Overlay.png` - the deep green filled pill
  - `blueprint/reference/Learn Article — !learn!blog!mounjaro-vs-wegovy.png` -
    a gold Button on the deep green card, the only dark surface in the reference
    set and the reason the gold ring override exists
  **Hover, active, focus-visible and disabled appear in none of these images.**
  Take them from the interaction-state table and the focus rules in
  `design-system.md`, never from a guess at the artboards.
  *Done when:* the 6 x 4 matrix renders; `hover:bg-primary/90` appears nowhere;
  DevTools reports the `lg` button computed height as exactly `68px` and no
  `h-[68px]` exists in source; tabbing shows a 2px deep-green ring with a real
  offset on every variant on light surfaces and a gold ring on the dark panel;
  disabled buttons are visibly dimmed and not focusable-activatable; active
  (mouse-down) visibly differs from hover on primary, secondary, outline, ghost
  and destructive.

- [x] **Step 5 - Adapt Input and Label, and fix the field composition** -
  Adapt Input to `rounded-md`, the `--input` border, the shared focus-visible
  treatment, the invalid treatment (`--destructive` border, `--destructive-text`
  message copy) and the disabled treatment. Adapt Label. Establish the
  label + control + description + error-message composition pattern that
  features 7, 8 and 9 will reuse. Add the showcase section.
  *Reference, resting states only:*
  - `blueprint/reference/EN Checkout — Step 1 · Account.png` - the canonical
    field: an uppercase Label above a white field with a hairline border,
    default and filled, plus the leading-icon variants for email, phone and date
  - `blueprint/reference/EN Checkout — Step 3 · Payment.png` - placeholder-only
    fields and further leading icons
  - `blueprint/reference/EN Questionnaire 1 — About You.png` - a numeric field
    with a trailing unit suffix
  - `blueprint/reference/Offer Modal Overlay.png` - an unlabelled,
    placeholder-only field
  **Focus-visible, invalid and disabled appear in none of these images.** They
  come from `design-system.md` section 1a and the accessibility rules.
  *Done when:* an Input renders in default, focus-visible, invalid, disabled and
  filled states; the invalid field shows a `#C34E45` border with the message in
  `#BC483F`, wired by `aria-describedby` and `aria-invalid`; clicking the label
  focuses the control; the pattern is documented in the showcase as the shape
  later forms copy.

- [x] **Step 6 - Adapt Textarea and Select from Input** - Both derive from
  Input with no deviation in font, sizing, border token, `rounded-md`, focus,
  invalid, disabled or composition. Textarea gets a stock Tailwind minimum
  height. The Select trigger aligns visually with Input; its dropdown uses the
  popover tokens. Add the showcase section.
  *Reference:* Textarea has **no artboard anywhere in the reference set**, so it
  is derived from Input by rule, not by eye. For Select, the closest resting
  references are the language selectors in
  `blueprint/reference/Learn Article — !learn!blog!mounjaro-vs-wegovy.png`
  (header) and `blueprint/reference/Solean landing page.png` (footer); align the
  trigger to the Input in
  `blueprint/reference/EN Checkout — Step 1 · Account.png`. No open dropdown is
  captured in any PNG, so the menu follows the popover tokens and shadcn-svelte
  behavior.
  *Done when:* Input, Textarea and Select triggers are visually indistinguishable
  in border, radius, height rhythm and focus ring, side by side in the showcase;
  the Select opens on click and on `Enter`/`Space`, moves selection with arrow
  keys, closes on `Escape`, and returns focus to the trigger; no arbitrary
  dimension classes exist in any of the three.

- [x] **Step 7 - Adapt Checkbox and RadioGroup** - Semantic tokens for the
  checked fill and indicator, the shared focus treatment, the invalid treatment,
  and disabled. Add the showcase section using `fieldset`/`legend` for the group,
  as the questionnaire will.
  *Reference, resting and checked states:*
  - `blueprint/reference/EN Questionnaire 4 — Medical Conditions.png` - the
    definitive **checked** Checkbox (gold fill, dark check) and the selected
    option-card treatment, plus the exclusive "None of the above" option
  - `blueprint/reference/EN Checkout — Step 1 · Account.png` - the checked
    consent Checkbox beside wrapping label text
  - `blueprint/reference/EN Questionnaire 1 — About You.png` - **unselected**
    radio options as bordered cards
  - `blueprint/reference/EN Questionnaire 8 — Treatment Preference.png` - the
    **selected** radio card: gold border, warm tint, gold circular check
  - `blueprint/reference/EN Checkout — Step 3 · Payment.png` - a segmented radio
    group where selection reads as a gold border
  **Indeterminate, focus-visible, invalid and disabled appear in none of these
  images.** They follow `design-system.md`.
  *Done when:* unchecked, checked, indeterminate (Checkbox), focus-visible,
  disabled and invalid all render; the radio group is reachable with one `Tab`
  and its options are traversed with arrow keys; the group has a visible
  `legend`; the checked fill uses `--primary`, never `--rating`.

- [x] **Step 8 - Adapt Card, Badge and Separator** - Card on `--card` with the
  `--border` hairline and `rounded-lg`, **with no hover styling on a static
  Card**; a separate interactive-Card example carries hover and focus-visible.
  Badge variants mapped to `accent`, `highlight`, `secondary` and the
  destructive family. Separator on `--border`. Add the showcase section.
  *Reference, resting states only:*
  - `blueprint/reference/Solean landing page.png` - the bento panels,
    testimonial Cards, clinician Cards, and the Separators between footer blocks
  - `blueprint/reference/EN Checkout — Step 1 · Account.png` - the order summary
    surface and the hairline Separators between line items
  - `blueprint/reference/EN Questionnaire 8 — Treatment Preference.png` - both
    Badge tones side by side: `INJECTION` on accent green, `TABLET` on highlight
    gold
  - `blueprint/reference/Learn Article — !learn!blog!mounjaro-vs-wegovy.png` -
    editorial Cards, the key-takeaways Card, and the deep green Card
  **No Card hover state is captured anywhere**, which is consistent with the
  ruling that static Cards get none. The interactive-Card hover comes from the
  interaction-state table.
  *Done when:* a static Card shows no visual change on hover; the interactive
  Card does, and is keyboard focusable with a visible ring; each Badge variant
  renders with its token pairing and the text passes a contrast spot-check;
  horizontal and vertical Separators both render.

- [x] **Step 9 - Adapt Dialog, Sheet and Accordion** - Popover tokens, the
  shared radius, an overlay that does not fight the warm ground, and subtle
  Accordion hover reusing an existing semantic surface with no new hover token.
  Add the showcase section. The Sheet demo is the one that feature 3's mobile
  navigation will use.
  *Reference:*
  - Dialog - `blueprint/reference/EN Checkout — Change Treatment Modal.png`
    (surface, radius, scrim, close icon Button, footer Button pairing),
    `blueprint/reference/EN Checkout — Consultation Offer Popup.png`, and
    `blueprint/reference/Offer Modal Overlay.png` (full-bleed variant, muted
    green scrim, circular close)
  - Accordion - `blueprint/reference/Solean landing page.png` (FAQ with one row
    open and the rest collapsed, chevron affordance) and
    `blueprint/reference/Learn Article — !learn!blog!mounjaro-vs-wegovy.png`
    (all collapsed, plus affordance). Pick one affordance, use it consistently,
    and note the choice in the showcase.
  - Sheet - **no artboard exists anywhere in the reference set.** The export has
    no mobile artboards. Build it as a considered responsive adaptation reusing
    the Dialog's surface, radius and scrim tokens, per the ruling in
    `design-system.md` section 4. Do not invent a Sheet visual and present it as
    reference-backed.
  *Done when:* Dialog opens, traps focus, closes on `Escape` and on overlay
  click, and returns focus to its trigger; Sheet does the same and slides from
  the configured edge; Accordion opens and closes on `Enter`/`Space`, moves
  between headers with arrow keys, and its hover uses an existing token; all
  three behave correctly at a 375px viewport width.

- [x] **Step 10 - Brand foundations: SoleanLogo and StarRating** - Build
  `src/lib/components/brand/SoleanLogo.svelte` as **one** normalized
  `<svg viewBox="0 0 166 60">`, composing the export's 7 glyph paths through
  `<g transform>` rather than 7 absolutely positioned elements, filled with
  `currentColor` so it inherits from its context. Build
  `src/lib/components/brand/StarRating.svelte`: N squares on `--rating` each
  holding a white star, a `rating` and `max` prop, and an accessible text
  equivalent. Add the showcase section including the logo on both light and dark
  surfaces.
  *Reference:*
  - Logo shape - `blueprint/reference/EN Questionnaire 1 — About You.png` and
    `blueprint/reference/EN Checkout — Step 1 · Account.png` are the cleanest
    large renders; `blueprint/reference/Solean landing page.png` shows it small
    in the header and in the footer. **Geometry comes from the HTML export**,
    node `data-pencil-name="Solean Logo"`, a 166 x 60 box holding 7 glyph SVGs
    filled `#191C18`; the PNGs confirm proportion and optical weight.
  - StarRating - `blueprint/reference/Solean landing page.png` in three
    placements: the hero reviews block, the 4.7 rating panel, and the stars on
    each testimonial Card.
  **The logo appears on a dark surface in no PNG.** Rendering it on the
  showcase's dark panel proves the `currentColor` contract; that is an
  architecture decision, not a reference state, and must not be described as
  reference-backed.
  *Done when:* the logo renders correctly at small, default and large sizes with
  no distortion and no absolute positioning; it takes its colour from the parent
  through `currentColor`, shown on both a light and a dark panel; StarRating
  renders 4 of 5 and 5 of 5 correctly and announces its value to a screen reader;
  `--rating` is used only here.

- [x] **Step 11 - Example form composition, responsive and accessibility
  sweep** - Add the small example form to the showcase (a questionnaire- or
  checkout-shaped composition: legend, radio group, an input with a description,
  a select, a checkbox consent, submit and back buttons) using only adapted
  primitives. Then sweep the whole showcase for responsiveness, keyboard
  operation, focus visibility and reduced motion.
  *Reference:* `blueprint/reference/EN Questionnaire 1 — About You.png` and
  `blueprint/reference/EN Checkout — Step 1 · Account.png` give the desktop
  shape the example form should echo. **Every PNG is a 1920px desktop artboard;
  no mobile or tablet layout exists in the reference set.** The 375px and 768px
  behavior is our own responsive design, judged against the responsiveness rules
  in the build plan, not against an image.
  *Done when:* the example form is built entirely from adapted primitives with
  no bespoke styling; the whole showcase is usable and readable at 375px, 768px
  and 1440px with no horizontal scroll; every interactive element on the page is
  reachable by keyboard with a visible focus ring; `prefers-reduced-motion`
  suppresses Dialog, Sheet and Accordion animation; a repo-wide search finds no
  arbitrary visual value (`text-[`, `rounded-[`, `w-[`, `h-[`, `leading-[`,
  `tracking-[`, `left-[`, `top-[`) outside SVG geometry; `pnpm check` and
  `pnpm build` pass.

- [x] **Step 12 - Repair F-03 and F-04, contrast on tinted surfaces** -
  **Fixes:** `F-03`, `F-04`. The F-01 correction validated the text roles against
  the four page grounds only. The token set defines nine light surfaces, and on
  the three tinted ones the lightest roles fall under the 4.5:1 AA floor. One
  pairing is live today: Badge's `highlight` variant renders
  `--highlight-foreground` `#956400` on `--highlight` `#F7EBCB` at 4.32:1, with
  `text-xs` copy, which also breaks Step 8's own contrast done-when.
  Darken `--highlight-foreground` `#956400` to `#906100`, the next step along the
  same hue and saturation used for the F-01 values. Extend the contrast record in
  `blueprint/reference/design-system.md` section 1b from the page-ground list to
  the full text-role by surface matrix, and correct the token table entry.
  *Reference:* none. No artboard governs contrast; this follows the accessibility
  rules and the method already recorded in `design-system.md` section 1b.
  *Done when:* `--highlight-foreground` is `#906100` in `src/routes/layout.css`
  and nowhere else in `src/` is a hex introduced; the `highlight` Badge measures
  at least 4.5:1 against `--highlight` in the browser, confirmed on
  `/dev/design-system`; the same token still clears 4.5:1 on `--background`,
  `--card`, `--muted` and `--surface-subtle`; `design-system.md` section 1b
  records the full matrix including `--highlight`, `--surface-warm` and
  `--surface-tint`, and names which roles remain unsafe on `--surface-tint`;
  `tokens.ts` shows the new documented value so the swatch label matches the
  rendered colour; `pnpm check` and `pnpm build` pass.

## Files / areas

| Path | Change |
| --- | --- |
| `src/routes/layout.css` | Rewritten token layer, fonts, radius, `@theme inline` |
| `package.json` | Remove `@fontsource-variable/inter`; add `inter-tight`, `dm-sans`; CLI-added `bits-ui` and peers |
| `src/lib/components/ui/<primitive>/` | Thirteen primitives, installed then adapted |
| `src/lib/components/brand/SoleanLogo.svelte` | New |
| `src/lib/components/brand/StarRating.svelte` | New |
| `src/routes/dev/design-system/+page.svelte` | New showcase, grown across steps 2 to 11 |
| `src/routes/dev/design-system/` sections | Split into child components if the page file grows past comfortable review size |

Untouched: `src/routes/+page.svelte`, `src/routes/+layout.svelte` (beyond what
already imports `layout.css`), `src/lib/utils.ts`, `vite.config.ts`,
`components.json`.

## Data / contracts

No domain data. The load-bearing contracts here are API shapes that features 3
to 12 consume directly, so getting them wrong is expensive.

**Load-bearing - lock now:**

1. **Semantic token names.** Every name in `design-system.md` section 1, exactly
   as written. No appearance-based names (`cream`, `sand`, `gold-deep`). Later
   features write `bg-surface-subtle`, not a hex.
2. **Button public API.** `variant: 'default' | 'secondary' | 'outline' |
   'ghost' | 'link' | 'destructive'` and `size: 'sm' | 'default' | 'lg' |
   'icon'`. Six and four, no more. Renaming these later touches every feature.
3. **Field composition pattern.** The exact label + control + description +
   error arrangement, `aria-describedby` and `aria-invalid` wiring included.
   Features 7, 8 and 9 copy it rather than reinventing form markup.
4. **`SoleanLogo` props.** Size handling and the `currentColor` fill contract;
   feature 3's header and footer both consume it.
5. **`StarRating` props.** `rating` and `max`, plus the accessible text
   equivalent; features 3 and 5 both consume it.

**Deliberately not defined here:** `Treatment`, `AddOn`, `Money`,
`PatientProfile`, `Order`, journey stages, and every service interface. Those
are feature 2's contracts.

## Testing

**No test runner and no `test` command exist in `AGENTS.md`, and none is
installed by this feature.** There is also no `Verify` command. The automated
gate for every step is therefore:

```
pnpm check    # svelte-kit sync + svelte-check
pnpm build
```

Both must pass before a step is approved and before any checkpoint commit.

**No in-scope unit-testable logic ships in this feature.** It is entirely tokens,
styling and component markup. The Button variant map is a `tailwind-variants`
config, not logic with edge cases, so it does not earn a test. If a later step
surprises us with real logic, add a focused test then, and say so before
installing anything.

No `Browser tests` command is declared either, so browser behavior is verified
directly, not by a harness. Per step:

| What | How it is verified |
| --- | --- |
| Tokens, fonts, radius | DevTools computed values plus the showcase swatches |
| Button `h-17` = 68px | DevTools computed height on the `lg` button |
| Focus visibility | Tab through the showcase, on light and dark panels |
| Invalid states | The showcase's invalid examples, with `aria-invalid` inspected |
| Keyboard behavior | Manual keyboard operation of Select, RadioGroup, Dialog, Sheet, Accordion |
| Responsiveness | Resize to 375px, 768px, 1440px on the whole showcase |
| Reduced motion | Toggle `prefers-reduced-motion` in DevTools |
| No arbitrary values | Repo-wide search for `text-[`, `rounded-[`, `w-[`, `h-[`, `leading-[`, `tracking-[` |

Run `/check` when the feature is built to prove the done-whens, and `/try` for a
human walkthrough.

## Notes for the AI

- **Client-only feature.** No load functions, no form actions, no server code,
  no `+page.server.ts`.
- **Adaptation, not replacement.** Keep each primitive's accessible behavior and
  its shadcn-svelte public API. Change the styling and the variant config, not
  the structure. Variants stay centralized in the primitive, using the existing
  shadcn-svelte variant approach.
- **Tokens only.** Never a hex or an arbitrary Tailwind value in a component.
  SVG geometry, `viewBox`, path data and genuinely data-driven values are the
  only exemptions, and they apply in step 10.
- **`hover:bg-primary/90` is banned.** Primary hover is `--primary-hover`
  `#D9971C`. The opacity form produces a lighter, background-dependent result.
- **`--rating` `#00B67A` is stars only.** Never success, validation or
  destructive.
- **The destructive family is provisional.** Add a comment in `layout.css`
  recording that it does not come from the approved reference and needs final
  brand review.
- **Two reds, two jobs.** `--destructive` for fills and borders,
  `--destructive-text` for message copy on light surfaces. Using the fill token
  as text on the warm ground fails AA at 4.47:1.
- **Dark mode ruling, already resolved.** `coding-standards.md` has been
  updated: dark mode is out of scope, new Solean tokens are defined for the
  light theme only in `:root`, they are **not** mirrored into `.dark`, and the
  existing technical `.dark` block the scaffold shipped stays untouched. No
  toggle, no dark-mode QA. There is no drift left to flag at `/complete`.
- **Reference images are read-only.** The twenty-one PNGs in
  `blueprint/reference/` are user-supplied. Do not generate, export, replace,
  rename, crop or modify any of them, and do not add new ones. Read them where
  they sit.
- **Never invent a reference state.** Hover, active, focus-visible, invalid,
  disabled, indeterminate, Sheet, Textarea, mobile and tablet are absent from
  the PNGs. Those come from `design-system.md` and the accessibility rules.
  When reporting a step, say which claims are reference-backed and which are
  design-system decisions; do not blur the two.
- **The showcase is a dev surface**, not a public marketing route and not an
  admin dashboard. Do not link it from the app. Give it a `noindex` meta.
- **Split the showcase page** into child components under
  `src/routes/dev/design-system/` as soon as a single file gets too big to
  review comfortably. A step whose diff cannot be read in one sitting was too
  big.
- **Do not install a deferred primitive** (`carousel`, `tooltip`, `sonner`,
  `skeleton`, `tabs`, `chart`, `navigation-menu`) even if the CLI offers it.
- **No em dashes** in any generated content, per `coding-standards.md`.

## Findings

### 1/F-01 [P1] closed - Small semantic text colours fail the feature's contrast contract

**File:** src/routes/dev/design-system/+page.svelte:15
**Found:** 2026-08-29 by /audit (scope: current; lens: all)
**Why it matters:** The showcase uses `--highlight-foreground`,
`--text-tertiary`, and `--text-faint` for 12px to 14px text. Against
`--background`, their measured contrast is 3.45:1, 4.14:1, and 2.40:1
respectively, below WCAG AA's 4.5:1 requirement for normal text. The same
failing tokens recur in `TokenSwatch.svelte` and `TypeSpecimen.svelte`, and the
feature contract requires adequate contrast before these roles propagate to
later screens.
**Suggested fix:** Either darken the semantic text tokens to pass on every
allowed light surface, or keep the reference colours for non-text decoration
and introduce accessible semantic text roles. Recheck every `text-xs` and
`text-sm` consumer against its actual surface.
**Resolution:** Fixed 2026-08-29 in Step 4 of Feature 1. The three text roles
were darkened along constant hue and chroma, the same method that produced
`--destructive-text`: `--highlight-foreground` `#B07E12` to `#956400`,
`--text-tertiary` `#6F7D74` to `#57655C`, `--text-faint` `#9AA79E` to `#647168`.
They were re-spaced rather than all pushed to the 4.5:1 floor, because flattening
collapsed tertiary and faint into each other and destroyed the hierarchy. Every
level now clears AA on all four light surfaces: muted-foreground 6.95:1,
tertiary 5.52:1, faint 4.60:1 at worst. Recorded in
`blueprint/reference/design-system.md` section 1b.
Closed 2026-08-29 by /audit (scope: current; lens: all). Re-reviewed
`src/routes/layout.css:63-66` and independently recomputed WCAG contrast from the
current token values rather than trusting the recorded figures. Against the four
page grounds (`--background`, `--card`, `--muted`, `--surface-subtle`) the worst
case per role is highlight-foreground 4.60:1, muted-foreground 6.95:1,
text-tertiary 5.52:1, text-faint 4.60:1, destructive-text 4.56:1. All clear the
4.5:1 AA floor, the original defect is gone, and the three-step hierarchy is
intact. The repair introduced no new defect. The narrower surface gap the
Suggested fix warned about is tracked separately as F-03 and F-04, which are new
pairings introduced in Step 8, not regressions of this repair.

### 1/F-02 [P1] closed - Planned default input boundary is only 1.19:1 against the page

**File:** src/routes/layout.css:27
**Found:** 2026-08-29 by /audit (scope: current; lens: all)
**Why it matters:** `--input` and `--border` are both `#E5E7E2`, measuring
1.19:1 against `--background` and 1.25:1 against `--card`. Step 5 plans to use
this token as the Input border, while WCAG non-text contrast requires 3:1 when
that boundary is needed to identify the control. No Input implementation exists
yet, so a fill or another visual cue could still make the control identifiable.
**Suggested fix:** When Step 5 lands, verify the resting Input in the browser.
If the border is its only boundary, use an accessible field-boundary token or
add another persistent cue that reaches 3:1 without changing the reference
token's decorative uses.
**Resolution:** Fixed 2026-08-29 in Step 4 of Feature 1. `--input` is now
`#8C8D89`, reaching 3.00:1 on `--muted`, 3.20:1 on `--background`, 3.34:1 on
`--card` and 3.29:1 on `--surface-subtle`. `--border` is unchanged at the
reference `#E5E7E2`, since a decorative hairline carries no contrast
requirement; the two tokens previously shared a value, which is what hid the
problem. Recorded in `blueprint/reference/design-system.md` section 1b. The
resting Input still needs browser confirmation when Step 5 lands.
Closed 2026-08-29 by /audit (scope: current; lens: all). Recomputed contrast from
the current `--input` value: 3.20:1 on background, 3.34:1 on card, 3.00:1 on
muted, 3.29:1 on surface-subtle, all clearing the 3:1 non-text floor. The browser
confirmation this entry was waiting on is now recorded: on the running dev server
the resting border computes to `rgb(140, 141, 137)` (`#8C8D89`) identically on
Input, Select trigger and Textarea, each at 56px height and 16px radius, so the
boundary token is genuinely the one in use and the three controls stay
indistinguishable. `--border` remains `#E5E7E2` for decorative hairlines only.
The repair introduced no new defect.

### 1/F-03 [P1] closed - Highlight Badge text falls below AA on its own surface

**File:** src/lib/components/ui/badge/badge.svelte:17
**Found:** 2026-08-29 by /audit (scope: current; lens: all)
**Why it matters:** The `highlight` variant pairs `--highlight-foreground`
`#956400` on `--highlight` `#F7EBCB`, which measures **4.32:1**. Badge text is
`text-xs` (12px), so AA requires 4.5:1. This is a live, rendered code path: the
variant is exercised on the showcase as the `TABLET` badge, and it is the exact
pairing the treatment-preference reference calls for, so features 5, 8 and 10
will inherit it. F-01's correction validated `--highlight-foreground` against the
four page grounds, where it reaches 4.60:1 to 5.12:1, but not against
`--highlight`, the tinted surface that `design-system.md` line 49 documents as
this token's primary role ("Text on highlight"). Step 8's own done-when required
each Badge variant's text to pass a contrast spot-check, so this also breaks the
feature's stated criteria.
**Suggested fix:** Darken `--highlight-foreground` one further step along the
same hue and saturation, the method that produced the F-01 values: `#956400` to
`#906100` measures 4.54:1 on `--highlight` and 4.58:1 on `--surface-warm`, while
improving the page grounds to 5.16:1. Verify the eyebrow and discount-value uses
still read as intended, then record the new value in `design-system.md`
sections 1b and the token table.
**Resolution:** Fixed 2026-08-29 in Step 12 of Feature 1. `--highlight-foreground`
darkened `#956400` to `#906100`, one further step along the same hue and
saturation used for the F-01 values. Measured in the browser on the running
showcase, from computed styles rather than source: the `TABLET` badge renders
`rgb(144, 97, 0)` on `rgb(247, 235, 203)` at 12px for **4.54:1**, clearing the
4.5:1 AA floor. All four Badge variants now pass at `text-xs`: accent 11.47:1,
secondary 12.10:1, destructive 4.67:1, highlight 4.54:1. The token still clears
AA on every page ground (card 5.39:1, background 5.16:1, surface-subtle 5.30:1,
muted 4.85:1). `tokens.ts` carries the new value so the showcase swatch label
matches the rendered colour. The darker gold still reads as warm gold in the
rendered badge. `pnpm check` and `pnpm build` pass.
Closed 2026-08-29 by /audit (scope: current; lens: all). Re-reviewed
`src/routes/layout.css:67` and `src/lib/components/ui/badge/badge.svelte:17`, then
enumerated every rendered instance of the token on the running showcase and
measured each against its own effective background rather than an assumed
surface. Three instances exist: two 12px eyebrows on `--background` at 5.16:1 and
the `TABLET` badge on `--highlight` at 4.54:1. None fail. The original defect is
gone. The repair regressed no light surface: every one of the nine improved by
roughly 0.25. It does move the dark-surface pairing the wrong way, 2.52:1 to
2.39:1, but that pairing already failed before the repair and is unreachable
today; it is recorded as F-06 rather than held against this entry.

### 1/F-04 [P2] closed - Text roles were validated against page grounds only, not tinted surfaces

**File:** src/routes/layout.css:63
**Found:** 2026-08-29 by /audit (scope: current; lens: all)
**Why it matters:** The token set defines nine light surfaces, but the F-01
contrast correction was validated against four of them (`--background`, `--card`,
`--muted`, `--surface-subtle`). On the three tinted surfaces the lightest text
roles fall under the 4.5:1 AA floor: on `--highlight` `#F7EBCB`,
highlight-foreground 4.32:1, text-faint 4.31:1, destructive-text 4.28:1; on
`--surface-warm` `#F3ECDD`, 4.35:1, 4.35:1, 4.32:1; on `--surface-tint`
`#DDE4DD`, 3.95:1, 3.95:1, 3.92:1. Only the `--highlight` case is reachable today
(tracked as F-03); `bg-surface-warm` and `bg-surface-tint` appear nowhere in
`src/`. But `design-system.md` assigns those surfaces to FAQ items, dividers and
secondary card borders, so features 3 through 6 will create these pairings, and
nothing in the token layer or the showcase would flag it.
**Suggested fix:** Extend the contrast table in `design-system.md` section 1b to
the full text-role by surface matrix rather than the page grounds alone, and
either restrict the lightest roles to the surfaces where they pass or darken them
until they clear every sanctioned surface. Consider adding the tinted surfaces to
the showcase's swatch section so a failing pairing is visible during review.
**Resolution:** Fixed 2026-08-29 in Step 12 of Feature 1.
`blueprint/reference/design-system.md` section 1b now records the full
role-by-surface matrix, five text roles against all nine sanctioned light
surfaces, replacing the four-column page-ground table. Every figure was computed
and then re-verified against the written table. A new subsection names the
surfaces that are not safe for every role: `--surface-tint` carries only
`--muted-foreground` and `--text-tertiary`; `--surface-warm` and `--highlight`
additionally carry `--highlight-foreground` but not `--text-faint` or
`--destructive-text`. The comment in `src/routes/layout.css` records that contrast
is a property of a pairing, not a token, and points at the matrix. No code pairing
changed beyond F-03, since `bg-surface-warm` and `bg-surface-tint` are still
unused in `src/`.
Closed 2026-08-29 by /audit (scope: current; lens: all). Re-reviewed section 1b
and independently recomputed all 45 figures in the new matrix from the token
values; every published number matches. The original defect, roles validated
against four of the nine light surfaces, is gone, and the unsafe-surface
subsection correctly names `--surface-tint` as carrying only
`--muted-foreground` and `--text-tertiary`. The repair introduced no new defect.
The matrix is light-surface only, which is a separate omission raised as F-06.
