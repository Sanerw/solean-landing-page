# Marketing shell and hero corrections

**Type:** Fix

**Status:** verified

## The problem

Three visible parts of the marketing shell no longer match the approved assets and references.

- The mobile and tablet menu always starts below a hard-coded announcement-bar height. After
  the page has been scrolled, or when no announcement is rendered, that offset becomes an empty
  strip which exposes the page behind the menu.
- The shared Solean wordmark and favicon use older artwork rather than the supplied official
  exports.
- The hero scrim is lighter than wanted and the Reviews.io result is drawn as a translucent
  pill instead of the score, stars and review summary composition in the supplied hero reference.

## The fix

Keep this change limited to shared branding, the opened mobile navigation, and the existing
landing-page hero.

- Position the menu panel and its scrim below only the part of the announcement bar that is
  actually visible when the menu opens. Clamp the offset to the viewport top. At the top of the
  page the bar remains visible; after it has scrolled away the menu covers the full viewport;
  with no announcement there is never an empty strip. Preserve scroll locking, focus trapping,
  Escape handling, navigation destinations, and the existing panel design.
- Replace the shared wordmark geometry with `So•lean - Dark Slate.svg` and
  `So•lean - White.svg`. They are the same geometry with different fills, so the shared SVG
  continues to use `currentColor` and works on light and dark surfaces without duplicated logo
  components. Convert the supplied `favicon.svg` into the ICO asset used by the root layout.
- Use `#041309`, the selected darker green, as the hero overlay colour at every breakpoint.
  Match the stronger overlay progression from the reference while preserving the photograph,
  crop, hero copy, buttons, sizing, and layout.
- Restyle the existing Reviews.io link as the reference composition: a prominent numeric score,
  gold stars, and the review count plus platform name, with the smaller mobile scale. Keep the
  live Reviews.io response, fallback data, link target, accessible name, keyboard focus, and
  locale-aware number formatting. Do not hard-code the reference's example values.

## Build steps

- [x] **Step 1 - Make the menu offset follow the visible announcement.** Replace the fixed
  `64px`/`44px` inset with the announcement bar's visible bottom edge measured when the sheet
  opens and clamped to zero. Extend the focused browser coverage across an unscrolled page, a
  partially or fully scrolled page, tablet width, and a page with no announcement. *Done when:*
  the panel and overlay never leave an uncovered strip, while the visible announcement remains
  unobscured at the top of the page.

- [x] **Step 2 - Install the official brand assets.** Normalize the supplied wordmark into the
  existing `SoleanLogo` component with `currentColor`, update its aspect-ratio contract, and
  replace the generated favicon ICO from the supplied source. Check every existing light and
  dark logo placement without changing its surrounding header or footer layout. *Done when:*
  the supplied mark appears consistently in the marketing header, menu, footer and questionnaire
  shell, and the browser loads the new favicon.

- [x] **Step 3 - Update only the hero overlay and Reviews.io presentation.** Apply the selected
  dark-green scrim and rebuild `HeroRatingBadge` to the desktop and mobile reference composition.
  Update focused browser assertions for styling, live/fallback values, destination, focus and
  responsive visibility. *Done when:* the hero keeps its current content and geometry, the
  overlay uses `#041309`, and the review block shows the current score, stars and review summary
  without a pill background or border.

## Verify

- Run `pnpm check`.
- Run `pnpm test`.
- Run the focused marketing Playwright coverage for the menu, branding and hero, then run
  `pnpm test:browser` if those checks pass.
- Run `pnpm build`.
- Inspect `/` and `/en` at `390x844`, `768x1024`, and `1440x900`. At narrow and tablet widths,
  open the menu before scrolling, after partially scrolling the announcement, and after it has
  left the viewport. Confirm the logo, favicon, hero overlay and Reviews.io block visually.

## Out of scope

- Making the announcement bar sticky.
- Changing hero copy, photography, crop, CTA behavior, layout or Sanity content.
- Changing navigation destinations, menu content, footer content, Reviews.io integration or
  analytics events.
- Any of the separately planned journal, legal-content, checkout-performance or recommendation
  changes.
