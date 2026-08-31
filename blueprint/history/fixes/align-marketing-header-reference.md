# Align the marketing header with the revised reference

**Type:** Fix

**Status:** verified

## The problem

The marketing landing page rendered `SiteHeader` inside the inset hero frame, while the
Learn article rendered the same header directly against the page edge. Navigating from the
landing page to `/learn` therefore shifted the navbar instead of keeping it in the same
viewport position. The revised desktop HTML also changes the announcement bar, but the app
still shows the previous welcome offer, colors, spacing, and countdown styling.

## The fix

Give the Learn header the same outer positioning as the landing-page header while keeping
its existing solid surface and article layout. Update the shared announcement bar from the
revised desktop reference, using semantic color roles and responsive behavior without
changing the navbar's internal structure.

## Build steps

- [x] Align the Learn article header's outer inset with the landing-page hero header.
  Done when the logo, desktop navigation, language control, CTA, and mobile menu retain
  their horizontal position while navigating between the landing page and `/learn`.
- [x] Match the shared announcement bar to the revised desktop HTML at the app's scale.
  Done when the Wegovy Pill offer, €50 gift copy, scaled Tailwind spacing and typography,
  deep-green surface, white copy, gold highlight, and countdown hierarchy match the
  reference while the bar remains readable on mobile and uses no arbitrary size utilities.

## Verify

- Compare `/` and `/learn` at desktop width and confirm the navbar controls do not shift
  horizontally or vertically during navigation.
- Check a mobile width and confirm the logo, CTA visibility, and menu button remain aligned
  and usable.
- Compare the announcement bar against `design/prio_one_landing_page_men-export.html` at
  desktop width and confirm its mobile layout does not overflow.
- Run `pnpm check` and `pnpm build`.
