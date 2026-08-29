# Feature: Product story panels

**From build-plan:** feature 4a
**Status:** verified

## Goal

The three content panels that sit between the trust row and the social proof:
the treatment bento, the results and support band, and the how-it-works steps.
Together they carry the product story and the CTAs that push into the
questionnaire, turning `/` from a hero with a footer into a page that actually
explains the service.

Everything here is static marketing content, so it consumes typed fixtures
directly and composes the primitives Features 1 and 3a already adapted. No new
primitive, and no service interface.

## Design reference

- `blueprint/reference/Solean landing page.png` - the landing artboard:
  - **Bento** approximately y1250-1900: a five-card asymmetric grid, one tall
    card on the left and a two-by-two block on the right, each card on its own
    tinted ground with an eyebrow, heading, one line of subcopy and an image.
  - **Results and support band** approximately y2050-2500: a single sand card
    holding a three-up mini-benefit row, the "Weight loss, with care built in."
    heading with lead copy and one CTA, a centred product image, and a rating
    plus member quote on the right.
  - **How it works** approximately y5620-6030: a tinted card with a photograph
    and an overlaid caption chip on the left, and three numbered steps on the
    right, the first carrying a "Start questionnaire" link.
- `blueprint/reference/design-system.md` - authoritative tokens, type ladders,
  radii. Section 1b's role-by-surface contrast matrix is the check to run for
  every text role placed on a new ground, and this feature adds grounds.

The export has **no mobile artboards**. Every layout below the desktop
breakpoint is a considered responsive adaptation, not a transcription.

### Open decision 1 - the bento needs colours the token set does not have

The five bento cards are colour-coded: peach, pink, sand, mint and pale blue.
Only the last two map onto existing tokens (`--surface-warm`, `--accent`).
**Peach, pink and blue do not exist in the design system**, and the project rule
is semantic tokens only, never a transcribed hex.

Step 2 therefore adds semantic **category surface** tokens and records them in
`design-system.md` with a measured contrast row per text role, the same way
`--surface-warm` and `--surface-tint` are recorded. They are named for their role
in the bento (the category a card belongs to), not for their colour.

**Resolved: two tokens, not three.** Sampling the artboard showed three of the
five grounds already exist. "Your plan" is `#F3ECDD`, exactly `--surface-warm`;
the results band is `#F7EBCB`, exactly `--highlight`; "ongoing support" and
how-it-works sit within a few RGB steps of `--accent` and `--muted`. Only
`--surface-care` and `--surface-delivery` were genuinely new.

This is a deliberate, reviewable extension of the token set rather than five
arbitrary fills. If you would rather keep the palette closed and map all five
cards onto the three existing tints, say so at review: the bento loses its
colour-coding but the token set stays as it is. Nothing else in the feature
depends on which way this goes.

### Open decision 2 - seven more images

The bento needs five images, the results band one, and how-it-works one. The
export dropped all of its photography (established in 3b), and the reachable
free stock sources returned either irrelevant subjects or identifiable people
under unclear licensing.

**Resolved: the real photographs were recoverable after all.** The 3b finding
that the export dropped its photography holds for the HTML file, but it does not
hold for the PNG render. Unlike the hero, whose headline and navigation are
composited on top of the artwork, **every image in these three sections sits in a
clean rectangle with no text over it.** Each one was located by detecting the
region inside a card that is not the flat card ground, then cropped straight out
of `Solean landing page.png` and committed under `src/lib/assets/panels/`.

Seven assets, 164 KB total, at the reference's own resolution, which is the
ceiling: the artboard is a 1x 1920px canvas, so the compact card images are about
466px wide and will be soft on a high-density display. Acceptable for a
prototype; a real asset pipeline would re-shoot or upscale.

The how-it-works crop stops above the artboard's baked-in caption chip, because
the component renders its own chip with real, responsive, translatable text
rather than pixels.

These are the design reference's own photographs, and they show identifiable
people. That was flagged in 3b as a licensing and likeness consideration; using
them in the prototype is a decision taken deliberately, not by default.

## In scope

- Typed fixtures for all three sections, extending `content.ts`
- Three category surface tokens plus their contrast record in `design-system.md`
- Generated tonal placeholder imagery, one per card, behind fixture fields
- `BentoGrid`: the five-card asymmetric grid and its responsive collapse
- `ResultsBand`: mini-benefit row, heading, lead, CTA, image, rating and quote
- `HowItWorks`: image with caption chip, and the three numbered steps
- The CTAs in these sections, pointing at `ROUTES.questionnaire`
- Composition into `/` in reference order beneath the trust row

## Out of scope

- The progress projection chart and its medical-framing panel, which are 4b
- Testimonials, the clinician team and the FAQ, which are feature 5. The bento
  and how-it-works sections sit either side of them in the finished page; this
  feature places its own sections and leaves the gaps
- Any new shadcn primitive, and no change to an existing primitive's own styling
- Any service interface. These are static content fixtures, per the build plan
- Real photography, real clinical claims, or a real review platform's branding
- Dark mode

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

Accessibility and responsiveness are **done criteria on every step below**, not a
final sweep. Every step that renders UI is checked at narrow, tablet and desktop
widths, with keyboard operation and visible focus, before it is offered for
review.

- [x] **Step 1 - Fixtures for the three sections** - Extend
  `src/lib/features/marketing/content.ts` with typed records for the five bento
  cards (category, eyebrow, title, subcopy, ground, image), the results band
  (three mini-benefits, heading, lead, CTA, quote and attribution) and the three
  how-it-works steps (title, body, optional link). The results band's rating
  **reuses the existing `RATING` fixture** rather than restating the figures.
  *Done when:* the module type-checks; the rating appears in exactly one fixture
  in the codebase; no section component holds a hardcoded string; and the
  reference's "1,200+ reviews on Reviews.io" attribution is not reproduced, per
  the decision already taken in 3b.

- [x] **Step 2 - Category surface tokens** - Add the three new surface tokens to
  `layout.css` (light theme only, not mirrored into `.dark`) and `@theme inline`,
  then record them in `design-system.md` section 1b with a measured ratio for
  every text role that lands on them. Existing grounds are reused where the
  reference already matches one. *Done when:* `design-system.md` carries a row per
  new token per role; every pairing actually used by the bento measures >= 4.5:1
  for text; each token compiles to a real utility in the built CSS, verified in
  the build output rather than assumed; and no raw hex appears in any component.

- [x] **Step 3 - Section imagery** - Extract the seven section images from the
  design reference by detecting each clean image rectangle inside its card, and
  commit them under `src/lib/assets/panels/`, referenced through the step 1
  fixture fields. *Done when:* seven assets exist and are imported through
  fixtures rather than hardcoded paths; each is decorative and marked so; total
  added weight is stated in the review; and the built page shows no broken or
  missing image at any width.

- [x] **Step 4 - Bento grid** - `BentoGrid.svelte` plus a `BentoCard` for the
  repeated card anatomy. One tall card on the left, a two-by-two block on the
  right at desktop; a sensible collapse below that. Not every panel is a shadcn
  `Card`, per the design-system ruling, so this is a feature component using
  stock radius and spacing scales. *Done when:* the five-card arrangement matches
  the reference at desktop, collapses to a readable single or double column at
  narrow widths without overflow, each card's heading is a real heading element
  in document order, images are decorative, and no arbitrary visual value or
  fixed card height appears.

- [x] **Step 5 - Results and support band** - `ResultsBand.svelte`: the three-up
  mini-benefit row with icons, the heading, lead and CTA, the centred image, and
  the rating with the member quote. The rating composes the Feature 1
  `StarRating`; the quote is marked up as a real `blockquote` with its
  attribution in a `cite`-bearing element rather than styled text. *Done when:*
  the band renders at all three widths with the three columns collapsing rather
  than overflowing; the quote and attribution are semantically associated; the
  CTA reaches `ROUTES.questionnaire`; and every text role on the band's ground is
  checked against the section 1b matrix.

- [x] **Step 6 - How it works** - `HowItWorks.svelte`: the image with its
  overlaid caption chip, and the three numbered steps as an ordered list. Step
  numbering comes from the list, not from hardcoded strings in each item, so the
  count cannot drift from the fixture. The first step carries the
  "Start questionnaire" link to `ROUTES.questionnaire`. *Done when:* the steps
  are an `<ol>` so their order is conveyed without relying on the rendered
  numerals; the caption chip stays legible over the image at every width; the
  link is keyboard reachable with a visible focus ring; and the section stacks
  cleanly at narrow widths.

- [x] **Step 7 - Compose into the landing page** - Place the three sections into
  `(marketing)/+page.svelte` in reference order beneath the trust row, and settle
  the vertical rhythm between sections so the page reads as one document rather
  than three transplanted blocks. *Done when:* `/` renders hero, trust row,
  bento, results band and how-it-works in order with consistent section spacing;
  every section uses the shared `CONTAINER` or `BLEED` from 3b rather than its
  own gutter; `pnpm check` and `pnpm build` pass; and the page reports
  `scrollWidth == clientWidth` at the narrowest width the tooling can reach.

## Files / areas

**Created**

- `src/lib/features/marketing/BentoGrid.svelte`, `BentoCard.svelte`
- `src/lib/features/marketing/ResultsBand.svelte`
- `src/lib/features/marketing/HowItWorks.svelte`
- `src/lib/assets/panels/` - seven images cropped from the design reference

**Changed**

- `src/lib/features/marketing/content.ts` - fixtures for the three sections
- `src/routes/(marketing)/+page.svelte` - section composition
- `src/routes/layout.css` - the three category surface tokens
- `blueprint/reference/design-system.md` - section 1b rows for the new tokens

No changes anticipated to `src/lib/components/ui/`. If a step appears to need a
primitive change, stop and flag it rather than improvising one.

## Data / contracts

No service interface. Static marketing content consumed directly from typed
fixtures, per the build plan.

**Load-bearing, defined here and used later:**

| Contract | Shape | Consumed by |
| --- | --- | --- |
| Category surface tokens | `--surface-care`, `--surface-delivery`, light theme only | 4b, 5 and 6 for any further tinted panel |
| `BentoCard` fixture record | `{ category, eyebrow, title, body, ground, image }` | Feature 5 if the team grid reuses the card anatomy |
| `HowItWorksStep` | `{ title, body, href? }`, numbering derived from list order | Nothing yet; keeps the count from drifting |
| `RATING` reuse | The results band reads the same fixture as the hero badge | Any later surface showing the rating |

## Testing

No unit test runner and no `test` command are declared in `AGENTS.md`, and no
`Browser tests` command exists, so **there is no test gate on this feature** and
none is claimed. Do not install a runner here; the build plan puts that decision
before feature 9. Verification is browser evidence plus `pnpm check` and
`pnpm build`.

This feature is entirely presentational, which `coding-standards.md` puts out of
unit-test scope. It introduces no logic worth a unit test; if a step surfaces
any, add a focused test then or say why not.

**Browser evidence.** The Chrome extension has been unavailable this session, but
headless Chrome from the CLI produced usable screenshots and pixel measurements
in 3b. Use the same route. Note honestly that it clamps to a 500px minimum
viewport, so the narrowest verifiable width is 500px, not 375px, and that it
cannot drive keyboard interaction.

**Contrast is measured, not eyeballed.** Steps 2, 4, 5 and 6 each place text on a
tinted ground. Sample the rendered pixels and compare against section 1b, and
extend that table for the new tokens rather than checking them ad hoc.

**Final gate:** `pnpm check` and `pnpm build` both clean, plus a walkthrough of
`/` at desktop and the narrowest reachable width.

## Notes for the AI

- **Tokens and stock scales only.** No `text-[17px]`, no `rounded-[34px]`, no
  canvas coordinates, no fixed section heights. The new category tokens are the
  sanctioned way to add the bento's colours; a raw hex in a component is not.
- **No new shadcn primitives, and no primitive edits.** Compose what Features 1
  and 3a adapted. Not every panel is a `Card`, per the design-system ruling.
- **Reference errors are not requirements.** Do not reproduce the Reviews.io
  attribution. (The "Juniper evens the playing field" line is in 4b's section,
  not this one, but the same rule applies: competitor names become Solean.)
- Reuse `CONTAINER` and `BLEED` from `container.ts`; do not invent a third gutter.
- Svelte 5 runes only. These sections are static, so they should need no state at
  all; reach for `$state` only if a step genuinely proves it necessary.
- Route components stay thin. No product logic in `+page.svelte`.
- No em dashes in any generated content, code comments or copy.
- Comment the *why*, not the *what*, matching the density already set by
  `src/lib/features/marketing/`.
- Inert links must be visibly and semantically inert, not `href="#"`.
