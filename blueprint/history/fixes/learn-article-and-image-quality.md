# Fix: The Learn article, and marketing image quality

**Type:** Fix
**Status:** verified

## Problem

On `/learn/blog/[slug]` the header does not match its artboard,
`blueprint/reference/Learn Article — !learn!blog!mounjaro-vs-wegovy.png`. There
is no HTML export for this page: neither Pencil export contains an article
artboard, so the PNG is the reference.

Three differences, all measured:

1. The header sits 12px away from where the landing page's does, horizontally
   and vertically, so it jumps when a reader moves between the two pages. The
   article artboard draws it flush and full width, but the two pages are read in
   sequence and matching the landing page matters more than matching a drawing
   the landing artboard contradicts. Resolved during review: the wrapper insets
   from `sm` up and not below it, exactly as the hero card does.
2. At 390px the logo is 36px and the menu trigger 40px, against 48px and 44px
   on the landing page. The two headers disagree on the same screen.
3. The artboard's header carries an Instagram control between the language
   select and the CTA. The landing artboard does not, so this belongs to the
   solid variant alone.

## Also fixed on this branch, from review

Working from the artboard rather than an HTML export, since none exists for this
page:

- the Instagram control added earlier is removed again: the artboard draws one,
  the review rejected it
- the breadcrumb ends on a short name, `shortTitle`, instead of truncating the
  headline mid-word
- the comparison table's corner cell is blank as drawn, with a screen-reader
  name so the column is still announced
- `Sources and medical review` moves out of the sidebar into the main column
  under the FAQ, where the artboard puts it, and the sidebar takes the
  artboard's third card, `Our editorial standards`
- the `More expert guides` band is dropped, and with it the prototype
  disclaimer under the sources
- the article hero panel is square below `sm`, like every other panel

## Fix

- Drop the wrapper on the article page and its error page, so the solid header
  is full width and flush.
- Give the solid variant the same narrow-screen logo, trigger and vertical inset
  as the overlay, with the trigger outlined rather than translucent, since there
  is no photograph behind it. The inset was a fourth difference, found while
  measuring: the two headers stood 72px and 80px tall on the same phone.
- The Instagram control was added and then removed again during review; see the
  section above.

## Also on this branch: image quality

The marketing photographs were soft because several were drawn larger than they
were exported: `clinical-care`, `delivery`, `plan` and `support` each carried
466x237 into a 476px box. Nine assets are re-exported from the originals
embedded in the Pencil exports, centre-cropped to the aspect each replaces so
nothing reframes, capped at the source resolution so nothing is upscaled, and
encoded as WebP. 213 KB becomes 265 KB for two to four times the pixels.

`hero.jpg` is the one that cannot be raised: our file is byte-identical to the
export's, and at 1920 it fills 1896px from 1376px of source. A test now refuses
any image below 1:1 density, with the hero as its one recorded exception.

Not touched, for want of a source: `story-photo.jpg` is not in either export,
`daniel-m.jpg` is a tight face crop with 4x headroom at its 40px box, and
`learn/mounjaro-vs-wegovy.jpg` has no artboard.

## Also on this branch: the checkout store domain

`SHOPIFY_STORE_DOMAIN` becomes `PUBLIC_SHOPIFY_STORE_DOMAIN`, made by the user
during review and carried in this commit at their direction. The code, the
Playwright environment, `project-plan.md` and `project-overview.md` all move
together, and no reference to the old name remains.

## Out of scope

- The landing page header, which its own artboard already matches
- Article body, hero, table of contents, sidebar, FAQ and related guides
- The artboard's `WELCOME OFFER` announcement copy, which the current Wegovy
  Pill offer replaced deliberately

## Build steps

- [x] **Step 1 - The three differences** - Apply the fix above. *Done when:* at
  390px and 1440px the article header is flush and full width, its logo and
  trigger match the landing page's at the same width, the Instagram control
  reaches the fixture's destination in a new tab and is keyboard reachable, and
  the landing header is unchanged.

- [x] **Step 2 - Evidence** - `pnpm check`, `pnpm test`, `pnpm test:browser`
  and `pnpm build` pass, with browser coverage for the article header contract
  and a 1440px screenshot compared to the artboard.

## Files / areas

- `src/routes/(marketing)/learn/blog/[slug]/+page.svelte` and `+error.svelte`
- `src/lib/features/marketing/SiteHeader.svelte`
- `src/lib/features/marketing/MobileNav.svelte`
- `e2e/marketing-fidelity.spec.ts`

## Testing

Browser coverage; no pure logic changes.
