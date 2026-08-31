# Feature: Mobile announcement bar and hero

**From build-plan:** feature 15
**Status:** verified

## Goal

Bring the landing page's opening mobile experience in line with the supplied
390px reference: a compact two-column offer bar, full-bleed photographic hero,
overlay navigation, mobile-specific headline composition, one primary CTA, and
a compact review badge. Preserve the completed desktop hero and every section
below it.

## Design reference

- [Rendered mobile announcement bar and hero](<../reference/Solean landing page — mobile hero.png>)
  - the visual target for this feature, cropped from the supplied HTML at its
    native 390px artboard width.
- [Mobile Pencil HTML export](../../design/mobile/prio_one_landing_page_men_mobile.html)
  - the source for the embedded mobile hero photograph and the intended content
    hierarchy. It is a reference, not code to port.
- [Existing desktop landing artboard](<../reference/Solean landing page.png>)
  - the regression guard for desktop; Feature 15 must not replace its layout.
- [Design-system rules](../reference/design-system.md) - authoritative tokens,
  typography, focus, spacing, and radius rules.

The export's 390px canvas coordinates, 700px fixed hero height, arbitrary type
values, and absolute positioning are not implementation requirements. Recreate
the composition with semantic tokens, stock Tailwind scales, normal responsive
flow, and the existing adapted components.

## In scope

- A 64px mobile announcement bar with offer copy on the left and a compact
  days/hours/minutes countdown on the right
- Reuse of the approved mobile hero photograph: the HTML's embedded JPEG is
  byte-identical to the existing `src/lib/assets/hero.jpg`, so there is one
  repository asset and no remote runtime dependency
- Mobile-only hero art direction and crop while the existing desktop hero image
  and composition remain intact
- The landing hero's overlay header at mobile widths: larger white logo,
  circular menu trigger, and the existing accessible `Sheet` navigation
- Mobile-specific hero copy from the reference, one full-width eligibility CTA,
  and responsive spacing that preserves the reference hierarchy without fixed
  canvas coordinates
- A compact, bottom-aligned mobile rating badge using the existing `RATING` data
  and `StarRating` component
- Focused Playwright coverage for the mobile contract and desktop regression
  guard, plus direct 390px visual comparison against the rendered reference

## Out of scope

- Any landing-page section below the hero, including `TrustBenefits`
- Changes to the desktop announcement, desktop hero copy, dual CTA layout,
  article teaser, rating placement, or navigation behavior
- The opened mobile sheet's information architecture or destinations; Feature
  15 only refines its trigger on the closed hero
- New marketing claims, API work, questionnaire behavior, or routing
- Copying the reference's `Trustpilot` name or mark, or changing the existing
  review-provider/data contract. `RATING` currently points to Reviews.io while
  carrying mock figures; resolving that truthfulness issue needs verified source
  data and separate approval, not a silent switch during this visual feature
- New design tokens, shadcn primitives, arbitrary visual values, fixed artboard
  heights, or absolute canvas-coordinate layout

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step
was too big, so split it.

## Build steps

- [x] **Step 1 - Mobile asset and content contract** - Verify that the mobile
  hero photograph embedded in the approved HTML is byte-identical to the
  existing `src/lib/assets/hero.jpg` and reuse that single asset without
  recompression or duplication. Extend the typed hero fixture with the reference's mobile eyebrow,
  headline, and lead, and extend the announcement fixture with its mobile-only
  punctuation and wording. Keep all existing desktop fields and the `RATING`
  contract intact. *Done when:* the existing asset resolves through SvelteKit, the
  typed fixtures expose mobile and desktop copy without hardcoding it in a
  component, `pnpm check` passes, and no existing desktop fixture value changes.

- [x] **Step 2 - Mobile announcement bar** - Recompose `AnnouncementBar` into
  the reference's compact mobile row: title and offer copy at left, countdown at
  right. Give `CountdownTimer` a presentation-only compact mode showing
  days/hours/minutes with short labels while retaining its current timer math,
  cleanup, hydration-safe initial value, and accessible static summary. Preserve
  the existing wider-screen presentation. *Done when:* at 390px the bar stays
  64px tall, both columns remain readable without horizontal overflow, seconds
  and colon separators are absent from the compact visual treatment, a screen
  reader receives one stable offer/countdown summary, and the desktop bar is
  unchanged. Update the already-stale marketing assertion that still expects an
  unrelated welcome offer so it verifies the approved fixture copy instead.

- [x] **Step 3 - Mobile hero frame and overlay header** (the frame also fills the
  viewport below `lg` via `min-h-svh`, agreed during review) - Art-direct the
  shared hero photograph with a responsive mobile crop, remove the
  outer card gutter and radius below the desktop breakpoint, and tune the
  existing scrim for legible white content. Refine only the overlay header's
  mobile treatment: reference-scale logo and circular menu trigger, still
  backed by the adapted `Sheet`. Keep the existing hero content in place for
  this step and use responsive flow rather than the export's absolute
  coordinates or 700px fixed height. *Done when:* at 390px the reference photo
  crop, full-bleed frame, white logo, and menu trigger are in place; the menu
  opens, traps focus, closes on Escape and restores focus; text and focus states
  retain adequate contrast; no duplicate hero image is downloaded; and at
  1200px and 1440px the existing desktop frame, header, navigation, and image
  remain unchanged.

- [x] **Step 4 - Mobile hero content and rating badge** (the badge keeps its own
  width rather than stretching, agreed during review) - Reflow the hero with
  the mobile fixture copy, one full-width primary CTA, no visible mobile
  secondary CTA, and no mobile article teaser. Adapt `HeroRatingBadge` to the
  compact bottom treatment using the unchanged fictional score, review count,
  Reviews.io destination/accessibility contract, and brand `StarRating`; do not
  introduce the reference's Trustpilot attribution. Keep the desktop content
  branches visible and unchanged. *Done when:* at 390px the eyebrow, headline,
  lead, CTA, and rating badge follow the rendered reference's hierarchy; the
  only visible hero CTA is `Check your eligibility` and it reaches
  `/questionnaire`; the rating remains keyboard reachable with its existing
  accessible wording; and at 1200px and 1440px the existing desktop headline,
  dual CTAs, teaser, and rating placement remain unchanged.

- [x] **Step 5 - Regression evidence** - Update the focused marketing
  Playwright specs to assert the 390px announcement/hero contract, single shared
  hero asset, one visible CTA, hidden `Explore treatments` CTA and Learn
  teaser, menu behavior, rating accessibility, and no horizontal overflow, with
  desktop regression assertions for the current hero copy, dual CTAs, image,
  and teaser. Capture direct 390px browser evidence for comparison with the
  reference. *Done when:* `pnpm test`, `pnpm test:browser`, `pnpm check`, and
  `pnpm build` pass; the reference and implementation screenshots agree on
  hierarchy and crop apart from the explicitly rejected Trustpilot branding;
  and no feature below the hero changes position because of overflow or
  accidental desktop styling.

## Files / areas

- `src/lib/assets/hero.jpg` - existing shared photograph, verified byte-for-byte
  against the mobile HTML rather than duplicated
- `src/lib/features/marketing/content.ts` - typed mobile hero copy
- `src/lib/features/marketing/AnnouncementBar.svelte`
- `src/lib/features/marketing/CountdownTimer.svelte`
- `src/lib/features/marketing/HeroSection.svelte`
- `src/lib/features/marketing/SiteHeader.svelte`
- `src/lib/features/marketing/MobileNav.svelte` - trigger styling only
- `src/lib/features/marketing/HeroRatingBadge.svelte`
- `e2e/marketing-fidelity.spec.ts`
- `e2e/marketing-viewport.spec.ts` only if the shared overflow/menu coverage
  needs a selector adjustment

## Data / contracts

- `HeroContent` gains a typed mobile copy group containing `eyebrow`, `headline`,
  and `lead`; the existing desktop `headlineLead`, `headlineStruck`,
  `headlineTail`, and CTA fields stay load-bearing and unchanged.
- `ANNOUNCEMENT` gains mobile-only title and offer wording so the approved em
  dash and plus-sign copy do not alter the existing desktop presentation.
- `RATING` stays the sole source of score, review volume, destination, and
  accessible wording. Visual adaptation must not invent or change review data.
- Countdown arithmetic and `Remaining` stay unchanged. Compact mode changes
  only which units and labels are rendered visually.
- No server data, persistence, external calls, or route contracts change.

## Testing

- Unit tests: no new calculation is planned. Existing countdown logic remains
  covered by `pnpm test`; if implementation changes its arithmetic rather than
  presentation, extend the colocated countdown test in the same step.
- Browser tests: update `e2e/marketing-fidelity.spec.ts` with the stable mobile
  contract and desktop regression assertions described in Step 5. Keep the
  existing mobile navigation and overflow coverage in
  `e2e/marketing-viewport.spec.ts` passing.
- Direct visual check: run the production preview at 390px and compare the
  announcement/hero screenshot with
  `blueprint/reference/Solean landing page — mobile hero.png`; also inspect
  375px, 768px, 1200px, and 1440px for responsive transitions. The Trustpilot
  wordmark in the reference is an explicit content exception, not a missed
  fidelity target.
- Verification commands: `pnpm test`, `pnpm test:browser`, `pnpm check`, and
  `pnpm build`.

## Notes for the AI

- This is a mobile refinement of completed Feature 3b, not a hero rewrite.
  Default to mobile styles and restore the existing desktop behavior at the
  established breakpoint instead of duplicating the component.
- The approved HTML is enormous because it embeds image data. Never import,
  fetch, or parse it at runtime; its hero JPEG is already the existing
  `hero.jpg` asset.
- Keep one decorative hero image with empty alt and `aria-hidden="true"`; the
  text carries the meaning. Change its responsive crop, not its source.
- Keep one semantic `h1`. Mobile and desktop copy may swap through hidden spans,
  but only the visible branch may be exposed to accessibility APIs.
- Reuse `SoleanLogo`, `Button`, `Sheet`, `StarRating`, and semantic color tokens.
  Do not redraw the logo, menu, arrow, or stars from the export.
- Preserve keyboard operation, visible focus, reduced-motion behavior, and the
  existing rule that the ticking digits do not announce every second.
- The photo and scrim must support readable text independent of the photograph's
  brightest region. Do not rely on crop placement alone for contrast.
