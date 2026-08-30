# Announcement bar and hero fidelity

**Type:** Fix  
**Status:** verified

## The problem

The first viewport of the marketing page diverges from the reference design in
three visible ways:

- The announcement sentence is rendered as one muted string, while the reference
  gives “Save” a bold muted treatment, highlights “€10” in gold, and keeps the
  remaining copy at regular weight.
- The hero uses a generated abstract placeholder even though the Pencil HTML
  contains the original café photograph as a base64-encoded JPEG inside
  `Hero Lifestyle Image`.
- The “Latest from Learn” teaser is visually too large at the app's desktop scale
  and uses a full-width top border instead of the short divider shown in the
  reference.
- The desktop navigation uses the compact stock design-system treatment: 36 px
  controls, 14 px labels and a narrow dropdown without treatment icons or trailing
  arrows. The reference uses a larger translucent trigger and a wide, softly
  rounded treatment panel with clear icon–copy–arrow rows.
- `SiteHeader` renders the logo with the 24 px `sm` preset, while the reference
  header gives the full 166 × 60 px mark substantially more presence.
- `BentoCard` uses the same heading, body and padding scale for the large treatment
  card and all four compact cards; its `size` prop changes only the image. This
  removes the reference's hierarchy and makes the right-hand cards look as loud
  as the dominant left card. The grid gap is also 16 px instead of the reference's
  20 px.
- The care/results band treats the centre artwork as a standalone rounded card,
  but the reference embeds a dedicated 1320 × 1164 WebP into the yellow ground and
  fades all four image edges into the panel. Its review column also uses the wrong
  green badge-star treatment and omits the platform copy, short divider, member
  avatar and “Leave a review” affordance.

## The fix

Extract the exact 1376 × 768 JPEG from
`design/prio_one_landing_page_men_new.html` into the existing hero asset path,
then tune the hero scrim against that real photograph so all overlaid text remains
legible. Split the announcement detail into semantic spans matching the reference
weights and colours. Recompose the article teaser with a smaller responsive
footprint, tighter typography and spacing, and the reference's short divider.
Bring the shared `NavigationMenu` trigger, content and dropdown-link treatments
into line with the reference, while keeping product-specific icons and copy at the
`SiteHeader` composition layer. Render the larger existing `SoleanLogo` preset in
the marketing header without changing smaller questionnaire usage.
Make `BentoCard`'s existing `size` contract control the complete card rhythm:
typography, padding, spacing and image allocation. Preserve the current semantic
content, category surfaces and responsive stacking. Treat the HTML as a hierarchy
reference only, mapping it onto the existing Tailwind type and spacing scale rather
than copying the oversized artboard's pixel values.
Extract the exact `Treatment Visual` and `Member Avatar` assets from the HTML.
Render the treatment visual as an unboxed centre composition with the reference's
colour wash and four directional blends. Extend `StarRating` with an outline
platform treatment without changing its existing hero and testimonial variants,
then restore the review panel's complete content hierarchy and inert review-link
affordance.

Keep the current responsive document flow, shared `Button`, `SiteHeader`, content
fixtures, accessibility labels, and narrow-screen stacking intact. Do not copy
the Pencil canvas's absolute positioning into the app.

## Build steps

- [x] **Step 1: Match the announcement and hero artwork.** Render the offer prefix,
  amount and suffix as separately styled spans; extract the HTML's exact
  `Hero Lifestyle Image` JPEG to `src/lib/assets/hero.jpg`; and adapt the scrim to
  the reference image. Done when “€10” is gold, the surrounding weight hierarchy
  matches the reference, and the café scene fills the hero without distortion or
  unreadable overlay text.
- [x] **Step 2: Rebalance the Learn teaser.** Reduce its desktop width and visual
  mass, tighten the eyebrow/title/body/CTA rhythm, and replace the full-width top
  border with the 42 px divider after the title. Done when the teaser reads as a
  quiet bottom-right secondary element at desktop and still stacks without
  clipping at 375 px.
- [x] **Step 3: Match the desktop navigation system and logo.** Update the shared
  `NavigationMenu` trigger/content/dropdown-link geometry and dark-surface open
  state; compose treatment-specific icons and gold trailing arrows in
  `SiteHeader`; and render the header logo at the reference's larger preset. Done
  when the open Treatments menu matches the supplied screenshot's hierarchy and
  spacing, the same primitive remains coherent in the design-system showcase and
  solid header, and the larger logo stays centred without colliding with either
  header column.
- [x] **Step 4: Restore the bento hierarchy.** Give the tall card the design system's
  `text-3xl`, `text-sm` and `p-6` roles plus a dominant image allocation; give the
  four compact cards the quieter `text-lg`, `text-xs` and `p-5` roles with a stable
  gap before imagery; and use the standard `gap-5` grid rhythm. Done when the left card is the unmistakable
  typographic anchor, all four
  right cards share one quieter scale, both columns align at the bottom, and the
  grid still collapses cleanly on narrow screens.
- [x] **Step 5: Rebuild the care/results composition.** Replace the boxed centre
  JPG treatment with the HTML's exact 1320 × 1164 WebP and reproduce its colour
  wash plus left/right/top/bottom blends; add a dedicated outline treatment to
  `StarRating`; and restore the reference's rating-platform line, 48 px divider,
  quote punctuation, 42 px member avatar, author copy and right-aligned “Leave a
  review” row. Keep the review action explicitly inert until a real destination is
  defined. Done when the artwork visually dissolves into the panel, the review
  column matches the supplied reference rather than the green hero badge, all
  previously present care copy remains, and the three-column layout stacks in a
  sensible reading order on mobile.

## Verify

- Compare the first viewport with `blueprint/reference/Solean landing page.png`
  at 1440 × 768 and inspect the responsive layout at 375 px.
- Confirm the hero image remains correctly cropped, announcement text does not
  overflow, the Learn link stays keyboard-visible, and the page has no horizontal
  overflow.
- Open Treatments by pointer and keyboard; confirm arrow-key navigation, Escape
  return-focus, focus rings, disabled destinations and the overlay/solid surface
  treatments still work.
- Inspect `/dev/design-system#navigation-menu` as well as the marketing header so
  the primitive change is proven outside the hero composition.
- Compare the bento grid at desktop and tablet widths, checking the 700:514:514
  column relationship, 790:385+20+385 row relationship, image crops, aligned
  bottoms and the distinct tall/compact type scales.
- Compare the care/results band at 1920 px and a narrow viewport: confirm the
  1896 × 740 reference proportion, 520/660/520 column allocation, four image-edge
  blends, outline-star accessibility label, avatar crop, full review copy and
  visible keyboard focus on the review affordance.
- Run `pnpm check`, `pnpm build`, and the focused marketing browser tests.
