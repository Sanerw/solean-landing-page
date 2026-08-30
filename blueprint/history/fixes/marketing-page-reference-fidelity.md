# Marketing page reference fidelity

**Type:** Fix
**Status:** verified

## The problem

The landing page is recognizably based on the supplied HTML and PNG references,
but its desktop composition is too narrow and tall. The hero does not reliably
fit into one viewport below the announcement, the headline is oversized for
short desktop screens, the bento cards use the wrong proportions, and later
sections appear in a different order from the reference. A visually hidden
projection table also expands the page horizontally on mobile.

## The fix

Bring the existing marketing implementation closer to the reference without
changing its content model or replacing its approved placeholder imagery.
Size the desktop hero from the small viewport height after subtracting the
announcement and outer padding, reduce responsive headline sizes, widen the
page composition, restore the reference section order and bento proportions,
compact vertical rhythm, and contain the accessible projection table without
removing it from assistive technology.

## Build steps

- [x] **Step 1: Fit the hero within the desktop viewport.** Use a stable
  `100svh` calculation that subtracts the 56 px announcement and 24 px outer
  padding, compact the header and hero rhythm, and scale the heading down across
  breakpoints. Done when the complete hero remains visible at 1440 x 768 and
  1920 x 1080 without horizontal overflow.
- [x] **Step 2: Restore the reference page composition.** Widen the shared
  containers, change the bento to a two-fifths tall card beside a three-fifths
  four-card grid, reduce oversized section gaps, and place projection,
  testimonials, clinicians, and how-it-works in the reference order. Done when
  card columns align and the rendered section sequence matches the reference.
- [x] **Step 3: Protect narrow-screen layout.** Keep the mobile hero
  content-driven and clip the visually hidden projection table through a
  wrapper so intrinsic table width cannot expand the document. Done when a
  375 px viewport has equal client and scroll widths.

## Verify

- Run `pnpm check`.
- Run `pnpm build`.
- Inspect `/` at 1920 x 1080, 1440 x 768, and 375 x 812.
- At 1440 x 768, confirm the announcement ends at 56 px, the hero starts at
  68 px, and the hero ends at 756 px.
- At 375 x 812, confirm `document.documentElement.scrollWidth` equals 375 px.

## Verification record

Measured with the Playwright harness on the rebased branch, after integrating
with feature 8c and the layout-shift work:

- 1440 x 768: announcement bottom 56 px, hero top 68 px, hero bottom 756 px, so
  the whole hero sits inside the 768 px viewport. Matches the criteria above
  exactly.
- 375 x 812: `document.documentElement.scrollWidth` is 375, equal to
  `clientWidth`. The clipped wrapper around the visually hidden projection table
  is what makes this hold.
- 1920 x 1080: scroll width equals client width, no horizontal overflow.
- `pnpm check` 0 errors, 0 warnings. `pnpm build` clean.

Not verified: the reference section order and bento proportions from step 2 were
not compared against the artboard by eye during this integration.
