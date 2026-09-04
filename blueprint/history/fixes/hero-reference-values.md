# Hero overlay and Reviews.io values from the export

**Type:** Fix

**Status:** verified

## The problem

The merged hero corrections (`0aaf24f`) were built without the Pencil export, which was not in
the repository at the time. The export at `/Users/work/Code/hero-export/solean_ecommerce-export.html`
is now available and carries exact values that the shipped hero does not match.

- The overlay ramps `45 -> 70 -> 90` percent. The export's mobile hero overlay, the one drawn in
  `#041309`, ramps `88` to `F0` in hex, which is `53` to `94` percent over two stops. The shipped
  hero is therefore lighter at the top than the reference and carries a middle stop the reference
  does not have.
- The Reviews.io score is `font-medium` at 30 and 36 pixels with no tracking. The export sets it
  bold, at 32 and 40 pixels, tracking `-1.5px`.
- The summary line is `text-background/85`. The export sets it pure white.
- The gap between the stars and the summary is 4 pixels. The export uses 1 and 2.

## The fix

Correct only these values. The composition, the live Reviews.io response, the fallback, the link
target, the accessible name and the locale-aware count all stay as they are.

- Ramp the hero overlay `55` to `95` percent of `--scrim` over two stops, at every breakpoint.
  `55` and `95` are the stock steps nearest the export's `53` and `94`. The decision that
  `#041309` serves every breakpoint is unchanged, so the export's separate desktop treatment in
  `#071D10` with its flat wash is deliberately not restored.
- Set the score bold with `tracking-tight`, and the summary to full `text-background`.
- Tighten the score-to-details gap to the export's `11px` and `14px`, taken to the nearest
  stock steps, and set the summary directly under the stars with no gap of its own.
- Take the star row to the export's 20 pixel glyph set tight. `StarRating` gains an `lg` size
  and a per-size row gap, because the hero's row is a run of glyphs in the export while the
  smaller sizes sit beside prose in the results band and the testimonials and keep the airier
  gap they were drawn with. Those two sizes are untouched.

Where the export's pixel value has no stock Tailwind step, the nearest stock step is used and
the divergence is recorded rather than an arbitrary value being introduced: the score stays at
`text-3xl` and `sm:text-4xl` (30 and 36 against the export's 32 and 40), and the summary stays
at `text-xs` (12 against 11 and 9). The stars take the export's desktop 20 pixels at every
width rather than its 17 on mobile, because a responsive star size would have to reach into a
primitive that the results band and the testimonials also draw.

What settles the star row is its width against the summary beneath it, not the glyph on its
own. The export sets roughly 112 pixels of stars under 160 of text; a first pass at 24 pixel
glyphs with a 4 pixel gap made the row 136 against 147, near enough to the same width to read
as sprawling. At 20 pixels with a 2 pixel gap the row measures 108 against 147, which is the
export's proportion.

## Build steps

- [x] **Step 1 - Take the overlay and the Reviews.io type from the export.** Replace the three
  stop ramp with the export's two stop `55` to `95`, and correct the score weight and tracking,
  the summary colour, and the two gaps. Update the browser assertions that pin the old alpha
  stops and add one for the score weight. *Done when:* the hero overlay ramps `55` to `95` at
  every width, the score is bold, and the summary is full `text-background`, with the photograph,
  crop, copy, buttons, geometry, navbar and footer untouched.

- [x] **Step 2 - Size the star row to the export.** Give `StarRating` an `lg` size at 20 pixels
  with a 2 pixel row gap, leaving `sm` and `default` as they are, and set the hero's summary
  directly beneath it. *Done when:* the star row measures near the export's proportion against
  the summary width, and no other surface that draws `StarRating` changes.

## Verify

- Run `pnpm check`.
- Run `pnpm test`.
- Run the focused marketing Playwright coverage for the hero, then `pnpm test:browser`.
- Run `pnpm build`.
- Compare `/` and `/en` at `390x844` and `1440x900` against the export's hero artboards.

## Out of scope

- Restoring the export's separate desktop overlay colour and flat wash.
- Any change to the hero photograph, crop, copy, CTAs, geometry, navbar or footer.
- The Reviews.io integration, its fallback, the link target or the analytics events.
- The `/learn` pages, Sanity, the legal pages, checkout performance and the recommendation screen.
